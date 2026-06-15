import { NavLink } from "react-router-dom";
import "./BottomNav.css";

const Icon = ({ d }) => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {d}
  </svg>
);

const icons = {
  home: <path d="M3 11l9-8 9 8M5 10v10h14V10" />,
  history: (
    <>
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
      <path d="M3 4v4h4M12 8v4l3 2" />
    </>
  ),
  graph: <path d="M4 19V5M4 19h16M8 16v-5M13 16V8M18 16v-9" />,
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v3M12 18v3M21 12h-3M6 12H3M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1M18.4 18.4l-2.1-2.1M7.7 7.7L5.6 5.6" />
    </>
  ),
};

export default function BottomNav({ onOpenInput }) {
  return (
    <nav className="nav">
      <NavLink to="/home" className="nav__item">
        <Icon d={icons.home} />
        <span>ホーム</span>
      </NavLink>
      <NavLink to="/history" className="nav__item">
        <Icon d={icons.history} />
        <span>履歴</span>
      </NavLink>

      <button className="nav__fab" onClick={onOpenInput} aria-label="入力">
        <svg viewBox="0 0 24 24" width="28" height="28" fill="none"
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>

      <NavLink to="/graph" className="nav__item">
        <Icon d={icons.graph} />
        <span>グラフ</span>
      </NavLink>
      <NavLink to="/settings" className="nav__item">
        <Icon d={icons.settings} />
        <span>設定</span>
      </NavLink>
    </nav>
  );
}
