export interface Contract {
  id: number;
  workerName: string;
  workerCode: string;
  workerPhone: string;
  hourlyWage: number;
  contractStartDate: string;
  contractEndDate: string;
  isActive: boolean;
  // UI에서 사용하는 속성 추가 (API 응답에는 없지만, 로직에서 참조하는 경우를 대비해 optional로 추가하거나, API 응답이 확실하다면 제외해야 함)
  // 현재 코드에서 workplaceName을 참조하므로 optional로 추가합니다.
  workplaceName?: string;
}
