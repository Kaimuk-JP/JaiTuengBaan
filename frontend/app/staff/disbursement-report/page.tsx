'use client';

import { Suspense } from 'react';
import ProtectedRoute from '@/components/shared/ProtectedRoute';
import StaffLayout from '@/components/staff/layout/StaffLayout';
import StaffHeader from '@/components/staff/layout/StaffHeader';
import DisbursementReport from '@/components/staff/disbursement-report/DisbursementReport';

function DisbursementReportPage() {
    return (
        <StaffLayout>
            <StaffHeader
                title="รายงานการเบิกจ่าย"
                icon={
                    <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" fill="#1E7D55" />
                        </svg>
                    </div>
                }
            />
            <DisbursementReport />
        </StaffLayout>
    );
}

export default function DisbursementReportPageWrapper() {
    return (
        <ProtectedRoute allowedRoles={['STAFF', 'ADMIN']}>
            <Suspense fallback={
                <div className="flex min-h-screen items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
                </div>
            }>
                <DisbursementReportPage />
            </Suspense>
        </ProtectedRoute>
    );
}
