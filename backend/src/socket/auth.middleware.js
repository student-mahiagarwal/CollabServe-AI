import jwt from 'jsonwebtoken';
import userModel from '../models/user.model.js';
import projectModel from '../models/project.model.js';
import { isTokenBlacklisted } from '../services/auth.service.js';
import { isValidObjectId } from '../lib/objectId.js';

export async function socketAuthMiddleware(socket, next) {
    try {
        const token = socket.handshake.auth?.token
            || socket.handshake.headers.authorization?.split(' ')[ 1 ];
        const projectId = socket.handshake.query.projectId;

        if (!token) {
            return next(new Error('Authentication error'));
        }

        if (!isValidObjectId(projectId)) {
            return next(new Error('Invalid projectId'));
        }

        if (await isTokenBlacklisted(token)) {
            return next(new Error('Authentication error'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await userModel.findById(decoded._id);

        if (!user) {
            return next(new Error('Authentication error'));
        }

        const project = await projectModel.findById(projectId);

        if (!project) {
            return next(new Error('Project not found'));
        }

        const isProjectMember = project.users.some(projectUserId => (
            projectUserId.toString() === user._id.toString()
        ));

        if (!isProjectMember) {
            return next(new Error('Unauthorized project access'));
        }

        socket.user = {
            _id: user._id.toString(),
            email: user.email,
        };
        socket.project = project;

        return next();
    } catch (error) {
        return next(error);
    }
}
