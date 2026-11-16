"use client";

interface MedicalInfoFieldsProps {
    disease: string;
    onDiseaseChange: (value: string) => void;
}

export function MedicalInfoFields({
    disease,
    onDiseaseChange
}: MedicalInfoFieldsProps) {
    return (
        <div>
            <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                    โรคประจำตัว
                </label>
                <textarea
                    value={disease}
                    onChange={(e) => onDiseaseChange(e.target.value)}
                    rows={3}
                    className="w-full px-3.5 py-2.5 text-sm text-text-primary border border-border-neutral rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition-all resize-none"
                    placeholder="ระบุโรคประจำตัว (ถ้ามี)"
                />
            </div>
        </div>
    );
}
