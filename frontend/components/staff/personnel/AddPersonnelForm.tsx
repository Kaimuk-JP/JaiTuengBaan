'use client';

import { useState } from 'react';
import { getApiUrl } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Swal from '@/lib/swal';
import type { NamedItem } from '@/types/common';
import { ProfileImageUpload as ElderlyProfileImage } from '@/components/elderly/form/ProfileImageUpload';
import { LocationPicker as ElderlyLocationPicker } from '@/components/elderly/form/LocationPicker';

import { ProfileImageUpload as GenericProfileImage } from '@/components/caregiver/form/ProfileImageUpload';
import { LocationPicker as GenericLocationPicker } from '@/components/caregiver/form/LocationPicker';

import DiseaseAutocomplete from '@/components/shared/DiseaseAutocomplete';
import ThaiDatePicker from '@/components/shared/ThaiDatePicker';

export default function AddPersonnelForm() {
    const router = useRouter();

    const [role, setRole] = useState<'USERS' | 'CAREGIVER' | 'DRIVE' | 'CAREU' | 'STAFF'>('USERS');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedProfileImage, setSelectedProfileImage] = useState<File | null>(null);

    const [formData, setFormData] = useState({
        idCard: '',
        firstName: '',
        lastName: '',
        phone: '',
        relativePhone: '',
        relativeName: '',
        birthDate: '',
        gender: 'female' as 'male' | 'female',
        disease: [] as NamedItem[],
        patientStatus: 'normal' as 'normal' | 'special' | 'urgent',
        villageName: '',
        subdistrictName: '',
        districtName: '',
        provinceName: '',
        country: '',
        addressDetail: '',
        coordinates: '',
    });

    const mapPatientStatusToMobility = (patientStatus: string) => {
        switch (patientStatus) {
            case 'normal': return 'WALKING';
            case 'special': return 'WHEELCHAIR';
            case 'urgent': return 'BEDRIDDEN';
            default: return 'WALKING';
        }
    };

    const handleFieldChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleImageSelect = (file: File | null) => {
        setSelectedProfileImage(file);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.idCard || formData.idCard.length !== 13) {
            Swal.fire({ icon: 'warning', title: 'ข้อมูลไม่ถูกต้อง', text: 'เลขบัตรประชาชนต้องมี 13 หลัก', confirmButtonColor: '#1E7D55' });
            return;
        }

        if (!formData.phone || formData.phone.length !== 10) {
            Swal.fire({ icon: 'warning', title: 'ข้อมูลไม่ถูกต้อง', text: 'เบอร์โทรศัพท์ต้องมี 10 หลัก', confirmButtonColor: '#1E7D55' });
            return;
        }

        if (!formData.firstName.trim() || !formData.lastName.trim()) {
            Swal.fire({ icon: 'warning', title: 'ข้อมูลไม่ครบถ้วน', text: 'กรุณากรอกชื่อและนามสกุล', confirmButtonColor: '#1E7D55' });
            return;
        }

        if (!formData.birthDate) {
            Swal.fire({ icon: 'warning', title: 'ข้อมูลไม่ครบถ้วน', text: 'กรุณาระบุวันเดือนปีเกิด', confirmButtonColor: '#1E7D55' });
            return;
        }

        if (!formData.addressDetail.trim()) {
            Swal.fire({ icon: 'warning', title: 'ข้อมูลไม่ครบถ้วน', text: 'กรุณากรอกรายละเอียดที่อยู่', confirmButtonColor: '#1E7D55' });
            return;
        }

        if (!formData.coordinates.trim()) {
            Swal.fire({ icon: 'warning', title: 'ข้อมูลไม่ครบถ้วน', text: 'กรุณาปักหมุดตำแหน่งที่อยู่บนแผนที่', confirmButtonColor: '#1E7D55' });
            return;
        }

        if (!selectedProfileImage) {
            Swal.fire({ icon: 'warning', title: 'ข้อมูลไม่ครบถ้วน', text: 'กรุณาอัปโหลดรูปโปรไฟล์', confirmButtonColor: '#1E7D55' });
            return;
        }

        setIsSubmitting(true);
        try {
            let lat: number | undefined;
            let lng: number | undefined;
            if (formData.coordinates) {
                const [latStr, lngStr] = formData.coordinates.split(',').map(s => s.trim());
                lat = parseFloat(latStr);
                lng = parseFloat(lngStr);
            }

            let profilePictureUrl: string | undefined;

            if (selectedProfileImage) {
                const uploadFormData = new FormData();
                uploadFormData.append('file', selectedProfileImage);

                const uploadResponse = await fetch(`${getApiUrl()}/upload/profile-picture`, {
                    method: 'POST',
                    credentials: 'include',
                    body: uploadFormData,
                });

                if (uploadResponse.ok) {
                    const uploadResult = await uploadResponse.json();
                    profilePictureUrl = uploadResult.url;
                } else {
                    Swal.fire({ icon: 'warning', title: 'อัพโหลดรูปภาพไม่สำเร็จ', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
                }
            }

            const submitData = {
                role,
                idCard: formData.idCard,
                firstName: formData.firstName,
                lastName: formData.lastName,
                phone: formData.phone,
                birthDate: formData.birthDate,
                gender: formData.gender,
                villageName: formData.villageName,
                subdistrictName: formData.subdistrictName,
                districtName: formData.districtName,
                provinceName: formData.provinceName,
                country: formData.country,
                addressDetail: formData.addressDetail,
                lat,
                lng,
                ...(role === 'USERS' && {
                    mobilityStatus: mapPatientStatusToMobility(formData.patientStatus),
                    diseaseIds: formData.disease.filter(d => d.id).map(d => d.id),
                    customDiseases: formData.disease.filter(d => !d.id).map(d => d.name),
                }),
                ...(profilePictureUrl && { pictureUrl: profilePictureUrl }),
            };

            const response = await fetch(`${getApiUrl()}/users`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(submitData),
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.message || "ไม่สามารถถบันทึกข้อมูลได้");
            }

            await Swal.fire({
                icon: 'success',
                title: 'เพิ่มบุคลากรสำเร็จ!',
                text: 'สามารถเข้าสู่ระบบด้วย LINE เพื่อเชื่อมโยงข้อมูลในภายหลัง',
                confirmButtonColor: '#1E7D55',
                timer: 2000,
                showConfirmButton: false,
            });

            router.push("/staff/personnel");
        } catch (error: any) {
            Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: error.message || "ไม่สามารถเพิ่มข้อมูลได้", confirmButtonColor: '#1E7D55' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const diseaseArray = formData.disease || [];
    const handleDiseaseChange = (diseases: NamedItem[]) => {
        handleFieldChange('disease', diseases);
    };

    const LocationPicker = role === 'USERS' ? ElderlyLocationPicker : GenericLocationPicker;
    const ProfileImage = role === 'USERS' ? ElderlyProfileImage : GenericProfileImage;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden text-sm">
            { }
            <div className="p-4 md:p-5 border-b border-slate-200 bg-slate-50">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">ประเภทประชาชนที่จะเพิ่มระบบ</label>
                <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as 'USERS' | 'CAREGIVER' | 'DRIVE' | 'CAREU' | 'STAFF')}
                    className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M5%207.5L10%2012.5L15%207.5%22%20stroke%3D%22%2364748B%22%20strokeWidth%3D%221.5%22%20strokeLinecap%3D%22round%22%20strokeLinejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:calc(100%-1rem)_center]"
                >
                    <option value="USERS">ผู้ใช้บริการ</option>
                    <option value="CAREGIVER">ผู้ดูแลประชาชน / ญาติ</option>
                    <option value="DRIVE">เจ้าหน้าที่รถ</option>
                    <option value="CAREU">จิตอาสาแคร์ยู</option>
                    <option value="STAFF">เจ้าหน้าที่เทศบาล</option>
                </select>
            </div>

            <div className="p-4 md:p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                    { }
                    <div className="flex justify-center">
                        <ProfileImage onImageSelect={handleImageSelect} />
                    </div>

                    { }
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">
                                เลขบัตรประชาชน <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={formData.idCard}
                                onChange={(e) => handleFieldChange('idCard', e.target.value.replace(/\D/g, ''))}
                                className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-[#1E7D55]/20 focus:border-[#1E7D55] outline-none transition-all"
                                placeholder="เลขบัตรประชาชน 13 หลัก"
                                maxLength={13}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">
                                ชื่อ <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.firstName}
                                onChange={(e) => {
                                    const value = e.target.value.replace(/[^ก-๙เแโใไ\s]/g, '');
                                    handleFieldChange('firstName', value);
                                }}
                                className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-[#1E7D55]/20 focus:border-[#1E7D55] outline-none transition-all"
                                placeholder="ชื่อจริง (ภาษาไทย)"
                                maxLength={50}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">
                                นามสกุล <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.lastName}
                                onChange={(e) => {
                                    const value = e.target.value.replace(/[^ก-๙เแโใไ\s]/g, '');
                                    handleFieldChange('lastName', value);
                                }}
                                className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-[#1E7D55]/20 focus:border-[#1E7D55] outline-none transition-all"
                                placeholder="นามสกุล (ภาษาไทย)"
                                maxLength={50}
                            />
                        </div>
                    </div>

                    { }
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">
                                เพศ <span className="text-red-500">*</span>
                            </label>
                            <div className="flex gap-4 items-center h-[42px]">
                                <label className="flex items-center gap-1.5 cursor-pointer">
                                    <input
                                        type="radio" name="gender" value="male"
                                        checked={formData.gender === "male"}
                                        onChange={(e) => handleFieldChange('gender', e.target.value)}
                                        className="w-4 h-4 accent-[#1E7D55]"
                                    />
                                    <span className="text-slate-700">ชาย</span>
                                </label>
                                <label className="flex items-center gap-1.5 cursor-pointer">
                                    <input
                                        type="radio" name="gender" value="female"
                                        checked={formData.gender === "female"}
                                        onChange={(e) => handleFieldChange('gender', e.target.value)}
                                        className="w-4 h-4 accent-[#1E7D55]"
                                    />
                                    <span className="text-slate-700">หญิง</span>
                                </label>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">
                                เบอร์โทรศัพท์ <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="tel"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={formData.phone}
                                onChange={(e) => handleFieldChange('phone', e.target.value.replace(/\D/g, ''))}
                                className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-[#1E7D55]/20 focus:border-[#1E7D55] outline-none transition-all"
                                placeholder="0812345678"
                                maxLength={10}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">
                                วัน/เดือน/ปีเกิด <span className="text-red-500">*</span>
                            </label>
                            <ThaiDatePicker
                                value={formData.birthDate ? new Date(formData.birthDate).toISOString().split('T')[0] : ''}
                                onChange={(val) => handleFieldChange('birthDate', val)}
                                max={new Date().toISOString().split('T')[0]}
                                placeholder="เลือกวันเกิด (ปี → เดือน → วัน)"
                            />
                        </div>
                    </div>

                    { }
                    {role === 'USERS' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">
                                    สถานะประชาชน <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <select
                                        value={formData.patientStatus}
                                        onChange={(e) => handleFieldChange('patientStatus', e.target.value)}
                                        className="w-full px-3 py-2.5 pr-10 bg-white border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-[#1E7D55]/20 focus:border-[#1E7D55] outline-none transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="normal">ทั่วไป</option>
                                        <option value="special">ต้องดูแลเพิ่ม</option>
                                        <option value="urgent">ต้องดูแลใกล้ชิด</option>
                                    </select>
                                    <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">
                                    โรคประจำตัว
                                </label>
                                <DiseaseAutocomplete
                                    value={diseaseArray}
                                    onChange={handleDiseaseChange}
                                    placeholder="พิมพ์เพื่อค้นหาโรค"
                                />
                            </div>
                        </div>
                    )}

                    { }
                    <LocationPicker
                        coordinates={formData.coordinates}
                        villageName={formData.villageName}
                        subdistrictName={formData.subdistrictName}
                        districtName={formData.districtName}
                        provinceName={formData.provinceName}
                        country={formData.country}
                        addressDetail={formData.addressDetail}
                        onCoordinatesChange={(val) => handleFieldChange('coordinates', val)}
                        onAddressComponentsChange={(comps) => setFormData(p => ({ ...p, ...comps }))}
                        onAddressDetailChange={(val) => handleFieldChange('addressDetail', val)}
                    />

                    { }
                    <div className="pt-3 border-t border-slate-200">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`w-full py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 text-white ${isSubmitting ? 'bg-slate-400 cursor-not-allowed' : 'bg-brand-primary hover:bg-brand-primary_hover'}`}
                        >
                            {isSubmitting ? (
                                <>
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    กำลังบันทึกข้อมูล...
                                </>
                            ) : (
                                'เพิ่มบุคลากรเข้าสู่ระบบ'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
