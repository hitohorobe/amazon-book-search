# amazon-book-search

Amazon.co.jpの書籍検索を支援するツール。フォームに検索条件を入力すると、Amazonの検索URLを組み立てて表示する。URLを組み立てて画面に表示するだけのツールで、Amazonへの自動アクセスやスクレイピングは行わない。紙の本とKindle本の両方に対応する。

## 使い方

- `npm install` して `npm run dev` を実行し、表示されたURLを開く
- フォームに条件を入力すると、画面上部のURL欄がリアルタイムに更新される
- 検索するボタンで新規タブにAmazonの検索結果を開く
- コピーアイコンでURLをクリップボードにコピーする
- すべて展開/すべて折りたたむボタンで、下のアコーディオンを一括開閉する
- 対象(紙の本/Kindle本)は常に画面の一番上に表示される。他の条件は検索クエリ・絞り込み・価格・発売日・ポイントセール・並び順・アソシエイトIDのアコーディオンにまとまっている

## 仕様

Amazon.co.jpの検索は `https://www.amazon.co.jp/s?` にクエリパラメータを付けることで絞り込める。このツールが組み立てるパラメータは次の通り。

- `i` 検索対象の部門。紙の本は `stripbooks`、Kindle本は `digital-text`
- `k` 検索ボックスに表示される検索クエリ。完全一致チェックを入れるとダブルクオーテーションで囲んで送信する
- `hidden-keywords` 検索ボックスに表示されない補助的な検索クエリ。ASINを`|`区切りで指定するとまとめリンクになり、語の先頭に`-`を付けると除外語になる。2026年9月時点、Amazon側の不具合でこのパラメータ自体が機能しないという情報がある
- `rh` 絞り込み条件。`キー:値`をカンマ区切りで並べる。値を`|`で区切るとOR条件になる
- `bbn` 期間限定のセール・特集ページのnode id。`rh`とは独立したパラメータで、キャンペーン終了とともに無効になる
- `s` 検索結果の並び順。省略すると関連度順になる
- `tag` Amazonアソシエイトのid

`rh`で使うキーは次の通り。

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

紙の本とKindle本は、ジャンルのnode id・価格帯・発売日・ポイント還元率が別体系になっている。対象を切り替えるとデータセットごと差し替わる。

`k`パラメータで機能する検索演算子はダブルクオーテーションによる完全一致のみである。マイナス除外・OR・NOT・intitle:はいずれも機能しないため実装していない。

## 開発環境

```sh
npm install
npm run dev
npm test
npm run build
npm run preview
```

`data/*.json` は `src/App.jsx` から直接importしてビルド時にバンドルする。実行時にfetchする外部データではない。

## Amazon Creators APIによるnode・ジャンルの取得

ジャンルの分類や価格帯などのnode idはAmazon側で公式に一覧が公開されていない。このツールはAmazon Creators API(旧PA-API 5.0の後継)を使ってカテゴリnode idの一覧・親子関係を取得している。Amazon検索結果ページへの自動アクセスはbot対策でブロックされるため実装していない。

- [Amazonアソシエイト・プログラム](https://affiliate-program.amazon.com/creatorsapi) でCreators APIの認証情報を発行する
- `.env.example` を `.env` にコピーし、認証情報を設定する。`.env` はgit管理対象外
- `npm run fetch-node -- <nodeId>` で指定したnode idの名前と直下の子カテゴリを表示する
- `node scripts/crawl-nodes.cjs <rootNodeId> > out.json` でnode id配下を再帰的にクロールする
- `node scripts/build-nodes-tree.cjs out.json` でクロール結果をツリー構造に組み立てて `data/nodes.json` を生成する
- `node scripts/verify-publishers.cjs "出版社名"` でCreators APIの検索結果から出版社名の表記を検証する
- `node scripts/refresh-sale-nodes.cjs <セールハブのnode id> <対象ファイル名>` でセール・特集nodeの一覧を再取得する

価格帯・発売日・ポイント還元率・セールnode idなどはCreators APIでは取得できないUI専用の絞り込み値のため、Google検索でインデックスされたAmazonの実URLから間接的に確認している。確認できた値は各データファイルの `verified` フラグを `true` にしている。

## デプロイ

mainブランチへのpushで `.github/workflows/deploy.yml` が `npm ci` → `npm test` → `npm run build` を実行し、`dist/` をGitHub Pagesへ自動デプロイする。

## 既知の制限

- ジャンルのnode idは実在するが、実際の検索結果への絞り込み効果はブラウザでの実地確認をしていないものが多い
- 価格帯・発売日・ポイント還元率・セールnode idは、直接確認したものと他カテゴリー経由の間接確認にとどまるものが混在する
- セール・特集のnode idはキャンペーン終了とともに無効になるため、定期的な更新が前提の機能である。`scripts/refresh-sale-nodes.cjs` で再取得できる
- hidden-keywordsは2026年9月時点でAmazon側の不具合により機能しない可能性がある
- 未検証の値のまま使うと、生成されたURLは開けても意図した絞り込み結果にはならない。実際の値への置き換えは上記のAmazon Creators APIの手順、またはブラウザでの実地確認で行う

## 免責事項

本ツールは検索用URLをブラウザ上で組み立てるだけであり、Amazon.co.jpへの自動アクセスやスクレイピングは行わない。Amazon、Amazon.co.jpは Amazon.com, Inc. またはその関連会社の商標である。アソシエイトIDを入力して生成したリンクの利用は、利用者自身の責任で行うこと。

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
    ResultPanel.jsx         検索ボタン・URL出力・コピー・アコーディオン一括開閉ボタン
data/*.json             検索用データ。src/App.jsxから直接importする
scripts/                data/*.jsonをAmazon Creators API等で調査・更新するNode.jsスクリプト群
test/                   vitestによるテスト
```
