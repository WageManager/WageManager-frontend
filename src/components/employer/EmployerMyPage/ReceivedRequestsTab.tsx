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
import type { CorrectionRequestListItem, Workplace } from "../../../api/employerApiResponse.type";

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

type RequestAction = "approve" | "reject";

export default function ReceivedRequestsTab(): JSX.Element {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchRequests = async (): Promise<void> => {
      try {
        const workplacesResponse = await getWorkplaces();
        const workplaces: Workplace[] = workplacesResponse.data || [];

        const allRequests: RequestItem[] = [];
        for (const workplace of workplaces) {
          try {
            const response = await getPendingApprovals(workplace.id);
            const correctionRequests: CorrectionRequestListItem[] = Array.isArray(response.data)
              ? response.data
              : [];

            correctionRequests.forEach((req) => {
              const requestItem: RequestItem = {
                id: `correction-${req.id}`,
                type: "correction",
                originalId: req.id,
                workerName: req.requester?.name || "알 수 없음",
                workplace: req.workplaceName || workplace.name,
                date: req.workDate || req.requestedStartTime,
                startTime: req.requestedStartTime,
                endTime: req.requestedEndTime,
                requestType: req.type,
                status: req.status,
                createdAt: req.createdAt,
              };

              if (req.workRecordId != null) {
                requestItem.workRecordId = req.workRecordId;
              }
              if (req.originalStartTime != null) {
                requestItem.originalDate = req.originalStartTime;
                requestItem.originalStartTime = req.originalStartTime;
              }
              if (req.originalEndTime != null) {
                requestItem.originalEndTime = req.originalEndTime;
              }

              allRequests.push(requestItem);
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

  const handleRequestAction = async (
    request: RequestItem,
    action: RequestAction,
    e: MouseEvent<HTMLButtonElement>
  ): Promise<void> => {
    e.stopPropagation();

    const isCorrectionRequest = request.type === "correction";
    const isApprove = action === "approve";
    const actionLabel = isApprove ? "승인" : "거절";
    const requestTypeLabel = isCorrectionRequest ? "정정" : "근무";

    const displayDate = new Date(request.date).toLocaleDateString("ko-KR");
    const confirmText = isCorrectionRequest
      ? `${displayDate} ${request.originalStartTime} ~ ${request.originalEndTime}\n→ ${request.startTime} ~ ${request.endTime}`
      : `${displayDate} ${request.startTime} ~ ${request.endTime}`;

    const result = await Swal.fire({
      icon: isApprove ? "question" : "warning",
      title: `${request.workerName}님의 ${requestTypeLabel} 요청을 ${actionLabel}하시겠습니까?`,
      text: isApprove ? `${request.workplace}\n${confirmText}` : "거절된 요청은 복구할 수 없습니다.",
      showCancelButton: true,
      confirmButtonText: actionLabel,
      cancelButtonText: "취소",
      confirmButtonColor: isApprove ? "var(--color-green)" : "var(--color-red)",
    });

    if (result.isConfirmed) {
      try {
        if (isCorrectionRequest) {
          isApprove
            ? await approveCorrectionRequest(request.originalId)
            : await rejectCorrectionRequest(request.originalId);
        } else {
          isApprove
            ? await approveWorkRecord(request.originalId)
            : await rejectWorkRecord(request.originalId);
        }

        setRequests((prev) => prev.filter((req) => req.id !== request.id));
        setExpandedCardId(null);

        Swal.fire(`${actionLabel} 완료`, `${requestTypeLabel} 요청이 ${actionLabel}되었습니다.`, "success");
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : `${actionLabel} 처리 중 오류가 발생했습니다.`;
        Swal.fire(`${actionLabel} 실패`, errorMessage, "error");
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
            const isCorrectionRequest = request.type === "correction";

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
                      {isCorrectionRequest && (
                        <span style={{ marginLeft: "8px", color: "var(--color-orange)", fontSize: "0.9em" }}>
                          [정정 요청]
                        </span>
                      )}
                    </div>
                    <div className="mypage-receive-time">
                      {isCorrectionRequest ? (
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
                        onClick={(e) => handleRequestAction(request, "approve", e)}
                      >
                        승인
                      </button>
                      <button
                        type="button"
                        className="detail-delete-button"
                        onClick={(e) => handleRequestAction(request, "reject", e)}
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
                        {isCorrectionRequest ? "정정 요청" : "근무 생성 요청"}
                      </p>
                    </div>
                    <div>
                      <p className="detail-label">근무 날짜</p>
                      <p className="detail-value">{requestDate.toLocaleDateString("ko-KR")}</p>
                    </div>
                    {isCorrectionRequest && (
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
                    {!isCorrectionRequest && (
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
