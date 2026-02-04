import { useState, useMemo, useCallback } from "react";
import { timeStringToDecimal } from "../../../utils/formatUtils";
import { cloneShiftWithDefaults } from "../../../utils/employer/shiftUtils";
import type {
  Shift,
  EditedShift,
  UseShiftEditReturn,
} from "../../../types/employer/dailyCalendarPage.types";
import type { AllowanceKey, Allowance } from "../../../types/common/allowance.types";

interface UseShiftEditParams {
  displayShift: Shift | null;
}

/**
 * 근무 편집 모드 훅
 * - 편집 모드 상태 관리
 * - 시간/수당 변경 핸들러
 */
export function useShiftEdit({
  displayShift,
}: UseShiftEditParams): UseShiftEditReturn {
  const [editedShift, setEditedShift] = useState<EditedShift | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // 읽기/편집 모드에 따라 표시할 근무 정보 선택
  const shiftForDisplay = useMemo<Shift | null>(
    () => (isEditing && editedShift ? editedShift : displayShift),
    [isEditing, editedShift, displayShift]
  );

  // 편집 모드 시작
  const handleStartEdit = useCallback(() => {
    if (displayShift) {
      setEditedShift(cloneShiftWithDefaults(displayShift));
      setIsEditing(true);
    }
  }, [displayShift]);

  // 편집 취소
  const handleCancelEdit = useCallback(() => {
    if (displayShift) {
      setEditedShift(cloneShiftWithDefaults(displayShift));
    }
    setIsEditing(false);
  }, [displayShift]);

  // 시간 변경 핸들러
  const handleTimeChange = useCallback((field: "start" | "end", value: string) => {
    const sanitized = value || "00:00";
    setEditedShift((prev) => {
      if (!prev) return prev;
      const next = { ...prev };

      if (field === "start") {
        next.start = sanitized;
      } else {
        next.end = sanitized;
      }

      const startDecimal = timeStringToDecimal(next.start);
      let endDecimal = timeStringToDecimal(next.end);
      if (next.end === "24:00") {
        endDecimal = 24;
      }

      const crossesMidnight = endDecimal < startDecimal;
      const totalDuration = crossesMidnight
        ? 24 - startDecimal + endDecimal
        : endDecimal - startDecimal;

      next.startHour = startDecimal;
      next.durationHours = Math.max(totalDuration, 0);
      next.crossesMidnight = crossesMidnight;
      next.nextDayEndHour = endDecimal === 24 ? 0 : endDecimal;

      return next;
    });
  }, []);

  // 편집 필드 업데이트
  const updateEditedShift = useCallback(
    <K extends keyof EditedShift>(field: K, value: EditedShift[K]) => {
      setEditedShift((prev) => (prev ? { ...prev, [field]: value } : prev));
    },
    []
  );

  // 수당 업데이트
  const updateAllowance = useCallback(
    (type: AllowanceKey, changes: Partial<Allowance>) => {
      setEditedShift((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          allowances: {
            ...prev.allowances,
            [type]: {
              ...prev.allowances?.[type],
              ...changes,
            },
          },
        };
      });
    },
    []
  );

  return {
    editedShift,
    isEditing,
    shiftForDisplay,
    setEditedShift,
    setIsEditing,
    handleStartEdit,
    handleCancelEdit,
    handleTimeChange,
    updateEditedShift,
    updateAllowance,
  };
}
