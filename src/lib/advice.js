import { categoryRanking } from "./aggregate";
import { yen } from "./format";
import { categoryLabel } from "../data/constants";

// ホームのアドバイスカード用。フェーズ1はルールベースで軽量生成
// （AIチャットによる本格アドバイスはフェーズ3）。
export function quickAdvice({ thisMonthRows, lastMonthTotal, income }) {
  const total = thisMonthRows.reduce((s, r) => s + (r.amount || 0), 0);
  if (!thisMonthRows.length) {
    return "まだ今月の支出がありません。レシートを1枚撮るところから始めましょう。";
  }

  const tips = [];

  // 先月比
  if (lastMonthTotal > 0) {
    const diff = total - lastMonthTotal;
    if (diff > 0) {
      tips.push(`今月は先月より ${yen(diff)} 多く使っています。ペースに注意。`);
    } else if (diff < 0) {
      tips.push(`先月比 ${yen(-diff)} の節約ペース。いい調子です。`);
    }
  }

  // atone 後払いの残高リスク
  const atone = thisMonthRows
    .filter((r) => r.payment === "atone")
    .reduce((s, r) => s + (r.amount || 0), 0);
  if (atone > 0) {
    tips.push(`atone後払いが今月 ${yen(atone)}。翌月の引き落としに備えましょう。`);
  }

  // 偏りの指摘
  const ranking = categoryRanking(thisMonthRows);
  if (ranking.length && total > 0) {
    const top = ranking[0];
    const share = Math.round((top.value / total) * 100);
    if (share >= 40) {
      tips.push(`${categoryLabel(top.id)}が支出の${share}%を占めています。`);
    }
  }

  // 先取り貯蓄の提案
  if (income > 0 && total < income) {
    const buffer = Math.round((income - total) / 1000) * 1000;
    if (buffer >= 3000) {
      tips.push(`給料日に ${yen(buffer)} を先取り貯蓄に回す余地があります。`);
    }
  }

  if (!tips.length) {
    tips.push("順調です。まずは少額のNISAつみたてを始める好機かもしれません。");
  }
  return tips.slice(0, 3).join(" ");
}
