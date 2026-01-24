/**
 * 주간 캘린더 관련 타입 정의
 */

import type { EditForm } from './monthlyCalendar.types';

export type WorkRecordStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'DELETED';

export interface WorkRecord {
  id: number;
  contractId: number;
  start: string; // "HH:mm" 형식
  end: string; // "HH:mm" 형식
  wage: number;
  place: string;
  breakMinutes: number;
  totalWorkMinutes: number;
  status: WorkRecordStatus;
  isModified: boolean;
}

export interface WorkRecordsByDate {
  [dateKey: string]: WorkRecord[];
}

export type { EditForm } from './monthlyCalendar.types';

export interface WeeklyCalendarProps {
  workRecords: WorkRecordsByDate;
  onConfirmEdit?: (form: EditForm) => Promise<void>;
  onWeekChange?: (weekStart: Date) => void;
}

export interface WeeklySummary {
  totalHours: number;
  totalWage: number;
}
