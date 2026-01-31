import React from "react";
import { FaTimes } from "react-icons/fa";
import EmployerTimeInput from "./EmployerTimeInput";
import type { NewWorkerWorkInfoCardProps } from "../../../types/employer/workerManagePageTypes";

const daysOfWeek = ["일", "월", "화", "수", "목", "금", "토"];

const EmployerNewWorkerWorkInfoCard: React.FC<NewWorkerWorkInfoCardProps> = ({
  confirmedWorker,
  workInfo,
  onWorkInfoChange,
  onCancel,
  onSave,
  selectedWorkplace,
}) => {
  return (
    <div className="info-card">
      <div className="info-card-header">
        <h3 className="info-card-title">근무 정보</h3>
      </div>
      <div className="info-card-content">
        <div className="info-field">
          <label className="info-label">근무지</label>
          <div className="info-value">{selectedWorkplace}</div>
        </div>

        {/* 근무 시간 설정 */}
        <div className="info-field">
          <label className="info-label">근무 시간</label>
          <div className="weekly-schedule-inputs">
            {daysOfWeek.map((day) => {
              const schedule = workInfo.weeklySchedule?.[day];
              return (
                <div key={day} className="day-schedule-row">
                  <span className="day-label-small">{day}요일</span>
                  <div className="time-wheel-wrapper">
                    {schedule ? (
                      <>
                        <EmployerTimeInput
                          value={schedule.start || "00:00"}
                          onChange={(val) => {
                            onWorkInfoChange({
                              ...workInfo,
                              weeklySchedule: {
                                ...workInfo.weeklySchedule,
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
                            onWorkInfoChange({
                              ...workInfo,
                              weeklySchedule: {
                                ...workInfo.weeklySchedule,
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
                          const [endHour = 0, endMin = 0] = (
                            schedule.end || "00:00"
                          )
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
                              ...workInfo.weeklySchedule,
                            };
                            delete updatedSchedule[day];
                            onWorkInfoChange({
                              ...workInfo,
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
                          onWorkInfoChange({
                            ...workInfo,
                            weeklySchedule: {
                              ...workInfo.weeklySchedule,
                              [day]: { start: "09:00", end: "18:00" },
                            },
                          });
                        }}
                      >
                        근무 추가
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 휴게 시간 설정 */}
        <div className="info-field">
          <label className="info-label">휴게 시간</label>
          <div className="break-time-by-day">
            {daysOfWeek.map((day) => {
              const breakTime =
                typeof workInfo.breakTime === "object"
                  ? workInfo.breakTime[day] || 0
                  : workInfo.breakTime || 0;
              const hasSchedule = workInfo.weeklySchedule?.[day];

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
                        onFocus={(e) => {
                          if (breakTime !== 0) {
                            e.currentTarget.select();
                          }
                        }}
                        onBlur={(e) => {
                          if (e.target.value === "") {
                            const newBreakTime =
                              typeof workInfo.breakTime === "object"
                                ? { ...workInfo.breakTime }
                                : daysOfWeek.reduce((acc, d) => {
                                    acc[d] = (workInfo.breakTime as number) || 0;
                                    return acc;
                                  }, {} as { [key: string]: number });
                            newBreakTime[day] = 0;
                            onWorkInfoChange({
                              ...workInfo,
                              breakTime: newBreakTime,
                            });
                          }
                        }}
                        onClick={(e) => {
                          if (breakTime !== 0) {
                            e.currentTarget.select();
                          }
                        }}
                        onChange={(e) => {
                          const newBreakTime =
                            typeof workInfo.breakTime === "object"
                              ? { ...workInfo.breakTime }
                              : daysOfWeek.reduce((acc, d) => {
                                  acc[d] = (workInfo.breakTime as number) || 0;
                                  return acc;
                                }, {} as { [key: string]: number });
                          const inputValue = e.target.value;
                          newBreakTime[day] =
                            inputValue === ""
                              ? 0
                              : parseInt(inputValue, 10) || 0;
                          onWorkInfoChange({
                            ...workInfo,
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
        </div>

        {/* 시급 및 급여 지급일 */}
        <div className="info-field-row">
          <div className="info-field">
            <label className="info-label">시급</label>
            <div className="wage-input-group">
              <input
                type="number"
                className="info-input"
                value={workInfo.hourlyWage ?? ""}
                min="0"
                onChange={(e) =>
                  onWorkInfoChange({
                    ...workInfo,
                    hourlyWage:
                      e.target.value === ""
                        ? 0
                        : parseInt(e.target.value) || 0,
                  })
                }
              />
              <span className="wage-unit">원</span>
            </div>
          </div>

          <div className="info-field">
            <label className="info-label">급여 지급일</label>
            <div className="payday-input-group">
              <span className="payday-text">매월</span>
              <input
                type="number"
                className="payday-input"
                value={workInfo.payday ?? ""}
                min="1"
                max="31"
                onChange={(e) =>
                  onWorkInfoChange({
                    ...workInfo,
                    payday:
                      e.target.value === "" ? 1 : parseInt(e.target.value) || 1,
                  })
                }
              />
              <span>일</span>
            </div>
          </div>
        </div>

        {/* 4대보험 및 소득세 */}
        {/* <div className="toggle-row">
          <div className="toggle-item">
            <label className="toggle-label">4대 보험</label>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={workInfo.socialInsurance || false}
                onChange={(e) =>
                  onWorkInfoChange({
                    ...workInfo,
                    socialInsurance: e.target.checked,
                  })
                }
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
          <div className="toggle-item">
            <label className="toggle-label">소득세</label>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={workInfo.withholdingTax || false}
                onChange={(e) =>
                  onWorkInfoChange({
                    ...workInfo,
                    withholdingTax: e.target.checked,
                  })
                }
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div> */}

        <div className="add-worker-button-container">
          <button type="button" className="cancel-button" onClick={onCancel}>
            취소
          </button>
          <button type="button" className="add-button-large" onClick={onSave}>
            추가
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmployerNewWorkerWorkInfoCard;
