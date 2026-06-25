import * as projectService from '../services/project.service.js';
import { asyncHandler } from '../lib/errors.js';

export const createProject = asyncHandler(async (req, res) => {
    const project = await projectService.createProject({
        name: req.body.name,
        userId: req.user._id,
    });

    res.status(201).json({ project });
});

export const getAllProjects = asyncHandler(async (req, res) => {
    const projects = await projectService.getAllProjectsByUserId({
        userId: req.user._id,
    });

    res.status(200).json({ projects });
});

export const addUserToProject = asyncHandler(async (req, res) => {
    const project = await projectService.addUsersToProject({
        projectId: req.body.projectId,
        users: req.body.users,
        userId: req.user._id,
    });

    res.status(200).json({ project });
});

export const getProjectById = asyncHandler(async (req, res) => {
    const project = await projectService.getProjectById({
        projectId: req.params.projectId,
        userId: req.user._id,
    });

    res.status(200).json({ project });
});

export const updateFileTree = asyncHandler(async (req, res) => {
    const project = await projectService.updateFileTree({
        projectId: req.body.projectId,
        userId: req.user._id,
        fileTree: req.body.fileTree,
    });

    res.status(200).json({ project });
});
