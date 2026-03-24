import { wageManagerApi } from './axios';

// ============ 공지 타입 ============

export type NoticeCategory = "HANDOVER" | "URGENT" | "SCHEDULE" | "ETC";

export interface CreateNoticeRequest {
  category: NoticeCategory;
  title: string;
  content: string;
  expiresAt: string;
}

export interface UpdateNoticeRequest {
  category?: NoticeCategory;
  title?: string;
  content?: string;
  expiresAt: string;
}

export interface NoticeListResponse {
  id: number;
  category: NoticeCategory;
  title: string;
  authorName: string;
  createdAt: string;
}

export interface NoticeDetailResponse {
  id: number;
  workplaceId: number;
  workplaceName: string;
  authorId: number;
  authorName: string;
  category: NoticeCategory;
  title: string;
  content: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

// ============ API 함수 ============

// 사업장별 공지사항 목록 조회
export const getNotices = async (workplaceId: number) => {
  const { data } = await wageManagerApi.get(`/api/workplaces/${workplaceId}/notices`);
  return data;
};

// 공지사항 상세 조회
export const getNotice = async (noticeId: number) => {
  const { data } = await wageManagerApi.get(`/api/notices/${noticeId}`);
  return data;
};

// 공지사항 생성
export const createNotice = async (workplaceId: number, reqData: CreateNoticeRequest) => {
  const { data } = await wageManagerApi.post(`/api/workplaces/${workplaceId}/notices`, reqData);
  return data;
};

// 공지사항 수정
export const updateNotice = async (noticeId: number, reqData: UpdateNoticeRequest) => {
  const { data } = await wageManagerApi.patch(`/api/notices/${noticeId}`, reqData);
  return data;
};

// 공지사항 삭제
export const deleteNotice = async (noticeId: number) => {
  const { data } = await wageManagerApi.delete(`/api/notices/${noticeId}`);
  return data;
};
