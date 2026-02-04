import { useState, useEffect, useCallback } from "react";
import { getWorkRecords } from "../../../api/employerApi";
import { timeStringToDecimal } from "../../../utils/formatUtils";
import type {
  ScheduleData,
  Shift,
  UseFetchScheduleDataReturn,
} from "../../../types/employer/dailyCalendarPage.types";
import type { WorkRecord } from "../../../api/employerApiResponse.type";

/**
 * API 응답을 기존 스케줄 데이터 구조로 변환
 */
const transformWorkRecordsToScheduleData = (workRecords: WorkRecord[]): ScheduleData => {
  const scheduleData: ScheduleData = {};

  workRecords.forEach((record) => {
    const workplaceName = record.workplaceName;
    const dateKey = record.workDate;

    if (!scheduleData[workplaceName]) {
      scheduleData[workplaceName] = {};
    }
    if (!scheduleData[workplaceName][dateKey]) {
      scheduleData[workplaceName][dateKey] = [];
    }

    // LocalTime을 문자열로 변환 (백엔드에서 배열 또는 문자열로 올 수 있음)
    const formatTime = (time: string | number[]): string => {
      if (Array.isArray(time)) {
        // [9, 0, 0] 형식
        const [h, m] = time;
        return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      } else if (typeof time === "string") {
        // "09:00:00" 또는 "09:00" 형식
        return time.substring(0, 5); // HH:MM만 추출
      }
      return String(time);
    };

    const startTimeStr = formatTime(record.startTime as string | number[]);
    const endTimeStr = formatTime(record.endTime as string | number[]);

    // 시간 문자열을 시간 숫자로 변환 (HH:MM -> decimal)
    const startHour = timeStringToDecimal(startTimeStr);
    const endHour = timeStringToDecimal(endTimeStr);

    // 근무 시간 계산 (시간 단위)
    const durationHours = endHour - startHour;

    const shift: Shift = {
      id: `shift-${record.id}`,
      name: record.workerName,
      start: startTimeStr,
      end: endTimeStr,
      startHour,
      durationHours,
      breakMinutes: record.breakMinutes || 0,
      hourlyWage: record.hourlyWage || 10030,
      allowances: {
        overtime: { enabled: false, rate: 0 },
        night: { enabled: false, rate: 0 },
        holiday: { enabled: false, rate: 0 },
      },
      socialInsurance: true,
      withholdingTax: true,
      workRecordId: record.id,
    };

    scheduleData[workplaceName][dateKey].push(shift);
  });

  return scheduleData;
};

/**
 * 스케줄 데이터 조회 훅
 * - 근무 기록 API 조회 (선택된 날짜 ± 1일, 총 3일)
 * - 데이터 변환
 *
 * 3일만 조회하는 이유:
 * - 당일: 타임라인에 표시
 * - 전날: 익일 근무(crossesMidnight)의 원본 정보 조회
 * - 다음날: 당일 익일 근무의 종료 시간 표시
 */
export function useFetchScheduleData(
  selectedWorkplaceId: number | null,
  selectedDate: Date
): UseFetchScheduleDataReturn {
  const [scheduleData, setScheduleData] = useState<ScheduleData>({});
  const [isScheduleLoading, setIsScheduleLoading] = useState<boolean>(true);

  // 근무 기록 조회 (선택된 날짜 ± 1일)
  useEffect(() => {
    if (!selectedWorkplaceId || !selectedDate) {
      setIsScheduleLoading(false);
      return;
    }

    const abortController = new AbortController();

    const fetchWorkRecords = async () => {
      setIsScheduleLoading(true);
      try {
        // 전날
        const startDate = new Date(selectedDate);
        startDate.setDate(startDate.getDate() - 1);

        // 다음날
        const endDate = new Date(selectedDate);
        endDate.setDate(endDate.getDate() + 1);

        const response = await getWorkRecords(
          selectedWorkplaceId,
          startDate,
          endDate
        );

        // abort된 경우 상태 업데이트 하지 않음
        if (abortController.signal.aborted) return;

        const recordsData = response.data || [];

        // API 응답을 기존 데이터 구조로 변환
        const transformedData = transformWorkRecordsToScheduleData(recordsData);
        setScheduleData(transformedData);
      } catch {
        // abort된 경우 또는 에러 시 빈 객체 사용
        if (!abortController.signal.aborted) {
          setScheduleData({});
        }
      } finally {
        if (!abortController.signal.aborted) {
          setIsScheduleLoading(false);
        }
      }
    };

    fetchWorkRecords();

    // cleanup: 이전 요청 취소
    return () => {
      abortController.abort();
    };
  }, [selectedWorkplaceId, selectedDate]);

  return {
    scheduleData,
    setScheduleData,
    isScheduleLoading,
  };
}
