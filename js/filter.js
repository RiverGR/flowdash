// 검색/필터/정렬 카드
export const createFilter = ({ onChange } = {}) => {
  const $ = (sel) => document.querySelector(sel);

  // 검색, 필터, 정렬 값 설정
  const search = $("#search");
  const period = $("#period");
  const status = $("#filter");
  const sort = $("#sort");

  // 마감일 순으로 검색을 하기 위해 현재 시간 불러오기
  const parseYMD = (s) => {
    if (!s) return null;
    const d = new Date(s + "T00:00:00");
    return Number.isNaN(d.getTime()) ? null : d.getTime();
  };

  // 시간 계산 및 계산 값 변수에 넣기
  const dueLeft = (dueDate) => {
    const dueAt = parseYMD(dueDate);
    if (dueAt == null) return null;
    const oneDay = 24 * 60 * 60 * 1000;
    return Math.ceil((dueAt - Date.now()) / oneDay);
  };

  // 시간 계산 후 알맞게 조건문으로 시간 남은 순으로 찾을 수 있게 설정
  const withinPeriod = (todo, periodKey) => {
    if (periodKey === "all") return true;

    const left = dueLeft(todo.dueDate);
    if (left == null) return false;

    if (periodKey === "overdue") return left < 0;
    if (periodKey === "due_today") return left === 0;
    if (periodKey === "due_3") return left >= 0 && left <= 3;
    if (periodKey === "due_7") return left >= 0 && left <= 7;
    if (periodKey === "due_15") return left >= 0 && left <= 15;
    if (periodKey === "due_16p") return left >= 16;
    return true;
  };

  // 체이닝 메서드로 각각 정렬값을 알맞게 불러오기
  const readViewFromInputs = () => ({
    q: (search?.value ?? "").trim().toLowerCase(),
    period: period?.value ?? "all",
    status: status?.value ?? "all",
    sort: sort?.value ?? "latest",
  });

  // 정렬 값에 따라 알 맞은 값을 불러오기 위해 이벤트 등록
  const bind = () => {
    if (search) search.value = "";
    if (period) period.value = "all";
    if (status) status.value = "all";
    if (sort) sort.value = "latest";

    const handler = () => {
      const view = readViewFromInputs();
      onChange?.(view);
    };

    [search, period, status, sort].filter(Boolean).forEach((node) => {
      node.addEventListener("input", handler);
      node.addEventListener("change", handler);
    });

    handler();
  };

  // 할 일 목록을 화면에 보여주기 위한 필터링 및 정렬 해주는 로직
  const getViewTodos = (todos, view) => {
    const q = view.q ?? "";
    const p = view.period ?? "all";
    const st = view.status ?? "all";
    const so = view.sort ?? "latest";

    let arr = todos.filter((t) => t.title.toLowerCase().includes(q));
    arr = arr.filter((t) => withinPeriod(t, p));
    if (st !== "all") arr = arr.filter((t) => t.status === st);

    const sortFn =
      so === "latest"
        ? (a, b) => b.createdAt - a.createdAt
        : so === "oldest"
          ? (a, b) => a.createdAt - b.createdAt
          : so === "titleAsc"
            ? (a, b) => a.title.localeCompare(b.title, "ko")
            : so === "titleDesc"
              ? (a, b) => b.title.localeCompare(a.title, "ko")
              : so === "priority"
                ? (a, b) =>
                    PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
                : so === "status"
                  ? (a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
                  : () => 0;

    return arr.slice().sort(sortFn);
  };

  return { bind, readViewFromInputs, getViewTodos };
};
