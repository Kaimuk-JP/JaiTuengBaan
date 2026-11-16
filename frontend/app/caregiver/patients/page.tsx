"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getApiUrl } from '@/lib/api';
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/shared/ProtectedRoute";
import LayoutWithSidebar from "@/components/shared/LayoutWithSidebar";
import { CaregiverSidebar } from "@/components/caregiver/sidebar";
import { CaregiverHeader } from "@/components/caregiver/header";
import { getCurrentUser, fetchWithAuth } from "@/lib/auth";
import Image from "next/image";
import Swal from "@/lib/swal";

interface Patient {
    id: string;
    patientId: number;
    patientName: string;
    patientPictureUrl?: string;
    patientPhone: string;
    relationship: string;
    mobilityStatus: string;
    status: string;
    createdAt: string;
    organizationName?: string;
}

import { User } from "@/components/caregiver/types";

const relationshipLabels: Record<string, string> = {
    FAMILY: 'ครอบครัว',
    RELATIVE: 'ญาติ',
    CLOSE_PERSON: 'คนใกล้ชิด',
};

const PATIENTS_PER_PAGE = 10;

export default function CaregiverPatientsPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [allPatients, setAllPatients] = useState<Patient[]>([]);
    const [displayedPatients, setDisplayedPatients] = useState<Patient[]>([]);
    const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const loadMoreRef = useRef<HTMLDivElement>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            try {
                const userData = await getCurrentUser();
                setUser(userData);

                const response = await fetchWithAuth('/caregiver/patients');
                if (response.ok) {
                    const result = await response.json();
                    const data = Array.isArray(result) ? result : (result.data || []);
                    setAllPatients(data);
                    setFilteredPatients(data);
                    setDisplayedPatients(data.slice(0, PATIENTS_PER_PAGE));
                    setHasMore(data.length > PATIENTS_PER_PAGE);
                } else {
                    setAllPatients([]);
                    setFilteredPatients([]);
                    setDisplayedPatients([]);
                }
            } catch (error) {
                console.error('Error fetching patients:', error);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []);

    useEffect(() => {
        const filtered = allPatients.filter((patient) =>
            patient.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            patient.patientPhone.includes(searchQuery) ||
            (relationshipLabels[patient.relationship] || patient.relationship).toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredPatients(filtered);
        setDisplayedPatients(filtered.slice(0, PATIENTS_PER_PAGE));
        setCurrentPage(1);
        setHasMore(filtered.length > PATIENTS_PER_PAGE);
    }, [searchQuery, allPatients]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
                    loadMore();
                }
            },
            { threshold: 0.1 }
        );

        if (loadMoreRef.current) {
            observer.observe(loadMoreRef.current);
        }

        return () => observer.disconnect();
    }, [hasMore, isLoadingMore, filteredPatients, currentPage]);

    const loadMore = useCallback(() => {
        if (isLoadingMore || !hasMore) return;

        setIsLoadingMore(true);

        setTimeout(() => {
            const nextPage = currentPage + 1;
            const startIndex = 0;
            const endIndex = nextPage * PATIENTS_PER_PAGE;
            const newDisplayed = filteredPatients.slice(startIndex, endIndex);

            setDisplayedPatients(newDisplayed);
            setCurrentPage(nextPage);
            setHasMore(endIndex < filteredPatients.length);
            setIsLoadingMore(false);
        }, 300);
    }, [currentPage, filteredPatients, hasMore, isLoadingMore]);

    const getStatusBadge = (mobilityStatus: string) => {
        switch (mobilityStatus) {
            case "WALKING":
                return { text: "ทั่วไป", color: "bg-take-soft text-take-dark" };
            case "WHEELCHAIR":
                return { text: "ต้องดูแลเพิ่ม", color: "bg-saffron-light-soft text-saffron-dark" };
            case "BEDRIDDEN":
                return { text: "ต้องดูแลใกล้ชิด", color: "bg-fuan-light text-fuan-dark" };
            default:
                return { text: "ไม่ระบุ", color: "bg-fuji-light text-fuji-medium" };
        }
    };

    const handleBooking = (patientId: string) => {
        router.push(`/caregiver/booking?patientId=${patientId}`);
    };

    const handleRemovePatient = async (patient: Patient) => {
        const result = await Swal.fire({
            title: 'ลบประชาชนที่ดูแล?',
            html: `<p>คุณต้องการลบ <b>${patient.patientName}</b> ออกจากรายชื่อที่ดูแลหรือไม่?</p>`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#EF4444',
            cancelButtonColor: '#6B7280',
            confirmButtonText: 'ลบ',
            cancelButtonText: 'ยกเลิก',
        });

        if (!result.isConfirmed) return;

        try {
            const response = await fetchWithAuth(`/caregiver/patients/${patient.patientId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                setAllPatients(prev => prev.filter(p => p.id !== patient.id));
                await Swal.fire({
                    icon: 'success',
                    title: 'ลบสำเร็จ',
                    text: `ลบ ${patient.patientName} ออกจากรายชื่อที่ดูแลแล้ว`,
                    timer: 2000,
                    showConfirmButton: false,
                });
            } else {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'ไม่สามารถลบได้');
            }
        } catch (error: any) {
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: error.message || 'ไม่สามารถลบประชาชนได้',
            });
        }
    };

    return (
        <ProtectedRoute allowedRoles={["CAREGIVER", "ADMIN"]}>
            <LayoutWithSidebar role="CAREGIVER" showSidebar={false}>
                <div className="min-h-screen bg-white">
                    <CaregiverSidebar user={user} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
                    <CaregiverHeader user={user} onToggleSidebar={() => setSidebarOpen(true)} />

                    <div className="px-3x py-3x">
                        <div className="max-w-2xl mx-auto">
                            { }
                            <h1 className=" font-bold text-brand-primary text-center mb-3x">
                                รายชื่อประชาชนที่ดูแล
                            </h1>

                            { }
                            <div className="mb-3x">
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="ค้นหาชื่อ, เบอร์โทร, หรือความสัมพันธ์..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full py-2 pl-10 pr-4 typo-body text-text-primary border border-border-neutral rounded-square focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition-all"
                                    />
                                    <svg
                                        className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-placeholder"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                        />
                                    </svg>
                                    {searchQuery && (
                                        <button
                                            onClick={() => setSearchQuery("")}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-placeholder hover:text-text-primary"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            </div>

                            {isLoading ? (
                                <div className="flex justify-center items-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
                                </div>
                            ) : filteredPatients.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="typo-body text-text-tertiary">
                                        {searchQuery ? "ไม่พบประชาชนที่ค้นหา" : "ยังไม่มีประชาชนในความดูแล"}
                                    </p>
                                </div>
                            ) : (
                                <>
                                    { }
                                    <div className="space-y-3x">
                                        {displayedPatients.map((patient) => {
                                            const statusBadge = getStatusBadge(patient.mobilityStatus);
                                            return (
                                                <div
                                                    key={patient.id}
                                                    className="bg-white rounded-xl shadow-smooth-medium border border-border-neutral p-4 hover:shadow-smooth-high transition-shadow"
                                                >
                                                    { }
                                                    <div className="flex items-center gap-4 mb-3">
                                                        { }
                                                        <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-brand-primary bg-fuji-light flex-shrink-0">
                                                            {patient.patientPictureUrl ? (
                                                                <Image
                                                                    src={patient.patientPictureUrl}
                                                                    alt={patient.patientName}
                                                                    fill
                                                                    className="object-cover"
                                                                    unoptimized
                                                                />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center">
                                                                    <svg
                                                                        className="w-8 h-8 text-text-placeholder"
                                                                        viewBox="0 0 24 24"
                                                                        fill="currentColor"
                                                                    >
                                                                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                                                                    </svg>
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-start justify-between gap-2">
                                                                <h3 className="text-lg font-medium text-text-primary truncate">
                                                                    {patient.patientName}
                                                                </h3>
                                                                {patient.organizationName && (
                                                                    <span className="flex items-center gap-1 text-xs text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded-full flex-shrink-0 whitespace-nowrap">
                                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                                        </svg>
                                                                        {patient.organizationName}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                                                                <span className={`text-xs px-2 py-0.5 rounded-full ${statusBadge.color}`}>
                                                                    {statusBadge.text}
                                                                </span>
                                                                {patient.status !== 'APPROVED' && (
                                                                    <span className={`text-xs px-2 py-0.5 rounded-full ${patient.status === 'PENDING' ? 'bg-saffron-light-soft text-saffron-dark' : 'bg-fuan-light text-fuan-dark'}`}>
                                                                        {patient.status === 'PENDING' ? 'รออนุมัติ' : 'ไม่อนุมัติ'}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    { }
                                                    <div className="grid grid-cols-2 gap-2 text-sm border-t border-border-neutral pt-3">
                                                        <div>
                                                            <span className="text-text-tertiary">ความสัมพันธ์</span>
                                                            <p className="text-text-primary font-medium">
                                                                {relationshipLabels[patient.relationship] || patient.relationship}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <span className="text-text-tertiary">เบอร์โทร</span>
                                                            {patient.patientPhone ? (
                                                                <button
                                                                    onClick={async () => {
                                                                        const result = await Swal.fire({
                                                                            title: 'โทรหาประชาชน?',
                                                                            text: `ต้องการโทรหา ${patient.patientPhone} หรือไม่?`,
                                                                            icon: 'question',
                                                                            showCancelButton: true,
                                                                            confirmButtonColor: '#1E7D55',
                                                                            cancelButtonColor: '#6B7280',
                                                                            confirmButtonText: 'โทร',
                                                                            cancelButtonText: 'ยกเลิก',
                                                                        });
                                                                        if (result.isConfirmed) {
                                                                            window.location.href = `tel:${patient.patientPhone}`;
                                                                        }
                                                                    }}
                                                                    className="flex items-center gap-1.5 text-text-secondary hover:text-brand-primary transition-colors font-medium"
                                                                >
                                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                                                                    </svg>
                                                                    <span className="underline">{patient.patientPhone}</span>
                                                                </button>
                                                            ) : (
                                                                <p className="text-text-placeholder">-</p>
                                                            )}
                                                        </div>
                                                    </div>


                                                    { }
                                                    <div className="mt-3 pt-3 border-t border-border-neutral flex gap-2">
                                                        {patient.status === 'APPROVED' && (
                                                            <button
                                                                onClick={() => handleBooking(patient.patientId.toString())}
                                                                className="flex-1 bg-brand-primary hover:bg-brand-hover text-white font-medium py-2.5 px-4 rounded-lg transition-all shadow-smooth-low hover:shadow-smooth-medium flex items-center justify-center gap-2"
                                                            >
                                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                </svg>
                                                                จองคิว
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => handleRemovePatient(patient)}
                                                            className="bg-white border border-red-400 text-red-500 hover:bg-red-50 font-medium py-2.5 px-4 rounded-lg transition-all flex items-center justify-center gap-2"
                                                        >
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                            ลบ
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    { }
                                    <div ref={loadMoreRef} className="py-4 flex justify-center">
                                        {isLoadingMore && (
                                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-primary"></div>
                                        )}
                                        {!hasMore && displayedPatients.length > 0 && (
                                            <p className="typo-menu text-text-tertiary">แสดงทั้งหมด {displayedPatients.length} คน</p>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </LayoutWithSidebar>
        </ProtectedRoute>
    );
}
