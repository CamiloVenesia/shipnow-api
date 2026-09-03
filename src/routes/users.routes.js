import { Router } from 'express';
import { userService } from '../services/user.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { createUploader } from '../config/multer.config.js';
import { handleUpload } from '../middleware/handleUpload.js';

const router = Router();
const documentUploader = createUploader('users/documents');

router.get('/', asyncHandler(async (req, res) => {
    const users = await userService.getAll();
    res.json(users);
}));

router.get('/:uid', asyncHandler(async (req, res) => {
    const user = await userService.getById(req.params.uid);
    res.json(user);
}));

router.post('/', asyncHandler(async (req, res) => {
    const newUser = await userService.create(req.body);
    res.status(201).json(newUser);
}));

router.delete('/:uid', asyncHandler(async (req, res) => {
    await userService.remove(req.params.uid);
    res.json({ message: 'Usuario eliminado' });
}));

router.post('/:uid/documents', handleUpload(documentUploader.single('document')), asyncHandler(async (req, res) => {
    const { documentType } = req.body;
    const user = await userService.addDocument(req.params.uid, req.file, documentType);
    res.status(201).json(user);
}));

export default router;