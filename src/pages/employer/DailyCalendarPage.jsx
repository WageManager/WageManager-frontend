import { useMemo, useState, useEffect } from "react";
import "../../styles/dailyCalendarPage.css";
import {
  getWorkplaces,
  getWorkRecords,
  createWorkRecord,
  updateWorkRecord,
  deleteWorkRecord,
  getContractsByWorkplace,
} from "../../api/employerApi";
import { getDateKey, isSameDate, buildCalendarCells } from "./utils/dateUtils";
import {
  cloneShiftWithDefaults,
  generateShiftId,
} from "./utils/shiftUtils";
import { extraPayTypes } from "../../constants/extraPay";
import { formatKRW, formatBreakTime, timeStringToDecimal } from "../../utils/formatUtils";
import { formatDuration } from "./utils/formatUtils";
import { hours } from "./constants";
import EmployerTimeInput from "./components/EmployerTimeInput";
import Swal from "sweetalert2";

export default function DailyCalendarPage() {
  const today = new Date();
  // 화면 전반에서 사용하는 상태들
  const [selectedDate, setSelectedDate] = useState(today);
  const [displayMonth, setDisplayMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );

  // 근무지 리스트 (백엔드에서 받아옴)
  const [workplaces, setWorkplaces] = useState([]);
  const [selectedWorkplaceId, setSelectedWorkplaceId] = useState(null);

  // 근무지 목록 조회
  useEffect(() => {
    const fetchWorkplaces = async () => {
      try {
        const response = await getWorkplaces();
        const workplacesData = response.data || [];
        setWorkplaces(workplacesData);
        if (workplacesData.length > 0) {
          setSelectedWorkplaceId(workplacesData[0].id);
        }
      } catch (error) {
        // 에러 시 빈 배열 사용
        setWorkplaces([]);
      }
    };
    fetchWorkplaces();
  }, []);

  // 선택된 근무지 정보
  const selectedWorkplace =
    workplaces.find((wp) => wp.id === selectedWorkplaceId)?.name || "";

  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeShiftId, setActiveShiftId] = useState(null);
  const [scheduleData, setScheduleData] = useState({});
  const [editedShift, setEditedShift] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showWorkerListModal, setShowWorkerListModal] = useState(false);

  // 근무 기록 조회 (선택된 날짜의 월 전체)
  useEffect(() => {
    if (!selectedWorkplaceId || !selectedDate) return;

    const fetchWorkRecords = async () => {
      try {
        const startDate = new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth(),
          1
        );
        const endDate = new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth() + 1,
          0
        );

        const response = await getWorkRecords(
          selectedWorkplaceId,
          startDate,
          endDate
        );
        const recordsData = response.data || [];

        // API 응답을 기존 데이터 구조로 변환
        const transformedData = transformWorkRecordsToScheduleData(recordsData);
        setScheduleData(transformedData);
      } catch (error) {
        // 에러 시 빈 객체 사용
        setScheduleData({});
      }
    };

    fetchWorkRecords();
  }, [selectedWorkplaceId, selectedDate]);

  // API 응답을 기존 스케줄 데이터 구조로 변환하는 함수
  const transformWorkRecordsToScheduleData = (workRecords) => {
    const scheduleData = {};

    workRecords.forEach((record) => {
      const workplaceName = record.workplaceName;
      const dateKey = record.workDate;

      if (!scheduleData[workplaceName]) {
        scheduleData[workplaceName] = {};
      }
      if (!scheduleData[workplaceName][dateKey]) {
        scheduleData[workplaceName][dateKey] = [];
      }

      // LocalTime을 문자열로 변환 (백엔드에서 배열 또는 문자열로 올 수 있음)
      const formatTime = (time) => {
        if (Array.isArray(time)) {
          // [9, 0, 0] 형식
          const [h, m] = time;
          return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
        } else if (typeof time === "string") {
          // "09:00:00" 또는 "09:00" 형식
          return time.substring(0, 5); // HH:MM만 추출
        }
        return time;
      };

      const startTimeStr = formatTime(record.startTime);
      const endTimeStr = formatTime(record.endTime);

      // 시간 문자열을 시간 숫자로 변환 (HH:MM -> decimal)
      const startHour = timeStringToDecimal(startTimeStr);
      const endHour = timeStringToDecimal(endTimeStr);

      // 근무 시간 계산 (시간 단위)
      const durationHours = endHour - startHour;

      scheduleData[workplaceName][dateKey].push({
        id: `shift-${record.id}`,
        name: record.workerName,
        start: startTimeStr,
        end: endTimeStr,
        startHour,
        endHour,
        durationHours,
        breakMinutes: record.breakMinutes || 0,
        hourlyWage: record.hourlyWage || 10030,
        allowances: {
          overtime: { enabled: false, rate: 0 },
          night: { enabled: false, rate: 0 },
          weekend: { enabled: false, rate: 0 },
        },
        socialInsurance: true,
        withholdingTax: true,
        workRecordId: record.id, // 백엔드 ID 저장
      });
    });

    return scheduleData;
  };

  // 현재 시간 실시간 업데이트 (현재 근무 중 박스)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // 1분마다 업데이트

    return () => clearInterval(timer);
  }, []);

  const dateKey = getDateKey(selectedDate);
  // TODO: 백엔드 연동 시 scheduleData 구조 변경 필요
  const workplaceSchedules = useMemo(
    () => scheduleData[selectedWorkplace] || {},
    [scheduleData, selectedWorkplace]
  );
  const currentScheduleData = useMemo(
    () => workplaceSchedules[dateKey] || [],
    [workplaceSchedules, dateKey]
  );

  // 각 근무자마다 고정된 레인 할당 (한 명당 한 줄)
  const scheduleWithLanes = useMemo(() => {
    // 근무자 이름별로 레인 인덱스 할당
    const workerLaneMap = new Map();
    let nextLaneIndex = 0;

    // 시간순으로 정렬
    const sorted = [...currentScheduleData].sort(
      (a, b) => a.startHour - b.startHour
    );

    return sorted.map((item) => {
      // 해당 근무자에게 이미 레인이 할당되었는지 확인
      if (!workerLaneMap.has(item.name)) {
        workerLaneMap.set(item.name, nextLaneIndex);
        nextLaneIndex++;
      }

      const laneIndex = workerLaneMap.get(item.name);
      return { ...item, laneIndex };
    });
  }, [currentScheduleData]);

  const laneCount =
    scheduleWithLanes.reduce((max, item) => Math.max(max, item.laneIndex), 0) +
    1;

  const activeShift = scheduleWithLanes.find(
    (shift) => shift.id === activeShiftId
  );

  // 익일 근무인 경우 전날 근무 찾기
  const previousDate = new Date(selectedDate);
  previousDate.setDate(previousDate.getDate() - 1);
  const previousDateKey = getDateKey(previousDate);
  const previousScheduleData = workplaceSchedules[previousDateKey] || [];

  // 익일 근무이고 시작 시간이 0시인 경우 전날 근무 찾기
  const previousDayShift =
    activeShift && activeShift.startHour === 0 && activeShift.start === "00:00"
      ? previousScheduleData.find(
          (shift) => shift.name === activeShift.name && shift.crossesMidnight
        )
      : null;

  // 표시할 근무 정보 (익일 근무면 전날 근무 정보 사용)
  const displayShift = previousDayShift || activeShift;

  // 월 달력 셀 캐싱
  const calendarCells = useMemo(
    () => buildCalendarCells(displayMonth),
    [displayMonth]
  );

  // 이전/다음 달 이동 및 날짜 선택 핸들러
  const handlePrevMonth = () => {
    setDisplayMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
    );
  };

  const handleNextMonth = () => {
    setDisplayMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
    );
  };

  const handleSelectDate = (date) => {
    setSelectedDate(date);
    setDisplayMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    setActiveShiftId(null);
    setIsEditing(false);
    setEditedShift(null);
  };

  // 타임라인 블록 선택 토글
  const handleShiftClick = (shiftId) => {
    // 클릭한 근무 찾기
    const clickedShift = currentScheduleData.find(
      (shift) => shift.id === shiftId
    );

    // 익일 근무인지 확인 (00:00에 시작하는 경우)
    if (
      clickedShift &&
      clickedShift.startHour === 0 &&
      clickedShift.start === "00:00"
    ) {
      // 전날 날짜 계산
      const prevDate = new Date(selectedDate);
      prevDate.setDate(prevDate.getDate() - 1);
      const prevDateKey = getDateKey(prevDate);
      const prevScheduleData = workplaceSchedules[prevDateKey] || [];

      // 전날 같은 직원의 익일로 넘어가는 근무 찾기
      const prevDayShift = prevScheduleData.find(
        (shift) => shift.name === clickedShift.name && shift.crossesMidnight
      );

      if (prevDayShift) {
        // 전날 날짜로 이동하고 전날 근무 선택
        setSelectedDate(prevDate);
        setActiveShiftId(prevDayShift.id);
        setIsEditing(false);
        setEditedShift(null);
        return;
      }
    }

    // 일반적인 경우
    setActiveShiftId((prev) => {
      const newId = prev === shiftId ? null : shiftId;
      if (newId !== prev) {
        setIsEditing(false);
        setEditedShift(null);
      }
      return newId;
    });
  };

  // 해당 근무지의 모든 직원 리스트
  const [workersInWorkplace, setWorkersInWorkplace] = useState([]);

  // 근무지별 근로자 목록 조회
  useEffect(() => {
    if (!selectedWorkplaceId) return;

    const fetchWorkers = async () => {
      try {
        const response = await getContractsByWorkplace(selectedWorkplaceId);
        const contracts = response.data || [];
        const workerNames = [...new Set(contracts.map((c) => c.workerName))];
        setWorkersInWorkplace(workerNames);
      } catch (error) {
        // 에러 시 빈 배열 사용
        setWorkersInWorkplace([]);
      }
    };

    fetchWorkers();

    // 페이지가 보일 때마다 데이터 갱신
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchWorkers();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", fetchWorkers);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", fetchWorkers);
    };
  }, [selectedWorkplaceId]);

  // 근무자 추가 핸들러 - 모달 열기
  const handleAddShift = () => {
    setShowWorkerListModal(true);
  };

  // 직원 선택 후 근무 추가
  const handleSelectWorker = async (workerName) => {
    const dateKeyToAdd = getDateKey(selectedDate);

    const newShift = {
      id: `temp-${Date.now()}`, // 임시 ID
      name: workerName,
      start: "09:00",
      end: "18:00",
      startHour: 9,
      durationHours: 9,
      workplaceDetail: selectedWorkplace,
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
      const workplace = prev[selectedWorkplace] || {};
      const currentList = workplace[dateKeyToAdd] || [];

      return {
        ...prev,
        [selectedWorkplace]: {
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
      const contractsResponse = await getContractsByWorkplace(selectedWorkplaceId);
      const contracts = contractsResponse.data || [];
      const contract = contracts.find((c) => c.workerName === workerName);
      const contractId = contract?.contractId ?? contract?.id;

      if (!contractId) {
        return;
      }

      const workRecordData = {
        contractId: contractId,
        workDate: selectedDate.toISOString().split("T")[0],
        startTime: "09:00",
        endTime: "18:00",
        breakMinutes: 60,
        memo: "",
      };

      const response = await createWorkRecord(workRecordData);
      const createdRecord = response.data;

      // 백엔드에서 받은 ID로 업데이트
      setScheduleData((prev) => {
        const workplace = prev[selectedWorkplace] || {};
        const currentList = workplace[dateKeyToAdd] || [];

        return {
          ...prev,
          [selectedWorkplace]: {
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
    } catch (error) {
      // 실패 시 임시 데이터 유지 (사용자는 계속 편집 가능)
    }
  };

  // 편집 모드 진입/취소/저장 로직
  const handleStartEdit = () => {
    if (displayShift) {
      setEditedShift(cloneShiftWithDefaults(displayShift));
      setIsEditing(true);
    }
  };

  const handleCancelEdit = () => {
    if (displayShift) {
      setEditedShift(cloneShiftWithDefaults(displayShift));
    }
    setIsEditing(false);
  };

  // 근무자 삭제 핸들러
  const handleDeleteShift = () => {
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
          const workplace = prev[selectedWorkplace] || {};
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
                [selectedWorkplace]: {
                  ...workplace,
                  [dateKeyToDelete]: updatedList,
                  [nextKey]: updatedNextList,
                },
              };
            }
          }

          return {
            ...prev,
            [selectedWorkplace]: {
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
          } catch (error) {
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
  };

  const updateEditedShift = (field, value) => {
    setEditedShift((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const updateAllowance = (type, changes) => {
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
  };

  const handleSaveShift = async () => {
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
      const workplace = prev[selectedWorkplace] || {};
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
        const existingNextDayShift =
          activeShift && activeShift.start === "00:00"
            ? nextList.find((shift) => shift.id === activeShift.id)
            : null;

        if (secondPartDuration > 0) {
          if (existingNextDayShift) {
            // 기존 익일 근무 업데이트
            const updatedNextList = nextList.map((shift) =>
              shift.id === activeShift.id
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
              [selectedWorkplace]: {
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
              id: newShiftId,
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
          [selectedWorkplace]: {
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
        [selectedWorkplace]: {
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

        await updateWorkRecord(
          shiftToUpdate.workRecordId,
          updateData
        );
      } catch (error) {
        // 실패 시에도 UI는 이미 업데이트된 상태 유지 (낙관적 업데이트)
      }
    }
  };

  // YYYY.MM.DD 포맷 helper
  const formattedSelectedDate = useMemo(() => {
    const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
    const day = String(selectedDate.getDate()).padStart(2, "0");
    return `${selectedDate.getFullYear()}.${month}.${day}`;
  }, [selectedDate]);

  const handleTimeChange = (field, value) => {
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
  };

  // 읽기/편집 모드에 따라 표시할 근무 정보 선택
  const shiftForDisplay = isEditing && editedShift ? editedShift : displayShift;

  return (
    <div className="daily-page">
      <div className="daily-schedule-section">
        <div className="daily-schedule-header">
          <div className="daily-header-left">
            <select
              className="daily-workplace-select"
              value={selectedWorkplaceId}
              onChange={(e) => setSelectedWorkplaceId(Number(e.target.value))}
            >
              {workplaces.map((workplace) => (
                <option key={workplace.id} value={workplace.id}>
                  {workplace.name}
                </option>
              ))}
            </select>
            <h2 className="daily-date-heading">
              {`${selectedDate.getMonth() + 1}/${selectedDate.getDate()}(${
                ["일", "월", "화", "수", "목", "금", "토"][
                  selectedDate.getDay()
                ]
              })`}{" "}
              스케줄표
            </h2>
          </div>
          <button
            type="button"
            className="daily-add-button"
            onClick={handleAddShift}
          >
            + 근무자 추가하기
          </button>
        </div>
        <div className="daily-schedule-card">
          {/* 타임라인 상단 시간 레이블 */}
          <div className="daily-hours-row">
            {hours.map((hour) => (
              <div key={hour} className="daily-hour-cell">
                {hour}
              </div>
            ))}
          </div>
          <div
            className="daily-timeline"
            style={{ height: `${laneCount * 80 + 40}px` }}
          >
            {/* 근무자 타임라인 블록 */}
            {scheduleWithLanes.map((item) => {
              const left = (item.startHour / 24) * 100;
              const width = (item.durationHours / 24) * 100;
              const top = 20 + item.laneIndex * 80;
              // 근무 시간이 1시간 40분 이하일 때는 이름만 표시
              const isSmallBlock = item.durationHours <= 100 / 60; // 1시간 40분 = 100분
              // 근무 시간이 2시간 30분 이하일 때는 총 시간 숨김
              const hideDuration = item.durationHours <= 150 / 60; // 2시간 30분 = 150분
              return (
                <div
                  key={item.id}
                  className={`daily-shift-block ${
                    activeShiftId === item.id ? "active" : ""
                  } ${isSmallBlock ? "small" : ""}`}
                  style={{
                    left: `${left}%`,
                    width: `${width}%`,
                    top: `${top}px`,
                  }}
                  onClick={() => handleShiftClick(item.id)}
                >
                  <div className="shift-name">{item.name}</div>
                  {!isSmallBlock && (
                    <>
                      <div className="shift-time">{`${item.start} - ${item.end}`}</div>
                      {!hideDuration && (
                        <div className="shift-duration">
                          {formatDuration(item.durationHours)}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 근무 정보 카드 - 근무 블록 선택 시 별도 카드로 표시 */}
        {activeShift && (
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
                      onClick={handleCancelEdit}
                    >
                      취소
                    </button>
                    <button
                      type="button"
                      className="detail-save-button"
                      onClick={handleSaveShift}
                    >
                      저장
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className="detail-edit-button"
                      onClick={handleStartEdit}
                    >
                      정보 수정
                    </button>
                    <button
                      type="button"
                      className="detail-delete-button"
                      onClick={handleDeleteShift}
                    >
                      삭제
                    </button>
                  </>
                )}
                <button
                  type="button"
                  className="detail-close-button"
                  onClick={() => {
                    setActiveShiftId(null);
                    setIsEditing(false);
                    setEditedShift(null);
                  }}
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
                      onChange={(val) => handleTimeChange("start", val)}
                    />
                    <EmployerTimeInput
                      label="종료"
                      value={editedShift?.end || "00:00"}
                      onChange={(val) => handleTimeChange("end", val)}
                      allowMidnight
                    />
                  </div>
                ) : (
                  <p className="detail-value">
                    {(() => {
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
                        const nextScheduleData =
                          workplaceSchedules[nextDateKey] || [];
                        const nextDayShift = nextScheduleData.find(
                          (shift) =>
                            shift.name === shiftForDisplay?.name &&
                            shift.start === "00:00"
                        );
                        if (nextDayShift) {
                          return `${shiftForDisplay?.start}~${nextDayShift.end}(익일)`;
                        }
                        return `${shiftForDisplay?.start}~${shiftForDisplay?.end}(익일)`;
                      }
                      return `${shiftForDisplay?.start}~${shiftForDisplay?.end}`;
                    })()}
                  </p>
                )}
              </div>
              <div>
                <p className="detail-label">총 근무</p>
                <p className="detail-value">
                  {(() => {
                    // 익일 근무를 클릭한 경우 (전날 근무가 displayShift인 경우)
                    if (
                      previousDayShift &&
                      activeShift &&
                      activeShift.start === "00:00"
                    ) {
                      const totalHours =
                        previousDayShift.durationHours +
                        activeShift.durationHours;
                      return formatDuration(totalHours);
                    }
                    // 전날 근무를 클릭한 경우 (crossesMidnight가 true인 경우)
                    if (shiftForDisplay?.crossesMidnight) {
                      const nextDate = new Date(selectedDate);
                      nextDate.setDate(nextDate.getDate() + 1);
                      const nextDateKey = getDateKey(nextDate);
                      const nextScheduleData =
                        workplaceSchedules[nextDateKey] || [];
                      const nextDayShift = nextScheduleData.find(
                        (shift) =>
                          shift.name === shiftForDisplay?.name &&
                          shift.start === "00:00"
                      );
                      if (nextDayShift) {
                        const totalHours =
                          shiftForDisplay?.durationHours +
                          nextDayShift.durationHours;
                        return formatDuration(totalHours);
                      }
                    }
                    return formatDuration(shiftForDisplay?.durationHours);
                  })()}
                </p>
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
                      updateEditedShift("breakMinutes", Number(e.target.value))
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
                      updateEditedShift("hourlyWage", Number(e.target.value))
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
                      className={`allowance-item ${
                        allowance.enabled ? "on" : "off"
                      }`}
                    >
                      {isEditing ? (
                        <label className="allowance-toggle">
                          <input
                            type="checkbox"
                            checked={allowance.enabled}
                            onChange={(e) =>
                              updateAllowance(key, {
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
                            updateAllowance(key, {
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
            {/* <div className="detail-status-row">
                {isEditing ? (
                  <>
                    <label className="status-toggle">
                      <input
                        type="checkbox"
                        checked={editedShift?.socialInsurance ?? false}
                        onChange={(e) =>
                          updateEditedShift("socialInsurance", e.target.checked)
                        }
                      />
                      <span>4대보험 적용</span>
                    </label>
                    <label className="status-toggle">
                      <input
                        type="checkbox"
                        checked={editedShift?.withholdingTax ?? false}
                        onChange={(e) =>
                          updateEditedShift("withholdingTax", e.target.checked)
                        }
                      />
                      <span>소득세 공제</span>
                    </label>
                  </>
                ) : (
                  <>
                    <div
                      className={`status-pill ${
                        shiftForDisplay?.socialInsurance ? "on" : "off"
                      }`}
                    >
                      4대보험{" "}
                      {shiftForDisplay?.socialInsurance ? "적용" : "미적용"}
                    </div>
                    <div
                      className={`status-pill ${
                        shiftForDisplay?.withholdingTax ? "on" : "off"
                      }`}
                    >
                      소득세{" "}
                      {shiftForDisplay?.withholdingTax ? "공제" : "미공제"}
                    </div>
                  </>
                )}
              </div> */}
          </div>
        )}
      </div>
      <aside className="daily-side-panel">
        {/* 우측 월 달력 */}
        <div className="daily-calendar-card">
          <div className="daily-calendar-header">
            <button type="button" onClick={handlePrevMonth}>
              {"<"}
            </button>
            <div className="calendar-month-year">
              {displayMonth.getFullYear()}년 {displayMonth.getMonth() + 1}월
            </div>
            <button type="button" onClick={handleNextMonth}>
              {">"}
            </button>
          </div>
          <div className="daily-calendar-grid">
            <div className="calendar-weekday">SUN</div>
            <div className="calendar-weekday">MON</div>
            <div className="calendar-weekday">TUE</div>
            <div className="calendar-weekday">WED</div>
            <div className="calendar-weekday">THU</div>
            <div className="calendar-weekday">FRI</div>
            <div className="calendar-weekday">SAT</div>
            {calendarCells.map(({ date, currentMonth }, idx) => {
              const isSelected = isSameDate(date, selectedDate);
              return (
                <div
                  key={`${date.toISOString()}-${idx}`}
                  className={`calendar-day ${isSelected ? "current" : ""} ${
                    currentMonth ? "" : "other"
                  }`}
                  onClick={() => handleSelectDate(date)}
                >
                  {date.getDate()}
                </div>
              );
            })}
          </div>
        </div>
        {/* 우측 현재 근무자 리스트 */}
        <div className="daily-summary-card">
          <div className="summary-time">
            <p>
              {`${currentTime.getMonth() + 1}/${currentTime.getDate()}(${
                ["일", "월", "화", "수", "목", "금", "토"][currentTime.getDay()]
              })`}{" "}
              {`${String(currentTime.getHours()).padStart(2, "0")}:${String(
                currentTime.getMinutes()
              ).padStart(2, "0")}`}
            </p>
            <span>현재 근무중</span>
          </div>
          <ul>
            {(() => {
              const todayKey = getDateKey(currentTime);
              const todaySchedules =
                scheduleData[selectedWorkplace]?.[todayKey] || [];
              const currentHour = currentTime.getHours();
              const currentMinute = currentTime.getMinutes();
              const currentTimeDecimal = currentHour + currentMinute / 60;

              return todaySchedules
                .filter((item) => {
                  return (
                    item.startHour <= currentTimeDecimal &&
                    item.startHour + item.durationHours > currentTimeDecimal
                  );
                })
                .map((item) => (
                  <li key={item.id}>
                    <strong>
                      {item.start}~{item.end}
                    </strong>{" "}
                    {item.name}
                  </li>
                ));
            })()}
          </ul>
        </div>
      </aside>
      {/* 직원 선택 모달 */}
      {showWorkerListModal && (
        <div
          className="worker-list-modal-overlay"
          onClick={() => setShowWorkerListModal(false)}
        >
          <div
            className="worker-list-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="worker-list-modal-header">
              <h3>근무자 선택</h3>
              <button
                type="button"
                className="worker-list-modal-close"
                onClick={() => setShowWorkerListModal(false)}
              >
                ×
              </button>
            </div>
            <div className="worker-list-modal-body">
              {workersInWorkplace.length > 0 ? (
                <ul className="worker-list">
                  {workersInWorkplace.map((workerName) => (
                    <li
                      key={workerName}
                      className="worker-list-item"
                      onClick={() => handleSelectWorker(workerName)}
                    >
                      {workerName}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="worker-list-empty">등록된 근무자가 없습니다.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
