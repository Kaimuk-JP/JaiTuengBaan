'use client';

import { useRef, useEffect } from 'react';

interface WebcamModalProps {
    isOpen: boolean;
    stream: MediaStream | null;
    onClose: () => void;
    onCapture: (videoRef: React.RefObject<HTMLVideoElement | null>, canvasRef: React.RefObject<HTMLCanvasElement | null>) => void;
}

export default function WebcamModal({ isOpen, stream, onClose, onCapture }: WebcamModalProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (isOpen && stream && videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(e => console.error("Error playing video:", e));
        }
    }, [isOpen, stream]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden">
                {}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                    <h3 className="text-lg font-bold text-text-primary">ถ่ายรูปโปรไฟล์</h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>

                {}
                <div className="p-6">
                    <div className="relative bg-black rounded-xl overflow-hidden aspect-video">
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <canvas ref={canvasRef} className="hidden" />
                </div>

                {}
                <div className="flex gap-3 px-6 pb-6">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 px-4 py-3 border border-slate-300 text-text-secondary rounded-lg hover:bg-slate-50 font-medium transition-colors"
                    >
                        ยกเลิก
                    </button>
                    <button
                        type="button"
                        onClick={() => onCapture(videoRef, canvasRef)}
                        className="flex-1 px-4 py-3 bg-brand-primary text-white rounded-lg hover:bg-btn-hover font-medium transition-colors flex items-center justify-center gap-2"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                            <circle cx="12" cy="13" r="4"></circle>
                        </svg>
                        ถ่ายรูป
                    </button>
                </div>
            </div>
        </div>
    );
}
