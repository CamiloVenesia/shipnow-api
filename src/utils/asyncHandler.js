// src/utils/asyncHandler.js

/**
 * Envuelve un handler async y captura cualquier error,
 * derivándolo automáticamente a next(error) -> errorHandler global.
 * Evita repetir try/catch en cada ruta.
 */
export const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
}