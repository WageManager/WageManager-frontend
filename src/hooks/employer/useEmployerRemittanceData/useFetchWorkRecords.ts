import { useState, useEffect, useMemo, useCallback } from "react";
import { getWorkRecords } from "../../../api/employerApi";
import type { WorkRecord } from "../../../api/employerApiResponse.type";
import type {
  EmployerWorkRecord,
  SelectedWorker,
} from "../../../types/employer/employerRemittancePage.types";
import { formatTime, parseWorkDate } from "../../../utils/dateUtils";
import { calculateWage, calculateTotalWage } from "../../../utils/salaryCalculator";
import { createDefaultAllowances } from "../../../constants/extraPay";
import { toast } from "react-toastify";

export interface UseFetchWorkRecordsReturn {
  workRecords: WorkRecord[];
  workerData: EmployerWorkRecord[];
  totalWage: number;
  isLoading: boolean;
}

/**
 * 근무 기록 페칭 훅
 * - 선택된 근무지/기간의 근무 기록 조회
 * - 선택된 근로자의 데이터 변환 및 급여 계산
 */
export function useFetchWorkRecords(
  selectedWorkplaceId: number | null,
  currentYear: number,
  currentMonth: number,
  currentSelectedWorker: SelectedWorker | null
): UseFetchWorkRecordsReturn {
  const [workRecords, setWorkRecords] = useState<WorkRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // 근무 기록 조회
  useEffect(() => {
    if (selectedWorkplaceId == null) return;

    const fetchWorkRecords = async () => {
      try {
        setIsLoading(true);
        const startDate = new Date(currentYear, currentMonth - 1, 1);
        const endDate = new Date(currentYear, currentMonth, 0);

        const response = await getWorkRecords(
          selectedWorkplaceId,
          startDate,
          endDate
        );

        setWorkRecords(response.data || []);
      } catch (err) {
        console.error("[useFetchWorkRecords] 근무 기록 조회 실패:", err);
        toast.error("근무 기록을 불러오는데 실패했습니다.");
        setWorkRecords([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorkRecords();
  }, [selectedWorkplaceId, currentYear, currentMonth]);

  // 시간 포맷팅 헬퍼
  const formatTimeValue = useCallback((time: string): string => {
    return formatTime(time);
  }, []);

  // 근무 기록을 UI용 데이터로 변환
  const workerData = useMemo<EmployerWorkRecord[]>(() => {
    if (!currentSelectedWorker || !workRecords.length) {
      return [];
    }

    // 선택된 근로자의 근무 기록만 필터링
    const filtered = workRecords.filter((record) => {
      return record.contractId === currentSelectedWorker.id;
    });

    return filtered
      .map((record) => {
        const { date, day } = parseWorkDate(record.workDate);

        const startTime = formatTimeValue(record.startTime);
        const endTime = formatTimeValue(record.endTime);
        const wage = calculateWage(
          startTime,
          endTime,
          record.breakMinutes || 0,
          record.hourlyWage || 0
        );

        return {
          date,
          day,
          startTime,
          endTime,
          hourlyWage: record.hourlyWage,
          breakMinutes: record.breakMinutes,
          wage,
          allowances: createDefaultAllowances(),
          socialInsurance: true,
          withholdingTax: true,
        };
      })
      .sort((a, b) => a.date - b.date);
  }, [currentSelectedWorker, workRecords, formatTimeValue]);

  // 총 급여 계산
  const totalWage = useMemo(() => {
    return calculateTotalWage(workerData);
  }, [workerData]);

  return {
    workRecords,
    workerData,
    totalWage,
    isLoading,
  };
}
