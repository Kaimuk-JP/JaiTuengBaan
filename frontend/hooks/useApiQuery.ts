'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchWithAuth } from '@/lib/auth';

export interface ApiQueryResult<T> {
    data: T | null;
    loading: boolean;
    error: string | null;
    refresh: () => void;
}

export interface ApiQueryOptions {
    enabled?: boolean;
    deps?: React.DependencyList;
}

export function useApiQuery<T>(
    endpoint: string | null,
    options: ApiQueryOptions = {}
): ApiQueryResult<T> {
    const { enabled = true, deps = [] } = options;

    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);

    const abortRef = useRef<AbortController | null>(null);

    const refresh = useCallback(() => {
        setRefreshKey((k) => k + 1);
    }, []);

    useEffect(() => {
        if (!enabled || !endpoint) return;

        let cancelled = false;
        setLoading(true);
        setError(null);

        const run = async () => {
            try {
                const res = await fetchWithAuth(endpoint);
                if (cancelled) return;

                if (!res.ok) {
                    const errText = await res.text().catch(() => 'Unknown error');
                    setError(`HTTP ${res.status}: ${errText}`);
                    setData(null);
                    return;
                }

                const json = await res.json();
                if (cancelled) return;

                setData(json as T);
            } catch (err: any) {
                if (cancelled) return;
                setError(err?.message || 'Network error');
                setData(null);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        run();

        return () => {
            cancelled = true;
        };
    }, [endpoint, enabled, refreshKey, ...deps]);

    return { data, loading, error, refresh };
}

export function usePaginatedQuery<T>(
    baseEndpoint: string | null,
    page: number,
    search?: string,
    limit: number = 20,
    options: ApiQueryOptions = {}
): ApiQueryResult<{ data: T[]; pagination: { page: number; limit: number; total: number; totalPages: number; hasNextPage: boolean; hasPrevPage: boolean } }> {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) params.append('search', search);
    const endpoint = baseEndpoint ? `${baseEndpoint}?${params.toString()}` : null;
    return useApiQuery(endpoint, options);
}
