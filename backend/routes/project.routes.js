import { Router } from 'express';
import { body } from 'express-validator';
import mongoose from 'mongoose';
import * as projectController from '../controllers/project.controller.js';
import * as authMiddleware from '../middleware/auth.middleware.js';

const router = Router();
const isObjectId = value => mongoose.Types.ObjectId.isValid(value);

router.post(
    '/create',
    authMiddleware.authUser,
    body('name').isString().trim().notEmpty().withMessage('Name is required'),
    projectController.createProject
);

router.get('/all', authMiddleware.authUser, projectController.getAllProjects);

router.put(
    '/add-user',
    authMiddleware.authUser,
    body('projectId').custom(isObjectId).withMessage('Valid project ID is required'),
    body('users').isArray({ min: 1 }).withMessage('Users must be an array'),
    body('users.*').custom(isObjectId).withMessage('Each user must be a valid user ID'),
    projectController.addUserToProject
);

router.get(
    '/get-project/:projectId',
    authMiddleware.authUser,
    projectController.getProjectById
);

router.put(
    '/update-file-tree',
    authMiddleware.authUser,
    body('projectId').custom(isObjectId).withMessage('Valid project ID is required'),
    body('fileTree').isObject().withMessage('File tree is required'),
    projectController.updateFileTree
);

export default router;
