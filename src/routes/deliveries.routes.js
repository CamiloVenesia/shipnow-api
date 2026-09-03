import { Router } from 'express';
import { deliveryService } from '../services/delivery.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { createUploader } from '../config/multer.config.js';
import { handleUpload } from '../middleware/handleUpload.js';


const router = Router();
const receiptUploader = createUploader('deliveries/receipts');

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

router.post('/:did/receipt', handleUpload(receiptUploader.single('receipt')), asyncHandler(async (req, res) => {
    const delivery = await deliveryService.addReceipt(req.params.did, req.file);
    res.status(201).json(delivery);
}));

export default router;