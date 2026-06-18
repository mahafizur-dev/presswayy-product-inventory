# Product Inventory Dashboard

A Next.js (App Router) + TypeScript admin dashboard for managing product
inventory, with full CRUD backed by **n8n webhooks** and support for
**user-defined custom columns**.

## Stack
Next.js 16 · React 19 · TypeScript · Tailwind v4 · Zustand · lucide-react
(react-hook-form + zod are in the dependency set and available for extension).

## Quick start
```bash
npm install
cp .env.example .env.local   # optional — defaults point at your endpoints
npm run dev                  # http://localhost:3000  → redirects to /inventory
```

## How it works

### API architecture
The browser never calls n8n directly. Each operation goes:

```
UI → /api/inventory/<op> (Next route handler) → n8n webhook → datastore
```

Route handlers live in `src/app/api/inventory/{list,create,update,delete}`.
Keeping n8n behind our own routes means the webhook URLs stay server-side,
CORS is a non-issue, and auth/rate-limiting can be added in one place later.

All n8n specifics are centralized in **`src/lib/config.ts`** — URLs, HTTP
method per endpoint, optional auth header, and a response normalizer that
handles the many shapes n8n can return (`[...]`, `{data:[...]}`,
`[{json:{...}}]`, a bare object). Override anything with env vars; nothing
else in the app needs to change.

Default endpoints:
| Op     | Method | URL                                                     |
|--------|--------|---------------------------------------------------------|
| list   | POST   | https://server.presswayy.com/webhook/api/v1/list        |
| create | POST   | https://server.presswayy.com/webhook/api/v1/create      |
| update | POST   | https://server.presswayy.com/webhook/api/v1/update      |
| delete | POST   | https://server.presswayy.com/webhook/api/v1/delete      |

### Data / schema model
Each row has fixed **default columns** plus a flexible `attributes` JSON bag:

```ts
InventoryRow {
  id, name, sku, category, price, stock, status, createdAt,
  attributes: Record<string, string | number | boolean | null>  // custom columns
}
```

Recommended n8n datastore schema (Postgres example):

```sql
CREATE TABLE products (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  sku         text UNIQUE NOT NULL,
  category    text,
  price       numeric(12,2) DEFAULT 0,
  stock       integer DEFAULT 0,
  status      text DEFAULT 'draft',
  created_at  timestamptz DEFAULT now(),
  attributes  jsonb DEFAULT '{}'::jsonb   -- all custom columns live here
);
```

Custom columns are a JSON field rather than real columns, so adding a column
is a metadata change, not a migration — this is what keeps it scalable and
flexible. A new column applies across every row immediately.

### Custom columns
"Add column" lets a user define a new attribute (name + type: text, number,
currency, date, yes/no, dropdown). Definitions are remembered locally and
reconciled on load with whatever attribute keys come back from n8n, so the
table self-heals from server data. The dynamic product form and table render
these automatically.

### Expected webhook payloads
- **create/update** receive the full row object (including `attributes`).
- **delete** receives `{ id }`.
- **list** may return rows in any common n8n shape; the normalizer handles it.

If your n8n nodes expect a different envelope, adjust `src/lib/config.ts`
(method/url) and, if needed, the payload shaping in the route handlers.

## Project layout
```
src/
  app/
    api/inventory/{list,create,update,delete}/route.ts   # n8n proxy layer
    inventory/page.tsx                                   # dashboard
    layout.tsx · page.tsx · globals.css
  components/   # UI primitives, table, forms, dialogs, toasts
  lib/          # config, n8n caller, client api, row coercion
  store/        # zustand store (state + optimistic CRUD)
  types/        # domain types + default column defs
```
