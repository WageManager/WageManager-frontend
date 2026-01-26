import wageManagerApi from './axios';
import type { ApiResponse } from './workerApiResponse.type';
import type { UserUpdateRequest, WorkerUpdateRequest } from './userApiRequest.type';
import type { UserResponse, WorkerResponse } from './userApiResponse.type';

// 타입 re-export (다른 파일에서 import할 수 있도록)
export type {
  UserUpdateRequest,
  WorkerUpdateRequest,
} from './userApiRequest.type';

export type {
  UserType,
  UserResponse,
  WorkerResponse,
} from './userApiResponse.type';

// ============ API 함수 ============

// 사용자 프로필 조회
export const getUserProfile = async (): Promise<ApiResponse<UserResponse>> => {
  const { data } = await wageManagerApi.get('/api/users/me');
  return data;
};

// 사용자 프로필 수정
export const updateUserProfile = async (userData: UserUpdateRequest): Promise<ApiResponse<UserResponse>> => {
  const { data } = await wageManagerApi.put('/api/users/me', userData);
  return data;
};

// 계좌 정보 수정 (근로자 전용)
export const updateAccountInfo = async (accountData: WorkerUpdateRequest): Promise<ApiResponse<WorkerResponse>> => {
  const { data } = await wageManagerApi.put('/api/users/me/account', accountData);
  return data;
};
