import type { UserType } from "../../../types/auth";

interface UserTypeSelectorProps {
  value: UserType | '';
  onChange: (type: UserType) => void;
}

export default function UserTypeSelector({ value, onChange }: UserTypeSelectorProps) {
  return (
    <div className="form-group">
      <label className="form-label">
        역할 <span className="required-star">*</span>
      </label>
      <div className="radio-group">
        <label className="radio-label">
          <input
            type="radio"
            name="userType"
            value="WORKER"
            checked={value === 'WORKER'}
            onChange={() => onChange('WORKER')}
            className="radio-input"
          />
          <span className="radio-text">근로자</span>
        </label>
        <label className="radio-label">
          <input
            type="radio"
            name="userType"
            value="EMPLOYER"
            checked={value === 'EMPLOYER'}
            onChange={() => onChange('EMPLOYER')}
            className="radio-input"
          />
          <span className="radio-text">고용주</span>
        </label>
      </div>
    </div>
  );
}