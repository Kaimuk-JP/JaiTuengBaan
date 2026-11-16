import ProtectedRoute from '@/components/shared/ProtectedRoute';
import PatientList from '@/components/careu/patients/PatientList';

export default function CareUPatientsPage() {
    return (
        <ProtectedRoute allowedRoles={['CAREU', 'ADMIN']}>
            <PatientList />
        </ProtectedRoute>
    );
}
