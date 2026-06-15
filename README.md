# POCKETLOG — your money, visible

PayPay / atone / クレカ中心の生活に合わせた収支管理 PWA。
React (Vite) + Firebase + Gemini Vision で、レシートを撮るだけで家計を見える化します。

> このリポジトリは**フェーズ1〜3（全機能）**の実装です。

---

## 1. セットアップ

```bash
npm install
npm run dev        # http://localhost:5173
```

ビルド / プレビュー:

```bash
npm run build
npm run preview
```

アイコン（PWA 用 PNG）を作り直す場合:

```bash
npm run icons
```

---

## 2. Firebase プロジェクトのセットアップ手順

1. **プロジェクト作成**
   [Firebase コンソール](https://console.firebase.google.com/) →「プロジェクトを追加」→ 名前を `pocketlog` 等にして作成（Google アナリティクスは任意）。

2. **Firestore Database を有効化**
   左メニュー「構築 → Firestore Database」→「データベースの作成」→ ロケーションは `asia-northeast1`（東京）→ **テストモードで開始**（後でルールを差し替え）。

3. **Storage を有効化**
   「構築 → Storage」→「始める」→ 同じく `asia-northeast1` →テストモードで開始。
   （レシート画像の保存先になります）

4. **Web アプリを登録して設定値を取得**
   プロジェクト設定（⚙）→「マイアプリ」→ `</>`（ウェブ）アイコン →アプリ名を入力して登録。
   表示される `firebaseConfig` オブジェクトを控えます:

   ```js
   const firebaseConfig = {
     apiKey: "....",
     authDomain: "pocketlog-xxxx.firebaseapp.com",
     projectId: "pocketlog-xxxx",
     storageBucket: "pocketlog-xxxx.appspot.com",
     messagingSenderId: "....",
     appId: "....",
   };
   ```

5. **設定値をアプリに渡す（どちらか）**

   - **方法A（推奨・お手軽）**: アプリ起動後 → 設定画面 → 「Firebase 接続」に上の `firebaseConfig` をそのまま貼り付けて「保存して接続」。この端末のブラウザに保存されます。
   - **方法B（ビルドに埋め込む）**: `.env.example` を `.env.local` にコピーして各値を記入。
     ```
     VITE_FIREBASE_API_KEY=...
     VITE_FIREBASE_PROJECT_ID=...
     ...
     ```

   > Firebase の web 設定値は秘匿情報ではなく公開しても問題ありません（保護は下のセキュリティルールで行います）。

6. **セキュリティルールの適用**
   動作確認は上記テストモードのままでOK。公開URLで使う場合は
   [`firestore.rules`](firestore.rules) / [`storage.rules`](storage.rules) を参考に、
   Firebase Authentication を導入して**自分だけ**に制限してください。

---

## 3. Gemini API（レシート読取・自然言語解析・AIアドバイス・月次レポート）

- [Google AI Studio](https://aistudio.google.com/apikey) で API キーを発行（**無料枠**あり）。
- アプリの **設定画面 → AI（Gemini API）** にキーを入力（モデル既定値: `gemini-2.5-flash-lite`）。
- キーは**この端末の localStorage にのみ**保存され、リポジトリや公開サイトには含まれません。
- レシート/明細画像の読み取り、自然言語・音声入力の解析、AIアドバイス、月次レポートの文章生成はすべて Gemini API で処理します。

> ⚠️ 静的サイト（GitHub Pages）から直接 API を叩くため、キーはブラウザに置く方式です。
> より厳密に隠したい場合はサーバー（Cloudflare Workers / Firebase Functions）のプロキシ経由に差し替えてください。

---

## 4. GitHub Pages へデプロイ

`vite.config.js` は `base: "./"`、ルーティングは `HashRouter` のため、サブパスでもそのまま動きます。

```bash
npm install -D gh-pages   # 初回のみ
npm run deploy            # build して dist を gh-pages ブランチへ公開
```

リポジトリの Settings → Pages で、Branch を `gh-pages` に設定。
（Anthropic / Firebase の設定値はビルドに含めず、公開後にアプリの設定画面から入力する運用が安全です）

---

## 5. PWA（ホーム画面に追加）

- `public/manifest.json` と `public/sw.js` を同梱。Service Worker は本番ビルドでのみ登録されます。
- Android Chrome で公開URLを開く → メニュー →「ホーム画面に追加」でアイコン設置。
- テーマカラー `#3d6d79` / アプリ名 `POCKETLOG`。

---

## 6. ディレクトリ構成

```
src/
  App.jsx                 ルーティング＋スプラッシュ＋ボトムナビ＋入力フロー
  main.jsx                エントリ／SW 登録
  styles/                 デザイントークン・共通スタイル
  data/
    constants.js          カテゴリ／支払い方法／ユーザー情報
    store.js              Firestore CRUD・画像アップロード
  firebase/config.js      Firebase 初期化（env / 設定画面 の両対応）
  lib/
    ai.js                 Gemini：Vision抽出・テキスト解析・チャット・レポート生成
    date.js               給料日(20日)起点の期間ロジック
    aggregate.js          集計（カテゴリ別・推移・先月比）
    format.js             金額表記（¥・カンマ区切り）
    advice.js             ホームの簡易アドバイス
    image.js / settings.js
    financeContext.js     直近3ヶ月集計（レポート/チャットのAIコンテキスト）
    budget.js             予算消化状況の算出
  hooks/useExpenses.js    月次データ読み込み
  components/
    Splash.jsx            起動アニメーション
    BottomNav.jsx         ボトムナビ＋中央FAB
    input/                入力フロー（レシート/CSV/音声/テキスト/手動）＋確認フォーム
    sim/                  貯金・NISAシミュレーター・atoneアラート
    UtilityTrend          インフラ費（光熱費/水道/電気/ネット/携帯）の推移・手入力
    charts/               ドーナツ・折れ線
    SubscriptionManager   定期サブスク管理
    BudgetSettings        カテゴリ別予算・アラート
    IncomeModal           収入登録
    MonthlyReport         月次レポート（19日自動表示）
    MiniMarkdown          AI応答の簡易マークダウン描画
  screens/
    Home / History / Graph / Settings / Chat（目標への伴走）
```

---

## 7. フェーズ進捗

- [x] フェーズ1: 土台・スプラッシュ・レシート読取→確認→保存・月別一覧・ホームのグラフ・PWA
- [x] フェーズ2: 自然言語/音声入力・CSV一括取込（重複チェック）・貯金/NISAシミュレーション・atoneアラート・定期サブスク管理（自動反映）
- [x] フェーズ3: 月次レポート自動表示(19日)・AIアドバイスチャット（目標への伴走）・カテゴリ別予算/超過アラート・収入登録
