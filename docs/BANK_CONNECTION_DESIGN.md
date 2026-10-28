# Conexión bancaria (Bancolombia vía Croma) — Diseño

Estado: **implementado (conexión, consentimiento, auditoría, lectura de cuentas); sin lanzar.**
Ver "Implementación" al final para lo que difiere de esta propuesta y lo que falta.

## 1. Qué se quiere

Que un usuario conecte su cuenta Bancolombia al Simulador para importar movimientos reales (p. ej. a "Mi Presupuesto"), con:

- la conexión delegada al usuario, que acepta de forma explícita que **es su responsabilidad**;
- una experiencia de conexión clara y de pocos pasos;
- un **audit log** con trazabilidad de la conexión y de los cambios.

## 2. Hallazgos que condicionan el diseño

Fuente: documentación de Croma (`docs.usecroma.com`).

| Hallazgo | Consecuencia |
|---|---|
| Croma autentica con **usuario + contraseña de la Sucursal Virtual Personas** del usuario (no es OAuth ni Open Banking). | Es lo más sensible que maneja la app. Hay que minimizar dónde viven esas credenciales (ver §3). |
| Las conexiones pertenecen a **nuestra organización** en Croma, no al usuario final. No hay multi-tenant ni subcuentas. | La app debe guardar el mapeo `usuario → connection_id` y pasar `connection_id` en cada consulta (409 si falta y hay varias). |
| **Máximo 5 conexiones por fuente** y cupo diario de inicios de sesión por conexión. | **Tope duro: 5 usuarios con Bancolombia conectado.** Hay que hablar con Croma antes de construir nada para usuarios reales. |
| La consola de Croma es de la organización (nuestra). Un usuario final no puede usarla. | El usuario tiene que conectar desde **nuestra** UI → nuestro backend → `POST /co/bancolombia/connections/v1`. |
| Croma **no documenta audit log** (solo `created_at`, `last_used_at`, `usage`). | La trazabilidad la construimos nosotros. |
| La app hoy es 100 % frontend y su login es un **mock** (cuentas fijas en el cliente). | Necesita backend (la llave de API de Croma no puede ir al navegador) y autenticación real. No se puede lanzar sobre el mock. |

## 3. Arquitectura

```
Navegador (React)  ──HTTPS──▶  Funciones serverless (Vercel)  ──▶  Croma API
      │                               │
      │                               └──▶  Postgres (Supabase): connections, consents, audit_events
      └── nunca ve la llave de Croma ni guarda credenciales bancarias
```

Reglas de manejo de credenciales:

1. La contraseña viaja **una sola vez**: formulario → función serverless → `POST` a Croma. Nunca se escribe en base de datos, logs, ni analytics.
2. **Microsoft Clarity está activo en el sitio.** La pantalla de conexión debe quedar fuera del registro de sesiones (enmascarar los campos con `data-clarity-mask="true"` y excluir la ruta) y la CSP no debe permitir más de lo necesario.
3. Guardamos solo: `user_id`, `croma_connection_id`, `display_name` enmascarado, estado y fechas.
4. El número de cuenta se muestra y se registra enmascarado (últimos 4).
5. La llave de API de Croma vive solo como variable de entorno del servidor.

## 4. Experiencia de usuario

Propuesta: una **página dedicada** (`#/conexiones`), no un modal, accesible solo con sesión real. Un flujo con indicador de progreso (en la implementación son 3 pantallas; la verificación es el estado de envío de la última). La elección entre "formulario" y "login page" se resuelve así: es un formulario, pero con la presentación de una pantalla de login (una columna, un solo objetivo, sin distracciones), reutilizando el patrón visual de `LoginForm`.

**Paso 1 — Qué vas a hacer.** Qué se importa (cuentas, saldos, movimientos), que es **solo lectura** (no se mueve dinero) y que puedes desconectar cuando quieras.

**Paso 2 — Tu responsabilidad (consentimiento explícito).** Casillas separadas, todas obligatorias:

- Soy titular de la cuenta o estoy autorizado por el titular para usarla.
- Entiendo que **la conexión y el uso de mis credenciales es decisión y responsabilidad mía**; este simulador es una herramienta educativa y no es asesor financiero.
- Entiendo que mi usuario y contraseña se envían a un proveedor externo (Croma) para consultar mi información, y que debo revisar las condiciones de mi banco sobre compartir credenciales.
- Autorizo el tratamiento de mis datos para este fin (Ley 1581 de 2012), y sé que puedo revocarlo.

El botón "Continuar" queda deshabilitado hasta marcarlas. Se guarda la **versión y el hash del texto aceptado** (§5).

**Paso 3 — Credenciales.** Usuario y contraseña de la Sucursal Virtual Personas, con botón mostrar/ocultar, `autocomplete="off"`, un aviso corto ("No guardamos tu contraseña"), y enlace al proceso de recuperación del banco. Sin clave dinámica ni datos de tarjeta: nunca se piden.

**Paso 4 — Verificación.** La consulta es en vivo y puede tardar: estado de progreso con `aria-live`, no un spinner mudo. Resultados con mensajes accionables:

| Respuesta de Croma | Mensaje al usuario |
|---|---|
| OK | "Cuenta conectada" → selección de cuentas y rango de fechas a importar |
| 422 `connection_rejected` | "El banco no aceptó estos datos. Revísalos e inténtalo de nuevo." |
| 409 `connection_exists` | "Esta cuenta ya está conectada." |
| 429 `connections_exhausted` | "Servicio ocupado, reintenta en X minutos" (usar `Retry-After`) |
| Sin cupo (tope de 5) | "Por ahora no hay cupos disponibles" + lista de espera |

**Gestión.** En la misma página: estado de la conexión (activa / inválida / agotada), último uso, y **Desconectar** (`DELETE`, con confirmación). Si queda inválida (cambió la clave), CTA "Volver a autenticar". Todo en ES/EN, con el sistema M3 existente y los mismos tests de accesibilidad y del guard de textos.

**Importación a Presupuesto.** Los movimientos importados no pisan los valores del usuario: se muestran como **propuesta** (categoría sugerida por movimiento, editable) y solo se aplican al confirmar. Usar `direction` (no `movement_type`, que el banco entrega invertido).

## 5. Audit log

Tabla `audit_events`, **solo inserción** (sin `UPDATE`/`DELETE` para el rol de la app; RLS por `user_id` para lectura del propio usuario).

| Campo | Contenido |
|---|---|
| `id`, `ts` | UUID y marca de tiempo del servidor (UTC) |
| `user_id` | quién |
| `actor` | `user` o `system` |
| `event_type` | ver abajo |
| `connection_id` | id de Croma (si aplica) |
| `outcome` | `success` / `failure` + código de error |
| `consent_version`, `consent_hash` | en eventos de consentimiento |
| `request_id`, `ip_hash`, `user_agent` | contexto (IP con hash, no en claro) |
| `metadata` (JSON) | detalle **sin secretos**: cuenta enmascarada, rango de fechas, conteo de movimientos, cambios antes/después |
| `prev_hash`, `hash` | encadenado opcional para detectar manipulación |

Eventos:

- **Consentimiento:** `consent.accepted`, `consent.revoked` (con versión y hash del texto).
- **Conexión:** `connection.attempted`, `connection.created`, `connection.rejected`, `connection.duplicate`, `connection.exhausted`, `connection.invalidated`, `connection.deleted`.
- **Lectura de datos:** `accounts.read`, `transactions.read` (rango y cantidad, **nunca el contenido**).
- **Cambios:** `import.proposed`, `import.applied` (campos de presupuesto modificados, antes → después), `import.discarded`.

Nunca se registra: contraseña, usuario del banco, número de cuenta completo, contenido de los movimientos.

Para el usuario: sección **"Actividad"** en la página de conexiones con su propio historial y exportación a CSV. Retención y borrado al eliminar la cuenta: definir con asesoría legal.

## 6. Riesgos a revisar antes de lanzar

- **Legal/cumplimiento:** tratamiento de datos financieros (Ley 1581 de 2012), términos del banco sobre compartir credenciales, y el aviso de responsabilidad. Debe revisarlo un abogado; el texto de §4 es un borrador, no asesoría legal.
- **Responsabilidad por custodiar credenciales en tránsito**, aunque no se almacenen.
- **Dependencia de un tercero** y del scraping de la Sucursal Virtual: si el banco cambia el login, la conexión se rompe.
- **Escala:** tope de 5 conexiones (§2).

## 7. Fases propuestas

1. **Decisiones y prerequisitos** (§8): cupo con Croma, auth, aprobación legal.
2. **Backend base:** auth real, Postgres, funciones serverless, `audit_events` y su API.
3. **Conexión:** páginas de consentimiento, credenciales, verificación y gestión.
4. **Importación a Presupuesto** con propuesta y confirmación.
5. **Actividad** (historial del usuario) y endurecimiento (Clarity, CSP, rate limiting, pruebas).

## 8. Decisiones

Resueltas (2026-10-28):

- **Autenticación:** Supabase.
- **Credenciales por nuestro backend:** aceptado.
- **Alcance del audit log:** solo conexiones por ahora (consentimiento, ciclo de vida de la conexión y lecturas de cuentas); se extenderá después.

**Sin resolver:**

1. **Cupo con Croma:** ¿se puede subir el límite de 5 conexiones o hay un plan multi-tenant? Y costo por llamada (`credits.md`). Sin esto, la función solo sirve para 5 usuarios.
2. **Revisión legal** del texto de consentimiento (`api/_lib/consent.ts`) y de los términos del banco sobre compartir credenciales.

## 9. Implementación

Código: `api/` (funciones serverless), `supabase/migrations/`, `src/features/bank/`. Cómo correrlo: README, sección "Bank connection".

Diferencias respecto a la propuesta:

- **El texto de consentimiento vive en el servidor** (`api/_lib/consent.ts`), no en los diccionarios de i18n: el servidor es quien lo hashea y registra el hash, así que es quien debe ser dueño de las palabras exactas. La UI muestra lo que el servidor sirve.
- **Auditoría que falla cerrada:** antes de enviar la clave a Croma se escribe `consent.accepted` y `connection.attempted`; si no se puede escribir, no se llama a Croma. Los eventos posteriores son "mejor esfuerzo".
- **Protecciones añadidas:** tope de conexiones por usuario (por defecto 1, por el límite de 5 de Croma) y bloqueo tras 5 rechazos del banco en una hora (evita usar la app para adivinar una clave o bloquear la cuenta real del usuario).
- **Cuentas solo bajo demanda:** cada lectura inicia sesión en el banco (y gasta cupo diario y créditos), así que "Ver cuentas" es una acción explícita.
- **Sin cadena de hashes** en `audit_events`; la inmutabilidad es por trigger (sin UPDATE/DELETE/TRUNCATE, ni siquiera para el service role).
- `audit_events.user_id` no tiene clave foránea, para que el historial sobreviva a la eliminación de la cuenta (retención por definir con asesoría legal).

Añadido después: **importación de movimientos a Mi Presupuesto** (`api/bank/transactions`, `api/bank/imports`, `src/lib/bankImport.ts`, panel en la pestaña Presupuesto). Solo gastos; categoría sugerida por palabras clave y editable; propuesta mensual = total ÷ meses de la ventana; el `import.applied` (con antes/después por campo) se escribe **antes** de modificar el presupuesto. El audit log guarda conteos, la ventana y los cambios, nunca el contenido de los movimientos.

Pendiente:
- **Ingresos** (nómina, etc.) no se importan todavía; solo se usa el dinero que sale.
- Las reglas de categorización son para comercios colombianos comunes y son un punto de partida, no exhaustivas.

- **Limpieza de credenciales huérfanas** si se elimina un usuario de Supabase (hoy la fila local se borra en cascada, pero la conexión en Croma queda).
- **Verificación en un despliegue real de Vercel** (ver README), y de las consultas de `createSupabaseDb` contra un proyecto Supabase real: las pruebas usan dobles en memoria.
- Rate limiting general por IP, exportación del historial a CSV, retención y borrado.
