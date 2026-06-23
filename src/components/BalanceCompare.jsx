import { useEffect, useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { useApp } from "../context/AppContext";
import { listExpensesByMonths, listIncomeByMonths } from "../data/store";
import { sum } from "../lib/aggregate";
import { yen, yenSigned } from "../lib/format";
import { toMonthKey, shiftMonthKey, monthLabel } from "../lib/date";
import "./BalanceCompare.css";

const MONTHS_BACK = 6;

function TipBox({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const income = payload.find((p) => p.dataKey === "income")?.value || 0;
  const expense = payload.find((p) => p.dataKey === "expense")?.value || 0;
  const net = income - expense;
  return (
    <div className="chart-tip">
      <div className="chart-tip__label">{label}</div>
      <div className="bal-tip__row"><span style={{ color: "var(--ok)" }}>●</span> 収入：{yen(income)}</div>
      <div className="bal-tip__row"><span style={{ color: "var(--teal)" }}>●</span> 支出：{yen(expense)}</div>
      <div className="bal-tip__row">差額：<b className={net < 0 ? "neg" : "pos"}>{yenSigned(net)}</b></div>
    </div>
  );
}

export default function BalanceCompare() {
  const { ready, refreshKey } = useApp();
  const thisKey = toMonthKey(new Date());

  const monthKeys = useMemo(
    () =>
      Array.from({ length: MONTHS_BACK }, (_, i) =>
        shiftMonthKey(thisKey, -(MONTHS_BACK - 1 - i))
      ),
    [thisKey]
  );

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    if (!ready) {
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([listExpensesByMonths(monthKeys), listIncomeByMonths(monthKeys)])
      .then(([expenses, income]) => {
        if (!alive) return;
        const rows = monthKeys.map((k) => {
          const exp = sum(expenses.filter((e) => e.monthKey === k));
          const inc = sum(income.filter((i) => i.monthKey === k));
          return {
            key: k,
            label: monthLabel(k).replace(/^\d+年/, ""),
            income: inc,
            expense: exp,
            net: inc - exp,
          };
        });
        setData(rows);
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, refreshKey, thisKey]);

  const insight = useMemo(() => {
    if (data.length < 2) return null;
    const current = data[data.length - 1];
    const past = data.slice(0, -1).filter((d) => d.expense > 0);
    if (!past.length) return { current };
    const avgExpense = past.reduce((s, d) => s + d.expense, 0) / past.length;
    const diff = current.expense - avgExpense;
    return { current, avgExpense, diff };
  }, [data]);

  const hasData = data.some((d) => d.income > 0 || d.expense > 0);

  return (
    <section className="card bal">
      <h3 className="bal__title">収支バランス（月次比較）</h3>
      <p className="bal__sub">収入・支出・差額を月ごとに比較。使いすぎていないかチェック</p>

      {!ready ? (
        <p className="chart-empty">Firebase 未接続です。設定画面から接続してください。</p>
      ) : loading ? (
        <p className="chart-empty">読み込み中…</p>
      ) : !hasData ? (
        <p className="chart-empty">収入・支出データがまだありません。</p>
      ) : (
        <>
          {/* 今月サマリー */}
          {insight && (
            <div className="bal__summary">
              <div className="bal__net">
                <span>今月の収支差額</span>
                <strong className={insight.current.net < 0 ? "neg" : "pos"}>
                  {yenSigned(insight.current.net)}
                </strong>
              </div>
              {insight.diff != null && (
                <div className={`bal__verdict ${insight.diff > 0 ? "is-warn" : "is-ok"}`}>
                  {insight.diff > 0
                    ? `過去平均より ${yen(insight.diff)} 多い支出ペース ⚠️`
                    : `過去平均より ${yen(-insight.diff)} 少ない支出 👍`}
                </div>
              )}
            </div>
          )}

          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={2}>
              <CartesianGrid stroke="rgba(0,0,0,0.05)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--text-faint)" }}
                tickLine={false} axisLine={false} />
              <YAxis width={46} tick={{ fontSize: 10, fill: "var(--text-faint)" }}
                tickLine={false} axisLine={false}
                tickFormatter={(v) => "¥" + Number(v).toLocaleString("ja-JP")} />
              <Tooltip content={<TipBox />} cursor={{ fill: "rgba(0,0,0,0.03)" }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <ReferenceLine y={0} stroke="var(--surface)" />
              <Bar dataKey="income" name="収入" fill="var(--ok)" radius={[4, 4, 0, 0]} maxBarSize={26} />
              <Bar dataKey="expense" name="支出" fill="var(--teal)" radius={[4, 4, 0, 0]} maxBarSize={26} />
            </BarChart>
          </ResponsiveContainer>

          {/* 月別の差額一覧 */}
          <ul className="bal__list">
            {data.map((d) => (
              <li key={d.key}>
                <span className="bal__list-month">{d.label}</span>
                <span className="bal__list-bars">
                  収入 {yen(d.income)} ／ 支出 {yen(d.expense)}
                </span>
                <span className={`bal__list-net ${d.net < 0 ? "neg" : "pos"}`}>
                  {yenSigned(d.net)}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
