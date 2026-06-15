import { useState, useEffect } from "react";
import { listExpensesByMonths } from "../data/store";
import { useApp } from "../context/AppContext";

// 指定したカレンダー月キー配列の支出をまとめて読み込む。
export function useExpenses(monthKeys) {
  const { ready, refreshKey } = useApp();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const key = monthKeys.join(",");

  useEffect(() => {
    let alive = true;
    if (!ready) {
      setLoading(false);
      setRows([]);
      return;
    }
    setLoading(true);
    listExpensesByMonths(monthKeys)
      .then((data) => {
        if (alive) {
          setRows(data);
          setError("");
        }
      })
      .catch((e) => alive && setError(e.message || "読み込みに失敗しました"))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, ready, refreshKey]);

  return { rows, loading, error };
}
