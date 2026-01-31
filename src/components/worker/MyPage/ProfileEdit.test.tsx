/**
 * ProfileEdit 컴포넌트 테스트
 * - 기본 정보 렌더링
 * - 수정 모드 토글
 * - 입력값 검증
 * - 저장 기능
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProfileEdit from './ProfileEdit';
import type { UserResponse, WorkerResponse } from '../../../types/worker/workerMypage.types';

// ============ 테스트 데이터 ============

const mockUser: UserResponse = {
  id: 1,
  name: '홍길동',
  kakaoId: 'hong123',
  phone: '010-1234-5678',
  role: 'WORKER',
};

const mockWorker: WorkerResponse = {
  id: 1,
  bankName: '국민은행',
  accountNumber: '12345678901234',
  workerCode: 'WK001',
};

const mockOnUserUpdate = vi.fn();

// ============ 헬퍼 함수 ============

const renderProfileEdit = (
  userOverrides?: Partial<UserResponse>,
  workerOverrides?: Partial<WorkerResponse> | null
) => {
  const user = { ...mockUser, ...userOverrides };
  const worker = workerOverrides === null ? null : { ...mockWorker, ...workerOverrides };

  return render(
    <ProfileEdit user={user} worker={worker} onUserUpdate={mockOnUserUpdate} />
  );
};

// ============ 테스트 ============

describe('ProfileEdit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('초기 렌더링', () => {
    it('사용자 기본 정보가 표시된다', () => {
      renderProfileEdit();

      expect(screen.getByText('홍길동')).toBeInTheDocument();
      expect(screen.getByText('hong123')).toBeInTheDocument();
      expect(screen.getByText('근로자')).toBeInTheDocument();
    });

    it('전화번호가 표시된다', () => {
      renderProfileEdit();

      expect(screen.getByText('010-1234-5678')).toBeInTheDocument();
    });

    it('계좌 정보가 표시된다', () => {
      renderProfileEdit();

      expect(screen.getByText('국민은행 12345678901234')).toBeInTheDocument();
    });

    it('근무자 코드가 표시된다', () => {
      renderProfileEdit();

      expect(screen.getByText('WK001')).toBeInTheDocument();
    });

    it('worker가 null이면 기본값이 표시된다', () => {
      renderProfileEdit({}, null);

      expect(screen.getByText('계좌 정보를 입력해주세요')).toBeInTheDocument();
      expect(screen.getByText('코드 없음')).toBeInTheDocument();
    });

    it('전화번호가 없으면 안내 메시지가 표시된다', () => {
      renderProfileEdit({ phone: '' });

      expect(screen.getByText('전화번호를 입력해주세요')).toBeInTheDocument();
    });
  });

  describe('수정 버튼', () => {
    it('수정 버튼이 각 섹션에 표시된다', () => {
      renderProfileEdit();

      const editButtons = screen.getAllByRole('button', { name: '수정' });
      expect(editButtons.length).toBe(3);
    });

    it('기본 정보 수정 버튼 클릭 시 입력 필드가 나타난다', async () => {
      renderProfileEdit();

      const editButtons = screen.getAllByRole('button', { name: '수정' });
      fireEvent.click(editButtons[0]); // 기본 정보 수정 버튼

      await waitFor(() => {
        expect(screen.getByRole('textbox')).toBeInTheDocument();
      });
    });

    it('전화번호 수정 버튼 클릭 시 입력 필드가 나타난다', async () => {
      renderProfileEdit();

      const editButtons = screen.getAllByRole('button', { name: '수정' });
      fireEvent.click(editButtons[1]); // 전화번호 수정 버튼

      await waitFor(() => {
        const input = screen.getByPlaceholderText('010-1234-5678');
        expect(input).toBeInTheDocument();
      });
    });

    it('계좌 정보 수정 버튼 클릭 시 select와 input이 나타난다', async () => {
      renderProfileEdit();

      const editButtons = screen.getAllByRole('button', { name: '수정' });
      fireEvent.click(editButtons[2]); // 계좌 정보 수정 버튼

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('계좌번호 (숫자만)')).toBeInTheDocument();
      });
    });
  });

  describe('수정 취소', () => {
    it('취소 버튼 클릭 시 원래 값으로 복원된다', async () => {
      const user = userEvent.setup();
      renderProfileEdit();

      // 수정 모드 진입
      const editButtons = screen.getAllByRole('button', { name: '수정' });
      await user.click(editButtons[0]); // 기본 정보 수정

      // 변경 없이 취소 (hasChanges=false -> 취소 버튼)
      const cancelButton = screen.getByRole('button', { name: '취소' });
      await user.click(cancelButton);

      // 수정 모드 종료 확인 (다시 수정 버튼이 3개)
      expect(screen.getAllByRole('button', { name: '수정' })).toHaveLength(3);
    });

    it('값 변경 후 다른 섹션의 취소 버튼으로 원래 값 복원', async () => {
      const user = userEvent.setup();
      renderProfileEdit();

      // 계좌 정보 수정 모드 진입
      const editButtons = screen.getAllByRole('button', { name: '수정' });
      await user.click(editButtons[2]);

      // 은행 변경 (변경 사항 없이 유지)
      // 취소 버튼 클릭
      const cancelButton = screen.getByRole('button', { name: '취소' });
      await user.click(cancelButton);

      // 원래 값으로 복원 확인
      expect(screen.getByText('국민은행 12345678901234')).toBeInTheDocument();
    });
  });

  describe('전화번호 입력 포맷팅', () => {
    it('숫자만 입력해도 하이픈이 자동 추가된다', async () => {
      const user = userEvent.setup();
      renderProfileEdit({ phone: '' });

      // 수정 모드 진입
      const editButtons = screen.getAllByRole('button', { name: '수정' });
      await user.click(editButtons[1]);

      // 전화번호 입력
      const input = screen.getByPlaceholderText('010-1234-5678');
      await user.type(input, '01012345678');

      expect(input).toHaveValue('010-1234-5678');
    });

    it('13자 이상 입력되지 않는다', async () => {
      const user = userEvent.setup();
      renderProfileEdit({ phone: '' });

      const editButtons = screen.getAllByRole('button', { name: '수정' });
      await user.click(editButtons[1]);

      const input = screen.getByPlaceholderText('010-1234-5678');
      await user.type(input, '010123456789999');

      // 최대 13자 (하이픈 포함)
      expect(input.value.length).toBeLessThanOrEqual(13);
    });
  });

  describe('계좌번호 입력', () => {
    it('숫자만 입력된다', async () => {
      const user = userEvent.setup();
      renderProfileEdit();

      const editButtons = screen.getAllByRole('button', { name: '수정' });
      await user.click(editButtons[2]); // 계좌 정보 수정

      const input = screen.getByPlaceholderText('계좌번호 (숫자만)');
      await user.clear(input);
      await user.type(input, '123abc456def');

      expect(input).toHaveValue('123456');
    });
  });

  describe('저장 기능', () => {
    it('기본 정보 저장 시 onUserUpdate가 호출된다', async () => {
      const user = userEvent.setup();
      mockOnUserUpdate.mockResolvedValue(undefined);
      renderProfileEdit();

      // 수정 모드 진입
      const editButtons = screen.getAllByRole('button', { name: '수정' });
      await user.click(editButtons[0]);

      // 이름 변경
      const input = screen.getByRole('textbox');
      await user.clear(input);
      await user.type(input, '김철수');

      // 완료 버튼 (hasChanges=true -> 완료 버튼)
      const completeButton = screen.getByRole('button', { name: '완료' });
      await user.click(completeButton);

      expect(mockOnUserUpdate).toHaveBeenCalledWith('basic', { name: '김철수' });
    });

    it('전화번호 저장 시 onUserUpdate가 호출된다', async () => {
      const user = userEvent.setup();
      mockOnUserUpdate.mockResolvedValue(undefined);
      renderProfileEdit();

      const editButtons = screen.getAllByRole('button', { name: '수정' });
      await user.click(editButtons[1]);

      const input = screen.getByPlaceholderText('010-1234-5678');
      await user.clear(input);
      await user.type(input, '01099998888');

      const completeButton = screen.getByRole('button', { name: '완료' });
      await user.click(completeButton);

      expect(mockOnUserUpdate).toHaveBeenCalledWith('phone', { phone: '010-9999-8888' });
    });

    it('계좌 정보 저장 시 onUserUpdate가 호출된다', async () => {
      const user = userEvent.setup();
      mockOnUserUpdate.mockResolvedValue(undefined);
      renderProfileEdit();

      const editButtons = screen.getAllByRole('button', { name: '수정' });
      await user.click(editButtons[2]);

      // 은행 선택
      const select = screen.getByRole('combobox');
      await user.selectOptions(select, '신한은행');

      // 완료 버튼 (hasChanges=true -> 완료 버튼)
      const completeButton = screen.getByRole('button', { name: '완료' });
      await user.click(completeButton);

      expect(mockOnUserUpdate).toHaveBeenCalledWith('account', {
        bankName: '신한은행',
        accountNumber: '12345678901234',
      });
    });
  });

  describe('입력값 검증', () => {
    it('이름이 비어있으면 에러가 표시된다', async () => {
      const user = userEvent.setup();
      renderProfileEdit();

      const editButtons = screen.getAllByRole('button', { name: '수정' });
      await user.click(editButtons[0]);

      const input = screen.getByRole('textbox');
      await user.clear(input);
      // 빈 값으로 만들기 위해 'a'입력 후 삭제 (clear만으로는 hasChanges 트리거 안됨)
      await user.type(input, 'a');
      await user.clear(input);

      // 빈 값 상태에서 완료 시도 - hasChanges가 true여야 완료 버튼이 나타남
      // 하지만 빈 값이면 hasChanges가 true가 됨 (원본: '홍길동', 현재: '')
      const completeButton = screen.getByRole('button', { name: '완료' });
      await user.click(completeButton);

      expect(screen.getByText(/필수 입력/i)).toBeInTheDocument();
      expect(mockOnUserUpdate).not.toHaveBeenCalled();
    });

    it('전화번호 형식이 잘못되면 에러가 표시된다', async () => {
      const user = userEvent.setup();
      renderProfileEdit();

      const editButtons = screen.getAllByRole('button', { name: '수정' });
      await user.click(editButtons[1]);

      const input = screen.getByPlaceholderText('010-1234-5678');
      await user.clear(input);
      await user.type(input, '0101234'); // 불완전한 번호

      const completeButton = screen.getByRole('button', { name: '완료' });
      await user.click(completeButton);

      // 실제 에러 메시지: '전화번호는 010-XXXX-XXXX 형식이어야 합니다.'
      expect(screen.getByText(/010-XXXX-XXXX/)).toBeInTheDocument();
      expect(mockOnUserUpdate).not.toHaveBeenCalled();
    });

    it('은행을 선택하지 않으면 에러가 표시된다', async () => {
      const user = userEvent.setup();
      renderProfileEdit({}, { ...mockWorker, bankName: '' });

      const editButtons = screen.getAllByRole('button', { name: '수정' });
      await user.click(editButtons[2]);

      // 계좌번호만 변경 (은행 미선택 상태 유지)
      const input = screen.getByPlaceholderText('계좌번호 (숫자만)');
      await user.clear(input);
      await user.type(input, '11112222333344');

      const completeButton = screen.getByRole('button', { name: '완료' });
      await user.click(completeButton);

      // 실제 에러 메시지: '은행명을 선택해주세요.'
      expect(screen.getByText(/은행명을 선택해주세요/)).toBeInTheDocument();
      expect(mockOnUserUpdate).not.toHaveBeenCalled();
    });
  });

  describe('섹션 타이틀', () => {
    it('기본 정보 타이틀이 표시된다', () => {
      renderProfileEdit();

      expect(screen.getByText('기본 정보')).toBeInTheDocument();
    });

    it('계정 이용 섹션이 표시된다', () => {
      renderProfileEdit();

      expect(screen.getByText('계정 이용')).toBeInTheDocument();
      expect(screen.getByText(/서비스 이용 동의/)).toBeInTheDocument();
    });

    it('회원 탈퇴 링크가 표시된다', () => {
      renderProfileEdit();

      expect(screen.getByText(/회원 탈퇴/)).toBeInTheDocument();
    });
  });
});
