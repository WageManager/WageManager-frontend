import PropTypes from "prop-types";
import { FaTimes } from "react-icons/fa";
import TimeInput from "./TimeInput";
import { formatCurrency } from "../utils/formatUtils";

const daysOfWeek = ["일", "월", "화", "수", "목", "금", "토"];

export default function WorkInfoCard({
  workerData,
  currentWorkInfo,
  isEditingWork,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onUpdateWorkInfo,
}) {
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
              const schedule =
                currentWorkInfo?.weeklySchedule?.[day] ??
                workerData.workInfo.weeklySchedule[day];
              return (
                <div key={day} className="day-schedule-row">
                  <span className="day-label-small">{day}요일</span>
                  {isEditingWork && currentWorkInfo ? (
                    <div className="time-wheel-wrapper">
                      {schedule ? (
                        <>
                          <TimeInput
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
                          <TimeInput
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
                            const [startHour, startMin] = (
                              schedule.start || "00:00"
                            )
                              .split(":")
                              .map(Number);
                            const [endHour, endMin] = (schedule.end || "00:00")
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
                          {`${schedule.start} - ${schedule.end}`}
                          {(() => {
                            const [startHour, startMin] = schedule.start
                              .split(":")
                              .map(Number);
                            const [endHour, endMin] = schedule.end
                              .split(":")
                              .map(Number);
                            const startDecimal = startHour + startMin / 60;
                            const endDecimal = endHour + endMin / 60;
                            const crossesMidnight = endDecimal <= startDecimal;
                            return crossesMidnight ? (
                              <span className="overnight-label"> (익일)</span>
                            ) : null;
                          })()}
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
                          onFocus={(e) => {
                            if (breakTime !== 0) {
                              e.target.select();
                            }
                          }}
                          onBlur={(e) => {
                            if (e.target.value === "") {
                              const newBreakTime =
                                typeof currentWorkInfo.breakTime === "object"
                                  ? { ...currentWorkInfo.breakTime }
                                  : daysOfWeek.reduce((acc, d) => {
                                      acc[d] = currentWorkInfo.breakTime || 0;
                                      return acc;
                                    }, {});
                              newBreakTime[day] = 0;
                              onUpdateWorkInfo({
                                ...currentWorkInfo,
                                breakTime: newBreakTime,
                              });
                            }
                          }}
                          onClick={(e) => {
                            if (breakTime !== 0) {
                              e.target.select();
                            }
                          }}
                          onChange={(e) => {
                            const newBreakTime =
                              typeof currentWorkInfo.breakTime === "object"
                                ? { ...currentWorkInfo.breakTime }
                                : daysOfWeek.reduce((acc, d) => {
                                    acc[d] = currentWorkInfo.breakTime || 0;
                                    return acc;
                                  }, {});
                            const inputValue = e.target.value;
                            newBreakTime[day] =
                              inputValue === ""
                                ? 0
                                : parseInt(inputValue, 10) || 0;
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
                // currentWorkInfo가 있으면 항상 우선 사용
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
                  if (uniqueValues.length === 1 && uniqueValues[0] > 0) {
                    return (
                      <div className="info-value">
                        {uniqueValues[0]} 분 (요일별 동일)
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
                  onChange={(e) =>
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
                {formatCurrency(
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
                  onChange={(e) =>
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

        {/* <div className="toggle-row">
          <div className="toggle-item">
            <label className="toggle-label">4대 보험</label>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={
                  currentWorkInfo?.socialInsurance ??
                  workerData.workInfo.socialInsurance
                }
                disabled={!isEditingWork}
                onChange={(e) =>
                  onUpdateWorkInfo({
                    ...currentWorkInfo,
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
                checked={
                  currentWorkInfo?.withholdingTax ??
                  workerData.workInfo.withholdingTax
                }
                disabled={!isEditingWork}
                onChange={(e) =>
                  onUpdateWorkInfo({
                    ...currentWorkInfo,
                    withholdingTax: e.target.checked,
                  })
                }
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div> */}
      </div>
    </div>
  );
}

WorkInfoCard.propTypes = {
  workerData: PropTypes.shape({
    workInfo: PropTypes.shape({
      workplace: PropTypes.string.isRequired,
      weeklySchedule: PropTypes.object.isRequired,
      breakTime: PropTypes.oneOfType([PropTypes.number, PropTypes.object])
        .isRequired,
      hourlyWage: PropTypes.number.isRequired,
      payday: PropTypes.number.isRequired,
      socialInsurance: PropTypes.bool.isRequired,
      withholdingTax: PropTypes.bool.isRequired,
    }).isRequired,
  }).isRequired,
  currentWorkInfo: PropTypes.object,
  isEditingWork: PropTypes.bool.isRequired,
  onStartEdit: PropTypes.func.isRequired,
  onSaveEdit: PropTypes.func.isRequired,
  onCancelEdit: PropTypes.func.isRequired,
  onUpdateWorkInfo: PropTypes.func.isRequired,
};
