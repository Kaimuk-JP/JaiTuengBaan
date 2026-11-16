import ProtectedRoute from '@/components/shared/ProtectedRoute';
import HomeContent from '@/components/elderly/home/HomeContent';

export default function ElderlyHome() {
    return (
        <ProtectedRoute allowedRoles={['USERS', 'ADMIN']}>
            <HomeContent />
        </ProtectedRoute>
    );
}

