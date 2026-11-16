"use client";

import { useState, useEffect, useRef } from "react";
import { getApiUrl } from '@/lib/api';
import { fetchWithAuth } from '@/lib/auth';
import { useRouter } from "next/navigation";
import { ProfileImageUpload } from "@/components/elderly/form/ProfileImageUpload";
import { PersonalInfoFields } from "@/components/elderly/form/PersonalInfoFields";
import { LocationPicker } from "@/components/elderly/form/LocationPicker";
import Swal from '@/lib/swal';
import { useAuth } from "@/contexts/AuthContext";
import type { NamedItem } from "@/types/common";

interface FormData {
    idCard: string;
    firstName: string;
    lastName: string;
    phone: string;
    relativePhone: string;
    relativeName: string;
    disease: NamedItem[];
    birthDate: string;
    gender: "male" | "female";
    houseNo: string;
    road: string;
    neighbourhood: string;
    placeName: string;
    villageName: string;
    subdistrictName: string;
    districtName: string;
    provinceName: string;
    postalCode: string;
    country: string;
    addressDetail: string;
    coordinates: string;
    patientStatus: "normal" | "special" | "urgent";
}

interface SharedRegisterFormProps {
    redirectPath: string;
    roleName: "patient" | "caregiver" | "volunteer";
    targetRole?: "USERS" | "CAREGIVER" | "DRIVE" | "CAREU";
    title?: string;
    showMobilityStatus?: boolean;
    showDisease?: boolean;
}

export default function SharedRegisterForm({
    redirectPath,
    roleName,
    targetRole,
    title,
    showMobilityStatus = true,
    showDisease = true,
}: SharedRegisterFormProps) {
    const router = useRouter();
    const { user, refreshUser } = useAuth();

    const [formData, setFormData] = useState<FormData>({
        idCard: "",
        firstName: "",
        lastName: "",
        phone: "",
        relativePhone: "",
        relativeName: "",
        disease: [],
        birthDate: "",
        gender: "female",
        houseNo: "",
        road: "",
        neighbourhood: "",
        placeName: "",
        villageName: "",
        subdistrictName: "",
        districtName: "",
        provinceName: "",
        postalCode: "",
        country: "",
        addressDetail: "",
        coordinates: "",
        patientStatus: "normal",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedProfileImage, setSelectedProfileImage] = useState<File | null>(null);
    const alertShownRef = useRef(false);

    const mapMobilityToPatientStatus = (mobilityStatus?: string): "normal" | "special" | "urgent" => {
        switch (mobilityStatus) {
            case "WALKING": return "normal";
            case "WHEELCHAIR": return "special";
            case "BEDRIDDEN": return "urgent";
            default: return "normal";
        }
    };

    const mapPatientStatusToMobility = (patientStatus: string): string => {
        switch (patientStatus) {
            case "normal": return "WALKING";
            case "special": return "WHEELCHAIR";
            case "urgent": return "BEDRIDDEN";
            default: return "WALKING";
        }
    };

    useEffect(() => {
        if (user) {
            const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
            const idCardFromQuery = searchParams?.get("idCard") || "";
            const phoneFromQuery = searchParams?.get("phone") || "";
            const hasQueryParams = Boolean(idCardFromQuery || phoneFromQuery);

            const isAlreadyActiveInRole = () => {
                if (hasQueryParams) return false;

                if (!user.phone || !user.idCard) return false;
                if (targetRole === 'DRIVE') {
                    return user.role === 'DRIVE' || user.allowedRoles?.includes('DRIVE');
                }
                if (targetRole === 'CAREU') {
                    return user.role === 'CAREU' || user.allowedRoles?.includes('CAREU');
                }
                if (roleName === 'caregiver') {
                    return (user.role === 'CAREGIVER' || user.allowedRoles?.includes('CAREGIVER')) && Boolean(user.firstName);
                }
                if (roleName === 'patient') {
                    return user.role === 'USERS' && Boolean(user.firstName) && Boolean(user.idCard);
                }
                return false;
            };

            if (isAlreadyActiveInRole()) {
                if (!alertShownRef.current) {
                    alertShownRef.current = true;
                    Swal.fire({
                        icon: 'info',
                        title: 'คุณลงทะเบียนเรียบร้อยแล้ว',
                        text: 'ระบบจะพาคุณไปยังหน้าหลัก',
                        timer: 1500,
                        showConfirmButton: false
                    }).then(async () => {
                        const requiredRole = targetRole || (roleName === 'caregiver' ? 'CAREGIVER' : 'USERS');
                        if (user.role !== requiredRole && (user.allowedRoles?.includes(requiredRole) || user.role === 'ADMIN')) {
                            try {
                                await fetchWithAuth('/auth/switch-role', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ role: requiredRole }),
                                });
                                await refreshUser();
                            } catch (e) {
                                console.error('Failed to switch role on already registered redirect:', e);
                            }
                        }

                        const targetPath = targetRole === 'DRIVE'
                            ? '/volunteer/driver'
                            : targetRole === 'CAREU'
                                ? '/volunteer/careu/home'
                                : (redirectPath === '/elderly/verify' ? '/elderly/home' : redirectPath);
                        router.push(targetPath);
                    });
                }
                return;
            }

            setFormData({
                idCard: user.idCard || idCardFromQuery,
                firstName: user.firstName || "",
                lastName: user.lastName || "",
                phone: user.phone || phoneFromQuery,
                relativePhone: user.relativePhone || "",
                relativeName: user.relativeName || "",
                disease: user.allDiseases
                    ? user.allDiseases.map((d: any) => ({
                        id: d.type === 'db' ? d.id : undefined,
                        name: d.name
                    }))
                    : [],
                birthDate: user.birthDate || "",
                gender: (user.gender as "male" | "female") || "female",
                houseNo: user.houseNo || "",
                road: user.road || "",
                neighbourhood: user.neighbourhood || "",
                placeName: user.placeName || "",
                villageName: user.villageName || "",
                subdistrictName: user.subdistrictName || "",
                districtName: user.districtName || "",
                provinceName: user.provinceName || "",
                postalCode: user.postalCode || "",
                country: user.country || "",
                addressDetail: user.addressDetail || "",
                coordinates: (user.lat && user.lng) ? `${user.lat},${user.lng}` : "",
                patientStatus: mapMobilityToPatientStatus(user.mobilityStatus),
            });
        }
    }, [user, router, redirectPath, targetRole, roleName]);

    const handleFieldChange = (field: string, value: any) => {
        setFormData({ ...formData, [field]: value });
    };

    const handleImageSelect = (file: File | null) => {
        setSelectedProfileImage(file);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) {
            Swal.fire({ icon: 'warning', title: 'กรุณาเข้าสู่ระบบก่อน', confirmButtonColor: '#1E7D55' });
            return;
        }

        if (!formData.idCard || formData.idCard.length !== 13) {
            Swal.fire({ icon: 'warning', title: 'ข้อมูลไม่ถูกต้อง', text: 'เลขบัตรประชาชนต้องมี 13 หลัก', confirmButtonColor: '#1E7D55' });
            return;
        }

        if (!formData.phone || formData.phone.length !== 10) {
            Swal.fire({ icon: 'warning', title: 'ข้อมูลไม่ถูกต้อง', text: 'เบอร์โทรศัพท์ต้องมี 10 หลัก', confirmButtonColor: '#1E7D55' });
            return;
        }

        if (!formData.relativePhone || formData.relativePhone.length !== 10) {
            Swal.fire({ icon: 'warning', title: 'ข้อมูลไม่ถูกต้อง', text: 'เบอร์โทรญาติ ต้องมี 10 หลัก', confirmButtonColor: '#1E7D55' });
            return;
        }

        if (!formData.relativeName.trim()) {
            Swal.fire({ icon: 'warning', title: 'กรุณากรอกข้อมูลให้ครบ', text: 'กรุณากรอก ชื่อญาติ', confirmButtonColor: '#1E7D55' });
            return;
        }

        if (formData.firstName.length > 50 || formData.lastName.length > 50) {
            Swal.fire({ icon: 'warning', title: 'ข้อมูลไม่ถูกต้อง', text: 'ชื่อ-สกุล ต้องไม่เกิน 50 ตัวอักษร', confirmButtonColor: '#1E7D55' });
            return;
        }

        if (formData.addressDetail.length > 255) {
            Swal.fire({ icon: 'warning', title: 'ข้อมูลไม่ถูกต้อง', text: 'รายละเอียดที่อยู่ ต้องไม่เกิน 255 ตัวอักษร', confirmButtonColor: '#1E7D55' });
            return;
        }

        if (!selectedProfileImage && !user?.pictureUrl) {
            Swal.fire({ icon: 'warning', title: 'กรุณากรอกข้อมูลให้ครบ', text: 'กรุณาอัพโหลดรูปภาพโปรไฟล์', confirmButtonColor: '#1E7D55' });
            return;
        }

        if (!formData.firstName.trim() || !formData.lastName.trim()) {
            Swal.fire({ icon: 'warning', title: 'กรุณากรอกข้อมูลให้ครบ', text: 'กรุณากรอกชื่อและนามสกุล', confirmButtonColor: '#1E7D55' });
            return;
        }

        if (!formData.birthDate) {
            Swal.fire({ icon: 'warning', title: 'กรุณากรอกข้อมูลให้ครบ', text: 'กรุณาเลือกวันเกิด', confirmButtonColor: '#1E7D55' });
            return;
        }

        if (!formData.coordinates.trim()) {
            Swal.fire({ icon: 'warning', title: 'กรุณากรอกข้อมูลให้ครบ', text: 'กรุณาเลือกตำแหน่งที่อยู่บนแผนที่', confirmButtonColor: '#1E7D55' });
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
                const uploadResponse = await fetch(`${getApiUrl()}/upload/profile-picture`, { method: 'POST', credentials: 'include', body: uploadFormData });
                if (uploadResponse.ok) {
                    const uploadResult = await uploadResponse.json();
                    profilePictureUrl = uploadResult.url;
                }
            }

            const submitData = {
                idCard: formData.idCard,
                firstName: formData.firstName,
                lastName: formData.lastName,
                phone: formData.phone,
                relativePhone: formData.relativePhone,
                relativeName: formData.relativeName,
                diseaseIds: formData.disease.filter(d => d.id).map(d => d.id),
                customDiseases: formData.disease.filter(d => !d.id).map(d => d.name),
                birthDate: formData.birthDate,
                gender: formData.gender,
                placeName: formData.placeName,
                houseNo: formData.houseNo,
                road: formData.road,
                neighbourhood: formData.neighbourhood,
                villageName: formData.villageName,
                subdistrictName: formData.subdistrictName,
                districtName: formData.districtName,
                provinceName: formData.provinceName,
                postalCode: formData.postalCode,
                country: formData.country,
                addressDetail: formData.addressDetail,
                lat,
                lng,
                mobilityStatus: mapPatientStatusToMobility(formData.patientStatus),
                privacyAcceptedAt: new Date().toISOString(),
                privacyVersion: "2.0",
                ...(profilePictureUrl && { pictureUrl: profilePictureUrl }),
            };

            const response = await fetch(`${getApiUrl()}/users/profile`, {
                method: "PATCH",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(submitData),
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.message || "ไม่สามารถบันทึกข้อมูลได้");
            }

            if (targetRole === 'DRIVE' || targetRole === 'CAREU') {
                try {
                    await fetch(`${getApiUrl()}/role-requests`, {
                        method: 'POST',
                        credentials: 'include',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            requestedRole: targetRole,
                            reason: targetRole === 'DRIVE' ? 'ลงทะเบียนสมัครเป็นเจ้าหน้าที่รถ' : 'ลงทะเบียนสมัครเป็นจิตอาสาแคร์ยู',
                        }),
                    });
                } catch (roleErr) {
                    console.warn('Role request error:', roleErr);
                }

                await Swal.fire({
                    icon: 'success',
                    title: 'บันทึกข้อมูลเรียบร้อยแล้ว!',
                    html: `
                        <p style="margin-bottom: 8px;">ข้อมูลของท่านถูกบันทึกในระบบเรียบร้อยแล้ว</p>
                        <p style="color: #666; font-size: 14px;">กรุณารอเจ้าหน้าที่เทศบาลตรวจสอบและอนุมัติก่อนเริ่มใช้งาน</p>
                    `,
                    confirmButtonColor: '#1E7D55',
                    confirmButtonText: 'ตกลง',
                });
                await refreshUser();
                router.push('/volunteer/pending');
                return;
            } else if (roleName === 'caregiver') {
                try {
                    await fetch(`${getApiUrl()}/auth/switch-role`, {
                        method: 'POST',
                        credentials: 'include',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ role: 'CAREGIVER' }),
                    });
                } catch (roleErr) {
                    console.warn('Caregiver role switch error:', roleErr);
                }

                await Swal.fire({
                    icon: 'success',
                    title: 'บันทึกข้อมูลสำเร็จ!',
                    confirmButtonColor: '#1E7D55',
                    timer: 1500,
                    showConfirmButton: false,
                });
                await refreshUser();
                router.push('/caregiver/home');
                return;
            } else {
                await Swal.fire({
                    icon: 'success',
                    title: 'บันทึกข้อมูลสำเร็จ!',
                    confirmButtonColor: '#1E7D55',
                    timer: 1500,
                    showConfirmButton: false,
                });
                await refreshUser();
                router.push('/elderly/home');
                return;
            }
        } catch (error: any) {
            console.error("Error submitting form:", error);
            Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: error.message || "ไม่สามารถบันทึกข้อมูลได้", confirmButtonColor: '#1E7D55' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const formHeading = title || (
        targetRole === 'DRIVE'
            ? 'กรอกข้อมูลเจ้าหน้าที่รถ'
            : targetRole === 'CAREU'
                ? 'กรอกข้อมูลจิตอาสาแคร์ยู'
                : roleName === 'caregiver'
                    ? 'กรอกข้อมูลผู้ดูแลประชาชน'
                    : 'กรอกข้อมูลประชาชน'
    );

    return (
        <div className="px-2x py-3x">
            <div className="max-w-lg mx-auto">
                <h1 className="font-bold text-brand-primary text-center mb-3x">{formHeading}</h1>
                <div className="bg-white p-3x mb-2x">
                    <form onSubmit={handleSubmit} className="space-y-2x">
                        <ProfileImageUpload currentImageUrl={user?.pictureUrl} onImageSelect={handleImageSelect} />
                        <PersonalInfoFields
                            formData={formData}
                            onChange={handleFieldChange}
                            patientStatus={formData.patientStatus}
                            onPatientStatusChange={(value) => handleFieldChange('patientStatus', value)}
                            showMobilityStatus={showMobilityStatus}
                            showDisease={showDisease}
                        />

                        <LocationPicker
                            coordinates={formData.coordinates}
                            placeName={formData.placeName}
                            houseNo={formData.houseNo}
                            road={formData.road}
                            neighbourhood={formData.neighbourhood}
                            villageName={formData.villageName}
                            subdistrictName={formData.subdistrictName}
                            districtName={formData.districtName}
                            provinceName={formData.provinceName}
                            postalCode={formData.postalCode}
                            country={formData.country}
                            addressDetail={formData.addressDetail}
                            onCoordinatesChange={(value) => handleFieldChange('coordinates', value)}
                            onAddressComponentsChange={(components) => {
                                setFormData(prev => ({
                                    ...prev,
                                    placeName: components.placeName || '',
                                    houseNo: components.houseNo || '',
                                    road: components.road || '',
                                    neighbourhood: components.neighbourhood || '',
                                    villageName: components.villageName || '',
                                    subdistrictName: components.subdistrictName || '',
                                    districtName: components.districtName || '',
                                    provinceName: components.provinceName || '',
                                    postalCode: components.postalCode || '',
                                    country: components.country || '',
                                }));
                            }}
                            onAddressDetailChange={(detail) => handleFieldChange('addressDetail', detail)}
                        />

                        <div className="space-y-2x mt-2x mb-2x">
                            <h3 className="font-semibold text-text-primary text-sm uppercase tracking-wide">
                                ข้อมูลติดต่อฉุกเฉิน / ญาติผู้ดูแลประชาชน
                            </h3>
                            <div>
                                <label className="typo-body text-text-tertiary mb-1x block">
                                    ชื่อญาติ <span className="text-semantic-critical">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.relativeName || ''}
                                    onChange={(e) => handleFieldChange('relativeName', e.target.value)}
                                    className="w-full p-2x typo-body text-text-primary bg-white border border-border-neutral rounded-square focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition-all"
                                    placeholder="กรอกชื่อญาติ"
                                    maxLength={100}
                                />
                            </div>
                            <div>
                                <label className="typo-body text-text-tertiary mb-1x block">
                                    เบอร์โทรญาติ (ติดต่อได้จริง) <span className="text-semantic-critical">*</span>
                                </label>
                                <input
                                    type="tel"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    value={formData.relativePhone || ''}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/\D/g, '');
                                        handleFieldChange('relativePhone', value);
                                    }}
                                    className="w-full p-2x typo-body text-text-primary bg-white border border-border-neutral rounded-square focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition-all"
                                    placeholder="เบอร์โทรญาติ 10 หลัก (เช่น 0812345678)"
                                    maxLength={10}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`w-full typo-button-sm py-2x px-3x rounded-square transition-all shadow-smooth-low mt-4x flex items-center justify-center gap-2 ${!isSubmitting ? 'bg-brand-primary hover:bg-btn-hover text-white hover:shadow-smooth-medium cursor-pointer' : 'bg-field-disable text-text-disable cursor-not-allowed'}`}
                        >
                            {isSubmitting ? 'กรุณารอสักครู่...' : 'บันทึก'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
