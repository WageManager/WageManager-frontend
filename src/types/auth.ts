/* 인증 관련 타입 정의 */

// 유저 타입 (고용주/근로자)
export type UserType = 'EMPLOYER' | 'WORKER';

// API 응답 공통 인터페이스 (추후 수정 필요)
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

// 로그인 성공 시 응답 데이터
export interface AuthSuccessData {
  accessToken: string;
  userType: UserType;
}

// 카카오 로그인/회원가입 요청 시 필요한 파라미터 박스
export interface KakaoRegisterParams {
  kakaoAccessToken: string;
  userType: UserType;
  phone: string;
  bankName?: string;
  accountNumber?: string;
  profileImageUrl?: string;
}