import { Router } from 'express';
import { deliveryService } from '../services/delivery.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.get('/', asyncHandler(async (req, res) => {
    const deliveries = await deliveryService.getAll();
    res.json(deliveries);
}));

router.get('/:did', asyncHandler(async (req, res) => {
    const delivery = await deliveryService.getById(req.params.did);
    res.json(delivery);
}));

router.post('/', asyncHandler(async (req, res) => {
    const { order, driver, priority } = req.body;
    const newDelivery = await deliveryService.create({ order, driver, priority });
    res.status(201).json(newDelivery);
}));

router.patch('/:did/status', asyncHandler(async (req, res) => {
    const { status } = req.body;
    const delivery = await deliveryService.updateStatus(req.params.did, status);
    res.json(delivery);
}));

router.delete('/:did', asyncHandler(async (req, res) => {
    await deliveryService.remove(req.params.did);
    res.json({ message: 'Entrega eliminada' });
}));

export default router;