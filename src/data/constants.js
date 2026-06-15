// カテゴリ定義（色は theme.css の CSS 変数に対応）
export const CATEGORIES = [
  { id: "food", label: "食費", color: "var(--cat-food)" },
  { id: "daily", label: "日用品", color: "var(--cat-daily)" },
  { id: "transport", label: "交通費", color: "var(--cat-transport)" },
  { id: "comm", label: "通信費", color: "var(--cat-comm)" },
  { id: "fun", label: "娯楽", color: "var(--cat-fun)" },
  { id: "shopping", label: "ショッピング", color: "var(--cat-shopping)" },
  { id: "subs", label: "サブスク", color: "var(--cat-subs)" },
  { id: "other", label: "その他", color: "var(--cat-other)" },
];

export const CATEGORY_MAP = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c])
);

export function categoryLabel(id) {
  return CATEGORY_MAP[id]?.label ?? "その他";
}
export function categoryColor(id) {
  return CATEGORY_MAP[id]?.color ?? "var(--cat-other)";
}

// 支払い方法（仕様の表記ゆれを id に正規化）
export const PAYMENT_METHODS = [
  { id: "paypay", label: "PayPay" },
  { id: "paypay_credit", label: "PayPayクレジット" },
  { id: "bandle", label: "BANDLE Visaカード" },
  { id: "atone", label: "atone後払い" },
  { id: "cash", label: "現金" },
];

export const PAYMENT_MAP = Object.fromEntries(
  PAYMENT_METHODS.map((p) => [p.id, p])
);

export function paymentLabel(id) {
  return PAYMENT_MAP[id]?.label ?? "その他";
}

// 入力方法
export const INPUT_SOURCES = {
  receipt: "レシート読取",
  csv: "CSV取込",
  voice: "音声入力",
  text: "テキスト入力",
  manual: "手動入力",
};

// 収入種別
export const INCOME_TYPES = [
  { id: "salary", label: "給与" },
  { id: "bonus", label: "ボーナス" },
  { id: "other", label: "その他" },
];

// ユーザー固定情報（AI のコンテキストに使用）
export const USER_PROFILE = {
  paydayDay: 20, // 毎月20日が給料日
  monthlyReportDay: 19, // 毎月19日にレポート自動表示
  bank: "三井住友銀行 天六支店",
  payments: ["PayPay", "PayPayクレジット", "BANDLE Visaカード", "atone後払い"],
  ec: ["メルカリ", "Amazon"],
  notes: "携帯料金引き落とし＋コンビニ支払い（紙）あり",
  goals: "貯蓄ができていない、NISAをまだ始められていない",
};
