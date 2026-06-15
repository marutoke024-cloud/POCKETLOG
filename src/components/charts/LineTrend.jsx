import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { yen } from "../../lib/format";
import "./charts.css";

function TipBox({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tip">
      <div className="chart-tip__label">{label}</div>
      <div className="chart-tip__val">{yen(payload[0].value)}</div>
    </div>
  );
}

// 給料日起点の累積支出推移
export default function LineTrend({ data }) {
  if (!data.length) {
    return <div className="chart-empty">データがありません</div>;
  }
  const tickStep = Math.ceil(data.length / 6);
  return (
    <ResponsiveContainer width="100%" height={190}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="trendStroke" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--teal-mid)" />
            <stop offset="100%" stopColor="var(--teal-deep)" />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="rgba(0,0,0,0.05)" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: "var(--text-faint)" }}
          tickLine={false}
          axisLine={false}
          interval={tickStep - 1}
        />
        <YAxis
          width={48}
          tick={{ fontSize: 11, fill: "var(--text-faint)" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => "¥" + Number(v).toLocaleString("ja-JP")}
        />
        <Tooltip content={<TipBox />} />
        <Line
          type="monotone"
          dataKey="amount"
          stroke="url(#trendStroke)"
          strokeWidth={3}
          dot={false}
          activeDot={{ r: 5, fill: "var(--teal)" }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
