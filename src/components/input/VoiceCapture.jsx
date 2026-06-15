import { useEffect, useRef, useState } from "react";
import { isSpeechSupported, createRecognizer } from "../../lib/speech";

// マイクで話した内容をテキスト化し、確定したら onAnalyze(text) に渡す。
export default function VoiceCapture({ onAnalyze, busy, error }) {
  const supported = isSpeechSupported();
  const [listening, setListening] = useState(false);
  const [text, setText] = useState("");
  const [interim, setInterim] = useState("");
  const [localErr, setLocalErr] = useState("");
  const recRef = useRef(null);

  useEffect(() => {
    if (!supported) return;
    recRef.current = createRecognizer({
      onResult: (t) => setText(t),
      onInterim: (t) => setInterim(t),
      onError: (e) => {
        setLocalErr(
          e === "not-allowed"
            ? "マイクの使用が許可されていません。"
            : "認識に失敗しました。もう一度お試しください。"
        );
        setListening(false);
      },
      onEnd: () => {
        setListening(false);
        setInterim("");
      },
    });
    return () => recRef.current?.abort();
  }, [supported]);

  const toggle = () => {
    setLocalErr("");
    if (listening) {
      recRef.current?.stop();
    } else {
      setText("");
      setInterim("");
      setListening(true);
      recRef.current?.start();
    }
  };

  if (!supported) {
    return (
      <p className="sheet__error">
        このブラウザは音声入力（Web Speech API）に対応していません。Android Chrome 等でお試しください。
      </p>
    );
  }

  const shown = text || interim;

  return (
    <div className="voice">
      <button
        className={`voice__mic ${listening ? "is-on" : ""}`}
        onClick={toggle}
        disabled={busy}
        aria-label="マイク"
      >
        <svg viewBox="0 0 24 24" width="34" height="34" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <rect x="9" y="3" width="6" height="11" rx="3" />
          <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
        </svg>
      </button>
      <p className="voice__hint">
        {listening ? "聞き取り中… もう一度タップで停止" : "タップして話す"}
      </p>

      <div className="voice__text">
        {shown ? shown : <span className="muted">例：さっきセブンで780円使った</span>}
      </div>

      {(localErr || error) && <p className="sheet__error">{localErr || error}</p>}

      <button
        className="btn btn--block"
        disabled={!text || busy || listening}
        onClick={() => onAnalyze(text)}
      >
        {busy ? <span className="spin" /> : "AIで解析する"}
      </button>
    </div>
  );
}
