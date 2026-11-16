'use client';

import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import dynamic from 'next/dynamic';
import Swal from '@/lib/swal';
import { useRouter } from 'next/navigation';
import ImageSourcePicker from '@/components/shared/ImageSourcePicker';
import type { AddressComponents } from '@/components/maps/MapPicker';

const MapPicker = dynamic(() => import('@/components/maps/MapPicker'), { ssr: false });
import ThaiDatePicker from '@/components/shared/ThaiDatePicker';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface UserProfile {
    citizenId: string;
    firstName: string;
    lastName: string;
    gender: 'male' | 'female' | '';
    phoneNumber: string;
    dateOfBirth: string;
    address: string;
    lat: number | null;
    lng: number | null;
}

const customInputClasses = "w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 transition duration-150 shadow-sm text-text-primary dark:text-gray-100";
const customLabelClasses = "block text-sm font-medium text-text-tertiary mb-1 ";
const customButtonClasses = "w-full h-15 bg-brand-primary hover:bg-brand-primary-hover text-white text-sm font-semibold rounded-xl shadow-lg hover:shadow-xl transition duration-200 ease-in-out transform hover:scale-[1.01]";

const App: React.FC = () => {
    const router = useRouter();
    const [profile, setProfile] = useState<UserProfile>({
        citizenId: '',
        firstName: '',
        lastName: '',
        gender: '',
        phoneNumber: '',
        dateOfBirth: '',
        address: '',
        lat: null,
        lng: null,
    });

    const [originalProfile, setOriginalProfile] = useState<UserProfile>({
        citizenId: '',
        firstName: '',
        lastName: '',
        gender: '',
        phoneNumber: '',
        dateOfBirth: '',
        address: '',
        lat: null,
        lng: null,
    });

    const [showMapPicker, setShowMapPicker] = useState(false);

    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const [profilePicture, setProfilePicture] = useState<string>('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>('');
    const [showImagePicker, setShowImagePicker] = useState(false);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const res = await fetch(`${API_URL}/users/profile`, {
                    credentials: 'include',
                });

                if (!res.ok) {
                    throw new Error('ไม่สามารถดึงข้อมูลผู้ใช้ได้');
                }

                const data = await res.json();

                const formatDateForInput = (dateString?: string) => {
                    if (!dateString) return '';
                    const date = new Date(dateString);
                    return date.toISOString().split('T')[0];
                };

                const profileData = {
                    citizenId: data.idCard || '',
                    firstName: data.firstName || '',
                    lastName: data.lastName || '',
                    gender: data.gender || '',
                    phoneNumber: data.phone || '',
                    dateOfBirth: formatDateForInput(data.birthDate),
                    address: typeof data.addressDetail === 'string' ? data.addressDetail : '',
                    lat: data.lat ?? null,
                    lng: data.lng ?? null,
                };
                setProfile(profileData);
                setOriginalProfile(profileData);

                setProfilePicture(data.pictureUrl || '');

            } catch (error) {
                console.error("เจ้าหน้าที่ขับรถError fetching user data:", error);
                Swal.fire({
                    icon: 'error',
                    title: 'ข้อผิดพลาด',
                    text: 'ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง',
                    confirmButtonColor: '#1E7D55',
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserData();
    }, []);

    const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedFile(file);

            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleImageClick = () => {
        setShowImagePicker(true);
    };

    const handleImagePicked = (file: File) => {
        setSelectedFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setProfile(prev => ({ ...prev, [name]: value }));
    };

    const handleGenderChange = (e: ChangeEvent<HTMLInputElement>) => {
        setProfile(prev => ({ ...prev, gender: e.target.value as 'male' | 'female' }));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        if (profile.citizenId.length !== 13) {
            Swal.fire({
                icon: 'warning',
                title: 'ข้อมูลไม่ถูกต้อง',
                text: 'เลขบัตรประชาชนต้องมี 13 หลัก',
                confirmButtonColor: '#1E7D55',
            });
            setIsSubmitting(false);
            return;
        }

        if (profile.phoneNumber.length !== 10) {
            Swal.fire({
                icon: 'warning',
                title: 'ข้อมูลไม่ถูกต้อง',
                text: 'เบอร์โทรศัพท์ต้องมี 10 หลัก',
                confirmButtonColor: '#1E7D55',
            });
            setIsSubmitting(false);
            return;
        }

        if ((profile.firstName + profile.lastName).length > 100) {
            Swal.fire({
                icon: 'warning',
                title: 'ข้อมูลไม่ถูกต้อง',
                text: 'ชื่อ-สกุล รวมกันต้องไม่เกิน 100 ตัวอักษร',
                confirmButtonColor: '#1E7D55',
            });
            setIsSubmitting(false);
            return;
        }

        if (profile.address.length > 255) {
            Swal.fire({
                icon: 'warning',
                title: 'ข้อมูลไม่ถูกต้อง',
                text: 'ที่อยู่ ต้องไม่เกิน 255 ตัวอักษร',
                confirmButtonColor: '#1E7D55',
            });
            setIsSubmitting(false);
            return;
        }

        try {
            let newPictureUrl: string | undefined = undefined;
            if (selectedFile) {
                const formData = new FormData();
                formData.append('file', selectedFile);

                const uploadRes = await fetch(`${API_URL}/upload`, {
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

            if (profile.firstName !== originalProfile.firstName) {
                requestedChanges.firstName = profile.firstName;
            }
            if (profile.lastName !== originalProfile.lastName) {
                requestedChanges.lastName = profile.lastName;
            }
            if (profile.citizenId !== originalProfile.citizenId) {
                requestedChanges.idCard = profile.citizenId || null;
            }
            if (profile.phoneNumber !== originalProfile.phoneNumber) {
                requestedChanges.phone = profile.phoneNumber;
            }
            if (profile.gender !== originalProfile.gender) {
                requestedChanges.gender = profile.gender;
            }
            if (profile.dateOfBirth !== originalProfile.dateOfBirth) {
                requestedChanges.birthDate = profile.dateOfBirth || null;
            }
            if (profile.address !== originalProfile.address) {
                requestedChanges.addressDetail = profile.address || null;
            }
            if (profile.lat !== originalProfile.lat || profile.lng !== originalProfile.lng) {
                requestedChanges.lat = profile.lat;
                requestedChanges.lng = profile.lng;
            }

            if (Object.keys(requestedChanges).length === 0 && !newPictureUrl) {
                Swal.fire({
                    icon: 'info',
                    title: 'ไม่มีการเปลี่ยนแปลง',
                    text: 'ข้อมูลของคุณยังไม่มีการเปลี่ยนแปลง',
                    confirmButtonColor: '#1E7D55',
                });
                setIsSubmitting(false);
                return;
            }

            const response = await fetch(`${API_URL}/profile-edit-requests`, {
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
                text: 'ส่งคำร้องขอแก้ไขข้อมูลสำเร็จ! กรุณารอเจ้าหน้าที่ตรวจสอบ',
                confirmButtonColor: '#1E7D55',
            });
            router.push('/volunteer/profile');

        } catch (error: any) {
            console.error("Error submitting form:", error);
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: error.message || 'เกิดข้อผิดพลาดในการส่งคำร้อง กรุณาลองใหม่อีกครั้ง',
                confirmButtonColor: '#1E7D55',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f0fdf4' }}>
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                    <p className="text-emerald-700 font-medium">กำลังโหลดข้อมูล...</p>
                </div>
            </div>
        );
    }

    return (

        <div className="min-h-screen p-4 sm:p-8 flex flex-col items-center justify-center bg-white dark:bg-gray-900"
            style={{ fontFamily: 'Noto Sans Thai, Inter, sans-serif' }}
        >
            <h1 className="text-2xl font-semibold text-center text-emerald-700 dark:text-emerald-400 mb-6">
                ขอแก้ไขข้อมูล
            </h1>

            <div className="max-w-lg w-full p-6 sm:p-10">

                <div className="w-32 h-32 mx-auto relative mb-10">
                    <div className="w-full h-full rounded-full bg-emerald-50 dark:bg-gray-800 shadow-inner overflow-hidden">
                        {(previewUrl || profilePicture) ? (
                            <img
                                src={previewUrl || profilePicture}
                                alt="Profile"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                                                        <svg className="absolute inset-0 w-3/4 h-3/4 m-auto text-emerald-800" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                            </svg>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={handleImageClick}
                        aria-label="Edit Profile Picture"
                        className="absolute bottom-0 right-0 p-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-full shadow-lg transition duration-150 transform hover:scale-110 border-2 border-white dark:border-gray-900"
                    >
                        <svg width="19" height="19" viewBox="0 0 19 19" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M1.61905 16.7302H2.98067L14.0296 5.68124L12.668 4.31962L1.61905 15.3685V16.7302ZM0.975746 18.3492C0.699249 18.3492 0.467545 18.2557 0.280635 18.0686C0.0935448 17.8817 0 17.65 0 17.3735V15.5035C0 15.2403 0.0505501 14.9894 0.151651 14.7509C0.252571 14.5123 0.39163 14.3045 0.568825 14.1273L14.2374 0.464936C14.4005 0.316703 14.5807 0.202201 14.7779 0.121429C14.9752 0.0404762 15.1821 0 15.3985 0C15.6149 0 15.8245 0.0384079 16.0272 0.115223C16.2301 0.192038 16.4098 0.314185 16.5661 0.481666L17.8843 1.8163C18.0518 1.97263 18.1711 2.15252 18.2423 2.35598C18.3136 2.55944 18.3492 2.7629 18.3492 2.96637C18.3492 3.1835 18.3122 3.39065 18.238 3.58781C18.1639 3.78515 18.046 3.96541 17.8843 4.12857L4.22194 17.7804C4.04474 17.9576 3.83687 18.0966 3.59833 18.1976C3.35979 18.2987 3.10893 18.3492 2.84575 18.3492H0.975746ZM13.3369 5.0123L12.668 4.31962L14.0296 5.68124L13.3369 5.0123Z" fill="#1C1B1F" />
                        </svg>

                    </button>

                </div>

                <form onSubmit={handleSubmit} className="space-y-4">

                    <div>
                        <label htmlFor="citizenId" className={customLabelClasses}>เลขบัตรประจำตัวประชาชน</label>
                        <input
                            type="text"
                            id="citizenId"
                            name="citizenId"
                            value={profile.citizenId}
                            onChange={handleChange}
                            className={customInputClasses}
                            placeholder="ระบุเลขบัตร 13 หลัก"
                            maxLength={13}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label htmlFor="firstName" className={customLabelClasses}>ชื่อ</label>
                            <input
                                type="text"
                                id="firstName"
                                name="firstName"
                                value={profile.firstName}
                                onChange={handleChange}
                                className={customInputClasses}
                                placeholder="ชื่อจริง"
                                maxLength={50}
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="lastName" className={customLabelClasses}>นามสกุล</label>
                            <input
                                type="text"
                                id="lastName"
                                name="lastName"
                                value={profile.lastName}
                                onChange={handleChange}
                                className={customInputClasses}
                                placeholder="นามสกุล"
                                maxLength={50}
                                required
                            />
                        </div>
                    </div>

                    <div className="pt-2">
                        <span className={customLabelClasses.replace('mb-1', 'mb-3')}>เพศ</span>
                        <div className="flex space-x-8 mt-2">
                            <label className="flex items-center text-text-tertiary">
                                <input
                                    type="radio"
                                    name="gender"
                                    value="male"
                                    checked={profile.gender === 'male'}
                                    onChange={handleGenderChange}
                                    className="h-4 w-4 text-emerald-600 border-gray-300 focus:ring-emerald-500"
                                />
                                <span className="ml-2">ชาย</span>
                            </label>
                            <label className="flex items-center text-text-tertiary">
                                <input
                                    type="radio"
                                    name="gender"
                                    value="female"
                                    checked={profile.gender === 'female'}
                                    onChange={handleGenderChange}
                                    className="h-4 w-4 text-emerald-600 border-gray-300 focus:ring-emerald-500"
                                />
                                <span className="ml-2">หญิง</span>
                            </label>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="phoneNumber" className={customLabelClasses}>เบอร์โทรศัพท์</label>
                        <input
                            type="tel"
                            id="phoneNumber"
                            name="phoneNumber"
                            value={profile.phoneNumber}
                            onChange={handleChange}
                            className={customInputClasses}
                            placeholder="08X-XXX-XXXX"
                            maxLength={10}
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="dateOfBirth" className={customLabelClasses}>วันเดือนปีเกิด</label>
                        <ThaiDatePicker
                            value={profile.dateOfBirth}
                            onChange={(value) => setProfile(prev => ({ ...prev, dateOfBirth: value }))}
                        />
                    </div>

                    <div>
                        <label htmlFor="address" className={customLabelClasses}>ที่อยู่</label>
                        <textarea
                            id="address"
                            name="address"
                            value={profile.address}
                            onChange={handleChange}
                            rows={4}
                            className={`${customInputClasses} resize-y`}
                            placeholder="บ้านเลขที่, ถนน, แขวง/ตำบล, เขต/อำเภอ, จังหวัด, รหัสไปรษณีย์"
                            maxLength={255}
                        />
                    </div>

                    <div>
                        <label className={customLabelClasses}>ตำแหน่งบนแผนที่</label>
                        <button
                            type="button"
                            onClick={() => setShowMapPicker(true)}
                            className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-gray-700 transition duration-150 shadow-sm"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600 shrink-0">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                <circle cx="12" cy="10" r="3" />
                            </svg>
                            {profile.lat && profile.lng ? (
                                <span className="text-sm text-text-primary">
                                    📍 {profile.lat.toFixed(6)}, {profile.lng.toFixed(6)}
                                </span>
                            ) : (
                                <span className="text-sm text-text-tertiary">กดเพื่อปักหมุดตำแหน่งที่อยู่</span>
                            )}
                        </button>
                    </div>

                    <div className="pt-6 flex justify-center">
                        <button
                            type="submit"
                            className={customButtonClasses}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <span className="flex items-center justify-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    กำลังส่งคำร้อง...
                                </span>
                            ) : (
                                'ส่งคำร้อง'
                            )}
                        </button>
                    </div>
                </form>
            </div>

            <ImageSourcePicker
                isOpen={showImagePicker}
                onClose={() => setShowImagePicker(false)}
                onImageSelected={handleImagePicked}
            />

            {showMapPicker && (
                <MapPicker
                    initialLat={profile.lat ?? undefined}
                    initialLng={profile.lng ?? undefined}
                    onConfirm={(lat, lng, addressComponents) => {
                        setProfile(prev => ({ ...prev, lat, lng }));
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
                                setProfile(prev => ({ ...prev, address: formatted }));
                            }
                        }
                    }}
                    onClose={() => setShowMapPicker(false)}
                />
            )}
        </div>
    );
};

export default App;