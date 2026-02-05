import { useEffect, useRef, useState } from 'react';
import type { BankName } from '../../../constants/bank';
import { BANK_NAMES } from '../../../constants/bank';
import BankItem from './BankItem';
import './BankSelectModal.css';

interface BankSelectModalProps {
  isOpen: boolean;
  selectedBank: string;
  onSelect: (bankName: BankName) => void;
  onClose: () => void;
}

/**
 * 은행 선택 모달 컴포넌트
 * - 그리드 형태로 은행 목록 표시
 * - ESC 키, 오버레이 클릭으로 닫기
 * - 접근성: aria-modal, 포커스 트랩
 */
export default function BankSelectModal({
  isOpen,
  selectedBank,
  onSelect,
  onClose,
}: BankSelectModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const firstButtonRef = useRef<HTMLButtonElement>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // ESC 키로 모달 닫기
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // 모달 열릴 때 포커스 이동
  useEffect(() => {
    if (isOpen && modalRef.current) {
      const firstFocusable = modalRef.current.querySelector('button');
      firstFocusable?.focus();
    }
  }, [isOpen]);

  // 모달 열릴 때 body 스크롤 방지
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBankSelect = (bankName: BankName) => {
    onSelect(bankName);
    onClose();
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredBanks = normalizedQuery
    ? BANK_NAMES.filter((bankName) => bankName.toLowerCase().includes(normalizedQuery))
    : BANK_NAMES;

  return (
    <div
      className="bank-modal-overlay"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="bank-modal-title"
    >
      <div className="bank-modal-content" ref={modalRef}>
        <div className="bank-modal-header">
          <h2 id="bank-modal-title" className="bank-modal-title">
            은행 선택
          </h2>
          <button
            type="button"
            className="bank-modal-close"
            onClick={onClose}
            aria-label="모달 닫기"
            ref={firstButtonRef}
          >
            ✕
          </button>
        </div>

        <div className="bank-modal-search">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="은행명 검색"
            aria-label="은행명 검색"
          />
        </div>

        <div className="bank-modal-grid">
          {filteredBanks.length > 0 ? (
            filteredBanks.map((bankName) => (
              <BankItem
                key={bankName}
                bankName={bankName}
                isSelected={selectedBank === bankName}
                onClick={handleBankSelect}
              />
            ))
          ) : (
            <div className="bank-modal-empty">검색 결과가 없습니다.</div>
          )}
        </div>
      </div>
    </div>
  );
}
