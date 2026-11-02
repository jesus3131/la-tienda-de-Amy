# Guía de despliegue — La tienda de Amy

## Backend (Render o similar)

1. Conectar repositorio GitHub.
2. Build command: `npm ci && npm run build && npm run migrate`
3. Start command: `npm start`
4. Variables de entorno:
   - NODE_ENV=production
   - DATABASE_URL (Supabase Session Pooler)
   - JWT_SECRET
   - FRONTEND_ORIGIN
   - SUPABASE_CA (opcional)
5. Health check: `/health`

## Frontend (Vercel o similar)

1. Conectar repositorio GitHub.
2. Build command: `npm run build`
3. Output directory: `dist`
4. Variable de entorno: `VITE_API_URL=https://api.tu-dominio.com`

## Dominio

- `app.latiendadeamy.com` → frontend
- `api.latiendadeamy.com` → backend

## HTTPS
- Render/Vercel proveen HTTPS automáticamente.
- WebSocket seguro: `wss://`.

## Backups
- Supabase Free: backups manuales vía pg_dump.
- Mantener copia local con `npm run backup`.

## Notas
- El PC principal no es necesario para el servicio.
- Todas las pruebas cloud pendientes requieren despliegue real.