import wageManagerApi from './axios';

/**
 * 알림 목록 조회
 * @param {Object} params - 쿼리 파라미터
 * @param {number} params.size - 페이지 크기 (기본값: 4)
 * @param {number} params.page - 페이지 번호 (기본값: 1)
 * @returns {Promise<Object>} 알림 목록 응답
 */

interface NotificationParams {
  size?: number;
  page?: number;
}

export const getNotifications = async ({ size = 4, page = 1 }: NotificationParams = {}) => {
  const { data } = await wageManagerApi.get(`/api/notifications`, {
    params: { size, page }
  });
  return data;
};

/**
 * 알림 읽음 처리
 * @param {number} id - 알림 ID
 * @returns {Promise<Object>} 읽음 처리 응답
 */
export const markNotificationAsRead = async (id: number) => {
  const { data } = await wageManagerApi.put(`/api/notifications/${id}/read`);
  return data;
};

/**
 * 전체 알림 읽음 처리
 * @returns {Promise<Object>} 읽음 처리 응답
 */
export const markAllNotificationsAsRead = async () => {
  const { data } = await wageManagerApi.put('/api/notifications/read-all');
  return data;
};

/**
 * 알림 삭제
 * @param {number} id - 알림 ID
 * @returns {Promise<Object>} 삭제 응답
 */
export const deleteNotification = async (id: number) => {
  const { data } = await wageManagerApi.delete(`/api/notifications/${id}`);
  return data;
};
