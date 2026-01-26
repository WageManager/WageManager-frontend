// ============ 정정 요청 관련 타입 ============

/** 정정 요청 타입 */
export type CorrectionRequestType = 'CREATE' | 'UPDATE' | 'DELETE';

/** 근무 기록 정정 요청 생성 payload(/api/worker/correction-requests) */
export interface CreateCorrectionRequestPayload {
  type: CorrectionRequestType;
  workRecordId: number;
  contractId: number;
  requestedWorkDate: string;
  /** 시작 시간 (HH:mm:ss 형식) */
  requestedStartTime: string;
  /** 종료 시간 (HH:mm:ss 형식) */
  requestedEndTime: string;
  requestedBreakMinutes?: number;
  requestedMemo?: string;
}