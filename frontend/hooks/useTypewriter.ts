'use client';

import { useState, useEffect, useRef } from 'react';

export function getGraphemes(text: string): string[] {
    if (!text) return [];
    if (typeof Intl !== 'undefined' && (Intl as any).Segmenter) {
        try {
            const segmenter = new (Intl as any).Segmenter('th', { granularity: 'grapheme' });
            return Array.from(segmenter.segment(text)).map((s: any) => s.segment);
        } catch {
            return Array.from(text);
        }
    }
    return Array.from(text);
}

export function useTypewriter(targetText: string, speedMs: number = 45, delayMs: number = 100) {
    const [displayedText, setDisplayedText] = useState('');
    const [isTyping, setIsTyping] = useState(true);
    const prevTargetRef = useRef<string>('');

    useEffect(() => {
        if (!targetText) {
            setDisplayedText('');
            setIsTyping(false);
            return;
        }

        const graphemes = getGraphemes(targetText);
        if (graphemes.length === 0) {
            setDisplayedText('');
            setIsTyping(false);
            return;
        }

        let currentIndex = 0;
        setDisplayedText('');
        setIsTyping(true);

        let intervalId: any = null;
        const timeoutId = setTimeout(() => {
            intervalId = setInterval(() => {
                currentIndex++;
                setDisplayedText(graphemes.slice(0, currentIndex).join(''));
                if (currentIndex >= graphemes.length) {
                    if (intervalId) clearInterval(intervalId);
                    setIsTyping(false);
                    prevTargetRef.current = targetText;
                }
            }, speedMs);
        }, delayMs);

        return () => {
            clearTimeout(timeoutId);
            if (intervalId) clearInterval(intervalId);
        };
    }, [targetText, speedMs, delayMs]);

    return { displayedText: displayedText || (targetText ? targetText.slice(0, 1) : ''), isTyping };
}
