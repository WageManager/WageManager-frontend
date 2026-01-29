import { wageManagerApi } from "./axios";
import type { UpdateMyInfoRequest } from "./commonApiResponse.type";

// 내 정보 조회
export const getMyInfo = async () => {
  const { data } = await wageManagerApi.get("/api/users/me");
  return data;
};

// 내 정보 수정
export const updateMyInfo = async (reqData: UpdateMyInfoRequest) => {
  const { data } = await wageManagerApi.put("/api/users/me", reqData);
  return data;
};

// 회원 탈퇴
export const deleteMyAccount = async () => {
  const { data } = await wageManagerApi.delete("/api/users/me");
  return data;
};
