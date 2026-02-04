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

  // 전날 데이터 (익일 근무 확인용)
  const yesterday = new Date(currentTime);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = getDateKey(yesterday);
  const yesterdaySchedules = scheduleData[selectedWorkplace]?.[yesterdayKey] || [];

  // 오늘 시작한 일반 근무 필터링
  const todayWorkers = todaySchedules.filter((item) => {
    // 익일 근무의 두 번째 파트 (00:00 시작)는 제외 - 전날 데이터에서 처리
    if (item.start === "00:00" && !item.crossesMidnight) {
      return false;
    }
    return (
      item.startHour <= currentTimeDecimal &&
      item.startHour + item.durationHours > currentTimeDecimal
    );
  });

  // 전날 시작해서 오늘까지 이어지는 익일 근무 필터링
  const overnightWorkers = yesterdaySchedules.filter((item) => {
    if (!item.crossesMidnight) return false;
    // 전날 시작 + 자정까지 시간 + 오늘 시간이 현재 시간보다 큰지 확인
    const endHourToday = item.durationHours - (24 - item.startHour);
    return currentTimeDecimal < endHourToday;
  });

  const currentWorkers = [...todayWorkers, ...overnightWorkers];

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
