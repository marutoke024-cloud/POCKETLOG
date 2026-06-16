// Firebase などのエラーをユーザー向けの分かりやすい日本語へ変換する。
export function friendlyError(e) {
  const msg = e?.message || String(e || "");
  const code = e?.code || "";

  if (
    /insufficient permissions|permission[-_ ]?denied/i.test(msg) ||
    code === "permission-denied"
  ) {
    return "保存できませんでした：Firestore の書き込み権限がありません。Firebase コンソールでセキュリティルールを公開してください（設定画面の案内 / README 参照）。";
  }
  if (/quota|resource[-_ ]?exhausted/i.test(msg) || code === "resource-exhausted") {
    return "Firebase の利用枠の上限に達した可能性があります。時間をおいて再度お試しください。";
  }
  if (/unavailable|network|failed to get|offline/i.test(msg)) {
    return "ネットワークに接続できませんでした。通信環境をご確認ください。";
  }
  if (/unauthenticated/i.test(msg) || code === "unauthenticated") {
    return "認証が必要です。Firebase Authentication の設定をご確認ください。";
  }
  return msg;
}
