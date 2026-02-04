import type { FC } from "react";
import "../../styles/dailyCalendarPage.css";
import { useDailyCalendarData } from "../../hooks/employer/useDailyCalendar";
import { hours } from "../../constants/employerCalendar";
import {
  TimelineHeader,
  TimelineGrid,
  ShiftDetailCard,
  MonthCalendar,
  CurrentWorkersPanel,
  WorkerSelectModal,
} from "../../components/employer/DailyCalendarPage";
import LoadingDots from "../../components/common/LoadingDots";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

/**
 * EmployerDailyCalendarPage
 * 고용주 일일 스케줄 관리 페이지
 * - 타임라인 기반 근무 스케줄 표시
 * - 근무 추가/수정/삭제
 * - 월 캘린더를 통한 날짜 네비게이션
 */
const EmployerDailyCalendarPage: FC = () => {
  const {
    // 로딩 상태
    isLoading,

    // 근무지
    workplaces,
    selectedWorkplaceId,
    selectedWorkplaceName,
    setSelectedWorkplaceId,

    // 날짜 네비게이션
    selectedDate,
    displayMonth,
    calendarCells,
    handlePrevMonth,
    handleNextMonth,
    handleSelectDate,

    // 스케줄 데이터
    scheduleData,
    workplaceSchedules,

    // 근무 선택
    activeShiftId,
    activeShift,
    displayShift,
    previousDayShift,
    scheduleWithLanes,
    laneCount,
    handleShiftClick,

    // 근무 편집
    editedShift,
    isEditing,
    shiftForDisplay,
    handleStartEdit,
    handleCancelEdit,
    handleTimeChange,
    updateEditedShift,
    updateAllowance,

    // 근무 CRUD
    handleAddShift,
    handleSelectWorker,
    handleSaveShift,
    handleDeleteShift,

    // 근로자 모달
    workersInWorkplace,
    showWorkerListModal,
    setShowWorkerListModal,

    // 현재 시간
    currentTime,

    // 포맷된 날짜
    formattedSelectedDate,
  } = useDailyCalendarData();

  // 상세 패널 닫기 핸들러
  const handleCloseDetailPanel = () => {
    handleSelectDate(selectedDate); // 이 함수가 activeShiftId, isEditing, editedShift을 리셋함
  };

  if (isLoading) {
    return <LoadingDots fullScreen />;
  }

  return (
    <div className="daily-page">
      <div className="daily-schedule-section">
        <div className="daily-schedule-header">
          <div className="daily-header-left">
            <select
              className="daily-workplace-select"
              value={selectedWorkplaceId?.toString() ?? ""}
              onChange={(e) => {
                const value = e.target.value;
                setSelectedWorkplaceId(value ? Number(value) : null);
              }}
            >
              {workplaces.map((workplace) => (
                <option key={workplace.id} value={workplace.id}>
                  {workplace.name}
                </option>
              ))}
            </select>
            <h2 className="daily-date-heading">
              {`${selectedDate.getMonth() + 1}/${selectedDate.getDate()}(${
                WEEKDAYS[selectedDate.getDay()]
              })`}{" "}
              스케줄표
            </h2>
          </div>
          <button
            type="button"
            className="daily-add-button"
            onClick={handleAddShift}
          >
            + 근무자 추가하기
          </button>
        </div>

        <div className="daily-schedule-card">
          {/* 타임라인 상단 시간 레이블 */}
          <TimelineHeader hours={hours} />

          {/* 타임라인 그리드 + 근무 블록들 */}
          <TimelineGrid
            scheduleWithLanes={scheduleWithLanes}
            laneCount={laneCount}
            activeShiftId={activeShiftId}
            onShiftClick={handleShiftClick}
          />
        </div>

        {/* 근무 정보 카드 - 근무 블록 선택 시 별도 카드로 표시 */}
        {activeShift && (
          <ShiftDetailCard
            activeShift={activeShift}
            shiftForDisplay={shiftForDisplay}
            displayShift={displayShift}
            previousDayShift={previousDayShift}
            selectedWorkplace={selectedWorkplaceName}
            formattedSelectedDate={formattedSelectedDate}
            selectedDate={selectedDate}
            workplaceSchedules={workplaceSchedules}
            isEditing={isEditing}
            editedShift={editedShift}
            onStartEdit={handleStartEdit}
            onCancelEdit={handleCancelEdit}
            onSaveShift={handleSaveShift}
            onDeleteShift={handleDeleteShift}
            onClose={handleCloseDetailPanel}
            onTimeChange={handleTimeChange}
            onUpdateEditedShift={updateEditedShift}
            onUpdateAllowance={updateAllowance}
          />
        )}
      </div>

      <aside className="daily-side-panel">
        {/* 우측 월 달력 */}
        <MonthCalendar
          displayMonth={displayMonth}
          calendarCells={calendarCells}
          selectedDate={selectedDate}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
          onSelectDate={handleSelectDate}
        />

        {/* 우측 현재 근무자 리스트 */}
        <CurrentWorkersPanel
          currentTime={currentTime}
          scheduleData={scheduleData}
          selectedWorkplace={selectedWorkplaceName}
        />
      </aside>

      {/* 직원 선택 모달 */}
      <WorkerSelectModal
        isOpen={showWorkerListModal}
        workers={workersInWorkplace}
        onClose={() => setShowWorkerListModal(false)}
        onSelectWorker={handleSelectWorker}
      />
    </div>
  );
};

export default EmployerDailyCalendarPage;
