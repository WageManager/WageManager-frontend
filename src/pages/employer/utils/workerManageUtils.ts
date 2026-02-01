/**
 * 고용주 페이지 유틸리티 함수
 * 데이터 변환, 스케줄 생성 등 비즈니스 로직
 */

import type {
  WeeklySchedule,
  WeeklyScheduleGrid,
  WorkerWorkInfo,
} from "../../../types/employer/workerManagePageTypes";

/**
 * 백엔드 workSchedules JSON을 한글 요일 기반 WeeklySchedule으로 변환
 */
export const parseWorkSchedules = (
  rawSchedules: unknown
): WeeklySchedule => {
  const weeklySchedule: WeeklySchedule = {};

  try {
    const schedules =
      typeof rawSchedules === "string"
        ? (JSON.parse(rawSchedules) as Array<{
            dayOfWeek: number;
            startTime: string;
            endTime: string;
          }>)
        : (rawSchedules as Array<{
            dayOfWeek: number;
            startTime: string;
            endTime: string;
          }>);

    // dayOfWeek(1-7, 1=월요일, 7=일요일) -> 한글 요일로 변환
    const dayMapping: Record<number, string> = {
      1: "월",
      2: "화",
      3: "수",
      4: "목",
      5: "금",
      6: "토",
      7: "일",
    };

    if (Array.isArray(schedules)) {
      schedules.forEach((schedule) => {
        const dayName = dayMapping[schedule.dayOfWeek];
        if (dayName) {
          weeklySchedule[dayName] = {
            start: schedule.startTime,
            end: schedule.endTime,
          };
        }
      });
    }
  } catch (error) {
    // workSchedules 파싱 실패 시 빈 객체 반환
  }

  return weeklySchedule;
};

/**
 * payrollDeductionType에서 보험/세금 정보 추출
 */
export const parsePayrollDeduction = (
  deductionType: string | undefined
): { socialInsurance: boolean; withholdingTax: boolean } => {
  const type = deductionType || "PART_TIME_NONE";
  return {
    socialInsurance: type.includes("INSURANCE"),
    withholdingTax: type.includes("TAX"),
  };
};

/**
 * 시간 문자열 "HH:MM"을 시간(decimal) 숫자로 변환
 * 예: "14:30" -> 14.5, "09:15" -> 9.25
 */
export const timeStringToDecimal = (timeString: string): number => {
  if (!timeString) return 0;
  const [hourStr, minStr] = timeString.split(":");
  const hour = parseInt(hourStr || "0", 10) || 0;
  const min = parseInt(minStr || "0", 10) || 0;
  return hour + min / 60;
};

/**
 * 시간 문자열 "HH:MM"을 시간과 분으로 파싱
 */
export const parseTimeString = (
  timeString: string
): { hour: number; min: number } => {
  if (!timeString) return { hour: 0, min: 0 };
  const [hourStr, minStr] = timeString.split(":");
  return {
    hour: parseInt(hourStr || "0", 10) || 0,
    min: parseInt(minStr || "0", 10) || 0,
  };
};

/**
 * 주간 스케줄 그리드 생성
 */
export const buildWeeklyScheduleGrid = (
  workInfo: WorkerWorkInfo | null | undefined
): WeeklyScheduleGrid => {
  const daysOfWeek = ["일", "월", "화", "수", "목", "금", "토"];

  if (!workInfo?.weeklySchedule) {
    return {} as WeeklyScheduleGrid;
  }

  const grid: WeeklyScheduleGrid = {};

  // 각 요일의 스케줄 처리
  Object.entries(workInfo.weeklySchedule).forEach(([day, schedule]) => {
    if (!schedule || typeof schedule !== 'object' || !('start' in schedule) || !('end' in schedule)) return;
    
    const start = (schedule as any).start;
    const end = (schedule as any).end;
    
    if (!start || !end) return;

    // 시간을 decimal로 변환
    const startDecimal = timeStringToDecimal(start);
    const endDecimalRaw = end === "24:00" ? 24 : timeStringToDecimal(end);

    // 익일로 넘어가는 근무 여부 판단
    const crossesMidnight = endDecimalRaw < startDecimal;

    if (crossesMidnight) {
      // 익일 근무: 당일과 익일에 나눠서 표시
      const { hour: startHour, min: startMin } = parseTimeString(start);
      const endDecimal = 24;
      const endHour = 24;
      const endMin = 0;

      const groupId = `${day}-0`;
      const dayBlocks = grid[day] ?? (grid[day] = []);
      dayBlocks.push({
        start: startDecimal,
        end: endDecimal,
        startTime: start,
        endTime: "24:00",
        startHour,
        startMin,
        endHour,
        endMin,
        groupId,
        crossesMidnight: true,
        isFirstPart: true,
      });

      // 익일 블록
      const nextDayIndex = daysOfWeek.indexOf(day) + 1;
      const nextDay = nextDayIndex < daysOfWeek.length ? daysOfWeek[nextDayIndex] : null;

      if (nextDay) {
        const { hour: endHour2, min: endMin2 } = parseTimeString(end);
        const nextDayGroupId = `${day}-0`;
        const nextDayBlocks = grid[nextDay] ?? (grid[nextDay] = []);
        nextDayBlocks.push({
          start: 0,
          end: endDecimalRaw,
          startTime: "00:00",
          endTime: end,
          startHour: 0,
          startMin: 0,
          endHour: endHour2,
          endMin: endMin2,
          groupId: nextDayGroupId,
          crossesMidnight: true,
          isSecondPart: true,
          originalDay: day,
        });
      }
    } else {
      // 일반 근무인 경우
      const { hour: startHour, min: startMin } = parseTimeString(start);
      const { hour: endHour, min: endMin } = parseTimeString(end);

      const groupId = `${day}-0`;
      const dayBlocks = grid[day] ?? (grid[day] = []);
      dayBlocks.push({
        start: startDecimal,
        end: endDecimalRaw,
        startTime: start,
        endTime: end,
        startHour,
        startMin,
        endHour,
        endMin,
        groupId,
        crossesMidnight: false,
      });
    }
  });

  return grid;
};
