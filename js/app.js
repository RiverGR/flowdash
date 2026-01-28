// UI 모듈 import (헤더, 대시보드, 필터, 추가 폼)
// 각각 js 파일에 있는 함수를 가져오기 위함
import { createHeader } from "./greeting.js";
import { createDashboard } from "./dash.js";
import { createFilter } from "./filter.js";
import { createAdder } from "./add.js";

/* 상수 값 설정 */
// xxx_LABEL은 매핑
const PRIORITY_LABEL = { high: "높음", mid: "중간", low: "낮음" };
const STATUS_LABEL = { todo: "시작 전", doing: "진행중", done: "완료" };
const KEY_TODOS = "flowdash-todos"; // 로컬스토리지에서 todos 값을 저장할 때 사용할 이름

/* DOM 유틸 */
// 단축 함수를 활용하여 DOM을 빠르게 불러오는 역할
const $ = (sel, root = document) => root.querySelector(sel);

// 요소 생성 헬퍼: tag로 만들고 className/text/type을 한 번에 설정한다
const el = (tag, { className, text, type } = {}) => {
  const n = document.createElement(tag);
  if (className) n.className = className;
  if (text != null) n.textContent = text;
  if (type) n.type = type;
  return n;
};

// 특정 노드 내부를 비우는 함수(리스트 재렌더링 전에 사용)
const clearNode = (node) => {
  if (!node) return;
  node.innerHTML = "";
};

// 배지 UI(span)를 만들어 우선순위/상태/마감일 등을 표시
const makeBadge = (text, dim = false) => {
  const b = el("span", { className: "badge", text });
  if (dim) b.classList.add("dim");
  return b;
};

/* 로컬스토리지  */
// 로컬스토리지에서 todos 배열을 불러오는 함수
const loadTodos = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY_TODOS) || "[]");
  } catch {
    return [];
  }
};

// todos 배열을 로컬스토리지에 저장하는 함수
const saveTodos = (todos) => {
  localStorage.setItem(KEY_TODOS, JSON.stringify(todos));
};

/* 날짜 유틸 */
// yyyy-mm-dd 문자열을 Date(ms)로 바꾸는 함수
const parseYMD = (s) => {
  if (!s) return null;
  const d = new Date(s + "T00:00:00");
  return Number.isNaN(d.getTime()) ? null : d.getTime();
};

// 마감일까지 남은 일 수 계산(오늘 기준)
const daysLeftByYMD = (ymd) => {
  const dueAt = parseYMD(ymd);
  if (dueAt == null) return null;
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.ceil((dueAt - Date.now()) / oneDay);
};

/*  마감일 경고 배너  */
// 상단/하단 배너(#due-alert)에 마감 임박 경고를 보여주는 함수
const renderDueAlert = (todos) => {
  const el = document.querySelector("#due-alert");
  if (!el) return;
  // 완료되지 않았고 마감일이 있는 것들만
  const candidates = todos
    .filter((t) => t.status !== "done" && t.dueDate)
    .map((t) => ({ ...t, left: daysLeftByYMD(t.dueDate) }))
    .filter((t) => typeof t.left === "number");

  // 후보가 없으면 배너 비우기
  if (!candidates.length) {
    el.textContent = "";
    el.className = "due-alert";
    return;
  }

  candidates.sort((a, b) => a.left - b.left);
  const top = candidates[0];

  if (top.left < 0) {
    el.textContent = `마감일이 지난 일이 있어요. (${candidates.filter((t) => t.left < 0).length}건)`;
    el.className = "due-alert due-alert--danger due-out";
    return;
  }

  if (top.left === 0) {
    el.textContent = `오늘 마감인 일이 있어요: "${top.title}"`;
    el.className = "due-alert due-alert--warn due-orange";
    return;
  }

  if (top.left === 1) {
    el.textContent = `이 일의 마감일이 하루 남았습니다: "${top.title}"`;
    el.className = "due-alert due-alert--warn due-green";
    return;
  }

  el.textContent = `빠르게 완료해야 할 일: ${top.left}일 남음 ("${top.title}")`;
  el.className = "due-alert";
};

/* 삭제 확인 모달  */
const createConfirmModal = () => {
  const dom = {
    modal: $("#modal"),
    msg: $("#modal-msg"),
    cancel: $("#modal-cancel"),
    ok: $("#modal-ok"),
  };

  // 삭제하기 위해서 대기를 하는 값
  let pending = null;

  const open = (type, id = null) => {
    pending = { type, id };
    if (dom.msg)
      dom.msg.textContent =
        type === "all"
          ? "정말 삭제하시겠습니까? 초기화 후엔 되돌릴 수 없습니다."
          : "삭제할까요?";
    dom.modal?.classList.remove("hidden");
  };

  const close = () => {
    pending = null;
    dom.modal?.classList.add("hidden");
  };

  const bind = (onOk) => {
    dom.cancel?.addEventListener("click", close);
    dom.modal?.addEventListener("click", (e) => {
      if (e.target === dom.modal) close();
    });
    dom.ok?.addEventListener("click", () => {
      if (!pending) return;
      onOk?.(pending);
      close();
    });
  };

  return { open, bind };
};

/* 보드(카드 UI) */
// 밑에 있는 카드 ui는 할 일이 추가된 카드 ui
// 현 카드 ui는 카드들을 저장하는 큰 하나의 카드들을 의미하니 주의.
const createBoard = () => {
  const laneCountTodo = $("#lane-count-todo");
  const laneCountDoing = $("#lane-count-doing");
  const laneCountDone = $("#lane-count-done");

  const listTodo = $("#list-todo");
  const listDoing = $("#list-doing");
  const listDone = $("#list-done");

  // select 박스 생성
  const buildSelect = (values, selected, labelMap) => {
    const sel = el("select");
    for (const v of values) {
      const opt = document.createElement("option");
      opt.value = v;
      opt.textContent = labelMap[v];
      if (v === selected) opt.selected = true;
      sel.append(opt);
    }
    return sel;
  };

  // 편집 패널 UI(css를 쓰지 않고 js에서 스타일 지정)
  // 이유 : 원래 카드 ui에서 늘어나는 형식으로 바뀌는 것이기 때문에 카드 ui 추가하고, 편집 ui도 추가함
  const buildEditPanel = (todo, handlers) => {
    const wrap = el("div", { className: "edit-panel" });

    const titleField = el("label", { className: "field" });
    titleField.append(el("span", { className: "label", text: "제목" }));
    const titleInput = el("input", { type: "text" });
    titleInput.value = todo.title ?? "";
    titleInput.maxLength = 80;
    titleInput.placeholder = "제목 입력";

    titleField.append(titleInput);

    const row = el("div", { className: "filter-grid" });
    row.style.gridTemplateColumns = "1fr";
    row.style.gap = "10px";

    const statusField = el("label", { className: "field" });
    statusField.append(el("span", { className: "label", text: "상태" }));
    const statusSel = buildSelect(
      ["todo", "doing", "done"],
      todo.status,
      STATUS_LABEL,
    );
    statusField.append(statusSel);

    const priField = el("label", { className: "field" });
    priField.append(el("span", { className: "label", text: "우선순위" }));
    const priSel = buildSelect(
      ["high", "mid", "low"],
      todo.priority,
      PRIORITY_LABEL,
    );
    priField.append(priSel);

    const dueField = el("label", { className: "field" });
    dueField.append(el("span", { className: "label", text: "마감일" }));
    const dueInput = el("input", { type: "date" });

    dueInput.min = new Date().toISOString().slice(0, 10);

    const max = new Date();
    max.setFullYear(max.getFullYear() + 1);
    dueInput.max = max.toISOString().slice(0, 10);

    dueInput.value = todo.dueDate ?? "";
    dueField.append(dueInput);

    row.append(statusField, priField, dueField);

    const contentField = el("label", { className: "field" });
    contentField.append(el("span", { className: "label", text: "내용(옵션)" }));
    const ta = el("textarea");
    ta.rows = 3;
    ta.placeholder = "내용 입력(옵션)";
    ta.value = todo.content ?? "";
    contentField.append(ta);

    const actions = el("div", { className: "todo-actions" });

    const btnCancel = el("button", {
      className: "btn tiny ghost",
      text: "취소",
    });
    btnCancel.type = "button";
    btnCancel.addEventListener("click", () => handlers.setEditing(null));

    const btnSave = el("button", {
      className: "btn tiny primary",
      text: "저장",
    });
    btnSave.type = "button";
    btnSave.addEventListener("click", () => {
      const nextTitle = titleInput.value.trim();
      handlers.saveEdit(todo.id, {
        title: nextTitle || todo.title,
        status: statusSel.value,
        priority: priSel.value,
        content: ta.value,
        dueDate: dueInput.value || null,
      });
    });

    actions.append(btnCancel, btnSave);
    wrap.append(titleField, row, contentField, actions);
    return wrap;
  };

  // 카드 UI(편집 값을 위해 ui 설정)
  const buildCard = (todo, editingId, handlers) => {
    const card = el("div", { className: "todo-card" });
    card.dataset.id = todo.id;

    const top = el("div", { className: "todo-top" });

    const title = el("div", { className: "todo-title", text: todo.title });
    top.append(title);

    const badges = el("div", { className: "todo-badges" });
    badges.append(makeBadge(PRIORITY_LABEL[todo.priority] ?? "중간"));
    badges.append(makeBadge(STATUS_LABEL[todo.status] ?? "시작 전", true));
    if (todo.dueDate) badges.append(makeBadge(`마감 ${todo.dueDate}`, true));
    top.append(badges);

    const meta = el("div", { className: "todo-meta" });
    if (todo.content) meta.textContent = todo.content;
    card.append(top, meta);

    const actions = el("div", { className: "todo-actions" });

    if (editingId === todo.id) {
      actions.append(buildEditPanel(todo, handlers));
    } else {
      const btnEdit = el("button", {
        className: "btn tiny ghost",
        text: "편집",
      });
      btnEdit.type = "button";
      btnEdit.addEventListener("click", () => handlers.setEditing(todo.id));

      const btnDel = el("button", {
        className: "btn tiny danger",
        text: "삭제",
      });
      btnDel.type = "button";
      btnDel.addEventListener("click", () => handlers.deleteOne(todo.id));

      actions.append(btnEdit, btnDel);
    }

    card.append(actions);
    return card;
  };

  // 보드 렌더(없으면 할 일을 저장해도 TODO BOARD에 추가가 안됨)
  const render = (todos, editingId, handlers) => {
    if (!listTodo || !listDoing || !listDone) return;

    const todoArr = todos.filter((t) => t.status === "todo");
    const doingArr = todos.filter((t) => t.status === "doing");
    const doneArr = todos.filter((t) => t.status === "done");

    if (laneCountTodo) laneCountTodo.textContent = String(todoArr.length);
    if (laneCountDoing) laneCountDoing.textContent = String(doingArr.length);
    if (laneCountDone) laneCountDone.textContent = String(doneArr.length);

    clearNode(listTodo);
    clearNode(listDoing);
    clearNode(listDone);

    for (const t of todoArr) listTodo.append(buildCard(t, editingId, handlers));
    for (const t of doingArr)
      listDoing.append(buildCard(t, editingId, handlers));
    for (const t of doneArr) listDone.append(buildCard(t, editingId, handlers));
  };

  return { render };
};

/* 앱 상태 */
let todos = [];
let editingId = null;

/* 모듈 생성 */
const header = createHeader();
const dashboard = createDashboard();
const filter = createFilter({ onChange: () => render() });
const adder = createAdder({
  onAdd: (data) => addTodo(data),
  onClearAll: () => confirm.open("all"),
});
const board = createBoard();
const confirm = createConfirmModal();

/* 데이터 관리 */
const makeId = () =>
  crypto?.randomUUID?.() ??
  String(Date.now()) + Math.random().toString(16).slice(2);

function addTodo({ title, content, priority, dueDate }) {
  const now = Date.now();
  todos.unshift({
    id: makeId(),
    title,
    content: content || "",
    priority: priority || "mid",
    dueDate: dueDate || null,
    status: "todo",
    createdAt: now,
    updatedAt: now,
  });

  saveTodos(todos);
  render();
}

function applyDelete(id) {
  todos = todos.filter((t) => t.id !== id);
  if (editingId === id) editingId = null;
  saveTodos(todos);
  render();
}

function applyClearAll() {
  todos = [];
  editingId = null;
  saveTodos(todos);
  render();
}

function saveEdit(id, patch) {
  const idx = todos.findIndex((t) => t.id === id);
  if (idx === -1) return;

  const now = Date.now();
  todos[idx] = {
    ...todos[idx],
    ...patch,
    dueDate: patch.dueDate ?? null,
    updatedAt: now,
  };

  editingId = null;
  saveTodos(todos);
  render();
}

/* 렌더 */
function render() {
  header.renderGreeting();
  dashboard.render(todos);

  const view = filter.readViewFromInputs();
  const viewTodos = filter.getViewTodos(todos, view);

  board.render(viewTodos, editingId, {
    setEditing: (id) => {
      editingId = id;
      render();
    },
    saveEdit,
    deleteOne: (id) => confirm.open("one", id),
  });

  renderDueAlert(todos);
}

/* 초기화 */
function init() {
  todos = loadTodos();

  header.bind();
  dashboard.startTicker();
  filter.bind();
  adder.bind();

  confirm.bind(({ type, id }) => {
    if (type === "all") applyClearAll();
    else applyDelete(id);
  });

  render();
}

/* 엔트리 */
export function initApp() {
  if (window.__flowdash_inited) return window.__flowdash_api;
  window.__flowdash_inited = true;
  init();
  window.__flowdash_api = { render };
  return window.__flowdash_api;
}
