'use client';

import { useRef } from 'react';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    ChartOptions,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import type { ColoredChartDataPoint } from '@/types/common';

ChartJS.register(ArcElement, Tooltip, Legend);

interface PatientTypeChartProps {
    data: ColoredChartDataPoint[];
}

export default function PatientTypeChart({ data }: PatientTypeChartProps) {
    const chartRef = useRef<ChartJS<'doughnut'>>(null);

    const total = data.reduce((sum, item) => sum + item.count, 0);

    const percentagePlugin = {
        id: 'percentageLabels',
        afterDatasetsDraw(chart: any) {
            const { ctx } = chart;
            const meta = chart.getDatasetMeta(0);
            const chartTotal = chart.data.datasets[0].data.reduce((a: number, b: number) => a + b, 0);

            meta.data.forEach((arc: any, index: number) => {
                const value = chart.data.datasets[0].data[index];
                const percentage = Math.round((value / chartTotal) * 100);

                const angle = (arc.startAngle + arc.endAngle) / 2;
                const radius = (arc.innerRadius + arc.outerRadius) / 2;
                const x = arc.x + Math.cos(angle) * radius;
                const y = arc.y + Math.sin(angle) * radius;

                if (percentage > 5) {
                    ctx.save();
                    ctx.font = 'bold 14px Inter, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = '#fff';
                    ctx.fillText(`${percentage}%`, x, y);
                    ctx.restore();
                }
            });
        }
    };

    const mappedData = data.map(item => ({
        ...item,
        label: item.type
    }));

    const chartData = {
        labels: mappedData.map(d => d.label),
        datasets: [
            {
                data: mappedData.map(d => d.count),
                backgroundColor: mappedData.map(d => d.color),
                borderColor: '#fff',
                borderWidth: 3,
                hoverOffset: 6,
            },
        ],
    };

    const options: ChartOptions<'doughnut'> = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                titleColor: '#fff',
                bodyColor: '#fff',
                padding: 12,
                borderColor: '#86C232',
                borderWidth: 2,
                displayColors: true,
                callbacks: {
                    label: function (context) {
                        const value = context.parsed || 0;
                        const chartTotal = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                        const percentage = Math.round((value / chartTotal) * 100);
                        return `${value} คน (${percentage}%)`;
                    },
                },
            },
        },
        animation: {
            animateRotate: true,
            animateScale: true,
            duration: 1000,
            easing: 'easeOutCubic',
        },
        cutout: '55%',
    };

    return (
        <div className="h-full">
            { }
            <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-2 sm:mb-3">
                ประเภทของประชาชนที่จอง
            </h3>

            { }
            <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl p-4 sm:p-5 shadow-lg border border-slate-200/60 transition-all duration-300 hover:shadow-xl">
                <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6 h-full">
                    { }
                    <div className="relative flex-shrink-0 mx-auto md:mx-0" style={{ width: '160px', height: '160px' }}>
                        <Doughnut ref={chartRef} data={chartData} options={options} plugins={[percentagePlugin]} />
                    </div>

                    { }
                    <div className="flex-1 min-w-0">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-200">
                                    <th className="text-left py-2 sm:py-3 text-sm sm:text-base font-semibold text-slate-600">ประเภทผู้ป่วย</th>
                                    <th className="text-right py-2 sm:py-3 text-sm sm:text-base font-semibold text-slate-600">จำนวน</th>
                                </tr>
                            </thead>
                            <tbody>
                                {mappedData.length > 0 ? mappedData.map((item, index) => (
                                    <tr key={index} className="border-b border-slate-100 last:border-0">
                                        <td className="py-2 sm:py-4">
                                            <div className="flex items-center gap-2 sm:gap-3">
                                                <div
                                                    className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0"
                                                    style={{ backgroundColor: item.color }}
                                                />
                                                <span className="text-sm sm:text-base text-slate-700">{item.label}</span>
                                            </div>
                                        </td>
                                        <td className="py-2 sm:py-4 text-right">
                                            <span className="text-lg sm:text-xl font-semibold text-slate-900">{item.count}</span>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={2} className="py-4 text-center text-sm text-slate-400">
                                            ยังไม่มีข้อมูล
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
