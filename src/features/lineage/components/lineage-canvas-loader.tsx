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
};

export function LineageCanvasLoader({ nodes }: LineageCanvasLoaderProps) {
  return <LineageCanvas nodes={nodes} />;
}
