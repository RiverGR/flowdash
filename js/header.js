// 상단 카드(테마, 인사말, 닉네임)
export const createHeader = ({ onAfterThemeToggle } = {}) => {
  const $ = (sel) => document.querySelector(sel);

  const greetingEl = $("#greeting");
  const themeBtn = $("#theme-toggle");

  const KEY_THEME = "flowdash-theme";
  const KEY_NAME = "flowdash-nickname";

  let editing = false;

  const getTheme = () => localStorage.getItem(KEY_THEME) || "dark";
  const setTheme = (theme) => {
    localStorage.setItem(KEY_THEME, theme);
    document.documentElement.dataset.theme = theme;
  };
  
  // 다크모드 라이트모드 로직
  const toggleTheme = () => setTheme(getTheme() === "dark" ? "light" : "dark");

  const getName = () => localStorage.getItem(KEY_NAME) || "사용자";
  const setName = (name) => localStorage.setItem(KEY_NAME, name);

  // 닉네임 랜덤 돌리고 조합시키기
  const randomNickname = () => {
    const a = ["푸른", "따뜻한", "빠른", "조용한", "빛나는", "멋진"];
    const b = ["여우", "고양이", "토끼", "곰", "호랑이", "돌고래"];
    return a[Math.floor(Math.random() * a.length)] + b[Math.floor(Math.random() * b.length)];
  };


  // 시간대별로 인사말 변경하기
  const getGreetingText = () => {
    const h = new Date().getHours();
    if (h >= 5 && h < 12) return "좋은 아침이에요";
    if (h >= 12 && h < 18) return "좋은 오후에요";
    return "좋은 저녁이에요";
  };
 

  // 닉네임 관련 수정 및 입력 로직
  const renderGreeting = () => {
    if (!greetingEl || editing) return;

    const name = getName();
    greetingEl.innerHTML = "";

    const span = document.createElement("span");
    span.id = "nickname";
    span.className = "nickname";
    span.tabIndex = 0;
    span.setAttribute("role", "button");
    span.setAttribute("aria-label", "닉네임 수정");
    span.textContent = name;

    greetingEl.append(
      document.createTextNode(`${getGreetingText()}, `),
      span,
      document.createTextNode("님"),
    );
  };

  const openNicknameEditor = () => {
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

    const commit = () => {
      const next = input.value.trim();
      setName(next || prev);
      editing = false;
      renderGreeting();
    };

    const cancel = () => {
      editing = false;
      renderGreeting();
    };

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") commit();
      if (e.key === "Escape") cancel();
    });
    input.addEventListener("blur", commit);
  };

  const bind = () => {
    setTheme(getTheme());

    themeBtn?.addEventListener("click", () => {
      toggleTheme();
      onAfterThemeToggle?.();
    });

    greetingEl?.addEventListener("click", (e) => {
      if (e.target?.id === "nickname") openNicknameEditor();
    });

    greetingEl?.addEventListener("keydown", (e) => {
      if (e.target?.id === "nickname" && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        openNicknameEditor();
      }
    });
  };

  return { bind, renderGreeting };
};
