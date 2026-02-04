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
  const token = sessionStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// accessToken 저장
const saveNewAccessToken = (newAccessToken: string) => {
  sessionStorage.setItem('token', newAccessToken);
};

// 로그아웃 처리
const handleAuthFailure = () => {
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('userId');
  sessionStorage.removeItem('name');
  sessionStorage.removeItem('userType');
  window.location.href = '/';
};

// Refresh 중복 요청 방지
let isRefreshing = false;

// 대기 요청의 resolve/reject를 모두 처리하기 위한 인터페이스
interface RefreshSubscriber {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}
let refreshSubscribers: RefreshSubscriber[] = [];

// accessToken 갱신 완료 후 모든 대기 요청에 새 토큰 전달
const onRefreshed = (token: string) => {
  refreshSubscribers.forEach((subscriber) => subscriber.resolve(token));
  refreshSubscribers = [];
};

// accessToken 갱신 실패 시 모든 대기 요청 reject
const onRefreshFailed = (error: unknown) => {
  refreshSubscribers.forEach((subscriber) => subscriber.reject(error));
  refreshSubscribers = [];
};

// accessToken 갱신 대기 요청 추가
const addRefreshSubscriber = (subscriber: RefreshSubscriber) => {
  refreshSubscribers.push(subscriber);
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
        return new Promise((resolve, reject) => {
          addRefreshSubscriber({
            resolve: (token: string) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(wageManagerApi(originalRequest));
            },
            reject: (err: unknown) => reject(err),
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
        // Spring ApiResponse 래퍼 구조: { data: { accessToken: '...' } }
        const newAccessToken = response.data.data?.accessToken;
        if (!newAccessToken) { // 토큰이 없으면 로그아웃
          const noTokenError = new Error('토큰 갱신 응답에 accessToken이 없습니다');
          onRefreshFailed(noTokenError);
          handleAuthFailure();
          return Promise.reject(noTokenError);
        }
        saveNewAccessToken(newAccessToken);
        onRefreshed(newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return wageManagerApi(originalRequest);
      } catch (refreshError) { // accessToken 갱신 실패시 대기 요청 모두 reject 후 로그아웃
        onRefreshFailed(refreshError);
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