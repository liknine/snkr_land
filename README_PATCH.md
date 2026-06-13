# Sneakers Land patch

Replace only these files in the project:

- src/App.tsx
- src/lib/api.ts
- src/lib/managerLink.ts
- src/screens/ProfileScreen.tsx
- src/screens/AboutScreen.tsx
- src/screens/PaymentScreen.tsx
- src/screens/OrdersScreen.tsx
- src/components/SideMenu.tsx
- docs/index.html
- docs/assets/

Do not overwrite:

- data/products.json
- data/orders.json
- docs/data/products.json
- docs/data/orders.json
- images/products/
- docs/images/products/

Fixes:

- Profile button "Связаться с менеджером" opens @Il_7in with text "есть вопрос по заказу".
- Same manager link from About, Payment, Orders and side menu.
- "Мои заказы" does not show all orders to everyone; it filters by telegram id, username or local client_order_id.
