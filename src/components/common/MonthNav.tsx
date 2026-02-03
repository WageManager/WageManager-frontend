import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import "./MonthNav.css";

export interface MonthNavProps {
  year: number;
  month: number; // 1-12 (표시용)
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

/**
 * 월 네비게이션 공통 컴포넌트
 * Worker/Employer 모두에서 사용
 */
export default function MonthNav({
  year,
  month,
  onPrevMonth,
  onNextMonth,
}: MonthNavProps) {
  return (
    <div className="month-nav">
      <button
        className="month-nav-arrow"
        onClick={onPrevMonth}
        type="button"
        aria-label="이전 달"
      >
        <IoIosArrowBack />
      </button>
      <div className="month-nav-title">
        {year}년 {month}월
      </div>
      <button
        className="month-nav-arrow"
        onClick={onNextMonth}
        type="button"
        aria-label="다음 달"
      >
        <IoIosArrowForward />
      </button>
    </div>
  );
}
