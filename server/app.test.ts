import { describe, expect, it } from "vitest";
import request from "supertest";
import { readFileSync } from "node:fs";
import { app } from "./app";

const products = JSON.parse(readFileSync("data/products.json", "utf8"));
const expected = JSON.parse(readFileSync("data/expected.json", "utf8"));

describe("POST /reprice", () => {
  it("200 и результаты в том же порядке", async () => {
    const res = await request(app).post("/reprice").send(products);
    expect(res.status).toBe(200);
    expect(res.body).toEqual(expected);
  });

  it("200 и пустой массив для пустого входа", async () => {
    const res = await request(app).post("/reprice").send([]);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("400, если тело не массив", async () => {
    const res = await request(app).post("/reprice").send({ sku: "x" });
    expect(res.status).toBe(400);
  });

  it("400, если товар некорректный", async () => {
    const res = await request(app).post("/reprice").send([{ sku: "x" }]);
    expect(res.status).toBe(400);
  });

  it("400 на невалидный JSON", async () => {
    const res = await request(app).post("/reprice").set("content-type", "application/json").send("{oops");
    expect(res.status).toBe(400);
  });
});
