/**
 * WorkerMonthlyCalendarPage 및 관련 컴포넌트에서 공유하는 타입 정의
 */

// ============ 근무 기록 관련 ============

/** 근무 기록 상태 */
export type WorkRecordStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'DELETED';

/** 근무 기록 */
export interface WorkRecord {
  id: number;
  contractId: number;
  start: string;
  end: string;
  wage: number;
  place: string;
  breakMinutes: number;
  totalWorkMinutes: number;
  status: WorkRecordStatus;
  isModified: boolean;
}

/** 날짜별 근무 기록 맵 */
export type WorkRecordsByDate = Record<string, WorkRecord[]>;

/** 날짜별 메모 맵 */
export type MemosByDate = Record<string, string>;

// ============ 계약/근무지 관련 ============

/** 계약별 색상 인덱스 맵 */
export type ContractColorMap = Record<number, number>;

/** 근무지(계약) 옵션 */
export interface WorkplaceOption {
  id: number;
  workerName: string;
  workplaceName: string;
}

// ============ 폼 관련 ============

/** 근무 정정 요청 폼의 원본 데이터 */
export interface EditFormOriginalData {
  place: string;
  wage: number | string;
  date: string;
  startHour: string;
  startMinute: string;
  endHour: string;
  endMinute: string;
  breakMinutes: number;
}

/** 근무 정정 요청 폼 */
export interface EditForm {
  recordId: number;
  contractId: number;
  originalDateKey: string;
  place: string;
  wage: number | string;
  date: string;
  startHour: string;
  startMinute: string;
  endHour: string;
  endMinute: string;
  breakMinutes: number;
  originalData?: EditFormOriginalData;
}

/** 근무 추가 폼 */
export interface AddWorkForm {
  contractId: number | null;
  date: string;
  startHour: string;
  startMinute: string;
  endHour: string;
  endMinute: string;
  breakMinutes: number;
}

// ============ 급여 관련 ============

/** 급여 정보 */
export interface Salary {
  id: number;
  contractId: number;
  year: number;
  month: number;
  netPay: number;
}