import { useState } from "react";
import type { ChangeEvent, JSX } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { logout } from "../../../api/authApi";
import { updateMyInfo, deleteMyAccount } from "../../../api/commonApi";

interface User {
  id?: number;
  name: string;
  phone?: string;
  profileImageUrl?: string | null;
}

type EditableField = "name" | "phone";

interface ProfileTabProps {
  user: User;
  onUserUpdate: (user: User) => void;
}

export default function ProfileTab({ user, onUserUpdate }: ProfileTabProps): JSX.Element {
  const navigate = useNavigate();
  const [editableSections, setEditableSections] = useState<{ name: boolean; phone: boolean }>({
    name: false,
    phone: false,
  });

  const handleChange = (field: EditableField, value: string): void => {
    onUserUpdate({ ...user, [field]: value });
  };

  const handleSave = async (field: EditableField): Promise<void> => {
    try {
      await updateMyInfo({ [field]: user[field] ?? "" });
      Swal.fire("완료", field === "name" ? "이름이 수정되었습니다." : "전화번호가 수정되었습니다.", "success");
    } catch (error) {
      const message = error instanceof Error ? error.message : "정보 수정 중 오류가 발생했습니다.";
      Swal.fire("수정 실패", message, "error");
    }
  };

  const handleEditButtonClick = (field: EditableField): void => {
    const isCurrentlyEditing = editableSections[field];

    if (isCurrentlyEditing) {
      void handleSave(field);
    }

    setEditableSections((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleWithdraw = async (): Promise<void> => {
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
        await deleteMyAccount();
        Swal.fire("탈퇴 완료", "회원 탈퇴가 완료되었습니다.", "success");
        await logout();
        localStorage.removeItem("token");
        navigate("/");
      } catch (error) {
        const message = error instanceof Error ? error.message : "회원 탈퇴 중 오류가 발생했습니다.";
        Swal.fire("탈퇴 실패", message, "error");
      }
    }
  };

  return (
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
        <button className="mypage-edit-button" onClick={() => handleEditButtonClick("name")}>
          {editableSections.name ? "완료" : "수정"}
        </button>
      </div>
      <hr />
      <div className="mypage-phone">
        <span className="mypage-label">전화번호</span>
        <input
          type="tel"
          value={user.phone ?? ""}
          disabled={!editableSections.phone}
          onChange={(e) => handleChange("phone", e.target.value)}
          placeholder="010-1234-5678"
        />
        <button className="mypage-edit-button" onClick={() => handleEditButtonClick("phone")}>
          {editableSections.phone ? "완료" : "수정"}
        </button>
      </div>
      <div className="mypage-withdraw-section">
        <button className="mypage-withdraw-button" onClick={handleWithdraw}>
          회원 탈퇴 &gt;
        </button>
      </div>
    </div>
  );
}
