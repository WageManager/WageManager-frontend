import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/auth/useAuth';
import LoadingDots from '../common/LoadingDots';
import type { UserType } from '../../types/auth';

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: UserType[]; // 미지정 시 인증만 확인
}

/**
 * 인증 및 역할 기반 라우트 보호 컴포넌트
 *
 * @param children - 보호할 컴포넌트
 * @param allowedRoles - 허용된 사용자 역할 배열 (미지정 시 인증만 확인)
 *
 * 동작:
 * - 로딩 중: LoadingDots 표시
 * - 미인증: 로그인 페이지('/')로 리다이렉트
 * - 역할 불일치: 올바른 역할 경로로 리다이렉트
 * - 인증 완료 + 역할 일치: children 렌더링
 */
export default function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const { isAuthenticated, isLoading, userType } = useAuth();

  // 로딩 중
  if (isLoading) {
    return <LoadingDots fillParent />;
  }

  // 미인증 → 로그인 페이지로
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // 역할 제한이 있는 경우 역할 확인
  if (allowedRoles && allowedRoles.length > 0) {
    // userType이 없거나 허용된 역할에 포함되지 않으면
    if (!userType || !allowedRoles.includes(userType)) {
      // 올바른 역할 경로로 리다이렉트
      const redirectPath = userType === 'EMPLOYER' ? '/employer' : '/worker';
      return <Navigate to={redirectPath} replace />;
    }
  }

  // 인증 완료 + 역할 일치 → children 렌더링
  return <>{children}</>;
}
