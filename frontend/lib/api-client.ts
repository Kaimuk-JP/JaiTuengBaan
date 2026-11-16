import { getApiEndpoint } from './api';

const defaultHeaders = {
    'Content-Type': 'application/json',
};

const MAX_RETRIES = 2;
const RETRY_BASE_DELAY_MS = 300;
const REQUEST_TIMEOUT_MS = 15000;
const RETRY_STATUS_CODES = new Set([429, 500, 502, 503, 504]);

class ApiError extends Error {
    response?: any;
    constructor(message: string, response?: any) {
        super(message);
        this.response = response;
    }
}

const handleResponse = async (response: Response) => {
    let data;
    try {
        data = await response.json();
    } catch (e) {
        data = null;
    }

    if (!response.ok) {
        throw new ApiError(data?.message || `HTTP error! status: ${response.status}`, { data });
    }

    return { data };
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchWithRetry = async (input: RequestInfo, init: RequestInit) => {
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

        try {
            const response = await fetch(input, {
                ...init,
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (RETRY_STATUS_CODES.has(response.status) && attempt < MAX_RETRIES) {
                await sleep(RETRY_BASE_DELAY_MS * Math.pow(2, attempt));
                continue;
            }

            return response;
        } catch (error) {
            clearTimeout(timeoutId);

            const isRetryableError =
                error instanceof TypeError ||
                (error instanceof DOMException && error.name === 'AbortError');

            if (isRetryableError && attempt < MAX_RETRIES) {
                await sleep(RETRY_BASE_DELAY_MS * Math.pow(2, attempt));
                continue;
            }

            throw error;
        }
    }

    throw new Error('Fetch retry exhausted');
};

const apiClient = {
    get: async (url: string) => {
        const response = await fetchWithRetry(getApiEndpoint(url), {
            method: 'GET',
            headers: defaultHeaders,
            credentials: 'include',
        });
        return handleResponse(response);
    },
    post: async (url: string, data: any) => {
        const response = await fetchWithRetry(getApiEndpoint(url), {
            method: 'POST',
            headers: defaultHeaders,
            credentials: 'include',
            body: JSON.stringify(data),
        });
        return handleResponse(response);
    },
    patch: async (url: string, data: any) => {
        const response = await fetchWithRetry(getApiEndpoint(url), {
            method: 'PATCH',
            headers: defaultHeaders,
            credentials: 'include',
            body: JSON.stringify(data),
        });
        return handleResponse(response);
    },
    delete: async (url: string) => {
        const response = await fetchWithRetry(getApiEndpoint(url), {
            method: 'DELETE',
            headers: defaultHeaders,
            credentials: 'include',
        });
        return handleResponse(response);
    }
};

export default apiClient;
