import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { useExpenses } from "../hooks/useExpenses";
import { listIncomeByMonth } from "../data/store";
import { sum, byCategory, cumulativeByCycle, compare } from "../lib/aggregate";
import { quickAdvice } from "../lib/advice";
import { budgetStatus } from "../lib/budget";
import { getBudgets, getBudgetAlertEnabled } from "../lib/settings";
import { yen, yenSigned, percentSigned } from "../lib/format";
import {
  toMonthKey,
  shiftMonthKey,
  paydayCycle,
  daysUntilPayday,
} from "../lib/date";
import DonutChart from "../components/charts/DonutChart";
import LineTrend from "../components/charts/LineTrend";
import IncomeModal from "../components/IncomeModal";
import "./Home.css";

const TABS = [
  { id: "this", label: "今月" },
  { id: "last", label: "先月" },
  { id: "3m", label: "3ヶ月" },
];

export default function Home({ onOpenReport }) {
  const { ready, refreshKey } = useApp();
  const [tab, setTab] = useState("this");
  const [incomeOpen, setIncomeOpen] = useState(false);
  const [income, setIncome] = useState(0);

  const thisKey = toMonthKey(new Date());
  const lastKey = shiftMonthKey(thisKey, -1);
  const twoKey = shiftMonthKey(thisKey, -2);
  const months = [thisKey, lastKey, twoKey];

  const { rows, loading } = useExpenses(months);

  // 今月の収入（給与・ボーナス・その他すべて合算）
  useEffect(() => {
    if (!ready) return;
    listIncomeByMonth(thisKey)
      .then((list) => setIncome(list.reduce((s, i) => s + (i.amount || 0), 0)))
      .catch(() => setIncome(0));
  }, [ready, thisKey, refreshKey]);

  const view = useMemo(() => {
    const inMonth = (k) => rows.filter((r) => r.monthKey === k);
    const thisRows = inMonth(thisKey);
    const lastRows = inMonth(lastKey);

    let activeRows = thisRows;
    if (tab === "last") activeRows = lastRows;
    if (tab === "3m") activeRows = rows;

    const total = sum(activeRows);
    const lastTotal = sum(lastRows);
    const cmp = compare(sum(thisRows), lastTotal);

    const cycle = paydayCycle(new Date());
    const trend = cumulativeByCycle(
      rows.filter(
        (r) => new Date(r.date) >= cycle.start && new Date(r.date) < cycle.end
      ),
      cycle.start,
      cycle.end
    );

    const budgets = getBudgets();
    const bStatus = budgetStatus(thisRows, budgets);

    return {
      total,
      cmp,
      donut: byCategory(activeRows),
      trend,
      budget: bStatus,
      advice: quickAdvice({
        thisMonthRows: thisRows,
        lastMonthTotal: lastTotal,
        income,
      }),
    };
  }, [rows, tab, thisKey, lastKey, income]);

  const daysLeft = daysUntilPayday(new Date());
  const balancePace = income - view.total;
  const alertOn = getBudgetAlertEnabled();
  const overItems = alertOn ? view.budget.over : [];

  return (
    <div className="screen home fade-in">
      <header className="home__hero">
        <div className="home__hero-top">
          <span>今月の支出</span>
          <div className="home__tabs">
            {TABS.map((t) => (
              <button key={t.id} className={tab === t.id ? "is-on" : ""} onClick={() => setTab(t.id)}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div className="home__total">{yen(view.total)}</div>
        {tab !== "3m" && (
          <div className="home__compare">
            <span className={view.cmp.diff > 0 ? "up" : "down"}>
              先月比 {yenSigned(view.cmp.diff)}（{percentSigned(view.cmp.rate)}）
            </span>
          </div>
        )}
        <div className="home__payday">給料日まであと {daysLeft} 日</div>
      </header>

      {!ready && (
        <Link to="/settings" className="home__notice">
          ⚠️ Firebase が未接続です。設定画面から接続してください →
        </Link>
      )}

      {/* 予算超過アラート */}
      {overItems.length > 0 && (
        <div className="home__budget-alert">
          <strong>予算超過</strong>
          {overItems.map((b) => (
            <div key={b.id} className="home__budget-row">
              <span>{b.name}</span>
              <span>{yen(b.spent)} / {yen(b.budget)}</span>
            </div>
          ))}
        </div>
      )}

      {/* ミニカード2枚 */}
      <div className="home__mini">
        <button className="card mini mini--btn" onClick={() => setIncomeOpen(true)}>
          <span className="mini__label">今月の収入</span>
          <span className="mini__value">{yen(income)}</span>
          <span className="mini__sub">＋ 収入を登録</span>
        </button>
        <div className="card mini">
          <span className="mini__label">残高ペース</span>
          <span className={`mini__value ${balancePace < 0 ? "mini__value--neg" : ""}`}>
            {income > 0 ? yenSigned(balancePace) : yen(0)}
          </span>
          <span className="mini__sub">収入 − 支出</span>
        </div>
      </div>

      <section className="card home__section">
        <h3 className="home__section-title">支出推移（給料日起点）</h3>
        {loading ? <Skeleton h={190} /> : <LineTrend data={view.trend} />}
      </section>

      <section className="card home__section">
        <h3 className="home__section-title">カテゴリ別</h3>
        {loading ? <Skeleton h={180} /> : <DonutChart data={view.donut} total={view.total} />}
      </section>

      {/* AIアドバイス */}
      <section className="card home__advice">
        <div className="home__advice-head">
          <span className="home__advice-badge">Financial Advice</span>
        </div>
        <p>{view.advice}</p>
        <div className="home__advice-actions">
          <Link to="/chat" className="btn btn--gold home__advice-btn">Geminiに相談</Link>
          <button className="btn btn--ghost home__advice-btn" onClick={onOpenReport}>
            今月のレポート
          </button>
        </div>
      </section>

      <IncomeModal open={incomeOpen} onClose={() => setIncomeOpen(false)} />
    </div>
  );
}

function Skeleton({ h }) {
  return <div className="skeleton" style={{ height: h }} />;
}
