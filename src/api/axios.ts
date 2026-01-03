import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { toast } from 'react-toastify';

// 커스텀 타입 정의 (_retry 속성 추가)
interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

// axios 인스턴스 생성
export const wageManagerApi = axios.create({
  baseURL: import.meta.env.VITE_WAGEMANAGER,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// 요청 인터셉터 (accessToken이 있으면 추가)
wageManagerApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// accessToken 저장
const saveNewAccessToken = (newAccessToken: string) => {
  localStorage.setItem('token', newAccessToken);
};

// 로그아웃 처리
const handleAuthFailure = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('userId');
  localStorage.removeItem('name');
  localStorage.removeItem('userType');
  window.location.href = '/';
};

// Refresh 중복 요청 방지
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

// accessToken 갱신 완료 후 모든 중복 요청에 대해 토큰 갱신
const onRefreshed = (token: string) => {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
};

// accessToken 갱신 중복 요청 추가
const addRefreshSubscriber = (callback: (token: string) => void) => {
  refreshSubscribers.push(callback);
};

// 공통 에러 처리 (5xx, 네트워크 에러만)
const handleApiError = (error: AxiosError) => {
  if (!error.response) {
    toast.error('네트워크 연결을 확인해주세요');
    return;
  }

  const status = error.response.status;

  // 5xx 서버 에러만 공통 처리
  if (status >= 500) {
    toast.error('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요');
  }
  // 4xx는 개별 처리하도록 넘김
};

// 응답 인터셉터: 401 에러시 accessToken 갱신
wageManagerApi.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as CustomAxiosRequestConfig;

    if (!originalRequest) { // config가 없으면 에러 그대로 반환
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) { // 401: accessToken 갱신
      if (isRefreshing) { // accessToken 갱신 중이면 중복 요청 처리
        return new Promise((resolve) => {
          addRefreshSubscriber((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(wageManagerApi(originalRequest));
          });
        });
      }
      // accessToken 갱신 중이 아니면 accessToken 갱신
      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await axios.post(
          `${import.meta.env.VITE_WAGEMANAGER}${import.meta.env.VITE_WAGEMANAGER_REFRESH_TOKEN}`,
          {},
          { withCredentials: true }
        );
        const newAccessToken = response.data.accessToken;
        if (!newAccessToken) { // 토큰이 없으면 로그아웃
          handleAuthFailure();
          return Promise.reject(error);
        }
        saveNewAccessToken(newAccessToken);
        onRefreshed(newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return wageManagerApi(originalRequest);
      } catch (refreshError) { // accessToken 갱신 실패시 로그아웃
        handleAuthFailure();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    handleApiError(error);
    return Promise.reject(error);
  }
);

export default wageManagerApi;