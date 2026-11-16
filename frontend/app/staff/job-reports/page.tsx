'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/shared/ProtectedRoute';
import StaffLayout from '@/components/staff/layout/StaffLayout';
import StaffHeader from '@/components/staff/layout/StaffHeader';
import LocationMapModal from '@/components/staff/LocationMapModal';
import { SearchBar, JobStatusBadge } from '@/components/staff';
import { fetchWithAuth } from '@/lib/auth';
import Swal from '@/lib/swal';

import JobReportList from '@/components/staff/job-reports/JobReportList';

function JobReportsPage() {
    return (
        <StaffLayout>
            { }
            <StaffHeader title="รายการจองของประชาชน" />

            { }
            <JobReportList />
        </StaffLayout >
    );
}

export default function JobReportsPageWrapper() {
    return (
        <ProtectedRoute allowedRoles={['STAFF', 'ADMIN']}>
            <JobReportsPage />
        </ProtectedRoute>
    );
}
