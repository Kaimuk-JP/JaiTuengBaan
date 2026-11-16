import ProtectedRoute from '@/components/shared/ProtectedRoute';
import ReportSummary from '@/components/careu/report/ReportSummary';

export default function CareUReportPage() {
    return (
        <ProtectedRoute allowedRoles={['CAREU', 'ADMIN']}>
            <ReportSummary />
        </ProtectedRoute>
    );
}
