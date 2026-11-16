import { useAuth } from '@/contexts/AuthContext';

export const useUserId = (): string | null => {
    const { user } = useAuth();
    return user?.id?.toString() || null;
};
