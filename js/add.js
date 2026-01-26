// 할 일 추가 카드(입력 -> 추가, 전체 삭제 버튼)
export const createAdder = ({ onAdd, onClearAll } = {}) => {
  const $ = (sel) => document.querySelector(sel);

  const inputTitle = $("#todo-input");
  const inputContent = $("#content");
  const inputPriority = $("#priority");
  const inputDue = $("#due-date");
  const btnAdd = $("#add-btn");
  const btnClear = $("#clear-btn");

  // 데이터 수집
  const collect = () => ({
    title: (inputTitle?.value ?? "").trim(),
    content: (inputContent?.value ?? "").trim(),
    priority: inputPriority?.value ?? "mid",
    dueDate: (inputDue?.value ?? "") || null,
  });

  // 입력 필드 초기화
  const reset = () => {
    if (inputTitle) inputTitle.value = "";
    if (inputContent) inputContent.value = "";
    if (inputPriority) inputPriority.value = "mid";
    if (inputDue) inputDue.value = "";
  };

  // 제출 처리
  const submit = () => {
    const data = collect();

    // 제목 필수 검사
    if (!data.title) {
      inputTitle?.focus();
      return;
    }
    onAdd?.(data);
    reset();
  };

  const bind = () => {
    // 추가 버튼 클릭 이벤트
    btnAdd?.addEventListener("click", submit());
    // 엔터 키 입력 이벤트
    inputTitle?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") submit();
    });
    //  전체 삭제 버튼 클릭 이벤트
    btnClear?.addEventListener("click", () => {
      onClearAll?.();
    });
  };
  return { bind };
};
