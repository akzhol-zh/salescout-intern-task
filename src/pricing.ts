import type { Product, PriceResult } from "./types";

/**
 * Чистая функция: рассчитывает новую цену для одного товара.
 * Правила — см. README, раздел «Правила расчёта цены».
 * Не меняйте сигнатуру и путь к файлу: решение проверяется автотестами.
 */
export function calculatePrice(product: Product): PriceResult {
  const { sku, myPrice, minPrice, maxPrice, step, competitors } = product;

  const inStockPrices = competitors.filter((c) => c.inStock).map((c) => c.price);

  if (inStockPrices.length === 0) {
    return { sku, oldPrice: myPrice, newPrice: maxPrice, reason: "NO_COMPETITORS" };
  }

  const best = Math.min(...inStockPrices);
  const candidate = Math.floor(best - step);

  if (candidate < minPrice) {
    return { sku, oldPrice: myPrice, newPrice: minPrice, reason: "AT_MIN" };
  }
  if (candidate > maxPrice) {
    return { sku, oldPrice: myPrice, newPrice: maxPrice, reason: "AT_MAX" };
  }
  return { sku, oldPrice: myPrice, newPrice: candidate, reason: "UNDERCUT" };
}
