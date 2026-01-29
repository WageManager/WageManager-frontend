import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import "../../../pages/workers/WorkerMyPage.css";
import EditButton from "../../common/EditButton";

export default function ProfileEdit({ user, onUserUpdate }) {
  const [editableSections, setEditableSections] = useState({
    basic: false,
    phone: false,
    kakaoPay: false,
  });
  const [localUser, setLocalUser] = useState(user);
  const [originalUser, setOriginalUser] = useState(user);
  const [errors, setErrors] = useState({});

  // user prop이 변경될 때 localUser 동기화
  // 단, 사용자가 수정 중이 아닐 때만 동기화하여 입력 중인 데이터를 보호
  useEffect(() => {
    const isEditing = Object.values(editableSections).some((value) => value);
    if (!isEditing) {
      setLocalUser(user);
      setOriginalUser(user);
      setErrors({});
    }
  }, [user, editableSections]);

  // 섹션별 변경 여부 확인
  const hasChanges = (section) => {
    switch (section) {
      case "basic":
        return localUser.name !== originalUser.name;
      case "phone":
        return localUser.phone !== originalUser.phone;
      case "kakaoPay":
        return localUser.kakaoPayLink !== originalUser.kakaoPayLink;
      default:
        return false;
    }
  };

  const validateField = (section, value) => {
    if (!value || value.trim() === "") {
      return { isValid: false, message: "필수 입력 항목입니다." };
    }

    switch (section) {
      case "phone": {
        const phoneRegex = /^010-\d{4}-\d{4}$/;
        if (!phoneRegex.test(value)) {
          return {
            isValid: false,
            message: "전화번호는 010-XXXX-XXXX 형식이어야 합니다.",
          };
        }
        break;
      }
      case "name": {
        if (value.trim().length < 2) {
          return { isValid: false, message: "이름은 2자 이상이어야 합니다." };
        }
        break;
      }
      case "kakaoPay": {
        const kakaoPayLinkRegex = /^https:\/\/qr\.kakaopay\.com\/.*$/;
        if (!kakaoPayLinkRegex.test(value)) {
          return {
            isValid: false,
            message: "카카오페이 링크는 https://qr.kakaopay.com/로 시작해야 합니다.",
          };
        }
        break;
      }
      default:
        break;
    }

    return { isValid: true, message: "" };
  };

  // 수정 모드 진입/취소 토글
  const toggleEdit = (section) => {
    const wasEditing = editableSections[section];

    if (wasEditing) {
      // 취소: 원래 값으로 복원
      setLocalUser(originalUser);
      setErrors({});
    } else {
      // 수정 모드 진입: 현재 값을 원본으로 저장
      setOriginalUser(localUser);
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[section];
        delete newErrors.basic;
        return newErrors;
      });
    }

    setEditableSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // 완료 버튼 클릭 시 저장
  const handleSave = (section) => {
    // 유효성 검사
    if (section === "basic") {
      const validation = validateField("name", localUser.name);
      if (!validation.isValid) {
        setErrors({ basic: validation.message });
        return;
      }
    } else if (section === "kakaoPay") {
      const validation = validateField("kakaoPay", localUser.kakaoPayLink);
      if (!validation.isValid) {
        setErrors({ kakaoPay: validation.message });
        return;
      }
    } else {
      const fieldValue = localUser[section];
      const validation = validateField(section, fieldValue);
      if (!validation.isValid) {
        setErrors({ [section]: validation.message });
        return;
      }
    }

    // 유효성 검사 통과 시 에러 초기화 및 API 호출
    setErrors({});
    onUserUpdate(localUser, section);
    setOriginalUser(localUser);
    setEditableSections((prev) => ({
      ...prev,
      [section]: false,
    }));
  };

  const handleChange = (field, value) => {
    setLocalUser((prev) => ({
      ...prev,
      [field]: value,
    }));
    
    // 카카오페이 링크 입력 시 실시간 검증
    if (field === "kakaoPayLink" && editableSections.kakaoPay) {
      if (value && value.trim() !== "") {
        const kakaoPayLinkRegex = /^https:\/\/qr\.kakaopay\.com\/.*$/;
        if (!kakaoPayLinkRegex.test(value)) {
          setErrors((prev) => ({
            ...prev,
            kakaoPay: "카카오페이 링크는 https://qr.kakaopay.com/로 시작해야 합니다.",
          }));
        } else {
          setErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors.kakaoPay;
            return newErrors;
          });
        }
      } else {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.kakaoPay;
          return newErrors;
        });
      }
    }
  };

  // 전화번호 입력 핸들러 (하이픈 자동 추가)
  const handlePhoneChange = (e) => {
    let value = e.target.value.replace(/[^0-9]/g, ''); // 숫자만 허용
    
    // 하이픈 자동 추가: 010-1234-5678 형식
    if (value.length > 3 && value.length <= 7) {
      value = value.slice(0, 3) + '-' + value.slice(3);
    } else if (value.length > 7) {
      value = value.slice(0, 3) + '-' + value.slice(3, 7) + '-' + value.slice(7, 11);
    }
    
    if (value.length <= 13) { // 최대 13자리 (하이픈 포함)
      handleChange("phone", value);
    }
  };

  // 생년월일을 그대로 출력 (형식 변환 없이)
  const formatBirthDate = (birthDate) => {
    if (!birthDate) return "";
    return String(birthDate);
  };

  const getUserTypeText = (userType) => {
    if (!userType) return "";
    return userType === "EMPLOYER" ? "고용주" : "근로자";
  };

  return (
    <div className="worker-mypage-container">
      <h1 className="worker-mypage-title">기본 정보</h1>

      {/* 이름, 생년월일, 역할 */}
      <div className="worker-mypage-basic-info">
        <div className="worker-mypage-name-row">
          <div className="worker-mypage-name-text-wrapper">
            <div className="worker-mypage-name-text">{localUser.name || ""}</div>
            <div className="worker-mypage-birth-text">
              {formatBirthDate(localUser.birthDate)}
            </div>
            <div className="worker-mypage-gender-text">
              {getUserTypeText(localUser.userType)}
            </div>
          </div>
          <EditButton
            isEditing={editableSections.basic}
            hasChanges={hasChanges("basic")}
            onEditClick={() => toggleEdit("basic")}
            onSaveClick={() => handleSave("basic")}
            className="worker-mypage-edit-button-override"
          />
        </div>
        {editableSections.basic && (
          <div className="worker-mypage-edit-fields">
            <div className="worker-mypage-name">
              <span className="worker-mypage-label">이름</span>
              <input
                type="text"
                value={localUser.name || ""}
                onChange={(e) => handleChange("name", e.target.value)}
                className={errors.basic ? "worker-mypage-input-error" : ""}
              />
              {errors.basic && (
                <span className="worker-mypage-error-message">
                  {errors.basic}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
      <hr />

      {/* 전화번호 */}
      <div className="worker-mypage-field">
        <span className="worker-mypage-label">전화 번호</span>
        <div className="worker-mypage-input-wrapper">
          <input
            type="tel"
            value={localUser.phone || ""}
            disabled={!editableSections.phone}
            onChange={handlePhoneChange}
            placeholder="010-1234-5678"
            maxLength={13}
            className={errors.phone ? "worker-mypage-input-error" : ""}
          />
          {errors.phone && (
            <span className="worker-mypage-error-message">{errors.phone}</span>
          )}
        </div>
        <EditButton
          isEditing={editableSections.phone}
          hasChanges={hasChanges("phone")}
          onEditClick={() => toggleEdit("phone")}
          onSaveClick={() => handleSave("phone")}
          className="worker-mypage-edit-button-override"
        />
      </div>
      <hr />

      {/* 카카오페이 송금 링크 */}
      <div className="worker-mypage-field">
        <span className="worker-mypage-label">카카오페이 송금 링크</span>
        <div className="worker-mypage-input-wrapper">
          <input
            type="text"
            value={localUser.kakaoPayLink || ""}
            disabled={!editableSections.kakaoPay}
            onChange={(e) => handleChange("kakaoPayLink", e.target.value)}
            placeholder="https://qr.kakaopay.com/..."
            className={errors.kakaoPay ? "worker-mypage-input-error" : ""}
          />
          {errors.kakaoPay && (
            <span className="worker-mypage-error-message">{errors.kakaoPay}</span>
          )}
        </div>
        <EditButton
          isEditing={editableSections.kakaoPay}
          hasChanges={hasChanges("kakaoPay")}
          onEditClick={() => toggleEdit("kakaoPay")}
          onSaveClick={() => handleSave("kakaoPay")}
          className="worker-mypage-edit-button-override"
        />
      </div>
      <hr />

      {/* 근무자 코드 (읽기 전용) */}
      <div className="worker-mypage-field">
        <span className="worker-mypage-label">근무자 코드</span>
        <input
          type="text"
          value={localUser.employeeCode || ""}
          readOnly
          className="worker-mypage-readonly"
        />
      </div>
      <hr />

      {/* 계정 이용 */}
      <div className="worker-mypage-account-section">
        <h2 className="worker-mypage-section-title">계정 이용</h2>
        <a href="#" className="worker-mypage-link">
          서비스 이용 동의 <span className="worker-mypage-arrow">→</span>
        </a>
      </div>
      <hr />

      {/* 회원 탈퇴 */}
      <div className="worker-mypage-withdraw">
        <a href="#" className="worker-mypage-withdraw-link">
          회원 탈퇴 <span className="worker-mypage-arrow">→</span>
        </a>
      </div>
    </div>
  );
}

ProfileEdit.propTypes = {
  user: PropTypes.shape({
    name: PropTypes.string,
    birthDate: PropTypes.string,
    userType: PropTypes.string,
    phone: PropTypes.string,
    kakaoPayLink: PropTypes.string,
    employeeCode: PropTypes.string,
    profileImageUrl: PropTypes.string,
  }).isRequired,
  onUserUpdate: PropTypes.func.isRequired,
};

