import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // 테스트 환경 설정 (window, localStorage 등을 사용하므로 jsdom 필요)
    environment: 'jsdom',

    // 테스트 파일 패턴
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],

    // 전역 테스트 API 사용 (describe, it, expect 등)
    globals: true,

    // 커버리지 설정 (선택사항)
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    },
  },
});
