# ShipNow API — Módulo 7: Carga de archivos, documentos y comprobantes

API de gestión de envíos (**ShipNow**) construida con Node.js, Express y MongoDB (Mongoose), siguiendo una arquitectura por capas: **rutas → servicios → modelos**.

Este módulo incorpora **carga de archivos con Multer**: documentos de usuario (DNI, licencia, comprobante de domicilio) y comprobantes asociados a pedidos y entregas. Los archivos se guardan en el servidor organizados por carpetas, y en la base de datos solo se persisten sus **metadatos** (nunca el archivo en sí). Todo el flujo está integrado con el sistema de errores, logging, Swagger y testing de módulos anteriores.

## Instalación

\`\`\`bash
npm install
\`\`\`

El proyecto no usa variables de entorno para la configuración de base/puerto en desarrollo; están definidas directamente en `src/server.js`:

- Puerto: `3000`
- MongoDB (desarrollo): `mongodb://localhost:27017/shipnow`
- MongoDB (testing): `mongodb://localhost:27017/shipnow-test` (definida en `tests/setup.js`)

Asegurate de tener el servicio de MongoDB corriendo localmente antes de levantar el servidor o correr los tests.

## Levantar el servidor

\`\`\`bash
npm run dev
\`\`\`

Si todo está bien configurado, la terminal debería mostrar:

\`\`\`
2026-08-10 19:09:09 [info]    Conexión a MongoDB establecida
2026-08-10 19:09:09 [info]    Servidor ShipNow escuchando en el puerto 3000
\`\`\`

## Carga de archivos (Multer)

### Configuración centralizada

Toda la configuración de Multer vive en `src/config/multer.config.js`, completamente separada de las rutas. Define:

- **Almacenamiento**: `diskStorage`, guardando cada archivo en una subcarpeta según su tipo.
- **Nombrado**: cada archivo se renombra con un sufijo único (`timestamp-random.ext`) para evitar colisiones, conservando el nombre original solo como metadato.
- **Tipos permitidos**: `image/jpeg`, `image/png`, `application/pdf`.
- **Tamaño máximo**: 5 MB por archivo.
- **Manejo de errores**: los errores propios de Multer (tamaño excedido, etc.) y los del filtro de tipos se traducen al formato de error centralizado del proyecto mediante `src/middleware/handleUpload.js`.

### Estructura de carpetas

\`\`\`
uploads/
├── users/
│   └── documents/       # Documentos de usuario (DNI, licencia, etc.)
├── orders/
│   └── receipts/        # Comprobantes asociados a pedidos
└── deliveries/
    └── receipts/        # Comprobantes asociados a entregas
\`\`\`

La carpeta `uploads/` está en `.gitignore` — ningún archivo subido se sube al repositorio. Las subcarpetas se crean automáticamente la primera vez que se sube un archivo de ese tipo (no hace falta crearlas a mano).

### Endpoints

| Método | Endpoint | Campo de archivo | Descripción |
|---|---|---|---|
| POST | `/api/users/{uid}/documents` | `document` | Sube un documento y lo asocia al usuario. Campo adicional opcional: `documentType` (`dni`, `licencia_conducir`, `comprobante_domicilio`, `otro`) |
| POST | `/api/orders/{oid}/receipt` | `receipt` | Sube un comprobante y lo asocia al pedido |
| POST | `/api/deliveries/{did}/receipt` | `receipt` | Sube un comprobante y lo asocia a la entrega |

### Metadatos guardados en la base

En ningún caso se guarda el archivo binario en MongoDB — solo sus metadatos:

\`\`\`json
{
  "documentType": "dni",
  "originalName": "dni.pdf",
  "generatedName": "1725390000000-123456789.pdf",
  "path": "uploads/users/documents/1725390000000-123456789.pdf",
  "mimetype": "application/pdf",
  "size": 204800,
  "uploadedAt": "2026-09-03T21:43:49.057Z"
}
\`\`\`

(`documentType` solo aplica a documentos de usuario; los comprobantes de pedidos/entregas usan la misma estructura sin ese campo).

### Errores específicos de archivos

| Código | HTTP Status | Descripción |
|---|---|---|
| `FILE_REQUIRED` | 400 | No se envió ningún archivo |
| `INVALID_FILE_TYPE` | 400 | El tipo de archivo no está permitido (solo JPG, PNG, PDF) |
| `FILE_TOO_LARGE` | 400 | El archivo supera los 5MB |
| `INVALID_DOCUMENT_TYPE` | 400 | El `documentType` enviado no es uno de los valores permitidos |
| `FILE_UPLOAD_ERROR` | 500 | Error al guardar el archivo en el servidor |

Todos responden con el mismo formato uniforme del resto de la API (`status`, `error`, `message`), y el logger registra cada evento relevante (`logger.info` en cargas exitosas, `logger.warning` en cargas rechazadas por validación).

### Cómo probar en Postman

Para probar estos endpoints en Postman, hay que usar **Body → form-data** (no `raw`/JSON), con:
- Una clave de tipo **File** llamada `document` (o `receipt` según el endpoint), seleccionando un archivo real desde tu compu.
- Para el endpoint de usuarios, una clave adicional de tipo **Text** llamada `documentType` (opcional).

## Documentación interactiva (Swagger)

### Acceso

\`\`\`
http://localhost:3000/api/docs
\`\`\`

Protegida con autenticación básica:

- **Usuario:** `dev`
- **Contraseña:** `shipnow123`

### Módulos documentados (tags)

| Tag | Contenido |
|---|---|
| **Users** | CRUD de usuarios + carga de documentos |
| **Orders** | CRUD de pedidos, actualización de estado y carga de comprobante |
| **Deliveries** | CRUD de entregas, actualización de estado y carga de comprobante |
| **Mocks** | Generación de datos simulados y carga real en MongoDB |
| **Logger** | Endpoint de diagnóstico del sistema de logging (no es funcionalidad de negocio) |

Los 3 endpoints de carga de archivos están documentados como `multipart/form-data`, indicando el nombre del campo de archivo, los campos adicionales requeridos, los tipos de documento permitidos (cuando aplica), la respuesta exitosa y los posibles errores.

### Schemas reutilizables

Definidos en `src/docs/schemas.yaml`:

- `User`, `Order`, `OrderItem`, `Delivery`
- `DocumentMeta` — metadatos de un documento de usuario
- `ReceiptMeta` — metadatos de un comprobante (usado en `Order.receipt` y `Delivery.receipt`)
- `ErrorResponse`, `SuccessResponse`

## Testing

### Herramientas utilizadas

Mocha (organiza/ejecuta), Chai (aserciones) y Supertest (requests HTTP contra `src/app.js`, sin levantar un puerto real).

### Entorno de testing separado

Los tests corren contra `mongodb://localhost:27017/shipnow-test`, una base completamente distinta a la de desarrollo. `tests/setup.js` limpia todas las colecciones antes de cada test, así ningún test depende del estado dejado por otro.

### Cómo ejecutar los tests

\`\`\`bash
npm test
\`\`\`

### Módulos cubiertos

| Archivo | Cubre |
|---|---|
| `tests/users.test.js` | CRUD de usuarios y validaciones |
| `tests/orders.test.js` | CRUD de pedidos, actualización de estado y reglas de negocio |
| `tests/mocks.test.js` | Generación de mocks y validación de cantidades inválidas |
| `tests/logger.test.js` | Endpoint de diagnóstico del logger |
| `tests/docs.test.js` | Acceso a Swagger (con y sin credenciales) |
| `tests/routes.test.js` | Ruta inexistente → 404 |
| `tests/uploads.test.js` | Carga de documento de usuario (éxito, archivo faltante, tipo de documento inválido, tipo de archivo inválido, usuario inexistente); carga de comprobante en pedidos y entregas (éxito y entidad inexistente) |

Los tests de carga de archivos usan `supertest`'s `.attach()` para simular la subida de un archivo real (un `Buffer` en memoria con distintos `contentType`), sin depender de archivos físicos en el repositorio.

## Manejo de errores

### Estructura de respuesta uniforme

\`\`\`json
{
  "status": "error",
  "error": "CÓDIGO_DEL_ERROR",
  "message": "Descripción legible del error"
}
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

Winston con `winston-daily-rotate-file` (`src/utils/logger.js`), 6 niveles: `debug`, `http`, `info`, `warning`, `error`, `fatal`. Se usa en `server.js`, `errorHandler.js`, y todos los `services` (incluyendo las nuevas cargas de archivos: `logger.info` en cargas exitosas, `logger.warning` propagado vía `errorHandler` en cargas rechazadas).

- **Desarrollo**: consola muestra todos los niveles.
- **Producción** (`NODE_ENV=production`): consola muestra solo desde `info`.
- **Persistencia**: `error` y `fatal` en `logs/errors-FECHA.log`, rotación diaria, retención 14 días.

## Cómo probar casos inválidos en Postman

### 1. Recurso inexistente → 404

\`\`\`
GET http://localhost:3000/api/orders/64b000000000000000000000
\`\`\`

### 2. Datos obligatorios faltantes → 400

\`\`\`
POST http://localhost:3000/api/orders
Content-Type: application/json

{ "customer": "64b000000000000000000000" }
\`\`\`

### 3. Ruta inexistente → 404

\`\`\`
GET http://localhost:3000/api/blabla
\`\`\`

### 4. Carga de documento sin archivo → 400

\`\`\`
POST http://localhost:3000/api/users/{uid}/documents
Body: form-data, solo con el campo de texto "documentType", sin adjuntar archivo
\`\`\`
\`\`\`json
{
  "status": "error",
  "error": "FILE_REQUIRED",
  "message": "Debe adjuntar un archivo (campo \"document\")"
}
\`\`\`

### 5. Carga de documento con tipo inválido → 400

\`\`\`
POST http://localhost:3000/api/users/{uid}/documents
Body: form-data, campo "document" con un archivo .exe
\`\`\`
\`\`\`json
{
  "status": "error",
  "error": "INVALID_FILE_TYPE",
  "message": "Tipo de archivo no permitido: application/x-msdownload. Permitidos: JPG, PNG, PDF"
}
\`\`\`

### 6. Comprobante sobre una entidad inexistente → 404

\`\`\`
POST http://localhost:3000/api/orders/64b000000000000000000000/receipt
Body: form-data, campo "receipt" con un archivo válido
\`\`\`
\`\`\`json
{
  "status": "error",
  "error": "ORDER_NOT_FOUND",
  "message": "Pedido no encontrado"
}
\`\`\`