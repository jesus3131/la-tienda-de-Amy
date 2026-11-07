# Conexión de VS Code a PostgreSQL (La tienda de Amy)

## Importante
El proyecto usa **PostgreSQL**, NO SQL Server. La extension `ms-mssql.mssql` es para SQL Server y no funciona con PostgreSQL.

Se instalo la extension correcta: `ms-ossdata.vscode-pgsql` (PostgreSQL).

## Parametros de conexion (Docker local)

| Campo | Valor |
|---|---|
| Host | localhost |
| Port | 5432 |
| Database | erp_pos |
| User | erp |
| Password | erp_dev_password |
| SSL | No (local) |

## Pasos en VS Code

1. Abre el panel de la extension PostgreSQL (icono de elefante en la barra lateral).
2. Click en "Add Connection" o "+".
3. Ingresa los parametros de arriba.
4. Click "Connect".
5. Explora las 36 tablas.

## Alternativa: Database Client (cweijan.vscode-mysql-client2)

Esta extension tambien soporta PostgreSQL:
1. Click en el icono de base de datos en la barra lateral.
2. "New Connection" → PostgreSQL.
3. Mismos parametros.

## Verificar conexion desde terminal

Ejecuta la tarea "Test DB Connection" en VS Code (Ctrl+Shift+P → "Run Task" → "Test DB Connection").

O manualmente:
```powershell
cd backend
npm run test-connection
```

Resultado esperado:
```
Database connected
Connected in ~100 ms
Database: erp_pos
User: erp
Version: PostgreSQL 16.13
Tables: 36
Connection test: OK
```

## Notas
- SQL Server (mssql) NO es compatible con PostgreSQL.
- Para produccion (Supabase), usar los parametros del proyecto Supabase con SSL.
- Docker debe estar corriendo para la conexion local.