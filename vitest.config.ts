import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    // 테스트 환경 설정 (window, localStorage 등을 사용하므로 jsdom 필요)
    environment: 'jsdom',

    // 테스트 파일 패턴
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],

    // 전역 테스트 API 사용 (describe, it, expect 등)
    globals: true,

    // 테스트 setup 파일
    setupFiles: ['./src/test/setup.ts'],

    // 커버리지 설정 (선택사항)
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    },
  },
});
