import { useCallback, useEffect, useState } from 'react';
import { fetchWithAuth } from '@/lib/auth';

export function useExecutiveApprovalEnabled() {
    const [executiveApprovalEnabled, setExecutiveApprovalEnabled] = useState(true);
    const [loading, setLoading] = useState(true);

    const refresh = useCallback(async () => {
        try {
            const response = await fetchWithAuth('/settings/executive-approval-enabled');
            if (response.ok) {
                const data = await response.json();
                setExecutiveApprovalEnabled(data.executiveApprovalEnabled ?? true);
            }
        } catch (error) {
            console.error('Error fetching executive approval setting:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void refresh();
    }, [refresh]);

    return { executiveApprovalEnabled, loading, refresh };
}
