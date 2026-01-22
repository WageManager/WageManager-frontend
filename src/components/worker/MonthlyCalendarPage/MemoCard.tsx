/**
 * MemoCard - 날짜별 메모 입력 컴포넌트
 */
import type { ChangeEvent } from 'react';

// ============ 로컬 타입 ============

interface MemoCardProps {
  title: string; // 예: "1/15(수)"
  value: string;
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
}

// ============ 컴포넌트 ============

export default function MemoCard({ title, value, onChange }: MemoCardProps) {
  return (
    <div className="memo-card">
      <div className="memo-header">메모 {title}</div>
      <textarea
        className="memo-textarea"
        placeholder="텍스트를 입력하세요."
        value={value}
        onChange={onChange}
      />
    </div>
  );
}
