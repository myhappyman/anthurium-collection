"use strict";

// ── 데이터 인덱스 ──────────────────────────────────────────
let TAXA = [];
const byId = new Map();
const parentsOf = new Map();   // id -> [{id, kind}]  위 방향(교배 부모 + 선별 원종)
const childrenOf = new Map();  // id -> [{id, kind}]  아래 방향(교배 자손 + 선별 클론)
let edges = [];                // {from, to, kind: "cross" | "selection"}

const TYPE_LABELS = { species: "원종", selection: "선별종", hybrid: "하이브리드" };

// ── 레이아웃 상수 (월드 좌표) ──────────────────────────────
const NODE_H = 54, LAYER_GAP = 175, X_GAP = 34;

// ── 카메라 ────────────────────────────────────────────────
// 모든 화면 이동/확대는 이 상태 하나로 표현된다. 노드 좌표는 불변.
const cam = { x: 0, y: 0, k: 1 };
const K_MIN = 0.12, K_MAX = 4;
const content = { w: 0, h: 0 };   // 월드 콘텐츠 bbox (fit 계산용)
const pos = new Map();            // id -> {x, y, w}

let svg, world, dotsPattern, panel, panelBody;
let selectedId = null;

// ── 초기화 ────────────────────────────────────────────────
async function init() {
  svg = document.getElementById("canvas");
  world = document.getElementById("world");
  dotsPattern = document.getElementById("dots");
  panel = document.getElementById("panel");
  panelBody = document.getElementById("panel-body");

  let data;
  try {
    const res = await fetch("../data/taxa.json");
    data = await res.json();
  } catch (err) {
    document.querySelector(".canvas-hint").textContent =
      "데이터를 불러오지 못했습니다. 로컬 서버로 실행했는지 확인하세요 (예: python3 -m http.server 후 /web/lineage.html).";
    return;
  }

  TAXA = data.taxa || [];
  buildIndexes();
  const info = layout();
  renderWorld(info);
  setupCamera();
  setupControls();
  setupSearch();
  fit(false);

  // 도감 등에서 ?focus=<id> 로 진입하면 해당 노드를 선택·센터링
  const focusId = new URLSearchParams(location.search).get("focus");
  if (focusId && pos.has(focusId)) focusNode(focusId);
}

function buildIndexes() {
  byId.clear(); parentsOf.clear(); childrenOf.clear();
  edges = [];
  for (const t of TAXA) byId.set(t.id, t);

  const addRel = (map, key, val) => {
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(val);
  };
  for (const t of TAXA) {
    for (const pid of t.parents || []) {
      if (!byId.has(pid)) continue; // 깨진 참조는 그리지 않는다
      edges.push({ from: pid, to: t.id, kind: "cross" });
      addRel(parentsOf, t.id, { id: pid, kind: "cross" });
      addRel(childrenOf, pid, { id: t.id, kind: "cross" });
    }
    if (t.selectionOf && byId.has(t.selectionOf)) {
      edges.push({ from: t.selectionOf, to: t.id, kind: "selection" });
      addRel(parentsOf, t.id, { id: t.selectionOf, kind: "selection" });
      addRel(childrenOf, t.selectionOf, { id: t.id, kind: "selection" });
    }
  }
}

// ── 레이아웃 ──────────────────────────────────────────────
// 세대(깊이)별 레이어 배치 + 배리센터 정렬. 좌표는 한 번만 계산해 pos에 고정.
function layout() {
  const connected = new Set();
  for (const e of edges) { connected.add(e.from); connected.add(e.to); }

  // 세대 = 위 관계(부모·원종) 최장 거리. 데이터 오류로 순환이 생겨도 멈추지 않게 방어.
  const depth = new Map();
  const depthOf = (id, trail) => {
    if (depth.has(id)) return depth.get(id);
    if (trail.has(id)) return 0;
    trail.add(id);
    const ups = (parentsOf.get(id) || []).map((p) => depthOf(p.id, trail));
    const d = ups.length ? Math.max(...ups) + 1 : 0;
    depth.set(id, d);
    return d;
  };
  for (const id of connected) depthOf(id, new Set());

  const maxDepth = Math.max(0, ...depth.values());
  const layers = Array.from({ length: maxDepth + 1 }, () => []);
  for (const id of connected) layers[depth.get(id)].push(id);

  layers.forEach((layer, d) => {
    if (d === 0) {
      layer.sort((a, b) => byId.get(a).displayName.localeCompare(byId.get(b).displayName, "ko"));
    } else {
      // 부모들의 x중심 평균(배리센터)순으로 줄 세워 선 교차를 줄인다.
      const bary = (id) => {
        const ups = (parentsOf.get(id) || []).filter((p) => pos.has(p.id));
        if (!ups.length) return Number.MAX_SAFE_INTEGER;
        return ups.reduce((s, p) => s + pos.get(p.id).x + pos.get(p.id).w / 2, 0) / ups.length;
      };
      layer.sort((a, b) => bary(a) - bary(b));
    }
    let x = 0;
    for (const id of layer) {
      const w = nodeW(id);
      pos.set(id, { x, y: d * LAYER_GAP, w });
      x += w + X_GAP;
    }
  });

  // 레이어를 그래프 전체 폭 기준 가운데 정렬
  const layerW = (layer) =>
    layer.length ? pos.get(layer.at(-1)).x + pos.get(layer.at(-1)).w : 0;
  const graphW = Math.max(...layers.map(layerW), 320);
  layers.forEach((layer) => {
    const shift = (graphW - layerW(layer)) / 2;
    for (const id of layer) pos.get(id).x += shift;
  });

  // 계보 미등록(고립) 개체: 그래프 아래 구역에 줄바꿈 그리드로 배치
  const isolated = TAXA.filter((t) => !connected.has(t.id)).map((t) => t.id);
  const isoY = (maxDepth + 1) * LAYER_GAP + 50;
  let ix = 0, iy = isoY;
  for (const id of isolated) {
    const w = nodeW(id);
    if (ix + w > graphW && ix > 0) { ix = 0; iy += NODE_H + 28; }
    pos.set(id, { x: ix, y: iy, w });
    ix += w + X_GAP;
  }

  content.w = Math.max(...[...pos.values()].map((p) => p.x + p.w));
  content.h = Math.max(...[...pos.values()].map((p) => p.y + NODE_H));
  return { layers, isolated, isoY };
}

// 노드 폭: 한글 이름(13px 굵게)과 축약 학명(9.5px)의 길이 기반 추정.
// 사진이 있으면 왼쪽 썸네일(40px + 여백) 만큼 넓힌다.
function nodeW(id) {
  const t = byId.get(id);
  return Math.round((thumbUrl(t) ? 48 : 0) + Math.max(
    110,
    t.displayName.length * 12.5 + 34,
    sciShort(t).length * 5.4 + 26
  ));
}

function thumbUrl(t) {
  return (t.images || [])[0] || "";
}

function sciShort(t) {
  return (t.scientificName || "").replace(/^Anthurium\s+/, "A. ");
}

// ── 월드 렌더 ─────────────────────────────────────────────
function renderWorld({ layers, isolated, isoY }) {
  const edgeSvg = edges.map((e) => {
    const a = pos.get(e.from), b = pos.get(e.to);
    const x1 = a.x + a.w / 2, y1 = a.y + NODE_H;
    const x2 = b.x + b.w / 2, y2 = b.y;
    const my = Math.max(30, (y2 - y1) * 0.5);
    return `<path class="gedge gedge-${e.kind}" data-from="${esc(e.from)}" data-to="${esc(e.to)}"
      d="M${x1},${y1} C${x1},${y1 + my} ${x2},${y2 - my} ${x2},${y2}"/>`;
  }).join("");

  const labels = layers.map((layer, d) =>
    layer.length
      ? `<text class="glabel" x="-40" y="${d * LAYER_GAP + NODE_H / 2 + 4}" text-anchor="end">${d}세대</text>`
      : ""
  ).join("") + (isolated.length
    ? `<text class="glabel" x="0" y="${isoY - 16}">계보 미등록 (${isolated.length})</text>`
    : "");

  const nodeSvg = [...pos.keys()].map((id) => {
    const t = byId.get(id), p = pos.get(id);
    const warn = t.verified === false ? `<text class="gwarn" x="${p.w - 14}" y="16">⚠</text>` : "";
    // 사진이 있으면 왼쪽에 40px 썸네일을 넣고 텍스트 중심을 오른쪽 영역으로 옮긴다.
    const src = thumbUrl(t);
    const img = src
      ? `<image href="${esc(src)}" x="7" y="7" width="40" height="40"
           clip-path="url(#thumb-clip)" preserveAspectRatio="xMidYMid slice"
           onerror="this.remove()"/>`
      : "";
    const tx = src ? 48 + (p.w - 48) / 2 : p.w / 2;
    return `<g class="gnode type-${t.type}" data-id="${esc(id)}" transform="translate(${p.x},${p.y})">
      <rect width="${p.w}" height="${NODE_H}" rx="11"/>
      ${img}
      <text class="gname" x="${tx}" y="23" text-anchor="middle">${esc(t.displayName)}</text>
      <text class="gsci" x="${tx}" y="41" text-anchor="middle">${esc(sciShort(t))}</text>
      ${warn}
    </g>`;
  }).join("");

  world.innerHTML = edgeSvg + labels + nodeSvg;
}

// ── 카메라 적용/조작 ──────────────────────────────────────
function applyCam() {
  const t = `translate(${cam.x},${cam.y}) scale(${cam.k})`;
  world.setAttribute("transform", t);
  dotsPattern.setAttribute("patternTransform", t); // 배경 도트도 같이 움직여 무한 캔버스 감각
  document.getElementById("zoom-label").textContent = Math.round(cam.k * 100) + "%";
}

// 줌의 핵심: (cx, cy)에 있는 월드 점이 화면에서 움직이지 않도록 x/y를 보정한다.
function zoomAt(cx, cy, factor) {
  const k2 = Math.min(K_MAX, Math.max(K_MIN, cam.k * factor));
  factor = k2 / cam.k;
  cam.x = cx - (cx - cam.x) * factor;
  cam.y = cy - (cy - cam.y) * factor;
  cam.k = k2;
  applyCam();
}

function zoomCenter(factor) {
  zoomAt(svg.clientWidth / 2, svg.clientHeight / 2, factor);
}

function fit(animate = true) {
  const vw = svg.clientWidth, vh = svg.clientHeight;
  const m = 80; // 상단바·여백 고려
  const k = Math.max(K_MIN, Math.min((vw - m) / content.w, (vh - m * 1.6) / content.h, 1.4));
  const target = {
    k,
    x: (vw - content.w * k) / 2,
    y: (vh - content.h * k) / 2 + 24,
  };
  if (animate) animateCam(target);
  else { Object.assign(cam, target); applyCam(); }
}

let camAnim = null;
function animateCam(target, ms = 450) {
  cancelAnimationFrame(camAnim);
  const from = { ...cam };
  const t0 = performance.now();
  const ease = (u) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
  const step = (now) => {
    const u = Math.min(1, (now - t0) / ms), e = ease(u);
    cam.x = from.x + (target.x - from.x) * e;
    cam.y = from.y + (target.y - from.y) * e;
    cam.k = from.k + (target.k - from.k) * e;
    applyCam();
    if (u < 1) camAnim = requestAnimationFrame(step);
  };
  camAnim = requestAnimationFrame(step);
}

function focusNode(id) {
  select(id);
  const p = pos.get(id);
  if (!p) return;
  const k = Math.max(cam.k, 1);
  animateCam({
    k,
    x: svg.clientWidth / 2 - (p.x + p.w / 2) * k,
    y: svg.clientHeight / 2 - (p.y + NODE_H / 2) * k,
  });
}

// ── 입력 처리 (Pointer Events: 마우스/터치/펜 통일) ──────────
function setupCamera() {
  const pointers = new Map(); // pointerId -> {x, y}
  let moved = 0, downTarget = null;

  svg.addEventListener("pointerdown", (e) => {
    svg.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 1) { moved = 0; downTarget = e.target; }
    cancelAnimationFrame(camAnim);
  });

  svg.addEventListener("pointermove", (e) => {
    const prev = pointers.get(e.pointerId);
    if (!prev) return;
    const cur = { x: e.clientX, y: e.clientY };

    if (pointers.size === 1) {
      // 팬
      cam.x += cur.x - prev.x;
      cam.y += cur.y - prev.y;
      moved += Math.hypot(cur.x - prev.x, cur.y - prev.y);
      applyCam();
    } else if (pointers.size === 2) {
      // 핀치: 두 손가락 중점 이동 = 팬, 거리 비 = 줌
      const other = [...pointers.entries()].find(([pid]) => pid !== e.pointerId)[1];
      const rect = svg.getBoundingClientRect();
      const prevMid = { x: (prev.x + other.x) / 2 - rect.left, y: (prev.y + other.y) / 2 - rect.top };
      const curMid = { x: (cur.x + other.x) / 2 - rect.left, y: (cur.y + other.y) / 2 - rect.top };
      const prevDist = Math.hypot(prev.x - other.x, prev.y - other.y);
      const curDist = Math.hypot(cur.x - other.x, cur.y - other.y);
      cam.x += curMid.x - prevMid.x;
      cam.y += curMid.y - prevMid.y;
      if (prevDist > 0) zoomAt(curMid.x, curMid.y, curDist / prevDist);
      else applyCam();
      moved = 99;
    }
    pointers.set(e.pointerId, cur);
  });

  const release = (e) => {
    if (!pointers.has(e.pointerId)) return;
    pointers.delete(e.pointerId);
    // 이동량이 작으면 클릭으로 해석: 노드 → 선택, 빈 곳 → 해제
    if (pointers.size === 0 && moved < 5) {
      const g = downTarget && downTarget.closest ? downTarget.closest(".gnode") : null;
      if (g) focusPanelOnly(g.dataset.id);
      else clearSelection();
    }
  };
  svg.addEventListener("pointerup", release);
  svg.addEventListener("pointercancel", release);

  svg.addEventListener("wheel", (e) => {
    e.preventDefault();
    const rect = svg.getBoundingClientRect();
    // 트랙패드 핀치는 ctrlKey가 함께 와서 더 민감하게 처리
    const factor = Math.exp(-e.deltaY * (e.ctrlKey ? 0.012 : 0.0022));
    zoomAt(e.clientX - rect.left, e.clientY - rect.top, factor);
  }, { passive: false });
}

// 클릭 선택: 카메라는 그대로 두고 선택/패널만 갱신
function focusPanelOnly(id) {
  select(id);
}

// ── 혈통 선택/하이라이트 ──────────────────────────────────
function collect(id, adj) {
  const out = new Set();
  const stack = [id];
  while (stack.length) {
    const cur = stack.pop();
    for (const n of adj.get(cur) || []) {
      if (!out.has(n.id)) { out.add(n.id); stack.push(n.id); }
    }
  }
  return out;
}

function select(id) {
  const t = byId.get(id);
  if (!t) return;
  selectedId = id;

  const up = collect(id, parentsOf);     // 조상 (교배 부모 + 선별 원종)
  const down = collect(id, childrenOf);  // 자손 (교배 자손 + 선별 클론)
  const lineage = new Set([id, ...up, ...down]);

  svg.classList.add("has-selection");
  world.querySelectorAll(".gnode").forEach((g) => {
    g.classList.toggle("in-lineage", lineage.has(g.dataset.id));
    g.classList.toggle("focal", g.dataset.id === id);
  });
  // 간선은 "혈통 경로 위"에 있는 것만 강조한다.
  const onPath = (from, to) =>
    (up.has(from) && (to === id || up.has(to))) ||
    (down.has(to) && (from === id || down.has(from)));
  world.querySelectorAll(".gedge").forEach((p) => {
    p.classList.toggle("on-path", onPath(p.dataset.from, p.dataset.to));
  });

  renderPanel(t);
}

function clearSelection() {
  selectedId = null;
  svg.classList.remove("has-selection");
  world.querySelectorAll(".gnode").forEach((g) => g.classList.remove("in-lineage", "focal"));
  world.querySelectorAll(".gedge").forEach((p) => p.classList.remove("on-path"));
  panel.hidden = true;
}

// ── 우측 상세 패널 ────────────────────────────────────────
function renderPanel(t) {
  const relBlock = (title, items) => {
    if (!items.length) return "";
    const links = items.map((x) => {
      const rt = byId.get(x.id);
      return `<button class="lineage-link" data-jump="${esc(x.id)}">${esc(rt.displayName)}</button>`;
    }).join("");
    return `<div class="lineage"><h4>${esc(title)}</h4><div class="lineage-links">${links}</div></div>`;
  };

  const ups = parentsOf.get(t.id) || [];
  const downs = childrenOf.get(t.id) || [];

  panelBody.innerHTML = `
    <h2>${esc(t.displayName)} ${t.verified === false ? '<span class="chip warn">검증 필요</span>' : ""}</h2>
    <div class="sci">${esc(t.scientificName || "")}</div>
    <div class="meta">
      <span class="chip type-${t.type}">${TYPE_LABELS[t.type] || t.type}</span>
      ${(t.abbreviations || []).map((a) => `<span class="chip abbr">${esc(a)}</span>`).join("")}
    </div>
    ${thumbUrl(t)
      ? `<div class="detail-thumb type-${t.type}"><img src="${esc(thumbUrl(t))}" alt="${esc(t.displayName)}" loading="lazy" onerror="this.parentNode.remove()"></div>`
      : ""}
    ${t.descriptionKo ? `<p class="panel-desc">${mdLite(t.descriptionKo)}</p>` : ""}
    ${relBlock("교배 부모", ups.filter((x) => x.kind === "cross"))}
    ${relBlock("선별 원종", ups.filter((x) => x.kind === "selection"))}
    ${relBlock("교배 자손", downs.filter((x) => x.kind === "cross"))}
    ${relBlock("선별 클론", downs.filter((x) => x.kind === "selection"))}
    <p class="panel-foot"><a href="index.html#${encodeURIComponent(t.id)}">📖 도감 상세에서 보기</a></p>
  `;
  panelBody.querySelectorAll("[data-jump]").forEach((b) => {
    b.onclick = () => focusNode(b.dataset.jump);
  });
  panel.hidden = false;
}

// ── 컨트롤(줌 버튼·범례 토글·키보드) ───────────────────────
function setupControls() {
  document.getElementById("zoom-in").onclick = () => zoomCenter(1.4);
  document.getElementById("zoom-out").onclick = () => zoomCenter(1 / 1.4);
  document.getElementById("zoom-fit").onclick = () => fit();
  document.getElementById("zoom-100").onclick = () => {
    // 현재 화면 중앙의 월드 점을 유지한 채 100%로
    const vw = svg.clientWidth, vh = svg.clientHeight;
    const wx = (vw / 2 - cam.x) / cam.k, wy = (vh / 2 - cam.y) / cam.k;
    animateCam({ k: 1, x: vw / 2 - wx, y: vh / 2 - wy });
  };
  document.getElementById("panel-close").onclick = () => clearSelection();

  const bindToggle = (btnId, cls) => {
    const btn = document.getElementById(btnId);
    btn.onclick = () => {
      btn.classList.toggle("on");
      svg.classList.toggle(cls, !btn.classList.contains("on"));
    };
  };
  bindToggle("toggle-cross", "hide-cross");
  bindToggle("toggle-selection", "hide-selection");

  document.addEventListener("keydown", (e) => {
    if (e.target.tagName === "INPUT") return;
    if (e.key === "Escape") clearSelection();
    else if (e.key === "+" || e.key === "=") zoomCenter(1.3);
    else if (e.key === "-") zoomCenter(1 / 1.3);
    else if (e.key === "0") fit();
  });
}

// ── 검색 → 노드 점프 ──────────────────────────────────────
function setupSearch() {
  const input = document.getElementById("canvas-search");
  const list = document.getElementById("search-results");

  const hay = (t) => [
    t.displayName, t.scientificName || "",
    ...(t.abbreviations || []), ...(t.aka || []), ...(t.tags || []),
  ].join(" ").toLowerCase();

  let matches = [];
  const renderList = () => {
    list.innerHTML = matches.map((t) => `
      <li data-id="${esc(t.id)}">
        <span>${esc(t.displayName)}</span>
        <span class="sci">${esc(sciShort(t))}</span>
      </li>`).join("");
    list.hidden = matches.length === 0;
  };
  const pick = (id) => {
    list.hidden = true;
    input.value = byId.get(id).displayName;
    focusNode(id);
  };

  input.addEventListener("input", () => {
    const q = input.value.trim().toLowerCase();
    matches = q ? TAXA.filter((t) => hay(t).includes(q)).slice(0, 8) : [];
    renderList();
  });
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && matches.length) pick(matches[0].id);
    else if (e.key === "Escape") { list.hidden = true; input.blur(); }
  });
  list.addEventListener("click", (e) => {
    const li = e.target.closest("li[data-id]");
    if (li) pick(li.dataset.id);
  });
  document.addEventListener("pointerdown", (e) => {
    if (!e.target.closest(".search-box")) list.hidden = true;
  });
}

// ── 유틸 ──────────────────────────────────────────────────
function mdLite(s) {
  return esc(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

init();
