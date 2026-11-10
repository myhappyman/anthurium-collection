import { readFile } from "node:fs/promises";

import { NextResponse } from "next/server";

import {
  isPrivateRecordsEnabled,
  PRIVATE_MEDIA_DIR,
} from "@/features/collection/private-records";
import { resolvePrivateMediaPath } from "@/lib/private-media-path";

type PrivateMediaContext = {
  params: Promise<{
    path: string[];
  }>;
};

/**
 * private/collection/ 아래 증빙 이미지를 SHOW_PRIVATE_RECORDS=true 일 때만 돌려준다.
 * 꺼진 환경에서는 파일 존재 여부와 무관하게 404 로 응답한다.
 */
export async function GET(_request: Request, context: PrivateMediaContext) {
  if (!isPrivateRecordsEnabled()) {
    return new NextResponse(null, { status: 404 });
  }

  const { path: segments } = await context.params;
  const target = resolvePrivateMediaPath(segments, PRIVATE_MEDIA_DIR);

  if (!target) {
    return new NextResponse(null, { status: 404 });
  }

  try {
    const file = await readFile(target);

    return new NextResponse(new Uint8Array(file), {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
