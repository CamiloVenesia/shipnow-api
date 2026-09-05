// src/routes/health.routes.js

import { Router } from 'express';
import { config } from '../config/env.js';

const router = Router();

const startTime = Date.now();

router.get('/', (req, res) => {
    res.json({
        status: 'ok',
        environment: config.nodeEnv,
        uptime: Math.floor((Date.now() - startTime) / 1000),
        timestamp: new Date().toISOString()
    });
});

export default router;