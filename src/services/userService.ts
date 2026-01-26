import api from "./api";

export interface UserInfo {
  id?: number;
  name: string;
  phone?: string;
  profileImageUrl?: string | null;
}

export interface UpdateMyInfoRequest {
  name?: string;
  phone?: string;
}

const userService = {
  // 내 정보 조회
  getMyInfo: async (): Promise<UserInfo> => {
    return await api.get("/users/me");
  },

  // 내 정보 수정
  updateMyInfo: async (data: UpdateMyInfoRequest): Promise<UserInfo> => {
    return await api.put("/users/me", data);
  },

  // 회원 탈퇴 (DELETE /api/users/me 엔드포인트가 있다고 가정)
  deleteMyAccount: async (): Promise<void> => {
    return await api.delete("/users/me");
  },
};

export default userService;
