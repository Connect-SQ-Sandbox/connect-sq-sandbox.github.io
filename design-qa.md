# Design QA — 카카오톡 예약하기 V1

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
