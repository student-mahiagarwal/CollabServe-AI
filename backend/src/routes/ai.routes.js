import { Router } from 'express';
import { body } from 'express-validator';
import * as aiController from '../controllers/ai.controller.js';
import { authUser } from '../middleware/auth.middleware.js';
import { validateRequest } from '../middleware/validate.middleware.js';

const router = Router();

router.post(
    '/get-result',
    authUser,
    body('prompt').isString().trim().notEmpty().withMessage('Prompt is required'),
    validateRequest,
    aiController.getResult
);

export default router;
