import { useEffect, useRef, useState } from "react";
import "./Splash.css";

export default function Splash({ onDone }) {
  const [progress, setProgress] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const canvasRef = useRef(null);

  // プログレスバー 0 → 100
  useEffect(() => {
    let raf;
    const start = performance.now();
    const DURATION = 2200;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / DURATION);
      // イージング（最後にゆっくり）
      const eased = 1 - Math.pow(1 - t, 2);
      setProgress(Math.round(eased * 100));
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        setLeaving(true);
        setTimeout(() => onDone?.(), 650);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [onDone]);

  // 背景パーティクル
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let w, h, raf;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const N = 46;
    const particles = Array.from({ length: N }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.8 + 0.5,
      vy: Math.random() * 0.4 + 0.15,
      vx: (Math.random() - 0.5) * 0.25,
      a: Math.random() * 0.5 + 0.2,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      // 流れるグリッド
      ctx.strokeStyle = "rgba(74,125,138,0.12)";
      ctx.lineWidth = 1;
      const gap = 38;
      const off = (performance.now() / 60) % gap;
      for (let x = -gap + off; x < w; x += gap) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = -gap + off; y < h; y += gap) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      // パーティクル
      for (const p of particles) {
        p.y += p.vy;
        p.x += p.vx;
        if (p.y > h) {
          p.y = -4;
          p.x = Math.random() * w;
        }
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        ctx.beginPath();
        ctx.fillStyle = `rgba(214,157,102,${p.a})`;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div className={`splash ${leaving ? "splash--leave" : ""}`}>
      <canvas ref={canvasRef} className="splash__bg" />

      <div className="splash__center">
        <svg className="splash__logo" viewBox="0 0 120 120" width="120" height="120">
          <circle
            className="splash__ring"
            cx="60"
            cy="60"
            r="46"
            fill="none"
            stroke="var(--gold)"
            strokeWidth="3"
          />
          <path
            className="splash__mark"
            d="M44 78 L44 42 L66 42 Q80 42 80 56 Q80 70 66 70 L44 70"
            fill="none"
            stroke="#fff"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        <div className="splash__wordmark">POCKETLOG</div>
        <div className="splash__tagline">your money, visible</div>
      </div>

      <div className="splash__progress">
        <div className="splash__bar" style={{ width: `${progress}%` }} />
        <div className="splash__pct">{progress}%</div>
      </div>
    </div>
  );
}
