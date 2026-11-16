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
import type { ColoredChartDataPoint } from '@/types/common';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

interface EquipmentDemandChartProps {
    data: ColoredChartDataPoint[];
}

export default function EquipmentDemandChart({ data }: EquipmentDemandChartProps) {
    const chartRef = useRef<ChartJS<'bar'>>(null);

    const gradientColors = [
        '#4A6B1F',
        '#5B7F24',
        '#7A9E3D',
        '#A4C266',
        '#C4D89C',
    ];

    const sortedData = [...data].sort((a, b) => b.count - a.count);

    const chartData = {
        labels: sortedData.map(d => d.name),
        datasets: [
            {
                label: 'เปอร์เซ็นต์',
                data: sortedData.map(d => d.count),
                backgroundColor: sortedData.map((_, index) => gradientColors[index % gradientColors.length]),
                borderColor: sortedData.map((_, index) => gradientColors[index % gradientColors.length]),
                borderWidth: 0,
                borderRadius: 6,
                barThickness: 20,
            },
        ],
    };

    const options: ChartOptions<'bar'> = {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                enabled: true,
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                titleColor: '#fff',
                bodyColor: '#fff',
                padding: 12,
                borderColor: '#7A9E3D',
                borderWidth: 2,
                displayColors: false,
                callbacks: {
                    label: function (context) {
                        const rawData = sortedData[context.dataIndex];
                        const value = context.parsed.x ?? 0;
                        const countText = rawData.rawCount !== undefined ? ` (${rawData.rawCount} ครั้ง)` : '';
                        return `ความต้องการ: ${value}%${countText}`;
                    },
                },
            },
        },
        scales: {
            x: {
                beginAtZero: true,
                max: 100,
                grid: {
                    color: 'rgba(203, 213, 225, 0.5)',
                    lineWidth: 1,
                },
                border: {
                    display: false,
                },
                ticks: {
                    color: '#64748B',
                    font: {
                        size: 11,
                        family: 'Inter, sans-serif',
                    },
                    stepSize: 50,
                    callback: function (value) {
                        return value + '%';
                    },
                },
            },
            y: {
                grid: {
                    display: false,
                },
                border: {
                    display: false,
                },
                ticks: {
                    color: '#1E293B',
                    font: {
                        size: 12,
                        family: 'Inter, sans-serif',
                    },
                    padding: 8,
                },
            },
        },
        animation: {
            duration: 1000,
            easing: 'easeOutQuart',
        },
        layout: {
            padding: {
                left: 0,
                right: 16,
                top: 0,
                bottom: 0,
            }
        }
    };

    return (
        <div className="h-full">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-2 sm:mb-3">
                ปริมาณความต้องการ อุปกรณ์เสริม
            </h3>

            <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl p-4 sm:p-5 shadow-lg border border-slate-200/60 transition-all duration-300 hover:shadow-xl">
                {sortedData.length > 0 ? (
                    <div className="h-[240px] sm:h-[260px] md:h-[270px]">
                        <Bar ref={chartRef} data={chartData} options={options} />
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-[200px] sm:h-[240px]">
                        <p className="text-slate-500 text-sm text-center">ยังไม่มีข้อมูลอุปกรณ์</p>
                    </div>
                )}
            </div>
        </div>
    );
}
