# Private orders patch

Replace only these files/folders:

- bot/github_storage.py
- src/App.tsx
- src/lib/api.ts
- docs/index.html
- docs/assets/

Do not replace/delete:

- data/products.json
- data/orders.json
- docs/data/products.json
- docs/data/orders.json
- images/products/
- docs/images/products/

What it fixes:

- Mini App no longer shows all public orders to every client.
- It first tries data/orders/users/<telegramId>.json.
- If that file is absent, it reads data/orders.json but strictly filters by telegramId, username, or local client_order_id only.
- If there is no reliable identity/local order id, it shows no orders.
- Backend GitHub sync publishes per-user order snapshots at data/orders/users/<telegramId>.json and docs/data/orders/users/<telegramId>.json.
