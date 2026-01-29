import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import WorkerRemittancePage from './WorkerRemittancePage';

// ============ 모킹 설정 ============

// API 모킹
vi.mock('../../api/workerApi', () => ({
  getContracts: vi.fn(),
  getContractDetail: vi.fn(),
  getWorkRecords: vi.fn(),
  getSalaries: vi.fn(),
  getPayments: vi.fn(),
}));

// CSS 모킹 (jsdom에서 CSS import 에러 방지)
vi.mock('./WorkerRemittancePage.css', () => ({}));

// ============ 테스트 데이터 ============

const now = new Date();
const CURRENT_YEAR = now.getFullYear();
const CURRENT_MONTH = now.getMonth() + 1;

const mockContractsResponse = {
  success: true,
  data: [
    { id: 1, workerName: '홍길동', workerCode: 'W001', isActive: true },
    { id: 2, workerName: '홍길동', workerCode: 'W001', isActive: true },
  ],
};

const mockContractDetail1 = {
  success: true,
  data: {
    id: 1,
    workplaceName: '카페A',
    hourlyWage: 10000,
    payrollDeductionType: 'INCOME_TAX_3_3',
    contractStartDate: '2024-01-01',
    contractEndDate: null,
    isActive: true,
  },
};

const mockContractDetail2 = {
  success: true,
  data: {
    id: 2,
    workplaceName: '식당B',
    hourlyWage: 12000,
    payrollDeductionType: 'FOUR_MAJOR_INSURANCES',
    contractStartDate: '2024-01-01',
    contractEndDate: null,
    isActive: true,
  },
};

const mockWorkRecordsResponse = {
  success: true,
  data: [
    {
      id: 101,
      contractId: 1,
      workDate: `${CURRENT_YEAR}-${String(CURRENT_MONTH).padStart(2, '0')}-15`,
      startTime: '09:00:00',
      endTime: '13:00:00',
      breakMinutes: 0,
      totalWorkMinutes: 240,
      status: 'APPROVED',
    },
    {
      id: 102,
      contractId: 1,
      workDate: `${CURRENT_YEAR}-${String(CURRENT_MONTH).padStart(2, '0')}-10`,
      startTime: '14:00:00',
      endTime: '18:00:00',
      breakMinutes: 30,
      totalWorkMinutes: 210,
      status: 'APPROVED',
    },
  ],
};

const mockSalariesResponse = {
  success: true,
  data: [
    {
      id: 1,
      contractId: 1,
      workerName: '홍길동',
      year: CURRENT_YEAR,
      month: CURRENT_MONTH,
      totalGrossPay: 500000,
      netPay: 450000,
      paymentDueDate: `${CURRENT_YEAR}-${String(CURRENT_MONTH + 1).padStart(2, '0')}-10`,
    },
  ],
};

const mockPaymentsCompletedResponse = {
  success: true,
  data: [
    {
      id: 1,
      salaryId: 1,
      workerName: '홍길동',
      year: CURRENT_YEAR,
      month: CURRENT_MONTH,
      netPay: 450000,
      status: 'COMPLETED',
      paymentDate: '2026-02-10',
      isPaid: true,
    },
  ],
};

const mockPaymentsEmptyResponse = {
  success: true,
  data: [],
};

// ============ 헬퍼 함수 ============

const renderPage = () => {
  return render(
    <BrowserRouter>
      <WorkerRemittancePage />
    </BrowserRouter>
  );
};

const setupMocks = async (options?: {
  payments?: typeof mockPaymentsCompletedResponse;
}) => {
  const {
    getContracts,
    getContractDetail,
    getWorkRecords,
    getSalaries,
    getPayments,
  } = await import('../../api/workerApi');

  (getContracts as ReturnType<typeof vi.fn>).mockResolvedValue(mockContractsResponse);
  (getContractDetail as ReturnType<typeof vi.fn>).mockImplementation((contractId: number) => {
    if (contractId === 1) return Promise.resolve(mockContractDetail1);
    if (contractId === 2) return Promise.resolve(mockContractDetail2);
    return Promise.resolve({ success: true, data: null });
  });
  (getWorkRecords as ReturnType<typeof vi.fn>).mockResolvedValue(mockWorkRecordsResponse);
  (getSalaries as ReturnType<typeof vi.fn>).mockResolvedValue(mockSalariesResponse);
  (getPayments as ReturnType<typeof vi.fn>).mockResolvedValue(
    options?.payments ?? mockPaymentsEmptyResponse
  );
};

const setupEmptyMocks = async () => {
  const {
    getContracts,
    getContractDetail,
    getWorkRecords,
    getSalaries,
    getPayments,
  } = await import('../../api/workerApi');

  (getContracts as ReturnType<typeof vi.fn>).mockResolvedValue({ success: true, data: [] });
  (getContractDetail as ReturnType<typeof vi.fn>).mockResolvedValue({ success: true, data: null });
  (getWorkRecords as ReturnType<typeof vi.fn>).mockResolvedValue({ success: true, data: [] });
  (getSalaries as ReturnType<typeof vi.fn>).mockResolvedValue({ success: true, data: [] });
  (getPayments as ReturnType<typeof vi.fn>).mockResolvedValue({ success: true, data: [] });
};

// ============ 테스트 ============

/**
 * WorkerRemittancePage 컴포넌트 테스트
 *
 * 테스트 범위:
 * 1. 컴포넌트 렌더링 (월 네비게이션, 급여 카드, 근무 내역)
 * 2. 월 네비게이션 (이전/다음 달 이동)
 * 3. 근무지 선택 드롭다운
 * 4. 근무 상세 내역 (정렬, 카드 확장)
 * 5. 입금 상태 표시
 * 6. API 에러 처리
 */

describe('WorkerRemittancePage 렌더링', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('페이지가 정상적으로 렌더링된다', async () => {
    await setupMocks();
    renderPage();

    await waitFor(() => {
      expect(screen.getByText(new RegExp(`${CURRENT_MONTH}월`))).toBeInTheDocument();
    });
  });

  it('급여 정보가 표시된다', async () => {
    await setupMocks();
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('급여')).toBeInTheDocument();
    });
  });

  it('근무 상세 내역 섹션이 표시된다', async () => {
    await setupMocks();
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('근무 상세 내역')).toBeInTheDocument();
    });
  });

  it('근무 기록이 표시된다', async () => {
    await setupMocks();
    renderPage();

    await waitFor(() => {
      // 근무 기록 날짜가 표시되는지 확인 (15일, 10일)
      expect(screen.getByText('15')).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument();
    });
  });

  it('데이터가 없을 때 빈 상태 메시지가 표시된다', async () => {
    await setupEmptyMocks();
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('근무 내역이 없습니다.')).toBeInTheDocument();
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

    await waitFor(() => {
      expect(screen.getByText(new RegExp(`${CURRENT_MONTH}월`))).toBeInTheDocument();
    });

    // MonthNav의 이전 달 버튼 (aria-label="이전 달")
    const prevButton = screen.getByLabelText('이전 달');
    await user.click(prevButton);

    const prevDate = new Date(CURRENT_YEAR, CURRENT_MONTH - 2, 1);
    const expectedMonth = prevDate.getMonth() + 1;

    await waitFor(() => {
      expect(screen.getByText(new RegExp(`${expectedMonth}월`))).toBeInTheDocument();
    });
  });

  it('다음 달 버튼을 클릭하면 다음 달로 이동한다', async () => {
    await setupMocks();
    renderPage();
    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getByText(new RegExp(`${CURRENT_MONTH}월`))).toBeInTheDocument();
    });

    // MonthNav의 다음 달 버튼 (aria-label="다음 달")
    const nextButton = screen.getByLabelText('다음 달');
    await user.click(nextButton);

    const nextDate = new Date(CURRENT_YEAR, CURRENT_MONTH, 1);
    const expectedMonth = nextDate.getMonth() + 1;

    await waitFor(() => {
      expect(screen.getByText(new RegExp(`${expectedMonth}월`))).toBeInTheDocument();
    });
  });
});

describe('근무지 선택', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('첫 번째 근무지가 기본 선택된다', async () => {
    await setupMocks();
    renderPage();

    await waitFor(() => {
      const buttons = screen.getAllByRole('button');
      const dropdownButton = buttons.find(
        (btn) => btn.classList.contains('workplace-dropdown-button')
      );
      expect(dropdownButton).toHaveTextContent('카페A');
    });
  });

  it('드롭다운을 열고 다른 근무지를 선택할 수 있다', async () => {
    await setupMocks();
    renderPage();
    const user = userEvent.setup();

    // 기본 선택된 "카페A" 드롭다운 버튼 대기
    await waitFor(() => {
      const buttons = screen.getAllByRole('button');
      const dropdownBtn = buttons.find(
        (btn) => btn.classList.contains('workplace-dropdown-button')
      );
      expect(dropdownBtn).toHaveTextContent('카페A');
    });

    // 드롭다운 버튼 클릭하여 메뉴 열기
    const buttons = screen.getAllByRole('button');
    const dropdownButton = buttons.find(
      (btn) => btn.classList.contains('workplace-dropdown-button')
    )!;
    await user.click(dropdownButton);

    // 드롭다운 메뉴에서 "식당B" 선택
    const menuItem = await screen.findByText('식당B');
    await user.click(menuItem);

    // 선택 후 드롭다운 버튼이 "식당B"로 변경 확인
    await waitFor(() => {
      const updatedButtons = screen.getAllByRole('button');
      const updatedDropdownBtn = updatedButtons.find(
        (btn) => btn.classList.contains('workplace-dropdown-button')
      );
      expect(updatedDropdownBtn).toHaveTextContent('식당B');
    });
  });
});

describe('정렬 기능', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('정렬 드롭다운 버튼이 "최신순"으로 표시된다', async () => {
    await setupMocks();
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('최신순')).toBeInTheDocument();
    });
  });

  it('정렬 드롭다운을 열고 "과거순"을 선택할 수 있다', async () => {
    await setupMocks();
    renderPage();
    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getByText('최신순')).toBeInTheDocument();
    });

    // 정렬 드롭다운 버튼 클릭
    const sortButton = screen.getByText('최신순').closest('button')!;
    await user.click(sortButton);

    // "과거순" 옵션 클릭
    await waitFor(() => {
      const oldestOption = screen.getAllByText('과거순').find(
        (el) => el.closest('.sort-dropdown-item')
      );
      expect(oldestOption).toBeInTheDocument();
    });

    const oldestOption = screen.getAllByText('과거순').find(
      (el) => el.closest('.sort-dropdown-item')
    );
    if (oldestOption) {
      await user.click(oldestOption);
    }
  });
});

describe('근무 상세 내역 확장', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('근무 카드를 클릭하면 상세 패널이 펼쳐진다', async () => {
    await setupMocks();
    renderPage();
    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getByText('15')).toBeInTheDocument();
    });

    // 근무 카드 클릭 (role="button")
    const workCards = screen.getAllByRole('button').filter(
      (btn) => btn.classList.contains('remittance-detail-card')
    );
    const firstCard = workCards[0];
    expect(firstCard).toBeDefined();

    await user.click(firstCard!);

    // 상세 패널이 열렸는지 확인 (open 클래스 추가됨)
    await waitFor(() => {
      const openPanel = document.querySelector('.remittance-detail-panel.open');
      expect(openPanel).not.toBeNull();

      // 열린 패널 내에서 근무 정보 라벨 확인
      const panelScope = within(openPanel as HTMLElement);
      expect(panelScope.getByText('근무지')).toBeInTheDocument();
      expect(panelScope.getByText('근무 시간')).toBeInTheDocument();
      expect(panelScope.getByText('휴게 시간')).toBeInTheDocument();
      expect(panelScope.getByText('시급')).toBeInTheDocument();
    });
  });
});

describe('입금 상태', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('급여가 없으면 "입금 전" 상태가 표시된다', async () => {
    await setupEmptyMocks();
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('입금 전')).toBeInTheDocument();
    });
  });

  it('입금 완료 시 "입금 완료"와 송금 날짜가 표시된다', async () => {
    await setupMocks({ payments: mockPaymentsCompletedResponse });
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('입금 완료')).toBeInTheDocument();
      expect(screen.getByText(/송금 날짜/)).toBeInTheDocument();
    });
  });

  it('급여는 있지만 미입금 시 "입금 전" 상태가 표시된다', async () => {
    await setupMocks({ payments: mockPaymentsEmptyResponse });
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('입금 전')).toBeInTheDocument();
    });
  });
});

describe('API 에러 처리', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('계약 목록 조회 실패 시에도 페이지가 렌더링된다', async () => {
    const { getContracts, getContractDetail, getWorkRecords, getSalaries, getPayments } =
      await import('../../api/workerApi');

    (getContracts as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network Error'));
    (getContractDetail as ReturnType<typeof vi.fn>).mockResolvedValue({ success: true, data: null });
    (getWorkRecords as ReturnType<typeof vi.fn>).mockResolvedValue({ success: true, data: [] });
    (getSalaries as ReturnType<typeof vi.fn>).mockResolvedValue({ success: true, data: [] });
    (getPayments as ReturnType<typeof vi.fn>).mockResolvedValue({ success: true, data: [] });

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('근무 상세 내역')).toBeInTheDocument();
    });

    consoleSpy.mockRestore();
  });

  it('근무 기록 조회 실패 시에도 페이지가 렌더링된다', async () => {
    const { getContracts, getContractDetail, getWorkRecords, getSalaries, getPayments } =
      await import('../../api/workerApi');

    (getContracts as ReturnType<typeof vi.fn>).mockResolvedValue(mockContractsResponse);
    (getContractDetail as ReturnType<typeof vi.fn>).mockImplementation((contractId: number) => {
      if (contractId === 1) return Promise.resolve(mockContractDetail1);
      if (contractId === 2) return Promise.resolve(mockContractDetail2);
      return Promise.resolve({ success: true, data: null });
    });
    (getWorkRecords as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network Error'));
    (getSalaries as ReturnType<typeof vi.fn>).mockResolvedValue({ success: true, data: [] });
    (getPayments as ReturnType<typeof vi.fn>).mockResolvedValue({ success: true, data: [] });

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    renderPage();

    await waitFor(() => {
      expect(screen.getByText(new RegExp(`${CURRENT_MONTH}월`))).toBeInTheDocument();
    });

    consoleSpy.mockRestore();
  });
});

describe('초기 데이터 로딩', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('컴포넌트 마운트 시 API가 호출된다', async () => {
    const { getContracts } = await import('../../api/workerApi');
    await setupMocks();

    renderPage();

    await waitFor(() => {
      expect(getContracts).toHaveBeenCalled();
    });
  });

  it('로딩 중에는 "로딩 중..." 메시지가 표시된다', async () => {
    // getContractDetail은 즉시 resolve, getWorkRecords만 지연 → 로딩 상태 유지
    const { getContracts, getContractDetail, getWorkRecords, getSalaries, getPayments } =
      await import('../../api/workerApi');

    (getContracts as ReturnType<typeof vi.fn>).mockResolvedValue(mockContractsResponse);
    (getContractDetail as ReturnType<typeof vi.fn>).mockImplementation((contractId: number) => {
      if (contractId === 1) return Promise.resolve(mockContractDetail1);
      if (contractId === 2) return Promise.resolve(mockContractDetail2);
      return Promise.resolve({ success: true, data: null });
    });
    (getWorkRecords as ReturnType<typeof vi.fn>).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(mockWorkRecordsResponse), 1000))
    );
    (getSalaries as ReturnType<typeof vi.fn>).mockResolvedValue(mockSalariesResponse);
    (getPayments as ReturnType<typeof vi.fn>).mockResolvedValue(mockPaymentsEmptyResponse);

    renderPage();

    // 로딩 상태가 비동기적으로 나타남 (근무지 설정 후 근무 기록 조회 시)
    const loadingEl = await screen.findByText('로딩 중...', {}, { timeout: 3000 });
    expect(loadingEl).toBeInTheDocument();
  });
});
