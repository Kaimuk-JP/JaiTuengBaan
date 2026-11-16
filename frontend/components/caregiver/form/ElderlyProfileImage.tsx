'use client';

import { useState } from 'react';
import Swal from '@/lib/swal';
import { WebcamModal } from '@/components/shared';

interface ElderlyProfileImageProps {
    picturePreview: string | null;
    onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function ElderlyProfileImage({ picturePreview, onImageChange }: ElderlyProfileImageProps) {
    const inputGalleryId = 'elderly-profile-upload-gallery';
    const [isWebcamOpen, setIsWebcamOpen] = useState(false);

    const handleImageClick = () => {
        Swal.fire({
            title: 'อัพโหลดรูปโปรไฟล์',
            text: 'กรุณาเลือกวิธีการอัพโหลดรูปภาพ',
            showCancelButton: true,
            confirmButtonText: 'ถ่ายรูปจากกล้อง',
            cancelButtonText: 'เลือกจากอัลบั้ม',
            confirmButtonColor: '#1E7D55',
            cancelButtonColor: '#3085d6',
            reverseButtons: true
        }).then((result) => {
            if (result.isConfirmed) {
                setIsWebcamOpen(true);
            } else if (result.isDismissed && result.dismiss === 'cancel') {
                document.getElementById(inputGalleryId)?.click();
            }
        });
    };

    return (
        <div className="flex flex-col items-center mb-3x">
            <div className="relative">
                <div
                    className="w-24 h-24 rounded-full bg-[#E8F0FE] flex items-center justify-center cursor-pointer overflow-hidden hover:opacity-90 transition-opacity"
                    onClick={handleImageClick}
                >
                    {picturePreview ? (
                        <img
                            src={picturePreview}
                            alt="Profile"
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <svg className="w-14 h-14 text-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    )}
                </div>
                {}
                <div
                    className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-lg border border-border-neutral flex items-center justify-center cursor-pointer shadow-sm hover:bg-field-default transition-colors"
                    onClick={handleImageClick}
                >
                    <svg className="w-5 h-5 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                    </svg>
                </div>
            </div>
            <input
                id={inputGalleryId}
                type="file"
                accept="image/*"
                onChange={onImageChange}
                className="hidden"
            />
            <WebcamModal
                isOpen={isWebcamOpen}
                onClose={() => setIsWebcamOpen(false)}
                onCapture={(file) => {
                    const syntheticEvent = {
                        target: {
                            files: [file]
                        }
                    } as unknown as React.ChangeEvent<HTMLInputElement>;
                    onImageChange(syntheticEvent);
                }}
            />
        </div>
    );
}
