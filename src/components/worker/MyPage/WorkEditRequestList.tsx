import '../../../pages/workers/WorkerMyPage.css';
import LoadingDots from '../../common/LoadingDots';
import { getCorrectionStatusLabel } from '../../../constants/status';
import type { WorkEditRequestListProps, EditRequestDisplay } from '../../../types/worker/workerMypage.types';

/**
 * 보낸 근무 요청 목록 컴포넌트
 * - 정정 요청 목록 표시
 * - 상태별 스타일 적용
 */
export default function WorkEditRequestList({
  requests,
  isLoading,
}: WorkEditRequestListProps) {
  if (isLoading) {
    return (
      <div className="worker-mypage-container">
        <h1 className="worker-mypage-title">보낸 근무 요청</h1>
        <LoadingDots />
      </div>
    );
  }

  const hasRequests = requests && requests.length > 0;

  return (
    <div className="worker-mypage-container">
      <h1 className="worker-mypage-title">보낸 근무 요청</h1>
      <div className="worker-mypage-request-list">
        {hasRequests ? (
          requests.map((request, index) => (
            <RequestCard key={index} request={request} />
          ))
        ) : (
          <p className="worker-mypage-empty">보낸 근무 요청이 없습니다.</p>
        )}
      </div>
    </div>
  );
}

// ============ 내부 컴포넌트 ============

interface RequestCardProps {
  request: EditRequestDisplay;
}

function RequestCard({ request }: RequestCardProps) {
  const statusClassName = `worker-mypage-request-status worker-mypage-request-status-${request.status}`;

  return (
    <div className="worker-mypage-request-card">
      <div className="worker-mypage-request-info">
        <RequestRow label="근무지" value={request.place} />
        <RequestRow label="날짜" value={request.date} />
        <RequestRow
          label="근무 시간"
          value={`${request.startTime} ~ ${request.endTime}`}
        />
        <div className="worker-mypage-request-row">
          <span className="worker-mypage-request-label">상태:</span>
          <span className={statusClassName}>
            {getCorrectionStatusLabel(request.status)}
          </span>
        </div>
      </div>
    </div>
  );
}

interface RequestRowProps {
  label: string;
  value: string;
}

function RequestRow({ label, value }: RequestRowProps) {
  return (
    <div className="worker-mypage-request-row">
      <span className="worker-mypage-request-label">{label}:</span>
      <span className="worker-mypage-request-value">{value}</span>
    </div>
  );
}
