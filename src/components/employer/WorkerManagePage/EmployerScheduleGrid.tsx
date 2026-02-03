import type { FC } from "react";
import type { ScheduleGridProps } from "../../../types/employer/workerManagePageTypes";

const daysOfWeek = ["일", "월", "화", "수", "목", "금", "토"];
const hours = Array.from({ length: 24 }, (_, i) => i);

/**
 * EmployerScheduleGrid
 * 근로자 주간 스케줄 시각화 그리드 컴포넌트
 * - 24시간 x 7일 그리드 표시
 * - 근무 시간 블록 렌더링
 * - 마우스 호버 시 상세 정보 툴팁 표시
 * - 익일 근무 지원
 */
const EmployerScheduleGrid: FC<ScheduleGridProps> = ({
  weeklyScheduleGrid,
  hoveredBlockGroup,
  onHoverBlock,
  currentWorkInfo,
  workerData,
  isAddingWorker = false,
  newWorkerWorkInfo = null,
}) => {
  const handleHoverBlock = (blockGroupId: string | null): void => {
    onHoverBlock(blockGroupId, null);
  };

  return (
    <div className="worker-manage-right-panel">
      <div className="schedule-grid-container">
        <div className="schedule-grid-header">
          <div className="schedule-time-column"></div>
          {daysOfWeek.map((day) => (
            <div key={day} className="schedule-day-header">
              {day}
            </div>
          ))}
        </div>
        <div className="schedule-grid-body">
          <div className="schedule-time-column">
            {hours.map((hour) => (
              <div key={hour} className="schedule-hour-cell">
                {hour}
              </div>
            ))}
          </div>
          {daysOfWeek.map((day) => {
            const blocks = (weeklyScheduleGrid[day] as any[]) || [];

            // hover된 블록 찾기
            const hoveredBlock = blocks.find(
              (block) => hoveredBlockGroup === block.groupId
            );

            // 툴팁 표시 여부 결정
            let shouldShowTooltip = false;
            let tooltipBlock: any = null;

            if (hoveredBlock) {
              if ((hoveredBlock as any).isSecondPart && (hoveredBlock as any).originalDay) {
                if (day === (hoveredBlock as any).originalDay) {
                  const originalDayBlocks = (weeklyScheduleGrid[(hoveredBlock as any).originalDay] as any[]) || [];
                  tooltipBlock = originalDayBlocks.find((b) => (b as any).isFirstPart);
                  shouldShowTooltip = tooltipBlock !== undefined;
                }
              } else {
                tooltipBlock = hoveredBlock;
                shouldShowTooltip = true;
              }
            }

            // 시작 시간대 찾기 (툴팁 위치 계산용)
            const startHour = tooltipBlock ? tooltipBlock.startHour : null;
            const startMin = tooltipBlock ? tooltipBlock.startMin : 0;
            const startBlockTop =
              startHour !== null ? startHour * 40 + startHour * 1 + (startMin / 60) * 40 : 0;

            // 익일 근무인 경우 전체 시간 표시
            let displayStartTime = (tooltipBlock as any)?.startTime || "";
            let displayEndTime = (tooltipBlock as any)?.endTime || "";
            if ((tooltipBlock as any)?.crossesMidnight && (tooltipBlock as any)?.isFirstPart) {
              const nextDayIndex = (daysOfWeek.indexOf(day) + 1) % 7;
              const nextDay = daysOfWeek[nextDayIndex];
              const nextDayBlocks = nextDay
                ? ((weeklyScheduleGrid[nextDay] as any[]) || [])
                : [];
              const secondPart = nextDayBlocks.find(
                (b) => b.groupId === (tooltipBlock as any).groupId && (b as any).isSecondPart
              );
              if (secondPart) {
                displayEndTime = (secondPart as any).endTime;
              }
            } else if ((tooltipBlock as any)?.isSecondPart && (tooltipBlock as any)?.originalDay) {
              const originalDayBlocks = (weeklyScheduleGrid[(tooltipBlock as any).originalDay] as any[]) || [];
              const firstPart = originalDayBlocks.find((b) => (b as any).isFirstPart);
              if (firstPart) {
                displayStartTime = (firstPart as any).startTime;
              }
            }

            return (
              <div key={day} className="schedule-day-column">
                {shouldShowTooltip && tooltipBlock && startHour !== null && (
                  <div
                    className="schedule-block-tooltip"
                    style={{
                      top: `${startBlockTop}px`,
                    }}
                  >
                    <div className="tooltip-content">
                      <div className="tooltip-label">근무 시간</div>
                      <div className="tooltip-time">
                        {displayStartTime} - {displayEndTime}
                        {(tooltipBlock as any)?.crossesMidnight && " (익일)"}
                      </div>
                      <div className="tooltip-label">휴게 시간</div>
                      <div className="tooltip-break">
                        {(() => {
                          // 우선순위: newWorkerWorkInfo > currentWorkInfo > workerData
                          const rawBreakSource =
                            isAddingWorker && newWorkerWorkInfo
                              ? (newWorkerWorkInfo as any).breakTime
                              : currentWorkInfo?.breakTime ??
                                workerData?.workInfo?.breakTime ??
                                0;
                          if (typeof rawBreakSource === "object") {
                            // 익일 근무인 경우 원래 요일의 휴게 시간 사용
                            const dayToUse = (tooltipBlock as any)?.originalDay || day;
                            return (rawBreakSource as Record<string, number>)[dayToUse] || 0;
                          }
                          return rawBreakSource;
                        })()}{" "}
                        분
                      </div>
                    </div>
                  </div>
                )}

                {hours.map((hour) => {
                  const hourBlocks = blocks.filter((block) => {
                    const blockStartHour = Math.floor(block.start);
                    const blockEndHour = Math.ceil(block.end);
                    return hour >= blockStartHour && hour < blockEndHour;
                  });

                  return (
                    <div key={hour} className="schedule-cell">
                      {hourBlocks.map((block, blockIndex) => {
                        const isBlockStart = block.startHour === hour;
                        const isBlockEnd = block.endHour === hour;

                        let blockTop = 0;
                        let blockHeight = 100;

                        if (isBlockStart) {
                          blockTop = (block.startMin / 60) * 100;
                        }
                        if (isBlockEnd) {
                          blockHeight = (block.endMin / 60) * 100;
                        } else if (isBlockStart) {
                          blockHeight = 100 - blockTop;
                        }

                        const isHovered = hoveredBlockGroup === block.groupId;

                        return (
                          <div
                            key={`${block.groupId}-${blockIndex}`}
                            className={`schedule-block ${isHovered ? "hovered" : ""}`}
                            style={{
                              top: `${blockTop}%`,
                              height: `${blockHeight}%`,
                            }}
                            onMouseEnter={() => handleHoverBlock(block.groupId)}
                            onMouseLeave={() => handleHoverBlock(null)}
                          />
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default EmployerScheduleGrid;
