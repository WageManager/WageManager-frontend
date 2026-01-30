import PropTypes from "prop-types";
import "../../../pages/workers/WorkerMyPage.css";
import { getCorrectionStatusLabel } from "../../../constants/status";

export default function WorkEditRequestList({ requests, isLoading }) {
  if (isLoading) {
    return (
      <div className="worker-mypage-container">
        <h1 className="worker-mypage-title">보낸 근무 요청</h1>
        <p>로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="worker-mypage-container">
      <h1 className="worker-mypage-title">보낸 근무 요청</h1>
      <div className="worker-mypage-request-list">
        {requests && requests.length > 0 ? (
          requests.map((request, index) => (
            <div key={index} className="worker-mypage-request-card">
              <div className="worker-mypage-request-info">
                <div className="worker-mypage-request-row">
                  <span className="worker-mypage-request-label">근무지:</span>
                  <span className="worker-mypage-request-value">
                    {request.place}
                  </span>
                </div>
                <div className="worker-mypage-request-row">
                  <span className="worker-mypage-request-label">날짜:</span>
                  <span className="worker-mypage-request-value">
                    {request.date}
                  </span>
                </div>
                <div className="worker-mypage-request-row">
                  <span className="worker-mypage-request-label">근무 시간:</span>
                  <span className="worker-mypage-request-value">
                    {request.startTime} ~ {request.endTime}
                  </span>
                </div>
                <div className="worker-mypage-request-row">
                  <span className="worker-mypage-request-label">상태:</span>
                  <span
                    className={`worker-mypage-request-status worker-mypage-request-status-${request.status}`}
                  >
                    {getCorrectionStatusLabel(request.status)}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="worker-mypage-empty">
            보낸 근무 요청이 없습니다.
          </p>
        )}
      </div>
    </div>
  );
}

WorkEditRequestList.propTypes = {
  requests: PropTypes.arrayOf(
    PropTypes.shape({
      place: PropTypes.string,
      date: PropTypes.string,
      startTime: PropTypes.string,
      endTime: PropTypes.string,
      status: PropTypes.string,
    })
  ),
  isLoading: PropTypes.bool,
};

