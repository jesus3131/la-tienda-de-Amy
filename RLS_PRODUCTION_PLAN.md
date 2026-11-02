# Plan de producción para Row Level Security (RLS) — La tienda de Amy

**Estado:** Aplicado en Supabase `otttfwnidhubkrbzidkq` y validado con `SET ROLE app_user`.

## Estado operativo actual

- `app_user` existe como `NOLOGIN`, `NOSUPERUSER`, `NOBYPASSRLS`.
- Las tablas públicas tienen RLS habilitado; las tablas de negocio usan
  `FORCE ROW LEVEL SECURITY`.
- Empresa válida: 11 productos visibles; empresa distinta: 0.
- Sin contexto de empresa: 0 productos visibles.
- Una inserción cross-tenant es rechazada por PostgreSQL.
- El backend aún no debe cambiar a `app_user` hasta configurar una contraseña
  gestionada y completar staging.

## 1. Rol de migración
- Usuario privilegiado (postgres/superuser) para ejecutar migraciones y backups.
- Debe tener BYPASSRLS para operaciones administrativas.

## 2. Rol de ejecución de la aplicación
- Crear rol `app_user` con `NOBYPASSRLS` y contraseña segura gestionada por el
  proveedor.
- Otorgar `USAGE` en schema `public` y `SELECT/INSERT/UPDATE/DELETE` en tablas necesarias.
- No otorgar `SUPERUSER`, `CREATEDB`, `CREATEROLE`.

## 3. Privilegios mínimos
- `GRANT USAGE ON SCHEMA public TO app_user;`
- `GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;`
- `GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;`

## 4. BYPASSRLS y privilegios de superusuario
- El rol de la aplicación NO debe tener `BYPASSRLS`.
- Solo el rol de migración/administración puede tener `BYPASSRLS`.

## 5. Políticas por business_id
- Habilitar RLS en todas las tablas con `business_id`.
- Crear política `USING (business_id = current_setting('app.current_business_id')::uuid)`.
- Aplicar a SELECT, INSERT, UPDATE, DELETE.

## 6. Restricciones de branch_id
- Para tablas con `branch_id`, crear política adicional:
  `USING (branch_id = ANY(current_setting('app.allowed_branch_ids')::uuid[]))`.

## 7. Contexto transaccional seguro
- Antes de cada transacción: `SET LOCAL app.current_business_id = $1;`
- Usar `set_config('app.current_business_id', $1, true)` para contexto local a la transacción.
- El pool de conexiones reutiliza conexiones; `SET LOCAL` se resetea al final de la transacción.

## 8. Protección frente a reutilización de conexiones del pool
- Usar `SET LOCAL` (transaccional) en lugar de `SET` (sesión).
- Envolver operaciones multi-tabla en transacciones explícitas.
- Verificar que el contexto se establezca en cada transacción.

## 9. Operaciones SELECT, INSERT, UPDATE y DELETE
- SELECT: filtrar por `business_id`.
- INSERT: verificar que el `business_id` del nuevo registro coincida con el contexto.
- UPDATE: filtrar por `business_id` en WHERE.
- DELETE: filtrar por `business_id` en WHERE.

## 10. Pruebas necesarias
- Usuario de empresa A no puede ver datos de empresa B.
- Usuario de empresa A no puede modificar datos de empresa B.
- Usuario sin contexto de empresa no ve ningún dato.
- Usuario de sucursal X no ve datos de sucursal Y.
- Operaciones dentro de transacción mantienen contexto.
- Conexión reutilizada no filtra contexto anterior.

## 11. Procedimiento de activación y reversión controlada
1. Crear rol `app_user`.
2. Otorgar privilegios mínimos.
3. Actualizar `DATABASE_URL` para usar `app_user`.
4. Probar en entorno de staging.
5. Habilitar RLS en una tabla a la vez.
6. Verificar con pruebas.
7. Revertir: `ALTER TABLE ... DISABLE ROW LEVEL SECURITY;` si hay problemas.

**No aplicar sin autorización independiente.**