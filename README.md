# ShipNow API — Módulo 6: Testing funcional con Mocha, Chai y Supertest

API de gestión de envíos (**ShipNow**) construida con Node.js, Express y MongoDB (Mongoose), siguiendo una arquitectura por capas: **rutas → servicios → modelos**.

Este módulo incorpora una **suite de tests funcionales automatizados** con Mocha, Chai y Supertest, que valida los endpoints principales de la API (usuarios, pedidos, mocks, logger y documentación Swagger) cubriendo tanto casos exitosos como errores esperados, sobre una base de datos de testing completamente separada de la de desarrollo.

## Instalación

\`\`\`bash
npm install
\`\`\`

El proyecto no usa variables de entorno para la configuración de base/puerto en desarrollo; están definidas directamente en `src/server.js`:

- Puerto: `3000`
- MongoDB (desarrollo): `mongodb://localhost:27017/shipnow`
- MongoDB (testing): `mongodb://localhost:27017/shipnow-test` (definida en `tests/setup.js`)

Asegurate de tener el servicio de MongoDB corriendo localmente (generalmente arranca solo como servicio de Windows) antes de levantar el servidor o correr los tests.

La variable `NODE_ENV` se usa para dos cosas: diferenciar el comportamiento del logger entre desarrollo y producción (ver Módulo 4), y activarse automáticamente en `test` al correr la suite de tests.

## Levantar el servidor

\`\`\`bash
npm run dev
\`\`\`

Si todo está bien configurado, la terminal debería mostrar:

\`\`\`
2026-08-10 19:09:09 [info]    Conexión a MongoDB establecida
2026-08-10 19:09:09 [info]    Servidor ShipNow escuchando en el puerto 3000
\`\`\`

## Testing

### Herramientas utilizadas

- **Mocha**: organiza y ejecuta la suite de tests (`describe` / `it`).
- **Chai**: librería de aserciones para validar respuestas (`expect`).
- **Supertest**: permite hacer requests HTTP directas contra la app de Express sin necesidad de levantar un puerto real.

### Separación de la app y el servidor

Para que los tests puedan importar la API sin abrir manualmente un puerto, `src/app.js` contiene toda la configuración de Express (rutas, middlewares, Swagger, manejo de errores) y la exporta. `src/server.js` es un archivo mínimo que importa esa app, conecta a MongoDB y recién ahí llama a `app.listen()`. Los tests importan directamente `src/app.js` y usan Supertest para simular requests HTTP en memoria.

### Entorno de testing separado

Los tests corren contra una base de datos **completamente distinta** a la de desarrollo:

\`\`\`
mongodb://localhost:27017/shipnow-test
\`\`\`

Esto está configurado en `tests/setup.js`, que además:

- Se conecta a esa base antes de correr cualquier test (`before`).
- Limpia todas las colecciones (`User`, `Order`, `Delivery`, `Product`) antes de **cada** test individual (`beforeEach`), para que ningún test dependa del estado dejado por otro.
- Limpia todo y cierra la conexión al finalizar la suite completa (`after`).

De esta forma, correr `npm test` **nunca** toca ni borra los datos de tu base de desarrollo (`shipnow`).

### Cómo ejecutar los tests

\`\`\`bash
npm test
\`\`\`

Esto corre:

\`\`\`bash
cross-env NODE_ENV=test mocha --exit tests/setup.js tests/**/*.test.js
\`\`\`

Salida esperada (resumen):

\`\`\`
25 passing (388ms)
\`\`\`

### Módulos cubiertos

| Archivo | Cubre |
|---|---|
| `tests/users.test.js` | Listar usuarios, crear usuario válido, validación de datos, restricción de rol admin, usuario no encontrado |
| `tests/orders.test.js` | Listar pedidos, crear pedido válido (con cálculo de total), validaciones, restricción de rol driver, consulta por ID, actualización de estado, regla de negocio (pedido ya entregado) |
| `tests/mocks.test.js` | Generación de usuarios simulados, validación de cantidades inválidas (texto y negativos), generación y persistencia real de datos de prueba en MongoDB |
| `tests/logger.test.js` | Endpoint de diagnóstico del logger, generación de los 6 niveles |
| `tests/docs.test.js` | Acceso a Swagger UI: rechazo sin credenciales (401) y acceso correcto con `basicAuth` (200) |
| `tests/routes.test.js` | Ruta inexistente → 404 con formato de error estándar |

### Qué valida cada test

Cada test no solo confirma el status HTTP: también valida la **estructura del body** de la respuesta (propiedades presentes, valores calculados como el `total` de un pedido, arrays con la longitud esperada, códigos de error específicos del diccionario de `ERROR_CODES`, etc.), en lugar de limitarse a comprobar que el endpoint "responde" o "falla".

### Datos de prueba

Todos los datos usados en los tests son generados **dentro del propio test** (usuarios, pedidos, etc.), nunca dependen de datos cargados manualmente en la base. Por ejemplo, antes de testear la creación de un pedido, el test crea primero un usuario `customer` real en la base de testing.

## Documentación interactiva (Swagger)

### Acceso

La documentación está disponible en:

\`\`\`
http://localhost:3000/api/docs
\`\`\`

Esta ruta está protegida con **autenticación básica** (usuario y contraseña):

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
| `FORBIDDEN` | 403 |