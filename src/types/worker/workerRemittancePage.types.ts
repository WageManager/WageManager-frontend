// ============ Remittance 페이지 UI 전용 타입 ============

// 수당 관련 타입은 common에서 가져와 re-export
export type { Allowance, AllowanceKey, AllowanceMap } from "../common/allowance.types";

import type { AllowanceMap } from "../common/allowance.types";

/** 근무지 (Contract를 단순화한 UI용 타입) */
export interface Workplace {
  id: number;
  name: string;
}

// ============ 근무 기록 타입 ============

/** UI에서 사용하는 가공된 근무 기록 (API WorkRecordsResponse를 매핑한 결과) */
export interface RemittanceWorkRecord {
  id: number;
  /** 일(day of month) */
  date: number;
  /** 요일 ("월", "화" 등) */
  day: string;
  startTime: string;
  endTime: string;
  workplace: string;
  breakMinutes: number;
  hourlyWage: number;
  /** 기본 급여 (표시용) */
  wage: number;
  allowances: AllowanceMap;
  socialInsurance: boolean;
  withholdingTax: boolean;
}

// ============ 송금 상태 타입 ============

/** UI에서 표시하는 입금 상태 */
export type RemittanceStatus = 'completed' | 'pending' | 'before';

/** UI에서 사용하는 입금 상태 정보 */
export interface RemittanceInfo {
  status: RemittanceStatus;
  remittanceDate: string | null;
}

// ============ 정렬 타입 ============

/** 근무 내역 정렬 순서 */
export type SortOrder = 'latest' | 'oldest';
