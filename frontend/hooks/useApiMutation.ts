'use client';

import { useState, useCallback } from 'react';
import { fetchWithAuth } from '@/lib/auth';

type HttpMethod = 'POST' | 'PATCH' | 'PUT' | 'DELETE';

export interface ApiMutationResult<T, V = unknown> {
    mutate: (variables: V) => Promise<T | null>;
    mutateAsync: (variables: V) => Promise<T | null>;
    loading: boolean;
    error: string | null;
    data: T | null;
    reset: () => void;
}

export function useApiMutation<T, V = unknown>(
    endpoint: string,
    method: HttpMethod = 'POST'
): ApiMutationResult<T, V> {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const run = useCallback(
        async (variables: V): Promise<T | null> => {
            setLoading(true);
            setError(null);
            setData(null);

            try {
                const body = variables instanceof FormData ? variables : JSON.stringify(variables);
                const res = await fetchWithAuth(endpoint, {
                    method,
                    body: body as BodyInit,
                });

                if (!res.ok) {
                    const errJson = await res.json().catch(() => ({}));
                    throw new Error(errJson.message || `HTTP ${res.status}`);
                }

                const isDelete = method === 'DELETE';
                const json = isDelete ? null : await res.json().catch(() => null);
                const result = (json ?? null) as T;
                setData(result);
                return result;
            } catch (err: any) {
                const msg = err?.message || 'Request failed';
                setError(msg);
                throw err;
            } finally {
                setLoading(false);
            }
        },
        [endpoint, method]
    );

    const reset = useCallback(() => {
        setData(null);
        setError(null);
        setLoading(false);
    }, []);

    return {
        mutate: run,
        mutateAsync: run,
        loading,
        error,
        data,
        reset,
    };
}

export function useApiPost<T, V = unknown>(endpoint: string) {
    return useApiMutation<T, V>(endpoint, 'POST');
}

export function useApiPatch<T, V = unknown>(endpoint: string) {
    return useApiMutation<T, V>(endpoint, 'PATCH');
}

export function useApiPut<T, V = unknown>(endpoint: string) {
    return useApiMutation<T, V>(endpoint, 'PUT');
}

export function useApiDelete<T = unknown>(endpoint: string) {
    return useApiMutation<T, void>(endpoint, 'DELETE');
}
