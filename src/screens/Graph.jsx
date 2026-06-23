import { useMemo } from "react";
import { useExpenses } from "../hooks/useExpenses";
import { categoryRanking, sum } from "../lib/aggregate";
import { yen } from "../lib/format";
import { toMonthKey, monthLabel } from "../lib/date";
import SavingsSim from "../components/sim/SavingsSim";
import NisaSim from "../components/sim/NisaSim";
import AtoneAlert from "../components/sim/AtoneAlert";
import UtilityTrend from "../components/UtilityTrend";
import BalanceCompare from "../components/BalanceCompare";
import "../components/charts/charts.css";
import "./Graph.css";

export default function Graph() {
  const monthKey = toMonthKey(new Date());
  const { rows, loading } = useExpenses([monthKey]);

  const ranking = useMemo(() => categoryRanking(rows), [rows]);
  const total = sum(rows);
  const maxVal = ranking[0]?.value || 1;
  const atoneTotal = useMemo(
    () => sum(rows.filter((r) => r.payment === "atone")),
    [rows]
  );

  return (
    <div className="screen graph fade-in">
      <h2 className="screen-title">グラフ・シミュレーション</h2>

      <BalanceCompare />

      <section className="card graph__section">
        <h3 className="graph__title">支出カテゴリランキング</h3>
        <p className="graph__sub">{monthLabel(monthKey)}・合計 {yen(total)}</p>
        {loading ? (
          <p className="chart-empty">読み込み中…</p>
        ) : ranking.length === 0 ? (
          <p className="chart-empty">データがありません</p>
        ) : (
          <div className="hbar">
            {ranking.map((r) => (
              <div className="hbar__row" key={r.id}>
                <div className="hbar__top">
                  <span className="hbar__name">{r.name}</span>
                  <span className="hbar__val">{yen(r.value)}</span>
                </div>
                <div className="hbar__track">
                  <div
                    className="hbar__fill"
                    style={{
                      width: `${(r.value / maxVal) * 100}%`,
                      background: r.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <UtilityTrend />
      <SavingsSim />
      <NisaSim />
      <AtoneAlert atoneTotal={atoneTotal} />
    </div>
  );
}
