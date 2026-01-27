// 대시보드 카드(Today, 달성률, 통계)
export const createDashboard = () => {
  const $ = (sel) => document.querySelector(sel);

  // 통계 값 정리 및 값 설정
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

  const pad2 = (n) => String(n).padStart(2, "0");
  const fmtDate = (ms) => {
    const d = new Date(ms);
    return `${d.getFullYear()}. ${pad2(d.getMonth() + 1)}. ${pad2(d.getDate())}`;
  };

  // 오른쪽 상단에 오늘 날짜 표시
  const updateTodayPill = () => {
    if (!todayPill) return;
    todayPill.textContent = fmtDate(Date.now());
  };

  // todo 보드에 개수에 맞게 알맞는 곳에 length 추가
  const render = (todos) => {
    const total = todos.length;
    let cTodo = 0,
      cDoing = 0,
      cDone = 0;
    let high = 0,
      mid = 0,
      low = 0;

    // 이 값이 추가 될 때, 뒤의 있는 값이 1씩 증가하게 구현
    for (const t of todos) {
      if (t.status === "todo") cTodo++;
      else if (t.status === "doing") cDoing++;
      else if (t.status === "done") cDone++;

      if (t.priority === "high") high++;
      else if (t.priority === "mid") mid++;
      else if (t.priority === "low") low++;
    }

    // 최종값 계산
    if (countTotal) countTotal.textContent = String(total);
    if (countTodo) countTodo.textContent = String(cTodo);
    if (countDoing) countDoing.textContent = String(cDoing);
    if (countDone) countDone.textContent = String(cDone);

    if (priHigh) priHigh.textContent = String(high);
    if (priMid) priMid.textContent = String(mid);
    if (priLow) priLow.textContent = String(low);

    // 달성률 계산법(백분율)
    const rate = total === 0 ? 0 : Math.round((cDone / total) * 100);
    if (progressBar) progressBar.style.width = `${rate}%`;
    if (rateText) rateText.textContent = `달성률 ${rate}%`;

    updateTodayPill();
  };

  const startTicker = () => {
    updateTodayPill();
    setInterval(updateTodayPill, 60_000);
  };

  return { render, startTicker };
};
