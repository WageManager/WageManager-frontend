import { useLocation, Navigate } from 'react-router-dom';
import SignupForm from './components/SignupForm';
import './SignupPage.css';

export default function SignupPage() {
  const location = useLocation();
  const { kakaoAccessToken } = location.state || {};

  return (
    <div className="signup-container">
      <SignupForm kakaoAccessToken={kakaoAccessToken} />
    </div>
  );
}