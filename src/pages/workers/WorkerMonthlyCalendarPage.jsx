import React, { useMemo, useState, useEffect, useCallback } from "react";
import "./WorkerMonthlyCalendarPage.css";
import WorkEditRequestBox from "../../components/worker/MonthlyCalendarPage/WorkEditRequestBox";
import AddWorkModal from "../../components/worker/MonthlyCalendarPage/AddWorkModal";
import CalendarCard from "../../components/worker/MonthlyCalendarPage/CalendarCard";
import MonthNav from "../../components/worker/MonthlyCalendarPage/MonthNav";
import WorkListItem from "../../components/worker/MonthlyCalendarPage/WorkListItem";
import { toast } from "react-toastify";
import { getContracts, getContractDetail, getWorkRecords, createCorrectionRequest, createWorkRecord, getSalaries } from "../../api/workerApi";
import { formatTime, pad2 } from "../../utils/dateUtils";

const makeDateKey = (y, m, d) => `${y}-${pad2(m + 1)}-${pad2(d)}`;

// contractId를 안전하게 id로 변환하는 함수
const getId = (contractId) => {
  if (contractId === null || contractId === undefined) return null;
  if (typeof contractId === 'object' && 'id' in contractId) {
    return contractId.id;
  }
  return contractId;
};

const getKoreanDayLabel = (dayIndex) => { 
  const map = ["일", "월", "화", "수", "목", "금", "토"];
  return map[dayIndex] || "";
};

// API 응답 데이터를 더미데이터 형식으로 매핑
const mapWorkRecords = (apiData, hourlyWageMap) => {
  const recordsByDate = {};
  const memosByDate = {};

  if (!apiData || !Array.isArray(apiData)) {
    return { recordsByDate, memosByDate };
  }

  apiData.forEach((record) => {
    const dateKey = record.workDate;
    const contractId = record.contractId;
    const hourlyWage = hourlyWageMap[contractId] || 0;

    // totalWorkMinutes를 사용하여 급여 계산 (분 단위를 시간으로 변환)
    const wage = Math.round((hourlyWage * record.totalWorkMinutes) / 60);

    const mappedRecord = {
      id: record.id,
      contractId: record.contractId,
      start: formatTime(record.startTime) || "00:00",
      end: formatTime(record.endTime) || "00:00",
      wage: wage,
      place: record.workplaceName,
      breakMinutes: record.breakMinutes || 0,
      totalWorkMinutes: record.totalWorkMinutes || 0,
      status: record.status,
      isModified: record.isModified,
    };

    if (!recordsByDate[dateKey]) {
      recordsByDate[dateKey] = [];
    }
    recordsByDate[dateKey].push(mappedRecord);

    // memo 저장 (빈 문자열이어도 저장)
    if (record.memo !== undefined) {
      memosByDate[dateKey] = record.memo || "";
    }
  });

  return { recordsByDate, memosByDate };
};

function WorkerMonthlyCalendarPage() {
  const today = new Date();

  const [currentYear, setCurrentYear] = useState(() => today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(() => today.getMonth());
  const [workRecords, setWorkRecords] = useState({});
  const [memos, setMemos] = useState({});

  const [selectedDateKey, setSelectedDateKey] = useState(() =>
    makeDateKey(today.getFullYear(), today.getMonth(), today.getDate())
  );

  const [editForm, setEditForm] = useState(null); // 수정 요청 폼 상태
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState(null);
  const [workplaceOptions, setWorkplaceOptions] = useState([]); // 근무지 목록
  const [contractColorMap, setContractColorMap] = useState({}); // contractId -> 색상 인덱스 맵
  const [salaries, setSalaries] = useState([]); // 급여 목록

  // 근무 기록 가져오기 함수 (재사용 가능하도록 분리)
  const fetchWorkRecords = useCallback(async () => {
    try {
      // 1. 계약 목록 가져오기
      const contractsResponse = await getContracts();
      
      // 응답이 배열인지 확인
      let contractIds = [];
      if (Array.isArray(contractsResponse.data)) {
        contractIds = contractsResponse.data;
      } else if (contractsResponse.data) {
        // 배열이 아닌 경우, 객체의 값들을 배열로 변환하거나 직접 사용
        contractIds = [contractsResponse.data];
      }
      
      if (contractIds.length === 0) {
        setWorkRecords({});
        setMemos({});
        return;
      }

      // 2. 각 계약의 시급 정보 가져오기
      const hourlyWageMap = {};
      await Promise.all(
        contractIds.map(async (contractId) => {
          try {
            const id = getId(contractId);
            if (!id) {
              console.warn(`[WorkerMonthlyCalendarPage] 유효하지 않은 contractId:`, contractId);
              return;
            }

            const contractDetail = await getContractDetail(id);

            if (contractDetail.data?.hourlyWage !== undefined) {
              hourlyWageMap[id] = contractDetail.data.hourlyWage;
            }
          } catch (error) {
            console.error(`[WorkerMonthlyCalendarPage] 계약 ${contractId} 상세 정보 조회 실패:`, error);
          }
        })
      );

      // 3. 현재 월의 시작일과 종료일 계산
      const lastDay = new Date(currentYear, currentMonth + 1, 0);
      const startDate = `${currentYear}-${pad2(currentMonth + 1)}-${pad2(1)}`;
      const endDate = `${currentYear}-${pad2(currentMonth + 1)}-${pad2(lastDay.getDate())}`;

      // 4. 근무 기록 가져오기
      const workRecordsResponse = await getWorkRecords(startDate, endDate);
      const workRecordsData = workRecordsResponse.data || [];

      // 5. 데이터 매핑
      const { recordsByDate, memosByDate } = mapWorkRecords(workRecordsData, hourlyWageMap);
      setWorkRecords(recordsByDate);
      setMemos((prev) => ({ ...prev, ...memosByDate }));
    } catch (error) {
      console.error("[WorkerMonthlyCalendarPage] 근무 기록 조회 실패:", error);
      setWorkRecords({});
      setMemos({});
    }
  }, [currentYear, currentMonth]);

  // 근무지 목록 가져오기
  useEffect(() => {
    const fetchWorkplaces = async () => {
      try {
        // 1. 계약 목록 가져오기
        const contractsResponse = await getContracts();
        
        // 응답이 배열인지 확인
        let contracts = [];
        if (Array.isArray(contractsResponse.data)) {
          contracts = contractsResponse.data;
        } else if (contractsResponse.data) {
          contracts = [contractsResponse.data];
        }
        
        // 2. 각 계약의 상세 정보를 가져와서 workplaceName 포함
        const workplaces = await Promise.all(
          contracts.map(async (contract) => {
            const contractId = typeof contract === 'object' ? contract.id : contract;
            
            try {
              const contractDetail = await getContractDetail(contractId);
              return {
                id: contractId,
                workerName: contractDetail.data?.workerName || contract.workerName || '',
                workplaceName: contractDetail.data?.workplaceName || '',
              };
            } catch (error) {
              console.error(`[WorkerMonthlyCalendarPage] 계약 ${contractId} 상세 정보 조회 실패:`, error);
              return {
                id: contractId,
                workerName: contract.workerName || '',
                workplaceName: '',
              };
            }
          })
        );
        
        setWorkplaceOptions(workplaces);
        
        // contractId -> 색상 인덱스 맵 생성 (순서대로 0, 1, 2, 3, 3, 3...)
        const colorMap = {};
        workplaces.forEach((workplace, index) => {
          // 0: red, 1: yellow, 2: mint, 3: brown (4번째부터는 모두 brown)
          colorMap[workplace.id] = Math.min(index, 3);
        });
        setContractColorMap(colorMap);
      } catch (error) {
        console.error("[WorkerMonthlyCalendarPage] 근무지 목록 조회 실패:", error);
        setWorkplaceOptions([]);
        setContractColorMap({});
      }
    };
    
    fetchWorkplaces();
  }, []);

  // 급여 목록 가져오기
  useEffect(() => {
    const fetchSalaries = async () => {
      try {
        const response = await getSalaries();
        setSalaries(response.data || []);
      } catch (error) {
        console.error('[WorkerMonthlyCalendarPage] 급여 조회 실패:', error);
        setSalaries([]);
      }
    };
    fetchSalaries();
  }, []);

  // API에서 근무 기록 가져오기
  useEffect(() => {
    const loadWorkRecords = async () => {
      await fetchWorkRecords();
    };
    loadWorkRecords();
  }, [fetchWorkRecords]);

  const handlePrevMonth = () => { // 이전 달로 이동
    setCurrentMonth((prev) => {
      const date = new Date(currentYear, prev - 1, 1);
      setCurrentYear(date.getFullYear());
      return date.getMonth();
    });
  };

  const handleNextMonth = () => { // 다음 달로 이동
    setCurrentMonth((prev) => {
      const date = new Date(currentYear, prev + 1, 1);
      setCurrentYear(date.getFullYear());
      return date.getMonth();
    });
  };

  const calendarCells = useMemo(() => { // 달력 셀 계산
    const firstDay = new Date(currentYear, currentMonth, 1);
    const firstDayOfWeek = firstDay.getDay();
    const lastDate = new Date(currentYear, currentMonth + 1, 0).getDate();

    const cells = [];
    for (let i = 0; i < firstDayOfWeek; i += 1) cells.push(null);
    for (let d = 1; d <= lastDate; d += 1) cells.push(d);
    return cells;
  }, [currentYear, currentMonth]);

  const recordsForSelectedDay = (workRecords[selectedDateKey] || []).filter(
    (record) => record.status !== "PENDING_APPROVAL"
  );

  const handleMemoChange = (e) => { 
    const value = e.target.value;
    setMemos((prev) => ({
      ...prev,
      [selectedDateKey]: value,
    }));
  };

  const memoForSelected = memos[selectedDateKey] || "";

  const { totalMinutes, totalWage } = useMemo(() => { // 월간 총 근무 시간 및 급여 계산
    let minutes = 0;
    let calculatedWage = 0;

    // 월간 근무시간 및 임시 급여 계산: 근무 기록에서 집계
    Object.entries(workRecords).forEach(([key, list]) => {
      const [y, m] = key.split("-").map(Number);
      if (y === currentYear && m === currentMonth + 1) {
        list.forEach((record) => {
          // PENDING_APPROVAL, DELETED 상태인 근무 기록은 계산에서 제외
          if (record.status === "PENDING_APPROVAL" || record.status === "DELETED") {
            return;
          }
          // totalWorkMinutes 사용 (API에서 제공)
          minutes += record.totalWorkMinutes || 0;
          // 근무 기록의 wage 합산 (급여 데이터가 없을 때 대비)
          calculatedWage += record.wage || 0;
        });
      }
    });

    // 월 급여: 급여 API 데이터가 있으면 사용, 없으면 계산된 값 사용
    let wage = calculatedWage;
    const currentSalary = salaries.find(
      (salary) => salary.year === currentYear && salary.month === currentMonth + 1
    );
    if (currentSalary && currentSalary.netPay) {
      // netPay (실수령액) 사용 - 급여가 이미 생성된 경우
      wage = Math.round(Number(currentSalary.netPay) || 0);
    }

    return { totalMinutes: minutes, totalWage: wage };
  }, [currentYear, currentMonth, workRecords, salaries]);

  const totalHoursText = useMemo(() => { // 총 근무 시간 텍스트 변환
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return `${hours}시간 ${mins}분`;
  }, [totalMinutes]);

  const selectedDateObj = useMemo(() => { // 선택된 날짜 객체 생성
    const [y, m, d] = selectedDateKey.split("-").map(Number);
    return new Date(y, m - 1, d);
  }, [selectedDateKey]);

  const selectedDateTitle = useMemo(() => { // 선택된 날짜 제목 생성
    const m = selectedDateObj.getMonth() + 1;
    const d = selectedDateObj.getDate();
    const dayLabel = getKoreanDayLabel(selectedDateObj.getDay());
    return `${m}/${d}(${dayLabel})`;
  }, [selectedDateObj]);

  const displayYear = currentYear;
  const displayMonth = currentMonth + 1;
  const todayKey = makeDateKey(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  const handleDateClick = (day) => {
    if (!day) return;
    const key = makeDateKey(currentYear, currentMonth, day);
    setSelectedDateKey(key);
    setEditForm(null);
  };

  const handleOpenEdit = (record, dateKey) => { // 수정 요청 폼 열기
    const [year, month, day] = dateKey.split("-");
    const [sh, sm] = record.start.split(":");
    const [eh, em] = record.end.split(":");

    const formData = {
      recordId: record.id,
      contractId: record.contractId,
      originalDateKey: dateKey,
      place: record.place,
      wage: record.wage,
      date: `${year}-${pad2(Number(month))}-${pad2(Number(day))}`,
      startHour: sh,
      startMinute: sm,
      endHour: eh,
      endMinute: em,
      breakMinutes: record.breakMinutes ?? 60,
    };

    // 원본 데이터 저장 (변경사항 비교용) - 비교에 필요한 필드만 저장
    formData.originalData = {
      place: formData.place,
      wage: formData.wage,
      date: formData.date,
      startHour: formData.startHour,
      startMinute: formData.startMinute,
      endHour: formData.endHour,
      endMinute: formData.endMinute,
      breakMinutes: formData.breakMinutes,
    };

    setEditForm(formData);
  };

  const handleCloseEdit = () => { // 수정 요청 폼 닫기
    setEditForm(null);
  };

  const handleConfirmEdit = async (form) => { // 수정 요청 확인 핸들러
    try {
      // 1. 해당 workRecordId가 현재 로그인한 근로자의 근무 기록인지 확인
      const [year, month, day] = form.date.split("-").map(Number);
      const targetDate = new Date(year, month - 1, day);
      const targetYear = targetDate.getFullYear();
      const targetMonth = targetDate.getMonth();
      
      // 해당 날짜가 포함된 월의 시작일과 종료일 계산
      const lastDay = new Date(targetYear, targetMonth + 1, 0);
      const startDate = `${targetYear}-${pad2(targetMonth + 1)}-${pad2(1)}`;
      const endDate = `${targetYear}-${pad2(targetMonth + 1)}-${pad2(lastDay.getDate())}`;
      
      // 해당 월의 근무 기록 가져오기
      const workRecordsResponse = await getWorkRecords(startDate, endDate);
      const workRecordsData = workRecordsResponse.data || [];
      
      // workRecordId가 현재 근로자의 근무 기록 목록에 있는지 확인
      const workRecordId = Number(form.recordId);
      const isValidWorkRecord = workRecordsData.some(
        (record) => Number(record.id) === workRecordId
      );
      
      if (!isValidWorkRecord) {
        toast.error(
          "[FORBIDDEN] 본인의 근무 기록만 정정 요청할 수 있습니다.",
          {
            position: "top-right",
            autoClose: 3000,
          }
        );
        return;
      }

      // 2. 정정 요청 보내기
      // 시간을 "HH:mm:ss" 형식의 문자열로 변환
      const startTimeStr = `${pad2(Number(form.startHour))}:${pad2(Number(form.startMinute))}:00`;
      const endTimeStr = `${pad2(Number(form.endHour))}:${pad2(Number(form.endMinute))}:00`;
      
      const payload = {
        type: 'UPDATE',  // 정정 요청 타입: 기존 근무 수정
        workRecordId: workRecordId,
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
        setEditForm(null);
        return;
      }

      const errorMessage =
        response?.error?.message || "근무 기록 정정 요청에 실패했습니다.";
      const errorCode = response?.error?.code || "UNKNOWN";

      toast.error(`[${errorCode}] ${errorMessage}`, {
        position: "top-right",
        autoClose: 3000,
      });
    } catch (error) {
      const status = error.status || error.response?.status || "";
      const statusText = status ? `[${status}] ` : "";
      const errorMessage =
        error.error?.message ||
        error.message ||
        "근무 기록 정정 요청에 실패했습니다.";
      const errorCode =
        error.error?.code || error.errorCode || "UNKNOWN";

      toast.error(`${statusText}[${errorCode}] ${errorMessage}`, {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  const handleDeleteRequest = () => { // 삭제 요청 핸들러
    // TODO: 백엔드로 삭제 요청 보내기
    setEditForm(null);
  };

  const handleOpenAddModal = () => { // 근무 추가 모달 열기
    const defaultContractId = workplaceOptions.length > 0 ? workplaceOptions[0].id : null;
    setAddForm({
      contractId: defaultContractId,
      date: selectedDateKey,
      startHour: "09",
      startMinute: "00",
      endHour: "13",
      endMinute: "00",
      breakMinutes: 60,
    });
    setIsAddModalOpen(true);
  };

  const handleCloseAddModal = () => { // 근무 추가 모달 닫기
    setIsAddModalOpen(false);
    setAddForm(null);
  };

  const handleConfirmAddWork = async (form) => { // 근무 추가 확인 핸들러
    try {
      // 1. contractId가 현재 로그인한 근로자의 계약 목록에 있는지 확인
      const contractsResponse = await getContracts();
      
      let contracts = [];
      if (Array.isArray(contractsResponse.data)) {
        contracts = contractsResponse.data;
      } else if (contractsResponse.data) {
        contracts = [contractsResponse.data];
      }
      
      // contractId 추출 및 검증 (타입 정규화: 모두 숫자로 변환)
      const contractIds = contracts.map((contract) => {
        const id = typeof contract === 'object' ? contract.id : contract;
        return Number(id);
      });
      
      const contractId = Number(form.contractId);
      
      if (!contractIds.includes(contractId)) {
        toast.error(
          "[FORBIDDEN] 본인의 계약만 사용하여 근무를 추가할 수 있습니다.",
          {
            position: "top-right",
            autoClose: 3000,
          }
        );
        return;
      }

      // 2. 근무 추가 요청 보내기
      // 시간을 "HH:mm:ss" 형식의 문자열로 변환
      const startTimeStr = `${pad2(Number(form.startHour))}:${pad2(Number(form.startMinute))}:00`;
      const endTimeStr = `${pad2(Number(form.endHour))}:${pad2(Number(form.endMinute))}:00`;
      
      const payload = {
        contractId: contractId,
        workDate: form.date,
        startTime: startTimeStr,
        endTime: endTimeStr,
        breakMinutes: form.breakMinutes || 0,
        memo: "",
      };

      const response = await createWorkRecord(payload);

      if (response?.success) {
        toast.success("근무 추가 요청이 접수되었습니다.", {
          position: "top-right",
          autoClose: 3000,
        });
        
        // 근무 기록 다시 불러오기
        await fetchWorkRecords();
        handleCloseAddModal();
        return;
      }

      const errorMessage =
        response?.error?.message || "근무 추가 요청에 실패했습니다.";
      const errorCode = response?.error?.code || "UNKNOWN";

      toast.error(`[${errorCode}] ${errorMessage}`, {
        position: "top-right",
        autoClose: 3000,
      });
    } catch (error) {
      const status = error.status || error.response?.status || "";
      const statusText = status ? `[${status}] ` : "";
      const errorMessage =
        error.error?.message ||
        error.message ||
        "근무 추가 요청에 실패했습니다.";
      const errorCode =
        error.error?.code || error.errorCode || "UNKNOWN";

      toast.error(`${statusText}[${errorCode}] ${errorMessage}`, {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  return (
    <div className="monthly-calendar-page">
      {/* 상단 월 네비게이션 */}
      <MonthNav
        year={displayYear}
        month={displayMonth}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
      />

      <div className="monthly-calendar-layout">
        <CalendarCard
          currentYear={currentYear}
          currentMonth={currentMonth}
          calendarCells={calendarCells}
          selectedDateKey={selectedDateKey}
          workRecords={workRecords}
          onSelectDay={handleDateClick}
          makeDateKey={makeDateKey}
          contractColorMap={contractColorMap}
          todayKey={todayKey}
        />

        {/* 우측 패널 */}
        <div className="right-panel">
          <div className="work-list">
            {recordsForSelectedDay.length === 0 ? (
              <div className="work-list-empty">
                선택한 날짜의 근무 기록이 없습니다.
              </div>
            ) : (
              recordsForSelectedDay.map((record) => (
                <WorkListItem
                  key={record.id}
                  record={record}
                  selectedDate={selectedDateObj}
                  onEditClick={() => handleOpenEdit(record, selectedDateKey)}
                >
                  {editForm && editForm.recordId === record.id && (
                    <WorkEditRequestBox
                      form={editForm}
                      setForm={setEditForm}
                      onConfirm={handleConfirmEdit}
                      onDelete={handleDeleteRequest}
                      onCancel={handleCloseEdit}
                    />
                  )}
                </WorkListItem>
              ))
            )}
          </div>

          <button
            type="button"
            className="add-work-button"
            onClick={handleOpenAddModal}
            disabled
            style={{ opacity: 0.5, cursor: 'not-allowed' }}
            title="임시 비활성화 (백엔드 API 수정 필요)"
          >
            + 근무 추가하기
          </button>

          <div className="memo-card">
            <div className="memo-header">메모 {selectedDateTitle}</div>
            <textarea
              className="memo-textarea"
              placeholder="텍스트를 입력하세요."
              value={memoForSelected}
              onChange={handleMemoChange}
            />
          </div>

          <div className="summary-row">
            <div className="summary-card">
              <div className="summary-label">월간 근무시간</div>
              <div className="summary-value">{totalHoursText}</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">월 급여</div>
              <div className="summary-value">
                {totalWage.toLocaleString()}원
              </div>
            </div>
          </div>
        </div>
      </div>
      {isAddModalOpen && (
        <AddWorkModal
          form={addForm}
          setForm={setAddForm}
          workplaceOptions={workplaceOptions}
          onConfirm={handleConfirmAddWork}
          onCancel={handleCloseAddModal}
        />
      )}
    </div>
  );
}

export default WorkerMonthlyCalendarPage;
