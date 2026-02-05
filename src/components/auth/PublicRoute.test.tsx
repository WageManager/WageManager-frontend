import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import PublicRoute from './PublicRoute';

// useAuth 훅 모킹
vi.mock('../../hooks/auth/useAuth', () => ({
  useAuth: vi.fn(),
}));

// 테스트용 컴포넌트
const LoginPage = () => <div>Login Page</div>;
const WorkerPage = () => <div>Worker Page</div>;
const EmployerPage = () => <div>Employer Page</div>;

// 테스트 헬퍼 함수
const renderWithRouter = (initialRoute = '/') => {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <Routes>
        <Route
          path="/"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route path="/worker" element={<WorkerPage />} />
        <Route path="/employer" element={<EmployerPage />} />
      </Routes>
    </MemoryRouter>
  );
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('PublicRoute', () => {
  it('로딩 중일 때 LoadingDots를 표시한다', async () => {
    // Given: 로딩 중인 상태
    const { useAuth } = await import('../../hooks/auth/useAuth');
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
      userType: null,
    });

    // When: PublicRoute 렌더링
    renderWithRouter();

    // Then: 로딩 인디케이터 표시
    const loadingElement = document.querySelector('.loading-dots');
    expect(loadingElement).toBeInTheDocument();
  });

  it('미인증 사용자는 공개 페이지를 볼 수 있다', async () => {
    // Given: 미인증 상태
    const { useAuth } = await import('../../hooks/auth/useAuth');
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      userType: null,
    });

    // When: PublicRoute 렌더링
    renderWithRouter();

    // Then: 로그인 페이지 표시
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('WORKER로 로그인된 사용자는 /worker로 리다이렉트된다', async () => {
    // Given: WORKER로 인증된 상태
    const { useAuth } = await import('../../hooks/auth/useAuth');
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      userType: 'WORKER',
    });

    // When: PublicRoute 렌더링
    renderWithRouter();

    // Then: /worker로 리다이렉트
    expect(screen.getByText('Worker Page')).toBeInTheDocument();
  });

  it('EMPLOYER로 로그인된 사용자는 /employer로 리다이렉트된다', async () => {
    // Given: EMPLOYER로 인증된 상태
    const { useAuth } = await import('../../hooks/auth/useAuth');
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      userType: 'EMPLOYER',
    });

    // When: PublicRoute 렌더링
    renderWithRouter();

    // Then: /employer로 리다이렉트
    expect(screen.getByText('Employer Page')).toBeInTheDocument();
  });

  it('userType이 null인 인증 사용자는 /worker로 리다이렉트된다', async () => {
    // Given: 인증됐지만 userType이 null인 상태 (비정상 케이스)
    const { useAuth } = await import('../../hooks/auth/useAuth');
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      userType: null,
    });

    // When: PublicRoute 렌더링
    renderWithRouter();

    // Then: /worker로 리다이렉트 (기본값)
    expect(screen.getByText('Worker Page')).toBeInTheDocument();
  });
});
