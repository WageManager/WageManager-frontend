import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { MdNotificationsNone } from "react-icons/md";
import NotificationDropdown from "./NotificationDropdown.jsx";
import { logout } from "../../api/authApi";
import { getUserInfo, clearAuthInfo } from "../../utils/auth";
import "../../styles/header.css";
import logoImage from "../../image/logo.png";

export default function Header() {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const notificationButtonRef = useRef(null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // 사용자 정보 가져오기
  const userInfo = getUserInfo();
  const userName = userInfo?.name;
  const userType = userInfo?.userType;

  const toggleNotification = () => {
    setIsNotificationOpen((prev) => !prev);
  };

  const closeNotification = () => {
    setIsNotificationOpen(false);
  };

  const handleLogoClick = () => {
    if (userType === 'EMPLOYER') {
      navigate('/employer/daily-calendar');
    } else {
      navigate('/worker/monthly-calendar');
    }
  };

  const handleUnreadCountChange = (count) => {
    setUnreadCount(count);
  };

  const handleLogout = async () => {
    try {
      // wageManagerApi를 사용하므로 토큰을 인자로 넘길 필요 없음 (인터셉터 처리)
      await logout();

      // 성공 시 처리
      clearAuthInfo();

      toast.success('로그아웃이 완료되었습니다.');
      navigate('/');
    } catch (error) {
      // 5xx 에러는 axios.ts에서 이미 처리됨
      // 4xx 에러 또는 기타 에러에 대해서만 처리

      // 에러 발생시에도 사용자 경험을 위해 로컬 로그아웃 처리는 진행
      clearAuthInfo();

      // 4xx 에러인 경우 메시지 표시 (5xx는 axios.ts가 처리했으므로 중복 방지)
      if (error.response && error.response.status < 500) {
        const errorMessage = error.response?.data?.error?.message || '로그아웃 처리 중 오류가 발생했습니다.';
        const errorCode = error.response?.data?.error?.code || 'UNKNOWN';
        toast.error(`[${errorCode}] ${errorMessage}`);
      }

      navigate('/');
    }
  };

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationButtonRef.current &&
        !notificationButtonRef.current.contains(event.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        closeNotification();
      }
    };

    if (isNotificationOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isNotificationOpen]);

  return (
    <header className="header-bar">
      <img
        src={logoImage}
        alt="월급 관리소"
        className="header-logo"
        onClick={handleLogoClick}
        style={{ cursor: 'pointer' }}
      />
      <div className="header-right">
        <div className="header-notification-wrapper" ref={notificationButtonRef}>
          <button
            className="header-icon"
            aria-label="알림"
            onClick={toggleNotification}
          >
            <MdNotificationsNone />
            {unreadCount > 0 && (
              <span className="header-notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
            )}
          </button>
          {isNotificationOpen && (
            <div ref={dropdownRef}>
              <NotificationDropdown
                isOpen={isNotificationOpen}
                onClose={closeNotification}
                onUnreadCountChange={handleUnreadCountChange}
              />
            </div>
          )}
        </div>
        <span>{userName || '사용자'} 님</span>
        <button
          onClick={handleLogout}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'inherit',
            textDecoration: 'underline'
          }}
        >
          로그아웃
        </button>
      </div>
    </header>
  );
}
