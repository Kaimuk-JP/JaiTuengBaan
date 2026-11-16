'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import Swal from 'sweetalert2';
import type { NamedPerson } from '@/types/common';
import { getApiUrl } from '@/lib/api';

interface FeedbackModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit?: () => void | Promise<void>;
    onSkip?: () => void;
    volunteer: {
        id: number;
        displayName: string;
        firstName?: string;
        phone: string;
        pictureUrl?: string;
    };
    careu?: {
        id: number;
        displayName?: string;
        firstName?: string;
        phone: string;
        pictureUrl?: string;
    };
    jobId: number;
}

type RatingValue = 'good' | 'neutral' | 'bad' | null;

const ratingOptions = [
    {
        id: 'bad',
        label: 'แย่',
        svg: (uniqueId: string) => (
            <svg width="50" height="50" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <radialGradient id={`gradRed${uniqueId}`} cx="30%" cy="30%" r="80%" fx="40%" fy="30%">
                        <stop offset="0%" stopColor="#FF8A80" />
                        <stop offset="100%" stopColor="#E57373" />
                    </radialGradient>
                </defs>
                <circle cx="50" cy="50" r="45" fill={`url(#gradRed${uniqueId})`} />
                <ellipse cx="50" cy="25" rx="25" ry="12" fill="#FFFFFF" fillOpacity="0.3" />
                <ellipse cx="35" cy="45" rx="6" ry="8" fill="#212121" />
                <ellipse cx="65" cy="45" rx="6" ry="8" fill="#212121" />
                <circle cx="33" cy="42" r="2" fill="#FFFFFF" />
                <circle cx="63" cy="42" r="2" fill="#FFFFFF" />
                <path d="M25 38 Q32 34 40 35" stroke="#3E2723" strokeWidth="3" strokeLinecap="round" fill="none" />
                <path d="M75 38 Q68 34 60 35" stroke="#3E2723" strokeWidth="3" strokeLinecap="round" fill="none" />
                <path d="M35 72 Q50 62 65 72" stroke="#3E2723" strokeWidth="4" strokeLinecap="round" fill="none" />
            </svg>
        ),
        color: 'bg-red-100 hover:bg-red-200',
        borderColor: 'border-red-500',
        selectedColor: 'bg-red-500'
    },
    {
        id: 'neutral',
        label: 'ปานกลาง',
        svg: (uniqueId: string) => (
            <svg width="50" height="50" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <radialGradient id={`gradNeutral${uniqueId}`} cx="30%" cy="30%" r="70%" fx="40%" fy="40%">
                        <stop offset="0%" stopColor="#FFD54F" />
                        <stop offset="100%" stopColor="#F57F17" />
                    </radialGradient>
                </defs>
                <circle cx="50" cy="50" r="45" fill={`url(#gradNeutral${uniqueId})`} />
                <ellipse cx="50" cy="25" rx="25" ry="12" fill="#FFFFFF" fillOpacity="0.4" />
                <ellipse cx="35" cy="45" rx="5" ry="8" fill="#212121" />
                <ellipse cx="65" cy="45" rx="5" ry="8" fill="#212121" />
                <rect x="35" y="65" width="30" height="5" rx="3" fill="#3E2723" />
            </svg>
        ),
        color: 'bg-yellow-100 hover:bg-yellow-200',
        borderColor: 'border-yellow-500',
        selectedColor: 'bg-yellow-500'
    },
    {
        id: 'good',
        label: 'ดี',
        svg: (uniqueId: string) => (
            <svg width="50" height="50" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <radialGradient id={`gradYellow${uniqueId}`} cx="30%" cy="30%" r="70%" fx="40%" fy="40%">
                        <stop offset="0%" stopColor="#FFEB3B" />
                        <stop offset="100%" stopColor="#F57F17" />
                    </radialGradient>
                </defs>
                <circle cx="50" cy="50" r="45" fill={`url(#gradYellow${uniqueId})`} />
                <ellipse cx="50" cy="25" rx="25" ry="12" fill="#FFFFFF" fillOpacity="0.4" />
                <path d="M25 45 Q32 38 39 45" stroke="#3E2723" strokeWidth="4" strokeLinecap="round" fill="none" />
                <path d="M61 45 Q68 38 75 45" stroke="#3E2723" strokeWidth="4" strokeLinecap="round" fill="none" />
                <path d="M35 60 Q50 75 65 60" stroke="#3E2723" strokeWidth="4" strokeLinecap="round" fill="none" />
            </svg>
        ),
        color: 'bg-apple-soft hover:bg-apple-medium/40',
        borderColor: 'border-brand-primary',
        selectedColor: 'bg-brand-primary'
    },
];

function RatingSelector({
    label,
    person,
    roleBadge,
    roleBadgeColor,
    avatarGradient,
    selectedRating,
    onSelect,
    comment,
    onCommentChange,
    uniqueKey,
}: {
    label: string;
    person: Partial<NamedPerson> & { pictureUrl?: string };
    roleBadge: string;
    roleBadgeColor: string;
    avatarGradient: string;
    selectedRating: RatingValue;
    onSelect: (v: RatingValue) => void;
    comment: string;
    onCommentChange: (v: string) => void;
    uniqueKey: string;
}) {
    return (
        <div className="bg-gray-50 rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-3">
                {person.pictureUrl ? (
                    <Image
                        src={person.pictureUrl}
                        alt={person.displayName || person.firstName || ''}
                        width={36}
                        height={36}
                        className="rounded-full object-cover min-w-[36px] min-h-[36px]"
                    />
                ) : (
                    <div className={`min-w-[36px] min-h-[36px] w-9 h-9 ${avatarGradient} rounded-full flex items-center justify-center shrink-0`}>
                        <span className="text-white font-bold text-sm">
                            {(person.displayName || person.firstName || 'จ').charAt(0)}
                        </span>
                    </div>
                )}
                <div className="flex-1">
                    <p className="font-semibold text-text-primary text-sm truncate">
                        {person.displayName || person.firstName || label}
                    </p>
                    <span className={`text-xs font-medium inline-block px-2 py-0.5 rounded-full mt-0.5 ${roleBadgeColor}`}>
                        {roleBadge}
                    </span>
                </div>
            </div>

            <div className="flex justify-center gap-2 mb-3">
                {ratingOptions.map((rating) => (
                    <button
                        key={rating.id}
                        type="button"
                        onClick={() => onSelect(rating.id as RatingValue)}
                        onTouchEnd={(e) => {
                            e.preventDefault();
                            onSelect(rating.id as RatingValue);
                        }}
                        style={{ touchAction: 'manipulation' }}
                        className={`flex flex-col items-center p-2.5 rounded-xl transition-all transform hover:scale-105 cursor-pointer select-none ${selectedRating === rating.id
                            ? `${rating.selectedColor} text-white shadow-lg scale-105 border-3 ${rating.borderColor}`
                            : `${rating.color} border-2 border-transparent`
                            }`}
                    >
                        <div className="mb-1 pointer-events-none">{rating.svg(uniqueKey)}</div>
                        <span className={`font-semibold text-xs pointer-events-none ${selectedRating === rating.id ? 'text-white' : 'text-text-primary'
                            }`}>
                            {rating.label}
                        </span>
                    </button>
                ))}
            </div>

            <textarea
                value={comment}
                onChange={(e) => onCommentChange(e.target.value)}
                placeholder="ความคิดเห็น (ไม่บังคับ)..."
                rows={2}
                className="w-full p-2.5 border border-border-neutral rounded-xl focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition-all resize-none text-text-primary text-sm"
            />
        </div>
    );
}

export default function FeedbackModal({
    isOpen,
    onClose,
    onSubmit,
    onSkip,
    volunteer,
    careu,
    jobId,
}: FeedbackModalProps) {
    const { user } = useAuth();
    const [driverRating, setDriverRating] = useState<RatingValue>(null);
    const [driverComment, setDriverComment] = useState('');
    const [careuRating, setCareuRating] = useState<RatingValue>(null);
    const [careuComment, setCareuComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const apiUrl = getApiUrl();

    useBodyScrollLock(isOpen);

    useEffect(() => {
        if (isOpen && jobId && user) {
            const checkRatingStatus = async () => {
                try {
                    const response = await fetch(`${apiUrl}/jobs/${jobId}`, {
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                    });
                    if (response.ok) {
                        const data = await response.json();
                        
                        if (data && data.queue) {
                            const isOwner = data.queue.userId === user.id;
                            const isBookedByCaregiver = data.queue.createdBy && data.queue.createdBy !== data.queue.userId;
                            
                            if (isBookedByCaregiver && isOwner) {
                                await Swal.fire({
                                    icon: 'warning',
                                    title: 'ไม่มีสิทธิ์ประเมิน',
                                    text: 'คิวนี้จองโดยผู้ดูแล ผู้ดูแลเท่านั้นที่สามารถประเมินได้',
                                    confirmButtonColor: '#1E7D55',
                                });
                                if (onSubmit) await onSubmit();
                                onClose();
                                return;
                            }
                        }

                        if (data && data.ratingScore !== null) {
                            await Swal.fire({
                                icon: 'info',
                                title: 'ประเมินแล้ว',
                                text: 'คุณได้ทำแบบประเมินสำหรับงานนี้ไปแล้ว',
                                confirmButtonColor: '#1E7D55',
                            });
                            if (onSubmit) {
                                await onSubmit();
                            }
                            onClose();
                        }
                    }
                } catch (e) {
                    console.error('Failed to check rating status', e);
                }
            };
            checkRatingStatus();
        }
    }, [isOpen, jobId, onClose, onSubmit, user, apiUrl]);

    if (!isOpen) return null;

    const toScore = (rating: RatingValue): number | undefined => {
        if (rating === 'good') return 3;
        if (rating === 'neutral') return 2;
        if (rating === 'bad') return 1;
        return undefined;
    };

    const canSubmit = driverRating !== null || (careu && careuRating !== null);

    const handleSubmit = async () => {
        if (!canSubmit || !user) return;

        try {
            setIsSubmitting(true);

            const body: any = { userId: user.id };

            if (driverRating) {
                body.driverRatingScore = toScore(driverRating);
                body.driverComment = driverComment || undefined;
            }

            if (careu && careuRating) {
                body.careuRatingScore = toScore(careuRating);
                body.careuComment = careuComment || undefined;
            }

            const response = await fetch(`${apiUrl}/jobs/${jobId}/rate`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(body),
            });

            if (response.ok) {
                if (onSubmit) await onSubmit();
                onClose();
            } else if (response.status === 403) {
                await Swal.fire({
                    icon: 'warning',
                    title: 'ไม่มีสิทธิ์ประเมิน',
                    text: 'คิวนี้จองโดยผู้ดูแล ผู้ดูแลเท่านั้นที่สามารถประเมินได้',
                    confirmButtonColor: '#1E7D55',
                });
                if (onSubmit) await onSubmit();
                onClose();
            } else {
                console.error('Failed to submit feedback');
            }
        } catch (error) {
            console.error('Error submitting feedback:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSkip = () => {
        if (onSkip) onSkip();
        onClose();
    };

    return (
        <>
            <div
                className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[100] flex items-start justify-center pt-6 p-4 overflow-y-auto"
            >
                <div
                    className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-5 relative animate-scale-in my-4"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="text-center mb-4">
                        <h2 className="text-xl font-bold text-brand-primary mb-1">
                            แบบประเมินการบริการ
                        </h2>
                        <p className="text-xs text-text-tertiary">
                            โปรดให้คะแนนจิตอาสาแต่ละคนแยกกัน
                        </p>
                    </div>

                    <div className="space-y-3 mb-4">
                        <RatingSelector
                            label="เจ้าหน้าที่รถ"
                            person={volunteer}
                            roleBadge="เจ้าหน้าที่รถ"
                            roleBadgeColor="text-brand-primary bg-brand-primary/10"
                            avatarGradient="bg-gradient-to-br from-teal-400 to-teal-600"
                            selectedRating={driverRating}
                            onSelect={setDriverRating}
                            comment={driverComment}
                            onCommentChange={setDriverComment}
                            uniqueKey="driver"
                        />

                        {careu && (
                            <RatingSelector
                                label="จิตอาสาแคร์ยู"
                                person={careu}
                                roleBadge="จิตอาสาแคร์ยู"
                                roleBadgeColor="text-pink-600 bg-pink-100"
                                avatarGradient="bg-gradient-to-br from-pink-400 to-pink-600"
                                selectedRating={careuRating}
                                onSelect={setCareuRating}
                                comment={careuComment}
                                onCommentChange={setCareuComment}
                                uniqueKey="careu"
                            />
                        )}
                    </div>

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={handleSkip}
                            disabled={isSubmitting}
                            style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
                            className="flex-1 py-3.5 px-4 rounded-xl border-2 border-border-neutral text-text-primary font-medium hover:bg-fuji-light transition-colors disabled:opacity-50 cursor-pointer select-none active:bg-gray-100"
                        >
                            ข้ามไปก่อน
                        </button>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={!canSubmit || isSubmitting}
                            style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
                            className="flex-1 py-3.5 px-4 rounded-xl bg-brand-primary text-white font-medium hover:bg-btn-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer select-none active:bg-teal-700"
                        >
                            {isSubmitting ? (
                                <>
                                    <svg className="animate-spin h-5 w-5 text-white pointer-events-none" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span className="pointer-events-none">รอซักครู่...</span>
                                </>
                            ) : (
                                <span className="pointer-events-none">ตกลง</span>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes scale-in {
                    from {
                        opacity: 0;
                        transform: scale(0.9);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }
                .animate-scale-in {
                    animation: scale-in 0.2s ease-out;
                }
            `}
            </style>
        </>
    );
}
