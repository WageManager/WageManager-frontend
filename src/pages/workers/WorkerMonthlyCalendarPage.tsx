import { useMemo, useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import './WorkerMonthlyCalendarPage.css';
import WorkEditRequestBox from '../../components/worker/MonthlyCalendarPage/WorkEditRequestBox';
import AddWorkModal from '../../components/worker/MonthlyCalendarPage/AddWorkModal';
import CalendarCard from '../../components/worker/MonthlyCalendarPage/CalendarCard';
import MonthNav from '../../components/common/MonthNav';
import WorkListItem from '../../components/worker/MonthlyCalendarPage/WorkListItem';
import MemoCard from '../../components/worker/MonthlyCalendarPage/MemoCard';
import SummaryRow from '../../components/worker/MonthlyCalendarPage/SummaryRow';
import {
  getContracts,
  getWorkRecords,
  createCorrectionRequest,
  createWorkRecord,
  type CreateCorrectionRequestPayload,
  type Contract,
  type WorkRecordsResponse,
} from '../../api/workerApi';
import { formatTime, pad2, makeDateKey } from '../../utils/dateUtils';
import { useMonthlyCalendar } from '../../hooks/worker/useMonthlyCalendar';
import type {
  WorkRecord,
  WorkRecordsByDate,
  EditForm,
  AddWorkForm,
  WorkplaceOption,
} from '../../types/worker/monthlyCalendar.types';


// ============ 로컬 타입 ============

type MemosByDate = Record<string, string>;

type ContractColorMap = Record<number, number>;

/** 근무 추가 payload */
interface CreateWorkRecordPayload {
  contractId: number;
  workDate: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  memo: string;
}

// ============ 유틸리티 함수 ============

const getKoreanDayLabel = (dayIndex: number): string => {
  const map = ['일', '월', '화', '수', '목', '금', '토'];
  return map[dayIndex] || '';
};

/**
 * API 응답 데이터를 클라이언트 형식으로 매핑
 */
const mapWorkRecords = (
  apiData: WorkRecordsResponse[]
): { recordsByDate: WorkRecordsByDate; memosByDate: MemosByDate } => {
  const recordsByDate: WorkRecordsByDate = {};
  const memosByDate: MemosByDate = {};

  if (!apiData || !Array.isArray(apiData)) {
    return { recordsByDate, memosByDate };
  }

  apiData.forEach((record) => {
    const dateKey = record.workDate;

    const mappedRecord: WorkRecord = {
      id: record.id,
      contractId: record.contractId,
      start: formatTime(record.startTime) || '00:00',
      end: formatTime(record.endTime) || '00:00',
      wage: record.wage || 0,
      place: record.workplaceName,
      breakMinutes: record.breakMinutes || 0,
      totalWorkMinutes: record.totalWorkMinutes || 0,
      status: record.status as WorkRecord['status'],
      isModified: record.isModified,
    };

    if (!recordsByDate[dateKey]) {
      recordsByDate[dateKey] = [];
    }
    recordsByDate[dateKey].push(mappedRecord);

    if (record.memo !== undefined) {
      memosByDate[dateKey] = record.memo || '';
    }
  });

  return { recordsByDate, memosByDate };
};

// ============ 컴포넌트 ============

export default function WorkerMonthlyCalendarPage() {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(() => today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(() => today.getMonth());
  const [workRecords, setWorkRecords] = useState<WorkRecordsByDate>({});
  const [memos, setMemos] = useState<MemosByDate>({});

  const [currentDay, setCurrentDay] = useState(() => today.getDate());
  const selectedDateKey = useMemo(() =>
    makeDateKey(currentYear, currentMonth, currentDay)
  , [currentYear, currentMonth, currentDay]);

  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState<AddWorkForm | null>(null);
  const [workplaceOptions, setWorkplaceOptions] = useState<WorkplaceOption[]>([]);
  const [contractColorMap, setContractColorMap] = useState<ContractColorMap>({});
  const [contracts, setContracts] = useState<Contract[]>([]);

  // 1. 초기 데이터 로드 (계약 목록, 근무지 옵션, 색상 맵)
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const contractsResponse = await getContracts();
        
        let fetchedContracts: Contract[] = [];
        if (Array.isArray(contractsResponse.data)) {
          fetchedContracts = contractsResponse.data;
        } else if (contractsResponse.data) {
          fetchedContracts = [contractsResponse.data] as unknown as Contract[];
        }
        setContracts(fetchedContracts);
        
        const workplaces = fetchedContracts.map((contract) => {
          return {
            id: contract.id,
            workerName: contract.workerName || '',
            workplaceName: contract.workplaceName || '',
          };
        });
        setWorkplaceOptions(workplaces);
        
        const colorMap: ContractColorMap = {};
        workplaces.forEach((workplace, index) => {
          colorMap[workplace.id] = Math.min(index, 3);
        });
        setContractColorMap(colorMap);
      } catch (error) {
        console.error('[WorkerMonthlyCalendarPage] 초기 데이터 조회 실패:', error);
        setContracts([]);
        setWorkplaceOptions([]);
        setContractColorMap({});
      }
    };
    fetchInitialData();
  }, []);

  // 근무 기록 가져오기 함수
  const fetchWorkRecords = useCallback(async () => {
    if (contracts.length === 0) {
      setWorkRecords({});
      setMemos({});
      return;
    }
    try {
      const lastDay = new Date(currentYear, currentMonth + 1, 0);
      const startDate = `${currentYear}-${pad2(currentMonth + 1)}-${pad2(1)}`;
      const endDate = `${currentYear}-${pad2(currentMonth + 1)}-${pad2(lastDay.getDate())}`;
      
      const workRecordsResponse = await getWorkRecords(startDate, endDate);
      const workRecordsData: WorkRecordsResponse[] = workRecordsResponse.data || [];
      
      const { recordsByDate, memosByDate } = mapWorkRecords(workRecordsData);
      setWorkRecords(recordsByDate);
      setMemos((prev) => ({ ...prev, ...memosByDate }));
    } catch (error) {
      console.error('[WorkerMonthlyCalendarPage] 근무 기록 조회 실패:', error);
      setWorkRecords({});
      setMemos({});
    }
  }, [currentYear, currentMonth, contracts]);

  useEffect(() => {
    fetchWorkRecords();
  }, [fetchWorkRecords]);

  const calendarCells = useMonthlyCalendar(currentYear, currentMonth);

  const recordsForSelectedDay = (workRecords[selectedDateKey] || []).filter(
    (record) => record.status !== 'PENDING_APPROVAL'
  );

  const handleMemoChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMemos((prev) => ({
      ...prev,
      [selectedDateKey]: value,
    }));
  };

  const memoForSelected = memos[selectedDateKey] || '';

  const { totalMinutes, totalWage } = useMemo(() => {
    let minutes = 0;
    let calculatedWage = 0;

    Object.entries(workRecords).forEach(([key, list]) => {
      const [y, m] = key.split('-').map(Number);
      if (y === currentYear && m === currentMonth + 1) {
        list.forEach((record) => {
          if (record.status === 'PENDING_APPROVAL' || record.status === 'DELETED') {
            return;
          }
          minutes += record.totalWorkMinutes || 0;
          calculatedWage += record.wage || 0;
        });
      }
    });

    return { totalMinutes: minutes, totalWage: calculatedWage };
  }, [currentYear, currentMonth, workRecords]);

  const totalHoursText = useMemo(() => {
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return `${hours}시간 ${mins}분`;
  }, [totalMinutes]);

  const selectedDateTitle = useMemo(() => {
    const date = new Date(currentYear, currentMonth, currentDay);
    const m = currentMonth + 1;
    const d = currentDay;
    const dayLabel = getKoreanDayLabel(date.getDay());
    return `${m}/${d}(${dayLabel})`;
  }, [currentYear, currentMonth, currentDay]);

  const todayKey = makeDateKey(today.getFullYear(), today.getMonth(), today.getDate());

  const handleDateClick = useCallback((day: number | null) => {
    if (!day) return;
    setCurrentDay(day);
    setEditForm(null);
  }, []);

  const handleOpenEdit = (record: WorkRecord, dateKey: string) => {
    const dateParts = dateKey.split('-');
    const year = dateParts[0] ?? '';
    const month = dateParts[1] ?? '';
    const day = dateParts[2] ?? '';
    const startParts = record.start.split(':');
    const sh = startParts[0] ?? '00';
    const sm = startParts[1] ?? '00';
    const endParts = record.end.split(':');
    const eh = endParts[0] ?? '00';
    const em = endParts[1] ?? '00';

    const formData: EditForm = {
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
      originalData: {
        place: record.place,
        wage: record.wage,
        date: `${year}-${pad2(Number(month))}-${pad2(Number(day))}`,
        startHour: sh,
        startMinute: sm,
        endHour: eh,
        endMinute: em,
        breakMinutes: record.breakMinutes ?? 60,
      },
    };
    setEditForm(formData);
  };

  const handleCloseEdit = () => {
    setEditForm(null);
  };

  const handleConfirmEdit = async (form: EditForm) => {
    try {
      const dateParts = form.date.split('-').map(Number);
      const year = dateParts[0] ?? 0;
      const month = dateParts[1] ?? 1;
      const day = dateParts[2] ?? 1;
      const targetDate = new Date(year, month - 1, day);
      const targetYear = targetDate.getFullYear();
      const targetMonth = targetDate.getMonth();

      const lastDay = new Date(targetYear, targetMonth + 1, 0);
      const startDate = `${targetYear}-${pad2(targetMonth + 1)}-${pad2(1)}`;
      const endDate = `${targetYear}-${pad2(targetMonth + 1)}-${pad2(lastDay.getDate())}`;

      const workRecordsResponse = await getWorkRecords(startDate, endDate);
      const workRecordsData: WorkRecordsResponse[] = workRecordsResponse.data || [];

      const workRecordId = Number(form.recordId);
      const isValidWorkRecord = workRecordsData.some(
        (record) => Number(record.id) === workRecordId
      );

      if (!isValidWorkRecord) {
        toast.error('[FORBIDDEN] 본인의 근무 기록만 정정 요청할 수 있습니다.', {
          position: 'top-right',
          autoClose: 3000,
        });
        return;
      }

      const payload: CreateCorrectionRequestPayload = {
        type: 'UPDATE',
        workRecordId: workRecordId,
        contractId: form.contractId,
        requestedWorkDate: form.date,
        requestedStartTime: `${pad2(Number(form.startHour))}:${pad2(Number(form.startMinute))}:00`,
        requestedEndTime: `${pad2(Number(form.endHour))}:${pad2(Number(form.endMinute))}:00`,
        requestedBreakMinutes: form.breakMinutes,
      };

      const response = await createCorrectionRequest(payload);

      if (response?.success) {
        toast.success('근무 기록 정정 요청이 접수되었습니다.', {
          position: 'top-right',
          autoClose: 3000,
        });
        setEditForm(null);
        return;
      }

      const errorMessage = response?.error?.message || '근무 기록 정정 요청에 실패했습니다.';
      const errorCode = response?.error?.code || 'UNKNOWN';

      toast.error(`[${errorCode}] ${errorMessage}`, {
        position: 'top-right',
        autoClose: 3000,
      });
    } catch (error: unknown) {
      const err = error as {
        status?: number;
        response?: { status?: number };
        error?: { message?: string; code?: string };
        message?: string;
        errorCode?: string;
      };
      const status = err.status || err.response?.status || '';
      const statusText = status ? `[${status}] ` : '';
      const errorMessage = err.error?.message || err.message || '근무 기록 정정 요청에 실패했습니다.';
      const errorCode = err.error?.code || err.errorCode || 'UNKNOWN';

      toast.error(`${statusText}[${errorCode}] ${errorMessage}`, {
        position: 'top-right',
        autoClose: 3000,
      });
    }
  };

  const handleDeleteRequest = () => {
    setEditForm(null);
  };

  const handleOpenAddModal = () => {
    const defaultContractId = workplaceOptions[0]?.id ?? null;
    setAddForm({
      contractId: defaultContractId,
      date: selectedDateKey,
      startHour: '09',
      startMinute: '00',
      endHour: '13',
      endMinute: '00',
      breakMinutes: 60,
    });
    setIsAddModalOpen(true);
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
    setAddForm(null);
  };

  const handleConfirmAddWork = async (form: AddWorkForm) => {
    try {
      const contractsResponse = await getContracts();

      let contractsList: unknown[] = [];
      if (Array.isArray(contractsResponse.data)) {
        contractsList = contractsResponse.data;
      } else if (contractsResponse.data) {
        contractsList = [contractsResponse.data];
      }

      const contractIds = contractsList.map((contract) => {
        const id =
          typeof contract === 'object' && contract !== null && 'id' in contract
            ? (contract as { id: number }).id
            : (contract as number);
        return Number(id);
      });

      const contractId = Number(form.contractId);

      if (!contractIds.includes(contractId)) {
        toast.error('[FORBIDDEN] 본인의 계약만 사용하여 근무를 추가할 수 있습니다.', {
          position: 'top-right',
          autoClose: 3000,
        });
        return;
      }

      const startTimeStr = `${pad2(Number(form.startHour))}:${pad2(Number(form.startMinute))}:00`;
      const endTimeStr = `${pad2(Number(form.endHour))}:${pad2(Number(form.endMinute))}:00`;

      const payload: CreateWorkRecordPayload = {
        contractId: contractId,
        workDate: form.date,
        startTime: startTimeStr,
        endTime: endTimeStr,
        breakMinutes: form.breakMinutes || 0,
        memo: '',
      };

      const response = await createWorkRecord(payload);

      if (response?.success) {
        toast.success('근무 추가 요청이 접수되었습니다.', {
          position: 'top-right',
          autoClose: 3000,
        });

        await fetchWorkRecords();
        handleCloseAddModal();
        return;
      }

      const errorMessage = response?.error?.message || '근무 추가 요청에 실패했습니다.';
      const errorCode = response?.error?.code || 'UNKNOWN';

      toast.error(`[${errorCode}] ${errorMessage}`, {
        position: 'top-right',
        autoClose: 3000,
      });
    } catch (error: unknown) {
      const err = error as {
        status?: number;
        response?: { status?: number };
        error?: { message?: string; code?: string };
        message?: string;
        errorCode?: string;
      };
      const status = err.status || err.response?.status || '';
      const statusText = status ? `[${status}] ` : '';
      const errorMessage = err.error?.message || err.message || '근무 추가 요청에 실패했습니다.';
      const errorCode = err.error?.code || err.errorCode || 'UNKNOWN';

      toast.error(`${statusText}[${errorCode}] ${errorMessage}`, {
        position: 'top-right',
        autoClose: 3000,
      });
    }
  };

  return (
    <div className="monthly-calendar-page">
      <MonthNav
        year={currentYear}
        month={currentMonth + 1}
        onPrevMonth={() => {
          setCurrentMonth((prev) => {
            const date = new Date(currentYear, prev - 1, 1);
            setCurrentYear(date.getFullYear());
            return date.getMonth();
          });
        }}
        onNextMonth={() => {
          setCurrentMonth((prev) => {
            const date = new Date(currentYear, prev + 1, 1);
            setCurrentYear(date.getFullYear());
            return date.getMonth();
          });
        }}
      />
      <div className="monthly-calendar-layout">
        <CalendarCard
          currentYear={currentYear}
          currentMonth={currentMonth}
          calendarCells={calendarCells}
          selectedDay={currentDay}
          workRecords={workRecords}
          onSelectDay={handleDateClick}
          contractColorMap={contractColorMap}
          todayKey={todayKey}
        />
        <div className="right-panel">
          <div className="work-list">
            {recordsForSelectedDay.length === 0 ? (
              <div className="work-list-empty">선택한 날짜의 근무 기록이 없습니다.</div>
            ) : (
              recordsForSelectedDay.map((record) => (
                <WorkListItem
                  key={record.id}
                  record={record}
                  selectedDate={new Date(currentYear, currentMonth, currentDay)}
                  onEditClick={() => handleOpenEdit(record, selectedDateKey)}
                >
                  {editForm && editForm.recordId === record.id && (
                    <WorkEditRequestBox
                      form={editForm}
                      setForm={setEditForm}
                      onConfirm={handleConfirmEdit}
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

          <MemoCard title={selectedDateTitle} value={memos[selectedDateKey] || ''} onChange={handleMemoChange} />

          <SummaryRow totalHoursText={totalHoursText} totalWage={totalWage} />
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