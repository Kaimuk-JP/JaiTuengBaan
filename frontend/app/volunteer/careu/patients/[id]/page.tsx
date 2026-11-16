import ProtectedRoute from '@/components/shared/ProtectedRoute';
import PatientDetail from '@/components/careu/patients/PatientDetail';

export default async function CareUPatientDetailPage({ params }: { params: { id: string } }) {
    const resolvedParams = await params;

    return (
        <ProtectedRoute allowedRoles={['CAREU', 'ADMIN']}>
            <PatientDetail patientId={resolvedParams.id} />
        </ProtectedRoute>
    );
}
