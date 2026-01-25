import React, { useState, useMemo, useEffect } from "react";
import { MdArrowForwardIos } from "react-icons/md";
import WorkEditRequestBox from "../MonthlyCalendarPage/WorkEditRequestBox";
import { pad2, getWeekStart, makeDateKey } from "../../../utils/dateUtils";
import type { WorkRecord, WorkRecordsByDate, EditForm, WeeklyCalendarProps, WeeklySummary} from "../../../types/worker/weeklyCalendar.types";
import "./WeeklyCalendar.css";

// ============ 유틸리티 함수 ============

// 요일 레이블 조회 함수
const getDayLabel = (dayIndex: number): string => {
  const KOREAN_DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];
  return KOREAN_DAY_LABELS[dayIndex] || "";
};

// 주간 요일 배열 생성
const generateWeekDays = (weekStart: Date): Date[] => {
  const days: Date[] = [];
  const start = new Date(weekStart);
  for (let i = 0; i < 7; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    days.push(date);
  }
  return days;
};

// 주차 제목 생성 로직
const generateWeekTitle = (currentWeekStart: Date, weekDays: Date[]): string => {
  let targetYear = currentWeekStart.getFullYear();
  let targetMonth = currentWeekStart.getMonth();

  // 주에 포함된 날짜 중에서 1일을 찾음
  const firstDayInWeek = weekDays.find((date) => date.getDate() === 1);

  if (firstDayInWeek) {
    targetYear = firstDayInWeek.getFullYear();
    targetMonth = firstDayInWeek.getMonth();
  }

  // 해당 월의 1일을 기준으로 주차 계산
  const firstDay = new Date(targetYear, targetMonth, 1);
  const firstDayWeekStart = getWeekStart(firstDay);
  const diffTime = currentWeekStart.getTime() - firstDayWeekStart.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const weekNumber = Math.floor(diffDays / 7) + 1;

  return `${targetYear}년 ${targetMonth + 1}월 ${weekNumber}주차`;
};

// 주간 근무 시간 및 급여 계산
const calculateWeeklySummary = (
  weekDays: Date[],
  workRecords: WorkRecordsByDate
): WeeklySummary => {
  let totalMinutes = 0;
  let wage = 0;

  weekDays.forEach((date) => {
    const dateKey = makeDateKey(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );
    const records = workRecords[dateKey] || [];

    records.forEach((record) => {
      // PENDING_APPROVAL 상태는 계산에서 제외
      if (record.status === "PENDING_APPROVAL") {
        return;
      }

      // totalWorkMinutes 우선 사용, 없으면 start/end로 계산
      if (record.totalWorkMinutes !== undefined) {
        totalMinutes += record.totalWorkMinutes || 0;
      } else {
        const startParts = record.start.split(":").map(Number);
        const endParts = record.end.split(":").map(Number);
        const [sh, sm] = [startParts[0] ?? 0, startParts[1] ?? 0];
        const [eh, em] = [endParts[0] ?? 0, endParts[1] ?? 0];
        const diff = eh * 60 + em - (sh * 60 + sm) - (record.breakMinutes ?? 0);
        totalMinutes += diff;
      }
      wage += record.wage || 0;
    });
  });

  const hours = Math.floor(totalMinutes / 60);
  return { totalHours: hours, totalWage: wage };
};

// 해당 날짜의 승인되지 않은 근무 기록만 필터링
const getApprovedRecords = (records: WorkRecord[]): WorkRecord[] => {
  return records.filter((record) => record.status !== "PENDING_APPROVAL");
};

// 날짜 클릭 핸들러의 폼 데이터 생성 함수
const createEditFormFromRecord = (
  dateKey: string,
  record: WorkRecord
): EditForm => {
  const dateParts = dateKey.split("-");
  const [year, month, day] = [dateParts[0] ?? "", dateParts[1] ?? "", dateParts[2] ?? ""];
  const startParts = record.start.split(":");
  const endParts = record.end.split(":");
  const [sh, sm] = [startParts[0] ?? "", startParts[1] ?? ""];
  const [eh, em] = [endParts[0] ?? "", endParts[1] ?? ""];

  const dateString = `${year}-${pad2(Number(month))}-${pad2(Number(day))}`;
  const breakTime = record.breakMinutes ?? 60;

  const formData: EditForm = {
    recordId: record.id,
    contractId: record.contractId,
    originalDateKey: dateKey,
    place: record.place,
    wage: record.wage,
    date: dateString,
    startHour: sh,
    startMinute: sm,
    endHour: eh,
    endMinute: em,
    breakMinutes: breakTime,
    // 원본 데이터 저장 (변경사항 비교용)
    originalData: {
      place: record.place,
      wage: record.wage,
      date: dateString,
      startHour: sh,
      startMinute: sm,
      endHour: eh,
      endMinute: em,
      breakMinutes: breakTime,
    },
  };

  return formData;
};

// 선택된 상태 확인 함수
const isRecordSelected = (
  selectedDateKey: string | null,
  selectedRecordId: number | null,
  dateKey: string,
  recordId: number
): boolean => {
  return selectedDateKey === dateKey && selectedRecordId === recordId;
};

// ============ 컴포넌트 ============

function WeeklyCalendar({
  workRecords = {},
  onConfirmEdit,
  onWeekChange,
}: WeeklyCalendarProps) {
  // ---- State ----

  const today = new Date();
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() =>
    getWeekStart(today)
  );
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [selectedRecordId, setSelectedRecordId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);

  // ---- Effects & Memos ----

  // 주 변경 시 부모 컴포넌트에 알림
  useEffect(() => {
    if (onWeekChange) {
      onWeekChange(currentWeekStart);
    }
  }, [currentWeekStart, onWeekChange]);

  // 현재 주의 일요일~토요일 날짜 배열
  const weekDays = useMemo(
    () => generateWeekDays(currentWeekStart),
    [currentWeekStart]
  );

  // 주 표시 텍스트
  const weekTitle = useMemo(
    () => generateWeekTitle(currentWeekStart, weekDays),
    [currentWeekStart, weekDays]
  );

  // 주간 근무시간 및 급여 계산
  const { totalHours, totalWage } = useMemo(
    () => calculateWeeklySummary(weekDays, workRecords),
    [weekDays, workRecords]
  );

  // ---- Event Handlers ----

  // 이전 주로 이동
  const handlePrevWeek = (): void => {
    const prevWeek = new Date(currentWeekStart);
    prevWeek.setDate(prevWeek.getDate() - 7);
    setCurrentWeekStart(prevWeek);
    setSelectedDateKey(null);
    setEditForm(null);
  };

  // 다음 주로 이동
  const handleNextWeek = (): void => {
    const nextWeek = new Date(currentWeekStart);
    nextWeek.setDate(nextWeek.getDate() + 7);
    setCurrentWeekStart(nextWeek);
    setSelectedDateKey(null);
    setEditForm(null);
  };

  // 날짜 클릭 핸들러
  const handleDateClick = (dateKey: string, recordId: number): void => {
    const isCurrentlySelected = isRecordSelected(
      selectedDateKey,
      selectedRecordId,
      dateKey,
      recordId
    );

    if (isCurrentlySelected) {
      // 같은 날짜/기록을 다시 클릭하면 닫기
      setSelectedDateKey(null);
      setSelectedRecordId(null);
      setEditForm(null);
      return;
    }

    setSelectedDateKey(dateKey);
    setSelectedRecordId(recordId);

    // 해당 기록의 데이터로 폼 초기화
    const records = workRecords[dateKey] || [];
    const record = records.find((r) => r.id === recordId);

    if (record) {
      const newEditForm = createEditFormFromRecord(dateKey, record);
      setEditForm(newEditForm);
    }
  };

  // 근무 기록 정정 요청 확인
  const handleConfirmEditInternal = async (form: EditForm): Promise<void> => {
    if (onConfirmEdit) {
      try {
        await onConfirmEdit(form);
        // 성공 시 폼 닫기
        setEditForm(null);
        setSelectedDateKey(null);
        setSelectedRecordId(null);
      } catch {
        // 에러 발생 시 폼은 열어둠 (사용자가 수정 가능하도록)
      }
    } else {
        setEditForm(null);
        setSelectedDateKey(null);
        setSelectedRecordId(null);
    }
  };


  // 정정 요청 취소
  const handleCancelEdit = (): void => {
    setEditForm(null);
    setSelectedDateKey(null);
    setSelectedRecordId(null);
  };

  // 일일 근무 기록 렌더링
  const renderDayRecords = (
    records: WorkRecord[],
    dateKey: string
  ) => {
    if (records.length === 0) {
      return <div className="weekly-day-off">휴무</div>;
    }

    return (
      <div className="weekly-day-records">
        {records.map((record) => {
          const isSelected = isRecordSelected(
            selectedDateKey,
            selectedRecordId,
            dateKey,
            record.id
          );

          return (
            <React.Fragment key={record.id}>
              <div
                className={`weekly-record-item ${isSelected ? "selected" : ""}`}
                onClick={() => handleDateClick(dateKey, record.id)}
              >
                <div className="weekly-record-time">
                  {record.start} ~ {record.end}
                </div>
                <div className="weekly-record-place">{record.place}</div>
              </div>

              {isSelected && editForm && (
                <WorkEditRequestBox
                  form={editForm}
                  setForm={setEditForm}
                  onConfirm={handleConfirmEditInternal}
                  onCancel={handleCancelEdit}
                  variant="weekly"
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  // ---- Render ----

  return (
    <>
      {/* 주 선택 네비게이션 */}
      <div className="weekly-nav">
        <button className="weekly-nav-arrow" onClick={handlePrevWeek}>
          <MdArrowForwardIos style={{ transform: "rotate(180deg)" }} />
        </button>
        <div className="weekly-nav-title">{weekTitle}</div>
        <button className="weekly-nav-arrow" onClick={handleNextWeek}>
          <MdArrowForwardIos />
        </button>
      </div>

      {/* 주간 근무시간 및 급여 카드 */}
      <div className="weekly-summary-row">
        <div className="weekly-summary-card">
          <div className="weekly-summary-label">주간 근무시간</div>
          <div className="weekly-summary-value">{totalHours}시간</div>
        </div>
        <div className="weekly-summary-card">
          <div className="weekly-summary-label">이번주 급여</div>
          <div className="weekly-summary-value">
            {totalWage.toLocaleString()}원
          </div>
        </div>
      </div>

      {/* 주간 캘린더 */}
      <div className="weekly-calendar-list">
        {weekDays.map((date) => {
          const dateKey = makeDateKey(
            date.getFullYear(),
            date.getMonth(),
            date.getDate()
          );
          const allRecords = workRecords[dateKey] || [];
          const records = getApprovedRecords(allRecords);
          const dayLabel = getDayLabel(date.getDay());
          const dayNumber = date.getDate();

          return (
            <div key={dateKey} className="weekly-day-item">
              <div className="weekly-day-left">
                <div className="weekly-day-number">{dayNumber}</div>
                <div className="weekly-day-label">{dayLabel}</div>
              </div>
              <div className="weekly-day-divider"></div>
              <div className="weekly-day-right">
                {renderDayRecords(records, dateKey)}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

export default WeeklyCalendar;
