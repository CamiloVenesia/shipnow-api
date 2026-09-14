# ShipNow API

API backend de gestión logística construida con Node.js, Express y MongoDB. Gestiona usuarios, pedidos, entregas, carga de documentos y comprobantes, con generación de datos de prueba, documentación interactiva, testing automatizado y despliegue containerizado.

Proyecto desarrollado como entrega final del curso Back-End III de Coderhouse, integrando todo lo trabajado en las pre-entregas: arquitectura por capas, manejo centralizado de errores, logging profesional, documentación con Swagger, testing funcional, carga de archivos, y preparación para producción con Docker.

## Tabla de contenidos

- [Tecnologías](#tecnologías)
- [Arquitectura](#arquitectura)
- [Variables de entorno](#variables-de-entorno)
- [Instalación](#instalación)
- [Ejecución local](#ejecución-local)
- [Docker](#docker)
- [Testing](#testing)
- [Documentación interactiva (Swagger)](#documentación-interactiva-swagger)
- [Endpoints principales](#endpoints-principales)
- [Manejo de errores](#manejo-de-errores)
- [Logging](#logging)
- [Carga de archivos (Multer)](#carga-de-archivos-multer)
- [Qué no se sube al repositorio](#qué-no-se-sube-al-repositorio)
- [Troubleshooting](#troubleshooting)

## Tecnologías

- **Node.js** + **Express** — servidor y enrutamiento
- **MongoDB** + **Mongoose** — base de datos y modelado
- **Winston** + **winston-daily-rotate-file** — logging centralizado con rotación diaria
- **Swagger** (`swagger-jsdoc` + `swagger-ui-express`) — documentación interactiva
- **Mocha** + **Chai** + **Supertest** — testing funcional
- **Multer** — carga de archivos (`multipart/form-data`)
- **@faker-js/faker** — generación de datos simulados
- **Docker** + **Docker Compose** — containerización
- **dotenv** + **cross-env** — manejo de variables de entorno multiplataforma

## Arquitectura

El proyecto sigue una arquitectura por capas estricta:

\`\`\`
Router → Controller → Service → Repository → Model
\`\`\`

- **`routes/`**: define los endpoints HTTP y los conecta con su controller correspondiente. No contiene lógica propia.
- **`controllers/`**: recibe `req`/`res`, delega toda la lógica al service correspondiente, y arma la respuesta HTTP (status code + body).
- **`services/`**: contiene toda la lógica de negocio y las validaciones. Lanza `customError` ante cualquier caso inválido del dominio. Nunca accede a Mongoose directamente — siempre pasa por un repository.
- **`repositories/`**: única capa que interactúa con Mongoose (`Model.find()`, `Model.create()`, `Model.findByIdAndUpdate()`, etc.). Sin lógica de negocio ni validaciones.
- **`models/`**: schemas de Mongoose (`User`, `Order`, `Delivery`, `Product`).

Esta separación aplica de forma consistente a los 5 dominios del proyecto: `users`, `orders`, `deliveries`, `mocks`, y la carga de archivos (integrada dentro de los controllers/services de `users`, `orders` y `deliveries`).

### Estructura de carpetas

\`\`\`
src/
├── config/              # env.js (variables de entorno + validación al arranque), multer.config.js
├── constants/            # error.constants.js (ERROR_CODES, ERROR_DICTIONARY)
├── controllers/           # user, order, delivery, mocks
├── docs/                   # archivos YAML de Swagger (users, orders, deliveries, mocks, logger, health, uploads, schemas) + swagger.config.js
├── middleware/              # errorHandler, basicAuth, handleUpload
├── models/                   # User, Order, Delivery, Product
├── repositories/               # user, order, delivery, mocks
├── routes/                      # users, orders, deliveries, mocks, logger, health
├── services/                     # user, order, delivery, mocks
├── utils/                         # customError, asyncHandler, logger
├── app.js                          # configuración de Express (sin levantar servidor, usado por tests)
└── server.js                        # conecta a MongoDB y levanta el servidor

tests/
├── setup.js               # conecta a la DB de testing, limpia colecciones antes de cada test
├── users.test.js
├── orders.test.js
├── mocks.test.js
├── logger.test.js
├── docs.test.js
├── routes.test.js
└── uploads.test.js

Dockerfile
docker-compose.yml
.dockerignore
.env.example
\`\`\`

## Variables de entorno

El proyecto usa un archivo `.env` en la raíz (no se sube al repositorio). Usá `.env.example` como plantilla, copiándolo y completando los valores:

\`\`\`bash
cp .env.example .env
\`\`\`

| Variable | Descripción | Ejemplo |
|---|---|---|
| `PORT` | Puerto en el que escucha la API | `3000` |
| `MONGO_URL` | URI de MongoDB para desarrollo/producción | `mongodb://localhost:27017/shipnow` |
| `MONGO_URL_TEST` | URI de MongoDB exclusiva para testing (base separada de la de desarrollo) | `mongodb://localhost:27017/shipnow-test` |
| `NODE_ENV` | Entorno de ejecución | `development` / `test` / `production` |
| `LOG_LEVEL` | Nivel mínimo de log informativo | `debug` |
| `BASIC_AUTH_USER` | Usuario para acceder a `/api/docs` y a los endpoints internos en producción | `dev` |
| `BASIC_AUTH_PASSWORD` | Contraseña para lo mismo | definir un valor propio, no usar el default en un despliegue real |

El proyecto no implementa autenticación JWT ni depende de servicios externos, por lo que no existen variables adicionales de secretos ni URLs de terceros.

### Validación de variables críticas al iniciar

`src/config/env.js` valida que `PORT`, `MONGO_URL` y `NODE_ENV` estén presentes **antes** de que la aplicación arranque. Si falta alguna, el proceso termina de inmediato con un mensaje claro, en lugar de levantar el servidor con una configuración incompleta:

\`\`\`
[FATAL] Faltan variables de entorno obligatorias: MONGO_URL
Revisá tu archivo .env (podés basarte en .env.example)
\`\`\`

## Instalación

\`\`\`bash
npm install
\`\`\`

Creá tu `.env` a partir de `.env.example` y ajustá los valores si hace falta (por ejemplo, si tu MongoDB local corre en otro puerto).

## Ejecución local

Asegurate de tener MongoDB corriendo localmente (como servicio del sistema operativo, o vía Docker — ver sección siguiente).

\`\`\`bash
npm run dev
\`\`\`

Salida esperada:

\`\`\`
2026-09-13 10:00:00 [info]    Conexión a MongoDB establecida
2026-09-13 10:00:00 [info]    Servidor ShipNow escuchando en el puerto 3000 (entorno: development)
\`\`\`

Para producción, sin `nodemon`:

\`\`\`bash
npm start
\`\`\`

## Docker

### Levantar todo con Docker Compose (API + MongoDB)

Esta es la forma recomendada de correr el proyecto completo sin depender de una instalación local de MongoDB.

\`\`\`bash
docker compose up
\`\`\`

Esto levanta dos servicios definidos en `docker-compose.yml`:

- **`mongo`**: instancia oficial de MongoDB 7, con un `healthcheck` que ejecuta `mongosh --eval "db.adminCommand('ping')"` cada 10 segundos. Los datos se persisten en un volumen (`mongo_data`), por lo que no se pierden al reiniciar el contenedor.
- **`api`**: se construye desde el `Dockerfile` (imagen multi-stage, con un usuario no-root por seguridad) y **espera a que `mongo` esté healthy** antes de arrancar, gracias a `depends_on: condition: service_healthy`. Esto evita el error típico de que la API intente conectar antes de que la base esté lista.

Los dos servicios se comunican dentro de la red interna de Docker Compose usando su nombre de servicio (`mongo`), no `localhost`.

Para pararlo:

\`\`\`bash
docker compose down
\`\`\`

Para pararlo y borrar también los datos persistidos de Mongo (reinicio completamente limpio):

\`\`\`bash
docker compose down -v
\`\`\`

### Construir y ejecutar solo la imagen de la API (sin Compose)

Si preferís usar tu propia instancia de MongoDB (local o remota) en lugar de la de Compose:

\`\`\`bash
docker build -t shipnow-api .
docker run -p 3000:3000 --env-file .env -e MONGO_URL=mongodb://host.docker.internal:27017/shipnow shipnow-api
\`\`\`

**Nota:** si tu MongoDB corre en la máquina host (fuera de Docker), el contenedor no puede usar `localhost` para llegar a él — hay que usar `host.docker.internal`, que apunta a la máquina anfitriona desde dentro del contenedor. Por eso se sobreescribe `MONGO_URL` en el comando de arriba, aunque tu `.env` tenga `localhost` para el uso local normal.

### Puerto

La API queda disponible en el puerto **3000**, tanto en ejecución local como dentro de cualquiera de los dos modos de Docker.

## Testing

\`\`\`bash
npm test
\`\`\`

Este comando ejecuta:

\`\`\`bash
cross-env NODE_ENV=test mocha --exit tests/setup.js tests/**/*.test.js
\`\`\`

### Entorno de testing separado

Los tests corren contra `MONGO_URL_TEST`, una base de datos **completamente distinta** a la de desarrollo. `tests/setup.js` se conecta a esa base y limpia todas las colecciones **antes de cada test individual**, de modo que ningún test depende del estado dejado por otro ni de datos cargados manualmente. Al finalizar toda la suite, se limpia la base y se cierra la conexión.

### Qué cubre la suite

- CRUD y validaciones de usuarios, pedidos y entregas
- Paginación de los listados principales (`page`, `limit`, límite máximo)
- Reglas de negocio: estado inválido, pedido ya entregado, rol no permitido para crear pedidos, repartidor inválido
- Generación de datos simulados (mocks) y validación de cantidades inválidas (texto, negativos, cero)
- Carga de archivos: documento de usuario y comprobantes de pedido/entrega (caso exitoso, archivo faltante, tipo de documento inválido, tipo de archivo inválido, entidad inexistente)
- Endpoint de diagnóstico del logger
- Acceso a Swagger (con y sin credenciales)
- Ruta inexistente (404 con formato de error estándar)

Cada test valida no solo el status HTTP, sino también la estructura y las propiedades relevantes del body de la respuesta.

## Documentación interactiva (Swagger)

\`\`\`
http://localhost:3000/api/docs
\`\`\`

Protegida con autenticación básica (usuario/contraseña definidos en `BASIC_AUTH_USER` / `BASIC_AUTH_PASSWORD` del `.env`).

### Cómo probar los endpoints desde Swagger

1. Entrá a `/api/docs` e ingresá las credenciales.
2. Elegí cualquier endpoint y hacé clic en **"Try it out"**.
3. Completá los parámetros o el body (ya vienen con valores de ejemplo precargados).
4. Hacé clic en **"Execute"** para mandar la request real contra el servidor y ver la respuesta.

### Tags documentadas

| Tag | Contenido |
|---|---|
| **Users** | CRUD de usuarios, listado paginado, carga de documentos |
| **Orders** | CRUD de pedidos, listado paginado, actualización de estado, carga de comprobante |
| **Deliveries** | CRUD de entregas, listado paginado, actualización de estado, carga de comprobante |
| **Mocks** | Generación de datos simulados y carga real en MongoDB |
| **Logger** | Endpoint de diagnóstico del sistema de logging (no es funcionalidad de negocio) |
| **Health** | Endpoint de verificación de estado de la API |

### Schemas reutilizables

`User`, `Order`, `OrderItem`, `Delivery`, `DocumentMeta`, `ReceiptMeta`, `ErrorResponse`, `SuccessResponse` — definidos en `src/docs/schemas.yaml` y reutilizados en todos los endpoints mediante `$ref`.

## Endpoints principales

Referencia rápida — ver Swagger (`/api/docs`) para el detalle completo de cada uno (parámetros, body esperado, respuestas y errores posibles).

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/api/health` | Health check: estado, entorno, uptime, timestamp |
| GET | `/api/users` | Listar usuarios (paginado: `?page=1&limit=10`) |
| POST | `/api/users` | Crear usuario |
| GET | `/api/users/:uid` | Obtener un usuario por ID |
| DELETE | `/api/users/:uid` | Eliminar un usuario |
| POST | `/api/users/:uid/documents` | Cargar documento de usuario (`multipart/form-data`) |
| GET | `/api/orders` | Listar pedidos (paginado) |
| POST | `/api/orders` | Crear pedido |
| GET | `/api/orders/:oid` | Obtener un pedido por ID |
| PATCH | `/api/orders/:oid/status` | Actualizar el estado de un pedido |
| DELETE | `/api/orders/:oid` | Eliminar un pedido |
| POST | `/api/orders/:oid/receipt` | Cargar comprobante de pedido (`multipart/form-data`) |
| GET | `/api/deliveries` | Listar entregas (paginado) |
| POST | `/api/deliveries` | Crear entrega |
| GET | `/api/deliveries/:did` | Obtener una entrega por ID |
| PATCH | `/api/deliveries/:did/status` | Actualizar el estado de una entrega |
| DELETE | `/api/deliveries/:did` | Eliminar una entrega |
| POST | `/api/deliveries/:did/receipt` | Cargar comprobante de entrega (`multipart/form-data`) |
| GET | `/api/mocks/mockingusers` | Generar usuarios simulados (no persiste) |
| GET | `/api/mocks/mockingorders` | Generar pedidos simulados (no persiste) |
| GET | `/api/mocks/mockingdeliveries` | Generar entregas simuladas (no persiste) |
| POST | `/api/mocks/generateData` | Generar y persistir datos de prueba en MongoDB |
| GET | `/api/loggerTest` | Diagnóstico del logger: dispara un log de cada nivel |
| GET | `/api/docs` | Documentación Swagger (siempre protegida) |

`/api/mocks/*` y `/api/loggerTest` quedan protegidos con `basicAuth` cuando `NODE_ENV=production`; en desarrollo permanecen libres. `/api/docs` está protegido en cualquier entorno.

## Manejo de errores

### Estructura de respuesta uniforme

Toda respuesta de error de la API, sin importar el endpoint, tiene siempre esta forma:

\`\`\`json
{
  "status": "error",
  "error": "CÓDIGO_DEL_ERROR",
  "message": "Descripción legible del error"
}
\`\`\`

### Cómo funciona internamente

1. Los `services` detectan errores de negocio y lanzan `throw new customError(CÓDIGO)`.
2. Las `routes`, envueltas en `asyncHandler`, derivan cualquier error con `next(error)` — no hay `try/catch` dispersos.
3. Un middleware catch-all convierte cualquier ruta inexistente en un error `ROUTE_NOT_FOUND`.
4. El middleware global `errorHandler` arma la respuesta HTTP final según el diccionario de errores, y registra el evento con Winston (`warning` para errores esperados, `error` para no controlados).

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
| `FILE_REQUIRED` | 400 | No se envió ningún archivo |
| `INVALID_FILE_TYPE` | 400 | Tipo de archivo no permitido |
| `FILE_TOO_LARGE` | 400 | El archivo supera el tamaño máximo (5MB) |
| `INVALID_DOCUMENT_TYPE` | 400 | Tipo de documento inválido |
| `FILE_UPLOAD_ERROR` | 500 | Error al guardar el archivo en el servidor |
| `VALIDATION_ERROR` | 400 | Faltan datos obligatorios o el formato es inválido |
| `FORBIDDEN` | 403 | Acción no permitida para el rol del usuario |
| `UNAUTHORIZED` | 401 | Credenciales faltantes o inválidas (Swagger / endpoints internos) |
| `DATABASE_ERROR` | 500 | Error al interactuar con la base de datos |
| `INTERNAL_SERVER_ERROR` | 500 | Error inesperado no controlado |

### Ejemplos rápidos

**Recurso inexistente → 404**
\`\`\`
GET /api/orders/64b000000000000000000000
\`\`\`
\`\`\`json
{ "status": "error", "error": "ORDER_NOT_FOUND", "message": "Pedido no encontrado" }
\`\`\`

**Datos obligatorios faltantes → 400**
\`\`\`
POST /api/orders
{ "customer": "64b000000000000000000000" }
\`\`\`
\`\`\`json
{ "status": "error", "error": "VALIDATION_ERROR", "message": "Faltan los items del pedido" }
\`\`\`

**Ruta inexistente → 404**
\`\`\`
GET /api/blabla
\`\`\`
\`\`\`json
{ "status": "error", "error": "ROUTE_NOT_FOUND", "message": "La ruta GET /api/blabla no existe" }
\`\`\`

## Logging

Winston, con `winston-daily-rotate-file`, configurado en `src/utils/logger.js`. Niveles (de mayor a menor severidad): `fatal`, `error`, `warning`, `info`, `http`, `debug`.

- **Desarrollo**: la consola muestra todos los niveles, con colores.
- **Producción**: la salida por consola queda **completamente desactivada**; toda la actividad se registra únicamente en archivo.
- **`logs/combined-FECHA.log`**: toda la actividad desde `info` en adelante (arranque del servidor, conexión a Mongo, operaciones exitosas, etc.).
- **`logs/error-FECHA.log`**: exclusivamente `error` y `fatal`.
- Rotación diaria, retención de 14 días. La carpeta `logs/` está en `.gitignore` y nunca se sube al repositorio.

Endpoint de diagnóstico (no es funcionalidad de negocio, documentado en Swagger bajo la tag **Logger**):

\`\`\`
GET /api/loggerTest
\`\`\`

## Carga de archivos (Multer)

Configuración centralizada en `src/config/multer.config.js`, separada de las rutas:

- **Tipos permitidos**: JPG, PNG, PDF.
- **Tamaño máximo**: 5MB por archivo.
- **Nombrado**: cada archivo se renombra con un sufijo único (`timestamp-random.ext`), conservando el nombre original solo como metadato.
- **Almacenamiento**: `uploads/`, organizado en subcarpetas por tipo (`users/documents`, `orders/receipts`, `deliveries/receipts`). La carpeta está en `.gitignore` y se mantiene saneada, sin archivos de prueba residuales.
- **Metadatos en base de datos**: nunca se guarda el archivo binario en MongoDB — solo `originalName`, `generatedName`, `path`, `mimetype`, `size`, `uploadedAt` (y `documentType` para documentos de usuario).
- **Errores de Multer** (tamaño excedido, tipo no permitido) se traducen al formato de error centralizado del proyecto mediante `src/middleware/handleUpload.js`.

## Qué no se sube al repositorio

- `node_modules/` — se reinstala con `npm install`
- `.env` (real, con credenciales) — se sube solo `.env.example` como plantilla
- `logs/` — generados en runtime por Winston
- `uploads/` — archivos cargados por los usuarios, generados en runtime
- `coverage/`, archivos temporales, `.git` interno de Docker

## Troubleshooting

**El servidor no arranca y muestra `[FATAL] Faltan variables de entorno obligatorias`**
Falta crear el `.env`, o falta alguna de las variables `PORT`, `MONGO_URL`, `NODE_ENV`. Copiá `.env.example` a `.env` y completalo.

**`docker compose up` falla con `EACCES: permission denied, mkdir 'logs/'`**
El `Dockerfile` crea la carpeta `logs/` y ajusta sus permisos antes de cambiar al usuario no-root; si esto aparece, verificá que el `Dockerfile` no haya sido modificado y reconstruí con `docker compose up --build`.

**`failed to connect to the docker API`**
Docker Desktop no está corriendo. Abrilo y esperá a que el motor diga "Engine running" antes de volver a intentar.

**Los tests fallan por conexión a MongoDB**
Confirmá que `MONGO_URL_TEST` en tu `.env` apunte a una instancia de Mongo accesible (local o vía Docker) y que el servicio esté corriendo.