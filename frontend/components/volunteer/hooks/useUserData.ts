import { useState, useEffect } from 'react';
import type { User } from '@/types/user';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface UseUserDataResult {
    userData: User | null;
    loading: boolean;
    error: Error | null;
    refetch: () => void;
}

export const useUserData = (): UseUserDataResult => {
    const [userData, setUserData] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<Error | null>(null);
    const [refetchTrigger, setRefetchTrigger] = useState(0);

    useEffect(() => {
        const fetchUserData = async () => {
            setLoading(true);
            setError(null);

            try {
                const res = await fetch(`${API_URL}/users/profile`, {
                    credentials: 'include'
                });

                if (!res.ok) {
                    throw new Error('ไม่สามารถดึงข้อมูลผู้ใช้ได้');
                }

                const data = await res.json();
                setUserData(data);
            } catch (err) {
                const error = err instanceof Error ? err : new Error('Unknown error occurred');
                setError(error);
                console.error('Error fetching user data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [refetchTrigger]);

    const refetch = () => {
        setRefetchTrigger(prev => prev + 1);
    };

    return { userData, loading, error, refetch };
};
