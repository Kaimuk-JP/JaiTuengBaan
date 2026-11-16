"use client";

import { useState, useRef, useCallback } from 'react';
import CameraCapture from './CameraCapture';
import { validateFile } from '@/utils/fileValidation';

interface ImageSourcePickerProps {
    isOpen: boolean;
    onClose: () => void;
    onImageSelected: (file: File) => void;
    maxSizeMB?: number;
}

export default function ImageSourcePicker({ isOpen, onClose, onImageSelected, maxSizeMB = 10 }: ImageSourcePickerProps) {
    const [showCamera, setShowCamera] = useState(false);
    const galleryInputRef = useRef<HTMLInputElement>(null);
    const nativeCameraInputRef = useRef<HTMLInputElement>(null);

    const validateAndEmit = useCallback((file: File) => {
        const maxSize = maxSizeMB * 1024 * 1024;

        const validation = validateFile(file, { maxSize, allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] });

        if (!validation.valid) {
            alert(validation.error || 'ไฟล์ไม่ถูกต้อง');
            return;
        }

        onImageSelected(file);
        onClose();
    }, [maxSizeMB, onImageSelected, onClose]);

    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            validateAndEmit(e.target.files[0]);
        }
        e.target.value = '';
    }, [validateAndEmit]);

    const handleChooseCamera = () => {
        onClose();
        setTimeout(() => {
            setShowCamera(true);
        }, 100);
    };

    const handleChooseGallery = () => {
        onClose();
        setTimeout(() => {
            galleryInputRef.current?.click();
        }, 100);
    };

    const handleCameraCapture = (file: File) => {
        validateAndEmit(file);
        setShowCamera(false);
    };

    const handleNativeCameraFallback = useCallback(() => {
        nativeCameraInputRef.current?.click();
    }, []);

    if (!isOpen && !showCamera) {
        return (
            <>
                <input
                    ref={galleryInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                />
                <input
                    ref={nativeCameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileChange}
                    className="hidden"
                />
            </>
        );
    }

    return (
        <>
            <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
            />
            <input
                ref={nativeCameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
            />

            <CameraCapture
                isOpen={showCamera}
                onClose={() => setShowCamera(false)}
                onCapture={handleCameraCapture}
                onFallbackCamera={handleNativeCameraFallback}
            />

            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
                    onClick={onClose}
                >
                    <div
                        className="bg-white dark:bg-gray-800 w-full sm:w-80 sm:rounded-2xl rounded-t-2xl shadow-2xl animate-slideUp overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="px-5 pt-5 pb-3 text-center">
                            <h3 className="text-lg font-bold text-text-primary dark:text-gray-100">
                                เลือกรูปภาพจาก
                            </h3>
                            <p className="text-sm text-text-tertiary dark:text-gray-400 mt-1">
                                เลือกแหล่งที่มาของรูปภาพโปรไฟล์
                            </p>
                        </div>

                        <div className="px-4 pb-2 space-y-2">
                            <button
                                onClick={handleChooseCamera}
                                className="w-full flex items-center gap-4 p-4 rounded-xl bg-[#F0FDF4] dark:bg-gray-700 hover:bg-[#DCFCE7] dark:hover:bg-gray-600 transition-colors active:scale-[0.98]"
                            >
                                <div className="w-12 h-12 rounded-full bg-brand-primary/10 flex items-center justify-center flex-shrink-0">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1E7D55" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                                        <circle cx="12" cy="13" r="4" />
                                    </svg>
                                </div>
                                <div className="text-left">
                                    <p className="font-semibold text-text-primary dark:text-gray-100">ถ่ายรูป</p>
                                    <p className="text-xs text-text-tertiary dark:text-gray-400">เปิดกล้องเพื่อถ่ายรูปโปรไฟล์</p>
                                </div>
                            </button>

                            <button
                                onClick={handleChooseGallery}
                                className="w-full flex items-center gap-4 p-4 rounded-xl bg-[#EFF6FF] dark:bg-gray-700 hover:bg-[#DBEAFE] dark:hover:bg-gray-600 transition-colors active:scale-[0.98]"
                            >
                                <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                        <circle cx="8.5" cy="8.5" r="1.5" />
                                        <path d="M21 15l-5-5L5 21" />
                                    </svg>
                                </div>
                                <div className="text-left">
                                    <p className="font-semibold text-text-primary dark:text-gray-100">เลือกจากแกลเลอรี่</p>
                                    <p className="text-xs text-text-tertiary dark:text-gray-400">เลือกรูปจากคลังภาพในเครื่อง</p>
                                </div>
                            </button>
                        </div>

                        <div className="px-4 pt-1 pb-5">
                            <button
                                onClick={onClose}
                                className="w-full py-3 rounded-xl text-text-tertiary dark:text-gray-400 font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                                ยกเลิก
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
