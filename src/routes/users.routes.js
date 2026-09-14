import { Router } from 'express';
import { userController } from '../controllers/user.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { createUploader } from '../config/multer.config.js';
import { handleUpload } from '../middleware/handleUpload.js';

const router = Router();
const documentUploader = createUploader('users/documents');

router.get('/', asyncHandler(userController.getAll));
router.get('/:uid', asyncHandler(userController.getById));
router.post('/', asyncHandler(userController.create));
router.delete('/:uid', asyncHandler(userController.remove));
router.post('/:uid/documents', handleUpload(documentUploader.single('document')), asyncHandler(userController.addDocument));

export default router;