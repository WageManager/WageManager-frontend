import type { BankName } from '../../../constants/bank';
import { BANK_INFO } from '../../../constants/bank';
import './BankSelectModal.css';

interface BankItemProps {
  bankName: BankName;
  isSelected: boolean;
  onClick: (bankName: BankName) => void;
}

/**
 * 개별 은행 카드 컴포넌트
 * - 은행 로고 + 짧은 이름 표시
 * - 선택된 은행은 하이라이트
 */
export default function BankItem({ bankName, isSelected, onClick }: BankItemProps) {
  const bankInfo = BANK_INFO[bankName];

  return (
    <button
      type="button"
      className={`bank-item ${isSelected ? 'bank-item-selected' : ''}`}
      onClick={() => onClick(bankName)}
      aria-pressed={isSelected}
    >
      <div className="bank-item-logo">
        <img src={bankInfo.logo} alt={`${bankName} 로고`} />
      </div>
      <div className="bank-item-name">{bankName}</div>
    </button>
  );
}
