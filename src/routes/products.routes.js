import { Router } from 'express';
import { productService } from '../services/product.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.get('/', asyncHandler(async (req, res) => {
    const products = await productService.getAll();
    res.json(products);
}));

router.get('/:pid', asyncHandler(async (req, res) => {
    const product = await productService.getById(req.params.pid);
    res.json(product);
}));

router.post('/', asyncHandler(async (req, res) => {
    const newProduct = await productService.create(req.body);
    res.status(201).json(newProduct);
}));

router.put('/:pid', asyncHandler(async (req, res) => {
    const product = await productService.update(req.params.pid, req.body);
    res.json(product);
}));

router.delete('/:pid', asyncHandler(async (req, res) => {
    await productService.remove(req.params.pid);
    res.json({ message: 'Producto eliminado' });
}));

export default router;