// src/controllers/mocks.controller.js

import { mocksService } from '../services/mocks.service.js'

export const mocksController = {

    mockingUsers(req, res) {
        const payload = mocksService.generateUsers(req.query.count)
        res.status(200).json({ status: 'success', count: payload.length, payload })
    },

    mockingOrders(req, res) {
        const payload = mocksService.generateOrders(req.query.count)
        res.status(200).json({ status: 'success', count: payload.length, payload })
    },

    mockingDeliveries(req, res) {
        const payload = mocksService.generateDeliveries(req.query.count)
        res.status(200).json({ status: 'success', count: payload.length, payload })
    },

    async generateData(req, res) {
        const { users, orders, deliveries } = req.body || {}
        const result = await mocksService.generateAndPersistData({ users, orders, deliveries })

        res.status(201).json({
            status: 'success',
            message: 'Datos de prueba generados y guardados en MongoDB',
            payload: result
        })
    }
}