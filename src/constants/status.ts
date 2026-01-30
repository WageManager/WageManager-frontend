/**
 * 공통 상태 레이블 상수
 *
 * 사용처:
 * - 근로자 마이페이지 (WorkEditRequestList)
 * - 고용주 페이지 (정정 요청 관리)
 */

import type { CorrectionStatus } from '../api/workerApiResponse.type';

// ============ 정정 요청 상태 레이블 ============

/** API 상태값(대문자)을 UI 레이블로 변환 */
export const CORRECTION_STATUS_LABELS: Record<CorrectionStatus, string> = {
  PENDING: '대기중',
  APPROVED: '승인됨',
  REJECTED: '거절됨',
};

/** 소문자 상태값을 UI 레이블로 변환 (기존 호환용) */
export const CORRECTION_STATUS_LABELS_LOWERCASE: Record<Lowercase<CorrectionStatus>, string> = {
  pending: '대기중',
  approved: '승인됨',
  rejected: '거절됨',
};

/**
 * 상태값을 UI 레이블로 변환하는 함수
 * 대소문자 구분 없이 사용 가능
 */
export const getCorrectionStatusLabel = (status: string): string => {
  const upperStatus = status.toUpperCase() as CorrectionStatus;
  return CORRECTION_STATUS_LABELS[upperStatus] ?? '알 수 없음';
};
