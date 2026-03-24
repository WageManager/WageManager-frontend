import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import type {
  WorkplaceDetails,
  WorkerWorkInfo,
  AddedWorkerInfo,
  ContractWorker,
} from "../../types/employer/workerManagePageTypes";
import {
  getWorkplaces,
  createWorkplace,
  updateWorkplace,
  deleteWorkplace,
} from "../../api/employerApi";

interface UseWorkplaceManagementProps {
  onWorkplaceDeleted?: (workplaceId: number) => void;
  onWorkplaceChanged?: (workplaceId: number) => void;
}

interface UseWorkplaceManagementReturn {
  // 상태
  workplaces: WorkplaceDetails[];
  selectedWorkplaceId: number | null;
  isAddingWorkplace: boolean;
  isManagingWorkplaces: boolean;
  selectedWorkplaceForEdit: number | null;
  editingWorkplace: WorkplaceDetails | null;
  newWorkplaceName: string;
  newWorkplaceAddress: string;
  newWorkplaceBusinessNumber: string;
  newWorkplaceIsSmallBusiness: boolean;

  // Setters
  setWorkplaces: React.Dispatch<React.SetStateAction<WorkplaceDetails[]>>;
  setSelectedWorkplaceId: React.Dispatch<React.SetStateAction<number | null>>;
  setIsAddingWorkplace: React.Dispatch<React.SetStateAction<boolean>>;
  setIsManagingWorkplaces: React.Dispatch<React.SetStateAction<boolean>>;
  setSelectedWorkplaceForEdit: React.Dispatch<
    React.SetStateAction<number | null>
  >;
  setEditingWorkplace: React.Dispatch<
    React.SetStateAction<WorkplaceDetails | null>
  >;
  setNewWorkplaceName: React.Dispatch<React.SetStateAction<string>>;
  setNewWorkplaceAddress: React.Dispatch<React.SetStateAction<string>>;
  setNewWorkplaceBusinessNumber: React.Dispatch<React.SetStateAction<string>>;
  setNewWorkplaceIsSmallBusiness: React.Dispatch<React.SetStateAction<boolean>>;

  // 핸들러 함수
  handleManageWorkplaces: () => void;
  handleCancelManageWorkplaces: () => void;
  handleAddWorkplaceFromManage: () => void;
  handleAddWorkplace: () => Promise<void>;
  handleCancelAddWorkplace: () => void;
  handleDeleteWorkplace: (
    workersList: Record<number, ContractWorker[]>,
    setWorkersList: React.Dispatch<
      React.SetStateAction<Record<number, ContractWorker[]>>
    >,
    addedWorkerInfo: Record<string, AddedWorkerInfo>,
    setAddedWorkerInfo: React.Dispatch<
      React.SetStateAction<Record<string, AddedWorkerInfo>>
    >,
    updatedWorkInfo: Record<string, WorkerWorkInfo>,
    setUpdatedWorkInfo: React.Dispatch<
      React.SetStateAction<Record<string, WorkerWorkInfo>>
    >,
    setSelectedWorker: React.Dispatch<
      React.SetStateAction<ContractWorker | null>
    >,
    setIsEditingWork: React.Dispatch<React.SetStateAction<boolean>>,
    setEditedWorkInfo: React.Dispatch<React.SetStateAction<any>>,
    isAddingWorker: boolean,
    resetAddWorkerFlow: () => void,
    setIsAddingWorker: React.Dispatch<React.SetStateAction<boolean>>,
    setHoveredBlockGroup: React.Dispatch<React.SetStateAction<string | null>>
  ) => void;
  handleEditWorkplace: (workplace: WorkplaceDetails) => void;
  handleSaveWorkplaceEdit: (
    addedWorkerInfo: Record<string, AddedWorkerInfo>,
    setAddedWorkerInfo: React.Dispatch<
      React.SetStateAction<Record<string, AddedWorkerInfo>>
    >,
    updatedWorkInfo: Record<string, WorkerWorkInfo>,
    setUpdatedWorkInfo: React.Dispatch<
      React.SetStateAction<Record<string, WorkerWorkInfo>>
    >
  ) => Promise<void>;
  handleCancelWorkplaceEdit: () => void;
  handleEditingWorkplaceChange: (data: {
    name?: string;
    address?: string;
    businessNumber?: string;
    isSmallBusiness?: boolean;
  }) => void;
}

export function useWorkplaceManagement({
  onWorkplaceDeleted,
  onWorkplaceChanged,
}: UseWorkplaceManagementProps = {}): UseWorkplaceManagementReturn {
  const [workplaces, setWorkplaces] = useState<WorkplaceDetails[]>([]);
  const [selectedWorkplaceId, setSelectedWorkplaceId] = useState<number | null>(
    null
  );
  const [isAddingWorkplace, setIsAddingWorkplace] = useState(false);
  const [newWorkplaceName, setNewWorkplaceName] = useState("");
  const [newWorkplaceAddress, setNewWorkplaceAddress] = useState("");
  const [newWorkplaceBusinessNumber, setNewWorkplaceBusinessNumber] =
    useState("");
  const [newWorkplaceIsSmallBusiness, setNewWorkplaceIsSmallBusiness] =
    useState(false);
  const [isManagingWorkplaces, setIsManagingWorkplaces] = useState(false);
  const [selectedWorkplaceForEdit, setSelectedWorkplaceForEdit] =
    useState<number | null>(null);
  const [editingWorkplace, setEditingWorkplace] =
    useState<WorkplaceDetails | null>(null);

  // 근무지 목록 조회
  useEffect(() => {
    const fetchWorkplaces = async () => {
      try {
        const response = await getWorkplaces();
        const workplacesData = (response.data || []) as WorkplaceDetails[];
        setWorkplaces(workplacesData);
        if (workplacesData.length > 0 && !selectedWorkplaceId) {
          const firstWorkplace = workplacesData[0];
          if (firstWorkplace) {
            setSelectedWorkplaceId(firstWorkplace.id);
          }
        }
      } catch (error) {
        // 에러 시 빈 배열 사용
        setWorkplaces([]);
      }
    };
    fetchWorkplaces();
  }, []);

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
    const workplaceName = newWorkplaceName.trim();

    // 근무지 이름 검증
    if (!workplaceName) {
      Swal.fire("입력 오류", "근무지 이름을 입력해주세요.", "error");
      return;
    }

    // 중복 확인
    if (workplaces.some((wp) => wp.name === workplaceName)) {
      Swal.fire("입력 오류", "이미 존재하는 근무지입니다.", "error");
      return;
    }

    try {
      // 백엔드에 근무지 생성 요청
      const response = await createWorkplace({
        name: workplaceName,
        address: newWorkplaceAddress.trim(),
        businessNumber: newWorkplaceBusinessNumber.trim(),
        isLessThanFiveEmployees: newWorkplaceIsSmallBusiness,
      });
      const createdWorkplace = response.data as WorkplaceDetails;

      // UI 업데이트
      setWorkplaces((prev) => [...prev, createdWorkplace]);

      // 새 근무지 선택
      setSelectedWorkplaceId(createdWorkplace.id);
      setIsAddingWorkplace(false);
      setNewWorkplaceName("");
      setNewWorkplaceAddress("");
      setNewWorkplaceBusinessNumber("");
      setNewWorkplaceIsSmallBusiness(false);

      if (onWorkplaceChanged) {
        onWorkplaceChanged(createdWorkplace.id);
      }

      Swal.fire(
        "추가 완료",
        `${workplaceName}이(가) 추가되었습니다.`,
        "success"
      );
    } catch (error) {
      const err = error as { message?: string };
      Swal.fire(
        "추가 실패",
        err.message || "근무지 추가 중 오류가 발생했습니다.",
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

  const handleDeleteWorkplace = (
    workersList: Record<number, ContractWorker[]>,
    setWorkersList: React.Dispatch<
      React.SetStateAction<Record<number, ContractWorker[]>>
    >,
    addedWorkerInfo: Record<string, AddedWorkerInfo>,
    setAddedWorkerInfo: React.Dispatch<
      React.SetStateAction<Record<string, AddedWorkerInfo>>
    >,
    updatedWorkInfo: Record<string, WorkerWorkInfo>,
    setUpdatedWorkInfo: React.Dispatch<
      React.SetStateAction<Record<string, WorkerWorkInfo>>
    >,
    setSelectedWorker: React.Dispatch<
      React.SetStateAction<ContractWorker | null>
    >,
    setIsEditingWork: React.Dispatch<React.SetStateAction<boolean>>,
    setEditedWorkInfo: React.Dispatch<React.SetStateAction<any>>,
    isAddingWorker: boolean,
    resetAddWorkerFlow: () => void,
    setIsAddingWorker: React.Dispatch<React.SetStateAction<boolean>>,
    setHoveredBlockGroup: React.Dispatch<React.SetStateAction<string | null>>
  ) => {
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
          const firstWorkplace = updatedWorkplaces[0];
          if (!firstWorkplace) return;
          const newSelectedWorkplaceId = firstWorkplace.id;
          setSelectedWorkplaceId(newSelectedWorkplaceId);
          setSelectedWorker(null);
          setIsAddingWorkplace(false);
          setIsEditingWork(false);
          setEditedWorkInfo(null);

          if (onWorkplaceDeleted) {
            onWorkplaceDeleted(selectedWorkplaceId);
          }

          Swal.fire(
            "삭제 완료",
            `${workplaceToDelete.name}이(가) 삭제되었습니다.`,
            "success"
          );
        } catch (error) {
          const err = error as { message?: string };
          Swal.fire(
            "삭제 실패",
            err.message || "근무지 삭제 중 오류가 발생했습니다.",
            "error"
          );
        }
      }
    });
  };

  const handleEditWorkplace = (workplace: WorkplaceDetails) => {
    setEditingWorkplace({
      id: workplace.id,
      name: workplace.name || "",
      address: workplace.address || "",
      businessNumber: workplace.businessNumber || "",
      isSmallBusiness: workplace.isSmallBusiness || false,
    });
    setSelectedWorkplaceForEdit(workplace.id);
  };

  const handleSaveWorkplaceEdit = async (
    addedWorkerInfo: Record<string, AddedWorkerInfo>,
    setAddedWorkerInfo: React.Dispatch<
      React.SetStateAction<Record<string, AddedWorkerInfo>>
    >,
    updatedWorkInfo: Record<string, WorkerWorkInfo>,
    setUpdatedWorkInfo: React.Dispatch<
      React.SetStateAction<Record<string, WorkerWorkInfo>>
    >
  ) => {
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
        name: editingWorkplace.name.trim(),
        address: editingWorkplace.address?.trim() ?? "",
        isLessThanFiveEmployees: !!editingWorkplace.isSmallBusiness,
      });

      // UI 업데이트
      setWorkplaces((prev) =>
        prev.map((wp) =>
          wp.id === editingWorkplace.id
            ? {
                ...wp,
                name: editingWorkplace.name.trim(),
                address: editingWorkplace.address?.trim() ?? "",
                businessNumber: editingWorkplace.businessNumber?.trim() ?? "",
                isSmallBusiness: !!editingWorkplace.isSmallBusiness,
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
          const updated: Record<string, AddedWorkerInfo> = {};
          Object.keys(prev).forEach((key) => {
            const value = prev[key];
            if (!value) return;
            if (key.startsWith(`${oldWorkplace.name}::`)) {
              const newKey = key.replace(
                `${oldWorkplace.name}::`,
                `${editingWorkplace.name.trim()}::`
              );
              updated[newKey] = value;
            } else {
              updated[key] = value;
            }
          });
          return updated;
        });

        setUpdatedWorkInfo((prev) => {
          const updated: Record<string, WorkerWorkInfo> = {};
          Object.keys(prev).forEach((key) => {
            const value = prev[key];
            if (!value) return;
            if (key.startsWith(`${oldWorkplace.name}-`)) {
              const newKey = key.replace(
                `${oldWorkplace.name}-`,
                `${editingWorkplace.name.trim()}-`
              );
              updated[newKey] = value;
            } else {
              updated[key] = value;
            }
          });
          return updated;
        });
      }

      setEditingWorkplace(null);
      setSelectedWorkplaceForEdit(null);

      Swal.fire("수정 완료", "근무지 정보가 수정되었습니다.", "success");
    } catch (error) {
      const err = error as { message?: string };
      Swal.fire(
        "수정 실패",
        err.message || "근무지 수정 중 오류가 발생했습니다.",
        "error"
      );
    }
  };

  const handleCancelWorkplaceEdit = () => {
    setEditingWorkplace(null);
    setSelectedWorkplaceForEdit(null);
  };

  const handleEditingWorkplaceChange = (data: {
    name?: string;
    address?: string;
    businessNumber?: string;
    isSmallBusiness?: boolean;
  }) => {
    setEditingWorkplace((prev) => (prev ? { ...prev, ...data } : prev));
  };

  return {
    // 상태
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

    // Setters
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

    // 핸들러
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
  };
}
