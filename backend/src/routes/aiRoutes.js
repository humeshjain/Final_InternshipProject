import { Router } from 'express';
import { aiController } from '../controllers/aiController.js';

export const aiRouter = Router();

aiRouter.get('/config', aiController.getConfig);
aiRouter.post('/chat', aiController.chat);
aiRouter.post('/ai-analyze', aiController.analyze);
