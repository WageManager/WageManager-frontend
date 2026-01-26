import { useState, useMemo, useEffect, useCallback } from "react";
import "./WorkerRemittancePage.css";
import { formatCurrency } from "../employer/utils/formatUtils";
import { MdKeyboardArrowDown, MdKeyboardArrowUp } from "react-icons/md";
import WorkDetailList from "../../components/worker/RemittancePage/WorkDetailList";
import { getContracts, getContractDetail, getWorkRecords, getSalaries, getPayments } from "../../api/workerApi";
import type { Contract, SalaryListItem, PaymentResponse } from "../../api/workerApi";
import { formatTime, parseWorkDate, pad2 } from "../../utils/dateUtils";
import type {
  Workplace,
  RemittanceWorkRecord,
  RemittanceInfo,
  SortOrder,
} from "../../types/worker/remittancePage.types";

/**
 * 근로자 송금 관리 페이지
 * - 월별 근무 내역 조회
 * - 급여 및 입금 상태 확인
 * - 근무 상세 내역 확인
 */

// contractId를 안전하게 id로 변환하는 함수
// API가 number[] 또는 Contract[] 형태로 응답할 수 있어 두 경우를 모두 처리
const extractContractId = (contractId: number | Contract | null | undefined): number | null => {
  if (contractId === null || contractId === undefined) return null;
  if (typeof contractId === 'object' && 'id' in contractId) {
    return contractId.id;
  }
  return contractId as number;
};

export default function WorkerRemittancePage() {
  // State 관리
  const [workplaces, setWorkplaces] = useState<Workplace[]>([]);
  const [selectedWorkplaceId, setSelectedWorkplaceId] = useState<number | null>(null);
  const [currentYear, setCurrentYear] = useState<number>(() => new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(() => new Date().getMonth() + 1);
  const [expandedRecordIndex, setExpandedRecordIndex] = useState<number | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("latest");
  const [view, setView] = useState<boolean>(false);
  const [workplaceView, setWorkplaceView] = useState<boolean>(false);
  const [workRecords, setWorkRecords] = useState<RemittanceWorkRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [calculatedSalary, setCalculatedSalary] = useState<SalaryListItem | null>(null);
  const [isCalculatingSalary, setIsCalculatingSalary] = useState<boolean>(false);
  const [payments, setPayments] = useState<PaymentResponse[]>([]);

  // 선택된 근무지 정보 조회
  const selectedWorkplace = workplaces.find((wp) => wp.id === selectedWorkplaceId);

  // 근무지 목록 가져오기 (마운트 시에만 실행)
  useEffect(() => {
    const fetchWorkplaces = async () => {
      try {
        const contractsResponse = await getContracts();
        let contracts: (number | Contract)[] = [];
        if (Array.isArray(contractsResponse.data)) {
          contracts = contractsResponse.data;
        } else if (contractsResponse.data) {
          contracts = [contractsResponse.data as unknown as Contract];
        }

        const workplacesList = await Promise.all(
          contracts.map(async (contract) => {
            const contractId = extractContractId(contract);
            if (!contractId) return null;

            try {
              const contractDetail = await getContractDetail(contractId);
              return {
                id: contractId,
                name: contractDetail.data?.workplaceName || '',
              };
            } catch (error) {
              console.error(`[WorkerRemittancePage] 계약 ${contractId} 상세 정보 조회 실패:`, error);
              return null;
            }
          })
        );

        const validWorkplaces: Workplace[] = workplacesList.filter(
          (wp): wp is Workplace => wp !== null
        );
        setWorkplaces(validWorkplaces);

        // 첫 번째 근무지를 기본 선택
        const firstWorkplace = validWorkplaces[0];
        if (firstWorkplace && !selectedWorkplaceId) {
          setSelectedWorkplaceId(firstWorkplace.id);
        }
      } catch (error) {
        console.error("[WorkerRemittancePage] 근무지 목록 조회 실패:", error);
        setWorkplaces([]);
      }
    };

    fetchWorkplaces();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 근무 기록 가져오기 (표시용, 급여 계산은 calculateSalary API 사용)
  const fetchWorkRecords = useCallback(async () => {
    if (!selectedWorkplaceId) {
      setWorkRecords([]);
      return;
    }

    try {
      setIsLoading(true);

      // 계약 상세 정보 가져오기 (workplaceName 등)
      const contractDetail = await getContractDetail(selectedWorkplaceId);
      const hourlyWage = contractDetail.data?.hourlyWage || 0;
      const payrollDeductionType = contractDetail.data?.payrollDeductionType || '';

      // 4대 보험 및 세금 정보 추출
      const hasSocialInsurance = payrollDeductionType.includes('INSURANCE');
      const hasWithholdingTax = payrollDeductionType.includes('TAX');

      // 해당 월의 근무 기록 가져오기
      const lastDay = new Date(currentYear, currentMonth, 0).getDate();
      const startDate = `${currentYear}-${pad2(currentMonth)}-${pad2(1)}`;
      const endDate = `${currentYear}-${pad2(currentMonth)}-${pad2(lastDay)}`;

      const workRecordsResponse = await getWorkRecords(startDate, endDate);
      const workRecordsData = workRecordsResponse.data || [];

      // 근무 기록 매핑 (급여 계산은 calculateSalary API 결과 사용)
      const mappedRecords: RemittanceWorkRecord[] = workRecordsData
        .filter((record) => record.contractId === selectedWorkplaceId && record.status !== "PENDING_APPROVAL")
        .map((record) => {
          // 날짜 파싱
          const { date, day } = parseWorkDate(record.workDate);

          // 기본 급여 계산 (표시용, 실제 급여는 calculateSalary API 결과 사용)
          const baseWage = Math.round((hourlyWage * record.totalWorkMinutes) / 60);

          return {
            id: record.id,
            date,
            day,
            startTime: formatTime(record.startTime) || "00:00",
            endTime: formatTime(record.endTime) || "00:00",
            workplace: contractDetail.data?.workplaceName || '',
            breakMinutes: record.breakMinutes || 0,
            hourlyWage,
            wage: baseWage,
            allowances: {
              overtime: { enabled: false, rate: 0 },
              night: { enabled: false, rate: 0 },
              holiday: { enabled: false, rate: 0 },
            },
            socialInsurance: hasSocialInsurance,
            withholdingTax: hasWithholdingTax,
          };
        });

      setWorkRecords(mappedRecords);
    } catch (error) {
      console.error("[WorkerRemittancePage] 근무 기록 조회 실패:", error);
      setWorkRecords([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedWorkplaceId, currentYear, currentMonth]);

  useEffect(() => {
    fetchWorkRecords();
  }, [fetchWorkRecords]);

  // 근무 기록 정렬 (클라이언트 사이드)
  const sortedWorkRecords = useMemo(() => {
    return [...workRecords].sort((a, b) => {
      if (sortOrder === "latest") {
        return b.date - a.date;
      } else {
        return a.date - b.date;
      }
    });
  }, [workRecords, sortOrder]);

  // 급여 조회 (getSalaries API 사용)
  const fetchCalculatedSalary = useCallback(async () => {
    if (!selectedWorkplaceId) {
      setCalculatedSalary(null);
      return;
    }

    try {
      setIsCalculatingSalary(true);
      const response = await getSalaries();
      if (response?.success && response?.data) {
        // 현재 선택된 연도/월/계약에 해당하는 급여 찾기
        const matchedSalary = response.data.find(
          (salary) =>
            salary.contractId === selectedWorkplaceId &&
            salary.year === currentYear &&
            salary.month === currentMonth
        );
        setCalculatedSalary(matchedSalary || null);
      } else {
        setCalculatedSalary(null);
      }
    } catch (error) {
      console.error("[WorkerRemittancePage] 급여 조회 실패:", error);
      setCalculatedSalary(null);
    } finally {
      setIsCalculatingSalary(false);
    }
  }, [selectedWorkplaceId, currentYear, currentMonth]);

  useEffect(() => {
    fetchCalculatedSalary();
  }, [fetchCalculatedSalary]);

  // 송금 내역 가져오기 (월 변경 시 갱신)
  const fetchPayments = useCallback(async () => {
    try {
      const response = await getPayments();
      if (response?.success && response?.data) {
        setPayments(response.data);
      } else {
        setPayments([]);
      }
    } catch (error) {
      console.error("[WorkerRemittancePage] 송금 내역 조회 실패:", error);
      setPayments([]);
    }
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments, currentYear, currentMonth]);

  // 해당 월의 총 급여 계산 (근무 기록 wage 합산)
  const totalWage = useMemo(() => {
    return workRecords.reduce((sum, record) => {
      return sum + (record.wage || 0);
    }, 0);
  }, [workRecords]);

  // 입금 상태 정보 계산 (API 데이터 기반)
  const remittanceInfo: RemittanceInfo = useMemo(() => {
    if (!calculatedSalary?.id) {
      return { status: "before", remittanceDate: null };
    }

    const payment = payments.find((p) => p.salaryId === calculatedSalary.id);

    if (!payment) {
      const today = new Date();
      const currentYearNum = today.getFullYear();
      const currentMonthNum = today.getMonth() + 1;

      const isMonthPassed =
        currentYearNum > currentYear ||
        (currentYearNum === currentYear && currentMonthNum > currentMonth);

      return {
        status: isMonthPassed ? "pending" : "before",
        remittanceDate: null,
      };
    }

    if (payment.isPaid) {
      return {
        status: "completed",
        remittanceDate: payment.paymentDate || null,
      };
    }

    const today = new Date();
    const currentYearNum = today.getFullYear();
    const currentMonthNum = today.getMonth() + 1;

    const isMonthPassed =
      currentYearNum > currentYear ||
      (currentYearNum === currentYear && currentMonthNum > currentMonth);

    return {
      status: isMonthPassed ? "pending" : "before",
      remittanceDate: null,
    };
  }, [calculatedSalary, payments, currentYear, currentMonth]);

  // 이전 월로 이동
  const handlePrevMonth = () => {
    setCurrentMonth((prev) => {
      if (prev === 1) {
        setCurrentYear((y) => y - 1);
        return 12;
      }
      return prev - 1;
    });
    setExpandedRecordIndex(null);
  };

  // 다음 월로 이동
  const handleNextMonth = () => {
    setCurrentMonth((prev) => {
      if (prev === 12) {
        setCurrentYear((y) => y + 1);
        return 1;
      }
      return prev + 1;
    });
    setExpandedRecordIndex(null);
  };

  // 근무지 선택 핸들러
  const handleWorkplaceSelect = (workplaceId: number) => {
    setSelectedWorkplaceId(workplaceId);
    setWorkplaceView(false);
    setExpandedRecordIndex(null);
  };

  // 근무 내역 카드 클릭 핸들러 (상세 정보 펼치기/접기)
  const handleRecordClick = (index: number) => {
    setExpandedRecordIndex((prev) => (prev === index ? null : index));
  };

  // 정렬 옵션 선택 핸들러
  const handleSortSelect = (order: SortOrder) => {
    setSortOrder(order);
    setView(false);
    setExpandedRecordIndex(null);
  };

  return (
    <div className="remittance-page">
        {/* 상단: 월 선택 */}
        <div className="remittance-header">
          <div className="remittance-header-left"></div>
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
          <div className="remittance-header-right"></div>
        </div>

        {/* 급여 카드 및 입금 상태 */}
        <div className="remittance-wage-section">
          <div className="wage-card-wrapper">
            {/* 근무지 선택 드롭다운 */}
            <div className="remittance-workplace-select-top">
              <div className="workplace-dropdown-wrapper">
                <button
                  type="button"
                  className="workplace-dropdown-button"
                  onClick={() => setWorkplaceView(!workplaceView)}
                >
                  <span>{selectedWorkplace?.name || "근무지 선택"}</span>
                  {workplaceView ? <MdKeyboardArrowUp /> : <MdKeyboardArrowDown />}
                </button>
                {workplaceView && (
                  <div className="workplace-dropdown-menu">
                    {workplaces.map((wp) => (
                      <button
                        key={wp.id}
                        type="button"
                        className={`workplace-dropdown-item ${
                          selectedWorkplaceId === wp.id ? "active" : ""
                        }`}
                        onClick={() => handleWorkplaceSelect(wp.id)}
                      >
                        {wp.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {/* 급여 정보 및 입금 상태 카드 */}
            <div className="wage-card">
            <div className="wage-info-section">
              <div className="wage-label">급여</div>
              <div className="wage-amount">
                {isCalculatingSalary ? "계산 중..." : formatCurrency(totalWage)}
              </div>
            </div>
            <div className="remittance-status-card">
              {remittanceInfo.status === "completed" ? (
                <>
                  <button className="remittance-status-button completed">
                    입금 완료
                  </button>
                  <div className="remittance-date">
                    송금 날짜: {remittanceInfo.remittanceDate}
                  </div>
                </>
              ) : remittanceInfo.status === "pending" ? (
                <button className="remittance-status-button pending">
                  입금 대기
                </button>
              ) : (
                <button className="remittance-status-button before">
                  입금 전
                </button>
              )}
            </div>
          </div>
          </div>
        </div>

        {/* 근무 상세 내역 */}
        <WorkDetailList
          workRecords={sortedWorkRecords}
          isLoading={isLoading}
          sortOrder={sortOrder}
          view={view}
          expandedRecordIndex={expandedRecordIndex}
          onSortSelect={handleSortSelect}
          onViewToggle={() => setView(!view)}
          onRecordClick={handleRecordClick}
        />
  </div>
  );
}
