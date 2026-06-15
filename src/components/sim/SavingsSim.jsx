import { useState } from "react";
import { yen } from "../../lib/format";
import "./sim.css";

// 貯金シミュレーター：毎月の積立額をスライダーで変え、6・12・24ヶ月後を同時表示。
export default function SavingsSim({ defaultMonthly = 10000 }) {
  const [monthly, setMonthly] = useState(defaultMonthly);
  const horizons = [6, 12, 24];

  return (
    <section className="card sim">
      <h3 className="sim__title">貯金シミュレーター</h3>
      <p className="sim__sub">毎月の積立額をスライドして将来の貯蓄を試算</p>

      <div className="sim__slider-head">
        <span>毎月の積立額</span>
        <strong>{yen(monthly)}</strong>
      </div>
      <input
        className="sim__range"
        type="range"
        min={0}
        max={50000}
        step={1000}
        value={monthly}
        onChange={(e) => setMonthly(Number(e.target.value))}
      />
      <div className="sim__range-ends">
        <span>¥0</span>
        <span>¥50,000</span>
      </div>

      <div className="sim__cards">
        {horizons.map((h) => (
          <div className="sim__hcard" key={h}>
            <span className="sim__hlabel">{h}ヶ月後</span>
            <span className="sim__hvalue">{yen(monthly * h)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
