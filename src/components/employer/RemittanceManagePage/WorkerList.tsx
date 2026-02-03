/**
 * 근로자 목록 컴포넌트 (왼쪽 패널)
 */

import type { WorkerListProps } from "../../../types/employer/employerRemittancePage.types";

export default function WorkerList({
  workers,
  selectedWorkerId,
  onWorkerClick,
}: WorkerListProps) {
  return (
    <div className="remittance-worker-list">
      {workers.map((worker) => (
        <button
          type="button"
          key={worker.id}
          className={`worker-item ${
            selectedWorkerId === worker.id ? "selected" : ""
          }`}
          onClick={() => onWorkerClick(worker)}
        >
          {worker.workerName}
        </button>
      ))}
    </div>
  );
}
