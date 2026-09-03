// src/services/user.service.js

import User from '../models/user.model.js'
import { customError } from '../utils/customError.js'
import { ERROR_CODES } from '../constants/error.constants.js'
import { ALLOWED_DOCUMENT_TYPES } from '../config/multer.config.js'
import logger from '../utils/logger.js'

export const userService = {

    async getAll() {
        return await User.find()
    },

    async getById(uid) {
        const user = await User.findById(uid)
        if (!user) {
            throw new customError(ERROR_CODES.USER_NOT_FOUND)
        }
        return user
    },

    async create({ firstName, lastName, email, password, role }) {
        if (!firstName || !lastName || !email || !password) {
            throw new customError(ERROR_CODES.VALIDATION_ERROR)
        }

        if (role === 'admin') {
            throw new customError(ERROR_CODES.FORBIDDEN)
        }

        const existingUser = await User.findOne({ email })
        if (existingUser) {
            throw new customError(ERROR_CODES.USER_ALREADY_EXIST)
        }

        return await User.create({
            firstName,
            lastName,
            email,
            password,
            role: role || 'customer'
        })
    },

    async remove(uid) {
        const user = await User.findByIdAndDelete(uid)
        if (!user) {
            throw new customError(ERROR_CODES.USER_NOT_FOUND)
        }
        return user
    },

    async addDocument(uid, file, documentType) {
        if (!file) {
            throw new customError(ERROR_CODES.FILE_REQUIRED, 'Debe adjuntar un archivo (campo "document")')
        }

        if (documentType && !ALLOWED_DOCUMENT_TYPES.includes(documentType)) {
            throw new customError(ERROR_CODES.INVALID_DOCUMENT_TYPE, `Tipo de documento inválido: ${documentType}`)
        }

        const user = await User.findById(uid)
        if (!user) {
            throw new customError(ERROR_CODES.USER_NOT_FOUND)
        }

        user.documents.push({
            documentType: documentType || 'otro',
            originalName: file.originalname,
            generatedName: file.filename,
            path: file.path,
            mimetype: file.mimetype,
            size: file.size,
            uploadedAt: new Date()
        })

        await user.save()

        logger.info(`Documento cargado para usuario ${uid}: ${file.originalname} (${documentType || 'otro'})`)

        return user
    }
}