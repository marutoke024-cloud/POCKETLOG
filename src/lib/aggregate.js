import { CATEGORIES, categoryLabel, categoryColor } from "../data/constants";
import { dayIndexInCycle, toDateKey } from "./date";

export function sum(rows) {
  return rows.reduce((s, r) => s + (Number(r.amount) || 0), 0);
}

// カテゴリ別合計（ドーナツ用）。0 のカテゴリは除外。
export function byCategory(rows) {
  const totals = {};
  for (const r of rows) {
    const c = r.category || "other";
    totals[c] = (totals[c] || 0) + (Number(r.amount) || 0);
  }
  return CATEGORIES.map((c) => ({
    id: c.id,
    name: categoryLabel(c.id),
    value: totals[c.id] || 0,
    color: categoryColor(c.id),
  })).filter((d) => d.value > 0);
}

// カテゴリ別ランキング（横棒・降順）
export function categoryRanking(rows) {
  return byCategory(rows).sort((a, b) => b.value - a.value);
}

// 給料日サイクル内の「日次累積」推移（折れ線・x は経過日数）
export function cumulativeByCycle(rows, cycleStart, cycleEnd) {
  const days =
    Math.ceil((new Date(cycleEnd) - new Date(cycleStart)) / 86400000) || 30;
  const perDay = new Array(days).fill(0);
  for (const r of rows) {
    const idx = dayIndexInCycle(r.date, cycleStart);
    if (idx >= 0 && idx < days) perDay[idx] += Number(r.amount) || 0;
  }
  let acc = 0;
  const start = new Date(cycleStart);
  return perDay.map((v, i) => {
    acc += v;
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return {
      day: i,
      label: `${d.getMonth() + 1}/${d.getDate()}`,
      amount: acc,
      dateKey: toDateKey(d),
    };
  });
}

// 先月比（金額差・％）
export function compare(current, previous) {
  const diff = current - previous;
  const rate = previous > 0 ? (diff / previous) * 100 : current > 0 ? 100 : 0;
  return { diff, rate };
}
