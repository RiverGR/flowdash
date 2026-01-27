// 닉네임(저장/편집) 전담
export const createNickname = ({ greetingEl, onChange } = {}) => {
  const KEY_NAME = "flowdash-nickname";
  let editing = false;

  // 로컬스토리지 값
  const getName = () => localStorage.getItem(KEY_NAME) || "사용자";
  const setName = (name) => localStorage.setItem(KEY_NAME, name);

  // 랜덤한 닉네임 설정할 때 랜덤한 닉네임 값들
  const randomNickname = () => {
    const a = ["푸른", "따뜻한", "빠른", "조용한", "빛나는", "멋진"];
    const b = ["여우", "고양이", "토끼", "곰", "호랑이", "돌고래"];
    return (
      a[Math.floor(Math.random() * a.length)] +
      b[Math.floor(Math.random() * b.length)]
    );
  };

  // 인삿말 + 닉네임 조합하기
  // 닉네임을 클릭했을 때 인라인 요소로 수정할 수 있도록 변경
  // 닉네임 수정칸 오른쪽에 랜덤 버튼 생성 : 랜덤 닉네임이 나오게 됨.
  const openEditor = () => {
    if (!greetingEl || editing) return;

    const nickSpan = greetingEl.querySelector("#nickname");
    if (!nickSpan) return;

    editing = true;
    const prev = nickSpan.textContent.trim();

    const input = document.createElement("input");
    input.id = "nickname-input";
    input.className = "nickname-input";
    input.type = "text";
    input.maxLength = 16;
    input.value = prev;
    input.setAttribute("aria-label", "닉네임 입력");

    const randBtn = document.createElement("button");
    randBtn.type = "button";
    randBtn.className = "btn tiny ghost nickname-rand";
    randBtn.textContent = "랜덤";
    randBtn.title = "랜덤 닉네임";

    randBtn.addEventListener("mousedown", (e) => e.preventDefault());
    randBtn.addEventListener("click", () => {
      input.value = randomNickname();
      input.focus();
    });

    nickSpan.replaceWith(input);
    input.after(randBtn);
    input.focus();
    input.select();

    // 닉네임 저장 값
    const commit = () => {
      const next = input.value.trim();
      setName(next || prev);
      editing = false;
      onChange?.();
    };

    // 닉네임 변경 취소하기
    const cancel = () => {
      editing = false;
      onChange?.();
    };

    // 닉네임 변경 및 취소할 때의 이벤트(어떤 걸 하면 변경 및 취소되는지)
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") commit();
      if (e.key === "Escape") cancel();
    });
    input.addEventListener("blur", commit);
  };

  // 닉네임 변경하고 싶을 때 어떤 키를 눌러야 되는지(현재 값 : 클릭)
  // 저장할 때는 어떤 키를 눌러야 하는지(현재 값 : 엔터)
  const bind = () => {
    greetingEl?.addEventListener("click", (e) => {
      if (e.target?.id === "nickname") openEditor();
    });

    greetingEl?.addEventListener("keydown", (e) => {
      if (e.target?.id === "nickname" && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        openEditor();
      }
    });
  };

  return {
    bind,
    isEditing: () => editing,
    getName,
  };
};
