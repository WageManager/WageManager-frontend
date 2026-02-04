import type { FC } from "react";
import { getDateKey } from "../../../utils/employer/dateUtils";
import type { CurrentWorkersPanelProps } from "../../../types/employer/dailyCalendarPage.types";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

/**
 * CurrentWorkersPanel
 * 현재 근무중인 직원 목록 패널
 */
const CurrentWorkersPanel: FC<CurrentWorkersPanelProps> = ({
  currentTime,
  scheduleData,
  selectedWorkplace,
}) => {
  const todayKey = getDateKey(currentTime);
  const todaySchedules = scheduleData[selectedWorkplace]?.[todayKey] || [];
  const currentHour = currentTime.getHours();
  const currentMinute = currentTime.getMinutes();
  const currentTimeDecimal = currentHour + currentMinute / 60;

  const currentWorkers = todaySchedules.filter((item) => {
    return (
      item.startHour <= currentTimeDecimal &&
      item.startHour + item.durationHours > currentTimeDecimal
    );
  });

  return (
    <div className="daily-summary-card">
      <div className="summary-time">
        <p>
          {`${currentTime.getMonth() + 1}/${currentTime.getDate()}(${
            WEEKDAYS[currentTime.getDay()]
          })`}{" "}
          {`${String(currentTime.getHours()).padStart(2, "0")}:${String(
            currentTime.getMinutes()
          ).padStart(2, "0")}`}
        </p>
        <span>현재 근무중</span>
      </div>
      <ul>
        {currentWorkers.map((item) => (
          <li key={item.id}>
            <strong>
              {item.start}~{item.end}
            </strong>{" "}
            {item.name}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CurrentWorkersPanel;
