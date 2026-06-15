import { getAnthropicKey, getAnthropicModel } from "./settings";
import { CATEGORIES, PAYMENT_METHODS } from "../data/constants";

const API_URL = "https://api.anthropic.com/v1/messages";

export class AnthropicError extends Error {}

async function callAnthropic({ system, content, maxTokens = 1500 }) {
  const key = getAnthropicKey();
  if (!key) {
    throw new AnthropicError(
      "Anthropic API キーが未設定です。設定画面で入力してください。"
    );
  }
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      // 静的サイト（ブラウザ）から直接呼ぶために必要
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: getAnthropicModel(),
      max_tokens: maxTokens,
      ...(system ? { system } : {}),
      messages: [{ role: "user", content }],
    }),
  });

  if (!res.ok) {
    let detail = "";
    try {
      const j = await res.json();
      detail = j?.error?.message || JSON.stringify(j);
    } catch {
      detail = await res.text();
    }
    throw new AnthropicError(`API エラー (${res.status}): ${detail}`);
  }
  const data = await res.json();
  return data?.content?.map((c) => c.text || "").join("") || "";
}

// マルチターン会話（チャット・レポート生成用）
async function chatCompletion({ system, messages, maxTokens = 1200 }) {
  const key = getAnthropicKey();
  if (!key) {
    throw new AnthropicError(
      "Anthropic API キーが未設定です。設定画面で入力してください。"
    );
  }
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: getAnthropicModel(),
      max_tokens: maxTokens,
      ...(system ? { system } : {}),
      messages,
    }),
  });
  if (!res.ok) {
    let detail = "";
    try {
      const j = await res.json();
      detail = j?.error?.message || JSON.stringify(j);
    } catch {
      detail = await res.text();
    }
    throw new AnthropicError(`API エラー (${res.status}): ${detail}`);
  }
  const data = await res.json();
  return data?.content?.map((c) => c.text || "").join("") || "";
}

// ユーザー専属ファイナンシャルアドバイザーのシステムプロンプト（仕様準拠）
function advisorSystemPrompt(contextText) {
  return `あなたはユーザー専属のファイナンシャルアドバイザーです。
以下のユーザー情報と直近の収支データを踏まえてアドバイスしてください。

【ユーザー情報】
- 給料日：毎月20日
- 決済手段：PayPay、PayPayクレジット、BANDLE Visaカード、atone後払い
- よく使うEC：メルカリ、Amazon
- インフラ費：携帯料金引き落とし＋コンビニ支払い（紙）あり
- 課題：貯蓄ができていない、NISAをまだ始められていない

${contextText}

アドバイスの方針：
- atone後払いの残高リスクに注意を促す
- 給料日に先取り貯蓄の仕組みを提案
- NISAつみたて投資枠の具体的な始め方を案内
- 支出カテゴリの偏りを指摘して改善提案
- 厳しくなりすぎず、実行しやすい小さなステップで提案する`;
}

// 目標への伴走チャット：これまでの会話＋直近データで返答
export async function chatAdvisor(messages, contextText) {
  return chatCompletion({
    system: advisorSystemPrompt(contextText),
    messages,
    maxTokens: 1024,
  });
}

// 月次レポートの文章生成
export async function generateMonthlyReport(contextText) {
  const system = advisorSystemPrompt(contextText);
  const ask = `今月の月次レポートを日本語で作成してください。次の見出しで、簡潔に箇条書き中心でまとめてください（前置き不要）：

## 今月のサマリー
## 先月比での改善点
## 先月比での悪化点
## 来月に向けた具体的な改善提案
## NISA・貯蓄目標への進捗コメント

金額は必ず「¥1,234」の形式（カンマ区切り、k省略禁止）で書いてください。`;
  return chatCompletion({
    system,
    messages: [{ role: "user", content: ask }],
    maxTokens: 1500,
  });
}

// 応答からJSONを安全に取り出す
function parseJsonLoose(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced ? fenced[1] : text;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) throw new AnthropicError("解析結果を読み取れませんでした。");
  return JSON.parse(raw.slice(start, end + 1));
}

const CATEGORY_IDS = CATEGORIES.map((c) => `${c.id}(${c.label})`).join(", ");
const PAYMENT_IDS = PAYMENT_METHODS.map((p) => `${p.id}(${p.label})`).join(", ");

/**
 * レシート / 明細 / 注文履歴の画像から支出情報を抽出。
 * @param {string} base64 data URL ではなく純粋な base64 文字列
 * @param {string} mediaType 例: "image/jpeg"
 */
export async function extractReceipt(base64, mediaType) {
  const system = `あなたは日本のレシート・決済明細・EC注文履歴の画像から支出データを抽出する専門アシスタントです。
必ず次のJSONのみを出力してください（説明文やマークダウンは不要）:
{
  "store": "店舗名/サービス名",
  "date": "YYYY-MM-DD",        // 読み取れなければ空文字
  "time": "HH:MM",             // 読み取れなければ空文字
  "items": [{"name":"品目","price":数値}],
  "total": 数値,                // 合計金額（税込）
  "category": "次のidから1つ: ${CATEGORY_IDS}",
  "payment": "次のidから1つ推定: ${PAYMENT_IDS}"
}
金額は整数の円。読み取れない項目は空文字または0。itemsが不明なら空配列。`;

  const text = await callAnthropic({
    system,
    maxTokens: 2000,
    content: [
      {
        type: "image",
        source: { type: "base64", media_type: mediaType, data: base64 },
      },
      {
        type: "text",
        text: "この画像から支出データを抽出し、指定のJSONのみを返してください。",
      },
    ],
  });

  const parsed = parseJsonLoose(text);
  return normalizeExtracted(parsed);
}

/**
 * 自然言語テキストから支出情報を抽出（フェーズ2の音声/テキスト入力で使用）。
 */
export async function parseExpenseText(input) {
  const today = new Date();
  const system = `あなたは日本語の家計入力アシスタントです。ユーザーの一言から支出を構造化します。
今日の日付は ${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")} です。
「昨日」「さっき」等の相対表現は実際の日付に変換してください。
必ず次のJSONのみを出力:
{
  "store": "店舗名",
  "date": "YYYY-MM-DD",
  "items": [{"name":"品目","price":数値}],
  "total": 数値,
  "category": "次のidから1つ: ${CATEGORY_IDS}",
  "payment": "次のidから1つ推定: ${PAYMENT_IDS}"
}`;
  const text = await callAnthropic({
    system,
    content: [{ type: "text", text: input }],
  });
  const parsed = parseJsonLoose(text);
  return normalizeExtracted(parsed);
}

function normalizeExtracted(p) {
  const validCat = CATEGORIES.some((c) => c.id === p.category);
  const validPay = PAYMENT_METHODS.some((m) => m.id === p.payment);
  const items = Array.isArray(p.items)
    ? p.items
        .map((it) => ({
          name: String(it.name || "").trim(),
          price: Number(it.price) || 0,
        }))
        .filter((it) => it.name || it.price)
    : [];
  let total = Number(p.total) || 0;
  if (!total && items.length) {
    total = items.reduce((s, it) => s + it.price, 0);
  }
  return {
    store: String(p.store || "").trim(),
    date: /^\d{4}-\d{2}-\d{2}$/.test(p.date) ? p.date : "",
    time: /^\d{1,2}:\d{2}$/.test(p.time || "") ? p.time : "",
    items,
    amount: total,
    category: validCat ? p.category : "other",
    payment: validPay ? p.payment : "cash",
  };
}
