// ============ 공통 타입 ============

/** 시간 객체 (백엔드 LocalTime 형식) */
export interface TimeObject {
  hour: number;
  minute: number;
  second: number;
  nano: number;
}

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

// ============ 사용자 프로필 관련 타입 ============

/** 사용자 프로필 수정 요청 */
export interface UpdateUserProfileRequest {
  name?: string;
  phone?: string;
}

// ============ 정정 요청 관련 타입 ============

/** 정정 요청 타입 */
export type CorrectionRequestType = 'CREATE' | 'UPDATE' | 'DELETE';

/** 정정 요청 상태 */
export type CorrectionStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

/** 근무 기록 정정 요청 생성 payload */
export interface CreateCorrectionRequestPayload {
  type: CorrectionRequestType;
  workRecordId: number;
  contractId: number;
  requestedWorkDate: string;
  requestedStartTime: TimeObject;
  requestedEndTime: TimeObject;
  requestedBreakMinutes?: number;
  requestedMemo?: string;
}
