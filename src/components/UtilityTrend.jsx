import { useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { useApp } from "../context/AppContext";
import { listUtilities, getUtility, upsertUtility } from "../data/store";
import { UTILITIES } from "../data/constants";
import { yen } from "../lib/format";
import { toMonthKey, shiftMonthKey, monthLabel } from "../lib/date";
import "./UtilityTrend.css";

const MONTHS_BACK = 6;

function TipBox({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tip">
      <div className="chart-tip__label">{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="util-tip__row">
          <span style={{ color: p.color }}>●</span> {p.name}：{yen(p.value)}
        </div>
      ))}
    </div>
  );
}

export default function UtilityTrend() {
  const { ready, refreshKey } = useApp();
  const thisKey = toMonthKey(new Date());

  // 直近6ヶ月（古い→新しい）
  const monthKeys = useMemo(
    () =>
      Array.from({ length: MONTHS_BACK }, (_, i) =>
        shiftMonthKey(thisKey, -(MONTHS_BACK - 1 - i))
      ),
    [thisKey]
  );

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  // 入力フォーム
  const [editMonth, setEditMonth] = useState(thisKey);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");

  const reload = async () => {
    if (!ready) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setRows(await listUtilities(monthKeys));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, refreshKey, thisKey]);

  // 選択月の既存値をフォームに読み込む
  useEffect(() => {
    if (!ready) return;
    getUtility(editMonth)
      .then((u) => {
        const next = {};
        for (const util of UTILITIES) next[util.id] = u?.[util.id] ?? "";
        setForm(next);
      })
      .catch(() => setForm({}));
  }, [editMonth, ready, refreshKey]);

  const chartData = useMemo(
    () =>
      monthKeys.map((k) => {
        const found = rows.find((r) => r.monthKey === k) || {};
        const point = { label: monthLabel(k).replace(/^\d+年/, "") };
        for (const u of UTILITIES) point[u.id] = Number(found[u.id]) || 0;
        return point;
      }),
    [rows, monthKeys]
  );

  const hasData = chartData.some((d) =>
    UTILITIES.some((u) => d[u.id] > 0)
  );

  const save = async () => {
    setSaving(true);
    setSavedMsg("");
    try {
      await upsertUtility(editMonth, form);
      await reload();
      setSavedMsg("保存しました");
      setTimeout(() => setSavedMsg(""), 2000);
    } finally {
      setSaving(false);
    }
  };

  const monthOptions = useMemo(
    () =>
      Array.from({ length: 13 }, (_, i) => shiftMonthKey(thisKey, -i)),
    [thisKey]
  );

  const formTotal = UTILITIES.reduce((s, u) => s + (Number(form[u.id]) || 0), 0);

  return (
    <section className="card util">
      <h3 className="util__title">インフラ費の推移</h3>
      <p className="util__sub">光熱費・水道・電気・ネット・携帯（支出とは別管理・手入力）</p>

      {!ready ? (
        <p className="chart-empty">Firebase 未接続です。設定画面から接続してください。</p>
      ) : loading ? (
        <p className="chart-empty">読み込み中…</p>
      ) : !hasData ? (
        <p className="chart-empty">まだデータがありません。下の入力欄から登録してください。</p>
      ) : (
        <ResponsiveContainer width="100%" height={210}>
          <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="rgba(0,0,0,0.05)" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--text-faint)" }}
              tickLine={false} axisLine={false} />
            <YAxis width={46} tick={{ fontSize: 10, fill: "var(--text-faint)" }}
              tickLine={false} axisLine={false}
              tickFormatter={(v) => "¥" + Number(v).toLocaleString("ja-JP")} />
            <Tooltip content={<TipBox />} />
            <Legend wrapperStyle={{ fontSize: 11 }} iconType="plainline" />
            {UTILITIES.map((u) => (
              <Line key={u.id} type="monotone" dataKey={u.id} name={u.label}
                stroke={u.color} strokeWidth={2.4} dot={{ r: 2.5 }} activeDot={{ r: 4 }} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}

      {/* 入力フォーム */}
      <div className="util__form">
        <div className="util__form-head">
          <span>登録・編集する月</span>
          <select value={editMonth} onChange={(e) => setEditMonth(e.target.value)} disabled={!ready}>
            {monthOptions.map((k) => (
              <option key={k} value={k}>{monthLabel(k)}</option>
            ))}
          </select>
        </div>

        <div className="util__inputs">
          {UTILITIES.map((u) => (
            <label className="util__inp" key={u.id}>
              <span><i style={{ background: u.color }} />{u.label}</span>
              <div className="util__inp-row">
                <input type="number" inputMode="numeric" placeholder="0"
                  value={form[u.id] ?? ""} disabled={!ready}
                  onChange={(e) => setForm({ ...form, [u.id]: e.target.value })} />
                <em>円</em>
              </div>
            </label>
          ))}
        </div>

        <div className="util__total">
          <span>合計</span>
          <strong>{yen(formTotal)}</strong>
        </div>

        <button className="btn btn--block" onClick={save} disabled={!ready || saving}>
          {saving ? <span className="spin" /> : "この月のインフラ費を保存"}
        </button>
        {savedMsg && <p className="set__ok">{savedMsg}</p>}
      </div>
    </section>
  );
}
