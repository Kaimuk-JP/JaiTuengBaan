import type { Map as MapboxMap } from 'mapbox-gl';

export const THAILAND_MAP_BOUNDS: [[number, number], [number, number]] = [
    [96.5, 5.0],
    [106.5, 21.0],
];

export const THAILAND_MAP_MIN_ZOOM = 5;

const THAI_TEXT_FIELD = ['coalesce', ['get', 'name_th'], ['get', 'name']];

export function applyMapboxThaiLanguage(map: MapboxMap): void {
    try {
        const setLanguage = (map as MapboxMap & { setLanguage?: (lang: string) => void }).setLanguage;
        if (typeof setLanguage === 'function') {
            setLanguage.call(map, 'th');
        }
    } catch (err) {
        console.warn('setLanguage(th) failed:', err);
    }

    try {
        for (const layer of map.getStyle()?.layers ?? []) {
            if (layer.type !== 'symbol') continue;
            const layout = layer.layout as Record<string, unknown> | undefined;
            if (!layout || layout['text-field'] == null) continue;
            try {
                map.setLayoutProperty(layer.id, 'text-field', THAI_TEXT_FIELD as never);
            } catch {
            }
        }
    } catch (err) {
        console.warn('Thai label fallback failed:', err);
    }
}
