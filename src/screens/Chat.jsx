import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { buildFinanceContext } from "../lib/financeContext";
import { chatAdvisor } from "../lib/anthropic";
import { getAnthropicKey } from "../lib/settings";
import MiniMarkdown from "../components/MiniMarkdown";
import "./Chat.css";

const GREETING =
  "こんにちは。あなた専属のファイナンシャルアドバイザーです。貯蓄やNISA、支出の見直しなど、気になることを話しかけてください。直近の収支を踏まえて一緒に考えます。";

const SUGGESTIONS = [
  "先取り貯蓄、いくらから始められる？",
  "NISAつみたての始め方を教えて",
  "今月の支出で減らせそうなところは？",
];

export default function Chat() {
  const nav = useNavigate();
  const { ready, refreshKey } = useApp();
  const [ctx, setCtx] = useState(null);
  const [messages, setMessages] = useState([
    { role: "assistant", content: GREETING },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef(null);
  const hasKey = !!getAnthropicKey();

  useEffect(() => {
    if (!ready) return;
    buildFinanceContext()
      .then(setCtx)
      .catch(() => setCtx(null));
  }, [ready, refreshKey]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  const send = async (text) => {
    const content = (text ?? input).trim();
    if (!content || busy) return;
    if (!hasKey) {
      setError("設定画面で Anthropic API キーを登録してください。");
      return;
    }
    setError("");
    const next = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      // API に渡すのは user/assistant のやり取り（先頭の挨拶は除外）
      const apiMsgs = next
        .filter((m, i) => !(i === 0 && m.role === "assistant"))
        .map((m) => ({ role: m.role, content: m.content }));
      const reply = await chatAdvisor(apiMsgs, ctx?.text || "（収支データはまだありません）");
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (e) {
      setError(e.message || "応答の取得に失敗しました。");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="chat">
      <header className="chat__header">
        <button className="chat__back" onClick={() => nav(-1)} aria-label="戻る">‹</button>
        <div>
          <h2 className="chat__title">目標への伴走</h2>
          <span className="chat__sub">AIファイナンシャルアドバイザー</span>
        </div>
      </header>

      <div className="chat__scroll" ref={scrollRef}>
        {messages.map((m, i) => (
          <div key={i} className={`bubble bubble--${m.role}`}>
            {m.role === "assistant" ? <MiniMarkdown text={m.content} /> : m.content}
          </div>
        ))}
        {busy && (
          <div className="bubble bubble--assistant">
            <span className="chat__typing"><i /><i /><i /></span>
          </div>
        )}

        {messages.length === 1 && (
          <div className="chat__suggest">
            {SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => send(s)} disabled={busy}>{s}</button>
            ))}
          </div>
        )}
      </div>

      {!hasKey && (
        <p className="chat__warn">
          AIチャットには設定画面で Anthropic API キーの登録が必要です。
        </p>
      )}
      {error && <p className="chat__error">{error}</p>}

      <div className="chat__input">
        <input
          value={input}
          placeholder="メッセージを入力…"
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          disabled={busy}
        />
        <button className="chat__send" onClick={() => send()} disabled={busy || !input.trim()} aria-label="送信">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor"
            strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
