// Web Speech API（ブラウザ標準）の薄いラッパー。
// 日本語の音声をテキストに変換して、自然言語入力と同じ解析にかける。

export function isSpeechSupported() {
  return (
    typeof window !== "undefined" &&
    (window.SpeechRecognition || window.webkitSpeechRecognition)
  );
}

export function createRecognizer({ onResult, onInterim, onError, onEnd }) {
  const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Ctor) return null;

  const rec = new Ctor();
  rec.lang = "ja-JP";
  rec.interimResults = true;
  rec.continuous = false;
  rec.maxAlternatives = 1;

  let finalText = "";

  rec.onresult = (e) => {
    let interim = "";
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const t = e.results[i][0].transcript;
      if (e.results[i].isFinal) finalText += t;
      else interim += t;
    }
    if (interim) onInterim?.(interim);
    if (finalText) onResult?.(finalText);
  };
  rec.onerror = (e) => onError?.(e.error || "音声認識エラー");
  rec.onend = () => onEnd?.(finalText);

  return {
    start: () => {
      finalText = "";
      try {
        rec.start();
      } catch {
        /* 連続 start の例外は無視 */
      }
    },
    stop: () => rec.stop(),
    abort: () => rec.abort(),
  };
}
