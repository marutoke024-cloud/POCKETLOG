import { useEffect, useState } from "react";
import { useApp } from "../context/AppContext";
import { buildFinanceContext } from "../lib/financeContext";
import { generateMonthlyReport } from "../lib/ai";
import { getGeminiKey } from "../lib/settings";
import { yen, yenSigned } from "../lib/format";
import { compare } from "../lib/aggregate";
import { monthLabel } from "../lib/date";
import { toMonthKey } from "../lib/date";
import MiniMarkdown from "./MiniMarkdown";
import "./MonthlyReport.css";

// 月次レポート（毎月19日に自動表示／手動でも開ける）。
export default function MonthlyReport({ open, onClose }) {
  const { ready } = useApp();
  const [ctx, setCtx] = useState(null);
  const [report, setReport] = useState("");
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setReport("");
    setError("");
    if (!ready) {
      setLoading(false);
      return;
    }
    setLoading(true);
    let alive = true;
    (async () => {
      try {
        const context = await buildFinanceContext();
        if (!alive) return;
        setCtx(context);
        setLoading(false);
        // AI 文章生成（キーがあれば）
        if (getGeminiKey()) {
          setAiLoading(true);
          const text = await generateMonthlyReport(context.text);
          if (alive) setReport(text);
        }
      } catch (e) {
        if (alive) setError(e.message || "レポートの生成に失敗しました。");
      } finally {
        if (alive) {
          setLoading(false);
          setAiLoading(false);
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, [open, ready]);

  if (!open) return null;

  const cur = ctx?.current;
  const prev = ctx?.prev;
  const cmp = cur && prev ? compare(cur.expenseTotal, prev.expenseTotal) : null;

  return (
    <div className="report-overlay">
      <div className="report">
        <div className="report__head">
          <div>
            <span className="report__badge">月次レポート</span>
            <h2 className="report__title">{monthLabel(toMonthKey(new Date()))}</h2>
          </div>
          <button className="report__close" onClick={onClose} aria-label="閉じる">×</button>
        </div>

        {!ready ? (
          <p className="report__note">Firebase が未接続です。設定画面から接続してください。</p>
        ) : loading ? (
          <div className="report__loading"><span className="spin spin--teal" /><p>集計中…</p></div>
        ) : (
          <>
            {/* ハードな数字（AIなしでも表示） */}
            <div className="report__cards">
              <div className="report__card">
                <span>支出</span>
                <strong>{yen(cur.expenseTotal)}</strong>
              </div>
              <div className="report__card">
                <span>収入</span>
                <strong>{yen(cur.income)}</strong>
              </div>
              <div className={`report__card ${cur.net < 0 ? "is-neg" : "is-pos"}`}>
                <span>収支差額</span>
                <strong>{yenSigned(cur.net)}</strong>
              </div>
            </div>

            {cmp && (
              <p className="report__compare">
                先月の支出 {yen(prev.expenseTotal)} → 今月 {yen(cur.expenseTotal)}（
                <b className={cmp.diff > 0 ? "up" : "down"}>{yenSigned(cmp.diff)}</b>）
              </p>
            )}

            {cur.ranking.length > 0 && (
              <div className="report__rank">
                <h3>カテゴリ別ランキング</h3>
                <ol>
                  {cur.ranking.slice(0, 5).map((c) => (
                    <li key={c.id}>
                      <span className="report__rank-dot" style={{ background: c.color }} />
                      <span className="report__rank-name">{c.name}</span>
                      <span className="report__rank-val">{yen(c.value)}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* AI 文章 */}
            <div className="report__ai">
              {aiLoading ? (
                <div className="report__loading"><span className="spin spin--teal" /><p>AIがレポートを作成中…</p></div>
              ) : report ? (
                <MiniMarkdown text={report} />
              ) : !getGeminiKey() ? (
                <p className="report__note">
                  設定画面で Gemini API キーを登録すると、AIによる改善提案・NISA/貯蓄コメントが表示されます。
                </p>
              ) : null}
              {error && <p className="sheet__error">{error}</p>}
            </div>

            <button className="btn btn--block" onClick={onClose}>閉じる</button>
          </>
        )}
      </div>
    </div>
  );
}
