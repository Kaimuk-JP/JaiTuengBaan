import React from 'react';

interface ReadOnlyInputProps {
    label: string;
    value: string | number;
    as?: 'input' | 'textarea';
    rows?: number;
}

export const ReadOnlyInput: React.FC<ReadOnlyInputProps> = ({
    label,
    value,
    as = 'input',
    rows = 4
}) => {
    return (
        <div className="space-y-1 mt-4">
            <label className="text-sm font-medium text-text-tertiary block mb-1">
                {label}
            </label>
            {as === 'textarea' ? (
                <textarea
                    disabled
                    value={value || ''}
                    rows={rows}
                    className="w-full px-4 py-3 rounded-lg text-text-primary bg-gray-100/70 border border-gray-300 resize-none focus:outline-none"
                />
            ) : (
                <input
                    disabled
                    value={value || ''}
                    className="w-full px-4 py-3 rounded-lg text-text-primary bg-gray-100/70 border border-gray-300 focus:outline-none"
                />
            )}
        </div>
    );
};
