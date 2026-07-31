import { Router } from 'express';
import { mocksService } from '../services/mocks.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

// GET /api/mocks/mockingusers?count=10
router.get('/mockingusers', asyncHandler(async (req, res) => {
    const payload = mocksService.generateUsers(req.query.count);
    res.status(200).json({ status: 'success', count: payload.length, payload });
}));

// GET /api/mocks/mockingorders?count=10
router.get('/mockingorders', asyncHandler(async (req, res) => {
    const payload = mocksService.generateOrders(req.query.count);
    res.status(200).json({ status: 'success', count: payload.length, payload });
}));

// GET /api/mocks/mockingdeliveries?count=10
router.get('/mockingdeliveries', asyncHandler(async (req, res) => {
    const payload = mocksService.generateDeliveries(req.query.count);
    res.status(200).json({ status: 'success', count: payload.length, payload });
}));

// POST /api/mocks/generateData  { users, orders, deliveries }
router.post('/generateData', asyncHandler(async (req, res) => {
    const { users, orders, deliveries } = req.body || {};
    const result = await mocksService.generateAndPersistData({ users, orders, deliveries });

    res.status(201).json({
        status: 'success',
        message: 'Datos de prueba generados y guardados en MongoDB',
        payload: result
    });
}));

export default router;