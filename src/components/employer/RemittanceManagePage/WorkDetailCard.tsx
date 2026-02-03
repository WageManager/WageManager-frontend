/**
 * 근무 내역 카드 컴포넌트
 * 클릭 시 상세 패널이 확장됨
 */

import { formatKRW } from "../../../utils/formatUtils";
import type { WorkDetailCardProps } from "../../../types/employer/employerRemittancePage.types";

export default function WorkDetailCard({
  record,
  index,
  isExpanded,
  onToggle,
}: WorkDetailCardProps) {
  const handleClick = () => {
    onToggle(index);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onToggle(index);
    }
  };

  return (
    <div
      className={`remittance-detail-card ${isExpanded ? "expanded" : ""}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <div className="detail-date">
        <span className="date-number">{record.date}</span>
        <span className="date-day">{record.day}</span>
      </div>
      <div className="detail-time">
        <span>
          {record.startTime} ~ {record.endTime}
        </span>
      </div>
      <div className="detail-wage">{formatKRW(record.wage)}</div>
    </div>
  );
}
