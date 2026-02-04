/* 인증 관련 타입 정의 */

// 유저 타입 (고용주/근로자)
export type UserType = 'EMPLOYER' | 'WORKER';

// 인증 상태 (Protected Route용)
export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  userType: UserType | null;
}

// API 응답 공통 인터페이스
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
  userId: number;
  name: string;
  userType: UserType;
}

// 카카오 로그인/회원가입 요청 시 필요한 파라미터

// 공통으로 사용하는 필드들
interface BaseRegisterParams {
  kakaoAccessToken: string;
  phone: string;
  profileImageUrl?: string;
}

// 근로자일 때의 타입 (은행 정보 필수)
interface WorkerRegisterParams extends BaseRegisterParams {
  userType: 'WORKER';
  bankName: string;
  accountNumber: string;
}

// 고용주일 때의 타입 (은행 정보 없음)
interface EmployerRegisterParams extends BaseRegisterParams {
  userType: 'EMPLOYER';
  bankName?: never;
  accountNumber?: never;
}

// 최종 유니온 타입
export type KakaoRegisterParams = WorkerRegisterParams | EmployerRegisterParams;