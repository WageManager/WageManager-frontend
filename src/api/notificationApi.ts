import {wageManagerApi} from './axios';

// ============ 알림 타입 ============

export type NotificationType =
  | "SCHEDULE_CREATED"
  | "SCHEDULE_CHANGE"
  | "SCHEDULE_DELETED"
  | "UNREAD_CORRECTION_REQUEST"
  | "CORRECTION_RESPONSE"
  | "INVITATION"
  | "RESIGNATION"
  | "PAYMENT_SUCCESS"
  | "WORK_RECORD_CONFIRMATION"
  | "NOTICE_CREATED";

export type ActionType =
  | "VIEW_WORK_RECORD"
  | "VIEW_CORRECTION_REQUEST"
  | "VIEW_PENDING_APPROVAL"
  | "VIEW_SALARY"
  | "VIEW_PAYMENT_MANAGEMENT"
  | "VIEW_WORKPLACE_INVITATION"
  | "VIEW_NOTICE"
  | "NONE";

export interface NotificationListParams {
  is_read?: boolean;
  page?: number;
  size?: number;
}

export interface NotificationPagedResponse {
  notifications: NotificationResponse[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  unreadCount: number;
}

export interface NotificationResponse {
  id: number;
  type: NotificationType;
  actionType: ActionType;
  actionData: string | null;
  title: string;
  message?: string;
  isRead: boolean;
  createdAt: string;
  readAt: string | null;
}

export interface UnreadCountResponse {
  count: number;
}

// ============ API 함수 ============

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error: { code: string; message: string } | null;
}

/** 알림 목록 조회 (페이지네이션) */
export const getNotifications = async (params?: NotificationListParams) => {
  const { data } = await wageManagerApi.get<ApiResponse<NotificationPagedResponse>>('/api/notifications', { params });
  return data;
};

/** 읽지 않은 알림 개수 조회 */
export const getUnreadCount = async () => {
  const { data } = await wageManagerApi.get<ApiResponse<UnreadCountResponse>>('/api/notifications/unread-count');
  return data;
};

/** 알림 읽음 처리 */
export const markNotificationAsRead = async (id: number) => {
  const { data } = await wageManagerApi.put<ApiResponse<null>>(`/api/notifications/${id}/read`);
  return data;
};

/** 전체 알림 읽음 처리 */
export const markAllNotificationsAsRead = async () => {
  const { data } = await wageManagerApi.put<ApiResponse<null>>('/api/notifications/read-all');
  return data;
};

/** 알림 삭제 */
export const deleteNotification = async (id: number) => {
  const { data } = await wageManagerApi.delete<ApiResponse<null>>(`/api/notifications/${id}`);
  return data;
};
