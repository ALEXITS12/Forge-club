# FORGE Club — Frontend de demostración

Frontend de sistema de gestión de gimnasio construido con HTML, CSS y JavaScript sin framework.

## Archivos
- `index.html`: estructura de la página pública, autenticación y aplicación privada.
- `styles.css`: estilos de escritorio y tableta, con tema oscuro premium.
- `mobile.css`: estilos para teléfono (hasta 760 px). Debe cargarse después de `styles.css`.
- `js/`: lógica de la aplicación, dividida por tema. Son scripts normales (comparten el ámbito global), así que el **orden de carga en `index.html` importa**:
  - `utils.js`: selectores, fechas, dinero y textos.
  - `data.js`: datos de demostración (planes, usuarios, socios, equipos, dietas...).
  - `state.js`: carga y guardado en `localStorage`, registro de actividad.
  - `shell.js`: avisos, ventanas modales, cambio de pantalla, menú lateral y navegación.
  - `components.js`: encabezados, botones, tarjetas, gráficas y tablas reutilizables.
  - `pages/dashboards.js`, `pages/admin.js`, `pages/member.js`: las pantallas de cada rol.
  - `forms.js`: formularios en ventana modal y su guardado.
  - `auth.js`: inicio de sesión y registro.
  - `actions.js`: qué hace cada botón con `data-action`.
  - `public.js`: planes de la página pública, submenú ☰ y botones de navegación rápida.
  - `main.js`: eventos globales y arranque.
- `config.js`: configuración pública del frontend.
- `api.js`: capa inicial para conectar endpoints de un backend.
- `README.md`: instrucciones.

## Probar
1. Descomprime la carpeta.
2. Abre `index.html` o, preferentemente, usa Live Server en VS Code.
3. En la pantalla de inicio de sesión usa una de estas cuentas:
   - Admin: `admin@forge.demo`
   - Instructor: `coach@forge.demo`
   - Recepción: `recepcion@forge.demo`
   - Socio: `socio@forge.demo`
   - Contraseña para las cuatro: `ForgeDemo26!`

Los registros y cambios de la demo se guardan en `localStorage` del navegador. Son datos ficticios; no uses datos personales reales.

## Limitaciones de seguridad
Esta es una demostración frontend, NO un sistema listo para producción:
- Los usuarios/contraseñas demo se verifican en JavaScript y no constituyen autenticación segura.
- No almacenes contraseñas reales en `localStorage`.
- Los roles y permisos del frontend son solo de presentación; la API debe validar autorización en cada endpoint.
- Los pagos no se procesan realmente y las membresías no se activan por cobros reales.
- No se envían correos desde el navegador.
- Los valores de gráficas y varias métricas son de demostración.
- Antes de publicar, elimina cuentas demo, datos ficticios y cualquier flujo de demostración.

## Integración sugerida con AWS
Arquitectura posible:
- Frontend estático: Amazon S3 + CloudFront (o AWS Amplify Hosting).
- API: API Gateway + AWS Lambda, o backend en ECS/Elastic Beanstalk.
- Base de datos: Amazon RDS (por ejemplo PostgreSQL/MySQL) o DynamoDB según el modelo de datos.
- Identidad: Amazon Cognito o autenticación de backend con sesiones/cookies seguras.
- Correo: Amazon SES desde backend/Lambda tras validar el registro o pago.
- Respaldos: backups automáticos de RDS / política de retención.

### Contrato inicial de API
`api.js` incluye ejemplos para:
- `POST /auth/login`
- `POST /auth/logout`
- `GET /auth/me`
- `POST /members/register`
- `GET /dashboard`
- `GET /members`
- `POST /employees`
- `PATCH /memberships/:id`

Son rutas sugeridas; no existen hasta que las implementes en tu backend. Configura `API_BASE_URL` en `config.js` una vez que tengas el endpoint desplegado. No pongas secretos de AWS en ese archivo.

### Correo de alta/membresía
El backend debería enviar el email después de guardar el alta y confirmar la membresía/pago. Plantilla sugerida:
- Nombre del socio
- Tipo de membresía
- Fecha de inicio y vencimiento
- Estado de pago/membresía
- Importe confirmado y folio, si aplica
- Enlace de acceso a la cuenta

Para avisos de vencimiento, programa una tarea en backend (por ejemplo EventBridge + Lambda) que consulte membresías por vencer y envíe avisos con SES. No dependas de que el usuario tenga la página abierta.

## Nota
Los precios y datos incluidos son placeholders para maquetación. Confirma los precios y beneficios reales del gimnasio antes de publicar.

## Actualización del expediente del socio
La versión actualizada incorpora:
- **Mi expediente:** información del socio, vigencia, rutina asignada y credencial digital de demostración.
- **Método de acceso configurable:** en Configuración, el administrador puede elegir código de barras o acceso biométrico. En el modo biométrico no se muestra la credencial de código. La selección solo cambia la interfaz de la demo; no integra lectores ni dispositivos biométricos.
- **Seguimiento de peso:** el socio puede registrar peso, porcentaje de grasa corporal opcional, fecha y notas; consulta el historial y una gráfica básica de evolución.
- **Cierre de sesión visible:** se agregó el botón a la navegación lateral para cambiar de rol durante las pruebas.

Los registros de mediciones se guardan en el almacenamiento local del navegador en esta demostración. Antes de usar el sistema con socios reales, hay que trasladar estos datos a una API protegida y restringir su consulta al socio y personal autorizado.


## Módulos añadidos: dietas y estadísticas
- **Banco de dietas** para administrador e instructor, con cinco plantillas iniciales: volumen, definición, recomposición corporal, mantenimiento y alimentación equilibrada.
- **Planes personalizados** asignables a un socio, con comidas editables en formato `hora | nombre | alimentos`.
- **Mi alimentación** para el socio: consulta su plan y puede marcar opcionalmente las comidas realizadas. Se guarda un historial local.
- **Dieta externa**: se puede seleccionar un PDF en la interfaz y se conserva su nombre como referencia. La demo no sube ni guarda el archivo real; para eso se debe integrar almacenamiento privado en backend (por ejemplo, S3 con permisos y enlaces temporales).
- **Reportes**: distribución de dietas asignadas, seguimiento de comidas registradas, salones con más reservas y equipos con más fallas.
- **Mantenimiento**: desde Equipos y mantenimiento se puede registrar una falla o servicio, que alimenta la gráfica de incidencias.

Las plantillas alimenticias son ejemplos de interfaz, no recomendaciones clínicas personalizadas. El seguimiento representa registros marcados por el socio y no demuestra por sí mismo cumplimiento nutricional ni resultados físicos. Todas estas nuevas funciones usan datos de demostración almacenados en el navegador; no se han conectado a la base de datos ni a AWS.