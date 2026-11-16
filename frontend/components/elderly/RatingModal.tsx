'use client';

import { useState } from 'react';
import Image from 'next/image';
import Swal from '@/lib/swal';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';

interface RatingModalProps {
    isOpen: boolean;
    volunteerName: string;
    volunteerPicture?: string;
    volunteerPhone?: string;
    jobId: number;
    onClose: () => void;
    onSubmit: (rating: number, comment?: string) => void;
    onSkip?: () => void;
}

export default function RatingModal({
    isOpen,
    volunteerName,
    volunteerPicture,
    volunteerPhone,
    jobId,
    onClose,
    onSubmit,
    onSkip
}: RatingModalProps) {
    const [selectedRating, setSelectedRating] = useState<number | null>(null);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useBodyScrollLock(isOpen);

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (selectedRating === null) return;

        setIsSubmitting(true);
        await onSubmit(selectedRating, comment || undefined);
        setIsSubmitting(false);

        await Swal.fire({
            icon: 'success',
            title: 'ประเมินสำเร็จ!',
            text: 'ขอบคุณสำหรับคำติชมของคุณ',
            confirmButtonColor: '#1E7D55',
            timer: 2000,
            showConfirmButton: false
        });

        onClose();
    };

    const ratings = [
        {
            value: 3,
            label: 'ดี',
            svg: (
                <svg width="60" height="60" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <radialGradient id="gradYellow" cx="30%" cy="30%" r="70%" fx="40%" fy="40%">
                            <stop offset="0%" stopColor="#FFEB3B" />
                            <stop offset="100%" stopColor="#F57F17" />
                        </radialGradient>
                        <filter id="blurCheek" x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
                        </filter>
                    </defs>
                    <ellipse cx="50" cy="90" rx="35" ry="6" fill="#000000" fillOpacity="0.2" />
                    <circle cx="50" cy="50" r="45" fill="url(#gradYellow)" />
                    <ellipse cx="50" cy="25" rx="25" ry="12" fill="#FFFFFF" fillOpacity="0.4" />
                    <circle cx="25" cy="55" r="8" fill="#FF5252" fillOpacity="0.6" filter="url(#blurCheek)" />
                    <circle cx="75" cy="55" r="8" fill="#FF5252" fillOpacity="0.6" filter="url(#blurCheek)" />
                    <path d="M25 45 Q32 38 39 45" stroke="#3E2723" strokeWidth="4" strokeLinecap="round" fill="none" />
                    <path d="M61 45 Q68 38 75 45" stroke="#3E2723" strokeWidth="4" strokeLinecap="round" fill="none" />
                    <path d="M35 60 Q50 75 65 60" stroke="#3E2723" strokeWidth="4" strokeLinecap="round" fill="none" />
                </svg>
            ),
            color: 'bg-brand-primary hover:bg-btn-hover',
            borderColor: 'border-brand-primary'
        },
        {
            value: 2,
            label: 'ปานกลาง',
            svg: (
                <svg width="60" height="60" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <radialGradient id="gradNeutral" cx="30%" cy="30%" r="70%" fx="40%" fy="40%">
                            <stop offset="0%" stopColor="#FFD54F" />
                            <stop offset="100%" stopColor="#F57F17" />
                        </radialGradient>
                    </defs>
                    <ellipse cx="50" cy="90" rx="35" ry="6" fill="#000000" fillOpacity="0.2" />
                    <circle cx="50" cy="50" r="45" fill="url(#gradNeutral)" />
                    <ellipse cx="50" cy="25" rx="25" ry="12" fill="#FFFFFF" fillOpacity="0.4" />
                    <ellipse cx="35" cy="45" rx="6" ry="10" fill="#212121" />
                    <ellipse cx="65" cy="45" rx="6" ry="10" fill="#212121" />
                    <rect x="35" y="65" width="30" height="6" rx="3" fill="#3E2723" />
                </svg>
            ),
            color: 'bg-orange-500 hover:bg-orange-600',
            borderColor: 'border-orange-500'
        },
        {
            value: 1,
            label: 'ปรับปรุง',
            svg: (
                <svg width="60" height="60" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <radialGradient id="gradRed" cx="30%" cy="30%" r="80%" fx="40%" fy="30%">
                            <stop offset="0%" stopColor="#FF5252" />
                            <stop offset="100%" stopColor="#B71C1C" />
                        </radialGradient>
                    </defs>
                    <ellipse cx="50" cy="90" rx="35" ry="6" fill="#000000" fillOpacity="0.2" />
                    <circle cx="50" cy="50" r="45" fill="url(#gradRed)" />
                    <ellipse cx="50" cy="25" rx="25" ry="12" fill="#FFFFFF" fillOpacity="0.3" />
                    <g fill="#212121">
                        <path d="M25 45 H45 L45 50 C45 55 25 55 25 50 Z" />
                        <path d="M22 40 L48 44 L48 36 L22 32 Z" />
                        <circle cx="65" cy="48" r="6" />
                        <path d="M55 35 L78 30 L78 34 L55 39 Z" />
                    </g>
                    <path d="M35 70 Q50 60 65 70" stroke="#3E2723" strokeWidth="4" strokeLinecap="round" fill="none" />
                </svg>
            ),
            color: 'bg-red-500 hover:bg-red-600',
            borderColor: 'border-red-500'
        },
    ];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3x">
            <div className="bg-white rounded-square-hard shadow-smooth-high max-w-md w-full p-3x animate-fadeIn">
                {}
                <div className="text-center mb-3x">
                    <h2 className=" font-bold text-brand-primary mb-1x">
                        แบบประเมินการบริการ
                    </h2>
                    <p className="typo-body text-text-tertiary">
                        โปรดเลือกสัญลักษณ์เพื่อประเมินการให้บริการ
                    </p>
                </div>

                {}
                <div className="mb-3x">
                    <div className="flex justify-center gap-2x mb-3x">
                        {ratings.map((rating) => (
                            <button
                                key={rating.value}
                                onClick={() => setSelectedRating(rating.value)}
                                className={`flex flex-col items-center p-2x rounded-square-hard transition-all transform hover:scale-105 ${selectedRating === rating.value
                                    ? `${rating.color} text-white shadow-smooth-medium scale-105 border-4 ${rating.borderColor}`
                                    : 'bg-field-default text-text-primary hover:bg-fuji-light'
                                    }`}
                            >
                                <div className="mb-1x">{rating.svg}</div>
                                <span className="typo-menu font-semibold">{rating.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {}
                <div className="bg-field-default rounded-square-hard p-2x mb-3x">
                    <p className="typo-menu text-text-tertiary mb-2x text-center">เจ้าหน้าที่ขับรถ</p>
                    <div className="flex items-center gap-2x">
                        <div className="w-16 h-16 rounded-full bg-fuji-light flex items-center justify-center overflow-hidden flex-shrink-0">
                            {volunteerPicture ? (
                                <Image
                                    src={volunteerPicture}
                                    alt={volunteerName}
                                    width={64}
                                    height={64}
                                    className="object-cover"
                                    unoptimized
                                />
                            ) : (
                                <svg className="w-8 h-8 text-text-placeholder" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                </svg>
                            )}
                        </div>
                        <div className="flex-1">
                            <p className="typo-body font-semibold text-text-primary">{volunteerName}</p>
                            <p className="typo-menu text-text-tertiary">จิตอาสา</p>
                            {volunteerPhone && (
                                <p className="typo-menu text-text-tertiary">โทร: {volunteerPhone}</p>
                            )}
                        </div>
                    </div>
                </div>

                {}
                {selectedRating !== null && (
                    <div className="mb-3x animate-fadeIn">
                        <label className="typo-body text-text-tertiary mb-1x block">
                            อยากบอกอะไรเพิ่มเติมไหมคะ? (ไม่บังคับ)
                        </label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="เช่น บริการดีมาก ใจดี ขับรถดี..."
                            className="w-full p-2x border border-border-neutral rounded-square focus:outline-none focus:ring-2 focus:ring-brand-primary resize-none typo-body"
                            rows={3}
                        />
                    </div>
                )}

                {}
                <div className="flex gap-2x">
                    <button
                        onClick={() => {
                            if (onSkip) {
                                onSkip();
                            }
                            onClose();
                        }}
                        className="flex-1 px-3x py-2x bg-fuji-light hover:bg-fuji-soft text-text-primary typo-button-sm rounded-square transition-colors"
                        disabled={isSubmitting}
                    >
                        ข้ามไปก่อน
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={selectedRating === null || isSubmitting}
                        className="flex-1 px-3x py-2x bg-brand-primary hover:bg-btn-hover text-white typo-button-sm rounded-square transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                        {isSubmitting ? (
                            <>
                                <svg className="animate-spin h-5 w-5 mr-1x" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                กำลังส่ง...
                            </>
                        ) : (
                            'ส่งประเมิน'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
