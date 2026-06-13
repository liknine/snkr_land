# Patch: private "Мои заказы"

Заменить только эти файлы/папки:

- `src/App.tsx`
- `src/lib/api.ts`
- `docs/index.html`
- `docs/assets/`

Важно: НЕ трогать `data/products.json`, `data/orders.json`, `docs/data/products.json`, `docs/data/orders.json`.
Этот патч не стирает товары и заказы.

Что исправлено:

- `orders.json` больше не показывается всем подряд.
- В Mini App в разделе "Мои заказы" отображаются только заказы текущего клиента:
  - по `telegramId`, если Telegram отдал ID;
  - по `username`, если Telegram отдал username;
  - по `clientOrderId`, если заказ был создан с этого устройства/сессии.
- Если Telegram Desktop не отдал user id, чужие заказы больше не показываются.
- Локальный заказ клиента остается виден сразу после оформления, а после обновления GitHub подтягивается его актуальный статус по `clientOrderId`.
