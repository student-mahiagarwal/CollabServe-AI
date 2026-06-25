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
        test: /api key|permission_denied|GEMINI_API_KEY/i,
        message: 'AI is not configured correctly. Check the backend API key and try again.',
    },
];

export function humanizeAiError(message = '') {
    for (const pattern of ERROR_PATTERNS) {
        if (pattern.test.test(message)) {
            return pattern.message;
        }
    }

    return message || 'AI request failed. Please try again.';
}

function extractApiError(parsed) {
    if (!parsed?.error) {
        return null;
    }

    const apiError = parsed.error;

    if (typeof apiError === 'string') {
        return humanizeAiError(apiError);
    }

    return humanizeAiError(apiError.message || 'AI service unavailable', apiError.code);
}

export function parseAiMessage(message) {
    if (!message?.trim()) {
        return {
            type: 'error',
            text: 'AI returned an empty response.',
        };
    }

    let parsed;

    try {
        parsed = JSON.parse(message);
    } catch {
        return {
            type: 'success',
            text: message,
        };
    }

    if (parsed.isError) {
        return {
            type: 'error',
            text: humanizeAiError(parsed.text || 'AI request failed.'),
        };
    }

    const apiError = extractApiError(parsed);

    if (apiError) {
        return {
            type: 'error',
            text: apiError,
        };
    }

    return {
        type: 'success',
        text: parsed.text || message,
        fileTree: parsed.fileTree || null,
    };
}
