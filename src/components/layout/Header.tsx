import React, { useState, useRef, useEffect } from "react";
import type { FC } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { MdNotificationsNone } from "react-icons/md";
import NotificationDropdown from "./NotificationDropdown.tsx";
import { getUserProfile } from "../../api/workerApi";
import { logout } from "../../api/authApi";
import "../../styles/header.css";
import logoImage from "../../image/logo.png";

interface UserInfo {
  name?: string;
  userName?: string;
  userType?: "EMPLOYER" | "WORKER";
}

interface AxiosError {
  response?: {
    status?: number;
    data?: {
      message?: string;
    };
  };
}

const Header: FC = () => {
  const [isNotificationOpen, setIsNotificationOpen] = useState<boolean>(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const notificationButtonRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // 사용자 정보 State
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const userName = userInfo?.name || userInfo?.userName;
  const userType = userInfo?.userType;

  // 컴포넌트 마운트 시 사용자 정보 호출
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      getUserProfile()
        .then((response) => {
          setUserInfo(response.data);
        })
        .catch((error: AxiosError) => {
          if (
            error.response?.status !== 401 &&
            error.response?.status !== undefined &&
            error.response.status < 500
          ) {
            toast.error(error.response?.data?.message || "오류가 발생했습니다.");
          }
        });
    }
  }, []);

  const toggleNotification = (): void => {
    setIsNotificationOpen((prev) => !prev);
  };

  const closeNotification = (): void => {
    setIsNotificationOpen(false);
  };

  const handleLogoClick = (): void => {
    if (userType === "EMPLOYER") {
      navigate("/employer/daily-calendar");
    } else {
      navigate("/worker/monthly-calendar");
    }
  };

  const handleUnreadCountChange = (count: number): void => {
    setUnreadCount(count);
  };

  const handleLogout = async (): Promise<void> => {
    try {
      await logout();
      localStorage.removeItem("token");
      setUserInfo(null);
      toast.success("로그아웃이 완료되었습니다.");
      navigate("/");
    } catch (error) {
      const axiosError = error as AxiosError;
      if (
        axiosError.response?.status !== 401 &&
        axiosError.response?.status !== undefined &&
        axiosError.response.status < 500
      ) {
        toast.error(
          axiosError.response?.data?.message ||
            "로그아웃 처리 중 오류가 발생했습니다."
        );
      }
      localStorage.removeItem("token");
      setUserInfo(null);
      navigate("/");
    }
  };

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      const target = event.target as Node;
      if (
        notificationButtonRef.current &&
        !notificationButtonRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
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
        style={{ cursor: "pointer" }}
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
              <span className="header-notification-badge">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
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
        <span>{userName || "사용자"} 님</span>
        <button
          onClick={handleLogout}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "inherit",
            textDecoration: "underline",
          }}
        >
          로그아웃
        </button>
      </div>
    </header>
  );
};

export default Header;
