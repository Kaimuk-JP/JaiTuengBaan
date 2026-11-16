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
            <label className="typo-body text-text-tertiary dark:text-gray-300 mb-1x block">
                แนบหลักฐานการนัดหมาย
            </label>

            {!imagePreview ? (
                <div className="border-2 border-dashed border-border-neutral dark:border-gray-600 rounded-square p-4x text-center hover:border-brand-primary transition-colors bg-slate-50 dark:bg-gray-800">
                    <input
                        type="file"
                        id="file-upload"
                        className="hidden"
                        onChange={onFileChange}
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                        <div className="flex flex-col items-center gap-2">
                            <svg
                                className="w-12 h-12 text-text-placeholder"
                                viewBox="0 0 40 40"
                                fill="currentColor"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    fillRule="evenodd"
                                    clipRule="evenodd"
                                    d="M20 29.1c-.32 0-.62-.05-.9-.16a2.2 2.2 0 0 1-.79-.52l-8.29-8.3c-.4-.4-.6-.86-.59-1.39 0-.53.2-1 .6-1.42.4-.41.88-.62 1.42-.64.53-.01 1 .19 1.42.6L18 22.4V2c0-.57.2-1.04.57-1.43C18.96.2 19.43 0 20 0s1.04.2 1.43.57c.38.39.57.86.57 1.43v20.4l5.13-5.13c.4-.4.87-.59 1.41-.59a2 2 0 0 1 1.44.63c.39.42.59.88.6 1.4.01.53-.19 1-.6 1.41l-8.3 8.3a2.2 2.2 0 0 1-1.68.68ZM4.82 40a4.65 4.65 0 0 1-3.42-1.4A4.65 4.65 0 0 1 0 35.18v-5.23c0-.57.2-1.04.57-1.43.39-.38.86-.57 1.43-.57s1.04.19 1.43.57c.38.39.57.86.57 1.43v5.23c0 .2.09.4.26.56.17.17.36.26.56.26h30.36c.2 0 .4-.09.56-.26a.78.78 0 0 0 .26-.56v-5.23c0-.57.2-1.04.57-1.43.39-.38.86-.57 1.43-.57s1.04.19 1.43.57c.38.39.57.86.57 1.43v5.23c0 1.35-.47 2.49-1.4 3.42a4.65 4.65 0 0 1-3.42 1.4H4.82Z"
                                />
                            </svg>
                            <p className="typo-menu text-text-placeholder dark:text-gray-400">
                                อัพโหลดภาพ หลักฐานการนัดหมาย
                            </p>
                        </div>
                    </label>
                </div>
            ) : (
                <div className="relative">
                    <Image
                        src={imagePreview}
                        alt="Preview"
                        width={500}
                        height={300}
                        className="w-full h-auto rounded-square border-2 border-brand-secondary shadow-smooth-low"
                        unoptimized
                    />
                    <button
                        type="button"
                        onClick={onRemove}
                        className="absolute top-2 right-2 bg-status-danger hover:bg-fuan-dark text-white rounded-full p-2 shadow-smooth-medium transition-colors"
                    >
                        <svg
                            className="w-5 h-5"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>
            )}
        </div>
    );
}
