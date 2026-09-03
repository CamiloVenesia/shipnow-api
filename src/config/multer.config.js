// src/config/multer.config.js

import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { customError } from '../utils/customError.js';
import { ERROR_CODES } from '../constants/error.constants.js';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

/**
 * Crea un middleware de Multer configurado para guardar archivos
 * dentro de uploads/<subfolder>/, generando un nombre único.
 */
export function createUploader(subfolder) {
    const uploadDir = path.join('uploads', subfolder);

    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
            fs.mkdirSync(uploadDir, { recursive: true });
            cb(null, uploadDir);
        },
        filename: (req, file, cb) => {
            const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
            const ext = path.extname(file.originalname);
            cb(null, `${uniqueSuffix}${ext}`);
        }
    });

    const fileFilter = (req, file, cb) => {
        if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
            return cb(new customError(ERROR_CODES.INVALID_FILE_TYPE, `Tipo de archivo no permitido: ${file.mimetype}. Permitidos: JPG, PNG, PDF`));
        }
        cb(null, true);
    };

    return multer({
        storage,
        fileFilter,
        limits: { fileSize: MAX_FILE_SIZE }
    });
}

export const ALLOWED_DOCUMENT_TYPES = ['dni', 'licencia_conducir', 'comprobante_domicilio', 'otro'];