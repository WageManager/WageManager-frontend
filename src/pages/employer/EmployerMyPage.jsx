import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaCamera, FaUser } from "react-icons/fa";
import "../../styles/employerMyPage.css";
import Swal from "sweetalert2";
import userService from "../../services/userService";
import { logout } from "../../api/authApi";

export default function EmployerMyPage() {
  const [user, setUser] = useState(null);
  const [editableSections, setEditableSections] = useState({
    name: false,
    phone: false,
  });
  const [profileImage, setProfileImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // 사용자 정보 로드
  useEffect(() => {
    const fetchData = async () => {
      try {
        const userData = await userService.getMyInfo();
        setUser(userData);
        setProfileImage(userData.profileImageUrl);
      } catch (error) {
        Swal.fire("오류", "사용자 정보를 불러오는데 실패했습니다.", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 입력 필드 변경 핸들러
  const handleChange = (field, value) => {
    setUser(prev => ({ ...prev, [field]: value }));
  };

  // 수정 모드 토글
  const toggleEdit = (field) => {
    setEditableSections(prev => ({ ...prev, [field]: !prev[field] }));
    
    // 완료 버튼 클릭 시 저장
    if (editableSections[field]) {
      handleSave(field);
    }
  };

  const handleSave = async (field) => {
    try {
      await userService.updateMyInfo({ [field]: user[field] });
      Swal.fire("완료", `${field === 'name' ? '이름' : '전화번호'}이 수정되었습니다.`, "success");
    } catch (error) {
      Swal.fire("수정 실패", error.message || "정보 수정 중 오류가 발생했습니다.", "error");
    }
  };

  // 프로필 이미지 변경 핸들러
  const handleProfileImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await userService.updateProfileImage(file);
      const userData = await userService.getMyInfo();
      setProfileImage(userData.profileImageUrl);
      Swal.fire("완료", "프로필 사진이 수정되었습니다.", "success");
    } catch (error) {
      Swal.fire("수정 실패", error.message || "프로필 사진 수정 중 오류가 발생했습니다.", "error");
    }
  };

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
        await logout();
        localStorage.removeItem('token');
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
