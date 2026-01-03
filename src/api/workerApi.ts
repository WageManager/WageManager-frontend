import wageManagerApi from './axios';

// 사용자 프로필 조회
export const getUserProfile = async () => {
  const { data } = await wageManagerApi.get('/api/users/me');
  return data;
};

// 근로자 정보 조회
export const getWorkerInfo = async (userId: number) => {
  const { data } = await wageManagerApi.get(`/api/workers/user/${userId}`);
  return data;
};

// 사용자 프로필 수정
export const updateUserProfile = async (userData: any) => {
  const { data } = await wageManagerApi.put('/api/users/me', userData);
  return data;
};

// 계좌 정보 수정 (카카오페이 링크)
export const updateAccountInfo = async (accountData: string) => {
  const { data } = await wageManagerApi.put('/api/users/me/account', accountData);
  return data;
};

// 근로자 계약 목록 조회
export const getContracts = async () => {
  const { data } = await wageManagerApi.get('/api/worker/contracts');
  return data;
};

// 근로자 계약 상세 정보 조회
export const getContractDetail = async (contractId: number) => {
  const { data } = await wageManagerApi.get(`/api/worker/contracts/${contractId}`);
  return data;
};

// 정정 요청 목록 조회
type CorrectionStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export const getCorrectionRequests = async (status?: CorrectionStatus) => {
  const { data } = await wageManagerApi.get(`/api/worker/correction-requests`, {
    params: { status }
  });
  return data;
};

// 근무 기록 정정 요청 생성
export const createCorrectionRequest = async (payload: any) => {
  const { data } = await wageManagerApi.post('/api/worker/correction-requests', payload);
  return data;
};

// 근로자 근무 기록 조회
export const getWorkRecords = async (startDate: string, endDate: string) => {
  const { data } = await wageManagerApi.get('/api/worker/work-records', { params: { startDate, endDate } });
  return data;
};

// 근무 기록 생성 요청
export const createWorkRecord = async (payload: any) => {
  const { data } = await wageManagerApi.post('/api/worker/correction-requests', payload);
  return data;
};

// 근로자 급여 기록 목록 조회
export const getSalaries = async () => {
  const { data } = await wageManagerApi.get(`/api/worker/salaries`);
  return data;
};

// 급여 자동 계산
export const calculateSalary = async (contractId: number, year: number, month: number) => {
  const { data } = await wageManagerApi.post(
    `/api/worker/salaries/contracts/${contractId}/calculate`, { year, month }
  );
  return data;
};

// 송금 내역 조회
export const getPayments = async () => {
  const { data } = await wageManagerApi.get('/api/worker/payments');
  return data;
};

