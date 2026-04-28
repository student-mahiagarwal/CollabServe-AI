import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import * as authMiddleware from '../middleware/auth.middleware.js';
import { generateResult } from '../services/ai.service.js';

const router = Router();

router.post(
    '/get-result',
    authMiddleware.authUser,
    body('prompt').isString().trim().notEmpty().withMessage('Prompt is required'),
    async (req, res) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const result = await generateResult(req.body.prompt);
            return res.status(200).json({ result });
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
);

export default router;
