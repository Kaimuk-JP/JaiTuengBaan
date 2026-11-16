'use client';

import { useState } from 'react';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { usePaginatedQuery } from '@/hooks/useApiQuery';
import { useSocketRefresh } from '@/hooks/useSocketRefresh';
import VolunteerFilter from './VolunteerFilter';
import VolunteerList from './VolunteerList';
import Pagination from '@/components/staff/Pagination';

interface Volunteer {
    id: number;
    iamUserId: string;
    displayName: string;
    firstName: string | null;
    lastName: string | null;
    pictureUrl: string | null;
    phone: string | null;
    address: string | null;
    addressDetail: string | null;
    pointsBalance: number;
    role: string;
    createdAt: string;
}

interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
}

export default function VolunteerContainer() {
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const debouncedSearch = useDebouncedValue(searchTerm, 500);

    const {
        data,
        loading,
        refresh,
    } = usePaginatedQuery<Volunteer>('/users/volunteers', currentPage, debouncedSearch, 20);

    useSocketRefresh(refresh, ['notification', 'refresh_volunteers']);

    const volunteers = data?.data ?? [];
    const pagination = data?.pagination ?? null;

    const handleSearchChange = (val: string) => {
        setSearchTerm(val);
        if (val === '') setCurrentPage(1);
    };

    return (
        <div>
            <div className="flex items-center gap-4 px-6 py-4 border-b border-gray-200 mb-6 bg-white">
                <div className="w-10 h-10 bg-glacier-light rounded-square flex items-center justify-center">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
                <h1 className="text-4xl font-bold text-gray-900">สมาชิกจิตอาสา</h1>
            </div>

            <div className="mx-6 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <VolunteerFilter
                    searchTerm={searchTerm}
                    onSearchChange={handleSearchChange}
                />
                <VolunteerList volunteers={volunteers} loading={loading} />
            </div>

            {!loading && volunteers.length > 0 && pagination && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={pagination.totalPages}
                    onPageChange={setCurrentPage}
                    variant="sticky"
                />
            )}
        </div>
    );
}
