import { USER_PROFILE } from "../data/constants";

const PAYDAY = USER_PROFILE.paydayDay; // 20

export function pad2(n) {
  return String(n).padStart(2, "0");
}

// "YYYY-MM-DD" を返す（ローカル時刻基準）
export function toDateKey(d) {
  const x = new Date(d);
  return `${x.getFullYear()}-${pad2(x.getMonth() + 1)}-${pad2(x.getDate())}`;
}

// "YYYY-MM"（カレンダー月）
export function toMonthKey(d) {
  const x = new Date(d);
  return `${x.getFullYear()}-${pad2(x.getMonth() + 1)}`;
}

export function monthLabel(monthKey) {
  const [y, m] = monthKey.split("-");
  return `${y}年${Number(m)}月`;
}

// 当月のカレンダー範囲 [start, end)
export function calendarMonthRange(ref = new Date()) {
  const y = ref.getFullYear();
  const m = ref.getMonth();
  return {
    start: new Date(y, m, 1, 0, 0, 0, 0),
    end: new Date(y, m + 1, 1, 0, 0, 0, 0),
    key: toMonthKey(ref),
  };
}

// 指定カレンダー月から offset した月のキー（offset=-1 で先月）
export function shiftMonthKey(monthKey, offset) {
  const [y, m] = monthKey.split("-").map(Number);
  const d = new Date(y, m - 1 + offset, 1);
  return toMonthKey(d);
}

// 給料日サイクル：date が属する「給料日起点」の期間を返す。
// 20日以降はその月の20日開始、19日以前は前月20日開始。
export function paydayCycle(ref = new Date()) {
  const x = new Date(ref);
  const y = x.getFullYear();
  const m = x.getMonth();
  let start;
  if (x.getDate() >= PAYDAY) {
    start = new Date(y, m, PAYDAY, 0, 0, 0, 0);
  } else {
    start = new Date(y, m - 1, PAYDAY, 0, 0, 0, 0);
  }
  const end = new Date(start.getFullYear(), start.getMonth() + 1, PAYDAY, 0, 0, 0, 0);
  return { start, end };
}

// サイクル開始日からの経過日数（折れ線グラフの x 軸用）
export function dayIndexInCycle(date, cycleStart) {
  const ms = new Date(date) - new Date(cycleStart);
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

// 今日がレポート表示日（19日）か
export function isMonthlyReportDay(ref = new Date()) {
  return new Date(ref).getDate() === USER_PROFILE.monthlyReportDay;
}

// 次の給料日までの日数
export function daysUntilPayday(ref = new Date()) {
  const { end } = paydayCycle(ref);
  return Math.ceil((end - new Date(ref)) / (1000 * 60 * 60 * 24));
}
