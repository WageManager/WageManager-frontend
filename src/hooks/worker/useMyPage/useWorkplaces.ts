import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { getContracts, getContractDetail } from '../../../api/workerApi';
import type { WorkplaceDisplay } from '../../../types/worker/workerMypage.types';
import { formatDateToKorean } from '../../../utils/dateUtils';

interface UseWorkplacesReturn {
  workplaces: WorkplaceDisplay[];
  previousWorkplaces: WorkplaceDisplay[];
  isLoading: boolean;
}

/**
 * 근무지 정보를 관리하는 훅
 * - 계약 목록 조회 (getContracts)
 * - 계약 상세 정보 조회 (getContractDetail)
 * - 현재 근무지 / 이전 근무지 분류
 */
export function useWorkplaces(): UseWorkplacesReturn {
  const [workplaces, setWorkplaces] = useState<WorkplaceDisplay[]>([]);
  const [previousWorkplaces, setPreviousWorkplaces] = useState<WorkplaceDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchWorkplaces = async () => {
      try {
        setIsLoading(true);

        // 1. 전체 계약 목록 조회
        const contractsResponse = await getContracts();
        const hasValidContracts =
          contractsResponse.success &&
          contractsResponse.data &&
          Array.isArray(contractsResponse.data);

        if (!hasValidContracts) {
          setWorkplaces([]);
          setPreviousWorkplaces([]);
          return;
        }

        const contracts = contractsResponse.data;

        // 2. 각 계약의 상세 정보를 병렬로 조회
        const detailPromises = contracts.map((contract) =>
          getContractDetail(contract.id).catch((error) => {
            console.error(`계약 ${contract.id} 상세 정보 조회 실패:`, error);
            return null;
          })
        );

        const detailResponses = await Promise.all(detailPromises);

        // 3. 상세 정보를 매핑하여 현재 근무지와 이전 근무지로 분류
        const currentWorkplaces: WorkplaceDisplay[] = [];
        const previousWorkplacesList: WorkplaceDisplay[] = [];

        detailResponses.forEach((response) => {
          const hasValidDetail = response?.success && response.data;
          if (!hasValidDetail) return;

          const contractData = response.data;
          const baseWorkplace: WorkplaceDisplay = {
            workplaceName: contractData.workplaceName || '',
            startDate: formatDateToKorean(contractData.contractStartDate),
            hourlyWage: contractData.hourlyWage || 0,
          };

          if (contractData.isActive) {
            // 현재 근무지
            currentWorkplaces.push(baseWorkplace);
          } else {
            // 이전 근무지
            previousWorkplacesList.push({
              ...baseWorkplace,
              endDate: contractData.contractEndDate
                ? formatDateToKorean(contractData.contractEndDate)
                : '',
            });
          }
        });
        setWorkplaces(currentWorkplaces);
        setPreviousWorkplaces(previousWorkplacesList);
      } catch (error) {
        console.error('근무지 정보 조회 실패:', error);
        const err = error as { status?: number; response?: { status?: number }; error?: { message?: string }; message?: string };
        const errorStatus = err.status ?? err.response?.status ?? '알 수 없음';
        const errorMessage = err.error?.message ?? err.message ?? '근무지 정보 조회에 실패했습니다.';

        toast.error(`[${errorStatus}] ${errorMessage}`, {
          position: 'top-right',
          autoClose: 3000,
        });
        setWorkplaces([]);
        setPreviousWorkplaces([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorkplaces();
  }, []);

  return { workplaces, previousWorkplaces, isLoading };
}
