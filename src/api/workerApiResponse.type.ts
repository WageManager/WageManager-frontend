// ============ 공통 API 응답 래퍼 ============

/** 백엔드 공통 응답 구조 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error: { code: string; message: string } | null;
}

// ============ 계약 관련 타입 ============

/** 급여 공제 유형 */
export type PayrollDeductionType = 'INCOME_TAX_3_3' | 'FOUR_MAJOR_INSURANCES';

/** 계약 목록 조회 응답 아이템 (/api/worker/contracts) */
export interface Contract {
  id: number;
  workerName: string;
  workerCode: string;
  workerPhone: string;
  hourlyWage: number;
  contractStartDate: string;
  contractEndDate: string | null;
  isActive: boolean;
  workplaceName?: string;
}

/** 계약 상세 조회 응답 (/api/worker/contracts/{id}) */
export interface ContractDetailResponse {
  id: number;
  workplaceId: number;
  workplaceName: string;
  workerId: number;
  workerName: string;
  workerCode: string;
  workerPhone: string;
  hourlyWage: number;
  /** JSON 문자열 형태의 근무 시간표 */
  workSchedules: string;
  contractStartDate: string;
  contractEndDate: string | null;
  paymentDay: number;
  isActive: boolean;
  payrollDeductionType: PayrollDeductionType;
}

// ============ 정정 요청 관련 타입 ============

/** 정정 요청 상태 */
export type CorrectionStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

/** 정정 요청 유형 */
export type CorrectionRequestType = 'CREATE' | 'UPDATE' | 'DELETE';

/** 정정 요청자 정보 */
export interface CorrectionRequester {
  id: number;
  name: string;
}

/** 정정 요청 목록 조회 응답 아이템 (/api/worker/correction-requests) */
export interface CorrectionRequestResponse {
  id: number;
  workplaceName: string;
  /** 정정 요청 유형: CREATE(신규 생성), UPDATE(수정), DELETE(삭제) */
  type: CorrectionRequestType;
  /** 기존 근무 기록 ID (UPDATE/DELETE 시 존재, CREATE 시 null) */
  workRecordId: number | null;
  /** YYYY-MM-DD */
  workDate: string;
  /** HH:mm:ss - 기존 출근 시간 (UPDATE/DELETE 시 존재) */
  originalStartTime: string | null;
  /** HH:mm:ss - 기존 퇴근 시간 (UPDATE/DELETE 시 존재) */
  originalEndTime: string | null;
  /** HH:mm:ss - 요청 출근 시간 */
  requestedStartTime: string;
  /** HH:mm:ss - 요청 퇴근 시간 */
  requestedEndTime: string;
  status: CorrectionStatus;
  /** 요청자 정보 */
  requester: CorrectionRequester;
  /** ISO-8601 */
  createdAt: string;
}

/** 근무 기록 조회 응답 (/api/worker/work-records) */
export interface WorkRecordsResponse {
  id: number;
  contractId: number;
  workerCode: string;
  workplaceName: string;
  workDate: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  totalWorkMinutes: number;
  status: string;
  isModified: boolean;
  wage?: number;
  memo?: string;
}

// ============ 급여 관련 타입 ============

/** 급여 목록 조회 응답 아이템 (/api/worker/salaries) */
export interface SalaryListItem {
  id: number;
  contractId: number;
  workerName: string;
  year: number;
  month: number;
  totalGrossPay: number;
  netPay: number;
  paymentDueDate: string;
}

/** 급여 상세 조회 응답 (/api/worker/salaries/{id}) */
export interface SalaryDetailResponse {
  id: number;
  contractId: number;
  workerId: number;
  workerName: string;
  workplaceId: number;
  workplaceName: string;
  year: number;
  month: number;
  totalWorkHours: number;
  basePay: number;
  overtimePay: number;
  nightPay: number;
  holidayPay: number;
  totalGrossPay: number;
  fourMajorInsurance: number;
  incomeTax: number;
  localIncomeTax: number;
  totalDeduction: number;
  netPay: number;
  paymentDueDate: string;
}

// ============ 송금 관련 타입 ============

/** 송금 상태 */
export type PaymentStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

/** 송금 내역 조회 응답 아이템 (/api/worker/payments) */
export interface PaymentResponse {
  id: number;
  salaryId: number;
  workerName: string;
  year: number;
  month: number;
  netPay: number;
  status: PaymentStatus;
  /** 송금 완료 시각 (ISO-8601). 미완료 시 null */
  paymentDate: string | null;
  /** status === 'COMPLETED'이면 true */
  isPaid: boolean;
}
