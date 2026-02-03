// ============ 수당 관련 공통 타입 ============
// Worker/Employer 모두에서 사용하는 수당 타입 정의

/** 개별 수당 정보 */
export interface Allowance {
  enabled: boolean;
  rate: number;
}

/** 수당 종류 키 */
export type AllowanceKey = "overtime" | "night" | "holiday";

/** 근무 기록의 수당 정보 */
export type AllowanceMap = Record<AllowanceKey, Allowance>;
