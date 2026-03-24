// ============ 정정 요청 관련 타입 ============

/** 정정 요청 타입 */
export type CorrectionRequestType = 'CREATE' | 'UPDATE' | 'DELETE';

/** 정정요청 Request (CREATE - 근무 추가 요청) */
export interface CreateCorrectionRequest {
  type: "CREATE";
  contractId: number;
  requestedWorkDate: string;
  requestedStartTime: string;
  requestedEndTime: string;
  requestedBreakMinutes?: number;
  requestedMemo?: string;
}

/** 정정요청 Request (UPDATE - 근무 수정 요청) */
export interface UpdateCorrectionRequest {
  type: "UPDATE";
  workRecordId: number;
  requestedWorkDate: string;
  requestedStartTime: string;
  requestedEndTime: string;
  requestedBreakMinutes?: number;
  requestedMemo?: string;
}

/** 정정요청 Request (DELETE - 근무 삭제 요청) */
export interface DeleteCorrectionRequest {
  type: "DELETE";
  workRecordId: number;
  requestedWorkDate: string;
  requestedStartTime: string;
  requestedEndTime: string;
}

export type CorrectionRequestPayload = CreateCorrectionRequest | UpdateCorrectionRequest | DeleteCorrectionRequest;
