import { Router } from 'express';
import { orderController } from '../controllers/order.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { createUploader } from '../config/multer.config.js';
import { handleUpload } from '../middleware/handleUpload.js';

const router = Router();
const receiptUploader = createUploader('orders/receipts');

router.get('/', asyncHandler(orderController.getAll));
router.get('/:oid', asyncHandler(orderController.getById));
router.post('/', asyncHandler(orderController.create));
router.patch('/:oid/status', asyncHandler(orderController.updateStatus));
router.delete('/:oid', asyncHandler(orderController.remove));
router.post('/:oid/receipt', handleUpload(receiptUploader.single('receipt')), asyncHandler(orderController.addReceipt));

export default router;