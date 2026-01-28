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

  // 가장 촉박한 것부터 정렬
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
  // 삭제 확인 모달을 제어하는 객체를 만드는 함수
  const dom = {
    modal: $("#modal"),
    msg: $("#modal-msg"),
    cancel: $("#modal-cancel"),
    ok: $("#modal-ok"),
  };

  // 사용자가 확인을 누르기 전까지 “어떤 삭제인지” 임시 저장(type/id)
  let pending = null;

  const open = (type, id = null) => {
    // 모달 열기: type=all 또는 one, one이면 id 필요
    pending = { type, id };
    if (dom.msg)
      dom.msg.textContent =
        type === "all"
          ? "정말 삭제하시겠습니까? 초기화 후엔 되돌릴 수 없습니다."
          : "삭제할까요?";
    // hidden 제거로 모달 표시
    dom.modal?.classList.remove("hidden");
  };

  // 모달 닫기
  const close = () => {
    // 삭제 정보 초기화
    pending = null;
    // hidden을 추가함으로 모달을 다시 숨김
    dom.modal?.classList.add("hidden");
  };

  // 확인을 눌렀을 때에 외부 로직을 바로 실행할 수 있도록 콜백을 받음(이벤트 바인딩)
  const bind = (onOk) => {
    dom.cancel?.addEventListener("click", close); // 취소 버튼 클릭함으로 닫기
    dom.modal?.addEventListener("click", (e) => {
      // 배경을 클릭할 때에도 닫을 수 있도록 설정
      if (e.target === dom.modal) close();
    });
    dom.ok?.addEventListener("click", () => {
      if (!pending) return;
      onOk?.(pending); // (type, id)를 로직에 전달
      close();
    });
  };

  return { open, bind }; // 외부에서 open과 bind 함수를 쓸 수 있게 반환하기
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
    // select를 만들고 option을 채우는 함수
    const sel = el("select"); // select 생성
    for (const v of values) {
      // values 배열을 돌며 option 생성
      const opt = document.createElement("option"); // option 생성
      opt.value = v; // 실제로 저장될 값
      opt.textContent = labelMap[v]; // 사용자에게 보여줄 텍스트
      if (v === selected) opt.selected = true;
      sel.append(opt); // select 추가하기
    }
    return sel;
  };

  // 편집 패널 UI(css를 쓰지 않고 js에서 스타일 지정)
  // 이유 : 원래 카드 ui에서 늘어나는 형식으로 바뀌는 것이기 때문에 카드 ui 추가하고, 편집 ui도 추가함
  const buildEditPanel = (todo, handlers) => {
    // 편집 모드를 들어갈 때 카드 내부에 들어갈 편집 UI를 생성하는 함수
    const wrap = el("div", { className: "edit-panel" });

    // 제목 필드(label)
    const titleField = el("label", { className: "field" });
    titleField.append(el("span", { className: "label", text: "제목" }));
    const titleInput = el("input", { type: "text" });
    titleInput.value = todo.title ?? "";
    titleInput.maxLength = 40;
    titleInput.placeholder = "제목 입력";

    titleField.append(titleInput);

    // 상태/우선순위/마감일 한 줄로 묶는 컨테이너
    const row = el("div", { className: "filter-grid" });
    row.style.gridTemplateColumns = "1fr"; // inline 스타일로 레이아웃을 js로 제어하기
    row.style.gap = "10px";

    // 상태 라벨 및 텍스트와 select 생성하기
    const statusField = el("label", { className: "field" });
    statusField.append(el("span", { className: "label", text: "상태" }));
    const statusSel = buildSelect(
      ["todo", "doing", "done"],
      todo.status,
      STATUS_LABEL,
    );
    statusField.append(statusSel);

    // 우선순위 라벨 select 생성하기
    const priField = el("label", { className: "field" });
    priField.append(el("span", { className: "label", text: "우선순위" }));
    const priSel = buildSelect(
      ["high", "mid", "low"],
      todo.priority,
      PRIORITY_LABEL,
    );
    priField.append(priSel);

    // 마감일 라벨 select 생성하기
    const dueField = el("label", { className: "field" });
    dueField.append(el("span", { className: "label", text: "마감일" }));
    const dueInput = el("input", { type: "date" });

    dueInput.min = new Date().toISOString().slice(0, 10); // 그 당일보다 전 날짜는 선택하지 못하게 제한함.

    const max = new Date(); // 최대 날짜를 설정
    max.setFullYear(max.getFullYear() + 1);
    dueInput.max = max.toISOString().slice(0, 10);

    dueInput.value = todo.dueDate ?? ""; // 기존 마감을 표시
    dueField.append(dueInput); // label에 date input을 추가함

    row.append(statusField, priField, dueField); // 위의 라벨들을 전부 한 줄로 배치

    // 내용 관련 라벨 및 텍스트 필드
    const contentField = el("label", { className: "field" });
    contentField.append(el("span", { className: "label", text: "내용(옵션)" }));
    const ta = el("textarea");
    ta.rows = 3;
    ta.placeholder = "내용 입력(옵션)";
    ta.value = todo.content ?? "";
    contentField.append(ta);

    // 편집 패널 버튼 영역들
    const actions = el("div", { className: "todo-actions" });

    // 취소 버튼
    const btnCancel = el("button", {
      className: "btn tiny ghost",
      text: "취소",
    });
    btnCancel.type = "button";
    btnCancel.addEventListener("click", () => handlers.setEditing(null));

    // 저장 버튼
    const btnSave = el("button", {
      className: "btn tiny primary",
      text: "저장",
    });
    btnSave.type = "button"; // submit 방지하기
    btnSave.addEventListener("click", () => {
      // 클릭 할 때 입력값을 패치로 만들어 저장하기
      const nextTitle = titleInput.value.trim();
      handlers.saveEdit(todo.id, {
        // 해당 id의 todo를 업데이트하기
        title: nextTitle || todo.title,
        status: statusSel.value,
        priority: priSel.value,
        content: ta.value,
        dueDate: dueInput.value || null, // 마감일이 없을 경우는 null로 설정(에러 방지)
      });
    });

    actions.append(btnCancel, btnSave); // 버튼 영역에 취소와 저장 버튼을 추가
    wrap.append(titleField, row, contentField, actions);
    return wrap;
  };

  // 카드 UI(편집 값을 위해 ui 설정)
  const buildCard = (todo, editingId, handlers) => {
    // 단일로 할 일 카드 ui를 생성하기
    const card = el("div", { className: "todo-card" }); // 카드 컨테이너
    if (todo.status === "done") card.classList.add("is-done");
    card.dataset.id = todo.id;

    // 카드 상단 영역(제목)
    const top = el("div", { className: "todo-top" });

    // 제목을 표시하게 해주는 컨테이너
    const title = el("div", { className: "todo-title", text: todo.title });
    top.append(title); // 제목 추가

    // 뱃지 묶음 (우선순위, 상태, 마감일)
    const badges = el("div", { className: "todo-badges" });
    badges.append(makeBadge(PRIORITY_LABEL[todo.priority] ?? "중간"));
    badges.append(makeBadge(STATUS_LABEL[todo.status] ?? "시작 전", true));
    if (todo.dueDate) badges.append(makeBadge(`마감 ${todo.dueDate}`, true));
    top.append(badges);

    // 내용 영역(있으면 표시하고, 없으면 놔두기)
    const meta = el("div", { className: "todo-meta" });
    if (todo.content) meta.textContent = todo.content;
    card.append(top, meta);

    // 카드 하단에 있는 버튼 영역
    const actions = el("div", { className: "todo-actions" });

    if (editingId === todo.id) {
      // 카드를 편집하고 있으면 편집 패널을 띄우고 있게 표시
      actions.append(buildEditPanel(todo, handlers));
    } else {
      // 편집 중이 아니면 편집 버튼을 띄우기
      const btnEdit = el("button", {
        className: "btn tiny ghost",
        text: "편집",
      });
      btnEdit.type = "button";
      btnEdit.addEventListener("click", () => handlers.setEditing(todo.id));
      // 삭제 버튼 띄우는 중
      const btnDel = el("button", {
        className: "btn tiny danger",
        text: "삭제",
      });
      btnDel.type = "button";
      // 삭제 버튼을 눌면 삭제 모달을 열도록 요청을 함
      btnDel.addEventListener("click", () => handlers.deleteOne(todo.id));

      actions.append(btnEdit, btnDel);
    }

    card.append(actions);
    return card;
  };

  // 보드 렌더(없으면 할 일을 저장해도 TODO BOARD에 추가가 안됨)
  const render = (todos, editingId, handlers) => {
    // 리스트(todo, doing, done)에다가 카드를 다시 랜더링
    if (!listTodo || !listDoing || !listDone) return; // DOM이 없으면 종료하기

    // 각 상태를 따로 분리함
    const todoArr = todos.filter((t) => t.status === "todo");
    const doingArr = todos.filter((t) => t.status === "doing");
    const doneArr = todos.filter((t) => t.status === "done");

    // 각 상태의 개수를 즉시 업데이트 함
    if (laneCountTodo) laneCountTodo.textContent = String(todoArr.length);
    if (laneCountDoing) laneCountDoing.textContent = String(doingArr.length);
    if (laneCountDone) laneCountDone.textContent = String(doneArr.length);

    // 기존에 있던 상태 카드들을 제거한다.
    clearNode(listTodo);
    clearNode(listDoing);
    clearNode(listDone);

    // 사용자가 카드를 추가하면 알맞은 카드 부분에 카드를 추가한다.
    for (const t of todoArr) listTodo.append(buildCard(t, editingId, handlers));
    for (const t of doingArr)
      listDoing.append(buildCard(t, editingId, handlers));
    for (const t of doneArr) listDone.append(buildCard(t, editingId, handlers));
  };

  // 외부 영역에서 render를 호출을 할 수 있게 반환한다.
  return { render };
};

/* 앱 상태 */
// 앱이 관리하는 모든 할 일 데이터의 원본을 가지고 있고
// 현재 편집 중인 카드의 id를 가지고 있는다.(없으면 null 상태)
let todos = [];
let editingId = null;

/* 모듈 생성 */
// 헤더, 대시보드, 필터, 추가할 때의 폼, 보드, 삭제 할 때 확인 인스턴트를 생성한다.
const header = createHeader();
const dashboard = createDashboard();
const filter = createFilter({ onChange: () => render() }); // 여기선 변경할 때마다 render를 재실행 한다.
const adder = createAdder({
  // 모듈 생성도 생성이지만 이벤트를 연결하는 역할도 받는다.
  onAdd: (data) => addTodo(data),
  onClearAll: () => confirm.open("all"),
});
const board = createBoard();
const confirm = createConfirmModal();

/* 데이터 관리 */
const makeId = () =>
  // todo의 고유 id를 만든다. // 만약 브라우저가 지원하면 randomUUID를 사용할 수 있게 한다.
  crypto?.randomUUID?.() ??
  String(Date.now()) + Math.random().toString(16).slice(2); // 지원을 하지 않으면 시간과 난수로 대체한다.

function addTodo({ title, content, priority, dueDate }) {
  // 새 할 일을 추가하는 함수
  const now = Date.now(); // 생성, 수정 시간을 동일하게 넣기 위해서 현재 시간을 저장한다.
  todos.unshift({
    // 새 항목을 배열 맨 앞에 넣어서 최신이 위로 오게 한다.
    id: makeId(), // id 값을 불러온걸 적용한다.
    title,
    content: content || "", // 내용(없으면 빈 문자열)
    priority: priority || "mid", // 우선 순위(없으면 mid가 기본)
    dueDate: dueDate || null, // 마감일(없으면 null 처리)
    status: "todo",
    createdAt: now, // 생성과 밑의 수정 시간은 기존엔 있었으나, 후에 업데이트 이후 추가할 예정으로
    updatedAt: now, // 미래 대비용 코드로 코드 작성에는 삭제하지 않고 남겨놓음
  });

  saveTodos(todos); // 로컬스토리지 저장
  render(); // 화면을 다시 갱신
}
// 특정 할 일을 삭제하는 함수
function applyDelete(id) {
  todos = todos.filter((t) => t.id !== id); // 삭제할 id만 제외하고 다시 저장
  if (editingId === id) editingId = null; // 삭제한 항목이 편집 중이면 편집 상태를 해제
  saveTodos(todos);
  render();
}

// 모든 할 일을 삭제하는 함수
function applyClearAll() {
  todos = []; // todos 목록 초기화
  editingId = null; // 편집 상태도 초기화
  saveTodos(todos); // 로컬스토리지 반영
  render();
}

// 편집 내용(패치)을 저장하는 함수
function saveEdit(id, patch) {
  const idx = todos.findIndex((t) => t.id === id); // 수정할 항목의 id를 찾음
  if (idx === -1) return; // 없으면 종료

  const now = Date.now(); // 미래 대비용 코드(수정 시간 갱신)
  todos[idx] = {
    // 기존 todo에 패치를 덮어씌워서 업데이트 하는 방식으로 만듦.
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
// 앱 전체 화면을 다시 만드는 함수(중요)
function render() {
  header.renderGreeting(); // 인삿말, 테마, 닉네임[ 등을 렌더
  dashboard.render(todos); // 대시보드 렌더

  // 현재 필터에 UI 입력값을 읽어서 객체로 만듦
  const view = filter.readViewFromInputs();
  // 원본 todos의 필터/정렬을 적용한 결과로 만든다.
  const viewTodos = filter.getViewTodos(todos, view);

  // 필터가 적용된 목록을 보드에 렌더
  board.render(viewTodos, editingId, {
    setEditing: (id) => {
      // 편집 시작/종료 핸들러
      editingId = id;
      render();
    },
    saveEdit,
    // 삭제 버튼 누르면 단일 삭제 확인 모달 띄우기
    deleteOne: (id) => confirm.open("one", id),
  });
  // 마감일 경고 배너는 전체 원본 기준으로 계산해서 표시
  renderDueAlert(todos);
}

/* 초기화 */
// 최초 실행 시에 한 번만 수행되는 초기화 로직을 생성
function init() {
  todos = loadTodos(); // 로컬스토리지에서 이전에 저장된 값들을 불러옴

  // 헤더, 필터, 추가 폼 이벤트 바인딩
  header.bind();
  dashboard.startTicker(); // 대시보드의 타이머/시계 같은 주기 작업을 시작함
  filter.bind();
  adder.bind();

  // 모달에서 확인을 눌렀을 때 실행할 실제 삭제 처리를 연결함
  confirm.bind(({ type, id }) => {
    if (type === "all")
      applyClearAll(); // 전체 삭제면 완전 초기화
    else applyDelete(id); // 단일 삭제면 해당 id만 삭제
  });

  render();
}

/* 엔트리 */
// 외부에서 호출하는 앱 시작 함수(entry.js)
export function initApp() {
  // 이미 초기화가 되었다면 기존 API를 반환함
  if (window.__flowdash_inited) return window.__flowdash_api;
  window.__flowdash_inited = true; // 초기화 완료
  init(); // 수행
  window.__flowdash_api = { render }; // 외부에서 render를 다시 호출할 수 있도록 API를 노출시킴
  return window.__flowdash_api; // 반환
}
