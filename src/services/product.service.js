// src/services/product.service.js

import Product from '../models/product.model.js'
import { customError } from '../utils/customError.js'
import { ERROR_CODES } from '../constants/error.constants.js'

export const productService = {

    async getAll() {
        return await Product.find()
    },

    async getById(pid) {
        const product = await Product.findById(pid)
        if (!product) {
            throw new customError(ERROR_CODES.PRODUCT_NOT_FOUND)
        }
        return product
    },

    async create({ name, description, price, stock, category, status }) {
        if (!name || price === undefined || stock === undefined) {
            throw new customError(ERROR_CODES.VALIDATION_ERROR, 'Faltan datos obligatorios (name, price, stock)')
        }

        if (price < 0) {
            throw new customError(ERROR_CODES.INVALID_STOCK, 'El precio no puede ser negativo')
        }

        if (stock < 0) {
            throw new customError(ERROR_CODES.INVALID_STOCK, 'El stock no puede ser negativo')
        }

        return await Product.create({
            name,
            description,
            price,
            stock,
            category,
            status: stock > 0 ? (status || 'available') : 'out_of_stock'
        })
    },

    async update(pid, { name, description, price, stock, category, status }) {
        const product = await Product.findById(pid)
        if (!product) {
            throw new customError(ERROR_CODES.PRODUCT_NOT_FOUND)
        }

        if (price !== undefined && price < 0) {
            throw new customError(ERROR_CODES.INVALID_STOCK, 'El precio no puede ser negativo')
        }

        if (stock !== undefined && stock < 0) {
            throw new customError(ERROR_CODES.INVALID_STOCK, 'El stock no puede ser negativo')
        }

        if (name !== undefined) product.name = name
        if (description !== undefined) product.description = description
        if (price !== undefined) product.price = price
        if (stock !== undefined) {
            product.stock = stock
            product.status = stock > 0 ? (status || 'available') : 'out_of_stock'
        }
        if (category !== undefined) product.category = category
        if (status !== undefined && product.stock > 0) product.status = status

        await product.save()
        return product
    },

    async remove(pid) {
        const product = await Product.findByIdAndDelete(pid)
        if (!product) {
            throw new customError(ERROR_CODES.PRODUCT_NOT_FOUND)
        }
        return product
    }
}