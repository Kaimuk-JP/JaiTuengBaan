import { Injectable } from '@nestjs/common';
import { JobQueryService } from './job-query.service';
import { JobAssignmentService } from './job-assignment.service';
import { JobLifecycleService } from './job-lifecycle.service';
import { JobReportService } from './job-report.service';

@Injectable()
export class JobService {
    constructor(
        private readonly queryService: JobQueryService,
        private readonly assignmentService: JobAssignmentService,
        private readonly lifecycleService: JobLifecycleService,
        private readonly reportService: JobReportService,
    ) {}

    getAllJobs(filters?: Parameters<JobQueryService['getAllJobs']>[0]) {
        return this.queryService.getAllJobs(filters);
    }

    getAvailableJobs() {
        return this.queryService.getAvailableJobs();
    }

    getJobsAssignedToVolunteer(vltId: string, statusFilter?: string[], date?: string) {
        return this.queryService.getJobsAssignedToVolunteer(vltId, statusFilter, date);
    }

    getVolunteerHistoryDates(volunteerId: string, role?: 'DRIVE' | 'CAREU') {
        return this.queryService.getVolunteerHistoryDates(volunteerId, role);
    }

    getJobById(id: number) {
        return this.queryService.getJobById(id);
    }

    getJobLocationTrail(jobId: number) {
        return this.queryService.getJobLocationTrail(jobId);
    }

    getMyPendingRatings(userId: string) {
        return this.queryService.getMyPendingRatings(userId);
    }

    assignJobToVolunteer(jobId: number, vltId: string, assignedBy: string, vehicleId?: number, careuId?: string) {
        return this.assignmentService.assignJobToVolunteer(jobId, vltId, assignedBy, vehicleId, careuId);
    }

    reassignJob(jobId: number, vltId: string, assignedBy: string, vehicleId?: number, careuId?: string) {
        return this.assignmentService.reassignJob(jobId, vltId, assignedBy, vehicleId, careuId);
    }

    getBusyResources(date: string, bookingTime: string, orgId?: string | null, hospitalId?: number | null, excludeJobId?: number | null) {
        return this.assignmentService.getBusyResources(date, bookingTime, orgId, hospitalId, excludeJobId);
    }

    acceptJobByVolunteer(jobId: number, vltId: string, lat?: number, lng?: number) {
        return this.assignmentService.acceptJobByVolunteer(jobId, vltId, lat, lng);
    }

    rejectJobByVolunteer(jobId: number, vltId: string, reason?: string) {
        return this.assignmentService.rejectJobByVolunteer(jobId, vltId, reason);
    }

    updateJobStatus(
        jobId: number,
        status: 'OPEN' | 'ASSIGNED' | 'ACCEPTED' | 'REJECTED' | 'PICKING_UP' | 'IN_TRANSIT' | 'AT_HOSPITAL' | 'RETURN_HOME' | 'AT_PATIENT_HOME' | 'RETURN_OFFICE' | 'COMPLETED' | 'CANCELLED',
        vltId: string,
        location?: { lat?: number; lng?: number },
        returnEvidenceUrl?: string,
    ) {
        return this.lifecycleService.updateJobStatus(jobId, status, vltId, location, returnEvidenceUrl);
    }

    requestReturnPickup(jobId: number, userId: string) {
        return this.lifecycleService.requestReturnPickup(jobId, userId);
    }

    confirmHomeDelivery(jobId: number, careuId: string, returnEvidenceUrl: string) {
        return this.lifecycleService.confirmHomeDelivery(jobId, careuId, returnEvidenceUrl);
    }

    rateJob(
        jobId: number,
        userId: string,
        driverRatingScore?: number,
        driverComment?: string,
        careuRatingScore?: number,
        careuComment?: string,
    ) {
        return this.lifecycleService.rateJob(jobId, userId, driverRatingScore, driverComment, careuRatingScore, careuComment);
    }

    rateMunicipal(
        jobId: number,
        userId: string,
        data: {
            punctuality: number;
            bookingEase: number;
            vehicleClean: number;
            safety: number;
            staffAttitude: number;
            overallScore: number;
            comment?: string;
        },
    ) {
        return this.lifecycleService.rateMunicipal(jobId, userId, data);
    }

    getDisbursementReport(month: string, organizationId: string | undefined, volunteerId?: string, startDate?: string, endDate?: string) {
        return this.reportService.getDisbursementReport(month, organizationId, volunteerId, startDate, endDate);
    }

    getRatingsReport(organizationId: string | undefined, startDate?: string, endDate?: string) {
        return this.reportService.getRatingsReport(organizationId, startDate, endDate);
    }
}
