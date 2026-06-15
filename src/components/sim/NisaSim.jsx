import { useState, useMemo } from "react";
import { yen } from "../../lib/format";
import "./sim.css";

// NISAつみたてシミュレーション：月額・年利・年数を変えて将来価値を試算。
// 毎月積立の複利計算（月複利）。
function futureValue(monthly, annualRatePct, years) {
  const n = years * 12;
  const r = annualRatePct / 100 / 12;
  if (r === 0) return monthly * n;
  return monthly * ((Math.pow(1 + r, n) - 1) / r);
}

export default function NisaSim() {
  const [monthly, setMonthly] = useState(10000);
  const [rate, setRate] = useState(5);
  const [years, setYears] = useState(20);

  const result = useMemo(() => {
    const fv = futureValue(monthly, rate, years);
    const contributed = monthly * years * 12;
    return { fv, contributed, gain: fv - contributed };
  }, [monthly, rate, years]);

  return (
    <section className="card sim">
      <h3 className="sim__title">NISAつみたてシミュレーション</h3>
      <p className="sim__sub">つみたて投資枠の将来価値を試算（月複利）</p>

      <div className="sim__inputs">
        <label className="sim__inp">
          <span>毎月の積立額</span>
          <div className="sim__inp-row">
            <input type="number" inputMode="numeric" value={monthly}
              onChange={(e) => setMonthly(Math.max(0, Number(e.target.value)))} />
            <em>円</em>
          </div>
        </label>
        <label className="sim__inp">
          <span>想定年利</span>
          <div className="sim__inp-row">
            <input type="number" inputMode="decimal" step="0.1" value={rate}
              onChange={(e) => setRate(Math.max(0, Number(e.target.value)))} />
            <em>%</em>
          </div>
        </label>
        <label className="sim__inp">
          <span>積立年数</span>
          <div className="sim__inp-row">
            <input type="number" inputMode="numeric" value={years}
              onChange={(e) => setYears(Math.max(1, Number(e.target.value)))} />
            <em>年</em>
          </div>
        </label>
      </div>

      <div className="sim__result">
        <div className="sim__result-main">
          <span>{years}年後の評価額</span>
          <strong>{yen(result.fv)}</strong>
        </div>
        <div className="sim__result-break">
          <div>
            <span>積立元本</span>
            <b>{yen(result.contributed)}</b>
          </div>
          <div>
            <span>運用益（想定）</span>
            <b className="sim__gain">+{yen(result.gain)}</b>
          </div>
        </div>
      </div>

      <p className="sim__note">
        ※あくまで一定年利を仮定した概算です。実際の運用成果を保証するものではありません。
        新NISAのつみたて投資枠は年120万円（月10万円）まで。まずは月1万円から始めるのも有効です。
      </p>
    </section>
  );
}
