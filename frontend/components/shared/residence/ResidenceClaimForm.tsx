'use client';

import { useState } from 'react';
import { fetchWithAuth } from '@/lib/auth';
import Swal from '@/lib/swal';
import ThaiAddressAutocomplete from '@/components/shared/ThaiAddressAutocomplete';

interface ResidenceClaimFormProps {
  initialLat?: number;
  initialLng?: number;
  initialAddress?: {
    placeName?: string;
    houseNo?: string;
    road?: string;
    villageName?: string;
    neighbourhood?: string;
    subdistrictName?: string;
    districtName?: string;
    provinceName?: string;
    postalCode?: string;
  };
  onSuccess: (claimId: number, iamClaimId: string, claimData: any) => void;
  onCancel: () => void;
}

export default function ResidenceClaimForm({ initialLat, initialLng, initialAddress, onSuccess, onCancel }: ResidenceClaimFormProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    houseNo: initialAddress?.houseNo || '', 
    moo: '', 
    villageName: initialAddress?.villageName || initialAddress?.neighbourhood || '', 
    buildingName: '', floor: '', roomNo: '',
    soi: '', 
    road: initialAddress?.road || '', 
    postalCode: initialAddress?.postalCode || '',
    subdistrictName: initialAddress?.subdistrictName || '', 
    districtName: initialAddress?.districtName || '', 
    provinceName: initialAddress?.provinceName || '',
    provinceId: 0, districtId: 0, subdistrictId: 0,
    latitude: initialLat,
    longitude: initialLng,
  });
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [evidencePreview, setEvidencePreview] = useState<string | null>(null);

  const handleField = (field: string, value: any) => setForm(prev => ({ ...prev, [field]: value }));

  const handleAddressSelect = (addr: any) => {
    setForm(prev => ({
      ...prev,
      subdistrictName: addr.districtName || '',
      districtName: addr.amphoe || '',
      provinceName: addr.provinceName || '',
      postalCode: addr.zipcode || '',
      provinceId: 0, districtId: 0, subdistrictId: 0,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      Swal.fire({ icon: 'warning', title: 'ไฟล์ไม่ถูกต้อง', text: 'รองรับเฉพาะ PDF, JPEG, PNG, WEBP', confirmButtonColor: '#1E7D55' });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      Swal.fire({ icon: 'warning', title: 'ไฟล์ใหญ่เกินไป', text: 'ขนาดไฟล์ต้องไม่เกิน 10 MB', confirmButtonColor: '#1E7D55' });
      return;
    }
    setEvidenceFile(file);
    if (file.type.startsWith('image/')) {
      setEvidencePreview(URL.createObjectURL(file));
    } else {
      setEvidencePreview(null);
    }
  };

  const focusField = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => el.focus(), 300);
    }
  };

  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!form.houseNo.trim()) {
      await Swal.fire({ icon: 'warning', title: 'กรุณากรอกบ้านเลขที่', text: 'บ้านเลขที่เป็นข้อมูลที่จำเป็น', confirmButtonColor: '#1E7D55' });
      focusField('claim-houseNo');
      return;
    }
    if (!form.subdistrictName) {
      await Swal.fire({ icon: 'warning', title: 'กรุณาเลือกตำบล', text: 'พิมพ์ชื่อตำบลเพื่อค้นหา', confirmButtonColor: '#1E7D55' });
      focusField('claim-subdistrict');
      return;
    }
    if (!form.districtName) {
      await Swal.fire({ icon: 'warning', title: 'กรุณากรอกอำเภอ', confirmButtonColor: '#1E7D55' });
      focusField('claim-district');
      return;
    }
    if (!form.provinceName) {
      await Swal.fire({ icon: 'warning', title: 'กรุณากรอกจังหวัด', confirmButtonColor: '#1E7D55' });
      focusField('claim-province');
      return;
    }
    if (!evidenceFile) {
      await Swal.fire({ icon: 'warning', title: 'กรุณาแนบเอกสารทะเบียนบ้าน', text: 'รองรับไฟล์ PDF, JPEG, PNG, WEBP ไม่เกิน 10MB', confirmButtonColor: '#1E7D55' });
      focusField('evidence-input');
      return;
    }

    setLoading(true);
    try {
      const claimRes = await fetchWithAuth('/residence-claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          houseNo: form.houseNo, moo: form.moo || undefined,
          villageName: form.villageName || undefined,
          buildingName: form.buildingName || undefined,
          floor: form.floor || undefined, roomNo: form.roomNo || undefined,
          soi: form.soi || undefined, road: form.road || undefined,
          postalCode: form.postalCode || undefined,
          provinceId: form.provinceId, districtId: form.districtId, subdistrictId: form.subdistrictId,
          latitude: form.latitude, longitude: form.longitude,
          locationAccuracy: form.latitude ? 'EXACT' : undefined,
        }),
      });

      if (!claimRes.ok) {
        const err = await claimRes.json().catch(() => ({}));
        const msg = err.message || '';
        if (claimRes.status === 403 || msg.includes('No access') || msg.includes('ยังไม่เปิดให้บริการ')) {
          throw new Error('ยังไม่เปิดให้บริการเพิ่มบ้านในเทศบาลนี้ กรุณาติดต่อเจ้าหน้าที่');
        }
        throw new Error(msg || 'ไม่สามารถส่งคำขอได้');
      }

      const claim = await claimRes.json();

      const formData = new FormData();
      formData.append('file', evidenceFile);
      const uploadRes = await fetchWithAuth(`/residence-claims/${claim.id}/evidence`, {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) {
        console.warn('Evidence upload failed, but claim was created');
      }

      onSuccess(claim.id, claim.iamClaimId, form);
    } catch (err: any) {
      await Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: err.message, confirmButtonColor: '#1E7D55' });
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full p-2.5 text-sm text-text-primary bg-white border border-border-neutral rounded-xl focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition-all";
  const labelClass = "text-sm text-text-tertiary mb-1 block";

  return (
    <div className="p-4 space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>บ้านเลขที่ <span className="text-red-500">*</span></label>
          <input id="claim-houseNo" className={inputClass} value={form.houseNo} onChange={e => handleField('houseNo', e.target.value)} placeholder="เช่น 99/1" />
        </div>
        <div>
          <label className={labelClass}>หมู่</label>
          <input className={inputClass} value={form.moo} onChange={e => handleField('moo', e.target.value)} placeholder="เช่น 4" />
        </div>
      </div>

      <div>
        <label className={labelClass}>หมู่บ้าน</label>
        <input className={inputClass} value={form.villageName} onChange={e => handleField('villageName', e.target.value)} placeholder="เช่น บ้านหลักเมือง" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>ซอย</label>
          <input className={inputClass} value={form.soi} onChange={e => handleField('soi', e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>ถนน</label>
          <input className={inputClass} value={form.road} onChange={e => handleField('road', e.target.value)} />
        </div>
      </div>

      <div>
        <ThaiAddressAutocomplete
          field="subdistrictName"
          value={form.subdistrictName}
          label="ตำบล / แขวง"
          placeholder="พิมพ์ชื่อตำบล..."
          required
          isEditing={true}
          onInputChange={(v) => handleField('subdistrictName', v)}
          onAddressSelect={handleAddressSelect}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>อำเภอ / เขต</label>
          <input id="claim-district" className={inputClass} value={form.districtName} onChange={e => handleField('districtName', e.target.value)} placeholder="เช่น บางพลี" />
        </div>
        <div>
          <label className={labelClass}>จังหวัด</label>
          <input id="claim-province" className={inputClass} value={form.provinceName} onChange={e => handleField('provinceName', e.target.value)} placeholder="เช่น สมุทรปราการ" />
        </div>
      </div>

      <div className="max-w-[150px]">
        <label className={labelClass}>รหัสไปรษณีย์</label>
        <input className={inputClass} value={form.postalCode} onChange={e => handleField('postalCode', e.target.value)} placeholder="เช่น 10540" />
      </div>

      <div>
        <label className={labelClass}>แนบเอกสารทะเบียนบ้าน <span className="text-red-500">*</span></label>
        <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-brand-primary transition-colors cursor-pointer" onClick={() => document.getElementById('evidence-input')?.click()}>
          <input id="evidence-input" type="file" accept=".pdf,image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileChange} />
          {evidencePreview ? (
            <img src={evidencePreview} alt="Preview" className="max-h-40 mx-auto rounded-lg" />
          ) : evidenceFile ? (
            <div className="flex items-center justify-center gap-2 text-brand-primary">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              <span className="text-sm font-medium">{evidenceFile.name}</span>
            </div>
          ) : (
            <>
              <svg className="w-10 h-10 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
              <p className="text-sm text-text-tertiary">กดเพื่อเลือกไฟล์</p>
              <p className="text-xs text-text-placeholder mt-1">PDF, JPEG, PNG, WEBP (ไม่เกิน 10MB)</p>
            </>
          )}
        </div>
      </div>

      <div className="flex gap-3 pt-2 pb-6">
        <button type="button" onClick={onCancel} className="flex-1 py-3 px-4 rounded-xl border border-border-neutral text-text-primary hover:bg-slate-50 transition-all text-sm">ยกเลิก</button>
        <button type="button" onClick={handleSubmit} disabled={loading} className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${!loading ? 'bg-brand-primary hover:bg-btn-hover text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
          {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
          {loading ? 'กำลังส่ง...' : 'ยื่นคำขอเพิ่มบ้าน'}
        </button>
      </div>
    </div>
  );
}
