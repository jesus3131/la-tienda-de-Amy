# Guía de migración a Supabase — La tienda de Amy

## 1. Método de conexión

- **Backend Express en red con IPv6/IPv4 compatible:** conexión directa (puerto 5432, SSL).
- **Backend en red exclusivamente IPv4 (sin IPv6):** Session Pooler de Supabase.
- **NO usar Transaction Pooler** para conexión persistente sin verificar compatibilidad (puede romper transacciones/migraciones).

Migraciones, `pg_dump` y `psql` deben usar conexión directa o Session Pooler compatible.

## 2. Variables de entorno (.env.production)

```
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/postgres?sslmode=require
JWT_SECRET=<secret fuerte>
PORT=4000
NODE_ENV=production
FRONTEND_ORIGIN=https://tu-dominio.com
SUPABASE_CA=<certificado CA si aplica>
```

- No commitear `.env.production`.
- Frontend solo usa `VITE_API_URL`.

## 3. Procedimiento de migración

1. Backup local: `npm run backup -- pre-migration.sql`
2. Verificar backup: `npm run verify-migration`
3. Crear proyecto en Supabase.
4. Obtener `DATABASE_URL` (directa o Session Pooler).
5. Configurar `.env.production`.
6. Aplicar esquema: `npm run migrate`
7. Restaurar datos: `npm run restore -- pre-migration.sql`
8. Corregir secuencias si es necesario.
9. Verificar: `npm run verify-migration`
10. Comparar conteos origen vs destino.
11. Probar login, ventas, inventario, auditoría, sesiones.
12. Mantener Docker local como respaldo temporal.

Las migraciones se ejecutan mediante `npm run migrate`. El migrador crea
`schema_migrations`, toma un advisory lock de PostgreSQL y aplica únicamente
los archivos versionados (`000_*.sql`, `001_*.sql`, etc.) que aún no estén
registrados. No se debe ejecutar SQL manualmente en producción salvo para una
recuperación documentada.

## 4. Seguridad y RLS

- Backend Express es el único acceso a PostgreSQL.
- RBAC en Express (admin/supervisor/cashier/warehouse).
- RLS opcional (policies comentadas en migración). Habilitar solo con políticas probadas.
- No usar `service_role` en el navegador.

## 5. Rollback

- Mantener Docker local intacto.
- Si la migración falla, detener y conservar base local.
- Restaurar desde `pre-migration.sql` sobre Supabase o local.

## 6. Estado actual

- Supabase: **pendiente de configuración** (sin credenciales).
- Migración real: **pendiente**.
- Pruebas cloud: **pendientes** (no marcar como aprobadas).