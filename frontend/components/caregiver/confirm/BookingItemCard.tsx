"use client";

import { useEffect, useState } from 'react';
import Image from 'next/image';

export interface PatientBooking {
    id: string;
    patientName: string;
    patientPhone: string;
    patientPictureUrl?: string;
    patientRelationship?: string;
    bookedOnBehalf?: boolean;
    bookingDate: string;
    bookingTime: string;
    status: 'PENDING' | 'AI_MATCHING' | 'ACCEPTED' | 'EN_ROUTE' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    rawStatus?: string;
    mobilityStatus: 'WALKING' | 'WHEELCHAIR' | 'BEDRIDDEN';
    bookingType: string;
    hospitalName: string;
    requiredEquipment: string[];
    appointmentImage?: string;
    returnEvidenceUrl?: string;
    wantCareU?: boolean;
    careUVolunteer?: {
        name: string;
        phone: string;
        pictureUrl?: string;
    };
    volunteer?: {
        name: string;
        role: string;
        phone: string;
        pictureUrl?: string;
    };
    job?: {
        id?: number;
        returnPickupRequestedAt?: string | null;
    };
}

interface BookingItemCardProps {
    booking: PatientBooking;
    onClick: (booking: PatientBooking) => void;
}

const UserIcon = ({ size = 32, className = '' }: { size?: number; className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
    </svg>
);

export function BookingItemCard({ booking, onClick }: BookingItemCardProps) {
    const [imgError, setImgError] = useState(false);

    useEffect(() => {
        setImgError(false);
    }, [booking.patientPictureUrl]);

    const getMobilityBadge = (status: string) => {
        switch (status) {
            case 'WALKING':
                return { text: 'ทั่วไป', color: 'bg-[#1E7D55] text-white' };
            case 'WHEELCHAIR':
                return { text: 'ดูแลเพิ่มเติม', color: 'bg-[#F8842D] text-white' };
            case 'BEDRIDDEN':
                return { text: 'ต้องดูแลใกล้ชิด', color: 'bg-[#991D1D] text-white' };
            default:
                return { text: status, color: 'bg-[#475272] text-white' };
        }
    };

    const getRelationshipLabel = (relationship: string) => {
        const labels: Record<string, string> = {
            'FAMILY': 'ครอบครัว',
            'RELATIVE': 'ญาติ',
            'CLOSE_PERSON': 'คนใกล้ชิด',
        };
        return labels[relationship] || relationship;
    };

    const mobilityBadge = getMobilityBadge(booking.mobilityStatus);

    return (
        <div
            onClick={() => onClick(booking)}
            className="bg-white rounded-xl p-4 flex gap-4 border border-gray-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
        >
            <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-[#E3F2FD] rounded-xl flex items-center justify-center overflow-hidden relative">
                    {booking.patientPictureUrl && !imgError ? (
                        <Image
                            src={booking.patientPictureUrl}
                            alt={booking.patientName}
                            fill
                            className="object-cover"
                            sizes="64px"
                            unoptimized
                            onError={() => setImgError(true)}
                        />
                    ) : (
                        <UserIcon size={32} className="text-[#94A3B8]" />
                    )}
                </div>
            </div>

            <div className="flex-1 space-y-1.5 text-sm">
                <p className="text-text-primary font-medium">ชื่อ - สกุล : {booking.patientName}</p>
                {booking.patientRelationship && (
                    <p className="text-text-tertiary">
                        ความสัมพันธ์ : {getRelationshipLabel(booking.patientRelationship)}
                    </p>
                )}
                <p className="text-text-tertiary flex items-center gap-2 flex-wrap">
                    สถานะประชาชน :
                    <span className={`${mobilityBadge.color} text-white text-xs px-2.5 py-0.5 rounded-full`}>
                        {mobilityBadge.text}
                    </span>
                </p>
                <p className="text-text-tertiary">ประเภทการจอง : {booking.bookingType}</p>
                <p className="text-text-tertiary">สถานที่ : {booking.hospitalName}</p>
                <p className="text-text-tertiary">เวลาที่จอง {booking.bookingTime}</p>
                {booking.patientPhone && (
                    <p className="text-text-tertiary">เบอร์โทร : {booking.patientPhone}</p>
                )}
            </div>
        </div>
    );
}
