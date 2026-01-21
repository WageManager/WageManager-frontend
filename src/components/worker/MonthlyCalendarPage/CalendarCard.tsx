/**
 * CalendarCard - 월간 캘린더 그리드 컴포넌트
 * 날짜별 근무 기록을 시각적으로 표시
 */
import type {
  WorkRecord,
  WorkRecordsByDate,
  ContractColorMap,
} from '../../../types/worker/monthlyCalendar.types';
import { COLOR_CLASSES, DEFAULT_COLOR_INDEX } from '../../../constants/calendar';

// ============ 로컬 상수 (이 컴포넌트에서만 사용) ============

const DAY_NAMES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] as const;

// ============ 로컬 타입 (이 컴포넌트에서만 사용) ============

interface CalendarCardProps {
  currentYear: number;
  currentMonth: number; // 0-11 (JavaScript Date 기준)
  calendarCells: (number | null)[];
  selectedDateKey: string;
  workRecords: WorkRecordsByDate;
  onSelectDay: (day: number) => void;
  makeDateKey: (year: number, month: number, day: number) => string;
  contractColorMap: ContractColorMap;
  todayKey: string;
}

// ============ 헬퍼 함수 ============

/**
 * contractId와 상태에 따른 라벨 색상 클래스명 반환
 */
const getWorkLabelColor = (
  contractId: number,
  contractColorMap: ContractColorMap
): string => {
  const colorIndex = contractColorMap[contractId] ?? DEFAULT_COLOR_INDEX;
  return COLOR_CLASSES[colorIndex] || 'brown';
};

// ============ 컴포넌트 ============

export default function CalendarCard({
  currentYear,
  currentMonth,
  calendarCells,
  selectedDateKey,
  workRecords,
  onSelectDay,
  makeDateKey,
  contractColorMap,
  todayKey,
}: CalendarCardProps) {
  return (
    <div className="calendar-card">
      <div className="calendar-header-row">
        {DAY_NAMES.map((day) => (
          <div key={day} className="calendar-header-cell">
            {day}
          </div>
        ))}
      </div>

      <div className="calendar-grid">
        {calendarCells.map((day, index) => {
          if (!day) {
            return <div key={`empty-${index}`} className="calendar-cell empty" />;
          }

          const key = makeDateKey(currentYear, currentMonth, day);
          const dayRecords = workRecords[key] || [];

          // PENDING_APPROVAL 상태가 아닌 근무만 표시
          const visibleRecords = dayRecords.filter(
            (record: WorkRecord) => record.status !== 'PENDING_APPROVAL'
          );

          const isSelected = selectedDateKey === key;
          const isToday = todayKey === key;

          const cellClasses = [
            'calendar-cell',
            isSelected ? 'selected' : '',
            !isSelected && isToday ? 'today' : '',
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <button
              type="button"
              key={key}
              className={cellClasses}
              onClick={() => onSelectDay(day)}
            >
              <div className="calendar-day-number">{day}</div>
              <div className="calendar-label-wrapper">
                {visibleRecords.map((record: WorkRecord) => (
                  <span
                    key={record.id}
                    className={`work-label work-label-${getWorkLabelColor(
                      record.contractId,
                      contractColorMap
                    )}`}
                  >
                    {record.place}
                  </span>
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
