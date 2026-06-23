import { listExpensesByMonth, listIncomeByMonth } from "../data/store";
import { sum, byCategory, categoryRanking } from "./aggregate";
import { toMonthKey, shiftMonthKey, monthLabel } from "./date";
import { yen } from "./format";

// 直近3ヶ月の収支を集計し、月次レポート・AIチャット双方で使うコンテキストを作る。
// ボーナスは通常月の集計に混ぜない（別枠）。
export async function buildFinanceContext(ref = new Date()) {
  const thisKey = toMonthKey(ref);
  const keys = [thisKey, shiftMonthKey(thisKey, -1), shiftMonthKey(thisKey, -2)];

  const data = await Promise.all(
    keys.map(async (k) => {
      const [expenses, income] = await Promise.all([
        listExpensesByMonth(k),
        listIncomeByMonth(k),
      ]);
      const expenseTotal = sum(expenses);
      // 給与・ボーナス・その他すべてを月の収入として合算
      const incomeTotal = income.reduce((s, i) => s + (i.amount || 0), 0);
      return {
        key: k,
        label: monthLabel(k),
        expenseTotal,
        income: incomeTotal,
        net: incomeTotal - expenseTotal,
        categories: byCategory(expenses),
        ranking: categoryRanking(expenses),
        atone: sum(expenses.filter((e) => e.payment === "atone")),
      };
    })
  );

  const [current, prev] = data;

  // AI へ渡すコンパクトなテキスト
  const lines = data.map((m) => {
    const cats = m.ranking
      .slice(0, 5)
      .map((c) => `${c.name}:${yen(c.value)}`)
      .join("、");
    return `■${m.label}\n  支出合計:${yen(m.expenseTotal)} / 収入:${yen(m.income)} / 収支:${yen(m.net)}\n  カテゴリ上位: ${cats || "なし"}\n  atone後払い:${yen(m.atone)}`;
  });

  const text = `【直近3ヶ月の収支データ】\n${lines.join("\n")}`;

  return { months: data, current, prev, text };
}
