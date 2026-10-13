import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { calculatePrice } from "./pricing";
import type { Product, PriceResult } from "./types";

const make = (over: Partial<Product> = {}): Product => ({
  sku: "X",
  name: "Test",
  myPrice: 1000,
  minPrice: 100,
  maxPrice: 200,
  step: 1,
  competitors: [],
  ...over,
});

const comp = (price: number, inStock = true) => ({ seller: "S", price, inStock });

describe("calculatePrice", () => {
  it("UNDERCUT: на шаг ниже лучшего конкурента", () => {
    const r = calculatePrice(
      make({ minPrice: 370000, maxPrice: 420000, step: 10, competitors: [comp(384990), comp(386500)] }),
    );
    expect(r).toEqual({ sku: "X", oldPrice: 1000, newPrice: 384980, reason: "UNDERCUT" });
  });

  it("AT_MIN: кандидат ниже minPrice", () => {
    const r = calculatePrice(make({ minPrice: 180000, maxPrice: 210000, step: 100, competitors: [comp(175000)] }));
    expect(r.newPrice).toBe(180000);
    expect(r.reason).toBe("AT_MIN");
  });

  it("AT_MAX: кандидат выше maxPrice", () => {
    const r = calculatePrice(make({ minPrice: 100000, maxPrice: 125000, competitors: [comp(150000)] }));
    expect(r.newPrice).toBe(125000);
    expect(r.reason).toBe("AT_MAX");
  });

  it("округляет вниз дробную цену", () => {
    const r = calculatePrice(make({ minPrice: 330000, maxPrice: 380000, step: 0.5, competitors: [comp(349999.9)] }));
    expect(r.newPrice).toBe(349999);
    expect(r.reason).toBe("UNDERCUT");
  });

  it("NO_COMPETITORS: все конкуренты не в наличии", () => {
    const r = calculatePrice(make({ minPrice: 80000, maxPrice: 99990, step: 50, competitors: [comp(85000, false)] }));
    expect(r.newPrice).toBe(99990);
    expect(r.reason).toBe("NO_COMPETITORS");
  });

  it("NO_COMPETITORS: пустой список", () => {
    expect(calculatePrice(make()).reason).toBe("NO_COMPETITORS");
  });

  it("конкурент не в наличии игнорируется, даже если дешевле", () => {
    const r = calculatePrice(make({ competitors: [comp(110, false), comp(150)] }));
    expect(r.newPrice).toBe(149);
    expect(r.reason).toBe("UNDERCUT");
  });

  it("границы включительно: candidate == minPrice", () => {
    const r = calculatePrice(make({ step: 10, competitors: [comp(110)] }));
    expect(r).toMatchObject({ newPrice: 100, reason: "UNDERCUT" });
  });

  it("границы включительно: candidate == maxPrice", () => {
    const r = calculatePrice(make({ step: 10, competitors: [comp(210)] }));
    expect(r).toMatchObject({ newPrice: 200, reason: "UNDERCUT" });
  });

  it("step = 0: цена равна лучшей цене конкурента", () => {
    const r = calculatePrice(make({ step: 0, competitors: [comp(150)] }));
    expect(r).toMatchObject({ newPrice: 150, reason: "UNDERCUT" });
  });

  it("одинаковые минимальные цены конкурентов", () => {
    const r = calculatePrice(make({ competitors: [comp(150), comp(150)] }));
    expect(r.newPrice).toBe(149);
  });

  it("myPrice не влияет на расчёт, только попадает в oldPrice", () => {
    const a = calculatePrice(make({ myPrice: 1, competitors: [comp(150)] }));
    const b = calculatePrice(make({ myPrice: 999999, competitors: [comp(150)] }));
    expect(a.newPrice).toBe(b.newPrice);
    expect(a.oldPrice).toBe(1);
    expect(b.oldPrice).toBe(999999);
  });

  it("minPrice == maxPrice", () => {
    const r = calculatePrice(make({ minPrice: 150, maxPrice: 150, competitors: [comp(500)] }));
    expect(r).toMatchObject({ newPrice: 150, reason: "AT_MAX" });
  });

  it("совпадает с data/expected.json", () => {
    const products: Product[] = JSON.parse(readFileSync("data/products.json", "utf8"));
    const expected: PriceResult[] = JSON.parse(readFileSync("data/expected.json", "utf8"));
    expect(products.map(calculatePrice)).toEqual(expected);
  });
});
