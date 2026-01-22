import { useMemo } from 'react';

/**
 * 특정 연도와 월에 대한 달력 날짜 배열을 생성하는 커스텀 훅.
 * @param year - 대상 연도
 * @param month - 대상 월 (0-11)
 * @returns (number | null)[] - 달력 날짜 배열. 해당 월의 1일 이전은 null로 채워짐.
 */
export const useMonthlyCalendar = (year: number, month: number) => {
  const calendarCells = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const firstDayOfWeek = firstDay.getDay(); // 0: Sunday, 1: Monday, ...
    const lastDate = new Date(year, month + 1, 0).getDate();

    const cells: (number | null)[] = [];

    // 1일이 시작하기 전까지의 빈 셀(null)을 채움
    for (let i = 0; i < firstDayOfWeek; i += 1) {
      cells.push(null);
    }
    // 1일부터 마지막 날까지 날짜를 채움
    for (let d = 1; d <= lastDate; d += 1) {
      cells.push(d);
    }
    return cells;
  }, [year, month]);

  return calendarCells;
};
