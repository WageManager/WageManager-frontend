// ============ Daily Calendar 페이지 타입 정의 ============

import type { Workplace } from "../../api/employerApiResponse.type";
import type { AllowanceMap, AllowanceKey, Allowance } from "../common/allowance.types";

// API 타입 re-export
export type { Workplace };
export type { AllowanceMap, AllowanceKey, Allowance };

// ============ 근무 (Shift) 타입 ============

/** 개별 근무 정보 */
export interface Shift {
  id: string;
  name: string;
  start: string; // "HH:MM"
  end: string; // "HH:MM"
  startHour: number; // 소수점 시간 (예: 9.5 = 9시 30분)
  durationHours: number; // 근무 시간 (소수점)
  breakMinutes: number;
  hourlyWage: number;
  allowances: AllowanceMap;
  socialInsurance: boolean;
  withholdingTax: boolean;
  workRecordId?: number; // 백엔드 ID
  workplaceDetail?: string;
  crossesMidnight?: boolean; // 익일 근무 여부
  nextDayEndHour?: number | undefined; // 익일 종료 시간
}

/** 레인 인덱스 포함 근무 (렌더링용) */
export interface ShiftWithLane extends Shift {
  laneIndex: number;
}

/** 편집 중인 근무 정보 */
export interface EditedShift extends Shift {
  laneIndex?: number;
}

// ============ 스케줄 데이터 타입 ============

/** 날짜별 근무 목록 */
export type DateScheduleMap = Record<string, Shift[]>;

/** 근무지별 스케줄 데이터 */
export type ScheduleData = Record<string, DateScheduleMap>;

// ============ 캘린더 타입 ============

/** 캘린더 셀 */
export interface CalendarCell {
  date: Date;
  currentMonth: boolean;
}

// ============ Hook 반환 타입 ============

/** useDateNavigation 훅 반환 타입 */
export interface UseDateNavigationReturn {
  selectedDate: Date;
  displayMonth: Date;
  dateKey: string;
  calendarCells: CalendarCell[];
  handlePrevMonth: () => void;
  handleNextMonth: () => void;
  handleSelectDate: (date: Date) => void;
}

/** useFetchScheduleData 훅 반환 타입 */
export interface UseFetchScheduleDataReturn {
  scheduleData: ScheduleData;
  setScheduleData: React.Dispatch<React.SetStateAction<ScheduleData>>;
  isScheduleLoading: boolean;
}

/** useFetchWorkersInWorkplace 훅 반환 타입 */
export interface UseFetchWorkersInWorkplaceReturn {
  workersInWorkplace: string[];
  showWorkerListModal: boolean;
  setShowWorkerListModal: React.Dispatch<React.SetStateAction<boolean>>;
}

/** useShiftSelection 훅 반환 타입 */
export interface UseShiftSelectionReturn {
  activeShiftId: string | null;
  activeShift: ShiftWithLane | undefined;
  displayShift: Shift | null;
  previousDayShift: Shift | null;
  scheduleWithLanes: ShiftWithLane[];
  laneCount: number;
  setActiveShiftId: React.Dispatch<React.SetStateAction<string | null>>;
  handleShiftClick: (shiftId: string) => void;
}

/** useShiftEdit 훅 반환 타입 */
export interface UseShiftEditReturn {
  editedShift: EditedShift | null;
  isEditing: boolean;
  shiftForDisplay: Shift | null;
  setEditedShift: React.Dispatch<React.SetStateAction<EditedShift | null>>;
  setIsEditing: React.Dispatch<React.SetStateAction<boolean>>;
  handleStartEdit: () => void;
  handleCancelEdit: () => void;
  handleTimeChange: (field: "start" | "end", value: string) => void;
  updateEditedShift: <K extends keyof EditedShift>(field: K, value: EditedShift[K]) => void;
  updateAllowance: (type: AllowanceKey, changes: Partial<Allowance>) => void;
}

/** useShiftCRUD 훅 반환 타입 */
export interface UseShiftCRUDReturn {
  handleAddShift: () => void;
  handleSelectWorker: (workerName: string) => Promise<void>;
  handleSaveShift: () => Promise<void>;
  handleDeleteShift: () => void;
}

/** useDailyCalendarData 훅 반환 타입 (메인 조합 훅) */
export interface UseDailyCalendarDataReturn {
  // 로딩 상태
  isLoading: boolean;

  // 근무지
  workplaces: Workplace[];
  selectedWorkplaceId: number | null;
  selectedWorkplaceName: string;
  setSelectedWorkplaceId: (id: number | null) => void;

  // 날짜 네비게이션
  selectedDate: Date;
  displayMonth: Date;
  dateKey: string;
  calendarCells: CalendarCell[];
  handlePrevMonth: () => void;
  handleNextMonth: () => void;
  handleSelectDate: (date: Date) => void;

  // 스케줄 데이터
  scheduleData: ScheduleData;
  workplaceSchedules: DateScheduleMap;

  // 근무 선택
  activeShiftId: string | null;
  activeShift: ShiftWithLane | undefined;
  displayShift: Shift | null;
  previousDayShift: Shift | null;
  previousDate: Date;
  scheduleWithLanes: ShiftWithLane[];
  laneCount: number;
  handleShiftClick: (shiftId: string) => void;

  // 근무 편집
  editedShift: EditedShift | null;
  isEditing: boolean;
  shiftForDisplay: Shift | null;
  handleStartEdit: () => void;
  handleCancelEdit: () => void;
  handleTimeChange: (field: "start" | "end", value: string) => void;
  updateEditedShift: <K extends keyof EditedShift>(field: K, value: EditedShift[K]) => void;
  updateAllowance: (type: AllowanceKey, changes: Partial<Allowance>) => void;

  // 근무 CRUD
  handleAddShift: () => void;
  handleSelectWorker: (workerName: string) => Promise<void>;
  handleSaveShift: () => Promise<void>;
  handleDeleteShift: () => void;

  // 근로자 모달
  workersInWorkplace: string[];
  showWorkerListModal: boolean;
  setShowWorkerListModal: React.Dispatch<React.SetStateAction<boolean>>;

  // 현재 시간 (현재 근무중 패널용)
  currentTime: Date;

  // 포맷된 날짜
  formattedSelectedDate: string;
}

// ============ 컴포넌트 Props 타입 ============

/** TimelineHeader 컴포넌트 Props */
export interface TimelineHeaderProps {
  hours: number[];
}

/** ShiftBlock 컴포넌트 Props */
export interface ShiftBlockProps {
  shift: ShiftWithLane;
  isActive: boolean;
  onClick: () => void;
}

/** TimelineGrid 컴포넌트 Props */
export interface TimelineGridProps {
  scheduleWithLanes: ShiftWithLane[];
  laneCount: number;
  activeShiftId: string | null;
  onShiftClick: (shiftId: string) => void;
}

/** ShiftDetailCard 컴포넌트 Props */
export interface ShiftDetailCardProps {
  activeShift: ShiftWithLane;
  shiftForDisplay: Shift | null;
  displayShift: Shift | null;
  previousDayShift: Shift | null;
  selectedWorkplace: string;
  formattedSelectedDate: string;
  selectedDate: Date;
  workplaceSchedules: DateScheduleMap;
  isEditing: boolean;
  editedShift: EditedShift | null;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveShift: () => Promise<void>;
  onDeleteShift: () => void;
  onClose: () => void;
  onTimeChange: (field: "start" | "end", value: string) => void;
  onUpdateEditedShift: <K extends keyof EditedShift>(field: K, value: EditedShift[K]) => void;
  onUpdateAllowance: (type: AllowanceKey, changes: Partial<Allowance>) => void;
}

/** MonthCalendar 컴포넌트 Props */
export interface MonthCalendarProps {
  displayMonth: Date;
  calendarCells: CalendarCell[];
  selectedDate: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onSelectDate: (date: Date) => void;
}

/** CurrentWorkersPanel 컴포넌트 Props */
export interface CurrentWorkersPanelProps {
  currentTime: Date;
  scheduleData: ScheduleData;
  selectedWorkplace: string;
}

/** WorkerSelectModal 컴포넌트 Props */
export interface WorkerSelectModalProps {
  isOpen: boolean;
  workers: string[];
  onClose: () => void;
  onSelectWorker: (workerName: string) => void;
}
