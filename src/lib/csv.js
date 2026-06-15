import { toDateKey } from "./date";

// 文字コード判定：UTF-8 で読んで文字化け（U+FFFD）が多ければ Shift_JIS とみなす。
export function decodeBuffer(buf) {
  const utf8 = new TextDecoder("utf-8").decode(buf);
  const bad = (utf8.match(/�/g) || []).length;
  if (bad > 2) {
    try {
      return new TextDecoder("shift_jis").decode(buf);
    } catch {
      return utf8;
    }
  }
  return utf8;
}

// RFC4180 風の CSV パーサ（ダブルクォート対応）。
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  const s = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inQuotes) {
      if (c === '"') {
        if (s[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += c;
    }
  }
  if (field !== "" || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

const DATE_KEYS = ["日付", "取引日", "利用日", "日時", "ご利用日", "date", "取引日時"];
const AMOUNT_KEYS = [
  "利用金額", "決済金額", "ご利用金額", "支払金額", "出金", "支払", "金額", "amount", "price",
];
const STORE_KEYS = [
  "利用店名", "ご利用先", "取引先", "店舗名", "店舗", "内容", "摘要", "説明", "利用内容", "name", "description", "メモ",
];

function findIdx(header, keys) {
  const norm = header.map((h) => (h || "").trim().toLowerCase());
  for (const k of keys) {
    const i = norm.findIndex((h) => h.includes(k.toLowerCase()));
    if (i !== -1) return i;
  }
  return -1;
}

export function detectColumns(header) {
  return {
    date: findIdx(header, DATE_KEYS),
    amount: findIdx(header, AMOUNT_KEYS),
    store: findIdx(header, STORE_KEYS),
  };
}

// "1,234" "¥1,234" "-1,234" "(1,234)" → 数値
export function parseAmount(v) {
  if (v == null) return 0;
  let s = String(v).trim();
  const paren = /^\(.*\)$/.test(s);
  s = s.replace(/[¥,円\s()]/g, "");
  let n = parseFloat(s);
  if (isNaN(n)) return 0;
  if (paren) n = -Math.abs(n);
  return Math.abs(Math.round(n)); // 支出として正の額に正規化
}

// "2026/6/1" "2026-06-01" "2026年6月1日" "06/01" → YYYY-MM-DD
export function parseDate(v) {
  if (!v) return "";
  const s = String(v).trim();
  let m = s.match(/(\d{4})[\/\-年.](\d{1,2})[\/\-月.](\d{1,2})/);
  if (m) {
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    return toDateKey(d);
  }
  const parsed = new Date(s);
  if (!isNaN(parsed)) return toDateKey(parsed);
  return "";
}

// 重複判定用の指紋（取込元・日付・金額・店舗）
export function fingerprintOf({ payment, date, amount, store }) {
  return [payment, date, amount, (store || "").slice(0, 24)].join("|");
}

// CSV テキスト → 取込候補レコード配列
export function csvToCandidates(text, paymentId) {
  const rows = parseCsv(text);
  if (!rows.length) return { columns: null, items: [] };

  // ヘッダー行を推定（カラム検出が当たる最初の行）
  let headerIdx = 0;
  let cols = detectColumns(rows[0]);
  for (let i = 0; i < Math.min(rows.length, 5); i++) {
    const c = detectColumns(rows[i]);
    if (c.amount !== -1 && c.date !== -1) {
      cols = c;
      headerIdx = i;
      break;
    }
  }

  const items = [];
  for (let i = headerIdx + 1; i < rows.length; i++) {
    const r = rows[i];
    const amount = cols.amount !== -1 ? parseAmount(r[cols.amount]) : 0;
    if (!amount) continue;
    const date = cols.date !== -1 ? parseDate(r[cols.date]) : "";
    const store = cols.store !== -1 ? (r[cols.store] || "").trim() : "";
    const rec = {
      date: date || toDateKey(new Date()),
      store,
      amount,
      payment: paymentId,
      category: "other",
      source: "csv",
    };
    rec.fingerprint = fingerprintOf(rec);
    items.push(rec);
  }
  return { columns: cols, items };
}
