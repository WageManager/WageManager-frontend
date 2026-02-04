import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import AuthGuard from './AuthGuard';

// useAuth 훅 모킹
vi.mock('../../hooks/auth/useAuth', () => ({
  useAuth: vi.fn(),
}));

// 테스트용 컴포넌트
const TestChild = () => <div>Protected Content</div>;
const LoginPage = () => <div>Login Page</div>;
const WorkerPage = () => <div>Worker Page</div>;
const EmployerPage = () => <div>Employer Page</div>;

// 테스트 헬퍼 함수
const renderWithRouter = (
  allowedRoles?: ('WORKER' | 'EMPLOYER')[],
  initialRoute = '/protected'
) => {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/worker" element={<WorkerPage />} />
        <Route path="/employer" element={<EmployerPage />} />
        <Route
          path="/protected"
          element={
            <AuthGuard allowedRoles={allowedRoles}>
              <TestChild />
            </AuthGuard>
          }
        />
      </Routes>
    </MemoryRouter>
  );
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('AuthGuard', () => {
  it('로딩 중일 때 LoadingDots를 표시한다', async () => {
    // Given: 로딩 중인 상태
    const { useAuth } = await import('../../hooks/auth/useAuth');
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
      userType: null,
    });

    // When: AuthGuard 렌더링
    renderWithRouter();

    // Then: 로딩 인디케이터 표시 (LoadingDots 클래스 확인)
    const loadingElement = document.querySelector('.loading-dots');
    expect(loadingElement).toBeInTheDocument();
  });

  it('미인증 사용자는 로그인 페이지로 리다이렉트된다', async () => {
    // Given: 미인증 상태
    const { useAuth } = await import('../../hooks/auth/useAuth');
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      userType: null,
    });

    // When: AuthGuard 렌더링
    renderWithRouter();

    // Then: 로그인 페이지로 리다이렉트
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('인증된 사용자는 children을 볼 수 있다 (역할 제한 없음)', async () => {
    // Given: 인증된 상태, 역할 제한 없음
    const { useAuth } = await import('../../hooks/auth/useAuth');
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      userType: 'WORKER',
    });

    // When: AuthGuard 렌더링 (allowedRoles 미지정)
    renderWithRouter();

    // Then: 보호된 컨텐츠 표시
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('WORKER 역할이 WORKER 전용 페이지에 접근할 수 있다', async () => {
    // Given: WORKER로 인증된 상태
    const { useAuth } = await import('../../hooks/auth/useAuth');
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      userType: 'WORKER',
    });

    // When: WORKER 전용 AuthGuard 렌더링
    renderWithRouter(['WORKER']);

    // Then: 보호된 컨텐츠 표시
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('EMPLOYER 역할이 EMPLOYER 전용 페이지에 접근할 수 있다', async () => {
    // Given: EMPLOYER로 인증된 상태
    const { useAuth } = await import('../../hooks/auth/useAuth');
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      userType: 'EMPLOYER',
    });

    // When: EMPLOYER 전용 AuthGuard 렌더링
    renderWithRouter(['EMPLOYER']);

    // Then: 보호된 컨텐츠 표시
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('WORKER가 EMPLOYER 전용 페이지 접근 시 /worker로 리다이렉트된다', async () => {
    // Given: WORKER로 인증된 상태
    const { useAuth } = await import('../../hooks/auth/useAuth');
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      userType: 'WORKER',
    });

    // When: EMPLOYER 전용 AuthGuard 렌더링
    renderWithRouter(['EMPLOYER']);

    // Then: /worker로 리다이렉트
    expect(screen.getByText('Worker Page')).toBeInTheDocument();
  });

  it('EMPLOYER가 WORKER 전용 페이지 접근 시 /employer로 리다이렉트된다', async () => {
    // Given: EMPLOYER로 인증된 상태
    const { useAuth } = await import('../../hooks/auth/useAuth');
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      userType: 'EMPLOYER',
    });

    // When: WORKER 전용 AuthGuard 렌더링
    renderWithRouter(['WORKER']);

    // Then: /employer로 리다이렉트
    expect(screen.getByText('Employer Page')).toBeInTheDocument();
  });

  it('userType이 null인 인증 사용자는 /worker로 리다이렉트된다 (역할 불일치)', async () => {
    // Given: 인증됐지만 userType이 null인 상태 (비정상 케이스)
    const { useAuth } = await import('../../hooks/auth/useAuth');
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      userType: null,
    });

    // When: 역할 제한이 있는 AuthGuard 렌더링
    renderWithRouter(['WORKER']);

    // Then: /worker로 리다이렉트 (기본값)
    expect(screen.getByText('Worker Page')).toBeInTheDocument();
  });
});
