// src/utils/customError.js

export class customError extends Error {
    /**
     * @param {string} code - Debe ser uno de ERROR_CODES (error.constants.js)
     * @param {string} [customMessage] - Opcional: sobreescribe el mensaje default del diccionario
     */
    constructor(code, customMessage) {
        super(customMessage || code)
        this.code = code
        this.name = 'CustomError'

        // Mantiene el stack trace real (apunta a donde se lanzó el error, no acá)
        Error.captureStackTrace(this, this.constructor)
    }
}