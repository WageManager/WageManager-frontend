import type { AllowanceMap, AllowanceKey } from "../types/common/allowance.types";

/** 추가 수당 유형 목록 (연장/야간/휴일) */
export const extraPayTypes = [
  { key: "overtime", label: "연장수당" },
  { key: "night", label: "야간수당" },
  { key: "holiday", label: "휴일수당" },
] as const;

/**
 * 수당 기본값 설정
 * - 새로운 수당 추가 시 이 파일만 수정하면 됨 (OCP)
 * - enabled: 수당 적용 여부
 * - rate: 수당 배율 (예: 1.5 = 150%)
 */
export const DEFAULT_ALLOWANCES: AllowanceMap = {
  overtime: { enabled: false, rate: 0 },
  night: { enabled: false, rate: 0 },
  holiday: { enabled: false, rate: 0 },
} as const;

/**
 * 기본 수당 설정의 복사본 생성 (불변성 유지)
 * - 각 근무 기록에 새 allowances 객체를 할당할 때 사용
 */
export const createDefaultAllowances = (): AllowanceMap => ({
  overtime: { ...DEFAULT_ALLOWANCES.overtime },
  night: { ...DEFAULT_ALLOWANCES.night },
  holiday: { ...DEFAULT_ALLOWANCES.holiday },
});
