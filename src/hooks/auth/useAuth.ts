import { useState, useEffect } from 'react';
import { getUserProfile } from '../../api/userApi';
import type { AuthState, UserType } from '../../types/auth';

/**
 * 인증 상태를 관리하는 훅
 * - sessionStorage의 토큰 존재 여부 확인
 * - getUserProfile() API 호출로 토큰 유효성 검증
 * - userType 반환
 *
 * @returns AuthState - { isAuthenticated, isLoading, userType }
 */
export const useAuth = (): AuthState => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    userType: null,
  });

  useEffect(() => {
    const verifyAuth = async () => {
      const token = sessionStorage.getItem('token');

      // 토큰이 없으면 인증되지 않은 상태
      if (!token) {
        setAuthState({
          isAuthenticated: false,
          isLoading: false,
          userType: null,
        });
        return;
      }

      // 토큰이 있으면 API로 유효성 검증
      try {
        const response = await getUserProfile();

        if (response.success && response.data) {
          setAuthState({
            isAuthenticated: true,
            isLoading: false,
            userType: response.data.userType as UserType,
          });
        } else {
          // API 응답이 success=false인 경우
          setAuthState({
            isAuthenticated: false,
            isLoading: false,
            userType: null,
          });
        }
      } catch {
        // API 호출 실패 시 (401 등)
        // axios 인터셉터가 401을 처리하고 자동으로 '/'로 리다이렉트할 수 있음
        // 여기서는 로딩 상태만 종료
        setAuthState({
          isAuthenticated: false,
          isLoading: false,
          userType: null,
        });
      }
    };

    verifyAuth();
  }, []);

  return authState;
};
