/**
 * MonthNav - 월 네비게이션 컴포넌트
 * 이전/다음 월로 이동하는 네비게이션 UI
 */

/** Props 타입 (이 컴포넌트에서만 사용) */
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
        {'<'}
      </button>
      <div className="month-nav-title">
        {year}년 {month}월
      </div>
      <button className="month-nav-arrow" onClick={onNextMonth} type="button">
        {'>'}
      </button>
    </div>
  );
}
