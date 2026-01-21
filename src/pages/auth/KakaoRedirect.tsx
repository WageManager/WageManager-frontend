import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { kakaoLoginWithToken } from '../../api/authApi';
import { HTTP_STATUS } from '../../constants/auth';

// 환경 변수 가져오기
const REST_API_KEY = import.meta.env.VITE_KAKAO_REST_API_KEY;
const REDIRECT_URI = import.meta.env.VITE_KAKAO_REDIRECT_URI;

export default function KakaoRedirectPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<string>('처리 중...');

  // 카카오 인증 처리 함수
  const handleKakaoAuth = useCallback(async (code: string) => {
    try {
      setStatus('카카오 인증 토큰 요청 중...');

      // 1. 인가 코드로 카카오 액세스 토큰 요청
      const tokenResponse = await axios.post(
        'https://kauth.kakao.com/oauth/token',
        new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: REST_API_KEY,
          redirect_uri: REDIRECT_URI,
          code: code,
        }),
        {
          headers: {
            'Content-type': 'application/x-www-form-urlencoded;charset=utf-8',
          },
        }
      );

      // 카카오에서 준 액세스 토큰 추출
      const { access_token } = tokenResponse.data;

      // 2. 백엔드 서버에 로그인 요청
      setStatus('서버에 로그인 요청 중...');
      try {
        const loginResponse = await kakaoLoginWithToken(access_token);

        // 3-1. 기존 회원인 경우 (200 응답 ->로그인 성공)
        if (loginResponse.success && loginResponse.data?.accessToken) {
          // localStorage에 토큰 저장
          localStorage.setItem('token', loginResponse.data.accessToken);

          // userType에 따라 이동
          const targetPath = loginResponse.data.userType === 'EMPLOYER' ? '/employer' : '/worker';
          navigate(targetPath);
          
        } else {
          // success가 false이거나 accessToken이 없는 경우
          throw new Error(loginResponse.error?.message || '로그인에 실패했습니다.');
        }

      } catch (error: any) {
        // 3-2. 404 또는 401 에러인 경우 -> 신규 회원으로 판단하여 회원가입 진행
        
        // 에러 상태 코드 추출 (숫자로 변환)
        const statusCode = Number(error.response?.status) || 0;

        // 404(Not Found) 또는 401(Unauthorized) -> 신규 회원가입 필요
        const isUserNotFound = statusCode === HTTP_STATUS.NOT_FOUND || statusCode === HTTP_STATUS.UNAUTHORIZED;
        if (isUserNotFound) {
            // 회원가입 페이지로 이동하면서 카카오 액세스 토큰 전달          
            navigate('/signup', {
                state: { kakaoAccessToken: access_token } 
          });
        } else {
          // 그 외 에러는 진짜 로그인 실패로 간주
          throw error;
        }
      }

    } catch (error: any) {
      // 최종 에러 처리
      console.error('Login Error:', error);
      
      // 에러 메시지 추출 (우선순위: error.error.message > error.message > error.response.data.message > 기본 메시지)
      const errorMessage = 
        error.error?.message || 
        error.message || 
        error.response?.data?.message || 
        error.response?.data?.error?.message || 
        '로그인 처리 중 오류가 발생했습니다.';

      Swal.fire({
        icon: 'error',
        title: '로그인 실패',
        text: errorMessage,
        confirmButtonColor: '#769fcd',
      }).then(() => {
        navigate('/');
      });
    }
  }, [navigate]);

  // 페이지 진입 시 URL 파라미터 확인
  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      setStatus('로그인에 실패했습니다.');
      const timer = setTimeout(() => navigate('/'), 2000);
      return () => clearTimeout(timer);
    }

    if (!code) {
      setStatus('인증 코드가 없습니다.');
      const timer = setTimeout(() => navigate('/'), 2000);
      return () => clearTimeout(timer);
    }
    
    handleKakaoAuth(code);
  }, [searchParams, handleKakaoAuth, navigate]);

  return (
    <div className="flex justify-center items-center min-h-screen p-5" style={{ backgroundColor: 'var(--color-main)' }}>
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-background)' }}>
          {status}
        </h2>
      </div>
    </div>
  );
}