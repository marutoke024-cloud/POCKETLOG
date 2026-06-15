import { useState } from "react";
import { yen } from "../../lib/format";
import "./sim.css";

const LS_KEY = "pocketlog.atoneThreshold";

function getThreshold() {
  return Number(localStorage.getItem(LS_KEY)) || 30000;
}

// atone後払いの当月利用額が閾値を超えたら警告。
export default function AtoneAlert({ atoneTotal }) {
  const [threshold, setThreshold] = useState(getThreshold);
  const over = atoneTotal > threshold;
  const ratio = Math.min(100, threshold ? (atoneTotal / threshold) * 100 : 0);

  const update = (v) => {
    const n = Math.max(0, Number(v) || 0);
    setThreshold(n);
    localStorage.setItem(LS_KEY, String(n));
  };

  return (
    <section className={`card sim atone ${over ? "atone--over" : ""}`}>
      <h3 className="sim__title">
        atone後払い残高アラート
        {over && <span className="atone__badge">超過</span>}
      </h3>

      <div className="atone__row">
        <span>今月のatone利用額</span>
        <strong>{yen(atoneTotal)}</strong>
      </div>
      <div className="atone__track">
        <div
          className="atone__fill"
          style={{ width: `${ratio}%`, background: over ? "var(--danger)" : "var(--teal)" }}
        />
      </div>

      <label className="sim__inp atone__threshold">
        <span>アラートの上限額</span>
        <div className="sim__inp-row">
          <input type="number" inputMode="numeric" value={threshold}
            onChange={(e) => update(e.target.value)} />
          <em>円</em>
        </div>
      </label>

      <p className="sim__note">
        {over
          ? `上限を ${yen(atoneTotal - threshold)} 超えています。翌月の引き落としに備えましょう。`
          : `残り ${yen(threshold - atoneTotal)} で上限です。後払いは翌月の支払いになる点に注意。`}
      </p>
    </section>
  );
}
