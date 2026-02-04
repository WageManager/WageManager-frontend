import { useState, useMemo, useCallback } from "react";
import { getDateKey } from "../../../utils/employer/dateUtils";
import type {
  Shift,
  ShiftWithLane,
  DateScheduleMap,
  UseShiftSelectionReturn,
} from "../../../types/employer/dailyCalendarPage.types";

interface UseShiftSelectionParams {
  workplaceSchedules: DateScheduleMap;
  dateKey: string;
  selectedDate: Date;
  onSelectionChange?: () => void;
}

/**
 * 근무 선택 및 레인 할당 훅
 * - 활성 근무 선택
 * - 레인 할당 알고리즘 (같은 근무자는 같은 레인)
 * - 익일 근무 처리
 */
export function useShiftSelection({
  workplaceSchedules,
  dateKey,
  selectedDate,
  onSelectionChange,
}: UseShiftSelectionParams): UseShiftSelectionReturn {
  const [activeShiftId, setActiveShiftId] = useState<string | null>(null);

  // 현재 날짜의 스케줄 데이터
  const currentScheduleData = useMemo<Shift[]>(
    () => workplaceSchedules[dateKey] || [],
    [workplaceSchedules, dateKey]
  );

  // 각 근무자마다 고정된 레인 할당 (한 명당 한 줄)
  const scheduleWithLanes = useMemo<ShiftWithLane[]>(() => {
    // 근무자 이름별로 레인 인덱스 할당
    const workerLaneMap = new Map<string, number>();
    let nextLaneIndex = 0;

    // 시간순으로 정렬
    const sorted = [...currentScheduleData].sort(
      (a, b) => a.startHour - b.startHour
    );

    return sorted.map((item) => {
      // 해당 근무자에게 이미 레인이 할당되었는지 확인
      if (!workerLaneMap.has(item.name)) {
        workerLaneMap.set(item.name, nextLaneIndex);
        nextLaneIndex++;
      }

      const laneIndex = workerLaneMap.get(item.name)!;
      return { ...item, laneIndex };
    });
  }, [currentScheduleData]);

  // 레인 개수
  const laneCount = useMemo(
    () =>
      scheduleWithLanes.reduce((max, item) => Math.max(max, item.laneIndex), -1) + 1,
    [scheduleWithLanes]
  );

  // 활성화된 근무
  const activeShift = useMemo(
    () => scheduleWithLanes.find((shift) => shift.id === activeShiftId),
    [scheduleWithLanes, activeShiftId]
  );

  // 이전 날짜 및 이전 날짜의 스케줄 데이터
  const previousDate = useMemo(() => {
    const prevDate = new Date(selectedDate);
    prevDate.setDate(prevDate.getDate() - 1);
    return prevDate;
  }, [selectedDate]);

  const previousDateKey = useMemo(() => getDateKey(previousDate), [previousDate]);

  const previousScheduleData = useMemo<Shift[]>(
    () => workplaceSchedules[previousDateKey] || [],
    [workplaceSchedules, previousDateKey]
  );

  // 익일 근무이고 시작 시간이 0시인 경우 전날 근무 찾기
  const previousDayShift = useMemo<Shift | null>(() => {
    if (
      activeShift &&
      activeShift.startHour === 0 &&
      activeShift.start === "00:00"
    ) {
      return (
        previousScheduleData.find(
          (shift) => shift.name === activeShift.name && shift.crossesMidnight
        ) || null
      );
    }
    return null;
  }, [activeShift, previousScheduleData]);

  // 표시할 근무 정보 (익일 근무면 전날 근무 정보 사용)
  const displayShift = useMemo<Shift | null>(
    () => previousDayShift || activeShift || null,
    [previousDayShift, activeShift]
  );

  // 타임라인 블록 선택 토글
  const handleShiftClick = useCallback(
    (shiftId: string) => {
      // 클릭한 근무 찾기
      const clickedShift = currentScheduleData.find(
        (shift) => shift.id === shiftId
      );

      // 익일 근무인지 확인 (00:00에 시작하는 경우)
      if (
        clickedShift &&
        clickedShift.startHour === 0 &&
        clickedShift.start === "00:00"
      ) {
        // 전날 같은 직원의 익일로 넘어가는 근무 찾기
        const prevDayShift = previousScheduleData.find(
          (shift) => shift.name === clickedShift.name && shift.crossesMidnight
        );

        if (prevDayShift) {
          // 이 경우 onSelectionChange를 통해 부모에서 날짜 변경을 처리해야 함
          // 여기서는 단순히 선택만 처리하고, 날짜 변경은 useDailyCalendarData에서 처리
          setActiveShiftId(shiftId);
          onSelectionChange?.();
          return;
        }
      }

      // 일반적인 경우
      setActiveShiftId((prev) => {
        const newId = prev === shiftId ? null : shiftId;
        if (newId !== prev) {
          onSelectionChange?.();
        }
        return newId;
      });
    },
    [currentScheduleData, previousScheduleData, onSelectionChange]
  );

  return {
    activeShiftId,
    activeShift,
    displayShift,
    previousDayShift,
    scheduleWithLanes,
    laneCount,
    setActiveShiftId,
    handleShiftClick,
  };
}
