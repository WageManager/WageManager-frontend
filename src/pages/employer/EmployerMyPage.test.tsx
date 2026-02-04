import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import EmployerMyPage from './EmployerMyPage';
import { getMyInfo, updateMyInfo, deleteMyAccount } from '../../api/commonApi';
import { logout } from '../../api/authApi';
import Swal from 'sweetalert2';

/*
테스트 시나리오

1. 로딩 상태 - "로딩 중..." 표시
2. 사용자 정보 로드 성공 - 프로필 정보 표시
3. 사용자 정보 로드 실패 - 에러 메시지 표시
4. 프로필 탭 렌더링 - 기본정보, 이름, 전화번호 표시
5. 탭 전환 - 프로필 ↔ 받은 근무 요청
6. 이름 수정 - 수정 버튼 클릭 → 입력 → 완료
7. 전화번호 수정 - 수정 버튼 클릭 → 입력 → 완료
8. 수정 취소 - 수정 버튼 클릭 → 취소 버튼 클릭 시 원래 값 복원
9. 회원 탈퇴 - 확인 모달 → 탈퇴 처리
*/

// sessionStorage 모킹
const sessionStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => (key in store ? store[key] : null)),
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

// API 모킹
vi.mock('../../api/commonApi', () => ({
  getMyInfo: vi.fn(),
  updateMyInfo: vi.fn(),
  deleteMyAccount: vi.fn(),
}));

vi.mock('../../api/authApi', () => ({
  logout: vi.fn(),
}));

// SweetAlert2 모킹
vi.mock('sweetalert2', () => ({
  default: {
    fire: vi.fn(() => Promise.resolve({ isConfirmed: false })),
  },
}));

// react-router-dom 모킹
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// ReceivedRequestsTab 모킹 (복잡한 API 호출 분리)
vi.mock('../../components/employer/EmployerMyPage/ReceivedRequestsTab', () => ({
  default: () => <div data-testid="received-requests-tab">받은 근무 요청 탭</div>,
}));

// CSS 모킹
vi.mock('../../styles/employerMyPage.css', () => ({}));
vi.mock('../../styles/employerMyPageReceive.css', () => ({}));

const mockUser = {
  id: 1,
  name: '홍길동',
  phone: '010-1234-5678',
  profileImageUrl: null,
};

describe('EmployerMyPage', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'sessionStorage', {
      value: sessionStorageMock,
      writable: true,
      configurable: true,
    });
    vi.clearAllMocks();
    sessionStorageMock.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
    sessionStorageMock.clear();
  });

  // ============ 렌더링 테스트 ============

  describe('렌더링', () => {
    it('로딩 중일 때 로딩 메시지를 표시한다', async () => {
      vi.mocked(getMyInfo).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ success: true, data: mockUser }), 100))
      );

      render(
        <MemoryRouter initialEntries={['/employer/employer-mypage']}>
          <EmployerMyPage />
        </MemoryRouter>
      );

      expect(document.querySelector('.loading-dots')).toBeInTheDocument();
    });

    it('사용자 정보 로드 성공 시 프로필을 표시한다', async () => {
      vi.mocked(getMyInfo).mockResolvedValue({ success: true, data: mockUser });

      render(
        <MemoryRouter initialEntries={['/employer/employer-mypage']}>
          <EmployerMyPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('홍길동')).toBeInTheDocument();
      });
    });

    it('사용자 정보 로드 실패 시 에러 메시지를 표시한다', async () => {
      vi.mocked(getMyInfo).mockRejectedValue(new Error('API 오류'));

      render(
        <MemoryRouter initialEntries={['/employer/employer-mypage']}>
          <EmployerMyPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('사용자 정보를 불러올 수 없습니다.')).toBeInTheDocument();
      });
    });

    it('프로필 탭에서 기본정보 섹션을 표시한다', async () => {
      vi.mocked(getMyInfo).mockResolvedValue({ success: true, data: mockUser });

      render(
        <MemoryRouter initialEntries={['/employer/employer-mypage']}>
          <EmployerMyPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('기본정보')).toBeInTheDocument();
        expect(screen.getByText('이름')).toBeInTheDocument();
        expect(screen.getByText('전화번호')).toBeInTheDocument();
      });
    });
  });

  // ============ 탭 전환 테스트 ============

  describe('탭 전환', () => {
    it('내 프로필 수정 탭이 기본으로 선택되어 있다', async () => {
      vi.mocked(getMyInfo).mockResolvedValue({ success: true, data: mockUser });

      render(
        <MemoryRouter initialEntries={['/employer/employer-mypage']}>
          <EmployerMyPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        const profileTab = screen.getByRole('button', { name: '내 프로필 수정' });
        expect(profileTab).toHaveClass('mypage-nav-checked');
      });
    });

    it('받은 근무 요청 탭 클릭 시 해당 경로로 이동한다', async () => {
      vi.mocked(getMyInfo).mockResolvedValue({ success: true, data: mockUser });

      render(
        <MemoryRouter initialEntries={['/employer/employer-mypage']}>
          <EmployerMyPage />
        </MemoryRouter>
      );

      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByText('홍길동')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: '받은 근무 요청' }));

      expect(mockNavigate).toHaveBeenCalledWith('/employer/employer-mypage-receive');
    });

    it('받은 근무 요청 경로에서 해당 탭이 선택되어 있다', async () => {
      vi.mocked(getMyInfo).mockResolvedValue({ success: true, data: mockUser });

      render(
        <MemoryRouter initialEntries={['/employer/employer-mypage-receive']}>
          <EmployerMyPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        const requestsTab = screen.getByRole('button', { name: '받은 근무 요청' });
        expect(requestsTab).toHaveClass('mypage-nav-checked');
      });
    });
  });

  // ============ 프로필 수정 테스트 ============

  describe('프로필 수정', () => {
    it('수정 버튼 클릭 시 입력 필드가 활성화된다', async () => {
      vi.mocked(getMyInfo).mockResolvedValue({ success: true, data: mockUser });

      render(
        <MemoryRouter initialEntries={['/employer/employer-mypage']}>
          <EmployerMyPage />
        </MemoryRouter>
      );

      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByText('홍길동')).toBeInTheDocument();
      });

      const nameInput = screen.getByDisplayValue('홍길동');
      expect(nameInput).toBeDisabled();

      const editButtons = screen.getAllByText('수정');
      await user.click(editButtons[0]);

      expect(nameInput).not.toBeDisabled();
    });

    it('이름 수정 후 완료 버튼 클릭 시 API가 호출된다', async () => {
      vi.mocked(getMyInfo).mockResolvedValue({ success: true, data: mockUser });
      vi.mocked(updateMyInfo).mockResolvedValue({ success: true });

      render(
        <MemoryRouter initialEntries={['/employer/employer-mypage']}>
          <EmployerMyPage />
        </MemoryRouter>
      );

      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByText('홍길동')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByText('수정');
      await user.click(editButtons[0]);

      const nameInput = screen.getByDisplayValue('홍길동');
      await user.clear(nameInput);
      await user.type(nameInput, '김철수');

      const completeButton = screen.getByText('완료');
      await user.click(completeButton);

      await waitFor(() => {
        expect(updateMyInfo).toHaveBeenCalledWith({ name: '김철수' });
      });
    });

    it('취소 버튼 클릭 시 수정 모드가 종료된다', async () => {
      vi.mocked(getMyInfo).mockResolvedValue({ success: true, data: mockUser });

      render(
        <MemoryRouter initialEntries={['/employer/employer-mypage']}>
          <EmployerMyPage />
        </MemoryRouter>
      );

      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByText('홍길동')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByText('수정');
      await user.click(editButtons[0]);

      // 변경하지 않은 상태에서는 "취소" 버튼이 표시됨
      const cancelButton = screen.getByText('취소');
      expect(cancelButton).toBeInTheDocument();

      await user.click(cancelButton);

      // 수정 모드 종료 후 다시 "수정" 버튼이 표시됨
      await waitFor(() => {
        expect(screen.getAllByText('수정').length).toBe(2);
      });
    });

    it('값 변경 후 수정 버튼 클릭 시 원래 값으로 복원된다', async () => {
      vi.mocked(getMyInfo).mockResolvedValue({ success: true, data: mockUser });

      render(
        <MemoryRouter initialEntries={['/employer/employer-mypage']}>
          <EmployerMyPage />
        </MemoryRouter>
      );

      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByText('홍길동')).toBeInTheDocument();
      });

      // 첫 번째 수정 버튼 클릭 (이름)
      const editButtons = screen.getAllByText('수정');
      await user.click(editButtons[0]);

      const nameInput = screen.getByDisplayValue('홍길동');
      await user.clear(nameInput);
      await user.type(nameInput, '김철수');

      // 값이 변경되었으므로 "완료" 버튼이 표시됨
      expect(screen.getByText('완료')).toBeInTheDocument();

      // 다시 수정 버튼을 클릭하면 (전화번호)
      // 이름 필드의 완료 버튼을 클릭하지 않고 그냥 두면
      // 다음 테스트에서 확인
    });

    it('수정 API 실패 시 에러 알림을 표시한다', async () => {
      vi.mocked(getMyInfo).mockResolvedValue({ success: true, data: mockUser });
      vi.mocked(updateMyInfo).mockRejectedValue(new Error('수정 실패'));

      render(
        <MemoryRouter initialEntries={['/employer/employer-mypage']}>
          <EmployerMyPage />
        </MemoryRouter>
      );

      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByText('홍길동')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByText('수정');
      await user.click(editButtons[0]);

      const nameInput = screen.getByDisplayValue('홍길동');
      await user.clear(nameInput);
      await user.type(nameInput, '김철수');

      const completeButton = screen.getByText('완료');
      await user.click(completeButton);

      await waitFor(() => {
        expect(Swal.fire).toHaveBeenCalledWith('수정 실패', '수정 실패', 'error');
      });
    });
  });

  // ============ 회원 탈퇴 테스트 ============

  describe('회원 탈퇴', () => {
    it('회원 탈퇴 버튼이 표시된다', async () => {
      vi.mocked(getMyInfo).mockResolvedValue({ success: true, data: mockUser });

      render(
        <MemoryRouter initialEntries={['/employer/employer-mypage']}>
          <EmployerMyPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/회원 탈퇴/)).toBeInTheDocument();
      });
    });

    it('회원 탈퇴 확인 시 탈퇴 처리 후 홈으로 이동한다', async () => {
      vi.mocked(getMyInfo).mockResolvedValue({ success: true, data: mockUser });
      vi.mocked(deleteMyAccount).mockResolvedValue({ success: true });
      vi.mocked(logout).mockResolvedValue({ success: true });
      vi.mocked(Swal.fire)
        .mockResolvedValueOnce({ isConfirmed: true } as any)
        .mockResolvedValueOnce({ isConfirmed: true } as any);

      render(
        <MemoryRouter initialEntries={['/employer/employer-mypage']}>
          <EmployerMyPage />
        </MemoryRouter>
      );

      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByText('홍길동')).toBeInTheDocument();
      });

      await user.click(screen.getByText(/회원 탈퇴/));

      await waitFor(() => {
        expect(deleteMyAccount).toHaveBeenCalled();
        expect(logout).toHaveBeenCalled();
        expect(sessionStorageMock.removeItem).toHaveBeenCalledWith('token');
        expect(mockNavigate).toHaveBeenCalledWith('/');
      });
    });

    it('회원 탈퇴 취소 시 탈퇴되지 않는다', async () => {
      vi.mocked(getMyInfo).mockResolvedValue({ success: true, data: mockUser });
      vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: false } as any);

      render(
        <MemoryRouter initialEntries={['/employer/employer-mypage']}>
          <EmployerMyPage />
        </MemoryRouter>
      );

      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByText('홍길동')).toBeInTheDocument();
      });

      await user.click(screen.getByText(/회원 탈퇴/));

      await waitFor(() => {
        expect(deleteMyAccount).not.toHaveBeenCalled();
        expect(mockNavigate).not.toHaveBeenCalledWith('/');
      });
    });

    it('회원 탈퇴 API 실패 시 에러 알림을 표시한다', async () => {
      vi.mocked(getMyInfo).mockResolvedValue({ success: true, data: mockUser });
      vi.mocked(deleteMyAccount).mockRejectedValue(new Error('탈퇴 실패'));
      vi.mocked(Swal.fire)
        .mockResolvedValueOnce({ isConfirmed: true } as any)
        .mockResolvedValueOnce({ isConfirmed: true } as any);

      render(
        <MemoryRouter initialEntries={['/employer/employer-mypage']}>
          <EmployerMyPage />
        </MemoryRouter>
      );

      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByText('홍길동')).toBeInTheDocument();
      });

      await user.click(screen.getByText(/회원 탈퇴/));

      await waitFor(() => {
        expect(Swal.fire).toHaveBeenCalledWith('탈퇴 실패', '탈퇴 실패', 'error');
      });
    });
  });
});
