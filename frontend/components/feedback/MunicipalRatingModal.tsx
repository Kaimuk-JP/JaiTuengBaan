'use client';

import { useState, useEffect } from 'react';
import { getApiUrl } from '@/lib/api';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { useAuth } from '@/contexts/AuthContext';
import Swal from 'sweetalert2';

interface MunicipalRatingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit?: () => void | Promise<void>;
    onSkip?: () => void;
    jobId: number;
}

const ratingCategories = [
    { key: 'punctuality', label: 'ความตรงต่อเวลา', icon: '', desc: 'รถมารับตรงเวลาไหม' },
    { key: 'bookingEase', label: 'ความสะดวกในการจองคิว', icon: '', desc: 'ขั้นตอนการจองง่ายไหม' },
    { key: 'vehicleClean', label: 'ความสะอาดของรถ', icon: '', desc: 'รถสะอาด เรียบร้อยไหม' },
    { key: 'safety', label: 'ความปลอดภัย', icon: '', desc: 'รู้สึกปลอดภัยไหม' },
    { key: 'staffAttitude', label: 'ความเอาใจใส่ของเจ้าหน้าที่', icon: '', desc: 'เจ้าหน้าที่ดูแลดีไหม' },
    { key: 'overallScore', label: 'ความพึงพอใจโดยรวม', icon: '', desc: 'พึงพอใจภาพรวมไหม' },
];

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
    const handleTouch = (star: number) => (e: React.TouchEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onChange(star);
    };

    return (
        <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    onClick={() => onChange(star)}
                    onTouchEnd={handleTouch(star)}
                    style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
                    className="cursor-pointer select-none p-1.5 transition-transform hover:scale-110 active:scale-95"
                >
                    <svg
                        width="32"
                        height="32"
                        viewBox="0 0 24 24"
                        fill={star <= value ? '#f59e0b' : 'none'}
                        stroke={star <= value ? '#f59e0b' : '#d1d5db'}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="pointer-events-none"
                    >
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                </button>
            ))}
        </div>
    );
}

export default function MunicipalRatingModal({
    isOpen,
    onClose,
    onSubmit,
    onSkip,
    jobId,
}: MunicipalRatingModalProps) {
    const [scores, setScores] = useState<Record<string, number>>({
        punctuality: 0,
        bookingEase: 0,
        vehicleClean: 0,
        safety: 0,
        staffAttitude: 0,
        overallScore: 0,
    });
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { user } = useAuth();
    
    useBodyScrollLock(isOpen);

    useEffect(() => {
        if (isOpen && jobId && user) {
            const checkRatingStatus = async () => {
                try {
                    const response = await fetch(`${getApiUrl()}/jobs/${jobId}`, {
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
                        
                        if (data && data.municipalRating) {
                            await Swal.fire({
                                icon: 'info',
                                title: 'ประเมินแล้ว',
                                text: 'คุณได้ทำแบบประเมินเทศบาลสำหรับงานนี้ไปแล้ว',
                                confirmButtonColor: '#1E7D55',
                            });
                            if (onSubmit) await onSubmit();
                            onClose();
                        }
                    }
                } catch (e) {
                    console.error('Failed to check municipal rating status', e);
                }
            };
            checkRatingStatus();
        }
    }, [isOpen, jobId, onClose, onSubmit, user]);

    if (!isOpen) return null;

    const allRated = Object.values(scores).every((v) => v >= 1);

    const handleSubmit = async () => {
        if (!allRated) return;

        try {
            setIsSubmitting(true);

            const response = await fetch(`${getApiUrl()}/jobs/${jobId}/rate-municipal`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    ...scores,
                    comment: comment || undefined,
                }),
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
                console.error('Failed to submit municipal rating');
            }
        } catch (error) {
            console.error('Error submitting municipal rating:', error);
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
                className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[101] flex items-start justify-center pt-6 p-4 overflow-y-auto"
            >
                <div
                    className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-5 relative animate-scale-in my-4"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="text-center mb-4">
                        <h2 className="text-xl font-bold text-blue-700 mb-1">
                            ประเมินการบริการเทศบาล
                        </h2>
                        <p className="text-xs text-text-tertiary">
                            โปรดให้คะแนนการบริการในแต่ละด้าน
                        </p>
                    </div>

                    <div className="space-y-3 mb-4 max-h-[50vh] overflow-y-auto pr-1">
                        {ratingCategories.map((cat) => (
                            <div
                                key={cat.key}
                                className="bg-gray-50 rounded-xl p-3 transition-all"
                            >
                                <div className="flex items-center gap-2 mb-1.5">
                                    <span className="text-lg">{cat.icon}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-text-primary text-sm truncate">{cat.label}</p>
                                        <p className="text-[11px] text-text-tertiary">{cat.desc}</p>
                                    </div>
                                </div>
                                <div className="flex justify-center">
                                    <StarRating
                                        value={scores[cat.key]}
                                        onChange={(v) => setScores((prev) => ({ ...prev, [cat.key]: v }))}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="ข้อเสนอแนะเพิ่มเติม (ไม่บังคับ)..."
                        rows={2}
                        className="w-full p-2.5 border border-border-neutral rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition-all resize-none text-text-primary text-sm mb-4"
                    />

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
                            disabled={!allRated || isSubmitting}
                            style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
                            className="flex-1 py-3.5 px-4 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer select-none active:bg-blue-800"
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
                                <span className="pointer-events-none">ส่งประเมิน</span>
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
