import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { getUserProfile, updateUserProfile, updateAccountInfo } from '../../../api/userApi';
import { getWorkerInfo } from '../../../api/workerApi';
import type { UserResponse, WorkerResponse } from '../../../api/userApiResponse.type';
import type { EditSection } from '../../../types/worker/workerMypage.types';

interface UseUserDataReturn {
  user: UserResponse | null;
  worker: WorkerResponse | null;
  isLoading: boolean;
  updateUser: (section: EditSection, data: Record<string, string>) => Promise<void>;
}

/**
 * 사용자 프로필 및 근로자 정보를 관리하는 훅
 * - 사용자 프로필 조회 (getUserProfile)
 * - 근로자 정보 조회 (getWorkerInfo)
 * - 프로필 업데이트 (updateUserProfile, updateAccountInfo)
 */
export function useUserData(): UseUserDataReturn {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [worker, setWorker] = useState<WorkerResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 근로자 정보 조회 (사용 전에 정의)
    const fetchWorkerInfo = async (userId: number) => {
      try {
        const workerResponse = await getWorkerInfo(userId);
        const hasValidWorkerData = workerResponse.success && workerResponse.data;

        if (hasValidWorkerData) {
          setWorker(workerResponse.data);
        } else {
          setWorker(null);
        }
      } catch (workerError) {
        console.error('근로자 정보 조회 실패:', workerError);
        setWorker(null);
      }
    };

    // 사용자 데이터 조회
    const fetchUserData = async () => {
      try {
        setIsLoading(true);

        // 1. 사용자 프로필 조회
        const profileResponse = await getUserProfile();
        const hasValidProfile = profileResponse.success && profileResponse.data;

        if (!hasValidProfile) {
          setUser(null);
          setWorker(null);
          return;
        }

        const userData = profileResponse.data;
        setUser(userData);

        // 2. 근로자 정보 조회
        // success=true인 경우 id는 필수 필드이므로 별도 체크 불필요
        await fetchWorkerInfo(userData.id);
      } catch (error) {
        console.error('사용자 프로필 조회 실패:', error);
        setUser(null);
        setWorker(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const updateUser = useCallback(async (section: EditSection, data: Record<string, string>) => {
    try {
      if (section === 'account') {
        // 계좌 정보 수정
        const response = await updateAccountInfo({
          accountNumber: data.accountNumber || '',
          bankName: data.bankName || '',
        });

        if (response.success && response.data) {
          setWorker(response.data);
          toast.success('계좌 정보가 성공적으로 수정되었습니다.', {
            position: 'top-right',
            autoClose: 2000,
          });
        }
      } else {
        // 이름 또는 전화번호 수정
        const response = await updateUserProfile(data);

        if (response.success && response.data) {
          setUser(response.data);

          const successMessages: Record<string, string> = {
            basic: '이름이 성공적으로 수정되었습니다.',
            phone: '전화번호가 성공적으로 수정되었습니다.',
          };

          toast.success(successMessages[section] || '프로필이 성공적으로 수정되었습니다.', {
            position: 'top-right',
            autoClose: 2000,
          });
        }
      }
    } catch (error) {
      console.error('사용자 정보 수정 실패:', error);
      const err = error as { status?: number; response?: { status?: number }; error?: { message?: string }; message?: string };
      const errorStatus = err.status ?? err.response?.status ?? '알 수 없음';
      const errorMessage = err.error?.message ?? err.message ?? '정보 수정에 실패했습니다.';

      toast.error(`[${errorStatus}] ${errorMessage}`, {
        position: 'top-right',
        autoClose: 3000,
      });
    }
  }, []);

  return { user, worker, isLoading, updateUser };
}
