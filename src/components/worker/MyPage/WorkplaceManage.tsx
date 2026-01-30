import '../../../pages/workers/WorkerMyPage.css';
import LoadingDots from '../../common/LoadingDots';
import type { WorkplaceManageProps, WorkplaceDisplay } from '../../../types/worker/workerMypage.types';

/**
 * 근무지 관리 컴포넌트
 * - 현재 근무지 목록 표시
 * - 이전 근무 이력 표시
 */
export default function WorkplaceManage({
  workplaces,
  previousWorkplaces,
  isLoading,
}: WorkplaceManageProps) {
  if (isLoading) {
    return (
      <div className="worker-mypage-container">
        <LoadingDots />
      </div>
    );
  }

  return (
    <div className="worker-mypage-container">
      {/* 현재 근무지 정보 */}
      <h2 className="worker-mypage-section-title">근무지 정보</h2>
      <WorkplaceList
        workplaces={workplaces}
        emptyMessage="현재 근무지가 없습니다."
        showEndDate={false}
      />

      {/* 이전 근무 이력 */}
      <h2 className="worker-mypage-section-title" style={{ marginTop: '40px' }}>
        이전 근무 이력
      </h2>
      <WorkplaceList
        workplaces={previousWorkplaces}
        emptyMessage="이전 근무 이력이 없습니다."
        showEndDate={true}
      />
    </div>
  );
}

// ============ 내부 컴포넌트 ============

interface WorkplaceListProps {
  workplaces: WorkplaceDisplay[];
  emptyMessage: string;
  showEndDate: boolean;
}

function WorkplaceList({ workplaces, emptyMessage, showEndDate }: WorkplaceListProps) {
  const hasWorkplaces = workplaces && workplaces.length > 0;

  if (!hasWorkplaces) {
    return <p className="worker-mypage-empty">{emptyMessage}</p>;
  }

  return (
    <div className="worker-mypage-workplace-list">
      {workplaces.map((workplace, index) => (
        <WorkplaceCard
          key={index}
          workplace={workplace}
          showEndDate={showEndDate}
        />
      ))}
    </div>
  );
}

interface WorkplaceCardProps {
  workplace: WorkplaceDisplay;
  showEndDate: boolean;
}

function WorkplaceCard({ workplace, showEndDate }: WorkplaceCardProps) {
  const formattedWage = Number(workplace.hourlyWage).toLocaleString();

  return (
    <div className="worker-mypage-workplace-card">
      <div className="worker-mypage-workplace-info">
        <div className="worker-mypage-workplace-row">
          <span className="worker-mypage-workplace-label">근무지:</span>
          <span className="worker-mypage-workplace-value">
            {workplace.workplaceName}
          </span>
        </div>
        <div className="worker-mypage-workplace-row">
          <span className="worker-mypage-workplace-label">입사 날짜:</span>
          <span className="worker-mypage-workplace-value">
            {workplace.startDate}
          </span>
        </div>
        {showEndDate && (
          <div className="worker-mypage-workplace-row">
            <span className="worker-mypage-workplace-label">퇴사 날짜:</span>
            <span className="worker-mypage-workplace-value">
              {workplace.endDate}
            </span>
          </div>
        )}
        <div className="worker-mypage-workplace-row">
          <span className="worker-mypage-workplace-label">시급:</span>
          <span className="worker-mypage-workplace-value">
            {formattedWage}원
          </span>
        </div>
      </div>
    </div>
  );
}
