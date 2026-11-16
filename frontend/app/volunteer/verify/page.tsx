'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/shared/ProtectedRoute';

export default function VolunteerVerifyPage() {
    const router = useRouter();
    const { user } = useAuth();

    useEffect(() => {
        if (user?.phone) {
            router.push('/volunteer/driver');
        }
    }, [user, router]);

    return (
        <ProtectedRoute allowedRoles={['DRIVE', 'ADMIN']}>
            <div className="min-h-screen bg-white px-[16px] py-[16px] flex items-center">
                <div className="max-w-md mx-auto w-full">
                    <div className="flex justify-center mb-4">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                            <svg className="w-8 h-8 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                        </div>
                    </div>

                    <div className="text-center mb-3">
                        <h1 className=" font-bold text-brand-primary mb-1">
                            ยืนยันตัวตนเจ้าหน้าที่รถ
                        </h1>
                        <p className="typo-menu text-text-tertiary">
                            กรุณานำบัตรประชาชนมายืนยันตัวตนที่เทศบาล
                        </p>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
                        <div className="flex gap-2">
                            <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <div className="typo-tags text-text-secondary">
                                <p className="font-semibold mb-1">ทำไมต้องยืนยันตัวตน?</p>
                                <p className="text-xs leading-tight">เพื่อความปลอดภัยของผู้ใช้บริการ เทศบาลจำเป็นต้องตรวจสอบตัวตนเจ้าหน้าที่รถทุกคนก่อนอนุมัติให้เข้าปฏิบัติงาน</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border border-border-neutral rounded-lg p-3 mb-3">
                        <h2 className="typo-menu font-bold text-text-primary mb-2">ขั้นตอนการยืนยันตัวตน</h2>
                        <ol className="space-y-2 typo-tags text-text-secondary">
                            <li className="flex gap-2 items-start">
                                <span className="flex-shrink-0 w-5 h-5 bg-brand-primary text-white rounded-full flex items-center justify-center text-[0.625rem] font-bold mt-0.5">1</span>
                                <span className="text-xs leading-tight">นำบัตรประชาชนตัวจริงไปที่เทศบาล</span>
                            </li>
                            <li className="flex gap-2 items-start">
                                <span className="flex-shrink-0 w-5 h-5 bg-brand-primary text-white rounded-full flex items-center justify-center text-[0.625rem] font-bold mt-0.5">2</span>
                                <span className="text-xs leading-tight">แจ้งเจ้าหน้าที่ว่าต้องการลงทะเบียนเป็นเจ้าหน้าที่รถ</span>
                            </li>
                            <li className="flex gap-2 items-start">
                                <span className="flex-shrink-0 w-5 h-5 bg-brand-primary text-white rounded-full flex items-center justify-center text-[0.625rem] font-bold mt-0.5">3</span>
                                <span className="text-xs leading-tight">เจ้าหน้าที่จะตรวจสอบและบันทึกข้อมูลของคุณ</span>
                            </li>
                            <li className="flex gap-2 items-start">
                                <span className="flex-shrink-0 w-5 h-5 bg-brand-primary text-white rounded-full flex items-center justify-center text-[0.625rem] font-bold mt-0.5">4</span>
                                <span className="text-xs leading-tight">รอการอนุมัติ (ระบบจะแจ้งเตือนผ่าน LINE)</span>
                            </li>
                        </ol>
                    </div>

                </div>
            </div>
        </ProtectedRoute>
    );
}
