interface SeverityLevel {
    level: string;
    label: string;
    color: string;
    icon: string;
}

interface PatientInfo {
    medicalConditions?: string | string[];
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
                        className={`${severityLevel.color} text-white typo-body font-semibold px-2x py-1x rounded-square flex items-center justify-center shadow-smooth-low border border-border-neutral`}
                        style={{ width: '130px', height: '45px' }}
                    >
                        <span>{severityLevel.label}</span>
                    </span>
                )}
            </div>

            { }
            {user?.medicalConditions && (
                <div className="mb-2x p-2x bg-glacier-light border border-glacier-medium rounded-square">
                    <div className="typo-body font-medium text-glacier-dark mb-1x">
                        โรคประจำตัว
                    </div>
                    <div className="typo-body text-glacier-darker">
                        {Array.isArray(user.medicalConditions)
                            ? user.medicalConditions.join(', ')
                            : user.medicalConditions}
                    </div>
                </div>
            )}

            {user?.specialNeeds && (
                <div className="mb-2x p-2x bg-saffron-light border border-saffron-medium rounded-square">
                    <div className="typo-tags font-medium text-saffron-dark mb-1x">
                        ข้อควรระวัง
                    </div>
                    <div className="typo-body text-saffron-dark">
                        {user.specialNeeds}
                    </div>
                </div>
            )}
        </div>
    );
}
