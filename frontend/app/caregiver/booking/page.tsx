import ProtectedRoute from '@/components/shared/ProtectedRoute';
import BookingForm from '@/components/caregiver/booking/BookingForm';

export default function BookingPage() {
    return (
        <ProtectedRoute allowedRoles={['CAREGIVER', 'ADMIN']}>
            <BookingForm />
        </ProtectedRoute>
    );
}

