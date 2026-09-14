import { Router } from 'express';
import { mocksController } from '../controllers/mocks.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.get('/mockingusers', asyncHandler(mocksController.mockingUsers));
router.get('/mockingorders', asyncHandler(mocksController.mockingOrders));
router.get('/mockingdeliveries', asyncHandler(mocksController.mockingDeliveries));
router.post('/generateData', asyncHandler(mocksController.generateData));

export default router;