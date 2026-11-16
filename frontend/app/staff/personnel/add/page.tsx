'use client';

import ProtectedRoute from '@/components/shared/ProtectedRoute';
import StaffLayout from '@/components/staff/layout/StaffLayout';
import AddPersonnelForm from '@/components/staff/personnel/AddPersonnelForm';

export default function AddPersonnelPage() {
    return (
        <ProtectedRoute allowedRoles={['STAFF', 'ADMIN']}>
            <StaffLayout>
                <div className="p-4 md:p-6 max-w-6xl mx-auto w-full">
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800">เพิ่มบุคลากรใหม่</h1>
                            <p className="text-slate-500 text-sm mt-1">
                                ลงทะเบียนประชาชนหรือผู้ดูแลประชาชนเข้าสู่ระบบ เพื่อให้สามารถเข้าสู่ระบบผ่าน LINE ได้ในภายหลังโดยใช้เลขบัตรประชาชนและเบอร์โทร
                            </p>
                        </div>
                    </div>
                    <AddPersonnelForm />
                </div>
            </StaffLayout>
        </ProtectedRoute>
    );
}
