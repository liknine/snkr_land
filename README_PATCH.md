# Private orders patch

Replace only these files/folders:

- bot/github_storage.py
- src/App.tsx
- src/lib/api.ts
- docs/index.html
- docs/assets/

Do not overwrite product/order data files:

- data/products.json
- data/orders.json
- docs/data/products.json
- docs/data/orders.json
- docs/images/products/

What this fixes:

- “Мои заказы” no longer shows all orders to every user.
- Frontend first tries to read per-user orders: data/orders/users/<telegramId>.json
- Fallback data/orders.json is strictly filtered by telegramId / username / local clientOrderId.
- Old poisoned localStorage key is ignored; new key is snkr_land_my_orders_v2.
- Backend GitHub sync now writes per-user order snapshots when publishing orders.

After replacing files:

1. Restart bot.
2. Re-upload docs/index.html and docs/assets to GitHub Pages.
3. Do not overwrite docs/data/products.json or docs/data/orders.json.
4. Open Mini App with ?v=private-orders-final to clear cache.
