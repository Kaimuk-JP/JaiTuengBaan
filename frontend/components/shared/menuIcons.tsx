'use client';

import React from 'react';
import {
    Home,
    User,
    CalendarDays,
    History,
    MapPin,
    Gift,
    Award,
    Phone,
    CalendarPlus,
    Users,
    ClipboardList,
    UserPlus,
    ChartBar,
    Bell,
    Settings,
    type LucideIcon,
} from 'lucide-react';

export type MenuIconName =
    | 'home'
    | 'user'
    | 'calendar-event'
    | 'history'
    | 'map-pin'
    | 'gift'
    | 'award'
    | 'phone'
    | 'calendar-plus'
    | 'users'
    | 'clipboard-list'
    | 'user-plus'
    | 'chart-bar'
    | 'bell'
    | 'settings';

const ICON_MAP: Record<MenuIconName, LucideIcon> = {
    home: Home,
    user: User,
    'calendar-event': CalendarDays,
    history: History,
    'map-pin': MapPin,
    gift: Gift,
    award: Award,
    phone: Phone,
    'calendar-plus': CalendarPlus,
    users: Users,
    'clipboard-list': ClipboardList,
    'user-plus': UserPlus,
    'chart-bar': ChartBar,
    bell: Bell,
    settings: Settings,
};

type MenuIconProps = {
    name: MenuIconName;
    className?: string;
    size?: number;
    strokeWidth?: number;
};

export function MenuIcon({ name, className = '', size = 20, strokeWidth = 2 }: MenuIconProps) {
    const Icon = ICON_MAP[name];
    return <Icon className={className} size={size} strokeWidth={strokeWidth} aria-hidden />;
}

export function menuIcon(name: MenuIconName, className = 'w-5 h-5'): React.ReactNode {
    return <MenuIcon name={name} className={className} size={20} strokeWidth={2} />;
}

export function homeCardIcon(name: MenuIconName, className = 'w-7 h-7 shrink-0'): React.ReactNode {
    return <MenuIcon name={name} className={className} size={28} strokeWidth={1.8} />;
}
