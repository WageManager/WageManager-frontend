import wageManagerApi from './axios';

// 사용자 프로필 조회
export const getUserProfile = async () => {
  try {
    const response = await httpClient.get('/api/users/me');
    return response;
  } catch (error) {
    console.error('[workerApi] getUserProfile 에러:', error);
    throw error;
  }
};

// 근로자 정보 조회
export const getWorkerInfo = async (userId) => {
  try {
    const response = await httpClient.get(`/api/workers/user/${userId}`);
    return response;
  } catch (error) {
    console.error('[workerApi] getWorkerInfo 에러:', error);
    throw error;
  }
};

// 사용자 프로필 수정
export const updateUserProfile = async (userData) => {
  try {
    const response = await httpClient.put('/api/users/me', userData);
    return response;
  } catch (error) {
    console.error('[workerApi] updateUserProfile 에러:', error);
    throw error;
  }
};

// 계좌 정보 수정 (카카오페이 링크)
export const updateAccountInfo = async (accountData) => {
  try {
    const response = await httpClient.put('/api/users/me/account', accountData);
    return response;
  } catch (error) {
    console.error('[workerApi] updateAccountInfo 에러:', error);
    throw error;
  }
};

// 근로자 계약 목록 조회
export const getContracts = async () => {
  try {
    const response = await httpClient.get('/api/worker/contracts');
    return response;
  } catch (error) {
    console.error('[workerApi] getContracts 에러:', error);
    throw error;
  }
};

// 근로자 계약 상세 정보 조회
export const getContractDetail = async (contractId) => {
  try {
    const response = await httpClient.get(`/api/worker/contracts/${contractId}`);
    return response;
  } catch (error) {
    console.error('[workerApi] getContractDetail 에러:', error);
    throw error;
  }
};

// 정정 요청 목록 조회
export const getCorrectionRequests = async (status) => {
  try {
    let url = '/api/worker/correction-requests';
    if (status) {
      url += `?status=${status}`;
    }
    const response = await httpClient.get(url);
    return response;
  } catch (error) {
    console.error('[workerApi] getCorrectionRequests 에러:', error);
    throw error;
  }
};

// 근무 기록 정정 요청 생성
export const createCorrectionRequest = async (payload) => {
  try {
    const response = await httpClient.post('/api/worker/correction-requests', payload);
    return response;
  } catch (error) {
    console.error('[workerApi] createCorrectionRequest 에러:', error);
    throw error;
  }
};

// 근로자 근무 기록 조회
export const getWorkRecords = async (startDate, endDate) => {
  try {
    const url = `/api/worker/work-records?startDate=${startDate}&endDate=${endDate}`;
    const response = await httpClient.get(url);
    return response;
  } catch (error) {
    // 404 에러는 빈 배열로 처리
    if (error.status === 404) {
      return { success: true, data: [] };
    }
    console.error('[workerApi] getWorkRecords 에러:', error);
    throw error;
  }
};

// 근무 기록 생성 요청
export const createWorkRecord = async (payload) => {
  try {
    const response = await httpClient.post('/api/worker/work-records', payload);
    return response;
  } catch (error) {
    console.error('[workerApi] createWorkRecord 에러:', error);
    throw error;
  }
};

// 근로자 급여 기록 목록 조회
export const getSalaries = async () => {
  try {
    const response = await httpClient.get('/api/worker/salaries');
    return response;
  } catch (error) {
    console.error('[workerApi] getSalaries 에러:', error);
    throw error;
  }
};

// 근로자 급여 상세 정보 조회
export const getSalaryDetail = async (salaryId) => {
  try {
    const response = await httpClient.get(`/api/worker/salaries/${salaryId}`);
    return response;
  } catch (error) {
    console.error('[workerApi] getSalaryDetail 에러:', error);
    throw error;
  }
};

// 급여 자동 계산
export const calculateSalary = async (contractId, year, month) => {
  try {
    const response = await httpClient.post(
      `/api/worker/salaries/contracts/${contractId}/calculate?year=${year}&month=${month}`
    );
    return response;
  } catch (error) {
    console.error('[workerApi] calculateSalary 에러:', error);
    throw error;
  }
};

// 송금 내역 조회
export const getPayments = async () => {
  try {
    const response = await httpClient.get('/api/worker/payments');
    return response;
  } catch (error) {
    console.error('[workerApi] getPayments 에러:', error);
    throw error;
  }
};

