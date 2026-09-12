# amazon-book-search

- Amazon.co.jpの書籍検索を支援するツール
- フォームに検索条件を入力すると、Amazonの検索URLを組み立てて表示する
- URLを組み立てて画面に表示するだけのツールで、Amazonへの自動アクセスやスクレイピングは行わない
- 紙の本とKindle本の両方に対応する

## 使い方

- フォームに条件を入力すると、画面上部のURL欄がリアルタイムに更新される
- URL欄のすぐ右となりのコピーアイコンでURLをクリップボードにコピーする。さらにその右の「検索する」ボタンで新規タブにAmazonの検索結果を開く
- 画面右下に固定表示される「すべて展開/すべて折りたたむ」ボタンで、下のアコーディオンを一括開閉する。その左隣の丸いボタンで画面の一番上まで戻る
- 対象(紙の本/Kindle本)は常に画面の一番上に表示される

## 仕様

Amazon.co.jpの検索は `https://www.amazon.co.jp/s?` にクエリパラメータを付けることで絞り込める

- `i` 検索対象の部門。紙の本は `stripbooks`、Kindle本は `digital-text`
- `k` 検索ボックスに表示される検索クエリ。完全一致チェックを入れるとダブルクオーテーションで囲んで送信する
- `hidden-keywords` 検索ボックスに表示されない補助的な検索クエリ。ASINを`|`区切りで指定するとまとめリンクになり、語の先頭に`-`を付けると除外語になる。2026年9月時点、Amazon側の不具合でこのパラメータ自体が機能しないという情報がある
- `rh` 絞り込み条件。`キー:値`をカンマ区切りで並べる。値を`|`で区切るとOR条件になる
- `bbn` 期間限定のセール・特集ページのnode id。`rh`とは独立したパラメータで、キャンペーン終了とともに無効になる
- `s` 検索結果の並び順。省略すると関連度順になる
- `tag` Amazonアソシエイトのid

`rh`で使うキーの仕様一覧

- `n` ジャンルのnode id。カスケード選択で確定した最も深いカテゴリ1件だけを渡す
- `p_lbr_publishers_browse-bin` 出版社名
- `p_27` 著者名
- `p_n_price_fma` 価格帯プリセットのnode id
- `p_36` 価格の詳細指定。下限と上限を銭単位でハイフン連結する
- `p_n_publication_date` 発売日。紙の本はこのキー、Kindle本は `p_n_date` を使う

生成されるURLの例(node idと出版社名はサンプル)。

```
https://www.amazon.co.jp/s?i=stripbooks&k=異世界&rh=n:2275256051,p_lbr_publishers_browse-bin:講談社,p_36:0-200000&tag=your-tag-22
```


`k`パラメータで機能する検索演算子はダブルクオーテーションによる完全一致のみ。マイナス除外・OR・NOT・intitle:はいずれも機能しないため実装していない

## 開発環境

```sh
npm install
npm run dev
npm test
npm run build
npm run preview
```

`data/*.json` は `src/App.jsx` から直接importしてビルド時にバンドルする  
実行時に外部データのfetch等は行わない

## Amazon Creators APIによるnode・ジャンルの取得

ジャンル名やセール情報をAmazon Creators APIを使って取得・更新できる

```sh
cp .env.example env
```

```
# 指定したnode idの名前と直下の子カテゴリを表示する
- `npm run fetch-node -- <nodeId>` 

# node id配下を再帰的にクロールする
- `node scripts/crawl-nodes.cjs <rootNodeId> > out.json`

# クロール結果をツリー構造に組み立てて `data/nodes.json` を生成する
- `node scripts/build-nodes-tree.cjs out.json` 

# "出版社名"` でCreators APIの検索結果から出版社名の表記を検証する
- `node scripts/verify-publishers.cjs 

# セール・特集nodeの一覧を再取得する
- `node scripts/refresh-sale-nodes.cjs <セールハブのnode id> <対象ファイル名>` 
```


## デプロイ

- Settings → Pages → Source は「Deploy from a branch」(`gh-pages` / root)にしている
- `.github/workflows/deploy.yml`により、mainブランチへのpushで`dist/`以下を`gh-pages`ブランチへ自動デプロイする(`JamesIves/github-pages-deploy-action`)
- `.github/workflows/pr-preview.yml`により、PRを作成・更新するとテスト・ビルドが自動で実行され(PR時のCIを兼ねる)、`gh-pages`ブランチの`pr-preview/<PR番号>/`にプレビューが公開される。プレビューURLはPRに自動でコメントされ、PRを閉じると自動で削除される(`rossjrw/pr-preview-action`)
- フォークからのPRは権限の都合上プレビューを作成できない(同一リポジトリ内のブランチからのPRのみ対応)


## 既知の制限

- セール・特集のnode idはキャンペーン終了とともに無効になるため、定期的な更新を行う必要がある
  - `scripts/refresh-sale-nodes.cjs` で再取得できる
- hidden-keywordsは2026年9月時点でAmazon側の不具合により機能しない可能性がある


## ディレクトリ構成

```
index.html            Viteのエントリポイント
vite.config.js         Viteの設定
src/
  main.jsx              Reactのマウント処理
  App.jsx                画面全体の状態管理とレイアウト
  index.css              全体のスタイル
  lib/
    buildSearchUrl.js      フォームの状態からAmazon検索URLを組み立てる純粋関数
    nodeTree.js             ジャンルのツリー(data/nodes.json)を辿る純粋関数
  components/
    AccordionSection.jsx    アコーディオン1セクション分。開閉状態はApp.jsxが持つ
    Field.jsx               アコーディオン内の1項目分の見出しと本文
    FormatField.jsx          紙の本/Kindle本の切り替え
    Icon.jsx / IconButton.jsx インラインSVGアイコンとicon button
    ActionRow.jsx            入力欄とすぐ右となりのアクションボタンを横並びにするレイアウト
    BoxedTextField.jsx       テキストフィールドの入力欄本体
    ClearableTextField.jsx  テキスト入力とクリアボタン
    DatalistField.jsx       テキスト入力とdatalistとクリアボタン
    CheckboxGroup.jsx       複数選択のチェックボックス群
    RadioGroup.jsx          単一選択のラジオボタン群
    PriceRangeSlider.jsx    汎用デュアルレンジスライダー
    PriceDetailField.jsx    価格の詳細指定
    DateRangeField.jsx      発売日の詳細指定
    CategorySelector.jsx    ジャンルのカスケード選択
    NoticeBanner.jsx        未検証データの警告表示。現在App.jsxからは未使用
    ResultPanel.jsx         URL出力欄。すぐ右となりにコピーボタン・検索するボタンを並べる
data/*.json             検索用データ。src/App.jsxから直接importする
scripts/                data/*.jsonをAmazon Creators API等で調査・更新するNode.jsスクリプト群
test/                   vitestによるテスト
```

## 免責事項

- 本ツールは検索用URLをブラウザ上で組み立てるだけであり、Amazon.co.jpへの自動アクセスやスクレイピングは行わない
- Amazon、Amazon.co.jpは Amazon.com, Inc. またはその関連会社の商標です
