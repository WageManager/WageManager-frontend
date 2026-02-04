// employer 전용 포맷 유틸리티 함수
// ※ formatKRW, formatBreakTime, timeStringToDecimal → src/utils/formatUtils.ts로 이동

/**
 * 근무 시간 포맷 (소수점 시간을 "X시간 Y분" 형식으로)
 */
export const formatDuration = (hours: number | undefined | null): string => {
  if (typeof hours !== "number") return "-";
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);
  if (minutes === 0) {
    return `${wholeHours}시간`;
  }
  if (minutes === 60) {
    return `${wholeHours + 1}시간`;
  }
  return `${wholeHours}시간 ${minutes}분`;
};
