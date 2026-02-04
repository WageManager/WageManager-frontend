/**
 * 근로자 마이페이지
 * - 프로필 정보 표시 및 수정
 * - 근무지 관리
 * - 정정 요청 목록 조회
 */

import { useState } from 'react';
import ProfileBox from '../../components/worker/MyPage/ProfileBox';
import ProfileEdit from '../../components/worker/MyPage/ProfileEdit';
import WorkplaceManage from '../../components/worker/MyPage/WorkplaceManage';
import WorkEditRequestList from '../../components/worker/MyPage/WorkEditRequestList';
import LoadingDots from '../../components/common/LoadingDots';
import { useUserData } from '../../hooks/worker/useMyPage/useUserData';
import { useWorkplaces } from '../../hooks/worker/useMyPage/useWorkplaces';
import { useEditRequests } from '../../hooks/worker/useMyPage/useEditRequests';
import type { ActiveTab, EditSection } from '../../types/worker/workerMypage.types';
import './WorkerMyPage.css';


export default function WorkerMyPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('profile');

  // 사용자 및 근로자 정보
  const { user, worker, isLoading: isLoadingUser, updateUser } = useUserData();

  // 근무지 정보
  const { workplaces, previousWorkplaces, isLoading: isLoadingWorkplaces } = useWorkplaces();

  // 정정 요청 목록
  const { editRequests, isLoading: isLoadingEditRequests } = useEditRequests();

  // 초기 로딩 상태
  if (isLoadingUser) {
    return <LoadingDots fillParent />;
  }

  // 사용자 정보가 없는 경우
  if (!user) {
    return (
      <div className="worker-mypage-main">
        <div className="worker-mypage-content">
          <p>사용자 정보를 불러올 수 없습니다.</p>
        </div>
      </div>
    );
  }

  // 사용자 정보 업데이트 핸들러
  const handleUserUpdate = async (section: EditSection, data: Record<string, string>) => {
    await updateUser(section, data);
  };

  // 탭에 따른 콘텐츠 렌더링
  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <ProfileEdit
            user={user}
            worker={worker}
            onUserUpdate={handleUserUpdate}
          />
        );
      case 'workplace':
        return (
          <WorkplaceManage
            workplaces={workplaces}
            previousWorkplaces={previousWorkplaces}
            isLoading={isLoadingWorkplaces}
          />
        );
      case 'editRequest':
        return (
          <WorkEditRequestList
            requests={editRequests}
            isLoading={isLoadingEditRequests}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="worker-mypage-main">
      <div className="worker-mypage-content">
        <ProfileBox
          user={user}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
        {renderContent()}
      </div>
    </div>
  );
}
