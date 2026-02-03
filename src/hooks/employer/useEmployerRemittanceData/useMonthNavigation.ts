import { useState, useCallback } from "react";

export interface UseMonthNavigationReturn {
  currentYear: number;
  currentMonth: number;
  goToPrevMonth: () => void;
  goToNextMonth: () => void;
}

/**
 * 월 네비게이션 훅
 * - 이전/다음 월 이동
 * - 연도 자동 변경
 */
export function useMonthNavigation(): UseMonthNavigationReturn {
  const [currentYear, setCurrentYear] = useState<number>(
    () => new Date().getFullYear()
  );
  const [currentMonth, setCurrentMonth] = useState<number>(
    () => new Date().getMonth() + 1
  );

  const goToPrevMonth = useCallback(() => {
    setCurrentMonth((prev) => {
      if (prev === 1) {
        setCurrentYear((y) => y - 1);
        return 12;
      }
      return prev - 1;
    });
  }, []);

  const goToNextMonth = useCallback(() => {
    setCurrentMonth((prev) => {
      if (prev === 12) {
        setCurrentYear((y) => y + 1);
        return 1;
      }
      return prev + 1;
    });
  }, []);

  return {
    currentYear,
    currentMonth,
    goToPrevMonth,
    goToNextMonth,
  };
}
