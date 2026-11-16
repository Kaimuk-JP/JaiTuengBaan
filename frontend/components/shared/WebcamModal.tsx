'use client';

import React, { useRef, useCallback, useState } from 'react';
import Webcam from 'react-webcam';

interface WebcamModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCapture: (file: File) => void;
}

export function WebcamModal({ isOpen, onClose, onCapture }: WebcamModalProps) {
    const webcamRef = useRef<Webcam>(null);
    const [imgSrc, setImgSrc] = useState<string | null>(null);

    const capture = useCallback(() => {
        const imageSrc = webcamRef.current?.getScreenshot();
        if (imageSrc) {
            setImgSrc(imageSrc);
        }
    }, [webcamRef]);

    const handleConfirm = () => {
        if (imgSrc) {
            fetch(imgSrc)
                .then(res => res.blob())
                .then(blob => {
                    const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
                    onCapture(file);
                    setImgSrc(null);
                    onClose();
                });
        }
    };

    const handleClose = () => {
        setImgSrc(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
            <div className="bg-white rounded-xl overflow-hidden w-full max-w-md shadow-2xl flex flex-col">
                <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-lg text-gray-800">ถ่ายรูปโปรไฟล์</h3>
                    <button type="button" onClick={handleClose} className="text-gray-500 hover:text-gray-700 bg-gray-200 rounded-full p-1 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>

                <div className="bg-black relative flex items-center justify-center" style={{ height: '300px' }}>
                    {!imgSrc ? (
                        <Webcam
                            audio={false}
                            ref={webcamRef}
                            screenshotFormat="image/jpeg"
                            videoConstraints={{ facingMode: "user" }}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <img src={imgSrc} alt="Captured" className="w-full h-full object-cover" />
                    )}
                </div>

                <div className="p-4 bg-gray-50 flex gap-3 justify-center">
                    {!imgSrc ? (
                        <button
                            type="button"
                            onClick={capture}
                            className="bg-brand-primary text-white py-3 px-6 rounded-lg font-medium hover:bg-brand-primary/90 w-full transition-colors flex items-center justify-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            กดเพื่อถ่ายรูป
                        </button>
                    ) : (
                        <>
                            <button
                                type="button"
                                onClick={() => setImgSrc(null)}
                                className="bg-gray-200 text-gray-800 py-3 px-6 rounded-lg font-medium hover:bg-gray-300 flex-1 transition-colors"
                            >
                                ถ่ายใหม่
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirm}
                                className="bg-brand-primary text-white py-3 px-6 rounded-lg font-medium hover:bg-brand-primary/90 flex-1 transition-colors"
                            >
                                ยืนยันใช้รูปนี้
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
