import { pad2 } from '../utils/dateUtils';

/**
 * 캘린더 관련 공유 상수
 * AddWorkModal, WorkEditRequestBox 등 여러 컴포넌트에서 공유
 */

// ============ 시간 옵션 ============

/** 시간 선택 옵션 (00 ~ 23) */
export const HOUR_OPTIONS: string[] = Array.from({ length: 24 }, (_, i) => pad2(i));

/** 분 선택 옵션 (10분 단위) */
export const MINUTE_OPTIONS: string[] = ['00', '10', '20', '30', '40', '50'];

/** 휴게 시간 옵션 (분) */
export const BREAK_OPTIONS: number[] = [0, 30, 60, 90, 120];

// ============ 색상 관련 ============

/** 근무 라벨 색상 클래스 */
export const COLOR_CLASSES = ['red', 'yellow', 'mint', 'brown'] as const;

export type ColorClass = (typeof COLOR_CLASSES)[number];

/** 기본 색상 인덱스 (4번째 이후 계약은 모두 brown) */
export const DEFAULT_COLOR_INDEX = 3;

// ============ 시간 계산 상수 ============

/** 1시간 = 60분 */
export const MINUTES_PER_HOUR = 60;
