import { useState, useEffect, useMemo, useCallback } from "react";
import { useFetchWorkplaces } from "../useEmployerRemittanceData/useFetchWorkplaces";
import { useDateNavigation } from "./useDateNavigation";
import { useFetchScheduleData } from "./useFetchScheduleData";
import { useFetchWorkersInWorkplace } from "./useFetchWorkersInWorkplace";
import { useShiftSelection } from "./useShiftSelection";
import { useShiftEdit } from "./useShiftEdit";
import { useShiftCRUD } from "./useShiftCRUD";
import { getDateKey } from "../../../utils/employer/dateUtils";
import type {
  UseDailyCalendarDataReturn,
  DateScheduleMap,
} from "../../../types/employer/dailyCalendarPage.types";

/**
 * DailyCalendarPage 메인 데이터 훅 (조합 훅)
 * - 모든 하위 훅 통합
 * - currentTime 관리
 * - 포맷된 날짜 계산
 */
export function useDailyCalendarData(): UseDailyCalendarDataReturn {
  // ── 현재 시간 (현재 근무중 패널용) ────────────────
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // 1분마다 업데이트

    return () => clearInterval(timer);
  }, []);

  // ── 근무지 데이터 ─────────────────────────────────
  const {
    workplaces,
    selectedWorkplaceId,
    selectedWorkplaceName,
    setSelectedWorkplaceId,
  } = useFetchWorkplaces();

  const isWorkplacesLoading = workplaces.length === 0 && selectedWorkplaceId === null;

  // ── 날짜 네비게이션 ───────────────────────────────
  const {
    selectedDate,
    displayMonth,
    dateKey,
    calendarCells,
    handlePrevMonth,
    handleNextMonth,
    handleSelectDate: baseDateSelectHandler,
  } = useDateNavigation();

  // ── 스케줄 데이터 ─────────────────────────────────
  const { scheduleData, setScheduleData, isScheduleLoading, refetchScheduleData } =
    useFetchScheduleData(selectedWorkplaceId, selectedDate);

  // 근무지별 스케줄 데이터
  const workplaceSchedules = useMemo<DateScheduleMap>(
    () => scheduleData[selectedWorkplaceName] || {},
    [scheduleData, selectedWorkplaceName]
  );

  // ── 근로자 목록 ───────────────────────────────────
  const { workersInWorkplace, showWorkerListModal, setShowWorkerListModal } =
    useFetchWorkersInWorkplace(selectedWorkplaceId);

  // ── 근무 편집 상태 (선택보다 먼저 정의) ──────────────
  const [isEditingState, setIsEditingState] = useState(false);
  const [editedShiftState, setEditedShiftState] = useState<ReturnType<typeof useShiftEdit>["editedShift"]>(null);

  // ── 근무 선택 ─────────────────────────────────────
  const handleSelectionChange = useCallback(() => {
    setIsEditingState(false);
    setEditedShiftState(null);
  }, []);

  const {
    activeShiftId,
    activeShift,
    displayShift,
    previousDayShift,
    scheduleWithLanes,
    laneCount,
    setActiveShiftId,
    handleShiftClick,
  } = useShiftSelection({
    workplaceSchedules,
    dateKey,
    selectedDate,
    onSelectionChange: handleSelectionChange,
  });

  // ── 근무 편집 ─────────────────────────────────────
  const {
    editedShift,
    isEditing,
    shiftForDisplay,
    setEditedShift,
    setIsEditing,
    handleStartEdit,
    handleCancelEdit,
    handleTimeChange,
    updateEditedShift,
    updateAllowance,
  } = useShiftEdit({
    displayShift,
  });

  // 이전 날짜 계산
  const previousDate = useMemo(() => {
    const prevDate = new Date(selectedDate);
    prevDate.setDate(prevDate.getDate() - 1);
    return prevDate;
  }, [selectedDate]);

  // 날짜 선택 핸들러 확장 (편집 상태 초기화 포함)
  const handleSelectDate = useCallback(
    (date: Date) => {
      baseDateSelectHandler(date);
      setActiveShiftId(null);
      setIsEditing(false);
      setEditedShift(null);
    },
    [baseDateSelectHandler, setActiveShiftId, setIsEditing, setEditedShift]
  );

  // ── 근무 CRUD ─────────────────────────────────────
  const {
    handleAddShift,
    handleSelectWorker,
    handleSaveShift,
    handleDeleteShift,
  } = useShiftCRUD({
    selectedWorkplaceId,
    selectedWorkplaceName,
    selectedDate,
    dateKey,
    activeShiftId,
    activeShift,
    displayShift,
    previousDayShift,
    previousDate,
    editedShift,
    workplaceSchedules,
    setScheduleData,
    setActiveShiftId,
    setEditedShift,
    setIsEditing,
    setShowWorkerListModal,
    setSelectedDate: baseDateSelectHandler,
    refetchScheduleData,
  });

  // ── 포맷된 날짜 ───────────────────────────────────
  const formattedSelectedDate = useMemo(() => {
    const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
    const day = String(selectedDate.getDate()).padStart(2, "0");
    return `${selectedDate.getFullYear()}.${month}.${day}`;
  }, [selectedDate]);

  // ── 로딩 상태 ─────────────────────────────────────
  const isLoading = isWorkplacesLoading || isScheduleLoading;

  return {
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
    dateKey,
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
    previousDate,
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
  };
}
