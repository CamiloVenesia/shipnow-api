// src/services/order.service.js

import Order from '../models/order.model.js'
import User from '../models/user.model.js'
import { customError } from '../utils/customError.js'
import { ERROR_CODES } from '../constants/error.constants.js'

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

        // Simulación de side-effects (no son errores de negocio, se mantienen igual)
        console.log(`[EMAIL SIMULADO] Enviando confirmación al usuario ${customer}...`)
        console.log(`[EMAIL SIMULADO] Tu pedido ${newOrder._id} fue creado. Total: $${total}`)

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

        console.log(`Pedido ${order._id} actualizado a estado: ${status}`)

        return order
    },

    async remove(oid) {
        const order = await Order.findByIdAndDelete(oid)
        if (!order) {
            throw new customError(ERROR_CODES.ORDER_NOT_FOUND)
        }
        return order
    }
}