import { MenuItem } from '../types';
import { menuIcon } from '@/components/shared/menuIcons';

export const elderlyHomeMenuItems: MenuItem[] = [
    {
        id: 'home',
        title: 'บริการหลัก',
        icon: menuIcon('home'),
        path: '/elderly/home',
    },
    {
        id: 'profile',
        title: 'โปรไฟล์',
        path: '/elderly/profile',
        icon: menuIcon('user'),
    },
];

export const elderlyServiceMenuItems: MenuItem[] = [];

export const elderlyMenuItems: MenuItem[] = [
    {
        id: 'booking',
        title: 'การจองคิวรถ',
        icon: menuIcon('calendar-plus'),
        path: '/elderly/booking',
    },
    {
        id: 'queue',
        title: 'ข้อมูลการจองคิวรถ',
        icon: menuIcon('clipboard-list'),
        path: '/elderly/confirm',
    },
    {
        id: 'history',
        title: 'ประวัติการจองคิวรถ',
        icon: menuIcon('history'),
        path: '/elderly/history',
    },
    {
        id: 'settings',
        title: 'ตั้งค่าระบบ',
        icon: menuIcon('settings'),
        path: '/elderly/settings',
    },
];
