/**
 * AddWorkModal - 근무 추가 모달 컴포넌트
 */
import type { Dispatch, SetStateAction } from 'react';
import Swal from 'sweetalert2';
import './AddWorkModal.css';
import { HOUR_OPTIONS, MINUTE_OPTIONS, BREAK_OPTIONS } from '../../../constants/calendar';
import type { AddWorkForm, WorkplaceOption } from '../../../types/worker/monthlyCalendar.types';

// ============ 로컬 타입 ============

interface AddWorkModalProps {
  form: AddWorkForm | null;
  setForm: Dispatch<SetStateAction<AddWorkForm | null>>;
  workplaceOptions: WorkplaceOption[];
  onConfirm: (form: AddWorkForm) => void;
  onCancel: () => void;
}

// ============ 컴포넌트 ============

export default function AddWorkModal({
  form,
  setForm,
  workplaceOptions,
  onConfirm,
  onCancel,
}: AddWorkModalProps) {
  if (!form) return null;

  const handleFieldChange = <K extends keyof AddWorkForm>(
    field: K,
    value: AddWorkForm[K]
  ) => {
    setForm((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [field]: value,
      };
    });
  };

  const handleBreakChange = (value: string) => {
    handleFieldChange('breakMinutes', Number(value));
  };

  const handleConfirmClick = async () => {
    const result = await Swal.fire({
      title: '근무 추가하기',
      text: '입력한 내용으로 근무를 추가할까요?',
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

  return (
    <div className="add-work-modal-overlay">
      <div className="add-work-modal-card">
        <div className="add-work-modal-header">
          <div className="add-work-modal-title">근무 추가하기</div>
          <select
            className="add-work-select"
            value={form.contractId || ''}
            onChange={(e) => handleFieldChange('contractId', Number(e.target.value))}
          >
            {workplaceOptions.map((workplace) => (
              <option key={workplace.id} value={workplace.id}>
                {workplace.workplaceName || workplace.workerName}
              </option>
            ))}
          </select>
        </div>

        <div className="add-work-modal-body">
          <div className="add-work-field">
            <div className="add-work-label">근무 시간</div>
            <div className="add-work-time-row">
              <div className="add-work-time-group start-group">
                <input
                  type="date"
                  className="work-edit-input work-edit-input-date add-work-date-input"
                  value={form.date}
                  onChange={(e) => handleFieldChange('date', e.target.value)}
                />
                <select
                  className="work-edit-select"
                  value={form.startHour}
                  onChange={(e) => handleFieldChange('startHour', e.target.value)}
                >
                  {HOUR_OPTIONS.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
                <span className="add-work-time-colon">:</span>
                <select
                  className="work-edit-select"
                  value={form.startMinute}
                  onChange={(e) => handleFieldChange('startMinute', e.target.value)}
                >
                  {MINUTE_OPTIONS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <span className="work-edit-time-tilde">~</span>

              <div className="add-work-time-group end-group">
                <select
                  className="work-edit-select"
                  value={form.endHour}
                  onChange={(e) => handleFieldChange('endHour', e.target.value)}
                >
                  {HOUR_OPTIONS.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
                <span className="add-work-time-colon">:</span>
                <select
                  className="work-edit-select"
                  value={form.endMinute}
                  onChange={(e) => handleFieldChange('endMinute', e.target.value)}
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

          <div className="add-work-field">
            <div className="add-work-label">휴게 시간</div>
            <div className="work-edit-break-row">
              <select
                className="work-edit-select"
                value={form.breakMinutes}
                onChange={(e) => handleBreakChange(e.target.value)}
              >
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

        <div className="add-work-modal-actions">
          <button
            type="button"
            className="work-edit-btn work-edit-btn-confirm"
            onClick={handleConfirmClick}
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
    </div>
  );
}
