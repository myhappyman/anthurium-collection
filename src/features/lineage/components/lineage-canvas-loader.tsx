"use client";

import dynamic from "next/dynamic";

import type { LineageNodeInput } from "../lineage-graph";

const LineageCanvas = dynamic(
  () =>
    import("./lineage-canvas").then((module) => module.LineageCanvas),
  {
    loading: () => <p className="canvas-loading">계보를 구성하고 있습니다…</p>,
    ssr: false,
  },
);

type LineageCanvasLoaderProps = {
  nodes: readonly LineageNodeInput[];
  /** 다른 페이지 안에 놓인 캔버스: 처음에 전체를 맞추고, 휠은 Ctrl/⌘ 와 함께일 때만 확대 */
  embedded?: boolean;
};

export function LineageCanvasLoader({
  nodes,
  embedded = false,
}: LineageCanvasLoaderProps) {
  return <LineageCanvas embedded={embedded} nodes={nodes} />;
}
