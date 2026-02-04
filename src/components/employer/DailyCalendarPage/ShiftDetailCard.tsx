import type { FC } from "react";
import { extraPayTypes } from "../../../constants/extraPay";
import { formatKRW, formatBreakTime } from "../../../utils/formatUtils";
import { formatDuration } from "../../../utils/employer/formatUtils";
import { getDateKey } from "../../../utils/employer/dateUtils";
import EmployerTimeInput from "./EmployerTimeInput";
import type { ShiftDetailCardProps } from "../../../types/employer/dailyCalendarPage.types";

/**
 * ShiftDetailCard
 * 근무 상세 정보 카드
 * - 읽기/편집 모드 전환
 * - 시간, 휴게, 시급, 수당 정보
 */
const ShiftDetailCard: FC<ShiftDetailCardProps> = ({
  activeShift,
  shiftForDisplay,
  displayShift,
  previousDayShift,
  selectedWorkplace,
  formattedSelectedDate,
  selectedDate,
  workplaceSchedules,
  isEditing,
  editedShift,
  onStartEdit,
  onCancelEdit,
  onSaveShift,
  onDeleteShift,
  onClose,
  onTimeChange,
  onUpdateEditedShift,
  onUpdateAllowance,
}) => {
  // 근무 시간 텍스트 계산
  const getWorkTimeText = (): string => {
    // 익일 근무를 클릭한 경우 (전날 근무가 displayShift인 경우)
    if (
      previousDayShift &&
      activeShift &&
      activeShift.start === "00:00"
    ) {
      return `${previousDayShift.start}~${activeShift.end}(익일)`;
    }
    // 전날 근무를 클릭한 경우 (crossesMidnight가 true인 경우)
    if (shiftForDisplay?.crossesMidnight) {
      const nextDate = new Date(selectedDate);
      nextDate.setDate(nextDate.getDate() + 1);
      const nextDateKey = getDateKey(nextDate);
      const nextScheduleData = workplaceSchedules[nextDateKey] || [];
      // workRecordId 또는 name으로 매칭 (동명이인 방지)
      const matchKey = shiftForDisplay?.workRecordId ?? shiftForDisplay?.id;
      const nextDayShift = nextScheduleData.find(
        (shift) =>
          ((shift.workRecordId ?? shift.id) === matchKey ||
            shift.name === shiftForDisplay?.name) &&
          shift.start === "00:00"
      );
      if (nextDayShift) {
        return `${shiftForDisplay?.start}~${nextDayShift.end}(익일)`;
      }
      return `${shiftForDisplay?.start}~${shiftForDisplay?.end}(익일)`;
    }
    return `${shiftForDisplay?.start}~${shiftForDisplay?.end}`;
  };

  // 총 근무 시간 계산
  const getTotalDuration = (): string => {
    // 익일 근무를 클릭한 경우 (전날 근무가 displayShift인 경우)
    if (
      previousDayShift &&
      activeShift &&
      activeShift.start === "00:00"
    ) {
      const totalHours =
        previousDayShift.durationHours + activeShift.durationHours;
      return formatDuration(totalHours);
    }
    // 전날 근무를 클릭한 경우 (crossesMidnight가 true인 경우)
    if (shiftForDisplay?.crossesMidnight) {
      const nextDate = new Date(selectedDate);
      nextDate.setDate(nextDate.getDate() + 1);
      const nextDateKey = getDateKey(nextDate);
      const nextScheduleData = workplaceSchedules[nextDateKey] || [];
      // workRecordId 또는 name으로 매칭 (동명이인 방지)
      const matchKey = shiftForDisplay?.workRecordId ?? shiftForDisplay?.id;
      const nextDayShift = nextScheduleData.find(
        (shift) =>
          ((shift.workRecordId ?? shift.id) === matchKey ||
            shift.name === shiftForDisplay?.name) &&
          shift.start === "00:00"
      );
      if (nextDayShift) {
        const totalHours =
          (shiftForDisplay?.durationHours || 0) + nextDayShift.durationHours;
        return formatDuration(totalHours);
      }
    }
    return formatDuration(shiftForDisplay?.durationHours);
  };

  return (
    <div className="daily-shift-detail-card">
      <h2 className="detail-card-title">근무 정보</h2>
      <div className="detail-header">
        <div className="detail-header-left">
          <div>
            <p className="detail-label">근무자</p>
            <h3 className="detail-name">{shiftForDisplay?.name}</h3>
          </div>
          <div>
            <p className="detail-label">근무지</p>
            <p className="detail-value">
              {activeShift.workplaceDetail || selectedWorkplace}
            </p>
          </div>
        </div>
        <div className="detail-header-actions">
          {isEditing ? (
            <>
              <button
                type="button"
                className="detail-cancel-button"
                onClick={onCancelEdit}
              >
                취소
              </button>
              <button
                type="button"
                className="detail-save-button"
                onClick={onSaveShift}
              >
                저장
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="detail-edit-button"
                onClick={onStartEdit}
              >
                정보 수정
              </button>
              <button
                type="button"
                className="detail-delete-button"
                onClick={onDeleteShift}
              >
                삭제
              </button>
            </>
          )}
          <button
            type="button"
            className="detail-close-button"
            onClick={onClose}
          >
            닫기
          </button>
        </div>
      </div>
      <div className="detail-grid">
        <div>
          <p className="detail-label">근무 날짜</p>
          <p className="detail-value">{formattedSelectedDate}</p>
        </div>
        <div>
          <p className="detail-label">근무 시간</p>
          {isEditing ? (
            <div className="time-wheel-wrapper">
              <EmployerTimeInput
                label="시작"
                value={editedShift?.start || "00:00"}
                onChange={(val) => onTimeChange("start", val)}
              />
              <EmployerTimeInput
                label="종료"
                value={editedShift?.end || "00:00"}
                onChange={(val) => onTimeChange("end", val)}
                allowMidnight
              />
            </div>
          ) : (
            <p className="detail-value">{getWorkTimeText()}</p>
          )}
        </div>
        <div>
          <p className="detail-label">총 근무</p>
          <p className="detail-value">{getTotalDuration()}</p>
        </div>
        <div>
          <p className="detail-label">휴게 시간</p>
          {isEditing ? (
            <input
              type="number"
              min="0"
              className="detail-input"
              value={editedShift?.breakMinutes ?? ""}
              onChange={(e) =>
                onUpdateEditedShift("breakMinutes", Number(e.target.value))
              }
            />
          ) : (
            <p className="detail-value">
              {formatBreakTime(shiftForDisplay?.breakMinutes)}
            </p>
          )}
        </div>
        <div>
          <p className="detail-label">시급</p>
          {isEditing ? (
            <input
              type="number"
              min="0"
              className="detail-input"
              value={editedShift?.hourlyWage ?? ""}
              onChange={(e) =>
                onUpdateEditedShift("hourlyWage", Number(e.target.value))
              }
            />
          ) : (
            <p className="detail-value">
              {formatKRW(shiftForDisplay?.hourlyWage)}
            </p>
          )}
        </div>
      </div>
      <div className="detail-section">
        <p className="detail-label">수당 정보</p>
        <ul className="allowance-list">
          {extraPayTypes.map(({ key, label }) => {
            const allowance = (isEditing ? editedShift : activeShift)
              ?.allowances?.[key] || {
              enabled: false,
              rate: 0,
            };
            return (
              <li
                key={key}
                className={`allowance-item ${allowance.enabled ? "on" : "off"}`}
              >
                {isEditing ? (
                  <label className="allowance-toggle">
                    <input
                      type="checkbox"
                      checked={allowance.enabled}
                      onChange={(e) =>
                        onUpdateAllowance(key, {
                          enabled: e.target.checked,
                        })
                      }
                    />
                    <span>{label}</span>
                  </label>
                ) : (
                  <span>{label}</span>
                )}
                {isEditing ? (
                  <input
                    type="number"
                    min="100"
                    max="300"
                    step="5"
                    className="allowance-rate-input"
                    value={allowance.rate}
                    disabled={!allowance.enabled}
                    onChange={(e) =>
                      onUpdateAllowance(key, {
                        rate: Number(e.target.value),
                      })
                    }
                  />
                ) : (
                  <strong>
                    {allowance.enabled ? `${allowance.rate}%` : "없음"}
                  </strong>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default ShiftDetailCard;
