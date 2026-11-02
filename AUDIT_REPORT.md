# Auditoría técnica final — La tienda de Amy

## 1. Estado de componentes

| Componente | Estado | Evidencia |
|---|---|---|
| PostgreSQL (Docker) | ✅ Healthy | 36 tablas, seed data |
| Redis (Docker) | ✅ OK | PONG |
| Backend | ✅ OK | /health → ok |
| Frontend | ✅ OK | http://localhost:5173 → 200 |
| Migraciones | ✅ Idempotentes | `npm run migrate` OK |
| Tests | ✅ 7 passed | smoke (1), sales (3), rbac (3) |
| Swagger | ✅ Disponible | /api/docs |
| WebSocket | ✅ Autenticado | JWT en query |
| Backup/Restore | ✅ Probado | 66 KB backup |

## 2. Hallazgos y correcciones

### Críticos
- **Async errors no capturados** → instalado `express-async-errors` en main.ts. (Archivo: `backend/src/main.ts`)
- **RBAC no aplicado** → `requireRole` agregado a todas las rutas. (Archivos: `*Controller.ts`)
- **WebSocket sin auth** → token JWT requerido. (Archivo: `backend/src/shared/websocket/wsServer.ts`)
- **Fallback de empresa por defecto** → eliminado; `getBusinessId()` lanza ForbiddenError si no hay contexto. (Archivo: `backend/src/shared/utils/tenant.ts`)

### Altos
- **Auditoría parcial** → ampliada a inventario, compras, caja. (Archivos: controllers)
- **Outbox sin reintentos** → publisher con retry, backoff, failed flag. (Archivo: `backend/src/shared/outbox/publisher.ts`)
- **Migración no idempotente** → constraint con DO block. (Archivo: `migrations/000_init.sql`)
- **Sin sesiones/dispositivos** → tabla `user_sessions`, endpoints `/auth/sessions`. (Archivos: SessionRepository, authController)

### Medios
- **Sin backups automatizados** → scripts `backup`/`restore` (pg_dump/psql). (Archivos: `backend/src/scripts/*.ts`)
- **Sin Swagger** → `/api/docs`. (Archivo: `backend/src/main.ts`)
- **Sin offline real** → hook `useOnline`, cola de ventas pendientes. (Archivos: `frontend/src/hooks/useOnline.js`, POS.jsx, App.jsx)
- **Sin env de producción** → `.env.production`, `.env.test`, frontend `.env.production`.

### Bajos
- **PWA básica** → manifest + service worker.
- **N+1 potencial** en ProductRepository.list (pendiente de optimización).
- **Sin refresh token** (pendiente).
- **RLS no habilitado** (policies comentadas en migración, defensa adicional).

## 3. Pruebas ejecutadas

| # | Prueba | Resultado |
|---|---|---|
| 1 | Login admin | ✅ |
| 2 | Crear producto | ✅ |
| 3 | Consulta multidispositivo | ✅ |
| 4 | Venta descuenta stock | ✅ (10→8) |
| 5 | Stock negativo bloqueado | ✅ |
| 6 | Idempotencia de venta | ✅ |
| 7 | RBAC admin/cashier | ✅ (3 tests) |
| 8 | Migración idempotente | ✅ |
| 9 | Backup/restore | ✅ (66 KB) |
| 10 | Swagger disponible | ✅ |
| 11 | WebSocket auth | ✅ |
| 12 | Sesiones/dispositivos | ✅ |

## 4. Pruebas pendientes (requieren cloud)

- [ ] Inicio de sesión desde dos computadores físicos.
- [ ] Inicio de sesión desde celular.
- [ ] Funcionamiento con PC principal apagado (requiere despliegue cloud).
- [ ] Restauración en PostgreSQL remoto.
- [ ] Concurrencia de 2 cajeros simultáneos (prueba de carga).
- [ ] Recuperación después de perder Internet (prueba real en dispositivo móvil).

## 5. Riesgos abiertos

- RLS no habilitado (defensa adicional pendiente).
- Sin refresh tokens (sesiones de 24h).
- Sin monitoreo/alertas en producción (pendiente infraestructura).
- Outbox publisher en proceso (no cola dedicada) — suficiente para MVP.
- Frontend y backend en mismo origen en dev; en producción requieren CORS configurado.

## 6. Procedimiento de despliegue

1. Crear PostgreSQL en Supabase/Neon/AWS RDS.
2. Configurar `DATABASE_URL` con `?sslmode=require` en `.env.production`.
3. Ejecutar `npm run migrate` sobre la instancia remota.
4. Restaurar datos: `npm run restore -- backup.sql`.
5. Desplegar backend (Node/Express) en servicio cloud (Render/Railway/Fly.io/VPS).
6. Publicar frontend (Vercel/Netlify/Cloudflare Pages) con `VITE_API_URL` apuntando al backend.
7. Configurar dominio propio y HTTPS.
8. Configurar backups automáticos en el proveedor.

## 7. Procedimiento de migración de datos

1. `npm run backup -- pre-migration.sql` (local).
2. Crear instancia PostgreSQL remota.
3. `npm run migrate` (crea esquema).
4. `npm run restore -- pre-migration.sql` (restaura datos).
5. Verificar conteos: users, products, sales, inventory, categories.
6. Verificar integridad referencial (FKs).
7. Probar consultas desde backend remoto.

## 8. Procedimiento de recuperación ante fallos

- **Backend caído:** reiniciar servicio; eventos outbox persisten y se procesan al volver.
- **DB caída:** backend retorna 500; datos persisten en volumen; restaurar desde backup.
- **Dispositivo desconectado:** ventas se encolan en localStorage y sincronizan al reconectar.
- **Sesión comprometida:** revocar vía `/auth/sessions/:id/revoke`.

## 9. Archivos modificados en esta auditoría

- `backend/src/main.ts` (express-async-errors, Swagger, outbox publisher)
- `backend/src/config/database.ts` (SSL)
- `backend/src/shared/utils/tenant.ts` (nuevo)
- `backend/src/shared/outbox/publisher.ts` (reintentos)
- `backend/src/shared/websocket/wsServer.ts` (auth JWT)
- `backend/src/modules/*/presentation/*Controller.ts` (RBAC, auditoría, tenant)
- `backend/src/modules/auth/infrastructure/SessionRepository.ts` (nuevo)
- `backend/src/modules/auth/application/LoginUseCase.ts` (sesiones)
- `backend/src/modules/auth/presentation/authController.ts` (endpoints sesiones)
- `backend/src/scripts/backup.ts`, `restore.ts`, `migrate.ts` (nuevos)
- `backend/migrations/000_init.sql` (user_sessions, user_devices, outbox retry, RLS comentado)
- `backend/tests/rbac.test.ts` (nuevo)
- `frontend/src/hooks/useOnline.js` (nuevo)
- `frontend/src/services/api.js`, `websocket.js` (env vars)
- `frontend/src/components/Layout.jsx`, `pages/POS.jsx`, `App.jsx` (offline)
- `backend/.env.*`, `frontend/.env*` (nuevos)
- `README.md`, `AUDIT_REPORT.md` (actualizados)

## 10. Estado de Supabase y migración

- Supabase: **pendiente de configuración** (sin credenciales).
- Método de conexión recomendado: directa (IPv6/IPv4) o Session Pooler (IPv4 only). NO Transaction Pooler sin verificar.
- Migración real: **pendiente**.
- Pruebas cloud: **pendientes** (no marcar como aprobadas).
- Guía: `MIGRATION_GUIDE.md`.

## 11. Migración a Supabase — Resultado

- **Supabase PostgreSQL:** ✅ Conexión real verificada (Session Pooler, us-east-1).
- **36 tablas:** ✅ Migradas y verificadas (conteos idénticos local vs cloud).
- **Integridad referencial:** ✅ 0 violaciones FK.
- **Datos:** ✅ Conservados (10 productos, 4 movimientos, 12 audit logs, 15 idempotency keys, 32 outbox events, 27 sesiones).
- **Pruebas funcionales cloud:** ✅ Login, productos, inventario, venta (stock 5→3), auditoría.
- **Backend cloud:** ⏳ Preparado (Dockerfile, render.yaml). Pendiente despliegue.
- **Frontend cloud:** ⏳ Preparado (vercel.json). Pendiente despliegue.
- **HTTPS:** ⏳ Pendiente (proveedores lo proveen).
- **RBAC:** ✅ Probado (admin/cashier).
- **Multiempresa/depósitos:** ⏳ Pendiente prueba real multidispositivo.
- **WebSockets:** ✅ Autenticado por JWT.
- **Outbox:** ✅ Reintentos + backoff.
- **Ventas:** ✅ Probadas contra Supabase.
- **Inventario:** ✅ Probado contra Supabase.
- **Offline:** ✅ Implementado (cola + sync).
- **Backups:** ✅ Probado (pg_dump/restore).
- **Acceso multidispositivo:** ⏳ Pendiente (requiere despliegue).
- **PC principal apagado:** ⏳ Pendiente (requiere despliegue).

## 12. Conclusión

La tienda de Amy tiene la base de datos migrada exitosamente a Supabase PostgreSQL. La conexión real fue verificada, los 36 tablas y datos conservados, y las pruebas funcionales (login, productos, inventario, ventas) pasaron contra la nube. El backend y frontend están preparados para despliegue (Dockerfile, render.yaml, vercel.json). Las pruebas de multidispositivo, HTTPS y PC apagado requieren despliegue real y están identificadas como pendientes.