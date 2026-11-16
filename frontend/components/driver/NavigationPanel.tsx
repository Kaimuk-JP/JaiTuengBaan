'use client';

import React, { useState, useEffect } from 'react';
import { NavigationInfo, getManeuverIcon } from '../maps/Routing';

interface NavigationPanelProps {
    navInfo: NavigationInfo | null;
    hospitalName?: string;
    isEmbedded?: boolean;
}

export default function NavigationPanel({ navInfo, hospitalName, onToggle, sheetLevel, isEmbedded = false }: NavigationPanelProps & { onToggle: () => void, sheetLevel: number }) {
    const [voiceEnabled, setVoiceEnabled] = useState(false);
    const [hasSpoken, setHasSpoken] = useState<string | null>(null);

    useEffect(() => {
        const saved = localStorage.getItem('voice_navigation_enabled');
        if (saved) {
            setVoiceEnabled(saved === 'true');
        }
    }, []);

    const formatDistance = (meters: number) => {
        if (meters < 1000) return `${Math.round(meters)} ม.`;
        return `${(meters / 1000).toFixed(1)} กม.`;
    };

    const formatDuration = (seconds: number) => {
        const minutes = Math.round(seconds / 60);
        if (minutes < 60) return `${minutes} นาที`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours} ชม. ${mins} นาที`;
    };

    const toggleVoice = () => {
        const newState = !voiceEnabled;
        setVoiceEnabled(newState);
        localStorage.setItem('voice_navigation_enabled', String(newState));

        if (newState) {
            speak('เปิดเสียงนำทาง');
        } else {
            window.speechSynthesis.cancel();
        }
    };

    const speak = (text: string) => {
        if (!window.speechSynthesis) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'th-TH';
        utterance.rate = 1.0;
        window.speechSynthesis.speak(utterance);
    };

    useEffect(() => {
        if (!navInfo || !voiceEnabled) return;

        const { currentInstruction, distanceToNextTurn, maneuver } = navInfo;
        const key = `${currentInstruction}-${Math.floor(distanceToNextTurn / 50)}`;

        if (hasSpoken === key) return;

        let shouldSpeak = false;
        let textToSpeak = '';

        if (distanceToNextTurn > 1000 && !hasSpoken?.startsWith(currentInstruction)) {
            shouldSpeak = true;
            textToSpeak = `อีก ${formatDistance(distanceToNextTurn)} ${currentInstruction}`;
        }
        else if (distanceToNextTurn <= 500 && distanceToNextTurn > 450) {
            shouldSpeak = true;
            textToSpeak = `อีก 500 เมตร ${currentInstruction}`;
        }
        else if (distanceToNextTurn <= 200 && distanceToNextTurn > 180) {
            shouldSpeak = true;
            textToSpeak = `อีก 200 เมตร ${currentInstruction}`;
        }
        else if (distanceToNextTurn <= 50) {
            shouldSpeak = true;
            textToSpeak = `${currentInstruction} เดี๋ยวนี้`;
        }

        if (shouldSpeak) {
            speak(textToSpeak);
            setHasSpoken(key);
        }

    }, [navInfo, voiceEnabled, hasSpoken]);

    if (!navInfo) return null;

    const icon = getManeuverIcon(navInfo.maneuver);
    const isArriving = navInfo.distanceToDestination < 100;

    return (
        <div className={isEmbedded ? '' : `mx-4 -mt-8 mb-2 relative z-[1000]`}>
            { }
            <button
                onClick={onToggle}
                className="w-full flex flex-col items-center justify-center pt-2 pb-2 touch-manipulation cursor-grab active:cursor-grabbing outline-none"
                aria-label={sheetLevel === 3 ? 'ย่อแผง' : 'ขยายแผง'}
            >
                <div className="w-12 h-1.5 bg-gray-300 rounded-full mb-1 opacity-80" />
                <span className="text-xs text-gray-400">{sheetLevel === 3 ? 'แตะเพื่อย่อ' : 'แตะเพื่อขยาย'}</span>
            </button>

            { }
            <div className={isEmbedded ? 'px-4 pt-4 pb-8' : `px-4 py-4 bg-white border-2 border-[#1E7D55] rounded-2xl shadow-lg relative overflow-hidden`}>


                { }
                <div className="flex flex-col">
                    <p className="text-2xl font-bold text-[#1E7D55]">
                        {formatDuration(navInfo.durationToDestination)} ({formatDistance(navInfo.distanceToDestination)})
                    </p>
                    <div className="flex items-center justify-between mt-1">
                        <p className="text-base text-gray-500">
                            ไปถึง {(() => {
                                const now = new Date();
                                const eta = new Date(now.getTime() + navInfo.durationToDestination * 1000);
                                return eta.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false });
                            })()}
                        </p>
                        {hospitalName && (
                            <p className="text-sm text-gray-400 truncate max-w-[60%] text-right">
                                {hospitalName}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
