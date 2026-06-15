// アプリ設定を localStorage で管理。
// Anthropic API キーは機微情報なのでリポジトリ／公開サイトには絶対に含めず、
// ユーザーが設定画面で入力したものをこのブラウザにのみ保存する。

const LS = {
  anthropicKey: "pocketlog.anthropicKey",
  anthropicModel: "pocketlog.anthropicModel",
  firebaseConfig: "pocketlog.firebaseConfig",
  budgets: "pocketlog.budgets",
  budgetAlert: "pocketlog.budgetAlert",
};

export const DEFAULT_MODEL = "claude-sonnet-4-6";

export function getAnthropicKey() {
  return localStorage.getItem(LS.anthropicKey) || "";
}
export function setAnthropicKey(v) {
  localStorage.setItem(LS.anthropicKey, v.trim());
}

export function getAnthropicModel() {
  return localStorage.getItem(LS.anthropicModel) || DEFAULT_MODEL;
}
export function setAnthropicModel(v) {
  localStorage.setItem(LS.anthropicModel, v || DEFAULT_MODEL);
}

// Firebase の web 設定（apiKey 等）は秘匿情報ではなく公開して問題ない。
// .env (VITE_FIREBASE_*) を優先し、なければ設定画面で貼り付けた値を使う。
export function getFirebaseConfigOverride() {
  try {
    const raw = localStorage.getItem(LS.firebaseConfig);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
export function setFirebaseConfigOverride(obj) {
  if (!obj) {
    localStorage.removeItem(LS.firebaseConfig);
  } else {
    localStorage.setItem(LS.firebaseConfig, JSON.stringify(obj));
  }
}

// カテゴリ別 月予算 { food: 30000, ... }（0/未設定は予算なし）
export function getBudgets() {
  try {
    return JSON.parse(localStorage.getItem(LS.budgets) || "{}");
  } catch {
    return {};
  }
}
export function setBudgets(obj) {
  localStorage.setItem(LS.budgets, JSON.stringify(obj || {}));
}

// 予算超過アラートの ON/OFF（既定 ON）
export function getBudgetAlertEnabled() {
  return localStorage.getItem(LS.budgetAlert) !== "0";
}
export function setBudgetAlertEnabled(on) {
  localStorage.setItem(LS.budgetAlert, on ? "1" : "0");
}
