import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createQrMatrix } from "./qr-code.ts";

describe("createQrMatrix", () => {
  it("짧은 주소를 버전 2 이하의 정사각형 매트릭스로 만든다", () => {
    const matrix = createQrMatrix("https://plant.test/p/1");

    assert.ok(matrix.length === 21 || matrix.length === 25);
    assert.ok(matrix.every((row) => row.length === matrix.length));
  });

  it("동일한 주소는 항상 동일한 QR을 만든다", () => {
    const first = createQrMatrix("https://plant.test/specimens/PLT-2026-001");
    const second = createQrMatrix("https://plant.test/specimens/PLT-2026-001");

    assert.deepEqual(first, second);
  });

  it("지원 용량을 넘으면 명시적으로 실패한다", () => {
    assert.throws(() => createQrMatrix("가".repeat(100)), /108바이트/);
  });
});
