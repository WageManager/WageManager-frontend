import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import LoginPage from '../LoginPage';
import { devLogin } from '../../../api/authApi';
import Swal from 'sweetalert2';

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
    vi.clearAllMocks();
    localStorage.clear();
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
      expect(localStorage.getItem('token')).toBe('fake-access-token');
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

  it('개발자 로그인 실패 시 에러 알림(Swal)을 띄운다', async () => {
    vi.mocked(devLogin).mockResolvedValue({
      success: false,
      error: { message: '로그인 실패함' },
    }as any);

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
});