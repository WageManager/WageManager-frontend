// 기존 API 타입 재export
export type {
  Workplace,
  ContractWorker,
  Contract,
  WorkScheduleItem,
  PayrollDeductionType,
} from "../../api/employerApiResponse.type";

// 주간 스케줄 타입 (한글 요일 기반)
export interface WeeklySchedule {
  [key: string]: {
    start: string; // "HH:MM"
    end: string; // "HH:MM"
  };
}

// 주간 스케줄 그리드 타입
export interface WeeklyScheduleGrid {
  [key: string]: boolean[];
}

// 근로자 기본 정보
export interface WorkerBasicInfo {
  name: string;
  birthDate: string;
  phone: string;
  email: string;
}

// 근로자 근무 정보
export interface WorkerWorkInfo {
  workplace: string;
  weeklySchedule: WeeklySchedule;
  breakTime: number | { [key: string]: number };
  hourlyWage: number;
  payday: number;
  socialInsurance: boolean;
  withholdingTax: boolean;
}

// 완전한 근로자 데이터
export interface WorkerData {
  basicInfo: WorkerBasicInfo;
  workInfo: WorkerWorkInfo;
}

// 편집 중인 근무 정보
export interface EditedWorkInfo extends WorkerWorkInfo {
  workerId: number;
  workerName: string;
}

// 추가 중인 근로자 정보
export interface AddedWorkerInfo {
  workerId: number;
  workerName: string;
  workerCode: string;
  hourlyWage: number;
  weeklySchedule: WeeklySchedule;
  payday: number;
  socialInsurance: boolean;
  withholdingTax: boolean;
}

// TimeInput Props
export interface TimeInputProps {
  label?: string;
  value?: string;
  onChange: (value: string) => void;
  allowMidnight?: boolean;
}

// WorkplaceForm Props
export interface WorkplaceFormProps {
  title: string;
  formData: {
    name?: string;
    address?: string;
    businessNumber?: string;
    isSmallBusiness?: boolean;
  };
  onFormDataChange: (data: {
    name?: string;
    address?: string;
    businessNumber?: string;
    isSmallBusiness?: boolean;
  }) => void;
  onCancel: () => void;
  onSave: () => void;
  cancelButtonText?: string;
  saveButtonText?: string;
  autoFocus?: boolean;
}

// BasicInfoCard Props
export interface BasicInfoCardProps {
  workerData: WorkerData | null;
  onDismiss: () => void;
}

// ScheduleGrid Props
export interface ScheduleGridProps {
  weeklyScheduleGrid: WeeklyScheduleGrid;
  hoveredBlockGroup: string | null;
  onHoverBlock: (day: string | null, hour: number | null) => void;
  currentWorkInfo: WorkerWorkInfo | null;
  workerData: WorkerData | null;
  isAddingWorker?: boolean;
  newWorkerWorkInfo?: AddedWorkerInfo | null;
}

// WorkInfoCard Props
export interface WorkInfoCardProps {
  workerData: WorkerData | null;
  currentWorkInfo: WorkerWorkInfo | null;
  isEditingWork: boolean;
  onStartEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onUpdateWorkInfo: (updates: Partial<EditedWorkInfo>) => void;
}
