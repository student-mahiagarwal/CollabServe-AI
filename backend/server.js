import 'dotenv/config';
import http from 'http';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { Server } from 'socket.io';
import app from './app.js';
import connectDatabase from './db/db.js';
import projectModel from './models/project.model.js';
import userModel from './models/user.model.js';
import { generateResult } from './services/ai.service.js';

const port = process.env.PORT || 3000;

await connectDatabase();

function getAllowedOrigins() {
    const configuredOrigins = (process.env.CLIENT_URL || '')
        .split(',')
        .map(origin => origin.trim())
        .filter(Boolean);

    const deploymentOrigin = process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : null;

    return [
        ...configuredOrigins,
        deploymentOrigin,
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'https://collab-serve-ai-fcn3.vercel.app'
    ].filter(Boolean);
}

const allowedOrigins = [
    ...getAllowedOrigins(),
];

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        credentials: true,
    },
});

io.use(async (socket, next) => {
    try {
        const token = socket.handshake.auth?.token || socket.handshake.headers.authorization?.split(' ')[ 1 ];
        const projectId = socket.handshake.query.projectId;

        if (!token) {
            return next(new Error('Authentication error'));
        }

        if (!mongoose.Types.ObjectId.isValid(projectId)) {
            return next(new Error('Invalid projectId'));
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
});

io.on('connection', socket => {
    const roomId = socket.project._id.toString();
    socket.join(roomId);

    socket.on('project-message', async data => {
        const message = data.message || '';
        const payload = {
            message,
            sender: data.sender || socket.user,
            createdAt: new Date().toISOString(),
        };

        socket.broadcast.to(roomId).emit('project-message', payload);

        if (!message.includes('@ai')) {
            return;
        }

        try {
            const prompt = message.replace('@ai', '').trim();
            const result = await generateResult(prompt);

            io.to(roomId).emit('project-message', {
                message: result,
                sender: {
                    _id: 'ai',
                    email: 'AI',
                },
                createdAt: new Date().toISOString(),
            });
        } catch (error) {
            io.to(roomId).emit('project-message', {
                message: JSON.stringify({
                    text: error.message || 'AI request failed. Please check the backend configuration.',
                    fileTree: {},
                }),
                sender: {
                    _id: 'ai',
                    email: 'AI',
                },
                createdAt: new Date().toISOString(),
            });
        }
    });

    socket.on('disconnect', () => {
        socket.leave(roomId);
    });
});

server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
