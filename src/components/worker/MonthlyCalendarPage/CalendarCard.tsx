import type {
  WorkRecord,
  WorkRecordsByDate,
  ContractColorMap,
} from '../../../types/worker/workerMonthlyCalendar.types';
import { COLOR_CLASSES, DEFAULT_COLOR_INDEX } from '../../../constants/calendar';
import { makeDateKey } from '../../../utils/dateUtils';

const DAY_NAMES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] as const;

interface CalendarCardProps {
  currentYear: number;
  currentMonth: number; // 0-11 (JavaScript Date 기준)                                                                                                                                                                              
  calendarCells: (number | null)[];
  selectedDay: number | null;
  workRecords: WorkRecordsByDate;
  onSelectDay: (day: number) => void;
  contractColorMap: ContractColorMap;
  todayKey: string;
}

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
  selectedDay,
  workRecords,
  onSelectDay,
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
          const isSelected:boolean = selectedDay === day;
          const isToday:boolean = todayKey === key;
          const cellClasses = [
            'calendar-cell',
            isSelected ? 'selected' : '',
            !isSelected && isToday ? 'today' : '',
          ].filter(Boolean).join(' ');

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