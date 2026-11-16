import React from 'react';
import type { MenuItem } from 'gov-layout';

export type { MenuItem };

export const adminMenuItems: MenuItem[] = [
    {
        id: 'admin-roles',
        title: 'จัดการ Role ผู้ใช้',
        path: '/admin/roles',
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
    },
    {
        id: 'admin-delete-users',
        title: 'ลบบัญชีผู้ใช้',
        path: '/admin/delete-users',
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="8.5" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
                <line x1="18" y1="8" x2="23" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="23" y1="8" x2="18" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
    },
    {
        id: 'activity-logs',
        title: 'บันทึกกิจกรรมระบบ',
        path: '/admin/logs',
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill="none" stroke="currentColor" strokeWidth="2" />
                <polyline points="14,2 14,8 20,8" fill="none" stroke="currentColor" strokeWidth="2" />
                <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="2" />
                <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="2" />
                <polyline points="10,9 9,9 8,9" fill="none" stroke="currentColor" strokeWidth="2" />
            </svg>
        ),
    },
    {
        id: 'admin-online-users',
        title: 'ผู้ใช้งานออนไลน์ (Live)',
        path: '/admin/online-users',
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <circle cx="12" cy="12" r="2" fill="currentColor" />
                <path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M19.1 4.9C23 8.8 23 15.2 19.1 19.1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
        ),
    },
];
