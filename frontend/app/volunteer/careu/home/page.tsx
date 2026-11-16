import ProtectedRoute from '@/components/shared/ProtectedRoute';
import CareUHomeContent from '@/components/careu/home/HomeContent';

export default function CareUHomePage() {
    return (
        <ProtectedRoute allowedRoles={['CAREU', 'ADMIN']}>
            <CareUHomeContent />
        </ProtectedRoute>
    );
}
