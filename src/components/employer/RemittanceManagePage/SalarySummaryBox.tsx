import { formatKRW } from "../../../utils/formatUtils";
import type { SalarySummaryBoxProps } from "../../../types/employer/employerRemittancePage.types";

/**
 * 급여 요약 및 송금 버튼 컴포넌트 (오른쪽 패널)
 */
export default function SalarySummaryBox({
  totalWage,
  onRemittance,
}: SalarySummaryBoxProps) {
  return (
    <>
      <div className="remittance-summary-box">
        <h3 className="summary-title">이번 달 급여</h3>
        <div className="summary-amount">{formatKRW(totalWage)}</div>
      </div>
      <button
        type="button"
        className="remittance-button"
        onClick={onRemittance}
      >
        송금하기
      </button>
    </>
  );
}
