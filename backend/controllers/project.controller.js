import { validationResult } from 'express-validator';
import * as projectService from '../services/project.service.js';

function handleValidation(req, res) {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return false;
    }

    return true;
}

export const createProject = async (req, res) => {
    if (!handleValidation(req, res)) {
        return;
    }

    try {
        const project = await projectService.createProject({
            name: req.body.name,
            userId: req.user._id,
        });

        res.status(201).json({ project });
    } catch (error) {
        res.status(error.status || 400).json({ error: error.message });
    }
};

export const getAllProjects = async (req, res) => {
    try {
        const projects = await projectService.getAllProjectsByUserId({
            userId: req.user._id,
        });

        res.status(200).json({ projects });
    } catch (error) {
        res.status(error.status || 400).json({ error: error.message });
    }
};

export const addUserToProject = async (req, res) => {
    if (!handleValidation(req, res)) {
        return;
    }

    try {
        const project = await projectService.addUsersToProject({
            projectId: req.body.projectId,
            users: req.body.users,
            userId: req.user._id,
        });

        res.status(200).json({ project });
    } catch (error) {
        res.status(error.status || 400).json({ error: error.message });
    }
};

export const getProjectById = async (req, res) => {
    try {
        const project = await projectService.getProjectById({
            projectId: req.params.projectId,
            userId: req.user._id,
        });

        res.status(200).json({ project });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const updateFileTree = async (req, res) => {
    if (!handleValidation(req, res)) {
        return;
    }

    try {
        const project = await projectService.updateFileTree({
            projectId: req.body.projectId,
            userId: req.user._id,
            fileTree: req.body.fileTree,
        });

        res.status(200).json({ project });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};
