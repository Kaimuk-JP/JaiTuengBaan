'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getApiUrl } from '@/lib/api';
import type { NamedItem } from '@/types/common';
import { ElderlyInfoFields } from './ElderlyInfoFields';
import { ElderlyProfileImage } from './ElderlyProfileImage';
import { RelationshipFields } from './RelationshipFields';
import { LocationFields } from './LocationFields';
import type { AddressComponents } from '@/components/maps/MapPicker';
import { LazyCaregiverMapPicker as MapPicker } from '@/components/maps/LazyMap';
import MunicipalityAutocomplete from '@/components/shared/MunicipalityAutocomplete';
import Swal from '@/lib/swal';

interface ElderlyRegistrationFormData {
    pictureFile: File | null;
    picturePreview: string | null;
    idCard: string;
    firstName: string;
    lastName: string;
    gender: 'male' | 'female';
    phone: string;
    patientStatus: 'WALKING' | 'WHEELCHAIR' | 'BEDRIDDEN';
    disease: NamedItem[];
    birthDate: string;
    coordinates: string;
    villageName: string;
    subdistrictName: string;
    districtName: string;
    provinceName: string;
    country: string;
    addressDetail: string;
    relationship: string;
    additionalDetails: string;
    documentFile: File | null;
    documentPreview: string | null;
    organizationId: string;
    organizationName: string;
}

const initialFormData = (): ElderlyRegistrationFormData => ({
    pictureFile: null,
    picturePreview: null,
    idCard: '',
    firstName: '',
    lastName: '',
    gender: 'female',
    phone: '',
    patientStatus: 'WALKING',
    disease: [],
    birthDate: '',
    coordinates: '',
    villageName: '',
    subdistrictName: '',
    districtName: '',
    provinceName: '',
    country: '',
    addressDetail: '',
    relationship: '',
    additionalDetails: '',
    documentFile: null,
    documentPreview: null,
    organizationId: '',
    organizationName: '',
});

export interface RegisterElderlyFormProps {
    prefillName?: string | null;
    onSuccess?: () => void;
}

export function RegisterElderlyForm({ prefillName, onSuccess }: RegisterElderlyFormProps) {
    const router = useRouter();

    const [loading, setLoading] = useState(false);
    const [showMapPicker, setShowMapPicker] = useState(false);

    const [formData, setFormData] = useState<ElderlyRegistrationFormData>(initialFormData);

    useEffect(() => {
        if (!prefillName?.trim()) {
            return;
        }
        const nameParam = prefillName.trim();
        const parts = nameParam.split(' ');
        if (parts.length >= 2) {
            setFormData((prev) => ({
                ...prev,
                firstName: parts[0],
                lastName: parts.slice(1).join(' '),
            }));
        } else {
            setFormData((prev) => ({ ...prev, firstName: nameParam, lastName: '' }));
        }
    }, [prefillName]);

    const handleInputChange = (field: string, value: unknown) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            Swal.fire({
                icon: 'warning',
                title: 'ไฟล์ไม่ถูกต้อง',
                text: 'กรุณาเลือกไฟล์รูปภาพเท่านั้น',
                confirmButtonColor: '#1E7D55',
            });
            return;
        }

        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            Swal.fire({
                icon: 'warning',
                title: 'ไฟล์ใหญ่เกินไป',
                text: 'ขนาดไฟล์ต้องไม่เกิน 10 MB',
                confirmButtonColor: '#1E7D55',
            });
            return;
        }

        const previewUrl = URL.createObjectURL(file);
        setFormData((prev) => ({ ...prev, pictureFile: file, picturePreview: previewUrl }));
    };

    const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            Swal.fire({
                icon: 'warning',
                title: 'ไฟล์ไม่ถูกต้อง',
                text: 'กรุณาเลือกไฟล์รูปภาพเท่านั้น',
                confirmButtonColor: '#1E7D55',
            });
            return;
        }

        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            Swal.fire({
                icon: 'warning',
                title: 'ไฟล์ใหญ่เกินไป',
                text: 'ขนาดไฟล์ต้องไม่เกิน 10 MB',
                confirmButtonColor: '#1E7D55',
            });
            return;
        }

        const previewUrl = URL.createObjectURL(file);
        setFormData((prev) => ({ ...prev, documentFile: file, documentPreview: previewUrl }));
    };

    const handleMapConfirm = (lat: number, lng: number, addressComponents: AddressComponents) => {
        const villageNameParts: string[] = [];
        if (addressComponents.placeName) villageNameParts.push(addressComponents.placeName);
        if (addressComponents.houseNo) villageNameParts.push(`บ้านเลขที่ ${addressComponents.houseNo}`);
        if (addressComponents.road) villageNameParts.push(`ถ.${addressComponents.road}`);
        if (addressComponents.neighbourhood) villageNameParts.push(addressComponents.neighbourhood);
        if (addressComponents.villageName && !villageNameParts.includes(addressComponents.villageName)) {
            villageNameParts.push(addressComponents.villageName);
        }

        setFormData((prev) => ({
            ...prev,
            coordinates: `${lat},${lng}`,
            villageName: villageNameParts.join(' ') || '',
            subdistrictName: addressComponents.subdistrictName || '',
            districtName: addressComponents.districtName || '',
            provinceName: addressComponents.provinceName || '',
            country: addressComponents.country || '',
        }));
        setShowMapPicker(false);
    };

    const parseCoordinates = (coords: string) => {
        if (!coords) return null;
        const [lat, lng] = coords.split(',').map((n) => parseFloat(n.trim()));
        if (isNaN(lat) || isNaN(lng)) return null;
        return { lat, lng };
    };

    const currentCoords = parseCoordinates(formData.coordinates);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (loading) {
            return;
        }

        if (!formData.idCard || formData.idCard.length !== 13) {
            Swal.fire({
                icon: 'warning',
                title: 'ข้อมูลไม่ถูกต้อง',
                text: 'เลขบัตรประชาชนต้องมี 13 หลัก',
                confirmButtonColor: '#1E7D55',
            });
            return;
        }

        if (!formData.firstName.trim() || !formData.lastName.trim()) {
            Swal.fire({
                icon: 'warning',
                title: 'ข้อมูลไม่ครบ',
                text: 'กรุณากรอกชื่อและนามสกุล',
                confirmButtonColor: '#1E7D55',
            });
            return;
        }

        if (!formData.gender) {
            Swal.fire({
                icon: 'warning',
                title: 'ข้อมูลไม่ครบ',
                text: 'กรุณาเลือกเพศ',
                confirmButtonColor: '#1E7D55',
            });
            return;
        }

        if (!formData.phone || formData.phone.length !== 10) {
            Swal.fire({
                icon: 'warning',
                title: 'ข้อมูลไม่ถูกต้อง',
                text: 'เบอร์โทรศัพท์ต้องมี 10 หลัก',
                confirmButtonColor: '#1E7D55',
            });
            return;
        }

        if (!formData.patientStatus) {
            Swal.fire({
                icon: 'warning',
                title: 'ข้อมูลไม่ครบ',
                text: 'กรุณาเลือกสถานะประชาชน',
                confirmButtonColor: '#1E7D55',
            });
            return;
        }

        if (!formData.birthDate) {
            Swal.fire({
                icon: 'warning',
                title: 'ข้อมูลไม่ครบ',
                text: 'กรุณาระบุวันเดือนปีเกิด',
                confirmButtonColor: '#1E7D55',
            });
            return;
        }

        if (!formData.coordinates) {
            Swal.fire({
                icon: 'warning',
                title: 'ข้อมูลไม่ครบ',
                text: 'กรุณาเลือกที่อยู่ในแผนที่',
                confirmButtonColor: '#1E7D55',
            });
            return;
        }

        if (!formData.relationship) {
            Swal.fire({
                icon: 'warning',
                title: 'ข้อมูลไม่ครบ',
                text: 'กรุณาเลือกความสัมพันธ์',
                confirmButtonColor: '#1E7D55',
            });
            return;
        }

        if (!formData.organizationId) {
            Swal.fire({
                icon: 'warning',
                title: 'ข้อมูลไม่ครบ',
                text: 'กรุณาเลือกเทศบาลที่ประชาชนสังกัดอยู่',
                confirmButtonColor: '#1E7D55',
            });
            return;
        }

        if (!formData.documentFile) {
            Swal.fire({
                icon: 'warning',
                title: 'ข้อมูลไม่ครบ',
                text: 'กรุณาแนบหลักฐานยืนยันความสัมพันธ์',
                confirmButtonColor: '#1E7D55',
            });
            return;
        }

        setLoading(true);

        try {
            let pictureUrl = null;
            if (formData.pictureFile) {
                try {
                    const uploadFormData = new FormData();
                    uploadFormData.append('file', formData.pictureFile);

                    const uploadResponse = await fetch(`${getApiUrl()}/upload`, {
                        method: 'POST',
                        credentials: 'include',
                        body: uploadFormData,
                    });

                    if (uploadResponse.ok) {
                        const uploadResult = await uploadResponse.json();
                        pictureUrl = uploadResult.url;
                    } else {
                        const errorText = await uploadResponse.text();
                        console.error('Upload picture failed:', uploadResponse.status, errorText);
                        throw new Error('ไม่สามารถอัพโหลดรูปโปรไฟล์ได้');
                    }
                } catch (error) {
                    console.error('Upload picture error:', error);
                    throw new Error('เกิดข้อผิดพลาดในการอัพโหลดรูปโปรไฟล์');
                }
            }

            let documentUrl = null;
            if (formData.documentFile) {
                const uploadFormData = new FormData();
                uploadFormData.append('file', formData.documentFile);

                const uploadResponse = await fetch(`${getApiUrl()}/upload`, {
                    method: 'POST',
                    credentials: 'include',
                    body: uploadFormData,
                });

                if (uploadResponse.ok) {
                    const uploadResult = await uploadResponse.json();
                    documentUrl = uploadResult.url;
                }
            }

            let lat: number | undefined;
            let lng: number | undefined;
            if (formData.coordinates) {
                const [latStr, lngStr] = formData.coordinates.split(',').map((s) => s.trim());
                lat = parseFloat(latStr);
                lng = parseFloat(lngStr);
            }

            const payload = {
                idCard: formData.idCard,
                firstName: formData.firstName,
                lastName: formData.lastName,
                gender: formData.gender,
                phone: formData.phone,
                mobilityStatus: formData.patientStatus,
                diseaseIds: formData.disease.filter((d) => d.id).map((d) => d.id),
                customDiseases: formData.disease.filter((d) => !d.id).map((d) => d.name),
                birthDate: formData.birthDate,
                lat,
                lng,
                villageName: formData.villageName,
                subdistrictName: formData.subdistrictName,
                districtName: formData.districtName,
                provinceName: formData.provinceName,
                country: formData.country,
                addressDetail: formData.addressDetail,
                pictureUrl,
                relationship: formData.relationship,
                additionalDetails: formData.additionalDetails,
                documentUrl,
                organizationId: formData.organizationId,
                organizationName: formData.organizationName,
            };

            console.log('📝 ข้อมูลที่จะส่งไปบันทึก (Payload):', payload);

            const response = await fetch(`${getApiUrl()}/caregiver/register-elderly`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'ไม่สามารถบันทึกข้อมูลได้');
            }

            await Swal.fire({
                icon: 'success',
                title: 'บันทึกข้อมูลสำเร็จ!',
                html: `
                    <p style="margin-bottom: 8px;">เพิ่มข้อมูลประชาชนเรียบร้อยแล้ว</p>
                    <p style="color: #666; font-size: 14px;">รอเจ้าหน้าที่เทศบาลตรวจสอบและอนุมัติ<br/>ระบบจะแจ้งเตือนเมื่อได้รับการอนุมัติ</p>
                `,
                confirmButtonColor: '#1E7D55',
                confirmButtonText: 'ตกลง',
            });
            if (onSuccess) {
                onSuccess();
            } else {
                router.push('/caregiver/home');
            }
        } catch (err: unknown) {
            console.error('Error registering elderly:', err);
            const message = err instanceof Error ? err.message : 'ไม่สามารถบันทึกข้อมูลได้';
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: message,
                confirmButtonColor: '#1E7D55',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <form onSubmit={handleSubmit} className="space-y-3x" noValidate>
                <div>
                    <h2 className="typo-body font-semibold text-text-primary mb-2x">กรอกข้อมูลประชาชน</h2>

                    <ElderlyProfileImage
                        picturePreview={formData.picturePreview}
                        onImageChange={handleProfileImageChange}
                    />

                    <ElderlyInfoFields
                        formData={{
                            idCard: formData.idCard,
                            firstName: formData.firstName,
                            lastName: formData.lastName,
                            gender: formData.gender,
                            phone: formData.phone,
                            patientStatus: formData.patientStatus,
                            disease: formData.disease,
                            birthDate: formData.birthDate,
                        }}
                        onChange={handleInputChange}
                    />

                    <div className="mt-2x">
                        <LocationFields
                            coordinates={formData.coordinates}
                            villageName={formData.villageName}
                            subdistrictName={formData.subdistrictName}
                            districtName={formData.districtName}
                            provinceName={formData.provinceName}
                            addressDetail={formData.addressDetail}
                            onMapSelect={() => setShowMapPicker(true)}
                            onAddressDetailChange={(value) => handleInputChange('addressDetail', value)}
                        />
                    </div>

                    <div className="mt-4 border-t border-border-neutral pt-4">
                        <MunicipalityAutocomplete
                            value={formData.organizationId}
                            onSelect={(id, name) => {
                                handleInputChange('organizationId', id);
                                handleInputChange('organizationName', name);
                            }}
                            required
                        />
                    </div>
                </div>

                <div>
                    <h2 className="typo-body font-semibold text-text-primary mb-2x">กรอกข้อมูลความสัมพันธ์</h2>

                    <RelationshipFields
                        formData={{
                            relationship: formData.relationship,
                            additionalDetails: formData.additionalDetails,
                            documentPreview: formData.documentPreview,
                            documentFile: formData.documentFile,
                        }}
                        onChange={handleInputChange}
                        onDocumentChange={handleDocumentChange}
                        onDocumentRemove={() =>
                            setFormData((prev) => ({ ...prev, documentFile: null, documentPreview: null }))
                        }
                    />
                </div>

                <div className="flex justify-center mt-4x">
                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full typo-button-sm py-2x px-4x rounded-square transition-all shadow-smooth-low flex items-center justify-center gap-2 ${!loading
                                ? 'bg-brand-primary hover:bg-btn-hover text-white hover:shadow-smooth-medium cursor-pointer'
                                : 'bg-field-disable text-text-disable cursor-not-allowed border border-border-neutral'
                            }`}
                    >
                        {loading && (
                            <svg
                                className="animate-spin h-5 w-5"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                            >
                                <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                ></circle>
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                            </svg>
                        )}
                        {loading ? 'กำลังบันทึก...' : 'ส่งคำขอเพิ่มผู้ดูแลประชาชน'}
                    </button>
                </div>
            </form>

            {showMapPicker && (
                <MapPicker
                    initialLat={currentCoords?.lat}
                    initialLng={currentCoords?.lng}
                    pictureUrl={formData.picturePreview || undefined}
                    onConfirm={handleMapConfirm}
                    onClose={() => setShowMapPicker(false)}
                />
            )}
        </>
    );
}
