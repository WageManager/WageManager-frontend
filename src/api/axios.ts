import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

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

// 요청 인터셉터
wageManagerApi.interceptors.request.use((config) => {
  const accessToken = localStorage.getItem('accessToken');
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// 토큰 저장
const saveNewAccessToken = (newAccessToken: string) => {
  localStorage.setItem('accessToken', newAccessToken);
};

// 로그아웃 처리
const handleAuthFailure = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('userId');
  localStorage.removeItem('name');
  localStorage.removeItem('userType');
  window.location.href = '/';
};

// Refresh 중복 요청 방지
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];
const onRefreshed = (token: string) => {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
};
const addRefreshSubscriber = (callback: (token: string) => void) => {
  refreshSubscribers.push(callback);
};

// 응답 인터셉터 : 401 에러시 토큰 갱신
wageManagerApi.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as CustomAxiosRequestConfig;
    // config가 없으면 에러 그대로 반환
    if (!originalRequest) {
      return Promise.reject(error);
    }
    if (error.response?.status === 401 && !originalRequest._retry) { // 401 에러시 토큰 갱신
      if (isRefreshing) { // 토큰 갱신 중이면 중복 요청 처리
        return new Promise((resolve) => {
          addRefreshSubscriber((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(wageManagerApi(originalRequest));
          });
        });
      }
      // 토큰 갱신 중이 아니면 토큰 갱신
      originalRequest._retry = true;
      isRefreshing = true;
      try {
        const response = await axios.post(
          `${import.meta.env.VITE_WAGEMANAGER}${import.meta.env.VITE_WAGEMANAGER_REFRESH_TOKEN}`,
          {},
          { withCredentials: true }
        );
        const newAccessToken = response.data.accessToken;
        saveNewAccessToken(newAccessToken);
        onRefreshed(newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return wageManagerApi(originalRequest);
      } catch (refreshError) { // 토큰 갱신 실패시 로그아웃
        handleAuthFailure();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default wageManagerApi;