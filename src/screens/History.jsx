import { useMemo, useState } from "react";
import { useApp } from "../context/AppContext";
import { useExpenses } from "../hooks/useExpenses";
import { deleteExpense } from "../data/store";
import {
  CATEGORIES,
  PAYMENT_METHODS,
  categoryLabel,
  categoryColor,
  paymentLabel,
} from "../data/constants";
import { yen } from "../lib/format";
import { toMonthKey, shiftMonthKey, monthLabel } from "../lib/date";
import { sum } from "../lib/aggregate";
import "./History.css";

export default function History() {
  const { ready, bumpRefresh } = useApp();
  const [monthKey, setMonthKey] = useState(toMonthKey(new Date()));
  const [cat, setCat] = useState("all");
  const [pay, setPay] = useState("all");
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const [keyword, setKeyword] = useState("");
  const [showFilter, setShowFilter] = useState(false);

  const { rows, loading } = useExpenses([monthKey]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (cat !== "all" && r.category !== cat) return false;
      if (pay !== "all" && r.payment !== pay) return false;
      if (min && r.amount < Number(min)) return false;
      if (max && r.amount > Number(max)) return false;
      if (keyword) {
        const hay = `${r.store} ${r.memo} ${(r.items || [])
          .map((i) => i.name)
          .join(" ")}`.toLowerCase();
        if (!hay.includes(keyword.toLowerCase())) return false;
      }
      return true;
    });
  }, [rows, cat, pay, min, max, keyword]);

  const total = sum(filtered);

  const remove = async (id) => {
    if (!confirm("この支出を削除しますか？")) return;
    await deleteExpense(id);
    bumpRefresh();
  };

  return (
    <div className="screen history fade-in">
      <div className="history__head">
        <button
          className="history__nav"
          onClick={() => setMonthKey(shiftMonthKey(monthKey, -1))}
          aria-label="前の月"
        >
          ‹
        </button>
        <h2 className="history__month">{monthLabel(monthKey)}</h2>
        <button
          className="history__nav"
          onClick={() => setMonthKey(shiftMonthKey(monthKey, 1))}
          disabled={monthKey >= toMonthKey(new Date())}
          aria-label="次の月"
        >
          ›
        </button>
      </div>

      <div className="history__summary card">
        <span>合計（{filtered.length}件）</span>
        <strong>{yen(total)}</strong>
      </div>

      <div className="history__search">
        <input
          placeholder="🔍 店舗・品目・メモを検索"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        <button
          className={`history__filter-btn ${showFilter ? "is-on" : ""}`}
          onClick={() => setShowFilter((v) => !v)}
        >
          絞り込み
        </button>
      </div>

      {showFilter && (
        <div className="history__filters card">
          <div className="confirm__grid2">
            <div className="field">
              <label>カテゴリ</label>
              <select value={cat} onChange={(e) => setCat(e.target.value)}>
                <option value="all">すべて</option>
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>支払い方法</label>
              <select value={pay} onChange={(e) => setPay(e.target.value)}>
                <option value="all">すべて</option>
                {PAYMENT_METHODS.map((p) => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="confirm__grid2">
            <div className="field">
              <label>下限金額</label>
              <input type="number" inputMode="numeric" value={min}
                onChange={(e) => setMin(e.target.value)} placeholder="0" />
            </div>
            <div className="field">
              <label>上限金額</label>
              <input type="number" inputMode="numeric" value={max}
                onChange={(e) => setMax(e.target.value)} placeholder="上限なし" />
            </div>
          </div>
        </div>
      )}

      {!ready ? (
        <p className="history__empty">Firebase 未接続です。設定画面から接続してください。</p>
      ) : loading ? (
        <p className="history__empty">読み込み中…</p>
      ) : filtered.length === 0 ? (
        <p className="history__empty">該当する支出がありません。</p>
      ) : (
        <ul className="history__list">
          {filtered.map((r) => (
            <li key={r.id} className="exp">
              <span
                className="exp__cat"
                style={{ background: categoryColor(r.category) }}
              />
              <div className="exp__body">
                <div className="exp__top">
                  <span className="exp__store">{r.store || "（名称なし）"}</span>
                  <span className="exp__amount">{yen(r.amount)}</span>
                </div>
                <div className="exp__meta">
                  <span>{r.date}{r.time ? ` ${r.time}` : ""}</span>
                  <span className="exp__dot">·</span>
                  <span>{categoryLabel(r.category)}</span>
                  <span className="exp__dot">·</span>
                  <span>{paymentLabel(r.payment)}</span>
                </div>
                {r.memo && <div className="exp__memo">{r.memo}</div>}
              </div>
              <button className="exp__del" onClick={() => remove(r.id)} aria-label="削除">
                🗑
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
