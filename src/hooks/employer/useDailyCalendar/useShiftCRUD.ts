import { useCallback } from "react";
import Swal from "sweetalert2";
import {
  createWorkRecord,
  updateWorkRecord,
  deleteWorkRecord,
  getContractsByWorkplace,
} from "../../../api/employerApi";
import { getDateKey } from "../../../utils/employer/dateUtils";
import { cloneShiftWithDefaults, generateShiftId } from "../../../utils/employer/shiftUtils";
import { timeStringToDecimal } from "../../../utils/formatUtils";
import type {
  Shift,
  ShiftWithLane,
  EditedShift,
  ScheduleData,
  DateScheduleMap,
  UseShiftCRUDReturn,
} from "../../../types/employer/dailyCalendarPage.types";
import type { ContractWorker } from "../../../api/employerApiResponse.type";

interface UseShiftCRUDParams {
  selectedWorkplaceId: number | null;
  selectedWorkplaceName: string;
  selectedDate: Date;
  dateKey: string;
  activeShiftId: string | null;
  activeShift: ShiftWithLane | undefined;
  displayShift: Shift | null;
  previousDayShift: Shift | null;
  previousDate: Date;
  editedShift: EditedShift | null;
  workplaceSchedules: DateScheduleMap;
  setScheduleData: React.Dispatch<React.SetStateAction<ScheduleData>>;
  setActiveShiftId: React.Dispatch<React.SetStateAction<string | null>>;
  setEditedShift: React.Dispatch<React.SetStateAction<EditedShift | null>>;
  setIsEditing: React.Dispatch<React.SetStateAction<boolean>>;
  setShowWorkerListModal: React.Dispatch<React.SetStateAction<boolean>>;
  setSelectedDate: (date: Date) => void;
}

/**
 * 근무 CRUD 작업 훅
 * - 근무 추가
 * - 근무 수정 (저장)
 * - 근무 삭제
 * - 낙관적 업데이트 패턴 적용
 */
export function useShiftCRUD({
  selectedWorkplaceId,
  selectedWorkplaceName,
  selectedDate,
  dateKey,
  activeShiftId,
  activeShift,
  displayShift,
  previousDayShift,
  previousDate,
  editedShift,
  workplaceSchedules,
  setScheduleData,
  setActiveShiftId,
  setEditedShift,
  setIsEditing,
  setShowWorkerListModal,
  setSelectedDate,
}: UseShiftCRUDParams): UseShiftCRUDReturn {
  // 근무자 추가 핸들러 - 모달 열기
  const handleAddShift = useCallback(() => {
    setShowWorkerListModal(true);
  }, [setShowWorkerListModal]);

  // 직원 선택 후 근무 추가
  const handleSelectWorker = useCallback(
    async (workerName: string) => {
      const dateKeyToAdd = getDateKey(selectedDate);

      const newShift: Shift = {
        id: `temp-${Date.now()}`, // 임시 ID
        name: workerName,
        start: "09:00",
        end: "18:00",
        startHour: 9,
        durationHours: 9,
        workplaceDetail: selectedWorkplaceName,
        breakMinutes: 60,
        hourlyWage: 10030,
        allowances: {
          overtime: { enabled: false, rate: 150 },
          night: { enabled: false, rate: 0 },
          holiday: { enabled: false, rate: 0 },
        },
        socialInsurance: false,
        withholdingTax: false,
        crossesMidnight: false,
      };

      // 먼저 UI 업데이트 (즉시 반응)
      setScheduleData((prev) => {
        const workplace = prev[selectedWorkplaceName] || {};
        const currentList = workplace[dateKeyToAdd] || [];

        return {
          ...prev,
          [selectedWorkplaceName]: {
            ...workplace,
            [dateKeyToAdd]: [...currentList, newShift],
          },
        };
      });

      // 새로 추가한 근무를 선택하고 편집 모드로 진입
      setActiveShiftId(newShift.id);
      setEditedShift(cloneShiftWithDefaults(newShift));
      setIsEditing(true);
      setShowWorkerListModal(false);

      // 백엔드에 근무 기록 생성 (비동기)
      try {
        // 먼저 근로자의 contractId 조회
        if (!selectedWorkplaceId) return;

        const contractsResponse = await getContractsByWorkplace(selectedWorkplaceId);
        const contracts: ContractWorker[] = contractsResponse.data || [];
        const contract = contracts.find((c) => c.workerName === workerName);
        const contractId = contract?.id;

        if (!contractId) {
          return;
        }

        const workRecordData = {
          contractId: contractId,
          workDate: selectedDate.toISOString().split("T")[0] as string,
          startTime: "09:00",
          endTime: "18:00",
          breakMinutes: 60,
          memo: "",
        };

        const response = await createWorkRecord(workRecordData);
        const createdRecord = response.data;

        // 백엔드에서 받은 ID로 업데이트
        setScheduleData((prev) => {
          const workplace = prev[selectedWorkplaceName] || {};
          const currentList = workplace[dateKeyToAdd] || [];

          return {
            ...prev,
            [selectedWorkplaceName]: {
              ...workplace,
              [dateKeyToAdd]: currentList.map((shift) =>
                shift.id === newShift.id
                  ? {
                      ...shift,
                      id: `shift-${createdRecord.id}`,
                      workRecordId: createdRecord.id,
                    }
                  : shift
              ),
            },
          };
        });

        // activeShiftId도 업데이트
        setActiveShiftId(`shift-${createdRecord.id}`);
      } catch {
        // 실패 시 임시 데이터 유지 (사용자는 계속 편집 가능)
      }
    },
    [
      selectedDate,
      selectedWorkplaceName,
      selectedWorkplaceId,
      setScheduleData,
      setActiveShiftId,
      setEditedShift,
      setIsEditing,
      setShowWorkerListModal,
    ]
  );

  // 근무 저장
  const handleSaveShift = useCallback(async () => {
    if (!editedShift || !activeShiftId) return;

    // 익일 근무를 클릭한 경우 전날 근무의 ID와 날짜 사용
    const shiftToUpdate = displayShift;
    const actualShiftId = shiftToUpdate?.id || activeShiftId;
    const actualDate = previousDayShift ? previousDate : selectedDate;
    const dateKeyToUpdate = getDateKey(actualDate);

    const { laneIndex: _unusedLaneIndex, ...shiftToSave } = editedShift;
    const startDecimal = timeStringToDecimal(shiftToSave.start);
    const endDecimalRaw =
      shiftToSave.end === "24:00" ? 24 : timeStringToDecimal(shiftToSave.end);
    const crossesMidnight =
      shiftToSave.crossesMidnight || endDecimalRaw < startDecimal;

    // 먼저 UI 업데이트 (즉시 반응)
    setScheduleData((prev) => {
      const workplace = prev[selectedWorkplaceName] || {};
      const currentList = workplace[dateKeyToUpdate] || [];
      let updatedList = currentList.map((shift) =>
        shift.id === actualShiftId ? { ...shift, ...shiftToSave } : shift
      );

      if (crossesMidnight) {
        const firstPartDuration = 24 - startDecimal;
        const secondPartDuration = endDecimalRaw === 24 ? 0 : endDecimalRaw;

        updatedList = updatedList.map((shift) => {
          if (shift.id !== actualShiftId) return shift;
          return {
            ...shift,
            ...shiftToSave,
            end: "24:00",
            durationHours: firstPartDuration,
            crossesMidnight: true,
            nextDayEndHour: undefined,
          };
        });

        const nextDate = new Date(actualDate);
        nextDate.setDate(nextDate.getDate() + 1);
        const nextKey = getDateKey(nextDate);
        const nextList = workplace[nextKey] ? [...workplace[nextKey]] : [];

        // 익일 근무가 이미 존재하는 경우 (익일 근무를 클릭한 경우)
        const existingNextDayShift = nextList.find(
          (shift) => shift.name === shiftToSave.name && shift.start === "00:00"
        );

        if (secondPartDuration > 0) {
          if (existingNextDayShift) {
            // 기존 익일 근무 업데이트
            const updatedNextList = nextList.map((shift) =>
              shift.id === existingNextDayShift.id
                ? {
                    ...shiftToSave,
                    id: shift.id,
                    start: "00:00",
                    end: shiftToSave.end,
                    startHour: 0,
                    durationHours: secondPartDuration,
                    crossesMidnight: false,
                    nextDayEndHour: undefined,
                  }
                : shift
            );
            return {
              ...prev,
              [selectedWorkplaceName]: {
                ...workplace,
                [dateKeyToUpdate]: updatedList,
                [nextKey]: updatedNextList,
              },
            };
          } else {
            // 새 익일 근무 생성
            const newShiftId = generateShiftId(prev);
            nextList.push({
              ...shiftToSave,
              id: `shift-${newShiftId}`,
              start: "00:00",
              end: shiftToSave.end,
              startHour: 0,
              durationHours: secondPartDuration,
              crossesMidnight: false,
              nextDayEndHour: undefined,
            });
          }
        }

        return {
          ...prev,
          [selectedWorkplaceName]: {
            ...workplace,
            [dateKeyToUpdate]: updatedList,
            [nextKey]: nextList,
          },
        };
      }

      const normalizedList = updatedList.map((shift) =>
        shift.id === actualShiftId
          ? {
              ...shift,
              crossesMidnight: false,
              nextDayEndHour: undefined,
            }
          : shift
      );

      return {
        ...prev,
        [selectedWorkplaceName]: {
          ...workplace,
          [dateKeyToUpdate]: normalizedList,
        },
      };
    });

    setIsEditing(false);

    // 저장 후 상태 업데이트
    if (crossesMidnight) {
      // 익일 근무가 생성/업데이트되었으므로 전날 근무의 ID로 변경
      setSelectedDate(actualDate);
      setActiveShiftId(actualShiftId);
    } else if (previousDayShift) {
      // 익일 근무를 클릭한 경우 전날 근무의 ID로 변경
      setSelectedDate(previousDate);
      setActiveShiftId(previousDayShift.id);
    }

    // 백엔드에 업데이트 요청
    if (shiftToUpdate?.workRecordId) {
      try {
        const updateData = {
          startTime: shiftToSave.start,
          endTime: crossesMidnight ? "24:00" : shiftToSave.end,
          breakMinutes: shiftToSave.breakMinutes || 0,
          memo: "",
        };

        await updateWorkRecord(shiftToUpdate.workRecordId, updateData);
      } catch {
        // 실패 시에도 UI는 이미 업데이트된 상태 유지 (낙관적 업데이트)
      }
    }
  }, [
    editedShift,
    activeShiftId,
    displayShift,
    previousDayShift,
    previousDate,
    selectedDate,
    selectedWorkplaceName,
    setScheduleData,
    setIsEditing,
    setSelectedDate,
    setActiveShiftId,
  ]);

  // 근무자 삭제 핸들러
  const handleDeleteShift = useCallback(() => {
    if (!activeShiftId || !activeShift) return;

    // 삭제 확인
    Swal.fire({
      icon: "question",
      title: `${activeShift.name} 근무자를 삭제하시겠습니까?`,
      showCancelButton: true,
      confirmButtonText: "삭제",
      cancelButtonText: "취소",
      confirmButtonColor: "var(--color-red)",
    }).then(async (result) => {
      // 확인 버튼을 눌렀을 때만 삭제 진행
      if (result.isConfirmed) {
        const dateKeyToDelete = getDateKey(selectedDate);

        // 먼저 UI 업데이트 (즉시 반응)
        setScheduleData((prev) => {
          const workplace = prev[selectedWorkplaceName] || {};
          const currentList = workplace[dateKeyToDelete] || [];

          // 당일 근무 삭제
          let updatedList = currentList.filter(
            (shift) => shift.id !== activeShiftId
          );

          // 익일로 넘어가는 근무인 경우 익일 근무도 삭제
          if (activeShift.crossesMidnight) {
            const nextDate = new Date(selectedDate);
            nextDate.setDate(nextDate.getDate() + 1);
            const nextKey = getDateKey(nextDate);
            const nextList = workplace[nextKey] || [];

            // 익일 근무 찾아서 삭제
            const nextDayShift = nextList.find(
              (shift) =>
                shift.name === activeShift.name && shift.start === "00:00"
            );

            if (nextDayShift) {
              const updatedNextList = nextList.filter(
                (shift) => shift.id !== nextDayShift.id
              );
              return {
                ...prev,
                [selectedWorkplaceName]: {
                  ...workplace,
                  [dateKeyToDelete]: updatedList,
                  [nextKey]: updatedNextList,
                },
              };
            }
          }

          return {
            ...prev,
            [selectedWorkplaceName]: {
              ...workplace,
              [dateKeyToDelete]: updatedList,
            },
          };
        });

        // 삭제 후 패널 닫기
        setActiveShiftId(null);
        setIsEditing(false);
        setEditedShift(null);

        // 백엔드에 삭제 요청
        if (activeShift.workRecordId) {
          try {
            await deleteWorkRecord(activeShift.workRecordId);
            Swal.fire(
              "삭제 완료",
              `${activeShift.name} 근무자가 삭제되었습니다.`,
              "success"
            );
          } catch {
            Swal.fire(
              "삭제 실패",
              "근무 기록 삭제 중 오류가 발생했습니다.",
              "error"
            );
            // 실패 시에도 UI는 이미 업데이트된 상태 유지 (낙관적 업데이트)
          }
        } else {
          // workRecordId가 없는 경우 (임시 데이터)
          Swal.fire(
            "삭제 완료",
            `${activeShift.name} 근무자가 삭제되었습니다.`,
            "success"
          );
        }
      }
    });
  }, [
    activeShiftId,
    activeShift,
    selectedDate,
    selectedWorkplaceName,
    setScheduleData,
    setActiveShiftId,
    setIsEditing,
    setEditedShift,
  ]);

  return {
    handleAddShift,
    handleSelectWorker,
    handleSaveShift,
    handleDeleteShift,
  };
}
