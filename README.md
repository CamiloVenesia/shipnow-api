# ShipNow API — Módulo 3: Manejo profesional de errores

API de gestión de envíos (**ShipNow**) construida con Node.js, Express y MongoDB (Mongoose), siguiendo una arquitectura por capas: **rutas → servicios → modelos**.

Este módulo centraliza el manejo de errores de toda la API: se elimina cualquier respuesta de error dispersa o hardcodeada en rutas o lógica de negocio, y se reemplaza por un sistema uniforme compuesto por un **diccionario de errores**, una clase **`customError`** y un **middleware global** (`errorHandler`) que es el único responsable de construir la respuesta HTTP final.

## Instalación

\`\`\`bash
npm install
\`\`\`

El proyecto no usa variables de entorno; la configuración de puerto y base de datos está definida directamente en `src/server.js`:

- Puerto: `3000`
- MongoDB: `mongodb://localhost:27017/shipnow`

Asegurate de tener MongoDB corriendo localmente antes de levantar el servidor.

## Levantar el servidor

\`\`\`bash
npm run dev
\`\`\`

Si todo está bien configurado, la terminal debería mostrar:

\`\`\`
Conectado a MongoDB
Servidor corriendo en puerto 3000
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
3. **El middleware global** `errorHandler` (`src/middleware/errorHandler.js`), registrado al final de `server.js`, es el **único punto del código que arma la respuesta HTTP de error**. Busca el código del error en el diccionario y responde con el `statusCode` y mensaje correspondientes.

\`\`\`
src/
├── constants/error.constants.js   # ERROR_CODES + ERROR_DICTIONARY (código, mensaje, statusCode)
├── utils/customError.js           # Clase CustomError, extiende Error, captura el stack trace
├── utils/asyncHandler.js          # Wrapper que deriva errores async a next(error)
├── middleware/errorHandler.js     # Middleware global, única fuente de respuestas de error
├── services/                      # Detectan y lanzan errores de negocio
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
| `VALIDATION_ERROR` | 400 | Faltan datos obligatorios o el formato es inválido |
| `FORBIDDEN` | 403 | Acción no permitida para el rol del usuario |
| `DATABASE_ERROR` | 500 | Error al interactuar con la base de datos |
| `INTERNAL_SERVER_ERROR` | 500 | Error inesperado no controlado |

## Módulo de mocking (`/api/mocks`)

Reutiliza el mismo sistema de errores. Valida especialmente la cantidad de datos solicitados y las fallas durante la inserción en MongoDB.

| Método | Endpoint | Query/Body | Descripción |
|---|---|---|---|
| GET | `/api/mocks/mockingusers` | `count` (opcional) | Genera usuarios simulados (no persiste) |
| GET | `/api/mocks/mockingorders` | `count` (opcional) | Genera pedidos simulados (no persiste) |
| GET | `/api/mocks/mockingdeliveries` | `count` (opcional) | Genera entregas simuladas (no persiste) |
| POST | `/api/mocks/generateData` | `{ "users": 10, "orders": 15, "deliveries": 15 }` | Inserta datos reales en MongoDB respetando relaciones |

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