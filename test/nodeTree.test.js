import { test } from 'vitest';
import assert from 'node:assert/strict';
import { findNodeById, findPathToId } from '../src/lib/nodeTree.js';

const tree = [
  {
    id: 'a',
    label: 'A',
    children: [
      { id: 'a1', label: 'A1', children: [] },
      {
        id: 'a2',
        label: 'A2',
        children: [{ id: 'a2x', label: 'A2X', children: [] }],
      },
    ],
  },
  { id: 'b', label: 'B', children: [] },
];

test('findNodeById: トップレベルのidを見つけられる', () => {
  assert.equal(findNodeById(tree, 'b').label, 'B');
});

test('findPathToId: 深い階層のidまでの経路を返す', () => {
  assert.deepEqual(findPathToId(tree, 'a2x'), ['a', 'a2', 'a2x']);
});

test('findPathToId: トップレベルで見つかれば単一要素', () => {
  assert.deepEqual(findPathToId(tree, 'b'), ['b']);
});

test('findPathToId: 存在しないidはnull', () => {
  assert.equal(findPathToId(tree, 'zzz'), null);
});

test('findPathToId: idがnull/undefinedならnull', () => {
  assert.equal(findPathToId(tree, null), null);
});
