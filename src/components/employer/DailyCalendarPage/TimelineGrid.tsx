import type { FC } from "react";
import ShiftBlock from "./ShiftBlock";
import type { TimelineGridProps } from "../../../types/employer/dailyCalendarPage.types";

/**
 * TimelineGrid
 * 타임라인 그리드 + ShiftBlock들 렌더링
 */
const TimelineGrid: FC<TimelineGridProps> = ({
  scheduleWithLanes,
  laneCount,
  activeShiftId,
  onShiftClick,
}) => {
  return (
    <div
      className="daily-timeline"
      style={{ height: `${laneCount * 80 + 40}px` }}
    >
      {scheduleWithLanes.map((shift) => (
        <ShiftBlock
          key={shift.id}
          shift={shift}
          isActive={activeShiftId === shift.id}
          onClick={() => onShiftClick(shift.id)}
        />
      ))}
    </div>
  );
};

export default TimelineGrid;
