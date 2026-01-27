import { ensureBoot } from "./entry.js";
// 할 일 추가 카드(입력 -> 추가, 전체 삭제 버튼)
export const createAdder = ({ onAdd, onClearAll } = {}) => {
  const $ = (sel) => document.querySelector(sel);

  // 할 일 추가 카드의 입력값 설정
  const inputTitle = $("#todo-input");
  const inputContent = $("#content");
  const inputPriority = $("#priority");
  const inputDue = $("#due-date");
  const btnAdd = $("#add-btn");
  const btnClear = $("#clear-btn");

  // 할 일 추가 카드 접기/펼치기
  const composerCard = document.querySelector(".composer");
  const toggleBtn = $("#composer-toggle");
  const composerBody = $("#composer-body");
  const KEY_COMPOSER = "flowdash-composer-collapsed";

  const setCollapsed = (collapsed) => {
    if (!composerCard || !toggleBtn || !composerBody) return;

    // 카드/아이콘 상태
    composerCard.classList.toggle("collapsed", collapsed);
    toggleBtn.setAttribute("aria-expanded", String(!collapsed));

    // 새로고침 깜빡임 방지를 위해 <html>에도 동일한 상태를 반영
    document.documentElement.classList.toggle("composer-collapsed", collapsed);

    try {
      localStorage.setItem(KEY_COMPOSER, collapsed ? "1" : "0");
    } catch {}

    if (!collapsed) inputTitle?.focus();
  };

  // 저장된 상태 복원
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

  // 기본값
  const collect = () => ({
    title: (inputTitle?.value ?? "").trim(),
    content: (inputContent?.value ?? "").trim(),
    priority: inputPriority?.value ?? "mid",
    dueDate: (inputDue?.value ?? "") || null,
  });

  // 할 일이 저장되거나, 다시 초기화를 해야할 때 설정값
  const reset = () => {
    if (inputTitle) inputTitle.value = "";
    if (inputContent) inputContent.value = "";
    if (inputPriority) inputPriority.value = "mid";
    if (inputDue) inputDue.value = "";
  };

  // 할 일이 저장되고 나서 다시 리셋
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
    restore();
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

// 첫 프레임 이후 트랜지션 활성화
requestAnimationFrame(() => {
  document.documentElement.classList.remove("preload");
});
