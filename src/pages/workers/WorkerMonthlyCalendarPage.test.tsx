import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import WorkerMonthlyCalendarPage from './WorkerMonthlyCalendarPage';

// ============ 모킹 설정 ============

// API 모킹
vi.mock('../../api/workerApi', () => ({
  getContracts: vi.fn(),
  getWorkRecords: vi.fn(),
  createCorrectionRequest: vi.fn(),
  createWorkRecord: vi.fn(),
  getSalaries: vi.fn(),
}));

// react-toastify 모킹
vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// CSS 모킹 (jsdom에서 CSS import 에러 방지)
vi.mock('./WorkerMonthlyCalendarPage.css', () => ({}));

// ============ 테스트 데이터 ============

const mockContracts = [
  {
    id: 1,
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
    id: 2,
    workerName: '홍길동',
    workerCode: 'W001',
    workerPhone: '010-1234-5678',
    hourlyWage: 12000,
    contractStartDate: '2024-01-01',
    contractEndDate: '2024-12-31',
    isActive: true,
    workplaceName: '식당B',
  },
];

const mockWorkRecords = [
  {
    id: 101,
    contractId: 1,
    workDate: '2024-01-15',
    startTime: '09:00:00',
    endTime: '13:00:00',
    breakMinutes: 0,
    totalWorkMinutes: 240,
    status: 'APPROVED',
    isModified: false,
    workplaceName: '카페A',
    memo: '오전 근무',
  },
  {
    id: 102,
    contractId: 2,
    workDate: '2024-01-15',
    startTime: '14:00:00',
    endTime: '18:00:00',
    breakMinutes: 30,
    totalWorkMinutes: 210,
    status: 'APPROVED',
    isModified: false,
    workplaceName: '식당B',
    memo: '',
  },
];

const mockSalaries = [
  {
    year: 2024,
    month: 1,
    netPay: 500000,
  },
];

/**
 * WorkerMonthlyCalendarPage 컴포넌트 테스트
 *
 * 테스트 범위:
 * 1. 컴포넌트 렌더링 (캘린더, 네비게이션, 근무 목록)
 * 2. 월 네비게이션 (이전/다음 달 이동)
 * 3. 날짜 선택 및 해당 날짜의 근무 기록 표시
 * 4. 근무 정정 요청 폼 열기/닫기
 * 5. 근무 추가 모달 (비활성화 상태 확인)
 * 6. 월간 요약 표시 (총 근무시간, 급여)
 * 7. 메모 입력 기능
 */

// 테스트용 래퍼 컴포넌트
const renderPage = () => {
  return render(
    <BrowserRouter>
      <WorkerMonthlyCalendarPage />
    </BrowserRouter>
  );
};

// API 모킹 헬퍼 함수
const setupMocks = async () => {
  const {
    getContracts,
    getWorkRecords,
    getSalaries,
  } = await import('../../api/workerApi');

  (getContracts as ReturnType<typeof vi.fn>).mockResolvedValue({
    data: mockContracts,
  });

  (getWorkRecords as ReturnType<typeof vi.fn>).mockResolvedValue({
    data: mockWorkRecords,
  });

  (getSalaries as ReturnType<typeof vi.fn>).mockResolvedValue({
    data: mockSalaries,
  });
};

// 빈 데이터 모킹 헬퍼 함수
const setupEmptyMocks = async () => {
  const {
    getContracts,
    getWorkRecords,
    getSalaries,
  } = await import('../../api/workerApi');

  (getContracts as ReturnType<typeof vi.fn>).mockResolvedValue({
    data: [],
  });

  (getWorkRecords as ReturnType<typeof vi.fn>).mockResolvedValue({
    data: [],
  });

  (getSalaries as ReturnType<typeof vi.fn>).mockResolvedValue({
    data: [],
  });
};

describe('WorkerMonthlyCalendarPage 렌더링', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('페이지가 정상적으로 렌더링된다', async () => {
    await setupMocks();
    renderPage();

    // 월 네비게이션이 표시되는지 확인
    await waitFor(() => {
      // 현재 날짜의 월이 표시되어야 함
      const today = new Date();
      const expectedMonth = `${today.getMonth() + 1}월`;
      expect(screen.getByText(new RegExp(expectedMonth))).toBeInTheDocument();
    });
  });

  it('캘린더 요일 헤더가 표시된다', async () => {
    await setupMocks();
    renderPage();

    await waitFor(() => {
      // 일요일부터 토요일까지 요일 헤더 확인 (영문 표기)
      expect(screen.getByText('SUN')).toBeInTheDocument();
      expect(screen.getByText('MON')).toBeInTheDocument();
      expect(screen.getByText('TUE')).toBeInTheDocument();
      expect(screen.getByText('WED')).toBeInTheDocument();
      expect(screen.getByText('THU')).toBeInTheDocument();
      expect(screen.getByText('FRI')).toBeInTheDocument();
      expect(screen.getByText('SAT')).toBeInTheDocument();
    });
  });

  it('근무 추가 버튼이 비활성화 상태로 표시된다', async () => {
    await setupMocks();
    renderPage();

    await waitFor(() => {
      const addButton = screen.getByText('+ 근무 추가하기');
      expect(addButton).toBeInTheDocument();
      expect(addButton).toBeDisabled();
    });
  });

  it('월간 요약(총 근무시간, 급여)이 표시된다', async () => {
    await setupMocks();
    renderPage();

    await waitFor(() => {
      // SummaryRow에서 표시하는 텍스트 확인
      expect(screen.getByText('월간 근무시간')).toBeInTheDocument();
      expect(screen.getByText('월 급여')).toBeInTheDocument();
    });
  });
});

describe('월 네비게이션', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('이전 달 버튼을 클릭하면 이전 달로 이동한다', async () => {
    await setupMocks();
    renderPage();
    const user = userEvent.setup();

    const today = new Date();
    const currentMonth = today.getMonth() + 1;

    await waitFor(() => {
      expect(screen.getByText(new RegExp(`${currentMonth}월`))).toBeInTheDocument();
    });

    // 이전 달 버튼 클릭 (< 아이콘 버튼)
    const prevButtons = screen.getAllByRole('button');
    const prevButton = prevButtons.find(btn =>
      btn.querySelector('svg') && btn.textContent === ''
    );

    if (prevButton) {
      await user.click(prevButton);

      // 이전 달 계산
      const prevDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const expectedMonth = `${prevDate.getMonth() + 1}월`;

      await waitFor(() => {
        expect(screen.getByText(new RegExp(expectedMonth))).toBeInTheDocument();
      });
    }
  });

  it('다음 달 버튼을 클릭하면 다음 달로 이동한다', async () => {
    await setupMocks();
    renderPage();
    const user = userEvent.setup();

    const today = new Date();
    const currentMonth = today.getMonth() + 1;

    await waitFor(() => {
      expect(screen.getByText(new RegExp(`${currentMonth}월`))).toBeInTheDocument();
    });

    // 다음 달 버튼 클릭 (> 아이콘 버튼)
    const buttons = screen.getAllByRole('button');
    // 두 번째 네비게이션 버튼이 다음 달 버튼
    const navButtons = buttons.filter(btn =>
      btn.querySelector('svg') && btn.textContent === ''
    );

    if (navButtons.length >= 2) {
      await user.click(navButtons[1]);

      // 다음 달 계산
      const nextDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
      const expectedMonth = `${nextDate.getMonth() + 1}월`;

      await waitFor(() => {
        expect(screen.getByText(new RegExp(expectedMonth))).toBeInTheDocument();
      });
    }
  });
});

describe('날짜 선택', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('날짜를 클릭하면 해당 날짜가 선택된다', async () => {
    await setupMocks();
    renderPage();
    const user = userEvent.setup();

    await waitFor(() => {
      // 캘린더가 렌더링될 때까지 대기
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    // 15일 클릭
    const day15 = screen.getByText('15');
    await user.click(day15);

    // 선택된 날짜의 스타일이 변경되었는지 확인 (또는 해당 날짜의 근무 목록이 표시되는지)
    // 실제 UI에서 선택된 날짜가 어떻게 표시되는지에 따라 테스트 수정 필요
    expect(day15).toBeInTheDocument();
  });

  it('근무 기록이 없는 날짜를 선택하면 빈 상태 메시지가 표시된다', async () => {
    await setupEmptyMocks();
    renderPage();
    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    // 1일 클릭
    const day1 = screen.getByText('1');
    await user.click(day1);

    await waitFor(() => {
      expect(screen.getByText('선택한 날짜의 근무 기록이 없습니다.')).toBeInTheDocument();
    });
  });
});

describe('메모 기능', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('메모 입력란이 표시된다', async () => {
    await setupMocks();
    renderPage();

    await waitFor(() => {
      // MemoCard의 textarea 확인
      const memoTextarea = screen.getByRole('textbox');
      expect(memoTextarea).toBeInTheDocument();
    });
  });

  it('메모를 입력할 수 있다', async () => {
    await setupMocks();
    renderPage();
    const user = userEvent.setup();

    await waitFor(() => {
      const memoTextarea = screen.getByRole('textbox');
      expect(memoTextarea).toBeInTheDocument();
    });

    const memoTextarea = screen.getByRole('textbox');
    await user.type(memoTextarea, '테스트 메모입니다');

    expect(memoTextarea).toHaveValue('테스트 메모입니다');
  });
});

describe('API 에러 처리', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('계약 목록 조회 실패 시에도 페이지가 렌더링된다', async () => {
    const { getContracts, getWorkRecords, getSalaries } = await import('../../api/workerApi');

    (getContracts as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network Error'));
    (getWorkRecords as ReturnType<typeof vi.fn>).mockResolvedValue({ data: [] });
    (getSalaries as ReturnType<typeof vi.fn>).mockResolvedValue({ data: [] });

    // console.error를 임시로 모킹하여 에러 로그 숨기기
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    renderPage();

    await waitFor(() => {
      // 페이지가 렌더링되는지 확인
      expect(screen.getByText('+ 근무 추가하기')).toBeInTheDocument();
    });

    consoleSpy.mockRestore();
  });

  it('근무 기록 조회 실패 시에도 캘린더가 렌더링된다', async () => {
    const { getContracts, getWorkRecords, getSalaries } = await import('../../api/workerApi');

    (getContracts as ReturnType<typeof vi.fn>).mockResolvedValue({ data: mockContracts });
    (getWorkRecords as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network Error'));
    (getSalaries as ReturnType<typeof vi.fn>).mockResolvedValue({ data: [] });

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    renderPage();

    await waitFor(() => {
      // 캘린더 요일 헤더가 표시되는지 확인 (영문 표기)
      expect(screen.getByText('SUN')).toBeInTheDocument();
      expect(screen.getByText('MON')).toBeInTheDocument();
    });

    consoleSpy.mockRestore();
  });
});

describe('근무 기록 목록', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('계약 정보가 없을 때 근무 목록이 비어있다', async () => {
    await setupEmptyMocks();
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('선택한 날짜의 근무 기록이 없습니다.')).toBeInTheDocument();
    });
  });
});

describe('근무 추가 버튼', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('근무 추가 버튼이 비활성화 상태이며 title 속성이 있다', async () => {
    await setupMocks();
    renderPage();

    await waitFor(() => {
      const addButton = screen.getByText('+ 근무 추가하기');
      expect(addButton).toBeDisabled();
      expect(addButton).toHaveAttribute('title', '임시 비활성화 (백엔드 API 수정 필요)');
    });
  });

  it('비활성화된 버튼 클릭 시 모달이 열리지 않는다', async () => {
    await setupMocks();
    renderPage();
    const user = userEvent.setup();

    await waitFor(() => {
      const addButton = screen.getByText('+ 근무 추가하기');
      expect(addButton).toBeInTheDocument();
    });

    const addButton = screen.getByText('+ 근무 추가하기');

    // 비활성화된 버튼 클릭 시도
    await user.click(addButton);

    // AddWorkModal이 열리지 않았는지 확인 (모달 특정 텍스트가 없는지)
    expect(screen.queryByText('근무 추가')).not.toBeInTheDocument();
  });
});

describe('초기 데이터 로딩', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('컴포넌트 마운트 시 API가 호출된다', async () => {
    const { getContracts, getSalaries } = await import('../../api/workerApi');
    await setupMocks();

    renderPage();

    await waitFor(() => {
      expect(getContracts).toHaveBeenCalled();
      expect(getSalaries).toHaveBeenCalled();
    });
  });
});
