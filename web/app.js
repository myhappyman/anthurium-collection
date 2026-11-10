"use strict";

// ── 전역 상태 ──────────────────────────────────────────────
let TAXA = [];
const byId = new Map();        // id -> taxon
const byAbbr = new Map();      // 소문자 약어 -> taxon
const childrenIndex = new Map(); // parentId -> [taxon, ...]  (역방향 계보)
const selectionIndex = new Map(); // 원종 id -> [선별 클론 taxon, ...]
let activeType = "all";

const TYPE_LABELS = {
  species: "원종",
  selection: "선별종",
  hybrid: "하이브리드",
};

// ── 초기화 ────────────────────────────────────────────────
async function init() {
  let data;
  try {
    const res = await fetch("../data/taxa.json");
    data = await res.json();
  } catch (err) {
    document.getElementById("grid").innerHTML =
      '<p class="empty">데이터를 불러오지 못했습니다. 로컬 서버로 실행했는지 확인하세요 ' +
      '(예: 프로젝트 루트에서 <code>python3 -m http.server</code> 후 /web/ 열기).</p>';
    return;
  }

  TAXA = data.taxa || [];
  buildIndexes();
  renderTypeFilters();
  render(TAXA);

  document.getElementById("search").addEventListener("input", onSearch);
  document.getElementById("detail").addEventListener("click", (e) => {
    if (e.target.hasAttribute("data-close")) closeDetail();
  });
  document.getElementById("tree").addEventListener("click", (e) => {
    if (e.target.hasAttribute("data-close-tree")) closeTree();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { closeTree(); closeDetail(); }
  });

  // 계보 캔버스 등에서 index.html#<id> 로 진입하면 해당 개체 상세를 바로 연다.
  const hashId = decodeURIComponent(location.hash.slice(1));
  if (hashId && byId.has(hashId)) openDetail(hashId);
}

// 한 번 순회하며 파생 인덱스(역방향 계보 포함)를 만들어 둔다.
function buildIndexes() {
  byId.clear(); byAbbr.clear(); childrenIndex.clear(); selectionIndex.clear();
  for (const t of TAXA) {
    byId.set(t.id, t);
    for (const a of t.abbreviations || []) byAbbr.set(a.toLowerCase(), t);
  }
  for (const t of TAXA) {
    for (const pid of t.parents || []) {
      if (!childrenIndex.has(pid)) childrenIndex.set(pid, []);
      childrenIndex.get(pid).push(t);
    }
    if (t.selectionOf) {
      if (!selectionIndex.has(t.selectionOf)) selectionIndex.set(t.selectionOf, []);
      selectionIndex.get(t.selectionOf).push(t);
    }
  }
}

// ── 약어 해석기 ────────────────────────────────────────────
// query를 안스리움 개체로 해석한다. 추측하지 않는다(모르면 null).
//   1) 약어가 정확히 일치하면 그 개체 반환: { taxon }
//   2) "A x B" 패턴이면 양쪽을 각각 해석해 부모로 안내: { parents: [a, b] }
//   3) 해석 불가하면 null
function resolveAbbreviation(query, byAbbrIndex) {
  const q = query.toLowerCase().replace(/\s+/g, "");
  const direct = byAbbrIndex.get(q);
  if (direct) return { taxon: direct };

  const parts = q.split(/[x×]/).filter(Boolean);
  if (parts.length === 2) {
    const a = byAbbrIndex.get(parts[0]);
    const b = byAbbrIndex.get(parts[1]);
    if (a && b) return { parents: [a, b] };
  }
  return null;
}

// ── 검색 ──────────────────────────────────────────────────
function onSearch() {
  const q = document.getElementById("search").value.trim().toLowerCase();
  if (!q) { render(filterByType(TAXA)); return; }

  const results = filterByType(TAXA).filter((t) => matches(t, q));

  // 직접 검색 결과가 없을 때, 약어 해석기를 한 번 시도한다.
  if (results.length === 0) {
    const resolved = resolveAbbreviation(q, byAbbr);
    if (resolved && resolved.taxon) { render([resolved.taxon]); return; }
    if (resolved && resolved.parents) { render(resolved.parents.filter(Boolean)); return; }
  }
  render(results);
}

function matches(t, q) {
  const hay = [
    t.displayName,
    t.scientificName || "",
    ...(t.abbreviations || []),
    ...(t.aka || []),
    ...(t.tags || []),
  ].join(" ").toLowerCase();
  return hay.includes(q);
}

function filterByType(list) {
  return activeType === "all" ? list : list.filter((t) => t.type === activeType);
}

// ── 타입 필터 ─────────────────────────────────────────────
function renderTypeFilters() {
  const wrap = document.getElementById("type-filters");
  const types = ["all", "species", "selection", "hybrid"];
  wrap.innerHTML = "";
  for (const type of types) {
    const btn = document.createElement("button");
    btn.textContent = type === "all" ? "전체" : TYPE_LABELS[type];
    btn.className = type === activeType ? "active" : "";
    btn.onclick = () => {
      activeType = type;
      renderTypeFilters();
      onSearch();
    };
    wrap.appendChild(btn);
  }
}

// 이미지 썸네일: 사진이 있으면 표시, 없거나 로드 실패하면 잎 placeholder로 우아하게 대체.
// (URL을 추측하지 않으며, images 배열이 비면 placeholder만 보인다.)
function thumbMarkup(t, cls) {
  const src = (t.images || [])[0];
  const img = src
    ? `<img src="${esc(src)}" alt="${esc(t.displayName)}" loading="lazy" onerror="this.remove()">`
    : "";
  return `<div class="${cls} type-${t.type}"><span class="thumb-ph">🌿</span>${img}</div>`;
}

// ── 렌더 ──────────────────────────────────────────────────
function render(list) {
  const grid = document.getElementById("grid");
  const empty = document.getElementById("empty");
  grid.innerHTML = "";
  empty.hidden = list.length > 0;

  for (const t of list) {
    const card = document.createElement("div");
    card.className = "card";
    card.onclick = () => openDetail(t.id);

    const abbr = (t.abbreviations || [])
      .map((a) => `<span class="chip abbr">${esc(a)}</span>`).join("");
    const warn = t.verified === false ? '<span class="chip warn">검증 필요</span>' : "";

    card.innerHTML = `
      ${thumbMarkup(t, "card-thumb")}
      <h3>${esc(t.displayName)}</h3>
      <div class="sci">${esc(t.scientificName || "")}</div>
      <div class="meta">
        <span class="chip type-${t.type}">${TYPE_LABELS[t.type] || t.type}</span>
        ${abbr}${warn}
      </div>`;
    grid.appendChild(card);
  }
}

// ── 상세 모달 ─────────────────────────────────────────────
function openDetail(id) {
  const t = byId.get(id);
  if (!t) return;
  const body = document.getElementById("detail-body");

  const parents = (t.parents || []).map((pid) => byId.get(pid)).filter(Boolean);
  const children = childrenIndex.get(t.id) || [];
  const selectionParent = t.selectionOf ? byId.get(t.selectionOf) : null;
  const selectionClones = selectionIndex.get(t.id) || [];

  body.innerHTML = `
    <h2>${esc(t.displayName)} ${t.verified === false ? '<span class="chip warn">검증 필요</span>' : ""}</h2>
    <div class="sci">${esc(t.scientificName || "")}</div>
    <div class="meta" style="margin-top:.6rem">
      <span class="chip type-${t.type}">${TYPE_LABELS[t.type] || t.type}</span>
      ${(t.abbreviations || []).map((a) => `<span class="chip abbr">${esc(a)}</span>`).join("")}
    </div>
    ${thumbMarkup(t, "detail-thumb")}
    ${(!(t.images || [])[0] && (t.sources || [])[0])
      ? `<p class="photo-link"><a href="${esc(t.sources[0])}" target="_blank" rel="noopener noreferrer">🔗 공신력 출처에서 사진 보기</a></p>` : ""}
    ${t.descriptionKo ? `<p>${mdLite(t.descriptionKo)}</p>` : ""}
    ${lineageBlock("부모 (교배 원종)", parents)}
    ${lineageBlock("이 개체를 부모로 쓴 자식들", children)}
    ${lineageBlock("선별 기준 종 (이 클론의 원종)", selectionParent ? [selectionParent] : [])}
    ${lineageBlock("이 종의 선별 클론", selectionClones)}
    <div class="tree-actions">
      ${(parents.length || children.length || selectionParent || selectionClones.length)
        ? `<button id="open-tree-btn">🌳 계보 트리 보기</button>` : ""}
      <a class="lineage-link" href="lineage.html?focus=${encodeURIComponent(t.id)}">🗺 계보 캔버스에서 보기</a>
    </div>
    ${traitsTable(t.traits)}
  `;

  // 계보 링크 클릭 시 해당 개체 상세로 이동
  body.querySelectorAll(".lineage-link").forEach((el) => {
    el.onclick = () => openDetail(el.dataset.id);
  });
  const treeBtn = body.querySelector("#open-tree-btn");
  if (treeBtn) treeBtn.onclick = () => openTree(t.id);

  document.getElementById("detail").hidden = false;
}

// ── 계보 트리 ──────────────────────────────────────────────
// 한 트리에 교배(parents/children)와 선별(selectionOf) 관계를 함께 그린다.
// 각 간선이 어떤 관계인지 {id, rel} 로 들고 다니며 노드에 배지로 표시한다.
// 위 방향: 교배 부모 + 선별 원종 / 아래 방향: 교배 자손 + 선별 클론.
const upOf = (t) => [
  ...(t.parents || []).map((id) => ({ id, rel: "교배 부모", kind: "cross" })),
  ...(t.selectionOf ? [{ id: t.selectionOf, rel: "선별 원종", kind: "selection" }] : []),
];
const downOf = (t) => [
  ...(childrenIndex.get(t.id) || []).map((c) => ({ id: c.id, rel: "교배 자손", kind: "cross" })),
  ...(selectionIndex.get(t.id) || []).map((c) => ({ id: c.id, rel: "선별 클론", kind: "selection" })),
];

function openTree(id) {
  renderTree(id);
  document.getElementById("tree").hidden = false;
}
function closeTree() {
  document.getElementById("tree").hidden = true;
}

function renderTree(rootId) {
  const t = byId.get(rootId);
  if (!t) return;
  const hasUp = upOf(t).length > 0;
  const hasDown = downOf(t).length > 0;

  const ancestorTree = hasUp
    ? `<div class="tree-section">
         <h4>🔼 거슬러 올라가기 (교배 부모 · 선별 원종)</h4>
         <div class="tree"><ul>${treeNode(rootId, upOf, new Set([rootId]), true, null)}</ul></div>
       </div>` : "";

  const descendantTree = hasDown
    ? `<div class="tree-section">
         <h4>🔽 갈라져 나오기 (교배 자손 · 선별 클론)</h4>
         <div class="tree"><ul>${treeNode(rootId, downOf, new Set([rootId]), true, null)}</ul></div>
       </div>` : "";

  const body = document.getElementById("tree-body");
  body.innerHTML = `
    <h3>${esc(t.displayName)} <span class="chip type-${t.type}">${TYPE_LABELS[t.type] || t.type}</span></h3>
    <div class="tree-focal-sci">${esc(t.scientificName || "")}</div>
    <div class="tree-actions"><button data-detail-id="${esc(rootId)}">상세 정보 보기</button></div>
    <p class="tree-hint">노드를 클릭하면 그 개체를 중심으로 트리가 다시 그려집니다. 배지는 관계 종류(파랑=교배 / 보라=선별)를 뜻합니다.</p>
    ${ancestorTree || descendantTree ? ancestorTree + descendantTree
      : '<p class="empty">등록된 계보 정보가 없습니다.</p>'}
  `;

  // 노드 클릭 → 그 개체를 중심으로 재구성
  body.querySelectorAll("[data-tree-id]").forEach((el) => {
    el.onclick = () => renderTree(el.dataset.treeId);
  });
  const detailBtn = body.querySelector("[data-detail-id]");
  if (detailBtn) detailBtn.onclick = () => { closeTree(); openDetail(detailBtn.dataset.detailId); };
}

// 재귀로 노드 1개 + 하위 트리를 생성. visited로 순환 차단.
// nextFn(t) -> [{id, rel, kind}]. rel은 루트가 아닌 노드에 배지로 표시.
function treeNode(id, nextFn, visited, isRoot, edge) {
  const t = byId.get(id);
  if (!t) return "";
  const cls = `tnode type-${t.type}${isRoot ? " root" : ""}`;
  const badge = edge ? `<span class="tnode-rel rel-${edge.kind}">${esc(edge.rel)}</span>` : "";
  const sci = t.scientificName ? `<span class="tnode-sci">${esc(t.scientificName)}</span>` : "";
  let html = `<li><div class="${cls}" data-tree-id="${esc(id)}">${badge}${esc(t.displayName)}${sci}</div>`;

  const nexts = (nextFn(t) || []).filter((n) => byId.has(n.id) && !visited.has(n.id));
  if (nexts.length) {
    const v2 = new Set(visited);
    nexts.forEach((n) => v2.add(n.id));
    html += `<ul>${nexts.map((n) => treeNode(n.id, nextFn, v2, false, n)).join("")}</ul>`;
  }
  return html + "</li>";
}

// 전체 계보 시각화는 전용 페이지(lineage.html, 무한 캔버스)로 이동했다.

function lineageBlock(title, taxa) {
  if (!taxa || taxa.length === 0) return "";
  const links = taxa.map((t) =>
    `<button class="lineage-link" data-id="${esc(t.id)}">${esc(t.displayName)}</button>`
  ).join("");
  return `<div class="lineage"><h4>${esc(title)}</h4><div class="lineage-links">${links}</div></div>`;
}

function traitsTable(traits) {
  if (!traits || Object.keys(traits).length === 0) return "";
  const rows = Object.entries(traits)
    .map(([k, v]) => `<tr><td>${esc(k)}</td><td>${esc(v)}</td></tr>`).join("");
  return `<table class="traits">${rows}</table>`;
}

function closeDetail() {
  document.getElementById("detail").hidden = true;
}

// ── 유틸 ──────────────────────────────────────────────────
// 설명문 전용 미니 렌더러: 먼저 이스케이프한 뒤 **…** 만 <strong>으로 변환.
// (이스케이프가 먼저라 설명문에 HTML이 섞여 있어도 안전하다.)
function mdLite(s) {
  return esc(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

init();
