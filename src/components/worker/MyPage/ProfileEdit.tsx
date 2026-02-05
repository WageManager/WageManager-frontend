import { useState, useEffect, useCallback } from 'react';
import type { ChangeEvent } from 'react';
import '../../../pages/workers/WorkerMyPage.css';
import EditButton from '../../common/EditButton';
import { BANK_LIST, BANK_INFO } from '../../../constants/bank';
import type { BankName } from '../../../constants/bank';
import BankSelectModal from '../../common/BankSelectModal/BankSelectModal';
import { COMMON_VALIDATION, COMMON_VALIDATION_MESSAGES } from '../../../constants/validation';
import { formatPhoneNumber } from '../../../utils/formatUtils';
import type {
  ProfileEditProps,
  EditSection,
  UserResponse,
  WorkerResponse,
  ValidationResult,
} from '../../../types/worker/workerMypage.types';

// ============ 타입 정의 ============

interface EditableSections {
  basic: boolean;
  phone: boolean;
  account: boolean;
}

interface FormErrors {
  basic?: string;
  phone?: string;
  account?: string;
}

// 로컬 편집용 사용자 데이터 (UserResponse + WorkerResponse 필드 병합)
interface LocalUserData {
  name: string;
  kakaoId: string;
  phone: string;
  bankName: string;
  accountNumber: string;
  workerCode: string;
}

// ============ 유틸리티 함수 ============

/** UserResponse + WorkerResponse를 LocalUserData로 병합 */
function mergeUserData(user: UserResponse, worker: WorkerResponse | null): LocalUserData {
  return {
    name: user.name || '',
    kakaoId: user.kakaoId || '',
    phone: user.phone || '',
    bankName: worker?.bankName || '',
    accountNumber: worker?.accountNumber || '',
    workerCode: worker?.workerCode || '',
  };
}

/** 사용자 유형 라벨 (Worker 전용 컴포넌트이므로 항상 '근로자') */
const USER_TYPE_LABEL = '근로자';

/** 필드 검증 */
function validateField(section: EditSection, value: string, bankName?: string): ValidationResult {
  const trimmedValue = value?.trim() || '';

  // 필수 입력 체크
  if (!trimmedValue) {
    return { isValid: false, message: COMMON_VALIDATION_MESSAGES.REQUIRED };
  }

  switch (section) {
    case 'basic':
      if (trimmedValue.length < COMMON_VALIDATION.NAME_MIN_LENGTH) {
        return { isValid: false, message: COMMON_VALIDATION_MESSAGES.NAME_MIN_LENGTH };
      }
      break;

    case 'phone':
      if (!COMMON_VALIDATION.PHONE_PATTERN.test(value)) {
        return { isValid: false, message: COMMON_VALIDATION_MESSAGES.PHONE_FORMAT };
      }
      break;

    case 'account': {
      // 은행명 검증
      if (!bankName) {
        return { isValid: false, message: COMMON_VALIDATION_MESSAGES.BANK_NAME_REQUIRED };
      }
      // 계좌번호 검증
      const accountLength = trimmedValue.length;
      const isValidLength =
        accountLength >= COMMON_VALIDATION.ACCOUNT_NUMBER_MIN_LENGTH &&
        accountLength <= COMMON_VALIDATION.ACCOUNT_NUMBER_MAX_LENGTH;
      if (!isValidLength) {
        return { isValid: false, message: COMMON_VALIDATION_MESSAGES.ACCOUNT_NUMBER_FORMAT };
      }
      break;
    }
  }

  return { isValid: true, message: '' };
}

// ============ 메인 컴포넌트 ============

/**
 * 프로필 편집 컴포넌트
 * - 기본 정보 수정 (이름)
 * - 전화번호 수정
 * - 계좌 정보 수정 (은행명, 계좌번호)
 */
export default function ProfileEdit({ user, worker, onUserUpdate }: ProfileEditProps) {
  const [editableSections, setEditableSections] = useState<EditableSections>({
    basic: false,
    phone: false,
    account: false,
  });
  const [localUser, setLocalUser] = useState<LocalUserData>(() => mergeUserData(user, worker)); // 현재 편집 중인 데이터
  const [originalUser, setOriginalUser] = useState<LocalUserData>(() => mergeUserData(user, worker)); // 원본 데이터 (취소 시 복원용)
  const [errors, setErrors] = useState<FormErrors>({});
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);

  // user/worker prop이 변경될 때 동기화 (수정 중이 아닐 때만)
  useEffect(() => {
    const isEditing = Object.values(editableSections).some(Boolean);
    if (!isEditing) {
      const merged = mergeUserData(user, worker);
      setLocalUser(merged);
      setOriginalUser(merged);
      setErrors({});
    }
  }, [user, worker, editableSections]);

  // 섹션별 변경 여부 확인
  const hasChanges = useCallback(
    (section: EditSection): boolean => {
      switch (section) {
        case 'basic':
          return localUser.name !== originalUser.name;
        case 'phone':
          return localUser.phone !== originalUser.phone;
        case 'account':
          return (
            localUser.bankName !== originalUser.bankName ||
            localUser.accountNumber !== originalUser.accountNumber
          );
        default:
          return false;
      }
    },
    [localUser, originalUser]
  );

  // 수정 모드 토글
  const toggleEdit = useCallback(
    (section: EditSection) => {
      const wasEditing = editableSections[section];

      if (wasEditing) {
        // 취소: 원래 값으로 복원
        setLocalUser(originalUser);
        setErrors({});
      } else {
        // 수정 모드 진입
        setOriginalUser(localUser);
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[section];
          return newErrors;
        });
      }

      setEditableSections((prev) => ({
        ...prev,
        [section]: !prev[section],
      }));
    },
    [editableSections, localUser, originalUser]
  );

  // 저장 핸들러
  const handleSave = useCallback(
    async (section: EditSection) => {
      // 검증
      let validation: ValidationResult;

      if (section === 'basic') {
        validation = validateField('basic', localUser.name);
      } else if (section === 'phone') {
        validation = validateField('phone', localUser.phone);
      } else {
        validation = validateField('account', localUser.accountNumber, localUser.bankName);
      }

      if (!validation.isValid) {
        setErrors({ [section]: validation.message });
        return;
      }

      // API 호출 데이터 준비
      let data: Record<string, string>;
      if (section === 'basic') {
        data = { name: localUser.name };
      } else if (section === 'phone') {
        data = { phone: localUser.phone };
      } else {
        data = {
          bankName: localUser.bankName,
          accountNumber: localUser.accountNumber,
        };
      }

      // 에러 초기화 및 API 호출
      setErrors({});
      const success = await onUserUpdate(section, data);

      if (success) {
        // 성공 시에만 상태 업데이트
        setOriginalUser(localUser);
        setEditableSections((prev) => ({ ...prev, [section]: false }));
      }
      // 실패 시 편집 모드 유지 (toast는 훅에서 표시됨)
    },
    [localUser, onUserUpdate]
  );

  // 필드 변경 핸들러
  const handleChange = useCallback((field: keyof LocalUserData, value: string) => {
    setLocalUser((prev) => ({ ...prev, [field]: value }));
  }, []);

  // 전화번호 입력 핸들러
  const handlePhoneChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const formatted = formatPhoneNumber(e.target.value);
      if (formatted.length <= COMMON_VALIDATION.PHONE_MAX_LENGTH) {
        handleChange('phone', formatted);
      }
    },
    [handleChange]
  );

  // 계좌번호 입력 핸들러 (숫자만)
  const handleAccountNumberChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const numbersOnly = e.target.value.replace(/[^0-9]/g, '');
      if (numbersOnly.length <= COMMON_VALIDATION.ACCOUNT_NUMBER_MAX_LENGTH) {
        handleChange('accountNumber', numbersOnly);
      }
    },
    [handleChange]
  );

  // 은행 선택 핸들러
  const handleBankSelect = useCallback(
    (bankName: BankName) => {
      handleChange('bankName', bankName);
    },
    [handleChange]
  );

  return (
    <div className="worker-mypage-container">
      <h1 className="worker-mypage-title">기본 정보</h1>

      {/* 기본 정보 섹션 */}
      <BasicInfoSection
        localUser={localUser}
        isEditing={editableSections.basic}
        hasChanges={hasChanges('basic')}
        error={errors.basic}
        onToggleEdit={() => toggleEdit('basic')}
        onSave={() => handleSave('basic')}
        onChange={handleChange}
      />
      <hr />

      {/* 전화번호 섹션 */}
      <PhoneSection
        phone={localUser.phone}
        isEditing={editableSections.phone}
        hasChanges={hasChanges('phone')}
        error={errors.phone}
        onToggleEdit={() => toggleEdit('phone')}
        onSave={() => handleSave('phone')}
        onChange={handlePhoneChange}
      />
      <hr />

      {/* 계좌 정보 섹션 */}
      <AccountSection
        bankName={localUser.bankName}
        accountNumber={localUser.accountNumber}
        isEditing={editableSections.account}
        hasChanges={hasChanges('account')}
        error={errors.account}
        onToggleEdit={() => toggleEdit('account')}
        onSave={() => handleSave('account')}
        onBankChange={(value) => handleChange('bankName', value)}
        onAccountChange={handleAccountNumberChange}
        onBankButtonClick={() => setIsBankModalOpen(true)}
      />

      {/* 은행 선택 모달 */}
      <BankSelectModal
        isOpen={isBankModalOpen}
        selectedBank={localUser.bankName}
        onSelect={handleBankSelect}
        onClose={() => setIsBankModalOpen(false)}
      />
      <hr />

      {/* 근무자 코드 (읽기 전용) */}
      <div className="worker-mypage-field">
        <span className="worker-mypage-label">근무자 코드</span>
        <div className="worker-mypage-input-wrapper">
          <span className="worker-mypage-field-value">
            {localUser.workerCode || '코드 없음'}
          </span>
        </div>
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

// ============ 하위 컴포넌트 ============

interface BasicInfoSectionProps {
  localUser: LocalUserData;
  isEditing: boolean;
  hasChanges: boolean;
  error: string | undefined;
  onToggleEdit: () => void;
  onSave: () => void;
  onChange: (field: keyof LocalUserData, value: string) => void;
}

function BasicInfoSection({
  localUser,
  isEditing,
  hasChanges,
  error,
  onToggleEdit,
  onSave,
  onChange,
}: BasicInfoSectionProps) {
  return (
    <div className="worker-mypage-basic-info">
      <div className="worker-mypage-name-row">
        <div className="worker-mypage-name-text-wrapper">
          <div className="worker-mypage-name-text">{localUser.name}</div>
          <div className="worker-mypage-birth-text">{localUser.kakaoId}</div>
          <div className="worker-mypage-gender-text">
            {USER_TYPE_LABEL}
          </div>
        </div>
        <EditButton
          isEditing={isEditing}
          hasChanges={hasChanges}
          onEditClick={onToggleEdit}
          onSaveClick={onSave}
          className="worker-mypage-edit-button-override"
        />
      </div>
      {isEditing && (
        <div className="worker-mypage-edit-fields">
          <div className="worker-mypage-name">
            <span className="worker-mypage-label">이름</span>
            <input
              type="text"
              value={localUser.name}
              onChange={(e) => onChange('name', e.target.value)}
              className={error ? 'worker-mypage-input-error' : ''}
            />
            {error && <span className="worker-mypage-error-message">{error}</span>}
          </div>
        </div>
      )}
    </div>
  );
}

interface PhoneSectionProps {
  phone: string;
  isEditing: boolean;
  hasChanges: boolean;
  error: string | undefined;
  onToggleEdit: () => void;
  onSave: () => void;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

function PhoneSection({
  phone,
  isEditing,
  hasChanges,
  error,
  onToggleEdit,
  onSave,
  onChange,
}: PhoneSectionProps) {
  return (
    <div className="worker-mypage-field">
      <span className="worker-mypage-label">전화 번호</span>
      <div className="worker-mypage-input-wrapper">
        {isEditing ? (
          <input
            type="tel"
            value={phone}
            onChange={onChange}
            placeholder="010-1234-5678"
            maxLength={COMMON_VALIDATION.PHONE_MAX_LENGTH}
            className={error ? 'worker-mypage-input-error' : ''}
          />
        ) : (
          <span className="worker-mypage-field-value">
            {phone || '전화번호를 입력해주세요'}
          </span>
        )}
        {error && <span className="worker-mypage-error-message">{error}</span>}
      </div>
      <EditButton
        isEditing={isEditing}
        hasChanges={hasChanges}
        onEditClick={onToggleEdit}
        onSaveClick={onSave}
        className="worker-mypage-edit-button-override"
      />
    </div>
  );
}

interface AccountSectionProps {
  bankName: string;
  accountNumber: string;
  isEditing: boolean;
  hasChanges: boolean;
  error: string | undefined;
  onToggleEdit: () => void;
  onSave: () => void;
  onBankChange: (value: string) => void;
  onAccountChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onBankButtonClick: () => void;
}

function AccountSection({
  bankName,
  accountNumber,
  isEditing,
  hasChanges,
  error,
  onToggleEdit,
  onSave,
  onBankChange,
  onAccountChange,
  onBankButtonClick,
}: AccountSectionProps) {
  // 표시용 텍스트
  const displayText = bankName && accountNumber
    ? `${bankName} ${accountNumber}`
    : accountNumber || bankName || '';

  const bankInfo = bankName ? BANK_INFO[bankName as BankName] : null;

  return (
    <div className="worker-mypage-field">
      <span className="worker-mypage-label">계좌 정보</span>
      <div className="worker-mypage-input-wrapper">
        {isEditing ? (
          <div className="worker-mypage-account-edit">
            <button
              type="button"
              className={`worker-mypage-bank-select-button ${error ? 'worker-mypage-input-error' : ''}`}
              onClick={onBankButtonClick}
            >
              {bankInfo ? (
                <>
                  <img src={bankInfo.logo} alt={bankName} className="worker-mypage-bank-logo" />
                  <span>{bankInfo.shortName}</span>
                </>
              ) : (
                <span>은행 선택</span>
              )}
            </button>
            <input
              type="text"
              value={accountNumber}
              onChange={onAccountChange}
              placeholder="계좌번호 (숫자만)"
              maxLength={COMMON_VALIDATION.ACCOUNT_NUMBER_MAX_LENGTH}
              className={error ? 'worker-mypage-input-error' : ''}
            />
          </div>
        ) : (
          <span className="worker-mypage-field-value">
            {displayText || '계좌 정보를 입력해주세요'}
          </span>
        )}
        {error && <span className="worker-mypage-error-message">{error}</span>}
      </div>
      <EditButton
        isEditing={isEditing}
        hasChanges={hasChanges}
        onEditClick={onToggleEdit}
        onSaveClick={onSave}
        className="worker-mypage-edit-button-override"
      />
    </div>
  );
}
