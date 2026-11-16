import { MenuItem } from '@/components/volunteer/menu/menuItems';
import { menuIcon } from '@/components/shared/menuIcons';

export const careuMenuItems: MenuItem[] = [
    {
        id: 'home',
        title: 'หน้าหลัก',
        path: '/volunteer/careu/home',
        icon: menuIcon('home'),
    },
    {
        id: 'profile',
        title: 'โปรไฟล์',
        path: '/volunteer/careu/profile',
        icon: menuIcon('user'),
    },
    {
        id: 'patients',
        title: 'ข้อมูลประชาชน',
        path: '/volunteer/careu/patients',
        icon: menuIcon('clipboard-list'),
    },
    {
        id: 'jobs',
        title: 'คิวงานวัน ณ ปัจจุบัน',
        path: '/volunteer/careu/jobs',
        icon: menuIcon('calendar-event'),
    },
    {
        id: 'work-history',
        title: 'ประวัติการทำงาน',
        path: '/volunteer/careu/work-history',
        icon: menuIcon('history'),
    },
    {
        id: 'report',
        title: 'สรุปรายงาน',
        path: '/volunteer/careu/report',
        icon: menuIcon('chart-bar'),
    },
    {
        id: 'rewards',
        title: 'แต้มสะสมและของรางวัล',
        path: '/volunteer/careu/rewards',
        icon: menuIcon('award'),
        dividerAfter: true,
    },
    {
        id: 'settings',
        title: 'ตั้งค่าระบบ',
        path: '/volunteer/careu/settings',
        icon: menuIcon('settings'),
    },
];
