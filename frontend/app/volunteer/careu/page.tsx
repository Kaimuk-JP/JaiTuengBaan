'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function CareUHomePage() {
    const router = useRouter();
    const { user, loading } = useAuth();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
            return;
        }

        if (!loading && user) {
            if (user.role === 'CAREU' || user.allowedRoles?.includes('CAREU')) {
                router.replace('/volunteer/careu/home');
            } else {
                router.replace('/select-role');
            }
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="text-center">
                    <div className="relative w-16 h-16 mx-auto mb-4">
                        <div className="absolute inset-0 border-4 border-brand-primary/20 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-brand-primary rounded-full border-t-transparent animate-spin"></div>
                    </div>
                    <p className="text-xl font-medium text-gray-800">กำลังโหลด...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 py-10">
            <div className="text-center max-w-lg w-full">
                <div className="w-20 h-20 mx-auto mb-6 bg-emerald-100 rounded-full flex items-center justify-center">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2L20 5V11C20 16 16.5 19.74 12 21C7.5 19.74 4 16 4 11V5L12 2Z" stroke="#1E7D55" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M9.5 12L11 13.5L14.5 10" stroke="#1E7D55" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>

                <h1 className="text-3xl font-bold text-emerald-700 mb-2">
                    ยืนยันตัวตนแคร์ยู
                </h1>
                <p className="text-sm text-gray-600 mb-6">
                    กรุณานำบัตรประชาชนมายืนยันตัวตนที่เทศบาล
                </p>

                <div className="border border-amber-200 bg-amber-50 rounded-xl p-4 text-left mb-4">
                    <div className="flex items-start gap-3">
                        <div className="mt-0.5 text-amber-500">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 9V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                <path d="M12 17H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                <path d="M10.3 3.8L2.9 17.5C2.6 18 2.5 18.6 2.7 19.2C2.9 19.8 3.4 20.2 4 20.4H20C20.6 20.2 21.1 19.8 21.3 19.2C21.5 18.6 21.4 18 21.1 17.5L13.7 3.8C13.4 3.3 12.9 3 12 3C11.1 3 10.6 3.3 10.3 3.8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <div>
                            <p className="font-semibold text-amber-700 mb-1">ทำไมต้องยืนยันตัวตน?</p>
                            <p className="text-sm text-amber-700">
                                เพื่อความปลอดภัยของผู้ใช้บริการ เจ้าหน้าที่ต้องตรวจสอบตัวตนให้ถูกต้องก่อนอนุมัติให้ปฏิบัติงาน
                            </p>
                        </div>
                    </div>
                </div>

                <div className="border border-emerald-200 rounded-xl p-4 text-left">
                    <p className="font-semibold text-emerald-700 mb-3">ขั้นตอนการยืนยันตัวตน</p>
                    <div className="space-y-3 text-sm text-emerald-800">
                        {[
                            'นำบัตรประชาชนตัวจริงไปที่เทศบาล',
                            'แจ้งเจ้าหน้าที่ว่าต้องการลงทะเบียนเป็นจิตอาสาแคร์ยู',
                            'เจ้าหน้าที่ตรวจสอบและบันทึกข้อมูลของคุณ',
                            'รอการอนุมัติ (ระบบจะแจ้งเตือนผ่าน LINE)'
                        ].map((text, index) => (
                            <div key={text} className="flex items-start gap-3">
                                <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
                                    {index + 1}
                                </div>
                                <p>{text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
