/**
 * 로딩 점 애니메이션 컴포넌트
 * - 3개의 점이 순차적으로 깜빡이는 로딩 표시
 * - 전체 페이지 로딩 또는 섹션별 로딩에 사용
 */

import './LoadingDots.css';

interface LoadingDotsProps {
  /** 로딩 점 색상 (기본: main 테마 색상) */
  color?: 'main' | 'green' | 'mint' | 'grey';
  /** 점 크기 (기본: medium) */
  size?: 'small' | 'medium' | 'large';
  /** 컨테이너 내 수직/수평 중앙 정렬 (기본: true) */
  centered?: boolean;
  /** 부모 요소를 채우는 오버레이 (Layout의 main 영역 내부에서 사용) */
  fillParent?: boolean;
  /** 추가 CSS 클래스 */
  className?: string;
}

/**
 * 로딩 점 애니메이션
 * @example
 * // 기본 사용 (중앙 정렬)
 * <LoadingDots />
 *
 * // 인라인 사용 (중앙 정렬 없음)
 * <LoadingDots centered={false} size="small" />
 *
 * // 부모 영역 채우기 (Layout 내부에서 사용, Header/Nav 클릭 가능)
 * <LoadingDots fillParent />
 */
export default function LoadingDots({
  color = 'main',
  size = 'medium',
  centered = true,
  fillParent = false,
  className = '',
}: LoadingDotsProps) {
  const sizeClass = `loading-dots--${size}`;
  const centeredClass = centered ? 'loading-dots--centered' : '';
  const fillParentClass = fillParent ? 'loading-dots--fill-parent' : '';

  return (
    <div className={`loading-dots ${sizeClass} ${centeredClass} ${fillParentClass} ${className}`}>
      <span className={`loading-dot loading-dot--${color}`} />
      <span className={`loading-dot loading-dot--${color}`} />
      <span className={`loading-dot loading-dot--${color}`} />
    </div>
  );
}
