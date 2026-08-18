# ShipNow API — Módulo 5: Documentación con Swagger

API de gestión de envíos (**ShipNow**) construida con Node.js, Express y MongoDB (Mongoose), siguiendo una arquitectura por capas: **rutas → servicios → modelos**.

Este módulo incorpora **documentación interactiva con Swagger/OpenAPI**, exponiendo una interfaz donde se puede consultar y probar en vivo cada endpoint de la API, organizada por módulos con schemas reutilizables y errores documentados según el sistema real de manejo de errores del proyecto.

## Instalación

\`\`\`bash
npm install
\`\`\`

El proyecto no usa variables de entorno para la configuración de base/puerto; están definidas directamente en `src/server.js`:

- Puerto: `3000`
- MongoDB: `mongodb://localhost:27017/shipnow`

Asegurate de tener MongoDB corriendo localmente antes de levantar el servidor.

La variable `NODE_ENV` sigue usándose para diferenciar el comportamiento del logger entre desarrollo y producción (ver Módulo 4).

## Levantar el servidor

\`\`\`bash
npm run dev
\`\`\`

Si todo está bien configurado, la terminal debería mostrar:

\`\`\`
2026-08-10 19:09:09 [info]    Conexión a MongoDB establecida
2026-08-10 19:09:09 [info]    Servidor ShipNow escuchando en el puerto 3000
\`\`\`

## Documentación interactiva (Swagger)

### Acceso

La documentación está disponible en:

\`\`\`
http://localhost:3000/api/docs
\`\`\`

Esta ruta está protegida con **autenticación básica** (usuario y contraseña), para evitar exponerla libremente:

- **Usuario:** `dev`
- **Contraseña:** `shipnow123`

Al entrar, el navegador va a pedir estas credenciales antes de mostrar la interfaz de Swagger UI.

### Cómo probar los endpoints desde Swagger

1. Entrá a `/api/docs` e ingresá las credenciales.
2. Elegí cualquier endpoint y hacé clic en **"Try it out"**.
3. Completá los parámetros o el body de ejemplo (ya vienen precargados con valores de muestra).
4. Hacé clic en **"Execute"** para mandar la request real contra tu servidor local y ver la respuesta.

### Módulos documentados (tags)

| Tag | Contenido |
|---|---|
| **Users** | CRUD de usuarios: listar, crear, obtener por ID, eliminar |
| **Orders** | CRUD de pedidos + actualización de estado |
| **Deliveries** | CRUD de entregas + actualización de estado |
| **Mocks** | Generación de datos simulados y carga real en MongoDB |
| **Logger** | Endpoint de diagnóstico del sistema de logging (no es funcionalidad de negocio) |

### Schemas reutilizables

Definidos en `src/docs/schemas.yaml` y reutilizados en todos los endpoints mediante `$ref`:

- `User`
- `Order`
- `OrderItem`
- `Delivery`
- `ErrorResponse`
- `SuccessResponse`

### Estructura de la documentación

\`\`\`
src/docs/
├── swagger.config.js   # Configuración de swagger-jsdoc (separada de la lógica de rutas)
├── schemas.yaml         # Schemas reutilizables (User, Order, Delivery, etc.)
├── users.yaml           # Documentación de /api/users
├── orders.yaml          # Documentación de /api/orders
├── deliveries.yaml      # Documentación de /api/deliveries
├── mocks.yaml           # Documentación de /api/mocks
└── logger.yaml          # Documentación de /api/loggerTest
\`\`\`

La configuración de Swagger vive completamente separada de las rutas: ningún archivo de `src/routes/` tiene lógica ni anotaciones de documentación. Todo el contenido de Swagger se arma desde los `.yaml` de `src/docs/`, que `swagger-jsdoc` lee automáticamente (`apis: ['./src/docs/**/*.yaml']` en `swagger.config.js`).

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

### Cómo funciona internamente

1. **Los `services`** (`src/services/`) son los únicos responsables de detectar errores de negocio. Cuando detectan un problema, lanzan un `throw new customError(CÓDIGO)`.
2. **Las `routes`** están envueltas en `asyncHandler`, que deriva cualquier error con `next(error)`.
3. **Un middleware catch-all** convierte cualquier ruta inexistente en un error `ROUTE_NOT_FOUND`.
4. **El middleware global** `errorHandler` arma la respuesta HTTP final y registra el evento con Winston (`warning` para errores esperados, `error` para no controlados).

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

## Logging con Winston

El proyecto usa **Winston** con **`winston-daily-rotate-file`** como logger centralizado (`src/utils/logger.js`), con 6 niveles: `debug`, `http`, `info`, `warning`, `error`, `fatal`. Se usa en `server.js`, `errorHandler.js`, y en **todos los `services`** (mocks, orders, deliveries) — no quedan `console.log` sueltos en ninguna parte del proyecto.

- **Desarrollo**: consola muestra todos los niveles.
- **Producción** (`NODE_ENV=production`): consola muestra solo desde `info`.
- **Persistencia**: `error` y `fatal` se guardan en `logs/errors-FECHA.log`, con rotación diaria y retención de 14 días. La carpeta `logs/` está en `.gitignore`.

Endpoint de diagnóstico (documentado en Swagger bajo la tag **Logger**, no es funcionalidad de negocio):

\`\`\`
GET /api/loggerTest
\`\`\`

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