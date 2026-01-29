import { useState, useEffect } from "react";
import type { ChangeEvent, JSX } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { logout } from "../../../api/authApi";
import { updateMyInfo, deleteMyAccount } from "../../../api/commonApi";
import EditButton from "../../common/EditButton";

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
  const [originalUser, setOriginalUser] = useState<User>(user);

  useEffect(() => {
    const isEditing = Object.values(editableSections).some((value) => value);
    if (!isEditing) {
      setOriginalUser(user);
    }
  }, [user, editableSections]);

  const hasChanges = (field: EditableField): boolean => {
    return user[field] !== originalUser[field];
  };

  const handleChange = (field: EditableField, value: string): void => {
    onUserUpdate({ ...user, [field]: value });
  };

  const validateField = (field: EditableField, value: string | undefined): { isValid: boolean; message: string } => {
    if (!value || value.trim() === "") {
      return { isValid: false, message: "필수 입력 항목입니다." };
    }

    if (field === "name") {
      if (value.trim().length < 2) {
        return { isValid: false, message: "이름은 2자 이상이어야 합니다." };
      }
    }

    if (field === "phone") {
      const phoneRegex = /^010-\d{4}-\d{4}$/;
      if (!phoneRegex.test(value)) {
        return { isValid: false, message: "전화번호는 010-XXXX-XXXX 형식이어야 합니다." };
      }
    }

    return { isValid: true, message: "" };
  };

  const handleSave = async (field: EditableField): Promise<void> => {
    const value = user[field];
    const validation = validateField(field, value);

    if (!validation.isValid) {
      Swal.fire("입력 오류", validation.message, "error");
      return;
    }

    try {
      await updateMyInfo({ [field]: value ?? "" });
      Swal.fire("완료", field === "name" ? "이름이 수정되었습니다." : "전화번호가 수정되었습니다.", "success");
      setOriginalUser(user);
      setEditableSections((prev) => ({ ...prev, [field]: false }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "정보 수정 중 오류가 발생했습니다.";
      Swal.fire("수정 실패", message, "error");
    }
  };

  const toggleEdit = (field: EditableField): void => {
    const isCurrentlyEditing = editableSections[field];

    if (isCurrentlyEditing) {
      // 취소: 원래 값으로 복원
      onUserUpdate({ ...user, [field]: originalUser[field] ?? "" });
    } else {
      // 수정 모드 진입
      setOriginalUser(user);
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
        <EditButton
          isEditing={editableSections.name}
          hasChanges={hasChanges("name")}
          onEditClick={() => toggleEdit("name")}
          onSaveClick={() => void handleSave("name")}
          className="mypage-edit-button-override"
        />
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
        <EditButton
          isEditing={editableSections.phone}
          hasChanges={hasChanges("phone")}
          onEditClick={() => toggleEdit("phone")}
          onSaveClick={() => void handleSave("phone")}
          className="mypage-edit-button-override"
        />
      </div>
      <div className="mypage-withdraw-section">
        <button className="mypage-withdraw-button" onClick={handleWithdraw}>
          회원 탈퇴 &gt;
        </button>
      </div>
    </div>
  );
}
