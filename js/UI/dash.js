// 대시보드 카드(Today, 달성률, 통계)
export const createDashboard = () => {
  const $ = (sel) => document.querySelector(sel);

  // 통계 대시보드 칸 안에 들어가는 함수들을 설정하고 단축함수로 정리함
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

  // 오른쪽 상단에 현재 날짜를 갱신해서 넣은 함수
  const updateTodayPill = () => {
    if (!todayPill) return;
    todayPill.textContent = fmtDate(Date.now()); // 시간을 포맷해서 텍스트로 넣음(중요)
  };

  // todo 배열에서 값을 받아 통계를 계산하고 화면에 반영하는 함수들
  const render = (todos) => {
    const total = todos.length;
    let cTodo = 0,
      cDoing = 0,
      cDone = 0;
    let high = 0,
      mid = 0,
      low = 0;

    // 모든 할 일들을 순회하며 상태와 우선순위의 카운트를 누적
    for (const t of todos) {
      if (t.status === "todo") cTodo++;
      else if (t.status === "doing") cDoing++;
      else if (t.status === "done") cDone++;

      if (t.priority === "high") high++;
      else if (t.priority === "mid") mid++;
      else if (t.priority === "low") low++;
    }

    // 최종값을 화면에 표시함
    if (countTotal) countTotal.textContent = String(total);
    if (countTodo) countTodo.textContent = String(cTodo);
    if (countDoing) countDoing.textContent = String(cDoing);
    if (countDone) countDone.textContent = String(cDone);

    if (priHigh) priHigh.textContent = String(high);
    if (priMid) priMid.textContent = String(mid);
    if (priLow) priLow.textContent = String(low);

    // 달성률 백분율 계산으로 계산하고, 화면에 표시함(게이지도 같이 차오르게 표시)
    const rate = total === 0 ? 0 : Math.round((cDone / total) * 100);
    if (progressBar) progressBar.style.width = `${rate}%`;
    if (rateText) rateText.textContent = `달성률 ${rate}%`;

    updateTodayPill();
  };

  // 날짜를 주기적으로 갱신하는 타이머(위의 그 날 날짜를 표시해야하는 기능이 있음)
  // 딱 0시가 될 때 바뀔 수 있도록 60초마다 날짜 표시를 다시 갱신하도록 설정
  const startTicker = () => {
    updateTodayPill();
    setInterval(updateTodayPill, 60_000);
  };

  return { render, startTicker };
};
