import path from "node:path";

/**
 * URL 경로 조각을 비공개 미디어 디렉터리 안의 절대 경로로 바꾼다.
 * 디렉터리 밖을 가리키거나 jpg 가 아니면 null 을 돌려준다.
 */
export function resolvePrivateMediaPath(
  segments: readonly string[],
  baseDir: string,
): string | null {
  if (segments.length === 0) {
    return null;
  }

  const unsafe = segments.some(
    (segment) =>
      segment === "" ||
      segment === "." ||
      segment === ".." ||
      segment.includes("/") ||
      segment.includes("\\") ||
      segment.includes("\0"),
  );

  if (unsafe) {
    return null;
  }

  const root = path.resolve(baseDir);
  const target = path.resolve(root, ...segments);

  if (!target.startsWith(root + path.sep)) {
    return null;
  }

  if (path.extname(target).toLowerCase() !== ".jpg") {
    return null;
  }

  return target;
}
