import React from 'react';

interface LoadingScreenProps {
    message?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
    message = 'กำลังโหลดข้อมูล...'
}) => {
    return (
        <div className="min-h-screen flex items-center justify-center text-emerald-700 font-bold text-lg animate-pulse bg-white">
            {message}
        </div>
    );
};
