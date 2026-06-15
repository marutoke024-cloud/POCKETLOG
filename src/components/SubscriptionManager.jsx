import { useEffect, useState, useCallback } from "react";
import { useApp } from "../context/AppContext";
import {
  listSubscriptions,
  addSubscription,
  updateSubscription,
  deleteSubscription,
} from "../data/store";
import { PAYMENT_METHODS, paymentLabel } from "../data/constants";
import { yen } from "../lib/format";
import "./SubscriptionManager.css";

const EMPTY = { name: "", amount: "", billingDay: 1, payment: "paypay" };

export default function SubscriptionManager() {
  const { ready, bumpRefresh } = useApp();
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null | 'new' | id
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const reload = useCallback(async () => {
    if (!ready) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setSubs(await listSubscriptions());
    } finally {
      setLoading(false);
    }
  }, [ready]);

  useEffect(() => {
    reload();
  }, [reload]);

  const startNew = () => {
    setForm(EMPTY);
    setEditing("new");
  };
  const startEdit = (s) => {
    setForm({ name: s.name, amount: s.amount, billingDay: s.billingDay, payment: s.payment });
    setEditing(s.id);
  };

  const save = async () => {
    if (!form.name.trim() || !form.amount) return;
    setSaving(true);
    try {
      if (editing === "new") {
        await addSubscription({ ...form, active: true });
      } else {
        await updateSubscription(editing, form);
      }
      setEditing(null);
      await reload();
      bumpRefresh();
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (s) => {
    await updateSubscription(s.id, { active: !s.active });
    await reload();
  };

  const remove = async (s) => {
    if (!confirm(`「${s.name}」を削除しますか？`)) return;
    await deleteSubscription(s.id);
    await reload();
  };

  const monthlyTotal = subs
    .filter((s) => s.active)
    .reduce((sum, s) => sum + (s.amount || 0), 0);

  if (!ready) {
    return <p className="subs__empty">Firebase 未接続です。設定画面から接続してください。</p>;
  }

  return (
    <div className="subs">
      {!loading && subs.length > 0 && (
        <div className="subs__total">
          <span>有効なサブスク 月額合計</span>
          <strong>{yen(monthlyTotal)}</strong>
        </div>
      )}

      {loading ? (
        <p className="subs__empty">読み込み中…</p>
      ) : (
        <ul className="subs__list">
          {subs.map((s) => (
            <li key={s.id} className={`subs__item ${s.active ? "" : "is-off"}`}>
              <button
                className={`subs__toggle ${s.active ? "is-on" : ""}`}
                onClick={() => toggleActive(s)}
                aria-label="有効切替"
              >
                <span />
              </button>
              <div className="subs__info" onClick={() => startEdit(s)}>
                <span className="subs__name">{s.name}</span>
                <span className="subs__meta">
                  毎月{s.billingDay}日 · {paymentLabel(s.payment)}
                </span>
              </div>
              <span className="subs__amt">{yen(s.amount)}</span>
              <button className="subs__del" onClick={() => remove(s)} aria-label="削除">🗑</button>
            </li>
          ))}
        </ul>
      )}

      {editing ? (
        <div className="subs__form">
          <div className="field">
            <label>サービス名</label>
            <input value={form.name} placeholder="例：Netflix"
              onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="confirm__grid2">
            <div className="field">
              <label>金額</label>
              <input type="number" inputMode="numeric" value={form.amount} placeholder="0"
                onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            </div>
            <div className="field">
              <label>引き落とし日</label>
              <select value={form.billingDay}
                onChange={(e) => setForm({ ...form, billingDay: Number(e.target.value) })}>
                {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>{d}日</option>
                ))}
              </select>
            </div>
          </div>
          <div className="field">
            <label>支払い方法</label>
            <select value={form.payment}
              onChange={(e) => setForm({ ...form, payment: e.target.value })}>
              {PAYMENT_METHODS.map((p) => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
          </div>
          <div className="subs__form-actions">
            <button className="btn btn--ghost" onClick={() => setEditing(null)} disabled={saving}>
              キャンセル
            </button>
            <button className="btn" onClick={save} disabled={saving || !form.name.trim() || !form.amount}>
              {saving ? <span className="spin" /> : "保存"}
            </button>
          </div>
        </div>
      ) : (
        <button className="subs__add" onClick={startNew}>＋ サブスクを追加</button>
      )}
    </div>
  );
}
