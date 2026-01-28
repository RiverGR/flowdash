// 즉시 실행 함수이며, 파일이 로드되자마자 바로 실행되게 함
// 로컬스토리지 접근 오류 고려하여 화면이 깨지지 않게 try-catch로 잡음
(function () {
  try {
    document.documentElement.classList.add("preload");
    const v = localStorage.getItem("flowdash-composer-collapsed"); // 할 일 추가의 카드의 접힘 상태의 저장한 값을 로컬스토리지에서 읽어옴(add.js 참고)
    if (v === "1") document.documentElement.classList.add("composer-collapsed"); // 저장값이 1일 경우에 처음부터 접힌 상태의 클래스를 적용하여 애니메이션 오류 없이 렌더링
  } catch (e) {} // 예외가 나면 아무 처리 없이 넘어가서 앱 실행을 막지 않게 실행
})();
