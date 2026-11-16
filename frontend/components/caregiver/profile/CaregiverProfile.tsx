"use client";

import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { getApiUrl } from '@/lib/api';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { User } from '../types';
import CaregiverHeader from '../header/CaregiverHeader';
import CaregiverSidebar from '../sidebar/CaregiverSidebar';
import Image from 'next/image';
import Swal from '@/lib/swal';
import { getImageUrl } from '@/utils/image';
import ImageSourcePicker from '@/components/shared/ImageSourcePicker';
import ThaiDatePicker from '@/components/shared/ThaiDatePicker';
import type { AddressComponents } from '@/components/maps/MapPicker';

const MapPicker = dynamic(() => import('@/components/maps/MapPicker'), { ssr: false });


interface CaregiverProfileProps {
    user: User | null;
}

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

export default function CaregiverProfile({ user }: CaregiverProfileProps) {
    const router = useRouter();
    const [currentUser, setCurrentUser] = useState<User | null>(user);
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [profileImage, setProfileImage] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>('');
    const [showImagePicker, setShowImagePicker] = useState(false);
    const [imageError, setImageError] = useState(false);

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showMapPicker, setShowMapPicker] = useState(false);
    const [showIdCard, setShowIdCard] = useState(false);
    const [showPhone, setShowPhone] = useState(false);

    const getAddressString = (addr: any): string => {
        if (!addr) return '';
        if (typeof addr === 'string') return addr;

        const parts = [];
        if (addr.addressDetail) parts.push(addr.addressDetail);
        if (addr.placeName) parts.push(addr.placeName);
        if (addr.houseNo) parts.push(`${addr.houseNo}`);
        if (addr.road) parts.push(`ถ.${addr.road}`);
        if (addr.neighbourhood) parts.push(addr.neighbourhood);
        if (addr.villageName) parts.push(addr.villageName);
        if (addr.subdistrictName) parts.push(`ต.${addr.subdistrictName}`);
        if (addr.districtName) parts.push(`อ.${addr.districtName}`);
        if (addr.provinceName) parts.push(`จ.${addr.provinceName}`);
        if (addr.postalCode) parts.push(addr.postalCode);
        if (addr.country && addr.country !== 'ประเทศไทย') parts.push(addr.country);

        if (parts.length > 0) {
            return parts.join(' ');
        }
        return '';
    };

    const [formData, setFormData] = useState({
        firstName: '', lastName: '', idCard: '', phone: '',
        gender: 'male', medicalConditions: '', mobilityStatus: 'WALKING', birthDate: '',
        addressDetail: '', placeName: '', houseNo: '', road: '', neighbourhood: '',
        villageName: '', subdistrictName: '', districtName: '', provinceName: '', postalCode: '', country: '',
        address: '', lat: null as number | null, lng: null as number | null,
    });

    const [initialData, setInitialData] = useState(formData);

    useEffect(() => {
        if (user) {
            setCurrentUser(user);
            setImageError(false);
            setPreviewUrl('');

            const normalizedData = {
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                idCard: user.idCard || '',
                phone: user.phone || '',
                gender: user.gender || 'male',
                medicalConditions: user.allDiseases?.filter((d: any) => d.type === 'custom').map((d: any) => d.name).join(', ') || '',
                mobilityStatus: user.mobilityStatus || 'WALKING',
                birthDate: user.birthDate ? new Date(user.birthDate).toISOString().split('T')[0] : '',
                addressDetail: user.addressDetail || '',
                placeName: user.placeName || '',
                houseNo: user.houseNo || '',
                road: user.road || '',
                neighbourhood: user.neighbourhood || '',
                villageName: user.villageName || '',
                subdistrictName: user.subdistrictName || '',
                districtName: user.districtName || '',
                provinceName: user.provinceName || '',
                postalCode: user.postalCode || '',
                country: user.country || '',
                address: getAddressString(user),
                lat: user.lat ? Number(user.lat) : null,
                lng: user.lng ? Number(user.lng) : null,
            };
            setFormData(normalizedData);
            setInitialData(normalizedData);
        }
    }, [user]);

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

        if (!formData.idCard || formData.idCard.length !== 13) {
            Swal.fire({ icon: 'warning', title: 'ข้อมูลไม่ครบถ้วน', text: 'กรุณากรอกเลขบัตรประชาชนให้ครบ 13 หลัก', confirmButtonColor: '#1E7D55' });
            return;
        }

        if (!formData.phone || formData.phone.length !== 10) {
            Swal.fire({ icon: 'warning', title: 'ข้อมูลไม่ครบถ้วน', text: 'กรุณากรอกเบอร์โทรศัพท์ให้ครบ 10 หลัก', confirmButtonColor: '#1E7D55' });
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
            if (formData.idCard !== initialData.idCard) requestedChanges.idCard = formData.idCard || null;
            if (formData.phone !== initialData.phone) requestedChanges.phone = formData.phone;
            if (formData.gender !== initialData.gender) requestedChanges.gender = formData.gender;

            if (formData.medicalConditions !== initialData.medicalConditions) {
                const customDiseases = formData.medicalConditions
                    .split(',')
                    .map(s => s.trim())
                    .filter(s => s.length > 0);
                requestedChanges.customDiseases = customDiseases;
            }

            if (formData.mobilityStatus !== initialData.mobilityStatus) requestedChanges.mobilityStatus = formData.mobilityStatus;

            if (formData.birthDate !== initialData.birthDate) {
                requestedChanges.birthDate = formData.birthDate || null;
            }

            if (formData.addressDetail !== initialData.addressDetail) requestedChanges.addressDetail = formData.addressDetail || null;
            if (formData.placeName !== initialData.placeName) requestedChanges.placeName = formData.placeName || null;
            if (formData.houseNo !== initialData.houseNo) requestedChanges.houseNo = formData.houseNo || null;
            if (formData.road !== initialData.road) requestedChanges.road = formData.road || null;
            if (formData.neighbourhood !== initialData.neighbourhood) requestedChanges.neighbourhood = formData.neighbourhood || null;
            if (formData.villageName !== initialData.villageName) requestedChanges.villageName = formData.villageName || null;
            if (formData.subdistrictName !== initialData.subdistrictName) requestedChanges.subdistrictName = formData.subdistrictName || null;
            if (formData.districtName !== initialData.districtName) requestedChanges.districtName = formData.districtName || null;
            if (formData.provinceName !== initialData.provinceName) requestedChanges.provinceName = formData.provinceName || null;
            if (formData.postalCode !== initialData.postalCode) requestedChanges.postalCode = formData.postalCode || null;
            if (formData.country !== initialData.country) requestedChanges.country = formData.country || null;

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
                text: 'คำร้องขอแก้ไขข้อมูลถูกส่งไปยังเทศบาลแล้ว กรุณารอเจ้าหน้าที่ตรวจสอบและอนุมัติ',
                confirmButtonColor: '#1E7D55',
            });

            setIsEditing(false);

        } catch (error: any) {
            Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: error.message || 'ไม่สามารถส่งคำร้องได้ กรุณาลองใหม่อีกครั้ง', confirmButtonColor: '#1E7D55' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const displayName = `${formData.firstName} ${formData.lastName}`.trim() || currentUser?.displayName || 'ประชาชน';
    const avatarUrl = previewUrl || (currentUser?.pictureUrl && !imageError ? getImageUrl(currentUser.pictureUrl) : null);
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
            <CaregiverSidebar user={currentUser} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div className="bg-gradient-to-bl from-[#3AAE7D] to-[#346D55] dark:from-slate-800 dark:to-slate-900 text-white">
                <CaregiverHeader user={currentUser} variant="default" onToggleSidebar={() => setSidebarOpen(true)} />
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
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                        ผู้ดูแลประชาชน
                    </span>
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
                                                {formData.idCard
                                                    ? showIdCard
                                                        ? formData.idCard.replace(/(\d{1})(\d{4})(\d{5})(\d{2})(\d{1})/, '$1-$2-$3-$4-$5')
                                                        : `${'•'.repeat(9)}${formData.idCard.slice(-4)}`
                                                    : '-'}
                                            </p>
                                            {formData.idCard && (
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
                                    label="โรคประจำตัว"
                                    value={formData.medicalConditions || '-'}
                                    icon={<svg className="w-4 h-4 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>}
                                />
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
                                <InfoRow
                                    label="รายละเอียดที่อยู่"
                                    value={formData.addressDetail || '-'}
                                    icon={<svg className="w-4 h-4 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" /></svg>}
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

                        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-3 flex items-start gap-2.5">
                            <svg className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                                การแก้ไขข้อมูลจะต้องได้รับการตรวจสอบและอนุมัติจากเจ้าหน้าที่เทศบาลก่อนจึงจะมีผล
                            </p>
                        </div>
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
                                <label htmlFor="idCard" className={labelCls}>เลขบัตรประชาชน</label>
                                <input type="text" id="idCard" name="idCard" value={formData.idCard} onChange={(e) => handleFieldChange('idCard', e.target.value.replace(/\D/g, ''))} className={inputCls} placeholder="ระบุเลข 13 หลัก" maxLength={13} />
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
                                <label htmlFor="mobilityStatus" className={labelCls}>สถานะประชาชน</label>
                                <select
                                    id="mobilityStatus"
                                    name="mobilityStatus"
                                    value={formData.mobilityStatus}
                                    onChange={handleChange}
                                    className={`${inputCls} appearance-none`}
                                    style={{
                                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%23666' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round'/%3E%3C/svg%3E")`,
                                        backgroundRepeat: 'no-repeat',
                                        backgroundPosition: 'right 1rem center'
                                    }}
                                >
                                    <option value="WALKING">ทั่วไป</option>
                                    <option value="WHEELCHAIR">ต้องดูแลเพิ่ม</option>
                                    <option value="BEDRIDDEN">ต้องดูแลใกล้ชิด</option>
                                </select>
                            </div>

                            <div>
                                <label htmlFor="medicalConditions" className={labelCls}>โรคประจำตัว (คั่นด้วยลูกน้ำหากมีหลายโรค)</label>
                                <input type="text" id="medicalConditions" name="medicalConditions" value={formData.medicalConditions} onChange={handleChange} className={inputCls} placeholder="เช่น ความดันโลหิตสูง, เบาหวาน" />
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
                                <textarea id="address" name="address" value={formData.addressDetail} onChange={(e) => handleFieldChange('addressDetail', e.target.value)} rows={3} className={`${inputCls} resize-y`} placeholder="บ้านเลขที่, ถนน, ตำบล, อำเภอ, จังหวัด" maxLength={255} />
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

                            if (addressComponents.placeName) handleFieldChange('placeName', addressComponents.placeName);
                            if (addressComponents.houseNo) handleFieldChange('houseNo', addressComponents.houseNo);
                            if (addressComponents.road) handleFieldChange('road', addressComponents.road);
                            if (addressComponents.neighbourhood) handleFieldChange('neighbourhood', addressComponents.neighbourhood);
                            if (addressComponents.villageName) handleFieldChange('villageName', addressComponents.villageName);
                            if (addressComponents.subdistrictName) handleFieldChange('subdistrictName', addressComponents.subdistrictName);
                            if (addressComponents.districtName) handleFieldChange('districtName', addressComponents.districtName);
                            if (addressComponents.provinceName) handleFieldChange('provinceName', addressComponents.provinceName);
                            if (addressComponents.postalCode) handleFieldChange('postalCode', addressComponents.postalCode);
                            if (addressComponents.country) handleFieldChange('country', addressComponents.country);

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
