import { useState, useCallback } from "react";
import type { ContractWorker } from "../../api/employerApiResponse.type";
import type { UseEmployerRemittanceDataReturn } from "../../types/employer/employerRemittancePage.types";
import Swal from "sweetalert2";

import {
  useFetchWorkplaces,
  useFetchWorkers,
  useFetchWorkRecords,
  useMonthNavigation,
} from "./useEmployerRemittanceData/index";

/**
 * 고용주 송금 관리 페이지 데이터 훅 (조합 훅)
 * - 개별 훅들을 조합하여 페이지에 필요한 데이터 제공
 * - UI 상태 관리 (확장 패널)
 * - 액션 핸들러 (송금)
 */
export function useEmployerRemittanceData(): UseEmployerRemittanceDataReturn {
  // ── 개별 훅 조합 ──────────────────────────────
  const {
    workplaces,
    selectedWorkplaceId,
    selectedWorkplaceName,
    setSelectedWorkplaceId,
  } = useFetchWorkplaces();

  const {
    workers,
    currentSelectedWorker,
    setManuallySelectedWorker,
  } = useFetchWorkers(selectedWorkplaceId);

  const {
    currentYear,
    currentMonth,
    goToPrevMonth,
    goToNextMonth,
  } = useMonthNavigation();

  const {
    workerData,
    totalWage,
    isLoading,
  } = useFetchWorkRecords(
    selectedWorkplaceId,
    currentYear,
    currentMonth,
    currentSelectedWorker
  );

  // ── UI 상태 ──────────────────────────────────
  const [expandedRecordIndex, setExpandedRecordIndex] = useState<number | null>(
    null
  );

  // ── 근무지 변경 핸들러 ─────────────────────────
  const handleWorkplaceChange = useCallback(
    (workplaceId: number) => {
      setSelectedWorkplaceId(workplaceId);
      setManuallySelectedWorker(null);
      setExpandedRecordIndex(null);
    },
    [setSelectedWorkplaceId, setManuallySelectedWorker]
  );

  // ── 근로자 선택 핸들러 ─────────────────────────
  const handleWorkerSelect = useCallback(
    (worker: ContractWorker | null) => {
      setManuallySelectedWorker(worker);
      setExpandedRecordIndex(null);
    },
    [setManuallySelectedWorker]
  );

  // ── 송금하기 (웹에서 미제공) ─────────────────────
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
    setManuallySelectedWorker: handleWorkerSelect,

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
