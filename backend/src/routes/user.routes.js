import { Router } from 'express';
import { body } from 'express-validator';
import * as userController from '../controllers/user.controller.js';
import { authUser } from '../middleware/auth.middleware.js';
import { validateRequest } from '../middleware/validate.middleware.js';

const router = Router();

router.post(
    '/register',
    body('email').isEmail().withMessage('Email must be valid').normalizeEmail(),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters'),
    validateRequest,
    userController.register
);

router.post(
    '/login',
    body('email').isEmail().withMessage('Email must be valid').normalizeEmail(),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters'),
    validateRequest,
    userController.login
);

router.get('/profile', authUser, userController.profile);
router.get('/logout', authUser, userController.logout);
router.get('/all', authUser, userController.getAllUsers);

export default router;
