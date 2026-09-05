import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';

import usersRouter from './routes/users.routes.js';
import loggerTestRouter from './routes/logger.routes.js';
import ordersRouter from './routes/orders.routes.js';
import deliveriesRouter from './routes/deliveries.routes.js';
import productsRouter from './routes/products.routes.js';
import mocksRouter from './routes/mocks.routes.js';
import healthRouter from './routes/health.routes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { basicAuth } from './middleware/basicAuth.js';
import { customError } from './utils/customError.js';
import { ERROR_CODES } from './constants/error.constants.js';
import { swaggerSpec } from './docs/swagger.config.js';
import { config } from './config/env.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check - siempre público, sin información sensible
app.use('/api/health', healthRouter);

// Endpoints internos: en producción se protegen con basicAuth,
// en desarrollo quedan libres para facilitar el trabajo diario.
const isProd = config.nodeEnv === 'production';
const internalGuard = isProd
    ? basicAuth
    : (req, res, next) => next();

// /api/docs siempre queda protegido, en cualquier entorno
app.use('/api/docs', basicAuth, swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api/users', usersRouter);
app.use('/api/loggerTest', internalGuard, loggerTestRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/deliveries', deliveriesRouter);
app.use('/api/products', productsRouter);
app.use('/api/mocks', internalGuard, mocksRouter);

// Catch-all: cualquier ruta no definida cae acá
app.use((req, res, next) => {
    next(new customError(ERROR_CODES.ROUTE_NOT_FOUND, `La ruta ${req.method} ${req.originalUrl} no existe`));
});

app.use(errorHandler);

export default app;