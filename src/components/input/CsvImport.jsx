import { useRef, useState } from "react";
import { decodeBuffer, csvToCandidates } from "../../lib/csv";
import { getExistingFingerprints, addExpensesBulk } from "../../data/store";
import { toMonthKey } from "../../lib/date";
import { CATEGORIES, PAYMENT_METHODS } from "../../data/constants";
import { yen } from "../../lib/format";

// PayPay / BANDLE / PayPayクレジット 等の取引履歴 CSV を一括取込。
// 列を自動判定し、重複（既存 fingerprint）を除外して保存する。
export default function CsvImport({ ready, onDone }) {
  const [payment, setPayment] = useState("paypay");
  const [category, setCategory] = useState("other");
  const [rows, setRows] = useState([]); // {include, dup, ...rec}
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [savedCount, setSavedCount] = useState(null);
  const fileRef = useRef(null);

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    setError("");
    setSavedCount(null);
    try {
      const buf = await file.arrayBuffer();
      const text = decodeBuffer(buf);
      const { items } = csvToCandidates(text, payment);
      if (!items.length) {
        setError("金額・日付の列を読み取れませんでした。CSVの形式をご確認ください。");
        setRows([]);
        return;
      }
      // 重複判定（既存月の fingerprint と照合）
      let existing = new Set();
      if (ready) {
        const months = items.map((it) => toMonthKey(it.date));
        existing = await getExistingFingerprints(months);
      }
      const seen = new Set();
      const prepared = items.map((it) => {
        const dup = existing.has(it.fingerprint) || seen.has(it.fingerprint);
        seen.add(it.fingerprint);
        return { ...it, category, include: !dup, dup };
      });
      setRows(prepared);
    } catch (err) {
      setError(err.message || "読み込みに失敗しました。");
    } finally {
      setBusy(false);
    }
  };

  const toggle = (i) =>
    setRows((arr) => arr.map((r, idx) => (idx === i ? { ...r, include: !r.include } : r)));

  const applyCategory = (cat) => {
    setCategory(cat);
    setRows((arr) => arr.map((r) => ({ ...r, category: cat })));
  };

  const selected = rows.filter((r) => r.include);
  const dupCount = rows.filter((r) => r.dup).length;

  const save = async () => {
    if (!ready) {
      setError("Firebase が未接続です。設定画面から接続してください。");
      return;
    }
    if (!selected.length) return;
    setBusy(true);
    setError("");
    try {
      await addExpensesBulk(
        selected.map(({ include, dup, ...rec }) => rec) // eslint-disable-line no-unused-vars
      );
      setSavedCount(selected.length);
      setTimeout(onDone, 900);
    } catch (err) {
      setError(err.message || "保存に失敗しました。");
    } finally {
      setBusy(false);
    }
  };

  if (savedCount != null) {
    return <p className="csv__done">✅ {savedCount} 件を取り込みました。</p>;
  }

  return (
    <div className="csv">
      <div className="field">
        <label>取込元（支払い方法）</label>
        <select value={payment} onChange={(e) => setPayment(e.target.value)}>
          {PAYMENT_METHODS.map((p) => (
            <option key={p.id} value={p.id}>{p.label}</option>
          ))}
        </select>
      </div>

      <input ref={fileRef} type="file" accept=".csv,text/csv" hidden onChange={onFile} />
      <button className="btn btn--ghost btn--block" onClick={() => fileRef.current?.click()} disabled={busy}>
        {busy && !rows.length ? <span className="spin" /> : "CSVファイルを選択"}
      </button>

      {error && <p className="sheet__error" style={{ marginTop: 12 }}>{error}</p>}

      {rows.length > 0 && (
        <>
          <div className="csv__bar">
            <span>{rows.length}件中 {selected.length}件を取込</span>
            {dupCount > 0 && <span className="csv__dup">重複 {dupCount}件は除外</span>}
          </div>

          <div className="field">
            <label>全件のカテゴリをまとめて設定</label>
            <select value={category} onChange={(e) => applyCategory(e.target.value)}>
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>

          <ul className="csv__list">
            {rows.map((r, i) => (
              <li key={i} className={`csv__row ${r.dup ? "is-dup" : ""}`}>
                <input type="checkbox" checked={r.include} onChange={() => toggle(i)} />
                <div className="csv__info">
                  <span className="csv__store">{r.store || "（名称なし）"}</span>
                  <span className="csv__date">{r.date}{r.dup ? " · 重複" : ""}</span>
                </div>
                <span className="csv__amt">{yen(r.amount)}</span>
              </li>
            ))}
          </ul>

          <button className="btn btn--block" onClick={save} disabled={busy || !selected.length}>
            {busy ? <span className="spin" /> : `${selected.length}件を取り込む`}
          </button>
        </>
      )}
    </div>
  );
}
