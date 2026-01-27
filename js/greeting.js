// 닉네임 : 인삿말과 같이 있기 때문에 같이 값을 불러오기 위해서 import를 해놨음
import { createNickname } from "./nickname.js";
import { createTheme } from "./theme.js";

// 상단 카드(테마, 인사말, 닉네임)
export const createHeader = ({ onAfterThemeToggle } = {}) => {
  const $ = (sel) => document.querySelector(sel);

  const greetingEl = $("#greeting");
  const themeBtn = $("#theme-toggle");

  // 인삿말(시간대별)은 header.js에 유지
  const getGreetingText = () => {
    const h = new Date().getHours();
    if (h >= 5 && h < 12) return "좋은 아침이에요";
    if (h >= 12 && h < 18) return "좋은 오후에요";
    return "좋은 저녁이에요";
  };

  const nickname = createNickname({
    greetingEl,
    onChange: () => renderGreeting(),
  });

  const theme = createTheme({ themeBtn, onAfterThemeToggle });

  // 닉네임 값 불러오고 렌더(랜덤 닉네임까지 추가)
  const renderGreeting = () => {
    if (!greetingEl || nickname.isEditing()) return;

    const name = nickname.getName();
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

  const bind = () => {
    theme.bind();
    nickname.bind();
  };

  return { bind, renderGreeting };
};
