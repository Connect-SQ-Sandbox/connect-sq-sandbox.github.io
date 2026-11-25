/**
 * ─────────────────────────────────────────────────────────────
 * 이름      : untact-law-doctor — 굿닥 온라인진료실(의사용) · 비대면진료 제도화(의료법 개정) 대응
 * 상태      : 검토용 초안 · v0.22 · 최종수정 2026-11-25 · 샌드박스 배포
 * PRD       : 없음(제도화 대응 기획 초안). 사내 문서 링크는 공개 저장소라 미기재.
 * 배포URL   : https://connect-sq-sandbox.github.io/out/untact-law-doctor.html
 * 피그마    : 대응 보드 커넥트 섹션(진료실-1~3) + 현행 온라인진료실 개발 코드. 대응 보드 외 화상진료실은 피그마 TELECARE DEV 220:72455.
 * 현행 기준 : goodoc-web-hospital-admin production(54aa1ebf, 2026-10-29) pages/untact — 운영 화면.
 *             (참고) goodoc-web-platform apps/partners/src/features/online-clinic 은 이관본이라 운영과 다른 곳이 있음
 *             workspace.tsx(GNB·화상진료 확인창) · treatment-table.tsx(목록) · treatment-details.tsx(상세·다이얼로그)
 *             patient-information.tsx · symptom-attachments.tsx · clinical-notices.tsx · profile-menu.tsx · packages/ui button·dialog
 *             소스는 복사하지 않고 치수·색·문구만 옮겨 다시 작성(공개 저장소).
 * 관련 CSS  : styles/untactLawDoctor.css (css-manifest 'untact-law-doctor')
 * 에셋      : assets/untact-law-doctor/ (partners public/images 원본 svg 6종: 로고·의사 아바타·성별·작업 아이콘)
 * 기술제약  : 샌드박스 빌드 = react 훅 + plain CSS, 외부 요청 0.
 * 화면구성  : 좌측 상태 패널(화면 점프 · 상태 토글 · 화면별 메모) + 온라인진료실(본문 1140px)
 *             접수대기 목록(현행) → 진료실-1 접수대기 상세·접수 전 확인(수정) → 예상 대기 시간 설정(현행)
 *             → 진료실-2 진료시작·전화 진료 사유(신규) · 화상진료실(현행 재현, 본인 확인 영역 신규) · 화상진료 끄기 확인창(수정)
 *             → 진료실-3 진료 취소 사유(수정)
 *
 * 핵심 결정(why)
 *  - [확정·요청] 프로토는 제품별로 나눈다. 이 파일은 의사 어드민, 앱은 untact-law-app, 둘을 잇는 건 untact-law-pair(D9).
 *  - [확정·요청] 현행 화면은 실제 개발 코드(partners online-clinic) 치수·문구 그대로 재현한다.
 *  - [보드 기준] 진료실-1 환자정보: 시범사업 빨간 안내(EligibilityWarning) 대신 진료 대상 배지(재진 · 환자 응답 / 초진 / 예외 대상), 자녀면 '가족 대리 신청' 배지.
 *  - [보드 기준] 진료실-1 접수 전 확인 체크 2개를 모두 체크해야 접수완료 활성. 재진은 두 번째 체크가 '차트에서 대면 이력을 확인했어요'.
 *  - [보드 기준] 진료실-1 재진은 '환자 응답(확인 필요)' 상자로 환자가 고른 내용을 보여 준다.
 *  - [보드 기준] 진료실-1 '본인확인 의무가 없는 미성년자 환자입니다.' 문구 자리에 법정대리인 동의 완료 · {동의자} · {동의일시}.
 *  - [확정·요청] 진료실-1 초진이면 접수 전 확인 상자 아래에 '거주지 서류' 열람 영역(D8·D12·D14). 종류(주민등록상 주소지 / 실거주지) + 가림 처리된 서류 썸네일, 누르면 현행 첨부사진 확대 보기(ImagePreview)와 같은 형태로 크게 본다.
 *    서류의 이름·주민번호 앞 6자리를 환자정보와 대조할 수 있다. 앱에서 초진은 필수지만 재진→실제 초진, 구버전 신청분 대비 '서류 없음' 상태도 둔다.
 *  - [확정·요청] 진료실-1 예외 대상이면 '예외 대상 확인' 영역(D17): 대상 이름 + 조회형(등록장애인·장기요양 수급자: '수진자 조회로 확인', 첨부 없음) /
 *    서류형(그 밖: 환자가 앱에서 첨부한 서류 썸네일·확대 보기). 접수 전 확인 2번 아래 보조 줄도 조회/서류에 맞춤.
 *  - [확정·요청] 지원시스템 없음 전제(D13). 거주지 확인 수단은 환자가 앱으로 올린 서류.
 *  - [유지·자체] 거주지 서류에는 내려받기를 두지 않는다(파기 시점 미결 — 병원 PC에 사본이 남으면 회수 불가). 보기만.
 *  - [유지·자체] 초진 접수 전 확인 2번은 '비대면진료 대상 요건을 확인했어요 (초진)' + 보조 줄 '아래 거주지 서류로 같은 시·도인지 확인해 주세요.'
 *  - [제안] 환자정보에 '환자가 앱에서 비대면진료 안내문 4가지를 확인하고 동의함 · {동의일시}'(환자 행위 사실만, 의료인 설명 완료로 읽히지 않게).
 *  - [유지·자체] 재진 환자 응답 상자 문구를 앱 재진 기준(마지막 대면진료 후 6개월 이내, 같은 증상)에 맞춤.
 *  - [보드 기준] 진료실-2 전화로 진행·전환할 때 사유 모달. 초진은 첫 번째 사유(대면진료 받은 환자) 선택 불가.
 *  - [보드 기준] 진료실-2 화상진료 끄기 확인창 본문: '화상진료를 끄면 초진 환자는 배정되지 않아요. 재진 환자만 전화로 진료할 수 있어요.' 버튼은 현행 '취소 / 확인'.
 *  - [보드 기준] 진료실-3 취소 사유: 환자 월 2회 삭제, 건수 사유는 '의사별 비대면진료 가능 건수(월평균 500건)'로 교체. 직접 입력 안내·검증은 현행 그대로.
 *  - [유지·자체] 전화로 신청한 재진은 '전화 진료 시작'을 누르면 현행 '진료 시작하기' 확인창 대신 전화 진료 사유 모달.
 *  - [유지·자체] 앱에서 전화 진료는 재진만 고를 수 있으므로 패널 '신청 진료 방식'은 재진일 때만 전화 선택 가능.
 *
 * 보류·TODO (기획 확인 필요)
 *  - [보류] 보드 진료실-1의 '주소지 서울 · 병원 서울 ✓' 비교 배지는 넣지 않았다. 플랫폼은 주소를 입력받거나 비교하지 않고, 의사가 첨부 서류로 확인한다(D8).
 *  - [보류] 거주지 서류를 '가림 필요'로 환자에게 다시 요청하는 반려 흐름은 미결이라 만들지 않았다. 반려가 없으면 출구가 진료취소뿐이라 취소 사유 '제출한 서류로 본인 또는 거주지를 확인할 수 없습니다' 추가 검토.
 *  - [보류] 거주지 서류의 보존·파기 시점(내려받기 허용 여부와 연결).
 *  - [확정·D18] 본인 확인은 신청 때 첨부한 본인 확인 서류로 접수 전에 1차로 하고(전 대상), 화상진료실 안에서 '화상에서 얼굴과 신분증을 대조했어요' 체크를 더한다(사본 '제출' 인정 여부 정부 답 전까지 잠정). 자녀면 보호자 신분증도 함께 받는다. 초진은 신분증 주소로 거주지 겸용 가능(패널 '신분증 겸용'). 화상 대조 확인 상자는 두지 않는다. 자녀 신청이면 아이 서류는 건강보험증·여권만(예시 건강보험증, 신분증 겸용 불가).
 *  - [보류] 재진으로 신청했는데 차트상 6개월 초과·다른 증상인 경우 의사 행동(취소 후 초진 재신청 안내 등).
 *  - [보류] 접수 전 확인 체크한 의사·시각 저장(스펙). 앱 첨부의 PDF(정부24 등본) 허용 여부 — 현행 확대 보기는 이미지 전용.
 *  - [확정·요청] 굿닥 비대면진료에는 병원급 의료기관이 없으므로 의료기관 구분·병원급 접수 제한(보드 진료실-1)은 넣지 않는다.
 *  - [확정·D26] 진료대기 버튼은 '전화 진료 시작'과 '화상 진료 시작'(전화 신청은 '전화 진료 시작'만), 진료대기에는 진료완료를 두지 않는다. 진료중(화상)은 '다시 화상 연결'과 '진료완료', 진료중(전화)은 '진료완료'만.
 *  - [보류] 진료실-2 예외 대상의 첫 번째 사유 선택 가능 여부(보드는 초진만 막음).
 *  - [보류] 진료실-2 화상진료 끄기 확인창의 '의사목록 순서' 문구는 정렬 기준 표시와 맞춘다고만 되어 있어 뺐다.
 *  - [보류] 진료실-3 '현재 내원 환자가 많아 진료가 어렵습니다'가 '진료하지 않은 판단으로 노출 불이익 금지'와 충돌하는지 법무 확인.
 *  - [보류] 접수 전 확인 상자 모양은 임의(현행 대응 요소 없음).
 *  - [보류] 보드 그레이존(엄격/완화) 카드는 법무 검토 전이라 반영하지 않음.
 *  - [확정·D20] 재진은 환자 자기 신고. 의사가 확인한 뒤 재진이 아니면 진료취소, 맞으면 진료(전화 포함)로 진행.
 *  - [확정·D21] 자녀면 접수 전 확인 3개(본인, 요건, 법정대리인 동의 확인과 설명)를 모두 체크해야 접수완료(진료 시작)할 수 있다.
 *  - [확정·D24] 전화 진료 첫 사유(대면 이력과 의사 판단)는 초진, 피부, 안, 이비인후, 외상, 정신 질환, 13세 미만에서 고를 수 없다.
 *  - [확정·D25] 셋째 사유는 '화상 연결이 불가능한 그 밖의 사유', 직접 입력 필수. 고른 사유를 진료기록부에 옮길 문장(가안)으로 보여 준다.
 *  - [확정·D30] 화상 진료는 굿닥 화상진료실로만 한다. 얼굴과 신분증 대조 체크는 진료 상세가 아니라 화상진료실 화면 안(환자정보 패널 맨 위 '본인 확인' 영역)에 둔다.
 *  - [확정·D31] 화상통화 중 환자 카메라 끄기는 막지 않고, 쌍방 확인이 안 되면 '화상으로 본인 확인이 되지 않았습니다.' 사유로 진료 취소한다.
 *  - [보류] 화상 대조 체크를 하지 않으면 진료완료를 막을지(지금은 체크만, 막지 않음).
 *  - [보류] 전화 진료일 때 본인 확인 방법(얼굴 대조 불가). 지금은 화상진료실 안에서만 대조 체크를 보여 준다.
 *  - [보류] 진료기록부 문장 문구(가안).
 *  - [확정·D19] 굿닥 기준 월 500건 상한 안내 띠는 GNB 바로 아래 하나를 모든 탭이 공통으로 쓴다. 굿닥 기준이라 법령 버튼 없음.
 *  - [확정·D19] 띠에는 '이번 달 비대면 진료 n / 500건'을 보여 주고, 남은 건수 문구는 근접과 도달 상태에서만 보여 준다(여유 상태는 숫자만).
 *  - [확정·D19] 건수는 굿닥에서 진료 완료까지 한 진료 건을 의사별로 센다.
 *  - [보류] D19 초기화 시점(매월 1일 가정).
 *  - [확정·D19] 400건(80%)부터 띠를 주황으로 강조한다(한 단계).
 *  - [확정·D19] 500건에 도달해도 접수는 막지 않는다. 도달 뒤 '접수완료'를 누르면 경고 확인창('이번 달 500건에 도달했어요', [취소]/[접수하기])을 먼저 띄우고, 접수하기를 누르면 예상 대기 시간 설정으로 이어진다.
 *  - [보류] D19 안내 문구는 법령안 31조의7④를 참고한 가안(화면에 '가안' 표시). 굿닥 기준이라 법령 버튼 없이 문장으로만 둠.
 *  - [확정·D33] 진료대기 상세에 '진료 전 설명 확인' 영역: 설명 대상(본인 또는 법정대리인), 동의자, 앱 동의 시각, 4가지 항목별 '설명함' 체크.
 *    4개를 모두 체크해야 '전화 진료 시작'과 '화상 진료 시작'이 열린다. 자녀면 법정대리인 동의 확인(접수 전 확인 3번째)이 없으면 시작할 수 없다.
 *    진료기록부에 옮길 문장(가안)을 D25 형식으로 보여 준다. 진료중에는 같은 영역을 읽기 전용으로 둔다.
 *  - [확정·D36] 비대면진료는 웹으로 신청할 수 없다. 현행 작업 띠의 웹 신청 건 안내 줄('앱 전화 사용이 불가한 환자입니다…')과 웹 신청 전제 분기는 두지 않는다(이 프로토는 처음부터 앱 신청 건만 재현).
 *  - [확정·D34] 화상진료실 차트 '환자 증상'에 환자가 고른 증상 칩을 접수 상세와 같은 형식('증상: 기침, 콧물' 다음 줄에 상세 증상)으로 보여 준다. 칩만 있어도 블록을 보여 준다.
 *  - [보류] D33 항목 문구, 진료기록부 문장, 접수 전 확인 3번째 '법정대리인 동의를 확인하고 설명했어요'의 '설명' 부분이 진료 전 설명 영역과 겹치는지.
 *
 * 변경 이력
 *  - v0.22 (2026-11-25) 패널 상태 토글을 바꿀 때 지금 화면에 그 상태가 드러나지 않으면 드러나는 화면으로 옮김.
 *  - v0.21 (2026-11-25) 티켓을 눌렀을 때 지금 케이스에 영역이 없으면 그 티켓이 보이는 케이스로 바꿔 표시(진료 대상, 자녀, 자녀 시트, 웹 To-be 등), 바꾼 케이스를 패널에 안내. 메모 탭에도 선택 상태 줄.
 *  - v0.20 (2026-11-25) 티켓 표시를 하위 티켓 기준으로 다시 연결(메모 칩, 영향 범위 점선, 티켓별 보기). 티켓별 보기는 상위 티켓 제목 아래 하위 티켓을 묶어 보여 줌.
 *  - v0.19 (2026-11-25) 패널 보기 개선: 패널을 화면 옆에 고정하고 안에서만 스크롤, 탭 3개(화면·상태 / 이 화면 메모 / 티켓)로 나눔. 티켓 칩은 번호만(전체 번호는 툴팁), 티켓별 보기는 한 줄 제목 + 화면 링크로 압축.
 *  - v0.18 (2026-11-25) 티켓 영향 범위 보기: 패널 티켓 칩을 누르면 무대 화면의 해당 영역에 주황 점선과 번호 라벨(data-tk). '티켓별 보기' 칩은 관계없는 화면이면 첫 해당 화면으로 이동. 다시 누르거나 '선택 해제'로 끔.
 *  - v0.17 (2026-11-25) 패널 '이 화면' 메모 줄마다 대응 티켓 번호(CONNECT26-) 표시, '티켓별 보기'(티켓 → 해당 화면 바로 가기) 추가. 메모 안 결정 번호는 화면에서 뺌.
 *  - v0.16 (2026-11-25) D33: 진료대기 상세에 진료 전 설명 확인 영역(설명 대상, 동의자, 동의 시각, 4가지 설명함 체크, 진료기록부 문장). 4개 체크 전에는 시작 버튼 비활성.
 *    진료대기, 진료중 바로가기는 접수 전 확인과 설명 체크를 마친 상태로 연다. 환자정보 동의 사실 문구를 '이 진료의 설명 4가지'로(자녀는 법정대리인이 주어).
 *    D34: 화상진료실 차트 '환자 증상'에 증상 칩 줄 표시(현행은 자유 입력만).
 *  - v0.15 (2026-11-24) D30: 화상진료실 화면 추가(피그마 220:72455 기준, 키/몸무게 줄 제외). 화상 진료 시작 확인, 다시 화상 연결, 바로가기에서 오버레이로 열리고 '나가기'로 닫힘.
 *    얼굴과 신분증 대조 체크를 진료 상세에서 화상진료실 환자정보 패널 맨 위 '본인 확인' 영역(서류 썸네일, 확대 보기)으로 옮김. 바로가기 이름 '진료실-2 화상진료실 본인 확인'.
 *    D31: 진료 취소 사유에 '화상으로 본인 확인이 되지 않았습니다.' 추가(법령 버튼).
 *  - v0.14 (2026-11-24) 환자정보의 현행 '통신사 본인확인을 완료한 환자입니다.' 문구 삭제(본인 확인이 서류와 화상 대조로 바뀜, D18).
 *  - v0.13 (2026-11-24) D26: 작업 띠 버튼 이름 정리(전화 진료 시작, 화상 진료 시작, 다시 화상 연결), 진료대기의 진료완료 제거. 바로가기 '진료실-2 화상 진료 중 확인' 추가.
 *  - v0.12 (2026-11-24) 11/24 회의 반영: 화상 진료 중 '화상에서 얼굴과 신분증을 대조했어요' 체크(D18), 자녀는 보호자 신분증 열람과 접수 전 확인 3번째 체크 '법정대리인 동의를 확인하고 설명했어요'(D18, D21),
 *    전화 진료 첫 사유를 질환(피부, 안, 이비인후, 외상, 정신)과 13세 미만에서 막음, 패널 '질환'과 '환자 나이' 토글(D24), 셋째 사유 '화상 연결이 불가능한 그 밖의 사유' 직접 입력 필수와 진료기록부 문장(D25).
 *  - v0.11 (2026-11-24) D19: 근접 강조 400건부터, 500건 도달 후 접수 시 경고 확인창. 건수 기준을 '굿닥에서 진료 완료까지 한 진료 건, 의사별'로 확정. 띠와 상세 안내 문구를 법령안(31조의7④) 참고 가안으로 교체, '가안' 표시.
 *  - v0.10 (2026-11-24) D19: GNB 바로 아래 모든 탭 공통 '월 비대면 진료 500건(굿닥 기준)' 안내 띠[제안]. 띠 오른쪽 '자세히 보기'로 펼치는 상세 안내(왜 500건인지, 굿닥 기준의 뜻, 세는 법). 패널 '이번 달 진료 건수' 토글(여유/근접/도달).
 *  - v0.9 (2026-11-23) D18 변경: 접수 전 확인에 '첨부한 신분증으로 본인 여부를 확인했어요' 체크, '본인 확인 서류' 열람 영역(전 대상, 확대 보기), 거주지 '신분증 겸용' 상태. 진료 중 확인 상자 삭제.
 *  - v0.8 (2026-11-23) D18(이전안): 본인 확인을 화상 진료 중 확인으로 옮김.
 *  - v0.7 (2026-11-23) 패널 '바뀐 곳 점선 표시' 토글(기본 켜짐). 근거 법령 보기(패널 스위치, 기본 켜짐): 접수 전 확인(31조의5⑦·⑧3, 본인 ②③, 대상별 31조의2①②③·31조의5⑤),
 *    거주지 서류(31조의2②·31조의15②·부칙6조), 예외 대상(31조의5⑤3⑥·부칙6조), 재진 응답, 법정대리인(31조의5④), 안내문 동의(31조의9),
 *    전화 진료 사유(31조의5①·⑧2), 진료 취소(31조의5⑧4). 캡처 5장 추가(identity-check, after-check, record-check/phone/stop).
 *  - v0.6 (2026-11-23) 운영 코드(hospital-admin production) 기준 재대조: 키/몸무게 줄 제거(입력값 있을 때만, 현행 앱은 입력 화면 없음), 증상 '증상: 태그' 줄,
 *    첨부사진 2장·사진별 내려받기(24px)·전체 '내려받기'(xSmall 회색)→'받기완료'·확대 보기 내려받기, 입력칸 600, 작업 띠 문구 18px·타이머 버튼 왼쪽 흰색,
 *    진료시작·완료대기 진료완료 흰 바탕, 완료대기 테두리 #0D56B5, '다시 진료시작' 툴팁, 제증명·메모 치수, 섹션 제목 20px, GNB '진료대기', '푸시 알림',
 *    다이얼로그 취소 회색 채움, 진료취소 직접 입력 라벨 제거·빈칸 무시·토스트, 목록 진료일시 경과/오늘 시작 표기.
 *  - v0.5 (2026-11-23) 예외 대상 확인 영역(조회형/서류형), 패널 토글 '예외 대상 종류'(D17).
 *  - v0.4 (2026-11-23) 화면 전체 한글 단어 단위 줄바꿈(keep-all).
 *  - v0.4 (2026-11-23) 앱 v0.5 반영: 거주지 서류(종류·확대 보기·서류 없음), 초진 체크 보조 줄, 재진 응답 문구, 안내문 동의 사실 표시. 내려받기 제외.
 *  - v0.3 (2026-11-20) D8 변경 반영: 진료실-1 초진 실거주 증명 첨부 열람 영역, 패널 토글 '실거주 증명'.
 *  - v0.2 (2026-11-20) 현행 화면을 실제 개발 코드 기준으로 다시 그림(GNB·목록·작업 띠·대기 타이머·환자정보·첨부사진·다이얼로그·프로필 메뉴).
 *    의료기관 구분(의원급/병원급) 토글과 병원급 접수 제한 제거.
 *    진료취소한 행은 현행대로 접수대기·접수완료 표에서 빠진다(진료완료 탭은 그리지 않음, 패널에 사유 표시).
 *    현행 흐름 추가: 접수완료 → 예상 대기 시간 설정, 진료시작 → 진료 시작하기 → 완료대기. 화상진료 끄기 버튼은 현행 '확인'으로.
 *  - v0.1 (2026-11-20) 최초 작성. 진료실-1~3, 상태 토글 패널.
 * ─────────────────────────────────────────────────────────────
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';

const IMG_LOGO = require('../../../assets/untact-law-doctor/img_logo_untact.svg');
const IMG_DOCTOR = require('../../../assets/untact-law-doctor/img_doctor_avatar.svg');
const IMG_FEMALE = require('../../../assets/untact-law-doctor/female.svg');
const IMG_MALE = require('../../../assets/untact-law-doctor/male.svg');
const IC_RECEPTION = require('../../../assets/untact-law-doctor/ic_task_reception.svg');
const IC_TREATMENT = require('../../../assets/untact-law-doctor/ic_task_treatment.svg');
const IC_DOWNLOAD = require('../../../assets/untact-law-doctor/ic_download.svg');
const IC_DOWNLOAD_DONE = require('../../../assets/untact-law-doctor/ic_download_complete.svg');
const IC_DOWNLOAD_BIG = require('../../../assets/untact-law-doctor/ic_download_big.svg');
const IC_DOWNLOAD_DONE_BIG = require('../../../assets/untact-law-doctor/ic_download_complete_big.svg');
const SYMPTOM_PHOTOS: string[] = [
  require('../../../assets/untact-law-doctor/symptom_sample_1.svg'),
  require('../../../assets/untact-law-doctor/symptom_sample_2.svg'),
];

/* ---------- 타입 ---------- */
type Jump = 'r1' | 'r2a' | 'r2v' | 'r2b' | 'r3';
type Target = 'revisit' | 'first' | 'exception';
type Who = 'self' | 'child';
type Method = 'video' | 'phone';
type Status = 'request' | 'waiting' | 'ontreatment' | 'cancel';
type Dialog = 'quota' | 'reception' | 'start' | 'phone' | 'cancel' | 'video' | null;

const JUMPS: { key: Jump; label: string; kind: 'new' | 'mod' }[] = [
  { key: 'r1', label: '진료실-1 접수 전 확인', kind: 'mod' },
  { key: 'r2a', label: '진료실-2 전화 진료 사유', kind: 'new' },
  { key: 'r2v', label: '진료실-2 화상진료실 본인 확인', kind: 'new' },
  { key: 'r2b', label: '진료실-2 화상진료 끄기', kind: 'mod' },
  { key: 'r3', label: '진료실-3 진료 취소 사유', kind: 'mod' },
];
/* 하위 티켓(CONNECT26-) → 제목, 상위 티켓 */
const TICKET_TITLE: Record<number, string> = {
  1208: '신분증 사본 확인·화상 얼굴 대조와 진료 시작 제어',
  1212: '진료실 대면 이력·주소·병원급 자격 확인',
  1217: '진료실 관계 증빙·동의 표시와 의료인 확인',
  1219: '진료실 화상 설정과 접수 대상 안내',
  1221: '진료실 전화 전환 모달과 대체 본인 확인',
  1223: '진료실 앱 동의 일시와 의료인 설명·동의 확인',
  1225: '진료실 규제 대응 취소·중단 사유',
  1226: '앱 진료내역 취소 사유·대면 안내·환불',
  1228: '화상진료 화면 선택 증상과 직접 입력 원문',
  1255: '진료실 월 굿닥 비대면 건수와 산정 기준',
};
const TICKET_PARENT: Record<number, number> = {
  1208: 1177,
  1212: 1176,
  1217: 1178,
  1219: 1179,
  1221: 1180,
  1223: 1182,
  1225: 1183,
  1226: 1183,
  1228: 1185,
  1255: 1203,
};
const PARENT_TITLE: Record<number, string> = {
  1176: '진료 대상·주소·병원급 예외 확인',
  1177: '진료 전 환자 본인 확인과 실패 처리',
  1178: '법정대리인 설명·동의 확인',
  1179: '화상 기본값 적용',
  1180: '음성진료 예외 확인과 사유 기록',
  1182: '진료 전 의료인 설명·환자 동의 확인',
  1183: '진료 거절·중단과 대면진료 안내',
  1185: '진료실 환자 문진 원문 확인',
  1203: '반기 진료 비율·의료인별 월평균',
};
/* 패널 메모 줄별 대응 티켓(CONNECT26-). 결정 번호는 화면에 쓰지 않는다 */
const NOTE_TICKETS: Record<Jump, number[][]> = {
  r1: [[], [1212, 1217], [1208, 1212, 1217], [1208], [1212, 1217], [1212], [1223, 1208], []],
  r2a: [[], [1223, 1217], [1223], [1223, 1221], [1221], [1221, 1212]],
  r2v: [[1208], [1228], [1208, 1217], []],
  r2b: [[1219], [1219], []],
  r3: [[1225], [1225], [1225], [1226]],
};
/* 메모 줄 밖의 공통 변경 */
const EXTRA_TICKETS: { t: number; where: string }[] = [
  { t: 1255, where: '모든 화면 상단 월 건수 안내 띠' },
];
const stripD = (t: string) =>
  t
    .replace(/D\d+(?:~D?\d+)?(?:,\s*)?/g, '')
    .replace(/\(\s*\)/g, '')
    .replace(/\(\s*,\s*/g, '(')
    .replace(/,\s*\)/g, ')')
    .replace(/\s+([.,])/g, '$1')
    .replace(/\s{2,}/g, ' ');
const KIND_LABEL = { new: '신규', mod: '수정' } as const;

/* 진료실-3 — 현행 types.ts cancelReasons 에서 '환자 월 2회' 삭제, 건수 사유 교체 */
const CANCEL_REASONS = [
  '비대면 진료 대상 환자가 아닙니다.',
  '환자와 연락이 되지 않습니다.',
  '대면 진료가 필요한 증상입니다.',
  '화상으로 본인 확인이 되지 않았습니다.',
  '현재 내원 환자가 많아 진료가 어렵습니다.',
  '의사별 비대면진료 가능 건수(월평균 500건)를 초과했습니다.',
  '직접 입력',
];
const CANCEL_DIRECT = '직접 입력';

/* 진료실-2 — 법이 정한 전화(음성) 진료 사유 */
const PHONE_REASONS = [
  '이 병원에서 대면진료를 받은 환자이고, 전화로 충분하다고 판단했어요',
  '화상 연결이 안 돼요 (정보통신장애 등)',
  '화상 연결이 불가능한 그 밖의 사유',
];
/* D25 — 고른 사유를 진료기록부에 옮길 문장(가안) */
const PHONE_RECORD = [
  '이 의료기관에서 대면진료를 받은 환자로, 의사가 화상 없이 진료할 수 있다고 판단하여 전화로 진료함',
  '정보통신장애로 화상 연결이 불가능하여 전화로 진료함',
  '화상 연결이 불가능하여 전화로 진료함: ',
];
const PHONE_DIRECT = 2;

/* D33 — 진료 전 설명 4가지(시행규칙안 31조의9, 4번은 법 34조의3⑥). 의사가 항목별로 '설명함' 체크 */
const EXPLAIN_ITEMS = [
  '직접 진찰과 검사를 할 수 없어 진단의 정확도에 한계가 있다',
  '법에서 정한 경우 비대면진료를 하지 않거나 중단할 수 있다',
  '주된 증상, 기저질환, 병력과 가족력, 복용 중인 약을 사실대로 알릴 의무가 있다',
  '다른 사람의 인적 사항을 쓰거나 속여서 처방받는 행위는 금지되고 형사처벌 대상이 될 수 있다',
];

/* 현행 types.ts waitingTimes */
const WAITING_TIMES = [
  { value: '5', label: '5분' },
  { value: '10', label: '10분' },
  { value: '15', label: '15분' },
  { value: '0', label: '접수 순으로 진료예정' },
];

const TARGET_BADGE: Record<Target, string> = {
  revisit: '재진 · 환자 응답',
  first: '초진',
  exception: '예외 대상',
};

/* 현행 treatment-table.tsx 상태 색 */
const STATUS: Record<Status, { t: string; c: string }> = {
  request: { t: '접수대기', c: '#31353F' },
  waiting: { t: '진료대기', c: 'rgba(0,115,250,.9)' },
  ontreatment: { t: '완료대기', c: 'rgba(0,115,250,.9)' },
  cancel: { t: '진료취소', c: '#A8AEBD' },
};

type Row = { at: string; name: string; female: boolean; method: string; when: string; st: Status | 'endcall' };
const OTHER_WAITING: Row[] = [
  { at: '2026.10.04 09:00', name: '가*******F', female: true, method: '화상', when: '10월 4일 14:00 시작', st: 'request' },
  { at: '2026.10.04 09:00', name: '가****G', female: true, method: '화상', when: '', st: 'request' },
  { at: '2026.10.04 09:00', name: '가****O', female: false, method: '화상', when: '', st: 'request' },
];
const OTHER_DONE: Row[] = [
  { at: '2026.10.04 09:10', name: '가****B', female: false, method: '화상', when: '진료 4분 전', st: 'waiting' },
  { at: '2026.10.04 09:00', name: '가****C', female: true, method: '전화', when: '', st: 'endcall' },
];

/* ---------- 현행 아이콘(legacy-icons.tsx path) ---------- */
const IconVerified = ({ size = 20 }: { size?: number }) => (
  <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M8.6 22.5L6.7 19.3L3.1 18.5L3.45 14.8L1 12L3.45 9.2L3.1 5.5L6.7 4.7L8.6 1.5L12 2.95L15.4 1.5L17.3 4.7L20.9 5.5L20.55 9.2L23 12L20.55 14.8L20.9 18.5L17.3 19.3L15.4 22.5L12 21.05L8.6 22.5ZM10.95 15.55L16.6 9.9L15.2 8.45L10.95 12.7L8.8 10.6L7.4 12L10.95 15.55Z"
      fill="currentColor"
    />
  </svg>
);
const IconCopy = () => (
  <svg aria-hidden="true" width={20} height={20} viewBox="0 0 20 20" fill="none">
    <path
      d="M4.37501 18.667C3.80567 18.667 3.32301 18.469 2.92701 18.073C2.53101 17.677 2.33301 17.1943 2.33301 16.625V5.27101H4.37501V16.625H13.729V18.667H4.37501ZM7.91701 15.125C7.34701 15.125 6.86434 14.927 6.46901 14.531C6.07301 14.1357 5.87501 13.653 5.87501 13.083V3.37501C5.87501 2.80567 6.07301 2.32301 6.46901 1.92701C6.86434 1.53101 7.34701 1.33301 7.91701 1.33301H15.625C16.1943 1.33301 16.677 1.53101 17.073 1.92701C17.469 2.32301 17.667 2.80567 17.667 3.37501V13.083C17.667 13.653 17.469 14.1357 17.073 14.531C16.677 14.927 16.1943 15.125 15.625 15.125H7.91701ZM7.91701 13.083H15.625V3.37501H7.91701V13.083Z"
      fill="currentColor"
    />
  </svg>
);

const IconCheckSm = () => (
  <svg aria-hidden="true" width={20} height={20} viewBox="0 0 24 24" fill="none">
    <path d="M5 12.5l4.5 4.5L19 7.5" stroke="#0073FA" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* 근거 법령(입법예고안 조문 캡처, 앱과 같은 assets/untact-law-app/law) */
const LAW: Record<string, { doc: string; article: string; page: string; img: string }> = {
  'revisit-period': { doc: '의료법 시행규칙 일부개정령안(입법예고안)', article: '제31조의2제1항', page: '4쪽', img: require('../../../assets/untact-law-app/law/revisit-period.png') },
  'revisit-check': { doc: '의료법 시행규칙 일부개정령안(입법예고안)', article: '제31조의5제5항제1호', page: '10쪽', img: require('../../../assets/untact-law-app/law/revisit-check.png') },
  'first-region': { doc: '의료법 시행규칙 일부개정령안(입법예고안)', article: '제31조의2제2항', page: '4쪽', img: require('../../../assets/untact-law-app/law/first-region.png') },
  'exception-list': { doc: '의료법 시행규칙 일부개정령안(입법예고안)', article: '제31조의2제3항', page: '5~6쪽', img: require('../../../assets/untact-law-app/law/exception-list.png') },
  'exception-check': { doc: '의료법 시행규칙 일부개정령안(입법예고안)', article: '제31조의5제5항제3호·제6항', page: '10~11쪽', img: require('../../../assets/untact-law-app/law/exception-check.png') },
  'phone-condition': { doc: '의료법 시행규칙 일부개정령안(입법예고안)', article: '제31조의5제1항', page: '8~9쪽', img: require('../../../assets/untact-law-app/law/phone-condition.png') },
  'visual-diseases': { doc: '의료법 시행규칙 일부개정령안(입법예고안)', article: '제31조의11제1항', page: '16~17쪽', img: require('../../../assets/untact-law-app/law/visual-diseases.png') },
  'rx-7days': { doc: '의료법 시행규칙 일부개정령안(입법예고안)', article: '제31조의3제1항~제4항', page: '6~7쪽', img: require('../../../assets/untact-law-app/law/rx-7days.png') },
  'rx-banned': { doc: '비대면진료 실시 및 관리에 관한 고시(안)', article: '제4조', page: '5~6쪽', img: require('../../../assets/untact-law-app/law/rx-banned.png') },
  'resid-actual': { doc: '의료법 시행규칙 일부개정령안(입법예고안)', article: '제31조의15제2항', page: '25~26쪽', img: require('../../../assets/untact-law-app/law/resid-actual.png') },
  'resid-before-system': { doc: '의료법 시행규칙 일부개정령안(입법예고안)', article: '부칙 제6조제1항·제2항', page: '41쪽', img: require('../../../assets/untact-law-app/law/resid-before-system.png') },
  'no-identity-theft': { doc: '의료법 시행규칙 일부개정령안(입법예고안)', article: '제31조의15제6항', page: '27쪽', img: require('../../../assets/untact-law-app/law/no-identity-theft.png') },
  'explain-4': { doc: '의료법 시행규칙 일부개정령안(입법예고안)', article: '제31조의9', page: '15쪽', img: require('../../../assets/untact-law-app/law/explain-4.png') },
  'guardian': { doc: '의료법 시행규칙 일부개정령안(입법예고안)', article: '제31조의5제4항', page: '9~10쪽', img: require('../../../assets/untact-law-app/law/guardian.png') },
  'platform-notice': { doc: '비대면진료 실시 및 관리에 관한 고시(안)', article: '제24조', page: '16쪽', img: require('../../../assets/untact-law-app/law/platform-notice.png') },
  'identity-check': { doc: '의료법 시행규칙 일부개정령안(입법예고안)', article: '제31조의5제2항·제3항', page: '9쪽', img: require('../../../assets/untact-law-app/law/identity-check.png') },
  'after-check': { doc: '의료법 시행규칙 일부개정령안(입법예고안)', article: '제31조의5제7항', page: '11쪽', img: require('../../../assets/untact-law-app/law/after-check.png') },
  'record-check': { doc: '의료법 시행규칙 일부개정령안(입법예고안)', article: '제31조의5제8항제3호', page: '11쪽', img: require('../../../assets/untact-law-app/law/record-check.png') },
  'record-phone': { doc: '의료법 시행규칙 일부개정령안(입법예고안)', article: '제31조의5제8항제2호', page: '11쪽', img: require('../../../assets/untact-law-app/law/record-phone.png') },
  'doctor-monthly-limit': { doc: '의료법 시행규칙 일부개정령안(입법예고안)', article: '제31조의7제4항', page: '12~13쪽', img: require('../../../assets/untact-law-app/law/doctor-monthly-limit.png') },
  'record-stop': { doc: '의료법 시행규칙 일부개정령안(입법예고안)', article: '제31조의5제8항제4호', page: '11쪽', img: require('../../../assets/untact-law-app/law/record-stop.png') },
};
const Switch = ({ on, onClick }: { on: boolean; onClick?: () => void }) => (
  <button type="button" role="switch" aria-checked={on} className={`uld-switch ${on ? 'is-on' : ''}`} onClick={onClick}>
    <span />
  </button>
);
const Check = ({ on, onClick, children, disabled }: { on: boolean; onClick: () => void; children: React.ReactNode; disabled?: boolean }) => (
  <button type="button" className={`uld-check ${on ? 'is-on' : ''}`} onClick={onClick} disabled={disabled}>
    <span className="uld-check-box">
      {on && (
        <svg width={12} height={12} viewBox="0 0 24 24" fill="none">
          <path d="M5 12.5l4.5 4.5L19 7.5" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </span>
    <span>{children}</span>
  </button>
);
const Btn = ({
  v = 'primary',
  children,
  className = '',
  ...rest
}: { v?: 'primary' | 'secondary' } & React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button type="button" className={`uld-btn is-${v} ${className}`} {...rest}>
    {children}
  </button>
);
const Avatar = ({ on }: { on: boolean }) => (
  <span className="uld-avatar">
    <img src={IMG_DOCTOR} alt="" />
    <span className={`uld-avatar-dot ${on ? 'is-on' : ''}`} />
  </span>
);

/* D30 화상진료실 아이콘(피그마 에셋 대신 같은 모양으로 다시 그림) */
const IconVr = ({ k }: { k: 'report' | 'eye' | 'setting' | 'mic' | 'cam' | 'end' | 'info' }) => {
  const sz = k === 'report' || k === 'eye' ? 20 : k === 'info' ? 24 : 22;
  const st = { stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };
  return (
    <svg aria-hidden="true" width={sz} height={sz} viewBox="0 0 24 24">
      {k === 'report' && (
        <>
          <path {...st} d="M6 18v-6a6 6 0 0 1 12 0v6" />
          <path {...st} d="M4 18h16M12 3v2M4.5 6.5l1.4 1.4M19.5 6.5l-1.4 1.4" />
        </>
      )}
      {k === 'eye' && (
        <>
          <path {...st} d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12Z" />
          <circle {...st} cx={12} cy={12} r={3} />
        </>
      )}
      {k === 'setting' && <path {...st} d="M4 7h10M18 7h2M4 17h2M10 17h10M16 5v4M8 15v4" />}
      {k === 'mic' && (
        <>
          <rect {...st} x={9} y={3} width={6} height={11} rx={3} />
          <path {...st} d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" />
        </>
      )}
      {k === 'cam' && (
        <>
          <rect {...st} x={3} y={6.5} width={12.5} height={11} rx={2} />
          <path {...st} d="m15.5 10.5 5.5-3v9l-5.5-3" />
        </>
      )}
      {k === 'end' && (
        <path
          fill="currentColor"
          d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85a1 1 0 0 1-1.41-.02L.29 13.06a1 1 0 0 1 0-1.41C3.34 8.75 7.46 7 12 7s8.66 1.75 11.71 4.65a1 1 0 0 1 0 1.41l-2.48 2.49a1 1 0 0 1-1.41.02c-.79-.73-1.68-1.36-2.66-1.85a1 1 0 0 1-.56-.9v-3.1A14.9 14.9 0 0 0 12 9Z"
        />
      )}
      {k === 'info' && (
        <>
          <circle cx={12} cy={12} r={10} fill="#fff" />
          <path d="M12 11v6" stroke="#0073FA" strokeWidth={2} strokeLinecap="round" />
          <circle cx={12} cy={7.5} r={1.2} fill="#0073FA" />
        </>
      )}
    </svg>
  );
};
/* 영상 자리표시: 사람 실루엣 */
const Silhouette = ({ small }: { small?: boolean }) => (
  <svg aria-hidden="true" className="uld-vr-sil" viewBox="0 0 100 100" width={small ? 72 : 200} height={small ? 72 : 200}>
    <circle cx={50} cy={36} r={17} fill="rgba(255,255,255,.18)" />
    <path d="M16 100c0-21 15-35 34-35s34 14 34 35Z" fill="rgba(255,255,255,.18)" />
  </svg>
);

/* 현행 table 열 비율(담당의 열 없음 — 의사 프로필 선택 상태) */
const COLS = [
  { label: '요청일시', w: 2 },
  { label: '성별/환자명', w: 2 },
  { label: '전화번호', w: 2.2 },
  { label: '증상', w: 2 },
  { label: '진료방식', w: 1 },
  { label: '진료일시', w: 2.2 },
  { label: '진료상태', w: 1, right: true },
];

type Resid = 'resident' | 'actual' | 'id' | 'none';
type ExKind = 'query' | 'doc';
type DocDef = { title: string; rows: { label: string; segs: { t: string; k?: 'keep' | 'mask' }[] }[] };
const ResidDoc = ({ doc, mini }: { doc: DocDef; mini?: boolean }) => (
  <span className={`uld-doc ${mini ? 'is-mini' : ''}`}>
    <span className="uld-doc-title">{doc.title}</span>
    {doc.rows.map(r => (
      <span key={r.label} className="uld-doc-row">
        <span className="uld-doc-k">{r.label}</span>
        <span className="uld-doc-v">
          {r.segs.map((g, i) => (
            <span key={i} className={g.k ? `is-${g.k}` : ''}>
              {g.k === 'mask' ? <span className="uld-doc-hide">{g.t}</span> : g.t}
            </span>
          ))}
        </span>
      </span>
    ))}
  </span>
);
type State = { jump: Jump; target: Target; who: Who; method: Method; resid: Resid; ex: ExKind };

export default function UntactLawDoctor() {
  /* 검토용 URL 파라미터: ?jump=r1&target=first&who=child&method=phone&resid=actual */
  const [s, setS] = useState<State>(() => {
    const init: State = { jump: 'r1', target: 'first', who: 'self', method: 'video', resid: 'resident', ex: 'doc' };
    try {
      const q = new URLSearchParams(window.location.search);
      (Object.keys(init) as (keyof State)[]).forEach(k => {
        const v = q.get(k);
        if (v) (init as Record<string, unknown>)[k] = v;
      });
      if (!JUMPS.some(j => j.key === init.jump)) init.jump = 'r1';
      if (!(init.target in TARGET_BADGE)) init.target = 'first';
      if (init.who !== 'child') init.who = 'self';
      if (init.method !== 'phone' || init.target !== 'revisit') init.method = 'video';
      if (q.get('proof') === 'none' && !q.get('resid')) init.resid = 'none'; /* v0.3 링크 호환 */
      if (!['resident', 'actual', 'id', 'none'].includes(init.resid)) init.resid = 'resident';
      if (init.ex !== 'query') init.ex = 'doc';
    } catch {
      /* 파라미터 없음 */
    }
    return init;
  });
  const set = (p: Partial<State>) => setS(prev => ({ ...prev, ...p }));

  /* 가상환자 A 진행 상태 */
  const [status, setStatus] = useState<Status>('request');
  const [open, setOpen] = useState(true);
  const [checks, setChecks] = useState([false, false, false]);
  const toggleCheck = (i: number) => setChecks(c => c.map((v, j) => (j === i ? !v : v)));
  const [faceCheck, setFaceCheck] = useState(false);
  /* D33 — 진료 전 설명 항목별 체크(4개 모두 체크해야 진료 시작 버튼이 열림) */
  const [explained, setExplained] = useState([false, false, false, false]);
  const toggleExplained = (i: number) => setExplained(c => c.map((v, j) => (j === i ? !v : v)));
  /* D30 — 화상진료실(오버레이). 경과 시간은 화상 진료 시작 시각부터 */
  const [roomOpen, setRoomOpen] = useState(false);
  /* 화상진료실 오버레이는 좌측 프로토 패널 오른쪽부터 덮는다(패널은 계속 쓸 수 있게) */
  useEffect(() => {
    if (!roomOpen) return;
    const set = () => {
      const p = document.querySelector('.uld-panel');
      const right = p ? Math.ceil(p.getBoundingClientRect().right) + 8 : 0;
      document.documentElement.style.setProperty('--uld-vr-left', `${right}px`);
    };
    set();
    window.addEventListener('resize', set);
    return () => window.removeEventListener('resize', set);
  }, [roomOpen]);
  const [roomAt, setRoomAt] = useState<number | null>(null);
  const [roomToast, setRoomToast] = useState(false);
  const roomToastTimer = useRef(0);
  const openRoom = (startAt?: number) => {
    if (startAt) setRoomAt(startAt);
    setRoomOpen(true);
    setRoomToast(true);
    window.clearTimeout(roomToastTimer.current);
    roomToastTimer.current = window.setTimeout(() => setRoomToast(false), 3000);
  };
  const [disease, setDisease] = useState<'general' | 'visual'>('general');
  const [under13, setUnder13] = useState(false);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [wait, setWait] = useState('5');
  const [waitAt, setWaitAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);
  const [cancelPick, setCancelPick] = useState(CANCEL_REASONS[0]);
  const [cancelText, setCancelText] = useState('');
  const [cancelError, setCancelError] = useState('');
  const [toast, setToast] = useState('');
  const [lawOn, setLawOn] = useState(true);
  const [marksOn, setMarksOn] = useState(true);
  const [quota, setQuota] = useState<'normal' | 'near' | 'full'>('normal');
  const [quotaMore, setQuotaMore] = useState(false);
  const [lawView, setLawView] = useState<{ ids: string[]; note?: string } | null>(null);
  useEffect(() => {
    if (!lawView) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setLawView(null);
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [lawView]);
  /* 앞 글자와 떨어지지 않게 단어 결합 문자 + 인라인 span (앱과 같은 방식) */
  const law = (ids: string[], note?: string) =>
    lawOn ? (
      <>
        {'\u2060'}
        <span
          role="button"
          tabIndex={0}
          className="uld-law"
          onClick={e => {
            e.stopPropagation();
            e.preventDefault();
            setLawView({ ids, note });
          }}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.stopPropagation();
              setLawView({ ids, note });
            }
          }}>
          법령
        </span>
      </>
    ) : null;
  const [cancelDone, setCancelDone] = useState('');
  const [phonePick, setPhonePick] = useState<number | null>(null);
  const [phoneText, setPhoneText] = useState('');
  const [phoneDone, setPhoneDone] = useState('');
  const [treatMethod, setTreatMethod] = useState<Method>('video');
  const [menuOpen, setMenuOpen] = useState(false);
  const [videoOn, setVideoOn] = useState(true);
  const [viewerOpen, setViewerOpen] = useState(false);
  /* 확대 보기 대상: 본인 확인 서류(D18) 또는 거주지·예외 대상 서류 */
  const [viewerKind, setViewerKind] = useState<'id' | 'guardian' | 'doc'>('doc');
  // 현행 SymptomInformation: 사진별 내려받기 아이콘 → 0.5초 완료 아이콘, 전체 '내려받기' → '받기완료'(secondarySolid) 0.5초
  const [photoView, setPhotoView] = useState<number | null>(null);
  const [photoDone, setPhotoDone] = useState<number[]>([]);
  const [photoAllDone, setPhotoAllDone] = useState(false);
  const [viewerDlDone, setViewerDlDone] = useState(false);
  const flashTimers = useRef<Record<string, number>>({});
  const flash = (key: string, fn: (on: boolean) => void) => {
    window.clearTimeout(flashTimers.current[key]);
    fn(true);
    flashTimers.current[key] = window.setTimeout(() => fn(false), 500);
  };
  useEffect(() => {
    if (photoView === null) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setPhotoView(null);
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [photoView]);

  /* 화상진료실이 열려 있으면 뒤쪽 스크롤 잠금 */
  useEffect(() => {
    if (!roomOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [roomOpen]);

  /* 전화 진료는 재진만 신청 가능(앱과 같음) */
  useEffect(() => {
    if (s.target !== 'revisit' && s.method === 'phone') set({ method: 'video' });
  }, [s.target, s.method]);

  const phoneDefault = s.target === 'first' || disease === 'visual' || under13 ? null : 0;
  const isChild = s.who === 'child';
  /* 자녀 서류(건강보험증·여권)는 주소가 없어 신분증 겸용 불가 */
  useEffect(() => {
    if (isChild && s.resid === 'id') set({ resid: 'resident' });
  }, [isChild, s.resid]);
  /* 환자가 앱에서 가림 처리해 올린 가상 서류 — 이름·주민번호 앞자리는 환자정보와 대조 가능 */
  const rrnFront = isChild ? '120101-' : '900101-';
  /* 확대 보기 대상 서류는 진료 대상에 따라 */
  /* 예외 대상 확인 서류(가상) — 서류형 예시는 선원 */
  const exDoc: DocDef = {
    title: '선원수첩',
    rows: [
      { label: '성명', segs: [{ t: '가상환자 A', k: 'keep' }] },
      { label: '생년월일', segs: [{ t: rrnFront.replace('-', ''), k: 'keep' }] },
      { label: '주민등록번호 뒷자리', segs: [{ t: '0000000', k: 'mask' }] },
      { label: '승선 선박', segs: [{ t: '{선박명}' }] },
    ],
  };
  const residDoc: DocDef =
    s.resid === 'actual' && isChild
      ? {
          title: '재학증명서',
          rows: [
            { label: '성명', segs: [{ t: '가상환자 A', k: 'keep' }] },
            { label: '주민등록번호', segs: [{ t: rrnFront, k: 'keep' }, { t: '0000000', k: 'mask' }] },
            { label: '주소', segs: [{ t: '서울특별시', k: 'keep' }, { t: '○○구 ○○로 00', k: 'mask' }] },
            { label: '학교', segs: [{ t: '{학교명}' }] },
          ],
        }
      : s.resid === 'actual'
      ? {
          title: '부동산 임대차 계약서',
          rows: [
            { label: '소재지', segs: [{ t: '서울특별시', k: 'keep' }, { t: '○○구 ○○동 000-00', k: 'mask' }] },
            { label: '보증금·월세', segs: [{ t: '0,000만 원 / 00만 원', k: 'mask' }] },
            { label: '임차인 성명', segs: [{ t: '가상환자 A', k: 'keep' }] },
            { label: '주민등록번호', segs: [{ t: rrnFront, k: 'keep' }, { t: '0000000', k: 'mask' }] },
            { label: '임대인', segs: [{ t: '○○○ · 000000-0000000', k: 'mask' }] },
            { label: '연락처', segs: [{ t: '010-0000-0000', k: 'mask' }] },
          ],
        }
      : {
          title: '주민등록표 (초본)',
          rows: [
            { label: '성명', segs: [{ t: '가상환자 A', k: 'keep' }] },
            { label: '주민등록번호', segs: [{ t: rrnFront, k: 'keep' }, { t: '0000000', k: 'mask' }] },
            { label: '주소', segs: [{ t: '서울특별시', k: 'keep' }, { t: '○○구 ○○로 00, 000호', k: 'mask' }] },
            { label: '발급일', segs: [{ t: '{발급일}' }] },
          ],
        };

  const reset = (jump: Jump) => {
    const r2a = jump === 'r2a';
    const r2v = jump === 'r2v';
    /* 진료대기, 진료중 바로가기는 접수 전 확인과 진료 전 설명을 마친 상태로 연다 */
    setChecks(r2a || r2v ? [true, true, true] : [false, false, false]);
    setExplained(r2a || r2v ? [true, true, true, true] : [false, false, false, false]);
    setFaceCheck(false);
    setCancelPick(CANCEL_REASONS[0]);
    setCancelText('');
    setCancelError('');
    setCancelDone('');
    setPhonePick(phoneDefault);
    setPhoneText('');
    setPhoneDone('');
    setTreatMethod(r2v ? 'video' : s.method);
    setMenuOpen(false);
    setVideoOn(true);
    setViewerOpen(false);
    setRoomOpen(false);
    if (r2v) openRoom(Date.now());
    else setRoomAt(null);
    setWait('5');
    setWaitAt(r2a ? Date.now() + 5 * 60_000 : null);
    setOpen(true);
    setStatus(r2v ? 'ontreatment' : r2a ? 'waiting' : 'request');
    setDialog(jump === 'r3' ? 'cancel' : jump === 'r2b' ? 'video' : r2a ? 'phone' : null);
  };
  useEffect(() => reset(s.jump), [s.jump, s.target, s.who, s.method, disease, under13]);
  useEffect(() => setViewerOpen(false), [s.resid, s.ex]);
  /* 확대 보기: Esc로 닫기 · 뒤쪽 스크롤 잠금(현행 Dialog와 같게) */
  useEffect(() => {
    if (!viewerOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setViewerOpen(false);
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [viewerOpen]);

  /* 본인 확인 서류(가상, D18) — 주소는 '시'까지 남김 */
  /* 자녀(미성년) 신청이면 아이 서류는 건강보험증·여권만(D18) — 예시는 건강보험증 */
  const idDoc: DocDef = isChild
    ? {
        title: '건강보험증',
        rows: [
          { label: '성명', segs: [{ t: '가상환자 A', k: 'keep' }] },
          { label: '주민등록번호', segs: [{ t: rrnFront, k: 'keep' }, { t: '0000000', k: 'mask' }] },
          { label: '자격 취득일', segs: [{ t: '0000.00.00' }] },
        ],
      }
    : {
    title: '주민등록증',
    rows: [
      { label: '사진', segs: [{ t: '{얼굴 사진}', k: 'keep' }] },
      { label: '성명', segs: [{ t: '가상환자 A', k: 'keep' }] },
      { label: '주민등록번호', segs: [{ t: rrnFront, k: 'keep' }, { t: '0000000', k: 'mask' }] },
      { label: '주소', segs: [{ t: '서울특별시', k: 'keep' }, { t: '○○구 ○○로 00', k: 'mask' }] },
    ],
  };
  /* D18 — 자녀 신청이면 신청한 보호자의 신분증도 받는다 */
  const guardianDoc: DocDef = {
    title: '주민등록증(보호자)',
    rows: [
      { label: '사진', segs: [{ t: '{얼굴 사진}', k: 'keep' }] },
      { label: '성명', segs: [{ t: '{보호자 성명}', k: 'keep' }] },
      { label: '주민등록번호', segs: [{ t: '800101-', k: 'keep' }, { t: '0000000', k: 'mask' }] },
      { label: '주소', segs: [{ t: '서울특별시', k: 'keep' }, { t: '○○구 ○○로 00', k: 'mask' }] },
    ],
  };
  const viewDoc = viewerKind === 'id' ? idDoc : viewerKind === 'guardian' ? guardianDoc : s.target === 'exception' ? exDoc : residDoc;
  const canAccept = checks[0] && checks[1] && (!isChild || checks[2]);
  /* D33 — 4가지 설명 체크와 (자녀면) 법정대리인 동의 확인이 모두 있어야 진료를 시작할 수 있다 */
  const guardianOk = !isChild || checks[2];
  const canStart = explained.every(Boolean) && guardianOk;
  const startHint = !guardianOk ? '법정대리인 동의를 확인해야 진료를 시작할 수 있어요' : '진료 전 설명 4가지를 모두 체크해야 진료를 시작할 수 있어요';
  const phoneFirstOff: '' | 'first' | 'visual' | 'under13' =
    s.target === 'first' ? 'first' : disease === 'visual' ? 'visual' : under13 ? 'under13' : '';
  const methodLabel = (m: Method) => (m === 'video' ? '화상' : '전화');
  const secondCheck =
    s.target === 'revisit'
      ? '차트에서 대면 이력을 확인했어요'
      : s.target === 'first'
        ? '비대면진료 대상 요건을 확인했어요 (초진)'
        : '비대면진료 대상 요건을 확인했어요 (예외 대상)';

  /* 다이얼로그 열기 — 열 때마다 처음 상태로 */
  const openPhone = () => {
    setPhonePick(phoneDefault);
    setPhoneText('');
    setDialog('phone');
  };
  const openCancel = () => {
    setCancelPick(CANCEL_REASONS[0]);
    setCancelText('');
    setCancelError('');
    setDialog('cancel');
  };
  const confirm = () => {
    if (dialog === 'quota') {
      setDialog('reception');
      return;
    }
    if (dialog === 'reception') {
      setWaitAt(wait === '0' ? null : Date.now() + Number(wait) * 60_000);
      setStatus('waiting');
    }
    if (dialog === 'start') {
      setTreatMethod('video');
      setStatus('ontreatment');
      openRoom(Date.now());
    }
    if (dialog === 'phone') {
      setPhoneDone(phonePick === PHONE_DIRECT ? phoneText.trim() : PHONE_REASONS[phonePick ?? 0]);
      setTreatMethod('phone');
      setStatus('ontreatment');
    }
    if (dialog === 'cancel') {
      /* 운영 context/Untact/waitingTreatment: 직접 입력 빈칸이면 안내 없이 무시, 성공 시 토스트 */
      if (cancelPick === CANCEL_DIRECT && !cancelText.trim()) return;
      setCancelDone(cancelPick === CANCEL_DIRECT ? cancelText.trim() : cancelPick);
      setStatus('cancel');
      setToast('진료를 취소했습니다.');
      window.setTimeout(() => setToast(''), 2500);
    }
    if (dialog === 'video') setVideoOn(false);
    setDialog(null);
  };

  /* 현행 treatment-list-model.ts treatmentListWaitingTime · timing-model.ts waitingTimeLabel */
  const diff = waitAt === null ? null : waitAt - now;
  /* 운영 WaitingTreatmentCard/WaitingTime: 지나면 'n분 경과', 15분 넘게 남으면 '오늘 hh:mm 시작' */
  const waitLabel = (() => {
    if (diff === null || waitAt === null) return '';
    if (diff < 0) {
      const m = Math.floor(-diff / 60_000);
      return m < 60 ? `${m}분 경과` : `${Math.floor(m / 60)}시간 경과`;
    }
    if (diff > 15 * 60_000) {
      const d = new Date(waitAt);
      return `오늘 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} 시작`;
    }
    return diff < 60_000 ? `진료 ${Math.floor(diff / 1000)}초 전` : `진료 ${Math.floor(diff / 60_000)}분 전`;
  })();
  const barTimer = (() => {
    if (diff === null) return '';
    const sec = Math.floor(Math.abs(diff) / 1000);
    const m = Math.floor(sec / 60);
    return `${diff >= 0 ? '진료' : '대기'} ${m ? `${m}분 ` : ''}${sec % 60}초 ${diff >= 0 ? '전' : '경과'}`;
  })();

  /* ───────── 목록 행 ───────── */
  const cells = (r: Row) => [
    r.at,
    <span className="uld-name" key="n">
      <span className={`uld-gender ${r.female ? 'is-f' : 'is-m'}`}>
        <img src={r.female ? IMG_FEMALE : IMG_MALE} alt={r.female ? '여' : '남'} />
        {r.st === 'waiting' && <span className="uld-gender-dot" />}
      </span>
      <b>{r.name}</b>
    </span>,
    '010-****-0000',
    '내과',
    r.method,
    r.when,
    <span key="s" style={{ color: r.st === 'endcall' ? '#18AC6C' : STATUS[r.st].c }}>
      {r.st === 'endcall' ? '수납대기' : STATUS[r.st].t}
    </span>,
  ];
  const rowLine = (r: Row, expanded: boolean, onClick?: () => void) => (
    <button type="button" className="uld-row" aria-expanded={expanded} onClick={onClick}>
      {cells(r).map((c, i) => (
        <span key={COLS[i].label} className="uld-cell" style={{ flex: COLS[i].w, textAlign: COLS[i].right ? 'right' : undefined }}>
          {c}
        </span>
      ))}
      <span className={`uld-caret ${expanded ? 'is-up' : ''}`} style={{ flex: 0.5 }}>
        ⌄
      </span>
    </button>
  );

  const rowAData: Row = {
    at: '2026.10.04 09:00',
    name: '가****A',
    female: true,
    method: methodLabel(status === 'ontreatment' ? treatMethod : s.method),
    when: status === 'waiting' ? waitLabel : '',
    st: status,
  };

  /* 작업 띠 — 현행 actionBar */
  const barStyle: Record<'request' | 'waiting' | 'ontreatment', React.CSSProperties> = {
    request: { color: '#0073FA', background: 'rgba(0,115,250,.1)', borderColor: 'rgba(0,115,250,.15)' },
    waiting: { color: 'white', background: 'rgba(0,115,250,.9)', borderColor: '#0073FA' },
    ontreatment: { color: 'white', background: '#0961CE', borderColor: '#0D56B5' },
  };
  const barMsg = { request: '환자를 접수해 주세요.', waiting: '진료를 시작해 주세요.', ontreatment: '진료를 완료해 주세요.' };
  /* 작업 띠 아이콘 — SVG 안 따옴표를 인코딩해 마스크로 쓴다 */
  const barIconUrl = `url("${(status === 'request' ? IC_RECEPTION : IC_TREATMENT).replace(/"/g, '%22').replace(/\n/g, '')}")`;
  const actionBar = status !== 'cancel' && (
    <div className="uld-bar" style={barStyle[status]}>
      <div className="uld-bar-msg">
        {/* 아이콘 색은 띠 글자색(currentColor)을 따른다 */}
        <span
          aria-hidden="true"
          className="uld-bar-icon"
          style={{ WebkitMaskImage: barIconUrl, maskImage: barIconUrl }}
        />
        <div>
          {/* D36 — 웹 신청 불가라 현행의 웹 신청 건 안내 줄은 두지 않는다 */}
          <strong>{barMsg[status]}</strong>
        </div>
      </div>
      <div className="uld-bar-btns">
        {status === 'waiting' && barTimer && <span className="uld-bar-timer">{barTimer}</span>}
        {status === 'request' && (
          <Btn disabled={!canAccept} onClick={() => setDialog(quota === 'full' ? 'quota' : 'reception')}>
            접수완료
          </Btn>
        )}
        {/* D26 — 시작 버튼은 '전화 진료 시작'과 '화상 진료 시작'으로 맞추고, 진료대기에는 진료완료를 두지 않는다 */}
        {status === 'waiting' && s.method === 'video' && (
          <Btn data-tk="1221 1223" v="secondary" className="uld-on-blue is-changed" disabled={!canStart} title={canStart ? undefined : startHint} onClick={openPhone}>
            전화 진료 시작
          </Btn>
        )}
        {status === 'waiting' && s.method === 'video' && (
          <Btn data-tk="1223" className="is-reverse is-changed" disabled={!canStart} title={canStart ? undefined : startHint} onClick={() => setDialog('start')}>
            화상 진료 시작
          </Btn>
        )}
        {status === 'waiting' && s.method === 'phone' && (
          <Btn data-tk="1221 1223" className="is-reverse is-changed" disabled={!canStart} title={canStart ? undefined : startHint} onClick={openPhone}>
            전화 진료 시작
          </Btn>
        )}
        {status === 'ontreatment' && treatMethod === 'video' && (
          <Btn v="secondary" className="uld-on-blue is-changed" title="화상 연결이 끊기면 다시 연결해 주세요" onClick={() => openRoom()}>
            다시 화상 연결
          </Btn>
        )}
        {status === 'ontreatment' && <Btn className="is-reverse">진료완료</Btn>}
      </div>
    </div>
  );

  const detail = (
    <div className="uld-detail">
      {actionBar}
      {status === 'request' && (
        <div data-tk={isChild ? '1208 1212 1217' : '1208 1212'} className="uld-confirm is-changed">
          <p className="uld-confirm-h">접수 전 확인 (의료인){law(['after-check', 'record-check'])}</p>
          <Check on={checks[0]} onClick={() => toggleCheck(0)}>
            {isChild ? '첨부한 자녀 서류와 보호자 신분증으로 본인 여부를 확인했어요' : '첨부한 신분증으로 본인 여부를 확인했어요'}
            {law(['identity-check'])}
          </Check>
          <Check on={checks[1]} onClick={() => toggleCheck(1)}>
            {secondCheck}
            {law(s.target === 'first' ? ['first-region'] : s.target === 'revisit' ? ['revisit-period', 'revisit-check'] : ['exception-list', 'exception-check'])}
          </Check>
          {isChild && (
            <Check on={checks[2]} onClick={() => toggleCheck(2)}>
              법정대리인 동의를 확인하고 설명했어요
              {law(['guardian'])}
            </Check>
          )}
          {s.target === 'first' && (
            <p className="uld-confirm-sub">
              {s.resid === 'id' ? '본인 확인 서류의 주소로 같은 시·도인지 확인해 주세요.' : '아래 거주지 서류로 같은 시·도인지 확인해 주세요.'}
            </p>
          )}
          {s.target === 'exception' && (
            <p className="uld-confirm-sub">
              {s.ex === 'query' ? '수진자 조회로 예외 대상인지 확인해 주세요.' : '아래 첨부 서류로 예외 대상인지 확인해 주세요.'}
            </p>
          )}
        </div>
      )}
      {(status === 'waiting' || status === 'ontreatment') && (
        <div data-tk={isChild ? '1223 1217' : '1223'} className="uld-confirm uld-explain is-changed">
          <p className="uld-confirm-h">진료 전 설명 확인 (의료인){law(['explain-4', 'after-check'])}</p>
          <dl className="uld-explain-meta">
            <dt>설명 대상</dt>
            <dd>{isChild ? '법정대리인(보호자) {보호자 성명}' : '환자 본인 가상환자 A'}</dd>
            <dt>동의자</dt>
            <dd>
              {isChild ? '법정대리인(보호자) {보호자 성명}' : '환자 본인 가상환자 A'}
              {isChild && law(['guardian'])}
            </dd>
            <dt>동의 시각</dt>
            <dd>{'{앱 동의 시각}'} (앱 신청 때 설명 4가지 확인 후 동의)</dd>
            {isChild && (
              <>
                <dt>법정대리인 동의</dt>
                <dd className={guardianOk ? '' : 'is-warn'}>{guardianOk ? '확인함 (접수 전 확인)' : '확인되지 않음, 진료를 시작할 수 없어요'}</dd>
              </>
            )}
          </dl>
          {EXPLAIN_ITEMS.map((t, i) => (
            <Check key={t} on={explained[i]} disabled={status !== 'waiting'} onClick={() => toggleExplained(i)}>
              <b>설명함</b> {i + 1}. {t}
            </Check>
          ))}
          {status === 'waiting' && !canStart && <p className="uld-confirm-sub">{startHint}</p>}
          <div className="uld-record">
            <span className="uld-record-k">
              진료기록부에 옮길 문장 <span className="uld-quota-tag">가안</span>
              {law(['explain-4'])}
            </span>
            <p>
              {isChild
                ? '비대면진료 전 법정대리인(보호자 {보호자 성명})에게 진단의 한계, 진료 거절 또는 중단 가능성, 사실 고지 의무, 금지 행위와 처벌 가능성을 설명하고 {앱 동의 시각}에 동의를 받음'
                : '비대면진료 전 환자 본인에게 진단의 한계, 진료 거절 또는 중단 가능성, 사실 고지 의무, 금지 행위와 처벌 가능성을 설명하고 {앱 동의 시각}에 동의를 받음'}
            </p>
          </div>
        </div>
      )}
      <div data-tk="1208" className="uld-proof is-changed">
        <div className="uld-proof-k">
          본인 확인 서류
          {law(['identity-check'])}
        </div>
        <div className="uld-photos">
          <button type="button" className="uld-proof-thumb" aria-label="본인 확인 서류 확대" onClick={() => { setViewerKind('id'); setViewerOpen(true); }}>
            <ResidDoc doc={idDoc} mini />
          </button>
          <span className="uld-proof-name">{idDoc.title} 1장</span>
          {isChild && (
            <>
              <button type="button" className="uld-proof-thumb" aria-label="보호자 신분증 확대" onClick={() => { setViewerKind('guardian'); setViewerOpen(true); }}>
                <ResidDoc doc={guardianDoc} mini />
              </button>
              <span className="uld-proof-name">보호자 주민등록증 1장</span>
            </>
          )}
        </div>
      </div>
      {s.target === 'first' && (
        <div data-tk="1212" className="uld-proof is-changed">
          <div className="uld-proof-k">
            거주지 서류
            {law(['first-region', 'resid-actual', 'resid-before-system'])}
            {s.resid !== 'none' && <span>{s.resid === 'actual' ? '실거주지' : '주민등록상 주소지'}</span>}
          </div>
          {s.resid === 'id' ? (
            <span className="uld-proof-none">본인 확인 서류(주민등록증)의 주소로 확인 · 환자가 지금 주소와 같다고 확인함</span>
          ) : s.resid !== 'none' ? (
            <div className="uld-photos">
              <button type="button" className="uld-proof-thumb" aria-label="거주지 서류 확대" onClick={() => { setViewerKind('doc'); setViewerOpen(true); }}>
                <ResidDoc doc={residDoc} mini />
              </button>
              <span className="uld-proof-name">{residDoc.title} 1장</span>
            </div>
          ) : (
            <span className="uld-proof-none">첨부된 거주지 서류가 없어요</span>
          )}
        </div>
      )}
      {s.target === 'exception' && (
        <div data-tk="1212" className="uld-proof is-changed">
          <div className="uld-proof-k">
            예외 대상 확인
            {law(['exception-check', 'resid-before-system'])}
            <span>{s.ex === 'query' ? '등록장애인' : '선원'}</span>
          </div>
          {s.ex === 'query' ? (
            <span className="uld-proof-none">첨부 서류 없음 · 수진자 조회로 확인하는 대상이에요</span>
          ) : (
            <div className="uld-photos">
              <button type="button" className="uld-proof-thumb" aria-label="예외 대상 서류 확대" onClick={() => { setViewerKind('doc'); setViewerOpen(true); }}>
                <ResidDoc doc={exDoc} mini />
              </button>
              <span className="uld-proof-name">{exDoc.title} 1장</span>
            </div>
          )}
        </div>
      )}

      <section className="uld-section">
        <div className="uld-section-head">
          <h3>환자정보</h3>
          <span data-tk={isChild ? '1212 1217' : '1212'} className="uld-chips is-changed">
            <span className={`uld-chip is-${s.target}`}>{TARGET_BADGE[s.target]}</span>
            {isChild && <span className="uld-chip is-family">가족 대리 신청</span>}
          </span>
          {/* 현행 '통신사 본인확인을 완료한 환자입니다.' 문구는 본인 확인이 서류와 화상 대조로 바뀌어(D18) 삭제 */}
          {isChild && (
            <p data-tk="1217" className="uld-identity is-changed">
              <IconVerified />
              미성년 환자 법정대리인 동의 완료 · {'{동의자}'} · {'{동의일시}'}
              {law(['guardian'])}
            </p>
          )}
        </div>
        <p data-tk="1223" className="uld-consent-fact is-changed">{isChild ? '법정대리인(보호자)이' : '환자가'} 앱에서 이 진료의 설명 4가지를 확인하고 동의함 · {'{동의일시}'}{law(['explain-4'])}</p>
        {s.target === 'revisit' && (
          <div data-tk="1212" className="uld-answer is-changed">
            <p className="uld-answer-h">재진 · 환자 응답 (확인 필요){law(['revisit-period', 'revisit-check'])}</p>
            <p>
              환자가 "이 병원에서 마지막 대면진료 후 6개월 이내, 같은 증상"을 골랐어요.
              <br />
              차트에서 대면 이력을 직접 확인해 주세요.
            </p>
          </div>
        )}
        <div className="uld-info">
          <dl className="uld-dl">
            {[
              ['환자명', '가상환자 A'],
              ['주민등록번호', isChild ? '1201014000000' : '9001012000000'],
              ['전화번호', '010-0000-0000'],
            ].map(([k, v]) => (
              <React.Fragment key={k}>
                <dt>{k}</dt>
                <dd>
                  <span>{v}</span>
                  <span className="uld-copy">
                    <IconCopy />
                  </span>
                </dd>
              </React.Fragment>
            ))}
          </dl>
          <div className="uld-symptom-col">
            <div className="uld-symptom-row">
              <label>환자 증상</label>
              <div className="uld-symptom">
                증상: 기침, 콧물
                <br />
                샘플 증상 설명입니다. 실제 진료 요청이 아닙니다.
                <span className="uld-copy uld-copy-abs">
                  <IconCopy />
                </span>
              </div>
            </div>
            <div className="uld-symptom-row">
              <label>환자 첨부사진</label>
              <div className="uld-photos">
                {SYMPTOM_PHOTOS.map((src, i) => {
                  const done = photoAllDone || photoDone.includes(i);
                  return (
                    <span key={i} className="uld-photo">
                      <button type="button" className="uld-photo-img" aria-label={`첨부사진 ${i + 1} 확대`} onClick={() => setPhotoView(i)}>
                        <img src={src} alt="" />
                      </button>
                      <button
                        type="button"
                        className="uld-photo-dl"
                        aria-label={`첨부사진 ${i + 1} 내려받기`}
                        onClick={() => flash(`p${i}`, on => setPhotoDone(d => (on ? (d.includes(i) ? d : [...d, i]) : d.filter(x => x !== i))))}
                      >
                        <img src={done ? IC_DOWNLOAD_DONE : IC_DOWNLOAD} alt="" />
                      </button>
                    </span>
                  );
                })}
                <button
                  type="button"
                  className={`uld-photo-btn${photoAllDone ? ' is-done' : ''}`}
                  onClick={() => flash('all', setPhotoAllDone)}
                >
                  {photoAllDone ? '받기완료' : '내려받기'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {status === 'request' ? (
        <div className="uld-cert">
          <h4>제증명 발급 요청</h4>
          <div>
            <span className="uld-cert-k">환자 요청</span>
            <b><IconCheckSm />진료비 세부내역서</b>
            <b><IconCheckSm />진료비 영수증</b>
            <b><IconCheckSm />진료확인서</b>
          </div>
        </div>
      ) : (
        <section className="uld-section">
          <div className="uld-section-head">
            <h3>진료 메모</h3>
          </div>
          <div className="uld-memo">메모를 입력해 주세요</div>
        </section>
      )}
      <div className="uld-cancel-wrap">
        <Btn v="secondary" onClick={openCancel}>
          진료취소
        </Btn>
      </div>
    </div>
  );


  /* ───────── 다이얼로그(packages/ui Dialog) ───────── */
  const DIALOG_TITLE: Record<Exclude<Dialog, null>, string> = {
    quota: '이번 달 500건에 도달했어요',
    reception: '예상 대기 시간 설정',
    start: '진료 시작하기',
    phone: '전화로 진료하기',
    cancel: '진료 취소하기',
    video: '화상진료 끄기',
  };
  const dialogEl = dialog && (
    <div className="uld-backdrop" onClick={() => setDialog(null)}>
      <div
        role="dialog"
        aria-label={DIALOG_TITLE[dialog]}
        data-tk={({ phone: '1221', cancel: '1225', video: '1219', quota: '1255' } as Record<string, string>)[dialog ?? '']} className={`uld-dialog ${dialog === 'reception' || dialog === 'quota' ? 'is-small' : ''} ${['quota', 'phone', 'cancel', 'video'].includes(dialog) ? 'is-changed' : ''}`}
        onClick={e => e.stopPropagation()}
      >
        <p className="uld-dialog-title">
          {DIALOG_TITLE[dialog]}
          {dialog === 'phone' && law(['phone-condition', 'record-phone'])}
          {dialog === 'cancel' && law(['record-stop'])}
        </p>
        {dialog === 'quota' && (
          <p className="uld-dialog-desc">
            굿닥에서 진료 완료한 비대면진료가 이번 달 500건이에요. 법령안은 의사별 비대면진료를 반기 월평균 500건 이하로 관리하도록 정하고 있어요.
            그래도 접수할까요? <span className="uld-quota-tag">가안</span>
          </p>
        )}
        {dialog === 'start' && <p className="uld-dialog-desc">진료실에서 진료를 시작합니다.</p>}
        {dialog === 'phone' && <p className="uld-dialog-desc">화상진료가 원칙이에요. 전화로 진료하는 이유를 골라 주세요.</p>}
        {dialog === 'video' && (
          <p className="uld-dialog-desc">화상진료를 끄면 초진 환자는 배정되지 않아요. 재진 환자만 전화로 진료할 수 있어요.</p>
        )}
        {['reception', 'cancel', 'phone'].includes(dialog) && (
          <div className="uld-dialog-body">
            {dialog === 'reception' && (
              <label className="uld-wait">
                환자에게 안내할 예상 대기시간을 선택해 주세요.
                <select value={wait} onChange={e => setWait(e.target.value)}>
                  {WAITING_TIMES.map(o => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {dialog === 'cancel' && (
              <div className="uld-radios">
                {CANCEL_REASONS.map(r => (
                  <label key={r} className="uld-radio">
                    <input type="radio" name="cancel" checked={cancelPick === r} onChange={() => setCancelPick(r)} />
                    {r}
                    {r.includes('500건') && law(['doctor-monthly-limit'])}
                    {r.startsWith('화상으로 본인 확인') && law(['identity-check'])}
                  </label>
                ))}
                {cancelPick === CANCEL_DIRECT && (
                  <div className="uld-textarea-wrap">
                    <textarea
                      rows={5}
                      value={cancelText}
                      placeholder="[필수] 취소사유를 입력해주세요. (최소 10글자)"
                      onChange={e => setCancelText(e.target.value)}
                    />
                    <p className="uld-hint">* 입력한 취소 사유가 환자에게 전달되오니 작성 시 유의해 주세요.</p>
                  </div>
                )}
              </div>
            )}
            {dialog === 'phone' && (
              <div className="uld-radios">
                {PHONE_REASONS.map((r, i) => {
                  const off = i === 0 && phoneFirstOff !== '';
                  return (
                    <label key={r} className={`uld-radio ${off ? 'is-off' : ''}`}>
                      <input type="radio" name="phone" disabled={off} checked={phonePick === i} onChange={() => setPhonePick(i)} />
                      <span>
                        {r}
                        {off && (
                          <em>
                            {phoneFirstOff === 'first'
                              ? '초진 환자는 선택할 수 없어요'
                              : phoneFirstOff === 'visual'
                                ? '피부, 안, 이비인후, 외상, 정신 질환은 선택할 수 없어요'
                                : '13세 미만 환자는 선택할 수 없어요'}
                            {phoneFirstOff !== 'first' && law(['visual-diseases'])}
                          </em>
                        )}
                      </span>
                    </label>
                  );
                })}
                {phonePick === PHONE_DIRECT && (
                  <div className="uld-textarea-wrap">
                    <textarea rows={3} value={phoneText} placeholder="[필수] 화상 연결이 불가능한 사유를 입력해 주세요" onChange={e => setPhoneText(e.target.value)} />
                  </div>
                )}
                {phonePick !== null && (
                  <div data-tk="1221" className="uld-record is-changed">
                    <span className="uld-record-k">
                      진료기록부에 옮길 문장 <span className="uld-quota-tag">가안</span>
                      {law(['record-phone'])}
                    </span>
                    <p>
                      {PHONE_RECORD[phonePick]}
                      {phonePick === PHONE_DIRECT && (phoneText.trim() || '{입력한 사유}')}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        <div className="uld-dialog-btns">
          <Btn v="secondary" onClick={() => setDialog(null)}>
            취소
          </Btn>
          <Btn
            disabled={dialog === 'phone' && (phonePick === null || (phonePick === PHONE_DIRECT && !phoneText.trim()))}
            onClick={confirm}
          >
            {dialog === 'phone' ? '전화 진료' : dialog === 'quota' ? '접수하기' : '확인'}
          </Btn>
        </div>
      </div>
    </div>
  );

  /* ───────── 프로필 메뉴(profile-menu.tsx) ───────── */
  const profileMenu = menuOpen && (
    <div className="uld-menu" onClick={e => e.stopPropagation()}>
      <div className="uld-menu-top">
        <div className="uld-menu-me">
          <Avatar on={status === 'ontreatment'} />
          샘플 김의사
          <span className={`uld-menu-chip ${status === 'ontreatment' ? 'is-on' : ''}`}>
            {status === 'ontreatment' ? '진료중' : '진료종료'}
          </span>
        </div>
        <div className="uld-menu-toggle">
          푸시 알림 <Switch on={false} />
        </div>
        <div className="uld-menu-toggle">
          소리 알림 <Switch on={false} />
        </div>
        <button type="button" className="uld-menu-select">
          의사 프로필 선택
        </button>
      </div>
      <div className="uld-menu-links">
        <div className="uld-menu-toggle uld-menu-link">
          화상진료
          <Switch
            on={videoOn}
            onClick={() => {
              if (!videoOn) return setVideoOn(true);
              setMenuOpen(false);
              setDialog('video');
            }}
          />
        </div>
        {['굿닥 파트너스', '이용가이드', '원격지원 프로그램'].map(t => (
          <span key={t} className="uld-menu-link">
            {t}
            <span aria-hidden="true">↗</span>
          </span>
        ))}
      </div>
      <span className="uld-menu-logout">로그아웃</span>
    </div>
  );


  /* ───────── D30 화상진료실 — 피그마 TELECARE DEV 220:72455 재현(현행), 본인 확인 영역만 신규 ───────── */
  const roomSec = roomAt ? Math.max(0, Math.floor((now - roomAt) / 1000)) : 0;
  const roomTime = `${String(Math.floor(roomSec / 60)).padStart(2, '0')}:${String(roomSec % 60).padStart(2, '0')}`;
  const roomField = (k: string, v: string) => (
    <div className="uld-vr-form" key={k}>
      <span className="uld-vr-label">{k}</span>
      <div className="uld-vr-input">
        <span>{v}</span>
        <span className="uld-vr-copy">
          <IconCopy />
        </span>
      </div>
    </div>
  );
  const videoRoom = roomOpen && (
    <div className="uld-vr-backdrop">
      <div className="uld-vr" role="dialog" aria-modal="true" aria-label="화상진료실">
        <div className="uld-vr-top">
          <button type="button" className="uld-vr-pill">
            <IconVr k="report" />
            신고하기
          </button>
          <button type="button" className="uld-vr-pill">
            <IconVr k="eye" />
            환자 화면 끄기
          </button>
        </div>
        <div className="uld-vr-contents">
          <div className="uld-vr-video">
            <div className="uld-vr-patient" aria-label="환자 영상(자리표시)">
              <Silhouette />
            </div>
            <div className="uld-vr-pip" aria-label="내 화면(자리표시)">
              <Silhouette small />
            </div>
          </div>
          <div className="uld-vr-info">
            {/* D30 — 영상과 첨부 서류를 같은 화면에서 보며 대조 */}
            <div data-tk={isChild ? '1208 1217' : '1208'} className="uld-vr-idcheck is-changed">
              <div className="uld-vr-idthumbs">
                <span className="uld-vr-idthumb">
                  <button type="button" className="uld-proof-thumb" aria-label="본인 확인 서류 확대" onClick={() => { setViewerKind('id'); setViewerOpen(true); }}>
                    <ResidDoc doc={idDoc} mini />
                  </button>
                  <span>{idDoc.title}</span>
                </span>
                {isChild && (
                  <span className="uld-vr-idthumb">
                    <button type="button" className="uld-proof-thumb" aria-label="보호자 신분증 확대" onClick={() => { setViewerKind('guardian'); setViewerOpen(true); }}>
                      <ResidDoc doc={guardianDoc} mini />
                    </button>
                    <span>보호자 주민등록증</span>
                  </span>
                )}
              </div>
              <div className="uld-vr-idside">
                <span className="uld-vr-label">본인 확인</span>
                <Check on={faceCheck} onClick={() => setFaceCheck(v => !v)}>
                  {isChild ? '화상에서 보호자 얼굴과 신분증을 대조했고, 자녀가 함께 나온 것을 확인했어요' : '화상에서 얼굴과 신분증을 대조했어요'}
                  {law(['identity-check'])}
                </Check>
                <p className="uld-vr-idsub">접수 전 사본 확인에 이어, 화상으로 본인 여부를 한 번 더 확인해 주세요.</p>
              </div>
            </div>
            <div className="uld-vr-data">
              <div className="uld-vr-basic">
                {roomField('환자명', '가상환자 A')}
                {roomField('주민등록번호', isChild ? '120101-4000000' : '900101-2000000')}
                {roomField('전화번호', '010-0000-0000')}
              </div>
              <div className="uld-vr-symptom-col">
                {/* D34 — 현행 화상진료 차트는 자유 입력(symptomDescription)만 보여 주고 없으면 블록을 숨긴다.
                    접수 상세와 같이 '증상: 칩' 줄 다음에 상세 증상을 보여 주고, 칩만 있어도 블록을 보여 준다 */}
                <div data-tk="1228" className="uld-vr-form uld-vr-symptom is-changed">
                  <span className="uld-vr-label">환자 증상</span>
                  <div className="uld-vr-input">
                    <span>
                      증상: 기침, 콧물
                      <br />
                      샘플 증상 설명입니다. 실제 진료 요청이 아닙니다.
                    </span>
                    <span className="uld-vr-copy">
                      <IconCopy />
                    </span>
                  </div>
                </div>
                <div className="uld-vr-photos">
                  <span className="uld-vr-label">환자 첨부사진</span>
                  <div className="uld-vr-thumbs">
                    {SYMPTOM_PHOTOS.map((src, i) => (
                      <button key={i} type="button" className="uld-vr-thumb" aria-label={`첨부사진 ${i + 1} 확대`} onClick={() => setPhotoView(i)}>
                        <img src={src} alt="" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="uld-vr-form uld-vr-memo">
              <span className="uld-vr-label">진료 메모</span>
              <textarea className="uld-vr-input" placeholder="메모를 입력해 주세요" />
            </div>
          </div>
        </div>
        <div className="uld-vr-bottom">
          <button type="button" className="uld-vr-round is-dim" aria-label="설정">
            <IconVr k="setting" />
          </button>
          <span className="uld-vr-time">{roomTime}</span>
          <div className="uld-vr-right">
            <button type="button" className="uld-vr-round" aria-label="마이크">
              <IconVr k="mic" />
            </button>
            <button type="button" className="uld-vr-round" aria-label="카메라">
              <IconVr k="cam" />
            </button>
            <button type="button" className="uld-vr-exit" onClick={() => setRoomOpen(false)}>
              <IconVr k="end" />
              나가기
            </button>
          </div>
        </div>
        {roomToast && (
          <div className="uld-vr-toast" role="status">
            <IconVr k="info" />
            가상환자 A 환자가 진료실에 입장했어요.
          </div>
        )}
      </div>
    </div>
  );

  /* ───────── 패널 ───────── */
  const notes: Record<Jump, string[]> = useMemo(
    () => ({
      r1: [
        '접수대기 상세. 바뀐 곳은 보라 점선, 나머지는 현행 코드 재현.',
        '현행 빨간 시범사업 안내 대신 진료 대상 배지·가족 대리 신청 배지.',
        '접수 전 확인을 모두 체크해야 접수완료가 켜진다(자녀면 법정대리인 동의 확인까지 3개). 재진은 두 번째가 대면 이력 확인.',
        '화상 진료 시작 뒤 화상진료실 안 환자정보 패널 맨 위에서 "화상에서 얼굴과 신분증을 대조했어요" 체크(자녀면 보호자 대조와 자녀 동석 확인).',
        '재진이면 환자 응답 상자, 자녀면 본인확인 문구 자리에 법정대리인 동의 기록',
        '초진이면 접수 전 확인 아래에 거주지 서류(앱에서 가림 처리해 올린 서류, 주민등록상/실거주지). 썸네일을 누르면 크게 본다(내려받기 없음). 서류 없음 상태도 있음.',
        '환자정보에 앱 안내문 확인·동의 사실(제안). 반려·파기 시점은 보류. 본인 확인은 첨부 서류로 접수 전에(D18).',
        '접수완료를 누르면 현행 예상 대기 시간 설정 → 진료대기.',
      ],
      r2a: [
        '진료대기 상세(현행 파란 작업 띠).',
        '진료 전 설명 확인: 설명 대상, 동의자, 앱 동의 시각과 4가지 "설명함" 체크. 4개 모두 체크해야 시작 버튼이 열린다(자녀면 법정대리인 동의 확인도 필요). 진료기록부 문장(가안)을 함께 보여 준다(D33).',
        '이 바로가기는 설명 체크를 마친 상태로 연다. 체크 전 상태는 진료실-1에서 접수완료 후 확인.',
        '시작 버튼은 "전화 진료 시작"과 "화상 진료 시작"(전화 신청은 "전화 진료 시작"만). 진료대기에는 진료완료가 없다.',
        '"전화 진료 시작"은 사유 모달을 열고, 사유를 고르면 진료중이 된다.',
        '초진이면 첫 번째 사유를 고를 수 없다. 직접 입력은 글자가 있어야 확인.',
      ],
      r2v: [
        '화상진료실(현행 재현). 환자정보 패널 맨 위 "본인 확인" 영역에서 첨부 서류 썸네일을 보며 얼굴과 신분증을 대조했다고 체크한다(D18, D30). 썸네일을 누르면 크게 본다.',
        '차트 "환자 증상"은 접수 상세와 같이 "증상: 칩" 다음 줄에 상세 증상. 현행은 자유 입력만 보여 주고 없으면 숨김. 칩만 있어도 보여 준다(D34).',
        '자녀면 아이 서류와 보호자 신분증 썸네일, 보호자 대조와 자녀 동석 확인 문구. 전화 진료는 화상진료실이 열리지 않는다.',
        '"나가기"를 누르면 진료 상세(진료중)로 돌아오고, 작업 띠 "다시 화상 연결"로 다시 연다. 체크는 진료가 바뀌기 전까지 유지.',
      ],
      r2b: [
        '프로필 메뉴 화상진료 스위치를 끌 때 확인창. 본문만 바꿨고 버튼은 현행 취소/확인.',
        'OFF는 "초진 환자 배정 제외" 의미. 의사목록 순서 문구는 보류.',
        '켤 때 확인창(현행 "화상진료 켜기")은 이 화면 범위 밖이라 바로 켜짐.',
      ],
      r3: [
        '진료 취소하기 다이얼로그. 현행 7개 → 6개 + 직접 입력.',
        '삭제: 이번 달 환자의 비대면진료 가능 횟수(2회). 교체: 병원 월 건수 → 의사별 월평균 500건. 추가: 화상으로 본인 확인이 되지 않았습니다(환자가 카메라를 꺼서 대조가 안 될 때).',
        '직접 입력 안내 문구·빈칸 검증은 현행 그대로. 확인하면 행이 현행대로 진료완료 탭으로 빠지고, 고른 사유는 아래에 표시.',
        '고른 사유는 앱 진료내역 ④에 그대로 보인다(D10, 페어 화면에서 연결).',
      ],
    }),
    [],
  );


  /* 티켓 영향 범위 보기 — 패널에서 티켓을 고르면 무대 화면의 data-tk 영역에 점선과 번호 라벨 */
  const [tkSel, setTkSel] = useState<number | null>(null);
  const [ptab, setPtab] = useState<'ctl' | 'note' | 'tk'>('ctl');
  const [tkHits, setTkHits] = useState(0);
  /* 지금 케이스에 영역이 없으면 그 티켓이 보이는 케이스로 한 번 바꾼다 */
  const tkCaseTried = useRef<number | null>(null);
  const [tkCase, setTkCase] = useState('');
  const applyTkCase = (t: number): string => {
    switch (t) {
      case 1217:
        set({ who: 'child' });
        return '자녀 신청';
      case 1212:
        set({ target: 'revisit' });
        return '재진';
      default:
        return '';
    }
  };
  useEffect(() => {
    document.querySelectorAll<HTMLElement>('[data-tkon]').forEach(el => {
      el.removeAttribute('data-tkon');
      if (el.dataset.tkpos) {
        el.style.position = '';
        delete el.dataset.tkpos;
      }
    });
    if (tkSel == null) {
      if (tkHits !== 0) setTkHits(0);
      return;
    }
    const els = Array.from(document.querySelectorAll<HTMLElement>('[data-tk]')).filter(el => (el.dataset.tk ?? '').split(' ').includes(String(tkSel)));
    els.forEach(el => {
      el.setAttribute('data-tkon', `CONNECT26-${tkSel}`);
      if (getComputedStyle(el).position === 'static') {
        el.style.position = 'relative';
        el.dataset.tkpos = '1';
      }
    });
    if (tkHits !== els.length) setTkHits(els.length);
    if (els.length === 0 && tkCaseTried.current !== tkSel) {
      tkCaseTried.current = tkSel;
      const label = applyTkCase(tkSel);
      if (label) setTkCase(label);
    }
  });
  const pickTk = (t: number, fromList?: boolean) => {
    if (tkSel === t && !fromList) {
      setTkSel(null);
      return;
    }
    setTkSel(t);
    tkCaseTried.current = null;
    setTkCase('');
    if (fromList) {
      const here = (NOTE_TICKETS[s.jump] ?? []).some(l => l.includes(t)) || EXTRA_TICKETS.some(e => e.t === t);
      const first = JUMPS.find(x => (NOTE_TICKETS[x.key] ?? []).some(l => l.includes(t)));
      if (!here && first) set({ jump: first.key });
    }
  };
  const Seg = <K extends string>({
    label,
    value,
    options,
    onChange,
    show,
    goTo,
  }: {
    label: string;
    value: K;
    options: { k: K; t: string; disabled?: boolean }[];
    onChange: (k: K) => void;
    /* 이 상태가 화면에 드러나는 화면들. 지금 화면이 아니면 goTo로 옮긴다 */
    show?: Jump[];
    goTo?: Jump;
  }) => (
    <div className="uld-ctl-row">
      <span className="uld-ctl-label">{label}</span>
      <div className="uld-seg">
        {options.map(o => (
          <button key={o.k} className={value === o.k ? 'is-on' : ''} disabled={o.disabled} onClick={() => {
              onChange(o.k);
              if (show && goTo && !show.includes(s.jump)) set({ jump: goTo });
            }}>
            {o.t}
          </button>
        ))}
      </div>
    </div>
  );

  /* D19 — 굿닥 기준 월 500건 상한 안내 띠(모든 탭 공통, GNB 바로 아래). 건수 표시·근접 기준·문구는 [제안] */
  const QUOTA_COUNT = { normal: 312, near: 412, full: 500 } as const;
  const qCount = QUOTA_COUNT[quota];
  const quotaBand = (
    <div className={`uld-quota is-${quota}`}>
      <div data-tk="1255" className="uld-quota-inner is-changed">
        <span className="uld-quota-tag">가안</span>
        <strong className="uld-quota-num">
          이번 달 비대면 진료 {qCount} / 500건
        </strong>
        {quota !== 'normal' && (
          <span className="uld-quota-msg">
            {quota === 'full' ? '이번 달 500건에 도달했어요.' : `500건까지 ${500 - qCount}건 남았어요.`}
          </span>
        )}
        <span className="uld-quota-sub">굿닥에서 진료 완료한 건 기준 · 매월 1일 초기화</span>
        <button type="button" className="uld-quota-more" aria-expanded={quotaMore} onClick={() => setQuotaMore(o => !o)}>
          {quotaMore ? '접기' : '자세히 보기'}
          <span aria-hidden="true" className={`uld-quota-caret${quotaMore ? ' is-open' : ''}`}>⌄</span>
        </button>
      </div>
      {quotaMore && (
        <div data-tk="1255" className="uld-quota-detail is-changed">
          <dl>
            <div>
              <dt>왜 500건인가요?</dt>
              <dd>
                의료법 시행규칙 개정령안(입법예고안)은 의료기관이 의사별 비대면진료 건수를 반기(6개월) 월평균 500건 이하로 관리하도록 정하고
                있어요. 이 기준을 넘지 않도록 굿닥에서 진료한 건수를 매월 알려 드려요.
              </dd>
            </div>
            <div>
              <dt>굿닥 기준이란?</dt>
              <dd>
                굿닥에서 진료 완료까지 한 비대면진료만 의사별로 센 숫자예요. 접수 후 취소한 진료, 다른 플랫폼이나 병원 자체 비대면진료는
                포함되지 않으니 함께 운영하신다면 전체 건수를 따로 확인해 주세요.
              </dd>
            </div>
            <div>
              <dt>어떻게 세나요?</dt>
              <dd>
                진료를 완료한 시점에 1건씩 더하고, 매월 1일에 0건부터 다시 세요. 법령안은 반기 월평균으로 보기 때문에 이 숫자는 관리를 돕는
                참고 값이에요.
              </dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  );

  const aInWaiting = status === 'request';
  const rowA = (
    <div className={`uld-row-card ${open ? 'is-open' : ''}`}>
      {rowLine(rowAData, open, () => setOpen(o => !o))}
      {open && detail}
    </div>
  );
  const tableHead = (
    <div className="uld-thead">
      {COLS.map(c => (
        <span key={c.label} style={{ flex: c.w, textAlign: c.right ? 'right' : undefined }}>
          {c.label}
        </span>
      ))}
      <span style={{ flex: 0.5 }} />
    </div>
  );

  return (
    <div className={`uld-root${marksOn ? '' : ' is-marks-off'}`}>
      <aside className="uld-panel">
        <div className="uld-panel-card">
          <p className="uld-panel-title">온라인진료실 · 제도화 대응</p>
          <p className="uld-panel-sub">
            굿닥 온라인진료실(의사용) · 검토용 초안 v0.22 · 현행 화면은 운영 코드 기준 재현, 동적 값은 {'{중괄호}'}
          </p>
        </div>
        <div className="ptab" role="tablist">
          {([
            ['ctl', '화면·상태'],
            ['note', '이 화면 메모'],
            ['tk', '티켓'],
          ] as const).map(([k, t]) => (
            <button key={k} type="button" role="tab" aria-selected={ptab === k} className={ptab === k ? 'is-on' : ''} onClick={() => setPtab(k)}>
              {t}
              {k === 'tk' && tkSel != null ? ` · ${tkSel}` : ''}
            </button>
          ))}
        </div>
        {ptab === 'ctl' && (
        <>
        <div className="uld-panel-card uld-lawcard">
          <div>
            <p className="uld-panel-h" style={{ margin: 0 }}>
              바뀐 곳 점선 표시
            </p>
            <p className="uld-panel-sub">끄면 화면의 보라 점선을 숨겨요.</p>
          </div>
          <button type="button" role="switch" aria-checked={marksOn} className={`uld-lawswitch ${marksOn ? 'is-on' : ''}`} onClick={() => setMarksOn(v => !v)}>
            <span />
          </button>
        </div>
        <div className="uld-panel-card uld-lawcard">
          <div>
            <p className="uld-panel-h" style={{ margin: 0 }}>
              근거 법령 보기
            </p>
            <p className="uld-panel-sub">켜면 정보 옆 '법령'을 눌러 근거 조문을 볼 수 있어요(입법예고안 기준).</p>
          </div>
          <button type="button" role="switch" aria-checked={lawOn} className={`uld-lawswitch ${lawOn ? 'is-on' : ''}`} onClick={() => setLawOn(v => !v)}>
            <span />
          </button>
        </div>
        <div className="uld-panel-card">
          <p className="uld-panel-h">화면 바로 가기</p>
          <div className="uld-jumps">
            {JUMPS.map(j => (
              <button
                key={j.key}
                className={`uld-jump ${s.jump === j.key ? 'is-on' : ''}`}
                onClick={() => (s.jump === j.key ? reset(j.key) : set({ jump: j.key }))}
              >
                <span>{j.label}</span>
                <span className={`uld-badge is-${j.kind}`}>{KIND_LABEL[j.kind]}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="uld-panel-card uld-ctl">
          <p className="uld-panel-h" style={{ margin: 0 }}>
            상태 (가상환자 A)
          </p>
          <Seg
            label="이번 달 진료 건수(500건 안내)"
            value={quota}
            options={[
              { k: 'normal', t: '여유 312' },
              { k: 'near', t: '근접 412' },
              { k: 'full', t: '도달 500' },
            ]}
            onChange={k => setQuota(k)}
          />
          <Seg
            label="진료 대상(환자 선택)" show={['r1', 'r2a', 'r2v']} goTo="r1"
            value={s.target}
            options={[
              { k: 'first', t: '초진' },
              { k: 'revisit', t: '재진' },
              { k: 'exception', t: '예외' },
            ]}
            onChange={k => set({ target: k })}
          />
          <Seg
            label="진료 받는 사람" show={['r1', 'r2a', 'r2v']} goTo="r1"
            value={s.who}
            options={[
              { k: 'self', t: '본인' },
              { k: 'child', t: '자녀(미성년)' },
            ]}
            onChange={k => set({ who: k })}
          />
          <Seg
            label="거주지 서류(초진)" show={['r1']} goTo="r1"
            value={s.target === 'first' ? s.resid : ('' as Resid)}
            options={[
              { k: 'resident', t: '주민등록상', disabled: s.target !== 'first' },
              { k: 'actual', t: '실거주지', disabled: s.target !== 'first' },
              { k: 'id', t: '신분증 겸용', disabled: s.target !== 'first' || isChild },
              { k: 'none', t: '서류 없음', disabled: s.target !== 'first' },
            ]}
            onChange={k => set({ resid: k })}
          />
          <Seg
            label="예외 대상 종류(예외)" show={['r1']} goTo="r1"
            value={s.target === 'exception' ? s.ex : ('' as ExKind)}
            options={[
              { k: 'query', t: '조회형(등록장애인)', disabled: s.target !== 'exception' },
              { k: 'doc', t: '서류형(선원)', disabled: s.target !== 'exception' },
            ]}
            onChange={k => set({ ex: k })}
          />
          <Seg
            label="신청 진료 방식" show={['r2a']} goTo="r2a"
            value={s.method}
            options={[
              { k: 'video', t: '화상' },
              { k: 'phone', t: '전화(재진만)', disabled: s.target !== 'revisit' || disease === 'visual' || under13 },
            ]}
            onChange={k => set({ method: k })}
          />
          <Seg
            label="질환(전화 진료 제한)" show={['r2a']} goTo="r2a"
            value={disease}
            options={[
              { k: 'general', t: '일반' },
              { k: 'visual', t: '피부, 안, 이비인후, 외상, 정신' },
            ]}
            onChange={k => {
              setDisease(k);
              if (k === 'visual') set({ method: 'video' });
            }}
          />
          <Seg
            label="환자 나이" show={['r2a']} goTo="r2a"
            value={under13 ? 'u' : 'o'}
            options={[
              { k: 'o', t: '13세 이상' },
              { k: 'u', t: '13세 미만' },
            ]}
            onChange={k => {
              setUnder13(k === 'u');
              if (k === 'u') set({ method: 'video' });
            }}
          />
        </div>
        </>
        )}
        {ptab === 'note' && (
        <div className="uld-panel-card">
          <p className="uld-panel-h">이 화면 <span className="tk-legend">번호는 CONNECT26 티켓, 누르면 화면에 영향 범위 표시</span></p>
          {tkSel != null && (
            <p className="tk-state">
              {tkHits > 0
                ? `CONNECT26-${tkSel} · 이 화면 ${tkHits}곳${tkCase ? ` · 케이스를 '${tkCase}'(으)로 바꿔 보여 줘요` : ''}`
                : `CONNECT26-${tkSel} · 이 화면에는 해당 영역이 없어요`}
              <button type="button" className="tk-clear" onClick={() => setTkSel(null)}>
                선택 해제
              </button>
            </p>
          )}
          <ul className="uld-note">
            {notes[s.jump].map((n, i) => (
              <li key={n}>
                {(NOTE_TICKETS[s.jump][i] ?? []).map(t => (
                  <button type="button" key={t} className={`tk-chip${tkSel === t ? ' is-on' : ''}`} title={`CONNECT26-${t} ${TICKET_TITLE[t]} · 누르면 영향 범위 표시`} onClick={() => pickTk(t)}>
                    {t}
                  </button>
                ))}
                {stripD(n)}
              </li>
            ))}
          </ul>
          {phoneDone && <p className="uld-panel-result">전화 진료 사유: {phoneDone}</p>}
          {cancelDone && (
            <p className="uld-panel-result">
              가상환자 A 진료취소 → 현행대로 진료완료 탭으로 이동(이 프로토는 접수대기 탭만 그림).
              <br />
              취소 사유: {cancelDone}
            </p>
          )}
        </div>
        )}
        {ptab === 'tk' && (
        <div className="uld-panel-card">
          <p className="uld-panel-h">티켓별 보기 <span className="tk-legend">CONNECT26-</span></p>
          <p className="tk-state">
            {tkSel == null
              ? '티켓 번호를 누르면 이 화면에서 영향 범위를 점선으로 보여 줘요.'
              : tkHits > 0
                ? `CONNECT26-${tkSel} · 이 화면 ${tkHits}곳${tkCase ? ` · 케이스를 '${tkCase}'(으)로 바꿔 보여 줘요` : ''}`
                : `CONNECT26-${tkSel} · 지금 상태에서는 보이는 영역이 없어요(상태를 바꿔 보세요)`}
            {tkSel != null && (
              <button type="button" className="tk-clear" onClick={() => setTkSel(null)}>
                선택 해제
              </button>
            )}
          </p>
          <ul className="tk-list">
            {Object.keys(TICKET_TITLE)
              .map(Number)
              .map(t => {
                const steps = JUMPS.filter(x => (NOTE_TICKETS[x.key] ?? []).some(l => l.includes(t)));
                const ex = EXTRA_TICKETS.filter(e => e.t === t);
                const pt = TICKET_PARENT[t];
                const firstOfParent = Object.keys(TICKET_TITLE).map(Number).find(x => TICKET_PARENT[x] === pt) === t;
                return (
                  <li key={t}>
                    {firstOfParent && (
                      <p className="tk-parent">
                        {pt} {PARENT_TITLE[pt]}
                      </p>
                    )}
                    <p className="tk-title" title={TICKET_TITLE[t]}>
                      <button type="button" className={`tk-chip${tkSel === t ? ' is-on' : ''}`} title="누르면 영향 범위 표시" onClick={() => pickTk(t, true)}>
                        {t}
                      </button>
                      {TICKET_TITLE[t]}
                    </p>
                    <div className="tk-go">
                      {steps.map(x => (
                        <button key={x.key} type="button" className={s.jump === x.key ? 'is-on' : ''} onClick={() => set({ jump: x.key })}>
                          {x.label}
                        </button>
                      ))}
                      {ex.map(e => (
                        <span key={e.where} className="tk-where">{e.where}</span>
                      ))}
                    </div>
                  </li>
                );
              })}
          </ul>
        </div>
        )}
      </aside>

      <div className="uld-stage">
        <span className="uld-stage-cap">{JUMPS.find(j => j.key === s.jump)!.label}{marksOn ? ' · 보라 점선 = 바뀐 곳' : ''}</span>
        <section className="uld-frame" onClick={() => setMenuOpen(false)}>
          <header className="uld-gnb">
            <div className="uld-gnb-inner">
              <img className="uld-logo" src={IMG_LOGO} alt="굿닥 온라인 진료실" />
              <nav className="uld-tabs">
                <span className="is-on">진료대기</span>
                <span>진료완료</span>
                <span>운영관리</span>
                <span>공지사항</span>
              </nav>
              <div className="uld-me-wrap">
                <button
                  type="button"
                  className="uld-me"
                  onClick={e => {
                    e.stopPropagation();
                    setMenuOpen(o => !o);
                  }}
                >
                  <Avatar on={status === 'ontreatment'} />
                  샘플 김의사
                  <span aria-hidden="true" className="uld-me-caret">
                    ⌄
                  </span>
                </button>
                {profileMenu}
              </div>
            </div>
          </header>
          {quotaBand}
          <main className="uld-main">
            <header className="uld-page-head">
              <h1>접수대기</h1>
              <div className="uld-page-toggles">
                <span>
                  바로진료 <Switch on />
                </span>
                <span>
                  진료예약 <Switch on />
                </span>
              </div>
            </header>
            {tableHead}
            <div className="uld-rows">
              {aInWaiting && rowA}
              {OTHER_WAITING.map(r => (
                <div key={r.name} className="uld-row-card">
                  {rowLine(r, false)}
                </div>
              ))}
            </div>
            <h2 className="uld-h2">접수완료</h2>
            {tableHead}
            <div className="uld-rows">
              {(status === 'waiting' || status === 'ontreatment') && rowA}
              {OTHER_DONE.map(r => (
                <div key={r.name} className="uld-row-card">
                  {rowLine(r, false)}
                </div>
              ))}
            </div>
          </main>
        </section>
      </div>
      {videoRoom}
      {dialogEl}
      {toast && <div className="uld-toast" role="status">{toast}</div>}
      {lawView && (
        <div className="uld-lawmodal" onClick={() => setLawView(null)}>
          <div className="uld-lawmodal-box" role="dialog" aria-label="근거 법령" onClick={e => e.stopPropagation()}>
            <div className="uld-lawmodal-head">
              <p>근거 법령</p>
              <button type="button" aria-label="닫기" onClick={() => setLawView(null)}>
                ×
              </button>
            </div>
            <div className="uld-lawmodal-body">
              {lawView.note && <p className="uld-lawnote">{lawView.note}</p>}
              {lawView.ids.map(id => {
                const l = LAW[id];
                return (
                  <div key={id} className="uld-lawitem">
                    <p className="uld-lawitem-doc">{l.doc}</p>
                    <p className="uld-lawitem-art">
                      {l.article} · {l.page}
                    </p>
                    <img src={l.img} alt={`${l.doc} ${l.article}`} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
      {viewerOpen && (viewerKind === 'id' || viewerKind === 'guardian' || (s.target === 'first' && (s.resid === 'resident' || s.resid === 'actual')) || (s.target === 'exception' && s.ex === 'doc')) && (
        <div className="uld-viewer" role="dialog" aria-modal="true" aria-label={viewerKind === 'id' ? '본인 확인 서류' : viewerKind === 'guardian' ? '보호자 신분증' : s.target === 'exception' ? '예외 대상 서류' : '거주지 서류'} onClick={() => setViewerOpen(false)}>
          <div className="uld-viewer-main" onClick={e => e.stopPropagation()}>
            <ResidDoc doc={viewDoc} />
          </div>
          <div className="uld-viewer-thumbs" onClick={e => e.stopPropagation()}>
            <span className="uld-viewer-thumb is-on">
              <ResidDoc doc={viewDoc} mini />
            </span>
          </div>
          <button type="button" className="uld-viewer-close" aria-label="닫기" autoFocus onClick={() => setViewerOpen(false)}>
            ×
          </button>
        </div>
      )}
      {photoView !== null && (
        <div className="uld-viewer" role="dialog" aria-modal="true" aria-label="환자 첨부사진" onClick={() => setPhotoView(null)}>
          <div className="uld-viewer-main uld-photo-main" onClick={e => e.stopPropagation()}>
            <img src={SYMPTOM_PHOTOS[photoView]} alt={`첨부사진 ${photoView + 1}`} />
            <button type="button" className="uld-viewer-dl" aria-label="첨부사진 내려받기" onClick={() => flash('viewer', setViewerDlDone)}>
              <img src={viewerDlDone ? IC_DOWNLOAD_DONE_BIG : IC_DOWNLOAD_BIG} alt="" />
            </button>
          </div>
          <div className="uld-viewer-thumbs" onClick={e => e.stopPropagation()}>
            {SYMPTOM_PHOTOS.map((src, i) => (
              <button key={i} type="button" className={`uld-viewer-thumb uld-photo-thumb${i === photoView ? ' is-on' : ''}`} aria-label={`첨부사진 ${i + 1}`} onClick={() => { setPhotoView(i); setViewerDlDone(false); }}>
                <img src={src} alt="" />
              </button>
            ))}
          </div>
          <button type="button" className="uld-viewer-close" aria-label="닫기" autoFocus onClick={() => setPhotoView(null)}>
            ×
          </button>
        </div>
      )}
    </div>
  );
}
