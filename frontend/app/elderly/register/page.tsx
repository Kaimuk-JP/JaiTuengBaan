import ProtectedRoute from '@/components/shared/ProtectedRoute';
import ElderlyForm from '@/components/elderly/form/ElderlyForm';

export default function ElderlyRegisterPage() {
    return (
        <ProtectedRoute allowedRoles={['USERS', 'ADMIN']}>
            <ElderlyForm />
        </ProtectedRoute>
    );
}
