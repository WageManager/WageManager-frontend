import { useState, useEffect, useCallback } from "react";
import { getContractsByWorkplace } from "../../../api/employerApi";
import type { UseFetchWorkersInWorkplaceReturn } from "../../../types/employer/dailyCalendarPage.types";
import type { ContractWorker } from "../../../api/employerApiResponse.type";

/**
 * 근무지별 근로자 목록 조회 훅
 * - 근무지별 근로자 목록 조회
 * - 모달 상태 관리
 */
export function useFetchWorkersInWorkplace(
  selectedWorkplaceId: number | null
): UseFetchWorkersInWorkplaceReturn {
  const [workersInWorkplace, setWorkersInWorkplace] = useState<string[]>([]);
  const [showWorkerListModal, setShowWorkerListModal] = useState<boolean>(false);

  // 근무지별 근로자 목록 조회
  useEffect(() => {
    if (!selectedWorkplaceId) return;

    const fetchWorkers = async () => {
      try {
        const response = await getContractsByWorkplace(selectedWorkplaceId);
        const contracts: ContractWorker[] = response.data || [];
        const workerNames = [...new Set(contracts.map((c) => c.workerName))];
        setWorkersInWorkplace(workerNames);
      } catch {
        // 에러 시 빈 배열 사용
        setWorkersInWorkplace([]);
      }
    };

    fetchWorkers();

    // 페이지가 보일 때마다 데이터 갱신
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchWorkers();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", fetchWorkers);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", fetchWorkers);
    };
  }, [selectedWorkplaceId]);

  return {
    workersInWorkplace,
    showWorkerListModal,
    setShowWorkerListModal,
  };
}
