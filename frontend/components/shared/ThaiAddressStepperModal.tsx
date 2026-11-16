'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';

let searchAddressByProvince: any = null;

if (typeof window !== 'undefined') {
    try {
        const thaiAddr = require('thai-address-database');
        searchAddressByProvince = thaiAddr.searchAddressByProvince;
    } catch (e) {
        console.warn('thai-address-database not available');
    }
}

export interface ThaiAddress {
    districtName: string;
    amphoe: string;
    provinceName: string;
    zipcode: string;
}

interface ThaiAddressStepperModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddressSelect: (address: ThaiAddress) => void;
    initialAddress?: Partial<ThaiAddress>;
}

const PROVINCES = [
    "กระบี่", "กรุงเทพมหานคร", "กาญจนบุรี", "กาฬสินธุ์", "กำแพงเพชร", "ขอนแก่น", "จันทบุรี", "ฉะเชิงเทรา", "ชลบุรี", "ชัยนาท", "ชัยภูมิ", "ชุมพร", "เชียงราย", "เชียงใหม่", "ตรัง", "ตราด", "ตาก", "นครนายก", "นครปฐม", "นครพนม", "นครราชสีมา", "นครศรีธรรมราช", "นครสวรรค์", "นนทบุรี", "นราธิวาส", "น่าน", "บึงกาฬ", "บุรีรัมย์", "ปทุมธานี", "ประจวบคีรีขันธ์", "ปราจีนบุรี", "ปัตตานี", "พระนครศรีอยุธยา", "พะเยา", "พังงา", "พัทลุง", "พิจิตร", "พิษณุโลก", "เพชรบุรี", "เพชรบูรณ์", "แพร่", "ภูเก็ต", "มหาสารคาม", "มุกดาหาร", "แม่ฮ่องสอน", "ยโสธร", "ยะลา", "ร้อยเอ็ด", "ระนอง", "ระยอง", "ราชบุรี", "ลพบุรี", "ลำปาง", "ลำพูน", "เลย", "ศรีสะเกษ", "สกลนคร", "สงขลา", "สตูล", "สมุทรปราการ", "สมุทรสงคราม", "สมุทรสาคร", "สระแก้ว", "สระบุรี", "สิงห์บุรี", "สุโขทัย", "สุพรรณบุรี", "สุราษฎร์ธานี", "สุรินทร์", "หนองคาย", "หนองบัวลำภู", "อ่างทอง", "อำนาจเจริญ", "อุดรธานี", "อุตรดิตถ์", "อุทัยธานี", "อุบลราชธานี"
];

export default function ThaiAddressStepperModal({ isOpen, onClose, onAddressSelect, initialAddress }: ThaiAddressStepperModalProps) {
    const [step, setStep] = useState<'provinceName' | 'AMPHOE' | 'districtName' | 'ZIPCODE'>('provinceName');
    const [searchQuery, setSearchQuery] = useState('');

    const [selectedProvince, setSelectedProvince] = useState(initialAddress?.provinceName || '');
    const [selectedAmphoe, setSelectedAmphoe] = useState(initialAddress?.amphoe || '');
    const [selectedDistrict, setSelectedDistrict] = useState(initialAddress?.districtName || '');
    const [selectedZipcode, setSelectedZipcode] = useState(initialAddress?.zipcode || '');

    const [allDataForProvince, setAllDataForProvince] = useState<ThaiAddress[]>([]);

    useBodyScrollLock(isOpen);

    useEffect(() => {
        if (isOpen) {
            setSearchQuery('');
            if (!selectedProvince) {
                setStep('provinceName');
            } else {
                fetchDataForProvince(selectedProvince);
            }
        }
    }, [isOpen]);

    const fetchDataForProvince = (prov: string) => {
        if (searchAddressByProvince) {
            const results = searchAddressByProvince(prov, 10000);
            const mappedResults = (results || []).map((r: any) => ({
                provinceName: r.province,
                amphoe: r.amphoe,
                districtName: r.district,
                zipcode: r.zipcode
            }));
            setAllDataForProvince(mappedResults);
        }
    };

    const handleSelectProvince = (prov: string) => {
        setSelectedProvince(prov);
        setSelectedAmphoe('');
        setSelectedDistrict('');
        setSelectedZipcode('');
        setSearchQuery('');
        fetchDataForProvince(prov);
        setStep('AMPHOE');
    };

    const handleSelectAmphoe = (amp: string) => {
        setSelectedAmphoe(amp);
        setSelectedDistrict('');
        setSelectedZipcode('');
        setSearchQuery('');
        setStep('districtName');
    };

    const handleSelectDistrict = (dist: string) => {
        setSelectedDistrict(dist);
        setSelectedZipcode('');
        setSearchQuery('');
        setStep('ZIPCODE');
    };

    const handleSelectZipcode = (zip: string) => {
        setSelectedZipcode(zip);
        onAddressSelect({
            provinceName: selectedProvince,
            amphoe: selectedAmphoe,
            districtName: selectedDistrict,
            zipcode: zip
        });
        onClose();
    };

    const listItems = useMemo(() => {
        let items: string[] = [];
        if (step === 'provinceName') {
            items = PROVINCES.filter(p => !searchQuery || p.includes(searchQuery));
        } else if (step === 'AMPHOE') {
            const amphoes = Array.from(new Set(allDataForProvince.filter(d => d.provinceName === selectedProvince).map(d => d.amphoe)));
            items = amphoes.filter(a => !searchQuery || a.includes(searchQuery));
        } else if (step === 'districtName') {
            const districts = Array.from(new Set(allDataForProvince.filter(d => d.provinceName === selectedProvince && d.amphoe === selectedAmphoe).map(d => d.districtName)));
            items = districts.filter(d => !searchQuery || d.includes(searchQuery));
        } else if (step === 'ZIPCODE') {
            const zipcodes = Array.from(new Set(allDataForProvince.filter(d => d.provinceName === selectedProvince && d.amphoe === selectedAmphoe && d.districtName === selectedDistrict).map(d => d.zipcode)));
            items = zipcodes.filter(z => !searchQuery || z.includes(searchQuery));
        }
        return items.sort((a,b) => a.localeCompare(b, 'th'));
    }, [step, searchQuery, selectedProvince, selectedAmphoe, selectedDistrict, allDataForProvince]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 overflow-hidden">
            <div className="bg-white w-full max-w-lg h-[90vh] md:h-[600px] rounded-t-2xl md:rounded-2xl shadow-xl flex flex-col absolute bottom-0 md:relative">
                {}
                <div className="flex items-center gap-3 p-4 border-b border-gray-100">
                    <button onClick={onClose} className="p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-full">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                    <div className="flex-1 relative">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                        </svg>
                        <input
                            type="text"
                            placeholder={`ค้นหา ${step === 'provinceName' ? 'จังหวัด' : step === 'AMPHOE' ? 'เขต/อำเภอ' : step === 'districtName' ? 'แขวง/ตำบล' : 'รหัสไปรษณีย์'}`}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-gray-50 border-none rounded-lg py-2 pl-9 pr-4 text-sm focus:ring-0 focus:outline-none"
                        />
                    </div>
                </div>

                {}
                <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-xs text-gray-400 font-medium tracking-wide border px-2 py-0.5 rounded-full bg-white">เลือกที่อยู่</span>
                        <button onClick={() => {
                            setStep('provinceName');
                            setSelectedProvince('');
                            setSelectedAmphoe('');
                            setSelectedDistrict('');
                            setSelectedZipcode('');
                        }} className="text-xs text-brand-primary hover:text-brand-primary/80 font-medium transition-colors">
                            ล้าง
                        </button>
                    </div>

                    <div className="relative pl-3 space-y-4 before:absolute before:inset-y-2 before:left-[15px] before:w-px before:bg-gray-200">
                        {selectedProvince && (
                            <div className="relative flex items-center cursor-pointer group" onClick={() => setStep('provinceName')}>
                                <div className={`absolute -left-[14.5px] w-[9px] h-[9px] rounded-full border-2 bg-white flex items-center justify-center transition-colors ${step === 'provinceName' ? 'border-brand-primary' : 'border-gray-300 group-hover:border-gray-400'}`}>
                                    {step === 'provinceName' && <div className="w-1 h-1 bg-brand-primary rounded-full"></div>}
                                </div>
                                <span className={`text-sm ml-2 font-medium transition-colors ${step === 'provinceName' ? 'text-brand-primary' : 'text-gray-700 group-hover:text-gray-900'}`}>{selectedProvince}</span>
                            </div>
                        )}
                        {(selectedProvince || step === 'provinceName') && !selectedProvince && (
                            <div className="relative flex items-center">
                                <div className="absolute -left-[14.5px] w-[9px] h-[9px] rounded-full border-2 border-brand-primary bg-white flex items-center justify-center">
                                    <div className="w-1 h-1 bg-brand-primary rounded-full"></div>
                                </div>
                                <span className="text-sm ml-2 font-medium text-brand-primary">เลือก จังหวัด</span>
                            </div>
                        )}

                        {selectedProvince && selectedAmphoe && (
                            <div className="relative flex items-center cursor-pointer group" onClick={() => setStep('AMPHOE')}>
                                <div className={`absolute -left-[14.5px] w-[9px] h-[9px] rounded-full border-2 bg-white flex items-center justify-center transition-colors ${step === 'AMPHOE' ? 'border-brand-primary' : 'border-gray-300 group-hover:border-gray-400'}`}>
                                    {step === 'AMPHOE' && <div className="w-1 h-1 bg-brand-primary rounded-full"></div>}
                                </div>
                                <span className={`text-sm ml-2 font-medium transition-colors ${step === 'AMPHOE' ? 'text-brand-primary' : 'text-gray-700 group-hover:text-gray-900'}`}>{selectedAmphoe}</span>
                            </div>
                        )}
                        {selectedProvince && !selectedAmphoe && (
                            <div className="relative flex items-center">
                                <div className="absolute -left-[14.5px] w-[9px] h-[9px] rounded-full border-2 border-brand-primary bg-white flex items-center justify-center">
                                    <div className="w-1 h-1 bg-brand-primary rounded-full"></div>
                                </div>
                                <span className="text-sm ml-2 font-medium text-brand-primary">เลือก เขต/อำเภอ</span>
                            </div>
                        )}

                        {selectedAmphoe && selectedDistrict && (
                            <div className="relative flex items-center cursor-pointer group" onClick={() => setStep('districtName')}>
                                <div className={`absolute -left-[14.5px] w-[9px] h-[9px] rounded-full border-2 bg-white flex items-center justify-center transition-colors ${step === 'districtName' ? 'border-brand-primary' : 'border-gray-300 group-hover:border-gray-400'}`}>
                                    {step === 'districtName' && <div className="w-1 h-1 bg-brand-primary rounded-full"></div>}
                                </div>
                                <span className={`text-sm ml-2 font-medium transition-colors ${step === 'districtName' ? 'text-brand-primary' : 'text-gray-700 group-hover:text-gray-900'}`}>{selectedDistrict}</span>
                            </div>
                        )}
                        {selectedAmphoe && !selectedDistrict && (
                            <div className="relative flex items-center">
                                <div className="absolute -left-[14.5px] w-[9px] h-[9px] rounded-full border-2 border-brand-primary bg-white flex items-center justify-center">
                                    <div className="w-1 h-1 bg-brand-primary rounded-full"></div>
                                </div>
                                <span className="text-sm ml-2 font-medium text-brand-primary">เลือก แขวง/ตำบล</span>
                            </div>
                        )}

                        {selectedDistrict && !selectedZipcode && (
                             <div className="relative flex items-center">
                                 <div className="absolute -left-[14.5px] w-[9px] h-[9px] rounded-full border-2 border-brand-primary bg-white flex items-center justify-center">
                                     <div className="w-1 h-1 bg-brand-primary rounded-full"></div>
                                 </div>
                                 <span className="text-sm ml-2 font-medium text-brand-primary">เลือก รหัสไปรษณีย์</span>
                             </div>
                        )}
                    </div>
                </div>

                {}
                <div className="bg-gray-100 px-4 py-2 text-xs text-gray-500 font-medium">
                    {step === 'provinceName' ? 'จังหวัด' : step === 'AMPHOE' ? 'เขต/อำเภอ' : step === 'districtName' ? 'แขวง/ตำบล' : 'รหัสไปรษณีย์'}
                </div>
                <div className="flex-1 overflow-y-auto">
                    {listItems.length === 0 ? (
                        <div className="p-8 text-center text-gray-400 text-sm">
                            ไม่พบข้อมูล
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {listItems.map((item, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => {
                                        if (step === 'provinceName') handleSelectProvince(item);
                                        else if (step === 'AMPHOE') handleSelectAmphoe(item);
                                        else if (step === 'districtName') handleSelectDistrict(item);
                                        else if (step === 'ZIPCODE') handleSelectZipcode(item);
                                    }}
                                    className="w-full px-6 py-4 text-left text-sm text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                                >
                                    {item}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
