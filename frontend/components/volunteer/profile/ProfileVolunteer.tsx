"use client";

import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { getApiUrl } from '@/lib/api';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import HeaderVolunteer from '../header/HeaderVolunteer';
import { VolunteerSidebar } from '../sidebar';
import Image from 'next/image';
import Swal from '@/lib/swal';
import { getImageUrl } from '@/utils/image';
import ImageSourcePicker from '@/components/shared/ImageSourcePicker';
import ThaiDatePicker from '@/components/shared/ThaiDatePicker';
import type { AddressComponents } from '@/components/maps/MapPicker';
import { useUserData } from '../hooks';

const MapPicker = dynamic(() => import('@/components/maps/MapPicker'), { ssr: false });


const THAI_MONTHS = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

function formatThaiDate(dateStr?: string): string {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '-';
    return `${d.getDate()} ${THAI_MONTHS[d.getMonth()]} ${d.getFullYear() + 543}`;
}

export default function ProfileVolunteer() {
    const router = useRouter();
    const { userData, loading: userLoading } = useUserData();

    const [isEditing, setIsEditing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [profileImage, setProfileImage] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>('');
    const [showImagePicker, setShowImagePicker] = useState(false);
    const [imageError, setImageError] = useState(false);

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showMapPicker, setShowMapPicker] = useState(false);
    const [showIdCard, setShowIdCard] = useState(false);
    const [showPhone, setShowPhone] = useState(false);

    const [formData, setFormData] = useState({
        citizenId: '', firstName: '', lastName: '', phone: '',
        gender: 'male', birthDate: '', address: '',
        lat: null as number | null, lng: null as number | null,
    });

    const [initialData, setInitialData] = useState(formData);

    useEffect(() => {
        if (userData) {
            setImageError(false);
            setPreviewUrl('');

            const formatDateForInput = (dateString?: string) => {
                if (!dateString) return '';
                const date = new Date(dateString);
                return date.toISOString().split('T')[0];
            };

            const buildAddress = () => {
                const parts = [];
                if (userData.addressDetail) parts.push(userData.addressDetail);
                if (userData.houseNo) parts.push(`${userData.houseNo}`);
                if (userData.road) parts.push(`ถ.${userData.road}`);
                if (userData.neighbourhood) parts.push(userData.neighbourhood);
                if (userData.villageName) parts.push(userData.villageName);
                if (userData.subdistrictName) parts.push(`ต.${userData.subdistrictName}`);
                if (userData.districtName) parts.push(`อ.${userData.districtName}`);
                if (userData.provinceName) parts.push(`จ.${userData.provinceName}`);
                if (userData.postalCode) parts.push(userData.postalCode);

                return parts.filter(Boolean).length > 0 ? parts.filter(Boolean).join(' ') : '';
            };

            const normalizedData = {
                citizenId: userData.idCard || '',
                firstName: userData.firstName || '',
                lastName: userData.lastName || '',
                phone: userData.phone || '',
                gender: userData.gender || 'male',
                birthDate: formatDateForInput(userData.birthDate),
                address: buildAddress() || (typeof userData.addressDetail === 'string' ? userData.addressDetail : ''),
                lat: userData.lat != null ? Number(userData.lat) as number : null,
                lng: userData.lng != null ? Number(userData.lng) as number : null,
            };
            setFormData(normalizedData);
            setInitialData(normalizedData);
        }
    }, [userData]);

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFieldChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleGenderChange = (g: 'male' | 'female') => {
        setFormData(prev => ({ ...prev, gender: g }));
    };

    const handleImagePicked = (file: File) => {
        setProfileImage(file);
        setImageError(false);
        const reader = new FileReader();
        reader.onloadend = () => setPreviewUrl(reader.result as string);
        reader.readAsDataURL(file);
    };

    const handleCancel = () => {
        setFormData(initialData);
        setPreviewUrl('');
        setProfileImage(null);
        setIsEditing(false);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        if (formData.citizenId.length !== 13) {
            Swal.fire({ icon: 'warning', title: 'ข้อมูลไม่ถูกต้อง', text: 'เลขบัตรประชาชนต้องมี 13 หลัก', confirmButtonColor: '#1E7D55' });
            return;
        }

        if (formData.phone.length !== 10) {
            Swal.fire({ icon: 'warning', title: 'ข้อมูลไม่ถูกต้อง', text: 'เบอร์โทรศัพท์ต้องมี 10 หลัก', confirmButtonColor: '#1E7D55' });
            return;
        }

        setIsSubmitting(true);

        try {
            let newPictureUrl: string | undefined = undefined;
            if (profileImage) {
                const fd = new FormData();
                fd.append('file', profileImage);
                const uploadRes = await fetch(`${getApiUrl()}/upload`, { method: 'POST', credentials: 'include', body: fd });
                if (uploadRes.ok) {
                    const uploadData = await uploadRes.json();
                    newPictureUrl = uploadData.url;
                }
            }

            const requestedChanges: Record<string, any> = {};

            if (formData.firstName !== initialData.firstName) requestedChanges.firstName = formData.firstName;
            if (formData.lastName !== initialData.lastName) requestedChanges.lastName = formData.lastName;
            if (formData.citizenId !== initialData.citizenId) requestedChanges.idCard = formData.citizenId || null;
            if (formData.phone !== initialData.phone) requestedChanges.phone = formData.phone;
            if (formData.gender !== initialData.gender) requestedChanges.gender = formData.gender;

            if (formData.birthDate !== initialData.birthDate) {
                requestedChanges.birthDate = formData.birthDate || null;
            }

            if (formData.address !== initialData.address) requestedChanges.addressDetail = formData.address || null;

            if (formData.lat !== initialData.lat) requestedChanges.lat = formData.lat;
            if (formData.lng !== initialData.lng) requestedChanges.lng = formData.lng;

            if (Object.keys(requestedChanges).length === 0 && !newPictureUrl) {
                Swal.fire({ icon: 'info', title: 'ไม่มีการเปลี่ยนแปลง', text: 'ข้อมูลของคุณยังไม่มีการเปลี่ยนแปลง', confirmButtonColor: '#1E7D55' });
                setIsSubmitting(false);
                return;
            }

            const response = await fetch(`${getApiUrl()}/profile-edit-requests`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ requestedChanges, newPictureUrl }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'ไม่สามารถส่งคำร้องได้');
            }

            await Swal.fire({
                icon: 'success',
                title: 'ส่งคำร้องสำเร็จ',
                text: 'ส่งคำร้องขอแก้ไขข้อมูลสำเร็จ! กรุณารอเจ้าหน้าที่ตรวจสอบ',
                confirmButtonColor: '#1E7D55',
            });

            setIsEditing(false);

        } catch (error: any) {
            Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: error.message || 'ไม่สามารถส่งคำร้องได้ กรุณาลองใหม่อีกครั้ง', confirmButtonColor: '#1E7D55' });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (userLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center text-emerald-700 font-bold text-lg animate-pulse bg-white dark:bg-gray-900">
                กำลังโหลดข้อมูลโปรไฟล์...
            </div>
        );
    }

    const displayName = `${formData.firstName} ${formData.lastName}`.trim() || userData?.displayName || 'ประชาชน';
    const avatarUrl = previewUrl || (userData?.pictureUrl && !imageError ? getImageUrl(userData.pictureUrl) : null);
    const avatarInitial = (formData.firstName || displayName || 'U').charAt(0);

    const InfoRow = ({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) => (
        <div className="flex items-start gap-3 py-3">
            <div className="w-9 h-9 rounded-lg bg-brand-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                {icon}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">{label}</p>
                <p className="text-sm font-semibold text-gray-800 dark:text-white mt-0.5 break-words">{value || '-'}</p>
            </div>
        </div>
    );

    const inputCls = "w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:ring-1 focus:ring-brand-primary focus:border-brand-primary transition-colors text-gray-800 dark:text-white";
    const labelCls = "block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5";

    return (
        <div className="min-h-[100dvh] h-[100dvh] overflow-y-auto overflow-x-hidden bg-[#F5F5F5] dark:bg-gray-900 font-sans pb-24">
            <VolunteerSidebar user={null} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div className="bg-gradient-to-bl from-[#3AAE7D] to-[#346D55] dark:from-slate-800 dark:to-slate-900 text-white">
                <HeaderVolunteer onToggleSidebar={() => setSidebarOpen(true)} />
            </div>

            <div className="px-4 mt-8 max-w-md mx-auto space-y-4">

                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col items-center">
                    <div className="relative">
                        <div className="w-24 h-24 rounded-full bg-[#E8F3EF] overflow-hidden flex items-center justify-center text-3xl font-bold text-[#1E7D55] shadow-inner">
                            {avatarUrl ? (
                                <Image
                                    src={avatarUrl}
                                    alt="profile"
                                    fill
                                    className="object-cover object-center"
                                    style={{ borderRadius: '50%' }}
                                    unoptimized
                                    onError={() => setImageError(true)}
                                />
                            ) : (
                                avatarInitial
                            )}
                        </div>
                        {isEditing && (
                            <button
                                type="button"
                                onClick={() => setShowImagePicker(true)}
                                className="absolute -bottom-1 -right-1 p-2 bg-brand-primary text-white rounded-full shadow-lg hover:bg-brand-primary/90 transition-transform active:scale-90 z-10"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                            </button>
                        )}
                    </div>
                    <h2 className="text-lg font-bold text-gray-800 dark:text-white mt-3">{displayName}</h2>
                    <span className="mt-1 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#E8F3EF] text-[#1E7D55] text-xs font-bold">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                        </svg>
                        เจ้าหน้าที่ขับรถ
                    </span>

                    {userData?.pointsBreakdown && (
                        <div className="mt-3 w-full grid grid-cols-3 gap-2">
                            <div className="flex flex-col items-center gap-1 px-2 py-2.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                                <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                                <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{userData.pointsBreakdown.volunteer}</span>
                                <span className="text-[10px] font-medium text-emerald-600/80 dark:text-emerald-400/70">จิตอาสา</span>
                            </div>
                            <div className="flex flex-col items-center gap-1 px-2 py-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                                <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" /></svg>
                                <span className="text-sm font-bold text-blue-700 dark:text-blue-400">{userData.pointsBreakdown.driver}</span>
                                <span className="text-[10px] font-medium text-blue-600/80 dark:text-blue-400/70">คนขับ</span>
                            </div>
                            <div className="flex flex-col items-center gap-1 px-2 py-2.5 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                                <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                                <span className="text-sm font-bold text-purple-700 dark:text-purple-400">{userData.pointsBreakdown.careu}</span>
                                <span className="text-[10px] font-medium text-purple-600/80 dark:text-purple-400/70">แคร์ยู</span>
                            </div>
                        </div>
                    )}
                </div>

                {!isEditing && (
                    <>
                        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                            <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                                <h3 className="text-sm font-bold text-gray-800 dark:text-white">ข้อมูลส่วนตัว</h3>
                            </div>
                            <div className="px-5 divide-y divide-gray-100 dark:divide-gray-700">
                                <div className="flex items-start gap-3 py-3 cursor-pointer" onClick={() => setShowIdCard(!showIdCard)}>
                                    <div className="w-9 h-9 rounded-lg bg-brand-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                                        <svg className="w-4 h-4 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /></svg>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">เลขบัตรประชาชน</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <p className="text-sm font-semibold text-gray-800 dark:text-white break-words">
                                                {formData.citizenId
                                                    ? showIdCard
                                                        ? formData.citizenId.replace(/(\d{1})(\d{4})(\d{5})(\d{2})(\d{1})/, '$1-$2-$3-$4-$5')
                                                        : `${'•'.repeat(9)}${formData.citizenId.slice(-4)}`
                                                    : '-'}
                                            </p>
                                            {formData.citizenId && (
                                                <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    {showIdCard ? (
                                                        <><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></>
                                                    ) : (
                                                        <><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></>
                                                    )}
                                                </svg>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <InfoRow
                                    label="เพศ"
                                    value={formData.gender === 'male' ? 'ชาย' : formData.gender === 'female' ? 'หญิง' : '-'}
                                    icon={<svg className="w-4 h-4 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
                                />
                                <div className="flex items-start gap-3 py-3 cursor-pointer" onClick={() => setShowPhone(!showPhone)}>
                                    <div className="w-9 h-9 rounded-lg bg-brand-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                                        <svg className="w-4 h-4 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">เบอร์โทรศัพท์</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <p className="text-sm font-semibold text-gray-800 dark:text-white">
                                                {formData.phone
                                                    ? showPhone
                                                        ? formData.phone
                                                        : `${'•'.repeat(6)}${formData.phone.slice(-4)}`
                                                    : '-'}
                                            </p>
                                            {formData.phone && (
                                                <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    {showPhone ? (
                                                        <><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></>
                                                    ) : (
                                                        <><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></>
                                                    )}
                                                </svg>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <InfoRow
                                    label="วันเกิด"
                                    value={formatThaiDate(formData.birthDate)}
                                    icon={<svg className="w-4 h-4 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>}
                                />
                                <InfoRow
                                    label="ที่อยู่"
                                    value={formData.address || '-'}
                                    icon={<svg className="w-4 h-4 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                                />
                            </div>
                        </div>

                        <button
                            onClick={() => setIsEditing(true)}
                            className="w-full py-3 rounded-xl bg-brand-primary text-white font-bold text-sm hover:bg-brand-primary/90 active:scale-[0.98] transition-all shadow-sm flex items-center justify-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                            ขอแก้ไขข้อมูล
                        </button>
                    </>
                )}

                {isEditing && (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-3 flex items-start gap-2.5">
                            <svg className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                                แก้ไขข้อมูลที่ต้องการด้านล่าง เมื่อกดส่งคำร้อง ข้อมูลจะถูกส่งไปให้เจ้าหน้าที่เทศบาลตรวจสอบและอนุมัติ
                            </p>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5 space-y-4">

                            <div>
                                <label htmlFor="citizenId" className={labelCls}>เลขบัตรประชาชน</label>
                                <input type="text" id="citizenId" name="citizenId" value={formData.citizenId} onChange={(e) => handleFieldChange('citizenId', e.target.value.replace(/\D/g, ''))} className={inputCls} placeholder="ระบุเลข 13 หลัก" maxLength={13} required />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label htmlFor="firstName" className={labelCls}>ชื่อ</label>
                                    <input type="text" id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} className={inputCls} placeholder="ชื่อจริง" maxLength={50} required />
                                </div>
                                <div>
                                    <label htmlFor="lastName" className={labelCls}>นามสกุล</label>
                                    <input type="text" id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} className={inputCls} placeholder="นามสกุล" maxLength={50} required />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="phone" className={labelCls}>เบอร์โทรศัพท์ <span className="text-red-500">*</span></label>
                                <input type="tel" id="phone" name="phone" value={formData.phone} onChange={(e) => handleFieldChange('phone', e.target.value.replace(/\D/g, ''))} className={inputCls} placeholder="08XXXXXXXX" maxLength={10} required />
                            </div>

                            <div>
                                <span className={labelCls}>เพศ</span>
                                <div className="flex gap-3 mt-1">
                                    {(['male', 'female'] as const).map(g => (
                                        <button
                                            key={g}
                                            type="button"
                                            onClick={() => handleGenderChange(g)}
                                            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all ${formData.gender === g
                                                ? 'bg-brand-primary text-white border-brand-primary'
                                                : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600'
                                                }`}
                                        >
                                            {g === 'male' ? 'ชาย' : 'หญิง'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label htmlFor="dateOfBirth" className={labelCls}>วันเดือนปีเกิด</label>
                                <ThaiDatePicker
                                    value={formData.birthDate}
                                    onChange={(value) => handleFieldChange('birthDate', value)}
                                />
                            </div>

                            <div>
                                <label htmlFor="address" className={labelCls}>ที่อยู่</label>
                                <textarea id="address" name="address" value={formData.address} onChange={handleChange} rows={3} className={`${inputCls} resize-y`} placeholder="บ้านเลขที่, ถนน, ตำบล, อำเภอ, จังหวัด" maxLength={255} />
                            </div>

                            <div>
                                <label className={labelCls}>ตำแหน่งบนแผนที่</label>
                                <button
                                    type="button"
                                    onClick={() => setShowMapPicker(true)}
                                    className="w-full flex items-center gap-3 px-3.5 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl hover:border-brand-primary hover:bg-emerald-50 dark:hover:bg-gray-600 transition-colors"
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-primary shrink-0">
                                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                        <circle cx="12" cy="10" r="3" />
                                    </svg>
                                    {formData.lat && formData.lng ? (
                                        <span className="text-sm text-gray-800 dark:text-white">📍 {formData.lat.toFixed(6)}, {formData.lng.toFixed(6)}</span>
                                    ) : (
                                        <span className="text-sm text-gray-400">กดเพื่อปักหมุดตำแหน่งที่อยู่</span>
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="flex-1 py-3 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold text-sm border border-gray-300 dark:border-gray-600 hover:bg-gray-300 dark:hover:bg-gray-600 active:scale-[0.98] transition-all"
                            >
                                ยกเลิก
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex-1 py-3 rounded-xl bg-brand-primary text-white font-bold text-sm hover:bg-brand-primary/90 active:scale-[0.98] transition-all shadow-sm disabled:opacity-60 flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? (
                                    <>
                                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                                        กำลังส่ง...
                                    </>
                                ) : (
                                    <>
                                        ส่งคำร้องแก้ไข
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                )}

            </div>

            <ImageSourcePicker
                isOpen={showImagePicker}
                onClose={() => setShowImagePicker(false)}
                onImageSelected={handleImagePicked}
            />

            {showMapPicker && (
                <MapPicker
                    initialLat={formData.lat ?? undefined}
                    initialLng={formData.lng ?? undefined}
                    onConfirm={(lat, lng, addressComponents) => {
                        setFormData(prev => ({ ...prev, lat, lng }));
                        if (addressComponents) {
                            const parts = [];
                            if (addressComponents.houseNo) parts.push(addressComponents.houseNo);
                            if (addressComponents.road) parts.push(`ถ.${addressComponents.road}`);
                            if (addressComponents.villageName) parts.push(addressComponents.villageName);
                            if (addressComponents.subdistrictName) parts.push(`ต.${addressComponents.subdistrictName}`);
                            if (addressComponents.districtName) parts.push(`อ.${addressComponents.districtName}`);
                            if (addressComponents.provinceName) parts.push(`จ.${addressComponents.provinceName}`);
                            if (addressComponents.postalCode) parts.push(addressComponents.postalCode);

                            const formatted = parts.join(' ');
                            if (formatted) {
                                setFormData(prev => ({ ...prev, address: formatted }));
                            }
                        }
                    }}
                    onClose={() => setShowMapPicker(false)}
                />
            )}
        </div>
    );
}
