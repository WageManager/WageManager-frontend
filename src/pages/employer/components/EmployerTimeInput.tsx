import type { FC, ChangeEvent } from "react";
import type { TimeInputProps } from "../../../types/employer/workerManagePageTypes";
import "../../../styles/dailyCalendarPage.css";

/**
 * EmployerTimeInput
 * 근로자 근무 정보 수정 시 시간 입력 컴포넌트
 * - 시간(00-23 또는 00-24)과 분(00-59) 입력 가능
 * - allowMidnight 옵션으로 자정(24:00) 입력 가능
 */
const EmployerTimeInput: FC<TimeInputProps> = ({
  label,
  value = "00:00",
  onChange,
  allowMidnight = false,
}) => {
  const [hour = "00", minute = "00"] = value.split(":");

  const handleHourChange = (e: ChangeEvent<HTMLInputElement>) => {
    const nextHour = String(
      Math.max(
        0,
        Math.min(allowMidnight ? 24 : 23, Number(e.target.value) || 0)
      )
    ).padStart(2, "0");
    onChange(`${nextHour}:${nextHour === "24" ? "00" : minute}`);
  };

  const handleMinuteChange = (e: ChangeEvent<HTMLInputElement>) => {
    const nextMinute = String(
      Math.max(0, Math.min(59, Number(e.target.value) || 0))
    ).padStart(2, "0");
    onChange(`${hour}:${nextMinute}`);
  };

  return (
    <div className="time-wheel">
      {label && <span className="time-wheel-label">{label}</span>}
      <div className="time-wheel-columns">
        <input
          type="number"
          className="time-wheel-input"
          value={hour}
          onChange={handleHourChange}
          min="0"
          max={allowMidnight ? 24 : 23}
        />
        <span className="time-wheel-separator">:</span>
        <input
          type="number"
          className="time-wheel-input"
          value={minute}
          onChange={handleMinuteChange}
          min="0"
          max="59"
          disabled={hour === "24"}
        />
      </div>
    </div>
  );
};

export default EmployerTimeInput;
