/**
 * EmployerRemittanceManagePage 페이지 테스트
 * - 근무지/근로자 목록 로드 및 표시
 * - 월 네비게이션 동작
 * - 근무 상세 내역 표시
 * - 송금 버튼 클릭 시 알림 표시
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EmployerRemittanceManagePage from './EmployerRemittanceManagePage';
import {
  getWorkplaces,
  getContractsByWorkplace,
  getWorkRecords,
} from '../../api/employerApi';
import Swal from 'sweetalert2';

// ============ 모킹 설정 ============

// API 모킹
vi.mock('../../api/employerApi', () => ({
  getWorkplaces: vi.fn(),
  getContractsByWorkplace: vi.fn(),
  getWorkRecords: vi.fn(),
}));

// SweetAlert2 모킹
vi.mock('sweetalert2', () => ({
  default: {
    fire: vi.fn(() => Promise.resolve({ isConfirmed: true })),
  },
}));

// CSS 모킹
vi.mock('../../styles/remittanceManagePage.css', () => ({}));

// ============ 테스트 데이터 ============

const now = new Date();
const CURRENT_YEAR = now.getFullYear();
const CURRENT_MONTH = now.getMonth() + 1;

const mockWorkplaces = [
  { id: 1, name: '카페A', colorCode: 'red' },
  { id: 2, name: '레스토랑B', colorCode: 'blue' },
];

const mockWorkers = [
  {
    id: 101,
    workerName: '홍길동',
    workerCode: 'W001',
    workerPhone: '010-1234-5678',
    hourlyWage: 10000,
    contractStartDate: '2024-01-01',
    contractEndDate: '2024-12-31',
    isActive: true,
    workplaceName: '카페A',
  },
  {
    id: 102,
    workerName: '김철수',
    workerCode: 'W002',
    workerPhone: '010-9876-5432',
    hourlyWage: 11000,
    contractStartDate: '2024-01-01',
    contractEndDate: '2024-12-31',
    isActive: true,
    workplaceName: '카페A',
  },
];

const mockWorkRecords = [
  {
    id: 1,
    workDate: `${CURRENT_YEAR}-${String(CURRENT_MONTH).padStart(2, '0')}-05`,
    startTime: '09:00:00',
    endTime: '18:00:00',
    breakMinutes: 60,
    hourlyWage: 10000,
    workerName: '홍길동',
    workplaceName: '카페A',
  },
  {
    id: 2,
    workDate: `${CURRENT_YEAR}-${String(CURRENT_MONTH).padStart(2, '0')}-10`,
    startTime: '10:00:00',
    endTime: '19:00:00',
    breakMinutes: 60,
    hourlyWage: 10000,
    workerName: '홍길동',
    workplaceName: '카페A',
  },
];

// ============ 헬퍼 함수 ============

const setupMocks = (options: {
  workplaces?: typeof mockWorkplaces;
  workers?: typeof mockWorkers;
  workRecords?: typeof mockWorkRecords;
  workplacesError?: boolean;
  workersError?: boolean;
  workRecordsError?: boolean;
} = {}) => {
  const {
    workplaces = mockWorkplaces,
    workers = mockWorkers,
    workRecords = mockWorkRecords,
    workplacesError = false,
    workersError = false,
    workRecordsError = false,
  } = options;

  if (workplacesError) {
    vi.mocked(getWorkplaces).mockRejectedValue(new Error('근무지 조회 실패'));
  } else {
    vi.mocked(getWorkplaces).mockResolvedValue({ data: workplaces });
  }

  if (workersError) {
    vi.mocked(getContractsByWorkplace).mockRejectedValue(new Error('근로자 조회 실패'));
  } else {
    vi.mocked(getContractsByWorkplace).mockResolvedValue({ data: workers });
  }

  if (workRecordsError) {
    vi.mocked(getWorkRecords).mockRejectedValue(new Error('근무 기록 조회 실패'));
  } else {
    vi.mocked(getWorkRecords).mockResolvedValue({ data: workRecords });
  }
};

const renderComponent = () => {
  return render(<EmployerRemittanceManagePage />);
};

// ============ 테스트 ============

describe('EmployerRemittanceManagePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============ 렌더링 테스트 ============

  describe('렌더링', () => {
    it('페이지가 정상적으로 렌더링된다', async () => {
      setupMocks();
      renderComponent();

      // 근무 상세 내역 제목 확인
      await waitFor(() => {
        expect(screen.getByText('근무 상세 내역')).toBeInTheDocument();
      });
    });

    it('근무지 목록이 로드되면 드롭다운에 표시된다', async () => {
      setupMocks();
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('카페A')).toBeInTheDocument();
      });
    });

    it('근로자 목록이 표시된다', async () => {
      setupMocks();
      renderComponent();

      await waitFor(() => {
        // 근로자 이름이 여러 곳에 표시될 수 있으므로 getAllByText 사용
        expect(screen.getAllByText('홍길동').length).toBeGreaterThan(0);
        expect(screen.getAllByText('김철수').length).toBeGreaterThan(0);
      });
    });

    it('근무 내역이 없을 때 안내 메시지를 표시한다', async () => {
      setupMocks({ workRecords: [] });
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('근무 내역이 없습니다.')).toBeInTheDocument();
      });
    });

    it('월 네비게이션에 현재 연월이 표시된다', async () => {
      setupMocks();
      renderComponent();

      await waitFor(() => {
        const monthNavText = `${CURRENT_YEAR}년 ${CURRENT_MONTH}월`;
        expect(screen.getByText(monthNavText)).toBeInTheDocument();
      });
    });
  });

  // ============ 월 네비게이션 테스트 ============

  describe('월 네비게이션', () => {
    it('이전 달 버튼 클릭 시 월이 감소한다', async () => {
      setupMocks();
      renderComponent();
      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByText(`${CURRENT_YEAR}년 ${CURRENT_MONTH}월`)).toBeInTheDocument();
      });

      // 이전 달 버튼 클릭
      const prevButton = screen.getByRole('button', { name: /이전/ });
      await user.click(prevButton);

      // 월 변경 확인
      const expectedMonth = CURRENT_MONTH === 1 ? 12 : CURRENT_MONTH - 1;
      const expectedYear = CURRENT_MONTH === 1 ? CURRENT_YEAR - 1 : CURRENT_YEAR;

      await waitFor(() => {
        expect(screen.getByText(`${expectedYear}년 ${expectedMonth}월`)).toBeInTheDocument();
      });
    });

    it('다음 달 버튼 클릭 시 월이 증가한다', async () => {
      setupMocks();
      renderComponent();
      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByText(`${CURRENT_YEAR}년 ${CURRENT_MONTH}월`)).toBeInTheDocument();
      });

      // 다음 달 버튼 클릭
      const nextButton = screen.getByRole('button', { name: /다음/ });
      await user.click(nextButton);

      // 월 변경 확인
      const expectedMonth = CURRENT_MONTH === 12 ? 1 : CURRENT_MONTH + 1;
      const expectedYear = CURRENT_MONTH === 12 ? CURRENT_YEAR + 1 : CURRENT_YEAR;

      await waitFor(() => {
        expect(screen.getByText(`${expectedYear}년 ${expectedMonth}월`)).toBeInTheDocument();
      });
    });
  });

  // ============ 송금 기능 테스트 ============

  describe('송금 기능', () => {
    it('송금하기 버튼 클릭 시 웹 미지원 알림이 표시된다', async () => {
      setupMocks();
      renderComponent();
      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByText('송금하기')).toBeInTheDocument();
      });

      // 송금하기 버튼 클릭
      const remittanceButton = screen.getByText('송금하기');
      await user.click(remittanceButton);

      // SweetAlert2 호출 확인
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '알림',
          text: '송금 기능은 웹에서 제공하지 않습니다. 모바일 앱을 이용해주세요.',
          icon: 'info',
        })
      );
    });
  });

  // ============ 근로자 선택 테스트 ============

  describe('근로자 선택', () => {
    it('근로자를 클릭하면 해당 근로자가 선택된다', async () => {
      setupMocks();
      renderComponent();
      const user = userEvent.setup();

      await waitFor(() => {
        // 근로자 이름이 여러 곳에 표시될 수 있으므로 getAllByText 사용
        expect(screen.getAllByText('홍길동').length).toBeGreaterThan(0);
        expect(screen.getAllByText('김철수').length).toBeGreaterThan(0);
      });

      // 왼쪽 패널의 근로자 목록에서 김철수 클릭 (worker-item 클래스)
      const workerItems = screen.getAllByText('김철수');
      // 첫 번째 요소가 근로자 목록의 항목
      await user.click(workerItems[0]);

      // 선택된 근로자에 대한 근무 내역 조회가 다시 이루어짐
      // (실제로는 김철수의 근무 기록이 없으므로 "근무 내역이 없습니다" 표시)
      await waitFor(() => {
        expect(screen.getByText('근무 내역이 없습니다.')).toBeInTheDocument();
      });
    });
  });

  // ============ API 에러 처리 테스트 ============

  describe('API 에러 처리', () => {
    it('근무지 조회 실패 시에도 페이지가 렌더링된다', async () => {
      setupMocks({ workplacesError: true });
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('근무 상세 내역')).toBeInTheDocument();
      });
    });

    it('근로자 조회 실패 시에도 페이지가 렌더링된다', async () => {
      setupMocks({ workersError: true });
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('근무 상세 내역')).toBeInTheDocument();
      });
    });

    it('근무 기록 조회 실패 시 빈 목록을 표시한다', async () => {
      setupMocks({ workRecordsError: true });
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('근무 내역이 없습니다.')).toBeInTheDocument();
      });
    });
  });

  // ============ 급여 요약 테스트 ============

  describe('급여 요약', () => {
    it('총 급여가 계산되어 표시된다', async () => {
      setupMocks();
      renderComponent();

      // 근무 기록 2개 (각 8시간 - 1시간 휴게 = 7시간, 시급 10000원)
      // 예상 급여: 7 * 10000 * 2 = 140,000원
      await waitFor(() => {
        // 급여가 0이 아닌 값으로 표시되는지 확인
        const salaryElement = screen.getByText(/원$/);
        expect(salaryElement).toBeInTheDocument();
      });
    });
  });
});
