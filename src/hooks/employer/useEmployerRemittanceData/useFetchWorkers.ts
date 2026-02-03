import { useState, useEffect, useMemo } from "react";
import { getContractsByWorkplace } from "../../../api/employerApi";
import type { ContractWorker } from "../../../api/employerApiResponse.type";
import type {
  WorkerListMap,
  SelectedWorker,
} from "../../../types/employer/employerRemittancePage.types";
import { toast } from "react-toastify";

export interface UseFetchWorkersReturn {
  workers: ContractWorker[];
  workersList: WorkerListMap;
  selectedWorker: ContractWorker | null;
  currentSelectedWorker: SelectedWorker | null;
  manuallySelectedWorker: ContractWorker | null;
  setManuallySelectedWorker: (worker: ContractWorker | null) => void;
}

/**
 * 근로자 목록 페칭 훅
 * - 선택된 근무지의 근로자 목록 조회
 * - 근로자 선택 상태 관리
 */
export function useFetchWorkers(
  selectedWorkplaceId: number | null
): UseFetchWorkersReturn {
  const [workersList, setWorkersList] = useState<WorkerListMap>({});
  const [manuallySelectedWorker, setManuallySelectedWorker] =
    useState<ContractWorker | null>(null);

  // 선택된 근무지의 근로자 목록 조회
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
      } catch (err) {
        console.error("[useFetchWorkers] 근로자 목록 조회 실패:", err);
        toast.error("근로자 목록을 불러오는데 실패했습니다.");
        setWorkersList((prev) => ({
          ...prev,
          [selectedWorkplaceId]: [],
        }));
      }
    };

    fetchWorkers();
  }, [selectedWorkplaceId]);

  // 근무지 변경 시 수동 선택 초기화
  useEffect(() => {
    setManuallySelectedWorker(null);
  }, [selectedWorkplaceId]);

  // 현재 근무지의 근로자 목록
  const workers = useMemo<ContractWorker[]>(() => {
    if (!selectedWorkplaceId) return [];
    return workersList[selectedWorkplaceId] || [];
  }, [selectedWorkplaceId, workersList]);

  // 기본 선택 근로자 (첫 번째)
  const selectedWorker = useMemo<ContractWorker | null>(() => {
    return workers.length > 0 ? (workers[0] ?? null) : null;
  }, [workers]);

  // 현재 선택된 근로자 (수동 선택 우선)
  const currentSelectedWorker = useMemo<SelectedWorker | null>(() => {
    const worker = manuallySelectedWorker || selectedWorker;
    return worker ? { ...worker } : null;
  }, [manuallySelectedWorker, selectedWorker]);

  return {
    workers,
    workersList,
    selectedWorker,
    currentSelectedWorker,
    manuallySelectedWorker,
    setManuallySelectedWorker,
  };
}
