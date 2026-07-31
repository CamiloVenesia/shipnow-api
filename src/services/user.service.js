// src/services/user.service.js

import User from '../models/user.model.js'
import { customError } from '../utils/customError.js'
import { ERROR_CODES } from '../constants/error.constants.js'

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
    }
}