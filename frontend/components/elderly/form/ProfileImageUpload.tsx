"use client";

import Image from 'next/image';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { WebcamModal } from '@/components/shared';
import { fixImageOrientation } from '@/lib/image-utils';

interface ProfileImageUploadProps {
    currentImageUrl?: string | null;
    onImageSelect: (file: File | null) => void;
    onPreviewChange?: (previewUrl: string | null) => void;
}

export function ProfileImageUpload({ currentImageUrl, onImageSelect, onPreviewChange }: ProfileImageUploadProps) {
    const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
    const [isWebcamOpen, setIsWebcamOpen] = useState(false);
    const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
    const [isBottomSheetVisible, setIsBottomSheetVisible] = useState(false);

    const isMobile = useMemo(() => {
        if (typeof window === 'undefined') return false;
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
            navigator.userAgent
        ) || ('ontouchstart' in window && window.innerWidth < 1024);
    }, []);

    useEffect(() => {
        setProfileImagePreview(null);
    }, [currentImageUrl]);

    const openBottomSheet = useCallback(() => {
        setIsBottomSheetOpen(true);
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                setIsBottomSheetVisible(true);
            });
        });
    }, []);

    const closeBottomSheet = useCallback(() => {
        setIsBottomSheetVisible(false);
        setTimeout(() => {
            setIsBottomSheetOpen(false);
        }, 300);
    }, []);

    const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const rawFile = e.target.files[0];

            const file = await fixImageOrientation(rawFile);

            const reader = new FileReader();
            reader.onloadend = () => {
                const preview = reader.result as string;
                setProfileImagePreview(preview);
                onPreviewChange?.(preview);
            };
            reader.readAsDataURL(file);

            onImageSelect(file);

            e.target.value = '';
        }
    };

    const displayImage = profileImagePreview || currentImageUrl;

    const handleImageClick = () => {
        openBottomSheet();
    };

    const handleCameraSelect = () => {
        closeBottomSheet();
        setTimeout(() => {
            if (isMobile) {
                document.getElementById('profile-image-camera')?.click();
            } else {
                setIsWebcamOpen(true);
            }
        }, 320);
    };

    const handleGallerySelect = () => {
        closeBottomSheet();
        setTimeout(() => {
            document.getElementById('profile-image-gallery')?.click();
        }, 320);
    };

    return (
        <div className="flex flex-col items-center gap-2x">
            {}
            <div className="relative">
                {}
                <div
                    className="w-28 h-28 aspect-square rounded-full overflow-hidden border-4 border-border-neutral bg-fuji-light cursor-pointer hover:border-border-hover transition-colors"
                    onClick={handleImageClick}
                    style={{ borderRadius: '50%' }}
                >
                    {displayImage ? (
                        <Image
                            src={displayImage}
                            alt="Profile"
                            fill
                            className="object-cover object-center"
                            style={{ borderRadius: '50%' }}
                            unoptimized
                        />
                    ) : (
                        <div className="w-full h-full bg-fuji-light flex items-center justify-center">
                            <svg className="w-12 h-12 text-text-placeholder" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                            </svg>
                        </div>
                    )}
                </div>

                {}
                <div
                    className="absolute bottom-0 right-0 w-8 h-8 bg-fuji-medium rounded-full flex items-center justify-center border-2 border-white cursor-pointer hover:bg-fuji-dark transition-colors"
                    onClick={handleImageClick}
                >
                    <svg width="17" height="15" viewBox="0 0 17 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8.5 12.0134C9.52671 12.0134 10.3971 11.6614 11.1111 10.9573C11.8251 10.2532 12.1821 9.39484 12.1821 8.38234C12.1821 7.36984 11.8251 6.51154 11.1111 5.80742C10.3971 5.1033 9.52671 4.75124 8.5 4.75124C7.47329 4.75124 6.60293 5.1033 5.88893 5.80742C5.17493 6.51154 4.81793 7.36984 4.81793 8.38234C4.81793 9.39484 5.17493 10.2532 5.88893 10.9573C6.60293 11.6614 7.47329 12.0134 8.5 12.0134ZM8.5 10.6901C7.83924 10.6901 7.28405 10.4684 6.83445 10.0248C6.38469 9.58146 6.15982 9.03396 6.15982 8.38234C6.15982 7.73073 6.38469 7.18323 6.83445 6.73984C7.28405 6.29631 7.83924 6.07455 8.5 6.07455C9.16076 6.07455 9.71595 6.29631 10.1656 6.73984C10.6153 7.18323 10.8402 7.73073 10.8402 8.38234C10.8402 9.03396 10.6153 9.58146 10.1656 10.0248C9.71595 10.4684 9.16076 10.6901 8.5 10.6901ZM1.61746 15C1.16547 15 0.782895 14.8456 0.469737 14.5368C0.156579 14.2279 0 13.8507 0 13.4049V3.35977C0 2.91404 0.156579 2.53676 0.469737 2.22793C0.782895 1.91911 1.16547 1.7647 1.61746 1.7647H4.34976L5.51986 0.514182C5.66674 0.354623 5.84427 0.229035 6.05245 0.137417C6.26062 0.0457995 6.47998 -8.90976e-06 6.71053 -8.90976e-06H10.2895C10.52 -8.90976e-06 10.7394 0.0457995 10.9476 0.137417C11.1557 0.229035 11.3333 0.354623 11.4801 0.514182L12.6502 1.7647H15.3825C15.8345 1.7647 16.2171 1.91911 16.5303 2.22793C16.8434 2.53676 17 2.91404 17 3.35977V13.4049C17 13.8507 16.8434 14.2279 16.5303 14.5368C16.2171 14.8456 15.8345 15 15.3825 15H1.61746ZM1.61746 13.6765H15.3825C15.4629 13.6765 15.5289 13.651 15.5805 13.6001C15.6321 13.5493 15.6579 13.4842 15.6579 13.4049V3.35977C15.6579 3.28051 15.6321 3.21543 15.5805 3.16455C15.5289 3.11367 15.4629 3.08823 15.3825 3.08823H12.0514L10.4098 1.32352H6.59018L4.94857 3.08823H1.61746C1.53708 3.08823 1.4711 3.11367 1.4195 3.16455C1.3679 3.21543 1.34211 3.28051 1.34211 3.35977V13.4049C1.34211 13.4842 1.3679 13.5493 1.4195 13.6001C1.4711 13.651 1.53708 13.6765 1.61746 13.6765Z" fill="#1C1B1F" />
                    </svg>
                </div>
            </div>

            {}
            <p className="typo-caption text-text-tertiary">กดเพื่อเพิ่มรูปโปรไฟล์</p>

            {}
            <input
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
                id="profile-image-gallery"
            />

            {}
            <input
                type="file"
                accept="image/*"
                capture="user"
                onChange={handleImageSelect}
                className="hidden"
                id="profile-image-camera"
            />

            {}
            {isBottomSheetOpen && (
                <div className="fixed inset-0 z-50 flex items-end justify-center">
                    {}
                    <div
                        className="absolute inset-0 bg-black transition-opacity duration-300"
                        style={{ opacity: isBottomSheetVisible ? 0.5 : 0 }}
                        onClick={closeBottomSheet}
                    />

                    {}
                    <div
                        className="relative w-full max-w-lg bg-white rounded-t-2xl transition-transform duration-300 ease-out"
                        style={{
                            transform: isBottomSheetVisible ? 'translateY(0)' : 'translateY(100%)',
                        }}
                    >
                        {}
                        <div className="flex justify-center pt-3 pb-1">
                            <div className="w-10 h-1 bg-gray-300 rounded-full" />
                        </div>

                        {}
                        <div className="px-6 pt-2 pb-4 text-center">
                            <h3 className="text-lg font-semibold text-text-primary">เลือกรูปโปรไฟล์</h3>
                        </div>

                        {}
                        <div className="px-6 pb-2">
                            {}
                            <button
                                type="button"
                                onClick={handleCameraSelect}
                                className="w-full flex items-center gap-4 py-4 px-2 hover:bg-gray-50 active:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                            >
                                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border-2 border-[#1E7D55]">
                                    <svg width="20" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M12 15.2C13.1046 15.2 14.0646 14.8418 14.88 14.1255C15.6955 13.4092 16.1032 12.5338 16.1032 11.4992C16.1032 10.4647 15.6955 9.58925 14.88 8.87292C14.0646 8.15659 13.1046 7.79843 12 7.79843C10.8954 7.79843 9.93543 8.15659 9.12 8.87292C8.30457 9.58925 7.89686 10.4647 7.89686 11.4992C7.89686 12.5338 8.30457 13.4092 9.12 14.1255C9.93543 14.8418 10.8954 15.2 12 15.2ZM4 20C3.45 20 2.97917 19.8042 2.5875 19.4125C2.19583 19.0208 2 18.55 2 18V7C2 6.45 2.19583 5.97917 2.5875 5.5875C2.97917 5.19583 3.45 5 4 5H7.15L9 3H15L16.85 5H20C20.55 5 21.0208 5.19583 21.4125 5.5875C21.8042 5.97917 22 6.45 22 7V18C22 18.55 21.8042 19.0208 21.4125 19.4125C21.0208 19.8042 20.55 20 20 20H4Z" stroke="#1E7D55" strokeWidth="1.5" fill="none"/>
                                    </svg>
                                </div>
                                <span className="text-base text-text-primary">ถ่ายรูป</span>
                            </button>

                            {}
                            <button
                                type="button"
                                onClick={handleGallerySelect}
                                className="w-full flex items-center gap-4 py-4 px-2 hover:bg-gray-50 active:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                            >
                                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border-2 border-[#1E7D55]">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <rect x="3" y="3" width="18" height="18" rx="2" stroke="#1E7D55" strokeWidth="1.5" fill="none"/>
                                        <path d="M3 17L7.5 12.5L10 15L14.5 10.5L21 17" stroke="#1E7D55" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                                        <circle cx="8.5" cy="8.5" r="1.5" stroke="#1E7D55" strokeWidth="1.5" fill="none"/>
                                    </svg>
                                </div>
                                <span className="text-base text-text-primary">เลือกจากคลังรูป</span>
                            </button>
                        </div>

                        {}
                        <div className="px-6 pb-6 pt-2">
                            <button
                                type="button"
                                onClick={closeBottomSheet}
                                className="w-full flex items-center justify-center gap-3 py-3 cursor-pointer"
                            >
                                <span className="text-base text-text-tertiary font-medium">ยกเลิก</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {}
            <WebcamModal
                isOpen={isWebcamOpen}
                onClose={() => setIsWebcamOpen(false)}
                onCapture={async (rawFile) => {
                    const file = await fixImageOrientation(rawFile);

                    const reader = new FileReader();
                    reader.onloadend = () => {
                        const preview = reader.result as string;
                        setProfileImagePreview(preview);
                        onPreviewChange?.(preview);
                    };
                    reader.readAsDataURL(file);

                    onImageSelect(file);
                }}
            />
        </div>
    );
}

