/**
 * WorkEditRequestBox - 근무 기록 정정 요청 폼 컴포넌트
 * 근무 시간 수정 및 정정 요청 제출
 */
import { useMemo, type Dispatch, type SetStateAction } from 'react';
import Swal from 'sweetalert2';
import './WorkEditRequestBox.css';
import { createUpdateField } from '../../../pages/workers/utils/updateField';
import { HOUR_OPTIONS, MINUTE_OPTIONS, BREAK_OPTIONS } from '../../../constants/calendar';
import type { EditForm } from '../../../types/worker/monthlyCalendar.types';

// ============ 로컬 타입 ============

type Variant = 'weekly' | 'monthly';

interface WorkEditRequestBoxProps {
  form: EditForm | null;
  setForm: Dispatch<SetStateAction<EditForm | null>>;
  onConfirm: (form: EditForm) => void;
  onDelete: (form: EditForm) => void;
  onCancel: () => void;
  variant?: Variant;
}

// ============ 컴포넌트 ============

export default function WorkEditRequestBox({
  form,
  setForm,
  onConfirm,
  onDelete,
  onCancel,
  variant,
}: WorkEditRequestBoxProps) {
  const updateField = createUpdateField(setForm);

  // 원본 데이터와 현재 폼 데이터 비교
  const hasChanges = useMemo(() => {
    if (!form || !form.originalData) return false;

    const original = form.originalData;
    const current = form;

    // 타입 변환을 고려한 비교
    const originalWage = Number(original.wage);
    const currentWage = Number(current.wage);

    return (
      original.place !== current.place ||
      originalWage !== currentWage ||
      original.date !== current.date ||
      original.startHour !== current.startHour ||
      original.startMinute !== current.startMinute ||
      original.endHour !== current.endHour ||
      original.endMinute !== current.endMinute
    );
  }, [form]);

  if (!form) return null;

  const handleConfirmClick = async () => {
    if (!hasChanges) return;

    const result = await Swal.fire({
      title: '근무 기록 정정 요청',
      text: '입력한 내용으로 근무 정정 요청을 보내시겠어요?',
      icon: 'question',
      confirmButtonText: '확인',
      cancelButtonText: '취소',
      showCancelButton: true,
      reverseButtons: true,
    });

    if (result.isConfirmed) {
      onConfirm(form);
    }
  };

  const boxClassName = `work-edit-box ${variant === 'weekly' ? 'weekly-style' : ''}`;

  return (
    <div className={boxClassName}>
      {/* 근무지 / 시급 */}
      <div className="work-edit-row">
        <div className="work-edit-field">
          <div className="work-edit-label">근무지</div>
          <input
            className="work-edit-input readonly work-edit-input-place"
            value={form.place}
            readOnly
          />
        </div>
        <div className="work-edit-field">
          <div className="work-edit-label">시급</div>
          <div className="work-edit-wage-wrapper">
            <input
              className="work-edit-input readonly work-edit-input-wage"
              value={Number(form.wage).toLocaleString()}
              readOnly
            />
            <span className="work-edit-wage-unit">원</span>
          </div>
        </div>
      </div>

      {/* 근무 시간 */}
      <div className="work-edit-row">
        <div className="work-edit-field full">
          <div className="work-edit-label">근무 시간</div>
          <div className="work-edit-time-row">
            {/* 날짜 */}
            <input
              type="date"
              className="work-edit-input work-edit-input-date"
              value={form.date}
              onChange={(e) => updateField('date', e.target.value)}
            />

            {/* 시작 시간 */}
            <select
              className="work-edit-select"
              value={form.startHour}
              onChange={(e) => updateField('startHour', e.target.value)}
            >
              {HOUR_OPTIONS.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
            <span>:</span>
            <select
              className="work-edit-select"
              value={form.startMinute}
              onChange={(e) => updateField('startMinute', e.target.value)}
            >
              {MINUTE_OPTIONS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>

            <span className="work-edit-time-tilde">~</span>

            {/* 종료 시간 */}
            <select
              className="work-edit-select"
              value={form.endHour}
              onChange={(e) => updateField('endHour', e.target.value)}
            >
              {HOUR_OPTIONS.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
            <span>:</span>
            <select
              className="work-edit-select"
              value={form.endMinute}
              onChange={(e) => updateField('endMinute', e.target.value)}
            >
              {MINUTE_OPTIONS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 휴게 시간 */}
      <div className="work-edit-row">
        <div className="work-edit-field">
          <div className="work-edit-label">휴게 시간</div>
          <div className="work-edit-break-row">
            <select className="work-edit-select" value={form.breakMinutes} disabled>
              {BREAK_OPTIONS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <span>분</span>
          </div>
        </div>
      </div>

      {/* 버튼 */}
      <div className="work-edit-actions">
        <button
          type="button"
          className="work-edit-btn work-edit-btn-confirm"
          onClick={handleConfirmClick}
          disabled={!hasChanges}
        >
          확인
        </button>
        <button
          type="button"
          className="work-edit-btn work-edit-btn-cancel"
          onClick={onCancel}
        >
          취소
        </button>
      </div>
    </div>
  );
}
