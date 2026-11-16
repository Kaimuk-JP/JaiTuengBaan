'use client';

import { useEffect, useState, useCallback } from 'react';
import { fetchWithAuth } from '@/lib/auth';
import Swal from '@/lib/swal';
import { User } from '@/types/user';
import PersonnelFilter from './PersonnelFilter';
import PersonnelList from './PersonnelList';
import PersonnelPagination from './PersonnelPagination';

export default function PersonnelContainer() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(20);
    const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
    const [totalItems, setTotalItems] = useState(0);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setCurrentPage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        setCurrentPage(1);
    }, [selectedRoles]);

    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: currentPage.toString(),
                limit: itemsPerPage.toString(),
                q: debouncedSearch,
            });

            if (selectedRoles.length > 0) {
                params.append('roles', selectedRoles.join(','));
            } else {
                params.append('roles', 'USERS,DRIVE,CAREU,CAREGIVER,STAFF');
            }

            const response = await fetchWithAuth(`/users/search?${params.toString()}`);

            if (!response.ok) {
                throw new Error('ไม่สามารถดึงข้อมูลได้');
            }

            const result = await response.json();
            setUsers(result.data);
            setTotalItems(result.total || 0);
        } catch (err: any) {
            console.error('Error fetching users:', err);
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: err.message,
            });
        } finally {
            setLoading(false);
        }
    }, [currentPage, itemsPerPage, debouncedSearch, selectedRoles]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const totalPages = Math.ceil(totalItems / itemsPerPage);

    const handleRoleToggle = (role: string) => {
        setSelectedRoles(prev =>
            prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
        );
    };

    const handleClearFilters = () => {
        setSelectedRoles([]);
    };

    return (
        <div className="pb-32">
            {}
            <div className="flex items-center gap-4 px-6 py-4 border-b border-gray-200 mb-6 bg-white">
                <div className="w-10 h-10 bg-glacier-light rounded-square flex items-center justify-center text-brand-primary">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="7" r="4" fill="currentColor" />
                        <path d="M12 13c-4.42 0-8 2.58-8 6v2h16v-2c0-3.42-3.58-6-8-6z" fill="currentColor" />
                        <circle cx="7" cy="9" r="3" fill="currentColor" fillOpacity="0.4" />
                        <path d="M7 14c-3 0-5 1.5-5 3.5V19h4v-1.5c0-.8.3-1.5.8-2.1" fill="currentColor" fillOpacity="0.4" />
                        <circle cx="17" cy="9" r="3" fill="currentColor" fillOpacity="0.4" />
                        <path d="M17 14c3 0 5 1.5 5 3.5V19h-4v-1.5c0-.8-.3-1.5-.8-2.1" fill="currentColor" fillOpacity="0.4" />
                    </svg>
                </div>
                <h1 className="text-4xl font-bold text-gray-900">บุคลากรในระบบ</h1>
            </div>



            {}
            <div className="mx-6 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <PersonnelFilter
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    selectedRoles={selectedRoles}
                    onRoleToggle={handleRoleToggle}
                    onClearFilters={handleClearFilters}
                />
                <PersonnelList users={users} loading={loading} />
            </div>

            {}
            {!loading && totalItems > 0 && (
                <PersonnelPagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                />
            )}
        </div>
    );
}
