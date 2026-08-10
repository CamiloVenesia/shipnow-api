// src/routes/logger.routes.js

import { Router } from 'express';
import logger from '../utils/logger.js';

const router = Router();

// GET /api/loggerTest
// Endpoint interno de diagnóstico: no es funcionalidad de negocio,
// solo sirve para verificar que el logger esté configurado correctamente.
router.get('/', (req, res) => {
    logger.debug('Test de logger: nivel debug funcionando correctamente');
    logger.http(`Test de logger: ${req.method} ${req.originalUrl}`);
    logger.info('Test de logger: nivel info funcionando correctamente');
    logger.warning('Test de logger: nivel warning funcionando correctamente');
    logger.error('Test de logger: nivel error funcionando correctamente');
    logger.fatal('Test de logger: nivel fatal funcionando correctamente');

    res.status(200).json({
        status: 'success',
        message: 'Se generó un log de cada nivel: debug, http, info, warning, error, fatal',
        levels: ['debug', 'http', 'info', 'warning', 'error', 'fatal']
    });
});

export default router;