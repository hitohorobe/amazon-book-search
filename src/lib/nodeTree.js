// カテゴリーのツリー(data/nodes.jsonのtree)を辿るための純粋関数。

export function findNodeById(list, id) {
  return (list || []).find((n) => n.id === id);
}

// tree内でidを持つノードまでの経路(祖先を含むid配列、そのノード自身のidを最後に含む)を返す。
// 見つからなければnull。
export function findPathToId(tree, id) {
  if (!id) return null;
  for (const node of tree || []) {
    if (node.id === id) return [node.id];
    const childPath = findPathToId(node.children, id);
    if (childPath) return [node.id, ...childPath];
  }
  return null;
}
