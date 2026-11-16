'use client';

import Image from 'next/image';

interface BookingApprovalCardProps {
    patientName: string;
    patientPictureUrl?: string;
    hasAppointment: boolean;
    hospitalName?: string;
    hospital?: {
        name: string;
    };
    requestDate: string;
    bookingTime: string | null;
    volunteer?: {
        displayName: string;
        pictureUrl?: string;
    };
    onConfirm?: () => void;
    onCancel?: () => void;
    showActions?: boolean;
    isLoading?: boolean;
}

export default function BookingApprovalCard({
    patientName,
    patientPictureUrl,
    hasAppointment,
    hospitalName,
    hospital,
    requestDate,
    bookingTime,
    volunteer,
    onConfirm,
    onCancel,
    showActions = false,
    isLoading = false,
}: BookingApprovalCardProps) {
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('th-TH', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

    return (
        <div className="space-y-3">
            {}
            <div className="bg-white rounded-xl border-2 border-brand-primary p-4 max-w-sm mx-auto">
                <h3 className="text-lg font-semibold text-text-primary mb-4">ข้อมูลการจอง</h3>

                {}
                <div className="flex justify-center mb-4">
                    <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                        {patientPictureUrl ? (
                            <Image
                                src={patientPictureUrl}
                                alt={patientName}
                                width={80}
                                height={80}
                                className="object-cover w-full h-full"
                                unoptimized
                            />
                        ) : (
                            <svg className="w-12 h-12 text-text-placeholder" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                            </svg>
                        )}
                    </div>
                </div>

                {}
                <p className="text-center font-semibold text-text-primary mb-4">{patientName}</p>

                {}
                <div className="space-y-2 text-sm">
                    <p className="text-text-tertiary">
                        <span className="font-medium">ประเภทการจอง :</span>{' '}
                        {hasAppointment ? 'มีใบนัด' : 'ไม่มีใบนัด'}
                    </p>
                    <p className="text-text-tertiary">
                        <span className="font-medium">โรงพยาบาล :</span> {hospital?.name || hospitalName || '-'}
                    </p>
                    <p className="text-text-tertiary">
                        <span className="font-medium">วันที่จอง :</span> {formatDate(requestDate)}
                    </p>
                    <p className="text-text-tertiary">
                        <span className="font-medium">ช่วงเวลาที่จอง :</span>{' '}
                        {bookingTime || 'ไม่ระบุ'}
                    </p>
                </div>

                {}
                {showActions && (
                    <div className="flex gap-3 mt-4 justify-center">
                        {onConfirm && (
                            <button
                                onClick={onConfirm}
                                disabled={isLoading}
                                className={`px-6 py-2 text-white text-sm font-medium rounded-full transition-colors ${isLoading
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-brand-primary hover:bg-btn-hover'
                                    }`}
                            >
                                {isLoading ? 'กำลังดำเนินการ...' : 'ยืนยัน'}
                            </button>
                        )}
                        {onCancel && (
                            <button
                                onClick={onCancel}
                                disabled={isLoading}
                                className={`px-6 py-2 text-white text-sm font-medium rounded-full transition-colors ${isLoading
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-red-500 hover:bg-red-600'
                                    }`}
                            >
                                ยกเลิก
                            </button>
                        )}
                    </div>
                )}
            </div>

            {}
            {volunteer && (
                <div className="bg-white rounded-xl border-2 border-brand-primary p-4 max-w-sm mx-auto">
                    <h3 className="text-lg font-semibold text-text-primary mb-4 text-center">เจ้าหน้าที่ขับรถ</h3>

                    {}
                    <div className="flex justify-center mb-3">
                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                            {volunteer.pictureUrl ? (
                                <Image
                                    src={volunteer.pictureUrl}
                                    alt={volunteer.displayName}
                                    width={64}
                                    height={64}
                                    className="object-cover w-full h-full"
                                    unoptimized
                                />
                            ) : (
                                <svg className="w-10 h-10 text-text-placeholder" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                                </svg>
                            )}
                        </div>
                    </div>

                    {}
                    <div className="text-center text-sm">
                        <p className="text-text-tertiary">
                            <span className="font-medium">ชื่อ</span> {volunteer.displayName}
                        </p>
                        <p className="text-text-tertiary text-xs mt-1">เจ้าหน้าที่ จิตอาสา</p>
                    </div>
                </div>
            )}
        </div>
    );
}
