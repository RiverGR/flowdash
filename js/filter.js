// 검색/필터/정렬 카드
export const createFilter = ({ onChange } = {}) => {
  const $ = (sel) => document.querySelector(sel);

  const search = $("#search");
  const period = $("#period");
  const status = $("#filter");
  const sort = $("#sort");

  const parseYMD = (s) => {
    if (!s) return null;
    const d = new Date(s + "T00:00:00");
    return Number.isNaN(d.getTime()) ? null : d.getTime();
  };

  const dueLeft = (dueDate) => {
    const dueAt = parseYMD(dueDate);
    if (dueAt == null) return null;
    const oneDay = 24 * 60 * 60 * 1000;
    return Math.ceil((dueAt - Date.now()) / oneDay);
  };

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

  const applyViewToInputs = (view) => {
    if (search && typeof view.q === "string") search.value = view.q;
    if (period && view.period) period.value = view.period;
    if (status && view.status) status.value = view.status;
    if (sort && view.sort) sort.value = view.sort;
  };

  const readViewFromInputs = () => ({
    q: (search?.value ?? "").trim().toLowerCase(),
    period: period?.value ?? "all",
    status: status?.value ?? "all",
    sort: sort?.value ?? "latest",
  });

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
