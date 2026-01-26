// ============ 사용자 관련 타입 ============

/** 사용자 유형 */
export type UserType = 'WORKER' | 'EMPLOYER';

/** [GET/PUT] /api/users/me 응답 데이터 */
export interface UserResponse {
  id: number;
  kakaoId: string;
  name: string;
  phone: string;
  userType: UserType;
  profileImageUrl?: string;
}

// ============ 근로자 정보 관련 타입 ============

/** [GET] /api/workers/user/{userId}, [PUT] /api/users/me/account 응답 데이터 */
export interface WorkerResponse {
  id: number;
  userId: number;
  name: string;
  phone: string;
  workerCode: string;
  accountNumber: string;
  bankName: string;
}
