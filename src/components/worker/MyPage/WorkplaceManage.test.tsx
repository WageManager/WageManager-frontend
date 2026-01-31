/**
 * WorkplaceManage 컴포넌트 테스트
 * - 현재 근무지 목록 표시
 * - 이전 근무 이력 표시
 * - 로딩 상태
 * - 빈 상태 처리
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import WorkplaceManage from './WorkplaceManage';
import type { WorkplaceDisplay } from '../../../types/worker/workerMypage.types';

// ============ 테스트 데이터 ============

const mockCurrentWorkplaces: WorkplaceDisplay[] = [
  {
    workplaceName: '카페A',
    hourlyWage: 10000,
    startDate: '2024년 1월 15일',
  },
  {
    workplaceName: '레스토랑B',
    hourlyWage: 12000,
    startDate: '2024년 2월 1일',
  },
];

const mockPreviousWorkplaces: WorkplaceDisplay[] = [
  {
    workplaceName: '편의점C',
    hourlyWage: 9860,
    startDate: '2023년 6월 1일',
    endDate: '2023년 12월 31일',
  },
];

// ============ 헬퍼 함수 ============

const renderWorkplaceManage = (
  workplaces: WorkplaceDisplay[] = mockCurrentWorkplaces,
  previousWorkplaces: WorkplaceDisplay[] = mockPreviousWorkplaces,
  isLoading = false
) => {
  return render(
    <WorkplaceManage
      workplaces={workplaces}
      previousWorkplaces={previousWorkplaces}
      isLoading={isLoading}
    />
  );
};

// ============ 테스트 ============

describe('WorkplaceManage', () => {
  describe('로딩 상태', () => {
    it('로딩 중일 때 로딩 인디케이터가 표시된다', () => {
      renderWorkplaceManage([], [], true);

      // LoadingDots 컴포넌트 확인
      const loadingDots = document.querySelector('.loading-dots');
      expect(loadingDots).toBeInTheDocument();
    });

    it('로딩 중일 때 근무지 목록이 표시되지 않는다', () => {
      renderWorkplaceManage(mockCurrentWorkplaces, mockPreviousWorkplaces, true);

      expect(screen.queryByText('카페A')).not.toBeInTheDocument();
      expect(screen.queryByText('편의점C')).not.toBeInTheDocument();
    });
  });

  describe('현재 근무지 표시', () => {
    it('섹션 타이틀이 표시된다', () => {
      renderWorkplaceManage();

      expect(screen.getByText('근무지 정보')).toBeInTheDocument();
    });

    it('현재 근무지 목록이 표시된다', () => {
      renderWorkplaceManage();

      expect(screen.getByText('카페A')).toBeInTheDocument();
      expect(screen.getByText('레스토랑B')).toBeInTheDocument();
    });

    it('시급이 포맷팅되어 표시된다', () => {
      renderWorkplaceManage();

      expect(screen.getByText('10,000원')).toBeInTheDocument();
      expect(screen.getByText('12,000원')).toBeInTheDocument();
    });

    it('입사 날짜가 표시된다', () => {
      renderWorkplaceManage();

      expect(screen.getByText('2024년 1월 15일')).toBeInTheDocument();
      expect(screen.getByText('2024년 2월 1일')).toBeInTheDocument();
    });

    it('현재 근무지에는 퇴사 날짜가 표시되지 않는다', () => {
      renderWorkplaceManage();

      // 현재 근무지 섹션에서는 퇴사 날짜 라벨이 없어야 함
      const exitDateLabels = screen.queryAllByText('퇴사 날짜:');
      // 이전 근무지에서만 표시됨
      expect(exitDateLabels).toHaveLength(1);
    });

    it('현재 근무지가 없으면 안내 메시지가 표시된다', () => {
      renderWorkplaceManage([]);

      expect(screen.getByText('현재 근무지가 없습니다.')).toBeInTheDocument();
    });
  });

  describe('이전 근무 이력 표시', () => {
    it('섹션 타이틀이 표시된다', () => {
      renderWorkplaceManage();

      expect(screen.getByText('이전 근무 이력')).toBeInTheDocument();
    });

    it('이전 근무지 목록이 표시된다', () => {
      renderWorkplaceManage();

      expect(screen.getByText('편의점C')).toBeInTheDocument();
    });

    it('퇴사 날짜가 표시된다', () => {
      renderWorkplaceManage();

      expect(screen.getByText('2023년 12월 31일')).toBeInTheDocument();
    });

    it('이전 근무 이력이 없으면 안내 메시지가 표시된다', () => {
      renderWorkplaceManage(mockCurrentWorkplaces, []);

      expect(screen.getByText('이전 근무 이력이 없습니다.')).toBeInTheDocument();
    });
  });

  describe('빈 상태', () => {
    it('모든 근무지가 없으면 두 안내 메시지가 표시된다', () => {
      renderWorkplaceManage([], []);

      expect(screen.getByText('현재 근무지가 없습니다.')).toBeInTheDocument();
      expect(screen.getByText('이전 근무 이력이 없습니다.')).toBeInTheDocument();
    });
  });

  describe('근무지 카드 구조', () => {
    it('근무지 라벨이 표시된다', () => {
      renderWorkplaceManage();

      const workplaceLabels = screen.getAllByText('근무지:');
      expect(workplaceLabels.length).toBeGreaterThan(0);
    });

    it('입사 날짜 라벨이 표시된다', () => {
      renderWorkplaceManage();

      const startDateLabels = screen.getAllByText('입사 날짜:');
      expect(startDateLabels.length).toBeGreaterThan(0);
    });

    it('시급 라벨이 표시된다', () => {
      renderWorkplaceManage();

      const wageLabels = screen.getAllByText('시급:');
      expect(wageLabels.length).toBeGreaterThan(0);
    });
  });
});
