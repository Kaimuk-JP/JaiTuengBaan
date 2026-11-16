interface SeverityLevel {
    level: string;
    label: string;
    color: string;
    icon: string;
}

interface PatientInfo {
    medicalConditions?: string;
    specialNeeds?: string;
}

interface PatientStatusDisplayProps {
    severityLevel: SeverityLevel | null;
    user: PatientInfo | null;
}

export function PatientStatusDisplay({ severityLevel, user }: PatientStatusDisplayProps) {
    return (
        <div className="mt-3x">
            <div className="flex items-center mb-2x">
                <div className="flex items-center gap-1x">
                    <label className="typo-body text-text-tertiary mr-2x">
                        สถานะประชาชน:
                    </label>
                </div>
                {severityLevel && (
                    <span
                        className={`${severityLevel.color} text-white typo-body font-semibold px-2x py-1x rounded-square flex items-center justify-center shadow-smooth-low border border-border-neutral whitespace-nowrap`}
                        style={{ width: '150px', height: '45px' }}
                    >
                        <span>{severityLevel.label}</span>
                    </span>
                )}
            </div>


        </div>
    );
}
