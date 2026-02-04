import { useState, useMemo, useCallback } from "react";
import { getDateKey, buildCalendarCells } from "../../../utils/employer/dateUtils";
import type { UseDateNavigationReturn } from "../../../types/employer/dailyCalendarPage.types";

/**
 * 날짜 네비게이션 훅
 * - 날짜 선택
 * - 월 네비게이션
 * - 캘린더 셀 생성
 */
export function useDateNavigation(): UseDateNavigationReturn {
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [displayMonth, setDisplayMonth] = useState<Date>(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );

  // 선택된 날짜의 dateKey (YYYY-MM-DD)
  const dateKey = useMemo(() => getDateKey(selectedDate), [selectedDate]);

  // 월 달력 셀 캐싱
  const calendarCells = useMemo(
    () => buildCalendarCells(displayMonth),
    [displayMonth]
  );

  // 이전 달 이동
  const handlePrevMonth = useCallback(() => {
    setDisplayMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
    );
  }, []);

  // 다음 달 이동
  const handleNextMonth = useCallback(() => {
    setDisplayMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
    );
  }, []);

  // 날짜 선택
  const handleSelectDate = useCallback((date: Date) => {
    setSelectedDate(date);
    setDisplayMonth(new Date(date.getFullYear(), date.getMonth(), 1));
  }, []);

  return {
    selectedDate,
    displayMonth,
    dateKey,
    calendarCells,
    handlePrevMonth,
    handleNextMonth,
    handleSelectDate,
  };
}
