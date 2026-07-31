// src/middleware/errorHandler.js

import { ERROR_CODES, ERROR_DICTIONARY } from '../constants/error.constants.js'

export function errorHandler(err, req, res, next) {
    // Log interno para debug (no se lo mandamos al cliente)
    console.error(`[ERROR] ${req.method} ${req.originalUrl} ->`, err.stack || err.message)

    // Caso 1: es uno de nuestros customError, con code mapeado en el diccionario
    if (err.code && ERROR_DICTIONARY[err.code]) {
        const { statusCode, message } = ERROR_DICTIONARY[err.code]
        return res.status(statusCode).json({
            status: 'error',
            error: err.code,
            message: err.message !== err.code ? err.message : message
        })
    }

    // Caso 2: error de Mongoose por ID mal formado (ej. findById con id inválido)
    if (err.name === 'CastError') {
        return res.status(400).json({
            status: 'error',
            error: ERROR_CODES.VALIDATION_ERROR,
            message: 'El identificador proporcionado no es válido'
        })
    }

    // Caso 3: error de validación de Mongoose (schema)
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            status: 'error',
            error: ERROR_CODES.VALIDATION_ERROR,
            message: err.message
        })
    }

    // Caso 4: cualquier otro error no controlado
    const fallback = ERROR_DICTIONARY[ERROR_CODES.INTERNAL_SERVER_ERROR]
    return res.status(fallback.statusCode).json({
        status: 'error',
        error: ERROR_CODES.INTERNAL_SERVER_ERROR,
        message: fallback.message
    })
}