interface PatientProfileSectionProps {
    pictureUrl?: string;
    displayName: string;
}

export default function PatientProfileSection({ pictureUrl, displayName }: PatientProfileSectionProps) {
    return (
        <div className="flex justify-center mb-6">
            <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden">
                {pictureUrl ? (
                    <img
                        src={pictureUrl}
                        alt={displayName}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }}
                    />
                ) : null}
                <svg className={`w-12 h-12 text-blue-600 ${pictureUrl ? 'hidden' : ''}`} fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
            </div>
        </div>
    );
}
