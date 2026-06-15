import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  doc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getDb, getStore, isFirebaseReady } from "../firebase/config";
import { toDateKey, toMonthKey } from "../lib/date";

const EXPENSES = "expenses";
const INCOME = "income";
const SUBS = "subscriptions";

/* ---------------- 支出 ---------------- */

export async function addExpense(record) {
  const db = getDb();
  const date = record.date || toDateKey(new Date());
  const payload = {
    date,
    monthKey: toMonthKey(date),
    time: record.time || "",
    store: record.store || "",
    items: record.items || [],
    amount: Number(record.amount) || 0,
    payment: record.payment || "cash",
    category: record.category || "other",
    source: record.source || "manual",
    receiptUrl: record.receiptUrl || null,
    memo: record.memo || "",
    fingerprint: record.fingerprint || null, // CSV 重複チェック用
    createdAt: serverTimestamp(),
  };
  const r = await addDoc(collection(db, EXPENSES), payload);
  return { id: r.id, ...payload };
}

export async function listExpensesByMonth(monthKey) {
  const db = getDb();
  const q = query(
    collection(db, EXPENSES),
    where("monthKey", "==", monthKey)
  );
  const snap = await getDocs(q);
  const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  // クライアント側で日付降順（複合インデックス不要にするため）
  rows.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  return rows;
}

// 複数のカレンダー月をまとめて取得（ホームの3ヶ月推移など）
export async function listExpensesByMonths(monthKeys) {
  const results = await Promise.all(monthKeys.map(listExpensesByMonth));
  return results.flat();
}

export async function deleteExpense(id) {
  const db = getDb();
  await deleteDoc(doc(db, EXPENSES, id));
}

// CSV 重複チェック：同じ fingerprint が既に存在するか
export async function expenseExists(fingerprint) {
  if (!fingerprint) return false;
  const db = getDb();
  const q = query(
    collection(db, EXPENSES),
    where("fingerprint", "==", fingerprint)
  );
  const snap = await getDocs(q);
  return !snap.empty;
}

// 指定月の既存 fingerprint を一括取得（CSV取込の重複判定用）
export async function getExistingFingerprints(monthKeys) {
  const rows = await listExpensesByMonths([...new Set(monthKeys)]);
  return new Set(rows.map((r) => r.fingerprint).filter(Boolean));
}

// 複数レコードをまとめて保存
export async function addExpensesBulk(records) {
  const results = [];
  for (const rec of records) {
    // 連続書き込みでの過負荷を避けるため逐次寄りに（件数は明細単位で現実的）
    // eslint-disable-next-line no-await-in-loop
    results.push(await addExpense(rec));
  }
  return results;
}

/* ---------------- 収入 ---------------- */

export async function addIncome(record) {
  const db = getDb();
  const date = record.date || toDateKey(new Date());
  const payload = {
    date,
    monthKey: toMonthKey(date),
    type: record.type || "salary", // salary / bonus / other
    amount: Number(record.amount) || 0,
    memo: record.memo || "",
    createdAt: serverTimestamp(),
  };
  const r = await addDoc(collection(db, INCOME), payload);
  return { id: r.id, ...payload };
}

export async function listIncomeByMonth(monthKey) {
  const db = getDb();
  const q = query(collection(db, INCOME), where("monthKey", "==", monthKey));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/* ---------------- 定期サブスク ---------------- */

export async function listSubscriptions() {
  const db = getDb();
  const q = query(collection(db, SUBS), orderBy("billingDay", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function addSubscription(record) {
  const db = getDb();
  const payload = {
    name: record.name || "",
    amount: Number(record.amount) || 0,
    billingDay: Number(record.billingDay) || 1,
    payment: record.payment || "paypay",
    category: "subs",
    active: record.active !== false,
    createdAt: serverTimestamp(),
  };
  const r = await addDoc(collection(db, SUBS), payload);
  return { id: r.id, ...payload };
}

export async function updateSubscription(id, patch) {
  const db = getDb();
  const clean = {};
  if (patch.name != null) clean.name = patch.name;
  if (patch.amount != null) clean.amount = Number(patch.amount) || 0;
  if (patch.billingDay != null) clean.billingDay = Number(patch.billingDay) || 1;
  if (patch.payment != null) clean.payment = patch.payment;
  if (patch.active != null) clean.active = !!patch.active;
  await updateDoc(doc(db, SUBS, id), clean);
}

export async function deleteSubscription(id) {
  const db = getDb();
  await deleteDoc(doc(db, SUBS, id));
}

// 有効なサブスクを当月の支出レコードへ反映（引き落とし日を過ぎたもの・月1回・重複なし）。
// 起動時に呼び、追加した件数を返す。
export async function syncSubscriptionCharges(ref = new Date()) {
  const monthKey = toMonthKey(ref);
  const [subs, existing] = await Promise.all([
    listSubscriptions(),
    listExpensesByMonth(monthKey),
  ]);
  const existingFps = new Set(existing.map((e) => e.fingerprint).filter(Boolean));
  const today = new Date(ref).getDate();
  const y = new Date(ref).getFullYear();
  const m = new Date(ref).getMonth();

  let added = 0;
  for (const sub of subs) {
    if (!sub.active) continue;
    if (sub.billingDay > today) continue; // 引き落とし日がまだ来ていない
    const fp = `sub|${sub.id}|${monthKey}`;
    if (existingFps.has(fp)) continue;
    // 月末調整（31日指定で2月など）
    const lastDay = new Date(y, m + 1, 0).getDate();
    const day = Math.min(sub.billingDay, lastDay);
    // eslint-disable-next-line no-await-in-loop
    await addExpense({
      date: toDateKey(new Date(y, m, day)),
      store: sub.name,
      amount: sub.amount,
      payment: sub.payment,
      category: "subs",
      source: "subscription",
      fingerprint: fp,
    });
    added++;
  }
  return added;
}

/* ---------------- 画像アップロード ---------------- */

export async function uploadReceiptImage(file) {
  if (!isFirebaseReady()) return null;
  const storage = getStore();
  const name = `receipts/${Date.now()}_${file.name || "image"}`;
  const r = ref(storage, name);
  await uploadBytes(r, file);
  return await getDownloadURL(r);
}
