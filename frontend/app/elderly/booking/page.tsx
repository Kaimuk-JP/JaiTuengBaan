import ProtectedRoute from '@/components/shared/ProtectedRoute';
import BookingForm from '@/components/elderly/booking/BookingForm';

export default function BookingPage() {
    return (
        <ProtectedRoute allowedRoles={['USERS', 'ADMIN']}>
            <BookingForm />
        </ProtectedRoute>
    );
}

