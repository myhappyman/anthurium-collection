import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { serializeCsv } from "./csv.ts";

describe("serializeCsv", () => {
  it("쉼표와 큰따옴표를 이스케이프한다", () => {
    const csv = serializeCsv([{ code: "A,1", notes: '잎 "성장"' }]);

    assert.match(csv, /"A,1"/);
    assert.match(csv, /"잎 ""성장"""/);
  });

  it("스프레드시트 수식 주입을 막는다", () => {
    const csv = serializeCsv([{ notes: "=HYPERLINK(\"bad\")" }]);

    assert.match(csv, /"'=HYPERLINK/);
  });
});
