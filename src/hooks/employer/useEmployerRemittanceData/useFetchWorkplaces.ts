import { useState, useEffect, useCallback } from "react";
import { getWorkplaces } from "../../../api/employerApi";
import type { Workplace } from "../../../api/employerApiResponse.type";
import { toast } from "react-toastify";

export interface UseFetchWorkplacesReturn {
  workplaces: Workplace[];
  selectedWorkplaceId: number | null;
  selectedWorkplaceName: string;
  setSelectedWorkplaceId: (id: number | null) => void;
}

/**
 * 근무지 목록 페칭 훅
 * - 마운트 시 근무지 목록 조회
 * - 첫 번째 근무지 자동 선택
 */
export function useFetchWorkplaces(): UseFetchWorkplacesReturn {
  const [workplaces, setWorkplaces] = useState<Workplace[]>([]);
  const [selectedWorkplaceId, setSelectedWorkplaceId] = useState<number | null>(
    null
  );

  // 근무지 목록 조회 (마운트 시 1회)
  useEffect(() => {
    const fetchWorkplaces = async () => {
      try {
        const response = await getWorkplaces();
        const workplacesData = response.data || [];
        setWorkplaces(workplacesData);
        if (workplacesData.length > 0) {
          setSelectedWorkplaceId(workplacesData[0].id);
        }
      } catch (err) {
        console.error("[useFetchWorkplaces] 근무지 목록 조회 실패:", err);
        toast.error("근무지 목록을 불러오는데 실패했습니다.");
        setWorkplaces([]);
      }
    };
    fetchWorkplaces();
  }, []);

  // 선택된 근무지 이름
  const selectedWorkplaceName =
    workplaces.find((wp) => wp.id === selectedWorkplaceId)?.name || "";

  const handleSetSelectedWorkplaceId = useCallback((id: number | null) => {
    setSelectedWorkplaceId(id);
  }, []);

  return {
    workplaces,
    selectedWorkplaceId,
    selectedWorkplaceName,
    setSelectedWorkplaceId: handleSetSelectedWorkplaceId,
  };
}
