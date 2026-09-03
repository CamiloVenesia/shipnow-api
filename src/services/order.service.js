// src/services/order.service.js

import Order from '../models/order.model.js'
import User from '../models/user.model.js'
import { customError } from '../utils/customError.js'
import { ERROR_CODES } from '../constants/error.constants.js'
import logger from '../utils/logger.js'

export const orderService = {

    async getAll() {
        return await Order.find()
    },

    async getById(oid) {
        const order = await Order.findById(oid)
        if (!order) {
            throw new customError(ERROR_CODES.ORDER_NOT_FOUND)
        }
        return order
    },

    async create({ customer, items, deliveryAddress, priority }) {
        if (!customer) {
            throw new customError(ERROR_CODES.VALIDATION_ERROR, 'Falta el cliente')
        }
        if (!items || items.length === 0) {
            throw new customError(ERROR_CODES.VALIDATION_ERROR, 'Faltan los items del pedido')
        }
        if (!deliveryAddress) {
            throw new customError(ERROR_CODES.VALIDATION_ERROR, 'Falta la dirección de entrega')
        }

        const user = await User.findById(customer)
        if (!user) {
            throw new customError(ERROR_CODES.USER_NOT_FOUND)
        }

        if (user.role === 'driver') {
            throw new customError(ERROR_CODES.FORBIDDEN, 'Los repartidores no pueden crear pedidos')
        }

        const total = items.reduce((acc, item) => acc + item.price * item.quantity, 0)

        const newOrder = await Order.create({
            customer,
            items,
            deliveryAddress,
            total,
            priority: priority || 'normal',
            status: 'created'
        })

        // Simulación de side-effects
        logger.info(`[EMAIL SIMULADO] Enviando confirmación al usuario ${customer}...`)
        logger.info(`[EMAIL SIMULADO] Tu pedido ${newOrder._id} fue creado. Total: $${total}`)

        logger.info(`Pedido creado: ${newOrder._id} (cliente: ${customer}, total: $${total})`)

        const shippingCost = newOrder.items.reduce((acc, item) => acc + (item.quantity * 10), 0)

        return { order: newOrder, shippingCost }
    },

    async updateStatus(oid, status) {
        if (!status) {
            throw new customError(ERROR_CODES.VALIDATION_ERROR, 'El estado es obligatorio')
        }

        const order = await Order.findById(oid)
        if (!order) {
            throw new customError(ERROR_CODES.ORDER_NOT_FOUND)
        }

        if (order.status === 'delivered') {
            throw new customError(ERROR_CODES.ORDER_ALREADY_DELIVERED)
        }

        order.status = status
        await order.save()

        logger.info(`Pedido ${order._id} actualizado a estado: ${status}`)

        return order
    },

    async remove(oid) {
        const order = await Order.findByIdAndDelete(oid)
        if (!order) {
            throw new customError(ERROR_CODES.ORDER_NOT_FOUND)
        }
        return order
    },

    async addReceipt(oid, file) {
        if (!file) {
            throw new customError(ERROR_CODES.FILE_REQUIRED, 'Debe adjuntar un archivo (campo "receipt")')
        }

        const order = await Order.findById(oid)
        if (!order) {
            throw new customError(ERROR_CODES.ORDER_NOT_FOUND)
        }

        order.receipt = {
            originalName: file.originalname,
            generatedName: file.filename,
            path: file.path,
            mimetype: file.mimetype,
            size: file.size,
            uploadedAt: new Date()
        }

        await order.save()

        logger.info(`Comprobante asociado al pedido ${oid}: ${file.originalname}`)

        return order
    }
}