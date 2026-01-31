/**
 * 근로자 마이페이지 전용 상수
 *
 * 공통 상수 사용:
 * - 검증: constants/validation.ts
 * - 은행: constants/bank.ts
 * - 상태: constants/status.ts
 */

import type { ActiveTab } from '../types/worker/workerMypage.types';

// ============ 탭 레이블 ============

export const TAB_LABELS: Record<ActiveTab, string> = {
  profile: '내 프로필 수정',
  workplace: '근무지 관리',
  editRequest: '보낸 근무 요청',
};
