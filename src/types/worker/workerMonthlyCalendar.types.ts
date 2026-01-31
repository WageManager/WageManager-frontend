export interface WorkRecord {
  id: number;
  contractId: number;
  start: string; // "HH:mm"
  end: string;   // "HH:mm"
  wage: number;
  place: string;
  breakMinutes: number;
  totalWorkMinutes: number;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'DELETED';
  isModified: boolean;
}

export type WorkRecordsByDate = Record<string, WorkRecord[]>;

export interface EditForm {
  recordId: number;
  contractId: number;
  originalDateKey: string;
  place: string;
  wage: number;
  date: string;
  startHour: string;
  startMinute: string;
  endHour: string;
  endMinute: string;
  breakMinutes: number;
  originalData: {
    place: string;
    wage: number;
    date: string;
    startHour: string;
    startMinute: string;
    endHour: string;
    endMinute: string;
    breakMinutes: number;
  };
}

export interface AddWorkForm {
  contractId: number | null;
  date: string;
  startHour: string;
  startMinute: string;
  endHour: string;
  endMinute: string;
  breakMinutes: number;
}

export interface WorkplaceOption {
  id: number;
  workerName: string;
  workplaceName: string;
}
