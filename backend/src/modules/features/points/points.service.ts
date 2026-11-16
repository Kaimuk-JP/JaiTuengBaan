import { Injectable } from '@nestjs/common';

interface PointCalculationParams {
    distance?: number;
    severityLevel: 'GREEN' | 'YELLOW' | 'RED';
    mobilityStatus: 'WALKING' | 'WHEELCHAIR' | 'BEDRIDDEN';
    duration?: number;
}

@Injectable()
export class PointsService {
        calculatePoints(_params?: PointCalculationParams): number {
        return 20;
    }

        calculateDistance(
        lat1: number,
        lng1: number,
        lat2: number,
        lng2: number
    ): number {
        const R = 6371;
        const dLat = this.toRadians(lat2 - lat1);
        const dLng = this.toRadians(lng2 - lng1);

        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRadians(lat1)) *
            Math.cos(this.toRadians(lat2)) *
            Math.sin(dLng / 2) *
            Math.sin(dLng / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        return Math.round(distance * 100) / 100;
    }

    private toRadians(degrees: number): number {
        return degrees * (Math.PI / 180);
    }

        calculateDuration(startTime: Date, endTime: Date): number {
        const durationMs = endTime.getTime() - startTime.getTime();
        const durationMinutes = Math.floor(durationMs / 60000);
        return durationMinutes;
    }

        getSeverityMultiplier(severityLevel: 'GREEN' | 'YELLOW' | 'RED'): number {
        switch (severityLevel) {
            case 'RED':
                return 2;
            case 'YELLOW':
                return 1.5;
            case 'GREEN':
            default:
                return 1;
        }
    }

        getMobilityBonus(mobilityStatus: 'WALKING' | 'WHEELCHAIR' | 'BEDRIDDEN'): number {
        switch (mobilityStatus) {
            case 'BEDRIDDEN':
                return 10;
            case 'WHEELCHAIR':
                return 5;
            case 'WALKING':
            default:
                return 0;
        }
    }
}
