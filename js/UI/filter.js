// 검색/필터/정렬 카드
export const createFilter = ({ onChange } = {}) => {
  const $ = (sel) => document.querySelector(sel);

  // 검색, 필터, 정렬 요소 및 값 설정
  const search = $("#search");
  const period = $("#period");
  const status = $("#filter");
  const sort = $("#sort");

  // 마감일 순으로 검색을 하기 위해 현재 시간 불러오기
  // yyyy-mm-dd 문자열 > Date(ms)로 변환하는 함수
  const parseYMD = (s) => {
    if (!s) return null; // 값이 없으면 null처리
    const d = new Date(s + "T00:00:00"); // 로컬 시간 기준으로 날짜를 만듦
    return Number.isNaN(d.getTime()) ? null : d.getTime();
  };

  // 마감일까지 남은 일수를 계산하는 함수
  const dueLeft = (dueDate) => {
    const dueAt = parseYMD(dueDate);
    if (dueAt == null) return null; // 마감일이 없으면 null
    const oneDay = 24 * 60 * 60 * 1000;
    return Math.ceil((dueAt - Date.now()) / oneDay); // 오늘을 기준해서 남은 일 수를 반환
  };

  // 특정 todo 카드가 선택된 시간에 포함되는 판단하는 함수
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

  // 현재 UI 입력값들을 필터 상태인 객체로 읽어오는 함수
  const readViewFromInputs = () => ({
    q: (search?.value ?? "").trim().toLowerCase(), // 검색어를 일관성 있게 소문자와 공백제거 형태로 만듦
    period: period?.value ?? "all",
    status: status?.value ?? "all",
    sort: sort?.value ?? "latest",
  });

  // 필터 요소들에게 이벤트를 걸어서 변경될 때는 onChange를 호출함
  const bind = () => {
    if (search) search.value = "";
    if (period) period.value = "all";
    if (status) status.value = "all";
    if (sort) sort.value = "latest";

    const handler = () => {
      const view = readViewFromInputs(); // view를 읽음
      onChange?.(view); // 외부에서 받은 onChange 콜백에 view를 전달
    };

    // 존재하는 요소들만 골라서 이벤트를 걸 수 있도록 함
    [search, period, status, sort].filter(Boolean).forEach((node) => {
      node.addEventListener("input", handler);
      node.addEventListener("change", handler);
    });

    handler();
  };

  // 원본에 todos와 view의 상태를 받아서 화면에 보여줄 배열을 생성
  const getViewTodos = (todos, view) => {
    const q = view.q ?? "";
    const p = view.period ?? "all";
    const st = view.status ?? "all";
    const so = view.sort ?? "latest";
    // 제목에서 검색어가 포함된 것을 1차적으로 필터링을 한다.
    let arr = todos.filter((t) => t.title.toLowerCase().includes(q));
    arr = arr.filter((t) => withinPeriod(t, p)); // 기간 조건에 맞는 것만 2차로 필터링
    if (st !== "all") arr = arr.filter((t) => t.status === st); // 상태가 all(전체)이 아닌 이상 그 상태들만 남긴다.

    // 우선순위 정렬용 숫자 순서 매핑(작을수록 먼저 배치)
    // 미래 대비 코드 상태순 정렬용 숫자 순서 매핑(작을수록 먼저 배치)
    const PRIORITY_ORDER = { high: 0, mid: 1, low: 2 };
    const STATUS_ORDER = { todo: 0, doing: 1, done: 2 };

    // 값에 따라 사용할 정렬 함수를 선택
    const sortFn =
      so === "latest"
        ? (a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0)
        : so === "oldest"
          ? (a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0)
          : so === "titleAsc"
            ? (a, b) => (a.title ?? "").localeCompare(b.title ?? "", "ko")
            : so === "titleDesc"
              ? (a, b) => (b.title ?? "").localeCompare(a.title ?? "", "ko")
              : so === "priority"
                ? (a, b) =>
                    (PRIORITY_ORDER[a.priority] ?? 99) -
                    (PRIORITY_ORDER[b.priority] ?? 99)
                : so === "status"
                  ? (a, b) =>
                      (STATUS_ORDER[a.status] ?? 99) -
                      (STATUS_ORDER[b.status] ?? 99)
                  : () => 0; // 상태순 정렬방식이며, 이건 미래 대비 코드(후에 기능을 추가할 예정.)

    return arr.slice().sort(sortFn); // 원본 보호를 위해서 복사본을 만들고 정렬해서 반환
  };

  return { bind, readViewFromInputs, getViewTodos };
};
