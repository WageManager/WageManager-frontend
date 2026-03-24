import React, { useState, useEffect} from "react";
import type { FC } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { MdNotificationsNone } from "react-icons/md";
import { getNotifications, markNotificationAsRead } from "../../api/notificationApi";
import type { NotificationResponse as ApiNotificationResponse } from "../../api/notificationApi";
import { formatDateTime } from "../../utils/dateUtils";
import "../../styles/notificationDropdown.css";

interface FormattedNotification {
  id: number;
  type: string;
  title: string;
  time: string;
  icon: typeof MdNotificationsNone;
  isRead: boolean;
}

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onUnreadCountChange?: (count: number) => void;
}

interface AxiosError {
  error?: {
    message?: string;
  };
  message?: string;
}

const NotificationDropdown: FC<NotificationDropdownProps> = ({
  isOpen,
  onClose,
  onUnreadCountChange,
}) => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<FormattedNotification[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  // 알림 데이터 가져오기
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  // 읽지 않은 알림들을 읽음 처리 (병렬 실행)
  const markNotificationsAsRead = async (
    notificationsList: ApiNotificationResponse[]
  ): Promise<void> => {
    const unreadNotifications = notificationsList.filter((n) => !n.isRead);

    if (unreadNotifications.length === 0) return;

    // 모든 읽음 처리 요청을 병렬로 실행
    const results = await Promise.allSettled(
      unreadNotifications.map((notification) =>
        markNotificationAsRead(notification.id)
      )
    );

    // 성공/실패 개수 계산
    let successCount = 0;
    results.forEach((result) => {
      if (result.status === "fulfilled") {
        successCount++;
      } else {
        // 실패한 경우 에러 토스트 표시
        const errorMessage =
          (result.reason as AxiosError)?.error?.message ||
          (result.reason as AxiosError)?.message ||
          "알림 읽음 처리에 실패했습니다.";
        toast.error(errorMessage);
      }
    });

    // 성공한 개수만큼 unreadCount 업데이트
    if (successCount > 0 && onUnreadCountChange) {
      const newUnreadCount = Math.max(0, unreadCount - successCount);
      setUnreadCount(newUnreadCount);
      onUnreadCountChange(newUnreadCount);
    }
  };

  const fetchNotifications = async (): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await getNotifications({
        size: 4,
        page: 1,
      });

      if (response.success && response.data) {
        const { notifications: apiNotifications, unreadCount: apiUnreadCount } =
          response.data;

        // API 응답을 컴포넌트 형식으로 변환
        const formattedNotifications: FormattedNotification[] =
          apiNotifications.map((notification) => ({
            id: notification.id,
            type: notification.type,
            title: notification.title,
            time: formatDateTime(notification.createdAt),
            icon: MdNotificationsNone,
            isRead: notification.isRead,
          }));

        setNotifications(formattedNotifications);
        setUnreadCount(apiUnreadCount);

        // 부모 컴포넌트에 unreadCount 전달
        if (onUnreadCountChange) {
          onUnreadCountChange(apiUnreadCount);
        }

        // 읽지 않은 알림들을 읽음 처리
        await markNotificationsAsRead(apiNotifications);
      }
    } catch (error) {
      // 에러 메시지 표시
      const errorMessage =
        (error as AxiosError)?.error?.message ||
        (error as AxiosError)?.message ||
        "알림을 불러오는데 실패했습니다.";
      toast.error(errorMessage);
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewAll = (): void => {
    onClose();
    navigate("/notifications");
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="notification-overlay" onClick={onClose} />
      <div className="notification-dropdown">
        <div className="notification-header">
          <h3>전체 알림</h3>
          {unreadCount > 0 && (
            <span className="notification-unread-badge">{unreadCount}</span>
          )}
        </div>
        <div className="notification-list">
          {isLoading ? (
            <div className="notification-loading">
              <div className="notification-spinner"></div>
              <span>알림을 불러오는 중...</span>
            </div>
          ) : notifications.length === 0 ? (
            <div className="notification-empty">
              <span>알림이 없습니다.</span>
            </div>
          ) : (
            notifications.map((notification) => {
              const Icon = notification.icon;
              return (
                <div key={notification.id} className="notification-item">
                  <div className="notification-icon-wrapper">
                    <Icon className="notification-icon" />
                  </div>
                  <div className="notification-content">
                    <div className="notification-title">
                      {notification.title}
                    </div>
                    <div className="notification-time">{notification.time}</div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        <div className="notification-footer">
          <button
            className="notification-view-all-btn"
            onClick={handleViewAll}
          >
            모두 보기
          </button>
        </div>
      </div>
    </>
  );
};

export default NotificationDropdown;
