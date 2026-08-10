# ShipNow API — Módulo 4: Logging y monitoreo básico

API de gestión de envíos (**ShipNow**) construida con Node.js, Express y MongoDB (Mongoose), siguiendo una arquitectura por capas: **rutas → servicios → modelos**.

Este módulo incorpora un sistema de **logging profesional** con Winston, conectado con lo trabajado en los módulos anteriores: arquitectura por capas, mocks y manejo centralizado de errores. Todos los `console.log` sueltos fueron reemplazados por un logger único con niveles de severidad, salida diferenciada por entorno y persistencia en archivos con rotación diaria.

## Instalación

\`\`\`bash
npm install
\`\`\`

El proyecto no usa variables de entorno para la configuración de base/puerto; están definidas directamente en `src/server.js`:

- Puerto: `3000`
- MongoDB: `mongodb://localhost:27017/shipnow`

Asegurate de tener MongoDB corriendo localmente antes de levantar el servidor.

La única variable de entorno que sí se usa es `NODE_ENV`, para diferenciar el comportamiento del logger entre desarrollo y producción (ver sección de Logging más abajo).

## Levantar el servidor

\`\`\`bash
npm run dev
\`\`\`

Si todo está bien configurado, la terminal debería mostrar:

\`\`\`
2026-08-10 19:09:09 [info]    Conexión a MongoDB establecida
2026-08-10 19:09:09 [info]    Servidor ShipNow escuchando en el puerto 3000
\`\`\`

## Manejo de errores

### Estructura de respuesta uniforme

Toda respuesta de error de la API, sin importar en qué endpoint ocurra, tiene siempre esta forma:

\`\`\`json
{
  "status": "error",
  "error": "CÓDIGO_DEL_ERROR",
  "message": "Descripción legible del error"
}
\`\`\`

- **`status`**: siempre `"error"`.
- **`error`**: código interno del error (ej. `ORDER_NOT_FOUND`), definido en el diccionario de errores.
- **`message`**: mensaje entendible para el cliente/consumidor de la API.

### Cómo funciona internamente

1. **Los `services`** (`src/services/`) son los únicos responsables de detectar errores de negocio (usuario inexistente, estado inválido, datos faltantes, etc.). Cuando detectan un problema, lanzan un `throw new customError(CÓDIGO)` — nunca responden HTTP directamente.
2. **Las `routes`** (`src/routes/`) no tienen `try/catch` propios: están envueltas en un helper `asyncHandler`, que captura cualquier error lanzado (sea de un `service` o de Mongoose) y lo deriva automáticamente con `next(error)`.
3. **Un middleware catch-all**, registrado justo antes del `errorHandler`, captura cualquier ruta inexistente y la convierte en un `customError` de tipo `ROUTE_NOT_FOUND`.
4. **El middleware global** `errorHandler` (`src/middleware/errorHandler.js`), registrado al final de `server.js`, es el **único punto del código que arma la respuesta HTTP de error**. Busca el código del error en el diccionario, responde con el `statusCode` y mensaje correspondientes, y **registra el evento con Winston** según su gravedad.

\`\`\`
src/
├── constants/error.constants.js   # ERROR_CODES + ERROR_DICTIONARY (código, mensaje, statusCode)
├── utils/customError.js           # Clase CustomError, extiende Error, captura el stack trace
├── utils/asyncHandler.js          # Wrapper que deriva errores async a next(error)
├── utils/logger.js                # Configuración centralizada de Winston
├── middleware/errorHandler.js     # Middleware global, única fuente de respuestas de error
├── services/                      # Detectan y lanzan errores de negocio, y loguean eventos clave
└── routes/                        # Solo delegan al service, sin lógica de error propia
\`\`\`

### Diccionario de errores (`ERROR_CODES`)

| Código | HTTP Status | Descripción |
|---|---|---|
| `USER_NOT_FOUND` | 404 | El usuario solicitado no existe |
| `USER_ALREADY_EXIST` | 400 | Ya existe un usuario con ese email |
| `ORDER_NOT_FOUND` | 404 | El pedido solicitado no existe |
| `INVALID_ORDER_STATUS` | 400 | El estado del pedido no es válido |
| `ORDER_ALREADY_DELIVERED` | 409 | El pedido ya fue entregado y no puede modificarse |
| `DELIVERY_NOT_FOUND` | 404 | La entrega solicitada no existe |
| `DRIVER_UNAVAILABLE` | 409 | No hay repartidores disponibles |
| `PRODUCT_NOT_FOUND` | 404 | El producto solicitado no existe |
| `INVALID_STOCK` | 400 | Stock o precio negativo |
| `INVALID_MOCK_QUANTITY` | 400 | Cantidad de mocks inválida (no numérica, negativa o cero) |
| `MOCK_GENERATION_FAILED` | 500 | Falla al generar o insertar datos de prueba en MongoDB |
| `ROUTE_NOT_FOUND` | 404 | La ruta solicitada no existe |
| `VALIDATION_ERROR` | 400 | Faltan datos obligatorios o el formato es inválido |
| `FORBIDDEN` | 403 | Acción no permitida para el rol del usuario |
| `DATABASE_ERROR` | 500 | Error al interactuar con la base de datos |
| `INTERNAL_SERVER_ERROR` | 500 | Error inesperado no controlado |

## Módulo de mocking (`/api/mocks`)

Reutiliza el mismo sistema de errores y logging. Valida especialmente la cantidad de datos solicitados y las fallas durante la inserción en MongoDB.

| Método | Endpoint | Query/Body | Descripción |
|---|---|---|---|
| GET | `/api/mocks/mockingusers` | `count` (opcional) | Genera usuarios simulados (no persiste) |
| GET | `/api/mocks/mockingorders` | `count` (opcional) | Genera pedidos simulados (no persiste) |
| GET | `/api/mocks/mockingdeliveries` | `count` (opcional) | Genera entregas simuladas (no persiste) |
| POST | `/api/mocks/generateData` | `{ "users": 10, "orders": 15, "deliveries": 15 }` | Inserta datos reales en MongoDB respetando relaciones |

## Logging con Winston

### Herramienta utilizada

El proyecto usa **Winston** como logger centralizado, con **`winston-daily-rotate-file`** para la persistencia y rotación de archivos. Toda la configuración vive en un único módulo (`src/utils/logger.js`) y se importa desde cualquier parte del proyecto sin repetir configuración.

### Niveles de log

| Nivel | Uso |
|---|---|
| `debug` | Detalle técnico interno, útil solo en desarrollo |
| `http` | Registro de requests entrantes |
| `info` | Eventos normales del sistema (servidor iniciado, conexión a DB, pedido creado, mocks generados) |
| `warning` | Errores esperados / de negocio (recurso no encontrado, validación fallida, ruta inexistente) |
| `error` | Errores inesperados del servidor (excepciones no controladas) |
| `fatal` | Fallas críticas que impiden que la aplicación siga funcionando (ej. no se pudo conectar a MongoDB) |

### Diferenciación por entorno

El comportamiento del logger cambia según la variable `NODE_ENV`:

- **Desarrollo** (`NODE_ENV` no seteada, o distinta de `production`): la consola muestra **todos** los niveles, incluido `debug`, con colores.
- **Producción** (`NODE_ENV=production`): la consola muestra solo desde `info` en adelante (`info`, `warning`, `error`, `fatal`) — `debug` y `http` quedan silenciados.

Para probar el modo producción localmente (PowerShell):

\`\`\`bash
$env:NODE_ENV="production"; npm run dev
\`\`\`

Para volver a desarrollo:

\`\`\`bash
$env:NODE_ENV="development"; npm run dev
\`\`\`

### Persistencia y rotación de archivos

Independientemente del entorno, los niveles **`error`** y **`fatal`** se guardan en archivos dentro de la carpeta `logs/`, en la raíz del proyecto:

\`\`\`
logs/
└── errors-2026-08-10.log   # un archivo por día
\`\`\`

- Se usa `winston-daily-rotate-file` con patrón de fecha diario (`errors-%DATE%.log`).
- Se conservan los últimos **14 días** de logs; los archivos más viejos se eliminan automáticamente.
- La carpeta `logs/` está en `.gitignore`: los archivos generados por la aplicación **nunca** se suben al repositorio.

### Dónde se usa el logger

- **`server.js`**: al iniciar el servidor (`logger.info`) y al conectar con MongoDB (`logger.info` si conecta bien, `logger.fatal` si falla y el proceso termina).
- **`errorHandler.js`**: registra cada error que pasa por el middleware global — `logger.warning` para errores de negocio esperados (404, 400, 409), `logger.error` para errores inesperados no controlados (500).
- **`mocks.service.js`**: `logger.warning` cuando se recibe una cantidad inválida, `logger.info` cuando se genera y persiste data de prueba correctamente, `logger.error` si falla la inserción en MongoDB.
- **`order.service.js`**: `logger.info` cuando un pedido se crea correctamente.

### Endpoint de prueba del logger

\`\`\`
GET /api/loggerTest
\`\`\`

Dispara un log de cada uno de los 6 niveles en una sola llamada, para verificar rápidamente que la configuración funciona:

\`\`\`json
{
  "status": "success",
  "message": "Se generó un log de cada nivel: debug, http, info, warning, error, fatal",
  "levels": ["debug", "http", "info", "warning", "error", "fatal"]
}
\`\`\`

En consola (modo desarrollo), deberían verse las 6 líneas coloreadas por nivel. En modo producción, solo aparecerían `info`, `warning`, `error` y `fatal`. Ninguna de estas líneas de prueba queda en el archivo de logs, ya que ni `info` ni `warning` cumplen el filtro de persistencia (`level: 'error'`).

## Cómo probar casos inválidos en Postman

### 1. Recurso inexistente → 404

\`\`\`
GET http://localhost:3000/api/orders/64b000000000000000000000
\`\`\`
\`\`\`json
{
  "status": "error",
  "error": "ORDER_NOT_FOUND",
  "message": "Pedido no encontrado"
}
\`\`\`

### 2. Datos obligatorios faltantes → 400

\`\`\`
POST http://localhost:3000/api/orders
Content-Type: application/json

{ "customer": "64b000000000000000000000" }
\`\`\`
\`\`\`json
{
  "status": "error",
  "error": "VALIDATION_ERROR",
  "message": "Faltan los items del pedido"
}
\`\`\`

### 3. Regla de negocio violada → 409

\`\`\`
PATCH http://localhost:3000/api/orders/{id-de-un-pedido-ya-entregado}/status
Content-Type: application/json

{ "status": "created" }
\`\`\`
\`\`\`json
{
  "status": "error",
  "error": "ORDER_ALREADY_DELIVERED",
  "message": "El pedido ya fue entregado y no puede modificarse"
}
\`\`\`

### 4. Mocks — cantidad inválida (texto en vez de número) → 400

\`\`\`
GET http://localhost:3000/api/mocks/mockingusers?count=abc
\`\`\`
\`\`\`json
{
  "status": "error",
  "error": "INVALID_MOCK_QUANTITY",
  "message": "El parámetro \"count\" debe ser un número entero mayor a 0 (recibido: \"abc\")"
}
\`\`\`

### 5. Mocks — cantidad negativa o cero → 400

\`\`\`
POST http://localhost:3000/api/mocks/generateData
Content-Type: application/json

{ "users": 0, "orders": 5, "deliveries": 5 }
\`\`\`
\`\`\`json
{
  "status": "error",
  "error": "INVALID_MOCK_QUANTITY",
  "message": "El parámetro \"users\" debe ser un número entero mayor a 0 (recibido: \"0\")"
}
\`\`\`

### 6. ID con formato inválido (no ObjectId de Mongo) → 400

\`\`\`
GET http://localhost:3000/api/products/no-es-un-id-valido
\`\`\`
\`\`\`json
{
  "status": "error",
  "error": "VALIDATION_ERROR",
  "message": "El identificador proporcionado no es válido"
}
\`\`\`

### 7. Ruta inexistente → 404

\`\`\`
GET http://localhost:3000/api/blabla
\`\`\`
\`\`\`json
{
  "status": "error",
  "error": "ROUTE_NOT_FOUND",
  "message": "La ruta GET /api/blabla no existe"
}
\`\`\`

### 8. Endpoint de prueba del logger → 200

\`\`\`
GET http://localhost:3000/api/loggerTest
\`\`\`

Revisar la terminal para confirmar que aparecen los 6 niveles (en desarrollo) o 4 niveles (en producción).