import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import SignupPage from '../SignupPage';

// API 모킹
vi.mock('../../api/authApi', () => ({
  kakaoRegister: vi.fn(),
}));

// SweetAlert2 모킹
vi.mock('sweetalert2', () => ({
  default: {
    fire: vi.fn(() => Promise.resolve({ isConfirmed: true })),
  },
}));

// react-router-dom의 useLocation, useNavigate 모킹
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({
      state: { kakaoAccessToken: 'test-kakao-token' },
    }),
  };
});

// CSS 모킹 (jsdom에서 CSS import 에러 방지)
vi.mock('./SignupPage.css', () => ({}));

/**
 * SignupPage 컴포넌트 테스트
 *
 * 테스트 범위:
 * 1. 컴포넌트 렌더링
 * 2. 이름 유효성 검사 (2자 이상)
 * 3. 전화번호 자동 포맷팅 및 유효성 검사
 * 4. 역할(userType) 선택
 * 5. 가입하기 버튼 활성화/비활성화
 * 6. API 호출 및 에러 처리
 */

// 테스트용 래퍼 컴포넌트
const renderSignupPage = () => {
  return render(
    <BrowserRouter>
      <SignupPage />
    </BrowserRouter>
  );
};

describe('SignupPage 렌더링', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('회원가입 페이지가 정상적으로 렌더링된다', () => {
    renderSignupPage();

    expect(screen.getByText('회원가입')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('이름을 입력해주세요')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('010-1234-5678')).toBeInTheDocument();
    expect(screen.getByText('근로자')).toBeInTheDocument();
    expect(screen.getByText('고용주')).toBeInTheDocument();
    expect(screen.getByText('가입하기')).toBeInTheDocument();
  });

  it('닫기 버튼 클릭 시 홈으로 이동한다', async () => {
    renderSignupPage();

    const closeButton = screen.getByRole('button', { name: '' }); // FaTimes 아이콘 버튼
    const buttons = screen.getAllByRole('button');
    const closeBtn = buttons.find(btn => btn.classList.contains('close-button'));

    if (closeBtn) {
      fireEvent.click(closeBtn);
      expect(mockNavigate).toHaveBeenCalledWith('/');
    }
  });
});

describe('이름 유효성 검사', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('이름이 1자일 때 에러 메시지가 표시된다', async () => {
    renderSignupPage();
    const user = userEvent.setup();

    const nameInput = screen.getByPlaceholderText('이름을 입력해주세요');
    await user.type(nameInput, '홍');

    expect(screen.getByText('이름은 2자 이상 입력해주세요.')).toBeInTheDocument();
  });

  it('이름이 2자 이상일 때 에러 메시지가 표시되지 않는다', async () => {
    renderSignupPage();
    const user = userEvent.setup();

    const nameInput = screen.getByPlaceholderText('이름을 입력해주세요');
    await user.type(nameInput, '홍길동');

    expect(screen.queryByText('이름은 2자 이상 입력해주세요.')).not.toBeInTheDocument();
  });

  it('이름이 공백만 있을 때 에러 메시지가 표시된다', async () => {
    renderSignupPage();
    const user = userEvent.setup();

    const nameInput = screen.getByPlaceholderText('이름을 입력해주세요');
    await user.type(nameInput, '   ');

    expect(screen.getByText('이름은 2자 이상 입력해주세요.')).toBeInTheDocument();
  });
});

describe('전화번호 입력 및 유효성 검사', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('숫자만 입력하면 자동으로 하이픈이 추가된다', async () => {
    renderSignupPage();
    const user = userEvent.setup();

    const phoneInput = screen.getByPlaceholderText('010-1234-5678');
    await user.type(phoneInput, '01012345678');

    expect(phoneInput).toHaveValue('010-1234-5678');
  });

  it('문자를 입력해도 숫자만 남는다', async () => {
    renderSignupPage();
    const user = userEvent.setup();

    const phoneInput = screen.getByPlaceholderText('010-1234-5678');
    await user.type(phoneInput, '010abc1234xyz5678');

    expect(phoneInput).toHaveValue('010-1234-5678');
  });

  it('전화번호가 불완전할 때 에러 메시지가 표시된다', async () => {
    renderSignupPage();
    const user = userEvent.setup();

    const phoneInput = screen.getByPlaceholderText('010-1234-5678');
    await user.type(phoneInput, '0101234');

    expect(screen.getByText('전화번호는 010-1234-5678 형식으로 입력해주세요.')).toBeInTheDocument();
  });

  it('전화번호가 완전할 때 에러 메시지가 표시되지 않는다', async () => {
    renderSignupPage();
    const user = userEvent.setup();

    const phoneInput = screen.getByPlaceholderText('010-1234-5678');
    await user.type(phoneInput, '01012345678');

    expect(screen.queryByText('전화번호는 010-1234-5678 형식으로 입력해주세요.')).not.toBeInTheDocument();
  });
});

describe('역할(userType) 선택', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('근로자를 선택할 수 있다', async () => {
    renderSignupPage();
    const user = userEvent.setup();

    const workerRadio = screen.getByLabelText('근로자');
    await user.click(workerRadio);

    expect(workerRadio).toBeChecked();
  });

  it('고용주를 선택할 수 있다', async () => {
    renderSignupPage();
    const user = userEvent.setup();

    const employerRadio = screen.getByLabelText('고용주');
    await user.click(employerRadio);

    expect(employerRadio).toBeChecked();
  });

  it('역할은 하나만 선택할 수 있다 (라디오 버튼)', async () => {
    renderSignupPage();
    const user = userEvent.setup();

    const workerRadio = screen.getByLabelText('근로자');
    const employerRadio = screen.getByLabelText('고용주');

    await user.click(workerRadio);
    expect(workerRadio).toBeChecked();
    expect(employerRadio).not.toBeChecked();

    await user.click(employerRadio);
    expect(workerRadio).not.toBeChecked();
    expect(employerRadio).toBeChecked();
  });
});

describe('가입하기 버튼 활성화/비활성화', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('모든 필드가 비어있으면 버튼이 비활성화된다', () => {
    renderSignupPage();

    const submitButton = screen.getByText('가입하기');
    expect(submitButton).toBeDisabled();
  });

  it('이름만 입력하면 버튼이 비활성화 상태를 유지한다', async () => {
    renderSignupPage();
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText('이름을 입력해주세요'), '홍길동');

    const submitButton = screen.getByText('가입하기');
    expect(submitButton).toBeDisabled();
  });

  it('이름과 전화번호만 입력하면 버튼이 비활성화 상태를 유지한다', async () => {
    renderSignupPage();
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText('이름을 입력해주세요'), '홍길동');
    await user.type(screen.getByPlaceholderText('010-1234-5678'), '01012345678');

    const submitButton = screen.getByText('가입하기');
    expect(submitButton).toBeDisabled();
  });

  it('모든 필드가 유효하면 버튼이 활성화된다', async () => {
    renderSignupPage();
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText('이름을 입력해주세요'), '홍길동');
    await user.type(screen.getByPlaceholderText('010-1234-5678'), '01012345678');
    await user.click(screen.getByLabelText('근로자'));

    const submitButton = screen.getByText('가입하기');
    expect(submitButton).not.toBeDisabled();
  });

  it('유효하지 않은 이름이면 버튼이 비활성화된다', async () => {
    renderSignupPage();
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText('이름을 입력해주세요'), '홍'); // 1자
    await user.type(screen.getByPlaceholderText('010-1234-5678'), '01012345678');
    await user.click(screen.getByLabelText('근로자'));

    const submitButton = screen.getByText('가입하기');
    expect(submitButton).toBeDisabled();
  });
});

describe('API 호출', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('가입하기 버튼 클릭 시 kakaoRegister API가 호출된다', async () => {
    const { kakaoRegister } = await import('../../api/authApi');
    (kakaoRegister as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
      data: { accessToken: 'test-token', userType: 'WORKER' },
    });

    renderSignupPage();
    const user = userEvent.setup();

    // 폼 입력
    await user.type(screen.getByPlaceholderText('이름을 입력해주세요'), '홍길동');
    await user.type(screen.getByPlaceholderText('010-1234-5678'), '01012345678');
    await user.click(screen.getByLabelText('근로자'));

    // 가입하기 버튼 클릭
    await user.click(screen.getByText('가입하기'));

    // API 호출 확인
    await waitFor(() => {
      expect(kakaoRegister).toHaveBeenCalledWith({
        kakaoAccessToken: 'test-kakao-token',
        userType: 'WORKER',
        phone: '010-1234-5678',
        bankName: '',
        accountNumber: '',
        profileImageUrl: '',
      });
    });
  });
});
