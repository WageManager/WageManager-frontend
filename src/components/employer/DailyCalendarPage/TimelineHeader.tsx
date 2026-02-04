import type { FC } from "react";
import type { TimelineHeaderProps } from "../../../types/employer/dailyCalendarPage.types";

/**
 * TimelineHeader
 * 타임라인 상단 시간 레이블 (0-23시)
 */
const TimelineHeader: FC<TimelineHeaderProps> = ({ hours }) => {
  return (
    <div className="daily-hours-row">
      {hours.map((hour) => (
        <div key={hour} className="daily-hour-cell">
          {hour}
        </div>
      ))}
    </div>
  );
};

export default TimelineHeader;
