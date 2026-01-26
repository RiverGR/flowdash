import { createHeader } from "./Header.js";
import { createDashboard } from "./dash.js";
import { createFilter } from "./filter.js";
import { createAdder } from "./add.js";

/* TODO BOARD 카드 + 앱 전체 조립(엔트리) */

const PRIORITY_LABEL = { high: "높음", mid: "중간", low: "낮음" };
const STATUS_LABEL = { todo: "시작 전", doing: "진행중", done: "완료" };

const KEY_TODOS = "flowdash-todos";

const $ = (sel, root = document) => root.querySelector(sel);

const el = (tag, { className, text, type } = {}) => {
  const n = document.createElement(tag);
  if (className) n.className = className;
  if (text != null) n.textContent = text;
  if (type) n.type = type;
  return n;
};

const clearNode = (node) => {
  if (!node) return;
  node.innerHTML = "";
};

const makeBadge = (text, dim = false) => {
  const b = el("span", { className: "badge", text });
  if (dim) b.classList.add("dim");
  return b;
};

const loadTodos = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY_TODOS) || "[]");
  } catch {
    return [];
  }
};

const saveTodos = (todos) => {
  localStorage.setItem(KEY_TODOS, JSON.stringify(todos));
};

const parseYMD = (s) => {
  if (!s) return null;
  const d = new Date(s + "T00:00:00");
  return Number.isNaN(d.getTime()) ? null : d.getTime();
};

const daysLeftByYMD = (ymd) => {
  const dueAt = parseYMD(ymd);
  if (dueAt == null) return null;
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.ceil((dueAt - Date.now()) / oneDay);
};

const renderDueAlert = (todos) => {
  const el = document.querySelector("#due-alert");
  if (!el) return;

  const candidates = todos
    .filter((t) => t.status !== "done" && t.dueDate)
    .map((t) => ({ ...t, left: daysLeftByYMD(t.dueDate) }))
    .filter((t) => typeof t.left === "number");

  if (!candidates.length) {
    el.textContent = "";
    el.className = "due-alert";
    return;
  }

  candidates.sort((a, b) => a.left - b.left);
  const top = candidates[0];

  if (top.left < 0) {
    el.textContent = `마감일이 지난 일이 있어요. (${candidates.filter((t) => t.left < 0).length}건)`;
    el.className = "due-alert due-alert--danger";
    return;
  }

  if (top.left === 0) {
    el.textContent = `오늘 마감인 일이 있어요: "${top.title}"`;
    el.className = "due-alert due-alert--warn";
    return;
  }

  if (top.left === 1) {
    el.textContent = `이 일의 마감일이 하루 남았습니다: "${top.title}"`;
    el.className = "due-alert due-alert--warn";
    return;
  }

  el.textContent = `가장 임박한 마감: ${top.left}일 남음 ("${top.title}")`;
  el.className = "due-alert";
};

const createConfirmModal = () => {
  const dom = {
    modal: $("#modal"),
    msg: $("#modal-msg"),
    cancel: $("#modal-cancel"),
    ok: $("#modal-ok"),
  };

  let pending = null;

  const open = (type, id = null) => {
    pending = { type, id };
    if (dom.msg)
      dom.msg.textContent = type === "all" ? "전체 삭제할까요?" : "삭제할까요?";
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

const createBoard = () => {
  const laneCountTodo = $("#lane-count-todo");
  const laneCountDoing = $("#lane-count-doing");
  const laneCountDone = $("#lane-count-done");

  const listTodo = $("#list-todo");
  const listDoing = $("#list-doing");
  const listDone = $("#list-done");

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

  const buildEditPanel = (todo, handlers) => {
    const wrap = el("div", { className: "edit-panel" });

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
      handlers.saveEdit(todo.id, {
        status: statusSel.value,
        priority: priSel.value,
        content: ta.value,
        dueDate: dueInput.value || null,
      });
    });

    actions.append(btnCancel, btnSave);
    wrap.append(row, contentField, actions);
    return wrap;
  };

  const buildCard = (todo, editingId, handlers) => {
    const card = el("div", { className: "todo-card" });
    if (todo.status === "done") card.classList.add("is-done");
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

const header = createHeader();
const dashboard = createDashboard();
const filter = createFilter({ onChange: () => render() });
const adder = createAdder({
  onAdd: (data) => addTodo(data),
  onClearAll: () => confirm.open("all"),
});
const board = createBoard();
const confirm = createConfirmModal();

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

init();
