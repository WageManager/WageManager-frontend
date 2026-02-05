import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAuth } from './useAuth';

// getUserProfile API 모킹
vi.mock('../../api/userApi', () => ({
  getUserProfile: vi.fn(),
}));

// sessionStorage 모킹
const sessionStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: () => {
      store = {};
    },
  };
})();

const originalSessionStorage = window.sessionStorage;

beforeEach(() => {
  Object.defineProperty(window, 'sessionStorage', {
    value: sessionStorageMock,
    writable: true,
    configurable: true,
  });
  sessionStorageMock.clear();
  vi.clearAllMocks();
});

afterEach(() => {
  Object.defineProperty(window, 'sessionStorage', {
    value: originalSessionStorage,
    writable: true,
  });
});

describe('useAuth', () => {
  it('토큰이 없으면 isAuthenticated가 false', async () => {
    // Given: sessionStorage에 토큰 없음 (clear 상태)
    // When: useAuth 훅 렌더링
    const { result } = renderHook(() => useAuth());

    // Then: 로딩 완료 후 미인증 상태
    // Note: 토큰이 없으면 useEffect에서 동기적으로 상태가 변경될 수 있음
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.userType).toBeNull();
  });

  it('토큰이 있고 API 성공 시 isAuthenticated가 true', async () => {
    // Given: sessionStorage에 토큰 있음
    sessionStorageMock.setItem('token', 'valid-token');

    // Given: API 성공 응답 모킹
    const { getUserProfile } = await import('../../api/userApi');
    (getUserProfile as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      success: true,
      data: { userType: 'WORKER' },
    });

    // When: useAuth 훅 렌더링
    const { result } = renderHook(() => useAuth());

    // Then: 로딩 완료 후 인증 상태
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.userType).toBe('WORKER');
  });

  it('토큰이 있고 API 성공 시 EMPLOYER userType 반환', async () => {
    // Given: sessionStorage에 토큰 있음
    sessionStorageMock.setItem('token', 'valid-token');

    // Given: API 성공 응답 모킹 (EMPLOYER)
    const { getUserProfile } = await import('../../api/userApi');
    (getUserProfile as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      success: true,
      data: { userType: 'EMPLOYER' },
    });

    // When: useAuth 훅 렌더링
    const { result } = renderHook(() => useAuth());

    // Then: 로딩 완료 후 EMPLOYER 타입
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.userType).toBe('EMPLOYER');
  });

  it('토큰이 있지만 API 실패 시 isAuthenticated가 false', async () => {
    // Given: sessionStorage에 토큰 있음 (만료된 토큰)
    sessionStorageMock.setItem('token', 'expired-token');

    // Given: API 실패 응답 모킹
    const { getUserProfile } = await import('../../api/userApi');
    (getUserProfile as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('401 Unauthorized')
    );

    // When: useAuth 훅 렌더링
    const { result } = renderHook(() => useAuth());

    // Then: 로딩 완료 후 미인증 상태
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.userType).toBeNull();
  });

  it('토큰이 있지만 API 응답이 success=false면 토큰을 삭제하고 미인증 상태로 전환', async () => {
    // Given: sessionStorage에 토큰 있음
    sessionStorageMock.setItem('token', 'invalid-token');

    // Given: API success=false 응답 모킹
    const { getUserProfile } = await import('../../api/userApi');
    (getUserProfile as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      success: false,
      error: { code: 'AUTH_ERROR', message: '인증 실패' },
    });

    // When: useAuth 훅 렌더링
    const { result } = renderHook(() => useAuth());

    // Then: 로딩 완료 후 미인증 상태
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.userType).toBeNull();

    // Then: 무효한 토큰이 삭제됨
    expect(sessionStorageMock.removeItem).toHaveBeenCalledWith('token');
  });

  it('API 호출 실패(네트워크 에러 등) 시 토큰은 유지하고 미인증 상태로 전환', async () => {
    // Given: sessionStorage에 토큰 있음 (유효할 수 있는 토큰)
    sessionStorageMock.setItem('token', 'possibly-valid-token');

    // Given: API 네트워크 에러 모킹
    const { getUserProfile } = await import('../../api/userApi');
    (getUserProfile as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('Network Error')
    );

    // When: useAuth 훅 렌더링
    const { result } = renderHook(() => useAuth());

    // Then: 로딩 완료 후 미인증 상태
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.userType).toBeNull();

    // Then: 토큰은 삭제되지 않음 (일시적 오류일 수 있으므로)
    // 401 에러의 경우 axios 인터셉터가 별도로 처리함
    expect(sessionStorageMock.removeItem).not.toHaveBeenCalledWith('token');
  });
});
