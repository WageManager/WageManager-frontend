import { useEffect, useState } from "react";
import type { ChangeEvent, JSX } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaCamera, FaUser } from "react-icons/fa";
import Swal from "sweetalert2";
import "../../styles/employerMyPage.css";
import "../../styles/employerMyPageReceive.css";
import { getMyInfo } from "../../api/commonApi";
import ProfileTab from "../../components/employer/EmployerMyPage/ProfileTab";
import ReceivedRequestsTab from "../../components/employer/EmployerMyPage/ReceivedRequestsTab";

interface User {
  id?: number;
  name: string;
  phone?: string;
  profileImageUrl?: string | null;
}

type TabType = "profile" | "requests";

export default function EmployerMyPage(): JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();

  // URL 경로에 따라 탭 결정
  const currentTab: TabType = location.pathname.includes("employer-mypage-receive")
    ? "requests"
    : "profile";

  const [user, setUser] = useState<User | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      try {
        const response = await getMyInfo();
        if (!response.success || !response.data) {
          Swal.fire("오류", "사용자 정보를 불러오는데 실패했습니다.", "error");
          return;
        }
        const userData: User = response.data;
        setUser(userData);
        setProfileImage(userData.profileImageUrl ?? null);
      } catch (error) {
        const message = error instanceof Error ? error.message : "사용자 정보를 불러오는데 실패했습니다.";
        Swal.fire("오류", message, "error");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleTabClick = (tab: TabType): void => {
    if (tab === "profile") {
      navigate("/employer/employer-mypage");
    } else {
      navigate("/employer/employer-mypage-receive");
    }
  };

  const handleProfileImageChange = async (e: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0];
    if (!file) return;

    Swal.fire("알림", "프로필 이미지 수정 기능은 준비 중입니다.", "info");
    e.target.value = "";
  };

  const handleUserUpdate = (updatedUser: User): void => {
    setUser(updatedUser);
  };

  if (loading) {
    return (
      <div className="mypage-main">
        <div className="mypage-content">
          <div>로딩 중...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mypage-main">
        <div className="mypage-content">
          <div>사용자 정보를 불러올 수 없습니다.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="mypage-main">
      <div className="mypage-content">
        <nav className="mypage-nav">
          <div className="mypage-profile-card">
            <div className="mypage-avatar-wrapper">
              {profileImage ? (
                <img src={profileImage} alt="프로필" className="mypage-avatar-image" />
              ) : (
                <div className="mypage-avatar-placeholder">
                  <FaUser />
                </div>
              )}
              <label className="mypage-avatar-camera">
                <FaCamera />
                <input type="file" accept="image/*" onChange={handleProfileImageChange} />
              </label>
            </div>
            <div className="mypage-profile-name">{user.name}</div>
            <hr />
          </div>
          <ul>
            <li>
              <button
                type="button"
                className={currentTab === "profile" ? "mypage-nav-checked" : "mypage-nav-li"}
                onClick={() => handleTabClick("profile")}
              >
                내 프로필 수정
              </button>
            </li>
            <li>
              <button
                type="button"
                className={currentTab === "requests" ? "mypage-nav-checked" : "mypage-nav-li"}
                onClick={() => handleTabClick("requests")}
              >
                받은 근무 요청
              </button>
            </li>
          </ul>
        </nav>

        {currentTab === "profile" && (
          <ProfileTab user={user} onUserUpdate={handleUserUpdate} />
        )}

        {currentTab === "requests" && <ReceivedRequestsTab />}
      </div>
    </div>
  );
}
