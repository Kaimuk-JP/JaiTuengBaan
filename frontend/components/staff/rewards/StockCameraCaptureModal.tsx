'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import FlipCameraIosIcon from '@mui/icons-material/FlipCameraIos';
import CheckIcon from '@mui/icons-material/Check';
import ReplayIcon from '@mui/icons-material/Replay';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import FlashOnIcon from '@mui/icons-material/FlashOn';

interface StockCameraCaptureModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCapture: (file: File) => void;
    title?: string;
}

export default function StockCameraCaptureModal({
    isOpen,
    onClose,
    onCapture,
    title = 'ถ่ายรูปยืนยันสินค้าจริง / เอกสารตรวจรับ',
}: StockCameraCaptureModalProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const [isReady, setIsReady] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [flashEffect, setFlashEffect] = useState(false);

    const stopStream = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }
    }, []);

    const startCamera = useCallback(async (facing: 'environment' | 'user') => {
        try {
            stopStream();
            setIsReady(false);
            setError(null);
            setCapturedImage(null);

            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                setError('เบราว์เซอร์ไม่รองรับการเข้าถึงกล้อง (กรุณาใช้ HTTPS หรืออนุญาตสิทธิ์กล้อง)');
                return;
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: facing,
                    width: { ideal: 1920 },
                    height: { ideal: 1080 },
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
            console.error('Camera access error:', err);
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                setError('ไม่ได้รับอนุญาตให้เปิดกล้อง กรุณากดอนุญาตการเข้าถึงกล้องในการตั้งค่าเบราว์เซอร์');
            } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                setError('ไม่พบกล้องในอุปกรณ์นี้');
            } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
                setError('กล้องกำลังถูกใช้งานโดยแอปอื่น กรุณาปิดแอปที่ใช้กล้องแล้วลองใหม่อีกครั้ง');
            } else {
                setError('ไม่สามารถเปิดกล้องได้ กรุณาลองใหม่อีกครั้ง หรือใช้วิธีอัปโหลดรูปภาพ');
            }
        }
    }, [stopStream]);

    useEffect(() => {
        if (isOpen) {
            startCamera(facingMode);
        } else {
            stopStream();
        }
        return () => {
            stopStream();
        };
    }, [isOpen]);

    const handleSwitchCamera = () => {
        const nextMode = facingMode === 'environment' ? 'user' : 'environment';
        setFacingMode(nextMode);
        startCamera(nextMode);
    };

    const handleCapture = () => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;

        canvas.width = video.videoWidth || 1280;
        canvas.height = video.videoHeight || 720;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        setFlashEffect(true);
        setTimeout(() => setFlashEffect(false), 200);

        if (facingMode === 'user') {
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
        }

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
        setCapturedImage(dataUrl);

        stopStream();
    };

    const handleRetake = () => {
        setCapturedImage(null);
        startCamera(facingMode);
    };

    const handleConfirm = () => {
        if (!capturedImage || !canvasRef.current) return;

        canvasRef.current.toBlob(
            (blob) => {
                if (blob) {
                    const file = new File([blob], `stock_evidence_${Date.now()}.jpg`, {
                        type: 'image/jpeg',
                    });
                    onCapture(file);
                    handleClose();
                }
            },
            'image/jpeg',
            0.92
        );
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
        <div className="fixed inset-0 bg-black z-[99999] flex flex-col animate-fade-in select-none">
            {flashEffect && <div className="absolute inset-0 bg-white z-[100] animate-ping opacity-90"></div>}

            <div className="flex items-center justify-between px-4 sm:px-6 py-3 bg-black/80 backdrop-blur-md text-white z-20 border-b border-white/10">
                <button
                    type="button"
                    onClick={handleClose}
                    className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                    <CloseIcon fontSize="small" />
                </button>

                <div className="flex items-center gap-2">
                    <PhotoCameraIcon className="text-emerald-400" fontSize="small" />
                    <span className="font-bold text-sm sm:text-base tracking-wide">{title}</span>
                </div>

                {!capturedImage && !error ? (
                    <button
                        type="button"
                        onClick={handleSwitchCamera}
                        title="สลับกล้องหน้า-หลัง"
                        className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                    >
                        <FlipCameraIosIcon fontSize="small" />
                    </button>
                ) : (
                    <div className="w-10" />
                )}
            </div>

            <div className="flex-1 flex items-center justify-center bg-slate-950 relative overflow-hidden">
                {error ? (
                    <div className="text-center text-white px-6 max-w-md space-y-4">
                        <div className="w-20 h-20 mx-auto rounded-3xl bg-red-500/20 text-red-500 flex items-center justify-center border border-red-500/30">
                            <CloseIcon style={{ fontSize: 40 }} />
                        </div>
                        <h3 className="text-lg font-bold">ไม่สามารถเปิดกล้องได้</h3>
                        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">{error}</p>
                        <button
                            type="button"
                            onClick={handleClose}
                            className="px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-bold transition-all"
                        >
                            ปิดหน้าต่างกล้อง
                        </button>
                    </div>
                ) : capturedImage ? (
                    <div className="relative w-full h-full flex items-center justify-center p-4">
                        <img
                            src={capturedImage}
                            alt="Captured Stock Evidence"
                            className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl border border-white/10"
                        />
                    </div>
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
                            <div className="absolute inset-0 flex items-center justify-center bg-slate-950">
                                <div className="text-center text-white space-y-2">
                                    <div className="animate-spin rounded-full h-10 w-10 border-2 border-emerald-400 border-t-transparent mx-auto" />
                                    <p className="text-xs text-slate-400">กำลังเชื่อมต่อกล้อง...</p>
                                </div>
                            </div>
                        )}

                        {isReady && (
                            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6">
                                <div className="w-full max-w-sm sm:max-w-md h-64 sm:h-80 border-2 border-emerald-400/70 border-dashed rounded-3xl relative shadow-[0_0_0_9999px_rgba(0,0,0,0.3)]">
                                    <div className="absolute top-2 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg text-emerald-300 text-[11px] font-bold">
                                        เล็งกล้องไปที่สินค้าจริง หรือเอกสารตรวจรับ
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            <canvas ref={canvasRef} className="hidden" />

            <div className="bg-black/90 px-6 py-6 border-t border-white/10 flex items-center justify-center z-20">
                {capturedImage ? (
                    <div className="flex items-center gap-8">
                        <button
                            type="button"
                            onClick={handleRetake}
                            className="flex flex-col items-center gap-1.5 text-white active:scale-95 transition-transform cursor-pointer group"
                        >
                            <div className="w-14 h-14 rounded-full bg-white/15 group-hover:bg-white/25 flex items-center justify-center transition-colors">
                                <ReplayIcon fontSize="medium" />
                            </div>
                            <span className="text-xs font-bold text-slate-300">ถ่ายใหม่</span>
                        </button>

                        <button
                            type="button"
                            onClick={handleConfirm}
                            className="flex flex-col items-center gap-1.5 text-white active:scale-95 transition-transform cursor-pointer group"
                        >
                            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-[#1E7D55] to-[#146440] group-hover:from-[#196B49] group-hover:to-[#0F4E33] flex items-center justify-center shadow-lg shadow-emerald-950/60 transition-all border-2 border-emerald-300">
                                <CheckIcon fontSize="large" />
                            </div>
                            <span className="text-xs font-bold text-emerald-400">ใช้รูปนี้</span>
                        </button>
                    </div>
                ) : !error ? (
                    <div className="flex items-center justify-center">
                        <button
                            type="button"
                            onClick={handleCapture}
                            disabled={!isReady}
                            className="w-20 h-20 rounded-full border-[5px] border-white flex items-center justify-center disabled:opacity-40 transition-all active:scale-90 cursor-pointer shadow-2xl hover:border-emerald-400"
                        >
                            <div className="w-14 h-14 rounded-full bg-white hover:bg-emerald-400 transition-colors" />
                        </button>
                    </div>
                ) : null}
            </div>
        </div>
    );
}
