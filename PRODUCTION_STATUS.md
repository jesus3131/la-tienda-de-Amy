# Estado de producción — La tienda de Amy

> Este documento debe actualizarse con evidencia del entorno desplegado. Los
> cambios locales no equivalen a un despliegue cloud ejecutado.

| Componente | Estado | Evidencia |
|---|---|---|
| Supabase PostgreSQL | APROBADO | PostgreSQL 17.11; RLS aplicado y validado con app_user sin BYPASSRLS |
| 36 tablas | APROBADO | 36 creadas, conteos idénticos a local |
| Migración de datos | APROBADO | Backup 90 KB restaurado, 0 errores |
| Integridad referencial | APROBADO | 0 violaciones FK |
| Backend cloud | BLOQUEADO | Render no autenticado; Dockerfile + render.yaml preparados |
| Frontend cloud | BLOQUEADO | Vercel no autenticado; vercel.json preparado |
| HTTPS | BLOQUEADO | No existen URLs desplegadas que verificar |
| RBAC | APROBADO | Tests: admin crea producto, cashier 403 |
| Multiempresa y depósitos | PENDIENTE | Requiere despliegue y prueba multidispositivo |
| WebSockets | APROBADO | Autenticado por JWT; outbox distribuye eventos |
| Outbox | APROBADO | Reintentos + backoff + flag failed |
| Ventas | APROBADO | Probada contra Supabase (total 50, stock 5→3) |
| Inventario | APROBADO | Ajuste + venta verificados en cloud |
| Offline | APROBADO | Implementado (cola localStorage + sync) |
| Backups | APROBADO | pg_dump/restore probados (90 KB) |
| Acceso multidispositivo | PENDIENTE | Requiere despliegue cloud |
| PC principal apagado | PENDIENTE | Requiere despliegue cloud |

## Lo que se ejecutó
- Auditoría integral del proyecto.
- Migración completa a Supabase (backup, migrate, restore, verify).
- Pruebas funcionales contra Supabase (login, productos, inventario, venta).
- Build de imagen Docker del backend (exitoso, health OK contra Supabase).
- Build de frontend (exitoso).
- Preparación de archivos de despliegue (Dockerfile, render.yaml, vercel.json).

## Lo que se corrigió
- Dockerfile multi-stage (build + production).
- render.yaml con health check y variables secretas.
- vercel.json con rewrites SPA.
- database.ts con SSL condicional y connectWithRetry.
- env.ts con carga por entorno.

## Lo que se migró
- 36 tablas con datos (conteos idénticos local vs cloud).
- 0 violaciones FK.

## Pruebas que pasaron
- 7 tests automatizados (smoke, sales ×3, rbac ×3).
- Conexión real a Supabase.
- verify-migration.
- Login, productos, inventario, venta contra Supabase.
- Docker build + health check contra Supabase.

## Pruebas que fallaron
- Ninguna.

## Lo que falta
- Crear cuentas en Render y Vercel (o proveedores elegidos).
- Configurar variables de entorno en los proveedores.
- Desplegar backend y frontend.
- Probar acceso desde dispositivos externos.
- Comprobar funcionamiento con PC principal apagado.

## Lo que debe hacer el usuario
1. Crear cuenta en Render (https://render.com) y Vercel (https://vercel.com).
2. En Render: New Web Service → conectar repositorio → usar Dockerfile o render.yaml.
3. Configurar variables de entorno en Render (DATABASE_URL, JWT_SECRET, NODE_ENV=production, FRONTEND_ORIGIN, SUPABASE_CA).
4. En Vercel: importar proyecto → configurar VITE_API_URL → deploy.
5. (Opcional) Configurar dominio propio.
6. Probar desde celular/tablet/otro PC.

## URLs reales del sistema
- Supabase: https://otttfwnidhubkrbzidkq.supabase.co
- Backend local: http://localhost:4000
- Frontend local: http://localhost:5173
- Backend cloud: Pendiente de despliegue
- Frontend cloud: Pendiente de despliegue