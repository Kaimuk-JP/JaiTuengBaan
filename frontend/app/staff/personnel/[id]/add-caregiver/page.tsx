'use client';

import { use, useEffect, useState, Suspense, useCallback } from 'react';
import { getApiUrl } from '@/lib/api';
import { useRouter } from 'next/navigation';
import type { NamedItem } from '@/types/common';
import ProtectedRoute from '@/components/shared/ProtectedRoute';
import StaffLayout from '@/components/staff/layout/StaffLayout';
import { fetchWithAuth } from '@/lib/auth';
import Swal from '@/lib/swal';
import {
    ElderlyInfoFields,
    ElderlyProfileImage,
    LocationFields,
    RelationshipFields,
} from '@/components/caregiver/form';
import type { AddressComponents } from '@/components/maps/MapPicker';
import { LazyCaregiverMapPicker as MapPicker } from '@/components/maps/LazyMap';

const escapeHtml = (str: string) => {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
};

type TabMode = 'search' | 'register';

interface SearchResult {
    id: string;
    fullName: string;
    lastFourDigits: string;
}

interface FormData {
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
}

function AddElderlyContent({ caregiverId }: { caregiverId: string }) {
    const router = useRouter();

    const [caregiver, setCaregiver] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [showMapPicker, setShowMapPicker] = useState(false);
    const [tabMode, setTabMode] = useState<TabMode>('search');

    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [searching, setSearching] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState<SearchResult | null>(null);
    const [searchRelationship, setSearchRelationship] = useState('');
    const [searchAdditionalDetails, setSearchAdditionalDetails] = useState('');

    const [formData, setFormData] = useState<FormData>({
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
    });

    useEffect(() => {
        const fetchCaregiver = async () => {
            try {
                const response = await fetchWithAuth(`/users/${caregiverId}`);
                if (response.ok) {
                    const data = await response.json();
                    setCaregiver(data);
                } else {
                    throw new Error('ไม่พบข้อมูลผู้ดูแลประชาชน');
                }
            } catch (err: any) {
                Swal.fire({
                    icon: 'error',
                    title: 'เกิดข้อผิดพลาด',
                    text: err.message || 'ไม่สามารถโหลดข้อมูลได้',
                    confirmButtonColor: '#1E7D55',
                });
                router.push('/staff/personnel');
            } finally {
                setPageLoading(false);
            }
        };
        fetchCaregiver();
    }, [caregiverId, router]);

    const handleSearch = useCallback(async (query: string) => {
        if (query.length < 2) {
            setSearchResults([]);
            return;
        }
        setSearching(true);
        try {
            const response = await fetchWithAuth(`/caregiver/patients/search?query=${encodeURIComponent(query)}`);
            if (response.ok) {
                const data = await response.json();
                setSearchResults(data);
            }
        } catch (err) {
            console.error('Search error:', err);
        } finally {
            setSearching(false);
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            handleSearch(searchQuery);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery, handleSearch]);

    const handleAddExisting = async () => {
        if (!selectedPatient) {
            Swal.fire({ icon: 'warning', title: 'กรุณาเลือกประชาชน', confirmButtonColor: '#1E7D55' });
            return;
        }
        if (!searchRelationship) {
            Swal.fire({ icon: 'warning', title: 'กรุณาเลือกความสัมพันธ์', confirmButtonColor: '#1E7D55' });
            return;
        }

        setLoading(true);
        try {
            const response = await fetchWithAuth('/caregiver/staff/add-existing-patient', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    caregiverId: caregiverId,
                    patientId: selectedPatient.id,
                    relationship: searchRelationship,
                    additionalDetails: searchAdditionalDetails || undefined,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'ไม่สามารถบันทึกข้อมูลได้');
            }

            const caregiverName = caregiver
                ? `${caregiver.firstName || ''} ${caregiver.lastName || ''}`.trim()
                : 'ผู้ดูแลประชาชน';

            await Swal.fire({
                icon: 'success',
                title: 'เพิ่มประชาชนสำเร็จ!',
                html: `
                    <p style="margin-bottom: 8px;">เพิ่ม <b>${escapeHtml(selectedPatient.fullName)}</b></p>
                    <p style="color: #666; font-size: 14px;">ในความดูแลของ ${escapeHtml(caregiverName)} เรียบร้อยแล้ว</p>
                `,
                confirmButtonColor: '#1E7D55',
                confirmButtonText: 'ตกลง',
            });
            router.push(`/staff/personnel/${caregiverId}`);
        } catch (err: any) {
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: err.message || 'ไม่สามารถบันทึกข้อมูลได้',
                confirmButtonColor: '#1E7D55',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            Swal.fire({ icon: 'warning', title: 'ไฟล์ไม่ถูกต้อง', text: 'กรุณาเลือกไฟล์รูปภาพเท่านั้น', confirmButtonColor: '#1E7D55' });
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            Swal.fire({ icon: 'warning', title: 'ไฟล์ใหญ่เกินไป', text: 'ขนาดไฟล์ต้องไม่เกิน 10 MB', confirmButtonColor: '#1E7D55' });
            return;
        }
        const previewUrl = URL.createObjectURL(file);
        setFormData(prev => ({ ...prev, pictureFile: file, picturePreview: previewUrl }));
    };

    const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            Swal.fire({ icon: 'warning', title: 'ไฟล์ไม่ถูกต้อง', text: 'กรุณาเลือกไฟล์รูปภาพเท่านั้น', confirmButtonColor: '#1E7D55' });
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            Swal.fire({ icon: 'warning', title: 'ไฟล์ใหญ่เกินไป', text: 'ขนาดไฟล์ต้องไม่เกิน 10 MB', confirmButtonColor: '#1E7D55' });
            return;
        }
        const previewUrl = URL.createObjectURL(file);
        setFormData(prev => ({ ...prev, documentFile: file, documentPreview: previewUrl }));
    };

    const handleMapConfirm = (lat: number, lng: number, addressComponents: AddressComponents) => {
        setFormData(prev => ({
            ...prev,
            coordinates: `${lat},${lng}`,
            villageName: addressComponents.villageName || '',
            subdistrictName: addressComponents.subdistrictName || '',
            districtName: addressComponents.districtName || '',
            provinceName: addressComponents.provinceName || '',
            country: addressComponents.country || '',
        }));
        setShowMapPicker(false);
    };

    const parseCoordinates = (coords: string) => {
        if (!coords) return null;
        const [lat, lng] = coords.split(',').map(n => parseFloat(n.trim()));
        if (isNaN(lat) || isNaN(lng)) return null;
        return { lat, lng };
    };

    const currentCoords = parseCoordinates(formData.coordinates);

    const handleRegisterNew = async (e: React.FormEvent) => {
        e.preventDefault();
        if (loading) return;

        if (!formData.idCard || formData.idCard.length !== 13) {
            Swal.fire({ icon: 'warning', title: 'ข้อมูลไม่ถูกต้อง', text: 'เลขบัตรประชาชนต้องมี 13 หลัก', confirmButtonColor: '#1E7D55' });
            return;
        }
        if (!formData.firstName.trim() || !formData.lastName.trim()) {
            Swal.fire({ icon: 'warning', title: 'ข้อมูลไม่ครบ', text: 'กรุณากรอกชื่อและนามสกุล', confirmButtonColor: '#1E7D55' });
            return;
        }
        if (!formData.phone || formData.phone.length !== 10) {
            Swal.fire({ icon: 'warning', title: 'ข้อมูลไม่ถูกต้อง', text: 'เบอร์โทรศัพท์ต้องมี 10 หลัก', confirmButtonColor: '#1E7D55' });
            return;
        }
        if (!formData.birthDate) {
            Swal.fire({ icon: 'warning', title: 'ข้อมูลไม่ครบ', text: 'กรุณาระบุวันเดือนปีเกิด', confirmButtonColor: '#1E7D55' });
            return;
        }
        if (!formData.relationship) {
            Swal.fire({ icon: 'warning', title: 'ข้อมูลไม่ครบ', text: 'กรุณาเลือกความสัมพันธ์', confirmButtonColor: '#1E7D55' });
            return;
        }

        setLoading(true);
        try {
            let pictureUrl = null;
            if (formData.pictureFile) {
                const uploadFormData = new FormData();
                uploadFormData.append('file', formData.pictureFile);
                const uploadResponse = await fetch(`${getApiUrl()}/upload`, { method: 'POST', credentials: 'include', body: uploadFormData });
                if (uploadResponse.ok) {
                    const uploadResult = await uploadResponse.json();
                    pictureUrl = uploadResult.url;
                }
            }

            let documentUrl = null;
            if (formData.documentFile) {
                const uploadFormData = new FormData();
                uploadFormData.append('file', formData.documentFile);
                const uploadResponse = await fetch(`${getApiUrl()}/upload`, { method: 'POST', credentials: 'include', body: uploadFormData });
                if (uploadResponse.ok) {
                    const uploadResult = await uploadResponse.json();
                    documentUrl = uploadResult.url;
                }
            }

            const response = await fetchWithAuth('/caregiver/staff/register-caregiver', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    patientId: parseInt(caregiverId),
                    idCard: formData.idCard,
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    gender: formData.gender,
                    phone: formData.phone,
                    birthDate: formData.birthDate || undefined,
                    pictureUrl,
                    relationship: formData.relationship,
                    additionalDetails: formData.additionalDetails || undefined,
                    documentUrl,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'ไม่สามารถบันทึกข้อมูลได้');
            }

            const caregiverName = caregiver
                ? `${caregiver.firstName || ''} ${caregiver.lastName || ''}`.trim()
                : 'ผู้ดูแลประชาชน';

            await Swal.fire({
                icon: 'success',
                title: 'เพิ่มประชาชนสำเร็จ!',
                html: `
                    <p style="margin-bottom: 8px;">เพิ่ม <b>${escapeHtml(formData.firstName)} ${escapeHtml(formData.lastName)}</b></p>
                    <p style="color: #666; font-size: 14px;">ในความดูแลของ ${escapeHtml(caregiverName)} เรียบร้อยแล้ว</p>
                `,
                confirmButtonColor: '#1E7D55',
                confirmButtonText: 'ตกลง',
            });
            router.push(`/staff/personnel/${caregiverId}`);
        } catch (err: any) {
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: err.message || 'ไม่สามารถบันทึกข้อมูลได้',
                confirmButtonColor: '#1E7D55',
            });
        } finally {
            setLoading(false);
        }
    };

    if (pageLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
            </div>
        );
    }

    const caregiverDisplayName = caregiver
        ? `${caregiver.firstName || ''} ${caregiver.lastName || ''}`.trim() || 'ผู้ดูแลประชาชน'
        : 'ผู้ดูแลประชาชน';

    const relationshipOptions = [
        { value: '', label: 'เลือกความสัมพันธ์' },
        { value: 'FAMILY', label: 'ครอบครัว' },
        { value: 'RELATIVE', label: 'ญาติ' },
        { value: 'CLOSE_PERSON', label: 'คนใกล้ชิด' },
    ];

    return (
        <div className="p-3x pb-20">
            <div className="max-w-2xl mx-auto">
                { }
                <button
                    onClick={() => router.push(`/staff/personnel/${caregiverId}`)}
                    className="flex items-center gap-2 text-text-tertiary hover:text-text-primary mb-4 transition-colors"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 12H5"></path>
                        <path d="M12 19l-7-7 7-7"></path>
                    </svg>
                    <span className="text-sm">กลับ</span>
                </button>

                { }
                <h1 className="text-center text-brand-primary font-bold mb-2x text-xl">
                    เพิ่มประชาชนในความดูแล
                </h1>

                { }
                <div className="bg-brand-primary/5 border border-brand-primary/20 rounded-xl p-4 mb-6 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-brand-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden border border-brand-primary/30">
                        {caregiver?.pictureUrl ? (
                            <img src={caregiver.pictureUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <svg className="w-6 h-6 text-brand-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                        )}
                    </div>
                    <div>
                        <p className="font-semibold text-text-primary">{caregiverDisplayName}</p>
                        <p className="text-sm text-text-tertiary">ผู้ดูแลประชาชน {caregiver?.phone ? `• ${caregiver.phone}` : ''}</p>
                    </div>
                </div>

                { }
                <div className="flex gap-2 mb-6">
                    <button
                        type="button"
                        onClick={() => setTabMode('search')}
                        className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all border ${tabMode === 'search'
                            ? 'bg-brand-primary text-white border-brand-primary shadow-md'
                            : 'bg-white text-text-primary border-border-default hover:bg-slate-50'
                            }`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8"></circle>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            </svg>
                            ค้นหาในระบบ
                        </div>
                    </button>
                    <button
                        type="button"
                        onClick={() => setTabMode('register')}
                        className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all border ${tabMode === 'register'
                            ? 'bg-brand-primary text-white border-brand-primary shadow-md'
                            : 'bg-white text-text-primary border-border-default hover:bg-slate-50'
                            }`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                            ลงทะเบียนใหม่
                        </div>
                    </button>
                </div>

                { }
                {tabMode === 'search' && (
                    <div className="space-y-4">
                        { }
                        <div>
                            <label className="typo-body text-text-tertiary mb-1x block">
                                ค้นหาประชาชน (ชื่อหรือนามสกุล)
                            </label>
                            <div className="relative">
                                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-placeholder" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setSelectedPatient(null);
                                    }}
                                    placeholder="พิมพ์ชื่อเพื่อค้นหา..."
                                    className="w-full pl-10 pr-4 py-3 border border-border-neutral rounded-xl bg-white focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition-all"
                                />
                                {searching && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-brand-primary"></div>
                                    </div>
                                )}
                            </div>
                        </div>

                        { }
                        {searchResults.length > 0 && !selectedPatient && (
                            <div className="border border-border-neutral rounded-xl overflow-hidden">
                                {searchResults.map((result) => (
                                    <button
                                        key={result.id}
                                        type="button"
                                        onClick={() => {
                                            setSelectedPatient(result);
                                            setSearchQuery(result.fullName);
                                        }}
                                        className="w-full px-4 py-3 text-left hover:bg-brand-primary/5 transition-colors border-b last:border-b-0 border-border-neutral flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center">
                                                <svg className="w-5 h-5 text-brand-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                                    <circle cx="12" cy="7" r="4"></circle>
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="font-medium text-text-primary">{result.fullName}</p>
                                                <p className="text-xs text-text-tertiary">บัตร ...{result.lastFourDigits}</p>
                                            </div>
                                        </div>
                                        <svg className="w-5 h-5 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                ))}
                            </div>
                        )}

                        {searchQuery.length >= 2 && searchResults.length === 0 && !searching && (
                            <div className="text-center py-6 text-text-tertiary">
                                <svg className="w-12 h-12 mx-auto mb-2 text-text-placeholder" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <p className="text-sm">ไม่พบประชาชนที่ค้นหา</p>
                                <button
                                    type="button"
                                    onClick={() => setTabMode('register')}
                                    className="mt-2 text-brand-primary text-sm font-medium hover:underline"
                                >
                                    ลงทะเบียนประชาชนใหม่
                                </button>
                            </div>
                        )}

                        { }
                        {selectedPatient && (
                            <div className="space-y-4">
                                <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                                        <svg className="w-5 h-5 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polyline points="20 6 9 17 4 12"></polyline>
                                        </svg>
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-text-primary">{selectedPatient.fullName}</p>
                                        <p className="text-xs text-text-tertiary">บัตร ...{selectedPatient.lastFourDigits}</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedPatient(null);
                                            setSearchQuery('');
                                        }}
                                        className="text-text-tertiary hover:text-status-danger"
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <line x1="18" y1="6" x2="6" y2="18"></line>
                                            <line x1="6" y1="6" x2="18" y2="18"></line>
                                        </svg>
                                    </button>
                                </div>

                                { }
                                <div>
                                    <label className="typo-body text-text-tertiary mb-1x block">
                                        เลือกความสัมพันธ์ <span className="text-status-danger">*</span>
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={searchRelationship}
                                            onChange={(e) => setSearchRelationship(e.target.value)}
                                            className="w-full p-2x typo-body text-text-primary bg-field-disable border border-border-neutral rounded-square focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition-all appearance-none"
                                        >
                                            {relationshipOptions.map(opt => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                        <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-tertiary pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>

                                { }
                                <div>
                                    <label className="typo-body text-text-tertiary mb-1x block">
                                        ระบุรายละเอียดเพิ่มเติม
                                    </label>
                                    <input
                                        type="text"
                                        value={searchAdditionalDetails}
                                        onChange={(e) => setSearchAdditionalDetails(e.target.value)}
                                        placeholder="เช่น บุตร, คู่สมรส"
                                        className="w-full p-2x typo-body text-text-primary bg-field-disable border border-border-neutral rounded-square focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition-all"
                                        maxLength={500}
                                    />
                                </div>

                                { }
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => router.push(`/staff/personnel/${caregiverId}`)}
                                        className="flex-1 py-2x px-4x rounded-square border border-border-neutral text-text-primary hover:bg-slate-50 transition-all"
                                    >
                                        ยกเลิก
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleAddExisting}
                                        disabled={loading}
                                        className={`flex-1 typo-button-sm py-2x px-4x rounded-square transition-all shadow-smooth-low flex items-center justify-center gap-2 ${!loading
                                            ? 'bg-brand-primary hover:bg-btn-hover text-white hover:shadow-smooth-medium cursor-pointer'
                                            : 'bg-field-disable text-text-disable cursor-not-allowed border border-border-neutral'
                                            }`}
                                    >
                                        {loading && (
                                            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                        )}
                                        {loading ? 'กำลังบันทึก...' : 'เพิ่มประชาชน'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                { }
                {tabMode === 'register' && (
                    <form onSubmit={handleRegisterNew} className="space-y-3x">
                        <div>
                            <h2 className="typo-body font-semibold text-text-primary mb-2x">
                                กรอกข้อมูลประชาชน
                            </h2>

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
                        </div>

                        <div>
                            <h2 className="typo-body font-semibold text-text-primary mb-2x">
                                กรอกข้อมูลความสัมพันธ์
                            </h2>

                            <RelationshipFields
                                formData={{
                                    relationship: formData.relationship,
                                    additionalDetails: formData.additionalDetails,
                                    documentPreview: formData.documentPreview,
                                    documentFile: formData.documentFile,
                                }}
                                onChange={handleInputChange}
                                onDocumentChange={handleDocumentChange}
                                onDocumentRemove={() => setFormData(prev => ({ ...prev, documentFile: null, documentPreview: null }))}
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => router.push(`/staff/personnel/${caregiverId}`)}
                                className="flex-1 py-2x px-4x rounded-square border border-border-neutral text-text-primary hover:bg-slate-50 transition-all"
                            >
                                ยกเลิก
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className={`flex-1 typo-button-sm py-2x px-4x rounded-square transition-all shadow-smooth-low flex items-center justify-center gap-2 ${!loading
                                    ? 'bg-brand-primary hover:bg-btn-hover text-white hover:shadow-smooth-medium cursor-pointer'
                                    : 'bg-field-disable text-text-disable cursor-not-allowed border border-border-neutral'
                                    }`}
                            >
                                {loading && (
                                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                )}
                                {loading ? 'กำลังบันทึก...' : 'ลงทะเบียนและเพิ่มประชาชน'}
                            </button>
                        </div>
                    </form>
                )}
            </div>

            { }
            {showMapPicker && (
                <MapPicker
                    initialLat={currentCoords?.lat}
                    initialLng={currentCoords?.lng}
                    onConfirm={handleMapConfirm}
                    onClose={() => setShowMapPicker(false)}
                />
            )}
        </div>
    );
}

export default function AddCaregiverPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);

    return (
        <ProtectedRoute allowedRoles={['STAFF', 'ADMIN']}>
            <StaffLayout>
                <Suspense fallback={
                    <div className="flex justify-center items-center h-screen">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
                    </div>
                }>
                    <AddElderlyContent caregiverId={id} />
                </Suspense>
            </StaffLayout>
        </ProtectedRoute>
    );
}
