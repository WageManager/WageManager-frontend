import {wageManagerApi} from './axios';
import type { KakaoRegisterParams, ApiResponse, AuthSuccessData } from '../types/auth';

// 카카오 액세스 토큰으로 로그인
export const kakaoLoginWithToken = async (kakaoAccessToken: string) => {
  const { data } = await wageManagerApi.post<ApiResponse<AuthSuccessData>>(
    '/api/auth/kakao/login', 
    { kakaoAccessToken }
  );
  return data;
};

// 카카오 액세스 토큰으로 회원가입
export const kakaoRegister = async (params: KakaoRegisterParams) => {
  const { data } = await wageManagerApi.post<ApiResponse<AuthSuccessData>>(
    '/api/auth/kakao/register',
    params
  );
  return data;
};

// 개발자용 임시 로그인
export const devLogin = async (
  userId: number,
  name: string,
  userType: string
) => {
  const { data } = await wageManagerApi.post<ApiResponse<AuthSuccessData>>(
    '/api/auth/dev/login',
    { userId, name, userType }
  );
  return data;
};

// 로그아웃
export const logout = async () => {
  const { data } = await wageManagerApi.post<ApiResponse<void>>('/api/auth/logout', {});
  return data;
};

// 회원 탈퇴
export const deleteMyAccount = async () => {
  const { data } = await wageManagerApi.delete('/api/auth/withdraw');
  return data;
};