import { generateResult } from '../../services/ai.service.js';

function buildMessagePayload(message, sender, createdAt = new Date().toISOString()) {
    return {
        message,
        sender,
        createdAt,
    };
}

function buildAiSender() {
    return {
        _id: 'ai',
        email: 'AI',
    };
}

function buildAiErrorMessage(error) {
    return JSON.stringify({
        text: error.message || 'AI request failed. Please check the backend configuration.',
        fileTree: {},
    });
}

export function registerProjectMessageHandler(io, socket) {
    const roomId = socket.project._id.toString();

    socket.on('project-message', async data => {
        const message = data.message || '';
        const payload = buildMessagePayload(
            message,
            data.sender || socket.user
        );

        socket.broadcast.to(roomId).emit('project-message', payload);

        if (!message.includes('@ai')) {
            return;
        }

        try {
            const prompt = message.replace('@ai', '').trim();
            const result = await generateResult(prompt);

            io.to(roomId).emit('project-message', buildMessagePayload(
                result,
                buildAiSender()
            ));
        } catch (error) {
            io.to(roomId).emit('project-message', buildMessagePayload(
                buildAiErrorMessage(error),
                buildAiSender()
            ));
        }
    });

    socket.on('disconnect', () => {
        socket.leave(roomId);
    });
}
