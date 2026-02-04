import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { devLogin } from '../../api/authApi';
import KakaoLoginButton from '../../components/auth/KakaoLoginButton';
import DevLoginPanel from '../../components/auth/DevLoginPanel';
import type { UserType } from "../../types/auth";


export default function LoginPage() {
  const navigate = useNavigate();

  // 개발자 로그인 처리
  const handleDevLogin = async (userId: number, userName: string, userType: UserType) => {
    try {
      // 1. 개발자 로그인 API 호출
      const response = await devLogin(userId, userName, userType);

      if (response.success && response.data?.accessToken) {
        // 2. sessionStorage에 토큰 저장
        sessionStorage.setItem('token', response.data.accessToken);
        
         // 3. userType에 따라 리다이렉트 (API 응답 사용)
        const targetPath = response.data.userType === 'EMPLOYER' ? '/employer' : '/worker';
        navigate(targetPath);
      } else {
        throw new Error(response.error?.message || '개발자 로그인 실패');
      }
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: '로그인 실패',
        text: error.message || '알 수 없는 오류가 발생했습니다.',
        confirmButtonColor: '#769fcd',
      });
    }
  };

  return (
    <div 
      className="flex justify-center items-center min-h-screen p-5 relative" 
      style={{ backgroundColor: 'var(--color-main)' }}
    >
      <div className="text-center flex flex-col items-center gap-10">
        <h1 
          className="text-5xl font-bold m-0" 
          style={{ color: 'var(--color-background)' }}
        >
          PayCheck
        </h1>
        <KakaoLoginButton />
      </div>
      <DevLoginPanel onDevLogin={handleDevLogin} />
    </div>
  );
}