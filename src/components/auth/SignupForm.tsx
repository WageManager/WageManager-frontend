import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import { useSignupForm } from '../../hooks/auth/useSignupForm';
import UserTypeSelector from './UserTypeSelector';
import BankSelectModal from '../common/BankSelectModal/BankSelectModal';
import '../../pages/auth/SignupPage.css'; 

interface SignupFormProps {
  kakaoAccessToken: string;
}

export default function SignupForm({ kakaoAccessToken }: SignupFormProps) {
  const navigate = useNavigate();
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);

  const { 
      formState: { name, phone, userType, bankName, accountNumber }, 
    formActions: { setName, setUserType, handlePhoneChange, setBankName, handleAccountNumberChange, handleSubmit },
    validation: { isValidName, isValidPhone, isValidBankName, isValidAccountNumber, isSubmitDisabled }
  } = useSignupForm({ kakaoAccessToken });

  return ( 
    // 하얀색 박스 
    <div className="signup-box" >
      {/* 헤더 - 회원가입 제목과 X 버튼 */}
      <div className="signup-header">
        <h2 className="signup-title">회원가입</h2>
        <button onClick={() => navigate('/')} className="close-button" aria-label="닫기">
          <FaTimes size={20} />
        </button>
      </div>
      {/* 내용 영역 */}
      <div className="signup-content">
        {/* 이름 입력 */}
        <div className="form-group">
          <label className="form-label">이름 <span className="required-star">*</span></label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="이름을 입력해주세요"
            maxLength={20}
            className="form-input"
          />
          {name && !isValidName && <p style={{color:'#ef4444', fontSize:'0.8rem'}}>이름은 2자 이상 입력해주세요.</p>}
        </div>

        {/* 전화번호 입력*/}
        <div className="form-group">
          <label className="form-label">전화번호 <span className="required-star">*</span></label>
          <input
            type="tel"
            value={phone}
            onChange={handlePhoneChange}
            placeholder="010-1234-5678"
            maxLength={13}
            className="form-input"
          />
          {phone && !isValidPhone && <p style={{color:'#ef4444', fontSize:'0.8rem'}}>전화번호는 010-1234-5678 형식으로 입력해주세요.</p>}
        </div>

        {/* 역할 선택 */}
        <div className="form-group">
          <UserTypeSelector value={userType} onChange={setUserType} />
        </div>

        {/* 은행 선택 (WORKER만 표시) */}
        {userType === 'WORKER' && (
          <div className="form-group">
            <label className="form-label">은행 <span className="required-star">*</span></label>
            <button
              type="button"
              onClick={() => setIsBankModalOpen(true)}
              className="form-input"
              style={{ textAlign: 'left', cursor: 'pointer' }}
            >
              {bankName || '은행을 선택해주세요'}
            </button>
          </div>
        )}

        {/* 계좌번호 입력 (WORKER만 표시) */}
        {userType === 'WORKER' && (
          <div className="form-group">
            <label className="form-label">계좌번호 <span className="required-star">*</span></label>
            <input
              type="text"
              value={accountNumber}
              onChange={handleAccountNumberChange}
              placeholder="계좌번호를 입력해주세요"
              maxLength={20}
              className="form-input"
            />
            {accountNumber && !isValidAccountNumber && <p style={{color:'#ef4444', fontSize:'0.8rem'}}>계좌번호는 10자 이상 입력해주세요.</p>}
          </div>
        )}

        {/* 가입하기 버튼 */}
        <button
          onClick={handleSubmit}
          className="submit-button"
          disabled={isSubmitDisabled}
          style={{ 
            opacity: isSubmitDisabled ? 0.5 : 1,
            cursor: isSubmitDisabled ? 'not-allowed' : 'pointer'
           }}
        >
          가입하기
        </button>
      </div>

      {/* 은행 선택 모달 */}
      <BankSelectModal
        isOpen={isBankModalOpen}
        selectedBank={bankName}
        onSelect={setBankName}
        onClose={() => setIsBankModalOpen(false)}
      />
    </div>
  );
}