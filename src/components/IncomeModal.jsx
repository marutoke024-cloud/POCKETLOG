import { useState } from "react";
import { useApp } from "../context/AppContext";
import { addIncome } from "../data/store";
import { INCOME_TYPES } from "../data/constants";
import { toDateKey } from "../lib/date";
import "./input/input.css";

// 収入（給与/ボーナス/その他）の手動登録。ボーナスは別枠で管理。
export default function IncomeModal({ open, onClose }) {
  const { ready, bumpRefresh } = useApp();
  const [date, setDate] = useState(toDateKey(new Date()));
  const [type, setType] = useState("salary");
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  const close = () => {
    setAmount("");
    setMemo("");
    setError("");
    onClose();
  };

  const save = async () => {
    if (!ready) {
      setError("Firebase が未接続です。設定画面から接続してください。");
      return;
    }
    if (!amount) return;
    setSaving(true);
    setError("");
    try {
      await addIncome({ date, type, amount, memo: memo.trim() });
      bumpRefresh();
      close();
    } catch (err) {
      setError(err.message || "保存に失敗しました。");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="sheet-overlay" onClick={close}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet__grip" />
        <h3 className="sheet__title">収入を登録</h3>

        <div className="confirm__grid2">
          <div className="field">
            <label>日付</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="field">
            <label>種別</label>
            <select value={type} onChange={(e) => setType(e.target.value)}>
              {INCOME_TYPES.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="field">
          <label>金額</label>
          <input type="number" inputMode="numeric" value={amount} placeholder="0"
            onChange={(e) => setAmount(e.target.value)} />
        </div>

        <div className="field">
          <label>メモ（任意）</label>
          <input value={memo} onChange={(e) => setMemo(e.target.value)} />
        </div>

        {type === "bonus" && (
          <p className="income__note">
            ボーナスは別枠で管理され、通常月の収支集計には混ざりません。
          </p>
        )}
        {error && <p className="sheet__error">{error}</p>}

        <div className="confirm__actions">
          <button className="btn btn--ghost" onClick={close} disabled={saving}>キャンセル</button>
          <button className="btn" onClick={save} disabled={saving || !amount}>
            {saving ? <span className="spin" /> : "保存する"}
          </button>
        </div>
      </div>
    </div>
  );
}
