import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/auth/useAuth';
import LoadingDots from '../common/LoadingDots';

interface PublicRouteProps {
  children: React.ReactNode;
}

/**
 * 공개 라우트 보호 컴포넌트
 * 이미 로그인된 사용자가 공개 페이지(/, /signup)에 접근 시
 * 역할에 맞는 메인 페이지로 리다이렉트합니다.
 *
 * @param children - 보호할 컴포넌트 (LoginPage, SignupPage 등)
 *
 * 동작:
 * - 로딩 중: LoadingDots 표시
 * - 인증됨: userType에 따라 /worker 또는 /employer로 리다이렉트
 * - 미인증: children 렌더링 (공개 페이지 표시)
 */
export default function PublicRoute({ children }: PublicRouteProps) {
  const { isAuthenticated, isLoading, userType } = useAuth();

  // 로딩 중
  if (isLoading) {
    return <LoadingDots fillParent />;
  }

  // 이미 인증된 사용자 → 역할에 맞는 페이지로 리다이렉트
  if (isAuthenticated) {
    const redirectPath = userType === 'EMPLOYER' ? '/employer' : '/worker';
    return <Navigate to={redirectPath} replace />;
  }

  // 미인증 사용자 → 공개 페이지 표시
  return <>{children}</>;
}
