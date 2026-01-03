import axios from 'axios';

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
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 토큰 저장
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

const onRefreshed = (token: string) => {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
};
const addRefreshSubscriber = (callback: (token: string) => void) => {
  refreshSubscribers.push(callback);
};

// 응답 인터셉터
wageManagerApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          addRefreshSubscriber((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(wageManagerApi(originalRequest));
          });
        });
      }
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
      } catch (refreshError) {
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