import { useLocation, Navigate } from 'react-router-dom';
import SignupForm from '../../components/auth/SignupForm';
import './SignupPage.css';

export default function SignupPage() {
  const location = useLocation();
  const { kakaoAccessToken } = location.state || {};

  // 사용자가 카카오 액세스 토큰 없이 직접 접근하는 것(/signup) 방지 
  // -> 화면 테스트할땐 지우시면 됩니다!
  if (!kakaoAccessToken) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="signup-container">
      <SignupForm kakaoAccessToken={kakaoAccessToken} />
    </div>
  );
}