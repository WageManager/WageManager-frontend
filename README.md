# PayCheck (WageManager)
<img src="./src/assets/wagemanager.png">

## 🎯 목표

단기 근로자와 소규모 자영업 고용주를 위한 투명하고 간편한 급여 관리 솔루션 제공

### 해결하고자 하는 문제
- 근무 기록 불투명성 및 수동 정산으로 인한 급여 체불/오류
- 근로자-고용주 간 신뢰 부족
- 고용주의 반복적인 급여 관리 업무 부담

### 기대 효과
- 실시간 근무 기록 공개를 통한 근로자 권익 보호
- 급여 계산/정산 반자동화로 고용주 관리 비용 절감
- 객관적 데이터 기반 정산으로 분쟁 감소 및 상호 신뢰 구축

## 💡 동기
최근 노동 시장은 단기 근로자 증가와 플랫폼 기반 긱 워커(Gig Worker) 확산으로 급변하고 있음. 하지만 기존의 경직된 급여 관리 시스템은 이러한 변화에 대응하지 못하고 있음.

수기로 근무 시간을 기록하고, 엑셀로 급여를 계산하고, 일일이 송금하는 과정에서 실수와 분쟁이 발생함. 근로자는 제대로 받았는지 불안하고, 고용주는 매번 반복되는 정산 업무에 지침.

**"일한 만큼 정확히, 관리 부담 없이 간편하게"** — 이 단순한 목표를 실현하기 위해 월급 관리소를 만들게 됨.

## 🔑 주요 기능

### 👔 고용주 (Employer)

| 기능 | 설명 |
|------|------|
| **📅 일일 스케줄 관리** | 날짜별 근무자 타임라인 조회 및 근무 시간 편집 |
| **👥 근로자 관리** | 근로자 등록/수정/퇴사 처리, 근무 스케줄 설정 |
| **🏢 근무지 관리** | 다중 근무지 생성/수정/삭제 |
| **💰 급여 정산** | 월별 급여 계산 및 송금 관리 |
| **📋 계약 관리** | 시급, 근무 스케줄, 공제 유형 설정 |

### 👷 근로자 (Worker)

| 기능 | 설명 |
|------|------|
| **📆 월간 캘린더** | 월별 근무 기록 조회 및 일자별 상세 확인 |
| **📊 주간 캘린더** | 주 단위 근무 스케줄 조회 |
| **✏️ 근무 정정 요청** | 잘못된 근무 기록 정정 요청 |
| **💵 급여 내역** | 월별 급여 및 입금 상태 확인 |
| **📝 메모** | 일자별 메모 작성 |
| **👤 마이페이지** | 프로필 관리, 근무지 관리, 보낸 근무 요청 조회 |

### 🔔 공통 기능

- **카카오 소셜 로그인** - 간편한 회원가입/로그인
- **실시간 알림** - 급여 정산, 정정 요청 등 알림

## 📌 기술 스택

| 분류 | 기술 |
|------|------|
| **Frontend** | React 19.2, Vite 5.2, TypeScript 5.9 |
| **라우팅** | React Router DOM v7.9 |
| **스타일링** | TailwindCSS 4.1, 커스텀 CSS |
| **HTTP 클라이언트** | Axios 1.13 |
| **테스트** | Vitest 1.6, React Testing Library 16 |
| **UI 컴포넌트** | React-Icons, SweetAlert2, React-Toastify |

## 👥 기여자

| 이름 | 담당 |
|------|------|
| **조용근** | PM & Backend |
| **김나현** | Design & Frontend |
| **이주한** | Frontend |
| **강소영** | Backend |
| **최영찬** | Backend |

## Visit our Notion Page and Get the App (available only in South Korea).
Notion: [click](https://www.notion.so/GOAT-27b6550d6d4480019236d1a9d4c9ef54?source=copy_link)

## 📁 프로젝트 구조

```
src/
├── api/          # API 통신 모듈 (Axios 인스턴스, 토큰 자동 갱신)
├── components/   # 재사용 UI 컴포넌트 (common, layout, employer, worker)
├── pages/        # 라우트 페이지 (auth, employer, workers)
├── hooks/        # 커스텀 훅 (페이지별 비즈니스 로직 분리)
├── types/        # TypeScript 타입 정의
├── utils/        # 유틸리티 함수 (날짜, 포맷팅)
├── constants/    # 상수 정의 (검증 메시지, 옵션 등)
├── layouts/      # 페이지 레이아웃 래퍼
├── styles/       # CSS 스타일 파일
└── assets/       # 정적 리소스 (이미지 등)
```

## 🧪 테스트

프로젝트는 Vitest와 React Testing Library를 사용하여 테스트합니다.

### 테스트 커버리지

| 분류 | 테스트 파일 |
| ------ | ------------ |
| **API** | `axios.test.ts`, `employerApi.test.ts` |
| **인증 페이지** | `LoginPage.test.tsx`, `SignupPage.test.tsx`, `KakaoRedirect.test.tsx` |
| **고용주 페이지** | `EmployerMyPage.test.tsx` |
| **근로자 페이지** | `WorkerMonthlyCalendarPage.test.tsx`, `WorkerRemittancePage.test.tsx`, `WorkerMyPage.test.tsx` |
| **근로자 컴포넌트** | `ProfileBox.test.tsx`, `ProfileEdit.test.tsx`, `WorkplaceManage.test.tsx`, `WorkEditRequestList.test.tsx` |

### 테스트 실행

```bash
# 테스트 실행 (watch 모드)
npm run test

# 단일 실행
npm run test:run

# 커버리지 리포트
npm run test:coverage
```

## 🚀 시작하기

### 1. 요구사항

- Node.js 18+
- npm 9+

### 2. 설치

```bash
# 저장소 클론
git clone https://github.com/Team-PayCheck/PayCheck-frontend.git
cd PayCheck-frontend

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env
```

### 주요 의존성

**Dependencies**
| 패키지 | 버전 | 설명 |
|--------|------|------|
| react | ^19.2.0 | UI 라이브러리 |
| react-dom | ^19.2.0 | React DOM 렌더링 |
| react-router-dom | ^7.9.6 | 클라이언트 사이드 라우팅 |
| axios | ^1.13.2 | HTTP 클라이언트 |
| react-icons | ^5.5.0 | 아이콘 컴포넌트 |
| react-toastify | ^11.0.5 | 토스트 알림 |
| sweetalert2 | ^11.26.3 | 알림 다이얼로그 |

**DevDependencies**
| 패키지 | 버전 | 설명 |
|--------|------|------|
| vite | ^5.2.0 | 빌드 도구 |
| typescript | ^5.9.0 | 정적 타입 |
| tailwindcss | ^4.1.17 | CSS 프레임워크 |
| vitest | ^1.6.0 | 테스트 프레임워크 |
| @testing-library/react | ^16.0.0 | React 테스팅 유틸리티 |
| eslint | ^9.39.1 | 코드 린터 |

### 3. 실행

```bash
# 개발 서버 실행
npm run dev

# 빌드
npm run build

# 린트 검사
npm run lint

# 빌드된 앱 미리보기
npm run preview
```

## 🧑‍💻 기여 방법

1. **이 저장소를 Fork 합니다**
   ```bash
   https://github.com/Team-PayCheck/PayCheck-frontend.git
   ```
2. **새 브랜치를 생성합니다**
   ```bash
   git checkout -b feature/your-new-feature-name
   ```

3. **변경 사항을 커밋합니다**
   ```bash
   git commit -m "feat: add your-change-logs"
   ```

4. **브랜치를 Push 합니다**
   ```bash
   git push your-remote-name feature/your-new-feature-name
   ```

5. **GitHub에서 Pull Request를 생성합니다**

## 📄 License

MIT License
