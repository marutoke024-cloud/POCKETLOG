import { useState } from "react";
import { useApp } from "../context/AppContext";
import {
  getGeminiKey,
  setGeminiKey,
  getGeminiModel,
  setGeminiModel,
  getFirebaseConfigOverride,
  setFirebaseConfigOverride,
  DEFAULT_MODEL,
} from "../lib/settings";
import { resolveFirebaseConfig } from "../firebase/config";
import { PAYMENT_METHODS } from "../data/constants";
import SubscriptionManager from "../components/SubscriptionManager";
import BudgetSettings from "../components/BudgetSettings";
import "./Settings.css";

export default function Settings() {
  const { ready, reconnectFirebase } = useApp();
  const [key, setKey] = useState(getGeminiKey());
  const [model, setModel] = useState(getGeminiModel());
  const [savedMsg, setSavedMsg] = useState("");

  const envHasFirebase = !!resolveFirebaseConfig() && !getFirebaseConfigOverride();
  const [cfgText, setCfgText] = useState(() => {
    const o = getFirebaseConfigOverride();
    return o ? JSON.stringify(o, null, 2) : "";
  });
  const [cfgMsg, setCfgMsg] = useState("");

  const saveKey = () => {
    setGeminiKey(key);
    setGeminiModel(model);
    setSavedMsg("保存しました");
    setTimeout(() => setSavedMsg(""), 2000);
  };

  const saveFirebase = () => {
    try {
      const obj = parseConfig(cfgText);
      setFirebaseConfigOverride(obj);
      reconnectFirebase();
      setCfgMsg("接続情報を保存しました");
      setTimeout(() => setCfgMsg(""), 2500);
    } catch (e) {
      setCfgMsg("形式エラー: " + e.message);
    }
  };

  return (
    <div className="screen settings fade-in">
      <h2 className="screen-title">設定</h2>

      {/* AI / API キー */}
      <section className="card set">
        <h3 className="set__title">AI（Gemini API）</h3>
        <p className="set__note">
          Google AI Studio の無料枠が使えます。キーはこの端末のブラウザにのみ保存され、リポジトリや公開サイトには含まれません。
          <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">
            {" "}Google AI Studio で発行 ↗
          </a>
        </p>
        <div className="field">
          <label>API キー</label>
          <input type="password" value={key} placeholder="AIza..."
            onChange={(e) => setKey(e.target.value)} />
        </div>
        <div className="field">
          <label>モデル</label>
          <input value={model} placeholder={DEFAULT_MODEL}
            onChange={(e) => setModel(e.target.value)} />
        </div>
        <button className="btn btn--block" onClick={saveKey}>保存する</button>
        {savedMsg && <p className="set__ok">{savedMsg}</p>}
      </section>

      {/* Firebase */}
      <section className="card set">
        <h3 className="set__title">
          Firebase 接続
          <span className={`set__status ${ready ? "is-ok" : "is-ng"}`}>
            {ready ? "接続済み" : "未接続"}
          </span>
        </h3>
        {envHasFirebase ? (
          <p className="set__note">
            .env（VITE_FIREBASE_*）から設定を読み込んでいます。上書きする場合のみ下に貼り付けてください。
          </p>
        ) : (
          <p className="set__note">
            Firebase コンソール → プロジェクト設定 → マイアプリ の
            <code> firebaseConfig </code> オブジェクトを貼り付けてください。
          </p>
        )}
        <div className="field">
          <label>firebaseConfig（JSON）</label>
          <textarea rows={8} value={cfgText} spellCheck={false}
            onChange={(e) => setCfgText(e.target.value)}
            placeholder={'{\n  "apiKey": "...",\n  "authDomain": "...",\n  "projectId": "...",\n  "storageBucket": "...",\n  "messagingSenderId": "...",\n  "appId": "..."\n}'} />
        </div>
        <button className="btn btn--block" onClick={saveFirebase}>保存して接続</button>
        {cfgMsg && <p className="set__ok">{cfgMsg}</p>}
      </section>

      {/* 支払い方法（カスタマイズはフェーズ3） */}
      <section className="card set">
        <h3 className="set__title">支払い方法</h3>
        <ul className="set__pays">
          {PAYMENT_METHODS.map((p) => (
            <li key={p.id}>{p.label}</li>
          ))}
        </ul>
        <span className="pill">カスタマイズはフェーズ3で実装予定</span>
      </section>

      <section className="card set">
        <h3 className="set__title">定期サブスク管理</h3>
        <p className="set__note">
          登録したサブスクは、引き落とし日になると当月の支出（サブスク）へ自動で反映されます。
        </p>
        <SubscriptionManager />
      </section>

      <section className="card set">
        <h3 className="set__title">カテゴリ別 月予算・超過アラート</h3>
        <p className="set__note">
          カテゴリごとに月の予算を設定すると、超過時にホーム画面で警告します。
        </p>
        <BudgetSettings />
      </section>

      <p className="set__ver">POCKETLOG · your money, visible</p>
    </div>
  );
}

// JSON / JS オブジェクトリテラル（キー無引用符）両対応のゆるいパース
function parseConfig(text) {
  const t = text.trim();
  if (!t) throw new Error("空です");
  try {
    return JSON.parse(t);
  } catch {
    // const firebaseConfig = { ... }; のような貼り付けにも対応
    const m = t.match(/\{[\s\S]*\}/);
    if (!m) throw new Error("オブジェクトが見つかりません");
    // eslint-disable-next-line no-new-func
    return Function(`"use strict";return (${m[0]})`)();
  }
}
