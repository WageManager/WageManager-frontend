/**
 * WorkerMyPage 페이지 테스트
 * - 초기 로딩 상태
 * - 탭 전환
 * - 사용자 정보 표시
 * - 에러 처리
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WorkerMyPage from './WorkerMyPage';

// ============ 모킹 설정 ============

// useUserData 훅 모킹
const mockUpdateUser = vi.fn();
vi.mock('../../hooks/worker/useMyPage/useUserData', () => ({
  useUserData: vi.fn(),
}));

// useWorkplaces 훅 모킹
vi.mock('../../hooks/worker/useMyPage/useWorkplaces', () => ({
  useWorkplaces: vi.fn(),
}));

// useEditRequests 훅 모킹
vi.mock('../../hooks/worker/useMyPage/useEditRequests', () => ({
  useEditRequests: vi.fn(),
}));

// ============ 테스트 데이터 ============

const mockUser = {
  id: 1,
  name: '홍길동',
  kakaoId: 'hong123',
  phone: '010-1234-5678',
  role: 'WORKER',
  profileImageUrl: 'https://example.com/profile.jpg',
};

const mockWorker = {
  id: 1,
  bankName: '국민은행',
  accountNumber: '12345678901234',
  workerCode: 'WK001',
};

const mockWorkplaces = [
  {
    workplaceName: '카페A',
    hourlyWage: 10000,
    startDate: '2024년 1월 15일',
  },
];

const mockPreviousWorkplaces = [
  {
    workplaceName: '편의점B',
    hourlyWage: 9860,
    startDate: '2023년 6월 1일',
    endDate: '2023년 12월 31일',
  },
];

const mockEditRequests = [
  {
    place: '카페A',
    date: '3월 15일',
    startTime: '09:00',
    endTime: '14:00',
    status: 'pending',
  },
];

// ============ 헬퍼 함수 ============

const setupMocks = async (options: {
  isLoadingUser?: boolean;
  isLoadingWorkplaces?: boolean;
  isLoadingEditRequests?: boolean;
  user?: typeof mockUser | null;
  worker?: typeof mockWorker | null;
} = {}) => {
  const {
    isLoadingUser = false,
    isLoadingWorkplaces = false,
    isLoadingEditRequests = false,
    user = mockUser,
    worker = mockWorker,
  } = options;

  const { useUserData } = await import('../../hooks/worker/useMyPage/useUserData');
  const { useWorkplaces } = await import('../../hooks/worker/useMyPage/useWorkplaces');
  const { useEditRequests } = await import('../../hooks/worker/useMyPage/useEditRequests');

  (useUserData as ReturnType<typeof vi.fn>).mockReturnValue({
    user,
    worker,
    isLoading: isLoadingUser,
    updateUser: mockUpdateUser,
  });

  (useWorkplaces as ReturnType<typeof vi.fn>).mockReturnValue({
    workplaces: mockWorkplaces,
    previousWorkplaces: mockPreviousWorkplaces,
    isLoading: isLoadingWorkplaces,
  });

  (useEditRequests as ReturnType<typeof vi.fn>).mockReturnValue({
    editRequests: mockEditRequests,
    isLoading: isLoadingEditRequests,
  });
};

// ============ 테스트 ============

describe('WorkerMyPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('초기 로딩 상태', () => {
    it('사용자 정보 로딩 중일 때 로딩 인디케이터가 표시된다', async () => {
      await setupMocks({ isLoadingUser: true });

      render(<WorkerMyPage />);

      const loadingDots = document.querySelector('.loading-dots');
      expect(loadingDots).toBeInTheDocument();
    });

    it('로딩 중일 때 프로필 박스가 표시되지 않는다', async () => {
      await setupMocks({ isLoadingUser: true });

      render(<WorkerMyPage />);

      expect(screen.queryByText('내 프로필 수정')).not.toBeInTheDocument();
    });
  });

  describe('사용자 정보 없음', () => {
    it('사용자 정보가 없으면 에러 메시지가 표시된다', async () => {
      await setupMocks({ user: null });

      render(<WorkerMyPage />);

      expect(screen.getByText('사용자 정보를 불러올 수 없습니다.')).toBeInTheDocument();
    });
  });

  describe('정상 렌더링', () => {
    it('사용자 정보 로드 성공 시 프로필 박스가 표시된다', async () => {
      await setupMocks();

      render(<WorkerMyPage />);

      // 홍길동이 ProfileBox와 ProfileEdit 두 곳에 표시됨
      const nameElements = screen.getAllByText('홍길동');
      expect(nameElements.length).toBe(2);
      expect(screen.getByText('내 프로필 수정')).toBeInTheDocument();
      expect(screen.getByText('근무지 관리')).toBeInTheDocument();
      expect(screen.getByText('보낸 근무 요청')).toBeInTheDocument();
    });

    it('기본적으로 프로필 탭이 활성화된다', async () => {
      await setupMocks();

      render(<WorkerMyPage />);

      // ProfileEdit 컴포넌트의 타이틀
      expect(screen.getByText('기본 정보')).toBeInTheDocument();
    });

    it('프로필 이미지가 표시된다', async () => {
      await setupMocks();

      render(<WorkerMyPage />);

      const profileImage = screen.getByAltText('프로필');
      expect(profileImage).toBeInTheDocument();
    });
  });

  describe('탭 전환', () => {
    it('근무지 관리 탭 클릭 시 근무지 목록이 표시된다', async () => {
      const user = userEvent.setup();
      await setupMocks();

      render(<WorkerMyPage />);

      await user.click(screen.getByText('근무지 관리'));

      await waitFor(() => {
        expect(screen.getByText('근무지 정보')).toBeInTheDocument();
        expect(screen.getByText('카페A')).toBeInTheDocument();
      });
    });

    it('보낸 근무 요청 탭 클릭 시 요청 목록이 표시된다', async () => {
      const user = userEvent.setup();
      await setupMocks();

      render(<WorkerMyPage />);

      await user.click(screen.getByText('보낸 근무 요청'));

      await waitFor(() => {
        expect(screen.getByText('3월 15일')).toBeInTheDocument();
        expect(screen.getByText('대기중')).toBeInTheDocument();
      });
    });

    it('프로필 탭으로 다시 전환할 수 있다', async () => {
      const user = userEvent.setup();
      await setupMocks();

      render(<WorkerMyPage />);

      // 근무지 관리로 이동
      await user.click(screen.getByText('근무지 관리'));
      await waitFor(() => {
        expect(screen.getByText('근무지 정보')).toBeInTheDocument();
      });

      // 다시 프로필로 이동
      await user.click(screen.getByText('내 프로필 수정'));
      await waitFor(() => {
        expect(screen.getByText('기본 정보')).toBeInTheDocument();
      });
    });
  });

  describe('근무지 탭 로딩', () => {
    it('근무지 정보 로딩 중일 때 로딩 인디케이터가 표시된다', async () => {
      const user = userEvent.setup();
      await setupMocks({ isLoadingWorkplaces: true });

      render(<WorkerMyPage />);

      await user.click(screen.getByText('근무지 관리'));

      await waitFor(() => {
        const loadingDots = document.querySelectorAll('.loading-dots');
        expect(loadingDots.length).toBeGreaterThan(0);
      });
    });
  });

  describe('정정 요청 탭 로딩', () => {
    it('정정 요청 로딩 중일 때 로딩 인디케이터가 표시된다', async () => {
      const user = userEvent.setup();
      await setupMocks({ isLoadingEditRequests: true });

      render(<WorkerMyPage />);

      await user.click(screen.getByText('보낸 근무 요청'));

      await waitFor(() => {
        const loadingDots = document.querySelectorAll('.loading-dots');
        expect(loadingDots.length).toBeGreaterThan(0);
      });
    });
  });

  describe('프로필 수정', () => {
    it('프로필 편집 컴포넌트가 사용자 정보와 함께 렌더링된다', async () => {
      await setupMocks();

      render(<WorkerMyPage />);

      // 사용자 이름 확인 (ProfileEdit 내부)
      expect(screen.getByText('hong123')).toBeInTheDocument();
      expect(screen.getByText('근로자')).toBeInTheDocument();
    });

    it('계좌 정보가 표시된다', async () => {
      await setupMocks();

      render(<WorkerMyPage />);

      expect(screen.getByText('국민은행 12345678901234')).toBeInTheDocument();
    });

    it('근무자 코드가 표시된다', async () => {
      await setupMocks();

      render(<WorkerMyPage />);

      expect(screen.getByText('WK001')).toBeInTheDocument();
    });
  });

  describe('이전 근무 이력', () => {
    it('근무지 관리 탭에서 이전 근무 이력이 표시된다', async () => {
      const user = userEvent.setup();
      await setupMocks();

      render(<WorkerMyPage />);

      await user.click(screen.getByText('근무지 관리'));

      await waitFor(() => {
        expect(screen.getByText('이전 근무 이력')).toBeInTheDocument();
        expect(screen.getByText('편의점B')).toBeInTheDocument();
        expect(screen.getByText('2023년 12월 31일')).toBeInTheDocument();
      });
    });
  });

  describe('페이지 구조', () => {
    it('메인 레이아웃 클래스가 적용된다', async () => {
      await setupMocks();

      render(<WorkerMyPage />);

      const main = document.querySelector('.worker-mypage-main');
      expect(main).toBeInTheDocument();
    });

    it('콘텐츠 래퍼 클래스가 적용된다', async () => {
      await setupMocks();

      render(<WorkerMyPage />);

      const content = document.querySelector('.worker-mypage-content');
      expect(content).toBeInTheDocument();
    });
  });
});
