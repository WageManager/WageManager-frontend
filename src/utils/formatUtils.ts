/**
 * 포맷 관련 공통 유틸리티 함수
 */

/** 통화 포맷 (한국 원화) */
export const formatKRW = (value: number | null | undefined): string =>
  Number.isFinite(value) ? `${(value as number).toLocaleString("ko-KR")}원` : "-";

/** 휴게 시간 포맷 */
export const formatBreakTime = (minutes: number | null | undefined): string =>
  Number.isFinite(minutes) ? `${minutes as number}분` : "-";

/** 전화번호 포맷팅 (하이픈 자동 추가: 010-1234-5678) */
export function formatPhoneNumber(value: string): string {
  const numbersOnly = value.replace(/[^0-9]/g, '');

  if (numbersOnly.length <= 3) {
    return numbersOnly;
  }
  if (numbersOnly.length <= 7) {
    return `${numbersOnly.slice(0, 3)}-${numbersOnly.slice(3)}`;
  }
  return `${numbersOnly.slice(0, 3)}-${numbersOnly.slice(3, 7)}-${numbersOnly.slice(7, 11)}`;
}

/**
 * 시간 문자열 "HH:MM"을 소수(decimal)로 변환
 * @example "14:30" → 14.5, "09:15" → 9.25
 */
export const timeStringToDecimal = (timeString: string): number => {
  if (!timeString) return 0;
  const [hourStr, minStr] = timeString.split(":");
  const hour = parseInt(hourStr || "0", 10) || 0;
  const min = parseInt(minStr || "0", 10) || 0;
  return hour + min / 60;
};
