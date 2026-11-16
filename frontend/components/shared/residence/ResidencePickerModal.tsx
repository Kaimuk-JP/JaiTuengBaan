'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { fetchWithAuth } from '@/lib/auth';
import Swal from '@/lib/swal';
import type { ResidenceSearchResult, ResidencePickerStep } from './types';
import ResidenceResultCard from './ResidenceResultCard';
import ResidenceClaimForm from './ResidenceClaimForm';

interface ResidencePickerModalProps {
  onSelect: (residenceId: string, title: string, rawData?: any) => void;
  onClose: () => void;
  initialQuery?: string;
}

export default function ResidencePickerModal({ onSelect, onClose, initialQuery = '' }: ResidencePickerModalProps) {
  const [step, setStep] = useState<ResidencePickerStep>({ step: 'searching' });
  const [pickedLocation, setPickedLocation] = useState<{lat: number, lng: number} | null>(null);
  const [pickedAddress, setPickedAddress] = useState<any>(null);
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<ResidenceSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const searchResidences = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); setSearched(false); return; }
    setLoading(true);
    try {
      const res = await fetchWithAuth(`/residences/search?q=${encodeURIComponent(q)}&limit=20`);
      if (res.ok) {
        const data = await res.json();
        setResults(Array.isArray(data) ? data : []);
      } else {
        setResults([]);
      }
    } catch { setResults([]); }
    finally { setLoading(false); setSearched(true); }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { if (query.trim().length >= 2) searchResidences(query); }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, searchResidences]);

  const handleSelectResult = (result: ResidenceSearchResult) => {
    Swal.fire({
      title: 'เลือกบ้านนี้?',
      html: `<p class="text-sm">${result.title}</p><p class="text-xs text-gray-500 mt-1">${result.maskedAddress}</p>`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'ยืนยัน',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#1E7D55',
    }).then((r) => {
      if (r.isConfirmed) {
        onSelect(result.id, result.title);
      }
    });
  };

  const handleClaimSuccess = (claimId: number, iamClaimId: string, claimData: any) => {
    setStep({ step: 'claim-submitted', claimId, iamClaimId, claimData });
  };

  if (step.step === 'claim-submitted') {
    return (
      <div className="fixed inset-0 z-[9999] bg-white flex flex-col">
        <Header title="ยื่นคำขอสำเร็จ" onBack={onClose} />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-4">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
          </div>
          <h2 className="text-lg font-bold text-text-primary mb-2">ส่งคำขอเพิ่มบ้านเรียบร้อย!</h2>
          <p className="text-sm text-text-tertiary mb-1">เลขคำขอ: {step.iamClaimId}</p>
          <p className="text-sm text-text-tertiary mb-6">กรุณารอเจ้าหน้าที่ตรวจสอบเอกสาร</p>
          <button 
            onClick={() => {
              if (step.step === 'claim-submitted' && step.claimData) {
                const d = step.claimData;
                const parts = [
                  d.houseNo ? `บ้านเลขที่ ${d.houseNo}` : '',
                  d.moo ? `หมู่ ${d.moo}` : '',
                  d.villageName || '',
                  d.soi ? `ซอย ${d.soi}` : '',
                  d.road ? `ถนน ${d.road}` : '',
                  d.subdistrictName ? `ต.${d.subdistrictName}` : '',
                  d.districtName ? `อ.${d.districtName}` : '',
                  d.provinceName ? `จ.${d.provinceName}` : '',
                  d.postalCode || '',
                ].filter(Boolean).join(' ');
                const title = parts || 'บ้านที่รอยืนยัน';
                onSelect(`claim_${step.claimId}`, title, step.claimData);
              }
              onClose();
            }} 
            className="bg-brand-primary hover:bg-btn-hover text-white font-bold py-3 px-8 rounded-xl transition-all"
          >
            ดำเนินการต่อ
          </button>
        </div>
      </div>
    );
  }

  if (step.step === 'claim-draft') {
    return (
      <div className="fixed inset-0 z-[9999] bg-white flex flex-col">
        <Header title="แจ้งเพิ่มบ้านใหม่" onBack={() => setStep({ step: 'searching' })} />
        <div className="flex-1 overflow-y-auto">
          <ResidenceClaimForm 
            initialLat={pickedLocation?.lat}
            initialLng={pickedLocation?.lng}
            initialAddress={pickedAddress}
            onSuccess={handleClaimSuccess} 
            onCancel={() => setStep({ step: 'searching' })} 
          />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-white flex flex-col">
      <Header title="ค้นหาบ้าน" onBack={onClose} />

      <div className="px-4 pb-3 bg-white shadow-sm">
        <div className="relative flex items-center bg-gray-50 border-2 border-gray-200 focus-within:border-brand-primary rounded-xl overflow-hidden transition-all">
          <div className="pl-3 text-brand-primary">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          </div>
          <input
            type="text"
            className="w-full py-3 px-3 bg-transparent border-0 outline-none text-sm text-text-primary placeholder:text-text-placeholder"
            placeholder="พิมพ์บ้านเลขที่, ชื่อหมู่บ้าน, ถนน..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          {loading && <div className="pr-3"><div className="w-5 h-5 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" /></div>}
          
          {query && !loading && (
            <button type="button" className="p-2 text-text-placeholder hover:text-text-secondary transition-colors" onClick={() => { setQuery(''); setResults([]); setSearched(false); }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        {results.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs text-text-tertiary mb-1">พบ {results.length} รายการ</p>
            {results.map((r) => <ResidenceResultCard key={r.id} result={r} onSelect={handleSelectResult} />)}
          </div>
        ) : searched && !loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <svg className="w-16 h-16 text-text-placeholder mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
            <p className="font-semibold text-text-primary mb-1">ไม่พบบ้านที่ค้นหา</p>
            <p className="text-xs text-text-tertiary mb-4">ลองค้นหาด้วยบ้านเลขที่ หรือชื่อหมู่บ้าน</p>
            <button type="button" onClick={() => setStep({ step: 'claim-draft' })} className="bg-brand-primary hover:bg-btn-hover text-white font-semibold py-2.5 px-6 rounded-xl text-sm transition-all">
              ไม่พบบ้านของฉัน → แจ้งเพิ่มบ้านใหม่
            </button>
          </div>
        ) : !searched ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-text-tertiary">
            <svg className="w-12 h-12 mb-2 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            <p className="text-sm">พิมพ์ค้นหาบ้านเลขที่ หรือชื่อหมู่บ้าน</p>
          </div>
        ) : null}
      </div>

      {!searched && (
        <div className="px-4 py-3 border-t border-gray-100 bg-white">
          <button type="button" onClick={() => setStep({ step: 'claim-draft' })} className="w-full py-3 border-2 border-dashed border-brand-primary/30 text-brand-primary font-medium rounded-xl text-sm hover:bg-brand-primary/5 transition-all">
            + แจ้งเพิ่มบ้านใหม่
          </button>
        </div>
      )}
    </div>
  );
}

function Header({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="bg-white shadow-sm px-4 pt-4 pb-3 flex items-center gap-2">
      <button type="button" onClick={onBack} className="p-2 -ml-2 hover:bg-black/5 rounded-full transition-colors text-text-secondary">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
      </button>
      <h3 className="font-bold text-lg text-text-primary">{title}</h3>
    </div>
  );
}
