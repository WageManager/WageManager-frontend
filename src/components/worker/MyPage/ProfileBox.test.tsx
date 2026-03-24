/**
 * ProfileBox 컴포넌트 테스트
 * - 프로필 이미지/플레이스홀더 렌더링
 * - 사용자 이름 표시
 * - 탭 네비게이션
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProfileBox from './ProfileBox';
import type { UserResponse, ActiveTab } from '../../../types/worker/workerMypage.types';

// ============ 테스트 데이터 ============

const mockUser: UserResponse = {
  id: 1,
  name: '홍길동',
  kakaoId: 'hong123',
  phone: '010-1234-5678',
  userType: 'WORKER',
  profileImageUrl: 'https://example.com/profile.jpg',
  workerCode: null,
  bankName: null,
  accountNumber: null,
};

const mockOnTabChange = vi.fn();

// ============ 헬퍼 함수 ============

const renderProfileBox = (
  userOverrides?: Partial<UserResponse>,
  activeTab: ActiveTab = 'profile'
) => {
  const user = { ...mockUser, ...userOverrides };
  return render(
    <ProfileBox user={user} activeTab={activeTab} onTabChange={mockOnTabChange} />
  );
};

// ============ 테스트 ============

describe('ProfileBox', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('프로필 정보 렌더링', () => {
    it('사용자 이름이 표시된다', () => {
      renderProfileBox();

      expect(screen.getByText('홍길동')).toBeInTheDocument();
    });

    it('이름이 없으면 빈 문자열이 표시된다', () => {
      renderProfileBox({ name: '' });

      // 빈 이름도 렌더링되어야 함
      const nameElement = document.querySelector('.worker-mypage-profile-name');
      expect(nameElement).toBeInTheDocument();
      expect(nameElement?.textContent).toBe('');
    });

    it('프로필 이미지가 있으면 이미지가 표시된다', () => {
      renderProfileBox();

      const image = screen.getByAltText('프로필');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', 'https://example.com/profile.jpg');
    });

    it('프로필 이미지가 없으면 플레이스홀더가 표시된다', () => {
      renderProfileBox({ profileImageUrl: null });

      // 이미지가 없고 플레이스홀더가 있어야 함
      expect(screen.queryByAltText('프로필')).not.toBeInTheDocument();
      const placeholder = document.querySelector('.worker-mypage-avatar-placeholder');
      expect(placeholder).toBeInTheDocument();
    });
  });

  describe('탭 네비게이션', () => {
    it('세 개의 탭 버튼이 표시된다', () => {
      renderProfileBox();

      expect(screen.getByText('내 프로필 수정')).toBeInTheDocument();
      expect(screen.getByText('근무지 관리')).toBeInTheDocument();
      expect(screen.getByText('보낸 근무 요청')).toBeInTheDocument();
    });

    it('활성 탭에 올바른 스타일이 적용된다', () => {
      renderProfileBox({}, 'profile');

      const profileTab = screen.getByText('내 프로필 수정');
      expect(profileTab).toHaveClass('worker-mypage-nav-checked');

      const workplaceTab = screen.getByText('근무지 관리');
      expect(workplaceTab).toHaveClass('worker-mypage-nav-li');
    });

    it('탭 클릭 시 onTabChange가 호출된다', async () => {
      const user = userEvent.setup();
      renderProfileBox();

      await user.click(screen.getByText('근무지 관리'));

      expect(mockOnTabChange).toHaveBeenCalledWith('workplace');
    });

    it('다른 탭 클릭 시 해당 탭으로 전환된다', async () => {
      const user = userEvent.setup();
      renderProfileBox();

      await user.click(screen.getByText('보낸 근무 요청'));

      expect(mockOnTabChange).toHaveBeenCalledWith('editRequest');
    });

    it('workplace 탭이 활성화된 경우 올바른 스타일이 적용된다', () => {
      renderProfileBox({}, 'workplace');

      const profileTab = screen.getByText('내 프로필 수정');
      expect(profileTab).toHaveClass('worker-mypage-nav-li');

      const workplaceTab = screen.getByText('근무지 관리');
      expect(workplaceTab).toHaveClass('worker-mypage-nav-checked');
    });

    it('editRequest 탭이 활성화된 경우 올바른 스타일이 적용된다', () => {
      renderProfileBox({}, 'editRequest');

      const editRequestTab = screen.getByText('보낸 근무 요청');
      expect(editRequestTab).toHaveClass('worker-mypage-nav-checked');
    });
  });

  describe('구조', () => {
    it('nav 요소 안에 렌더링된다', () => {
      renderProfileBox();

      const nav = document.querySelector('nav.worker-mypage-nav');
      expect(nav).toBeInTheDocument();
    });

    it('탭 버튼들이 리스트 아이템 안에 있다', () => {
      renderProfileBox();

      const listItems = document.querySelectorAll('li');
      expect(listItems).toHaveLength(3);
    });
  });
});
