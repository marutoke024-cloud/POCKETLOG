import { CATEGORIES } from "../data/constants";
import { byCategory } from "./aggregate";

// 予算と当月支出から、カテゴリごとの消化状況を算出する。
// budgets: { food: 30000, ... }（0/未設定は対象外）
export function budgetStatus(rows, budgets) {
  const spentMap = Object.fromEntries(
    byCategory(rows).map((c) => [c.id, c.value])
  );
  const items = CATEGORIES.filter((c) => Number(budgets[c.id]) > 0).map((c) => {
    const budget = Number(budgets[c.id]) || 0;
    const spent = spentMap[c.id] || 0;
    const ratio = budget ? (spent / budget) * 100 : 0;
    return {
      id: c.id,
      name: c.label,
      color: c.color,
      budget,
      spent,
      remaining: budget - spent,
      ratio,
      over: spent > budget,
    };
  });
  const over = items.filter((i) => i.over);
  return { items, over };
}
