// 金額は必ず円表記・カンマ区切り。「k」省略は禁止。
export function yen(value) {
  const n = Math.round(Number(value) || 0);
  return "¥" + n.toLocaleString("ja-JP");
}

// 符号付き（先月比など）。プラスを明示。
export function yenSigned(value) {
  const n = Math.round(Number(value) || 0);
  const sign = n > 0 ? "+" : n < 0 ? "−" : "±";
  return sign + "¥" + Math.abs(n).toLocaleString("ja-JP");
}

export function percent(value, digits = 0) {
  const n = Number(value) || 0;
  return n.toFixed(digits) + "%";
}

export function percentSigned(value, digits = 0) {
  const n = Number(value) || 0;
  const sign = n > 0 ? "+" : n < 0 ? "−" : "±";
  return sign + Math.abs(n).toFixed(digits) + "%";
}
