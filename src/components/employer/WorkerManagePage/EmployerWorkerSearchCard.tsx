import React from "react";
import { FaUser } from "react-icons/fa";
import type { WorkerSearchCardProps } from "../../../types/employer/workerManagePageTypes";

const EmployerWorkerSearchCard: React.FC<WorkerSearchCardProps> = ({
  workerCode,
  onWorkerCodeChange,
  onSearch,
  searchedWorker,
  onConfirm,
  isSearching,
}) => {
  return (
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
                onChange={(e) => onWorkerCodeChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    onSearch();
                  }
                }}
                placeholder="근무자 코드를 입력하세요"
              />
              <button
                type="button"
                className="search-button"
                onClick={onSearch}
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
                  onClick={onConfirm}
                >
                  확인
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EmployerWorkerSearchCard;
