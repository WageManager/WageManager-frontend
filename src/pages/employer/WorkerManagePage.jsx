import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaUser, FaTimes } from "react-icons/fa";
import Swal from "sweetalert2";
import "../../styles/workerManagePage.css";
import { formatKRW } from "../../utils/formatUtils";
import EmployerTimeInput from "./components/EmployerTimeInput";
import EmployerBasicInfoCard from "./components/EmployerBasicInfoCard";
import EmployerWorkplaceForm from "./components/EmployerWorkplaceForm";
import EmployerScheduleGrid from "./components/EmployerScheduleGrid";
import {
  getWorkplaces,
  createWorkplace,
  updateWorkplace,
  deleteWorkplace,
  getContractsByWorkplace,
  getContract,
  createContract,
  updateContract,
  deleteContract,
  getWorkerByCode,
} from "../../api/employerApi";

const daysOfWeek = ["일", "월", "화", "수", "목", "금", "토"];

export default function WorkerManagePage() {
  const navigate = useNavigate();
  const [workplaces, setWorkplaces] = useState([]);
  const [selectedWorkplaceId, setSelectedWorkplaceId] = useState(null);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [hoveredBlockGroup, setHoveredBlockGroup] = useState(null);
  const [workersList, setWorkersList] = useState({});
  const [isEditingWork, setIsEditingWork] = useState(false);
  const [editedWorkInfo, setEditedWorkInfo] = useState(null);
  // 수정된 근무 정보를 저장하는 상태
  const [updatedWorkInfo, setUpdatedWorkInfo] = useState({});
  // 추가된 근무자 정보를 저장하는 상태
  const [addedWorkerInfo, setAddedWorkerInfo] = useState({});
  // 근무자 추가 모드 상태
  const [isAddingWorker, setIsAddingWorker] = useState(false);
  const [workerCode, setWorkerCode] = useState("");
  const [searchedWorker, setSearchedWorker] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [confirmedWorker, setConfirmedWorker] = useState(null);
  const [newWorkerWorkInfo, setNewWorkerWorkInfo] = useState(null);
  // 근무지 추가 모드 상태
  const [isAddingWorkplace, setIsAddingWorkplace] = useState(false);
  const [newWorkplaceName, setNewWorkplaceName] = useState("");
  const [newWorkplaceAddress, setNewWorkplaceAddress] = useState("");
  const [newWorkplaceBusinessNumber, setNewWorkplaceBusinessNumber] =
    useState("");
  const [newWorkplaceIsSmallBusiness, setNewWorkplaceIsSmallBusiness] =
    useState(false);
  // 근무지 관리 모드 상태
  const [isManagingWorkplaces, setIsManagingWorkplaces] = useState(false);
  const [selectedWorkplaceForEdit, setSelectedWorkplaceForEdit] =
    useState(null);
  const [editingWorkplace, setEditingWorkplace] = useState(null);

  // 근무지 목록 조회
  useEffect(() => {
    const fetchWorkplaces = async () => {
      try {
        const response = await getWorkplaces();
        const workplacesData = response.data || [];
        setWorkplaces(workplacesData);
        if (workplacesData.length > 0 && !selectedWorkplaceId) {
          setSelectedWorkplaceId(workplacesData[0].id);
        }
      } catch (error) {
        // 에러 시 빈 배열 사용
        setWorkplaces([]);
      }
    };
    fetchWorkplaces();
  }, []);

  // 근로자 목록 조회 함수 (재사용 가능하도록 분리)
  const fetchWorkers = async (workplaceId) => {
    if (!workplaceId) return [];

    try {
      const response = await getContractsByWorkplace(workplaceId);
      const contracts = response.data || [];
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

  const workers = useMemo(() => {
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
  const [fullContractData, setFullContractData] = useState(null);

  useEffect(() => {
    const fetchFullContract = async () => {
      if (!currentWorker?.id) {
        setFullContractData(null);
        return;
      }

      try {
        const response = await getContract(currentWorker.id);
        setFullContractData(response.data);
      } catch (error) {
        setFullContractData(null);
      }
    };

    fetchFullContract();
  }, [currentWorker?.id]);

  const workerData = useMemo(() => {
    if (!currentWorker || !fullContractData) {
      return null;
    }

    // fullContractData에 전체 계약 정보가 있음
    const contract = fullContractData;

    // workSchedules JSON 파싱
    let weeklySchedule = {};
    try {
      if (contract.workSchedules) {
        const schedules =
          typeof contract.workSchedules === "string"
            ? JSON.parse(contract.workSchedules)
            : contract.workSchedules;

        // dayOfWeek(1-7, 1=월요일, 7=일요일) -> 한글 요일로 변환
        const dayMapping = {
          1: "월",
          2: "화",
          3: "수",
          4: "목",
          5: "금",
          6: "토",
          7: "일",
        };

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
      // workSchedules 파싱 실패 무시
    }

    // payrollDeductionType에서 보험/세금 정보 추출
    const deductionType = contract.payrollDeductionType || "PART_TIME_NONE";
    const socialInsurance = deductionType.includes("INSURANCE");
    const withholdingTax = deductionType.includes("TAX");

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
  const currentWorkInfo = useMemo(() => {
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
          ? daysOfWeek.reduce((acc, day) => {
              acc[day] = workInfoToUse.breakTime;
              return acc;
            }, {})
          : workInfoToUse.breakTime ||
            daysOfWeek.reduce((acc, day) => {
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

        const workSchedules = Object.entries(
          editedWorkInfo.weeklySchedule || {}
        )
          .filter(
            ([day, schedule]) => schedule && schedule.start && schedule.end
          )
          .map(([day, schedule]) => ({
            dayOfWeek: dayMapping[day],
            startTime: schedule.start,
            endTime: schedule.end,
          }));

        // payrollDeductionType 결정
        let payrollDeductionType = "PART_TIME_NONE";
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
        setFullContractData(response.data);

        Swal.fire("저장 완료", "근무 정보가 수정되었습니다.", "success");
        setIsEditingWork(false);
        setEditedWorkInfo(null);
      } catch (error) {
        Swal.fire(
          "수정 실패",
          error.message || "근무 정보 수정 중 오류가 발생했습니다.",
          "error"
        );
      }
    }
  };

  const handleWorkplaceChange = (e) => {
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

  const handleManageWorkplaces = () => {
    setIsManagingWorkplaces(true);
    setIsAddingWorkplace(false);
    setSelectedWorkplaceForEdit(null);
    setEditingWorkplace(null);
  };

  const handleCancelManageWorkplaces = () => {
    setIsManagingWorkplaces(false);
    setSelectedWorkplaceForEdit(null);
    setEditingWorkplace(null);
  };

  const handleAddWorkplaceFromManage = () => {
    setIsManagingWorkplaces(false);
    setIsAddingWorkplace(true);
    setSelectedWorkplaceForEdit(null);
    setEditingWorkplace(null);
    setNewWorkplaceName("");
    setNewWorkplaceAddress("");
    setNewWorkplaceBusinessNumber("");
    setNewWorkplaceIsSmallBusiness(false);
  };

  const handleAddWorkplace = async () => {
    // 근무지 이름 검증
    if (!newWorkplaceName.trim()) {
      Swal.fire("입력 오류", "근무지 이름을 입력해주세요.", "error");
      return;
    }

    // 중복 확인
    if (workplaces.some((wp) => wp.name === newWorkplaceName.trim())) {
      Swal.fire("입력 오류", "이미 존재하는 근무지입니다.", "error");
      return;
    }

    try {
      // 백엔드에 근무지 생성 요청
      const response = await createWorkplace({
        businessName: newWorkplaceName.trim(),
        workplaceName: newWorkplaceName.trim(),
        address: newWorkplaceAddress.trim(),
        businessNumber: newWorkplaceBusinessNumber.trim(),
        isLessThanFiveEmployees: newWorkplaceIsSmallBusiness,
      });
      const createdWorkplace = response.data;

      // UI 업데이트
      setWorkplaces((prev) => [...prev, createdWorkplace]);

      // 새 근무지의 직원 목록 초기화
      setWorkersList((prev) => ({
        ...prev,
        [createdWorkplace.id]: [],
      }));

      // 새 근무지 선택
      setSelectedWorkplaceId(createdWorkplace.id);
      setSelectedWorker(null);
      setIsAddingWorkplace(false);
      setNewWorkplaceName("");
      setNewWorkplaceAddress("");
      setNewWorkplaceBusinessNumber("");
      setNewWorkplaceIsSmallBusiness(false);

      Swal.fire(
        "추가 완료",
        `${newWorkplaceName.trim()}이(가) 추가되었습니다.`,
        "success"
      );
    } catch (error) {
      Swal.fire(
        "추가 실패",
        error.message || "근무지 추가 중 오류가 발생했습니다.",
        "error"
      );
    }
  };

  const handleCancelAddWorkplace = () => {
    setIsAddingWorkplace(false);
    setNewWorkplaceName("");
    setNewWorkplaceAddress("");
    setNewWorkplaceBusinessNumber("");
    setNewWorkplaceIsSmallBusiness(false);
  };

  const handleDeleteWorkplace = () => {
    if (!selectedWorkplaceId) return;

    const workplaceToDelete = workplaces.find(
      (wp) => wp.id === selectedWorkplaceId
    );
    if (!workplaceToDelete) return;

    Swal.fire({
      title: "근무지 삭제",
      text: `${workplaceToDelete.name}을(를) 삭제하시겠습니까?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "var(--color-red)",
      cancelButtonColor: "var(--color-main)",
      confirmButtonText: "삭제",
      cancelButtonText: "취소",
    }).then(async (result) => {
      if (result.isConfirmed) {
        if (isAddingWorker) {
          resetAddWorkerFlow();
          setIsAddingWorker(false);
          setHoveredBlockGroup(null);
        }

        // 삭제할 근무지가 없으면 종료
        const updatedWorkplaces = workplaces.filter(
          (wp) => wp.id !== selectedWorkplaceId
        );
        if (updatedWorkplaces.length === 0) {
          Swal.fire("오류", "최소 하나의 근무지는 필요합니다.", "error");
          return;
        }

        try {
          // 백엔드에 삭제 요청
          await deleteWorkplace(selectedWorkplaceId);

          // UI 업데이트
          setWorkplaces(updatedWorkplaces);

          // workersList에서 해당 근무지 제거
          setWorkersList((prev) => {
            const updated = { ...prev };
            delete updated[selectedWorkplaceId];
            return updated;
          });

          // addedWorkerInfo에서 해당 근무지 관련 정보 제거
          setAddedWorkerInfo((prev) => {
            const updated = { ...prev };
            Object.keys(updated).forEach((key) => {
              if (key.startsWith(`${workplaceToDelete.name}::`)) {
                delete updated[key];
              }
            });
            return updated;
          });

          // updatedWorkInfo에서 해당 근무지 관련 정보 제거
          setUpdatedWorkInfo((prev) => {
            const updated = { ...prev };
            Object.keys(updated).forEach((key) => {
              if (key.startsWith(`${workplaceToDelete.name}-`)) {
                delete updated[key];
              }
            });
            return updated;
          });

          // 삭제된 근무지가 선택되어 있으면 첫 번째 근무지 선택
          const newSelectedWorkplaceId = updatedWorkplaces[0].id;
          setSelectedWorkplaceId(newSelectedWorkplaceId);
          setSelectedWorker(null);
          setIsAddingWorkplace(false);
          setIsEditingWork(false);
          setEditedWorkInfo(null);

          Swal.fire(
            "삭제 완료",
            `${workplaceToDelete.name}이(가) 삭제되었습니다.`,
            "success"
          );
        } catch (error) {
          Swal.fire(
            "삭제 실패",
            error.message || "근무지 삭제 중 오류가 발생했습니다.",
            "error"
          );
        }
      }
    });
  };

  const handleEditWorkplace = (workplace) => {
    setEditingWorkplace({
      id: workplace.id,
      name: workplace.name || "",
      address: workplace.address || "",
      businessNumber: workplace.businessNumber || "",
      isSmallBusiness: workplace.isSmallBusiness || false,
    });
    setSelectedWorkplaceForEdit(workplace.id);
  };

  const handleSaveWorkplaceEdit = async () => {
    if (!editingWorkplace) return;

    // 근무지 이름 검증
    if (!editingWorkplace.name.trim()) {
      Swal.fire("입력 오류", "근무지 이름을 입력해주세요.", "error");
      return;
    }

    // 중복 확인 (자기 자신 제외)
    const isDuplicate = workplaces.some(
      (wp) =>
        wp.name === editingWorkplace.name.trim() &&
        wp.id !== editingWorkplace.id
    );
    if (isDuplicate) {
      Swal.fire("입력 오류", "이미 존재하는 근무지입니다.", "error");
      return;
    }

    try {
      // 백엔드에 수정 요청
      await updateWorkplace(editingWorkplace.id, {
        businessName: editingWorkplace.name.trim(),
        workplaceName: editingWorkplace.name.trim(),
        address: editingWorkplace.address.trim(),
        isLessThanFiveEmployees: editingWorkplace.isSmallBusiness,
      });

      // UI 업데이트
      setWorkplaces((prev) =>
        prev.map((wp) =>
          wp.id === editingWorkplace.id
            ? {
                ...wp,
                name: editingWorkplace.name.trim(),
                address: editingWorkplace.address.trim(),
                businessNumber: editingWorkplace.businessNumber.trim(),
                isSmallBusiness: editingWorkplace.isSmallBusiness,
              }
            : wp
        )
      );

      // 이름이 변경된 경우 workersList, addedWorkerInfo, updatedWorkInfo의 키도 업데이트
      const oldWorkplace = workplaces.find(
        (wp) => wp.id === editingWorkplace.id
      );
      if (oldWorkplace && oldWorkplace.name !== editingWorkplace.name.trim()) {
        // workersList는 ID 기반이므로 변경 불필요
        // addedWorkerInfo와 updatedWorkInfo는 이름 기반 키를 사용하므로 업데이트 필요
        setAddedWorkerInfo((prev) => {
          const updated = {};
          Object.keys(prev).forEach((key) => {
            if (key.startsWith(`${oldWorkplace.name}::`)) {
              const newKey = key.replace(
                `${oldWorkplace.name}::`,
                `${editingWorkplace.name.trim()}::`
              );
              updated[newKey] = prev[key];
            } else {
              updated[key] = prev[key];
            }
          });
          return updated;
        });

        setUpdatedWorkInfo((prev) => {
          const updated = {};
          Object.keys(prev).forEach((key) => {
            if (key.startsWith(`${oldWorkplace.name}-`)) {
              const newKey = key.replace(
                `${oldWorkplace.name}-`,
                `${editingWorkplace.name.trim()}-`
              );
              updated[newKey] = prev[key];
            } else {
              updated[key] = prev[key];
            }
          });
          return updated;
        });
      }

      setEditingWorkplace(null);
      setSelectedWorkplaceForEdit(null);

      Swal.fire("수정 완료", "근무지 정보가 수정되었습니다.", "success");
    } catch (error) {
      Swal.fire(
        "수정 실패",
        error.message || "근무지 수정 중 오류가 발생했습니다.",
        "error"
      );
    }
  };

  const handleCancelWorkplaceEdit = () => {
    setEditingWorkplace(null);
    setSelectedWorkplaceForEdit(null);
  };

  const handleWorkerClick = (worker) => {
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
    if (!currentWorker) return;

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
        setWorkersList((prev) => {
          const updated = { ...prev };
          const workplaceWorkersList = [
            ...(updated[selectedWorkplaceId] || []),
          ];
          const filtered = workplaceWorkersList.filter(
            (worker) => worker.id !== currentWorker.id
          );
          updated[selectedWorkplaceId] = filtered;
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
        Swal.fire(
          "퇴사 처리 실패",
          error.message || "퇴사 처리 중 오류가 발생했습니다.",
          "error"
        );
      }
    }
  };

  // 근무자 코드로 검색
  const searchWorkerByCode = async (code) => {
    setIsSearching(true);

    try {
      const response = await getWorkerByCode(code);
      const workerData = response.data;
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
      Swal.fire(
        "검색 실패",
        error.error?.message || "해당 근무자 코드를 찾을 수 없습니다.",
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
    if (!confirmedWorker || !newWorkerWorkInfo) return;

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

      const workSchedules = Object.entries(
        newWorkerWorkInfo.weeklySchedule || {}
      )
        .filter(([day, schedule]) => schedule && schedule.start && schedule.end)
        .map(([day, schedule]) => ({
          dayOfWeek: dayMapping[day],
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
      let payrollDeductionType = "PART_TIME_NONE";
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
      const contractStartDate = today.toISOString().split("T")[0];

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
      const createdContract = response.data;

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
      Swal.fire(
        "추가 실패",
        error.error?.message || "근무자 추가 중 오류가 발생했습니다.",
        "error"
      );
    }
  };

  // 주간 스케줄 그리드 데이터 생성 (수정된 정보 반영)
  const weeklyScheduleGrid = useMemo(() => {
    // 근무자 추가 모드일 때는 newWorkerWorkInfo 사용
    let workInfoToUse;
    if (isAddingWorker && newWorkerWorkInfo) {
      workInfoToUse = newWorkerWorkInfo;
    } else {
      workInfoToUse = currentWorkInfo || workerData?.workInfo;
    }

    if (!workInfoToUse?.weeklySchedule) {
      return {};
    }

    const schedule = workInfoToUse.weeklySchedule;
    const grid = {};

    // 먼저 모든 요일을 초기화
    daysOfWeek.forEach((day) => {
      grid[day] = [];
    });

    // 각 요일의 스케줄 처리
    daysOfWeek.forEach((day, dayIndex) => {
      if (schedule[day] && schedule[day].start && schedule[day].end) {
        const { start, end } = schedule[day];
        const [startHour, startMin] = start.split(":").map(Number);
        const [endHour, endMin] = end.split(":").map(Number);
        const startDecimal = startHour + startMin / 60;
        let endDecimal = endHour + endMin / 60;

        // 익일 근무인지 확인 (end가 start보다 작거나 같으면 익일)
        const crossesMidnight = endDecimal <= startDecimal;

        if (crossesMidnight) {
          // 익일 근무인 경우
          // 1. 당일 블록: start부터 24:00까지
          const groupId = `${day}-0`;
          grid[day].push({
            start: startDecimal,
            end: 24,
            startTime: start,
            endTime: "24:00",
            startHour,
            startMin,
            endHour: 24,
            endMin: 0,
            groupId,
            crossesMidnight: true,
            isFirstPart: true,
          });

          // 2. 다음 날 블록: 00:00부터 end까지
          const nextDayIndex = (dayIndex + 1) % 7;
          const nextDay = daysOfWeek[nextDayIndex];
          const nextDayGroupId = `${day}-0`; // 같은 그룹 ID 사용 (연속된 블록)
          grid[nextDay].push({
            start: 0,
            end: endDecimal,
            startTime: "00:00",
            endTime: end,
            startHour: 0,
            startMin: 0,
            endHour,
            endMin,
            groupId: nextDayGroupId,
            crossesMidnight: true,
            isSecondPart: true,
            originalDay: day, // 원래 시작한 요일 저장
          });
        } else {
          // 일반 근무인 경우
          const groupId = `${day}-0`;
          grid[day].push({
            start: startDecimal,
            end: endDecimal,
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
      }
    });

    return grid;
  }, [workerData, currentWorkInfo, isAddingWorker, newWorkerWorkInfo]);

  return (
    <div className="worker-manage-page">
      {/* 왼쪽 사이드바 */}
      {!isManagingWorkplaces && (
        <div className="worker-manage-left-panel">
          <div className="worker-manage-workplace-select">
            <select
              value={selectedWorkplaceId}
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
          <div className="workplace-manage-container">
            <div className="info-card">
              <div className="info-card-header">
                <h3 className="info-card-title">근무지 목록</h3>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    type="button"
                    className="add-button-large"
                    onClick={handleAddWorkplaceFromManage}
                  >
                    근무지 추가
                  </button>
                  <button
                    type="button"
                    className="cancel-button"
                    onClick={handleCancelManageWorkplaces}
                  >
                    닫기
                  </button>
                </div>
              </div>
              <div className="info-card-content">
                <div className="workplace-list">
                  {workplaces.map((workplace) => (
                    <div
                      key={workplace.id}
                      className={`workplace-list-item ${
                        selectedWorkplaceForEdit === workplace.id
                          ? "selected"
                          : ""
                      }`}
                      onClick={() => handleEditWorkplace(workplace)}
                    >
                      <div className="workplace-list-name">
                        {workplace.name}
                      </div>
                      {selectedWorkplaceForEdit === workplace.id && (
                        <div className="workplace-list-details">
                          <div className="info-field">
                            <label className="info-label">주소</label>
                            <div className="info-value">
                              {workplace.address || "-"}
                            </div>
                          </div>
                          <div className="info-field">
                            <label className="info-label">
                              사업자 등록 번호
                            </label>
                            <div className="info-value">
                              {workplace.businessNumber || "-"}
                            </div>
                          </div>
                          <div className="info-field">
                            <label className="info-label">
                              5인 미만 사업장
                            </label>
                            <div className="info-value">
                              {workplace.isSmallBusiness ? "예" : "아니오"}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {editingWorkplace && (
              <EmployerWorkplaceForm
                title="근무지 수정"
                formData={editingWorkplace}
                onFormDataChange={setEditingWorkplace}
                onCancel={handleCancelWorkplaceEdit}
                onSave={handleSaveWorkplaceEdit}
                cancelButtonText="취소"
                saveButtonText="저장"
              />
            )}
          </div>
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
            {/* 근무자 코드 검색 카드 */}
            <div className="info-card">
              <div className="info-card-header">
                <h3 className="info-card-title">근무자 코드</h3>
              </div>
              <div className="info-card-content">
                <div className="info-field">
                  <label className="info-label">근무자 코드</label>
                  <div className="search-input-group">
                    <input
                      type="text"
                      className="worker-code-input"
                      value={workerCode}
                      onChange={(e) => setWorkerCode(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleSearchWorker();
                        }
                      }}
                      placeholder="근무자 코드를 입력하세요"
                    />
                    <button
                      type="button"
                      className="search-button"
                      onClick={handleSearchWorker}
                      disabled={isSearching}
                    >
                      {isSearching ? "검색 중..." : "검색"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 근무자 정보 확인 카드 */}
            {searchedWorker && (
              <div className="info-card">
                <div className="info-card-header">
                  <h3 className="info-card-title">근무자 정보</h3>
                </div>
                <div className="info-card-content">
                  <div className="basic-info-header">
                    <div className="profile-icon">
                      <FaUser />
                    </div>
                    <div className="worker-info-display">
                      <div className="info-field">
                        <label className="info-label">이름</label>
                        <div className="info-value">{searchedWorker.name}</div>
                      </div>
                      <div className="info-field">
                        <label className="info-label">전화번호</label>
                        <div className="info-value">
                          {searchedWorker.phone || "-"}
                        </div>
                      </div>
                      <div className="info-field">
                        <label className="info-label">근무자 코드</label>
                        <div className="info-value">
                          {searchedWorker.workerCode}
                        </div>
                      </div>
                    </div>
                    <div className="confirm-buttons">
                      <button
                        type="button"
                        className="confirm-button"
                        onClick={handleConfirmWorker}
                      >
                        확인
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 근무 정보 설정 카드 */}
            {confirmedWorker && newWorkerWorkInfo && (
              <div className="info-card">
                <div className="info-card-header">
                  <h3 className="info-card-title">근무 정보</h3>
                </div>
                <div className="info-card-content">
                  <div className="info-field">
                    <label className="info-label">근무지</label>
                    <div className="info-value">{selectedWorkplace}</div>
                  </div>

                  {/* 근무 시간 설정 */}
                  <div className="info-field">
                    <label className="info-label">근무 시간</label>
                    <div className="weekly-schedule-inputs">
                      {daysOfWeek.map((day) => {
                        const schedule =
                          newWorkerWorkInfo.weeklySchedule?.[day];
                        return (
                          <div key={day} className="day-schedule-row">
                            <span className="day-label-small">{day}요일</span>
                            <div className="time-wheel-wrapper">
                              {schedule ? (
                                <>
                                  <EmployerTimeInput
                                    value={schedule.start || "00:00"}
                                    onChange={(val) => {
                                      setNewWorkerWorkInfo({
                                        ...newWorkerWorkInfo,
                                        weeklySchedule: {
                                          ...newWorkerWorkInfo.weeklySchedule,
                                          [day]: {
                                            ...schedule,
                                            start: val,
                                          },
                                        },
                                      });
                                    }}
                                  />
                                  <span className="time-separator">~</span>
                                  <EmployerTimeInput
                                    value={schedule.end || "00:00"}
                                    onChange={(val) => {
                                      setNewWorkerWorkInfo({
                                        ...newWorkerWorkInfo,
                                        weeklySchedule: {
                                          ...newWorkerWorkInfo.weeklySchedule,
                                          [day]: {
                                            ...schedule,
                                            end: val,
                                          },
                                        },
                                      });
                                    }}
                                    allowMidnight
                                  />
                                  {(() => {
                                    const [startHour, startMin] = (
                                      schedule.start || "00:00"
                                    )
                                      .split(":")
                                      .map(Number);
                                    const [endHour, endMin] = (
                                      schedule.end || "00:00"
                                    )
                                      .split(":")
                                      .map(Number);
                                    const startDecimal =
                                      startHour + startMin / 60;
                                    const endDecimal = endHour + endMin / 60;
                                    const crossesMidnight =
                                      endDecimal <= startDecimal;
                                    return crossesMidnight ? (
                                      <span className="overnight-label">
                                        (익일)
                                      </span>
                                    ) : null;
                                  })()}
                                  <button
                                    type="button"
                                    className="remove-schedule-button-x"
                                    onClick={() => {
                                      const updatedSchedule = {
                                        ...newWorkerWorkInfo.weeklySchedule,
                                      };
                                      delete updatedSchedule[day];
                                      setNewWorkerWorkInfo({
                                        ...newWorkerWorkInfo,
                                        weeklySchedule: updatedSchedule,
                                      });
                                    }}
                                    title="삭제"
                                  >
                                    <FaTimes />
                                  </button>
                                </>
                              ) : (
                                <button
                                  type="button"
                                  className="add-schedule-button"
                                  onClick={() => {
                                    setNewWorkerWorkInfo({
                                      ...newWorkerWorkInfo,
                                      weeklySchedule: {
                                        ...newWorkerWorkInfo.weeklySchedule,
                                        [day]: { start: "09:00", end: "18:00" },
                                      },
                                    });
                                  }}
                                >
                                  근무 추가
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 휴게 시간 설정 */}
                  <div className="info-field">
                    <label className="info-label">휴게 시간</label>
                    <div className="break-time-by-day">
                      {daysOfWeek.map((day) => {
                        const breakTime =
                          typeof newWorkerWorkInfo.breakTime === "object"
                            ? newWorkerWorkInfo.breakTime[day] || 0
                            : newWorkerWorkInfo.breakTime || 0;
                        const hasSchedule =
                          newWorkerWorkInfo.weeklySchedule?.[day];

                        return (
                          <div key={day} className="break-time-day-row">
                            <span className="day-label-small">{day}요일</span>
                            {hasSchedule ? (
                              <div className="break-time-input-group">
                                <input
                                  type="number"
                                  className="break-time-input-field"
                                  value={breakTime === 0 ? "" : breakTime}
                                  min="0"
                                  onFocus={(e) => {
                                    if (breakTime !== 0) {
                                      e.target.select();
                                    }
                                  }}
                                  onBlur={(e) => {
                                    if (e.target.value === "") {
                                      const newBreakTime =
                                        typeof newWorkerWorkInfo.breakTime ===
                                        "object"
                                          ? { ...newWorkerWorkInfo.breakTime }
                                          : daysOfWeek.reduce((acc, d) => {
                                              acc[d] =
                                                newWorkerWorkInfo.breakTime ||
                                                0;
                                              return acc;
                                            }, {});
                                      newBreakTime[day] = 0;
                                      setNewWorkerWorkInfo({
                                        ...newWorkerWorkInfo,
                                        breakTime: newBreakTime,
                                      });
                                    }
                                  }}
                                  onClick={(e) => {
                                    if (breakTime !== 0) {
                                      e.target.select();
                                    }
                                  }}
                                  onChange={(e) => {
                                    const newBreakTime =
                                      typeof newWorkerWorkInfo.breakTime ===
                                      "object"
                                        ? { ...newWorkerWorkInfo.breakTime }
                                        : daysOfWeek.reduce((acc, d) => {
                                            acc[d] =
                                              newWorkerWorkInfo.breakTime || 0;
                                            return acc;
                                          }, {});
                                    const inputValue = e.target.value;
                                    newBreakTime[day] =
                                      inputValue === ""
                                        ? 0
                                        : parseInt(inputValue, 10) || 0;
                                    setNewWorkerWorkInfo({
                                      ...newWorkerWorkInfo,
                                      breakTime: newBreakTime,
                                    });
                                  }}
                                />
                                <span className="break-time-unit">분</span>
                              </div>
                            ) : (
                              <span className="break-time-off">-</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 시급 및 급여 지급일 */}
                  <div className="info-field-row">
                    <div className="info-field">
                      <label className="info-label">시급</label>
                      <div className="wage-input-group">
                        <input
                          type="number"
                          className="info-input"
                          value={newWorkerWorkInfo.hourlyWage ?? ""}
                          min="0"
                          onChange={(e) =>
                            setNewWorkerWorkInfo({
                              ...newWorkerWorkInfo,
                              hourlyWage:
                                e.target.value === ""
                                  ? null
                                  : parseInt(e.target.value) || 0,
                            })
                          }
                        />
                        <span className="wage-unit">원</span>
                      </div>
                    </div>

                    <div className="info-field">
                      <label className="info-label">급여 지급일</label>
                      <div className="payday-input-group">
                        <span className="payday-text">매월</span>
                        <input
                          type="number"
                          className="payday-input"
                          value={newWorkerWorkInfo.payday ?? ""}
                          min="1"
                          max="31"
                          onChange={(e) =>
                            setNewWorkerWorkInfo({
                              ...newWorkerWorkInfo,
                              payday:
                                e.target.value === ""
                                  ? null
                                  : parseInt(e.target.value) || 1,
                            })
                          }
                        />
                        <span>일</span>
                      </div>
                    </div>
                  </div>

                  {/* 4대보험 및 소득세 */}
                  {/* <div className="toggle-row">
                    <div className="toggle-item">
                      <label className="toggle-label">4대 보험</label>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={newWorkerWorkInfo.socialInsurance || false}
                          onChange={(e) =>
                            setNewWorkerWorkInfo({
                              ...newWorkerWorkInfo,
                              socialInsurance: e.target.checked,
                            })
                          }
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                    <div className="toggle-item">
                      <label className="toggle-label">소득세</label>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={newWorkerWorkInfo.withholdingTax || false}
                          onChange={(e) =>
                            setNewWorkerWorkInfo({
                              ...newWorkerWorkInfo,
                              withholdingTax: e.target.checked,
                            })
                          }
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                  </div> */}

                  <div className="add-worker-button-container">
                    <button
                      type="button"
                      className="cancel-button"
                      onClick={handleCancelAddWorker}
                    >
                      취소
                    </button>
                    <button
                      type="button"
                      className="add-button-large"
                      onClick={handleSaveNewWorker}
                    >
                      추가
                    </button>
                  </div>
                </div>
              </div>
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
            <div className="info-card">
              <div className="info-card-header">
                <h3 className="info-card-title">근무 정보</h3>
                {!isEditingWork ? (
                  <button
                    type="button"
                    className="edit-button"
                    onClick={handleStartEdit}
                  >
                    수정
                  </button>
                ) : (
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      type="button"
                      className="edit-button"
                      onClick={handleSaveEdit}
                    >
                      저장
                    </button>
                    <button
                      type="button"
                      className="cancel-button"
                      onClick={handleCancelEdit}
                    >
                      취소
                    </button>
                  </div>
                )}
              </div>
              <div className="info-card-content">
                <div className="info-field">
                  <label className="info-label">근무지</label>
                  <div className="info-value">
                    {workerData.workInfo.workplace}
                  </div>
                </div>

                <div className="info-field">
                  <label className="info-label">근무 시간</label>
                  <div className="weekly-schedule-inputs">
                    {daysOfWeek.map((day) => {
                      // currentWorkInfo가 있으면 항상 우선 사용
                      // 삭제된 요일은 undefined이므로, currentWorkInfo.weeklySchedule이 존재하면 그 안에서 찾고, 없으면 원본 사용
                      const schedule =
                        currentWorkInfo?.weeklySchedule !== undefined
                          ? currentWorkInfo.weeklySchedule[day]
                          : workerData.workInfo.weeklySchedule[day];
                      return (
                        <div key={day} className="day-schedule-row">
                          <span className="day-label-small">{day}요일</span>
                          {isEditingWork && currentWorkInfo ? (
                            <div className="time-wheel-wrapper">
                              {schedule ? (
                                <>
                                  <EmployerTimeInput
                                    value={schedule.start || "00:00"}
                                    onChange={(val) => {
                                      setEditedWorkInfo({
                                        ...currentWorkInfo,
                                        weeklySchedule: {
                                          ...currentWorkInfo.weeklySchedule,
                                          [day]: {
                                            ...schedule,
                                            start: val,
                                          },
                                        },
                                      });
                                    }}
                                  />
                                  <span className="time-separator">~</span>
                                  <EmployerTimeInput
                                    value={schedule.end || "00:00"}
                                    onChange={(val) => {
                                      setEditedWorkInfo({
                                        ...currentWorkInfo,
                                        weeklySchedule: {
                                          ...currentWorkInfo.weeklySchedule,
                                          [day]: {
                                            ...schedule,
                                            end: val,
                                          },
                                        },
                                      });
                                    }}
                                    allowMidnight
                                  />
                                  {(() => {
                                    const [startHour, startMin] = (
                                      schedule.start || "00:00"
                                    )
                                      .split(":")
                                      .map(Number);
                                    const [endHour, endMin] = (
                                      schedule.end || "00:00"
                                    )
                                      .split(":")
                                      .map(Number);
                                    const startDecimal =
                                      startHour + startMin / 60;
                                    const endDecimal = endHour + endMin / 60;
                                    const crossesMidnight =
                                      endDecimal <= startDecimal;
                                    return crossesMidnight ? (
                                      <span className="overnight-label">
                                        (익일)
                                      </span>
                                    ) : null;
                                  })()}
                                  <button
                                    type="button"
                                    className="remove-schedule-button-x"
                                    onClick={() => {
                                      const updatedSchedule = {
                                        ...(currentWorkInfo.weeklySchedule ||
                                          {}),
                                      };
                                      delete updatedSchedule[day];
                                      setEditedWorkInfo({
                                        ...currentWorkInfo,
                                        weeklySchedule: updatedSchedule,
                                      });
                                    }}
                                    title="삭제"
                                  >
                                    <FaTimes />
                                  </button>
                                </>
                              ) : (
                                <button
                                  type="button"
                                  className="add-schedule-button"
                                  onClick={() => {
                                    setEditedWorkInfo({
                                      ...currentWorkInfo,
                                      weeklySchedule: {
                                        ...currentWorkInfo.weeklySchedule,
                                        [day]: { start: "09:00", end: "18:00" },
                                      },
                                    });
                                  }}
                                >
                                  근무 추가
                                </button>
                              )}
                            </div>
                          ) : (
                            <div className="time-display">
                              {schedule ? (
                                <>
                                  {`${schedule.start} - ${schedule.end}`}
                                  {(() => {
                                    const [startHour, startMin] = schedule.start
                                      .split(":")
                                      .map(Number);
                                    const [endHour, endMin] = schedule.end
                                      .split(":")
                                      .map(Number);
                                    const startDecimal =
                                      startHour + startMin / 60;
                                    const endDecimal = endHour + endMin / 60;
                                    const crossesMidnight =
                                      endDecimal <= startDecimal;
                                    return crossesMidnight ? (
                                      <span className="overnight-label">
                                        {" "}
                                        (익일)
                                      </span>
                                    ) : null;
                                  })()}
                                </>
                              ) : (
                                "휴무"
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="info-field">
                  <label className="info-label">휴게 시간</label>
                  {isEditingWork && currentWorkInfo ? (
                    <div className="break-time-by-day">
                      {daysOfWeek.map((day) => {
                        const breakTime =
                          typeof currentWorkInfo.breakTime === "object"
                            ? currentWorkInfo.breakTime[day] || 0
                            : currentWorkInfo.breakTime || 0;
                        const hasSchedule =
                          currentWorkInfo.weeklySchedule?.[day];

                        return (
                          <div key={day} className="break-time-day-row">
                            <span className="day-label-small">{day}요일</span>
                            {hasSchedule ? (
                              <div className="break-time-input-group">
                                <input
                                  type="number"
                                  className="break-time-input-field"
                                  value={breakTime === 0 ? "" : breakTime}
                                  min="0"
                                  onFocus={(e) => {
                                    if (breakTime !== 0) {
                                      e.target.select();
                                    }
                                  }}
                                  onBlur={(e) => {
                                    if (e.target.value === "") {
                                      const newBreakTime =
                                        typeof currentWorkInfo.breakTime ===
                                        "object"
                                          ? { ...currentWorkInfo.breakTime }
                                          : daysOfWeek.reduce((acc, d) => {
                                              acc[d] =
                                                currentWorkInfo.breakTime || 0;
                                              return acc;
                                            }, {});
                                      newBreakTime[day] = 0;
                                      setEditedWorkInfo({
                                        ...currentWorkInfo,
                                        breakTime: newBreakTime,
                                      });
                                    }
                                  }}
                                  onClick={(e) => {
                                    if (breakTime !== 0) {
                                      e.target.select();
                                    }
                                  }}
                                  onChange={(e) => {
                                    const newBreakTime =
                                      typeof currentWorkInfo.breakTime ===
                                      "object"
                                        ? { ...currentWorkInfo.breakTime }
                                        : daysOfWeek.reduce((acc, d) => {
                                            acc[d] =
                                              currentWorkInfo.breakTime || 0;
                                            return acc;
                                          }, {});
                                    const inputValue = e.target.value;
                                    newBreakTime[day] =
                                      inputValue === ""
                                        ? 0
                                        : parseInt(inputValue, 10) || 0;
                                    setEditedWorkInfo({
                                      ...currentWorkInfo,
                                      breakTime: newBreakTime,
                                    });
                                  }}
                                />
                                <span className="break-time-unit">분</span>
                              </div>
                            ) : (
                              <span className="break-time-off">-</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="break-time-display">
                      {(() => {
                        const breakTime =
                          currentWorkInfo?.breakTime ||
                          workerData.workInfo.breakTime;
                        if (typeof breakTime === "object") {
                          // 요일별로 다른 경우
                          // 근무 시간이 있는 요일의 휴게시간만 고려
                          const scheduleToUse =
                            currentWorkInfo?.weeklySchedule ??
                            workerData.workInfo.weeklySchedule;
                          const breakTimeValues = daysOfWeek
                            .filter((day) => scheduleToUse[day])
                            .map((day) => breakTime[day] || 0);
                          const uniqueValues = [...new Set(breakTimeValues)];
                          if (
                            uniqueValues.length === 1 &&
                            uniqueValues[0] > 0
                          ) {
                            return (
                              <div className="info-value">
                                {uniqueValues[0]} 분 (요일별 동일)
                              </div>
                            );
                          }
                          return (
                            <div className="break-time-by-day-display">
                              {daysOfWeek.map((day) => {
                                const value = breakTime[day] || 0;
                                const hasSchedule =
                                  currentWorkInfo?.weeklySchedule?.[day] ??
                                  workerData.workInfo.weeklySchedule[day];
                                if (!hasSchedule) return null;
                                return (
                                  <div
                                    key={day}
                                    className="break-time-day-display-item"
                                  >
                                    <span className="day-label-small">
                                      {day}요일
                                    </span>
                                    <span className="break-time-value">
                                      {value} 분
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        }
                        return <div className="info-value">{breakTime} 분</div>;
                      })()}
                    </div>
                  )}
                </div>

                <div className="info-field-row">
                  <div className="info-field">
                    <label className="info-label">시급</label>
                    {isEditingWork && currentWorkInfo ? (
                      <div className="wage-input-group">
                        <input
                          type="number"
                          className="info-input"
                          value={currentWorkInfo.hourlyWage || 0}
                          onChange={(e) =>
                            setEditedWorkInfo({
                              ...currentWorkInfo,
                              hourlyWage: parseInt(e.target.value) || 0,
                            })
                          }
                        />
                        <span className="wage-unit">원</span>
                      </div>
                    ) : (
                      <div className="info-value">
                        {formatKRW(
                          currentWorkInfo?.hourlyWage ||
                            workerData.workInfo.hourlyWage
                        )}
                      </div>
                    )}
                  </div>

                  <div className="info-field">
                    <label className="info-label">급여 지급일</label>
                    {isEditingWork && currentWorkInfo ? (
                      <div className="payday-input-group">
                        <span className="payday-text">매월</span>
                        <input
                          type="number"
                          className="payday-input"
                          value={currentWorkInfo.payday || 1}
                          min="1"
                          max="31"
                          onChange={(e) =>
                            setEditedWorkInfo({
                              ...currentWorkInfo,
                              payday: parseInt(e.target.value) || 1,
                            })
                          }
                        />
                        <span>일</span>
                      </div>
                    ) : (
                      <div className="info-value">
                        매월{" "}
                        {currentWorkInfo?.payday || workerData.workInfo.payday}{" "}
                        일
                      </div>
                    )}
                  </div>
                </div>

                {/* <div className="toggle-row">
                  <div className="toggle-item">
                    <label className="toggle-label">4대 보험</label>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={
                          isEditingWork && currentWorkInfo
                            ? currentWorkInfo.socialInsurance
                            : workerData.workInfo.socialInsurance
                        }
                        disabled={!isEditingWork}
                        onChange={(e) =>
                          setEditedWorkInfo({
                            ...currentWorkInfo,
                            socialInsurance: e.target.checked,
                          })
                        }
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                  <div className="toggle-item">
                    <label className="toggle-label">소득세</label>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={
                          isEditingWork && currentWorkInfo
                            ? currentWorkInfo.withholdingTax
                            : workerData.workInfo.withholdingTax
                        }
                        disabled={!isEditingWork}
                        onChange={(e) =>
                          setEditedWorkInfo({
                            ...currentWorkInfo,
                            withholdingTax: e.target.checked,
                          })
                        }
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                </div> */}
              </div>
            </div>
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
          onHoverBlock={setHoveredBlockGroup}
          currentWorkInfo={currentWorkInfo}
          workerData={workerData}
          isAddingWorker={isAddingWorker}
          newWorkerWorkInfo={newWorkerWorkInfo}
        />
      )}
    </div>
  );
}
