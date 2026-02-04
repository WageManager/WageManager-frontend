import type { FC } from "react";
import { isSameDate } from "../../../utils/employer/dateUtils";
import type { MonthCalendarProps } from "../../../types/employer/dailyCalendarPage.types";

/**
 * MonthCalendar
 * 사이드 월 캘린더
 */
const MonthCalendar: FC<MonthCalendarProps> = ({
  displayMonth,
  calendarCells,
  selectedDate,
  onPrevMonth,
  onNextMonth,
  onSelectDate,
}) => {
  return (
    <div className="daily-calendar-card">
      <div className="daily-calendar-header">
        <button type="button" onClick={onPrevMonth}>
          {"<"}
        </button>
        <div className="calendar-month-year">
          {displayMonth.getFullYear()}년 {displayMonth.getMonth() + 1}월
        </div>
        <button type="button" onClick={onNextMonth}>
          {">"}
        </button>
      </div>
      <div className="daily-calendar-grid">
        <div className="calendar-weekday">SUN</div>
        <div className="calendar-weekday">MON</div>
        <div className="calendar-weekday">TUE</div>
        <div className="calendar-weekday">WED</div>
        <div className="calendar-weekday">THU</div>
        <div className="calendar-weekday">FRI</div>
        <div className="calendar-weekday">SAT</div>
        {calendarCells.map(({ date, currentMonth }, idx) => {
          const isSelected = isSameDate(date, selectedDate);
          return (
            <div
              key={`${date.toISOString()}-${idx}`}
              className={`calendar-day ${isSelected ? "current" : ""} ${
                currentMonth ? "" : "other"
              }`}
              onClick={() => onSelectDate(date)}
            >
              {date.getDate()}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MonthCalendar;
