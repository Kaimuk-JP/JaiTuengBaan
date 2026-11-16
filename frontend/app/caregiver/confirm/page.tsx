'use client';

import { useEffect, useState } from 'react';
import { getApiUrl } from '@/lib/api';
import ProtectedRoute from '@/components/shared/ProtectedRoute';
import LayoutWithSidebar from '@/components/shared/LayoutWithSidebar';
import { CaregiverSidebar } from '@/components/caregiver/sidebar';
import { CaregiverHeader } from '@/components/caregiver/header';
import { BookingDetailModal } from '@/components/caregiver/booking/BookingDetailModal';
import { BookingItemCard, PatientBooking } from '@/components/caregiver/confirm';
import {
    ChevronIcon,
    DateHistoryEmptyState,
    DateHistoryLayout,
    DateHistoryLoadingState,
    dateAccordionButtonClass,
    formatThaiDateLabel,
} from '@/components/shared/DateHistoryLayout';

interface GroupedBookings {
    date: string;
    dateLabel: string;
    bookings: PatientBooking[];
}

function CaregiverConfirmPageContent() {
    const [user, setUser] = useState<any>(null);
    const [groupedBookings, setGroupedBookings] = useState<GroupedBookings[]>([]);
    const [openDates, setOpenDates] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedBooking, setSelectedBooking] = useState<PatientBooking | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        const fetchUserAndBookings = async () => {
            try {
                const userResponse = await fetch(`${getApiUrl()}/auth/profile`, {
                    credentials: 'include',
                });

                if (!userResponse.ok) {
                    throw new Error('ไม่พบข้อมูลผู้ใช้ กรุณาล็อกอินใหม่');
                }

                const userData = await userResponse.json();
                setUser(userData);

                const bookingsResponse = await fetch(`${getApiUrl()}/caregiver/bookings`, {
                    credentials: 'include',
                });

                if (bookingsResponse.ok) {
                    const bookingsData: PatientBooking[] = await bookingsResponse.json();
                    setGroupedBookings(groupBookingsByDate(bookingsData));
                } else {
                    setGroupedBookings([]);
                }

                setLoading(false);
            } catch (err: any) {
                console.error('Error fetching data:', err);
                setError(err.message || 'เกิดข้อผิดพลาด');
                setLoading(false);
            }
        };

        fetchUserAndBookings();
    }, []);

    const groupBookingsByDate = (bookings: PatientBooking[]): GroupedBookings[] => {
        const groups: Record<string, PatientBooking[]> = {};

        bookings.forEach(booking => {
            if (!groups[booking.bookingDate]) {
                groups[booking.bookingDate] = [];
            }
            groups[booking.bookingDate].push(booking);
        });

        return Object.entries(groups)
            .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
            .map(([date, dateBookings]) => ({
                date,
                dateLabel: formatThaiDateLabel(date),
                bookings: dateBookings,
            }));
    };

    const toggleDate = (date: string) => {
        setOpenDates(prev => {
            const next = new Set(prev);
            if (next.has(date)) {
                next.delete(date);
            } else {
                next.add(date);
            }
            return next;
        });
    };

    const handleBookingClick = (booking: PatientBooking) => {
        setSelectedBooking(booking);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedBooking(null);
    };

    const handleSearchChange = (value: string) => {
        setSearchQuery(value);
        if (value) {
            setOpenDates(new Set(groupedBookings.map(g => g.date)));
        }
    };

    const filteredGroups = groupedBookings.filter(group => {
        if (!searchQuery) return true;
        const searchLower = searchQuery.toLowerCase();
        return group.dateLabel.toLowerCase().includes(searchLower);
    });

    return (
        <LayoutWithSidebar role="CAREGIVER" showSidebar={false} user={user}>
            <div className="min-h-screen w-full bg-white">
                <CaregiverSidebar user={user} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
                <CaregiverHeader user={user} onToggleSidebar={() => setSidebarOpen(true)} />

                {loading ? (
                    <DateHistoryLoadingState message="กำลังโหลดประวัติการจอง..." />
                ) : (
                    <DateHistoryLayout
                        title="ประวัติการจอง"
                        searchValue={searchQuery}
                        onSearchChange={handleSearchChange}
                        topContent={
                            error ? (
                                <div className="mb-4 bg-red-50 border-l-4 border-status-danger p-3 rounded-lg">
                                    <p className="text-sm text-red-700">{error}</p>
                                </div>
                            ) : undefined
                        }
                    >
                        {filteredGroups.length > 0 ? (
                            filteredGroups.map((group) => (
                                <div key={group.date} className="mb-4 w-full">
                                    <button
                                        onClick={() => toggleDate(group.date)}
                                        className={dateAccordionButtonClass()}
                                    >
                                        <span className="text-lg">{group.dateLabel}</span>
                                        <ChevronIcon isOpen={openDates.has(group.date)} />
                                    </button>

                                    <div
                                        className={`overflow-hidden transition-all duration-300 ease-in-out w-full ${
                                            openDates.has(group.date) ? 'max-h-[2000px] opacity-100 mt-3' : 'max-h-0 opacity-0'
                                        }`}
                                    >
                                        <div className="bg-gray-100 rounded-xl p-3 space-y-3 w-full">
                                            {group.bookings.map((booking) => (
                                                <BookingItemCard
                                                    key={booking.id}
                                                    booking={booking}
                                                    onClick={handleBookingClick}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <DateHistoryEmptyState
                                message={searchQuery ? 'ไม่พบวันที่ที่ค้นหา' : 'ยังไม่มีรายการจอง'}
                            />
                        )}
                    </DateHistoryLayout>
                )}

                {selectedBooking && (
                    <BookingDetailModal
                        isOpen={isModalOpen}
                        onClose={handleCloseModal}
                        onBookingAction={() => window.location.reload()}
                        booking={{
                            ...selectedBooking,
                            patientMobilityStatus: selectedBooking.mobilityStatus as 'WALKING' | 'WHEELCHAIR' | 'BEDRIDDEN',
                            bookingDate: formatThaiDateLabel(selectedBooking.bookingDate),
                            rawStatus: selectedBooking.rawStatus || selectedBooking.status,
                            jobId: selectedBooking.job?.id,
                            returnPickupRequestedAt: selectedBooking.job?.returnPickupRequestedAt,
                        }}
                    />
                )}
            </div>
        </LayoutWithSidebar>
    );
}

export default function CaregiverConfirmPage() {
    return (
        <ProtectedRoute allowedRoles={['CAREGIVER', 'ADMIN']}>
            <CaregiverConfirmPageContent />
        </ProtectedRoute>
    );
}
