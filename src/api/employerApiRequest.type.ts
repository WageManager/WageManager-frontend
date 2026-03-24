// ============ 근무지 (Workplace) ============
export interface CreateWorkplaceRequest {
  businessNumber: string;
  name: string;
  address: string;
  colorCode?: string;
  isLessThanFiveEmployees: boolean;
}

export interface UpdateWorkplaceRequest {
  name?: string;
  address?: string;
  colorCode?: string;
  isLessThanFiveEmployees?: boolean;
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
  breakMinutes?: number;
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

/**
 * 급여 공제 유형
 * - FREELANCER: 프리랜서 (3.3% 공제 - 소득세 3% + 지방소득세 0.3%)
 * - PART_TIME_NONE: 비정규직 공제 없음 (세금 X, 보험료 X)
 * - PART_TIME_TAX_ONLY: 비정규직 세금만 공제 (소득세 + 지방소득세)
 * - PART_TIME_TAX_AND_INSURANCE: 비정규직 전체 공제 (4대보험 + 소득세)
 */
export type PayrollDeductionType =
  | "FREELANCER"
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
}

// ============ 정정 요청 (Correction Request) ============
export type CorrectionFilter = "ALL" | "CREATE" | "UPDATE" | "DELETE";

// ============ 근로자 (Worker) ============
export interface UpdateWorkerRequest {
  name?: string;
  phone?: string;
  bankName?: string;
  accountNumber?: string;
}
