// 숫자를 2자리 문자열로 변환 (1 -> "01", 10 -> "10")
export const pad2 = (n: number): string => (n < 10 ? `0${n}` : `${n}`);

// 주의 시작일(일요일)을 구하는 함수
export const getWeekStart = (date: Date | string): Date => {
  const d = new Date(date);
  const day = d.getDay(); // 0(일요일) ~ 6(토요일)
  d.setDate(d.getDate() - day); // 일요일로 이동
  return d;
};

// 날짜 형식 변환 함수 (2025-12-17 -> 2025년 12월 17일)
export const formatDateToKorean = (dateString: string): string => {
  if (!dateString) return "";
  try {
    const [year, month, day] = dateString.split("-");

    // Strict Null Checks - month나 day가 없는 경우를 대비해 체크
    if (!year || !month || !day) return dateString; 

    return `${year}년 ${parseInt(month)}월 ${parseInt(day)}일`;
  } catch {
    return dateString;
  }
};

// 날짜 형식 변환 함수 (2025-12-17 -> 12월 17일)
export const formatDateToMonthDay = (dateString: string): string => {
  if (!dateString) return "";
  try {
    const [, month, day] = dateString.split("-");
    if (!month || !day) return dateString;

    return `${parseInt(month)}월 ${parseInt(day)}일`;
  } catch {
    return dateString;
  }
};

interface TimeObject {
  hour?: number | string;
  minute?: number | string;
}

// 시간 형식 변환 함수 ({hour, minute} 또는 "HH:mm:ss" -> "HH:MM")
export const formatTime = (timeObj: TimeObject | string): string => {
  if (!timeObj) return "";

  // 문자열 형식인 경우 ("HH:mm:ss" -> "HH:mm")
  if (typeof timeObj === "string") {
    try {
      const [hour, minute] = timeObj.split(":");
      if (hour && minute) {
        return `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`;
      }
    } catch {
      return "";
    }
  }

  // 객체 형식인 경우 ({hour, minute} -> "HH:mm")
  if (
    typeof timeObj === "object" &&
    timeObj.hour !== undefined &&
    timeObj.minute !== undefined
  ) {
    const hour = String(timeObj.hour).padStart(2, "0");
    const minute = String(timeObj.minute).padStart(2, "0");
    return `${hour}:${minute}`;
  }

  return "";
};

interface ParsedWorkDate {
  date: number;
  day: string;
}

// 날짜 문자열을 숫자와 요일로 변환 ("2025-12-17" -> { date: 17, day: "수" })
export const parseWorkDate = (dateString: string): ParsedWorkDate => {
  if (!dateString) return { date: 0, day: "" };

  try {
    const parts = dateString.split("-").map(Number);

    // 배열에 3개 요소가 다 있는지 확인
    if (parts.length < 3) return { date: 0, day: "" };

    const [year, month, day] = parts as [number, number, number];
    
    const dateObj = new Date(year, month - 1, day); 
    const dayIndex = dateObj.getDay();
    const dayLabels = ["일", "월", "화", "수", "목", "금", "토"];

    return {
      date: day,
      day: dayLabels[dayIndex] || "",
    };
  } catch {
    return { date: 0, day: "" };
  }
};

/**
 * 서버 시간 포맷을 한국어 형식으로 변환
 * @param {string} dateString - ISO 형식의 날짜 문자열
 * @returns {string} 한국어 형식의 날짜 문자열
 */
export const formatDateTime = (dateString: string): string => {
  if (!dateString) return "";

  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}년 ${month}월 ${day}일 ${hours}:${minutes}`;
};
