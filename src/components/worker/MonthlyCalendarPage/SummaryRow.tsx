/**
 * SummaryRow - 월간 근무시간 및 급여 요약 컴포넌트
 */

// ============ 로컬 타입 ============

interface SummaryRowProps {
  totalHoursText: string; // 예: "40시간 30분"
  totalWage: number;
}

// ============ 컴포넌트 ============

export default function SummaryRow({ totalHoursText, totalWage }: SummaryRowProps) {
  return (
    <div className="summary-row">
      <div className="summary-card">
        <div className="summary-label">월간 근무시간</div>
        <div className="summary-value">{totalHoursText}</div>
      </div>
      <div className="summary-card">
        <div className="summary-label">월 급여</div>
        <div className="summary-value">{totalWage.toLocaleString()}원</div>
      </div>
    </div>
  );
}
