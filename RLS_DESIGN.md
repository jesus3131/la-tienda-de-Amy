# Diseño de Row Level Security (RLS) — La tienda de Amy

**Estado:** Implementado en Supabase. Este documento conserva el diseño y las
restricciones necesarias para el cambio de credenciales del backend.

## Rol de conexión
El backend usa el usuario `postgres` (o el configurado en DATABASE_URL). Este rol es superuser y omite RLS. Para que RLS sea efectivo, se debe usar un rol no privilegiado (ej. `app_user`) con `NOBYPASSRLS`.

## Contexto por transacción
Antes de cada consulta, ejecutar:
```sql
SET LOCAL app.current_business_id = '<business_id>';
SET LOCAL app.current_branch_id = '<branch_id>';
```
O usar `set_config('app.current_business_id', $1, true)`.

## Políticas propuestas (por tabla con business_id)

```sql
-- Ejemplo para products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY products_tenant ON products
  USING (business_id = current_setting('app.current_business_id')::uuid);

-- Repetir para: categories, suppliers, customers, inventory, sales, purchase_orders,
-- cash_registers, cash_sessions, audit_logs, notifications, system_settings,
-- inventory_movements, product_batches, product_suppliers
```

## Tablas con branch_id (aislamiento adicional)
```sql
CREATE POLICY sales_branch ON sales
  USING (branch_id = ANY(current_setting('app.allowed_branch_ids')::uuid[]));
```

## Tablas sin business_id (globales o del sistema)
- `roles`, `permissions`, `role_permissions`: acceso solo lectura para todos los roles autenticados.
- `user_roles`, `user_branch_access`: filtrar por `user_id`.

## Consideraciones
- El pool de conexiones reutiliza conexiones; `SET LOCAL` se resetea al final de la transacción.
- Las transacciones deben envolver operaciones multi-tabla para mantener el contexto.
- RLS no reemplaza RBAC en Express; es defensa en profundidad.
- Antes de habilitar, probar cada política con usuarios de diferentes roles y empresas.

## Validación realizada

- `app_user` no tiene `BYPASSRLS`.
- Empresa A no puede consultar datos de empresa B.
- Sin `app.current_business_id` no se devuelven filas.
- Un INSERT con empresa ajena falla por política RLS.
- Los advisors de seguridad y salud de Supabase no reportan hallazgos.

## Riesgos
- Si el rol de conexión es superuser, RLS se omite.
- Si no se establece `app.current_business_id`, las consultas retornan 0 filas (fail-closed) o error.
- Las migraciones y backups deben ejecutarse con un rol privilegiado.