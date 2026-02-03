import type { FC, ChangeEvent, MouseEvent } from "react";
import { FaTimes } from "react-icons/fa";
import EmployerTimeInput from "../DailyCalendarPage/EmployerTimeInput";
import { formatKRW } from "../../../utils/formatUtils";
import type { WorkInfoCardProps } from "../../../types/employer/workerManagePageTypes";

const daysOfWeek = ["일", "월", "화", "수", "목", "금", "토"];

const EmployerWorkInfoCard: FC<WorkInfoCardProps> = ({
  workerData,
  currentWorkInfo,
  isEditingWork,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onUpdateWorkInfo,
}) => {
  if (!workerData) {
    return null;
  }

  return (
    <div className="info-card">
      <div className="info-card-header">
        <h3 className="info-card-title">근무 정보</h3>
        {!isEditingWork ? (
          <button type="button" className="edit-button" onClick={onStartEdit}>
            수정
          </button>
        ) : (
          <div style={{ display: "flex", gap: "8px" }}>
            <button type="button" className="edit-button" onClick={onSaveEdit}>
              저장
            </button>
            <button
              type="button"
              className="cancel-button"
              onClick={onCancelEdit}
            >
              취소
            </button>
          </div>
        )}
      </div>
      <div className="info-card-content">
        <div className="info-field">
          <label className="info-label">근무지</label>
          <div className="info-value">{workerData.workInfo.workplace}</div>
        </div>

        <div className="info-field">
          <label className="info-label">근무 시간</label>
          <div className="weekly-schedule-inputs">
            {daysOfWeek.map((day) => {
                // currentWorkInfo가 있으면 항상 우선 사용
                // 삭제된 요일은 undefined이므로, currentWorkInfo.weeklySchedule이 존재하면 그 안에서 찾고, 없으면 원본 사용
                const schedule =
                currentWorkInfo?.weeklySchedule !== undefined
                    ? currentWorkInfo.weeklySchedule[day]
                    : workerData.workInfo.weeklySchedule[day];
              return (
                <div key={day} className="day-schedule-row">
                  <span className="day-label-small">{day}요일</span>
                  {isEditingWork && currentWorkInfo ? (
                    <div className="time-wheel-wrapper">
                      {schedule ? (
                        <>
                          <EmployerTimeInput
                            value={schedule.start || "00:00"}
                            onChange={(val) => {
                              onUpdateWorkInfo({
                                ...currentWorkInfo,
                                weeklySchedule: {
                                  ...currentWorkInfo.weeklySchedule,
                                  [day]: {
                                    ...schedule,
                                    start: val,
                                  },
                                },
                              });
                            }}
                          />
                          <span className="time-separator">~</span>
                          <EmployerTimeInput
                            value={schedule.end || "00:00"}
                            onChange={(val) => {
                              onUpdateWorkInfo({
                                ...currentWorkInfo,
                                weeklySchedule: {
                                  ...currentWorkInfo.weeklySchedule,
                                  [day]: {
                                    ...schedule,
                                    end: val,
                                  },
                                },
                              });
                            }}
                            allowMidnight
                          />
                          {(() => {
                            const [startHour = 0, startMin = 0] = (
                              schedule.start || "00:00"
                            )
                              .split(":")
                              .map(Number);
                            const [endHour = 0, endMin = 0] = (schedule.end || "00:00")
                              .split(":")
                              .map(Number);
                            const startDecimal = startHour + startMin / 60;
                            const endDecimal = endHour + endMin / 60;
                            const crossesMidnight = endDecimal <= startDecimal;
                            return crossesMidnight ? (
                              <span className="overnight-label">(익일)</span>
                            ) : null;
                          })()}
                          <button
                            type="button"
                            className="remove-schedule-button-x"
                            onClick={() => {
                              const updatedSchedule = {
                                ...currentWorkInfo.weeklySchedule,
                              };
                              delete updatedSchedule[day];
                              onUpdateWorkInfo({
                                ...currentWorkInfo,
                                weeklySchedule: updatedSchedule,
                              });
                            }}
                            title="삭제"
                          >
                            <FaTimes />
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          className="add-schedule-button"
                          onClick={() => {
                            onUpdateWorkInfo({
                              ...currentWorkInfo,
                              weeklySchedule: {
                                ...currentWorkInfo.weeklySchedule,
                                [day]: { start: "09:00", end: "18:00" },
                              },
                            });
                          }}
                        >
                          근무 추가
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="time-display">
                      {schedule ? (
                        <>
                          <span className="time-start">{schedule.start}</span>
                          <span className="time-separator"> - </span>
                          <span className="time-end">
                            {schedule.end}
                            {(() => {
                              const [startHour = 0, startMin = 0] = schedule.start
                                .split(":")
                                .map(Number);
                              const [endHour = 0, endMin = 0] = schedule.end
                                .split(":")
                                .map(Number);
                              const startDecimal = startHour + startMin / 60;
                              const endDecimal = endHour + endMin / 60;
                              const crossesMidnight = endDecimal <= startDecimal;
                              return crossesMidnight ? (
                                <span className="overnight-label"> (익일)</span>
                              ) : null;
                            })()}
                          </span>
                        </>
                      ) : (
                        "휴무"
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="info-field">
          <label className="info-label">휴게 시간</label>
          {isEditingWork && currentWorkInfo ? (
            <div className="break-time-by-day">
              {daysOfWeek.map((day) => {
                const breakTime =
                  typeof currentWorkInfo.breakTime === "object"
                    ? currentWorkInfo.breakTime[day] || 0
                    : currentWorkInfo.breakTime || 0;
                const hasSchedule = currentWorkInfo.weeklySchedule?.[day];

                return (
                  <div key={day} className="break-time-day-row">
                    <span className="day-label-small">{day}요일</span>
                    {hasSchedule ? (
                      <div className="break-time-input-group">
                        <input
                          type="number"
                          className="break-time-input-field"
                          value={breakTime === 0 ? "" : breakTime}
                          min="0"
                          onFocus={(e: ChangeEvent<HTMLInputElement>) => {
                            if (breakTime !== 0) {
                              e.target.select();
                            }
                          }}
                          onBlur={(e: ChangeEvent<HTMLInputElement>) => {
                            if (e.target.value === "") {
                              const baseBreakTime =
                                typeof currentWorkInfo.breakTime === "number"
                                  ? currentWorkInfo.breakTime
                                  : 0;
                              const newBreakTime =
                                typeof currentWorkInfo.breakTime === "object"
                                  ? { ...currentWorkInfo.breakTime }
                                  : daysOfWeek.reduce(
                                      (acc: Record<string, number>, d) => {
                                        acc[d] = baseBreakTime;
                                        return acc;
                                      },
                                      {}
                                    );
                              newBreakTime[day] = 0;
                              onUpdateWorkInfo({
                                ...currentWorkInfo,
                                breakTime: newBreakTime,
                              });
                            }
                          }}
                          onClick={(e: MouseEvent<HTMLInputElement>) => {
                            if (breakTime !== 0) {
                              e.currentTarget.select();
                            }
                          }}
                          onChange={(e: ChangeEvent<HTMLInputElement>) => {
                            const baseBreakTime =
                              typeof currentWorkInfo.breakTime === "number"
                                ? currentWorkInfo.breakTime
                                : 0;
                            const newBreakTime =
                              typeof currentWorkInfo.breakTime === "object"
                                ? { ...currentWorkInfo.breakTime }
                                : daysOfWeek.reduce(
                                    (acc: Record<string, number>, d) => {
                                      acc[d] = baseBreakTime;
                                      return acc;
                                    },
                                    {}
                                  );
                            const inputValue = e.target.value;
                            newBreakTime[day] =
                              inputValue === "" ? 0 : parseInt(inputValue, 10) || 0;
                            onUpdateWorkInfo({
                              ...currentWorkInfo,
                              breakTime: newBreakTime,
                            });
                          }}
                        />
                        <span className="break-time-unit">분</span>
                      </div>
                    ) : (
                      <span className="break-time-off">-</span>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="break-time-display">
              {(() => {
                const breakTime =
                  currentWorkInfo?.breakTime ?? workerData.workInfo.breakTime;
                if (typeof breakTime === "object") {
                  const scheduleToUse =
                    currentWorkInfo?.weeklySchedule ??
                    workerData.workInfo.weeklySchedule;
                  const breakTimeValues = daysOfWeek
                    .filter((day) => scheduleToUse[day])
                    .map((day) => breakTime[day] || 0);
                  const uniqueValues = [...new Set(breakTimeValues)];
                  const firstValue = uniqueValues[0] ?? 0;
                  if (uniqueValues.length === 1 && firstValue > 0) {
                    return (
                      <div className="info-value">
                        {firstValue} 분 (요일별 동일)
                      </div>
                    );
                  }
                  return (
                    <div className="break-time-by-day-display">
                      {daysOfWeek.map((day) => {
                        const value = breakTime[day] || 0;
                        const hasSchedule =
                          currentWorkInfo?.weeklySchedule?.[day] ??
                          workerData.workInfo.weeklySchedule[day];
                        if (!hasSchedule) return null;
                        return (
                          <div
                            key={day}
                            className="break-time-day-display-item"
                          >
                            <span className="day-label-small">{day}요일</span>
                            <span className="break-time-value">{value} 분</span>
                          </div>
                        );
                      })}
                    </div>
                  );
                }
                return <div className="info-value">{breakTime} 분</div>;
              })()}
            </div>
          )}
        </div>

        <div className="info-field-row">
          <div className="info-field">
            <label className="info-label">시급</label>
            {isEditingWork && currentWorkInfo ? (
              <div className="wage-input-group">
                <input
                  type="number"
                  className="info-input"
                  value={currentWorkInfo.hourlyWage || 0}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    onUpdateWorkInfo({
                      ...currentWorkInfo,
                      hourlyWage: parseInt(e.target.value) || 0,
                    })
                  }
                />
                <span className="wage-unit">원</span>
              </div>
            ) : (
              <div className="info-value">
                {formatKRW(
                  currentWorkInfo?.hourlyWage ?? workerData.workInfo.hourlyWage
                )}
              </div>
            )}
          </div>

          <div className="info-field">
            <label className="info-label">급여 지급일</label>
            {isEditingWork && currentWorkInfo ? (
              <div className="payday-input-group">
                <span className="payday-text">매월</span>
                <input
                  type="number"
                  className="payday-input"
                  value={currentWorkInfo.payday || 1}
                  min="1"
                  max="31"
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    onUpdateWorkInfo({
                      ...currentWorkInfo,
                      payday: parseInt(e.target.value) || 1,
                    })
                  }
                />
                <span>일</span>
              </div>
            ) : (
              <div className="info-value">
                매월 {currentWorkInfo?.payday ?? workerData.workInfo.payday} 일
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployerWorkInfoCard;
