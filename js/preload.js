// 초기 렌더링 전에 접힘 상태를 먼저 적용해서 깜빡임을 방지
(function () {
  try {
    document.documentElement.classList.add("preload");
    const v = localStorage.getItem("flowdash-composer-collapsed");
    if (v === "1") document.documentElement.classList.add("composer-collapsed");
  } catch (e) {}
})();
