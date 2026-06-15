import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { yen } from "../../lib/format";
import "./charts.css";

export default function DonutChart({ data, total }) {
  if (!data.length) {
    return <div className="chart-empty">データがありません</div>;
  }
  return (
    <div className="donut">
      <div className="donut__chart">
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={56}
              outerRadius={82}
              paddingAngle={2}
              stroke="none"
              startAngle={90}
              endAngle={-270}
            >
              {data.map((d) => (
                <Cell key={d.id} fill={d.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="donut__center">
          <span className="donut__center-label">合計</span>
          <span className="donut__center-value">{yen(total)}</span>
        </div>
      </div>

      <ul className="donut__legend">
        {data.map((d) => (
          <li key={d.id}>
            <span className="donut__dot" style={{ background: d.color }} />
            <span className="donut__name">{d.name}</span>
            <span className="donut__val">{yen(d.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
