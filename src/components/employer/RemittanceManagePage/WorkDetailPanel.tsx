import { formatKRW, formatBreakTime } from "../../../utils/formatUtils";
import { extraPayTypes } from "../../../constants/extraPay";
import type { WorkDetailPanelProps } from "../../../types/employer/employerRemittancePage.types";

/**
 * 근무 상세 패널 컴포넌트
 * 카드 클릭 시 확장되어 표시됨
 */
export default function WorkDetailPanel({
  record,
  workerName,
  workplaceName,
  formattedDate,
  isOpen,
}: WorkDetailPanelProps) {
  return (
    <div className={`remittance-detail-panel ${isOpen ? "open" : ""}`}>
      <div className="detail-header">
        <div className="detail-header-left">
          <div>
            <h3 className="detail-name">{workerName || "-"}</h3>
          </div>
          <div>
            <p className="detail-value">{workplaceName || "-"}</p>
          </div>
        </div>
      </div>
      <div className="detail-grid">
        <div>
          <p className="detail-label">근무 날짜</p>
          <p className="detail-value">
            {formattedDate} ({record.day})
          </p>
        </div>
        <div>
          <p className="detail-label">근무 시간</p>
          <p className="detail-value">
            {record.startTime} ~ {record.endTime}
          </p>
        </div>
        <div>
          <p className="detail-label">시급</p>
          <p className="detail-value">{formatKRW(record.hourlyWage)}</p>
        </div>
        <div>
          <p className="detail-label">휴게 시간</p>
          <p className="detail-value">
            {formatBreakTime(record.breakMinutes)}
          </p>
        </div>
      </div>
      <div className="detail-section">
        <p className="detail-label">수당 정보</p>
        <ul className="allowance-list">
          {extraPayTypes.map(({ key, label }) => {
            const allowance = record.allowances?.[key as keyof typeof record.allowances] || {
              enabled: false,
              rate: 0,
            };
            return (
              <li
                key={key}
                className={`allowance-item ${allowance.enabled ? "on" : "off"}`}
              >
                <span>{label}</span>
                <span className="allowance-rate">
                  {allowance.enabled ? `${allowance.rate}%` : "없음"}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
