import wageManagerApi from './axios';
import type {
  CreateCorrectionRequestPayload,
} from './workerApiRequest.type';
import type {
  ApiResponse,
  Contract,
  ContractDetailResponse,
  CorrectionStatus,
  CorrectionRequestResponse,
  WorkRecordsResponse,
  SalaryListItem,
  SalaryDetailResponse,
  PaymentResponse,
} from './workerApiResponse.type';
import type { WorkerResponse } from './userApiResponse.type';

// 타입 re-export (다른 파일에서 import할 수 있도록)
export type {
  CorrectionRequestType,
  CreateCorrectionRequestPayload,
} from './workerApiRequest.type';

export type {
  ApiResponse,
  Contract,
  ContractDetailResponse,
  CorrectionStatus,
  CorrectionRequestResponse,
  WorkRecordsResponse,
  PayrollDeductionType,
  SalaryListItem,
  SalaryDetailResponse,
  PaymentStatus,
  PaymentResponse,
} from './workerApiResponse.type';

// ============ API 함수 ============

// 근로자 정보 조회
export const getWorkerInfo = async (userId: number): Promise<ApiResponse<WorkerResponse>> => {
  const { data } = await wageManagerApi.get(`/api/workers/user/${userId}`);
  return data;
};

// 근로자 계약 목록 조회
export const getContracts = async (): Promise<ApiResponse<Contract[]>> => {
  const { data } = await wageManagerApi.get('/api/worker/contracts');
  return data;
};

// 근로자 계약 상세 정보 조회
export const getContractDetail = async (contractId: number): Promise<ApiResponse<ContractDetailResponse>> => {
  const { data } = await wageManagerApi.get(`/api/worker/contracts/${contractId}`);
  return data;
};

// 정정 요청 목록 조회
export const getCorrectionRequests = async (status?: CorrectionStatus): Promise<ApiResponse<CorrectionRequestResponse[]>> => {
  const { data } = await wageManagerApi.get(`/api/worker/correction-requests`, {
    params: { status }
  });
  return data;
};

// 근무 기록 정정 요청 생성
export const createCorrectionRequest = async (payload: CreateCorrectionRequestPayload): Promise<ApiResponse<unknown>> => {
  const { data } = await wageManagerApi.post('/api/worker/correction-requests', payload);
  return data;
};

// 근로자 근무 기록 조회
export const getWorkRecords = async (startDate: string, endDate: string): Promise<ApiResponse<WorkRecordsResponse[]>> => {
  const { data } = await wageManagerApi.get('/api/worker/work-records', { params: { startDate, endDate } });
  return data;
};

// 근무 기록 생성 요청
// TODO: 백엔드 엔드포인트 삭제됨 - 이 함수 제거 필요
export const createWorkRecord = async (payload: any) => {
  const { data } = await wageManagerApi.post('/api/worker/work-records', payload);
  return data;
};

// 근로자 급여 기록 목록 조회
export const getSalaries = async (): Promise<ApiResponse<SalaryListItem[]>> => {
  const { data } = await wageManagerApi.get(`/api/worker/salaries`);
  return data;
};

// 급여 자동 계산
export const calculateSalary = async (contractId: number, year: number, month: number): Promise<ApiResponse<SalaryDetailResponse>> => {
  const { data } = await wageManagerApi.post(
    `/api/worker/salaries/contracts/${contractId}/calculate`, { year, month }
  );
  return data;
};

// 송금 내역 조회
export const getPayments = async (): Promise<ApiResponse<PaymentResponse[]>> => {
  const { data } = await wageManagerApi.get('/api/worker/payments');
  return data;
};

