import type { Dispatch, SetStateAction } from 'react';

/**
 * setForm을 받아서
 * (field, value) => {...} 형태의 updater를 만들어주는 헬퍼
 */
export const createUpdateField = <T extends Record<string, unknown>>(
  setForm: Dispatch<SetStateAction<T | null>>
) => {
  return <K extends keyof T>(field: K, value: T[K]) => {
    setForm((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [field]: value,
      };
    });
  };
};
