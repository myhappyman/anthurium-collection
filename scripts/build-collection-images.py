#!/usr/bin/env python3
"""docs/ref 의 개체별 사진을 웹용으로 축소한다.

- 보유 사진   → public/collection/<slug>/NN.jpg   + data/collection-images.json
- 출처 증빙   → private/collection/<slug>/tracking/NN.jpg + private/collection-tracking.json
  (public/ 밖에 두므로 SHOW_PRIVATE_RECORDS=true 인 서버에서만 /private-media/ 로 서빙된다)

사용법: python3 scripts/build-collection-images.py
- 원본(docs/ref)은 건드리지 않는다.
- 폴더 이름 → slug 매핑은 data/collection.json 의 각 항목 `sourceDir` 를 따른다.
"""
from __future__ import annotations

import hashlib
import json
import re
import shutil
import sys
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
REF_DIR = ROOT / "docs" / "ref"
OUT_DIR = ROOT / "public" / "collection"
PRIVATE_OUT_DIR = ROOT / "private" / "collection"
COLLECTION_JSON = ROOT / "data" / "collection.json"
MANIFEST_JSON = ROOT / "data" / "collection-images.json"
TRACKING_MANIFEST_JSON = ROOT / "private" / "collection-tracking.json"

PHOTO_MAX = 1600
TRACKING_MAX = 1200
JPEG_QUALITY = 82
IMAGE_SUFFIXES = {".jpg", ".jpeg", ".png", ".heic"}


def natural_key(path: Path) -> list[object]:
    return [int(t) if t.isdigit() else t.lower() for t in re.split(r"(\d+)", path.name)]


def list_images(directory: Path) -> list[Path]:
    if not directory.is_dir():
        return []
    return sorted(
        (p for p in directory.iterdir() if p.is_file() and p.suffix.lower() in IMAGE_SUFFIXES),
        key=natural_key,
    )


def content_hash(path: Path) -> str:
    """원본 내용 해시. 사진이 추가돼 순번이 밀려도 URL 이 다른 사진과 겹치지 않게 한다."""
    return hashlib.md5(path.read_bytes()).hexdigest()[:8]


def output_name(index: int, src: Path) -> str:
    return f"{index:02d}-{content_hash(src)}.jpg"


def convert(src: Path, dest: Path, max_side: int, public_src: str) -> dict[str, object]:
    with Image.open(src) as image:
        image = ImageOps.exif_transpose(image)  # EXIF 회전을 픽셀에 반영
        image = image.convert("RGB")
        image.thumbnail((max_side, max_side), Image.Resampling.LANCZOS)
        dest.parent.mkdir(parents=True, exist_ok=True)
        image.save(dest, "JPEG", quality=JPEG_QUALITY, optimize=True, progressive=True)
        return {
            "src": public_src,
            "width": image.width,
            "height": image.height,
            "original": src.relative_to(ROOT).as_posix(),
        }


def main() -> int:
    entries = json.loads(COLLECTION_JSON.read_text(encoding="utf-8"))["specimens"]
    manifest: dict[str, dict[str, list[dict[str, object]]]] = {}
    tracking_manifest: dict[str, list[dict[str, object]]] = {}
    missing: list[str] = []

    for entry in entries:
        slug = entry["id"]
        source_dir = REF_DIR / entry["sourceDir"]
        if not source_dir.is_dir():
            missing.append(entry["sourceDir"])
            continue

        # 이전 산출물을 지우고 다시 만든다 (순번이 밀린 옛 파일이 남지 않도록)
        shutil.rmtree(OUT_DIR / slug, ignore_errors=True)
        shutil.rmtree(PRIVATE_OUT_DIR / slug, ignore_errors=True)

        photos = []
        for index, src in enumerate(list_images(source_dir), start=1):
            name = output_name(index, src)
            dest = OUT_DIR / slug / name
            photos.append(convert(src, dest, PHOTO_MAX, f"/collection/{slug}/{name}"))

        tracking = []
        for index, src in enumerate(list_images(source_dir / "tracking"), start=1):
            name = output_name(index, src)
            dest = PRIVATE_OUT_DIR / slug / "tracking" / name
            tracking.append(
                convert(src, dest, TRACKING_MAX, f"/private-media/{slug}/tracking/{name}")
            )

        manifest[slug] = {"photos": photos}
        if tracking:
            tracking_manifest[slug] = tracking
        print(f"{slug}: 사진 {len(photos)}장, 증빙 {len(tracking)}장")

    MANIFEST_JSON.write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    TRACKING_MANIFEST_JSON.parent.mkdir(parents=True, exist_ok=True)
    TRACKING_MANIFEST_JSON.write_text(
        json.dumps(tracking_manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(f"→ {MANIFEST_JSON.relative_to(ROOT)}, {TRACKING_MANIFEST_JSON.relative_to(ROOT)}")

    if missing:
        print("경고: docs/ref 에 없는 폴더:", ", ".join(missing), file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
