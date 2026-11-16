import ProtectedRoute from '@/components/shared/ProtectedRoute';
import HomeContent from '@/components/caregiver/home/HomeContent';

export default function CaregiverHome() {
    return (
        <ProtectedRoute allowedRoles={['CAREGIVER', 'ADMIN']}>
            <HomeContent />
        </ProtectedRoute>
    );
}

