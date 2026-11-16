import { Role } from '@/types/user';

export interface RoleConfig {
    role: Role;
    label: string;
    description: string;
    homePath: string;
    settingsPath: string;
    badgeColor: string;
    bgColor: string;
    borderColor: string;
    textColor: string;
    iconName: string;
}

export const ROLE_CONFIGS: Record<Role, RoleConfig> = {
    USERS: {
        role: 'USERS',
        label: 'ประชาชนทั่วไป / ผู้ขอรับบริการ',
        description: 'ใช้งานสำหรับผู้สูงอายุและประชาชนเพื่อจองคิวรถบริการจิตอาสา',
        homePath: '/',
        settingsPath: '/elderly/settings',
        badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        bgColor: 'bg-emerald-50',
        borderColor: 'border-emerald-200',
        textColor: 'text-emerald-700',
        iconName: 'user',
    },
    CAREGIVER: {
        role: 'CAREGIVER',
        label: 'ผู้ดูแลประชาชน (ญาติ/ผู้ดูแล)',
        description: 'จัดการข้อมูลและยื่นคำขอรับบริการแทนผู้สูงอายุในความดูแล',
        homePath: '/caregiver/home',
        settingsPath: '/caregiver/settings',
        badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        textColor: 'text-blue-700',
        iconName: 'users',
    },
    DRIVE: {
        role: 'DRIVE',
        label: 'จิตอาสาขับรถ',
        description: 'รับงานขับรถ รับ-ส่งผู้สูงอายุและผู้ป่วยไปโรงพยาบาล',
        homePath: '/volunteer/home',
        settingsPath: '/volunteer/settings',
        badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-200',
        textColor: 'text-amber-700',
        iconName: 'car',
    },
    CAREU: {
        role: 'CAREU',
        label: 'จิตอาสาแคร์ยู (ผู้ช่วยดูแล)',
        description: 'ผู้ช่วยดูแลและอำนวยความสะดวกให้ผู้สูงอายุระหว่างเดินทาง',
        homePath: '/volunteer/home',
        settingsPath: '/volunteer/careu/settings',
        badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
        bgColor: 'bg-purple-50',
        borderColor: 'border-purple-200',
        textColor: 'text-purple-700',
        iconName: 'heart',
    },
    STAFF: {
        role: 'STAFF',
        label: 'เจ้าหน้าที่เทศบาล',
        description: 'จัดการคิว ตรวจสอบคำขอ มอบหมายงาน และบริหารจัดการระบบ',
        homePath: '/staff/dashboard',
        settingsPath: '/staff/settings',
        badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-300',
        bgColor: 'bg-indigo-50',
        borderColor: 'border-indigo-200',
        textColor: 'text-indigo-700',
        iconName: 'building',
    },
    EXECUTIVE: {
        role: 'EXECUTIVE',
        label: 'ผู้บริหารเทศบาล',
        description: 'ดูรายงาน สถิติภาพรวม และอนุมัติการดำเนินงานระดับนโยบาย',
        homePath: '/staff/dashboard',
        settingsPath: '/staff/settings',
        badgeColor: 'bg-rose-100 text-rose-800 border-rose-300',
        bgColor: 'bg-rose-50',
        borderColor: 'border-rose-200',
        textColor: 'text-rose-700',
        iconName: 'award',
    },
    ADMIN: {
        role: 'ADMIN',
        label: 'ผู้ดูแลระบบ (Admin)',
        description: 'จัดการระบบระดับสูงสุด สิทธิ์การเข้าถึง และการตั้งค่ากลาง',
        homePath: '/staff/dashboard',
        settingsPath: '/staff/settings',
        badgeColor: 'bg-slate-100 text-slate-800 border-slate-300',
        bgColor: 'bg-slate-50',
        borderColor: 'border-slate-200',
        textColor: 'text-slate-700',
        iconName: 'shield',
    },
};

export const getRoleConfig = (role?: Role | string | null): RoleConfig => {
    if (!role || !(role in ROLE_CONFIGS)) {
        return ROLE_CONFIGS.USERS;
    }
    return ROLE_CONFIGS[role as Role];
};
