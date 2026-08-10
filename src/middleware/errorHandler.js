// src/middleware/errorHandler.js

import { ERROR_CODES, ERROR_DICTIONARY } from '../constants/error.constants.js'
import logger from '../utils/logger.js'

export function errorHandler(err, req, res, next) {
    const context = `${req.method} ${req.originalUrl}`

    // Caso 1: customError con código mapeado en el diccionario -> error de negocio esperado
    if (err.code && ERROR_DICTIONARY[err.code]) {
        const { statusCode, message } = ERROR_DICTIONARY[err.code]
        const finalMessage = err.message !== err.code ? err.message : message

        logger.warning(`[${context}] ${err.code} -> ${finalMessage}`)

        return res.status(statusCode).json({
            status: 'error',
            error: err.code,
            message: finalMessage
        })
    }

    // Caso 2: error de Mongoose por ID mal formado -> también esperado (400)
    if (err.name === 'CastError') {
        const message = 'El identificador proporcionado no es válido'
        logger.warning(`[${context}] ${ERROR_CODES.VALIDATION_ERROR} -> ${message}`)

        return res.status(400).json({
            status: 'error',
            error: ERROR_CODES.VALIDATION_ERROR,
            message
        })
    }

    // Caso 3: error de validación de schema de Mongoose -> también esperado (400)
    if (err.name === 'ValidationError') {
        logger.warning(`[${context}] ${ERROR_CODES.VALIDATION_ERROR} -> ${err.message}`)

        return res.status(400).json({
            status: 'error',
            error: ERROR_CODES.VALIDATION_ERROR,
            message: err.message
        })
    }

    // Caso 4: cualquier otro error no controlado -> inesperado del servidor
    logger.error(`[${context}] Error no controlado -> ${err.message}`)
    logger.debug(err.stack) // stack completo solo visible en consola en desarrollo

    const fallback = ERROR_DICTIONARY[ERROR_CODES.INTERNAL_SERVER_ERROR]
    return res.status(fallback.statusCode).json({
        status: 'error',
        error: ERROR_CODES.INTERNAL_SERVER_ERROR,
        message: fallback.message
    })
}