import { Router } from 'express';
import { userService } from '../services/user.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

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

export default router;