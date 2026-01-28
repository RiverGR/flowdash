// 닉네임 : 인삿말과 같이 있기 때문에 같이 값을 불러오기 위해서 import를 해놨음
import { createNickname } from "./nickname.js";
import { createTheme } from "./theme.js";

// 헤더 UI 모듈 생성 함수, 테마를 변경할 때는 콜백을 옵션으로 받음
export const createHeader = ({ onAfterThemeToggle } = {}) => {
  const $ = (sel) => document.querySelector(sel);

  // 인삿말, 닉네임, 테마 버튼 영역의 DOM 요소를 잡음
  const greetingEl = $("#greeting");
  const themeBtn = $("#theme-toggle");

  // 현재 시간대에 따라 다른 인삿말을 반환하는 함수
  const getGreetingText = () => {
    const h = new Date().getHours(); // 햔제 시각의 시(hour)만 값을 가져온다.
    // 일정 시간마다 인삿말이 바뀌게 조건문을 사용하여 설정해준다.
    if (h >= 5 && h < 12) return "좋은 아침이에요";
    if (h >= 12 && h < 18) return "좋은 오후에요";
    return "좋은 저녁이에요";
  };

  // 닉네임 모듈 생성, 헤더와 연결하기
  // 닉네임 모듈 영역이 인삿말과 상호작용 할 수 있게 DOM 전달
  const nickname = createNickname({
    greetingEl,
    onChange: () => renderGreeting(), // 닉네임이 바뀌면 헤더 문구를 다시 렌더링
  });

  // 테마 모듈 생성과 토글 버튼, 콜백을 전달
  const theme = createTheme({ themeBtn, onAfterThemeToggle });

  // 인삿말과 닉네임을 greetingEL에 그려주는 함수
  const renderGreeting = () => {
    if (!greetingEl || nickname.isEditing()) return;
    // 저장된 닉네임 값 가져오기, 기본 내용을 전부 비운 후 새로 렌더링할 준비만 함
    const name = nickname.getName();
    greetingEl.innerHTML = "";

    // 닉네임 부분만 클릭하여 바꿀 수 있게 span으로 만든고 id 부여
    // 스타일 적용을 위해서 클래스 또한 지정한다.
    const span = document.createElement("span");
    span.id = "nickname";
    span.className = "nickname";
    span.tabIndex = 0;
    span.setAttribute("role", "button");
    span.setAttribute("aria-label", "닉네임 수정");
    span.textContent = name;

    // 닉네임 뒤에 "님"을 추가하는 요소
    greetingEl.append(
      document.createTextNode(`${getGreetingText()}, `),
      span,
      document.createTextNode("님"),
    );
  };

  // 헤더에서 필요한 이벤트(테마 토글과 닉네임 편집 등등)을 연결하는 함수
  const bind = () => {
    theme.bind();
    nickname.bind();
  };

  return { bind, renderGreeting };
};
