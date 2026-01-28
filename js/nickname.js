// 닉네임(저장/편집) 전담
// 닉네임 표시와 편집과 저장을 담당하는 모듈 생성하고
// 인삿말의 DOM이 변경 시에 콜백을 옵션으로 받움
export const createNickname = ({ greetingEl, onChange } = {}) => {
  const KEY_NAME = "flowdash-nickname"; // 로컬스토리지에 닉네임을 저장할 때 쓰는 KEY
  let editing = false; // 현재 닉네임이 편집 중인지 상태를 기억하는 플래

  // 저장된 닉네임을 가져오고 없으면 기본값 사용자를 반환
  // 그리고 저장된 닉네임은 로컬스토리지에 저
  const getName = () => localStorage.getItem(KEY_NAME) || "사용자";
  const setName = (name) => localStorage.setItem(KEY_NAME, name);

  // 랜덤 닉네임을 만들기 위한 함수(임의로 수정 가능)
  const randomNickname = () => {
    const a = ["푸른", "따뜻한", "빠른", "조용한", "빛나는", "멋진"];
    const b = ["여우", "고양이", "토끼", "곰", "호랑이", "돌고래"];
    return ( // const a와 b를 랜덤하게 붙여서 반환함
      a[Math.floor(Math.random() * a.length)] +
      b[Math.floor(Math.random() * b.length)]
    );
  };
  
  // 닉네임 영역을 input으로 바꿔서 인라인 요소적으로 편집할 수 있도록 하는 함수
  const openEditor = () => {
    if (!greetingEl || editing) return; // 영역이 없거나, 편집 중이면 중복 실행 막

    // 현재 표시 중인 닉네임을 찾음
    const nickSpan = greetingEl.querySelector("#nickname"); 
    if (!nickSpan) return; // 없으면 편집을 못 여니 종료

    // 편집 모드 전환
    editing = true;
    const prev = nickSpan.textContent.trim(); // 기존 닉네임 저장

    // 닉네임을 수정할 input 요소를 만들고, id 지정, 클래스 지정과 길이 제한 등등의 부수적인 요소들
    const input = document.createElement("input");
    input.id = "nickname-input";
    input.className = "nickname-input";
    input.type = "text";
    input.maxLength = 16;
    input.value = prev;
    input.setAttribute("aria-label", "닉네임 입력");

    // 랜덤 닉네임 버튼 생성, 폼 submit 방지, 버튼 스타일 등등
    const randBtn = document.createElement("button");
    randBtn.type = "button";
    randBtn.className = "btn tiny ghost nickname-rand";
    randBtn.textContent = "랜덤";
    randBtn.title = "랜덤 닉네임";

    // 버튼을 클릭할 때 input 포커스
    randBtn.addEventListener("mousedown", (e) => e.preventDefault());
    randBtn.addEventListener("click", () => {
      input.value = randomNickname(); // 랜덤 닉네임 생성 후 input에 넣음
      input.focus();
    });

    // 기존 닉네임 span을 input으로 교체
    nickSpan.replaceWith(input);
    input.after(randBtn); // input 오른쪽에 랜덤버튼 붙임
    input.focus();
    input.select();

    // 입력 내용을 저장하는 함수
    const commit = () => {
      const next = input.value.trim(); // 입력값을 공백으로 제거해서 얻음
      setName(next || prev); // 입력이 비면은 이전 닉네임 유지, 아님 새 닉네임 저장
      editing = false; // 닉네임 편집 종료
      onChange?.(); // 콜백
    };

    // 닉네임 변경 취소
    const cancel = () => {
      editing = false;
      onChange?.();
    };

    // 키보드 입력 이벤트로 저장과 취소를 처리(저장은 엔터, 취소는 esc)
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") commit();
      if (e.key === "Escape") cancel();
    });
    input.addEventListener("blur", commit); // 만약 바깥의 아무곳이나 클릭을 하면 저장 처리를 하도록 변경
  };

  // 닉네임을 클릭과 키보드로 선택을 했을 때 편집할 수 있도록 이벤트를 붙
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
  
  // 공개 API 반환, 이벤트 바인딩 함수, 편집 중 여부 알려주는 함수, 저장된 닉네임을 가져오는 함수
  return {
    bind,
    isEditing: () => editing,
    getName,
  };
};
