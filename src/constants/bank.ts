/**
 * 은행 목록 상수 (토스페이 은행 코드 기준)
 * https://docs-pay.toss.im/guide/bank-code
 *
 * 사용처:
 * - 회원가입 페이지
 * - 근로자 마이페이지
 * - 고용주 페이지
 */

/**
 * 은행 정보 매핑 (로고 경로, 표시 이름)
 */
export const BANK_INFO = {
  // 일반 은행
  'KDB산업은행': { logo: '/banks/kdb.svg', shortName: 'KDB산업은행' },
  'IBK기업은행': { logo: '/banks/ibk.svg', shortName: 'IBK기업은행' },
  'KB국민은행': { logo: '/banks/kb.svg', shortName: 'KB국민은행' },
  'KEB하나은행': { logo: '/banks/keb.svg', shortName: 'KEB하나은행' },
  '수협은행': { logo: '/banks/suhyup.svg', shortName: '수협은행' },
  'NH농협은행': { logo: '/banks/nh.svg', shortName: 'NH농협은행' },
  '우리은행': { logo: '/banks/woori.svg', shortName: '우리은행' },
  'SC은행': { logo: '/banks/sc.svg', shortName: 'SC은행' },
  '씨티은행': { logo: '/banks/citi.svg', shortName: '씨티은행' },
  '대구은행': { logo: '/banks/im.svg', shortName: '대구은행' },
  '부산은행': { logo: '/banks/kn_bs.svg', shortName: '부산은행' },
  '광주은행': { logo: '/banks/gj_jb.svg', shortName: '광주은행' },
  '제주은행': { logo: '/banks/shinhan_jeju.svg', shortName: '제주은행' },
  '전북은행': { logo: '/banks/gj_jb.svg', shortName: '전북은행' },
  '경남은행': { logo: '/banks/kn_bs.svg', shortName: '경남은행' },
  'MG새마을금고': { logo: '/banks/mg.svg', shortName: 'MG새마을금고' },
  '신협': { logo: '/banks/sinhyup.svg', shortName: '신협' },
  '저축은행': { logo: '/banks/sb.svg', shortName: '저축은행' },
  '산림조합': { logo: '/banks/sj.svg', shortName: '산림조합' },
  '우체국': { logo: '/banks/epost.svg', shortName: '우체국' },
  '하나은행': { logo: '/banks/keb.svg', shortName: '하나은행' },
  '신한은행': { logo: '/banks/shinhan_jeju.svg', shortName: '신한은행' },
  '케이뱅크': { logo: '/banks/kbank.svg', shortName: '케이뱅크' },
  '카카오뱅크': { logo: '/banks/kakao.svg', shortName: '카카오뱅크' },
  '토스뱅크': { logo: '/banks/toss.svg', shortName: '토스뱅크' },
  'SBI저축은행': { logo: '/banks/sbi.svg', shortName: 'SBI저축은행' },
  // 증권사
  'KB증권': { logo: '/banks/kb.svg', shortName: 'KB증권' },
  '미래에셋증권': { logo: '/banks/miraeAsset.svg', shortName: '미래에셋증권' },
  '삼성증권': { logo: '/banks/samsung.svg', shortName: '삼성증권' },
  '한국투자증권': { logo: '/banks/koreaInvestment.svg', shortName: '한국투자증권' },
  'NH투자증권': { logo: '/banks/nh.svg', shortName: 'NH투자증권' },
  '교보증권': { logo: '/banks/kyobo.svg', shortName: '교보증권' },
  '하이투자증권': { logo: '/banks/im.svg', shortName: '하이투자증권' },
  '현대차투자증권': { logo: '/banks/hyundai.svg', shortName: '현대차투자증권' },
  '키움증권': { logo: '/banks/kiwoom.svg', shortName: '키움증권' },
  '이베스트증권': { logo: '/banks/ls.svg', shortName: '이베스트증권' },
  'SK증권': { logo: '/banks/sk.svg', shortName: 'SK증권' },
  '대신증권': { logo: '/banks/daishin.svg', shortName: '대신증권' },
  '한화투자증권': { logo: '/banks/hanhwa.svg', shortName: '한화투자증권' },
  '하나증권': { logo: '/banks/keb.svg', shortName: '하나증권' },
  '토스증권': { logo: '/banks/toss.svg', shortName: '토스증권' },
  '신한투자증권': { logo: '/banks/shinhan_jeju.svg', shortName: '신한투자증권' },
  'DB금융투자': { logo: '/banks/db.svg', shortName: 'DB금융투자' },
  '유진투자증권': { logo: '/banks/eugene.svg', shortName: '유진투자증권' },
  '메리츠증권': { logo: '/banks/meritz.svg', shortName: '메리츠증권' },
} as const;

export type BankName = keyof typeof BANK_INFO;

export const BANK_NAMES = Object.keys(BANK_INFO) as BankName[];
