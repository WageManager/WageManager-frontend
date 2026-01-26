/** [PUT] /api/users/me 요청 데이터 */
export interface UserUpdateRequest {
  name?: string;
  phone?: string;
  profileImageUrl?: string;
}

/** [PUT] /api/users/me/account 요청 데이터 (근로자 전용) */
export interface WorkerUpdateRequest {
  accountNumber: string;
  bankName: string;
}
