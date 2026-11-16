import React from 'react';
import { menuIcon } from '@/components/shared/menuIcons';

export interface MenuItem {
    id: string;
    title: string;
    path?: string;
    icon?: React.ReactNode;
    children?: MenuItem[];
    dividerAfter?: boolean;
}

export const volunteerMenuItems: MenuItem[] = [
    {
        id: 'main-service',
        title: 'บริการหลัก',
        path: '/volunteer/home',
        icon: menuIcon('home'),
    },
    {
        id: 'profile',
        title: 'โปรไฟล์',
        path: '/volunteer/profile',
        icon: menuIcon('user'),
    },
    {
        id: 'calendar',
        title: 'ตารางงาน',
        path: '/volunteer/calendar',
        icon: menuIcon('calendar-event'),
    },
    {
        id: 'work-history',
        title: 'ประวัติการทำงาน',
        path: '/volunteer/work-history',
        icon: menuIcon('history'),
    },
    {
        id: 'map',
        title: 'แผนที่การเดินทาง',
        path: '/volunteer/driver',
        icon: menuIcon('map-pin'),
    },
    {
        id: 'rewards',
        title: 'แลกแต้มรับรางวัล',
        path: '/volunteer/rewards',
        icon: menuIcon('gift'),
        dividerAfter: true,
    },
    {
        id: 'settings',
        title: 'ตั้งค่าระบบ',
        path: '/volunteer/settings',
        icon: menuIcon('settings'),
    },
];
