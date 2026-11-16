import ProtectedRoute from '@/components/shared/ProtectedRoute';
import CaregiverForm from '@/components/caregiver/form/CaregiverForm';

export default function CaregiverRegisterPage() {
    return (
        <ProtectedRoute allowedRoles={['USERS', 'CAREGIVER', 'ADMIN']}>
            <CaregiverForm />
        </ProtectedRoute>
    );
}
