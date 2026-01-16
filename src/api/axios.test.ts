import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import MockAdapter from 'axios-mock-adapter';
import axios from 'axios';
import { wageManagerApi } from './axios';

/**
 * axios.ts 인터셉터 테스트
 *
 * 테스트 범위:
 * 1. 요청 인터셉터: 토큰이 헤더에 포함되는지
 * 2. 응답 인터셉터: 401 에러 시 토큰 갱신 로직
 * 3. 토큰 갱신 성공 시 대기 요청 처리
 * 4. 토큰 갱신 실패 시 대기 요청 reject (이번 버그 수정 검증)
 */

// wageManagerApi와 일반 axios 모두 모킹
let mockApi: MockAdapter;
let mockAxios: MockAdapter;

// localStorage 모킹
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

// window.location 모킹
const originalLocation = window.location;

beforeEach(() => {
  // Mock 어댑터 초기화
  mockApi = new MockAdapter(wageManagerApi);
  mockAxios = new MockAdapter(axios);

  // localStorage 모킹
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true,
  });

  // window.location 모킹
  Object.defineProperty(window, 'location', {
    value: { href: '' },
    writable: true,
  });

  // 각 테스트 전 초기화
  localStorageMock.clear();
  vi.clearAllMocks();
});

afterEach(() => {
  mockApi.restore();
  mockAxios.restore();
  Object.defineProperty(window, 'location', {
    value: originalLocation,
    writable: true,
  });
});

describe('axios 요청 인터셉터', () => {
  it('토큰이 있으면 Authorization 헤더에 포함된다', async () => {
    // Given: localStorage에 토큰이 있음
    localStorageMock.setItem('token', 'test-access-token');

    // Mock API 응답
    mockApi.onGet('/test').reply(200, { data: 'success' });

    // When: API 요청
    await wageManagerApi.get('/test');

    // Then: Authorization 헤더에 토큰이 포함됨
    const request = mockApi.history.get[0];
    expect(request.headers?.Authorization).toBe('Bearer test-access-token');
  });

  it('토큰이 없으면 Authorization 헤더가 없다', async () => {
    // Given: localStorage에 토큰이 없음
    mockApi.onGet('/test').reply(200, { data: 'success' });

    // When: API 요청
    await wageManagerApi.get('/test');

    // Then: Authorization 헤더가 없거나 undefined
    const request = mockApi.history.get[0];
    expect(request.headers?.Authorization).toBeUndefined();
  });
});

describe('axios 응답 인터셉터 - 토큰 갱신', () => {
  it('401 에러 시 토큰 갱신을 시도한다', async () => {
    // Given: 유효한 토큰이 있고, 첫 요청은 401 반환
    localStorageMock.setItem('token', 'expired-token');

    // 첫 요청: 401 에러
    mockApi.onGet('/protected').replyOnce(401);
    // 재시도 요청: 성공
    mockApi.onGet('/protected').replyOnce(200, { data: 'success' });

    // 토큰 갱신 API: 성공 (Spring ApiResponse 구조)
    mockAxios.onPost().reply(200, {
      data: { accessToken: 'new-access-token' },
    });

    // When: API 요청
    const response = await wageManagerApi.get('/protected');

    // Then: 토큰 갱신 후 재시도 성공
    expect(response.data).toEqual({ data: 'success' });
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'token',
      'new-access-token'
    );
  });

  it('토큰 갱신 실패 시 handleAuthFailure가 호출된다', async () => {
    // Given: 만료된 토큰이 있고, 갱신도 실패
    localStorageMock.setItem('token', 'expired-token');

    // 첫 요청: 401 에러
    mockApi.onGet('/protected').replyOnce(401);

    // 토큰 갱신 API: 실패 (Refresh Token도 만료)
    mockAxios.onPost().reply(401, { message: 'Refresh token expired' });

    // When & Then: API 요청이 reject됨
    await expect(wageManagerApi.get('/protected')).rejects.toThrow();

    // Then: localStorage가 클리어됨 (handleAuthFailure 호출 확인)
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('userId');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('name');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('userType');

    // Then: 로그인 페이지로 리다이렉트
    expect(window.location.href).toBe('/');
  });
});

describe('axios 응답 인터셉터 - 동시 요청 처리 (버그 #61 수정 검증)', () => {
  /**
   * 이 테스트는 GitHub Issue #61의 버그 수정을 검증합니다.
   *
   * 시나리오:
   * 1. 여러 요청이 동시에 401 에러를 받음
   * 2. 첫 번째 요청이 토큰 갱신 시도
   * 3. 나머지 요청들은 refreshSubscribers 큐에 대기
   * 4. 토큰 갱신 실패 시 대기 중인 모든 요청이 reject되어야 함
   */
  it('토큰 갱신 실패 시 대기 중인 모든 요청이 reject된다', async () => {
    // Given: 만료된 토큰
    localStorageMock.setItem('token', 'expired-token');

    // 모든 요청이 401 반환
    mockApi.onGet('/api/request1').reply(401);
    mockApi.onGet('/api/request2').reply(401);
    mockApi.onGet('/api/request3').reply(401);

    // 토큰 갱신 API: 실패
    mockAxios.onPost().reply(401, { message: 'Refresh token expired' });

    // When: 3개의 동시 요청
    const request1 = wageManagerApi.get('/api/request1');
    const request2 = wageManagerApi.get('/api/request2');
    const request3 = wageManagerApi.get('/api/request3');

    // Then: 모든 요청이 reject됨 (pending 상태로 남지 않음)
    await expect(request1).rejects.toThrow();
    await expect(request2).rejects.toThrow();
    await expect(request3).rejects.toThrow();
  });

  it('토큰 갱신 성공 시 대기 중인 모든 요청이 재시도된다', async () => {
    // Given: 만료된 토큰
    localStorageMock.setItem('token', 'expired-token');

    // 첫 번째 요청들: 401 에러
    mockApi.onGet('/api/request1').replyOnce(401);
    mockApi.onGet('/api/request2').replyOnce(401);
    mockApi.onGet('/api/request3').replyOnce(401);

    // 재시도 요청들: 성공
    mockApi.onGet('/api/request1').replyOnce(200, { data: 'result1' });
    mockApi.onGet('/api/request2').replyOnce(200, { data: 'result2' });
    mockApi.onGet('/api/request3').replyOnce(200, { data: 'result3' });

    // 토큰 갱신 API: 성공
    mockAxios.onPost().reply(200, {
      data: { accessToken: 'new-access-token' },
    });

    // When: 3개의 동시 요청
    const [result1, result2, result3] = await Promise.all([
      wageManagerApi.get('/api/request1'),
      wageManagerApi.get('/api/request2'),
      wageManagerApi.get('/api/request3'),
    ]);

    // Then: 모든 요청이 성공
    expect(result1.data).toEqual({ data: 'result1' });
    expect(result2.data).toEqual({ data: 'result2' });
    expect(result3.data).toEqual({ data: 'result3' });
  });

  it('토큰 갱신 응답에 accessToken이 없으면 모든 요청이 reject된다', async () => {
    // Given: 만료된 토큰
    localStorageMock.setItem('token', 'expired-token');

    // 모든 요청이 401 반환
    mockApi.onGet('/api/request1').reply(401);
    mockApi.onGet('/api/request2').reply(401);

    // 토큰 갱신 API: 성공하지만 accessToken이 없음
    mockAxios.onPost().reply(200, {
      data: {}, // accessToken 없음
    });

    // When: 2개의 동시 요청
    const request1 = wageManagerApi.get('/api/request1');
    const request2 = wageManagerApi.get('/api/request2');

    // Then: 모든 요청이 reject됨
    await expect(request1).rejects.toThrow();
    await expect(request2).rejects.toThrow();

    // Then: handleAuthFailure 호출됨
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
  });
});
