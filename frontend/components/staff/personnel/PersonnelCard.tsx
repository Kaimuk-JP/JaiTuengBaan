import React from 'react';
import { User } from '@/types/user';

interface PersonnelCardProps {
    user: User;
}

const roleMap: Record<string, string> = {
    USERS: 'ผู้ใช้บริการ',
    DRIVE: 'เจ้าหน้าที่รถ',
    CAREU: 'จิตอาสาแคร์ยู',
    CAREGIVER: 'ผู้ดูแลประชาชน',
    STAFF: 'เจ้าหน้าที่เทศบาล',
    EXECUTIVE: 'ผู้บริหาร / ผู้อนุมัติ',
    ADMIN: 'แอดมิน',
};

const PersonnelCard: React.FC<PersonnelCardProps> = ({ user }) => {
    return (
        <div className="bg-white border-2 border-brand-primary rounded-2xl p-4 sm:p-6 flex flex-row items-center gap-4 sm:gap-6">
            { }
            <div className="flex-shrink-0">
                {user.pictureUrl ? (
                    <img
                        src={user.pictureUrl}
                        alt={user.displayName || 'User Avatar'}
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-brand-primary"
                        onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }}
                    />
                ) : null}
                <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white flex items-center justify-center border-2 border-brand-primary text-brand-primary ${user.pictureUrl ? 'hidden' : ''}`}>
                    <svg className="w-10 h-10 sm:w-12 sm:h-12" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                </div>
            </div>

            { }
            <div className="flex-grow flex flex-col gap-1.5 sm:gap-2 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm text-text-primary font-bold w-20 sm:w-24 flex-shrink-0">ชื่อ - สกุล</span>
                    <span className="text-xs sm:text-sm text-text-primary truncate">{user.displayName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || '-'}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm text-text-primary font-bold w-20 sm:w-24 flex-shrink-0">เบอร์ โทร</span>
                    <span className="text-xs sm:text-sm text-text-primary truncate">{user.phone || '-'}</span>
                </div>
                <div className="flex items-center gap-2 mt-1 sm:mt-2">
                    <span className="text-xs sm:text-sm text-text-primary font-bold">
                        {roleMap[user.role || ''] || user.role}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default PersonnelCard;
