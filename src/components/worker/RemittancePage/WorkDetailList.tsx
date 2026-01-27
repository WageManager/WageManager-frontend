import { MdKeyboardArrowDown, MdKeyboardArrowUp } from "react-icons/md";
import { formatKRW, formatBreakTime } from "../../../utils/formatUtils";
import { allowanceDefinitions } from "../../../pages/employer/utils/shiftUtils";
import "../../../pages/workers/WorkerRemittancePage.css";
import type { RemittanceWorkRecord, AllowanceKey, SortOrder } from "../../../types/worker/remittancePage.types";

interface WorkDetailListProps {
  workRecords: RemittanceWorkRecord[];
  isLoading: boolean;
  sortOrder: SortOrder;
  isSortDropdownOpen: boolean;
  expandedRecordIndex: number | null;
  onSortSelect: (order: SortOrder) => void;
  onSortDropdownToggle: () => void;
  onRecordClick: (index: number) => void;
}

function WorkDetailList({
  workRecords,
  isLoading,
  sortOrder,
  isSortDropdownOpen,
  expandedRecordIndex = null,
  onSortSelect,
  onSortDropdownToggle,
  onRecordClick,
}: WorkDetailListProps) {
  return (
    <div className="remittance-detail-section">
      {/* 근무 상세 내역 헤더 및 정렬 드롭다운 */}
      <div className="remittance-detail-header">
        <h2 className="remittance-detail-title">근무 상세 내역</h2>
        <div className="sort-dropdown-wrapper">
          <button
            type="button"
            className="sort-dropdown-button"
            onClick={onSortDropdownToggle}
          >
            <span>{sortOrder === "latest" ? "최신순" : "과거순"}</span>
            {isSortDropdownOpen ? <MdKeyboardArrowUp /> : <MdKeyboardArrowDown />}
          </button>
          {isSortDropdownOpen && (
            <div className="sort-dropdown-menu">
              <button
                type="button"
                className={`sort-dropdown-item ${
                  sortOrder === "latest" ? "active" : ""
                }`}
                onClick={() => onSortSelect("latest")}
              >
                최신순
              </button>
              <button
                type="button"
                className={`sort-dropdown-item ${
                  sortOrder === "oldest" ? "active" : ""
                }`}
                onClick={() => onSortSelect("oldest")}
              >
                과거순
              </button>
            </div>
          )}
        </div>
      </div>
      {/* 근무 상세 내역 리스트 */}
      <div className="remittance-detail-list">
        {isLoading ? (
          <p className="no-data">로딩 중...</p>
        ) : workRecords.length > 0 ? (
          workRecords.map((record, index) => (
            <div key={record.id}>
              {/* 근무 내역 카드 (클릭 시 상세 정보 펼치기/접기) */}
              <div
                className="remittance-detail-card"
                onClick={() => onRecordClick(index)}
                role="button"
                tabIndex={0}
                onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onRecordClick(index);
                  }
                }}
              >
                <div className="detail-date">
                  <span className="date-number">{record.date}</span>
                  <span className="date-day">{record.day}</span>
                </div>
                <div className="detail-time">
                  <span>
                    {record.startTime} ~ {record.endTime} {record.workplace}
                  </span>
                </div>
              </div>
              {/* 근무 상세 정보 패널 (카드 클릭 시 확장) */}
              <div
                className={`remittance-detail-panel ${
                  expandedRecordIndex === index ? "open" : ""
                }`}
              >
                <div className="detail-panel-content">
                  {/* 왼쪽 섹션: 기본 근무 정보 */}
                  <div className="detail-left-section">
                    <div className="detail-form-item">
                      <label className="detail-form-label">근무지</label>
                      <div className="detail-form-value">{record.workplace}</div>
                    </div>
                    <div className="detail-form-item">
                      <label className="detail-form-label">근무 시간</label>
                      <div className="time-input-group">
                        <div className="detail-form-value time-input">{record.startTime}</div>
                        <span className="time-separator">~</span>
                        <div className="detail-form-value time-input">{record.endTime}</div>
                      </div>
                    </div>
                    <div className="detail-form-item">
                      <label className="detail-form-label">휴게 시간</label>
                      <div className="detail-form-value">{formatBreakTime(record.breakMinutes)}</div>
                    </div>
                    <div className="detail-form-item">
                      <label className="detail-form-label">시급</label>
                      <div className="detail-form-value">{formatKRW(record.hourlyWage)}</div>
                    </div>
                  </div>
                  {/* 오른쪽 섹션: 수당, 보험, 세금 정보 */}
                  <div className="detail-right-section">
                    {/* 수당 버튼들 (야간, 연장, 휴일 등) */}
                    <div className="allowance-buttons">
                      {allowanceDefinitions.map(({ key, label }: { key: AllowanceKey; label: string }) => {
                        const allowance = record.allowances[key] || {
                          enabled: false,
                          rate: 0,
                        };
                        return (
                          <button
                            key={key}
                            type="button"
                            className={`allowance-button ${
                              allowance.enabled ? "active" : ""
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                    {/* 야간 근무 수당이 활성화된 경우에만 표시 */}
                    {record.allowances.night.enabled && (
                      <div className="detail-form-item">
                        <label className="detail-form-label">
                          야간 근무 금액
                        </label>
                        <div className="detail-form-value">{record.allowances.night.rate}%</div>
                      </div>
                    )}
                    {/* 4대 보험 적용 여부 */}
                    <div className="insurance-toggle-item">
                      <label className="detail-form-label">4대 보험</label>
                      <div
                        className={`toggle-switch ${
                          record.socialInsurance ? "on" : "off"
                        }`}
                      >
                        <div className="toggle-slider"></div>
                      </div>
                    </div>
                    {/* 소득세 원천징수 여부 */}
                    <div className="insurance-toggle-item">
                      <label className="detail-form-label">소득세</label>
                      <div
                        className={`toggle-switch ${
                          record.withholdingTax ? "on" : "off"
                        }`}
                      >
                        <div className="toggle-slider"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="no-data">근무 내역이 없습니다.</p>
        )}
      </div>
    </div>
  );
}

export default WorkDetailList;
