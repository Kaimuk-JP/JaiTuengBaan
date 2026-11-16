'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { fetchWithAuth } from '@/lib/auth';
import Swal from '@/lib/swal';
import { User } from '@/types/user';
import PersonnelDetailForm from '../PersonnelDetailForm';
import PatientBookingHistory from '../PatientBookingHistory';
import VolunteerAssignedJobs from '../VolunteerAssignedJobs';
import VolunteerWorkHistory from '../VolunteerWorkHistory';
import CaregiverPatientsList from '../CaregiverPatientsList';
import ImageSourcePicker from '@/components/shared/ImageSourcePicker';

interface PersonnelDetailContainerProps {
    id: string;
}

const roleLabels: Record<string, string> = {
    'USERS': 'ผู้ใช้บริการ',
    'CAREGIVER': 'ผู้ดูแลประชาชน / ญาติ',
    'DRIVE': 'เจ้าหน้าที่รถ',
    'CAREU': 'จิตอาสาแคร์ยู',
    'STAFF': 'เจ้าหน้าที่เทศบาล',
    'EXECUTIVE': 'ผู้บริหาร / ผู้อนุมัติ',
    'ADMIN': 'แอดมิน',
};

export default function PersonnelDetailContainer({ id }: PersonnelDetailContainerProps) {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'info' | 'history' | 'jobs' | 'patients' | 'work-history'>('info');
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState<any>({});
    const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
    const [isImagePickerOpen, setIsImagePickerOpen] = useState(false);
    const [caregiverBookings, setCaregiverBookings] = useState<any[]>([]);
    const [historyQueues, setHistoryQueues] = useState<any[]>([]);
    const [historyPage, setHistoryPage] = useState(1);

    const [historyTotal, setHistoryTotal] = useState(0);
    const [historySearch, setHistorySearch] = useState('');

    const ITEMS_PER_PAGE = 20;

    const fetchCaregiverBookings = useCallback(async () => {
        if (!user || user.role !== 'CAREGIVER') return;
        try {
            const response = await fetchWithAuth(`/caregiver/${id}/bookings`);
            if (response.ok) {
                const data = await response.json();
                setCaregiverBookings(data);
            }
        } catch (error) {
            console.error('Error fetching caregiver bookings:', error);
        }
    }, [user, id]);



    const fetchElderlyHistory = useCallback(async () => {
        if (!user || user.role !== 'USERS') return;
        try {
            const searchQuery = historySearch ? `&search=${encodeURIComponent(historySearch)}` : '';
            const response = await fetchWithAuth(`/queues/user/${id}?page=${historyPage}&limit=${ITEMS_PER_PAGE}${searchQuery}`);
            if (response.ok) {
                const data = await response.json();
                if (data.queues) {
                    setHistoryQueues(data.queues);
                    setHistoryTotal(data.total);
                } else if (Array.isArray(data)) {
                    setHistoryQueues(data);
                    setHistoryTotal(data.length);
                }
            }
        } catch (error) {
            console.error('Error fetching elderly history:', error);
        }
    }, [user, id, historyPage, historySearch]);

    useEffect(() => {
        if (activeTab === 'history') {
            if (user?.role === 'CAREGIVER') {
                fetchCaregiverBookings();
            } else if (user?.role === 'USERS') {
                fetchElderlyHistory();
            }
        }
    }, [activeTab, user, fetchCaregiverBookings, fetchElderlyHistory]);

    const fetchUser = useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetchWithAuth(`/users/${id}`);
            if (!response.ok) {
                throw new Error('ไม่สามารถดึงข้อมูลได้');
            }
            const data = await response.json();
            setUser(data);

            const mappedDiseases = [
                ...(data.diseases?.map((d: any) => ({ id: d.disease.id, name: d.disease.name })) || []),
                ...(data.customDiseases?.map((name: string) => ({ name })) || [])
            ];

            setFormData({
                ...data,
                diseases: mappedDiseases
            });
        } catch (err: any) {
            console.error(err);
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: err.message,
            });
            router.push('/staff/personnel');
        } finally {
            setLoading(false);
        }
    }, [id, router]);

    useEffect(() => {
        fetchUser();
    }, [fetchUser]);

    const handleEdit = () => {
        const mappedDiseases = [
            ...(user?.diseases?.map((d: any) => ({ id: d.disease.id, name: d.disease.name })) || []),
            ...(user?.customDiseases?.map((name: string) => ({ name })) || [])
        ];

        setFormData({
            ...user,
            birthDate: user?.birthDate || '',
            firstName: user?.firstName || '',
            lastName: user?.lastName || '',
            phone: user?.phone || '',
            gender: user?.gender || '',
            mobilityStatus: user?.mobilityStatus || 'WALKING',
            medicalConditions: user?.medicalConditions || '',
            villageName: user?.villageName || '',
            provinceName: user?.provinceName || '',
            districtName: user?.districtName || '',
            subdistrictName: user?.subdistrictName || '',
            addressDetail: user?.addressDetail || '',
            relativeName: user?.relativeName || '',
            relativePhone: user?.relativePhone || '',
            diseases: mappedDiseases
        });
        setIsEditing(true);
    };

    const handleCancel = () => {
        setIsEditing(false);
        const mappedDiseases = [
            ...(user?.diseases?.map((d: any) => ({ id: d.disease.id, name: d.disease.name })) || []),
            ...(user?.customDiseases?.map((name: string) => ({ name })) || [])
        ];
        if (user) {
            setFormData({
                ...user,
                diseases: mappedDiseases
            });
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev: any) => ({ ...prev, [name]: value }));
    };

    const handleDiseaseChange = (diseases: any[]) => {
        setFormData((prev: any) => ({ ...prev, diseases }));
    };

    const handleFormDataChange = (updates: Record<string, string>) => {
        setFormData((prev: any) => ({ ...prev, ...updates }));
    };

    const handleSave = async () => {
        try {
            setIsSaving(true);

            let finalPictureUrl = user?.pictureUrl;

            if (selectedImageFile) {
                const formDataUpload = new FormData();
                formDataUpload.append('file', selectedImageFile);

                const uploadResponse = await fetchWithAuth('/upload/profile-picture', {
                    method: 'POST',
                    body: formDataUpload,
                });

                if (uploadResponse.ok) {
                    const uploadResult = await uploadResponse.json();
                    finalPictureUrl = uploadResult.url;
                } else {
                    Swal.fire({
                        icon: 'warning',
                        title: 'เกิดข้อผิดพลาด',
                        text: 'ไม่สามารถอัปโหลดรูปภาพได้',
                    });
                    setIsSaving(false);
                    return;
                }
            }

            const diseaseIds = formData.diseases
                ?.filter((d: any) => d.id)
                .map((d: any) => d.id) || [];

            const customDiseases = formData.diseases
                ?.filter((d: any) => !d.id)
                .map((d: any) => d.name) || [];

            const missingFields: string[] = [];
            const invalidFields: string[] = [];

            if (!formData.idCard?.trim()) {
                missingFields.push('เลขบัตรประชาชน');
            } else if (formData.idCard.length !== 13) {
                invalidFields.push('เลขบัตรประชาชนต้องมี 13 หลัก');
            }

            if (!formData.firstName?.trim()) missingFields.push('ชื่อ');
            if (!formData.lastName?.trim()) missingFields.push('นามสกุล');

            if (!formData.phone?.trim()) {
                missingFields.push('เบอร์โทร');
            } else if (formData.phone.length !== 10) {
                invalidFields.push('เบอร์โทรต้องมี 10 หลัก');
            }

            if (!formData.gender) missingFields.push('เพศ');
            if (!formData.birthDate) missingFields.push('วันเดือนปีเกิด');
            if (!formData.provinceName?.trim()) missingFields.push('จังหวัด');
            if (!formData.districtName?.trim()) missingFields.push('อำเภอ / เขต');
            if (!formData.subdistrictName?.trim()) missingFields.push('ตำบล / แขวง');
            if (!formData.addressDetail?.trim()) missingFields.push('รายละเอียดที่อยู่');

            if (missingFields.length > 0 || invalidFields.length > 0) {
                const lines: string[] = [];
                if (missingFields.length > 0) {
                    lines.push('<b>กรุณากรอกข้อมูลที่ขาด:</b>');
                    missingFields.forEach(f => lines.push(`• ${f}`));
                }
                if (invalidFields.length > 0) {
                    if (lines.length > 0) lines.push('');
                    lines.push('<b>ข้อมูลไม่ถูกต้อง:</b>');
                    invalidFields.forEach(f => lines.push(`• ${f}`));
                }

                Swal.fire({
                    icon: 'warning',
                    title: 'ข้อมูลไม่ครบถ้วน',
                    html: lines.join('<br/>'),
                });
                setIsSaving(false);
                return;
            }

            const payload: any = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                idCard: formData.idCard,
                phone: formData.phone,
                birthDate: formData.birthDate,
                gender: formData.gender,
                villageName: formData.villageName,
                provinceName: formData.provinceName,
                districtName: formData.districtName,
                subdistrictName: formData.subdistrictName,
                addressDetail: formData.addressDetail,
                diseaseIds,
                customDiseases
            };

            if (finalPictureUrl) {
                payload.pictureUrl = finalPictureUrl;
            }

            if (user?.role === 'USERS' || user?.role === 'CAREGIVER') {
                payload.mobilityStatus = formData.mobilityStatus || 'WALKING';
                payload.relativeName = formData.relativeName || null;
                payload.relativePhone = formData.relativePhone || null;
            }

            const response = await fetchWithAuth(`/users/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                await fetchUser();
                setIsEditing(false);
                setSelectedImageFile(null);
                Swal.fire({
                    icon: 'success',
                    title: 'บันทึกสำเร็จ',
                    text: 'ข้อมูลได้รับการแก้ไขเรียบร้อยแล้ว',
                    timer: 1500,
                    showConfirmButton: false,
                });
            } else {
                throw new Error('ไม่สามารถอัปเดตข้อมูลผู้ใช้ได้');
            }
        } catch (error) {
            console.error('Error updating user:', error);
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: 'ไม่สามารถบันทึกข้อมูลได้',
            });
        } finally {
            setIsSaving(false);
        }
    };

    const isVolunteer = user?.role === 'DRIVE';
    const isCaregiver = user?.role === 'CAREGIVER';
    const isElderly = user?.role === 'USERS';

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
            </div>
        );
    }

    if (!user) return;

    return (
        <div className="p-3x pb-20">
            <div className="flex flex-col lg:flex-row gap-6">
                { }
                <div className="w-full lg:w-1/4 flex flex-col gap-6">
                    { }
                    <div className="bg-white rounded-2xl p-6 flex flex-col items-center border border-border-default shadow-sm">
                        <div className="relative group w-24 h-24 mb-4">
                            <div className="w-full h-full rounded-full bg-brand-primary_light/20 flex items-center justify-center border-2 border-brand-primary overflow-hidden bg-white">
                                {selectedImageFile ? (
                                    <img src={URL.createObjectURL(selectedImageFile)} alt="Preview" className="w-full h-full object-cover" />
                                ) : user.pictureUrl ? (
                                    <img src={user.pictureUrl} alt={user.displayName} className="w-full h-full object-cover" />
                                ) : (
                                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-brand-primary" strokeWidth="1.5">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                        <circle cx="12" cy="7" r="4"></circle>
                                    </svg>
                                )}
                            </div>

                            {isEditing && (
                                <button
                                    onClick={() => setIsImagePickerOpen(true)}
                                    className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-white border border-gray-200 shadow-md flex items-center justify-center text-gray-600 hover:text-brand-primary hover:border-brand-primary transition-colors cursor-pointer z-10"
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
                                        <path d="m15 5 4 4" />
                                    </svg>
                                </button>
                            )}
                        </div>
                        <h2 className="w-full text-[1.75rem] font-normal text-center text-text-primary mb-1 leading-[140%] break-all px-2">
                            {user.displayName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'ไม่ระบุชื่อ'}
                        </h2>
                        { }
                        <span className="text-sm text-text-tertiary">{roleLabels[user.role || ''] || user.role}</span>
                    </div>

                    { }
                    <div className="flex flex-col gap-2">
                        { }
                        <button
                            onClick={() => setActiveTab('info')}
                            className={`p-4 rounded-xl text-left border transition-all flex items-center gap-3 ${activeTab === 'info'
                                ? 'bg-brand-primary text-white border-brand-primary shadow-md'
                                : 'bg-white text-text-primary border-border-default hover:bg-slate-50'
                                }`}
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                            <span className="text-sm font-normal">ข้อมูลส่วนตัว</span>
                        </button>

                        { }
                        {isVolunteer && (
                            <>
                                <button
                                    onClick={() => setActiveTab('jobs')}
                                    className={`p-4 rounded-xl text-left border transition-all flex items-center gap-3 ${activeTab === 'jobs'
                                        ? 'bg-brand-primary text-white border-brand-primary shadow-md'
                                        : 'bg-white text-text-primary border-border-default hover:bg-slate-50'
                                        }`}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                        <line x1="16" y1="2" x2="16" y2="6"></line>
                                        <line x1="8" y1="2" x2="8" y2="6"></line>
                                        <line x1="3" y1="10" x2="21" y2="10"></line>
                                    </svg>
                                    <span className="text-sm font-normal">งานที่ได้รับมอบหมาย</span>
                                </button>
                                <button
                                    onClick={() => setActiveTab('work-history')}
                                    className={`p-4 rounded-xl text-left border transition-all flex items-center gap-3 ${activeTab === 'work-history'
                                        ? 'bg-brand-primary text-white border-brand-primary shadow-md'
                                        : 'bg-white text-text-primary border-border-default hover:bg-slate-50'
                                        }`}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span className="text-sm font-normal">ประวัติการทำงาน</span>
                                </button>
                            </>
                        )}



                        { }
                        {isCaregiver && (
                            <button
                                onClick={() => setActiveTab('patients')}
                                className={`p-4 rounded-xl text-left border transition-all flex items-center gap-3 ${activeTab === 'patients'
                                    ? 'bg-brand-primary text-white border-brand-primary shadow-md'
                                    : 'bg-white text-text-primary border-border-default hover:bg-slate-50'
                                    }`}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="9" cy="7" r="4"></circle>
                                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                                </svg>
                                <span className="text-sm font-normal">ประชาชนในความดูแล</span>
                            </button>
                        )}

                        { }
                        {isCaregiver && (
                            <button
                                onClick={() => router.push(`/staff/personnel/${id}/add-caregiver`)}
                                className="p-4 rounded-xl text-left border transition-all flex items-center gap-3 bg-white text-text-primary border-border-default hover:bg-slate-50"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="8.5" cy="7" r="4"></circle>
                                    <line x1="20" y1="8" x2="20" y2="14"></line>
                                    <line x1="23" y1="11" x2="17" y2="11"></line>
                                </svg>
                                <span className="text-sm font-normal">เพิ่มประชาชนในความดูแล</span>
                            </button>
                        )}

                        { }
                        {(isElderly || isCaregiver) && (
                            <button
                                onClick={() => setActiveTab('history')}
                                className={`p-4 rounded-xl text-left border transition-all flex items-center gap-3 ${activeTab === 'history'
                                    ? 'bg-brand-primary text-white border-brand-primary shadow-md'
                                    : 'bg-white text-text-primary border-border-default hover:bg-slate-50'
                                    }`}
                            >
                                <svg width="20" height="21" viewBox="0 0 20 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M1.5 6.423H15.5V3.923C15.5 3.846 15.4679 3.7755 15.4038 3.7115C15.3398 3.64733 15.2693 3.61525 15.1923 3.61525H1.80775C1.73075 3.61525 1.66025 3.64733 1.59625 3.7115C1.53208 3.7755 1.5 3.846 1.5 3.923V6.423ZM1.80775 19.1152C1.30258 19.1152 0.875 18.9403 0.525 18.5903C0.175 18.2402 0 17.8127 0 17.3075V3.923C0 3.41783 0.175 2.99025 0.525 2.64025C0.875 2.29025 1.30258 2.11525 1.80775 2.11525H3.19225V0.769C3.19225 0.549834 3.26567 0.366833 3.4125 0.22C3.55933 0.073333 3.74233 0 3.9615 0C4.18083 0 4.36383 0.073333 4.5105 0.22C4.65733 0.366833 4.73075 0.549834 4.73075 0.769V2.11525H12.3078V0.75C12.3078 0.537167 12.3795 0.358916 12.523 0.21525C12.6667 0.0717496 12.8449 0 13.0578 0C13.2706 0 13.4488 0.0717496 13.5923 0.21525C13.7359 0.358916 13.8078 0.537167 13.8078 0.75V2.11525H15.1923C15.6974 2.11525 16.125 2.29025 16.475 2.64025C16.825 2.99025 17 3.41783 17 3.923V8.6365C17 8.84933 16.9282 9.0275 16.7845 9.171C16.641 9.31467 16.4628 9.3865 16.25 9.3865C16.0372 9.3865 15.859 9.31467 15.7155 9.171C15.5718 9.0275 15.5 8.84933 15.5 8.6365V7.923H1.5V17.3075C1.5 17.3845 1.53208 17.455 1.59625 17.519C1.66025 17.5832 1.73075 17.6152 1.80775 17.6152H7.925C8.13783 17.6152 8.31608 17.6871 8.45975 17.8307C8.60325 17.9742 8.675 18.1524 8.675 18.3652C8.675 18.5781 8.60325 18.7563 8.45975 18.8997C8.31608 19.0434 8.13783 19.1152 7.925 19.1152H1.80775ZM14.6923 20.1152C13.4436 20.1152 12.3814 19.6774 11.5058 18.8018C10.6301 17.9261 10.1923 16.8639 10.1923 15.6152C10.1923 14.3666 10.6301 13.3044 11.5058 12.4288C12.3814 11.5531 13.4436 11.1152 14.6923 11.1152C15.9411 11.1152 17.0033 11.5531 17.8788 12.4288C18.7544 13.3044 19.1923 14.3666 19.1923 15.6152C19.1923 16.8639 18.7544 17.9261 17.8788 18.8018C17.0033 19.6774 15.9411 20.1152 14.6923 20.1152ZM15.1348 15.4345V13.1152C15.1348 12.9948 15.0911 12.8909 15.0038 12.8038C14.9166 12.7166 14.8128 12.673 14.6923 12.673C14.5718 12.673 14.4679 12.7166 14.3808 12.8038C14.2936 12.8909 14.25 12.9948 14.25 13.1152V15.419C14.25 15.5395 14.2718 15.6542 14.3155 15.7632C14.359 15.8722 14.4276 15.9736 14.5213 16.0673L16.0463 17.5923C16.1334 17.6794 16.2357 17.7246 16.353 17.7278C16.4702 17.7309 16.5756 17.6858 16.6693 17.5923C16.7629 17.4986 16.8098 17.3948 16.8098 17.2808C16.8098 17.1666 16.7629 17.0627 16.6693 16.969L15.1348 15.4345Z" fill="currentColor" />
                                </svg>
                                <span className="text-sm font-normal">ประวัติการจอง</span>
                            </button>
                        )}
                    </div>
                </div>

                { }
                <div className="w-full lg:w-3/4">
                    <div className="bg-white rounded-2xl p-8 border border-border-default shadow-sm min-h-[800px] relative">
                        {activeTab === 'info' && (
                            <>
                                <div className="absolute top-4 right-4 flex gap-2 z-10">
                                    {!isEditing && (
                                        <button
                                            onClick={handleEdit}
                                            className="p-2 text-slate-400 hover:text-brand-primary transition-colors rounded-full hover:bg-slate-50"
                                            title="แก้ไขข้อมูล"
                                        >
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                            </svg>
                                        </button>
                                    )}
                                    <button
                                        onClick={() => {
                                            if (isEditing) {
                                                handleCancel();
                                            } else {
                                                router.push('/staff/personnel');
                                            }
                                        }}
                                        className="p-2 text-slate-400 hover:text-red-500 transition-colors rounded-full hover:bg-slate-50"
                                        title="ปิด"
                                    >
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M18 6L6 18"></path>
                                            <path d="M6 6L18 18"></path>
                                        </svg>
                                    </button>
                                </div>
                                <PersonnelDetailForm
                                    user={user}
                                    isEditing={isEditing}
                                    formData={formData}
                                    onChange={handleChange}
                                    onFormDataChange={handleFormDataChange}
                                    onDiseaseChange={handleDiseaseChange}
                                    onSave={handleSave}
                                    onCancel={handleCancel}
                                />
                            </>
                        )}
                        {activeTab === 'jobs' && isVolunteer && (
                            <VolunteerAssignedJobs volunteerId={user.id} />
                        )}
                        {activeTab === 'work-history' && isVolunteer && (
                            <VolunteerWorkHistory volunteerId={user.id} points={(user as any).pointsBalance || 0} />
                        )}

                        {activeTab === 'history' && (isElderly || isCaregiver) && (
                            <>
                                <h3 className="text-[1.75rem] font-normal text-text-primary leading-[140%] mb-6">
                                    ประวัติการจอง
                                </h3>
                                { }
                                <div className="mb-6 relative">
                                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-placeholder" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                    <input
                                        type="text"
                                        placeholder="ค้นหาด้วยวันที่ หรือโรงพยาบาล"
                                        value={historySearch}
                                        onChange={(e) => {
                                            setHistorySearch(e.target.value);
                                            setHistoryPage(1);
                                        }}
                                        className="w-full pl-10 pr-4 py-2 border border-border-default rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none"
                                    />
                                </div>

                                {isCaregiver ? (
                                    <PatientBookingHistory
                                        queues={caregiverBookings
                                            .filter(b => {
                                                if (!historySearch) return true;
                                                const search = historySearch.toLowerCase();
                                                const hospital = (b.hospitalName || '').toLowerCase();
                                                const date = (b.bookingDate || '').toLowerCase();
                                                const formattedDate = new Date(b.bookingDate).toLocaleDateString('th-TH', {
                                                    day: '2-digit',
                                                    month: '2-digit',
                                                    year: 'numeric'
                                                });
                                                return hospital.includes(search) || date.includes(search) || formattedDate.includes(search);
                                            })
                                            .slice((historyPage - 1) * ITEMS_PER_PAGE, historyPage * ITEMS_PER_PAGE)
                                            .map(b => ({
                                                id: b.id,
                                                requestDate: b.bookingDate,
                                                bookingTime: b.bookingTime,
                                                hasAppointment: b.bookingType === 'มีใบนัด',
                                                department: '',
                                                status: b.status,
                                                adminNote: '',
                                                requiredEquipment: b.requiredEquipment,
                                                appointmentImage: b.appointmentImage,
                                                hospital: { name: b.hospitalName },
                                                user: {
                                                    firstName: b.patientName,
                                                    displayName: b.patientName,
                                                    mobilityStatus: b.mobilityStatus,
                                                }
                                            }))}
                                    />
                                ) : (
                                    <PatientBookingHistory queues={historyQueues} />
                                )}

                                { }
                                {((isCaregiver && caregiverBookings.length > 0) || (!isCaregiver && historyTotal > 0)) && (
                                    <div className="flex justify-end items-center gap-4 mt-6">
                                        <button
                                            disabled={historyPage === 1}
                                            onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                                            className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white text-gray-700 transition-colors"
                                        >
                                            ก่อนหน้า
                                        </button>
                                        <span className="text-sm text-gray-600 font-medium">
                                            หน้า {historyPage} จาก {Math.ceil((isCaregiver
                                                ? caregiverBookings.filter(b => {
                                                    if (!historySearch) return true;
                                                    const search = historySearch.toLowerCase();
                                                    const hospital = (b.hospitalName || '').toLowerCase();
                                                    const date = (b.bookingDate || '').toLowerCase();
                                                    const formattedDate = new Date(b.bookingDate).toLocaleDateString('th-TH', {
                                                        day: '2-digit',
                                                        month: '2-digit',
                                                        year: 'numeric'
                                                    });
                                                    return hospital.includes(search) || date.includes(search) || formattedDate.includes(search);
                                                }).length
                                                : historyTotal) / ITEMS_PER_PAGE) || 1}
                                        </span>
                                        <button
                                            disabled={historyPage >= Math.ceil((isCaregiver
                                                ? caregiverBookings.filter(b => {
                                                    if (!historySearch) return true;
                                                    const search = historySearch.toLowerCase();
                                                    const hospital = (b.hospitalName || '').toLowerCase();
                                                    const date = (b.bookingDate || '').toLowerCase();
                                                    const formattedDate = new Date(b.bookingDate).toLocaleDateString('th-TH', {
                                                        day: '2-digit',
                                                        month: '2-digit',
                                                        year: 'numeric'
                                                    });
                                                    return hospital.includes(search) || date.includes(search) || formattedDate.includes(search);
                                                }).length
                                                : historyTotal) / ITEMS_PER_PAGE)}
                                            onClick={() => setHistoryPage(p => p + 1)}
                                            className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white text-gray-700 transition-colors"
                                        >
                                            ถัดไป
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                        {activeTab === 'patients' && isCaregiver && (
                            <CaregiverPatientsList caregiverId={user.id} />
                        )}
                    </div>
                </div>
            </div>

            <ImageSourcePicker
                isOpen={isImagePickerOpen}
                onClose={() => setIsImagePickerOpen(false)}
                onImageSelected={setSelectedImageFile}
            />
        </div>
    );
}
