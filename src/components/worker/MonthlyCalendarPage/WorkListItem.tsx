/**
 * WorkListItem - 근무 목록 아이템 컴포넌트
 * 단일 근무 기록을 표시하고 정정 요청 버튼 제공
 */
import type { ReactNode } from 'react';
import type { WorkRecord } from '../../../types/worker/monthlyCalendar.types';

// ============ 로컬 상수 ============

const KOREAN_DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'] as const;

// ============ 로컬 타입 ============

interface WorkListItemProps {
  record: WorkRecord;
  selectedDate: Date;
  onEditClick: () => void;
  children?: ReactNode; // WorkEditRequestBox를 children으로 받음
}

// ============ 헬퍼 함수 ============

const getKoreanDayLabel = (dayIndex: number): string => {
  return KOREAN_DAY_LABELS[dayIndex] || '';
};

// ============ 컴포넌트 ============

export default function WorkListItem({
  record,
  selectedDate,
  onEditClick,
  children,
}: WorkListItemProps) {
  return (
    <>
      <div className="work-list-item">
        <div className="work-list-date">
          <div className="work-list-date-day">{selectedDate.getDate()}</div>
          <div className="work-list-date-weekday">
            {getKoreanDayLabel(selectedDate.getDay())}
          </div>
        </div>

        <div className="work-list-main">
          <div className="work-list-time">
            {record.start} ~ {record.end}
          </div>
          <div className="work-list-wage">{record.wage.toLocaleString()}원</div>
          <div className="work-list-place">{record.place}</div>
        </div>

        <button
          className="work-list-edit-btn"
          type="button"
          onClick={onEditClick}
        >
          근무 기록 정정 요청
        </button>
      </div>

      {children}
    </>
  );
}
