import { useState } from 'react';

interface AppointmentImageSectionProps {
    appointmentImage?: string;
}

export default function AppointmentImageSection({ appointmentImage }: AppointmentImageSectionProps) {
    const [isZoomed, setIsZoomed] = useState(false);

    return (
        <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-800 mb-2">
                หลักฐานการนัดหมาย
            </label>
            <div
                className={`border-2 border-gray-300 rounded-lg overflow-hidden bg-gray-50 relative group ${appointmentImage ? 'border-solid p-0 cursor-zoom-in' : 'border-dashed p-8 text-center'}`}
                onClick={() => appointmentImage && setIsZoomed(true)}
            >
                {appointmentImage ? (
                    <div className="w-full relative h-64">
                        <img
                            src={appointmentImage}
                            alt="Appointment"
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100">
                            <span className="bg-black/60 text-white px-4 py-2 rounded-full text-sm font-semibold shadow flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
                                ดูรูปขนาดเต็ม
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="text-gray-400">
                        <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p>ไม่มีหลักฐานการนัดหมาย</p>
                    </div>
                )}
            </div>

            {isZoomed && appointmentImage && (
                <div
                    className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4 cursor-zoom-out backdrop-blur-sm"
                    onClick={() => setIsZoomed(false)}
                >
                    <button
                        className="absolute top-4 right-4 text-white hover:text-gray-300 p-2 bg-black/50 rounded-full"
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsZoomed(false);
                        }}
                    >
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    <img
                        src={appointmentImage}
                        alt="Appointment Zoomed"
                        className="max-w-full max-h-[90vh] object-contain rounded shadow-2xl cursor-default"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    );
}
