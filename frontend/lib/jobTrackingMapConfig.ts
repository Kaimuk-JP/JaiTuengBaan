import type { LatLng } from '@/lib/sanitizeLocationTrail';

export type JobMapPhase = 'pickup' | 'transit' | 'at_hospital' | 'return' | 'completed';

export function getJobMapPhase(jobStatus?: string): JobMapPhase {
    switch (jobStatus) {
        case 'ASSIGNED':
        case 'ACCEPTED':
        case 'PICKING_UP':
            return 'pickup';
        case 'IN_TRANSIT':
        case 'IN_PROGRESS':
            return 'transit';
        case 'AT_HOSPITAL':
            return 'at_hospital';
        case 'RETURN_HOME':
        case 'RETURN_OFFICE':
        case 'AT_PATIENT_HOME':
            return 'return';
        case 'COMPLETED':
            return 'completed';
        default:
            return 'pickup';
    }
}

export interface JobMapDisplayConfig {
    phase: JobMapPhase;
    showPatient: boolean;
    showHospital: boolean;
    showDriver: boolean;
    routeWaypoints: LatLng[];
    anchors: LatLng[];
    fitPoints: LatLng[];
    phaseLabel: string;
}

function pushUnique(target: LatLng[], point: LatLng | null | undefined) {
    if (!point) return;
    target.push(point);
}

export function getJobMapDisplayConfig(
    jobStatus: string | undefined,
    patient: LatLng | null,
    hospital: LatLng | null,
    driver: LatLng | null,
    patientName?: string,
): JobMapDisplayConfig {
    const phase = getJobMapPhase(jobStatus);

    switch (phase) {
        case 'pickup': {
            const routeWaypoints: LatLng[] = [];
            if (driver && patient) routeWaypoints.push(driver, patient);
            const anchors: LatLng[] = [];
            pushUnique(anchors, patient);
            pushUnique(anchors, driver);
            const fitPoints = [...anchors];
            return {
                phase,
                showPatient: Boolean(patient),
                showHospital: false,
                showDriver: Boolean(driver),
                routeWaypoints,
                anchors,
                fitPoints,
                phaseLabel: 'กำลังไปรับประชาชน',
            };
        }
        case 'transit': {
            const routeWaypoints: LatLng[] = [];
            if (driver && hospital) routeWaypoints.push(driver, hospital);
            const anchors: LatLng[] = [];
            pushUnique(anchors, hospital);
            pushUnique(anchors, driver);
            const fitPoints = [...anchors];
            return {
                phase,
                showPatient: false,
                showHospital: Boolean(hospital),
                showDriver: Boolean(driver),
                routeWaypoints,
                anchors,
                fitPoints,
                phaseLabel: 'กำลังไปโรงพยาบาล',
            };
        }
        case 'at_hospital': {
            const anchors: LatLng[] = [];
            pushUnique(anchors, hospital);
            pushUnique(anchors, driver);
            const fitPoints = [...anchors];
            return {
                phase,
                showPatient: false,
                showHospital: Boolean(hospital),
                showDriver: Boolean(driver),
                routeWaypoints: driver && hospital ? [driver, hospital] : [],
                anchors,
                fitPoints,
                phaseLabel: 'อยู่ที่โรงพยาบาล',
            };
        }
        case 'return': {
            const routeWaypoints: LatLng[] = [];
            if (driver && patient) routeWaypoints.push(driver, patient);
            else if (hospital && patient) routeWaypoints.push(hospital, patient);
            const anchors: LatLng[] = [];
            pushUnique(anchors, patient);
            pushUnique(anchors, driver);
            pushUnique(anchors, hospital);
            const fitPoints: LatLng[] = [];
            pushUnique(fitPoints, patient);
            pushUnique(fitPoints, driver);
            return {
                phase,
                showPatient: Boolean(patient),
                showHospital: false,
                showDriver: Boolean(driver),
                routeWaypoints,
                anchors,
                fitPoints,
                phaseLabel: patientName ? `กำลังพา ${patientName} กลับบ้าน` : 'กำลังพาประชาชนกลับบ้าน',
            };
        }
        case 'completed':
        default: {
            const anchors: LatLng[] = [];
            pushUnique(anchors, patient);
            pushUnique(anchors, hospital);
            const fitPoints = [...anchors];
            return {
                phase: 'completed',
                showPatient: false,
                showHospital: false,
                showDriver: false,
                routeWaypoints: [],
                anchors,
                fitPoints,
                phaseLabel: 'เส้นทางจริง (GPS)',
            };
        }
    }
}
