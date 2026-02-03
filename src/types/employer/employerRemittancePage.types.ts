// ============ Employer Remittance 페이지 UI 전용 타입 ==============

import type {
  Workplace,
  ContractWorker,
  WorkRecord,
} from "../../api/employerApiResponse.type";

// 수당 관련 타입 (common에서 가져옴)
export type { Allowance, AllowanceKey, AllowanceMap } from "../common/allowance.types";

import type { AllowanceMap } from "../common/allowance.types";

// API 타입 re-export
export type { Workplace, ContractWorker, WorkRecord };

// ============ 근무 기록 타입 ============

/** UI에서 사용하는 가공된 근무 기록 (API WorkRecord를 매핑한 결과) */
export interface EmployerWorkRecord {
  date: number; // 일
  day: string; // 요일
  startTime: string;
  endTime: string;
  hourlyWage: number;
  breakMinutes: number;
  /** 기본 급여 (표시용) */
  wage: number;
  allowances: AllowanceMap;
  socialInsurance: boolean;
  withholdingTax: boolean;
}

// ============ 상태 관리 타입 ============

/** 근무지별 근로자 목록 캐시 */
export type WorkerListMap = Record<number, ContractWorker[]>;

/** 선택된 근로자 (ContractWorker의 부분 집합 + workerId) */
export interface SelectedWorker extends ContractWorker {
  workerId?: number;
}

// ============ 컴포넌트 Props 타입 ============

/** WorkplaceSelect 컴포넌트 Props */
export interface WorkplaceSelectProps {
  workplaces: Workplace[];
  selectedWorkplaceId: number | null;
  onChange: (workplaceId: number) => void;
}

/** WorkerList 컴포넌트 Props */
export interface WorkerListProps {
  workers: ContractWorker[];
  selectedWorkerId: number | null;
  onWorkerClick: (worker: ContractWorker) => void;
}

/** MonthNav 컴포넌트 Props */
export interface MonthNavProps {
  currentYear: number;
  currentMonth: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

/** WorkDetailCard 컴포넌트 Props */
export interface WorkDetailCardProps {
  record: EmployerWorkRecord;
  index: number;
  isExpanded: boolean;
  onToggle: (index: number) => void;
}

/** WorkDetailPanel 컴포넌트 Props */
export interface WorkDetailPanelProps {
  record: EmployerWorkRecord;
  workerName: string;
  workplaceName: string;
  currentYear: number;
  currentMonth: number;
  isOpen: boolean;
}

/** SalarySummaryBox 컴포넌트 Props */
export interface SalarySummaryBoxProps {
  totalWage: number;
  onRemittance: () => void;
}

// ============ 훅 반환 타입 ============

/** useEmployerRemittanceData 훅 반환 타입 */
export interface UseEmployerRemittanceDataReturn {
  // 근무지
  workplaces: Workplace[];
  selectedWorkplaceId: number | null;
  selectedWorkplaceName: string;
  setSelectedWorkplaceId: (id: number) => void;

  // 근로자
  workers: ContractWorker[];
  currentSelectedWorker: SelectedWorker | null;
  setManuallySelectedWorker: (worker: ContractWorker | null) => void;

  // 월 네비게이션
  currentYear: number;
  currentMonth: number;
  goToPrevMonth: () => void;
  goToNextMonth: () => void;

  // 근무 기록
  workerData: EmployerWorkRecord[];
  isLoading: boolean;

  // 급여
  totalWage: number;

  // 액션
  handleRemittance: () => void;

  // 확장 패널
  expandedRecordIndex: number | null;
  setExpandedRecordIndex: (index: number | null) => void;
}
