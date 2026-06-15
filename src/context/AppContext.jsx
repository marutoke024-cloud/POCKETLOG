import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import { initFirebase, isFirebaseReady } from "../firebase/config";
import { syncSubscriptionCharges } from "../data/store";

const Ctx = createContext(null);

export function AppProvider({ children }) {
  // 起動時に Firebase 初期化を試みる
  const [ready, setReady] = useState(() => {
    initFirebase();
    return isFirebaseReady();
  });
  const [refreshKey, setRefreshKey] = useState(0);

  const reconnectFirebase = useCallback(() => {
    initFirebase();
    setReady(isFirebaseReady());
  }, []);

  // 保存後にデータ再読込を促すシグナル
  const bumpRefresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  // 起動時：有効な定期サブスクを当月の支出に反映
  useEffect(() => {
    if (!ready) return;
    let alive = true;
    syncSubscriptionCharges()
      .then((added) => {
        if (alive && added > 0) setRefreshKey((k) => k + 1);
      })
      .catch((e) => console.warn("subscription sync failed:", e));
    return () => {
      alive = false;
    };
  }, [ready]);

  const value = useMemo(
    () => ({ ready, refreshKey, reconnectFirebase, bumpRefresh }),
    [ready, refreshKey, reconnectFirebase, bumpRefresh]
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useApp must be used within AppProvider");
  return v;
}
