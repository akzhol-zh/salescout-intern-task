# SaleScout — мини прайс-бот (тестовое задание)

Бот пересчитывает цены товаров на Kaspi.kz: ставит цену на шаг ниже лучшего конкурента в наличии, не выходя за границы `minPrice`–`maxPrice`.

Состав:

- `src/pricing.ts` — чистая функция `calculatePrice(product)`.
- `server/` — Express API, эндпоинт `POST /reprice`.
- `web/` — страница на React + Vite с таблицей «было / стало».
- `src/pricing.test.ts`, `server/app.test.ts` — тесты (vitest, supertest).

## Запуск

Нужен Node.js 20+.

```bash
npm install
npm test            # unit-тесты и тест API
npm run typecheck   # проверка типов
npm run dev         # сервер (http://localhost:3000) + страница (http://localhost:5173)
```

По отдельности: `npm run dev:server` и `npm run dev:web`. Vite проксирует `/reprice` на сервер (порт 3000, меняется переменной `PORT`, тогда нужно поправить прокси в `web/vite.config.ts`). Сборка фронтенда: `npm run build` (результат в `dist/`).

Пример запроса:

```bash
curl -X POST http://localhost:3000/reprice \
  -H "Content-Type: application/json" \
  -d @data/products.json
```

## API

`POST /reprice`, тело — `Product[]`. Ответ `200` — `PriceResult[]` в том же порядке. Если тело не массив, у товара не хватает полей или они неверного типа (в том числе `step < 0`, `minPrice > maxPrice`), либо JSON невалиден — ответ `400` с `{ "error": "..." }`.

## Правила расчёта цены

1. Учитываются только конкуренты с `inStock: true`.
2. Таких нет → `newPrice = maxPrice`, причина `NO_COMPETITORS`.
3. Иначе `candidate = floor(minCompetitorPrice - step)`.
4. `candidate < minPrice` → `minPrice`, `AT_MIN`; `candidate > maxPrice` → `maxPrice`, `AT_MAX`; иначе `candidate`, `UNDERCUT` (границы включительно).

`myPrice` на расчёт не влияет, он возвращается как `oldPrice`.
