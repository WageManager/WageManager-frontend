import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import LoginPage from '../LoginPage';
import { devLogin } from '../../../api/authApi';
import Swal from 'sweetalert2';

/*
테스트 시나리오

1. 페이지 렌더링 - "PayCheck" 제목과 로그인 버튼 표시
2. 근로자 로그인 성공 - 토큰 저장 후 /worker로 이동
3. 고용주 로그인 성공 - /employer로 이동
4. success=false 응답 - 에러 알림 표시
5. accessToken 없음 - 에러 알림 표시
6. API 호출 실패 - 네트워크 오류 에러 알림 표시
7. 로그인 후 토큰 저장 - localStorage에 토큰 저장 확인
*/

// localStorage 모킹
const localStorageMock = (() => {
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
})();

// 1. API 모킹
vi.mock('../../../api/authApi', () => ({
  devLogin: vi.fn(),
}));

// 2. SweetAlert2 모킹
vi.mock('sweetalert2', () => ({
  default: {
    fire: vi.fn(() => Promise.resolve({ isConfirmed: true })),
  },
}));

// 3. react-router-dom 모킹
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// 4. 하위 컴포넌트 모킹
vi.mock('../components/KakaoLoginButton', () => ({
  default: () => <button>카카오 로그인 버튼</button>,
}));

vi.mock('../components/DevLoginPanel', () => ({
  default: ({ onDevLogin }: { onDevLogin: (id: number, name: string, type: string) => void }) => (
    <div>
      <button onClick={() => onDevLogin(1, '테스트유저', 'WORKER')}>
        개발자 근로자 로그인
      </button>
      <button onClick={() => onDevLogin(2, '테스트사장', 'EMPLOYER')}>
        개발자 고용주 로그인
      </button>
    </div>
  ),
}));

describe('LoginPage', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
      configurable: true,
    });
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  it('페이지 요소들이 정상적으로 렌더링된다', () => {
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );
    expect(screen.getByText('PayCheck')).toBeInTheDocument();
    expect(screen.getByText('카카오 로그인 버튼')).toBeInTheDocument();
    expect(screen.getByText('개발자 근로자 로그인')).toBeInTheDocument();
  });

  it('개발자 로그인 성공 시 (근로자) 토큰 저장 후 /worker로 이동한다', async () => {
    vi.mocked(devLogin).mockResolvedValue({
      success: true,
      data: { accessToken: 'fake-access-token', userType: 'WORKER' },
    });

    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );
    const user = userEvent.setup();

    await user.click(screen.getByText('개발자 근로자 로그인'));

    await waitFor(() => {
      expect(devLogin).toHaveBeenCalledWith(1, '테스트유저', 'WORKER');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('token', 'fake-access-token');
      expect(mockNavigate).toHaveBeenCalledWith('/worker');
    });
  });

  it('개발자 로그인 성공 시 (고용주) /employer로 이동한다', async () => {
    vi.mocked(devLogin).mockResolvedValue({
      success: true,
      data: { accessToken: 'fake-access-token', userType: 'EMPLOYER' },
    });

    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );
    const user = userEvent.setup();

    await user.click(screen.getByText('개발자 고용주 로그인'));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/employer');
    });
  });

  it('success가 false인 경우 에러 알림을 띄운다', async () => {
    vi.mocked(devLogin).mockResolvedValue({
      success: false,
      error: { message: '로그인 실패함' },
    } as any);

    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );
    const user = userEvent.setup();

    await user.click(screen.getByText('개발자 근로자 로그인'));

    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({
        icon: 'error',
        title: '로그인 실패',
        text: '로그인 실패함',
      }));
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  it('accessToken이 없는 경우 에러 알림을 띄운다', async () => {
    vi.mocked(devLogin).mockResolvedValue({
      success: true,
      data: { userType: 'WORKER' },
    } as any);

    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );
    const user = userEvent.setup();

    await user.click(screen.getByText('개발자 근로자 로그인'));

    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({
        icon: 'error',
        title: '로그인 실패',
      }));
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  it('API 호출 실패 시 에러 알림을 띄운다', async () => {
    vi.mocked(devLogin).mockRejectedValue(new Error('네트워크 오류'));

    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );
    const user = userEvent.setup();

    await user.click(screen.getByText('개발자 근로자 로그인'));

    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({
        icon: 'error',
        title: '로그인 실패',
        text: '네트워크 오류',
      }));
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  it('로그인 후 localStorage에 토큰이 저장된다', async () => {
    vi.mocked(devLogin).mockResolvedValue({
      success: true,
      data: { accessToken: 'test-token-12345', userType: 'WORKER' },
    });

    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );
    const user = userEvent.setup();

    await user.click(screen.getByText('개발자 근로자 로그인'));

    await waitFor(() => {
      expect(localStorageMock.setItem).toHaveBeenCalledWith('token', 'test-token-12345');
    });
  });
});