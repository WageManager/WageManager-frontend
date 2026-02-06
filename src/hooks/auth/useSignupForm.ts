import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { kakaoRegister } from '../../api/authApi';
import type { UserType } from '../../types/auth';
import { AUTH_CONSTANTS } from '../../constants/auth';

interface UseSignupFormProps {
  kakaoAccessToken?: string;
}

export const useSignupForm = ({ kakaoAccessToken }: UseSignupFormProps) => {
  const navigate = useNavigate();

  // 상태
  const [userType, setUserType] = useState<UserType | ''>('');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');

  // 유효성 검사
  const isValidName = name.trim().length >= AUTH_CONSTANTS.MIN_NAME_LENGTH;
  const isValidPhone = /^010-\d{4}-\d{4}$/.test(phone);
  const isValidBankName = userType === 'WORKER' ? bankName.trim().length > 0 : true;
  const isValidAccountNumber = userType === 'WORKER' ? accountNumber.trim().length >= 10 : true;
  const isSubmitDisabled = !isValidName || !isValidPhone || !userType || !isValidBankName || !isValidAccountNumber;

  // 전화번호 포맷팅 핸들러
  const handlePhoneChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const numbersOnly = e.target.value.replace(/[^0-9]/g, '');
    let formatted = numbersOnly;
    
    if (numbersOnly.length > 3 && numbersOnly.length <= 7) {
      formatted = `${numbersOnly.slice(0, 3)}-${numbersOnly.slice(3)}`;
    } else if (numbersOnly.length > 7) {
      formatted = `${numbersOnly.slice(0, 3)}-${numbersOnly.slice(3, 7)}-${numbersOnly.slice(7, 11)}`;
    }
    
    setPhone(formatted);
  }, []);

  // 계좌번호 입력 핸들러 (숫자만 입력 가능)
  const handleAccountNumberChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const numbersOnly = e.target.value.replace(/[^0-9]/g, '');
    setAccountNumber(numbersOnly);
  }, []);

  // 제출 핸들러
  const handleSubmit = async () => {
    // 카카오 액세스 토큰(string/undefined) 없으면 오류
    if (!kakaoAccessToken) {
      Swal.fire({
        icon: 'error',
        title: '인증 오류',
        text: '카카오 인증 정보가 없습니다.',
      }).then(() => navigate('/'));
      return;
    }
    if (!userType || !isValidName || !isValidPhone) {
      Swal.fire({
        icon: 'error',
        title: '입력 오류',
        text: '이름/전화번호/역할을 다시 확인해주세요.',
        confirmButtonColor: '#769fcd',
      });
      return;
    }

    try {
      // 카카오 회원가입 API 호출 (회원가입 + 로그인 동시 처리)
      const registerResponse = await kakaoRegister({
        kakaoAccessToken,
        userType,
        phone,
        bankName: userType === 'WORKER' ? bankName : '',
        accountNumber: userType === 'WORKER' ? accountNumber : '',
        profileImageUrl: '' // TODO: 카카오 OAuth 추가 호출 후 프로필 이미지 연동
      });

      if (!registerResponse.success || !registerResponse.data?.accessToken) {
        throw new Error(registerResponse.error?.message || '회원가입 실패');
      }

      // accessToken을 sessionStorage에 저장
      sessionStorage.setItem('token', registerResponse.data.accessToken);

      Swal.fire({
        icon: 'success',
        title: '회원가입 완료!',
        text: '로그인되었습니다.',
        confirmButtonColor: '#769fcd',
      }).then(() => {
        // userType에 따라 리다이렉트
        const targetPath = registerResponse.data?.userType === 'EMPLOYER' ? '/employer' : '/worker';
        navigate(targetPath);
      });

    } catch (error: any) {
      // 에러 상태 코드 확인
      const statusCode = Number(error.response?.status) || 0;
      // 에러 유형에 따른 처리
      let errorTitle = '회원가입 실패';
      let shouldRedirect = false;
      let redirectPath = '/';

      if (statusCode === 0) { // 네트워크 오류: 현재 페이지 유지하여 재시도 가능하게
        errorTitle = '네트워크 오류';
        shouldRedirect = false;
      } else if (statusCode === 400 || statusCode === 409) { // 잘못된 요청이나 중복: 홈으로 리다이렉트
        shouldRedirect = true;
      } else if (statusCode >= 500) { // 서버 오류: 현재 페이지 유지하여 재시도 가능하게
        errorTitle = '서버 오류';
        shouldRedirect = false;
      }

      Swal.fire({
        icon: 'error',
        title: errorTitle,
        text: error.response?.data?.error?.message || error.error?.message || error.message || '알 수 없는 오류가 발생했습니다.',
        confirmButtonColor: '#769fcd',
      }).then(() => {
        if (shouldRedirect) {
          navigate(redirectPath);
        }
        // shouldRedirect가 false면 현재 페이지 유지 (재시도 가능)
      });
    }
  };

  return {
    formState: { name, phone, userType, bankName, accountNumber },
    formActions: { setName, setUserType, handlePhoneChange, setBankName, handleAccountNumberChange, handleSubmit },
    validation: { isValidName, isValidPhone, isValidBankName, isValidAccountNumber, isSubmitDisabled },
  };
};