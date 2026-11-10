import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildLineageGraph,
  getLineageHighlight,
  type LineageNodeInput,
} from "./lineage-graph.ts";

const TEST_NODES: LineageNodeInput[] = [
  {
    id: "parent-a",
    displayName: "부모 A",
    scientificName: null,
    type: "selection",
    parents: [],
  },
  {
    id: "parent-b",
    displayName: "부모 B",
    scientificName: null,
    type: "selection",
    parents: [],
  },
  {
    id: "child",
    displayName: "자손",
    scientificName: null,
    type: "hybrid",
    parents: ["parent-a", "parent-b"],
  },
  {
    id: "selected",
    displayName: "선별 개체",
    scientificName: null,
    type: "selection",
    parents: [],
    selectionOf: "child",
  },
];

describe("buildLineageGraph", () => {
  it("교배와 선별 간선을 구분한다", () => {
    const graph = buildLineageGraph(TEST_NODES);

    assert.deepEqual(graph.edges, [
      { from: "parent-a", to: "child", kind: "cross" },
      { from: "parent-b", to: "child", kind: "cross" },
      { from: "child", to: "selected", kind: "selection" },
    ]);
  });

  it("부모보다 자손을 아래 세대에 배치한다", () => {
    const graph = buildLineageGraph(TEST_NODES);
    const parent = graph.nodeById.get("parent-a");
    const child = graph.nodeById.get("child");
    const selected = graph.nodeById.get("selected");

    assert.equal(parent?.depth, 0);
    assert.equal(child?.depth, 1);
    assert.equal(selected?.depth, 2);
  });

  it("선택 노드의 조상과 자손을 모두 찾는다", () => {
    const graph = buildLineageGraph(TEST_NODES);
    const highlight = getLineageHighlight(graph, "child");

    assert.deepEqual(highlight.ancestors, new Set(["parent-a", "parent-b"]));
    assert.deepEqual(highlight.descendants, new Set(["selected"]));
  });
});
