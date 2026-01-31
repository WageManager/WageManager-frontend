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
  /** 전체 화면 오버레이 */
  fullScreen?: boolean;
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
 * // 전체 화면 오버레이
 * <LoadingDots fullScreen />
 */
export default function LoadingDots({
  color = 'main',
  size = 'medium',
  centered = true,
  fullScreen = false,
  className = '',
}: LoadingDotsProps) {
  const sizeClass = `loading-dots--${size}`;
  const centeredClass = centered ? 'loading-dots--centered' : '';
  const fullScreenClass = fullScreen ? 'loading-dots--fullscreen' : '';

  return (
    <div className={`loading-dots ${sizeClass} ${centeredClass} ${fullScreenClass} ${className}`}>
      <span className={`loading-dot loading-dot--${color}`} />
      <span className={`loading-dot loading-dot--${color}`} />
      <span className={`loading-dot loading-dot--${color}`} />
    </div>
  );
}
