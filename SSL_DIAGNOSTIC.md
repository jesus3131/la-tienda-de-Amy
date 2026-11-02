# Diagnóstico SSL — La tienda de Amy

## Estado actual
- `database.ts` activa SSL cuando `sslmode=require` está en DATABASE_URL o `NODE_ENV=production`.
- `rejectUnauthorized` es `true` solo si `SUPABASE_CA` está configurado; de lo contrario `false`.
- Supabase Session Pooler usa un certificado que Node.js no confía por defecto (self-signed en cadena).

## Procedimiento para habilitar validación estricta
1. Descargar el certificado CA de Supabase desde el dashboard (Settings → Database → SSL).
2. Guardar el certificado en un archivo seguro (no commitear).
3. Configurar `SUPABASE_CA` con el contenido del certificado (o ruta al archivo).
4. Verificar que `rejectUnauthorized` sea `true`.
5. Probar conexión con `npm run dev` y confirmar `Database connected`.

## Riesgo actual
Sin `SUPABASE_CA`, la conexión es cifrada pero no verifica la identidad del servidor (MITM posible). Para producción, configurar el CA es obligatorio.