/**
 * 은행 목록 상수 (토스페이 은행 코드 기준)
 * https://docs-pay.toss.im/guide/bank-code
 *
 * 사용처:
 * - 회원가입 페이지
 * - 근로자 마이페이지
 * - 고용주 페이지
 */

export const BANK_LIST = [
  // 일반 은행
  'KDB산업은행',
  'IBK기업은행',
  'KB국민은행',
  'KEB하나은행',
  '수협은행',
  'NH농협은행',
  '우리은행',
  'SC은행',
  '씨티은행',
  '대구은행',
  '부산은행',
  '광주은행',
  '제주은행',
  '전북은행',
  '경남은행',
  'MG새마을금고',
  '신협',
  '저축은행',
  '산림조합',
  '우체국',
  '하나은행',
  '신한은행',
  '케이뱅크',
  '카카오뱅크',
  '토스뱅크',
  'SBI저축은행',
  // 증권사
  'KB증권',
  '미래에셋증권',
  '삼성증권',
  '한국투자증권',
  'NH투자증권',
  '교보증권',
  '하이투자증권',
  '현대차투자증권',
  '키움증권',
  '이베스트증권',
  'SK증권',
  '대신증권',
  '한화투자증권',
  '하나증권',
  '토스증권',
  '신한투자증권',
  'DB금융투자',
  '유진투자증권',
  '메리츠증권',
] as const;

export type BankName = (typeof BANK_LIST)[number];

/**
 * 은행 정보 매핑 (로고 경로, 짧은 이름)
 * 현재는 모든 은행에 동일한 로고 사용 (추후 개별 로고로 교체 예정)
 */
export const BANK_INFO: Record<BankName, { logo: string; shortName: string }> = {
  // 일반 은행
  'KDB산업은행': { logo: '/banks/kb.svg', shortName: 'KDB산업' },
  'IBK기업은행': { logo: '/banks/kb.svg', shortName: '기업' },
  'KB국민은행': { logo: '/banks/kb.svg', shortName: '국민' },
  'KEB하나은행': { logo: '/banks/kb.svg', shortName: 'KEB하나' },
  '수협은행': { logo: '/banks/kb.svg', shortName: '수협' },
  'NH농협은행': { logo: '/banks/kb.svg', shortName: '농협' },
  '우리은행': { logo: '/banks/kb.svg', shortName: '우리' },
  'SC은행': { logo: '/banks/kb.svg', shortName: 'SC' },
  '씨티은행': { logo: '/banks/kb.svg', shortName: '씨티' },
  '대구은행': { logo: '/banks/kb.svg', shortName: '대구' },
  '부산은행': { logo: '/banks/kb.svg', shortName: '부산' },
  '광주은행': { logo: '/banks/kb.svg', shortName: '광주' },
  '제주은행': { logo: '/banks/kb.svg', shortName: '제주' },
  '전북은행': { logo: '/banks/kb.svg', shortName: '전북' },
  '경남은행': { logo: '/banks/kb.svg', shortName: '경남' },
  'MG새마을금고': { logo: '/banks/kb.svg', shortName: '새마을' },
  '신협': { logo: '/banks/kb.svg', shortName: '신협' },
  '저축은행': { logo: '/banks/kb.svg', shortName: '저축' },
  '산림조합': { logo: '/banks/kb.svg', shortName: '산림' },
  '우체국': { logo: '/banks/kb.svg', shortName: '우체국' },
  '하나은행': { logo: '/banks/kb.svg', shortName: '하나' },
  '신한은행': { logo: '/banks/kb.svg', shortName: '신한' },
  '케이뱅크': { logo: '/banks/kb.svg', shortName: '케이뱅크' },
  '카카오뱅크': { logo: '/banks/kb.svg', shortName: '카카오' },
  '토스뱅크': { logo: '/banks/kb.svg', shortName: '토스' },
  'SBI저축은행': { logo: '/banks/kb.svg', shortName: 'SBI' },
  // 증권사
  'KB증권': { logo: '/banks/kb.svg', shortName: 'KB증권' },
  '미래에셋증권': { logo: '/banks/kb.svg', shortName: '미래에셋' },
  '삼성증권': { logo: '/banks/kb.svg', shortName: '삼성' },
  '한국투자증권': { logo: '/banks/kb.svg', shortName: '한투' },
  'NH투자증권': { logo: '/banks/kb.svg', shortName: 'NH투자' },
  '교보증권': { logo: '/banks/kb.svg', shortName: '교보' },
  '하이투자증권': { logo: '/banks/kb.svg', shortName: '하이투자' },
  '현대차투자증권': { logo: '/banks/kb.svg', shortName: '현대차' },
  '키움증권': { logo: '/banks/kb.svg', shortName: '키움' },
  '이베스트증권': { logo: '/banks/kb.svg', shortName: '이베스트' },
  'SK증권': { logo: '/banks/kb.svg', shortName: 'SK증권' },
  '대신증권': { logo: '/banks/kb.svg', shortName: '대신' },
  '한화투자증권': { logo: '/banks/kb.svg', shortName: '한화' },
  '하나증권': { logo: '/banks/kb.svg', shortName: '하나증권' },
  '토스증권': { logo: '/banks/kb.svg', shortName: '토스증권' },
  '신한투자증권': { logo: '/banks/kb.svg', shortName: '신한투자' },
  'DB금융투자': { logo: '/banks/kb.svg', shortName: 'DB금융' },
  '유진투자증권': { logo: '/banks/kb.svg', shortName: '유진' },
  '메리츠증권': { logo: '/banks/kb.svg', shortName: '메리츠' },
};
