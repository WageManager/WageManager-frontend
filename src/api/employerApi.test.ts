import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import MockAdapter from "axios-mock-adapter";
import { wageManagerApi } from "./axios";
import {
  getWorkplaces,
  getWorkplace,
  createWorkplace,
  updateWorkplace,
  deleteWorkplace,
  getWorkRecords,
  getWorkRecord,
  createWorkRecord,
  updateWorkRecord,
  deleteWorkRecord,
  approveWorkRecord,
  rejectWorkRecord,
  getContractsByWorkplace,
  getContract,
  createContract,
  updateContract,
  deleteContract,
  getSalaries,
  getSalary,
  calculateSalary,
  getPendingApprovals,
  approveCorrectionRequest,
  rejectCorrectionRequest,
  createPayment,
  getWorkerByCode,
  getWorkerById,
} from "./employerApi";

/**
 * employerApi.ts 테스트
 *
 * 테스트 범위:
 * 1. 모든 API 함수가 올바른 엔드포인트를 호출하는지
 * 2. 응답 형태가 { success, data, error } 구조로 반환되는지
 * 3. 요청 파라미터가 올바르게 전달되는지
 */

let mockApi: MockAdapter;

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

const originalLocalStorage = window.localStorage;

beforeEach(() => {
  mockApi = new MockAdapter(wageManagerApi);

  Object.defineProperty(window, "localStorage", {
    value: localStorageMock,
    writable: true,
    configurable: true,
  });

  localStorageMock.clear();
  localStorageMock.setItem("token", "test-token");
  vi.clearAllMocks();
});

afterEach(() => {
  mockApi.restore();
  Object.defineProperty(window, "localStorage", {
    value: originalLocalStorage,
    writable: true,
    configurable: true,
  });
});

// ============ 근무지 (Workplace) 테스트 ============

describe("Workplace API", () => {
  const mockWorkplaceListResponse = {
    success: true,
    data: [
      {
        id: 1,
        businessName: "(주)좋은회사",
        name: "강남본점",
        colorCode: "#FF5733",
        workerCount: 12,
        isActive: true,
      },
      {
        id: 2,
        businessName: "(주)좋은회사",
        name: "성수점",
        colorCode: "#33FF57",
        workerCount: 4,
        isActive: true,
      },
    ],
    error: null,
  };

  it("getWorkplaces - 사업장 목록을 조회한다", async () => {
    mockApi.onGet("/api/employer/workplaces").reply(200, mockWorkplaceListResponse);

    const result = await getWorkplaces();

    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(2);
    expect(result.data[0].businessName).toBe("(주)좋은회사");
  });

  it("getWorkplace - 특정 사업장을 조회한다", async () => {
    const mockResponse = {
      success: true,
      data: mockWorkplaceListResponse.data[0],
      error: null,
    };
    mockApi.onGet("/api/employer/workplaces/1").reply(200, mockResponse);

    const result = await getWorkplace(1);

    expect(result.success).toBe(true);
    expect(result.data.id).toBe(1);
  });

  it("createWorkplace - 사업장을 생성한다", async () => {
    const mockResponse = {
      success: true,
      data: {
        id: 3,
        businessNumber: "123-45-67890",
        businessName: "(주)메가커피",
        name: "강남역점",
        address: "서울시 강남구",
        colorCode: "#FF5733",
        isLessThanFiveEmployees: true,
      },
      error: null,
    };
    mockApi.onPost("/api/employer/workplaces").reply(201, mockResponse);

    const result = await createWorkplace({
      businessNumber: "123-45-67890",
      businessName: "(주)메가커피",
      workplaceName: "강남역점",
      address: "서울시 강남구",
      colorCode: "#FF5733",
      isLessThanFiveEmployees: true,
    });

    expect(result.success).toBe(true);
    expect(result.data.id).toBe(3);
    expect(result.data.businessName).toBe("(주)메가커피");
    expect(result.data.name).toBe("강남역점");
  });

  it("updateWorkplace - 사업장을 수정한다", async () => {
    const mockResponse = {
      success: true,
      data: {
        id: 1,
        businessNumber: "123-45-67890",
        businessName: "수정된회사",
        name: "수정된점포",
        address: "서울시 서초구",
        colorCode: "#00FF00",
      },
      error: null,
    };
    mockApi.onPut("/api/employer/workplaces/1").reply(200, mockResponse);

    const result = await updateWorkplace(1, {
      businessName: "수정된회사",
      workplaceName: "수정된점포",
      address: "서울시 서초구",
      colorCode: "#00FF00",
    });

    expect(result.success).toBe(true);
    expect(result.data.businessName).toBe("수정된회사");
    expect(result.data.name).toBe("수정된점포");
  });

  it("deleteWorkplace - 사업장을 삭제한다", async () => {
    const mockResponse = { success: true, data: null, error: null };
    mockApi.onDelete("/api/employer/workplaces/1").reply(200, mockResponse);

    const result = await deleteWorkplace(1);

    expect(result.success).toBe(true);
  });
});

// ============ 근무 기록 (Work Record) 테스트 ============

describe("Work Record API", () => {
  const mockWorkRecordListResponse = {
    success: true,
    data: [
      {
        id: 101,
        contractId: 5,
        workerName: "홍길동",
        workplaceName: "강남본점",
        workDate: "2026-01-20",
        startTime: "09:00",
        endTime: "18:00",
        breakMinutes: 60,
        hourlyWage: 10000,
        status: "COMPLETED",
      },
    ],
    error: null,
  };

  it("getWorkRecords - 근무 기록 목록을 조회한다", async () => {
    mockApi.onGet("/api/employer/work-records").reply(200, mockWorkRecordListResponse);

    const result = await getWorkRecords(1, "2026-01-01", "2026-01-31");

    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(1);
    expect(result.data[0].workerName).toBe("홍길동");
  });

  it("getWorkRecord - 특정 근무 기록을 조회한다", async () => {
    const mockResponse = {
      success: true,
      data: {
        ...mockWorkRecordListResponse.data[0],
        workerCode: "W-202401-001",
        totalWorkMinutes: 480,
        isModified: false,
        memo: "오픈 준비 포함",
      },
      error: null,
    };
    mockApi.onGet("/api/employer/work-records/101").reply(200, mockResponse);

    const result = await getWorkRecord(101);

    expect(result.success).toBe(true);
    expect(result.data.totalWorkMinutes).toBe(480);
  });

  it("createWorkRecord - 근무 기록을 생성한다", async () => {
    const mockResponse = {
      success: true,
      data: { id: 102, contractId: 5, workDate: "2026-01-21" },
      error: null,
    };
    mockApi.onPost("/api/employer/work-records").reply(201, mockResponse);

    const result = await createWorkRecord({
      contractId: 5,
      workDate: "2026-01-21",
      startTime: "09:00",
      endTime: "18:00",
    });

    expect(result.success).toBe(true);
    expect(result.data.id).toBe(102);
  });

  it("updateWorkRecord - 근무 기록을 수정한다", async () => {
    const mockResponse = {
      success: true,
      data: { id: 101, startTime: "10:00", endTime: "19:00" },
      error: null,
    };
    mockApi.onPut("/api/employer/work-records/101").reply(200, mockResponse);

    const result = await updateWorkRecord(101, {
      startTime: "10:00",
      endTime: "19:00",
    });

    expect(result.success).toBe(true);
    expect(result.data.startTime).toBe("10:00");
  });

  it("deleteWorkRecord - 근무 기록을 삭제한다", async () => {
    const mockResponse = { success: true, data: null, error: null };
    mockApi.onDelete("/api/employer/work-records/101").reply(200, mockResponse);

    const result = await deleteWorkRecord(101);

    expect(result.success).toBe(true);
  });

  it("approveWorkRecord - 근무 기록을 승인한다", async () => {
    const mockResponse = {
      success: true,
      data: { id: 101, status: "COMPLETED" },
      error: null,
    };
    mockApi.onPut("/api/employer/work-records/101/approve").reply(200, mockResponse);

    const result = await approveWorkRecord(101);

    expect(result.success).toBe(true);
    expect(result.data.status).toBe("COMPLETED");
  });

  it("rejectWorkRecord - 근무 기록을 거절한다", async () => {
    const mockResponse = {
      success: true,
      data: { id: 101, status: "REJECTED" },
      error: null,
    };
    mockApi.onPut("/api/employer/work-records/101/reject").reply(200, mockResponse);

    const result = await rejectWorkRecord(101);

    expect(result.success).toBe(true);
    expect(result.data.status).toBe("REJECTED");
  });
});

// ============ 계약 (Contract) 테스트 ============

describe("Contract API", () => {
  const mockContractWorkerListResponse = {
    success: true,
    data: [
      {
        id: 10,
        workerName: "홍길동",
        workerCode: "W-2024-001",
        workerPhone: "010-1234-5678",
        hourlyWage: 10030,
        contractStartDate: "2026-01-01",
        contractEndDate: null,
        isActive: true,
      },
    ],
    error: null,
  };

  it("getContractsByWorkplace - 사업장별 계약 목록을 조회한다", async () => {
    mockApi
      .onGet("/api/employer/workplaces/1/workers")
      .reply(200, mockContractWorkerListResponse);

    const result = await getContractsByWorkplace(1);

    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(1);
    expect(result.data[0].workerName).toBe("홍길동");
  });

  it("getContract - 계약 상세 정보를 조회한다", async () => {
    const mockResponse = {
      success: true,
      data: {
        id: 10,
        workplaceId: 1,
        workplaceName: "강남본점",
        workerId: 5,
        workerName: "홍길동",
        workerCode: "W-2024-001",
        workerPhone: "010-1234-5678",
        hourlyWage: 10030,
        workSchedules:
          '[{"dayOfWeek":"MONDAY","startTime":"09:00","endTime":"18:00"}]',
        contractStartDate: "2026-01-01",
        contractEndDate: null,
        paymentDay: 10,
        isActive: true,
        payrollDeductionType: "NONE",
      },
      error: null,
    };
    mockApi.onGet("/api/employer/contracts/10").reply(200, mockResponse);

    const result = await getContract(10);

    expect(result.success).toBe(true);
    expect(result.data.payrollDeductionType).toBe("NONE");
  });

  it("createContract - 계약을 생성한다", async () => {
    const mockResponse = {
      success: true,
      data: { id: 11, workerName: "김철수" },
      error: null,
    };
    mockApi.onPost("/api/employer/workplaces/1/workers").reply(201, mockResponse);

    const result = await createContract(1, {
      workerCode: "W-2024-002",
      hourlyWage: 10000,
      workSchedules: [],
      contractStartDate: "2026-01-15",
      paymentDay: 10,
      payrollDeductionType: "PART_TIME_NONE",
    });

    expect(result.success).toBe(true);
    expect(result.data.id).toBe(11);
  });

  it("updateContract - 계약을 수정한다", async () => {
    const mockResponse = {
      success: true,
      data: { id: 10, hourlyWage: 11000 },
      error: null,
    };
    mockApi.onPut("/api/employer/contracts/10").reply(200, mockResponse);

    const result = await updateContract(10, {
      hourlyWage: 11000,
    });

    expect(result.success).toBe(true);
    expect(result.data.hourlyWage).toBe(11000);
  });

  it("deleteContract - 계약을 삭제한다", async () => {
    const mockResponse = { success: true, data: null, error: null };
    mockApi.onDelete("/api/employer/contracts/10").reply(200, mockResponse);

    const result = await deleteContract(10);

    expect(result.success).toBe(true);
  });
});

// ============ 급여 (Salary) 테스트 ============

describe("Salary API", () => {
  it("getSalaries - 급여 목록을 조회한다", async () => {
    const mockResponse = {
      success: true,
      data: [
        {
          id: 50,
          contractId: 10,
          workerName: "홍길동",
          year: 2026,
          month: 1,
          totalGrossPay: 2500000,
          netPay: 2245000,
          paymentDueDate: "2026-02-10",
        },
      ],
      error: null,
    };
    mockApi.onGet("/api/employer/salaries").reply(200, mockResponse);

    const result = await getSalaries({ workplaceId: 1, year: 2026, month: 1 });

    expect(result.success).toBe(true);
    expect(result.data[0].netPay).toBe(2245000);
  });

  it("getSalary - 급여 상세를 조회한다", async () => {
    const mockResponse = {
      success: true,
      data: {
        id: 50,
        contractId: 10,
        workerId: 5,
        workerName: "홍길동",
        workplaceId: 1,
        workplaceName: "강남본점",
        year: 2026,
        month: 1,
        totalWorkHours: 160.5,
        basePay: 2100000,
        overtimePay: 150000,
        nightPay: 50000,
        holidayPay: 200000,
        totalGrossPay: 2500000,
        fourMajorInsurance: 220000,
        incomeTax: 31500,
        localIncomeTax: 3150,
        totalDeduction: 254650,
        netPay: 2245350,
        paymentDueDate: "2026-02-10",
      },
      error: null,
    };
    mockApi.onGet("/api/employer/salaries/50").reply(200, mockResponse);

    const result = await getSalary(50);

    expect(result.success).toBe(true);
    expect(result.data.basePay).toBe(2100000);
    expect(result.data.totalDeduction).toBe(254650);
  });

  it("calculateSalary - 급여를 계산한다", async () => {
    const mockResponse = {
      success: true,
      data: { id: 51, netPay: 1500000 },
      error: null,
    };
    mockApi.onPost("/api/employer/salaries/calculate").reply(200, mockResponse);

    const result = await calculateSalary({
      contractId: 10,
      year: 2026,
      month: 2,
    });

    expect(result.success).toBe(true);
    expect(result.data.netPay).toBe(1500000);
  });
});

// ============ 정정 요청 (Correction Request) 테스트 ============

describe("Correction Request API", () => {
  it("getPendingApprovals - 승인 대기 요청 목록을 조회한다", async () => {
    const mockResponse = {
      success: true,
      data: [
        {
          id: 201,
          type: "UPDATE",
          workRecordId: 105,
          workDate: "2026-01-28",
          originalStartTime: "09:00",
          originalEndTime: "18:00",
          requestedStartTime: "09:00",
          requestedEndTime: "19:00",
          status: "PENDING",
          requester: { id: 5, name: "홍길동" },
          workplaceName: "강남본점",
          createdAt: "2026-01-28T19:05:00",
        },
      ],
      error: null,
    };
    mockApi
      .onGet("/api/employer/workplaces/1/pending-approvals")
      .reply(200, mockResponse);

    const result = await getPendingApprovals(1);

    expect(result.success).toBe(true);
    expect(result.data[0].type).toBe("UPDATE");
    expect(result.data[0].requester.name).toBe("홍길동");
  });

  it("approveCorrectionRequest - 정정 요청을 승인한다", async () => {
    const mockResponse = {
      success: true,
      data: { id: 201, status: "APPROVED" },
      error: null,
    };
    mockApi
      .onPut("/api/employer/correction-requests/201/approve")
      .reply(200, mockResponse);

    const result = await approveCorrectionRequest(201);

    expect(result.success).toBe(true);
    expect(result.data.status).toBe("APPROVED");
  });

  it("rejectCorrectionRequest - 정정 요청을 거절한다", async () => {
    const mockResponse = {
      success: true,
      data: { id: 201, status: "REJECTED" },
      error: null,
    };
    mockApi
      .onPut("/api/employer/correction-requests/201/reject")
      .reply(200, mockResponse);

    const result = await rejectCorrectionRequest(201);

    expect(result.success).toBe(true);
    expect(result.data.status).toBe("REJECTED");
  });
});

// ============ 송금 (Payment) 테스트 ============

describe("Payment API", () => {
  it("createPayment - 송금을 생성한다", async () => {
    const mockResponse = {
      success: true,
      data: { id: 1, salaryId: 50, amount: 2245000 },
      error: null,
    };
    mockApi.onPost("/api/employer/payments").reply(201, mockResponse);

    const result = await createPayment({
      salaryId: 50,
      amount: 2245000,
    });

    expect(result.success).toBe(true);
    expect(result.data.amount).toBe(2245000);
  });
});

// ============ 근로자 (Worker) 테스트 ============

describe("Worker API", () => {
  it("getWorkerByCode - 근로자 코드로 조회한다", async () => {
    const mockResponse = {
      success: true,
      data: {
        id: 5,
        userId: 12,
        name: "홍길동",
        phone: "010-1234-5678",
        workerCode: "W-2026-001",
        accountNumber: "123-456-789012",
        bankName: "신한은행",
      },
      error: null,
    };
    mockApi.onGet("/api/workers/code/W-2026-001").reply(200, mockResponse);

    const result = await getWorkerByCode("W-2026-001");

    expect(result.success).toBe(true);
    expect(result.data.name).toBe("홍길동");
    expect(result.data.bankName).toBe("신한은행");
  });

  it("getWorkerById - 근로자 ID로 조회한다", async () => {
    const mockResponse = {
      success: true,
      data: {
        id: 5,
        userId: 12,
        name: "홍길동",
        phone: "010-1234-5678",
        workerCode: "W-2026-001",
      },
      error: null,
    };
    mockApi.onGet("/api/workers/5").reply(200, mockResponse);

    const result = await getWorkerById(5);

    expect(result.success).toBe(true);
    expect(result.data.id).toBe(5);
  });
});

// ============ 에러 처리 테스트 ============

describe("Error Handling", () => {
  it("API 에러 시 에러 응답을 반환한다", async () => {
    const mockErrorResponse = {
      success: false,
      data: null,
      error: {
        code: "NOT_FOUND",
        message: "사업장을 찾을 수 없습니다.",
      },
    };
    mockApi.onGet("/api/employer/workplaces/999").reply(404, mockErrorResponse);

    await expect(getWorkplace(999)).rejects.toMatchObject({
      response: {
        status: 404,
        data: {
          error: {
            code: "NOT_FOUND",
          },
        },
      },
    });
  });

  it("네트워크 에러 시 예외를 throw한다", async () => {
    mockApi.onGet("/api/employer/workplaces").networkError();

    await expect(getWorkplaces()).rejects.toThrow("Network Error");
  });
});
