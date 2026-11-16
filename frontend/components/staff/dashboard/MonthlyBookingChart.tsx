'use client';

import { useEffect, useRef } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler,
    ChartOptions,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import type { ChartDataPoint } from '@/types/common';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

interface MonthlyBookingChartProps {
    data: ChartDataPoint[];
    viewMode?: 'monthly' | 'weekly' | 'daily';
    onViewChange?: (mode: 'monthly' | 'weekly' | 'daily') => void;
}

export default function MonthlyBookingChart({ data, viewMode = 'monthly', onViewChange }: MonthlyBookingChartProps) {
    const chartRef = useRef<ChartJS<'line'>>(null);

    const segmentPlugin = {
        id: 'verticalSegments',
        afterDatasetsDraw(chart: any) {
            const { ctx, scales: { x, y } } = chart;
            const dataset = chart.data.datasets[0];
            const meta = chart.getDatasetMeta(0);

            ctx.save();
            ctx.strokeStyle = '#77BE80';
            ctx.lineWidth = 2;

            meta.data.forEach((point: any, index: number) => {
                const xPos = point.x;
                const yPos = point.y;
                const yBottom = y.bottom;

                const pointRadius = dataset.pointRadius || 6;

                ctx.beginPath();
                ctx.moveTo(xPos, yBottom);
                ctx.lineTo(xPos, yPos + pointRadius);
                ctx.stroke();
            });

            ctx.restore();
        }
    };

    const chartData = {
        labels: data.map(d => d.label),
        datasets: [
            {
                label: 'จำนวนการจอง',
                data: data.map(d => d.count),
                fill: true,
                backgroundColor: (context: any) => {
                    const ctx = context.chart.ctx;
                    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
                    gradient.addColorStop(0, 'rgba(119, 190, 128, 0.4)');
                    gradient.addColorStop(1, 'rgba(119, 190, 128, 0.1)');
                    return gradient;
                },
                borderColor: '#77BE80',
                borderWidth: 3,
                pointBackgroundColor: '#77BE80',
                pointBorderColor: '#fff',
                pointBorderWidth: 2.5,
                pointRadius: 6,
                pointHoverRadius: 8,
                pointHoverBackgroundColor: '#77BE80',
                pointHoverBorderColor: '#fff',
                pointHoverBorderWidth: 3,
                tension: 0.4,
            },
        ],
    };

    const options: ChartOptions<'line'> = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                titleColor: '#fff',
                bodyColor: '#fff',
                padding: 12,
                borderColor: '#77BE80',
                borderWidth: 1,
                displayColors: false,
                callbacks: {
                    label: function (context) {
                        return `จำนวน: ${context.parsed.y} ครั้ง`;
                    },
                },
            },
        },
        scales: {
            x: {
                grid: {
                    display: false,
                },
                ticks: {
                    color: '#64748b',
                    font: {
                        size: 11,
                        family: 'Inter, sans-serif',
                    },
                },
            },
            y: {
                beginAtZero: true,
                grid: {
                    color: '#f1f5f9',
                    lineWidth: 1,
                },
                ticks: {
                    color: '#94a3b8',
                    font: {
                        size: 12,
                        family: 'Inter, sans-serif',
                    },
                    stepSize: Math.ceil(Math.max(...data.map(d => d.count), 25) / 5),
                },
            },
        },
        animation: {
            duration: 1000,
            easing: 'easeOutCubic',
        },
        interaction: {
            intersect: false,
            mode: 'index',
        },
    };

    return (
        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200 transition-all duration-300 hover:shadow-md">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
                <p className="text-base font-bold text-slate-900">ปริมาณการขอใช้บริการรายเดือน</p>

                {}
                {onViewChange && (
                    <div className="flex bg-slate-100 rounded-lg p-1">
                        <button
                            onClick={() => onViewChange('daily')}
                            className={`px-2 sm:px-3 py-1 text-xs font-medium rounded-md transition-all ${viewMode === 'daily'
                                ? 'bg-white text-slate-900 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            รายวัน
                        </button>
                        <button
                            onClick={() => onViewChange('weekly')}
                            className={`px-2 sm:px-3 py-1 text-xs font-medium rounded-md transition-all ${viewMode === 'weekly'
                                ? 'bg-white text-slate-900 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            รายสัปดาห์
                        </button>
                        <button
                            onClick={() => onViewChange('monthly')}
                            className={`px-2 sm:px-3 py-1 text-xs font-medium rounded-md transition-all ${viewMode === 'monthly'
                                ? 'bg-white text-slate-900 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            รายเดือน
                        </button>
                    </div>
                )}
            </div>

            <div className="h-[280px] sm:h-[300px] md:h-[320px]">
                <Line ref={chartRef} data={chartData} options={options} plugins={[segmentPlugin]} />
            </div>
        </div>
    );
}
