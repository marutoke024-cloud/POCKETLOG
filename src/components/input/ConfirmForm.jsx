import { useState } from "react";
import { CATEGORIES, PAYMENT_METHODS } from "../../data/constants";
import { yen } from "../../lib/format";
import { toDateKey } from "../../lib/date";
import "./input.css";

// 抽出結果や手動入力の最終確認・編集フォーム。
// value: {store,date,time,items,amount,category,payment,memo,source,receiptUrl}
export default function ConfirmForm({ initial, source, receiptUrl, onSave, onCancel, saving }) {
  const [store, setStore] = useState(initial?.store || "");
  const [date, setDate] = useState(initial?.date || toDateKey(new Date()));
  const [time, setTime] = useState(initial?.time || "");
  const [amount, setAmount] = useState(initial?.amount ?? "");
  const [category, setCategory] = useState(initial?.category || "other");
  const [payment, setPayment] = useState(initial?.payment || "paypay");
  const [memo, setMemo] = useState(initial?.memo || "");
  const [items, setItems] = useState(
    initial?.items?.length ? initial.items : []
  );

  const updateItem = (i, key, v) => {
    setItems((arr) => arr.map((it, idx) => (idx === i ? { ...it, [key]: v } : it)));
  };
  const addItem = () => setItems((arr) => [...arr, { name: "", price: 0 }]);
  const removeItem = (i) => setItems((arr) => arr.filter((_, idx) => idx !== i));

  const itemsTotal = items.reduce((s, it) => s + (Number(it.price) || 0), 0);

  const submit = () => {
    onSave({
      store: store.trim(),
      date,
      time,
      amount: Number(amount) || itemsTotal,
      category,
      payment,
      memo: memo.trim(),
      items: items
        .map((it) => ({ name: it.name.trim(), price: Number(it.price) || 0 }))
        .filter((it) => it.name || it.price),
      source: source || "manual",
      receiptUrl: receiptUrl || null,
    });
  };

  return (
    <div className="confirm">
      {receiptUrl && (
        <img className="confirm__preview" src={receiptUrl} alt="プレビュー" />
      )}

      <div className="field">
        <label>店舗名 / 内容</label>
        <input value={store} onChange={(e) => setStore(e.target.value)}
          placeholder="例：セブンイレブン" />
      </div>

      <div className="confirm__grid2">
        <div className="field">
          <label>日付</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="field">
          <label>時刻（任意）</label>
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </div>
      </div>

      <div className="field">
        <label>合計金額</label>
        <input type="number" inputMode="numeric" value={amount}
          onChange={(e) => setAmount(e.target.value)} placeholder="0" />
        {items.length > 0 && itemsTotal !== Number(amount) && (
          <button className="confirm__sync" onClick={() => setAmount(itemsTotal)}>
            内訳合計 {yen(itemsTotal)} に合わせる
          </button>
        )}
      </div>

      <div className="confirm__grid2">
        <div className="field">
          <label>カテゴリ</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>支払い方法</label>
          <select value={payment} onChange={(e) => setPayment(e.target.value)}>
            {PAYMENT_METHODS.map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="field">
        <label>品目の内訳（任意）</label>
        {items.map((it, i) => (
          <div className="confirm__item" key={i}>
            <input value={it.name} placeholder="品目"
              onChange={(e) => updateItem(i, "name", e.target.value)} />
            <input type="number" inputMode="numeric" value={it.price} placeholder="0"
              onChange={(e) => updateItem(i, "price", e.target.value)} />
            <button className="confirm__del" onClick={() => removeItem(i)} aria-label="削除">×</button>
          </div>
        ))}
        <button className="confirm__add" onClick={addItem}>＋ 品目を追加</button>
      </div>

      <div className="field">
        <label>メモ（任意）</label>
        <textarea rows={2} value={memo} onChange={(e) => setMemo(e.target.value)} />
      </div>

      <div className="confirm__actions">
        <button className="btn btn--ghost" onClick={onCancel} disabled={saving}>
          キャンセル
        </button>
        <button className="btn" onClick={submit} disabled={saving}>
          {saving ? <span className="spin" /> : "保存する"}
        </button>
      </div>
    </div>
  );
}
