/**
 * WorkEditRequestList 컴포넌트 테스트
 * - 정정 요청 목록 표시
 * - 상태별 스타일
 * - 로딩 상태
 * - 빈 상태 처리
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import WorkEditRequestList from './WorkEditRequestList';
import type { EditRequestDisplay } from '../../../types/worker/workerMypage.types';

// ============ 테스트 데이터 ============

const mockRequests: EditRequestDisplay[] = [
  {
    place: '카페A',
    date: '3월 15일',
    startTime: '09:00',
    endTime: '14:00',
    status: 'pending',
  },
  {
    place: '레스토랑B',
    date: '3월 10일',
    startTime: '14:00',
    endTime: '18:00',
    status: 'approved',
  },
  {
    place: '편의점C',
    date: '3월 5일',
    startTime: '10:00',
    endTime: '15:00',
    status: 'rejected',
  },
];

// ============ 헬퍼 함수 ============

const renderWorkEditRequestList = (
  requests: EditRequestDisplay[] = mockRequests,
  isLoading = false
) => {
  return render(
    <WorkEditRequestList requests={requests} isLoading={isLoading} />
  );
};

// ============ 테스트 ============

describe('WorkEditRequestList', () => {
  describe('로딩 상태', () => {
    it('로딩 중일 때 로딩 인디케이터가 표시된다', () => {
      renderWorkEditRequestList([], true);

      const loadingDots = document.querySelector('.loading-dots');
      expect(loadingDots).toBeInTheDocument();
    });

    it('로딩 중일 때도 타이틀이 표시된다', () => {
      renderWorkEditRequestList([], true);

      expect(screen.getByText('보낸 근무 요청')).toBeInTheDocument();
    });

    it('로딩 중일 때 요청 목록이 표시되지 않는다', () => {
      renderWorkEditRequestList(mockRequests, true);

      expect(screen.queryByText('카페A')).not.toBeInTheDocument();
    });
  });

  describe('요청 목록 표시', () => {
    it('타이틀이 표시된다', () => {
      renderWorkEditRequestList();

      expect(screen.getByText('보낸 근무 요청')).toBeInTheDocument();
    });

    it('모든 요청이 표시된다', () => {
      renderWorkEditRequestList();

      expect(screen.getByText('카페A')).toBeInTheDocument();
      expect(screen.getByText('레스토랑B')).toBeInTheDocument();
      expect(screen.getByText('편의점C')).toBeInTheDocument();
    });

    it('날짜가 표시된다', () => {
      renderWorkEditRequestList();

      expect(screen.getByText('3월 15일')).toBeInTheDocument();
      expect(screen.getByText('3월 10일')).toBeInTheDocument();
      expect(screen.getByText('3월 5일')).toBeInTheDocument();
    });

    it('근무 시간이 표시된다', () => {
      renderWorkEditRequestList();

      expect(screen.getByText('09:00 ~ 14:00')).toBeInTheDocument();
      expect(screen.getByText('14:00 ~ 18:00')).toBeInTheDocument();
      expect(screen.getByText('10:00 ~ 15:00')).toBeInTheDocument();
    });

    it('요청이 없으면 안내 메시지가 표시된다', () => {
      renderWorkEditRequestList([]);

      expect(screen.getByText('보낸 근무 요청이 없습니다.')).toBeInTheDocument();
    });
  });

  describe('상태 표시', () => {
    it('대기중 상태가 올바르게 표시된다', () => {
      renderWorkEditRequestList();

      expect(screen.getByText('대기중')).toBeInTheDocument();
    });

    it('승인됨 상태가 올바르게 표시된다', () => {
      renderWorkEditRequestList();

      expect(screen.getByText('승인됨')).toBeInTheDocument();
    });

    it('거절됨 상태가 올바르게 표시된다', () => {
      renderWorkEditRequestList();

      expect(screen.getByText('거절됨')).toBeInTheDocument();
    });

    it('상태별 CSS 클래스가 적용된다', () => {
      renderWorkEditRequestList();

      const pendingStatus = screen.getByText('대기중');
      expect(pendingStatus).toHaveClass('worker-mypage-request-status-pending');

      const approvedStatus = screen.getByText('승인됨');
      expect(approvedStatus).toHaveClass('worker-mypage-request-status-approved');

      const rejectedStatus = screen.getByText('거절됨');
      expect(rejectedStatus).toHaveClass('worker-mypage-request-status-rejected');
    });
  });

  describe('요청 카드 구조', () => {
    it('근무지 라벨이 표시된다', () => {
      renderWorkEditRequestList();

      const placeLabels = screen.getAllByText('근무지:');
      expect(placeLabels).toHaveLength(3);
    });

    it('날짜 라벨이 표시된다', () => {
      renderWorkEditRequestList();

      const dateLabels = screen.getAllByText('날짜:');
      expect(dateLabels).toHaveLength(3);
    });

    it('근무 시간 라벨이 표시된다', () => {
      renderWorkEditRequestList();

      const timeLabels = screen.getAllByText('근무 시간:');
      expect(timeLabels).toHaveLength(3);
    });

    it('상태 라벨이 표시된다', () => {
      renderWorkEditRequestList();

      const statusLabels = screen.getAllByText('상태:');
      expect(statusLabels).toHaveLength(3);
    });
  });

  describe('단일 요청', () => {
    it('하나의 요청만 있을 때 올바르게 표시된다', () => {
      const singleRequest: EditRequestDisplay[] = [
        {
          place: '테스트카페',
          date: '1월 1일',
          startTime: '08:00',
          endTime: '12:00',
          status: 'pending',
        },
      ];

      renderWorkEditRequestList(singleRequest);

      expect(screen.getByText('테스트카페')).toBeInTheDocument();
      expect(screen.getByText('1월 1일')).toBeInTheDocument();
      expect(screen.getByText('08:00 ~ 12:00')).toBeInTheDocument();
      expect(screen.getByText('대기중')).toBeInTheDocument();
    });
  });
});
