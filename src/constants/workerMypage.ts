import type { ActiveTab, EditRequestStatus } from '../types/worker/mypage.types';

// ============ 검증 상수 ============

export const VALIDATION = {
  PHONE_MAX_LENGTH: 13,
  NAME_MIN_LENGTH: 2,
  PHONE_PATTERN: /^010-\d{4}-\d{4}$/,
  ACCOUNT_NUMBER_MIN_LENGTH: 10,
  ACCOUNT_NUMBER_MAX_LENGTH: 14,
} as const;

// ============ 탭 레이블 ============

export const TAB_LABELS: Record<ActiveTab, string> = {
  profile: '내 프로필 수정',
  workplace: '근무지 관리',
  editRequest: '보낸 근무 요청',
};

// ============ 상태 레이블 ============

export const STATUS_LABELS: Record<EditRequestStatus, string> = {
  pending: '대기중',
  approved: '승인됨',
  rejected: '거절됨',
};

// ============ 검증 메시지 ============

export const VALIDATION_MESSAGES = {
  REQUIRED: '필수 입력 항목입니다.',
  PHONE_FORMAT: '전화번호는 010-XXXX-XXXX 형식이어야 합니다.',
  NAME_MIN_LENGTH: '이름은 2자 이상이어야 합니다.',
  ACCOUNT_NUMBER_FORMAT: '계좌번호는 10~14자리 숫자여야 합니다.',
  BANK_NAME_REQUIRED: '은행명을 선택해주세요.',
} as const;

// ============ 은행 목록 ============

export const BANK_LIST = [
  '국민은행',
  '신한은행',
  '우리은행',
  '하나은행',
  'SC제일은행',
  '씨티은행',
  '케이뱅크',
  '카카오뱅크',
  '토스뱅크',
  '농협은행',
  '기업은행',
  '새마을금고',
  '신협',
  '우체국',
  '수협은행',
  '대구은행',
  '부산은행',
  '경남은행',
  '광주은행',
  '전북은행',
  '제주은행',
] as const;

export type BankName = (typeof BANK_LIST)[number];
