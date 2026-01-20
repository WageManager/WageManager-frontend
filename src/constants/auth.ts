// 인증 관련 상수 정의

export const AUTH_CONSTANTS = {
  MIN_NAME_LENGTH: 2,
  MAX_NAME_LENGTH: 20,
  PHONE_MAX_LENGTH: 13,
  KAKAO: {
    AUTHORIZE_URL: "https://kauth.kakao.com/oauth/authorize",
    TOKEN_URL: "https://kauth.kakao.com/oauth/token",
  },
} as const;

export const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
} as const;