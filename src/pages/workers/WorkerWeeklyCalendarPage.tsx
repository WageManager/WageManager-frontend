import React, { useState, useEffect, useCallback } from "react";
import WeeklyCalendar from "../../components/worker/WeeklyCalendar/WeeklyCalendar";
import { getContracts, getContractDetail, getWorkRecords, createCorrectionRequest} from "../../api/workerApi";
import { toast } from "react-toastify";
import { pad2, getWeekStart, formatTime } from "../../utils/dateUtils";
import type { WorkRecord, WorkRecordsByDate, EditForm, WorkRecordStatus } from "../../types/worker/weeklyCalendar.types";

// API 응답 데이터 구조 타입 정의
interface ApiWorkRecord {
  id: number;
  contractId: number;
  workDate: string;
  startTime: string;
  endTime: string;
  totalWorkMinutes: number;
  breakMinutes?: number;
  workplaceName: string;
  status: string;
  isModified: boolean;
}

interface ApiContractDetail {
  hourlyWage?: number;
}

interface HourlyWageMap {
  [contractId: number]: number;
}

interface MapWorkRecordsResult {
  recordsByDate: WorkRecordsByDate;
}

// API 응답 데이터를 내부 형식으로 매핑
const mapWorkRecords = (
  apiData: ApiWorkRecord[],
  hourlyWageMap: HourlyWageMap
): MapWorkRecordsResult => {
  const recordsByDate: WorkRecordsByDate = {};

  if (!apiData || !Array.isArray(apiData)) {
    return { recordsByDate };
  }

  apiData.forEach((record) => {
    const dateKey = record.workDate;
    const contractId = record.contractId;
    const hourlyWage = hourlyWageMap[contractId] || 0;

    // totalWorkMinutes를 사용하여 급여 계산 (분 단위를 시간으로 변환)
    const wage = Math.round((hourlyWage * record.totalWorkMinutes) / 60);

    const mappedRecord: WorkRecord = {
      id: record.id,
      contractId: record.contractId,
      start: formatTime(record.startTime),
      end: formatTime(record.endTime),
      wage: wage,
      place: record.workplaceName,
      breakMinutes: record.breakMinutes || 0,
      totalWorkMinutes: record.totalWorkMinutes || 0,
      status: record.status as WorkRecordStatus,
      isModified: record.isModified,
    };

    if (!recordsByDate[dateKey]) {
      recordsByDate[dateKey] = [];
    }
    recordsByDate[dateKey].push(mappedRecord);
  });

  return { recordsByDate };
};

// contractId를 안전하게 id로 변환하는 함수
const extractContractId = (
  contractId: unknown
): number | null => {
  if (contractId === null || contractId === undefined) return null;
  if (typeof contractId === "object" && "id" in contractId) {
    const id = (contractId as { id: number }).id;
    return typeof id === "number" ? id : null;
  }
  return typeof contractId === "number" ? contractId : null;
};

// 계약 ID 리스트 가져오기
const normalizeContractIds = (
  contractsResponse: unknown
): number[] => {
  if (Array.isArray(contractsResponse)) {
    return contractsResponse
      .map(extractContractId)
      .filter((id): id is number => id !== null);
  }
  if (contractsResponse && typeof contractsResponse === "object") {
    const id = extractContractId(contractsResponse);
    return id !== null ? [id] : [];
  }
  return [];
};

// 각 계약의 시급 정보 가져오기
const loadHourlyWages = async (
  contractIds: number[]
): Promise<HourlyWageMap> => {
  const hourlyWageMap: HourlyWageMap = {};

  await Promise.all(
    contractIds.map(async (contractId) => {
      try {
        const contractDetail = await getContractDetail(contractId);
        const hourlyWage = (contractDetail.data as ApiContractDetail)?.hourlyWage;

        if (hourlyWage !== undefined) {
          hourlyWageMap[contractId] = hourlyWage;
        }
      } catch (error) {
        console.error(
          `[WorkerWeeklyCalendarPage] 계약 ${contractId} 상세 정보 조회 실패:`,
          error
        );
      }
    })
  );

  return hourlyWageMap;
};

// 주간 날짜 범위 반환 (일요일 ~ 토요일)
const getWeekDateRange = (weekStart: Date): { startDate: string; endDate: string } => {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6); // 토요일

  const startDate = `${weekStart.getFullYear()}-${pad2(weekStart.getMonth() + 1)}-${pad2(weekStart.getDate())}`;
  const endDate = `${weekEnd.getFullYear()}-${pad2(weekEnd.getMonth() + 1)}-${pad2(weekEnd.getDate())}`;

  return { startDate, endDate };
};

// 근무 기록 정정 요청 전송
const submitCorrectionRequest = async (
  form: EditForm,
  workRecords: WorkRecordsByDate
): Promise<void> => {
  // 1. 기존 상태에서 해당 workRecordId가 있는지 확인
  const workRecordId = Number(form.recordId);
  const dateRecords = workRecords[form.originalDateKey] || [];
  const matchingRecord = dateRecords.find((record) => record.id === workRecordId);
  const isValidWorkRecord = Boolean(matchingRecord);

  if (!isValidWorkRecord) {
    const errorMessage =
      "[FORBIDDEN] 본인의 근무 기록만 정정 요청할 수 있습니다.";
    toast.error(errorMessage, {
      position: "top-right",
      autoClose: 3000,
    });
    throw new Error(errorMessage);
  }

  // 2. 정정 요청 보내기 - 백엔드 LocalTime(문자열) 요구
  const startTimeStr = `${pad2(Number(form.startHour))}:${pad2(Number(form.startMinute))}:00`;
  const endTimeStr = `${pad2(Number(form.endHour))}:${pad2(Number(form.endMinute))}:00`;

  const payload = {
    type: "UPDATE" as const,
    workRecordId: workRecordId,
    contractId: matchingRecord?.contractId ?? 0,
    requestedWorkDate: form.date,
    requestedStartTime: startTimeStr,
    requestedEndTime: endTimeStr,
  };

  const response = await createCorrectionRequest(payload);

  if (response?.success) {
    toast.success("근무 기록 정정 요청이 접수되었습니다.", {
      position: "top-right",
      autoClose: 3000,
    });
    // 정정 요청은 고용주 승인 후에야 변경되므로 UI 업데이트하지 않음
    // 성공 시 WeeklyCalendar 컴포넌트에서 폼을 닫도록 처리
    return;
  }

  // response.success가 false인 경우 Error를 throw
  const errorMessage =
    (response?.error as { message?: string })?.message || "근무 기록 정정 요청에 실패했습니다.";
  const errorCode = (response?.error as { code?: string })?.code || "UNKNOWN";

  toast.error(`[${errorCode}] ${errorMessage}`, {
    position: "top-right",
    autoClose: 3000,
  });

  throw new Error(errorMessage);
};

// 에러 메시지 추출 및 표시
const handleCorrectionRequestError = (error: unknown): void => {
  const status =
    (error as { status?: number | string }).status ||
    (error as { response?: { status?: number } }).response?.status ||
    "";
  const statusText = status ? `[${status}] ` : "";

  const errorMessage =
    (error as { error?: { message?: string } }).error?.message ||
    (error as { message?: string }).message ||
    "근무 기록 정정 요청에 실패했습니다.";

  const errorCode =
    (error as { error?: { code?: string } }).error?.code ||
    (error as { errorCode?: string }).errorCode ||
    "UNKNOWN";

  toast.error(`${statusText}[${errorCode}] ${errorMessage}`, {
    position: "top-right",
    autoClose: 3000,
  });
};


// ============ 컴포넌트 ============

export default function WorkerWeeklyCalendarPage() {
  const today = new Date();
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() =>
    getWeekStart(today)
  );
  const [workRecords, setWorkRecords] = useState<WorkRecordsByDate>({});

  // 주간 근무 기록 가져오기 함수
  const fetchWorkRecords = useCallback(async (): Promise<void> => {
    try {
      // 1. 계약 목록 가져오기
      const contractsResponse = await getContracts();
      const contractIds = normalizeContractIds(contractsResponse.data);

      if (contractIds.length === 0) {
        setWorkRecords({});
        return;
      }

      // 2. 각 계약의 시급 정보 가져오기
      const hourlyWageMap = await loadHourlyWages(contractIds);

      // 3. 현재 주의 날짜 범위 (시작일(일요일)과 종료일(토요일)) 계산
      const { startDate, endDate } = getWeekDateRange(currentWeekStart);

      // 4. 근무 기록 가져오기
      const workRecordsResponse = await getWorkRecords(startDate, endDate);
      const workRecordsData = (workRecordsResponse.data || []) as ApiWorkRecord[];

      // 5. 데이터 매핑
      const { recordsByDate } = mapWorkRecords(
        workRecordsData,
        hourlyWageMap
      );
      setWorkRecords(recordsByDate);
    } catch (error) {
      console.error("[WorkerWeeklyCalendarPage] 근무 기록 조회 실패:", error);
      setWorkRecords({});
    }
  }, [currentWeekStart]);

  // API에서 근무 기록 가져오기
  useEffect(() => {
    const loadWorkRecords = async (): Promise<void> => {
      await fetchWorkRecords();
    };
    loadWorkRecords();
  }, [fetchWorkRecords]);

  // 근무 기록 정정 요청 확인
  const handleConfirmEdit = async (form: EditForm): Promise<void> => {
    try {
      await submitCorrectionRequest(form, workRecords);
    } catch (error) {
      handleCorrectionRequestError(error);

      // 에러를 다시 throw하여 WeeklyCalendar의 catch에서 처리되도록 함
      throw error;
    }
  };

  return (
    <div className="worker-content-frame weekly-calendar-wrapper">
      <WeeklyCalendar
        workRecords={workRecords}
        onConfirmEdit={handleConfirmEdit}
        onWeekChange={setCurrentWeekStart}
      />
    </div>
  );
}
