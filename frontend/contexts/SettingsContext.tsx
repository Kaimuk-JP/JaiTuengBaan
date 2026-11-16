'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { SelectOption } from '@/types/common';

export type FontSize = 'xsmall' | 'small' | 'medium' | 'large' | 'xlarge';
export type Theme = 'light' | 'dark';

export const FONT_SIZE_OPTIONS: (SelectOption<FontSize> & { scale: number })[] = [
    { value: 'xsmall', label: 'เล็กมาก', scale: 0.8 },
    { value: 'small', label: 'เล็ก', scale: 0.9 },
    { value: 'medium', label: 'กลาง (ค่าเริ่มต้น)', scale: 1.0 },
    { value: 'large', label: 'ใหญ่', scale: 1.2 },
    { value: 'xlarge', label: 'ใหญ่มาก', scale: 1.4 },
];

const BASE_FONT_SIZES: Record<string, number> = {
    '--font-alias-mobile-body-fontsize': 16,
    '--font-alias-mobile-body-lineheight': 22.4,
    '--font-alias-mobile-h1-fontsize': 36,
    '--font-alias-mobile-h1-lineheight': 43.2,
    '--font-alias-mobile-h2-fontsize': 28,
    '--font-alias-mobile-h2-lineheight': 33.6,
    '--font-alias-mobile-h3-fontsize': 24,
    '--font-alias-mobile-h3-lineheight': 33.6,
    '--font-alias-mobile-sub-fontsize': 16,
    '--font-alias-mobile-sub-lineheight': 22.4,
    '--font-alias-mobile-menu-fontsize': 14,
    '--font-alias-mobile-menu-lineheight': 19.6,
    '--font-alias-mobile-button-fontsize': 16,
    '--font-alias-mobile-button-lineheight': 16,
    '--font-alias-mobile-tags-fontsize': 14,
    '--font-alias-mobile-tags-lineheight': 19.6,
    '--font-alias-mobile-discount-fontsize': 16,
    '--font-alias-mobile-discount-lineheight': 22.4,
    '--font-alias-mobile-text-button-fontsize': 12,
    '--font-alias-mobile-text-button-lineheight': 16.8,
    '--font-alias-mobile-text-button-line-fontsize': 12,
    '--font-alias-mobile-text-button-line-lineheight': 16.8,
    '--font-alias-mobile-logo-fontsize': 16,
    '--font-alias-mobile-logo-lineheight': 19.2,
};

interface SettingsContextType {
    fontSize: FontSize;
    setFontSize: (size: FontSize) => void;
    theme: Theme;
    setTheme: (theme: Theme) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

function applyTheme(t: Theme) {
    if (t === 'dark') {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
}

function applyFontSize(size: FontSize) {
    const option = FONT_SIZE_OPTIONS.find(opt => opt.value === size);
    if (!option) return;
    const root = document.documentElement;
    Object.entries(BASE_FONT_SIZES).forEach(([varName, baseValue]) => {
        root.style.setProperty(varName, `${baseValue * option.scale}px`);
    });
    root.style.setProperty('--global-font-scale', option.scale.toString());
    root.style.fontSize = `${16 * option.scale}px`;
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const [fontSize, setFontSizeState] = useState<FontSize>('medium');
    const [theme, setThemeState] = useState<Theme>('light');

    useEffect(() => {
        const savedFont = localStorage.getItem('app-font-size') as FontSize;
        if (savedFont && FONT_SIZE_OPTIONS.some(opt => opt.value === savedFont)) {
            applyFontSize(savedFont);
            setFontSizeState(savedFont);
        }

        const savedTheme = (localStorage.getItem('app-theme') as Theme) || 'light';
        applyTheme(savedTheme);
        setThemeState(savedTheme);
    }, []);

    const setFontSize = (size: FontSize) => {
        localStorage.setItem('app-font-size', size);
        applyFontSize(size);
        setFontSizeState(size);
    };

    const setTheme = (newTheme: Theme) => {
        localStorage.setItem('app-theme', newTheme);
        applyTheme(newTheme);
        setThemeState(newTheme);
    };

    return (
        <SettingsContext.Provider value={{ fontSize, setFontSize, theme, setTheme }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
}
