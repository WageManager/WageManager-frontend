import { useState, useMemo, useEffect } from "react";
import type { ChangeEvent } from "react";
import Swal from "sweetalert2";
import "../../styles/workerManagePage.css";
import EmployerBasicInfoCard from "../../components/employer/WorkerManagePage/EmployerBasicInfoCard";
import EmployerWorkplaceForm from "../../components/employer/WorkerManagePage/EmployerWorkplaceForm";
import EmployerWorkInfoCard from "../../components/employer/WorkerManagePage/EmployerWorkInfoCard";
import EmployerScheduleGrid from "../../components/employer/WorkerManagePage/EmployerScheduleGrid";
import EmployerWorkerSearchCard from "../../components/employer/WorkerManagePage/EmployerWorkerSearchCard";
import EmployerNewWorkerWorkInfoCard from "../../components/employer/WorkerManagePage/EmployerNewWorkerWorkInfoCard";
import EmployerWorkplaceManageCard from "../../components/employer/WorkerManagePage/EmployerWorkplaceManageCard";
import LoadingDots from "../../components/common/LoadingDots";
import { useWorkplaceManagement } from "../../hooks/employer/useWorkplaceManagement";
import {
  parseWorkSchedules,
  parsePayrollDeduction,
  buildWeeklyScheduleGrid,
} from "../../utils/employer/workerManageUtils";
import type {
  Workplace,
  ContractWorker,
  Contract,
  WeeklySchedule,
  WeeklyScheduleGrid,
  WorkerData,
  WorkerWorkInfo,
  EditedWorkInfo,
  AddedWorkerInfo,
  SearchedWorker,
  PayrollDeductionType,
  WorkplaceDetails,
} from "../../types/employer/workerManagePageTypes";
import {
  getContractsByWorkplace,
  getContract,
  createContract,
  updateContract,
  deleteContract,
  getWorkerByCode,
} from "../../api/employerApi";

const daysOfWeek = ["일", "월", "화", "수", "목", "금", "토"];

export default function EmployerWorkerManagePage() {
  const {
    workplaces,
    selectedWorkplaceId,
    isAddingWorkplace,
    isManagingWorkplaces,
    selectedWorkplaceForEdit,
    editingWorkplace,
    newWorkplaceName,
    newWorkplaceAddress,
    newWorkplaceBusinessNumber,
    newWorkplaceIsSmallBusiness,
    setWorkplaces,
    setSelectedWorkplaceId,
    setIsAddingWorkplace,
    setIsManagingWorkplaces,
    setSelectedWorkplaceForEdit,
    setEditingWorkplace,
    setNewWorkplaceName,
    setNewWorkplaceAddress,
    setNewWorkplaceBusinessNumber,
    setNewWorkplaceIsSmallBusiness,
    handleManageWorkplaces,
    handleCancelManageWorkplaces,
    handleAddWorkplaceFromManage,
    handleAddWorkplace,
    handleCancelAddWorkplace,
    handleDeleteWorkplace,
    handleEditWorkplace,
    handleSaveWorkplaceEdit,
    handleCancelWorkplaceEdit,
    handleEditingWorkplaceChange,
  } = useWorkplaceManagement({
    onWorkplaceChanged: (workplaceId) => {
      // 새 근무지의 직원 목록 초기화
      setWorkersList((prev) => ({
        ...prev,
        [workplaceId]: [],
      }));
      setSelectedWorker(null);
    },
  });

  const [selectedWorker, setSelectedWorker] =
    useState<ContractWorker | null>(null);
  const [hoveredBlockGroup, setHoveredBlockGroup] = useState<string | null>(
    null
  );
  const [workersList, setWorkersList] = useState<
    Record<number, ContractWorker[]>
  >({});
  const [isWorkersLoading, setIsWorkersLoading] = useState(true);
  const [isEditingWork, setIsEditingWork] = useState(false);
  const [editedWorkInfo, setEditedWorkInfo] = useState<EditedWorkInfo | null>(
    null
  );
  // 수정된 근무 정보를 저장하는 상태
  const [updatedWorkInfo, setUpdatedWorkInfo] = useState<
    Record<string, WorkerWorkInfo>
  >({});
  // 추가된 근무자 정보를 저장하는 상태
  const [addedWorkerInfo, setAddedWorkerInfo] = useState<
    Record<string, AddedWorkerInfo>
  >({});
  // 근무자 추가 모드 상태
  const [isAddingWorker, setIsAddingWorker] = useState(false);
  const [workerCode, setWorkerCode] = useState("");
  const [searchedWorker, setSearchedWorker] = useState<SearchedWorker | null>(
    null
  );
  const [isSearching, setIsSearching] = useState(false);
  const [confirmedWorker, setConfirmedWorker] =
    useState<SearchedWorker | null>(null);
  const [newWorkerWorkInfo, setNewWorkerWorkInfo] =
    useState<AddedWorkerInfo | null>(null);

  // 근로자 목록 조회 함수 (재사용 가능하도록 분리)
  const fetchWorkers = async (
    workplaceId: number | null
  ): Promise<ContractWorker[]> => {
    if (!workplaceId) {
      setIsWorkersLoading(false);
      return [];
    }

    setIsWorkersLoading(true);
    try {
      const response = await getContractsByWorkplace(workplaceId);
      const contracts = (response.data || []) as ContractWorker[];
      setWorkersList((prev) => ({
        ...prev,
        [workplaceId]: contracts,
      }));
      return contracts;
    } catch (error) {
      // 에러 시 빈 배열 사용
      setWorkersList((prev) => ({
        ...prev,
        [workplaceId]: [],
      }));
      return [];
    } finally {
      setIsWorkersLoading(false);
    }
  };

  // 선택된 근무지의 근로자 목록 조회
  useEffect(() => {
    fetchWorkers(selectedWorkplaceId);
  }, [selectedWorkplaceId]);

  const resetAddWorkerFlow = () => {
    setWorkerCode("");
    setSearchedWorker(null);
    setConfirmedWorker(null);
    setNewWorkerWorkInfo(null);
  };

  const selectedWorkplace =
    workplaces.find((wp) => wp.id === selectedWorkplaceId)?.name || "";

  const workers = useMemo<ContractWorker[]>(() => {
    if (!selectedWorkplaceId) return [];
    return workersList[selectedWorkplaceId] || [];
  }, [selectedWorkplaceId, workersList]);

  // 선택된 직원이 없으면 첫 번째 직원을 기본 선택
  const currentWorker = useMemo(() => {
    // 근무자 추가 모드일 때는 null 반환
    if (isAddingWorker) {
      return null;
    }
    if (selectedWorker && workers.find((w) => w.id === selectedWorker.id)) {
      return selectedWorker;
    }
    return workers.length > 0 ? workers[0] : null;
  }, [selectedWorker, workers, isAddingWorker]);

  // 선택된 근로자의 전체 계약 정보 조회
  const [fullContractData, setFullContractData] = useState<Contract | null>(
    null
  );
  const [isContractLoading, setIsContractLoading] = useState(false);

  useEffect(() => {
    const fetchFullContract = async () => {
      if (!currentWorker?.id) {
        setFullContractData(null);
        setIsContractLoading(false);
        return;
      }

      setIsContractLoading(true);
      try {
        const response = await getContract(currentWorker.id);
        setFullContractData(response.data as Contract);
      } catch (error) {
        setFullContractData(null);
      } finally {
        setIsContractLoading(false);
      }
    };

    fetchFullContract();
  }, [currentWorker?.id]);

  const workerData = useMemo<WorkerData | null>(() => {
    if (!currentWorker || !fullContractData) {
      return null;
    }

    const contract = fullContractData;

    // 백엔드 workSchedules 파싱 및 변환
    const weeklySchedule = parseWorkSchedules(contract.workSchedules);

    // payrollDeductionType 파싱
    const { socialInsurance, withholdingTax } = parsePayrollDeduction(
      contract.payrollDeductionType
    );

    return {
      basicInfo: {
        name: contract.workerName,
        birthDate: "정보 없음", // 백엔드에서 제공하지 않음
        phone: contract.workerPhone || "-",
        email: "정보 없음", // 백엔드에서 제공하지 않음
      },
      workInfo: {
        workplace: selectedWorkplace,
        weeklySchedule: weeklySchedule,
        breakTime: 0, // 백엔드에서 제공하지 않음
        hourlyWage: Number(contract.hourlyWage) || 0,
        payday: contract.paymentDay || 25,
        socialInsurance: socialInsurance,
        withholdingTax: withholdingTax,
      },
    };
  }, [currentWorker, fullContractData, selectedWorkplace]);

  // 수정 중인 근무 정보 관리 (저장된 정보 우선, 수정 중이면 수정 중 정보)
  const currentWorkInfo = useMemo<WorkerWorkInfo | EditedWorkInfo | null>(() => {
    // 수정 모드일 때는 수정 중인 정보 사용
    if (
      isEditingWork &&
      editedWorkInfo &&
      editedWorkInfo.workerId === currentWorker?.id
    ) {
      return editedWorkInfo;
    }
    // 저장된 수정 정보가 있으면 그것을 사용
    const savedInfo =
      updatedWorkInfo[`${selectedWorkplace}-${currentWorker?.id}`];
    if (savedInfo) {
      return savedInfo;
    }
    // 기본 데이터 사용
    return workerData?.workInfo || null;
  }, [
    editedWorkInfo,
    currentWorker,
    workerData,
    isEditingWork,
    updatedWorkInfo,
    selectedWorkplace,
  ]);

  // 수정 모드 시작
  const handleStartEdit = () => {
    const workInfoToUse = currentWorkInfo || workerData?.workInfo;
    if (workInfoToUse && currentWorker) {
      // breakTime이 숫자면 요일별 객체로 변환
      const breakTime =
        typeof workInfoToUse.breakTime === "number"
          ? daysOfWeek.reduce<Record<string, number>>((acc, day) => {
              acc[day] = workInfoToUse.breakTime as number;
              return acc;
            }, {})
          : workInfoToUse.breakTime ||
            daysOfWeek.reduce<Record<string, number>>((acc, day) => {
              acc[day] = 0;
              return acc;
            }, {});

      setEditedWorkInfo({
        ...workInfoToUse,
        breakTime,
        workerId: currentWorker.id,
        workerName: currentWorker.workerName,
      });
      setIsEditingWork(true);
    }
  };

  // 수정 취소
  const handleCancelEdit = () => {
    setIsEditingWork(false);
    setEditedWorkInfo(null);
  };

  // 수정 저장
  const handleSaveEdit = async () => {
    if (editedWorkInfo && currentWorker) {
      // 급여 지급일 검증
      if (
        editedWorkInfo.payday &&
        (editedWorkInfo.payday < 1 || editedWorkInfo.payday > 31)
      ) {
        Swal.fire(
          "입력 오류",
          "급여 지급일은 1일에서 31일 사이여야 합니다.",
          "error"
        );
        return;
      }

      try {
        // weeklySchedule을 백엔드 형식으로 변환 (1=월요일, 7=일요일)
        const dayMapping = {
          월: 1,
          화: 2,
          수: 3,
          목: 4,
          금: 5,
          토: 6,
          일: 7,
        };

        const workSchedules = (
          Object.entries(editedWorkInfo.weeklySchedule || {}) as Array<
            [string, { start: string; end: string }]
          >
        )
          .filter(
            ([day, schedule]) => schedule && schedule.start && schedule.end
          )
          .map(([day, schedule]) => ({
            dayOfWeek: dayMapping[day as keyof typeof dayMapping],
            startTime: schedule.start,
            endTime: schedule.end,
          }));

        // payrollDeductionType 결정
        let payrollDeductionType: PayrollDeductionType = "PART_TIME_NONE";
        if (editedWorkInfo.socialInsurance && editedWorkInfo.withholdingTax) {
          payrollDeductionType = "PART_TIME_TAX_AND_INSURANCE";
        } else if (editedWorkInfo.socialInsurance) {
          payrollDeductionType = "PART_TIME_TAX_AND_INSURANCE";
        } else if (editedWorkInfo.withholdingTax) {
          payrollDeductionType = "PART_TIME_TAX_ONLY";
        }

        // 백엔드 API 요청 데이터
        const requestData = {
          hourlyWage: editedWorkInfo.hourlyWage,
          workSchedules: workSchedules,
          paymentDay: editedWorkInfo.payday,
          payrollDeductionType: payrollDeductionType,
        };

        // 백엔드 API 호출
        await updateContract(currentWorker.id, requestData);

        // 성공 시 근로자 목록 다시 조회
        await fetchWorkers(selectedWorkplaceId);

        // 전체 계약 정보도 다시 조회하여 UI에 즉시 반영
        const response = await getContract(currentWorker.id);
        setFullContractData(response.data as Contract);

        Swal.fire("저장 완료", "근무 정보가 수정되었습니다.", "success");
        setIsEditingWork(false);
        setEditedWorkInfo(null);
      } catch (error) {
        const err = error as { message?: string };
        Swal.fire(
          "수정 실패",
          err.message || "근무 정보 수정 중 오류가 발생했습니다.",
          "error"
        );
      }
    }
  };

  const handleWorkplaceChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;

    // 일반 근무지 선택 시 모든 모드 해제
    setIsAddingWorkplace(false);
    setIsManagingWorkplaces(false);
    setSelectedWorkplaceForEdit(null);
    setEditingWorkplace(null);
    const newWorkplaceId = Number(value);
    setSelectedWorkplaceId(newWorkplaceId);
    setSelectedWorker(null);
    setHoveredBlockGroup(null);
    // 근무지 변경 시 수정 모드 해제
    setIsEditingWork(false);
    setEditedWorkInfo(null);
    if (isAddingWorker) {
      resetAddWorkerFlow();
      setIsAddingWorker(false);
    }
  };





  const handleWorkerClick = (worker: ContractWorker) => {
    // 직원이 변경되면 수정 모드 해제
    if (editedWorkInfo?.workerId !== worker.id) {
      setIsEditingWork(false);
      setEditedWorkInfo(null);
    }
    if (isAddingWorker) {
      resetAddWorkerFlow();
      setIsAddingWorker(false);
    }
    setSelectedWorker(worker);
    setHoveredBlockGroup(null);
  };

  const handleCancelAddWorker = () => {
    resetAddWorkerFlow();
    setIsAddingWorker(false);
    setHoveredBlockGroup(null);
  };

  const handleDismissWorker = async () => {
    if (!currentWorker || !selectedWorkplaceId) return;

    const result = await Swal.fire({
      icon: "warning",
      title: `${currentWorker.workerName}님을 퇴사 처리하시겠습니까?`,
      text: "퇴사 처리된 직원은 목록에서 제거됩니다.",
      showCancelButton: true,
      confirmButtonText: "퇴사 처리",
      cancelButtonText: "취소",
      confirmButtonColor: "var(--color-red)",
    });

    if (result.isConfirmed) {
      try {
        // 백엔드 API 호출로 계약 종료
        await deleteContract(currentWorker.id);

        // UI 업데이트
        const workplaceId = selectedWorkplaceId;
        setWorkersList((prev) => {
          const updated = { ...prev };
          const workplaceWorkersList = [...(updated[workplaceId] || [])];
          const filtered = workplaceWorkersList.filter(
            (worker) => worker.id !== currentWorker.id
          );
          updated[workplaceId] = filtered;
          return updated;
        });

        // 퇴사 처리된 직원이 선택되어 있으면 선택 해제
        if (selectedWorker?.id === currentWorker.id) {
          setSelectedWorker(null);
        }

        Swal.fire(
          "퇴사 처리 완료",
          `${currentWorker.workerName}님이 퇴사 처리되었습니다.`,
          "success"
        );
      } catch (error) {
        const err = error as { message?: string };
        Swal.fire(
          "퇴사 처리 실패",
          err.message || "퇴사 처리 중 오류가 발생했습니다.",
          "error"
        );
      }
    }
  };

  // 근무자 코드로 검색
  const searchWorkerByCode = async (code: string) => {
    setIsSearching(true);

    try {
      const response = await getWorkerByCode(code);
      const workerData = response.data as SearchedWorker | null;
      setIsSearching(false);

      if (workerData && workerData.id) {
        // 백엔드 응답을 프론트엔드 형식으로 변환
        const worker = {
          id: workerData.id,
          name: workerData.name,
          phone: workerData.phone,
          workerCode: workerData.workerCode,
          bankName: workerData.bankName || "",
          accountNumber: workerData.accountNumber || "",
          kakaoPayLink: workerData.kakaoPayLink || "",
        };
        setSearchedWorker(worker);
      } else {
        Swal.fire("검색 실패", "해당 근무자 코드를 찾을 수 없습니다.", "error");
        setSearchedWorker(null);
      }
    } catch (error) {
      setIsSearching(false);
      const err = error as { error?: { message?: string } };
      Swal.fire(
        "검색 실패",
        err.error?.message || "해당 근무자 코드를 찾을 수 없습니다.",
        "error"
      );
      setSearchedWorker(null);
    }
  };

  const handleAddWorker = () => {
    resetAddWorkerFlow();
    setIsAddingWorker(true);
    setSelectedWorker(null);
    setHoveredBlockGroup(null);
  };

  const handleSearchWorker = () => {
    if (isSearching) return;
    if (!workerCode.trim()) {
      Swal.fire("입력 오류", "근무자 코드를 입력해주세요.", "warning");
      return;
    }
    searchWorkerByCode(workerCode.trim());
  };

  const handleConfirmWorker = () => {
    if (!searchedWorker) return;

    // 근무자 정보 확인 완료 (검색된 정보 그대로 사용)
    setConfirmedWorker(searchedWorker);

    // 기본 근무 정보 초기화
    setNewWorkerWorkInfo({
      workplace: selectedWorkplace,
      weeklySchedule: {},
      breakTime: {},
      hourlyWage: 10030,
      payday: 1,
      socialInsurance: false,
      withholdingTax: false,
    });
  };

  const handleSaveNewWorker = async () => {
    if (!confirmedWorker || !newWorkerWorkInfo || !selectedWorkplaceId) return;

    // 급여 지급일 검증
    if (
      newWorkerWorkInfo.payday &&
      (newWorkerWorkInfo.payday < 1 || newWorkerWorkInfo.payday > 31)
    ) {
      Swal.fire(
        "입력 오류",
        "급여 지급일은 1일에서 31일 사이여야 합니다.",
        "error"
      );
      return;
    }

    // 근무자 코드 확인
    if (!confirmedWorker.workerCode) {
      Swal.fire("오류", "근무자 코드가 없습니다.", "error");
      return;
    }

    try {
      // weeklySchedule을 백엔드 형식으로 변환 (1=월요일, 7=일요일)
      const dayMapping = {
        월: 1,
        화: 2,
        수: 3,
        목: 4,
        금: 5,
        토: 6,
        일: 7,
      };

      const workSchedules = (
        Object.entries(newWorkerWorkInfo.weeklySchedule || {}) as Array<
          [string, { start: string; end: string }]
        >
      )
        .filter(([day, schedule]) => schedule && schedule.start && schedule.end)
        .map(([day, schedule]) => ({
          dayOfWeek: dayMapping[day as keyof typeof dayMapping],
          startTime: schedule.start,
          endTime: schedule.end,
        }));

      // 근무 스케줄 검증
      if (workSchedules.length === 0) {
        Swal.fire(
          "입력 오류",
          "최소 1개 이상의 근무 스케줄을 등록해야 합니다.",
          "error"
        );
        return;
      }

      // payrollDeductionType 결정 (백엔드 Enum에 맞게 변환)
      let payrollDeductionType: PayrollDeductionType = "PART_TIME_NONE";
      if (
        newWorkerWorkInfo.socialInsurance &&
        newWorkerWorkInfo.withholdingTax
      ) {
        payrollDeductionType = "PART_TIME_TAX_AND_INSURANCE";
      } else if (newWorkerWorkInfo.socialInsurance) {
        // 4대보험만 적용하는 경우는 백엔드 Enum에 없으므로 세금도 함께 적용
        payrollDeductionType = "PART_TIME_TAX_AND_INSURANCE";
      } else if (newWorkerWorkInfo.withholdingTax) {
        payrollDeductionType = "PART_TIME_TAX_ONLY";
      }

      // 계약 시작일 (오늘 날짜)
      const today = new Date();
      const contractStartDate =
        new Date(
          today.getTime() - today.getTimezoneOffset() * 60000
        )
          .toISOString()
          .split("T")[0] ?? today.toISOString();

      // 백엔드 API 요청 데이터
      const requestData = {
        workerCode: confirmedWorker.workerCode,
        hourlyWage: newWorkerWorkInfo.hourlyWage || 10030,
        workSchedules: workSchedules,
        contractStartDate: contractStartDate,
        contractEndDate: null,
        paymentDay: newWorkerWorkInfo.payday || 25,
        payrollDeductionType: payrollDeductionType,
      };

      // 백엔드 API 호출
      const response = await createContract(
        selectedWorkplaceId,
        requestData
      );
      const createdContract = response.data as { id: number };

      // 성공 시 백엔드에서 최신 근로자 목록 다시 조회
      const workers = await fetchWorkers(selectedWorkplaceId);

      Swal.fire(
        "추가 완료",
        `${confirmedWorker.name}님이 추가되었습니다.`,
        "success"
      );

      resetAddWorkerFlow();
      setIsAddingWorker(false);

      // 추가된 근무자 선택 (완전한 객체 사용)
      const foundWorker = workers.find((w) => w.id === createdContract.id);
      if (foundWorker) {
        setSelectedWorker(foundWorker);
      }
    } catch (error) {
      const err = error as { error?: { message?: string } };
      Swal.fire(
        "추가 실패",
        err.error?.message || "근무자 추가 중 오류가 발생했습니다.",
        "error"
      );
    }
  };

  // 주간 스케줄 그리드 데이터 생성 (수정된 정보 반영)
  const weeklyScheduleGrid = useMemo<WeeklyScheduleGrid>(() => {
    // 근무자 추가 모드일 때는 newWorkerWorkInfo 사용
    let workInfoToUse: WorkerWorkInfo | null | undefined;
    if (isAddingWorker && newWorkerWorkInfo) {
      workInfoToUse = newWorkerWorkInfo as WorkerWorkInfo;
    } else {
      workInfoToUse = currentWorkInfo as WorkerWorkInfo | null;
    }

    return buildWeeklyScheduleGrid(workInfoToUse);
  }, [workerData, currentWorkInfo, isAddingWorker, newWorkerWorkInfo]);

  const handleHoverBlock = (blockGroupId: string | null, _hour: number | null) => {
    setHoveredBlockGroup(blockGroupId);
  };

  const isLoading = isWorkersLoading || isContractLoading;

  if (isLoading) {
    return <LoadingDots fillParent />;
  }

  return (
    <div className="worker-manage-page">
      {/* 왼쪽 사이드바 */}
      {!isManagingWorkplaces && (
        <div className="worker-manage-left-panel">
          <div className="worker-manage-workplace-select">
            <select
              value={selectedWorkplaceId ?? ""}
              onChange={handleWorkplaceChange}
            >
              {workplaces.map((wp) => (
                <option key={wp.id} value={wp.id}>
                  {wp.name}
                </option>
              ))}
            </select>
          </div>

          {!isAddingWorkplace && !isManagingWorkplaces && (
            <>
              <div className="worker-manage-worker-list">
                {workers.map((worker) => (
                  <div
                    key={worker.id}
                    className={`worker-item ${
                      currentWorker?.id === worker.id ? "selected" : ""
                    }`}
                    onClick={() => handleWorkerClick(worker)}
                  >
                    {worker.workerName}
                  </div>
                ))}
              </div>

              <button
                type="button"
                className="add-worker-button"
                onClick={handleAddWorker}
              >
                근무자 추가
              </button>
            </>
          )}

          {!isAddingWorkplace && !isManagingWorkplaces && (
            <button
              type="button"
              className="manage-workplace-button"
              onClick={handleManageWorkplaces}
            >
              근무지 관리
            </button>
          )}
        </div>
      )}

      {/* 중앙 콘텐츠 영역 */}
      <div
        className={`worker-manage-center-panel ${
          isAddingWorkplace || isManagingWorkplaces ? "adding-workplace" : ""
        }`}
      >
        {isManagingWorkplaces ? (
          <EmployerWorkplaceManageCard
            workplaces={workplaces}
            selectedWorkplaceForEdit={selectedWorkplaceForEdit}
            editingWorkplace={editingWorkplace}
            onEditWorkplace={handleEditWorkplace}
            onCancelEdit={handleCancelWorkplaceEdit}
            onSaveEdit={() =>
              handleSaveWorkplaceEdit(
                addedWorkerInfo,
                setAddedWorkerInfo,
                updatedWorkInfo,
                setUpdatedWorkInfo
              )
            }
            onAddWorkplace={handleAddWorkplaceFromManage}
            onClose={handleCancelManageWorkplaces}
            onEditingWorkplaceChange={handleEditingWorkplaceChange}
          />
        ) : isAddingWorkplace ? (
          <EmployerWorkplaceForm
            title="근무지 추가"
            formData={{
              name: newWorkplaceName,
              address: newWorkplaceAddress,
              businessNumber: newWorkplaceBusinessNumber,
              isSmallBusiness: newWorkplaceIsSmallBusiness,
            }}
            onFormDataChange={(data) => {
              setNewWorkplaceName(data.name || "");
              setNewWorkplaceAddress(data.address || "");
              setNewWorkplaceBusinessNumber(data.businessNumber || "");
              setNewWorkplaceIsSmallBusiness(data.isSmallBusiness || false);
            }}
            onCancel={handleCancelAddWorkplace}
            onSave={handleAddWorkplace}
            cancelButtonText="뒤로 가기"
            saveButtonText="추가"
            autoFocus={true}
          />
        ) : isAddingWorker ? (
          <>
            <EmployerWorkerSearchCard
              workerCode={workerCode}
              onWorkerCodeChange={setWorkerCode}
              onSearch={handleSearchWorker}
              searchedWorker={searchedWorker}
              onConfirm={handleConfirmWorker}
              isSearching={isSearching}
            />

            {confirmedWorker && newWorkerWorkInfo && (
              <EmployerNewWorkerWorkInfoCard
                confirmedWorker={confirmedWorker}
                workInfo={newWorkerWorkInfo}
                onWorkInfoChange={(info) => setNewWorkerWorkInfo(info)}
                onCancel={handleCancelAddWorker}
                onSave={handleSaveNewWorker}
                selectedWorkplace={selectedWorkplace}
              />
            )}
          </>
        ) : workerData ? (
          <>
            {/* 기본 정보 카드 */}
            <EmployerBasicInfoCard
              workerData={workerData}
              onDismiss={handleDismissWorker}
            />

            {/* 근무 정보 카드 */}
            <EmployerWorkInfoCard
              workerData={workerData}
              currentWorkInfo={currentWorkInfo}
              isEditingWork={isEditingWork}
              onStartEdit={handleStartEdit}
              onSaveEdit={handleSaveEdit}
              onCancelEdit={handleCancelEdit}
              onUpdateWorkInfo={(updates) =>
                setEditedWorkInfo((prev) => (prev ? { ...prev, ...updates } : prev))
              }
            />
          </>
        ) : (
          <div className="no-worker-selected">직원을 선택해주세요.</div>
        )}
      </div>

      {/* 오른쪽 스케줄 그리드 */}
      {!isAddingWorkplace && !isManagingWorkplaces && (
        <EmployerScheduleGrid
          weeklyScheduleGrid={weeklyScheduleGrid}
          hoveredBlockGroup={hoveredBlockGroup}
          onHoverBlock={handleHoverBlock}
          currentWorkInfo={currentWorkInfo}
          workerData={workerData}
          isAddingWorker={isAddingWorker}
          newWorkerWorkInfo={newWorkerWorkInfo}
        />
      )}
    </div>
  );
}
