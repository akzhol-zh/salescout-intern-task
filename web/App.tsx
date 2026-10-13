import { useCallback, useEffect, useState } from "react";
import productsData from "../data/products.json";
import type { PriceResult, Product, Reason } from "../src/types";

const products = productsData as Product[];

const REASON_LABELS: Record<Reason, string> = {
  UNDERCUT: "Ниже конкурента",
  AT_MIN: "Минимальная цена",
  AT_MAX: "Максимальная цена",
  NO_COMPETITORS: "Нет конкурентов",
};

const fmt = new Intl.NumberFormat("ru-RU");

export function App() {
  const [results, setResults] = useState<PriceResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/reprice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(products),
      });
      if (!res.ok) throw new Error(`Сервер вернул ${res.status}`);
      setResults((await res.json()) as PriceResult[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Неизвестная ошибка");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const nameBySku = new Map(products.map((p) => [p.sku, p.name]));

  return (
    <main>
      <h1>Репрайсинг: было / стало</h1>
      <button onClick={() => void load()} disabled={loading}>
        {loading ? "Считаю…" : "Пересчитать"}
      </button>
      {error && <p className="error">Ошибка: {error}</p>}
      <table>
        <thead>
          <tr>
            <th>SKU</th>
            <th>Название</th>
            <th className="num">Было, ₸</th>
            <th className="num">Стало, ₸</th>
            <th>Причина</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r) => {
            const diff = r.newPrice - r.oldPrice;
            return (
              <tr key={r.sku}>
                <td>{r.sku}</td>
                <td>{nameBySku.get(r.sku)}</td>
                <td className="num">{fmt.format(r.oldPrice)}</td>
                <td className="num">
                  {fmt.format(r.newPrice)}{" "}
                  <span className={diff < 0 ? "down" : diff > 0 ? "up" : ""}>
                    {diff === 0 ? "" : `(${diff > 0 ? "+" : "−"}${fmt.format(Math.abs(diff))})`}
                  </span>
                </td>
                <td>
                  <span className={`badge ${r.reason}`}>{REASON_LABELS[r.reason]}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {!loading && !error && results.length === 0 && <p>Нет данных.</p>}
    </main>
  );
}
