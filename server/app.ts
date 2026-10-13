import express from "express";
import { calculatePrice } from "../src/pricing";
import type { Product } from "../src/types";

const isFiniteNumber = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

function isCompetitor(v: unknown): boolean {
  if (typeof v !== "object" || v === null) return false;
  const c = v as Record<string, unknown>;
  return typeof c.seller === "string" && isFiniteNumber(c.price) && typeof c.inStock === "boolean";
}

function isProduct(v: unknown): v is Product {
  if (typeof v !== "object" || v === null) return false;
  const p = v as Record<string, unknown>;
  return (
    typeof p.sku === "string" &&
    typeof p.name === "string" &&
    isFiniteNumber(p.myPrice) &&
    isFiniteNumber(p.minPrice) &&
    isFiniteNumber(p.maxPrice) &&
    isFiniteNumber(p.step) &&
    p.step >= 0 &&
    p.minPrice <= p.maxPrice &&
    Array.isArray(p.competitors) &&
    p.competitors.every(isCompetitor)
  );
}

export const app = express();

app.use(express.json());

app.post("/reprice", (req, res) => {
  const body: unknown = req.body;
  if (!Array.isArray(body)) {
    res.status(400).json({ error: "Тело запроса должно быть массивом товаров" });
    return;
  }
  const badIndex = body.findIndex((p) => !isProduct(p));
  if (badIndex !== -1) {
    res.status(400).json({ error: `Некорректный товар с индексом ${badIndex}` });
    return;
  }
  res.json((body as Product[]).map(calculatePrice));
});

// Невалидный JSON в теле → 400, а не 500
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const status = (err as { status?: number }).status;
  if (status === 400) {
    res.status(400).json({ error: "Некорректный JSON" });
    return;
  }
  res.status(500).json({ error: "Внутренняя ошибка сервера" });
});
