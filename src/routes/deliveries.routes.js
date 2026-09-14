import { Router } from 'express';
import { deliveryController } from '../controllers/delivery.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { createUploader } from '../config/multer.config.js';
import { handleUpload } from '../middleware/handleUpload.js';

const router = Router();
const receiptUploader = createUploader('deliveries/receipts');

router.get('/', asyncHandler(deliveryController.getAll));
router.get('/:did', asyncHandler(deliveryController.getById));
router.post('/', asyncHandler(deliveryController.create));
router.patch('/:did/status', asyncHandler(deliveryController.updateStatus));
router.delete('/:did', asyncHandler(deliveryController.remove));
router.post('/:did/receipt', handleUpload(receiptUploader.single('receipt')), asyncHandler(deliveryController.addReceipt));

export default router;