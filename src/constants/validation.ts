/**
 * 공통 검증 메시지 및 상수
 *
 * 사용처:
 * - 근로자 마이페이지 (ProfileEdit)
 * - 고용주 마이페이지 (ProfileTab)
 * - 회원가입 페이지
 */

// ============ 공통 검증 상수 ============

export const COMMON_VALIDATION = {
  PHONE_MAX_LENGTH: 13,
  NAME_MIN_LENGTH: 2,
  PHONE_PATTERN: /^010-\d{4}-\d{4}$/,
  ACCOUNT_NUMBER_MIN_LENGTH: 10,
  ACCOUNT_NUMBER_MAX_LENGTH: 14,
} as const;

// ============ 공통 검증 메시지 ============

export const COMMON_VALIDATION_MESSAGES = {
  REQUIRED: '필수 입력 항목입니다.',
  PHONE_FORMAT: '전화번호는 010-XXXX-XXXX 형식이어야 합니다.',
  NAME_MIN_LENGTH: '이름은 2자 이상이어야 합니다.',
  ACCOUNT_NUMBER_FORMAT: '계좌번호는 10~14자리 숫자여야 합니다.',
  BANK_NAME_REQUIRED: '은행명을 선택해주세요.',
} as const;
