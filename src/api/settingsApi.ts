import { wageManagerApi } from './axios';

// ============ 알림 설정 타입 ============

export interface NotificationSettings {
  id: number;
  userId: number;
  notificationEnabled: boolean;
  pushEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  scheduleChangeAlertEnabled: boolean;
  paymentAlertEnabled: boolean;
  correctionRequestAlertEnabled: boolean;
  invitationAlertEnabled: boolean;
  resignationAlertEnabled: boolean;
}

export interface NotificationSettingsUpdateRequest {
  notificationEnabled?: boolean;
  pushEnabled?: boolean;
  emailEnabled?: boolean;
  smsEnabled?: boolean;
  scheduleChangeAlertEnabled?: boolean;
  paymentAlertEnabled?: boolean;
  correctionRequestAlertEnabled?: boolean;
  invitationAlertEnabled?: boolean;
  resignationAlertEnabled?: boolean;
}

// ============ API 함수 ============

// 내 알림 설정 조회
export const getNotificationSettings = async () => {
  const { data } = await wageManagerApi.get('/api/settings/me');
  return data;
};

// 내 알림 설정 수정
export const updateNotificationSettings = async (reqData: NotificationSettingsUpdateRequest) => {
  const { data } = await wageManagerApi.put('/api/settings/me', reqData);
  return data;
};
