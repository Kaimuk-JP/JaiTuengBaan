'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getApiUrl } from '@/lib/api';
import Swal from '@/lib/swal';
import { ShieldCheck, IdCard, Smartphone, ChevronRight, Loader2, X } from 'lucide-react';

const ElderlyIcon = () => (
    <svg width="33" height="34" viewBox="0 0 33 34" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M19.3564 31.0134L20.8457 16.4316C19.2328 16.0109 17.9822 15.4419 17.0938 14.7244C16.2057 14.0069 15.3385 13.2191 14.4922 12.3609L14.1139 11.9822L8.99331 17.0555L12.7217 21.2887C12.8733 21.4487 12.9869 21.6289 13.0625 21.8292C13.1385 22.0295 13.1764 22.2364 13.1764 22.4498V30.8297C13.1764 31.2281 13.0416 31.562 12.7719 31.8314C12.5022 32.1011 12.168 32.2359 11.7692 32.2359C11.3708 32.2359 11.0369 32.1011 10.7675 31.8314C10.4985 31.562 10.3639 31.2281 10.3639 30.8297V23.0048L7.63065 20.3583L8.00893 23.3189C8.04018 23.5408 8.02456 23.7627 7.96206 23.9845C7.89956 24.2064 7.79628 24.4052 7.65221 24.5808L2.49971 31.1433C2.25909 31.4533 1.95018 31.6305 1.573 31.6748C1.1955 31.7195 0.851745 31.612 0.541745 31.3523C0.231745 31.0927 0.0544017 30.782 0.00971416 30.4205C-0.0346608 30.0586 0.0729954 29.7227 0.332683 29.4127L5.06706 23.3189L2.57518 17.4014C2.36143 16.8702 2.25987 16.2542 2.2705 15.5536C2.28143 14.853 2.53815 14.2514 3.04065 13.7489L9.14143 7.72359C9.47143 7.39672 9.83565 7.15156 10.2341 6.98812C10.6328 6.82469 11.0385 6.74297 11.451 6.74297C12.1107 6.74297 12.6322 6.86859 13.0157 7.11984C13.3991 7.37109 13.6569 7.56281 13.7891 7.695L17.1608 11.0194C18.0524 11.9112 19.0955 12.6414 20.2902 13.2098C21.4852 13.7783 22.8399 14.0625 24.3542 14.0625H27.6102C28.2027 14.0625 28.718 14.2597 29.1561 14.6541C29.5942 15.0481 29.8446 15.5384 29.9071 16.125L31.1619 28.3739C31.58 28.5758 31.9232 28.8756 32.1913 29.2734C32.4594 29.6713 32.5935 30.1298 32.5935 30.6492C32.5935 31.3505 32.35 31.9464 31.8632 32.437C31.3763 32.928 30.7807 33.1734 30.0763 33.1734C29.3719 33.1734 28.7661 32.928 28.2589 32.437C27.7517 31.9464 27.4982 31.3505 27.4982 30.6492C27.4982 30.1552 27.6202 29.7119 27.8642 29.3194C28.1083 28.9272 28.4311 28.6241 28.8327 28.41L28.5261 25.493H22.1436L21.5741 31.2408C21.5247 31.5108 21.395 31.7442 21.185 31.9411C20.9753 32.1377 20.7346 32.2359 20.4627 32.2359C20.1171 32.2359 19.8336 32.1175 19.6124 31.8806C19.3914 31.6438 19.3061 31.3547 19.3564 31.0134ZM18.3327 6.92344C17.3808 6.92344 16.5658 6.58438 15.8877 5.90625C15.2099 5.22844 14.871 4.41359 14.871 3.46172C14.871 2.50984 15.2099 1.695 15.8877 1.01719C16.5658 0.33906 17.3808 0 18.3327 0C19.2846 0 20.0994 0.33906 20.7772 1.01719C21.455 1.695 21.7939 2.50984 21.7939 3.46172C21.7939 4.41359 21.455 5.22844 20.7772 5.90625C20.0994 6.58438 19.2846 6.92344 18.3327 6.92344ZM22.371 23.2575H28.3171L27.6069 16.2984H23.0919L22.371 23.2575Z" fill="currentColor" />
    </svg>
);

const CaregiverIcon = () => (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <mask id="mask0_5013_327" style={{ maskType: 'alpha' } as React.CSSProperties} maskUnits="userSpaceOnUse" x="0" y="0" width="36" height="36">
            <rect width="36" height="36" fill="#D9D9D9" />
        </mask>
        <g mask="url(#mask0_5013_327)">
            <path d="M35.9985 34.8686L35.0551 21.7583C34.9532 20.3349 33.9649 19.1822 32.6676 18.7976C33.2855 18.1435 33.2647 17.1255 32.6413 16.4955L24.3598 8.12967C25.8587 7.53141 26.9479 6.10039 27.0191 4.39107C27.1166 2.06266 25.3065 0.100218 22.9715 0.00269847C19.4017 -0.145224 17.2924 3.92649 19.4082 6.73811C17.425 7.37472 15.7781 8.77176 14.8204 10.5907L16.8092 11.1155C18.6073 11.59 19.7698 13.273 19.5759 15.1193C19.3775 17.005 17.7833 18.4656 15.8504 18.4656C15.4099 18.4656 15.2522 18.4185 13.9132 18.1643C13.911 19.6797 13.9077 21.687 13.9022 24.3529C13.9011 24.937 14.3745 25.4103 14.9607 25.4103C23.8382 25.395 23.2049 25.4103 23.4569 25.3632C23.904 25.2777 24.2458 24.9161 24.305 24.4647L25.6396 15.0733L30.3863 18.9324C29.9304 19.1285 29.5206 19.4255 29.1864 19.8112C28.1619 20.9902 28.3723 22.1593 28.4403 23.1115C28.4819 23.6922 28.9881 24.1294 29.5699 24.0878C30.1518 24.0461 30.5901 23.541 30.5484 22.9603C30.486 22.0946 30.3731 21.6651 30.7829 21.1929C31.4973 20.3711 32.867 20.8181 32.9448 21.9095L33.8882 35.0198C33.9298 35.595 34.4284 36.0377 35.0179 35.9961C35.5997 35.9544 36.038 35.4493 35.9964 34.8686H35.9985Z" fill="#FCFCFF" />
            <path d="M12.1095 23.7364L11.4674 17.7L8.21753 17.0831C6.76022 16.807 5.55602 15.7759 5.04541 14.4063C4.8186 13.796 5.19333 13.1276 5.83323 12.9972C6.34055 12.8931 6.85006 13.1692 7.03962 13.6502C7.31903 14.3603 7.79129 14.8555 8.61308 15.0122C16.0881 16.4312 15.6323 16.3567 15.8514 16.3567C16.6984 16.3567 17.3887 15.7179 17.4742 14.8994C17.5585 14.0951 17.0523 13.3621 16.27 13.1561L11.5529 11.9124C11.176 11.8127 10.8845 11.5147 10.7947 11.1356L10.1559 8.44118C11.9638 8.11795 13.34 6.53792 13.34 4.64123C13.34 2.51224 11.6055 0.779907 9.47322 0.779907C6.78213 0.779907 4.89858 3.47866 5.85515 6.0043C3.43251 6.93018 1.58512 9.13368 1.26079 11.9124L0.00618758 22.691C-0.0617472 23.274 0.361202 23.801 0.946317 23.8613L10.9481 24.8978C11.6165 24.9669 12.1797 24.4037 12.1084 23.7375L12.1095 23.7364Z" fill="#FCFCFF" />
            <path d="M12.4738 27.164L10.1881 26.9274L8.24756 33.0755L8.64859 34.3761C8.9543 35.3655 9.85498 36.001 10.8422 36.001C12.2108 36.001 13.289 34.833 13.1432 33.4568L12.4738 27.164Z" fill="#FCFCFF" />
            <path d="M1.96405 26.0743L1.1302 33.4419C0.989951 34.6834 1.85009 35.7955 3.08935 35.9752C4.22781 36.1385 5.2797 35.4602 5.61718 34.3908C7.51607 28.3753 6.99998 30.009 8.04201 26.7054C5.72675 26.4655 7.04491 26.6024 1.96295 26.0754L1.96405 26.0743Z" fill="#FCFCFF" />
            <path d="M16.6642 27.5165L16.651 34.8907C16.651 35.4726 17.1222 35.9459 17.7062 35.947L21.8623 35.9536C22.3926 35.9536 22.8407 35.5613 22.9098 35.0365L23.9156 27.4212C23.4302 27.5242 23.8104 27.5056 16.6642 27.5165Z" fill="#FCFCFF" />
        </g>
    </svg>
);

const VolunteerIcon = () => (
    <svg width="36" height="37" viewBox="0 0 36 37" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6.49031 6.92297C5.53844 6.92297 4.72359 6.58406 4.04578 5.90625C3.36766 5.22844 3.02859 4.41359 3.02859 3.46172C3.02859 2.50984 3.36766 1.69484 4.04578 1.01672C4.72359 0.338906 5.53844 0 6.49031 0C7.44219 0 8.25703 0.338906 8.93484 1.01672C9.61297 1.69484 9.95203 2.50984 9.95203 3.46172C9.95203 4.41359 9.61297 5.22844 8.93484 5.90625C8.25703 6.58406 7.44219 6.92297 6.49031 6.92297ZM3.53344 34.9402V23.9062H1.69453C1.21453 23.9062 0.812031 23.7439 0.487031 23.4192C0.162343 23.0942 0 22.6917 0 22.2117V12.7645C0 11.8323 0.331875 11.0344 0.995625 10.3706C1.65937 9.70687 2.45734 9.375 3.38953 9.375H9.59109C10.5233 9.375 11.3212 9.70687 11.985 10.3706C12.6487 11.0344 12.9806 11.8323 12.9806 12.7645V16.9617C11.2162 18.0267 9.77156 19.5111 8.64656 21.4148C7.52156 23.3186 6.95906 25.4231 6.95906 27.7284C6.95906 29.3413 7.23609 30.8556 7.79016 32.2716C8.34422 33.6875 9.08875 34.8991 10.0238 35.9062V36.6347H5.22844C4.74813 36.6347 4.34563 36.4723 4.02094 36.1477C3.69594 35.8227 3.53344 35.4202 3.53344 34.9402ZM19.6514 36.6708C17.1898 36.6708 15.0841 35.7958 13.3341 34.0458C11.5841 32.2958 10.7091 30.19 10.7091 27.7284C10.7091 25.8509 11.2452 24.1586 12.3173 22.6514C13.3895 21.1442 14.8005 20.0602 16.5502 19.3992V22.4677C15.6223 23.0398 14.8856 23.7814 14.34 24.6923C13.7944 25.603 13.5216 26.615 13.5216 27.7284C13.5216 29.4472 14.1134 30.8986 15.2972 32.0827C16.4812 33.2664 17.9327 33.8583 19.6514 33.8583C21.262 33.8583 22.6653 33.3023 23.8613 32.1905C25.0572 31.0789 25.6911 29.6817 25.763 27.9989H28.5755C28.4795 30.4605 27.5755 32.5211 25.8633 34.1808C24.1511 35.8408 22.0805 36.6708 19.6514 36.6708ZM32.8847 30.9914L29.3114 25.6369C29.2511 25.5528 29.1819 25.4898 29.1038 25.448C29.0256 25.4058 28.9386 25.3847 28.8427 25.3847H22.5361C21.6039 25.3847 20.8059 25.0528 20.1422 24.3891C19.4784 23.7253 19.1466 22.9273 19.1466 21.9952V12.7284C19.1466 12.33 19.2814 11.9961 19.5511 11.7267C19.8208 11.457 20.1548 11.3222 20.5533 11.3222C20.952 11.3222 21.2859 11.457 21.555 11.7267C21.8244 11.9961 21.9591 12.33 21.9591 12.7284V21.9952C21.9591 22.1636 22.0131 22.3019 22.1213 22.41C22.2294 22.5181 22.3677 22.5722 22.5361 22.5722H28.8895C29.4533 22.5722 29.9891 22.7064 30.4969 22.9748C31.0044 23.243 31.4133 23.6172 31.7236 24.0975L35.25 29.4342C35.4591 29.7633 35.523 30.1169 35.4417 30.495C35.3602 30.8731 35.1567 31.1684 34.8314 31.3809C34.5023 31.59 34.1488 31.6594 33.7706 31.5891C33.3925 31.5188 33.0972 31.3195 32.8847 30.9914Z" fill="currentColor" />
    </svg>
);

const CareUIcon = () => (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M18 33.3l-2.61-2.376C8.72 24.648 4 20.196 4 14.7 4 10.14 7.56 6.6 12.15 6.6c2.61 0 5.115 1.215 6.75 3.135V6.6h2.25v3.135C22.785 7.815 25.29 6.6 27.9 6.6 32.49 6.6 36.05 10.14 36.05 14.7c0 5.496-4.72 9.948-11.39 16.224L18 33.3z" fill="currentColor" opacity="0.3" />
        <path d="M18 30.6l-2.175-1.98C9.6 22.92 5.4 19.08 5.4 14.4c0-3.78 2.97-6.75 6.75-6.75 2.145 0 4.2 1.005 5.55 2.565V7.65h1.8v2.565c1.35-1.56 3.405-2.565 5.55-2.565 3.78 0 6.75 2.97 6.75 6.75 0 4.68-4.2 8.52-10.425 14.22L18 30.6z" fill="currentColor" />
        <circle cx="11" cy="14" r="6" fill="currentColor" opacity="0.15" />
        <path d="M11 10.5C9.067 10.5 7.5 12.067 7.5 14s1.567 3.5 3.5 3.5 3.5-1.567 3.5-3.5-1.567-3.5-3.5-3.5z" fill="currentColor" />
        <path d="M6 23.5c0-2.5 3.33-3.75 5-3.75s5 1.25 5 3.75v.75H6v-.75z" fill="currentColor" />
    </svg>
);

export default function SelectRolePage() {
    const router = useRouter();
    const { user, loading, refreshUser } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [selectedRole, setSelectedRole] = useState<'USERS' | 'CAREGIVER' | 'DRIVE' | 'CAREU' | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [idCard, setIdCard] = useState('');
    const [phone, setPhone] = useState('');
    const [focusedField, setFocusedField] = useState<string | null>(null);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
            return;
        }

        if (!loading && user) {
            if (!user.role) {
                return;
            }

            if (user.role !== 'USERS' && user.role !== 'CAREGIVER') {
                const rolePathMap: Record<string, string> = {
                    DRIVE: '/volunteer/driver',
                    CAREU: '/volunteer/careu/home',
                    STAFF: '/staff/dashboard',
                    EXECUTIVE: '/staff/petition',
                    ADMIN: '/staff/dashboard',
                };
                router.push(rolePathMap[user.role] || '/');
                return;
            }

            const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
            const isIntentionalSwitch = searchParams?.get('switch') === 'true';

            if (!isIntentionalSwitch && user.phone && user.idCard) {
                if (user.role === 'USERS') {
                    router.push('/elderly/home');
                } else if (user.role === 'CAREGIVER') {
                    router.push('/caregiver/home');
                }
            }
        }
    }, [user, loading, router]);

    const handleSelectRoleCard = async (role: 'USERS' | 'CAREGIVER' | 'DRIVE' | 'CAREU') => {
        const isAllowed = (user?.role === role || user?.allowedRoles?.includes(role) || user?.role === 'ADMIN') && Boolean(user?.idCard) && Boolean(user?.phone);

        if (isAllowed) {
            setIsSubmitting(true);
            try {
                if (user?.role !== role) {
                    await fetch(`${getApiUrl()}/auth/switch-role`, {
                        method: 'POST',
                        credentials: 'include',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ role }),
                    });
                    await refreshUser();
                }

                const rolePathMap: Record<string, string> = {
                    DRIVE: '/volunteer/driver',
                    CAREU: '/volunteer/careu/home',
                    CAREGIVER: '/caregiver/home',
                    USERS: '/elderly/home',
                };
                router.push(rolePathMap[role] || '/');
                return;
            } catch (err) {
                console.error('Role switch error:', err);
            } finally {
                setIsSubmitting(false);
            }
        }

        handleOpenRoleModal(role);
    };

    const handleOpenRoleModal = (role: 'USERS' | 'CAREGIVER' | 'DRIVE' | 'CAREU') => {
        setSelectedRole(role);
        setIdCard('');
        setPhone('');
        setIsModalOpen(true);
    };

    const navigateToRegister = (
        roleToRegister: 'USERS' | 'CAREGIVER' | 'DRIVE' | 'CAREU' | null,
        idCardParam?: string,
        phoneParam?: string
    ) => {
        setIsModalOpen(false);
        const params = new URLSearchParams();
        if (idCardParam) params.append('idCard', idCardParam);
        if (phoneParam) params.append('phone', phoneParam);
        const q = params.toString() ? `?${params.toString()}` : '';

        if (roleToRegister === 'USERS') {
            router.push(`/elderly/register${q}`);
        } else if (roleToRegister === 'CAREGIVER') {
            router.push(`/caregiver/register${q}`);
        } else if (roleToRegister === 'DRIVE') {
            router.push(`/volunteer/driver/register${q}`);
        } else if (roleToRegister === 'CAREU') {
            router.push(`/volunteer/careu/register${q}`);
        }
    };

    const handleVerifySubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (idCard.length !== 13) {
            Swal.fire({
                icon: 'warning',
                title: 'ข้อมูลไม่ถูกต้อง',
                text: 'เลขบัตรประชาชนต้องมี 13 หลัก',
                confirmButtonColor: '#1E7D55',
            });
            return;
        }

        if (phone.length !== 10) {
            Swal.fire({
                icon: 'warning',
                title: 'ข้อมูลไม่ถูกต้อง',
                text: 'เบอร์โทรศัพท์ต้องมี 10 หลัก',
                confirmButtonColor: '#1E7D55',
            });
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch(`${getApiUrl()}/auth/verify-and-link`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ idCard, phone }),
            });

            const result = await response.json();

            if (result.success && result.matched) {
                await Swal.fire({
                    icon: 'success',
                    title: 'ยืนยันตัวตนสำเร็จ!',
                    html: `
                        <p style="margin-bottom: 8px;">พบข้อมูลที่ลงทะเบียนไว้ในระบบเทศบาล</p>
                        <p style="color: #666; font-size: 14px;">ระบบจะนำท่านเข้าสู่หน้าหลัก</p>
                    `,
                    confirmButtonColor: '#1E7D55',
                    timer: 2000,
                    showConfirmButton: false,
                });

                await refreshUser();
                setIsModalOpen(false);

                const finalRole = result.user?.role || selectedRole;
                if (finalRole === 'DRIVE') {
                    router.push('/volunteer/driver');
                } else if (finalRole === 'CAREU') {
                    router.push('/volunteer/careu/home');
                } else if (finalRole === 'CAREGIVER') {
                    router.push('/caregiver/home');
                } else {
                    router.push('/elderly/home');
                }
            } else {
                await Swal.fire({
                    icon: 'info',
                    title: 'ไม่พบข้อมูลเดิมในระบบ',
                    html: `
                        <p style="margin-bottom: 8px;">ไม่พบข้อมูลที่ตรงกับเลขบัตรประชาชนและเบอร์โทรนี้ในฐานข้อมูลเทศบาล</p>
                        <p style="color: #666; font-size: 14px;">ระบบจะนำท่านไปยังหน้าลงทะเบียนใหม่</p>
                    `,
                    confirmButtonColor: '#1E7D55',
                    confirmButtonText: 'ไปลงทะเบียน',
                });

                navigateToRegister(selectedRole, idCard, phone);
            }
        } catch (error) {
            console.error('Verify error:', error);
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง',
                confirmButtonColor: '#1E7D55',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSkipToRegister = () => {
        if (selectedRole) {
            navigateToRegister(selectedRole, idCard, phone);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="text-center">
                    <div className="relative w-16 h-16 mx-auto mb-4">
                        <div className="absolute inset-0 border-4 border-brand-primary/20 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-brand-primary rounded-full border-t-transparent animate-spin"></div>
                    </div>
                    <p className="text-xl font-medium text-gray-800">กำลังโหลด...</p>
                </div>
            </div>
        );
    }

    const roles = [
        {
            id: 'USERS' as const,
            title: 'ประชาชน / ผู้รับบริการ',
            description: 'สำหรับประชาชนทั่วไป ผู้สูงอายุ หรือผู้มีภาวะพึ่งพิง',
            icon: ElderlyIcon,
        },
        {
            id: 'CAREGIVER' as const,
            title: 'ผู้ดูแลประชาชน',
            description: 'สำหรับญาติ หรือผู้ดูแลที่ต้องการเรียกรถให้ผู้อื่น',
            icon: CaregiverIcon,
        },
        {
            id: 'DRIVE' as const,
            title: 'เจ้าหน้าที่รถ',
            description: 'สมัครเพื่อปฏิบัติหน้าที่ขับรถรับ-ส่ง',
            icon: VolunteerIcon,
        },
        {
            id: 'CAREU' as const,
            title: 'จิตอาสาแคร์ยู',
            description: 'สมัครเพื่อเป็นจิตอาสาแคร์ยูผู้ใช้บริการในวันนัดหมาย',
            icon: CareUIcon,
        },
    ];

    const currentSelectedRoleObj = roles.find(r => r.id === selectedRole);

    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 py-8 relative">
            <div className="text-center mb-8">
                <h1 className="text-2xl md:text-3xl font-medium text-brand-primary mb-2">
                    ใจส่งถึงบ้าน
                </h1>
                <p className="text-gray-500">
                    กรุณาเลือกประเภทประชาชนเพื่อสมัครเข้าใช้งานบริการ
                </p>
            </div>

            <div className="w-full max-w-md space-y-4">
                {roles.map((role) => (
                    <button
                        key={role.id}
                        onClick={() => handleSelectRoleCard(role.id)}
                        disabled={isSubmitting}
                        className="w-full flex items-center gap-4 p-4 bg-white border-2 border-brand-primary rounded-2xl hover:bg-brand-primary/5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                        <div className="flex-shrink-0 w-14 h-14 bg-brand-primary rounded-xl flex items-center justify-center text-white group-hover:opacity-90 transition-opacity">
                            <role.icon />
                        </div>

                        <div className="flex-1 text-left">
                            <h2 className="text-lg font-medium text-brand-primary">
                                {role.title}
                            </h2>
                            <p className="text-sm text-gray-500">
                                {role.description}
                            </p>
                        </div>
                    </button>
                ))}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-700 relative">
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1"
                        >
                            <X size={22} />
                        </button>

                        <div className="text-center mb-6 pt-2">
                            <div className="w-14 h-14 bg-brand-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                                <ShieldCheck size={32} className="text-brand-primary" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                ยืนยันตัวตน ({currentSelectedRoleObj?.title})
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                กรุณากรอกเลขบัตรประชาชนและเบอร์โทร เพื่อตรวจสอบข้อมูลที่เทศบาลบันทึกไว้
                            </p>
                        </div>

                        <form onSubmit={handleVerifySubmit} className="space-y-4">
                            <div>
                                <label className="flex items-center gap-2 text-sm font-semibold mb-1.5 text-gray-700 dark:text-gray-200">
                                    <IdCard size={16} className="text-brand-primary" />
                                    เลขประจำตัวประชาชน (13 หลัก)
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        value={idCard}
                                        onChange={(e) => setIdCard(e.target.value.replace(/\D/g, '').slice(0, 13))}
                                        onFocus={() => setFocusedField('id')}
                                        onBlur={() => setFocusedField(null)}
                                        placeholder="0-0000-00000-00-0"
                                        className={`w-full bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder:text-gray-400 px-4 py-3 rounded-xl text-lg font-medium border-2 transition-all outline-none ${
                                            focusedField === 'id'
                                                ? 'border-brand-primary ring-2 ring-brand-primary/10 bg-white'
                                                : 'border-gray-200 dark:border-gray-600'
                                        }`}
                                    />
                                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                                        {idCard.length}/13
                                    </span>
                                </div>
                            </div>

                            <div>
                                <label className="flex items-center gap-2 text-sm font-semibold mb-1.5 text-gray-700 dark:text-gray-200">
                                    <Smartphone size={16} className="text-brand-primary" />
                                    เบอร์โทรศัพท์มือถือ (10 หลัก)
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                        onFocus={() => setFocusedField('phone')}
                                        onBlur={() => setFocusedField(null)}
                                        placeholder="08X-XXX-XXXX"
                                        className={`w-full bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder:text-gray-400 px-4 py-3 rounded-xl text-lg font-medium border-2 transition-all outline-none ${
                                            focusedField === 'phone'
                                                ? 'border-brand-primary ring-2 ring-brand-primary/10 bg-white'
                                                : 'border-gray-200 dark:border-gray-600'
                                        }`}
                                    />
                                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                                        {phone.length}/10
                                    </span>
                                </div>
                            </div>

                            <div className="pt-3 space-y-2.5">
                                <button
                                    type="submit"
                                    disabled={isSubmitting || idCard.length !== 13 || phone.length !== 10}
                                    className={`w-full py-3.5 rounded-xl flex items-center justify-center gap-2 text-base font-bold text-white transition-all shadow-md ${
                                        isSubmitting || idCard.length !== 13 || phone.length !== 10
                                            ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed shadow-none'
                                            : 'bg-brand-primary hover:bg-brand-primary/90 active:scale-[0.98]'
                                    }`}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="animate-spin" size={18} />
                                            <span>กำลังตรวจสอบ...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>ตรวจสอบและยืนยันข้อมูล</span>
                                            <ChevronRight size={18} />
                                        </>
                                    )}
                                </button>

                                <button
                                    type="button"
                                    onClick={handleSkipToRegister}
                                    disabled={isSubmitting}
                                    className="w-full py-2.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors text-center font-medium"
                                >
                                    ยังไม่มีข้อมูลในระบบ? <span className="text-brand-primary font-bold underline">ลงทะเบียนใหม่</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isSubmitting && !isModalOpen && (
                <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="text-center">
                        <div className="relative w-16 h-16 mx-auto mb-4">
                            <div className="absolute inset-0 border-4 border-brand-primary/20 rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-brand-primary rounded-full border-t-transparent animate-spin"></div>
                        </div>
                        <p className="text-lg font-medium text-gray-700">กำลังดำเนินการ...</p>
                    </div>
                </div>
            )}
        </div>
    );
}
