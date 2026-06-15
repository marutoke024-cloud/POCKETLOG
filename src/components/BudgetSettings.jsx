import { useState } from "react";
import { CATEGORIES } from "../data/constants";
import {
  getBudgets,
  setBudgets,
  getBudgetAlertEnabled,
  setBudgetAlertEnabled,
} from "../lib/settings";
import { yen } from "../lib/format";
import "./BudgetSettings.css";

export default function BudgetSettings() {
  const [budgets, setLocal] = useState(getBudgets);
  const [alertOn, setAlertOn] = useState(getBudgetAlertEnabled);
  const [savedMsg, setSavedMsg] = useState("");

  const update = (id, v) => {
    const next = { ...budgets, [id]: v === "" ? "" : Number(v) };
    setLocal(next);
  };

  const save = () => {
    const clean = {};
    for (const [k, v] of Object.entries(budgets)) {
      if (Number(v) > 0) clean[k] = Number(v);
    }
    setBudgets(clean);
    setLocal(clean);
    setSavedMsg("予算を保存しました");
    setTimeout(() => setSavedMsg(""), 2000);
  };

  const toggleAlert = () => {
    const next = !alertOn;
    setAlertOn(next);
    setBudgetAlertEnabled(next);
  };

  const total = Object.values(budgets).reduce((s, v) => s + (Number(v) || 0), 0);

  return (
    <div className="budget">
      <div className="budget__alert">
        <span>予算超過アラート</span>
        <button
          className={`subs__toggle ${alertOn ? "is-on" : ""}`}
          onClick={toggleAlert}
          aria-label="アラート切替"
        >
          <span />
        </button>
      </div>

      <ul className="budget__list">
        {CATEGORIES.map((c) => (
          <li className="budget__row" key={c.id}>
            <span className="budget__dot" style={{ background: c.color }} />
            <span className="budget__name">{c.label}</span>
            <div className="budget__input">
              <input
                type="number"
                inputMode="numeric"
                placeholder="未設定"
                value={budgets[c.id] ?? ""}
                onChange={(e) => update(c.id, e.target.value)}
              />
              <em>円</em>
            </div>
          </li>
        ))}
      </ul>

      {total > 0 && (
        <div className="budget__total">
          <span>月予算 合計</span>
          <strong>{yen(total)}</strong>
        </div>
      )}

      <button className="btn btn--block" onClick={save}>予算を保存</button>
      {savedMsg && <p className="set__ok">{savedMsg}</p>}
    </div>
  );
}
