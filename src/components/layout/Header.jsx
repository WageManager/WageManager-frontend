import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { MdNotificationsNone } from "react-icons/md";
import NotificationDropdown from "./NotificationDropdown.jsx";
import { getUserProfile } from "../../api/workerApi";
import { logout } from "../../api/authApi";
import "../../styles/header.css";
import logoImage from "../../image/logo.png";

export default function Header() {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const notificationButtonRef = useRef(null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // 사용자 정보 State
  const [userInfo, setUserInfo] = useState(null);
  const userName = userInfo?.name;
  const userType = userInfo?.userType;

  // 컴포넌트 마운트 시 사용자 정보 호출
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      getUserProfile()
        .then((data) => {
          setUserInfo(data);
        })
        .catch((error) => {
          if (error.response?.status !== 401 && error.response?.status < 500) {
            toast.error(error.response?.data?.message || '오류가 발생했습니다.');
          }
        });
    }
  }, []);

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
      await logout();
      localStorage.removeItem('token');
      setUserInfo(null);
      toast.success('로그아웃이 완료되었습니다.');
      navigate('/');
    } catch (error) {
      if (error.response?.status !== 401 && error.response?.status < 500) {
        toast.error(error.response.data.message);
      }
      localStorage.removeItem('token');
      setUserInfo(null);
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
