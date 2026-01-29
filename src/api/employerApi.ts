import wageManagerApi from "./axios";
import type {
  CreateWorkplaceRequest,
  UpdateWorkplaceRequest,
  CreateWorkRecordRequest,
  UpdateWorkRecordRequest,
  CreateWorkRecordsBatchRequest,
  CreateContractRequest,
  UpdateContractRequest,
  CalculateSalaryRequest,
  GetSalariesParams,
  CreatePaymentRequest,
  CorrectionFilter,
  UpdateWorkerRequest,
} from "./employerApiRequest.type";

// 날짜 포맷 헬퍼
const formatDate = (value: Date | string): string =>
  typeof value === "string" ? value : value.toISOString().split("T")[0] ?? "";

// ============ 근무지 (Workplace) ============

export const getWorkplaces = async () => {
  const { data } = await wageManagerApi.get("/api/employer/workplaces");
  return data;
};

export const getWorkplace = async (id: number | string) => {
  const { data } = await wageManagerApi.get(`/api/employer/workplaces/${id}`);
  return data;
};

export const createWorkplace = async (reqData: CreateWorkplaceRequest) => {
  const { data } = await wageManagerApi.post("/api/employer/workplaces", {
    businessNumber: reqData.businessNumber,
    businessName: reqData.businessName,
    name: reqData.workplaceName,
    address: reqData.address,
    colorCode: reqData.colorCode,
    isLessThanFiveEmployees: reqData.isLessThanFiveEmployees ?? false,
  });
  return data;
};

export const updateWorkplace = async (
  id: number | string,
  reqData: UpdateWorkplaceRequest
) => {
  const { data } = await wageManagerApi.put(`/api/employer/workplaces/${id}`, {
    businessNumber: reqData.businessNumber,
    businessName: reqData.businessName,
    name: reqData.workplaceName,
    address: reqData.address,
    colorCode: reqData.colorCode,
    isLessThanFiveEmployees: reqData.isLessThanFiveEmployees,
  });
  return data;
};

export const deleteWorkplace = async (id: number | string) => {
  const { data } = await wageManagerApi.delete(`/api/employer/workplaces/${id}`);
  return data;
};

// ============ 근무 기록 (Work Record) ============

export const getWorkRecords = async (
  workplaceId: number | string,
  startDate: Date | string,
  endDate: Date | string
) => {
  const { data } = await wageManagerApi.get("/api/employer/work-records", {
    params: {
      workplaceId,
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
    },
  });
  return data;
};

export const getWorkRecord = async (id: number | string) => {
  const { data } = await wageManagerApi.get(`/api/employer/work-records/${id}`);
  return data;
};

export const createWorkRecord = async (reqData: CreateWorkRecordRequest) => {
  const { data } = await wageManagerApi.post("/api/employer/work-records", reqData);
  return data;
};

export const updateWorkRecord = async (
  id: number | string,
  reqData: UpdateWorkRecordRequest
) => {
  const { data } = await wageManagerApi.put(`/api/employer/work-records/${id}`, reqData);
  return data;
};

export const deleteWorkRecord = async (id: number | string) => {
  const { data } = await wageManagerApi.delete(`/api/employer/work-records/${id}`);
  return data;
};

export const approveWorkRecord = async (id: number | string) => {
  const { data } = await wageManagerApi.put(`/api/employer/work-records/${id}/approve`);
  return data;
};

export const rejectWorkRecord = async (id: number | string) => {
  const { data } = await wageManagerApi.put(`/api/employer/work-records/${id}/reject`);
  return data;
};

export const completeWorkRecord = async (id: number | string) => {
  const { data } = await wageManagerApi.put(`/api/employer/work-records/${id}/complete`);
  return data;
};

export const createWorkRecordsBatch = async (reqData: CreateWorkRecordsBatchRequest) => {
  const { data } = await wageManagerApi.post("/api/employer/work-records/batch", reqData);
  return data;
};

// ============ 계약 (Contract) ============

export const getContractsByWorkplace = async (workplaceId: number | string) => {
  const { data } = await wageManagerApi.get(`/api/employer/workplaces/${workplaceId}/workers`);
  return data;
};

export const getContract = async (id: number | string) => {
  const { data } = await wageManagerApi.get(`/api/employer/contracts/${id}`);
  return data;
};

export const createContract = async (
  workplaceId: number | string,
  reqData: CreateContractRequest
) => {
  const { data } = await wageManagerApi.post(
    `/api/employer/workplaces/${workplaceId}/workers`,
    reqData
  );
  return data;
};

export const updateContract = async (
  id: number | string,
  reqData: UpdateContractRequest
) => {
  const { data } = await wageManagerApi.put(`/api/employer/contracts/${id}`, reqData);
  return data;
};

export const deleteContract = async (id: number | string) => {
  const { data } = await wageManagerApi.delete(`/api/employer/contracts/${id}`);
  return data;
};

// ============ 급여 (Salary) ============

export const getSalaries = async (params?: GetSalariesParams) => {
  const { data } = await wageManagerApi.get("/api/employer/salaries", { params });
  return data;
};

export const getSalary = async (id: number | string) => {
  const { data } = await wageManagerApi.get(`/api/employer/salaries/${id}`);
  return data;
};

export const calculateSalary = async (reqData: CalculateSalaryRequest) => {
  const { data } = await wageManagerApi.post("/api/employer/salaries/calculate", reqData);
  return data;
};

// ============ 정정 요청 (Correction Request) ============

export const getPendingApprovals = async (
  workplaceId: number | string,
  filter: CorrectionFilter = "ALL"
) => {
  const params = filter === "ALL" ? {} : { type: filter };
  const { data } = await wageManagerApi.get(
    `/api/employer/workplaces/${workplaceId}/pending-approvals`,
    { params }
  );
  return data;
};

export const getEmployerCorrectionRequests = async (params?: Record<string, unknown>) => {
  const { data } = await wageManagerApi.get("/api/employer/correction-requests", { params });
  return data;
};

export const getEmployerCorrectionRequest = async (id: number | string) => {
  const { data } = await wageManagerApi.get(`/api/employer/correction-requests/${id}`);
  return data;
};

export const approveCorrectionRequest = async (id: number | string) => {
  const { data } = await wageManagerApi.put(`/api/employer/correction-requests/${id}/approve`);
  return data;
};

export const rejectCorrectionRequest = async (id: number | string) => {
  const { data } = await wageManagerApi.put(`/api/employer/correction-requests/${id}/reject`);
  return data;
};

// ============ 송금 (Payment) ============

export const createPayment = async (reqData: CreatePaymentRequest) => {
  const { data } = await wageManagerApi.post("/api/employer/payments", reqData);
  return data;
};

// ============ 근로자 정보 조회 (Worker Info) ============

export const getWorkerByCode = async (workerCode: string) => {
  const { data } = await wageManagerApi.get(`/api/workers/code/${workerCode}`);
  return data;
};

export const getWorkerById = async (workerId: number | string) => {
  const { data } = await wageManagerApi.get(`/api/workers/${workerId}`);
  return data;
};

export const getWorkerByUserId = async (userId: number | string) => {
  const { data } = await wageManagerApi.get(`/api/workers/user/${userId}`);
  return data;
};

export const updateWorker = async (
  workerId: number | string,
  reqData: UpdateWorkerRequest
) => {
  const { data } = await wageManagerApi.put(`/api/workers/${workerId}`, reqData);
  return data;
};
