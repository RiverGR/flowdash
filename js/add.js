import { ensureBoot } from "./entry.js";
// 카드를 추가할 때 모듈 생성
export const createAdder = ({ onAdd, onClearAll } = {}) => {
  const $ = (sel) => document.querySelector(sel); // querySelector 단축 함수

  // 할 일 추가 카드의 각각의 요소를 만듦
  const inputTitle = $("#todo-input");
  const inputContent = $("#content");
  const inputPriority = $("#priority");
  const inputDue = $("#due-date");
  const btnAdd = $("#add-btn");
  const btnClear = $("#clear-btn");

  // // 카드 전체 컨테이터(composer)
  const composerCard = document.querySelector(".composer");
  // 접기 / 펼치기 토글 버튼 + 대상이 되는 할 일 추가 카드를 영역으로 잡음
  const toggleBtn = $("#composer-toggle");
  const composerBody = $("#composer-body");
  const KEY_COMPOSER = "flowdash-composer-collapsed"; // 접힘 상태일 때를 로컬스토리지로 저장할 때 key

  // 카드를 펼치고 접을 때를 DOM과 저장소에 반영하는 함수
  const setCollapsed = (collapsed) => {
    if (!composerCard || !toggleBtn || !composerBody) return; // 만약 필요한 요소가 아예 없으면 아무것도 하지 않도록 설정

    // 카드/아이콘 상태
    // collapsed 클래스가 있는지 없는지로 카드 접힘 상태를 표현
    composerCard.classList.toggle("collapsed", collapsed);
    // 접근성 속성을 사용함으로 현재 펼쳐짐 여부를 반영
    toggleBtn.setAttribute("aria-expanded", String(!collapsed));

    // 새로고침 깜빡임 방지를 위해 preload.js에도 동일한 상태를 반영
    // preload.js에 있는 상태 클래스를 걸어서 초기 프레임 스타일을 맞춤
    document.documentElement.classList.toggle("composer-collapsed", collapsed);
    // 접힘 상태를 로컬스토리지에 저장해서 새로고침 후 유지 될 수 있
    try {
      localStorage.setItem(KEY_COMPOSER, collapsed ? "1" : "0");
    } catch {}

    if (!collapsed) inputTitle?.focus(); // 펼쳤을 때 바로 제목 입력에 포커스를 줘서 입력을 편하게 해줌(접근성 설정)
  };

  // 저장된 상태 복원
  // 로컬스토리지에 저장된 접힘 상태를 읽고 UI에 적용, 토클 버튼 이벤트 연결
  // 저장 값이 1이면 접힘, 그게 아니면(0일 때) 펼침
  const restore = () => {
    if (!composerCard || !toggleBtn || !composerBody) return;
    let collapsed = false;
    try {
      collapsed = localStorage.getItem(KEY_COMPOSER) === "1";
    } catch {}
    setCollapsed(collapsed);

    toggleBtn.addEventListener("click", () => {
      const next = !composerCard.classList.contains("collapsed");
      setCollapsed(next);
    });
  };

  // 기본값(현재 입력 폼의 값을 모아서 추가할 데이터의 객체로 만드는 함수)
  // 사용자가 화면을 딱 켰을 때 할 일 추가에 기본적으로 설정되어 있는 기본값
  const collect = () => ({
    title: (inputTitle?.value ?? "").trim(),
    content: (inputContent?.value ?? "").trim(),
    priority: inputPriority?.value ?? "mid",
    dueDate: (inputDue?.value ?? "") || null,
  });

  // 사용자가 할 일 추가 카드를 사용하고 난 후 다시 폼을 기본 상태로 되돌릴 때 실행되는 함수
  const reset = () => {
    if (inputTitle) inputTitle.value = "";
    if (inputContent) inputContent.value = "";
    if (inputPriority) inputPriority.value = "mid";
    if (inputDue) inputDue.value = "";
  };

  // 추가 버튼/엔더로 제출 처리를 할 수 있게 하는 함수
  const submit = () => {
    const data = collect();
    if (!data.title) {
      inputTitle?.focus();
      return;
    }
    onAdd?.(data);
    reset();
  };

  // 할 일 추가 이벤트 리스트(클릭과 엔터로 동작하게 설정)
  const bind = () => {
    restore(); // 저장된 접힘/펼침 상태를 복원, 토글 이벤트 연결
    btnAdd?.addEventListener("click", submit);

    inputTitle?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") submit();
    });

    btnClear?.addEventListener("click", () => {
      onClearAll?.();
    });
  };

  return { bind };
};

// 첫 초기 프레임의 렌더가 끝난 뒤 한 번 실행되도록 미리 예약
requestAnimationFrame(() => {
  // preload 클래스를 제거하여 트랜지션과 애니매이션이 정상적으로 적용되게 하는 함수
  document.documentElement.classList.remove("preload");
});
