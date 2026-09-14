// src/middleware/basicAuth.js

import { config } from '../config/env.js';

export function basicAuth(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Basic ')) {
        res.set('WWW-Authenticate', 'Basic realm="Swagger Docs"');
        return res.status(401).json({
            status: 'error',
            error: 'UNAUTHORIZED',
            message: 'Credenciales requeridas para acceder a la documentación'
        });
    }

    const credentials = Buffer.from(authHeader.slice(6), 'base64').toString();
    const [user, password] = credentials.split(':');

    if (user === config.basicAuthUser && password === config.basicAuthPassword) {
        return next();
    }

    res.set('WWW-Authenticate', 'Basic realm="Swagger Docs"');
    return res.status(401).json({
        status: 'error',
        error: 'UNAUTHORIZED',
        message: 'Credenciales inválidas'
    });
}