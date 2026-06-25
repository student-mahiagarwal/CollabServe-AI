import { Router } from 'express';
import { body, param } from 'express-validator';
import * as projectController from '../controllers/project.controller.js';
import { authUser } from '../middleware/auth.middleware.js';
import { validateRequest } from '../middleware/validate.middleware.js';
import { isValidObjectId } from '../lib/objectId.js';

const router = Router();

const objectIdValidator = value => {
    if (!isValidObjectId(value)) {
        throw new Error('Invalid identifier');
    }

    return true;
};

router.post(
    '/create',
    authUser,
    body('name').isString().trim().notEmpty().withMessage('Name is required'),
    validateRequest,
    projectController.createProject
);

router.get('/all', authUser, projectController.getAllProjects);

router.put(
    '/add-user',
    authUser,
    body('projectId').custom(objectIdValidator).withMessage('Valid project ID is required'),
    body('users').isArray({ min: 1 }).withMessage('Users must be an array'),
    body('users.*').custom(objectIdValidator).withMessage('Each user must be a valid user ID'),
    validateRequest,
    projectController.addUserToProject
);

router.get(
    '/get-project/:projectId',
    authUser,
    param('projectId').custom(objectIdValidator).withMessage('Valid project ID is required'),
    validateRequest,
    projectController.getProjectById
);

router.put(
    '/update-file-tree',
    authUser,
    body('projectId').custom(objectIdValidator).withMessage('Valid project ID is required'),
    body('fileTree').isObject().withMessage('File tree is required'),
    validateRequest,
    projectController.updateFileTree
);

export default router;
