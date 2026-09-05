# ShipNow API — Módulo 8: Performance, escalabilidad y Docker

API de gestión de envíos (**ShipNow**) construida con Node.js, Express y MongoDB (Mongoose), siguiendo una arquitectura por capas: **rutas → servicios → modelos**.

Este módulo prepara el proyecto para un entorno más cercano a producción: paginación en los listados principales, configuración por variables de entorno con validación al arranque, un endpoint de health check, un criterio explícito sobre la exposición de endpoints internos según el entorno, y contenerización completa con Docker.

## Variables de entorno

El proyecto usa un archivo `.env` en la raíz (no se sube al repo). Como plantilla, usá `.env.example`:

| Variable | Descripción | Ejemplo |
|---|---|---|
| `PORT` | Puerto en el que escucha la API | `3000` |
| `MONGO_URL` | URI de MongoDB para desarrollo/producción | `mongodb://localhost:27017/shipnow` |
| `MONGO_URL_TEST` | URI de MongoDB exclusiva para testing | `mongodb://localhost:27017/shipnow-test` |
| `NODE_ENV` | Entorno de ejecución | `development` / `test` / `production` |
| `LOG_LEVEL` | Nivel mínimo de log en consola (informativo, el logger ya diferencia por entorno) | `debug` |
| `BASIC_AUTH_USER` | Usuario para proteger `/api/docs` y endpoints internos en producción | `dev` |
| `BASIC_AUTH_PASSWORD` | Contraseña para lo mismo | `shipnow123` (cambiar en un despliegue real) |

El proyecto **no usa JWT** (no tiene autenticación de usuarios), por lo que no hay variable de secreto de JWT. Tampoco depende de URLs de servicios externos.

### Validación de variables críticas al iniciar

`src/config/env.js` valida que `PORT`, `MONGO_URL` y `NODE_ENV` estén presentes **antes** de que la app arranque. Si falta alguna, el proceso termina inmediatamente con un mensaje claro:

\`\`\`
[FATAL] Faltan variables de entorno obligatorias: MONGO_URL
Revisá tu archivo .env (podés basarte en .env.example)
\`\`\`

La app **nunca** arranca de forma incompleta o con configuración parcial.

## Instalación y ejecución local

\`\`\`bash
npm install
\`\`\`

Creá tu `.env` copiando `.env.example` y ajustando los valores si hace falta.

\`\`\`bash
npm run dev
\`\`\`

Salida esperada:
\`\`\`
2026-09-05 19:09:09 [info]    Conexión a MongoDB establecida
2026-09-05 19:09:09 [info]    Servidor ShipNow escuchando en el puerto 3000 (entorno: development)
\`\`\`

## Testing

\`\`\`bash
npm test
\`\`\`

Corre `cross-env NODE_ENV=test mocha --exit tests/setup.js tests/**/*.test.js` contra una base de datos de testing completamente separada (`MONGO_URL_TEST`), que se limpia antes de cada test. 35 tests cubriendo usuarios, pedidos, entregas, mocks, logger, Swagger, carga de archivos, paginación y rutas inexistentes.

## Documentación interactiva (Swagger)

\`\`\`
http://localhost:3000/api/docs
\`\`\`

Protegida **siempre**, en cualquier entorno, con autenticación básica (`BASIC_AUTH_USER` / `BASIC_AUTH_PASSWORD`).

### Módulos documentados (tags)

| Tag | Contenido |
|---|---|
| **Users** | CRUD de usuarios, listado paginado, carga de documentos |
| **Orders** | CRUD de pedidos, listado paginado, actualización de estado, carga de comprobante |
| **Deliveries** | CRUD de entregas, listado paginado, actualización de estado, carga de comprobante |
| **Mocks** | Generación de datos simulados y carga real en MongoDB |
| **Logger** | Endpoint de diagnóstico del sistema de logging (no es funcionalidad de negocio) |

### Schemas reutilizables

Definidos en `src/docs/schemas.yaml`: `User`, `Order`, `OrderItem`, `Delivery`, `DocumentMeta`, `ReceiptMeta`, `ErrorResponse`, `SuccessResponse`.

## Performance

### Paginación en listados

`GET /api/users`, `GET /api/orders` y `GET /api/deliveries` ya no devuelven la colección completa: aceptan los query params `page` y `limit`, con un **límite máximo de 50** resultados por página (aunque se pida más), evitando respuestas de tamaño descontrolado.

Ejemplo:
\`\`\`
GET /api/orders?page=1&limit=10
\`\`\`
\`\`\`json
{
  "items": [ ... ],
  "page": 1,
  "limit": 10,
  "total": 41,
  "totalPages": 5
}
\`\`\`

### Carga de archivos

Ya limitada desde el Módulo 7: tamaño máximo 5MB, tipos restringidos (JPG, PNG, PDF), errores controlados, y los archivos se guardan fuera del repositorio (`uploads/`, en `.gitignore`), nunca en la base de datos ni usados como almacenamiento permanente indiscriminado.

### Otras prácticas aplicadas

- Consultas a Mongo siempre acotadas (`.skip()` + `.limit()` en los listados, `findById` en el resto — nunca un `find()` sin filtro que devuelva todo).
- El logger diferencia niveles por entorno (`debug` solo en desarrollo), evitando logs excesivos en producción.
- Las operaciones de carga de archivos usan `diskStorage` de Multer, que es asíncrono por naturaleza (no bloquea el Event Loop).

## Preparación para producción

### Health check

\`\`\`
GET /api/health
\`\`\`
\`\`\`json
{
  "status": "ok",
  "environment": "development",
  "uptime": 19,
  "timestamp": "2026-09-05T21:14:38.240Z"
}
\`\`\`

No expone URIs, credenciales, versiones de dependencias ni ningún dato sensible — solo estado general, entorno, tiempo activo y timestamp. Es una ruta pública, sin autenticación, para que cualquier orquestador (Docker, balanceador, monitor externo) pueda verificarla sin fricción.

### Criterio sobre endpoints internos

| Endpoint | Desarrollo | Producción |
|---|---|---|
| `/api/docs` | Protegido con `basicAuth` | Protegido con `basicAuth` (igual) |
| `/api/loggerTest` | Libre, sin restricción | Protegido con `basicAuth` |
| `/api/mocks/*` | Libre, sin restricción | Protegido con `basicAuth` |

**Criterio aplicado:** los endpoints internos (mocks, prueba de logger, documentación) no se bloquean por completo en producción porque siguen siendo útiles para diagnóstico y soporte, pero se les exige autenticación básica para que no queden expuestos públicamente sin control. El resto de la API (`/api/users`, `/api/orders`, `/api/deliveries`, `/api/health`) no cambia su comportamiento entre entornos.

## Docker

### Archivos

- **`Dockerfile`**: imagen base `node:20-alpine`, copia el proyecto, instala solo dependencias de producción (`npm install --omit=dev`), expone el puerto `3000` y ejecuta `node src/server.js`.
- **`.dockerignore`**: excluye `node_modules`, `.env`, `.git`, `logs`, `uploads`, `coverage`, `tests` y archivos temporales — la imagen nunca incluye credenciales, datos generados en runtime ni archivos innecesarios.

### Construir la imagen

\`\`\`bash
docker build -t shipnow-api .
\`\`\`

### Ejecutar el contenedor

\`\`\`bash
docker run -p 3000:3000 --env-file .env -e MONGO_URL=mongodb://host.docker.internal:27017/shipnow shipnow-api
\`\`\`

**Nota:** si MongoDB corre en tu máquina host (fuera de Docker, como servicio de Windows/Mac/Linux), el contenedor no puede usar `localhost` para llegar a él — hay que usar `host.docker.internal`, que apunta a la máquina anfitriona desde dentro del contenedor. Por eso se sobreescribe `MONGO_URL` en el comando de arriba, aunque el `.env` tenga `localhost` para uso local normal.

### Verificar que el contenedor funciona

Con el contenedor corriendo, probar:

\`\`\`
GET http://localhost:3000/api/health
GET http://localhost:3000/api/docs        (pide basicAuth)
GET http://localhost:3000/api/orders
\`\`\`

Los tres deberían responder igual que en ejecución local.

### Puerto usado

La API queda disponible en el puerto **3000** tanto en ejecución local como dentro del contenedor.

## Qué no se sube al repositorio

- `node_modules/` — dependencias, se reinstalan con `npm install`.
- `.env` — variables de entorno reales, incluye la contraseña de `basicAuth`. Se sube solo `.env.example` como plantilla sin valores sensibles reales.
- `logs/` — archivos de log generados por Winston en runtime, con rotación diaria. No aportan valor en el repositorio y pueden crecer sin límite si no se controla su ciclo de vida.
- `uploads/` — archivos subidos por los usuarios (documentos, comprobantes). Son datos generados en runtime, no código fuente; además podrían contener información sensible de usuarios reales en un entorno productivo.

## Manejo de errores

### Estructura de respuesta uniforme

\`\`\`json
{
  "status": "error",
  "error": "CÓDIGO_DEL_ERROR",
  "message": "Descripción legible del error"
}
\`\`\`

### Cómo funciona internamente

1. Los `services` detectan errores de negocio y lanzan `throw new customError(CÓDIGO)`.
2. Las `routes` están envueltas en `asyncHandler`, que deriva cualquier error con `next(error)`.
3. Un middleware catch-all convierte cualquier ruta inexistente en `ROUTE_NOT_FOUND`.
4. El middleware global `errorHandler` arma la respuesta HTTP final y registra el evento con Winston (`warning` para errores esperados, `error` para no controlados).

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
| `INVALID_MOCK_QUANTITY` | 400 | Cantidad de mocks inválida |
| `MOCK_GENERATION_FAILED` | 500 | Falla al generar o insertar datos de prueba |
| `ROUTE_NOT_FOUND` | 404 | La ruta solicitada no existe |
| `FILE_REQUIRED` | 400 | No se envió ningún archivo |
| `INVALID_FILE_TYPE` | 400 | Tipo de archivo no permitido |
| `FILE_TOO_LARGE` | 400 | El archivo supera el tamaño máximo |
| `INVALID_DOCUMENT_TYPE` | 400 | Tipo de documento inválido |
| `FILE_UPLOAD_ERROR` | 500 | Error al guardar el archivo |
| `VALIDATION_ERROR` | 400 | Faltan datos obligatorios o el formato es inválido |
| `FORBIDDEN` | 403 | Acción no permitida para el rol del usuario |
| `DATABASE_ERROR` | 500 | Error al interactuar con la base de datos |
| `INTERNAL_SERVER_ERROR` | 500 | Error inesperado no controlado |

## Logging con Winston

Winston con `winston-daily-rotate-file` (`src/utils/logger.js`), 6 niveles: `debug`, `http`, `info`, `warning`, `error`, `fatal`. Integrado en `server.js`, `errorHandler.js` y todos los `services`.

- **Desarrollo**: consola muestra todos los niveles.
- **Producción**: consola muestra solo desde `info`.
- **Persistencia**: `error` y `fatal` en `logs/errors-FECHA.log`, rotación diaria, retención 14 días. Carpeta ignorada por Git.

## Módulo de mocking (`/api/mocks`)

| Método | Endpoint | Query/Body | Descripción |
|---|---|---|---|
| GET | `/api/mocks/mockingusers` | `count` (opcional) | Genera usuarios simulados (no persiste) |
| GET | `/api/mocks/mockingorders` | `count` (opcional) | Genera pedidos simulados (no persiste) |
| GET | `/api/mocks/mockingdeliveries` | `count` (opcional) | Genera entregas simuladas (no persiste) |
| POST | `/api/mocks/generateData` | `{ "users": 10, "orders": 15, "deliveries": 15 }` | Inserta datos reales en MongoDB respetando relaciones |

En producción, estos endpoints requieren `basicAuth` (ver sección "Criterio sobre endpoints internos").

## Carga de archivos (Multer)

| Método | Endpoint | Campo de archivo | Descripción |
|---|---|---|---|
| POST | `/api/users/{uid}/documents` | `document` | Sube un documento (DNI, licencia, etc.) y lo asocia al usuario |
| POST | `/api/orders/{oid}/receipt` | `receipt` | Sube un comprobante y lo asocia al pedido |
| POST | `/api/deliveries/{did}/receipt` | `receipt` | Sube un comprobante y lo asocia a la entrega |

Tipos permitidos: JPG, PNG, PDF. Tamaño máximo: 5MB. Los archivos se guardan en `uploads/`, organizados por subcarpeta, y solo sus metadatos (nombre original, nombre generado, ruta, tipo, tamaño, fecha) quedan en la base de datos.

## Cómo probar casos inválidos y nuevos comportamientos en Postman

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

### 3. Ruta inexistente → 404

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

### 4. Mocks — cantidad inválida → 400

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

### 5. Carga de documento sin archivo → 400

\`\`\`
POST http://localhost:3000/api/users/{uid}/documents
Body: form-data, solo con "documentType", sin adjuntar archivo
\`\`\`
\`\`\`json
{
  "status": "error",
  "error": "FILE_REQUIRED",
  "message": "Debe adjuntar un archivo (campo \"document\")"
}
\`\`\`

### 6. Paginación — listado con límite personalizado

\`\`\`
GET http://localhost:3000/api/orders?page=1&limit=5
\`\`\`
\`\`\`json
{
  "items": [ ],
  "page": 1,
  "limit": 5,
  "total": 41,
  "totalPages": 9
}
\`\`\`

### 7. Health check → 200

\`\`\`
GET http://localhost:3000/api/health
\`\`\`
\`\`\`json
{
  "status": "ok",
  "environment": "development",
  "uptime": 19,
  "timestamp": "2026-09-05T21:14:38.240Z"
}
\`\`\`

### 8. Endpoint interno sin credenciales en producción → 401

Con `NODE_ENV=production`:
\`\`\`
GET http://localhost:3000/api/mocks/mockingusers?count=3
\`\`\`
\`\`\`json
{
  "status": "error",
  "error": "UNAUTHORIZED",
  "message": "Credenciales requeridas para acceder a la documentación"
}
\`\`\`