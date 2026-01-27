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
