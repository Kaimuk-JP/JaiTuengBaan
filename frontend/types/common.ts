export interface LatLng {
    lat: number;
    lng: number;
}

export interface NamedPerson {
    firstName?: string;
    lastName?: string;
    displayName: string;
}

export interface ContactPerson extends NamedPerson {
    phone?: string;
    pictureUrl?: string | null;
}

export interface ChartDataPoint {
    label: string;
    count: number;
}

export interface DetailedChartDataPoint extends ChartDataPoint {
    volunteerCount: number;
    vehicleCount: number;
}

export interface MonthlyChartDataPoint extends DetailedChartDataPoint {
    year: number;
    month: number;
}

export interface DailyChartDataPoint extends DetailedChartDataPoint {
    dateStr: string;
}

export interface TimeSlot {
    value: string;
    label: string;
    endTime: string;
}

export interface StatusStyle {
    text: string;
    bg: string;
    color: string;
}

export interface DateLimit {
    date: string;
    limit: number;
}

export interface RouteInfo {
    distance: number;
    duration: number;
}

export interface BusyResources {
    busyVehicleIds: number[];
    busyDriverIds: string[];
    busyCareuIds: string[];
}

export interface SelectedPerson {
    name: string;
    avgScore: number;
    totalRatings: number;
    jobs: unknown[];
    type: 'driver' | 'careu';
}

export interface Tab<T = string> {
    id: T;
    label: string;
    count?: number;
}

export interface NameActiveUpdate {
    name?: string;
    isActive?: boolean;
}

export interface NamedItem {
    id?: number;
    name: string;
}

export interface SelectOption<T = string> {
    value: T;
    label: string;
}

export interface ColoredChartDataPoint {
    name?: string;
    type?: string;
    label?: string;
    count: number;
    color: string;
    rawCount?: number;
}
