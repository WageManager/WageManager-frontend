// ============ 계약 관련 타입 ============

export interface Contract {
  id: number;
  workerName: string;
  workerCode: string;
  workerPhone: string;
  hourlyWage: number;
  contractStartDate: string;
  contractEndDate: string;
  isActive: boolean;
  // UI에서 사용하는 속성 추가 (API 응답에는 없지만, 로직에서 참조하는 경우를 대비해 optional로 추가하거나, API 응답이 확실하다면 제외해야 함)
  workplaceName?: string;
}

// ============ 정정 요청 관련 타입 ============

/** 정정 요청 상태 */
export type CorrectionStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

/**getWorkRecords(/api/worker/work-records) */
export interface WorkRecordsResponse {
  id: number;
  contractId: number;
  workerCode: string;
  workplaceName: string;
  workDate: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  totalWorkMinutes: number;
  status: string;
  isModified: boolean;
  memo?: string;
}
