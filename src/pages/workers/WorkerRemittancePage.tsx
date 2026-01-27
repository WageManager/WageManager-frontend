/**
 * 근로자 송금 관리 페이지
 * - 월별 근무 내역 조회
 * - 급여 및 입금 상태 확인
 * - 근무 상세 내역 확인
 */

import { useState, useMemo } from "react";
import "./WorkerRemittancePage.css";
import { formatCurrency } from "../employer/utils/formatUtils";
import WorkDetailList from "../../components/worker/RemittancePage/WorkDetailList";
import WorkplaceDropdown from "../../components/worker/RemittancePage/WorkplaceDropdown";
import { useRemittanceData } from "../../hooks/worker/useRemittanceData";
import type { SortOrder } from "../../types/worker/remittancePage.types";


export default function WorkerRemittancePage() {
  // ── 데이터 (커스텀 훅) ─────────────────────
  const {
    workplaces,
    selectedWorkplaceId,
    setSelectedWorkplaceId,
    currentYear,
    currentMonth,
    goToPrevMonth,
    goToNextMonth,
    workRecords,
    isLoading,
    totalWage,
    isCalculatingSalary,
    remittanceInfo,
  } = useRemittanceData();

  // ── UI 상태 ────────────────────────────────
  const [expandedRecordIndex, setExpandedRecordIndex] = useState<number | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("latest");
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState<boolean>(false);

  // ── 정렬된 근무 기록 (UI 정렬 상태 + 데이터) ────
  const sortedWorkRecords = useMemo(() => {
    return [...workRecords].sort((a, b) => {
      if (sortOrder === "latest") {
        return b.date - a.date;
      } else {
        return a.date - b.date;
      }
    });
  }, [workRecords, sortOrder]);

  // ── 이벤트 핸들러 ──────────────────────────
  const handlePrevMonth = () => {
    goToPrevMonth();
    setExpandedRecordIndex(null);
  };

  const handleNextMonth = () => {
    goToNextMonth();
    setExpandedRecordIndex(null);
  };

  const handleWorkplaceSelect = (workplaceId: number) => {
    setSelectedWorkplaceId(workplaceId);
    setExpandedRecordIndex(null);
  };

  const handleRecordClick = (index: number) => {
    setExpandedRecordIndex((prev) => (prev === index ? null : index));
  };

  const handleSortSelect = (order: SortOrder) => {
    setSortOrder(order);
    setIsSortDropdownOpen(false);
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
            <WorkplaceDropdown
              workplaces={workplaces}
              selectedWorkplaceId={selectedWorkplaceId}
              onSelect={handleWorkplaceSelect}
            />
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
          isSortDropdownOpen={isSortDropdownOpen}
          expandedRecordIndex={expandedRecordIndex}
          onSortSelect={handleSortSelect}
          onSortDropdownToggle={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
          onRecordClick={handleRecordClick}
        />
  </div>
  );
}
