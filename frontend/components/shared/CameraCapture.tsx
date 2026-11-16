"use client";

import { useState, useRef, useEffect, useCallback } from 'react';

interface CameraCaptureProps {
    isOpen: boolean;
    onClose: () => void;
    onCapture: (file: File) => void;
    onFallbackCamera?: () => void;
}

export default function CameraCapture({ isOpen, onClose, onCapture, onFallbackCamera }: CameraCaptureProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [isReady, setIsReady] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
    const [capturedImage, setCapturedImage] = useState<string | null>(null);

    const stopStream = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    }, []);

    const startCamera = useCallback(async (facing: 'user' | 'environment') => {
        try {
            stopStream();
            setIsReady(false);
            setError(null);
            setCapturedImage(null);

            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                setError('เบราว์เซอร์ไม่รองรับการเข้าถึงกล้อง กรุณาใช้ HTTPS หรือ localhost');
                return;
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: facing,
                    width: { ideal: 1280 },
                    height: { ideal: 960 },
                },
                audio: false,
            });

            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.onloadedmetadata = () => {
                    videoRef.current?.play();
                    setIsReady(true);
                };
            }
        } catch (err: any) {
            console.error('Camera error:', err);
            if (err.name === 'NotAllowedError') {
                setError('ไม่ได้รับอนุญาตให้เข้าถึงกล้อง กรุณาอนุญาตการเข้าถึงกล้องในการตั้งค่าเบราว์เซอร์');
            } else if (err.name === 'NotFoundError') {
                setError('ไม่พบกล้องในอุปกรณ์นี้');
            } else if (err.name === 'NotReadableError') {
                setError('กล้องกำลังถูกใช้งานโดยแอปอื่น กรุณาปิดแอปที่ใช้กล้องแล้วลองใหม่');
            } else {
                setError('ไม่สามารถเปิดกล้องได้ กรุณาลองใหม่อีกครั้ง');
            }
        }
    }, [stopStream]);

    useEffect(() => {
        if (isOpen) {
            startCamera(facingMode);
        }
        return () => {
            stopStream();
        };
    }, [isOpen]);

    const handleSwitchCamera = () => {
        const newFacing = facingMode === 'user' ? 'environment' : 'user';
        setFacingMode(newFacing);
        startCamera(newFacing);
    };

    const handleCapture = () => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        if (facingMode === 'user') {
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
        }

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedImage(dataUrl);

        stopStream();
    };

    const handleRetake = () => {
        setCapturedImage(null);
        startCamera(facingMode);
    };

    const handleConfirm = () => {
        if (!capturedImage || !canvasRef.current) return;

        canvasRef.current.toBlob((blob) => {
            if (blob) {
                const file = new File([blob], `camera_${Date.now()}.jpg`, { type: 'image/jpeg' });
                onCapture(file);
                handleClose();
            }
        }, 'image/jpeg', 0.9);
    };

    const handleClose = () => {
        stopStream();
        setCapturedImage(null);
        setIsReady(false);
        setError(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black z-[9999] flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 bg-black/80 text-white z-10">
                <button onClick={handleClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                </button>
                <span className="font-medium text-base">ถ่ายรูปโปรไฟล์</span>
                {!capturedImage && !error && (
                    <button onClick={handleSwitchCamera} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 19H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5" />
                            <path d="M23 19a2 2 0 0 1-2 2h-1" />
                            <path d="M23 7a2 2 0 0 0-2-2h-5l-2-3h-2" />
                            <circle cx="12" cy="13" r="3" />
                            <path d="M18 22l-3-3 3-3" />
                            <path d="M14 16h7" />
                        </svg>
                    </button>
                )}
                {(capturedImage || error) && <div className="w-10" />}
            </div>

            <div className="flex-1 flex items-center justify-center bg-black relative overflow-hidden">
                {error ? (
                    <div className="text-center text-white px-8">
                        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                        </div>
                        <p className="text-lg font-medium mb-2">ไม่สามารถเปิดกล้องได้</p>
                        <p className="text-sm text-gray-400 mb-6">{error}</p>
                        <div className="flex flex-col gap-3">
                            {onFallbackCamera && (
                                <button
                                    onClick={() => {
                                        onFallbackCamera();
                                        handleClose();
                                    }}
                                    className="px-6 py-3 bg-[#1E7D55] hover:bg-[#166B47] rounded-xl text-white font-medium transition-colors"
                                >
                                    ลองใช้การถ่ายรูปแบบระบบ
                                </button>
                            )}
                            <button
                                onClick={handleClose}
                                className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-colors"
                            >
                                ปิดหน้าต่าง
                            </button>
                        </div>
                    </div>
                ) : capturedImage ? (
                    <img src={capturedImage} alt="Captured" className="max-w-full max-h-full object-contain" />
                ) : (
                    <>
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover"
                            style={facingMode === 'user' ? { transform: 'scaleX(-1)' } : {}}
                        />
                        {!isReady && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black">
                                <div className="text-center text-white">
                                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-white mx-auto mb-3" />
                                    <p className="text-sm">กำลังเปิดกล้อง...</p>
                                </div>
                            </div>
                        )}
                        {isReady && (
                            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                                <div className="w-64 h-64 sm:w-72 sm:h-72 rounded-full border-[3px] border-white/40 border-dashed" />
                            </div>
                        )}
                    </>
                )}
            </div>

            <canvas ref={canvasRef} className="hidden" />

            <div className="bg-black/80 px-6 py-5">
                {capturedImage ? (
                    <div className="flex items-center justify-center gap-6">
                        <button onClick={handleRetake} className="flex flex-col items-center gap-1.5 text-white">
                            <div className="w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M1 4v6h6" />
                                    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                                </svg>
                            </div>
                            <span className="text-xs">ถ่ายใหม่</span>
                        </button>
                        <button onClick={handleConfirm} className="flex flex-col items-center gap-1.5 text-white">
                            <div className="w-14 h-14 rounded-full bg-[#1E7D55] hover:bg-[#166B47] flex items-center justify-center transition-colors">
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            </div>
                            <span className="text-xs">ใช้รูปนี้</span>
                        </button>
                    </div>
                ) : !error ? (
                    <div className="flex items-center justify-center">
                        <button
                            onClick={handleCapture}
                            disabled={!isReady}
                            className="w-[72px] h-[72px] rounded-full border-[4px] border-white flex items-center justify-center disabled:opacity-40 transition-opacity active:scale-95"
                        >
                            <div className="w-[60px] h-[60px] rounded-full bg-white" />
                        </button>
                    </div>
                ) : null}
            </div>
        </div>
    );
}
