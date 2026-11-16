export type Tab =
    | 'organization'
    | 'time-slots'
    | 'booking-limits'
    | 'diseases'
    | 'hospitals'
    | 'equipment'
    | 'tts'
    | 'display'
    | 'role';

export interface Disease {
    id: number;
    name: string;
    isActive: boolean;
}

export interface Hospital {
    id: number;
    name: string;
}
