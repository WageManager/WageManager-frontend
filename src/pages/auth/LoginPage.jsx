import { useNavigate } from 'react-router-dom';
import kakaoLoginIcon from "../../assets/kakao_login_medium_wide.png";
import { devLogin } from '../../api/authApi';
import Swal from 'sweetalert2';

const REST_API_KEY = import.meta.env.VITE_KAKAO_REST_API_KEY;
const REDIRECT_URI = import.meta.env.VITE_KAKAO_REDIRECT_URI;

const buildKakaoAuthUrl = () => {
  // ... (unchanged)
  if (!REST_API_KEY) {
    return null;
  }
  if (!REDIRECT_URI) {
    return null;
  }
  const baseUrl = "https://kauth.kakao.com/oauth/authorize";
  const params = new URLSearchParams({
    response_type: "code",
    client_id: REST_API_KEY,
    redirect_uri: REDIRECT_URI,
  });
  const authUrl = `${baseUrl}?${params.toString()}`;
  return authUrl;
};

export default function LoginPage() {
  const navigate = useNavigate();

  const handleKakaoLogin = () => {
    const kakaoAuthUrl = buildKakaoAuthUrl();
    if (kakaoAuthUrl) {
      window.location.href = kakaoAuthUrl;
    } else {
      alert('카카오 로그인 설정이 완료되지 않았습니다. 관리자에게 문의하세요.');
    }
  };

  const handleDevLogin = async (userId, userName, userType) => {
    try {
      // 1. 개발자 로그인 API 호출
      const response = await devLogin(userId, userName, userType);

      if (response.success && response.data?.accessToken) {
        // 2. localStorage에 토큰 저장
        localStorage.setItem('token', response.data.accessToken);

        // 3. userType에 따라 리다이렉트 (API 응답 사용)
        if (response.data.userType === 'EMPLOYER') {
          navigate('/employer');
        } else {
          navigate('/worker');
        }
      } else {
        throw new Error(response.error?.message || '개발자 로그인 실패');
      }
    } catch (error) {
      // ... (unchanged)
      Swal.fire({
        icon: 'error',
        title: '로그인 실패',
        text: error.message,
        confirmButtonColor: '#769fcd',
      });
    }
  };


  const testUsers = [
    { userId: '1', name: '박지성', userType: 'EMPLOYER' },
    { userId: '2', name: '김민준', userType: 'WORKER' },
    { userId: '3', name: '이서연', userType: 'WORKER' },
    { userId: '4', name: '박지훈', userType: 'WORKER' },
    { userId: '5', name: '정수빈', userType: 'WORKER' },
    { userId: '6', name: '최유진', userType: 'WORKER' },
  ];

  return (
    <div className="flex justify-center items-center min-h-screen p-5" style={{ backgroundColor: 'var(--color-main)', position: 'relative' }}>
      <div className="text-center flex flex-col items-center gap-10">
        <h1 className="text-5xl font-bold m-0" style={{ color: 'var(--color-background)' }}>월급관리소</h1>
        <button
          className="bg-transparent border-0 p-0 cursor-pointer transition-opacity duration-200 hover:opacity-90 active:opacity-80"
          onClick={handleKakaoLogin}
          style={{ position: 'relative', zIndex: 1 }}
        >
          <img
            src={kakaoLoginIcon}
            alt="카카오 로그인"
            className="block w-full h-auto"
            style={{ pointerEvents: 'none' }}
            draggable={false}
          />
        </button>
      </div>

      {/* 테스트 로그인 버튼들 (오른쪽 아래, 개발 환경에서만 표시) */}
      {import.meta.env.DEV && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          opacity: '0.3',
          transition: 'opacity 0.2s',
        }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '0.3'}
        >
          {testUsers.map((user) => (
            <button
              key={user.userId}
              onClick={() => handleDevLogin(user.userId, user.name, user.userType)}
              className="px-3 py-2 rounded text-xs font-medium transition-all duration-200 hover:opacity-90 active:opacity-80"
              style={{
                backgroundColor: user.userType === 'EMPLOYER' ? '#769fcd' : '#f5f5f5',
                color: user.userType === 'EMPLOYER' ? 'white' : '#333',
                border: 'none',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {user.name} {user.userType === 'EMPLOYER' ? '(고용주)' : ''}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

