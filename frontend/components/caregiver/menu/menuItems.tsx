import { MenuItem } from '../types';
import { menuIcon } from '@/components/shared/menuIcons';

export const caregiverHomeMenuItems: MenuItem[] = [
    {
        id: 'home',
        title: 'บริการหลัก',
        icon: menuIcon('home'),
        path: '/caregiver/home',
    },
    {
        id: 'profile',
        title: 'โปรไฟล์',
        path: '/caregiver/profile',
        icon: menuIcon('user'),
    },
];

export const caregiverServiceItems: MenuItem[] = [
    {
        id: 'book-now',
        title: 'จองเลย',
        icon: menuIcon('calendar-plus'),
        path: '/caregiver/booking',
    },
    {
        id: 'book-behalf',
        title: 'จองในนาม',
        icon: menuIcon('users'),
        path: '/caregiver/patients',
    },
    {
        id: 'patients',
        title: 'รายชื่อประชาชนที่ดูแล',
        icon: menuIcon('clipboard-list'),
        path: '/caregiver/patients',
    },
    {
        id: 'booking',
        title: 'ประวัติการจอง',
        icon: menuIcon('history'),
        path: '/caregiver/confirm',
    },
    {
        id: 'add-patient',
        title: 'เพิ่มประชาชนในความดูแล',
        icon: menuIcon('user-plus'),
        path: '/caregiver/add-patient',
        dividerAfter: true,
    },
];

export const caregiverMenuItems: MenuItem[] = [
    {
        id: 'settings',
        title: 'ตั้งค่าระบบ',
        path: '/caregiver/settings',
        icon: menuIcon('settings'),
    },
];
