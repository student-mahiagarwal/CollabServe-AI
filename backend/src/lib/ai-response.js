import { badRequest } from './errors.js';

const ERROR_PATTERNS = [
    {
        test: /high demand|spikes in demand|UNAVAILABLE|503/i,
        message: 'The AI model is busy right now. Please wait a moment and try again.',
    },
    {
        test: /rate limit|quota|429/i,
        message: 'AI rate limit reached. Please try again in a few minutes.',
    },
    {
        test: /api key was reported as leaked/i,
        message: 'Gemini API key was blocked. Create a new key and update GEMINI_API_KEY in backend/.env.',
    },
    {
        test: /permission_denied|api key|invalid.*key/i,
        message: 'Gemini API key is invalid. Update GEMINI_API_KEY in backend/.env and restart the backend.',
    },
];

export function humanizeAiError(message = '', code = null) {
    const combined = `${message} ${code || ''}`;

    for (const pattern of ERROR_PATTERNS) {
        if (pattern.test.test(combined)) {
            return pattern.message;
        }
    }

    return message || 'AI request failed. Please try again.';
}

export function formatAiErrorPayload(message) {
    return JSON.stringify({
        text: humanizeAiError(message),
        fileTree: {},
        isError: true,
    });
}

export function assertValidAiPayload(parsed) {
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw badRequest('AI returned an unexpected response');
    }

    if (parsed.error) {
        const apiError = parsed.error;
        const message = typeof apiError === 'string'
            ? apiError
            : apiError.message || 'AI service unavailable';
        const code = typeof apiError === 'object' ? apiError.code : null;

        throw badRequest(humanizeAiError(message, code));
    }

    if (!parsed.text && !parsed.fileTree) {
        throw badRequest('AI returned an unexpected response');
    }
}
