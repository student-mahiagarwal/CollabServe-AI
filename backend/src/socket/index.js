import { Server } from 'socket.io';
import { getAllowedOrigins } from '../config/cors.js';
import { socketAuthMiddleware } from './auth.middleware.js';
import { registerProjectMessageHandler } from './handlers/project-message.handler.js';

export function createSocketServer(httpServer) {
    const io = new Server(httpServer, {
        cors: {
            origin: getAllowedOrigins(),
            credentials: true,
        },
    });

    io.use(socketAuthMiddleware);

    io.on('connection', socket => {
        const roomId = socket.project._id.toString();
        socket.join(roomId);
        registerProjectMessageHandler(io, socket);
    });

    return io;
}
