"use client";

import { useState, useEffect } from 'react';
import { getApiUrl } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { User } from '../types';
import CaregiverHeader from '../header/CaregiverHeader';
import CaregiverSidebar from '../sidebar/CaregiverSidebar';
import Image from 'next/image';
import Swal from '@/lib/swal';
import dynamic from 'next/dynamic';
import { getImageUrl } from '@/utils/image';
import ImageSourcePicker from '@/components/shared/ImageSourcePicker';
import ThaiDatePicker from '@/components/shared/ThaiDatePicker';

const MapPicker = dynamic(
    () => import('@/components/maps/MapPicker'),
    {
        ssr: false,
        loading: () => (
            <div className="fixed inset-0 z-[9999] bg-field-default flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
            </div>
        )
    }
);

interface CaregiverProfileEditProps {
    user: User | null;
    onUpdate?: (updatedUser: User) => void;
}

export default function CaregiverProfileEdit({ user, onUpdate }: CaregiverProfileEditProps) {
    const router = useRouter();
        const [isLoading, setIsLoading] = useState(false);
    const [currentUser, setCurrentUser] = useState<User | null>(user);
    const [profileImage, setProfileImage] = useState<File | null>(null);
    const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
    const [showMap, setShowMap] = useState(false);
    const [showImagePicker, setShowImagePicker] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const getAddressString = (addr: any): string => {
        if (!addr) return '';
        if (typeof addr === 'string') return addr;

        const parts = [];
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
            return parts.join(', ');
        }
        return '';
    };

    const [formData, setFormData] = useState({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        idCard: user?.idCard || '',
        phone: user?.phone || '',
        gender: user?.gender || 'male',
        medicalConditions: user?.allDiseases?.filter(d => d.type === 'custom').map(d => d.name).join(', ') || '',
        mobilityStatus: user?.mobilityStatus || 'WALKING',
        birthDate: user?.birthDate || '',
        addressDetail: user?.addressDetail || '',
        placeName: user?.placeName || '',
        houseNo: user?.houseNo || '',
        road: user?.road || '',
        neighbourhood: user?.neighbourhood || '',
        villageName: user?.villageName || '',
        subdistrictName: user?.subdistrictName || '',
        districtName: user?.districtName || '',
        provinceName: user?.provinceName || '',
        postalCode: user?.postalCode || '',
        country: user?.country || '',
        address: user ? getAddressString(user) : '',
        lat: user?.lat?.toString() || '',
        lng: user?.lng?.toString() || '',
    });

    const [initialData, setInitialData] = useState(formData);

    useEffect(() => {
        if (user) {
            setCurrentUser(user);
            const normalizedData = {
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                idCard: user.idCard || '',
                phone: user.phone || '',
                gender: user.gender || 'male',
                medicalConditions: user.allDiseases?.filter(d => d.type === 'custom').map(d => d.name).join(', ') || '',
                mobilityStatus: user.mobilityStatus || 'WALKING',
                birthDate: user.birthDate || '',
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
                lat: user.lat?.toString() || '',
                lng: user.lng?.toString() || '',
            };
            setFormData(normalizedData);
            setInitialData(normalizedData);
        }
    }, [user]);


    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const MAX_SIZE = 10 * 1024 * 1024;

            if (file.size > MAX_SIZE) {
                Swal.fire({
                    icon: 'warning',
                    title: 'ไฟล์ใหญ่เกินไป',
                    text: `ขนาดไฟล์ ${(file.size / 1024 / 1024).toFixed(1)}MB เกินขนาดสูงสุดที่กำหนด (10MB) กรุณาเลือกไฟล์ที่เล็กกว่า`,
                    confirmButtonColor: '#1E7D55',
                });
                e.target.value = '';
                return;
            }

            setProfileImage(file);

            const reader = new FileReader();
            reader.onloadend = () => {
                setProfileImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleImageClick = () => {
        setShowImagePicker(true);
    };

    const handleImagePicked = (file: File) => {
        setProfileImage(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setProfileImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleLocationPick = () => {
        setShowMap(true);
    };

    interface AddressComponents {
        placeName?: string;
        houseNo?: string;
        road?: string;
        neighbourhood?: string;
        villageName?: string;
        subdistrictName?: string;
        districtName?: string;
        provinceName?: string;
        postalCode?: string;
        country?: string;
    }

    const handleConfirmLocation = (lat: number, lng: number, addressComponents: AddressComponents) => {
        const addressString = getAddressString(addressComponents);
        setFormData(prev => ({
            ...prev,
            ...addressComponents,
            address: addressString,
            lat: lat.toString(),
            lng: lng.toString(),
        }));
        setShowMap(false);
    };

    const parseCoordinates = (lat: string, lng: string) => {
        const latNum = parseFloat(lat);
        const lngNum = parseFloat(lng);
        if (isNaN(latNum) || isNaN(lngNum)) return null;
        return { lat: latNum, lng: lngNum };
    };

    const handleSubmit = async () => {
        if (!formData.idCard || formData.idCard.length !== 13) {
            await Swal.fire({
                icon: 'warning',
                title: 'ข้อมูลไม่ถูกต้อง',
                text: 'กรุณากรอกเลขบัตรประชาชนให้ครบ 13 หลัก',
                confirmButtonColor: '#1E7D55',
            });
            return;
        }

        if (!formData.phone || formData.phone.length !== 10) {
            await Swal.fire({
                icon: 'warning',
                title: 'ข้อมูลไม่ถูกต้อง',
                text: 'กรุณากรอกเบอร์โทรศัพท์ให้ครบ 10 หลัก',
                confirmButtonColor: '#1E7D55',
            });
            return;
        }

        setIsLoading(true);

        try {
            let newPictureUrl: string | undefined = undefined;
            if (profileImage) {
                const formData = new FormData();
                formData.append('file', profileImage);

                const uploadRes = await fetch(`${getApiUrl()}/upload`, {
                    method: 'POST',
                    credentials: 'include',
                    body: formData,
                });

                if (uploadRes.ok) {
                    const uploadData = await uploadRes.json();
                    newPictureUrl = uploadData.url;
                }
            }

            const requestedChanges: Record<string, any> = {};

            if (formData.firstName !== initialData.firstName) {
                requestedChanges.firstName = formData.firstName;
            }
            if (formData.lastName !== initialData.lastName) {
                requestedChanges.lastName = formData.lastName;
            }
            if (formData.idCard !== initialData.idCard) {
                requestedChanges.idCard = formData.idCard || null;
            }
            if (formData.phone !== initialData.phone) {
                requestedChanges.phone = formData.phone;
            }
            if (formData.gender !== initialData.gender) {
                requestedChanges.gender = formData.gender;
            }
            if (formData.medicalConditions !== initialData.medicalConditions) {
                const customDiseases = formData.medicalConditions
                    .split(',')
                    .map(s => s.trim())
                    .filter(s => s.length > 0);
                requestedChanges.customDiseases = customDiseases;
            }
            if (formData.mobilityStatus !== initialData.mobilityStatus) {
                requestedChanges.mobilityStatus = formData.mobilityStatus;
            }
            const normalizeDate = (dateStr: string) => dateStr ? new Date(dateStr).toISOString().split('T')[0] : '';
            if (normalizeDate(formData.birthDate) !== normalizeDate(initialData.birthDate)) {
                requestedChanges.birthDate = formData.birthDate || null;
            }

            if (formData.addressDetail !== initialData.addressDetail) {
                requestedChanges.addressDetail = formData.addressDetail || null;
            }
            if (formData.placeName !== initialData.placeName) {
                requestedChanges.placeName = formData.placeName || null;
            }
            if (formData.houseNo !== initialData.houseNo) {
                requestedChanges.houseNo = formData.houseNo || null;
            }
            if (formData.road !== initialData.road) {
                requestedChanges.road = formData.road || null;
            }
            if (formData.neighbourhood !== initialData.neighbourhood) {
                requestedChanges.neighbourhood = formData.neighbourhood || null;
            }
            if (formData.villageName !== initialData.villageName) {
                requestedChanges.villageName = formData.villageName || null;
            }
            if (formData.subdistrictName !== initialData.subdistrictName) {
                requestedChanges.subdistrictName = formData.subdistrictName || null;
            }
            if (formData.districtName !== initialData.districtName) {
                requestedChanges.districtName = formData.districtName || null;
            }
            if (formData.provinceName !== initialData.provinceName) {
                requestedChanges.provinceName = formData.provinceName || null;
            }
            if (formData.postalCode !== initialData.postalCode) {
                requestedChanges.postalCode = formData.postalCode || null;
            }
            if (formData.country !== initialData.country) {
                requestedChanges.country = formData.country || null;
            }
            if (formData.lat !== initialData.lat) {
                requestedChanges.lat = formData.lat || null;
            }
            if (formData.lng !== initialData.lng) {
                requestedChanges.lng = formData.lng || null;
            }

            if (Object.keys(requestedChanges).length === 0 && !profileImage && !newPictureUrl) {
                Swal.fire({
                    icon: 'info',
                    title: 'ไม่มีการเปลี่ยนแปลง',
                    text: 'ข้อมูลของคุณยังไม่มีการเปลี่ยนแปลง',
                    confirmButtonColor: '#1E7D55',
                });
                setIsLoading(false);
                return;
            }

            const response = await fetch(`${getApiUrl()}/profile-edit-requests`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    requestedChanges,
                    newPictureUrl,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'ไม่สามารถส่งคำร้องได้');
            }

            await Swal.fire({
                icon: 'success',
                title: 'ส่งคำร้องสำเร็จ',
                text: 'คำร้องขอแก้ไขข้อมูลของคุณถูกส่งไปยังเทศบาลเพื่อตรวจสอบแล้ว กรุณารอการอนุมัติ',
                confirmButtonColor: '#1E7D55',
            });

            router.push('/caregiver/profile');

        } catch (error: any) {
            console.error('Error submitting edit request:', error);
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: error.message || 'ไม่สามารถส่งคำร้องได้ กรุณาลองใหม่อีกครั้ง',
                confirmButtonColor: '#1E7D55',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        router.push('/caregiver/profile');
    };

    const displayImage = profileImagePreview || getImageUrl(currentUser?.pictureUrl);

    return (
        <div className="min-h-screen bg-white">
            {}
            <CaregiverSidebar user={currentUser} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {}
            <CaregiverHeader user={currentUser} variant="default" onToggleSidebar={() => setSidebarOpen(true)} />

            {}
            <div className="px-[16px] py-[16px]">
                {}
                <div className="mb-3x">
                    <h1 className=" font-bold text-brand-primary text-center">
                        ขอแก้ไขข้อมูล
                    </h1>
                </div>

                {}
                <div>
                    {}
                    <div className="flex justify-center mb-3x">
                        <div className="relative">
                            <div
                                className="w-32 h-32 rounded-full overflow-hidden bg-fuji-light shadow-smooth-medium cursor-pointer hover:shadow-smooth-high transition-shadow"
                                onClick={handleImageClick}
                            >
                                {displayImage ? (
                                    <Image
                                        src={displayImage}
                                        alt="Profile"
                                        fill
                                        className="object-cover object-center"
                                        style={{ borderRadius: '50%' }}
                                        unoptimized
                                    />
                                ) : (
                                    <div className="w-full h-full bg-fuji-light flex items-center justify-center">
                                        <svg className="w-16 h-16 text-text-placeholder" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                                        </svg>
                                    </div>
                                )}
                            </div>

                            {}
                            <div
                                className="absolute bottom-0 right-0 w-8 h-8 bg-fuji-medium rounded-full flex items-center justify-center cursor-pointer hover:bg-fuji-medium-dark transition-colors"
                                onClick={handleImageClick}
                            >
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M10.0007 1.66675C10.1769 1.49061 10.3863 1.35074 10.6169 1.25483C10.8476 1.15893 11.0949 1.10889 11.3451 1.10889C11.5952 1.10889 11.8425 1.15893 12.0732 1.25483C12.3038 1.35074 12.5132 1.49061 12.6894 1.66675C12.8656 1.84289 13.0054 2.05232 13.1013 2.28296C13.1972 2.5136 13.2473 2.76085 13.2473 3.01104C13.2473 3.26123 13.1972 3.50849 13.1013 3.73913C13.0054 3.96977 12.8656 4.1792 12.6894 4.35534L4.66732 12.3774L1.33398 13.2107L2.16732 9.87737L10.0007 1.66675Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                        </div>
                    </div>


                    {}
                    <div className="space-y-4">
                        {}
                        <div>
                            <label className="typo-body text-text-tertiary mb-1x block">
                                เลขบัตรประชาชน
                            </label>
                            <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={formData.idCard}
                                onChange={(e) => {
                                    const value = e.target.value.replace(/\D/g, '');
                                    handleChange('idCard', value);
                                }}
                                className="w-full px-4 py-3 text-sm text-text-primary bg-white border border-border-neutral rounded-square outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all"
                                placeholder=""
                                maxLength={13}
                            />
                        </div>

                        <div>
                            <label className="typo-body text-text-tertiary mb-1x block">
                                ชื่อ
                            </label>
                            <input
                                type="text"
                                value={formData.firstName}
                                onChange={(e) => handleChange('firstName', e.target.value)}
                                className="w-full px-4 py-3 text-sm text-text-primary bg-white border border-border-neutral rounded-square outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all"
                                placeholder=""
                                maxLength={50}
                            />
                        </div>
                        <div>
                            <label className="typo-body text-text-tertiary mb-1x block">
                                นามสกุล
                            </label>
                            <input
                                type="text"
                                value={formData.lastName}
                                onChange={(e) => handleChange('lastName', e.target.value)}
                                className="w-full px-4 py-3 text-sm text-text-primary bg-white border border-border-neutral rounded-square outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all"
                                placeholder=""
                                maxLength={50}
                            />
                        </div>

                        {}
                        <div>
                            <label className="typo-body text-text-tertiary mb-1x block">
                                เพศ
                            </label>
                            <div className="flex gap-3x">
                                <label className="flex items-center gap-1x cursor-pointer">
                                    <input
                                        type="radio"
                                        name="gender"
                                        value="male"
                                        checked={formData.gender === 'male'}
                                        onChange={(e) => handleChange('gender', e.target.value)}
                                        className="w-5 h-5 accent-brand-primary border-gray-300 focus:ring-brand-primary"
                                    />
                                    <span className="typo-body text-text-primary">ชาย</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="gender"
                                        value="female"
                                        checked={formData.gender === 'female'}
                                        onChange={(e) => handleChange('gender', e.target.value)}
                                        className="w-5 h-5 accent-brand-primary border-gray-300 focus:ring-brand-primary"
                                    />
                                    <span className="typo-body text-text-primary">หญิง</span>
                                </label>
                            </div>
                        </div>

                        {}
                        <div>
                            <label className="typo-body text-text-tertiary mb-1x block">
                                เบอร์โทรศัพท์
                            </label>
                            <input
                                type="tel"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={formData.phone}
                                onChange={(e) => {
                                    const value = e.target.value.replace(/\D/g, '');
                                    handleChange('phone', value);
                                }}
                                className="w-full px-4 py-3 text-sm text-text-primary bg-white border border-border-neutral rounded-square outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all"
                                placeholder=""
                                maxLength={10}
                            />
                        </div>


                        {}
                        <div>
                            <label className="typo-body text-text-tertiary mb-1x block">
                                วันเดือนปีเกิด
                            </label>
                            <ThaiDatePicker
                                value={formData.birthDate ? new Date(formData.birthDate).toISOString().split('T')[0] : ''}
                                onChange={(value) => handleChange('birthDate', value)}
                            />
                        </div>

                        {}
                        <div>
                            <label className="typo-body text-text-tertiary mb-1x block">
                                เลือกที่อยู่
                            </label>
                            <button
                                type="button"
                                onClick={handleLocationPick}
                                className={`w-full p-2x typo-body bg-white border border-border-neutral rounded-square hover:border-border-hover transition-all flex items-center justify-between ${formData.address ? 'text-text-primary' : 'text-text-placeholder'}`}
                            >
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <svg width="16" height="20" viewBox="0 0 16 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
                                        <path d="M8 10C9.10457 10 10 9.10457 10 8C10 6.89543 9.10457 6 8 6C6.89543 6 6 6.89543 6 8C6 9.10457 6.89543 10 8 10Z" stroke={formData.address ? "var(--color-brand-primary)" : "#666"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        <path d="M8 1C6.14348 1 4.36301 1.7375 3.05025 3.05025C1.7375 4.36301 1 6.14348 1 8C1 9.892 1.402 11.13 2.5 12.5L8 19L13.5 12.5C14.598 11.13 15 9.892 15 8C15 6.14348 14.2625 4.36301 12.9497 3.05025C11.637 1.7375 9.85652 1 8 1Z" stroke={formData.address ? "var(--color-brand-primary)" : "#666"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    <span className="truncate text-left">
                                        {typeof formData.address === 'string' ? formData.address : getAddressString(formData.address) || 'คัดเลือกที่อยู่ในแผนที่'}
                                    </span>
                                </div>
                                <svg width="8" height="14" viewBox="0 0 8 14" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 ml-2">
                                    <path d="M1 1L7 7L1 13" stroke="#666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                        </div>

                        {}
                        <div>
                            <label className="typo-body text-text-tertiary mb-1x block">
                                รายละเอียดที่อยู่
                            </label>
                            <textarea
                                value={formData.addressDetail}
                                onChange={(e) => handleChange('addressDetail', e.target.value)}
                                rows={3}
                                className="w-full px-4 py-3 text-sm text-text-primary bg-white border border-border-neutral rounded-square outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all resize-none"
                                placeholder=""
                            />
                        </div>
                    </div>

                    {}
                    <div className="mt-4x">
                        <button
                            onClick={handleSubmit}
                            disabled={isLoading}
                            className="w-full h-15 bg-brand-primary hover:bg-btn-hover disabled:bg-field-disable text-white typo-button-sm py-2x px-3x rounded-square transition-colors shadow-smooth-low hover:shadow-smooth-medium disabled:cursor-not-allowed disabled:text-text-disable"
                        >
                            {isLoading ? 'กำลังบันทึก...' : 'ส่งคำร้อง'}
                        </button>
                    </div>
                </div>
            </div>

            {}
            {showMap && (
                <MapPicker
                    initialLat={parseCoordinates(formData.lat, formData.lng)?.lat}
                    initialLng={parseCoordinates(formData.lat, formData.lng)?.lng}
                    pictureUrl={currentUser?.pictureUrl}
                    onConfirm={handleConfirmLocation}
                    onClose={() => setShowMap(false)}
                />
            )}

            {}
            <ImageSourcePicker
                isOpen={showImagePicker}
                onClose={() => setShowImagePicker(false)}
                onImageSelected={handleImagePicked}
            />
        </div>
    );
}
