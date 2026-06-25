export function getApiErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
    const data = error?.response?.data;

    if (!data) {
        return error?.message || fallback;
    }

    if (typeof data.error === 'string') {
        return data.error;
    }

    if (Array.isArray(data.errors) && data.errors[0]?.msg) {
        return data.errors[0].msg;
    }

    return fallback;
}
