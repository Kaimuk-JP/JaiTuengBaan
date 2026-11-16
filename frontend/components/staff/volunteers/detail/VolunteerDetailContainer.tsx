'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { fetchWithAuth } from '@/lib/auth';
import type { VolunteerDetail, Job } from './types';
import VolunteerProfileCard from './VolunteerProfileCard';
import VolunteerInfoForm from './VolunteerInfoForm';
import VolunteerSchedule from './VolunteerSchedule';
import VolunteerHistory from './VolunteerHistory';

export default function VolunteerDetailContainer() {
    const params = useParams();
    const volunteerId = params.id as string;

    const [volunteer, setVolunteer] = useState<VolunteerDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('personal');
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [workSchedule, setWorkSchedule] = useState<Job[]>([]);
    const [workHistory, setWorkHistory] = useState<Job[]>([]);

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        gender: '',
        phone: '',
        birthDate: '',
        houseNo: '',
        moo: '',
        villageName: '',
        provinceName: '',
        districtName: '',
        subdistrictName: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFormDataChange = (updates: Record<string, string>) => {
        setFormData(prev => ({ ...prev, ...updates }));
    };

    const handleSave = async () => {
        if (!volunteer) return;

        try {
            setIsSaving(true);
            const response = await fetchWithAuth(`/users/${volunteer.id}`, {
                method: 'PATCH',
                body: JSON.stringify({
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    gender: formData.gender,
                    phone: formData.phone,
                    birthDate: formData.birthDate,
                }),
            });

            if (response.ok) {
                const updatedUser = await response.json();
                setVolunteer(updatedUser);
                setIsEditing(false);
            } else {
                console.error('Failed to update volunteer');
            }
        } catch (error) {
            console.error('Error updating volunteer:', error);
        } finally {
            setIsSaving(false);
        }
    };

    useEffect(() => {
        const fetchVolunteer = async () => {
            try {
                setLoading(true);
                const response = await fetchWithAuth(`/users/${volunteerId}`);
                if (response.ok) {
                    const data = await response.json();
                    setVolunteer(data);
                    setFormData({
                        firstName: data.firstName || '',
                        lastName: data.lastName || '',
                        gender: data.gender || '',
                        phone: data.phone || '',
                        birthDate: data.birthDate || '',
                        houseNo: '',
                        moo: '',
                        villageName: '',
                        provinceName: '',
                        districtName: '',
                        subdistrictName: '',
                    });
                }
            } catch (error) {
                console.error('Error fetching volunteer:', error);
            } finally {
                setLoading(false);
            }
        };

        const fetchWorkData = async () => {
            try {
                const jobsResponse = await fetchWithAuth(`/jobs`);
                if (jobsResponse.ok) {
                    const jobsData = await jobsResponse.json();
                    const allJobs: Job[] = jobsData.jobs || [];

                    const volunteerJobs = allJobs.filter((job) =>
                        job.vltId === parseInt(volunteerId)
                    );

                    const schedule = volunteerJobs.filter((job) =>
                        ['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS'].includes(job.status)
                    );
                    const history = volunteerJobs.filter((job) =>
                        job.status === 'COMPLETED' || job.status === 'CANCELLED'
                    );

                    setWorkSchedule(schedule);
                    setWorkHistory(history);
                }
            } catch (error) {
                console.error('Error fetching work data:', error);
            }
        };

        if (volunteerId) {
            fetchVolunteer();
            fetchWorkData();
        }
    }, [volunteerId]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-96">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
            </div>
        );
    }

    return (
        <div className="p-6">
            {}
            <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-glacier-light rounded-lg flex items-center justify-center">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M16 21V19C16 17.9391 15.5786 16.9217 14.8284 16.1716C14.0783 15.4214 13.0609 15 12 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M8.5 11C10.7091 11 12.5 9.20914 12.5 7C12.5 4.79086 10.7091 3 8.5 3C6.29086 3 4.5 4.79086 4.5 7C4.5 9.20914 6.29086 11 8.5 11Z" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M20 8V14" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M23 11H17" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-text-primary">สมาชิกจิตอาสา</h1>
                </div>
            </div>

            {}
            <div className="flex gap-6">
                {}
                <VolunteerProfileCard
                    volunteer={volunteer}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                />

                {}
                <div className="flex-1">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        {activeTab === 'personal' && (
                            <VolunteerInfoForm
                                formData={formData}
                                handleChange={handleChange}
                                onFormDataChange={handleFormDataChange}
                                isEditing={isEditing}
                                isSaving={isSaving}
                                onStartEdit={() => setIsEditing(true)}
                                onCancelEdit={() => setIsEditing(false)}
                                onSave={handleSave}
                            />
                        )}

                        {activeTab === 'schedule' && (
                            <VolunteerSchedule jobs={workSchedule} />
                        )}

                        {activeTab === 'history' && (
                            <VolunteerHistory jobs={workHistory} />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
