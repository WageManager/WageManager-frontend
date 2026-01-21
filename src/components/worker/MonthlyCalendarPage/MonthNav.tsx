import { IoIosArrowBack } from "react-icons/io";
import { IoIosArrowForward } from "react-icons/io";

interface MonthNavProps {
  year: number;
  month: number; // 1-12 (표시용)
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

export default function MonthNav({
  year,
  month,
  onPrevMonth,
  onNextMonth,
}: MonthNavProps) {
  return (
    <div className="month-nav">
      <button className="month-nav-arrow" onClick={onPrevMonth} type="button">
        <IoIosArrowBack/>
      </button>
      <div className="month-nav-title">
        {year}년 {month}월
      </div>
      <button className="month-nav-arrow" onClick={onNextMonth} type="button">
        <IoIosArrowForward />
      </button>
    </div>
  );
}
