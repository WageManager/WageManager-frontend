import { useState, useMemo, useEffect } from "react";
import "../../styles/remittanceManagePage.css";
import { formatKRW, formatBreakTime } from "../../utils/formatUtils";
import { extraPayTypes } from "../../constants/extraPay";
import {
  getWorkplaces,
  getContractsByWorkplace,
  getWorkRecords,
  getContract,
  getWorkerById,
  getWorkerByCode,
} from "../../api/employerApi";
import Swal from "sweetalert2";

export default function RemittanceManagePage() {
  const today = new Date();
  const [workplaces, setWorkplaces] = useState([]);
  const [selectedWorkplaceId, setSelectedWorkplaceId] = useState(null);
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1);
  const [workersList, setWorkersList] = useState({});
  const [workRecords, setWorkRecords] = useState([]);

  // 근무지 목록 조회
  useEffect(() => {
    const fetchWorkplaces = async () => {
      try {
        const response = await getWorkplaces();
        const workplacesData = response.data || [];
        setWorkplaces(workplacesData);
        if (workplacesData.length > 0 && !selectedWorkplaceId) {
          setSelectedWorkplaceId(workplacesData[0].id);
        }
      } catch (error) {
        // 에러 시 빈 배열 사용
        setWorkplaces([]);
      }
    };
    fetchWorkplaces();
  }, []);

  // 선택된 근무지의 근로자 목록 조회
  useEffect(() => {
    if (!selectedWorkplaceId) return;

    const fetchWorkers = async () => {
      try {
        const response = await getContractsByWorkplace(selectedWorkplaceId);
        const workers = response.data || [];
        setWorkersList((prev) => ({
          ...prev,
          [selectedWorkplaceId]: workers,
        }));
      } catch (error) {
        // 에러 시 빈 배열 사용
        setWorkersList((prev) => ({
          ...prev,
          [selectedWorkplaceId]: [],
        }));
      }
    };

    fetchWorkers();
  }, [selectedWorkplaceId]);

  // 근무 기록 조회
  useEffect(() => {
    if (!selectedWorkplaceId) return;

    const fetchWorkRecords = async () => {
      try {
        const startDate = new Date(currentYear, currentMonth - 1, 1);
        const endDate = new Date(currentYear, currentMonth, 0);

        const response = await getWorkRecords(
          selectedWorkplaceId,
          startDate,
          endDate
        );

        setWorkRecords(response.data || []);
      } catch (error) {
        setWorkRecords([]);
      }
    };

    fetchWorkRecords();
  }, [selectedWorkplaceId, currentYear, currentMonth]);

  const selectedWorkplace =
    workplaces.find((wp) => wp.id === selectedWorkplaceId)?.name || "";

  const workers = useMemo(() => {
    const result = workersList[selectedWorkplaceId] || [];
    return result;
  }, [selectedWorkplaceId, workersList]);

  const selectedWorker = useMemo(() => {
    return workers.length > 0 ? workers[0] : null;
  }, [workers]);

  const [manuallySelectedWorker, setManuallySelectedWorker] = useState(null);
  const currentSelectedWorker = manuallySelectedWorker || selectedWorker;

  const [expandedRecordIndex, setExpandedRecordIndex] = useState(null);

  // LocalTime을 문자열로 변환
  const formatTime = (time) => {
    if (Array.isArray(time)) {
      const [h, m] = time;
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    } else if (typeof time === "string") {
      return time.substring(0, 5);
    }
    return time;
  };

  // 근무 기록을 표시용 데이터로 변환
  const workerData = useMemo(() => {
    if (!currentSelectedWorker || !workRecords.length) {
      return [];
    }

    // 선택된 근로자의 근무 기록만 필터링
    const filtered = workRecords.filter((record) => {
      return record.workerName === currentSelectedWorker.workerName;
    });

    return filtered
      .map((record) => {
        const date = new Date(record.workDate);
        const dayNames = ["일", "월", "화", "수", "목", "금", "토"];

        // 근무 시간 계산 (시급 * 근무시간)
        const startTime = formatTime(record.startTime);
        const endTime = formatTime(record.endTime);
        const [startH, startM] = startTime.split(":").map(Number);
        const [endH, endM] = endTime.split(":").map(Number);
        const startDecimal = startH + startM / 60;
        const endDecimal = endH + endM / 60;
        const workHours =
          endDecimal - startDecimal - (record.breakMinutes || 0) / 60;
        const wage = Math.floor(workHours * (record.hourlyWage || 0));

        return {
          date: date.getDate(),
          day: dayNames[date.getDay()],
          startTime,
          endTime,
          hourlyWage: record.hourlyWage,
          breakMinutes: record.breakMinutes,
          wage,
          allowances: {
            overtime: { enabled: false, rate: 0 },
            night: { enabled: false, rate: 0 },
            holiday: { enabled: false, rate: 0 },
          },
          socialInsurance: true,
          withholdingTax: true,
        };
      })
      .sort((a, b) => a.date - b.date);
  }, [currentSelectedWorker, workRecords]);

  const totalWage = useMemo(() => {
    if (!workerData || workerData.length === 0) {
      return 0;
    }
    return workerData.reduce((sum, record) => sum + (record.wage ?? 0), 0);
  }, [workerData]);

  const handlePrevMonth = () => {
    setCurrentMonth((prev) => {
      if (prev === 1) {
        setCurrentYear((y) => y - 1);
        return 12;
      }
      return prev - 1;
    });
  };

  const handleNextMonth = () => {
    setCurrentMonth((prev) => {
      if (prev === 12) {
        setCurrentYear((y) => y + 1);
        return 1;
      }
      return prev + 1;
    });
  };

  const handleWorkplaceChange = (e) => {
    const newWorkplaceId = Number(e.target.value);
    setSelectedWorkplaceId(newWorkplaceId);
    setManuallySelectedWorker(null);
    setExpandedRecordIndex(null);
  };

  const handleWorkerClick = (worker) => {
    setManuallySelectedWorker(worker);
    setExpandedRecordIndex(null);
  };

  const handleRemittance = async () => {
    if (!currentSelectedWorker) {
      Swal.fire("알림", "근로자를 선택해주세요.", "info");
      return;
    }

    try {
      let workerId = currentSelectedWorker?.workerId;

      // workerId가 없으면 contractId로 상세 정보 조회
      if (!workerId && currentSelectedWorker?.id) {
        try {
          const contractResponse = await getContract(currentSelectedWorker.id);
          workerId = contractResponse.data?.workerId;
        } catch (contractError) {
          console.error("계약 상세 조회 실패:", contractError);
          Swal.fire("오류", "계약 정보를 불러올 수 없습니다.", "error");
          return;
        }
      }

      if (!workerId) {
        Swal.fire(
          "알림",
          "근로자 정보를 불러올 수 없습니다. 계약 정보를 확인해주세요.",
          "error"
        );
        return;
      }

      // 근로자 정보 조회하여 카카오페이 링크 가져오기
      try {
        const workerResponse = await getWorkerById(workerId);
        const kakaoPayLink = workerResponse.data?.kakaoPayLink;

        if (!kakaoPayLink) {
          Swal.fire(
            "알림",
            "해당 근로자의 카카오페이 송금 링크가 등록되어 있지 않습니다.",
            "info"
          );
          return;
        }

        // 카카오페이 송금 링크로 이동
        window.open(kakaoPayLink, "_blank");
      } catch (workerError) {
        console.error("근로자 정보 조회 실패:", workerError);
        // 권한 문제일 수 있으므로 workerCode로 재시도
        if (currentSelectedWorker?.workerCode) {
          try {
            const workerResponseByCode = await getWorkerByCode(
              currentSelectedWorker.workerCode
            );
            const kakaoPayLink = workerResponseByCode.data?.kakaoPayLink;

            if (!kakaoPayLink) {
              Swal.fire(
                "알림",
                "해당 근로자의 카카오페이 송금 링크가 등록되어 있지 않습니다.",
                "info"
              );
              return;
            }

            // 카카오페이 송금 링크로 이동
            window.open(kakaoPayLink, "_blank");
          } catch (codeError) {
            console.error("근로자 코드로 조회 실패:", codeError);
            Swal.fire(
              "오류",
              "근로자 정보에 접근할 수 없습니다. 권한을 확인해주세요.",
              "error"
            );
          }
        } else {
          Swal.fire(
            "오류",
            "근로자 정보에 접근할 수 없습니다. 권한을 확인해주세요.",
            "error"
          );
        }
      }
    } catch (error) {
      console.error("카카오페이 링크 조회 실패:", error);
      Swal.fire(
        "오류",
        "카카오페이 링크를 불러오는 중 오류가 발생했습니다.",
        "error"
      );
    }
  };

  const handleRecordClick = (index) => {
    setExpandedRecordIndex((prev) => (prev === index ? null : index));
  };

  return (
    <div className="remittance-manage-page">
      <div className="remittance-left-panel">
        <div className="remittance-workplace-select">
          <select value={selectedWorkplaceId} onChange={handleWorkplaceChange}>
            {workplaces.map((wp) => (
              <option key={wp.id} value={wp.id}>
                {wp.name}
              </option>
            ))}
          </select>
        </div>
        <div className="remittance-worker-list">
          {workers.map((worker) => (
            <div
              key={worker.id}
              className={`worker-item ${
                currentSelectedWorker?.id === worker.id ? "selected" : ""
              }`}
              onClick={() => handleWorkerClick(worker)}
            >
              {worker.workerName}
            </div>
          ))}
        </div>
      </div>

      <div className="remittance-center-panel">
        <div className="remittance-month-nav">
          <button
            type="button"
            className="month-nav-button"
            onClick={handlePrevMonth}
          >
            &lt;
          </button>
          <span className="month-display">
            {currentYear}년 {currentMonth}월
          </span>
          <button
            type="button"
            className="month-nav-button"
            onClick={handleNextMonth}
          >
            &gt;
          </button>
        </div>

        <h2 className="remittance-detail-title">근무 상세 내역</h2>

        <div className="remittance-detail-list">
          {workerData && workerData.length > 0 ? (
            workerData.map((record, index) => (
              <div key={`${record.date}-${record.startTime}`}>
                <div
                  className="remittance-detail-card"
                  onClick={() => handleRecordClick(index)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleRecordClick(index);
                    }
                  }}
                >
                  <div className="detail-date">
                    <span className="date-number">{record.date}</span>
                    <span className="date-day">{record.day}</span>
                  </div>
                  <div className="detail-time">
                    <span>
                      {record.startTime} ~ {record.endTime}
                    </span>
                  </div>
                  <div className="detail-wage">
                    {formatKRW(record.wage)}
                  </div>
                </div>
                <div
                  className={`remittance-detail-panel ${
                    expandedRecordIndex === index ? "open" : ""
                  }`}
                >
                  <div className="detail-header">
                    <div className="detail-header-left">
                      <div>
                        <h3 className="detail-name">
                          {currentSelectedWorker?.workerName || "-"}
                        </h3>
                      </div>
                      <div>
                        <p className="detail-value">
                          {selectedWorkplace || "-"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="detail-grid">
                    <div>
                      <p className="detail-label">근무 날짜</p>
                      <p className="detail-value">
                        {currentYear}.{String(currentMonth).padStart(2, "0")}.
                        {String(record.date).padStart(2, "0")} ({record.day})
                      </p>
                    </div>
                    <div>
                      <p className="detail-label">근무 시간</p>
                      <p className="detail-value">
                        {record.startTime} ~ {record.endTime}
                      </p>
                    </div>
                    <div>
                      <p className="detail-label">시급</p>
                      <p className="detail-value">
                        {record.hourlyWage
                          ? formatKRW(record.hourlyWage)
                          : "-"}
                      </p>
                    </div>
                    <div>
                      <p className="detail-label">휴게 시간</p>
                      <p className="detail-value">
                        {formatBreakTime(record.breakMinutes)}
                      </p>
                    </div>
                  </div>
                  <div className="detail-section">
                    <p className="detail-label">수당 정보</p>
                    <ul className="allowance-list">
                      {extraPayTypes.map(({ key, label }) => {
                        const allowance = record.allowances?.[key] || {
                          enabled: false,
                          rate: 0,
                        };
                        return (
                          <li
                            key={key}
                            className={`allowance-item ${
                              allowance.enabled ? "on" : "off"
                            }`}
                          >
                            <span>{label}</span>
                            <span className="allowance-rate">
                              {allowance.enabled
                                ? `${allowance.rate}%`
                                : "없음"}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                  {/* <div className="detail-status-row">
                    <span
                      className={`status-pill ${
                        record.socialInsurance ? "on" : "off"
                      }`}
                    >
                      4대보험 {record.socialInsurance ? "적용" : "미적용"}
                    </span>
                    <span
                      className={`status-pill ${
                        record.withholdingTax ? "on" : "off"
                      }`}
                    >
                      소득세 {record.withholdingTax ? "적용" : "미적용"}
                    </span>
                  </div> */}
                </div>
              </div>
            ))
          ) : (
            <p className="no-data">근무 내역이 없습니다.</p>
          )}
        </div>
      </div>

      <div className="remittance-right-panel">
        <div className="remittance-summary-box">
          <h3 className="summary-title">이번 달 급여</h3>
          <div className="summary-amount">{formatKRW(totalWage)}</div>
        </div>
        <button
          type="button"
          className="remittance-button"
          onClick={handleRemittance}
        >
          송금하기
        </button>
      </div>
    </div>
  );
}
