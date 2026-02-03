/**
 * 고용주 송금 관리 페이지
 * - 근무지별 근로자 급여 조회 및 카카오페이 송금
 */

import "../../styles/remittanceManagePage.css";
import { useEmployerRemittanceData } from "../../hooks/employer/useEmployerRemittanceData";
import {
  WorkplaceSelect,
  WorkerList,
  WorkDetailCard,
  WorkDetailPanel,
  SalarySummaryBox,
} from "../../components/employer/RemittanceManagePage";
import MonthNav from "../../components/common/MonthNav";

/** 날짜를 "YYYY.MM.DD" 형식으로 포맷 */
const formatWorkDate = (year: number, month: number, date: number): string => {
  return `${year}.${String(month).padStart(2, "0")}.${String(date).padStart(2, "0")}`;
};

export default function EmployerRemittanceManagePage() {
  const {
    // 근무지
    workplaces,
    selectedWorkplaceId,
    selectedWorkplaceName,
    setSelectedWorkplaceId,

    // 근로자
    workers,
    currentSelectedWorker,
    setManuallySelectedWorker,

    // 월 네비게이션
    currentYear,
    currentMonth,
    goToPrevMonth,
    goToNextMonth,

    // 근무 기록
    workerData,

    // 급여
    totalWage,

    // 액션
    handleRemittance,

    // 확장 패널
    expandedRecordIndex,
    setExpandedRecordIndex,
  } = useEmployerRemittanceData();

  const handleRecordToggle = (index: number) => {
    setExpandedRecordIndex(expandedRecordIndex === index ? null : index);
  };

  const handleWorkerClick = (worker: (typeof workers)[number]) => {
    setManuallySelectedWorker(worker);
    setExpandedRecordIndex(null);
  };

  return (
    <div className="remittance-manage-page">
      {/* 왼쪽 패널: 근무지/근로자 선택 */}
      <div className="remittance-left-panel">
        <WorkplaceSelect
          workplaces={workplaces}
          selectedWorkplaceId={selectedWorkplaceId}
          onChange={setSelectedWorkplaceId}
        />
        <WorkerList
          workers={workers}
          selectedWorkerId={currentSelectedWorker?.id ?? null}
          onWorkerClick={handleWorkerClick}
        />
      </div>

      {/* 중앙 패널: 근무 상세 내역 */}
      <div className="remittance-center-panel">
        <MonthNav
          year={currentYear}
          month={currentMonth}
          onPrevMonth={goToPrevMonth}
          onNextMonth={goToNextMonth}
        />

        <h2 className="remittance-detail-title">근무 상세 내역</h2>

        <div className="remittance-detail-list">
          {workerData && workerData.length > 0 ? (
            workerData.map((record, index) => (
              <div key={`${record.date}-${record.startTime}`}>
                <WorkDetailCard
                  record={record}
                  index={index}
                  isExpanded={expandedRecordIndex === index}
                  onToggle={handleRecordToggle}
                />
                <WorkDetailPanel
                  record={record}
                  workerName={currentSelectedWorker?.workerName || "-"}
                  workplaceName={selectedWorkplaceName}
                  formattedDate={formatWorkDate(currentYear, currentMonth, record.date)}
                  isOpen={expandedRecordIndex === index}
                />
              </div>
            ))
          ) : (
            <p className="no-data">근무 내역이 없습니다.</p>
          )}
        </div>
      </div>

      {/* 오른쪽 패널: 급여 요약/송금 */}
      <div className="remittance-right-panel">
        <SalarySummaryBox totalWage={totalWage} onRemittance={handleRemittance} />
      </div>
    </div>
  );
}
