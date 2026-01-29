import { useEffect, useMemo, useState } from "react";
import type { MouseEvent, JSX } from "react";
import Swal from "sweetalert2";
import {
  getWorkplaces,
  getPendingApprovals,
  approveCorrectionRequest,
  rejectCorrectionRequest,
  approveWorkRecord,
  rejectWorkRecord,
} from "../../../api/employerApi";

interface RequestItem {
  id: string;
  type: "correction" | "creation";
  originalId: number;
  workRecordId?: number;
  workerName: string;
  workplace: string;
  date: string;
  startTime?: string;
  endTime?: string;
  originalDate?: string;
  originalStartTime?: string;
  originalEndTime?: string;
  requestType?: string;
  status?: string;
  createdAt?: string;
}

export default function ReceivedRequestsTab(): JSX.Element {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchRequests = async (): Promise<void> => {
      try {
        const workplacesResponse = await getWorkplaces();
        const workplaces = workplacesResponse.data || [];

        const allRequests: RequestItem[] = [];
        for (const workplace of workplaces) {
          try {
            const response = await getPendingApprovals(workplace.id);
            const correctionRequests = Array.isArray(response.data) ? response.data : [];

            correctionRequests.forEach((req: any) => {
              allRequests.push({
                id: `correction-${req.id}`,
                type: "correction",
                originalId: req.id,
                workRecordId: req.workRecordId,
                workerName: req.requester?.name || "알 수 없음",
                workplace: req.workplaceName || workplace.name,
                date: req.workDate || req.requestedWorkDate,
                startTime: req.requestedStartTime,
                endTime: req.requestedEndTime,
                originalDate: req.originalWorkDate,
                originalStartTime: req.originalStartTime,
                originalEndTime: req.originalEndTime,
                requestType: req.type,
                status: req.status,
                createdAt: req.createdAt,
              });
            });
          } catch (error) {
            console.error(`근무지 ${workplace.id} 요청 조회 실패:`, error);
          }
        }

        setRequests(allRequests);
      } catch (error) {
        Swal.fire("오류", "요청 목록을 불러오는데 실패했습니다.", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, []);

  const sortedRequests = useMemo(() => {
    return [...requests].sort((a, b) => {
      const dateA = new Date(a.createdAt ?? a.date ?? 0).getTime();
      const dateB = new Date(b.createdAt ?? b.date ?? 0).getTime();
      return dateB - dateA;
    });
  }, [requests]);

  const handleCardClick = (cardId: string): void => {
    setExpandedCardId(expandedCardId === cardId ? null : cardId);
  };

  const handleApprove = async (request: RequestItem, e: MouseEvent<HTMLButtonElement>): Promise<void> => {
    e.stopPropagation();

    const displayDate = new Date(request.date).toLocaleDateString("ko-KR");
    const confirmText = request.type === "correction"
      ? `${displayDate} ${request.originalStartTime} ~ ${request.originalEndTime}\n→ ${request.startTime} ~ ${request.endTime}`
      : `${displayDate} ${request.startTime} ~ ${request.endTime}`;

    const result = await Swal.fire({
      icon: "question",
      title: `${request.workerName}님의 ${request.type === "correction" ? "정정" : "근무"} 요청을 승인하시겠습니까?`,
      text: `${request.workplace}\n${confirmText}`,
      showCancelButton: true,
      confirmButtonText: "승인",
      cancelButtonText: "취소",
      confirmButtonColor: "var(--color-green)",
    });

    if (result.isConfirmed) {
      try {
        if (request.type === "correction") {
          await approveCorrectionRequest(request.originalId);
        } else {
          await approveWorkRecord(request.originalId);
        }

        setRequests((prev) => prev.filter((req) => req.id !== request.id));
        setExpandedCardId(null);

        Swal.fire("승인 완료", `${request.type === "correction" ? "정정" : "근무"} 요청이 승인되었습니다.`, "success");
      } catch (error: any) {
        Swal.fire("승인 실패", error?.message || "승인 처리 중 오류가 발생했습니다.", "error");
      }
    }
  };

  const handleReject = async (request: RequestItem, e: MouseEvent<HTMLButtonElement>): Promise<void> => {
    e.stopPropagation();

    const result = await Swal.fire({
      icon: "warning",
      title: `${request.workerName}님의 ${request.type === "correction" ? "정정" : "근무"} 요청을 거절하시겠습니까?`,
      text: "거절된 요청은 복구할 수 없습니다.",
      showCancelButton: true,
      confirmButtonText: "거절",
      cancelButtonText: "취소",
      confirmButtonColor: "var(--color-red)",
    });

    if (result.isConfirmed) {
      try {
        if (request.type === "correction") {
          await rejectCorrectionRequest(request.originalId);
        } else {
          await rejectWorkRecord(request.originalId);
        }

        setRequests((prev) => prev.filter((req) => req.id !== request.id));
        setExpandedCardId(null);

        Swal.fire("거절 완료", `${request.type === "correction" ? "정정" : "근무"} 요청이 거절되었습니다.`, "success");
      } catch (error: any) {
        Swal.fire("거절 실패", error?.message || "거절 처리 중 오류가 발생했습니다.", "error");
      }
    }
  };

  if (loading) {
    return (
      <div className="mypage-container">
        <h1 className="mypage-title">받은 근무 요청</h1>
        <div>로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="mypage-container">
      <h1 className="mypage-title">받은 근무 요청</h1>
      <div className="mypage-receive-list">
        {sortedRequests.length === 0 ? (
          <p>받은 근무 요청이 없습니다.</p>
        ) : (
          sortedRequests.map((request) => {
            const requestDate = new Date(request.date);
            const month = requestDate.getMonth() + 1;
            const date = requestDate.getDate();

            return (
              <div key={request.id}>
                <div
                  className="mypage-receive-card"
                  onClick={() => handleCardClick(request.id)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="mypage-receive-date">
                    {month}월 {date}일
                  </div>
                  <div className="mypage-receive-divider"></div>
                  <div className="mypage-receive-info">
                    <div className="mypage-receive-worker">
                      {request.workerName}({request.workplace})
                      {request.type === "correction" && (
                        <span style={{ marginLeft: "8px", color: "var(--color-orange)", fontSize: "0.9em" }}>
                          [정정 요청]
                        </span>
                      )}
                    </div>
                    <div className="mypage-receive-time">
                      {request.type === "correction" ? (
                        <>
                          <span style={{ textDecoration: "line-through", color: "#999" }}>
                            {request.originalStartTime} ~ {request.originalEndTime}
                          </span>
                          {" → "}
                          <span>{request.startTime} ~ {request.endTime}</span>
                        </>
                      ) : (
                        `${request.startTime} ~ ${request.endTime}`
                      )}
                    </div>
                  </div>
                </div>
                <div className={`shift-detail-panel ${expandedCardId === request.id ? "open" : ""}`}>
                  <div className="detail-header">
                    <div className="detail-header-left">
                      <div>
                        <p className="detail-label">근무자</p>
                        <h3 className="detail-name">{request.workerName}</h3>
                      </div>
                      <div>
                        <p className="detail-label">근무지</p>
                        <p className="detail-value">{request.workplace}</p>
                      </div>
                    </div>
                    <div className="detail-header-actions">
                      <button
                        type="button"
                        className="detail-save-button"
                        onClick={(e) => handleApprove(request, e)}
                      >
                        승인
                      </button>
                      <button
                        type="button"
                        className="detail-delete-button"
                        onClick={(e) => handleReject(request, e)}
                      >
                        거절
                      </button>
                      <button
                        type="button"
                        className="detail-close-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedCardId(null);
                        }}
                      >
                        닫기
                      </button>
                    </div>
                  </div>
                  <div className="detail-grid">
                    <div>
                      <p className="detail-label">요청 타입</p>
                      <p className="detail-value">
                        {request.type === "correction" ? "정정 요청" : "근무 생성 요청"}
                      </p>
                    </div>
                    <div>
                      <p className="detail-label">근무 날짜</p>
                      <p className="detail-value">{requestDate.toLocaleDateString("ko-KR")}</p>
                    </div>
                    {request.type === "correction" && (
                      <>
                        <div>
                          <p className="detail-label">기존 근무 시간</p>
                          <p className="detail-value">
                            {request.originalStartTime} ~ {request.originalEndTime}
                          </p>
                        </div>
                        <div>
                          <p className="detail-label">변경 요청 시간</p>
                          <p className="detail-value">
                            {request.startTime} ~ {request.endTime}
                          </p>
                        </div>
                      </>
                    )}
                    {request.type === "creation" && (
                      <div>
                        <p className="detail-label">근무 시간</p>
                        <p className="detail-value">
                          {request.startTime} ~ {request.endTime}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
