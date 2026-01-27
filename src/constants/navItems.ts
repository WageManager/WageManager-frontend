import {
  FiCalendar,
  FiServer,
  FiCreditCard,
  FiBriefcase,
  FiUser,
} from "react-icons/fi";
import type { IconType } from "react-icons";

interface NavItem {
  id: string;
  label: string;
  icon: IconType;
}

export const workerNavItems: NavItem[] = [
  {
    id: "monthly-calendar",
    label: "월간 캘린더",
    icon: FiCalendar,
  },
  {
    id: "weekly-calendar",
    label: "주간 캘린더",
    icon: FiServer,
  },
  {
    id: "remittance",
    label: "송금 관리",
    icon: FiCreditCard,
  },
  {
    id: "mypage",
    label: "마이페이지",
    icon: FiUser,
  },
];

export const employerNavItems: NavItem[] = [
  {
    id: "daily-calendar",
    label: "일간 캘린더",
    icon: FiCalendar,
  },
  {
    id: "remittance-manage",
    label: "고용주송금 관리",
    icon: FiCreditCard,
  },
  {
    id: "worker-manage",
    label: "근무지 관리",
    icon: FiBriefcase,
  },
  {
    id: "employer-mypage",
    label: "고용주 마이페이지",
    icon: FiUser,
  },
];
