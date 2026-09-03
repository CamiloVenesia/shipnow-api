// src/middleware/handleUpload.js

import multer from 'multer';
import { customError } from '../utils/customError.js';
import { ERROR_CODES } from '../constants/error.constants.js';

/**
 * Envuelve un middleware de multer (ej. uploader.single('document'))
 * y traduce sus errores al formato customError del proyecto.
 */
export function handleUpload(multerMiddleware) {
    return (req, res, next) => {
        multerMiddleware(req, res, (err) => {
            if (err instanceof multer.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return next(new customError(ERROR_CODES.FILE_TOO_LARGE));
                }
                return next(new customError(ERROR_CODES.FILE_UPLOAD_ERROR, err.message));
            }
            if (err) {
                // Errores que ya vienen como customError (ej. INVALID_FILE_TYPE desde fileFilter)
                return next(err);
            }
            next();
        });
    };
}