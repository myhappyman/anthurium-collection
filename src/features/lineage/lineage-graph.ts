export type LineageNodeInput = {
  id: string;
  displayName: string;
  scientificName: string | null;
  type: "species" | "selection" | "hybrid";
  parents: readonly string[];
  selectionOf?: string;
};

export type LineageEdge = {
  from: string;
  to: string;
  kind: "cross" | "selection";
};

export type PositionedLineageNode = LineageNodeInput & {
  x: number;
  y: number;
  width: number;
  depth: number;
};

export type LineageGraph = {
  nodes: readonly PositionedLineageNode[];
  edges: readonly LineageEdge[];
  nodeById: ReadonlyMap<string, PositionedLineageNode>;
  parentsById: ReadonlyMap<string, readonly string[]>;
  childrenById: ReadonlyMap<string, readonly string[]>;
  width: number;
  height: number;
};

const NODE_MIN_WIDTH = 150;
export const LINEAGE_NODE_HEIGHT = 62;
const HORIZONTAL_GAP = 34;
const VERTICAL_GAP = 150;

function getNodeWidth(node: LineageNodeInput) {
  const nameWidth = node.displayName.length * 14 + 44;
  const scientificWidth = (node.scientificName?.length ?? 0) * 6 + 34;
  return Math.max(NODE_MIN_WIDTH, nameWidth, scientificWidth);
}

function appendToMap(
  target: Map<string, string[]>,
  key: string,
  value: string,
) {
  const values = target.get(key);

  if (values) {
    values.push(value);
  } else {
    target.set(key, [value]);
  }
}

export function buildLineageGraph(
  inputs: readonly LineageNodeInput[],
): LineageGraph {
  const inputById = new Map(inputs.map((node) => [node.id, node] as const));
  const edges: LineageEdge[] = [];
  const parentsById = new Map<string, string[]>();
  const childrenById = new Map<string, string[]>();

  for (const node of inputs) {
    for (const parentId of node.parents) {
      if (!inputById.has(parentId)) {
        continue;
      }

      edges.push({ from: parentId, to: node.id, kind: "cross" });
      appendToMap(parentsById, node.id, parentId);
      appendToMap(childrenById, parentId, node.id);
    }

    if (node.selectionOf && inputById.has(node.selectionOf)) {
      edges.push({
        from: node.selectionOf,
        to: node.id,
        kind: "selection",
      });
      appendToMap(parentsById, node.id, node.selectionOf);
      appendToMap(childrenById, node.selectionOf, node.id);
    }
  }

  const depthById = new Map<string, number>();

  function getDepth(id: string, trail: ReadonlySet<string>): number {
    const cachedDepth = depthById.get(id);

    if (cachedDepth !== undefined) {
      return cachedDepth;
    }

    if (trail.has(id)) {
      return 0;
    }

    const nextTrail = new Set(trail);
    nextTrail.add(id);
    const parentDepths = (parentsById.get(id) ?? []).map(
      (parentId) => getDepth(parentId, nextTrail) + 1,
    );
    const depth = parentDepths.length > 0 ? Math.max(...parentDepths) : 0;
    depthById.set(id, depth);
    return depth;
  }

  for (const node of inputs) {
    getDepth(node.id, new Set());
  }

  const maximumDepth = Math.max(0, ...depthById.values());
  const layers = Array.from(
    { length: maximumDepth + 1 },
    () => [] as LineageNodeInput[],
  );

  for (const node of inputs) {
    const depth = depthById.get(node.id) ?? 0;
    layers[depth]?.push(node);
  }

  for (const layer of layers) {
    layer.sort((left, right) =>
      left.displayName.localeCompare(right.displayName, "ko"),
    );
  }

  const layerWidths = layers.map((layer) =>
    layer.reduce(
      (total, node, index) =>
        total + getNodeWidth(node) + (index > 0 ? HORIZONTAL_GAP : 0),
      0,
    ),
  );
  const graphWidth = Math.max(640, ...layerWidths);
  const positionedNodes: PositionedLineageNode[] = [];

  layers.forEach((layer, depth) => {
    let x = (graphWidth - (layerWidths[depth] ?? 0)) / 2;

    for (const node of layer) {
      const width = getNodeWidth(node);
      positionedNodes.push({
        ...node,
        x,
        y: depth * VERTICAL_GAP,
        width,
        depth,
      });
      x += width + HORIZONTAL_GAP;
    }
  });

  const nodeById = new Map(
    positionedNodes.map((node) => [node.id, node] as const),
  );

  return {
    nodes: positionedNodes,
    edges,
    nodeById,
    parentsById,
    childrenById,
    width: graphWidth,
    height: maximumDepth * VERTICAL_GAP + LINEAGE_NODE_HEIGHT,
  };
}

function collectConnected(
  startId: string,
  index: ReadonlyMap<string, readonly string[]>,
) {
  const result = new Set<string>();
  const queue = [...(index.get(startId) ?? [])];

  while (queue.length > 0) {
    const currentId = queue.shift();

    if (!currentId || result.has(currentId)) {
      continue;
    }

    result.add(currentId);
    queue.push(...(index.get(currentId) ?? []));
  }

  return result;
}

export function getLineageHighlight(graph: LineageGraph, selectedId: string) {
  return {
    ancestors: collectConnected(selectedId, graph.parentsById),
    descendants: collectConnected(selectedId, graph.childrenById),
  };
}
