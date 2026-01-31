import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { getCorrectionRequests } from '../../../api/workerApi';
import type { EditRequestDisplay, EditRequestStatus } from '../../../types/worker/workerMypage.types';
import { formatDateToMonthDay, formatTime } from '../../../utils/dateUtils';

interface UseEditRequestsReturn {
  editRequests: EditRequestDisplay[];
  isLoading: boolean;
}

/**
 * 정정 요청 목록을 관리하는 훅
 * - 정정 요청 목록 조회 (getCorrectionRequests)
 * - 날짜/시간 포맷팅
 * - 최신순 정렬
 */
export function useEditRequests(): UseEditRequestsReturn {
  const [editRequests, setEditRequests] = useState<EditRequestDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchEditRequests = async () => {
      try {
        setIsLoading(true);

        const response = await getCorrectionRequests();
        const hasValidData = response.success && response.data && Array.isArray(response.data);

        if (!hasValidData) {
          setEditRequests([]);
          return;
        }

        // createdAt 기준 내림차순 정렬 (최신이 위로)
        const sortedData = [...response.data].sort((a, b) => {
          const dateA = a.createdAt || '';
          const dateB = b.createdAt || '';
          return dateB.localeCompare(dateA);
        });

        // 데이터 매핑 및 필터링
        const mappedRequests = sortedData
          .map((request) => ({
            place: request.workplaceName || '',
            date: formatDateToMonthDay(request.workDate),
            startTime: formatTime(request.requestedStartTime),
            endTime: formatTime(request.requestedEndTime),
            status: request.status.toLowerCase() as EditRequestStatus,
          }))
          .filter((request) =>
            request.place && request.date && request.startTime && request.endTime
          );

        setEditRequests(mappedRequests);
      } catch (error) {
        console.error('정정 요청 목록 조회 실패:', error);
        const err = error as { status?: number; response?: { status?: number }; error?: { message?: string }; message?: string };
        const errorStatus = err.status ?? err.response?.status ?? '알 수 없음';
        const errorMessage = err.error?.message ?? err.message ?? '정정 요청 목록 조회에 실패했습니다.';

        toast.error(`[${errorStatus}] ${errorMessage}`, {
          position: 'top-right',
          autoClose: 3000,
        });

        setEditRequests([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEditRequests();
  }, []);

  return { editRequests, isLoading };
}
