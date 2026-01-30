/**
 * WorkerMyPage 관련 타입 정의
 *
 * 설계 원칙:
 * - API Response 타입을 Single Source of Truth로 사용
 * - UI 전용 타입(탭, 섹션 등)만 별도 정의
 * - Props 타입은 API 타입을 조합하여 정의
 */

import type { UserResponse, WorkerResponse } from '../../api/userApiResponse.type';
import type {
  ContractDetailResponse,
  CorrectionRequestResponse,
  CorrectionRequestType,
  CorrectionRequester,
  CorrectionStatus,
} from '../../api/workerApiResponse.type';

// ============ API 타입 Re-export ============
// 마이페이지에서 사용하는 API 타입들을 한 곳에서 import할 수 있도록 re-export

export type { UserResponse, WorkerResponse };
export type {
  ContractDetailResponse,
  CorrectionRequestResponse,
  CorrectionRequestType,
  CorrectionRequester,
  CorrectionStatus,
};

// ============ UI 전용 타입 ============

/** 마이페이지 활성 탭 */
export type ActiveTab = 'profile' | 'workplace' | 'editRequest';

/** 프로필 편집 섹션 */
export type EditSection = 'basic' | 'phone' | 'account';

/**
 * 편집 요청 상태 (소문자 - UI 표시용)
 * API의 CorrectionStatus를 UI 표시용으로 변환한 타입
 */
export type EditRequestStatus = Lowercase<CorrectionStatus>;

// ============ UI용 가공 데이터 타입 ============

/**
 * 근무지 표시용 타입 (ContractDetailResponse에서 필요한 필드만 추출)
 * - 현재 근무지: endDate 없음
 * - 이전 근무지: endDate 있음
 */
export type WorkplaceDisplay = Pick<ContractDetailResponse, 'workplaceName' | 'hourlyWage'> & {
  startDate: string; // formatDateToKorean으로 가공된 날짜
  endDate?: string;  // 이전 근무지인 경우에만 존재
};

/**
 * 정정 요청 표시용 타입 (CorrectionRequestResponse를 UI용으로 가공)
 */
export interface EditRequestDisplay {
  place: string;      // workplaceName
  date: string;       // formatDateToMonthDay로 가공된 날짜
  startTime: string;  // formatTime으로 가공된 시간
  endTime: string;    // formatTime으로 가공된 시간
  status: EditRequestStatus;
}

// ============ 검증 관련 타입 ============

/** 필드 검증 결과 */
export interface ValidationResult {
  isValid: boolean;
  message: string;
}

// ============ 컴포넌트 Props 타입 ============

export interface ProfileBoxProps {
  user: UserResponse;
  worker: WorkerResponse | null;
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
}

export interface ProfileEditProps {
  user: UserResponse;
  worker: WorkerResponse | null;
  onUserUpdate: (section: EditSection, data: Record<string, string>) => Promise<void>;
}

export interface WorkplaceManageProps {
  workplaces: WorkplaceDisplay[];
  previousWorkplaces: WorkplaceDisplay[];
  isLoading: boolean;
}

export interface WorkEditRequestListProps {
  requests: EditRequestDisplay[];
  isLoading: boolean;
}
