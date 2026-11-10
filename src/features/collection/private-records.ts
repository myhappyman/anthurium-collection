import { readFileSync, statSync } from "node:fs";
import path from "node:path";

import {
  privateCollectionSchema,
  trackingManifestSchema,
  type PrivateSpecimenRecord,
} from "./collection.types";

export const PRIVATE_DIR = path.join(process.cwd(), "private");
export const PRIVATE_MEDIA_DIR = path.join(PRIVATE_DIR, "collection");

/** 서버 환경 변수로만 켜진다. 브라우저 번들에는 절대 포함되지 않는다. */
export function isPrivateRecordsEnabled(): boolean {
  return process.env.SHOW_PRIVATE_RECORDS === "true";
}

const RECORDS_FILE = "collection-private.json";
const TRACKING_FILE = "collection-tracking.json";

let cache: { key: string; records: Map<string, PrivateSpecimenRecord> } | null =
  null;

/**
 * 두 JSON 의 수정 시각을 캐시 키로 쓴다. 파일을 고치거나 이미지 빌드 스크립트를
 * 다시 돌리면 서버를 재시작하지 않아도 다음 요청부터 새 내용이 반영된다.
 * 파일이 없으면 0 으로 두어, 나중에 생겼을 때도 키가 바뀌며 다시 읽는다.
 */
function fileVersion(fileName: string): number {
  try {
    return statSync(path.join(PRIVATE_DIR, fileName)).mtimeMs;
  } catch {
    return 0;
  }
}

function readJson(fileName: string): unknown | null {
  try {
    return JSON.parse(readFileSync(path.join(PRIVATE_DIR, fileName), "utf8"));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      console.warn(`[private-records] ${fileName} 이 없어 비공개 기록을 비웁니다.`);
      return null;
    }
    throw error;
  }
}

function loadPrivateRecords(): Map<string, PrivateSpecimenRecord> {
  const key = `${fileVersion(RECORDS_FILE)}:${fileVersion(TRACKING_FILE)}`;
  if (cache?.key === key) {
    return cache.records;
  }

  const recordsJson = readJson(RECORDS_FILE);
  const trackingJson = readJson(TRACKING_FILE);
  const records = recordsJson
    ? privateCollectionSchema.parse(recordsJson).records
    : {};
  const tracking = trackingJson ? trackingManifestSchema.parse(trackingJson) : {};

  const merged = new Map<string, PrivateSpecimenRecord>();
  for (const id of new Set([...Object.keys(records), ...Object.keys(tracking)])) {
    merged.set(id, {
      acquisition: records[id]?.acquisition ?? null,
      tracking: tracking[id] ?? [],
    });
  }

  cache = { key, records: merged };
  return merged;
}

export function getPrivateRecord(id: string): PrivateSpecimenRecord | null {
  if (!isPrivateRecordsEnabled()) {
    return null;
  }

  return loadPrivateRecords().get(id) ?? null;
}

export function getTrackingCounts(): Map<string, number> {
  if (!isPrivateRecordsEnabled()) {
    return new Map();
  }

  return new Map(
    [...loadPrivateRecords()].map(([id, record]) => [id, record.tracking.length]),
  );
}
