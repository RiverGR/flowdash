// 테마 상태를 관리, 테마 전환 버튼을 연결하는 모듈 생성 함수
export const createTheme = ({ themeBtn, onAfterThemeToggle } = {}) => {
  const KEY_THEME = "flowdash-theme"; // 로컬스토리지에서 테마 값을 저장할 때 사용할 Key

  // 저장된 테마를 가져오고 없으면 기본값 dark로 설정
  const getTheme = () => localStorage.getItem(KEY_THEME) || "light";

  // 테마의 값을 저장하고 화면에 즉시 반영하는 함수
  const setTheme = (theme) => {
    localStorage.setItem(KEY_THEME, theme); // 저장한 값을 로컬스토리지에 저장
    document.documentElement.dataset.theme = theme; // css에서도 활용할 수 있게 테마를 설정
  };

  // 테마 버튼을 눌렀을 때 설정되는 값 설정(삼항 연산자 사용)
  // 현재 테마가 dark면 light로 아니면 기본값은 dark로 전환
  const toggleTheme = () => setTheme(getTheme() === "light" ? "dark" : "light");

  // 테마 관련 이벤트를 연결하고 초기 테마를 적용하는 함수(dark 테마가 기본값)
  const bind = () => {
    setTheme(getTheme()); // 앱을 시작할 때 저장된 테마 값을 불러와서 적용

    // 테마 토글 버튼 클릭 이벤트 관리
    themeBtn?.addEventListener("click", () => {
      toggleTheme(); // 테마 반전
      onAfterThemeToggle?.(); // 추가로 실행할 콜백이 있으면 호출
    });
  };

  return { bind }; // 외부에서 bind를 호출해서 테마 기능을 활성화 할 수 있게 반환
};
