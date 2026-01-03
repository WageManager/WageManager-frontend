import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaCamera, FaUser } from "react-icons/fa";
import "../../styles/employerMyPage.css";
import Swal from "sweetalert2";
import userService from "../../services/userService";

export default function EmployerMyPage() {
  const [user, setUser] = useState(null);
  const [editableSections, setEditableSections] = useState({
    name: false,
    phone: false,
  });
  const [profileImage, setProfileImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const handleWithdraw = async () => {
    const result = await Swal.fire({
      icon: "warning",
      title: "회원 탈퇴 하시겠습니까?",
      text: "탈퇴 시 모든 정보가 삭제되며 복구할 수 없습니다.",
      showCancelButton: true,
      confirmButtonText: "탈퇴",
      cancelButtonText: "취소",
      confirmButtonColor: "var(--color-red)",
    });

    if (result.isConfirmed) {
      try {
        await userService.deleteMyAccount();

        Swal.fire("탈퇴 완료", "회원 탈퇴가 완료되었습니다.", "success");

        // 로그아웃 처리
        clearAuthInfo();
        navigate("/");
      } catch (error) {
        Swal.fire("탈퇴 실패", error.message || "회원 탈퇴 중 오류가 발생했습니다.", "error");
      }
    }
  };

  const handleNavClick = (path) => {
    navigate(path);
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
                <img
                  src={profileImage}
                  alt="프로필"
                  className="mypage-avatar-image"
                />
              ) : (
                <div className="mypage-avatar-placeholder">
                  <FaUser />
                </div>
              )}
              <label className="mypage-avatar-camera">
                <FaCamera />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProfileImageChange}
                />
              </label>
            </div>
            <div className="mypage-profile-name">{user.name}</div>
            <hr />
          </div>
          <ul>
            <li>
              <button
                type="button"
                className="mypage-nav-checked"
                onClick={() => handleNavClick("/employer/employer-mypage")}
              >
                내 프로필 수정
              </button>
            </li>
            <li>
              <button
                type="button"
                className="mypage-nav-li"
                onClick={() =>
                  handleNavClick("/employer/employer-mypage-receive")
                }
              >
                받은 근무 요청
              </button>
            </li>
          </ul>
        </nav>
        <div className="mypage-container">
          <h1 className="mypage-title">기본정보</h1>
          <div className="mypage-basic-info">
            <div className="mypage-name">
              <span className="mypage-label">이름</span>
              <input
                type="text"
                value={user.name || ""}
                disabled={!editableSections.name}
                onChange={(e) => handleChange("name", e.target.value)}
              />
            </div>
            <button
              className="mypage-edit-button"
              onClick={() => toggleEdit("name")}
            >
              {editableSections.name ? "완료" : "수정"}
            </button>
          </div>
          <hr />
          <div className="mypage-phone">
            <span className="mypage-label">전화번호</span>
            <input
              type="tel"
              value={user.phone || ""}
              disabled={!editableSections.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              placeholder="010-1234-5678"
            />
            <button
              className="mypage-edit-button"
              onClick={() => toggleEdit("phone")}
            >
              {editableSections.phone ? "완료" : "수정"}
            </button>
          </div>
          <div className="mypage-withdraw-section">
            <button
              className="mypage-withdraw-button"
              onClick={handleWithdraw}
            >
              회원 탈퇴 &gt;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
