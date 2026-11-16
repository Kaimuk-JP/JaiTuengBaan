'use client';

import { useRef } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ChartOptions,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface VolunteerVehicleChartProps {
    volunteerData: number[];
    vehicleData: number[];
    labels: string[];
}

export default function VolunteerVehicleChart({ volunteerData, vehicleData, labels }: VolunteerVehicleChartProps) {
    const chartRef = useRef<ChartJS<'bar'>>(null);

    const chartData = {
        labels,
        datasets: [
            {
                label: 'จำนวนการใช้จิตอาสา',
                data: volunteerData,
                backgroundColor: '#F7C604',
                borderRadius: 4,
                barPercentage: 0.7,
                categoryPercentage: 0.6,
            },
            {
                label: 'จำนวนการใช้รถ',
                data: vehicleData,
                backgroundColor: '#1881BB',
                borderRadius: 4,
                barPercentage: 0.7,
                categoryPercentage: 0.6,
            },
        ],
    };

    const options: ChartOptions<'bar'> = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: true,
                position: 'top',
                align: 'end',
                labels: {
                    usePointStyle: true,
                    pointStyle: 'rectRounded',
                    padding: 16,
                    color: '#64748b',
                    font: { size: 12, family: 'Inter, sans-serif' },
                },
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                titleColor: '#fff',
                bodyColor: '#fff',
                padding: 12,
                displayColors: true,
                callbacks: {
                    label: (ctx) => ` ${ctx.dataset.label}: ${ctx.parsed.y} ครั้ง`,
                },
            },
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: {
                    color: '#64748b',
                    font: { size: 11, family: 'Inter, sans-serif' },
                },
            },
            y: {
                beginAtZero: true,
                grid: { color: '#f1f5f9', lineWidth: 1 },
                ticks: {
                    color: '#94a3b8',
                    font: { size: 12, family: 'Inter, sans-serif' },
                    stepSize: 20,
                },
            },
        },
        animation: { duration: 1000, easing: 'easeOutQuart' },
    };

    return (
        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200 transition-all duration-300 hover:shadow-md">
            <p className="text-base font-bold text-slate-900 mb-4 sm:mb-6">ปริมาณการใช้จิตอาสาและรถ</p>
            <div className="h-[280px] sm:h-[300px] md:h-[320px]">
                <Bar ref={chartRef} data={chartData} options={options} />
            </div>
        </div>
    );
}
