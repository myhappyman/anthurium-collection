"use client";

import {
  type PointerEvent as ReactPointerEvent,
  type WheelEvent,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  buildLineageGraph,
  getLineageHighlight,
  LINEAGE_NODE_HEIGHT,
  type LineageNodeInput,
} from "../lineage-graph";

type Camera = {
  x: number;
  y: number;
  scale: number;
};

type Point = {
  x: number;
  y: number;
};

type LineageCanvasProps = {
  nodes: readonly LineageNodeInput[];
};

const MIN_SCALE = 0.15;
const MAX_SCALE = 2.5;

function clampScale(scale: number) {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
}

function getDistance(left: Point, right: Point) {
  return Math.hypot(right.x - left.x, right.y - left.y);
}

function getMidpoint(left: Point, right: Point): Point {
  return {
    x: (left.x + right.x) / 2,
    y: (left.y + right.y) / 2,
  };
}

export function LineageCanvas({ nodes }: LineageCanvasProps) {
  const graph = useMemo(() => buildLineageGraph(nodes), [nodes]);
  const svgRef = useRef<SVGSVGElement>(null);
  const pointers = useRef(new Map<number, Point>());
  const previousPinch = useRef<{ distance: number; midpoint: Point } | null>(
    null,
  );
  const [camera, setCamera] = useState<Camera>({ x: 80, y: 80, scale: 0.7 });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const highlight = useMemo(
    () => (selectedId ? getLineageHighlight(graph, selectedId) : null),
    [graph, selectedId],
  );

  const fitGraph = useCallback(() => {
    const svg = svgRef.current;

    if (!svg) {
      return;
    }

    const { width, height } = svg.getBoundingClientRect();
    const padding = 70;
    const scale = clampScale(
      Math.min(
        (width - padding * 2) / graph.width,
        (height - padding * 2) / graph.height,
      ),
    );

    setCamera({
      x: (width - graph.width * scale) / 2,
      y: (height - graph.height * scale) / 2,
      scale,
    });
  }, [graph.height, graph.width]);

  function handleWheel(event: WheelEvent<SVGSVGElement>) {
    event.preventDefault();
    const bounds = event.currentTarget.getBoundingClientRect();
    const pointerX = event.clientX - bounds.left;
    const pointerY = event.clientY - bounds.top;
    const factor = Math.exp(-event.deltaY * 0.0015);

    setCamera((current) => {
      const scale = clampScale(current.scale * factor);
      const ratio = scale / current.scale;
      return {
        x: pointerX - (pointerX - current.x) * ratio,
        y: pointerY - (pointerY - current.y) * ratio,
        scale,
      };
    });
  }

  function handlePointerDown(event: ReactPointerEvent<SVGSVGElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    pointers.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });

    if (pointers.current.size === 2) {
      const [left, right] = [...pointers.current.values()];

      if (left && right) {
        previousPinch.current = {
          distance: getDistance(left, right),
          midpoint: getMidpoint(left, right),
        };
      }
    }
  }

  function handlePointerMove(event: ReactPointerEvent<SVGSVGElement>) {
    const previous = pointers.current.get(event.pointerId);

    if (!previous) {
      return;
    }

    const next = { x: event.clientX, y: event.clientY };
    pointers.current.set(event.pointerId, next);

    if (pointers.current.size === 1) {
      setCamera((current) => ({
        ...current,
        x: current.x + next.x - previous.x,
        y: current.y + next.y - previous.y,
      }));
      return;
    }

    const [left, right] = [...pointers.current.values()];
    const previousGesture = previousPinch.current;

    if (!left || !right || !previousGesture) {
      return;
    }

    const distance = getDistance(left, right);
    const midpoint = getMidpoint(left, right);
    const factor =
      previousGesture.distance > 0 ? distance / previousGesture.distance : 1;

    setCamera((current) => {
      const scale = clampScale(current.scale * factor);
      const ratio = scale / current.scale;
      return {
        x:
          midpoint.x -
          (previousGesture.midpoint.x - current.x) * ratio,
        y:
          midpoint.y -
          (previousGesture.midpoint.y - current.y) * ratio,
        scale,
      };
    });
    previousPinch.current = { distance, midpoint };
  }

  function handlePointerEnd(event: ReactPointerEvent<SVGSVGElement>) {
    pointers.current.delete(event.pointerId);
    previousPinch.current = null;
  }

  function handleSearchSubmit() {
    const normalizedQuery = query.trim().toLocaleLowerCase("ko");
    const matchedNode = graph.nodes.find((node) =>
      [node.displayName, node.scientificName ?? "", node.id]
        .join(" ")
        .toLocaleLowerCase("ko")
        .includes(normalizedQuery),
    );

    if (!matchedNode || !svgRef.current) {
      return;
    }

    const bounds = svgRef.current.getBoundingClientRect();
    setSelectedId(matchedNode.id);
    setCamera((current) => ({
      ...current,
      x:
        bounds.width / 2 -
        (matchedNode.x + matchedNode.width / 2) * current.scale,
      y:
        bounds.height / 2 -
        (matchedNode.y + LINEAGE_NODE_HEIGHT / 2) * current.scale,
    }));
  }

  return (
    <div className="lineage-workspace">
      <div className="lineage-toolbar">
        <label>
          <span className="sr-only">계보 검색</span>
          <input
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                handleSearchSubmit();
              }
            }}
            placeholder="이름·학명 검색"
            type="search"
            value={query}
          />
        </label>
        <button onClick={handleSearchSubmit} type="button">
          이동
        </button>
        <button onClick={fitGraph} type="button">
          전체 보기
        </button>
        <button
          onClick={() =>
            setCamera((current) => ({
              ...current,
              scale: clampScale(current.scale * 1.2),
            }))
          }
          type="button"
        >
          ＋
        </button>
        <button
          onClick={() =>
            setCamera((current) => ({
              ...current,
              scale: clampScale(current.scale / 1.2),
            }))
          }
          type="button"
        >
          −
        </button>
      </div>
      <svg
        aria-label="안스리움 계보 캔버스"
        className="lineage-canvas"
        onClick={() => setSelectedId(null)}
        onPointerCancel={handlePointerEnd}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onWheel={handleWheel}
        ref={svgRef}
        role="application"
      >
        <defs>
          <pattern
            height="24"
            id="lineage-dots"
            patternUnits="userSpaceOnUse"
            width="24"
          >
            <circle cx="2" cy="2" fill="#aab7aa" r="1.2" />
          </pattern>
        </defs>
        <rect fill="url(#lineage-dots)" height="100%" width="100%" />
        <g
          transform={`translate(${camera.x} ${camera.y}) scale(${camera.scale})`}
        >
          {graph.edges.map((edge) => {
            const parent = graph.nodeById.get(edge.from);
            const child = graph.nodeById.get(edge.to);

            if (!parent || !child) {
              return null;
            }

            const isRelated =
              !highlight ||
              edge.from === selectedId ||
              edge.to === selectedId ||
              (highlight.ancestors.has(edge.from) &&
                highlight.ancestors.has(edge.to)) ||
              (highlight.descendants.has(edge.from) &&
                highlight.descendants.has(edge.to));
            const startX = parent.x + parent.width / 2;
            const startY = parent.y + LINEAGE_NODE_HEIGHT;
            const endX = child.x + child.width / 2;
            const endY = child.y;
            const curve = Math.max(35, (endY - startY) / 2);

            return (
              <path
                className={`lineage-edge ${edge.kind} ${isRelated ? "" : "muted"}`}
                d={`M ${startX} ${startY} C ${startX} ${startY + curve}, ${endX} ${endY - curve}, ${endX} ${endY}`}
                key={`${edge.kind}-${edge.from}-${edge.to}`}
              />
            );
          })}
          {graph.nodes.map((node) => {
            const isSelected = selectedId === node.id;
            const isRelated =
              !highlight ||
              isSelected ||
              highlight.ancestors.has(node.id) ||
              highlight.descendants.has(node.id);

            return (
              <g
                className={`lineage-node ${node.type} ${isSelected ? "selected" : ""} ${isRelated ? "" : "muted"}`}
                key={node.id}
                onClick={(event) => {
                  event.stopPropagation();
                  setSelectedId(node.id);
                }}
                role="button"
                tabIndex={0}
                transform={`translate(${node.x} ${node.y})`}
              >
                <rect
                  height={LINEAGE_NODE_HEIGHT}
                  rx="13"
                  width={node.width}
                />
                <text className="node-name" x="16" y="25">
                  {node.displayName}
                </text>
                <text className="node-scientific" x="16" y="45">
                  {node.scientificName?.replace(/^Anthurium\s+/, "A. ") ??
                    node.type}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
      <p className="canvas-help">
        드래그 이동 · 휠/핀치 확대 · 노드 선택 시 조상과 자손 강조
      </p>
    </div>
  );
}
