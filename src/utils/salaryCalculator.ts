/**
 * 급여 계산 관련 유틸리티 함수
 * - 근무 시간 계산, 기본 급여 계산, 총 급여 합산
 */

import { timeStringToDecimal } from "./formatUtils";

/**
 * 근무 시간 계산 (시간 단위)
 * @param startTime 출근 시간 ("HH:mm" 형식)
 * @param endTime 퇴근 시간 ("HH:mm" 형식)
 * @param breakMinutes 휴게 시간 (분)
 * @returns 실제 근무 시간 (소수점 시간)
 */
export const calculateWorkHours = (
  startTime: string,
  endTime: string,
  breakMinutes: number
): number => {
  const startDecimal = timeStringToDecimal(startTime);
  const endDecimal = timeStringToDecimal(endTime);
  const breakHours = (breakMinutes || 0) / 60;

  return endDecimal - startDecimal - breakHours;
};

/**
 * 기본 급여 계산 (근무시간 × 시급)
 * @param workHours 근무 시간 (시간 단위)
 * @param hourlyWage 시급
 * @returns 기본 급여 (원)
 */
export const calculateBasePay = (
  workHours: number,
  hourlyWage: number
): number => {
  return Math.floor(workHours * (hourlyWage || 0));
};

/**
 * 단일 근무 기록의 급여 계산
 * @param startTime 출근 시간 ("HH:mm" 형식)
 * @param endTime 퇴근 시간 ("HH:mm" 형식)
 * @param breakMinutes 휴게 시간 (분)
 * @param hourlyWage 시급
 * @returns 급여 (원)
 */
export const calculateWage = (
  startTime: string,
  endTime: string,
  breakMinutes: number,
  hourlyWage: number
): number => {
  const workHours = calculateWorkHours(startTime, endTime, breakMinutes);
  return calculateBasePay(workHours, hourlyWage);
};

/**
 * 근무 기록 배열의 총 급여 합산
 * @param records wage 속성을 가진 근무 기록 배열
 * @returns 총 급여 (원)
 */
export const calculateTotalWage = <T extends { wage: number }>(
  records: T[]
): number => {
  if (!records || records.length === 0) {
    return 0;
  }
  return records.reduce((sum, record) => sum + (record.wage ?? 0), 0);
};
