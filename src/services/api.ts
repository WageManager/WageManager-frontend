import axios, { type AxiosInstance, type AxiosError, type InternalAxiosRequestConfig } from "axios";

const API_BASE_URL = "https://port-0-paycheck-backend-mkmluzdp5be20e47.sel3.cloudtype.app/api";

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - add JWT token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => {
    // Extract ApiResponse<T>.data
    return response.data?.data !== undefined ? response.data.data : response.data;
  },
  (error: AxiosError) => {
    if (error.response) {
      const { status, data } = error.response;
      if (status === 401) {
        // Auto-logout on 401
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        localStorage.removeItem("name");
        localStorage.removeItem("userType");
        window.location.href = "/";
      }
      const errorMessage =
        (data as any)?.message || (data as any)?.error || "알 수 없는 오류가 발생했습니다.";
      return Promise.reject(new Error(errorMessage));
    }
    return Promise.reject(
      new Error("서버와의 통신에 실패했습니다. 잠시 후 다시 시도해주세요.")
    );
  }
);

export default api;
