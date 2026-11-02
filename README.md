# ERP/POS — Sistema de Administración Comercial

Monolito modular con Clean Architecture, DDD, SOLID, PostgreSQL centralizado y acceso multidispositivo.

## Arquitectura

- `backend/` — API REST + WebSockets (Node.js + Express + TypeScript), organizado por módulos y capas (domain/application/infrastructure/presentation).
- `frontend/` — React + Vite + Tailwind, PWA.
- `docker-compose.yml` — PostgreSQL 16 + Redis.
- `backend/migrations/000_init.sql` — esquema completo (tablas, FKs, índices, seed).

Módulos: auth, users/roles, businesses/branches, products, categories, inventory, batches, suppliers, purchases, sales/POS, payments, refunds, cash, customers, reports, notifications, audit, settings, outbox.

## Requisitos

- Node.js 20+
- Docker Desktop

## Ejecutar en local

```bash
$env:LOCAL_JWT_SECRET = "use-a-local-secret-of-at-least-32-characters"
docker compose up -d
cd backend && cp .env.example .env && npm install && npm run dev
cd frontend && npm install && npm run dev
```

The Compose backend runs as the local node (`NODE_ROLE=local`, `NODE_ID=local-primary`) and uses the persistent PostgreSQL volume. Its status is available at `http://localhost:4000/sync/status`; it reports that synchronization is not configured until the later sync phase.

Backend: http://localhost:4000 (health: /health, readiness: /ready)
Frontend: http://localhost:5173

For LAN access, bind the backend to the host computer's LAN interface (`HOST=0.0.0.0`) and add each exact browser origin to `LOCAL_FRONTEND_ORIGINS`, separated by commas. Configure the frontend with `VITE_LOCAL_API_URL=http://<LAN-HOST>:4000`, then explicitly select the local target in the browser:

```js
localStorage.setItem('localApiUrl', 'http://<LAN-HOST>:4000');
localStorage.setItem('apiTarget', 'local');
```

The application does not switch targets automatically. Use `apiTarget=central` to return to the central backend. Do not expose port 4000 directly to the Internet; restrict it to the trusted LAN using the host firewall/router.

The application displays the selected node and the number of unprocessed Outbox events. A local operation is considered confirmed only after the local API returns success; browser `localStorage` is only a pending queue and is not the source of truth for sales, inventory, cash, purchases, or reports. Central synchronization remains disabled until the synchronization phase.

Credenciales seed: admin@erp.local / admin123

## Prueba multidispositivo (FASE 3)

1. Login con admin.
2. POST /api/v1/products crear producto (desde "computador").
3. GET /api/v1/products?search=... desde otra sesión/dispositivo (token distinto) devuelve el mismo registro.
4. PUT /api/v1/products/:id actualiza y se refleja en la primera sesión.
5. Persistencia verificada en PostgreSQL (tabla products).

Ejecutado y verificado: ver sección de pruebas.

## Base de datos en la nube (producción)

No se incluyen credenciales. Para producción:

1. Crear PostgreSQL administrado (Supabase, Neon, AWS RDS o compatible). Requisitos: backups automáticos, conexiones cifradas (SSL), pool de conexiones.
2. Configurar `DATABASE_URL` en el backend con SSL:
   `postgresql://user:pass@host:5432/db?sslmode=require`
3. Ejecutar el SQL de `backend/migrations/000_init.sql` (o migrador) sobre la instancia.
4. Desplegar backend (Docker/Node) y frontend (static) con HTTPS y dominio propio.
5. Configurar variables de entorno: JWT_SECRET, FRONTEND_ORIGIN, REDIS_URL.

El frontend nunca se conecta directamente a PostgreSQL; toda comunicación pasa por la API.

## Seguridad

- JWT Bearer, bcrypt para passwords.
- RBAC (admin, supervisor, cashier, warehouse).
- Helmet, CORS restringido, validación Zod.
- Transacciones ACID en ventas/compras/ajustes; inventarios no negativos.
- Idempotencia en ventas (`idempotency_key`).
- Auditoría y outbox events.

## Pruebas

```bash
cd backend && npm test
cd frontend && npm run build
```

## Estado de producción

El proyecto incluye controles de aislamiento por empresa, sucursal y almacén,
sesiones revocables, migraciones versionadas, cola offline durable en IndexedDB
y validaciones server-side para ventas, caja, compras e inventario. Antes de
producción deben ejecutarse los builds, tests, migraciones y pruebas
multidispositivo en un entorno staging con credenciales del proveedor.

El despliegue externo no se considera realizado hasta verificar las URLs,
variables secretas, HTTPS, restauración de backups y acceso desde dispositivos
externos. El registro público está deshabilitado cuando `NODE_ENV=production`.

## Mejoras implementadas

- Rate limiting (express-rate-limit) y Helmet en backend.
- RBAC aplicado a rutas (admin, supervisor, cashier, warehouse).
- WebSocket autenticado por JWT (token en query).
- Auditoría automática en productos, ventas, inventario, compras y caja.
- Exportación Excel (además de CSV) en reportes.
- Migrador idempotente (`npm run migrate`).
- Swagger UI en `/api/docs`.
- Cliente WebSocket en frontend para actualización en tiempo real.
- Service Worker básico para PWA/offline.
- Confirmaciones en acciones destructivas y manejo de errores en frontend.
- Tests de integración de ventas (stock, negativo, idempotencia).

## Arquitectura centralizada (nube)

```
Dispositivos (PC, tablet, celular)
  -> Frontend React (PWA)
  -> HTTPS
  -> Backend Node.js/Express (central)
  -> PostgreSQL administrado (nube)
  -> Redis (opcional)
```

- La API es el único acceso a PostgreSQL.
- El PC principal no aloja la base de datos; la app se conecta al backend remoto.
- El sistema funciona aunque el PC principal esté apagado.

### Proveedor recomendado: Supabase (PostgreSQL administrado)

Comparación:
- **Supabase**: RLS nativo, backups, plan gratuito, fácil; recomendado para MVP.
- **Neon**: serverless, branching, autoscaling; ideal para escalar.
- **AWS RDS**: robusto y costoso; requiere más configuración.

Selección: Supabase para MVP por RLS y facilidad; migrar a Neon/AWS si se requiere escala.

### Variables de entorno
- Backend: `.env.local`, `.env.production`, `.env.test` (ver `.env.example`).
- Frontend: `.env` (dev), `.env.production` (VITE_API_URL).

### Backup / Restore
```bash
cd backend
npm run backup -- mi-backup.sql
npm run restore -- mi-backup.sql
```

### PWA / Escritorio
- Se implementó PWA instalable (manifest + service worker).
- Evaluación: PWA es la opción más conveniente (sin instalación, cross-platform, actualizaciones automáticas). Electron/Tauri quedan como opción futura para empaquetado nativo.

### Offline
- La app detecta desconexión y muestra banner.
- Las ventas offline se encolan en `localStorage` y se sincronizan al reconectar.
- Nunca se confirma una venta offline como definitiva hasta validación en servidor.

### Seguridad
- HTTPS obligatorio en producción.
- JWT + RBAC.
- Rate limiting + Helmet.
- Auditoría en operaciones críticas.
- RLS disponible en PostgreSQL (defensa adicional, configurar en producción).

## Notas

- Moneda COP, zona horaria America/Bogota.
- Impuestos configurables por producto.
- Comprobantes internos (no factura electrónica DIAN; integración futura).
- Offline/PWA básico (manifest incluido).
