export interface ResidenceSearchResult {
  id: string;
  residenceCode: string;
  title: string;
  maskedAddress: string;
  latitude: number;
  longitude: number;
  locationAccuracy: string;
  municipality: {
    id: string;
    name: string;
  };
}

export type ResidencePickerStep =
  | { step: 'searching' }
  | { step: 'selected'; residenceId: string; title: string }
  | { step: 'claim-draft' }
  | { step: 'claim-uploading'; claimId: number; iamClaimId: string }
  | { step: 'claim-submitted'; claimId: number; iamClaimId: string; claimData?: any };

export interface ResidenceClaimPayload {
  houseNo: string;
  moo?: string;
  villageName?: string;
  buildingName?: string;
  floor?: string;
  roomNo?: string;
  soi?: string;
  road?: string;
  postalCode?: string;
  provinceId: number;
  districtId: number;
  subdistrictId: number;
  latitude?: number;
  longitude?: number;
  locationAccuracy?: string;
}

export interface ResidenceClaimRecord {
  id: number;
  iamClaimId: string;
  houseNo: string;
  villageName?: string;
  statusSnapshot: ResidenceClaimStatus;
  selectedResidenceId?: string;
  reviewNote?: string;
  createdAt: string;
}

export type ResidenceClaimStatus =
  | 'SUBMITTED'
  | 'DUPLICATE_CANDIDATE'
  | 'NEEDS_REVIEW'
  | 'APPROVED'
  | 'MERGED'
  | 'REJECTED';

export const CLAIM_STATUS_MAP: Record<
  ResidenceClaimStatus,
  { label: string; color: string; bgColor: string }
> = {
  SUBMITTED: { label: 'รอเจ้าหน้าที่ตรวจสอบ', color: '#D97706', bgColor: '#FFFBEB' },
  DUPLICATE_CANDIDATE: { label: 'พบข้อมูลใกล้เคียง รอตรวจสอบ', color: '#EA580C', bgColor: '#FFF7ED' },
  NEEDS_REVIEW: { label: 'ต้องตรวจสอบเพิ่มเติม', color: '#2563EB', bgColor: '#EFF6FF' },
  APPROVED: { label: 'อนุมัติแล้ว', color: '#16A34A', bgColor: '#F0FDF4' },
  MERGED: { label: 'รวมกับบ้านที่มีอยู่แล้ว', color: '#16A34A', bgColor: '#F0FDF4' },
  REJECTED: { label: 'ไม่อนุมัติ', color: '#DC2626', bgColor: '#FEF2F2' },
};
