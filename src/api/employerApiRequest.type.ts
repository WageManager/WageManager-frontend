// ============ 근무지 (Workplace) ============
export interface CreateWorkplaceRequest {
  businessNumber: string;      // 사업자 등록번호 (형식: 000-00-00000)
  businessName: string;        // 사업장 상호명
  workplaceName: string;       // 지점명 또는 별칭
  address: string;
  colorCode?: string;          // 앱 내 캘린더 등에서 구분하기 위한 색상 (Hex Code)
  isLessThanFiveEmployees?: boolean;  // 5인 미만 사업장 여부
}

export interface UpdateWorkplaceRequest {
  businessName?: string;       // 사업장 상호명
  workplaceName?: string;      // 지점명 또는 별칭
  address?: string;
  colorCode?: string;
  isLessThanFiveEmployees?: boolean;
  // 참고: businessNumber는 수정 불가
}

// ============ 근무 기록 (Work Record) ============
export interface CreateWorkRecordRequest {
  contractId: number;
  workDate: string;
  startTime: string;
  endTime: string;
  breakMinutes?: number;
  memo?: string;
}

export interface UpdateWorkRecordRequest {
  startTime?: string;
  endTime?: string;
  breakMinutes?: number;
  memo?: string;
}

export interface CreateWorkRecordsBatchRequest {
  records: CreateWorkRecordRequest[];
}

// ============ 계약 (Contract) ============
export interface WorkSchedule {
  dayOfWeek: number; // 1=월요일, 7=일요일
  startTime: string;
  endTime: string;
}

export interface CreateContractRequest {
  workerCode: string;
  hourlyWage: number;
  workSchedules: WorkSchedule[];
  contractStartDate: string;
  contractEndDate?: string | null;
  paymentDay: number;
  payrollDeductionType: PayrollDeductionType;
}

export interface UpdateContractRequest {
  hourlyWage?: number;
  workSchedules?: WorkSchedule[];
  paymentDay?: number;
  payrollDeductionType?: PayrollDeductionType;
}

export type PayrollDeductionType =
  | "PART_TIME_NONE"
  | "PART_TIME_TAX_ONLY"
  | "PART_TIME_TAX_AND_INSURANCE";

// ============ 급여 (Salary) ============
export interface CalculateSalaryRequest {
  contractId: number;
  year: number;
  month: number;
}

export interface GetSalariesParams {
  workplaceId?: number;
  year?: number;
  month?: number;
}

// ============ 송금 (Payment) ============
export interface CreatePaymentRequest {
  salaryId: number;
  amount: number;
  memo?: string;
}

// ============ 정정 요청 (Correction Request) ============
export type CorrectionFilter = "ALL" | "CREATE" | "UPDATE" | "DELETE";

// ============ 근로자 (Worker) ============
export interface UpdateWorkerRequest {
  name?: string;
  phone?: string;
  bankName?: string;
  accountNumber?: string;
  kakaoPayLink?: string;
}
