// 포맷 관련 공통 유틸리티 함수

// 통화 포맷 (한국 원화)
export const formatKRW = (value: number | null | undefined): string =>
  typeof value === "number" ? `${value.toLocaleString("ko-KR")}원` : "-";

// 휴게 시간 포맷
export const formatBreakTime = (minutes: number | null | undefined): string =>
  typeof minutes === "number" ? `${minutes}분` : "-";
