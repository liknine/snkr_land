# Патч связи с менеджером + команды бота

Заменить только эти файлы/папки. Данные товаров и заказов НЕ трогать.

## Backend
Заменить:
- `bot/main.py`

Что исправлено:
- `/admin` возвращен и остается в подсказках команд.
- В подсказках остаются только `/start`, `/orders`, `/admin`.
- `/app`, `/myid`, `/sync` очищаются из подсказок команд.
- `/start` отправляет аккуратный текст, кнопку магазина и inline-блок связи.
- Кнопки связи в боте:
  - `📣 Наш канал` -> `https://t.me/Sneakers_land_BY`
  - `💬 Обратиться к менеджеру` -> `https://t.me/Il_7in?text=есть вопрос по заказу`

После замены перезапустить:

```bash
cd /Users/liknine/Documents/snkr_land
./run_bot.command
```

## Frontend
Заменить:
- `src/App.tsx`
- `src/lib/api.ts`
- `src/lib/managerLink.ts`
- `src/screens/AboutScreen.tsx`
- `src/screens/OrdersScreen.tsx`
- `src/screens/PaymentScreen.tsx`
- `src/screens/ProfileScreen.tsx`
- `src/components/SideMenu.tsx`

Для GitHub Pages заменить:
- `docs/index.html`
- новые `docs/assets/index-*.js`
- новые `docs/assets/index-*.css`

НЕ заменять:
- `data/products.json`
- `data/orders.json`
- `docs/data/products.json`
- `docs/data/orders.json`

Если GitHub Pages настроен на root, возьми содержимое `docs/` и положи в корень репозитория, но не перетирай `data/products.json` и `data/orders.json`.
