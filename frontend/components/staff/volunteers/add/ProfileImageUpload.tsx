'use client';

import { useRef } from 'react';
import Image from 'next/image';

interface ProfileImageUploadProps {
    profileImage: string | null;
    originalPictureUrl?: string;
    onImageSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onStartWebcam: () => void;
}

export default function ProfileImageUpload({
    profileImage,
    originalPictureUrl,
    onImageSelect,
    onStartWebcam
}: ProfileImageUploadProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);

    return (
        <div className="flex flex-col items-center mb-8">
            <div className="relative">
                <div className="w-28 h-28 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border-2 border-slate-200">
                    {profileImage ? (
                        <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                    ) : originalPictureUrl ? (
                        <Image src={originalPictureUrl} alt="Profile" width={112} height={112} className="w-full h-full object-cover" />
                    ) : (
                        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                    )}
                </div>

                <button
                    type="button"
                    onClick={onStartWebcam}
                    className="absolute bottom-0 right-0 w-8 h-8 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-sm hover:bg-slate-50 transition-colors"
                    title="ถ่ายรูป"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                        <circle cx="12" cy="13" r="4"></circle>
                    </svg>
                </button>

                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 left-0 w-8 h-8 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-sm hover:bg-slate-50 transition-colors"
                    title="เลือกจากอัลบั้ม"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <circle cx="8.5" cy="8.5" r="1.5"></circle>
                        <polyline points="21 15 16 10 5 21"></polyline>
                    </svg>
                </button>
            </div>

            <input
                type="file"
                ref={cameraInputRef}
                accept="image/*"
                capture="environment"
                onChange={onImageSelect}
                className="hidden"
            />
            <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={onImageSelect}
                className="hidden"
            />
        </div>
    );
}
