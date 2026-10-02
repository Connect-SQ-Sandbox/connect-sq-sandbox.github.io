# Design QA — 카카오톡 예약하기 V1

## 2026-10-02 — 커넥트 통합 시뮬레이터 (HAU-1, Draft)

- Source visual truth: `qa/connect-unified/source-shell.jpg` — 기존 커넥트 재현 화면. 최신 병원 웹 코드의 토큰·목록·상세·취소 패턴과 별도로 대조했다. 실제 운영 화면 캡처를 주장하지 않는다.
- Implementation: `out/connect-unified.html`; screenshot `qa/connect-unified/implementation-list-final.jpg`.
- Viewport: 1280 × 720 CSS px; source / final implementation 1280 × 720 px, density 1. 초기 크기 전환 중 캡처는 최종 비교에서 제외했다.
- State: 진료항목 화면으로 공통 레이아웃 대조, To-be 내원예정 목록·상세·환경설정·처리 로그.
- Full-view comparison: `qa/connect-unified/comparison-full.jpg`. 구현에서 비교 도구·타이틀바 116px을 제외하고 원본과 동일한 1280 × 540 콘텐츠로 나란히 정규화했다.
- Focused comparison: `qa/connect-unified/comparison-header.jpg` — 제목·설명·카테고리 헤더의 폰트·여백·경계를 확대 대조.
- Backend deployment: **N/A** — 가상 데이터·메모리 변경만. 서버, 차트, 파일 설치, 환자 알림 통신 없음.

### 비교 이력 · 수정
1. P2: 본문 좌우 여백이 원본 64px보다 16px 좁음 → 1101px 이상에서 64px으로 수정. 최종 헤더 x=314px(좌측 메뉴 250px + 여백 64px).
2. P2: 클라이언트 높이 계산에 상태바 28px이 누락되어 트레이가 화면 밖으로 밀림 → To-be 본문은 화면 높이-180px, As-is는 -152px. 최종 트레이 y=684~720, 문서 높이 720px 확인.
3. 세부 대조: 상세 방문일시는 최신 병원 웹의 body1_600(16px/24px)으로 정돈. 오래된 설명용 상세 이미지의 큰 글자를 현재 규격으로 취급하지 않음.
4. 계약 경계 회귀: 내원확인 전달 대기를 일반 취소 재시도로 합치지 않음. 현재 차트 상태 확인 필요·자동 재전달 안 함으로 분리. 진료완료 전달 규격 미확정은 성공으로 표시하지 않음.

### 필수 품질 표면
| 영역 | 결과 |
|---|---|
| 폰트 | 기존 Pretendard/system fallback, 제목 28px·본문14px·표13px·보조12px. 대조 캡처의 동일 폰트/크기 확인 |
| 여백·구조 | 메뉴250px, 본문64px, 표의 행·경계, 카드/폼 스타일 유지. 비교 도구·트레이·새 메뉴는 의도된 차이 |
| 색상 | 병원 웹 GRAY_20 #F2F4F7, GRAY_30 #E3E6ED, BLUE_60 #0073FA. 상태색과 disabled/focus 구분 |
| 이미지·아이콘 | 기존 굿닥 로고 재사용, react-icons의 동일 계열 아이콘. 임의 의료 이미지·CSS 그림·새 브랜드 없음 |
| 내용 | 기존 예약 3탭/취소 사유 선택지 유지. 자유 입력·통합 상태는 To-be만. 가상값·미승인·모의 처리를 상시 고지 |
| 접근성·작은 화면 | 버튼/필터 이름, 라디오/텍스트 입력, 모달 Escape·포커스 가두기. 넓은 표는 가로 스크롤, 본문은 별도 세로 스크롤. 모바일 제품 설계 검증은 범위 밖 |

### 실제로 확인한 동작
- As-is 기본 진입, To-be 전환·복귀, 현행 운영 설정 4개 항목 재현.
- 검색·유형/상태/진료실/오늘 필터, 정렬, 페이지 전환, 빈 결과와 초기화.
- 상세 진입, 취소 사유 직접 입력, 저장 실패 후 입력 보존·재시도, 서버 오류 후 모의 복구.
- 비연동 상태 처리, 연결 끊김 시 취소 전달 대기 → 복구 → 재시도(환자 안내 중복 없음).
- 내원확인(진료항목 제외), 진료완료, 자동 종료 액션 제한, 프로그램 설정/브릿지 설치 모사.
- 진료실 운영 토글, 진료항목 노출·관리, 운영 설정 저장.
- Console: 최종 렌더와 위 주요 동작에서 error / warn 없음. 빌드 외부 리소스 참조 0.

### 남은 검증 경계
- 대시보드 숫자는 fixture 기반이며 실제 서버 집계 규격과 같다고 주장하지 않는다.
- 진료실 운영 설정·관리 상세는 검토용 축약 재현. 전체 운영 페이지를 복제하거나 실제 저장·EMR 계약을 확정하지 않는다.
- 예약실패 노출·유형별 허용 전환·사유 공개 범위·실제 차트 전달/보상은 정식 개발 전 결정 필요.
- P0/P1/P2 미해결 시각 이슈 없음. 실제 프로그램·서버·설치 QA는 수행하지 않았다.

**final result: passed**

---

## 이전 화면 QA — 보존

- source visual truth:
  - `/Users/goodoc/Downloads/사용자 첨부 파일.png`
  - `/Users/goodoc/Downloads/Screenshot 2026-07-14 at 9.43.54 AM 2.png`
- implementation URL: `http://127.0.0.1:4599/kakao-booking.html`
- implementation screenshots:
  - `qa/kakao-booking/05-final-place.png`
  - `qa/kakao-booking/06-final-products.png`
  - `qa/kakao-booking/07-post-rebase-place.png` (원격 main 통합 후 회귀 캡처)
- viewport: 390 × 844 CSS px
- states: 병원 장소 첫 화면, 상품 목록 스크롤 상태, 일정 선택, 카카오 동의, 굿닥 웹뷰, 완료
- full-view comparison evidence: `qa/kakao-booking/05-final-place-comparison.png`
- focused comparison evidence: `qa/kakao-booking/06-final-products-comparison.png`

## Findings

- P3 — iOS 상태바와 플로팅 상단 이동 버튼은 호스트 앱 UI로 보고 프로토타입 본문에서 제외했다.
  - Evidence: 원본에는 iOS 상태바와 원형 위로가기 버튼이 있고 구현에는 웹 콘텐츠만 있다.
  - Impact: 예약 핵심 흐름과 정보 구조에는 영향이 없다.
  - Follow-up: 실제 카카오 인앱 웹뷰 통합 QA에서 호스트 크롬과 겹침 여부를 확인한다.

## Required fidelity surfaces

- Fonts and typography: 한국어 시스템 폰트, 굵기 위계, 줄바꿈과 버튼 라벨을 원본에 맞춰 확인했다. 상품명·소개 긴 문구가 잘리지 않는다.
- Spacing and layout rhythm: 390×844에서 헤더, 360px hero, 병원 요약, 편의 시설, 탭, 상품 카드, 고정 CTA 순서를 확인했다. 핵심 컨트롤 오버플로가 없다.
- Colors and visual tokens: 카카오 노랑 CTA, 흰 배경, 옅은 회색 구획, 검정 탭 표시를 원본과 맞췄다.
- Image quality and asset fidelity: 사용자 제공 AB 병원·상품 이미지를 직접 사용해 동일 피사체와 크롭을 유지했다.
- Copy and content: 병원명, 상품명, 소개, 편의 시설, CTA와 상세 bullet을 사용자 제공 화면과 대조했다.
- Icons: `react-icons/hi2`의 동일 계열 outline 아이콘을 사용했고 크기·정렬을 확인했다.
- Accessibility: 주요 버튼에 접근 가능한 이름이 있고, 카카오/굿닥 동의와 굿닥 주소 입력은 제출 버튼 disabled 상태를 제어한다.

## Comparison history

1. 첫 비교
   - Finding: [P1] 병원 첫 화면에서 원본의 편의 시설 섹션이 누락돼 상품 탭이 너무 일찍 노출됐다.
   - Fix: WIFI·주차·발렛·1:1 관리·지하철역·영어 가능 섹션을 원본 순서와 2열 구조로 추가했다.
   - Post-fix evidence: `qa/kakao-booking/02-comparison.png`.
2. 두 번째 비교
   - Finding: [P2] 상품 목록 아래 병원 소개 bullet이 원본보다 짧았다.
   - Fix: 사용자 화면에 보이는 의료진·마취·전담제·검진센터·응급 프로토콜 문구를 추가했다.
   - Post-fix evidence: `qa/kakao-booking/06-final-products-comparison.png`.

## Primary interactions tested

- 병원 상품 `예약하기` → 일정 선택
- 날짜·시간 선택 → 카카오 동의
- 전체 동의 전/후 `동의하고 다음` disabled 전환
- partnership.goodoc.co.kr 형태의 굿닥 웹뷰 진입
- 주소·병원 약관 완료 전/후 `예약 요청` disabled 전환
- 예약 완료 및 처음으로 복귀
- 병원 어드민 굿닥 노출 OFF → 카카오 OFF + 토글 disabled + 의존 안내

## Runtime checks

- mobile prototype browser logs: none
- hospital admin browser logs: none
- 원격 main의 정책 변경 패널·예정 필터 통합 후 예약 E2E와 굿닥→카카오 노출 캐스케이드를 다시 통과했다.
- self-contained build external references: 0

## Follow-up polish

- 실제 카카오 인앱 브라우저에서 사용하는 아이콘 세트가 제공되면 Heroicons를 교체할 수 있다.
- 호스트 앱이 제공하지 않는 환경을 위한 위로가기 버튼은 후속으로 추가할 수 있다.

final result: passed
