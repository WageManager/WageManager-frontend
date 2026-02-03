import { useState, useMemo, useEffect, useCallback } from "react";
import {
  getWorkplaces,
  getContractsByWorkplace,
  getWorkRecords,
} from "../../api/employerApi";
import type {
  Workplace,
  ContractWorker,
  WorkRecord,
} from "../../api/employerApiResponse.type";
import { formatTime, parseWorkDate } from "../../utils/dateUtils";
import type {
  EmployerWorkRecord,
  WorkerListMap,
  SelectedWorker,
  UseEmployerRemittanceDataReturn,
} from "../../types/employer/employerRemittancePage.types";
import Swal from "sweetalert2";

/**
 * 고용주 송금 관리 페이지 데이터 훅
 * - 근무지 목록, 근로자 목록, 근무 기록 페칭
 * - 근로자별 급여 계산, 카카오페이 송금
 * - 월 이동 네비게이션
 */
export function useEmployerRemittanceData(): UseEmployerRemittanceDataReturn {
  // ── 상태 ──────────────────────────────────
  const [workplaces, setWorkplaces] = useState<Workplace[]>([]);
  const [selectedWorkplaceId, setSelectedWorkplaceId] = useState<number | null>(
    null
  );
  const [currentYear, setCurrentYear] = useState<number>(
    () => new Date().getFullYear()
  );
  const [currentMonth, setCurrentMonth] = useState<number>(
    () => new Date().getMonth() + 1
  );
  const [workersList, setWorkersList] = useState<WorkerListMap>({});
  const [workRecords, setWorkRecords] = useState<WorkRecord[]>([]);
  const [manuallySelectedWorker, setManuallySelectedWorker] =
    useState<ContractWorker | null>(null);
  const [expandedRecordIndex, setExpandedRecordIndex] = useState<number | null>(
    null
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // ── 파생 데이터 ──────────────────────────────
  const selectedWorkplaceName = useMemo(() => {
    return (
      workplaces.find((wp) => wp.id === selectedWorkplaceId)?.name || ""
    );
  }, [workplaces, selectedWorkplaceId]);

  const workers = useMemo<ContractWorker[]>(() => {
    if (!selectedWorkplaceId) return [];
    return workersList[selectedWorkplaceId] || [];
  }, [selectedWorkplaceId, workersList]);

  const selectedWorker = useMemo<ContractWorker | null>(() => {
    return workers.length > 0 ? (workers[0] ?? null) : null;
  }, [workers]);

  const currentSelectedWorker = useMemo<SelectedWorker | null>(() => {
    const worker = manuallySelectedWorker || selectedWorker;
    return worker ? { ...worker } : null;
  }, [manuallySelectedWorker, selectedWorker]);

  // ── 근무지 목록 조회 (마운트 시 1회) ──────────
  useEffect(() => {
    const fetchWorkplaces = async () => {
      try {
        const response = await getWorkplaces();
        const workplacesData = response.data || [];
        setWorkplaces(workplacesData);
        if (workplacesData.length > 0 && !selectedWorkplaceId) {
          setSelectedWorkplaceId(workplacesData[0].id);
        }
      } catch (error) {
        console.error("[useEmployerRemittanceData] 근무지 목록 조회 실패:", error);
        setWorkplaces([]);
      }
    };
    fetchWorkplaces();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── 선택된 근무지의 근로자 목록 조회 ─────────
  useEffect(() => {
    if (!selectedWorkplaceId) return;

    const fetchWorkers = async () => {
      try {
        const response = await getContractsByWorkplace(selectedWorkplaceId);
        const workersData = response.data || [];
        setWorkersList((prev) => ({
          ...prev,
          [selectedWorkplaceId]: workersData,
        }));
      } catch (error) {
        console.error("[useEmployerRemittanceData] 근로자 목록 조회 실패:", error);
        setWorkersList((prev) => ({
          ...prev,
          [selectedWorkplaceId]: [],
        }));
      }
    };

    fetchWorkers();
  }, [selectedWorkplaceId]);

  // ── 근무 기록 조회 ─────────────────────────
  useEffect(() => {
    if (!selectedWorkplaceId) return;

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
      } catch (error) {
        console.error("[useEmployerRemittanceData] 근무 기록 조회 실패:", error);
        setWorkRecords([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorkRecords();
  }, [selectedWorkplaceId, currentYear, currentMonth]);

  // ── 시간 포맷팅 헬퍼 ("HH:mm:ss" → "HH:mm") ─────────
  const formatTimeValue = useCallback((time: string): string => {
    return formatTime(time);
  }, []);

  // ── 근무 기록을 UI용 데이터로 변환 ───────────
  const workerData = useMemo<EmployerWorkRecord[]>(() => {
    if (!currentSelectedWorker || !workRecords.length) {
      return [];
    }

    // 선택된 근로자의 근무 기록만 필터링
    const filtered = workRecords.filter((record) => {
      return record.workerName === currentSelectedWorker.workerName;
    });

    return filtered
      .map((record) => {
        const { date, day } = parseWorkDate(record.workDate);

        // 근무 시간 계산 (시급 * 근무시간)
        const startTime = formatTimeValue(record.startTime);
        const endTime = formatTimeValue(record.endTime);
        const startParts = startTime.split(":").map(Number);
        const endParts = endTime.split(":").map(Number);
        const startH = startParts[0] ?? 0;
        const startM = startParts[1] ?? 0;
        const endH = endParts[0] ?? 0;
        const endM = endParts[1] ?? 0;
        const startDecimal = startH + startM / 60;
        const endDecimal = endH + endM / 60;
        const workHours =
          endDecimal - startDecimal - (record.breakMinutes || 0) / 60;
        const wage = Math.floor(workHours * (record.hourlyWage || 0));

        return {
          date,
          day,
          startTime,
          endTime,
          hourlyWage: record.hourlyWage,
          breakMinutes: record.breakMinutes,
          wage,
          allowances: {
            overtime: { enabled: false, rate: 0 },
            night: { enabled: false, rate: 0 },
            holiday: { enabled: false, rate: 0 },
          },
          socialInsurance: true,
          withholdingTax: true,
        };
      })
      .sort((a, b) => a.date - b.date);
  }, [currentSelectedWorker, workRecords, formatTimeValue]);

  // ── 총 급여 (workerData wage 합산) ──────────
  const totalWage = useMemo(() => {
    if (!workerData || workerData.length === 0) {
      return 0;
    }
    return workerData.reduce((sum, record) => sum + (record.wage ?? 0), 0);
  }, [workerData]);

  // ── 월 이동 ────────────────────────────────
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

  // ── 근무지 변경 핸들러 ─────────────────────
  const handleWorkplaceChange = useCallback((workplaceId: number) => {
    setSelectedWorkplaceId(workplaceId);
    setManuallySelectedWorker(null);
    setExpandedRecordIndex(null);
  }, []);

  // ── 송금하기 (웹에서 미제공) ────────────────────────
  const handleRemittance = useCallback(() => {
    Swal.fire({
      title: "알림",
      text: "송금 기능은 웹에서 제공하지 않습니다. 모바일 앱을 이용해주세요.",
      icon: "info",
      confirmButtonText: "확인",
      confirmButtonColor: "#769fcd",
    });
  }, []);

  return {
    // 근무지
    workplaces,
    selectedWorkplaceId,
    selectedWorkplaceName,
    setSelectedWorkplaceId: handleWorkplaceChange,

    // 근로자
    workers,
    currentSelectedWorker,
    setManuallySelectedWorker,

    // 월 네비게이션
    currentYear,
    currentMonth,
    goToPrevMonth,
    goToNextMonth,

    // 근무 기록
    workerData,
    isLoading,

    // 급여
    totalWage,

    // 액션
    handleRemittance,

    // 확장 패널
    expandedRecordIndex,
    setExpandedRecordIndex,
  };
}
