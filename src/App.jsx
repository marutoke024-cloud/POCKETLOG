import { useEffect, useState } from "react";
import {
  HashRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import Splash from "./components/Splash";
import BottomNav from "./components/BottomNav";
import InputFlow from "./components/input/InputFlow";
import MonthlyReport from "./components/MonthlyReport";
import Home from "./screens/Home";
import History from "./screens/History";
import Graph from "./screens/Graph";
import Settings from "./screens/Settings";
import Chat from "./screens/Chat";
import { isMonthlyReportDay, toDateKey } from "./lib/date";

const REPORT_FLAG = "pocketlog.reportShownOn";

export default function App() {
  const [booted, setBooted] = useState(false);

  return (
    <AppProvider>
      {!booted && <Splash onDone={() => setBooted(true)} />}
      {booted && (
        <HashRouter>
          <Shell />
        </HashRouter>
      )}
    </AppProvider>
  );
}

function Shell() {
  const location = useLocation();
  const [inputOpen, setInputOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  // 毎月19日：起動時に当日まだ表示していなければ自動でレポートを開く
  useEffect(() => {
    if (!isMonthlyReportDay()) return;
    const today = toDateKey(new Date());
    if (localStorage.getItem(REPORT_FLAG) === today) return;
    localStorage.setItem(REPORT_FLAG, today);
    setReportOpen(true);
  }, []);

  const isChat = location.pathname === "/chat";

  return (
    <div className="app-shell">
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<Home onOpenReport={() => setReportOpen(true)} />} />
        <Route path="/history" element={<History />} />
        <Route path="/graph" element={<Graph />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>

      {!isChat && <BottomNav onOpenInput={() => setInputOpen(true)} />}
      <InputFlow open={inputOpen} onClose={() => setInputOpen(false)} />
      <MonthlyReport open={reportOpen} onClose={() => setReportOpen(false)} />
    </div>
  );
}
