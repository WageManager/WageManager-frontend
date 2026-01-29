import { useEffect, useMemo, useState, type MouseEvent, type JSX } from "react";
import { useNavigate } from "react-router-dom";
import { FaUser } from "react-icons/fa";
import Swal from "sweetalert2";
import "../../styles/employerMyPageReceive.css";
import { getMyInfo } from "../../api/commonApi";
import type { UserInfo } from "../../api/commonApiResponse.type";
import {
  getWorkplaces,
  getPendingApprovals,
  approveCorrectionRequest,
  rejectCorrectionRequest,
  approveWorkRecord,
  rejectWorkRecord,
} from "../../api/employerApi";

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

export default function EmployerMyPageReceive(): JSX.Element {
  const navigate = useNavigate();
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  // 사용자 정보 및 요청 목록 로드
  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      try {
        // 사용자 정보 조회
        const userResponse = await getMyInfo();
        const userData = userResponse.data;
        setUser(userData);
        setProfileImage(userData.profileImageUrl ?? null);

        // 모든 근무지 조회
        const workplacesResponse = await getWorkplaces();
        const workplaces = workplacesResponse.data || [];

        // 모든 근무지의 승인 대기 요청 조회
        const allRequests: RequestItem[] = [];
        for (const workplace of workplaces) {
          try {
            const response = await getPendingApprovals(workplace.id);

            // 백엔드는 List<CorrectionRequestDto.ListResponse>를 직접 반환
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
                requestType: req.type, // CREATE, UPDATE, DELETE
                status: req.status,
                createdAt: req.createdAt,
              });
            });
          } catch (error) {
            console.error(`[EmployerMyPageReceive] 근무지 ${workplace.id} 요청 조회 실패:`, error);
            // 개별 근무지 요청 조회 실패 무시
          }
        }

        setRequests(allRequests);
      } catch (error) {
        Swal.fire("오류", "데이터를 불러오는데 실패했습니다.", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 날짜 기준으로 최신순 정렬
  const sortedRequests = useMemo(() => {
    return [...requests].sort((a, b) => {
      const dateA = new Date(a.createdAt ?? a.date ?? 0).getTime();
      const dateB = new Date(b.createdAt ?? b.date ?? 0).getTime();
      return dateB - dateA;
    });
  }, [requests]);

  const handleNavClick = (path: string): void => {
    navigate(path);
  };

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

        // 목록에서 제거
        setRequests((prevRequests) => prevRequests.filter((req) => req.id !== request.id));
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

        // 목록에서 제거
        setRequests((prevRequests) => prevRequests.filter((req) => req.id !== request.id));
        setExpandedCardId(null);

        Swal.fire("거절 완료", `${request.type === "correction" ? "정정" : "근무"} 요청이 거절되었습니다.`, "success");
      } catch (error: any) {
        Swal.fire("거절 실패", error?.message || "거절 처리 중 오류가 발생했습니다.", "error");
      }
    }
  };

  if (loading) {
    return (
      <div className="mypage-main">
        <div className="mypage-content">
          <div>로딩 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="mypage-main">
      <div className="mypage-content">
        <nav className="mypage-nav">
          <div className="mypage-profile-card">
            <div className="mypage-avatar-wrapper">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt="프로필"
                  className="mypage-avatar-image"
                />
              ) : (
                <div className="mypage-avatar-placeholder">
                  <FaUser />
                </div>
              )}
            </div>
            <div className="mypage-profile-name">{user?.name || "사용자"}</div>
            <hr />
          </div>
          <ul>
            <li>
              <button
                type="button"
                className="mypage-nav-li"
                onClick={() => handleNavClick("/employer/employer-mypage")}
              >
                내 프로필 수정
              </button>
            </li>
            <li>
              <button
                type="button"
                className="mypage-nav-checked"
                onClick={() => handleNavClick("/employer/employer-mypage-receive")}
              >
                받은 근무 요청
              </button>
            </li>
          </ul>
        </nav>
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
                    <div
                      className={`shift-detail-panel ${
                        expandedCardId === request.id ? "open" : ""
                      }`}
                    >
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
                          <p className="detail-value">
                            {requestDate.toLocaleDateString("ko-KR")}
                          </p>
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
      </div>
    </div>
  );
}
