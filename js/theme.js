// 테마(저장/토글) 전용
export const createTheme = ({ themeBtn, onAfterThemeToggle } = {}) => {
  const KEY_THEME = "flowdash-theme";

  // 테마 값 로컬스토리지 저장
  const getTheme = () => localStorage.getItem(KEY_THEME) || "dark";

  // 로컬스토리지 저장한 값 불러오기
  const setTheme = (theme) => {
    localStorage.setItem(KEY_THEME, theme);
    document.documentElement.dataset.theme = theme;
  };

  // 테마 버튼을 눌렀을 때 설정되는 값 설정(삼항 연산자 사용)
  const toggleTheme = () => setTheme(getTheme() === "dark" ? "light" : "dark");

  // 클릭을 했을 때 로컬스토리지에 있는 테마값 불러오기
  const bind = () => {
    setTheme(getTheme());

    themeBtn?.addEventListener("click", () => {
      toggleTheme();
      onAfterThemeToggle?.();
    });
  };

  return { bind };
};
