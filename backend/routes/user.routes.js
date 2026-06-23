import { Router } from 'express';
import { body } from 'express-validator';
import * as userController from '../controllers/user.controller.js';
import * as authMiddleware from '../middleware/auth.middleware.js';

const router = Router();

router.post(
    '/register',
    body('email').isEmail().withMessage('Email must be valid').normalizeEmail(),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters'),
    userController.register
);

router.post(
    '/login',
    body('email').isEmail().withMessage('Email must be valid').normalizeEmail(),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters'),
    userController.login
);

router.get('/profile', authMiddleware.authUser, userController.profile);
router.get('/logout', authMiddleware.authUser, userController.logout);
router.get('/all', authMiddleware.authUser, userController.getAllUsers);

export default router;
