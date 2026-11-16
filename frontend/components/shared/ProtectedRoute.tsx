'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getMissingProfileFields } from '@/utils/profileValidation';
import Swal from '@/lib/swal';

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles: string[];
}

type Role = 'USERS' | 'CAREGIVER' | 'DRIVE' | 'CAREU' | 'STAFF' | 'EXECUTIVE' | 'ADMIN';

const ROLE_HOME_PATHS: Record<Role, string> = {
    USERS: '/elderly/home',
    CAREGIVER: '/caregiver/home',
    DRIVE: '/volunteer/driver',
    CAREU: '/volunteer/careu/home',
    STAFF: '/staff/dashboard',
    EXECUTIVE: '/staff/petition',
    ADMIN: '/admin/portals',
};

const ROLE_ONBOARDING_PATHS: Record<Exclude<Role, 'ADMIN' | 'STAFF' | 'EXECUTIVE'>, { register: string; edit: string; verify: string }> = {
    USERS: { register: '/elderly/register', edit: '/elderly/profile/edit', verify: '/elderly/verify' },
    CAREGIVER: { register: '/caregiver/register', edit: '/caregiver/profile/edit', verify: '/elderly/verify' },
    DRIVE: { register: '/volunteer/driver/register', edit: '/volunteer/profile', verify: '/volunteer/verify' },
    CAREU: { register: '/volunteer/careu/register', edit: '/volunteer/careu/profile', verify: '/volunteer/careu/home' },
};

const PROFILE_EXEMPT_PATHS = ['/verify', '/register', '/profile/edit', '/pending'];

const REGISTER_PATHS = [
    '/elderly/register',
    '/caregiver/register',
    '/volunteer/driver/register',
    '/volunteer/careu/register',
    '/select-role',
    '/volunteer/pending',
];

function isRegisterOrOnboarding(pathname: string) {
    return REGISTER_PATHS.some(p => pathname === p || pathname.startsWith(p + '?'));
}

function isProfileExempt(pathname: string) {
    return PROFILE_EXEMPT_PATHS.some((segment) => pathname.includes(segment));
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, loading } = useAuth();
    const [isAuthorized, setIsAuthorized] = useState(false);

    const currentRole = user?.role as Role | undefined;

    const canAccess = useMemo(() => {
        if (isRegisterOrOnboarding(pathname)) return true;
        if (!currentRole) return false;
        if (currentRole === 'ADMIN') return true;
        if (allowedRoles.includes(currentRole)) return true;
        if (currentRole === 'EXECUTIVE' && allowedRoles.includes('STAFF')) return true;
        return false;
    }, [allowedRoles, currentRole, pathname]);

    useEffect(() => {
        if (loading) return;

        if (!user) {
            router.replace('/login');
            return;
        }

        const isRegisterOrOnboardingPath = isRegisterOrOnboarding(pathname);

        if (!currentRole) {
            if (!isRegisterOrOnboardingPath) {
                router.replace('/select-role');
                return;
            }
            setIsAuthorized(true);
            return;
        }

        if (!canAccess) {
            void Swal.fire({
                icon: 'error',
                title: 'คุณไม่มีสิทธิ์เข้าถึงหน้านี้',
                text: 'กรุณาเข้าสู่ระบบด้วยบัญชีที่มีสิทธิ์เข้าถึงหน้านี้',
                timer: 3000,
                timerProgressBar: true,
                showConfirmButton: false,
                allowOutsideClick: false,
                allowEscapeKey: false,
            }).finally(() => {
                router.replace(ROLE_HOME_PATHS[currentRole] ?? '/');
            });
            return;
        }

        if (currentRole === 'USERS' && !user.phone && pathname !== ROLE_ONBOARDING_PATHS.USERS.verify && pathname !== ROLE_ONBOARDING_PATHS.USERS.register) {
            void Swal.fire({
                icon: 'info',
                title: 'ยืนยันตัวตน',
                text: 'กรุณายืนยันตัวตนด้วยเลขบัตรประชาชนและเบอร์โทร',
                timer: 2000,
                showConfirmButton: false,
            }).finally(() => router.replace(ROLE_ONBOARDING_PATHS.USERS.verify));
            return;
        }

        if (currentRole === 'CAREGIVER' && user.idCard && user.phone && user.firstName && pathname === ROLE_ONBOARDING_PATHS.CAREGIVER.register) {
            router.replace(ROLE_HOME_PATHS.CAREGIVER);
            return;
        }

        if (currentRole === 'CAREGIVER' && !user.phone && !user.idCard && pathname !== ROLE_ONBOARDING_PATHS.CAREGIVER.verify && pathname !== ROLE_ONBOARDING_PATHS.CAREGIVER.register) {
            void Swal.fire({
                icon: 'warning',
                title: 'กรุณายืนยันตัวตน',
                text: 'กรุณายืนยันตัวตนก่อนเริ่มใช้งาน',
                timer: 2000,
                showConfirmButton: false,
            }).finally(() => router.replace(ROLE_ONBOARDING_PATHS.CAREGIVER.verify));
            return;
        }

        if (currentRole === 'DRIVE' && !user.phone && pathname !== ROLE_ONBOARDING_PATHS.DRIVE.verify && pathname !== ROLE_ONBOARDING_PATHS.DRIVE.register) {
            void Swal.fire({
                icon: 'warning',
                title: 'กรุณายืนยันตัวตน',
                text: 'กรุณายืนยันตัวตนที่เทศบาลก่อนเริ่มปฏิบัติงาน',
                timer: 2500,
                showConfirmButton: false,
            }).finally(() => router.replace(ROLE_ONBOARDING_PATHS.DRIVE.verify));
            return;
        }

        if (currentRole === 'CAREU' && (!user.phone || !user.idCard) && pathname !== ROLE_ONBOARDING_PATHS.CAREU.verify) {
            void Swal.fire({
                icon: 'warning',
                title: 'กรุณายืนยันตัวตน',
                text: 'กรุณายืนยันตัวตนที่เทศบาลก่อนเริ่มปฏิบัติงาน',
                timer: 2500,
                showConfirmButton: false,
            }).finally(() => router.replace(ROLE_ONBOARDING_PATHS.CAREU.verify));
            return;
        }

        if (['USERS', 'CAREGIVER'].includes(currentRole) && !isProfileExempt(pathname)) {
            const missingFields = getMissingProfileFields(user);
            if (missingFields.length > 0) {
                void Swal.fire({
                    icon: 'warning',
                    title: 'ข้อมูลโปรไฟล์ไม่ครบถ้วน',
                    html: `กรุณากรอกข้อมูลต่อไปนี้ให้ครบถ้วนก่อนใช้งาน:<br/><br/><ul style="text-align: left; list-style: disc; padding-left: 20px; font-size: 15px;">${missingFields.map((f: string) => `<li>${f}</li>`).join('')}</ul>`,
                    confirmButtonText: 'ไปกรอกข้อมูล',
                    confirmButtonColor: '#1E7D55',
                    allowOutsideClick: false,
                }).then(() => {
                    const targetPath = !user.firstName && !user.idCard
                        ? (currentRole === 'USERS' ? ROLE_ONBOARDING_PATHS.USERS.register : ROLE_ONBOARDING_PATHS.CAREGIVER.register)
                        : (currentRole === 'USERS' ? ROLE_ONBOARDING_PATHS.USERS.edit : ROLE_ONBOARDING_PATHS.CAREGIVER.edit);
                    router.replace(targetPath);
                });
                return;
            }
        }

        setIsAuthorized(true);
    }, [canAccess, currentRole, loading, pathname, router, user]);

    return isAuthorized ? <>{children}</> : null;
}
