import assert from "node:assert/strict";
import path from "node:path";
import { describe, it } from "node:test";

import { resolvePrivateMediaPath } from "./private-media-path.ts";

const base = path.resolve("/srv/app/private/collection");

describe("resolvePrivateMediaPath", () => {
  it("정상 경로는 디렉터리 안의 절대 경로로 바꾼다", () => {
    const resolved = resolvePrivateMediaPath(["bvep", "tracking", "01.jpg"], base);

    assert.equal(resolved, path.join(base, "bvep", "tracking", "01.jpg"));
  });

  it("상위 디렉터리 탈출을 막는다", () => {
    assert.equal(resolvePrivateMediaPath(["..", "collection-private.json"], base), null);
    assert.equal(resolvePrivateMediaPath(["bvep", "..", "..", "x.jpg"], base), null);
    assert.equal(resolvePrivateMediaPath(["bvep/../..", "x.jpg"], base), null);
  });

  it("jpg 가 아니거나 빈 경로는 거부한다", () => {
    assert.equal(resolvePrivateMediaPath([], base), null);
    assert.equal(resolvePrivateMediaPath(["bvep", "tracking", "01.png"], base), null);
    assert.equal(resolvePrivateMediaPath(["collection-private.json"], base), null);
  });
});
