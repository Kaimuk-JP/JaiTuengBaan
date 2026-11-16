import Image from 'next/image';

interface AppointmentImageUploadProps {
    imagePreview: string | null;
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onRemove: () => void;
}

export function AppointmentImageUpload({
    imagePreview,
    onFileChange,
    onRemove
}: AppointmentImageUploadProps) {
    return (
        <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                แนบหลักฐานการนัดหมาย
            </label>

            {!imagePreview ? (
                <div className="relative group bg-white dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl p-8 text-center hover:border-brand-primary hover:bg-brand-primary/5 transition-all duration-300 cursor-pointer">
                    <input
                        type="file"
                        id="file-upload"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        onChange={onFileChange}
                        accept="image/*"
                    />
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-14 h-14 rounded-full bg-gray-50 dark:bg-gray-700 flex items-center justify-center group-hover:scale-110 group-hover:bg-brand-primary/10 transition-transform duration-300">
                            <svg className="w-6 h-6 text-gray-400 group-hover:text-brand-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">แตะเพื่ออัปโหลดรูปภาพ</p>
                            <p className="text-xs text-gray-400 mt-1">รองรับ JPG, PNG, WEBP (สูงสุด 15MB)</p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="relative flex justify-center bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden group">
                    <Image
                        src={imagePreview}
                        alt="Preview"
                        width={500}
                        height={300}
                        className="w-full max-h-[250px] object-cover transition-transform duration-500 group-hover:scale-105"
                        unoptimized
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none" />
                    <button
                        type="button"
                        onClick={onRemove}
                        className="absolute top-3 right-3 bg-white/90 hover:bg-red-500 text-gray-700 hover:text-white rounded-full p-2.5 shadow-lg backdrop-blur-sm transition-all duration-300 z-10"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
            )}
        </div>
    );
}
