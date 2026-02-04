// 근무 관련 유틸리티 함수

import { extraPayTypes } from "../../constants/extraPay";
import type { Shift, EditedShift, ScheduleData } from "../../types/employer/dailyCalendarPage.types";
import type { AllowanceMap, AllowanceKey } from "../../types/common/allowance.types";

/**
 * 수당 정보를 편집하기 쉬운 형태로 정규화
 */
export const normalizeAllowances = (allowances: Partial<AllowanceMap> = {}): AllowanceMap => {
  return extraPayTypes.reduce((acc, { key }) => {
    const base = allowances[key as AllowanceKey] || {};
    acc[key as AllowanceKey] = {
      enabled: base.enabled ?? false,
      rate: typeof base.rate === "number" && base.rate > 0 ? base.rate : 150,
    };
    return acc;
  }, {} as AllowanceMap);
};

/**
 * 선택한 근무 정보를 복제하면서 누락된 필드를 기본값으로 채움
 */
export const cloneShiftWithDefaults = (shift: Shift | null): EditedShift | null =>
  shift
    ? {
        ...shift,
        allowances: normalizeAllowances(shift.allowances),
        start: shift.start || "09:00",
        end: shift.end || "18:00",
        crossesMidnight: Boolean(shift.crossesMidnight),
      }
    : null;

/**
 * 근무자 추가 시 새로운 ID 생성
 */
export const generateShiftId = (data: ScheduleData): number | string => {
  let maxId = 0;
  Object.values(data).forEach((workplace) => {
    Object.values(workplace || {}).forEach((shifts) => {
      shifts.forEach((shift) => {
        // shift.id가 "shift-123" 형식일 수 있으므로 숫자 부분 추출
        if (typeof shift.id === "string" && shift.id.startsWith("shift-")) {
          const numPart = parseInt(shift.id.replace("shift-", ""), 10);
          if (!isNaN(numPart)) {
            maxId = Math.max(maxId, numPart);
          }
        } else if (typeof shift.id === "number") {
          maxId = Math.max(maxId, shift.id);
        }
      });
    });
  });
  return maxId + 1 || Date.now();
};
