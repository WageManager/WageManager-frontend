import type { PayrollDeductionType } from "./employerApiRequest.type";

// ============ 근무지 (Workplace) ============

// GET /api/employer/workplaces - 사업장 목록 조회
export interface Workplace {
  id: number;
  businessName: string;
  name: string;
  colorCode?: string;
  workerCount?: number;
  isActive?: boolean;
}

// ============ 근무 기록 (Work Record) ============

// GET /api/employer/work-records - 근무 기록 목록 조회
export interface WorkRecord {
  id: number;
  contractId: number;
  workerName: string;
  workplaceName: string;
  workDate: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  hourlyWage: number;
  status: WorkRecordStatus;
}

// GET /api/employer/work-records/{id} - 근무 기록 상세 조회
export interface WorkRecordDetail extends WorkRecord {
  workerCode: string;
  totalWorkMinutes: number;
  isModified: boolean;
  memo?: string;
}

export type WorkRecordStatus =
  | "SCHEDULED"
  | "COMPLETED"
  | "PENDING_APPROVAL"
  | "REJECTED";

// ============ 계약 (Contract) ============

// GET /api/employer/workplaces/{workplaceId}/workers - 사업장별 근로자(계약) 목록
export interface ContractWorker {
  id: number;
  workerName: string;
  workerCode: string;
  workerPhone: string;
  hourlyWage: number;
  contractStartDate: string;
  contractEndDate: string | null;
  isActive: boolean;
}

// GET /api/employer/contracts/{id} - 계약 상세 조회
export interface Contract {
  id: number;
  workplaceId: number;
  workplaceName: string;
  workerId: number;
  workerName: string;
  workerCode: string;
  workerPhone: string;
  hourlyWage: number;
  workSchedules: string; // JSON 문자열
  contractStartDate: string;
  contractEndDate: string | null;
  paymentDay: number;
  isActive: boolean;
  payrollDeductionType: PayrollDeductionType;
}

// PayrollDeductionType은 employerApiRequest.type.ts에서 정의됨
// 요청/응답 모두 동일한 값을 사용
export type { PayrollDeductionType };

export interface WorkScheduleItem {
  dayOfWeek: string; // "MONDAY", "TUESDAY", etc.
  startTime: string;
  endTime: string;
}

// ============ 급여 (Salary) ============

// GET /api/employer/salaries/year-month - 사업장별 급여 목록 조회
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

// GET /api/employer/salaries/{id} - 급여 상세 조회
export interface SalaryDetail {
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

// ============ 정정 요청 (Correction Request) ============

// GET /api/employer/workplaces/{workplaceId}/pending-approvals - 승인 대기 요청 목록
export interface CorrectionRequestListItem {
  id: number;
  type: CorrectionRequestType;
  workRecordId: number | null;
  workDate: string;
  originalStartTime: string | null;
  originalEndTime: string | null;
  requestedStartTime: string;
  requestedEndTime: string;
  status: CorrectionRequestStatus;
  requester: {
    id: number;
    name: string;
  };
  workplaceName: string;
  createdAt: string;
}

// GET /api/employer/correction-requests/{id} - 정정 요청 상세 조회
export interface CorrectionRequestDetail {
  id: number;
  type: CorrectionRequestType;
  workRecordId: number | null;
  contractId: number;
  originalWorkDate: string | null;
  originalStartTime: string | null;
  originalEndTime: string | null;
  requestedWorkDate: string;
  requestedStartTime: string;
  requestedEndTime: string;
  requestedBreakMinutes: number;
  requestedMemo: string;
  status: CorrectionRequestStatus;
  requester: {
    id: number;
    name: string;
  };
  reviewedAt: string | null;
  createdAt: string;
}

export type CorrectionRequestType = "CREATE" | "UPDATE" | "DELETE";
export type CorrectionRequestStatus = "PENDING" | "APPROVED" | "REJECTED";

// ============ 근로자 (Worker) ============

// GET /api/workers/code/{workerCode} - 근로자 코드로 조회
export interface Worker {
  id: number;
  userId: number;
  name: string;
  phone: string;
  workerCode: string;
  accountNumber?: string;
  bankName?: string;
}
