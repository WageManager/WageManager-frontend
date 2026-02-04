import type { FC } from "react";
import type { WorkerSelectModalProps } from "../../../types/employer/dailyCalendarPage.types";

/**
 * WorkerSelectModal
 * 근무자 선택 모달
 */
const WorkerSelectModal: FC<WorkerSelectModalProps> = ({
  isOpen,
  workers,
  onClose,
  onSelectWorker,
}) => {
  if (!isOpen) return null;

  return (
    <div className="worker-list-modal-overlay" onClick={onClose}>
      <div className="worker-list-modal" onClick={(e) => e.stopPropagation()}>
        <div className="worker-list-modal-header">
          <h3>근무자 선택</h3>
          <button
            type="button"
            className="worker-list-modal-close"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <div className="worker-list-modal-body">
          {workers.length > 0 ? (
            <ul className="worker-list">
              {workers.map((workerName) => (
                <li
                  key={workerName}
                  className="worker-list-item"
                  onClick={() => onSelectWorker(workerName)}
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
  );
};

export default WorkerSelectModal;
