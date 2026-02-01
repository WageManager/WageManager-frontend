import type {
  WorkplaceDetails,
  WorkplaceManageCardProps,
} from "../../../types/employer/workerManagePageTypes";
import EmployerWorkplaceForm from "./EmployerWorkplaceForm";

export default function EmployerWorkplaceManageCard({
  workplaces,
  selectedWorkplaceForEdit,
  editingWorkplace,
  onEditWorkplace,
  onCancelEdit,
  onSaveEdit,
  onAddWorkplace,
  onClose,
  onEditingWorkplaceChange,
}: WorkplaceManageCardProps) {
  return (
    <div className="workplace-manage-container">
      <div className="info-card">
        <div className="info-card-header">
          <h3 className="info-card-title">근무지 목록</h3>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              type="button"
              className="add-button-large"
              onClick={onAddWorkplace}
            >
              근무지 추가
            </button>
            <button
              type="button"
              className="cancel-button"
              onClick={onClose}
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
                  selectedWorkplaceForEdit === workplace.id ? "selected" : ""
                }`}
                onClick={() => onEditWorkplace(workplace)}
              >
                <div className="workplace-list-name">{workplace.name}</div>
                {selectedWorkplaceForEdit === workplace.id && (
                  <div className="workplace-list-details">
                    <div className="info-field">
                      <label className="info-label">주소</label>
                      <div className="info-value">
                        {workplace.address || "-"}
                      </div>
                    </div>
                    <div className="info-field">
                      <label className="info-label">사업자 등록 번호</label>
                      <div className="info-value">
                        {workplace.businessNumber || "-"}
                      </div>
                    </div>
                    <div className="info-field">
                      <label className="info-label">5인 미만 사업장</label>
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
          onFormDataChange={onEditingWorkplaceChange}
          onCancel={onCancelEdit}
          onSave={onSaveEdit}
          cancelButtonText="취소"
          saveButtonText="저장"
        />
      )}
    </div>
  );
}
