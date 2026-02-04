import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { MdNotificationsNone } from "react-icons/md";
import { getNotifications, markAllNotificationsAsRead, deleteNotification } from "../api/notificationApi";
import { formatDateTime } from "../utils/dateUtils";
import "../styles/notificationPage.css";
import LoadingDots from "../components/common/LoadingDots";


export default function NotificationPage() {
  const PAGE_SIZE = 20;
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMoreLoading, setIsMoreLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchNotifications(1);
  }, []);

  const fetchNotifications = async (pageNum) => {
    if (pageNum === 1) {
      setIsLoading(true);
    } else {
      setIsMoreLoading(true);
    }

    try {
      const response = await getNotifications({ size: PAGE_SIZE, page: pageNum });

      if (response.success && response.data) {
        const { notifications: apiNotifications } = response.data;

        // API 응답을 컴포넌트 형식으로 변환
        const formattedNotifications = apiNotifications.map((notification) => ({
          id: notification.id,
          type: notification.type,
          title: notification.title,
          time: formatDateTime(notification.createdAt),
          icon: MdNotificationsNone,
        }));

        if (pageNum === 1) {
          setNotifications(formattedNotifications);
          // 첫 페이지 로드 시에만 전체 읽음 처리
          await markAllAsRead();
        } else {
          setNotifications((prev) => {
            // 중복 제거 후 추가
            const existingIds = new Set(prev.map((n) => n.id));
            const newNotifications = formattedNotifications.filter(
              (n) => !existingIds.has(n.id)
            );
            return [...prev, ...newNotifications];
          });
        }

        // 더 불러올 데이터가 있는지 확인 (가져온 데이터가 요청한 사이즈보다 적으면 끝)
        setHasMore(apiNotifications.length === PAGE_SIZE);
        setPage(pageNum);
      }
    } catch (error) {
      const errorMessage =
        error.error?.message || error.message || "알림을 불러오는데 실패했습니다.";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
      setIsMoreLoading(false);
    }
  };

  const handleLoadMore = () => {
    if (!isMoreLoading && hasMore) {
      fetchNotifications(page + 1);
    }
  };

  const markAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
    } catch (error) {
      const errorMessage = error.error?.message || error.message || "알림 읽음 처리에 실패했습니다.";
      toast.error(errorMessage);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteNotification(id);
      toast.success("알림이 삭제되었습니다.");
      // 삭제된 알림을 목록에서 제거
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (error) {
      const errorMessage = error.error?.message || error.message || "알림 삭제에 실패했습니다.";
      toast.error(errorMessage);
    }
  };

  return (
    <div className="notification-page">
      <div className="notification-page-container">
        <h1 className="notification-page-title">전체 알림</h1>
        <div className="notification-page-list">
          {isLoading ? (
            <div className="notification-page-loading">
              <LoadingDots />
            </div>
          ) : notifications.length === 0 ? (
            <div className="notification-page-empty">
              <span>알림이 없습니다.</span>
            </div>
          ) : (
            <>
              {notifications.map((notification) => {
                const Icon = notification.icon;
                return (
                  <div key={notification.id} className="notification-page-item">
                    <div className="notification-page-icon-wrapper">
                      <Icon className="notification-page-icon" />
                    </div>
                    <div className="notification-page-content">
                      <div className="notification-page-title-text">
                        {notification.title}
                      </div>
                      <div className="notification-page-bottom">
                        <span className="notification-page-time">
                          {notification.time}
                        </span>
                        <span
                          className="notification-page-delete"
                          onClick={() => handleDelete(notification.id)}
                        >
                          삭제하기
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {hasMore && (
                <button
                  className="notification-load-more"
                  onClick={handleLoadMore}
                  disabled={isMoreLoading}
                >
                  {isMoreLoading ? "불러오는 중..." : "더 보기"}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
