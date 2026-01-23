import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { HTTP_STATUS } from '../../../constants/auth';
import Swal from 'sweetalert2';

/*
테스트 시나리오

1. 초기 렌더링 - 처리 상태 메시지 표시
2. 에러 파라미터 처리 - error 파라미터 감지
3. code 파라미터 없음 처리
4. EMPLOYER 타입 사용자 - /employer로 이동
5. WORKER 타입 사용자 - /worker로 이동
6. 404 에러 - 회원가입 페이지로 이동
7. 401 에러 - 회원가입 페이지로 이동
8. 카카오 토큰 요청 실패
9. 서버 로그인 실패
10. success 필드 검증
11. accessToken 필드 검증
12. 에러 메시지 우선순위
13. 카카오 인증 토큰 요청 중 상태 메시지
*/

// Mock modules
vi.mock('../../../api/authApi');
vi.mock('sweetalert2');

// axios 모킹
vi.mock('axios', () => ({
  default: {
    post: vi.fn(),
    create: vi.fn(() => ({
      post: vi.fn(),
      get: vi.fn(),
      interceptors: {
        request: { use: vi.fn(), eject: vi.fn() },
        response: { use: vi.fn(), eject: vi.fn() },
      },
    })),
  },
}));

// react-router-dom 모킹
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => {
      const params = new URLSearchParams(window.location.search);
      return [params];
    },
  };
});

// Mock 환경 변수
vi.stubGlobal('import', {
  meta: {
    env: {
      VITE_KAKAO_REST_API_KEY: 'test-rest-api-key',
      VITE_KAKAO_REDIRECT_URI: 'http://localhost:3000/oauth/kakao/redirect',
      VITE_WAGEMANAGER: 'http://localhost:8080',
    },
  },
});

// Imports 수행
import KakaoRedirectPage from '../KakaoRedirect';
import * as authApi from '../../../api/authApi';
import axios from 'axios';

const axiosPostMock = axios.post as any;

// localStorage 모킹
const createLocalStorageMock = () => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
};

let localStorageMock: ReturnType<typeof createLocalStorageMock>;

beforeEach(() => {
  localStorageMock = createLocalStorageMock();
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true,
    configurable: true,
  });

  mockNavigate.mockClear();
  localStorageMock.clear();
  vi.clearAllMocks();
  (Swal.fire as any).mockResolvedValue({ isConfirmed: true });
});

afterEach(() => {
  vi.clearAllMocks();
  localStorageMock.clear();
  window.history.replaceState({}, '', '/');
});

describe('KakaoRedirectPage', () => {
  describe('초기 렌더링', () => {
    it('처리 상태를 표시하거나 에러 메시지를 표시한다', async () => {
      render(<KakaoRedirectPage />);
      
      // code 파라미터가 없으면 인증 코드 없음 메시지 표시
      // 또는 처리 중 상태 표시 (초기 렌더링 직후)
      await waitFor(() => {
        const text = screen.getByText((content, element) => {
          return (
            content.includes('처리 중') ||
            content.includes('인증 코드가 없습니다') ||
            content.includes('실패')
          );
        });
        expect(text).toBeInTheDocument();
      });
    });
  });

  describe('에러 파라미터 처리', () => {
    it('error 파라미터가 있으면 실패 메시지를 표시한다', async () => {
      window.history.replaceState({}, '', '?error=access_denied');
      render(<KakaoRedirectPage />);

      await waitFor(() => {
        expect(screen.getByText('로그인에 실패했습니다.')).toBeInTheDocument();
      });
    });
  });

  describe('code 파라미터 없음', () => {
    it('code가 없으면 인증 코드 없음 메시지를 표시한다', async () => {
      render(<KakaoRedirectPage />);

      await waitFor(() => {
        expect(screen.getByText('인증 코드가 없습니다.')).toBeInTheDocument();
      });
    });
  });

  describe('카카오 인증 성공 - 기존 회원', () => {
    beforeEach(() => {
      axiosPostMock.mockResolvedValue({
        data: { access_token: 'kakao-access-token' },
      });
    });

    it('EMPLOYER 타입 사용자는 /employer로 이동한다', async () => {
      (authApi.kakaoLoginWithToken as any).mockResolvedValue({
        success: true,
        data: {
          accessToken: 'backend-token',
          userType: 'EMPLOYER',
        },
      });

      window.history.replaceState({}, '', '?code=auth-code-123');
      render(<KakaoRedirectPage />);

      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith('token', 'backend-token');
        expect(mockNavigate).toHaveBeenCalledWith('/employer');
      });
    });

    it('WORKER 타입 사용자는 /worker로 이동한다', async () => {
      (authApi.kakaoLoginWithToken as any).mockResolvedValue({
        success: true,
        data: {
          accessToken: 'backend-token',
          userType: 'WORKER',
        },
      });

      window.history.replaceState({}, '', '?code=auth-code-123');
      render(<KakaoRedirectPage />);

      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith('token', 'backend-token');
        expect(mockNavigate).toHaveBeenCalledWith('/worker');
      });
    });
  });

  describe('신규 회원 처리', () => {
    beforeEach(() => {
      axiosPostMock.mockResolvedValue({
        data: { access_token: 'kakao-access-token' },
      });
    });

    it('404 에러인 경우 회원가입 페이지로 이동한다', async () => {
      (authApi.kakaoLoginWithToken as any).mockRejectedValue({
        response: {
          status: HTTP_STATUS.NOT_FOUND,
          data: { error: { message: 'User not found' } },
        },
      });

      window.history.replaceState({}, '', '?code=auth-code-123');
      render(<KakaoRedirectPage />);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/signup', {
          state: { kakaoAccessToken: 'kakao-access-token' },
        });
      });
    });

    it('401 에러인 경우 회원가입 페이지로 이동한다', async () => {
      (authApi.kakaoLoginWithToken as any).mockRejectedValue({
        response: {
          status: HTTP_STATUS.UNAUTHORIZED,
          data: { error: { message: 'Unauthorized' } },
        },
      });

      window.history.replaceState({}, '', '?code=auth-code-123');
      render(<KakaoRedirectPage />);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/signup', {
          state: { kakaoAccessToken: 'kakao-access-token' },
        });
      });
    });
  });

  describe('에러 처리', () => {
    it('카카오 토큰 요청 실패 시 에러 알림을 표시한다', async () => {
      axiosPostMock.mockRejectedValue({ message: 'Network error' });

      window.history.replaceState({}, '', '?code=auth-code-123');
      render(<KakaoRedirectPage />);

      await waitFor(() => {
        expect(Swal.fire).toHaveBeenCalledWith(
          expect.objectContaining({
            icon: 'error',
            title: '로그인 실패',
          })
        );
      });
    });

    it('서버 로그인 실패 시 에러 알림을 표시한다', async () => {
      axiosPostMock.mockResolvedValue({
        data: { access_token: 'kakao-access-token' },
      });

      (authApi.kakaoLoginWithToken as any).mockRejectedValue({
        response: {
          status: 500,
          data: { error: { message: 'Internal server error' } },
        },
      });

      window.history.replaceState({}, '', '?code=auth-code-123');
      render(<KakaoRedirectPage />);

      await waitFor(() => {
        expect(Swal.fire).toHaveBeenCalledWith(
          expect.objectContaining({
            icon: 'error',
            title: '로그인 실패',
          })
        );
      });
    });

    it('success가 false인 경우 에러 알림을 표시한다', async () => {
      axiosPostMock.mockResolvedValue({
        data: { access_token: 'kakao-access-token' },
      });

      (authApi.kakaoLoginWithToken as any).mockResolvedValue({
        success: false,
        error: { message: 'Login failed' },
      });

      window.history.replaceState({}, '', '?code=auth-code-123');
      render(<KakaoRedirectPage />);

      await waitFor(() => {
        expect(Swal.fire).toHaveBeenCalledWith(
          expect.objectContaining({
            icon: 'error',
            title: '로그인 실패',
          })
        );
      });
    });

    it('accessToken이 없는 경우 에러 알림을 표시한다', async () => {
      axiosPostMock.mockResolvedValue({
        data: { access_token: 'kakao-access-token' },
      });

      (authApi.kakaoLoginWithToken as any).mockResolvedValue({
        success: true,
        data: { userType: 'WORKER' },
      });

      window.history.replaceState({}, '', '?code=auth-code-123');
      render(<KakaoRedirectPage />);

      await waitFor(() => {
        expect(Swal.fire).toHaveBeenCalledWith(
          expect.objectContaining({
            icon: 'error',
            title: '로그인 실패',
          })
        );
      });
    });

    it('에러 메시지 우선순위에 따라 올바른 메시지를 표시한다', async () => {
      axiosPostMock.mockResolvedValue({
        data: { access_token: 'kakao-access-token' },
      });

      (authApi.kakaoLoginWithToken as any).mockRejectedValue({
        error: { message: 'Priority 1' },
        message: 'Priority 2',
        response: {
          status: 500,
          data: { message: 'Priority 3', error: { message: 'Priority 4' } },
        },
      });

      window.history.replaceState({}, '', '?code=auth-code-123');
      render(<KakaoRedirectPage />);

      await waitFor(() => {
        expect(Swal.fire).toHaveBeenCalledWith(
          expect.objectContaining({ text: 'Priority 1' })
        );
      });
    });
  });

  describe('상태 메시지', () => {
    beforeEach(() => {
      axiosPostMock.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () => resolve({ data: { access_token: 'kakao-access-token' } }),
              100
            )
          )
      );

      (authApi.kakaoLoginWithToken as any).mockResolvedValue({
        success: true,
        data: { accessToken: 'backend-token', userType: 'WORKER' },
      });
    });

    it('카카오 인증 토큰 요청 중 상태 메시지를 표시한다', async () => {
      window.history.replaceState({}, '', '?code=auth-code-123');
      render(<KakaoRedirectPage />);
      
      expect(screen.getByText('카카오 인증 토큰 요청 중...')).toBeInTheDocument();
    });
  });
});

