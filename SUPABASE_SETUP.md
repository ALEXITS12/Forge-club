# FORGE Club — conexión inicial a Supabase

## Qué se configuró
- URL del proyecto y `sb_publishable` en `config.js`.
- Biblioteca oficial `supabase-js` v2 cargada desde CDN.
- `js/supabase.js` crea un cliente reutilizable y permite probar Auth/sesión.
- La demo sigue activa (`DEMO_MODE: true`) para no romper módulos que todavía leen y guardan en `localStorage`.

**Esto no significa que todos los módulos ya estén conectados a la base de datos.** El login y registro actuales siguen siendo de demostración hasta adaptar el flujo a Supabase Auth y enlazar los registros con las tablas reales.

## Antes de activar el modo real
1. En Supabase, abre **Authentication → Providers → Email** y confirma que Email esté habilitado.
2. En **Authentication → URL Configuration**, configura la URL local/de despliegue y las URLs de redirección necesarias.
3. Revisa la estructura real de tablas, claves primarias, `identity/default`, relaciones y datos existentes. El CSV de columnas no permite confirmar esos detalles.
4. Relaciona cada registro de `usuarios` con `auth.users.id` (UUID), por ejemplo con una columna `auth_user_id uuid UNIQUE REFERENCES auth.users(id)`. No reemplaces ni conviertas los IDs bigint existentes sin revisar las relaciones.
5. Activa RLS en todas las tablas expuestas y define políticas por socio/administrador antes de conectar datos personales. No basta con ocultar botones en JavaScript.
6. Migra el inicio de sesión y registro a `supabase.auth.signInWithPassword()` y `supabase.auth.signUp()`. Las contraseñas deben ser administradas por Supabase Auth; no se debe escribir ni comparar `pasward_hash` desde el frontend.
7. Cambia `DEMO_MODE` a `false` únicamente cuando las políticas, los permisos y los flujos de datos estén probados.

## Probar que la biblioteca carga
Abre la página servida desde un servidor local (no es necesario abrir el archivo HTML directamente), abre DevTools → Console y ejecuta:

```js
ForgeSupabase.testConnection().then(console.log).catch(console.error)
```

La prueba solo verifica que el cliente y la sesión de Auth pueden inicializarse; **no prueba** permisos de las tablas. Si el navegador bloquea el CDN o no hay internet, la biblioteca no cargará.

## Notas de esquema conocidas
- `usuarios.id` es `bigint`, mientras que Supabase Auth identifica usuarios con UUID. Usa una columna de vínculo.
- `usuarios.pasward_hash` parece tener un error tipográfico y no debe usarse para guardar contraseñas nuevas.
- `membresias.fecha_vencimiento` aparece como texto; conviene convertirla a `date` después de validar y normalizar los valores actuales.
- `pagos.conecpto` parece estar escrito así en el esquema exportado. No lo renombres hasta revisar las consultas existentes.

## Seguridad
La publishable key está diseñada para usarse en clientes públicos. Nunca añadas `sb_secret`, `service_role`, contraseñas de base de datos ni credenciales de correo/AWS a archivos frontend.
