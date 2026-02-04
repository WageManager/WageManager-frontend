import type { FC } from "react";
import { formatDuration } from "../../../utils/employer/formatUtils";
import type { ShiftBlockProps } from "../../../types/employer/dailyCalendarPage.types";

/**
 * ShiftBlock
 * 개별 근무 블록 (타임라인에 표시)
 * - 이름, 시간, 총 근무시간 표시
 * - 근무 시간에 따른 반응형 표시
 */
const ShiftBlock: FC<ShiftBlockProps> = ({ shift, isActive, onClick }) => {
  const left = (shift.startHour / 24) * 100;
  const width = (shift.durationHours / 24) * 100;
  const top = 20 + shift.laneIndex * 80;

  // 근무 시간이 1시간 40분 이하일 때는 이름만 표시
  const isSmallBlock = shift.durationHours <= 100 / 60; // 1시간 40분 = 100분
  // 근무 시간이 2시간 30분 이하일 때는 총 시간 숨김
  const hideDuration = shift.durationHours <= 150 / 60; // 2시간 30분 = 150분

  return (
    <div
      className={`daily-shift-block ${isActive ? "active" : ""} ${
        isSmallBlock ? "small" : ""
      }`}
      style={{
        left: `${left}%`,
        width: `${width}%`,
        top: `${top}px`,
      }}
      onClick={onClick}
    >
      <div className="shift-name">{shift.name}</div>
      {!isSmallBlock && (
        <>
          <div className="shift-time">{`${shift.start} - ${shift.end}`}</div>
          {!hideDuration && (
            <div className="shift-duration">
              {formatDuration(shift.durationHours)}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ShiftBlock;
