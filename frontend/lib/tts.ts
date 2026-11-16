export interface SpeakTextOptions {
    rate?: number;
    pitch?: number;
    volume?: number;
    lang?: string;
}

const DEFAULT_OPTIONS: Required<SpeakTextOptions> = {
    rate: 1.3,
    pitch: 1,
    volume: 1,
    lang: 'th-TH',
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function getVoicesWithRetry(synth: SpeechSynthesis, retries = 5): Promise<SpeechSynthesisVoice[]> {
    for (let attempt = 0; attempt < retries; attempt++) {
        const voices = synth.getVoices();
        if (voices.length > 0) {
            return voices;
        }
        await wait(150);
    }

    return synth.getVoices();
}

async function speakThai(text: string, options: SpeakTextOptions = {}): Promise<boolean> {
    if (typeof window === 'undefined' || !('speechSynthesis' in window) || !text.trim()) {
        return false;
    }

    const synth = window.speechSynthesis;
    const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
    const voices = await getVoicesWithRetry(synth);
    const preferredVoice = voices.find((voice) => voice.lang?.toLowerCase().startsWith('th'))
        || voices.find((voice) => voice.default)
        || voices[0];

    return new Promise<boolean>((resolve) => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = mergedOptions.lang;
        utterance.rate = mergedOptions.rate;
        utterance.pitch = mergedOptions.pitch;
        utterance.volume = mergedOptions.volume;

        if (preferredVoice) {
            utterance.voice = preferredVoice;
            utterance.lang = preferredVoice.lang || mergedOptions.lang;
        }

        utterance.onend = () => resolve(true);
        utterance.onerror = () => resolve(false);

        synth.cancel();
        synth.resume();
        synth.speak(utterance);
    });
}

async function playProxyTts(text: string): Promise<boolean> {
    if (typeof window === 'undefined' || !text.trim()) {
        return false;
    }

    return new Promise<boolean>((resolve) => {
        const audio = new Audio(`/api/tts?text=${encodeURIComponent(text)}`);
        audio.playbackRate = DEFAULT_OPTIONS.rate;
        let settled = false;
        let stallTimeout: number | null = null;

        const cleanup = () => {
            audio.onended = null;
            audio.onerror = null;
            audio.onabort = null;
            audio.onstalled = null;
            audio.onsuspend = null;
            if (stallTimeout !== null) {
                window.clearTimeout(stallTimeout);
                stallTimeout = null;
            }
        };

        const finish = (result: boolean) => {
            if (settled) return;
            settled = true;
            cleanup();
            resolve(result);
        };

        audio.onended = () => finish(true);
        audio.onerror = () => finish(false);
        audio.onabort = () => finish(false);
        audio.onstalled = () => finish(false);
        audio.onsuspend = () => {
            if (!audio.ended && audio.currentTime === 0) {
                finish(false);
            }
        };

        stallTimeout = window.setTimeout(() => {
            if (!audio.ended) {
                finish(false);
            }
        }, 15000);

        audio.play().catch(() => finish(false));
    });
}

class TtsQueue {
    private queue: Array<() => Promise<void>> = [];
    private running = false;

    enqueue(task: () => Promise<void>) {
        this.queue.push(task);
        if (!this.running) {
            void this.run();
        }
    }

    private async run() {
        this.running = true;

        while (this.queue.length > 0) {
            const task = this.queue.shift();
            if (!task) continue;

            try {
                await task();
            } catch (error) {
                console.error('TTS queue error:', error);
            }
        }

        this.running = false;
    }
}

const ttsQueue = new TtsQueue();

export async function speakText(text: string, options: SpeakTextOptions = {}): Promise<boolean> {
    if (typeof window === 'undefined' || !text.trim()) {
        return false;
    }

    return new Promise<boolean>((resolve) => {
        ttsQueue.enqueue(async () => {
            const proxySucceeded = await playProxyTts(text);
            if (proxySucceeded) {
                resolve(true);
                return;
            }

            console.warn('Proxy TTS ขัดข้อง กำลังใช้ Web Speech API');
            const fallbackSucceeded = await speakThai(text, options);
            resolve(fallbackSucceeded);
        });
    });
}
