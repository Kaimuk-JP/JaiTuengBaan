
const THAI_MONTHS = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

function formatThaiMonth(month: string) {
    const [y, m] = month.split('-');
    return `${THAI_MONTHS[parseInt(m) - 1]} ${parseInt(y) + 543}`;
}

function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });
}

interface JobDetail {
    id: number;
    completedAt: string;
    patientName: string;
    hospitalName: string;
    distanceKm: number;
    bookingTime: string;
    vehicleName: string;
    cost: number;
}

interface Volunteer {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
    completedJobs: number;
    totalDistance: number;
    disbursement: number;
    jobs: JobDetail[];
}

interface ReportData {
    summary: {
        month: string;
        totalCompletedJobs: number;
        totalDriverJobs: number;
        totalCareUJobs: number;
        totalDistance: number;
        costPerCase: number;
        totalDisbursement: number;
        organizationName: string;
    };
    volunteers: Volunteer[];
}

export async function exportToExcel(data: ReportData, month: string) {
    const XLSX = await import('xlsx');

    const wb = XLSX.utils.book_new();
    const thaiMonth = formatThaiMonth(month);
    const printDate = new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });

    const summaryData = [
        ['รายงานการเบิกจ่ายกองทุน'],
        [`หน่วยงาน: ${data.summary.organizationName}`],
        [`ประจำเดือน: ${thaiMonth}`],
        [`วันที่พิมพ์: ${printDate}`],
        [],
        ['รายการ', 'จำนวน'],
        ['เคสเสร็จสิ้นทั้งหมด', data.summary.totalCompletedJobs],
        ['เคสเจ้าหน้าที่รถ', data.summary.totalDriverJobs],
        ['เคส CareU', data.summary.totalCareUJobs],
        ['ระยะทางรวม (กม.)', data.summary.totalDistance],
    ];
    const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
    ws1['!cols'] = [{ wch: 30 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, ws1, 'สรุปยอด');

    const vltHeader = ['ลำดับ', 'ชื่อ-สกุล', 'บทบาท', 'จำนวนเคส', 'ระยะทาง (กม.)'];
    const vltRows = data.volunteers.map((v, i) => [
        i + 1,
        `${v.firstName} ${v.lastName}`,
        v.role === 'DRIVE' ? 'เจ้าหน้าที่รถ' : 'CareU',
        v.completedJobs,
        Math.round(v.totalDistance * 100) / 100,
    ]);
    vltRows.push([]);
    vltRows.push(['', 'รวมทั้งหมด', '', data.summary.totalCompletedJobs, data.summary.totalDistance]);

    const ws2 = XLSX.utils.aoa_to_sheet([
        [`รายงานการทำงาน — ${thaiMonth}`],
        [`${data.summary.organizationName}`],
        [],
        vltHeader,
        ...vltRows,
    ]);
    ws2['!cols'] = [{ wch: 8 }, { wch: 25 }, { wch: 12 }, { wch: 12 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, ws2, 'รายละเอียดจิตอาสา');

    const jobHeader = ['ลำดับ', 'ชื่อจิตอาสา', 'บทบาท', 'วันที่เสร็จสิ้น', 'ผู้ใช้บริการ', 'โรงพยาบาล', 'ช่วงเวลา', 'ระยะทาง (กม.)'];
    const jobRows: any[] = [];
    let jobIdx = 0;
    data.volunteers.forEach(v => {
        v.jobs.forEach(j => {
            jobIdx++;
            jobRows.push([
                jobIdx,
                `${v.firstName} ${v.lastName}`,
                v.role === 'DRIVE' ? 'เจ้าหน้าที่รถ' : 'CareU',
                j.completedAt ? formatDate(j.completedAt) : '-',
                j.patientName,
                j.hospitalName,
                j.bookingTime,
                j.distanceKm,
            ]);
        });
    });

    const ws3 = XLSX.utils.aoa_to_sheet([
        [`รายเคสทั้งหมด — ${thaiMonth}`],
        [`${data.summary.organizationName}`],
        [],
        jobHeader,
        ...jobRows,
    ]);
    ws3['!cols'] = [{ wch: 8 }, { wch: 22 }, { wch: 10 }, { wch: 16 }, { wch: 20 }, { wch: 22 }, { wch: 18 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(wb, ws3, 'รายเคส');

    const fileName = `รายงานการทำงาน_${month}.xlsx`;
    XLSX.writeFile(wb, fileName);
}

