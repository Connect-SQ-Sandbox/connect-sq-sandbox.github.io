# Design QA — 4.2 커넥트 웹뷰 미리보기

final result: passed

검증일: 2026-10-08. 원본 DEV 샘플 화면과 독립 정적 HTML을 비교했다. 실제 서버·제품키 인증·차트 연동을 검증한 결과가 아니다.

## 비교 대상과 정규화

- Source visual truth: `qa/desktop-comparison.png` 왼쪽, `qa/mobile-comparison.png` 왼쪽. 테스트 사이트의 샘플 데스크 대시보드.
- Implementation: 동일 이미지의 오른쪽. 로컬 브라우저에서 `partners-connect-preview.html`을 직접 렌더링했다.
- Desktop CSS viewport: 1280×720. Source full-page 1280×760 / implementation full-page 1280×845. 모두 1 CSS px = 1 raster px. 이미지의 문서 높이 차이는 원본 GNB·DEV 도구 제거와 비교용 도구/펼친 메뉴의 차이이다.
- Mobile CSS viewport: 390×844. Source full-page 390×1043 / implementation full-page 390×931. 확대·축소하지 않고 같은 크기에서 비교했다.
- Focused region: `qa/dashboard-cards-comparison.png`. 양쪽 976×90의 동일 카드 영역을 잘라 글꼴·가격 숫자·간격·경계선을 비교했다.
- Permission comparison: `qa/chart-permission-comparison.png` 왼쪽 비연동 / 오른쪽 연동. 각각 1280×720.
- 추가 화면: `qa/preview-items-desktop.png`, `qa/preview-item-create-desktop.png`, `qa/preview-items-mobile.png`, `qa/preview-linked-rooms.png`, `qa/preview-unlinked-rooms.png`.

## 필수 시각 표면

| 항목 | 결과 |
|---|---|
| 글꼴 | 원본 Pretendard Variable 실제 로드된 14개 subset을 인라인 복사. 카드 제목·숫자·메뉴의 크기/굵기/줄 간격을 원본과 비교함. |
| 배치 | 원본 256px 사이드바·본문 여백·카드 간격 유지. 모바일의 첫 카드 전체 폭 + 아래 두 카드 2열 배치를 확인함. 표는 내부 가로 스크롤이고 페이지 전체 가로 넘침 없음. |
| 색상 | source CSS의 색상·상태 토큰을 유지. 비교 안내 도구에만 별도 스타일을 사용함. |
| 자산 | 로고·원본 SVG·폰트는 로컬 복사. 원본 앱 JS는 미복사. 깨진 이미지 0, 최종 HTML 외부 리소스 참조 0. |
| 문구 | 기존 업무 화면 문구 유지. 제품키 권한 웹뷰라는 맥락과 조회/처리 권한·미확정 정책 안내만 추가. ‘진료 항목’ 표기는 통합안 제목에 적용. |

## 발견 → 수정 → 재검증

1. [P2] 진료 항목 예약 권한 검토 안내가 상세 창 밖에 삽입되는 경우가 있었음.
   - 수정: 모든 상세 창의 안내를 dialog 안 첫 영역에 삽입.
   - 재검증: dialog 안에서 ‘별도 검토’ 안내를 읽을 수 있는지 DOM과 스크린샷으로 확인.
2. [P1] source Tailwind의 individual `translate` 값이 남아 진료 항목 예약 상세가 좌측 위로 밀림.
   - 수정: 복사한 상세 창의 `translate`·`scale`·`rotate`를 재설정. source 업무 내용·내부 스타일은 유지.
   - 재검증: desktop dialog 좌표 x=300/y=24, mobile x=12/y=12. 내용 표시와 내부 스크롤·닫기·ESC 확인.
3. 모바일 최초 캡처가 viewport 변경 직후의 중간 레이아웃을 담았음.
   - 재캡처: DOM 계산 폭을 먼저 확인한 뒤 다시 촬영. 카드 폭 358/175/175px. 이는 최종 화면 오류가 아닌 캡처 타이밍 문제였다.

잔여 P0/P1/P2: 없음.

## 동작 검증

- 기본은 현재 화면 / 비연동 병원. 통합안은 명시적으로 선택해야 보임. 현재 화면으로 돌아가는 동작 확인.
- 전체 13개 핵심 화면: 대시보드, 접수 현황·내역, 진료실 예약, 진료 항목 예약, 진료실·상세, 환자, 진료 항목·등록, 운영 설정, 진료 항목 예약 설정, PC 환경 설정.
- `header` 요소 0. 파트너스 GNB·계정·로그인 화면 미노출. 비교 도구는 별도 ‘공유용 미리보기 설정’ 영역.
- 비연동 예약 상세 상태 버튼 enabled / 연동 disabled.
- 비연동 진료실 추가 버튼 1 / 연동 추가 버튼 0. 연동 화면 수정·삭제 버튼 0.
- 통합 환자 추가 버튼 0. 상세 수정·삭제 0. 주민번호 뒷자리 마스킹 확인.
- 환자명 ‘가상환자1’ 검색 → 1/10/11, 부분일치 3개 표시.
- 진료 항목 목록과 등록 화면 이동, 깨진 이미지 0.
- 진료 항목 예약 상세는 기존 처리 버튼을 유지하되 권한 정책 별도 검토를 안내.
- 상태 처리 버튼은 ‘화면 확인용·실제 변경 없음’ 결과만 표시.
- 모바일 전체 메뉴 → 진료 항목 이동 후 메뉴 닫힘. 문서 가로 넘침 없음.
- 상세 창 내부 스크롤, 닫기, ESC, 포커스 복귀 확인.
- 브라우저 console error: 0.

## 의도된 차이·한계

- 사용자 요청으로 GNB는 제거했다. 제품키 인증은 가정일 뿐 실제 구현하지 않는다.
- 통합 메뉴 묶음은 피드백용 제안이며 확정된 UI/UX 정책이 아니다.
- 원본 DEV/실패 재현용 제어와 출처 사이트로 나가는 링크는 제거했다.
- 권한·메뉴·조회 화면을 비교하는 시안이다. 실제 저장, 환자정보 복사, 업로드, 차트 연결, OS 알림, 제품키 변경, 서버 연동은 없다.
- 가격 입력·서비스 상세 설정·순서 변경 등은 화면 구조만 제공하고 안내 메시지로 범위를 알린다. 실제 CRUD나 결제 기능을 완성한 것으로 해석하면 안 된다.
- 알림센터 세부 기능은 이번 독립 미리보기에 미포함. 이관 범위에서의 포함/차기 단계 여부는 별도 개발 검토가 필요하다.
- 과거 연결이 끊겼다고 권한이 비연동으로 전환되는 시나리오는 추가하지 않았다.

## 배포 조건

- `npm run proto:validate`: passed.
- `npm run proto:share`: passed, external resource references = 0.
- Backend deployment: not applicable — no backend change; isolated sample-only static HTML.
- 기존 샌드박스 페이지는 덮어쓰지 않고 새 페이지·진입 카드만 추가한다.
