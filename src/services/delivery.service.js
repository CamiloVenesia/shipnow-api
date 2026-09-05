// src/services/delivery.service.js

import Delivery from '../models/delivery.model.js'
import Order from '../models/order.model.js'
import User from '../models/user.model.js'
import { customError } from '../utils/customError.js'
import { ERROR_CODES } from '../constants/error.constants.js'
import logger from '../utils/logger.js'

export const deliveryService = {

    async getAll({ page = 1, limit = 10 } = {}) {
        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));

        const [items, total] = await Promise.all([
            Delivery.find()
                .skip((pageNum - 1) * limitNum)
                .limit(limitNum),
            Delivery.countDocuments()
        ]);

        return {
            items,
            page: pageNum,
            limit: limitNum,
            total,
            totalPages: Math.ceil(total / limitNum)
        };
    },

    async getById(did) {
        const delivery = await Delivery.findById(did)
        if (!delivery) {
            throw new customError(ERROR_CODES.DELIVERY_NOT_FOUND)
        }
        return delivery
    },

    async create({ order, driver, priority }) {
        if (!order) {
            throw new customError(ERROR_CODES.VALIDATION_ERROR, 'El pedido es obligatorio')
        }
        if (!driver) {
            throw new customError(ERROR_CODES.VALIDATION_ERROR, 'El repartidor es obligatorio')
        }

        const existingOrder = await Order.findById(order)
        if (!existingOrder) {
            throw new customError(ERROR_CODES.ORDER_NOT_FOUND, 'El pedido no existe')
        }

        const existingDriver = await User.findById(driver)
        if (!existingDriver) {
            throw new customError(ERROR_CODES.USER_NOT_FOUND, 'El repartidor no existe')
        }

        if (existingDriver.role !== 'driver') {
            throw new customError(ERROR_CODES.VALIDATION_ERROR, 'El usuario no tiene rol de repartidor')
        }

        if (existingOrder.status !== 'created') {
            throw new customError(ERROR_CODES.ORDER_ALREADY_DELIVERED, 'El pedido ya fue asignado o procesado')
        }

        const newDelivery = await Delivery.create({
            order,
            driver,
            priority: priority || 'normal',
            status: 'assigned',
            assignedAt: new Date()
        })

        await Order.findByIdAndUpdate(order, {
            status: 'assigned',
            delivery: newDelivery._id
        })

        logger.info(`Entrega ${newDelivery._id} creada para el pedido ${order}`)

        return newDelivery
    },

    async updateStatus(did, status) {
        const delivery = await Delivery.findById(did)
        if (!delivery) {
            throw new customError(ERROR_CODES.DELIVERY_NOT_FOUND)
        }

        if (delivery.status === 'delivered') {
            throw new customError(ERROR_CODES.ORDER_ALREADY_DELIVERED, 'La entrega ya fue completada')
        }

        delivery.status = status

        if (status === 'delivered') {
            delivery.deliveredAt = new Date()
            await Order.findByIdAndUpdate(delivery.order, { status: 'delivered' })
        }

        await delivery.save()

        logger.info(`Entrega ${delivery._id} actualizada a: ${status}`)

        return delivery
    },

    async remove(did) {
        const delivery = await Delivery.findByIdAndDelete(did)
        if (!delivery) {
            throw new customError(ERROR_CODES.DELIVERY_NOT_FOUND)
        }
        return delivery
    },

    async addReceipt(did, file) {
        if (!file) {
            throw new customError(ERROR_CODES.FILE_REQUIRED, 'Debe adjuntar un archivo (campo "receipt")')
        }

        const delivery = await Delivery.findById(did)
        if (!delivery) {
            throw new customError(ERROR_CODES.DELIVERY_NOT_FOUND)
        }

        delivery.receipt = {
            originalName: file.originalname,
            generatedName: file.filename,
            path: file.path,
            mimetype: file.mimetype,
            size: file.size,
            uploadedAt: new Date()
        }

        await delivery.save()

        logger.info(`Comprobante asociado a la entrega ${did}: ${file.originalname}`)

        return delivery
    }
}