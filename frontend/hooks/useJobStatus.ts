'use client';

import { useEffect, useState, useCallback } from 'react';
import { getApiUrl } from '@/lib/api';

interface Job {
    id: number;
    status: string;
    ratingScore: number | null;
    completedAt: string | null;
    municipalRating?: any | null;
    vlt: {
        id: number;
        displayName: string;
        pictureUrl?: string;
        phone?: string;
    } | null;
}

export function useJobStatus(userId: number | undefined) {
    const [completedJob, setCompletedJob] = useState<Job | null>(null);
    const [showRatingModal, setShowRatingModal] = useState(false);
    const [municipalPendingJobId, setMunicipalPendingJobId] = useState<number | null>(null);
    const [showMunicipalModal, setShowMunicipalModal] = useState(false);

    const checkJobStatus = useCallback(async () => {
        if (!userId) {
            return;
        }

        try {
            const url = `${getApiUrl()}/jobs/my-pending-ratings`;

            const response = await fetch(url, {
                credentials: 'include',
            });

            if (!response.ok) {
                console.warn('[useJobStatus] Response not OK:', response.status);
                return;
            }

            const jobs: Job[] = await response.json();

            const unratedJob = jobs.find(job =>
                job.ratingScore === null
            );

            if (unratedJob) {
                setCompletedJob(unratedJob);
                setShowRatingModal(true);
            } else {
                const unratedMunicipalJob = jobs.find(job =>
                    !job.municipalRating
                );

                if (unratedMunicipalJob) {
                    setMunicipalPendingJobId(unratedMunicipalJob.id);
                    setShowMunicipalModal(true);
                }
            }
        } catch (error) {
            console.error('[useJobStatus] Error checking job status:', error);
        }
    }, [userId]);

    useEffect(() => {
        if (!userId) return;

        checkJobStatus();

        const interval = setInterval(checkJobStatus, 60000);

        return () => {
            clearInterval(interval);
        };
    }, [userId, checkJobStatus]);

    const closeModal = () => {
        setShowRatingModal(false);
        setCompletedJob(null);
    };

    const closeMunicipalModal = () => {
        setShowMunicipalModal(false);
        setMunicipalPendingJobId(null);
    };

    return {
        completedJob,
        showRatingModal,
        closeModal,
        municipalPendingJobId,
        showMunicipalModal,
        closeMunicipalModal,
    };
}
