import { useState, useMemo, useEffect, useCallback } from "react";
import { getContracts, getContractDetail, getWorkRecords, getSalaries, getPayments } from "../../api/workerApi";
import type { SalaryListItem, PaymentResponse } from "../../api/workerApi";
import { formatTime, parseWorkDate, pad2 } from "../../utils/dateUtils";
import { createDefaultAllowances } from "../../constants/extraPay";
import type {
  Workplace,
  RemittanceWorkRecord,
  RemittanceInfo,
} from "../../types/worker/remittancePage.types";

/**
 * 송금 페이지 데이터 관리 훅
 * - 근무지 목록, 근무 기록, 급여, 송금 내역 페칭
 * - 총 급여, 입금 상태 등 파생 데이터 계산
 * - 월 이동 네비게이션
 */
export function useRemittanceData() {
  // ── 상태 ──────────────────────────────────
  const [workplaces, setWorkplaces] = useState<Workplace[]>([]);
  const [selectedWorkplaceId, setSelectedWorkplaceId] = useState<number | null>(null);
  const [currentYear, setCurrentYear] = useState<number>(() => new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(() => new Date().getMonth() + 1);
  const [workRecords, setWorkRecords] = useState<RemittanceWorkRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [calculatedSalary, setCalculatedSalary] = useState<SalaryListItem | null>(null);
  const [isCalculatingSalary, setIsCalculatingSalary] = useState<boolean>(false);
  const [payments, setPayments] = useState<PaymentResponse[]>([]);

  // ── 파생 데이터 ──────────────────────────────
  const selectedWorkplace = workplaces.find((wp) => wp.id === selectedWorkplaceId);

  // ── 근무지 목록 조회 (마운트 시 1회) ──────────
  useEffect(() => {
    const fetchWorkplaces = async () => {
      try {
        const contractsResponse = await getContracts();
        const contracts = contractsResponse.data || [];

        const workplacesList = await Promise.all(
          contracts.map(async (contract) => {
            try {
              const contractDetail = await getContractDetail(contract.id);
              return {
                id: contract.id,
                name: contractDetail.data?.workplaceName || '',
              };
            } catch (error) {
              console.error(`[useRemittanceData] 계약 ${contract.id} 상세 정보 조회 실패:`, error);
              return null;
            }
          })
        );

        const validWorkplaces: Workplace[] = workplacesList.filter(
          (wp): wp is Workplace => wp !== null
        );
        setWorkplaces(validWorkplaces);

        const firstWorkplace = validWorkplaces[0];
        if (firstWorkplace && !selectedWorkplaceId) {
          setSelectedWorkplaceId(firstWorkplace.id);
        }
      } catch (error) {
        console.error("[useRemittanceData] 근무지 목록 조회 실패:", error);
        setWorkplaces([]);
      }
    };

    fetchWorkplaces();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── 근무 기록 조회 ─────────────────────────
  const fetchWorkRecords = useCallback(async () => {
    if (!selectedWorkplaceId) {
      setWorkRecords([]);
      return;
    }

    try {
      setIsLoading(true);

      const contractDetail = await getContractDetail(selectedWorkplaceId);
      const hourlyWage = contractDetail.data?.hourlyWage || 0;
      const payrollDeductionType = contractDetail.data?.payrollDeductionType || '';

      const hasSocialInsurance = payrollDeductionType.includes('INSURANCE');
      const hasWithholdingTax = payrollDeductionType.includes('TAX');

      const lastDay = new Date(currentYear, currentMonth, 0).getDate();
      const startDate = `${currentYear}-${pad2(currentMonth)}-${pad2(1)}`;
      const endDate = `${currentYear}-${pad2(currentMonth)}-${pad2(lastDay)}`;

      const workRecordsResponse = await getWorkRecords(startDate, endDate);
      const workRecordsData = workRecordsResponse.data || [];

      const mappedRecords: RemittanceWorkRecord[] = workRecordsData
        .filter((record) => record.contractId === selectedWorkplaceId && record.status !== "PENDING_APPROVAL")
        .map((record) => {
          const { date, day } = parseWorkDate(record.workDate);
          const baseWage = Math.round((hourlyWage * record.totalWorkMinutes) / 60);

          return {
            id: record.id,
            date,
            day,
            startTime: formatTime(record.startTime) || "00:00",
            endTime: formatTime(record.endTime) || "00:00",
            workplace: contractDetail.data?.workplaceName || '',
            breakMinutes: record.breakMinutes || 0,
            hourlyWage,
            wage: baseWage,
            allowances: createDefaultAllowances(),
            socialInsurance: hasSocialInsurance,
            withholdingTax: hasWithholdingTax,
          };
        });

      setWorkRecords(mappedRecords);
    } catch (error) {
      console.error("[useRemittanceData] 근무 기록 조회 실패:", error);
      setWorkRecords([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedWorkplaceId, currentYear, currentMonth]);

  useEffect(() => {
    fetchWorkRecords();
  }, [fetchWorkRecords]);

  // ── 급여 조회 ──────────────────────────────
  const fetchCalculatedSalary = useCallback(async () => {
    if (!selectedWorkplaceId) {
      setCalculatedSalary(null);
      return;
    }

    try {
      setIsCalculatingSalary(true);
      const response = await getSalaries();
      if (response?.success && response?.data) {
        const matchedSalary = response.data.find(
          (salary) =>
            salary.contractId === selectedWorkplaceId &&
            salary.year === currentYear &&
            salary.month === currentMonth
        );
        setCalculatedSalary(matchedSalary || null);
      } else {
        setCalculatedSalary(null);
      }
    } catch (error) {
      console.error("[useRemittanceData] 급여 조회 실패:", error);
      setCalculatedSalary(null);
    } finally {
      setIsCalculatingSalary(false);
    }
  }, [selectedWorkplaceId, currentYear, currentMonth]);

  useEffect(() => {
    fetchCalculatedSalary();
  }, [fetchCalculatedSalary]);

  // ── 송금 내역 조회 ─────────────────────────
  const fetchPayments = useCallback(async () => {
    try {
      const response = await getPayments();
      if (response?.success && response?.data) {
        setPayments(response.data);
      } else {
        setPayments([]);
      }
    } catch (error) {
      console.error("[useRemittanceData] 송금 내역 조회 실패:", error);
      setPayments([]);
    }
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments, currentYear, currentMonth]);

  // ── 총 급여 (근무 기록 wage 합산) ─────────────
  const totalWage = useMemo(() => {
    return workRecords.reduce((sum, record) => sum + (record.wage || 0), 0);
  }, [workRecords]);

  // ── 입금 상태 계산 ─────────────────────────
  const remittanceInfo: RemittanceInfo = useMemo(() => {
    if (!calculatedSalary?.id) {
      return { status: "before", remittanceDate: null };
    }

    const payment = payments.find((p) => p.salaryId === calculatedSalary.id);

    if (payment?.isPaid) {
      return { status: "completed", remittanceDate: payment.paymentDate || null };
    }

    // payment가 없거나 isPaid가 false인 경우: 해당 월이 지났으면 "대기", 아니면 "입금 전"
    const today = new Date();
    const isSelectedMonthPassed =
      today.getFullYear() > currentYear ||
      (today.getFullYear() === currentYear && today.getMonth() + 1 > currentMonth);

    return {
      status: isSelectedMonthPassed ? "pending" : "before",
      remittanceDate: null,
    };
  }, [calculatedSalary, payments, currentYear, currentMonth]);

  // ── 월 이동 ────────────────────────────────
  const goToPrevMonth = useCallback(() => {
    setCurrentMonth((prev) => {
      if (prev === 1) {
        setCurrentYear((y) => y - 1);
        return 12;
      }
      return prev - 1;
    });
  }, []);

  const goToNextMonth = useCallback(() => {
    setCurrentMonth((prev) => {
      if (prev === 12) {
        setCurrentYear((y) => y + 1);
        return 1;
      }
      return prev + 1;
    });
  }, []);

  return {
    // 근무지
    workplaces,
    selectedWorkplaceId,
    selectedWorkplace,
    setSelectedWorkplaceId,

    // 월 네비게이션
    currentYear,
    currentMonth,
    goToPrevMonth,
    goToNextMonth,

    // 근무 기록
    workRecords,
    isLoading,

    // 급여
    totalWage,
    isCalculatingSalary,

    // 송금 상태
    remittanceInfo,
  };
}
