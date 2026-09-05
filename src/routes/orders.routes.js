import { Router } from 'express';
import { orderService } from '../services/order.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { createUploader } from '../config/multer.config.js';
import { handleUpload } from '../middleware/handleUpload.js';

const router = Router();
const receiptUploader = createUploader('orders/receipts');

// GET /api/orders
router.get('/', asyncHandler(async (req, res) => {
    const result = await orderService.getAll(req.query);
    res.json(result);
}));

// GET /api/orders/:oid
router.get('/:oid', asyncHandler(async (req, res) => {
    const order = await orderService.getById(req.params.oid);
    res.json(order);
}));

// POST /api/orders
router.post('/', asyncHandler(async (req, res) => {
    const { customer, items, deliveryAddress, priority } = req.body;
    const { order, shippingCost } = await orderService.create({ customer, items, deliveryAddress, priority });

    res.status(201).json({
        order,
        shippingCost,
        message: 'Pedido creado y email enviado'
    });
}));

// PATCH /api/orders/:oid/status
router.patch('/:oid/status', asyncHandler(async (req, res) => {
    const { status } = req.body;
    const order = await orderService.updateStatus(req.params.oid, status);
    res.json(order);
}));

// DELETE /api/orders/:oid
router.delete('/:oid', asyncHandler(async (req, res) => {
    await orderService.remove(req.params.oid);
    res.json({ message: 'Pedido eliminado' });
}));

router.post('/:oid/receipt', handleUpload(receiptUploader.single('receipt')), asyncHandler(async (req, res) => {
    const order = await orderService.addReceipt(req.params.oid, req.file);
    res.status(201).json(order);
}));

export default router;