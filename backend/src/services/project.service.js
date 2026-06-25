import projectModel from '../models/project.model.js';
import { assertObjectId } from '../lib/objectId.js';
import { badRequest, conflict, forbidden, notFound } from '../lib/errors.js';

export async function createProject({ name, userId }) {
    if (!name?.trim()) {
        throw badRequest('Project name is required');
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
            throw conflict('You already have a project with this name');
        }

        throw error;
    }
}

export async function getAllProjectsByUserId({ userId }) {
    assertObjectId(userId, 'userId');

    return projectModel.find({ users: userId }).sort({ updatedAt: -1 });
}

export async function addUsersToProject({ projectId, users, userId }) {
    assertObjectId(projectId, 'projectId');
    assertObjectId(userId, 'userId');

    if (!Array.isArray(users) || users.length === 0) {
        throw badRequest('Users must be a non-empty array');
    }

    users.forEach(id => assertObjectId(id, 'userId'));

    const project = await projectModel.findOne({
        _id: projectId,
        users: userId,
    });

    if (!project) {
        throw notFound('Project not found');
    }

    if (project.owner.toString() !== userId.toString()) {
        throw forbidden('Only the project owner can add collaborators');
    }

    return projectModel
        .findByIdAndUpdate(
            projectId,
            { $addToSet: { users: { $each: users } } },
            { new: true }
        )
        .populate('users', 'email');
}

export async function getProjectById({ projectId, userId }) {
    assertObjectId(projectId, 'projectId');
    assertObjectId(userId, 'userId');

    const project = await projectModel
        .findOne({ _id: projectId, users: userId })
        .populate('users', 'email');

    if (!project) {
        throw notFound('Project not found');
    }

    return project;
}

export async function updateFileTree({ projectId, userId, fileTree }) {
    assertObjectId(projectId, 'projectId');
    assertObjectId(userId, 'userId');

    if (!fileTree || typeof fileTree !== 'object' || Array.isArray(fileTree)) {
        throw badRequest('File tree is required');
    }

    const project = await projectModel
        .findOneAndUpdate(
            { _id: projectId, users: userId },
            { fileTree },
            { new: true }
        )
        .populate('users', 'email');

    if (!project) {
        throw notFound('Project not found');
    }

    return project;
}
