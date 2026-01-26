// 대시보드 카드(Today, 달성률, 통계)
export const createDashboard = () => {
  const $ = (sel) => document.querySelector(sel);

  const todayPill = $("#today-pill");
  const progressBar = $("#progress-bar");
  const rateText = $("#rate-text");

  const priHigh = $("#pri-high");
  const priMid = $("#pri-mid");
  const priLow = $("#pri-low");

  const countTotal = $("#count-total");
  const countTodo = $("#count-todo");
  const countDoing = $("#count-doing");
  const countDone = $("#count-done");
  // 날짜 포맷터
  const pad2 = (n) => String(n).padStart(2, "0");

  // YYYY. MM. DD 형식으로 변환
  const fmtDate = (ms) => {
    const d = new Date(ms);
    return `${d.getFullYear()}. ${pad2(d.getMonth() + 1)}. ${pad2(d.getDate())}`;
  };

  // 오늘 날짜 업데이트
  const updateTodayPill = () => {
    if (!todayPill) return;
    todayPill.textContent = fmtDate(Date.now());
  };
  // 대시보드 렌더링
  const render = (todos) => {
    const total = todos.length;
    let cTodo = 0,
      cDoing = 0,
      cDone = 0;
    let high = 0,
      mid = 0,
      low = 0;

    // 상태별, 우선순위별 개수 집계
    for (const t of todos) {
      if (t.status === "todo") cTodo++;
      else if (t.status === "doing") cDoing++;
      else if (t.status === "done") cDone++;

      if (t.priority === "high") high++;
      else if (t.priority === "mid") mid++;
      else if (t.priority === "low") low++;
    }

    // 통계 정보 업데이트
    if (countTotal) countTotal.textContent = String(total);
    if (countTodo) countTodo.textContent = String(cTodo);
    if (countDoing) countDoing.textContent = String(cDoing);
    if (countDone) countDone.textContent = String(cDone);

    if (priHigh) priHigh.textContent = String(high);
    if (priMid) priMid.textContent = String(mid);
    if (priLow) priLow.textContent = String(low);

    // 달성률 계산 및 프로그레스 바 업데이트
    const rate = total === 0 ? 0 : Math.round((cDone / total) * 100);
    if (progressBar) progressBar.style.width = `${rate}%`;
    if (rateText) rateText.textContent = `달성률 ${rate}%`;

    updateTodayPill();
  };

  // 오늘 날짜 갱신 타이커 시작
  const startTicker = () => {
    updateTodayPill();
    setInterval(updateTodayPill, 60_000);
  };

  return { render, startTicker };
};
