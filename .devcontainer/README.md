# Dev container and Docker

## VS Code / Cursor

1. Install **Dev Containers**.
2. **Dev Containers: Reopen in Container**.
3. After create, dependencies install via `post-create` (`npm ci` when `package-lock.json` exists).
4. **`npm run dev:web`** → open **http://localhost:5173** (forwarded).
5. **`npm run dev`** for Electron (needs a display).

## Plain Docker

```bash
docker compose up -d dev
docker compose exec dev npm ci
docker compose exec dev npm run dev:web
```

Open **http://localhost:5173**. Stop: `docker compose down`.

## CI parity

```bash
npm run lint
npm run test
npm run typecheck
npm run build
```
