import mongoose from 'mongoose';
import projectModel from '../models/project.model.js';

function assertObjectId(id, name) {
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        throw new Error(`Invalid ${name}`);
    }
}

export const createProject = async ({ name, userId }) => {
    if (!name?.trim()) {
        throw new Error('Project name is required');
    }

    assertObjectId(userId, 'userId');

    try {
        return await projectModel.create({
            name: name.trim(),
            owner: userId,
            users: [ userId ],
        });
    } catch (error) {
        if (error.code === 11000) {
            throw new Error('You already have a project with this name');
        }

        throw error;
    }
};

export const getAllProjectsByUserId = async ({ userId }) => {
    assertObjectId(userId, 'userId');

    return projectModel.find({ users: userId }).sort({ updatedAt: -1 });
};

export const addUsersToProject = async ({ projectId, users, userId }) => {
    assertObjectId(projectId, 'projectId');
    assertObjectId(userId, 'userId');

    if (!Array.isArray(users) || users.length === 0) {
        throw new Error('Users must be a non-empty array');
    }

    if (users.some(id => !mongoose.Types.ObjectId.isValid(id))) {
        throw new Error('Invalid userId in users array');
    }

    const project = await projectModel.findOne({
        _id: projectId,
        users: userId,
    });

    if (!project) {
        throw new Error('User does not belong to this project');
    }

    return projectModel
        .findByIdAndUpdate(
            projectId,
            { $addToSet: { users: { $each: users } } },
            { new: true }
        )
        .populate('users', 'email');
};

export const getProjectById = async ({ projectId, userId }) => {
    assertObjectId(projectId, 'projectId');
    assertObjectId(userId, 'userId');

    const project = await projectModel
        .findOne({ _id: projectId, users: userId })
        .populate('users', 'email');

    if (!project) {
        throw new Error('Project not found');
    }

    return project;
};

export const updateFileTree = async ({ projectId, userId, fileTree }) => {
    assertObjectId(projectId, 'projectId');
    assertObjectId(userId, 'userId');

    if (!fileTree || typeof fileTree !== 'object' || Array.isArray(fileTree)) {
        throw new Error('File tree is required');
    }

    const project = await projectModel
        .findOneAndUpdate(
            { _id: projectId, users: userId },
            { fileTree },
            { new: true }
        )
        .populate('users', 'email');

    if (!project) {
        throw new Error('Project not found');
    }

    return project;
};
