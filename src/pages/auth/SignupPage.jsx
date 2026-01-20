
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { kakaoRegister } from '../../api/authApi';
import Swal from 'sweetalert2';
import { FaUser, FaTimes } from 'react-icons/fa';
import './SignupPage.css';

export default function SignupPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { kakaoAccessToken } = location.state || {}; // dispatch removed

  const [userType, setUserType] = useState('');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState(''); // 이름 입력 필드 추가
  const [profileImageUrl, setProfileImageUrl] = useState(null);

  // 유효성 검사
  const isValidName = name.trim().length >= 2;
  const isValidPhone = /^010-\d{4}-\d{4}$/.test(phone);
  const isSignupButtonDisabled = !isValidName || !isValidPhone || !userType;

  const handlePhoneChange = (e) => {
    const numbersOnly = e.target.value.replace(/[^0-9]/g, '');
    let formatted = numbersOnly;
    if (numbersOnly.length > 3 && numbersOnly.length <= 7) {
      formatted = `${numbersOnly.slice(0, 3)}-${numbersOnly.slice(3)}`;
    } else if (numbersOnly.length > 7) {
      formatted = `${numbersOnly.slice(0, 3)}-${numbersOnly.slice(3, 7)}-${numbersOnly.slice(7, 11)}`;
    }
    setPhone(formatted);
  };

  const handleSignup = async () => {
    try {
      // 카카오 회원가입 API 호출 (회원가입 + 로그인 동시 처리)
      const registerResponse = await kakaoRegister({
        kakaoAccessToken,
        userType,
        phone,
        bankName: '',      // 은행명 (현재 미사용)
        accountNumber: '', // 계좌번호 (현재 미사용)
        profileImageUrl: '' // 이것도 귀찮아서 그냥 미구현(카카오 oauth를 한번 더 해야함)
      });

      if (!registerResponse.success || !registerResponse.data?.accessToken) {
        throw new Error(registerResponse.error?.message || '회원가입 실패');
      }

      Swal.fire({
        icon: 'success',
        title: '회원가입 완료!',
        text: '로그인되었습니다.',
        confirmButtonColor: '#769fcd',
      }).then(() => {
        // userType에 따라 리다이렉트
        if (registerResponse.data.userType === 'EMPLOYER') {
          navigate('/employer');
        } else {
          navigate('/worker');
        }
      });
    } catch (error) {
      // 에러 상태 코드 확인
      const statusCode = Number(error.response?.status) || Number(error.status) || 0;

      // 에러 유형에 따른 처리
      let errorTitle = '회원가입 실패';
      let shouldRedirect = false;
      let redirectPath = '/';

      if (statusCode === 0) {
        // 네트워크 오류: 현재 페이지 유지하여 재시도 가능하게
        errorTitle = '네트워크 오류';
        shouldRedirect = false;
      } else if (statusCode === 400 || statusCode === 409) {
        // 잘못된 요청이나 중복: 홈으로 리다이렉트
        shouldRedirect = true;
      } else if (statusCode >= 500) {
        // 서버 오류: 현재 페이지 유지하여 재시도 가능하게
        errorTitle = '서버 오류';
        shouldRedirect = false;
      }

      Swal.fire({
        icon: 'error',
        title: errorTitle,
        text: error.error?.message || error.message || '알 수 없는 오류가 발생했습니다.',
        confirmButtonColor: '#769fcd',
      }).then(() => {
        if (shouldRedirect) {
          navigate(redirectPath);
        }
        // shouldRedirect가 false면 현재 페이지 유지 (재시도 가능)
      });
    }
  };

  return (
    <div className="signup-container">
      {/* 하얀색 박스 */}
      <div className="signup-box">
        {/* 헤더 - 회원가입 제목과 X 버튼 */}
        <div className="signup-header">
          <h2 className="signup-title">회원가입</h2>
          <button
            onClick={() => navigate('/')}
            className="close-button"
          >
            <FaTimes size={20} />
          </button>
        </div>
        {/* 내용 영역 */}
        <div className="signup-content">
          {/* 이름 입력 */}
          <div className="form-group">
            <label className="form-label">
              이름 <span className="required-star">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="이름을 입력해주세요"
              maxLength={20}
              className="form-input"
            />
            {name && !isValidName && (
              <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                이름은 2자 이상 입력해주세요.
              </p>
            )}
          </div>
          {/* 전화번호 입력 */}
          <div className="form-group">
            <label className="form-label">
              전화번호 <span className="required-star">*</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={handlePhoneChange}
              placeholder="010-1234-5678"
              maxLength={13}
              className="form-input"
            />
            {phone && !isValidPhone && (
              <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                전화번호는 010-1234-5678 형식으로 입력해주세요.
              </p>
            )}
          </div>
          {/* 역할 선택 */}
          <div className="form-group">
            <label className="form-label">
              역할 <span className="required-star">*</span>
            </label>
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  name="userType"
                  value="WORKER"
                  checked={userType === 'WORKER'}
                  onChange={() => setUserType('WORKER')}
                  className="radio-input"
                />
                <span className="radio-text">근로자</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="userType"
                  value="EMPLOYER"
                  checked={userType === 'EMPLOYER'}
                  onChange={() => setUserType('EMPLOYER')}
                  className="radio-input"
                />
                <span className="radio-text">고용주</span>
              </label>
            </div>
          </div>
          {/* 가입하기 버튼 */}
          <button
            onClick={handleSignup}
            className="submit-button"
            disabled={isSignupButtonDisabled}
            style={{
              opacity: isSignupButtonDisabled ? 0.5 : 1,
              cursor: isSignupButtonDisabled ? 'not-allowed' : 'pointer',
            }}
          >
            가입하기
          </button>
        </div>
      </div>
    </div>
  );
};