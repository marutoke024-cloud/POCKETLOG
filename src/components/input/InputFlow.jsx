import { useRef, useState } from "react";
import { useApp } from "../../context/AppContext";
import { fileToBase64Scaled } from "../../lib/image";
import { extractReceipt, parseExpenseText } from "../../lib/ai";
import { addExpense, uploadReceiptImage } from "../../data/store";
import ConfirmForm from "./ConfirmForm";
import VoiceCapture from "./VoiceCapture";
import CsvImport from "./CsvImport";
import { friendlyError } from "../../lib/errors";
import "./input.css";

const OPTIONS = [
  { id: "receipt", label: "レシート・明細撮影", desc: "カメラで撮って自動読取", icon: "📷" },
  { id: "image", label: "画像ファイルを選択", desc: "保存済み画像／スクショから", icon: "🖼️" },
  { id: "csv", label: "CSVを一括取込", desc: "PayPay / BANDLE などの明細", icon: "📑" },
  { id: "voice", label: "音声で入力", desc: "話すだけで記録", icon: "🎙️" },
  { id: "text", label: "テキストで入力", desc: "「セブンで780円」のように", icon: "⌨️" },
  { id: "manual", label: "手動入力", desc: "フォームに直接入力", icon: "✍️" },
];

export default function InputFlow({ open, onClose }) {
  const { ready, bumpRefresh } = useApp();
  const [step, setStep] = useState("choose"); // choose|image|text|manual
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [extracted, setExtracted] = useState(null);
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptUrl, setReceiptUrl] = useState(null);
  const [source, setSource] = useState("manual");
  const [textInput, setTextInput] = useState("");
  const [saving, setSaving] = useState(false);

  const cameraRef = useRef(null);
  const fileRef = useRef(null);

  const close = () => {
    setStep("choose");
    setBusy(false);
    setError("");
    setExtracted(null);
    setReceiptFile(null);
    setReceiptUrl(null);
    setTextInput("");
    onClose();
  };

  const choose = (id) => {
    setError("");
    if (id === "receipt") {
      setSource("receipt");
      cameraRef.current?.click();
    } else if (id === "image") {
      setSource("receipt");
      fileRef.current?.click();
    } else if (id === "csv") {
      setSource("csv");
      setStep("csv");
    } else if (id === "voice") {
      setSource("voice");
      setStep("voice");
    } else if (id === "text") {
      setSource("text");
      setStep("text");
    } else if (id === "manual") {
      setSource("manual");
      setExtracted(null);
      setStep("manual");
    }
  };

  const onImagePicked = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setReceiptFile(file);
    setReceiptUrl(URL.createObjectURL(file));
    setStep("image");
    setBusy(true);
    setError("");
    try {
      const { base64, mediaType } = await fileToBase64Scaled(file);
      const data = await extractReceipt(base64, mediaType);
      setExtracted(data);
    } catch (err) {
      setError(err.message || "読み取りに失敗しました。");
    } finally {
      setBusy(false);
    }
  };

  const analyze = async (raw, src) => {
    const value = (raw || "").trim();
    if (!value) return;
    setBusy(true);
    setError("");
    try {
      const data = await parseExpenseText(value);
      setExtracted(data);
      setSource(src);
      setStep("image"); // 確認フォームを共通利用（image ステップが ConfirmForm を表示）
    } catch (err) {
      setError(err.message || "解析に失敗しました。");
    } finally {
      setBusy(false);
    }
  };

  const save = async (record) => {
    if (!ready) {
      setError("Firebase が未設定です。設定画面から接続してください。");
      return;
    }
    setSaving(true);
    setError("");
    try {
      let url = receiptUrl;
      if (receiptFile) {
        const uploaded = await uploadReceiptImage(receiptFile);
        if (uploaded) url = uploaded;
      }
      await addExpense({ ...record, receiptUrl: receiptFile ? url : null });
      bumpRefresh();
      close();
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  const showConfirm =
    (step === "image" && !busy && extracted) || step === "manual";

  return (
    <div className="sheet-overlay" onClick={step === "choose" ? close : undefined}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet__grip" />

        <input ref={cameraRef} type="file" accept="image/*" capture="environment"
          hidden onChange={onImagePicked} />
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={onImagePicked} />

        {step === "choose" && (
          <>
            <h3 className="sheet__title">入力方法を選ぶ</h3>
            <div className="opt-list">
              {OPTIONS.map((o) => (
                <button key={o.id} className={`opt ${o.soon ? "opt--soon" : ""}`}
                  onClick={() => !o.soon && choose(o.id)} disabled={o.soon}>
                  <span className="opt__icon">{o.icon}</span>
                  <span className="opt__text">
                    <span className="opt__label">{o.label}</span>
                    <span className="opt__desc">{o.desc}</span>
                  </span>
                </button>
              ))}
            </div>
          </>
        )}

        {step === "text" && (
          <>
            <SheetHeader title="テキストで入力" onBack={() => setStep("choose")} />
            <div className="field">
              <label>支出の内容</label>
              <textarea rows={3} autoFocus value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="例：昨日Amazonで本3冊買って4200円" />
            </div>
            {error && <p className="sheet__error">{error}</p>}
            <button className="btn btn--block" onClick={() => analyze(textInput, "text")} disabled={busy}>
              {busy ? <span className="spin" /> : "AIで解析する"}
            </button>
          </>
        )}

        {step === "voice" && (
          <>
            <SheetHeader title="音声で入力" onBack={() => setStep("choose")} />
            <VoiceCapture onAnalyze={(t) => analyze(t, "voice")} busy={busy} error={error} />
          </>
        )}

        {step === "csv" && (
          <>
            <SheetHeader title="CSVを一括取込" onBack={() => setStep("choose")} />
            <CsvImport ready={ready} onDone={() => { bumpRefresh(); close(); }} />
          </>
        )}

        {step === "image" && busy && (
          <div className="sheet__loading">
            <span className="spin spin--teal" />
            <p>画像を解析しています…</p>
          </div>
        )}

        {step === "image" && !busy && error && !extracted && (
          <>
            <SheetHeader title="読み取り失敗" onBack={() => setStep("choose")} />
            <p className="sheet__error">{error}</p>
            <button className="btn btn--block" onClick={() => setStep("choose")}>戻る</button>
          </>
        )}

        {showConfirm && (
          <>
            <SheetHeader
              title={step === "manual" ? "手動入力" : "内容を確認"}
              onBack={() => setStep("choose")}
            />
            {error && <p className="sheet__error">{error}</p>}
            <ConfirmForm
              initial={extracted}
              source={source}
              receiptUrl={step === "manual" ? null : receiptUrl}
              onSave={save}
              onCancel={close}
              saving={saving}
            />
          </>
        )}
      </div>
    </div>
  );
}

function SheetHeader({ title, onBack }) {
  return (
    <div className="sheet__header">
      <button className="sheet__back" onClick={onBack} aria-label="戻る">‹</button>
      <h3 className="sheet__title">{title}</h3>
    </div>
  );
}
