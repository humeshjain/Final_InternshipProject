import { Router } from 'express';
import { catalogController } from '../controllers/catalogController.js';

export const catalogRouter = Router();

catalogRouter.get('/categories', catalogController.getCategories);
catalogRouter.post('/categories', catalogController.saveCategory);
catalogRouter.delete('/categories/:id', catalogController.deleteCategory);
