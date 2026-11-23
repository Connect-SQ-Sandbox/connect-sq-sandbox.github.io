/**
 * ─────────────────────────────────────────────────────────────
 * 이름      : untact-law-app — 굿닥 앱(환자용) 비대면진료 신청 흐름 · 비대면진료 제도화(의료법 개정) 대응
 * 상태      : 검토용 초안 · v0.8 · 최종수정 2026-11-23 · 샌드박스 배포
 * PRD       : 없음(제도화 대응 기획 초안). 사내 문서 링크는 공개 저장소라 미기재.
 * 배포URL   : https://connect-sq-sandbox.github.io/out/untact-law-app.html
 * 피그마    : 없음. 현행 화면은 goodoc-mobile origin/staging(b45968ada, 2026-11-19) 코드 기준 재현.
 * 관련 CSS  : styles/untactLawApp.css (css-manifest 'untact-law-app')
 * 에셋      : assets/untact-law-app/img_doctor_avatar.png (레포 원본). 아이콘은 레포 svg path 를 인라인.
 * 기술제약  : 샌드박스 빌드 = react 훅 + plain CSS, 외부 요청 0. Pretendard 는 로컬 설치 글꼴에 의존(CDN @import 는 빌드에서 제거됨).
 * 화면구성  : 좌측 상태 패널(화면 점프 · 상태 토글 · 화면별 메모) + 375×812 폰
 *             의사 상세(현행·진입점) → ① 진료 대상 확인(신규) → ② 신청서(수정) → ③ 비대면진료 안내·동의(신규)
 *             → 결제(현행·간단) → 신청 완료(현행) → ④ 진료내역 상세 · 병원 취소(수정)
 *
 * 핵심 결정(why)
 *  - [확정·요청] 담당 범위는 신청서 진입부터. 환자 선택(가족 선택) 화면은 생략하고 패널 토글 '진료 받는 사람'으로 대신한다.
 *  - [확정·요청] 초진 안내(화상만 · 같은 시·도 의원만 · 처방 7일 · 이소트레티노인·트라마돌 불가)는 ① 한 곳에만 둔다. ②에서 반복하지 않는다.
 *  - [확정·요청] 재진·예외 대상을 고르면 초진 안내는 나오지 않는다. 재신청이면 초진 안내를 한 줄 요약으로 접는다.
 *  - [확정·요청] 거주지 서류는 환자가 첨부해 병원에 전달한다(D8). 플랫폼은 주소를 입력받거나 비교·차단하지 않는다.
 *  - [확정·요청] 표현은 '실거주 증명' 대신 '거주지'. 기본은 주민등록상 주소지(주민등록표 등본·초본), 실제 사는 곳이 다르면 실거주지(임대차계약서·재직/재학증명서·공공요금 납부자료 등, 시행규칙안 31조의15②)(D12).
 *  - [확정·요청] 재진 = 이 병원에서 마지막 대면진료 후 6개월 이내 + 같은 증상(시행규칙안 31조의2①·31조의5⑤1).
 *  - [확정·요청] 거주지 섹션에 부정 이용 방지 안내: '다른 사람의 명의나 서류를 이용하는 것은 법으로 금지돼 있어요. 거주지를 사실과 다르게 알리면 병원이 진료를 하지 않을 수 있어요.'(가안, 벌칙 조문 미확인이라 '처벌'은 쓰지 않음)
 *  - [확정·요청] ③ 법정 설명 4가지는 시행규칙안 31조의9를 앱 문구로 옮긴 가안. ④ 금지 행위 목록은 법 34조의3⑥ 원문 확인 후 기재.
 *  - [확정·요청] 첨부 전 가림 안내(고정): 제목 '첨부 전에 꼭 가려 주세요' + 주민등록번호 뒷자리·가족 정보·금액·계좌번호·연락처 가림(본인 주민번호 앞 6자리는 남김, 다른 사람 주민번호는 전부 가림) / 이름과 주소의 '시'는 꼭 보이게 남김(예: 서울특별시, 경기도 수원시) / 구·동·번지 등 나머지 주소는 가림 / 가리지 않으면 병원이 다시 요청할 수 있음.
 *  - [확정·요청] 가림 예시는 가상 서류로 그리고 남길 곳·가릴 곳을 표시한다. 주민등록상 주소지 = 주민등록표 등본, 실거주지 = 임대차계약서·재직/재학증명서·공공요금 납부자료. 주소는 시 단위만 남김.
 *  - [확정·요청] 거주지 서류 첨부는 ①에서 초진을 고른 경우 ② 신청서에서 필수다. 첨부 + 가림 확인 체크 전에는 다음 버튼 비활성(D14). 위치는 기획 세션 제안.
 *  - [제안] 첨부 후 '주민등록번호 뒷자리·가족 정보·금액·계좌번호·연락처를 가렸어요' 체크를 해야 첨부가 완료된다.
 *  - [확정·요청] ② 진료 방식은 전화를 고를 수 있을 때(재진 + 13세 이상 + 전화 숨김 과 아님)만 선택 칸(화상 기본)을 보여 준다.
 *    그 밖(초진·예외·13세 미만·피부·안과·이비인후·외상·정신)은 선택 칸 없이 안내(D15).
 *    안내(가안): '화상 진료로 진행돼요' + '신청하면 바로 연결되지 않아요. 의사가 진료를 시작하면 알림을 보내드리니, 진료내역에서 '진료실 입장하기'를 눌러 주세요.'
 *    (현행 앱: 진료 시작 시 진료내역 '진료실로 입장해 주세요' + '진료실 입장하기' 버튼)
 *  - [확정·요청] ② 처방 불가 약 안내(PrescriptionGuide)는 현행 문구 그대로.
 *  - [확정·요청] ③ 첫 신청 = 제목 + 법정 설명 4가지(자리표시) + 책임 문구 1곳 + 동의 체크(체크 전 CTA 비활성).
 *    재신청 = 한 줄 재확인(책임 문구) + 체크. 자녀 진료 = 법정대리인 동의 안내 한 줄 추가.
 *  - [확정·요청] ④ 병원 취소 상태에서 취소 사유를 환자에게 보여 준다. 현행 진료 정보(DetailInfoRow) 목록에 '취소사유' 줄을 추가한다.
 *  - [확정·요청] ② 거주지 종류는 세그먼트 '등본상 주소지 / 실거주지'(홈 ShortcutSegmentedTab 모양: 트랙 GRAY_20 r4 p3, 칸 높이 36, 선택 칸 흰 바탕·body2_700 GRAY_90, 미선택 body2_500 GRAY_50).
 *    세그먼트 아래에 '제출 가능한 서류' 제목 + 선택한 종류의 서류 + 안내 한 줄.
 *  - [확정·요청] 예외 대상(D17): ① 박스 설명은 대표 대상 + 고르면 박스 아래 안내(다른 시·도 병원 초진 가능, 서류 필요) + '전체 대상 보기'(시행규칙안 31조의2③ 13개 + 고시 대상).
 *    ② 거주지 서류 대신 '예외 대상 확인(필수)': 대상 칩 선택 → 등록장애인·장기요양 수급자는 병원이 건강보험 자격 조회로 확인(첨부 없음, 현행 온라인진료실이 조회로 확인 중),
 *    그 밖은 서류 첨부 필수. 서류 이름은 가안. 고르거나 첨부하기 전에는 다음 비활성 + 이유 한 줄.
 *  - [제안] ① 박스 제목은 쉬운 말('최근 6개월 안에 다녀왔어요' 등) + 회색 태그(재진/초진/예외 대상). 화면 제목 '어디에 해당하나요?'. 순서는 초진 > 재진 > 예외 대상(대부분 초진, 잘못 골랐을 때 피해가 작은 순)(D16).
 *  - [제안] ④ 취소 사유는 병원이 고른 문장(어드민) 대신 앱 표시용 문구(환자 말투 + 다음 행동)를 보여 준다.
 *  - [확정·요청] ① 대상 선택은 라디오 대신 박스형(앱이 대상 선택에 라디오를 쓰지 않음). 모양은 Receipt420 PatientListItem·ReceiptExamRoomItem:
 *    r8 · 테두리 GRAY_30 / 선택 시 테두리 BLUE_60 · 배경 ALPHA_BLUE_05. 오른쪽 체크 아이콘은 두지 않는다. 초진 안내는 선택한 박스 아래.
 *  - [유지·자체] ① 초진 안내 상자는 ② 처방 안내(PrescriptionGuide) 상자 모양(GRAY_10 · r8 · p16 · 불릿)을 그대로 쓴다.
 *  - [유지·자체] ② 진료 대상을 바꿔 전화 진료가 막히면 선택을 화상 진료로 되돌린다.
 *  - [유지·자체] ③ 책임 문구·법정대리인 안내는 ② 처방 안내 상자와 같은 GRAY_10 상자 안에 둔다. 동의 체크는 CheckBox(icon_check_select) 모양.
 *  - [유지·자체] ④ 취소사유 줄은 진료 정보 첫 줄(요청일시 위)에 둔다. 하단 버튼은 현행대로 없음(Cancel → actionButton []).
 *  - [유지·자체] 결제는 현행 화면을 간단히 재현(등록 카드 영역은 서버 데이터라 자리표시). '약관 전체 동의하기' → '진료 신청하기' 순서는 현행 그대로.
 *  - [유지·자체] 동적 값은 {병원명}·{의사명}처럼 중괄호. 진료항목·증상은 ②에서 고른 값이 ④까지 이어진다.
 *
 * 보류·TODO (기획 확인 필요)
 *  - [확정] ④ 상단 문구는 사유 표시에 맞춘다: 제목 '병원에서\n진료를 취소했어요', 보조 '아래 취소 사유를 확인해 주세요'.
 *  - [보류] ④ 현행 treatmentV3 쿼리에는 진료(Treatment) 단위 취소 사유 필드가 없다(cancelReason 은 약국 조제 주문 쪽만). API 추가 필요.
 *  - [보류] ③ 재신청 화면의 제목은 첫 신청과 같은 문구를 썼다. 재신청 전용 제목 필요 여부.
 *  - [보류] ① 재신청 한 줄 요약 문구('화상 진료 · 같은 시·도 의원 · 처방 7일까지')와 펼치기 동작은 임의. 확정 필요.
 *  - [보류] ① 초진 안내 3줄은 요청 문구를 해요체로 맞췄다('화상 진료만 가능해요' 등).
 *  - [보류] ② 의사의 videoTreatmentEnabled=false(화상 진료 불가 의사)와 '초진은 화상만'이 겹치면 초진 환자는 신청 경로가 없다. 의사 목록 단계 처리 필요(범위 밖).
 *  - [보류] 나이 13세 미만 + 진료 받는 사람 본인 조합은 막지 않았다(토글 독립).
 *  - [보류] ③ 법정 설명 4가지는 가안. 앱 표시가 의료인 설명 의무(31조의9 주체는 의료인)를 대신하는지, 재신청 축약이 되는지 법무 확인.
 *  - [확정·요청] 비대면진료지원시스템은 없고 구축 시점 미정이라는 전제로 그린다(D13). 시행규칙안 부칙 6조에 따라 운영 개시 전에는
 *    주민등록상 주소지·예외 대상은 건보공단 정보시스템 또는 '해당 사실을 확인할 수 있는 서류'로, 실거주지는 자료를 의료기관에 제출해 확인 → ② 주민등록상 주소지 서류 첨부 유지.
 *  - [보류] 주민등록상 서류로 초본(본인만 기재)을 권할지(등본은 세대원 정보가 실림).
 *  - [보류] 수진자(건강보험 자격) 조회로 확인되는 예외 대상 범위(희귀질환 산정특례 포함 여부 등) — EMR·개발 확인 필요. 지금은 등록장애인·장기요양 수급자만 조회로 둠.
 *  - [보류] 예외 대상별 확인 서류 이름(가안)과 가림 안내 강도.
 *  - [확정·D18] 본인 확인은 화상 진료 중 신분증 대조. 화상 진료면 ② 진료 방식 영역에 신분증 준비 안내. 전화 진료의 본인 확인은 보류.
 *  - [보류] ② 가림 예시 재직증명서의 '소속'·'재직 기간'은 남김/가림 표시 없이 둠. 표시 여부 확인 중.
 *
 * 변경 이력
 *  - v0.8 (2026-11-23) D18: 화상 진료일 때 ② 진료 방식 영역에 '진료가 시작되면 의사에게 신분증이나 건강보험증을 화면으로 보여 주세요.'
 *  - v0.7 (2026-11-23) '근거 법령 보기' 토글 기본값 켜짐. 패널 '바뀐 곳 점선 표시' 토글(기본 켜짐).
 *  - v0.6 (2026-11-23) 패널 '근거 법령 보기' 토글: 켜면 정보 옆 '법령' → 문서명·조항·쪽 + 조문 캡처(assets/untact-law-app/law, 입법예고안 원문).
 *  - v0.6 (2026-11-23) 예외 대상 확인 흐름(D17): ① 안내·전체 대상 보기, ② 대상 선택 + 조회/서류 첨부.
 *  - v0.5 (2026-11-23) ① 순서 초진 > 재진 > 예외 대상, 제목 '어디에 해당하나요?'(D16).
 *  - v0.5 (2026-11-23) UX 문구·흐름 다듬기(Fable 검토, 처음 이용하는 환자 기준): ① 쉬운 말 제목 + 재진/초진/예외 태그, 초진 안내에 병원 시·도·서류 예고,
 *    ② 화상 안내(바로 연결 안 됨·알림·진료실 입장하기), 거주지 이유·서류 발급처, 다음 비활성 이유 한 줄, ③ 책임 문구 대상별·취소 알림, 다음=결제 안내(후불),
 *    설명 카드·동의 체크 다듬기, ④ 취소 사유 앱 표시용 문구(제안), 용어 통일(비대면진료·병원·처방받을 수 없어요).
 *  - v0.5 (2026-11-23) ② 전화를 고를 수 없으면 진료 방식 선택 칸 대신 화상 진료 안내(이유 + 준비할 것)(D15).
 *  - v0.5 (2026-11-23) ① 진료 대상을 라디오 → 박스형 선택(접수 환자·진료실 선택 박스와 같은 모양). ② 거주지 종류는 세그먼트 '등본상 주소지 / 실거주지'.
 *  - v0.5 (2026-11-23) 폰 화면 전체 한글 단어 단위 줄바꿈(keep-all, 앱 lineBreakStrategyIOS='hangul-word'와 같은 효과).
 *  - v0.5 (2026-11-23) 초진 거주지 서류 필수(D14). 주민등록번호는 뒷자리만 가림(D8), 등본·초본 '뒷자리 미포함' 발급 안내.
 *  - v0.5 (2026-11-23) 법령 기준 보강: ① 재진·초진 설명(마지막 대면진료 후 6개월), ② '거주지'로 바꾸고 주민등록상 주소지/실거주지 선택·서류 안내·등본 예시·부정 이용 방지 안내, ③ 법정 설명 4가지 가안.
 *  - v0.4 (2026-11-20) D8 변경 반영: ② 초진 실거주 증명 첨부(선택) · 가림 안내 · 서류 3종 가림 예시 · 가림 확인 체크, 패널 토글 '실거주 증명'.
 *  - v0.3 (2026-11-20) ④ 상단 제목·보조 문구를 사유 표시에 맞게 교체.
 *  - v0.2 (2026-11-20) 검수 반영: ② 비활성 전화 보조 문구 대비, ③ 책임 문구·대리인 안내를 설명 위로, ① 대상 변경 시 펼침 초기화, URL 오타 값 기본값 처리.
 *  - v0.1 (2026-11-20) 최초 작성. 의사 상세 → ①②③ → 결제 → 완료 → ④, 상태 토글 패널.
 * ─────────────────────────────────────────────────────────────
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import doctorAvatar from '../../../assets/untact-law-app/img_doctor_avatar.png';

/* ---------- 타입 ---------- */
type Step = 'doctor' | 'target' | 'form' | 'consent' | 'payment' | 'done' | 'detail';
type Target = 'revisit' | 'first' | 'exception';
type Who = 'self' | 'child';
type Count = 'first' | 'again';
type Dept = 'general' | 'nophone';
type Age = 'over13' | 'under13';
type Method = 'video' | 'phone';
type Proof = 'none' | 'attached';
type ProofDoc = 'resident' | 'lease' | 'work' | 'bill';
type Resid = 'resident' | 'actual';
type CancelReason = 'notTarget' | 'needVisit' | 'noContact';

const STEPS: { key: Step; label: string; kind: 'cur' | 'new' | 'mod' }[] = [
  { key: 'doctor', label: '의사 상세 (진입점)', kind: 'cur' },
  { key: 'target', label: '① 진료 대상 확인', kind: 'new' },
  { key: 'form', label: '② 신청서', kind: 'mod' },
  { key: 'consent', label: '③ 비대면진료 안내·동의', kind: 'new' },
  { key: 'payment', label: '결제', kind: 'cur' },
  { key: 'done', label: '신청 완료', kind: 'cur' },
  { key: 'detail', label: '④ 진료내역 상세 · 병원 취소', kind: 'mod' },
];
const KIND_LABEL = { cur: '현행', new: '신규', mod: '수정' } as const;

const TARGETS: { key: Target; title: string; plain: string; desc: string }[] = [
  { key: 'first', title: '초진', plain: '처음이거나 6개월이 지났어요', desc: '이 병원이 처음이거나, 다녀온 지 6개월이 지났거나, 그때와 다른 증상이에요' },
  { key: 'revisit', title: '재진', plain: '최근 6개월 안에 다녀왔어요', desc: '이 병원에 직접 가서 진료받았고, 그때와 같은 증상이에요' },
  { key: 'exception', title: '예외 대상', plain: '아래 대상에 해당해요', desc: '희귀질환자, 등록장애인, 장기요양 수급자, 군인·경찰·소방공무원 등' },
];

/* text = 병원이 고른 사유(어드민), app = 앱 표시용 문구(제안: 환자 말투 + 다음 행동) */
const CANCEL_REASONS: { key: CancelReason; text: string; app: string }[] = [
  { key: 'notTarget', text: '비대면 진료 대상 환자가 아닙니다', app: '비대면진료 대상에 해당하지 않아요. 진료 대상과 거주지 조건을 다시 확인해 신청하거나, 병원에 방문해 주세요.' },
  { key: 'needVisit', text: '대면 진료가 필요한 증상입니다', app: '대면진료가 필요한 증상이에요. 병원에 방문해 진료받아 주세요.' },
  { key: 'noContact', text: '환자와 연락이 되지 않습니다', app: '연락이 닿지 않아 취소됐어요. 알림과 전화를 받을 수 있을 때 다시 신청해 주세요.' },
];

/* 진료과: 일반은 실제 캡처(UNT-FRM-01) 값, 전화 숨김 과는 이름만 임의 */
const DEPTS: Record<Dept, { name: string; presets: string[] }> = {
  general: { name: '감기·비염', presets: ['콧물', '코막힘', '인후통', '삼킴곤란', '기침'] },
  nophone: { name: '피부과', presets: ['{증상 프리셋 1}', '{증상 프리셋 2}', '{증상 프리셋 3}'] },
};

/* 법이 정한 설명 4가지 — 문구 미확정 자리표시 */
/* 시행규칙안 31조의9 설명 4가지를 앱 문구로 옮긴 가안 */
const LAW_EXPLAINS: { title: string; body: string }[] = [
  { title: '직접 진찰할 수 없어 진단에 한계가 있어요', body: '의사가 직접 보거나 만지고 검사할 수 없어서, 대면진료보다 진단이 덜 정확할 수 있어요.' },
  { title: '의사가 진료를 하지 않거나 중간에 멈출 수 있어요', body: '법에서 정한 경우에 해당하면 의사가 비대면진료를 하지 않거나 진료 중에 멈출 수 있어요.' },
  { title: '사실대로 알려 주세요', body: '주된 증상, 지금 앓고 있는 병, 병력·가족력, 먹고 있는 약을 의사에게 사실대로 알려 주세요.' },
  { title: '이런 행위는 법으로 금지돼 있어요', body: '{금지 행위 목록 — 법 원문 확인 후 기재} 이런 행위를 하면 형사처벌을 받을 수 있어요.' },
];
/* ③ 책임 문구 — 진료 대상별(가안). 고시 24조 '의료기관이 본인·대상 여부를 확인' 안내 포함 */
const RESPONSIBILITY: Record<Target, string> = {
  first: '병원이 진료 전에 거주지 서류를 확인해요. 신청 내용이 사실과 다르면 진료가 취소될 수 있으니, 동의하기 전에 한 번 더 확인해 주세요. 취소되면 알림을 보내드리고, 진료내역에서 사유를 볼 수 있어요.',
  revisit: '병원이 진료 전에 대면진료 기록을 확인해요. 마지막 대면진료 후 6개월이 지났거나 증상이 다르면 진료가 취소될 수 있어요. 취소되면 알림을 보내드리고, 진료내역에서 사유를 볼 수 있어요.',
  exception: '병원이 진료 전에 예외 대상에 해당하는지 확인해요. 해당하지 않으면 진료가 취소될 수 있어요. 취소되면 알림을 보내드리고, 진료내역에서 사유를 볼 수 있어요.',
};

/* 결제 필수 약관 — SymptomScreen/components/Modal/AgreementModal/text.ts:12 */
const PAYMENT_TERMS = [
  '(필수) 개인정보 수집 및 이용 동의',
  '(필수) 민감정보 수집 및 이용 동의',
  '(필수) 고유식별정보 수집 동의',
  '(필수) 결제정보 확인 및 정보제공 동의',
  '(필수) 진료비 자동 결제 동의',
  '(필수) 대체조제 동의',
];

/* ---------- 아이콘 (goodoc-mobile src/assets 원본 path) ---------- */
const IconBack = () => (
  <svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <path
      d="M10.2929 3.29289C10.6834 2.90237 11.3166 2.90237 11.7071 3.29289C12.0976 3.68342 12.0976 4.31658 11.7071 4.70711L5.41421 11H21C21.5523 11 22 11.4477 22 12C22 12.5523 21.5523 13 21 13H5.41421L11.7071 19.2929C12.0976 19.6834 12.0976 20.3166 11.7071 20.7071C11.3166 21.0976 10.6834 21.0976 10.2929 20.7071L2.29289 12.7071C1.90237 12.3166 1.90237 11.6834 2.29289 11.2929L10.2929 3.29289Z"
      fill="#31353F"
    />
  </svg>
);
const IconClose = () => (
  <svg width={16} height={16} viewBox="0 0 16 16" fill="none">
    <path
      d="M1.70711 0.292893C1.31658 -0.0976311 0.683417 -0.0976311 0.292893 0.292893C-0.0976311 0.683417 -0.0976311 1.31658 0.292893 1.70711L6.58579 8L0.292893 14.2929C-0.0976311 14.6834 -0.0976311 15.3166 0.292893 15.7071C0.683417 16.0976 1.31658 16.0976 1.70711 15.7071L8 9.41421L14.2929 15.7071C14.6834 16.0976 15.3166 16.0976 15.7071 15.7071C16.0976 15.3166 16.0976 14.6834 15.7071 14.2929L9.41421 8L15.7071 1.70711C16.0976 1.31658 16.0976 0.683417 15.7071 0.292893C15.3166 -0.0976311 14.6834 -0.0976311 14.2929 0.292893L8 6.58579L1.70711 0.292893Z"
      fill="#303642"
    />
  </svg>
);
const IconHome = ({ color = '#31353F' }: { color?: string }) => (
  <svg width={18} height={19} viewBox="0 0 18 19" fill="none">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M16 16.5001V7.18243L9 1.99023L2 7.18243L2 16.5001L16 16.5001ZM0.808507 5.57608C0.299897 5.95334 0 6.54918 0 7.18243V16.5001C0 17.6047 0.89543 18.5001 2 18.5001H16C17.1046 18.5001 18 17.6047 18 16.5001V7.18243C18 6.54918 17.7001 5.95334 17.1915 5.57608L10.1915 0.38389C9.48387 -0.140984 8.51613 -0.140984 7.80851 0.383889L0.808507 5.57608Z"
      fill={color}
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M9 10.311C9.55228 10.311 10 10.7588 10 11.311V18.4732H8V11.311C8 10.7588 8.44772 10.311 9 10.311Z"
      fill={color}
    />
  </svg>
);
const IconCaution = ({ color, size = 20 }: { color: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 17" fill="none" style={{ flexShrink: 0 }}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M7.99967 1.83301C4.31967 1.83301 1.33301 4.81967 1.33301 8.49967C1.33301 12.1797 4.31967 15.1663 7.99967 15.1663C11.6797 15.1663 14.6663 12.1797 14.6663 8.49967C14.6663 4.81967 11.6797 1.83301 7.99967 1.83301ZM7.33301 11.833V10.4997H8.66634V11.833H7.33301ZM7.33301 5.16634V9.16634H8.66634V5.16634H7.33301Z"
      fill={color}
    />
  </svg>
);
const IconInformation = ({ color, size = 20 }: { color: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0 }}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M15.15 9C15.15 12.3966 12.3966 15.15 9 15.15C5.60345 15.15 2.85 12.3966 2.85 9C2.85 5.60345 5.60345 2.85 9 2.85C12.3966 2.85 15.15 5.60345 15.15 9ZM16.5 9C16.5 13.1421 13.1421 16.5 9 16.5C4.85786 16.5 1.5 13.1421 1.5 9C1.5 4.85786 4.85786 1.5 9 1.5C13.1421 1.5 16.5 4.85786 16.5 9ZM8.25 6.75V5.25H9.75V6.75H8.25ZM8.25 12.75V8.25H9.75V12.75H8.25Z"
      fill={color}
    />
  </svg>
);
const IconArrowForward = ({ rotate = 0 }: { rotate?: number }) => (
  <svg width={16} height={16} viewBox="0 0 16 16" fill="none" style={{ transform: `rotate(${rotate}deg)`, flexShrink: 0 }}>
    <path d="M6.66673 12.0758L5.7334 11.1425L8.80007 8.07581L5.7334 5.00914L6.66673 4.07581L10.6667 8.07581L6.66673 12.0758Z" fill="#5D6474" />
  </svg>
);
const IconArrowRight = ({ color, size = 16 }: { color: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M7.52851 2.86225C7.26817 3.1226 7.26817 3.54471 7.52851 3.80506L11.7238 8.00033L7.52851 12.1956C7.26817 12.4559 7.26817 12.878 7.52851 13.1384C7.78886 13.3987 8.21097 13.3987 8.47132 13.1384L13.138 8.47173C13.3983 8.21138 13.3983 7.78927 13.138 7.52892L8.47132 2.86225C8.21097 2.6019 7.78886 2.6019 7.52851 2.86225Z"
      fill={color}
    />
  </svg>
);
/* CheckBox 기본형: icon_check_select / icon_check_unselect (24, BLUE_60 / GRAY_40) */
const IconCheckRound = ({ on }: { on: boolean }) =>
  on ? (
    <svg width={24} height={24} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="12" cy="12" r="12" fill="#0073FA" />
      <path fillRule="evenodd" clipRule="evenodd" d="M17.9999 9.18837L10.2373 16.793L5.99994 12.6418L7.42434 11.2464L10.2373 14.0022L16.5755 7.79297L17.9999 9.18837Z" fill="white" />
    </svg>
  ) : (
    <svg width={24} height={24} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="12" cy="12" r="11.5" fill="white" stroke="#CACED8" />
      <path fillRule="evenodd" clipRule="evenodd" d="M17.9999 9.18837L10.2373 16.793L5.99994 12.6418L7.42434 11.2464L10.2373 14.0022L16.5755 7.79297L17.9999 9.18837Z" fill="#CACED8" />
    </svg>
  );
/* 결제 약관 체크: ic_checkbox (24, BLUE_60 / GRAY_40) */
const IconCheckSharp = ({ on }: { on: boolean }) => (
  <svg width={24} height={24} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
    <path fillRule="evenodd" clipRule="evenodd" d="M19.1778 8.73474L9.8329 17.3608L4.82129 12.7347L6.17785 11.2651L9.8329 14.639L17.8213 7.26514L19.1778 8.73474Z" fill={on ? '#0073FA' : '#CACED8'} />
  </svg>
);
const IconCamera = () => (
  <svg width={22} height={23} viewBox="0 0 22 23" fill="none">
    <circle cx="10.9091" cy="12.091" r="2.90909" fill="#828896" />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M6.51836 4.81818L8.182 3H13.6365L15.3002 4.81818H18.182C19.182 4.81818 20.0002 5.63636 20.0002 6.63636V17.5455C20.0002 18.5455 19.182 19.3636 18.182 19.3636H3.63654C2.63654 19.3636 1.81836 18.5455 1.81836 17.5455V6.63636C1.81836 5.63636 2.63654 4.81818 3.63654 4.81818H6.51836ZM6.36381 12.0909C6.36381 14.6 8.40018 16.6364 10.9093 16.6364C13.4184 16.6364 15.4547 14.6 15.4547 12.0909C15.4547 9.58182 13.4184 7.54545 10.9093 7.54545C8.40018 7.54545 6.36381 9.58182 6.36381 12.0909Z"
      fill="#828896"
    />
  </svg>
);

/* ---------- GoodocText ---------- */
type FS = 'h3' | 'h4' | 'h5' | 'b1' | 'b2' | 'c1' | 'c2';
const T = ({
  s,
  w = 4,
  c = 'gray-100',
  style,
  className = '',
  children,
}: {
  s: FS;
  w?: 4 | 5 | 6 | 7;
  c?: string;
  style?: React.CSSProperties;
  className?: string;
  children: React.ReactNode;
}) => (
  <p className={`t t-${s} w${w} ${className}`} style={{ color: `var(--${c})`, ...style }}>
    {children}
  </p>
);

/* ---------- 공통 프레임 ---------- */
const NavBar = ({
  left,
  right,
}: {
  left?: { icon: 'back' | 'close' | 'backhome'; onPress?: () => void; onHome?: () => void };
  right?: { icon: 'close' | string; onPress?: () => void };
}) => (
  <div className="ula-nav">
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {left && (
        <button className="ula-nav-btn" onClick={left.onPress} aria-label="뒤로">
          {left.icon === 'close' ? <IconClose /> : <IconBack />}
        </button>
      )}
      {left?.icon === 'backhome' && (
        <button className="ula-nav-btn" onClick={left.onHome} aria-label="홈">
          <IconHome />
        </button>
      )}
    </div>
    {right && (
      <button className="ula-nav-btn" onClick={right.onPress}>
        {right.icon === 'close' ? <IconClose /> : <span className="ula-nav-text">{right.icon}</span>}
      </button>
    )}
  </div>
);

/* ---------- 거주지 서류 가림 예시 (가상 서류, 실제 개인정보 없음) ---------- */
type DocSeg = { t: string; k?: 'keep' | 'mask' };
type ProofDocDef = { key: ProofDoc; tab: string; title: string; rows: { label: string; segs: DocSeg[] }[] };
/* 거주지 종류별 증명 서류 — 주민등록상 주소지: 법령은 '해당 사실을 확인할 수 있는 서류'로만 규정(가안) · 실거주지: 시행규칙안 31조의15②가 열거한 3종 */
const RESID_DOCS: Record<Resid, ProofDoc[]> = { resident: ['resident'], actual: ['lease', 'work', 'bill'] };
const PROOF_DOCS: ProofDocDef[] = [
  {
    key: 'resident',
    tab: '주민등록표 등본·초본',
    title: '주민등록표 (등본)',
    rows: [
      { label: '성명', segs: [{ t: '김굿닥', k: 'keep' }] },
      { label: '주민등록번호', segs: [{ t: '900101-', k: 'keep' }, { t: '0000000', k: 'mask' }] },
      { label: '주소', segs: [{ t: '서울특별시', k: 'keep' }, { t: '○○구 ○○로 00, 000호', k: 'mask' }] },
      { label: '세대주·세대원', segs: [{ t: '○○○ 외 0명', k: 'mask' }] },
    ],
  },
  {
    key: 'lease',
    tab: '임대차계약서',
    title: '부동산 임대차 계약서',
    rows: [
      { label: '소재지', segs: [{ t: '서울특별시', k: 'keep' }, { t: '○○구 ○○동 000-00', k: 'mask' }] },
      { label: '보증금·월세', segs: [{ t: '0,000만 원 / 00만 원', k: 'mask' }] },
      { label: '임차인 성명', segs: [{ t: '김굿닥', k: 'keep' }] },
      { label: '주민등록번호', segs: [{ t: '900101-', k: 'keep' }, { t: '0000000', k: 'mask' }] },
      { label: '임대인', segs: [{ t: '○○○ · 000000-0000000', k: 'mask' }] },
      { label: '연락처', segs: [{ t: '010-0000-0000', k: 'mask' }] },
      { label: '계좌번호', segs: [{ t: '○○은행 000-000-000000', k: 'mask' }] },
    ],
  },
  {
    key: 'work',
    tab: '재직·재학증명서',
    title: '재직증명서',
    rows: [
      { label: '성명', segs: [{ t: '김굿닥', k: 'keep' }] },
      { label: '주민등록번호', segs: [{ t: '900101-', k: 'keep' }, { t: '0000000', k: 'mask' }] },
      { label: '주소', segs: [{ t: '경기도 수원시', k: 'keep' }, { t: '○○구 ○○로 00', k: 'mask' }] },
      { label: '소속', segs: [{ t: '{회사·학교명}' }] },
      { label: '재직 기간', segs: [{ t: '0000.00.00 ~ 현재' }] },
    ],
  },
  {
    key: 'bill',
    tab: '공공요금 납부자료',
    title: '공공요금 납부 확인서',
    rows: [
      { label: '납부자', segs: [{ t: '김굿닥', k: 'keep' }] },
      { label: '사용 장소', segs: [{ t: '서울특별시', k: 'keep' }, { t: '○○구 ○○동 000-00', k: 'mask' }] },
      { label: '세대원', segs: [{ t: '○○○ 외 0명', k: 'mask' }] },
      { label: '납부 금액', segs: [{ t: '00,000원', k: 'mask' }] },
      { label: '납부 계좌', segs: [{ t: '○○은행 000-000-000000', k: 'mask' }] },
    ],
  },
];
const ProofDocMock = ({ doc, mini }: { doc: ProofDocDef; mini?: boolean }) => (
  <div className={`ula-doc ${mini ? 'is-mini' : ''}`}>
    <div className="ula-doc-title">{doc.title}</div>
    {doc.rows.map(r => (
      <div key={r.label} className="ula-doc-row">
        <span className="ula-doc-k">{r.label}</span>
        <span className="ula-doc-v">
          {r.segs.map((g, i) => (
            <span key={i} className={g.k ? `is-${g.k}` : ''}>
              {g.k === 'mask' ? <span className="ula-doc-hide">{g.t}</span> : g.t}
            </span>
          ))}
        </span>
      </div>
    ))}
  </div>
);

/* ---------- 근거 법령(입법예고안 원문 캡처) — 패널 '근거 법령 보기'를 켜면 각 정보 옆 '법령'을 눌러 본다 ---------- */
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
  'identity-check': { doc: '의료법 시행규칙 일부개정령안(입법예고안)', article: '제31조의5제2항·제3항', page: '9쪽', img: require('../../../assets/untact-law-app/law/identity-check.png') },
  'platform-notice': { doc: '비대면진료 실시 및 관리에 관한 고시(안)', article: '제24조', page: '16쪽', img: require('../../../assets/untact-law-app/law/platform-notice.png') },
};

/* ---------- 예외 대상(동일 시·도 밖 초진 허용, 시행규칙안 31조의2③) ----------
   query = 병원이 건보 자격(수진자) 조회로 확인(현행 온라인진료실이 조회로 확인 중인 항목). 그 밖은 서류 첨부. 서류명은 가안. */
type ExCat = 'disability' | 'ltc' | 'rare' | 't1dm' | 'infect' | 'public' | 'seaman' | 'veteran' | 'hospice' | 'abroad' | 'prisoner';
const EX_CATS: { key: ExCat; label: string; query?: boolean; docs?: string }[] = [
  { key: 'disability', label: '등록장애인', query: true },
  { key: 'ltc', label: '장기요양 수급자', query: true },
  { key: 'rare', label: '희귀질환자', docs: '산정특례 등록 확인서 또는 진단서' },
  { key: 't1dm', label: '제1형 당뇨병 환자', docs: '진단서 또는 소견서' },
  { key: 'infect', label: '감염병 격리 중', docs: '격리통지서' },
  { key: 'public', label: '군인·경찰·소방공무원', docs: '공무원증 또는 재직증명서' },
  { key: 'seaman', label: '선원', docs: '선원수첩 또는 승선 사실 확인서' },
  { key: 'veteran', label: '국가보훈 대상자', docs: '국가보훈등록증' },
  { key: 'hospice', label: '호스피스 대상 환자', docs: '호스피스 대상 확인 서류' },
  { key: 'abroad', label: '국외 체류 재외국민', docs: '재외국민 등록 확인 서류' },
  { key: 'prisoner', label: '수용자', docs: '수용 사실 확인 서류' },
];

/* ---------- 상태 ---------- */
type State = {
  step: Step;
  target: Target | null;
  who: Who;
  count: Count;
  dept: Dept;
  age: Age;
  cancel: CancelReason;
  proof: Proof;
};

export default function UntactLawApp() {
  /* 검토용 URL 파라미터: ?step=form&target=first&who=child&count=again&dept=nophone&age=under13&cancel=needVisit&proof=attached */
  const [s, setS] = useState<State>(() => {
    const init: State = {
      step: 'doctor',
      target: null,
      who: 'self',
      count: 'first',
      dept: 'general',
      age: 'over13',
      cancel: 'notTarget',
      proof: 'none',
    };
    try {
      const q = new URLSearchParams(window.location.search);
      (Object.keys(init) as (keyof State)[]).forEach(k => {
        const v = q.get(k);
        if (v) (init as Record<string, unknown>)[k] = v;
      });
      /* 오타 값은 기본값으로 — 없는 값이면 화면 전체가 깨짐 */
      if (!STEPS.some(x => x.key === init.step)) init.step = 'doctor' as State['step'];
      if (!(init.dept in DEPTS)) init.dept = 'general';
      if (!CANCEL_REASONS.some(r => r.key === init.cancel)) init.cancel = 'notTarget' as State['cancel'];
      if (init.proof !== 'attached' || init.target !== 'first') init.proof = 'none';
    } catch {
      /* 파라미터 없음 */
    }
    return init;
  });
  const set = (p: Partial<State>) => setS(prev => ({ ...prev, ...p }));
  /* 근거 법령 보기 */
  const [lawOn, setLawOn] = useState(true);
  const [marksOn, setMarksOn] = useState(true);
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
  /* 앞 글자와 떨어지지 않게 단어 결합 문자 + 인라인 span */
  const law = (ids: string[], note?: string) =>
    lawOn ? (
      <>
        {'\u2060'}
        <span
          role="button"
          tabIndex={0}
          className="ula-law"
          onClick={e => {
            e.stopPropagation();
            setLawView({ ids, note });
          }}
          onKeyDown={e => {
            if (e.key === 'Enter') setLawView({ ids, note });
          }}>
          법령
        </span>
      </>
    ) : null;

  /* 신청서 입력값 (④까지 이어짐) */
  const [method, setMethod] = useState<Method>('video');
  const [presets, setPresets] = useState<string[]>([]);
  const [symptom, setSymptom] = useState('');
  const [consent, setConsent] = useState(false);
  const [terms, setTerms] = useState<boolean[]>(PAYMENT_TERMS.map(() => false));
  const [firstOpen, setFirstOpen] = useState(false);
  const [tab, setTab] = useState<'hospital' | 'pharmacy'>('hospital');
  /* 거주지 서류: 파일 있음 · 가림 확인 체크. 패널 토글 '첨부함' = 파일 + 체크 완료 */
  const [proofFile, setProofFile] = useState(s.proof === 'attached');
  const [proofChecked, setProofChecked] = useState(s.proof === 'attached');
  const [resid, setResidRaw] = useState<Resid>('resident');
  const [proofDoc, setProofDoc] = useState<ProofDoc>('resident');
  /* 첨부한 서류 종류(썸네일용) — 첨부 시점의 예시 탭 */
  const [attachedDoc, setAttachedDoc] = useState<ProofDoc>('resident');
  /* 거주지 종류를 바꾸면 예시 탭을 그 종류 첫 서류로, 첨부는 비운다(서류 종류가 달라짐) */
  const setResid = (r: Resid) => {
    if (r === resid) return;
    setResidRaw(r);
    setProofDoc(RESID_DOCS[r][0]);
    setProof(false, false);
  };
  /* 첨부 상태는 이 함수로만 바꾼다(패널 토글·첨부·삭제·체크·대상 변경이 같은 값을 가리키게) */
  const setProof = (file: boolean, checked: boolean) => {
    setProofFile(file);
    setProofChecked(checked);
    set({ proof: file && checked ? 'attached' : 'none' });
  };
  /* 대상이 초진이 아니게 바뀌면 첨부를 비운다 */
  const setTarget = (k: Target) => set(k === 'first' ? { target: k } : { target: k, proof: 'none' });
  useEffect(() => {
    if (s.target !== 'first') {
      setProofFile(false);
      setProofChecked(false);
    }
  }, [s.target]);
  /* 초진은 거주지 서류 필수: 첨부 + 가림 확인 체크까지 해야 다음으로 */
  const proofPending = s.target === 'first' && !(proofFile && proofChecked);
  /* 예외 대상 확인 — 대상 고르기 + (조회 대상이 아니면) 서류 첨부 */
  const [exCat, setExCat] = useState<ExCat | null>(null);
  const [exFile, setExFile] = useState(false);
  const [exListOpen, setExListOpen] = useState(false);
  useEffect(() => {
    if (s.target !== 'exception') {
      setExCat(null);
      setExFile(false);
    }
    setExListOpen(false);
  }, [s.target]);
  const exInfo = EX_CATS.find(c => c.key === exCat);
  const exPending = s.target === 'exception' && (!exInfo || (!exInfo.query && !exFile));
  const formPending = proofPending || exPending;
  const formHint = proofPending
    ? proofFile
      ? "가릴 곳을 가린 뒤 위의 '…가렸어요'에 체크해 주세요"
      : '거주지 서류를 첨부해 주세요'
    : !exInfo
      ? '해당하는 예외 대상을 골라 주세요'
      : '예외 대상을 확인할 서류를 첨부해 주세요';

  const phoneHidden = s.age === 'under13' || s.dept === 'nophone';
  const phoneEnabled = !phoneHidden && s.target === 'revisit';

  /* 전화 진료가 막히거나 숨겨지면 화상 진료로 되돌린다 */
  useEffect(() => {
    if (method === 'phone' && !phoneEnabled) setMethod('video');
  }, [phoneEnabled, method]);
  /* 진료과가 바뀌면 프리셋 초기화 (SymptomScreen.tsx:124 와 같음) */
  useEffect(() => setPresets([]), [s.dept]);
  /* 동의는 첫/재신청·진료 받는 사람이 바뀌면 다시 받는다 */
  useEffect(() => setConsent(false), [s.count, s.who]);
  useEffect(() => setFirstOpen(false), [s.count, s.target]);

  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [s.step]);

  const go = (step: Step) => set({ step });
  const dept = DEPTS[s.dept];

  /* ───────── 화면들 ───────── */

  /* 의사 상세 (진입점만) — DoctorProfileScreen / FooterButton.tsx:82-128 */
  const DoctorScreen = (
    <>
      <div className="ula-scroll" ref={scrollRef}>
        <NavBar left={{ icon: 'backhome', onPress: () => {}, onHome: () => {} }} />
        <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: 8 }}>
          <img src={doctorAvatar} alt="" width={200} height={200} style={{ borderRadius: 100 }} />
        </div>
        {/* DoctorInformation/index.tsx:31 — paddingTop 24 · paddingHorizontal 20 · paddingBottom 16 · gap 4 */}
        <div className="ula-col" style={{ padding: '24px 20px 16px', gap: 4 }}>
          <T s="c2" c="gray-60">
            {'{병원명}'}
          </T>
          <T s="h4" w={7} c="gray-80">
            {'{의사명} 의사'}
          </T>
          <T s="b2" c="gray-90">
            화상진료
          </T>
        </div>
        <div style={{ height: 1, background: 'var(--gray-30)', margin: '0 20px' }} />
        <div className="ula-col" style={{ padding: 20, gap: 8 }}>
          <div className="ula-srv" style={{ height: 160, borderRadius: 8 }}>
            {'{의사 상세 탭 · 소개/진료비/리뷰 — 현행, 이 프로토 범위 밖}'}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, padding: '12px 20px', background: 'var(--white)' }}>
        <button className="ula-btn is-flex tonal-blue" onClick={() => go('target')}>
          진료예약
        </button>
        <button className="ula-btn is-flex filled-blue" onClick={() => go('target')}>
          바로진료
        </button>
      </div>
    </>
  );

  /* ① 진료 대상 확인 (신규) */
  const firstGuideLines = [
    '화상 진료만 받을 수 있어요',
    '이 병원은 {서울특별시}에 있어요. {서울특별시}에 사는 분만 진료받을 수 있어요',
    '거주지를 확인할 서류가 필요해요(등본이나 초본 등)',
    '약은 7일분까지 처방받을 수 있어요. 먹는 여드름약(이소트레티노인)·트라마돌은 처방받을 수 없어요',
  ];
  /* ① 예외 대상 안내 — 고르면 박스 아래 */
  const ExGuide = (
    <div className="ula-guide">
      <div className="ula-bullet">
        <T s="b2" c="gray-70">
          {'  •'}
        </T>
        <T s="b2" c="gray-70" style={{ flex: 1 }}>
          다른 시·도에 있는 병원에서도 처음 진료받을 수 있는 대상이에요
          {law(['exception-list'])}
        </T>
      </div>
      <div className="ula-bullet">
        <T s="b2" c="gray-70">
          {'  •'}
        </T>
        <T s="b2" c="gray-70" style={{ flex: 1 }}>
          대상에 따라 확인할 서류를 첨부해야 해요
        </T>
      </div>
      <button className="ula-linkbtn" onClick={() => setExListOpen(o => !o)}>
        {exListOpen ? '전체 대상 접기' : '전체 대상 보기'}
        <IconArrowForward rotate={exListOpen ? -90 : 90} />
      </button>
      {exListOpen && (
        <div className="ula-exlist">
          {[...EX_CATS.map(c => c.label), '그 밖에 보건복지부 장관이 정하는 대상'].map(l => (
            <T key={l} s="c1" c="gray-70">
              {`· ${l}`}
            </T>
          ))}
        </div>
      )}
    </div>
  );
  const FirstGuide =
    s.count === 'again' && !firstOpen ? (
      <button
        className="ula-guide"
        style={{ flexDirection: 'row', alignItems: 'center', gap: 6, border: 0, width: '100%', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit' }}
        onClick={() => setFirstOpen(true)}>
        <IconInformation color="#808799" size={18} />
        <T s="c1" c="gray-70" style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {'화상 진료 · {서울특별시} 거주 · 거주지 서류 · 처방 7일까지'}
        </T>
        <IconArrowForward rotate={90} />
      </button>
    ) : (
      <div className="ula-guide">
        {firstGuideLines.map((line, i) => (
          <div className="ula-bullet" key={line}>
            <T s="b2" c="gray-70">
              {'  •'}
            </T>
            <T s="b2" c="gray-70" style={{ flex: 1 }}>
              {line}
              {law([['phone-condition'], ['first-region'], ['resid-before-system', 'resid-actual'], ['rx-7days', 'rx-banned']][i] ?? [])}
            </T>
          </div>
        ))}
        {s.count === 'again' && (
          <button
            onClick={() => setFirstOpen(false)}
            style={{ alignSelf: 'flex-end', display: 'flex', alignItems: 'center', gap: 2, background: 'none', border: 0, cursor: 'pointer', padding: 0 }}>
            <T s="c1" w={6} c="gray-60">
              접기
            </T>
            <IconArrowForward rotate={-90} />
          </button>
        )}
      </div>
    );

  const TargetScreen = (
    <>
      <NavBar left={{ icon: 'back', onPress: () => go('doctor') }} />
      <div className="ula-scroll" ref={scrollRef}>
        {/* 제목 영역: TreatmentStatus.tsx:91-102 와 같은 heading3_700 + body1_400 GRAY_70, gap 8, padding 20 */}
        <div className="ula-col" style={{ padding: '24px 20px 20px', gap: 8 }}>
          <T s="h3" w={7}>
            어디에 해당하나요?
          </T>
          <T s="b1" c="gray-70">
            선택에 따라 진료 방식과 준비할 서류가 달라요. 선택한 내용은 병원이 진료 전에 확인해요.
          </T>
        </div>
        <div className="ula-col" style={{ padding: '0 20px', gap: 12 }}>
          {TARGETS.map(t => {
            const on = s.target === t.key;
            return (
              <React.Fragment key={t.key}>
                <button className={`ula-choice ${on ? 'is-on' : ''}`} onClick={() => setTarget(t.key)}>
                  <span className="ula-col" style={{ gap: 2, flex: 1 }}>
                    <span className="ula-choice-head">
                      <T s="b1" w={6} c="gray-100">
                        {t.plain}
                      </T>
                      <span className="ula-tag">{t.title}</span>
                    </span>
                    <T s="b2" c="gray-70">
                      {t.desc}
                      {law(t.key === 'first' ? ['revisit-period'] : t.key === 'revisit' ? ['revisit-period', 'revisit-check'] : ['exception-list'])}
                    </T>
                  </span>
                </button>
                {t.key === 'first' && on && FirstGuide}
                {t.key === 'exception' && on && ExGuide}
              </React.Fragment>
            );
          })}
        </div>
      </div>
      <button className="ula-btn filled-blue ula-cta" disabled={!s.target} onClick={() => go('form')}>
        다음
      </button>
    </>
  );

  /* ② 예외 대상 확인 (신규, 예외 대상만) — 거주지 서류 대신 */
  const ExSection = (
    <div className="ula-col ula-changed" style={{ gap: 16, padding: '24px 20px 28px', borderBottom: '8px solid var(--gray-20)' }}>
      <div className="ula-col" style={{ gap: 4 }}>
        <T s="h5" w={7} c="gray-90">
          예외 대상 확인(필수)
          {law(['exception-check', 'resid-before-system'])}
        </T>
        <T s="b2" c="gray-80">
          해당하는 대상을 골라 주세요. 병원이 진료 전에 확인해요.
        </T>
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {EX_CATS.map(c => (
          <button
            key={c.key}
            className={`ula-preset is-small ${exCat === c.key ? 'is-on' : ''}`}
            onClick={() => {
              if (exCat === c.key) return;
              setExCat(c.key);
              setExFile(false);
            }}>
            {c.label}
          </button>
        ))}
      </div>
      {exInfo &&
        (exInfo.query ? (
          <div className="ula-method-info" style={{ marginBottom: 0 }}>
            <IconInformation color="#808799" size={18} />
            <div className="ula-col" style={{ gap: 2, flex: 1 }}>
              <T s="b2" w={6} c="gray-80">
                서류는 첨부하지 않아도 돼요
              </T>
              <T s="b2" c="gray-70">
                병원이 건강보험 자격 조회로 {exInfo.label}인지 확인해요.
              </T>
            </div>
          </div>
        ) : (
          <div className="ula-col" style={{ gap: 12 }}>
            <div className="ula-col" style={{ gap: 4 }}>
              <T s="c1" w={6} c="gray-60">
                제출 가능한 서류
              </T>
              <T s="b1" w={6} c="gray-90">
                {exInfo.docs}
              </T>
              <T s="b2" c="gray-60">
                주민등록번호 뒷자리처럼 진료와 관련 없는 정보는 가린 뒤 첨부해 주세요.
              </T>
            </div>
            {!exFile ? (
              <button className="ula-upload" onClick={() => setExFile(true)}>
                <IconCamera />
                <span>서류 첨부하기</span>
              </button>
            ) : (
              <div className="ula-proof-file">
                <span className="ula-proof-thumb ula-ex-thumb">
                  <span>{exInfo.docs?.split(' 또는 ')[0]}</span>
                </span>
                <T s="b2" c="gray-80" style={{ flex: 1 }}>
                  {`${exInfo.label} 확인 서류 1장`}
                </T>
                <button className="ula-proof-del" onClick={() => setExFile(false)} aria-label="첨부 삭제">
                  <IconClose />
                </button>
              </div>
            )}
          </div>
        ))}
    </div>
  );

  /* ② 거주지 (신규, 초진만) — D8 · D12 */
  const RESID_OPTIONS: { key: Resid; title: string; docs: string; note: string }[] = [
    { key: 'resident', title: '등본상 주소지', docs: '주민등록표 등본 또는 초본', note: "정부24나 주민센터에서 발급받을 수 있어요. 발급할 때 '주민등록번호 뒷자리 미포함'을 선택하면 뒷자리는 따로 가리지 않아도 돼요." },
    { key: 'actual', title: '실거주지', docs: '임대차계약서, 재직·재학증명서, 공공요금 납부자료 등', note: '주민등록 주소와 지금 사는 곳이 다를 때 고르는 항목이에요. 지금 사는 주소가 적힌 서류면 돼요.' },
  ];
  const residOpt = RESID_OPTIONS.find(o => o.key === resid)!;
  const ProofSection = (
    <div className="ula-col ula-changed" style={{ gap: 16, padding: '24px 20px 28px', borderBottom: '8px solid var(--gray-20)' }}>
      <div className="ula-col" style={{ gap: 4 }}>
        <T s="h5" w={7} c="gray-90">
          거주지(필수)
          {law(['first-region', 'resid-before-system'])}
        </T>
        <T s="b2" c="gray-80">
          처음 진료받는 병원은 내가 사는 시·도 안에 있어야 해요. 병원이 서류로 확인할 수 있게 1장을 첨부해 주세요.
        </T>
      </div>
      {/* ShortcutSegmentedTab(홈 바로가기) 세그먼트 모양 */}
      <div className="ula-col" style={{ gap: 12 }}>
        <div className="ula-segtab" role="tablist">
          {RESID_OPTIONS.map(o => (
            <button key={o.key} role="tab" aria-selected={resid === o.key} className={resid === o.key ? 'is-on' : ''} onClick={() => setResid(o.key)}>
              {o.title}
            </button>
          ))}
        </div>
        <div className="ula-col" style={{ gap: 4 }}>
          <T s="c1" w={6} c="gray-60">
            제출 가능한 서류
          </T>
          <T s="b1" w={6} c="gray-90">
            {residOpt.docs}
            {law(resid === 'actual' ? ['resid-actual', 'resid-before-system'] : ['resid-before-system'])}
          </T>
          <T s="b2" c="gray-60">
            {residOpt.note}
          </T>
        </div>
      </div>
      <div className="ula-guide">
        <div className="ula-guide-title">
          <IconCaution color="#FB7480" />
          <T s="b2" w={6} c="gray-80">
            첨부 전에 꼭 가려 주세요
          </T>
        </div>
        {[
          '주민등록번호 뒷자리, 가족 정보, 금액·계좌번호, 연락처는 가린 뒤 올려 주세요.',
          "이름과 주소의 '시'는 꼭 보이게 남겨 주세요. (예: 서울특별시, 경기도 수원시)",
          '구·동·번지 등 나머지 주소는 가려 주세요.',
          '가리지 않은 서류는 병원이 다시 요청할 수 있어요.',
        ].map(t => (
          <div key={t} className="ula-bullet">
            <T s="b2" c="gray-70">
              {'  •'}
            </T>
            <T s="b2" c="gray-70">
              {t}
            </T>
          </div>
        ))}
      </div>
      <div className="ula-abuse">
        <IconCaution color="#FA4655" size={18} />
        <T s="b2" w={6} c="gray-80" style={{ flex: 1 }}>
          진료받는 분의 서류만 첨부해 주세요. 다른 사람의 명의나 서류를 쓰는 것은 법으로 금지돼 있어요.
          {law(['no-identity-theft'])}
        </T>
      </div>
      <div className="ula-col" style={{ gap: 10 }}>
        <T s="b2" w={6} c="gray-80">
          이렇게 가려 주세요
        </T>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {PROOF_DOCS.filter(d => RESID_DOCS[resid].includes(d.key)).map(d => (
            <button key={d.key} className={`ula-preset is-small ${proofDoc === d.key ? 'is-on' : ''}`} onClick={() => setProofDoc(d.key)}>
              {d.tab}
            </button>
          ))}
        </div>
        <ProofDocMock doc={PROOF_DOCS.find(d => d.key === proofDoc)!} />
        <div className="ula-legend">
          <span>
            <i className="is-keep" />
            남길 곳
          </span>
          <span>
            <i className="is-mask" />
            가릴 곳
          </span>
        </div>
      </div>
      <div className="ula-col" style={{ gap: 12 }}>
        {!proofFile ? (
          <button className="ula-upload" onClick={() => { setAttachedDoc(proofDoc); setProof(true, false); }}>
            <IconCamera />
            <span>서류 첨부하기</span>
          </button>
        ) : (
          <div className="ula-proof-file">
            <span className="ula-proof-thumb">
              <ProofDocMock doc={PROOF_DOCS.find(d => d.key === (RESID_DOCS[resid].includes(attachedDoc) ? attachedDoc : proofDoc))!} mini />
            </span>
            <T s="b2" c="gray-80" style={{ flex: 1 }}>
              {resid === 'resident' ? '주민등록표 등본·초본 1장' : '실거주지 서류 1장'}
            </T>
            <button className="ula-proof-del" onClick={() => setProof(false, false)} aria-label="첨부 삭제">
              <IconClose />
            </button>
          </div>
        )}
        {proofFile && (
          <button className="ula-check" onClick={() => setProof(true, !proofChecked)}>
            <IconCheckRound on={proofChecked} />
            <T s="b1" w={proofChecked ? 6 : 5} c={proofChecked ? 'gray-90' : 'gray-70'}>
              주민등록번호 뒷자리·가족 정보·금액·계좌번호·연락처를 가렸어요
            </T>
          </button>
        )}
      </div>
    </div>
  );

  /* ② 신청서 (현행 + 진료 방식 수정) — SymptomScreen.tsx:226-342 */
  const methodBtnClass = (m: Method) => (method === m ? 'filled-gray' : 'outlined-gray');
  const FormScreen = (
    <>
      <NavBar left={{ icon: 'back', onPress: () => go('target') }} right={{ icon: '다른진료 선택' }} />
      <div className="ula-scroll" ref={scrollRef}>
        {/* SelectedDepartmentInformation/index.tsx:36-131 */}
        <div className="ula-col" style={{ padding: '24px 20px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <T s="h3" w={7}>
              {dept.name}
            </T>
            <div className="ula-srv" style={{ width: 48, height: 48, marginRight: 8, borderRadius: 24 }}>
              서버
              <br />
              이미지
            </div>
          </div>
          {phoneEnabled ? (
            <div className="ula-col ula-changed" style={{ gap: 20, paddingBottom: 20 }}>
              <div className="ula-col" style={{ gap: 4 }}>
                <T s="h5" w={7} c="gray-90">
                  진료 방식(필수)
                  {law(['phone-condition', 'visual-diseases'])}
                </T>
                <T s="b2" c="gray-80">
                  선호하는 방식을 선택해 주세요.
                </T>
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                <button className={`ula-btn is-flex ${methodBtnClass('phone')}`} onClick={() => setMethod('phone')}>
                  전화 진료
                </button>
                <button className={`ula-btn is-flex ${methodBtnClass('video')}`} onClick={() => setMethod('video')}>
                  화상 진료
                </button>
              </div>
              {method === 'video' && (
                <T s="b2" c="gray-70">
                  진료가 시작되면 의사에게 신분증이나 건강보험증을 화면으로 보여 주세요.
                  {law(['identity-check'])}
                </T>
              )}
            </div>
          ) : (
            /* 전화를 고를 수 없으면(초진·예외·13세 미만·전화 숨김 과) 선택 칸 대신 안내 한 줄 */
            <div className="ula-method-info ula-changed">
              <IconInformation color="#808799" size={18} />
              <div className="ula-col" style={{ gap: 2, flex: 1 }}>
                <T s="b2" w={6} c="gray-80">
                  화상 진료로 진행돼요
                  {law(['phone-condition', 'visual-diseases'])}
                </T>
                <T s="b2" c="gray-70">
                  신청하면 바로 연결되지 않아요. 의사가 진료를 시작하면 알림을 보내드리니, 진료내역에서 '진료실 입장하기'를 눌러 주세요.
                </T>
                <T s="b2" c="gray-70">
                  진료가 시작되면 의사에게 신분증이나 건강보험증을 화면으로 보여 주세요.
                  {law(['identity-check'])}
                </T>
              </div>
            </div>
          )}
          <div className="ula-col" style={{ gap: 4, paddingTop: 20, paddingBottom: 8 }}>
            <T s="h5" w={7}>
              상세 증상
            </T>
            <T s="b2" c="gray-80">
              발생 시점, 경과, 불편한 정도 등을 작성해 주세요.
            </T>
          </div>
        </div>
        <div className="ula-hscroll" style={{ padding: '8px 20px' }}>
          {dept.presets.map(p => (
            <button
              key={p}
              className={`ula-preset ${presets.includes(p) ? 'is-on' : ''}`}
              onClick={() => setPresets(prev => (prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]))}>
              {p}
            </button>
          ))}
        </div>
        {/* InputSymptom/index.tsx:27-97 */}
        <div className="ula-col" style={{ gap: 12, paddingBottom: 12 }}>
          <div className="ula-textarea">
            <textarea
              maxLength={200}
              value={symptom}
              onChange={e => setSymptom(e.target.value)}
              placeholder={' • 복용 중인 약\n • 알레르기 및 선천적 질환\n • 건강 관련 특이사항\n'}
            />
            <T s="b2" c="gray-60" style={{ textAlign: 'right' }}>
              {`${symptom.length} / 200`}
            </T>
          </div>
          {s.count === 'again' && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0 20px' }}>
              <button
                style={{ display: 'flex', alignItems: 'center', gap: 4, border: '1px solid var(--gray-30)', borderRadius: 6, padding: '8px 14px', background: 'var(--white)', cursor: 'pointer' }}>
                <T s="c1" w={6} c="gray-80">
                  최근 입력한 증상
                </T>
                <T s="c1" w={6} c="blue-60">
                  1
                </T>
                <IconArrowForward />
              </button>
            </div>
          )}
        </div>
        {/* PrescriptionGuide/index.tsx:7-71 — 현행 그대로 */}
        <div className="ula-guide" style={{ margin: '0 20px' }}>
          <div className="ula-col">
            <div className="ula-guide-title">
              <IconCaution color="#FB7480" />
              <T s="b2" w={6} c="gray-80">
                처방 불가한 약
                {law(['rx-banned'], '성기능약은 고시 목록에 없지만 굿닥 운영 기준으로 비대면 처방을 하지 않아요. 나머지 문구(다이어트약·일부 진통제 등)는 현행 앱 그대로예요.')}
              </T>
            </div>
            <div className="ula-bullet">
              <T s="b2" c="gray-70">
                {'  •'}
              </T>
              <T s="b2" c="gray-70">
                사후피임약 · 다이어트약 · 성기능약 · 일부 진통제
              </T>
            </div>
          </div>
          <div className="ula-col">
            <div className="ula-guide-title">
              <IconCaution color="#FB7480" />
              <T s="b2" w={6} c="gray-80">
                진료 제한될 수 있는 경우
              </T>
            </div>
            <div className="ula-bullet">
              <T s="b2" c="gray-70">
                {'  •'}
              </T>
              <T s="b2" c="gray-70">
                심한 복통 · 흉통 · 고열 · 호흡곤란 등의 증상
              </T>
            </div>
            <div className="ula-bullet">
              <T s="b2" c="gray-70">
                {'  •'}
              </T>
              <T s="b2" c="gray-70">
                만 2세 이하 소아 · 임산부
              </T>
            </div>
          </div>
        </div>
        {/* UploadImage/index.tsx:32-141 */}
        <div className="ula-col" style={{ gap: 20, paddingTop: 20, paddingBottom: 36, borderBottom: '8px solid var(--gray-20)' }}>
          <div className="ula-col" style={{ gap: 4, padding: '16px 20px 0' }}>
            <T s="h5" w={7} c="gray-90">
              참고 사진
            </T>
            <T s="b2" c="gray-80">
              증상 부위, 복용 약 사진 등을 첨부해 주세요.
            </T>
          </div>
          <div style={{ padding: '0 20px' }}>
            <div
              style={{ width: 96, height: 96, border: '1px solid var(--gray-30)', borderRadius: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <IconCamera />
              <div style={{ display: 'flex', marginTop: 6, fontSize: 14, lineHeight: '21px' }}>
                <span style={{ color: 'var(--gray-60)' }}>0</span>
                <span style={{ color: 'var(--gray-60)' }}>/5</span>
              </div>
            </div>
          </div>
        </div>
        {s.target === 'first' && ProofSection}
        {s.target === 'exception' && ExSection}
        {/* RRNAgreementTerm/index.tsx:13-110 (SymptomScreen.tsx:289, paddingHorizontal 40 → marginHorizontal -20 상쇄) */}
        <div className="ula-col" style={{ background: 'var(--gray-20)', marginTop: 32, padding: '16px 20px' }}>
          <T s="b2" c="gray-60">
            주민등록번호 수집 및 이용 근거 법률 안내
          </T>
          <div className="ula-col" style={{ margin: '9.5px 0', paddingBottom: 12 }}>
            <T s="b2" c="gray-50">
              본 병원은 아래 근거 법령에 따라 주민등록번호를 수집ㆍ이용하고 있습니다.
            </T>
            <div style={{ height: 21 }} />
            <div className="ula-bullet" style={{ gap: 6 }}>
              <span style={{ width: 8, height: 21, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ width: 4, height: 4, borderRadius: 2, background: 'var(--gray-50)' }} />
              </span>
              <T s="b2" c="gray-50">
                의료법 제17조의 의무 이행을 위하여 동법 시행령 제42조의2에 의거하여 환자의 주민등록번호를 수집 및 이용하고 있습니다.
              </T>
            </div>
            <div className="ula-bullet" style={{ gap: 6, marginTop: 4 }}>
              <span style={{ width: 8, height: 21, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ width: 4, height: 4, borderRadius: 2, background: 'var(--gray-50)' }} />
              </span>
              <T s="b2" c="gray-50">
                본 병원은 (주)굿닥(대표전화 1661-8173)에 환자의 병원 예약ㆍ접수ㆍ전송ㆍ보관 업무와 관련한 개인정보 처리를 위탁합니다. (주)굿닥은 상호간 계약 만료 일까지 환자의 개인정보에 접근할 수 있습니다.
              </T>
            </div>
          </div>
          <T s="b2" c="gray-60">
            개인정보 처리 위탁 사실 안내
          </T>
          <T s="b2" c="gray-50" style={{ marginTop: 9.5, paddingBottom: 12 }}>
            본 병원은 (주)굿닥(대표전화 1661-8173)에 환자의 병원 예약ㆍ접수ㆍ전송ㆍ보관 업무와 관련한 개인정보 처리를 위탁합니다. (주)굿닥은 상호간 계약 만료 일까지 환자의 개인정보에 접근할 수 있습니다.
          </T>
        </div>
      </div>
      {formPending && <p className="ula-cta-hint">{formHint}</p>}
      <button className="ula-btn filled-blue ula-cta" disabled={formPending} onClick={() => go('consent')}>
        다음
      </button>
    </>
  );

  /* ③ 비대면진료 안내·동의 (신규) */
  const isAgain = s.count === 'again';
  const ConsentScreen = (
    <>
      <NavBar left={{ icon: 'back', onPress: () => go('form') }} />
      <div className="ula-scroll" ref={scrollRef}>
        <div className="ula-col" style={{ padding: '24px 20px 20px', gap: 8 }}>
          <T s="h3" w={7}>
            {'비대면진료 전에\n꼭 확인해 주세요'}
          </T>
        </div>
        <div className="ula-col" style={{ padding: '0 20px', gap: 12 }}>
          <div className="ula-guide">
            <div className="ula-guide-title">
              <IconCaution color="#FB7480" />
              <T s="b2" w={6} c="gray-80" style={{ flex: 1 }}>
                {RESPONSIBILITY[s.target ?? 'first']}
                {law(['platform-notice'])}
              </T>
            </div>
            {s.who === 'child' && (
              <div className="ula-guide-title">
                <IconInformation color="#808799" />
                <T s="b2" c="gray-70" style={{ flex: 1 }}>
                  자녀의 진료는 가족 등록 때 받은 법정대리인 동의로 진행돼요
                  {law(['guardian'])}
                </T>
              </div>
            )}
          </div>
          {!isAgain &&
            LAW_EXPLAINS.map((x, i) => (
              <div className="ula-explain" key={x.title}>
                <span className="ula-explain-no">{i + 1}</span>
                <div className="ula-col" style={{ gap: 4, flex: 1 }}>
                  <T s="b1" w={6} c="gray-90">
                    {x.title} <span className="ula-draft">가안</span>
                    {law(['explain-4'])}
                  </T>
                  <T s="b2" c="gray-70">
                    {x.body}
                  </T>
                </div>
              </div>
            ))}
        </div>
        <div style={{ flex: 1, minHeight: 24 }} />
      </div>
      <div style={{ padding: '16px 20px 0', borderTop: '1px solid var(--gray-30)' }}>
        <button className="ula-check" onClick={() => setConsent(v => !v)}>
          <IconCheckRound on={consent} />
          <T s="b1" w={consent ? 6 : 5} c={consent ? 'gray-90' : 'gray-70'}>
            위 내용을 모두 확인했고, 비대면진료를 받는 데 동의해요
          </T>
        </button>
      </div>
      <p className="ula-cta-hint is-gray">
        다음 화면에서 결제 수단을 선택해요.
        <br />
        진료비는 진료가 끝난 뒤 결제돼요.
      </p>
      <button className="ula-btn filled-blue ula-cta" disabled={!consent} onClick={() => go('payment')}>
        다음
      </button>
    </>
  );

  /* 결제 (현행 · 간단) — PaymentMethodSelectScreen/index.tsx:442-846 */
  const allAgreed = terms.every(Boolean);
  const PaymentScreen = (
    <>
      <NavBar left={{ icon: 'back', onPress: () => go('consent') }} />
      <div className="ula-scroll" ref={scrollRef}>
        <div className="ula-col" style={{ padding: '16px 20px 32px', gap: 12 }}>
          <T s="h3" w={7}>
            결제 방법을 선택해 주세요
          </T>
        </div>
        <div className="ula-col" style={{ gap: 20 }}>
          <div style={{ display: 'flex', gap: 8, padding: '0 20px' }}>
            <button className="ula-btn is-flex filled-blue">신용/체크카드</button>
            <button className="ula-btn is-flex outlined-gray">
              카카오페이
            </button>
          </div>
          <div style={{ padding: '0 20px' }}>
            <div className="ula-srv" style={{ width: 240, height: 160, borderRadius: 16, fontSize: 12 }}>
              {'{등록된 결제수단 카드}'}
            </div>
          </div>
        </div>
        <div className="ula-col" style={{ gap: 16, padding: 20 }}>
          <T s="h4" w={7}>
            필수 약관
          </T>
          <div className="ula-col">
            {PAYMENT_TERMS.map((title, i) => (
              <div key={title} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0' }}>
                <button
                  style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer', display: 'flex' }}
                  onClick={() => setTerms(prev => prev.map((v, j) => (j === i ? !v : v)))}>
                  <IconCheckSharp on={terms[i]} />
                </button>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <T s="b2" w={7} c="gray-60">
                    {title}
                  </T>
                  <span style={{ paddingRight: 8, display: 'flex' }}>
                    <IconArrowRight color="#A8AEBD" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="ula-col" style={{ background: 'var(--gray-15)', gap: 10, padding: 20 }}>
          <T s="c1" w={7} c="gray-60">
            결제 전 확인해 주세요.
          </T>
          {[
            '진료 후 병원에서 진료비를 책정하며, 예상 진료비는 의사에게 문의해 주세요.',
            '진료비는 미리 등록한 결제 수단으로 진료 후 자동 결제됩니다.\n진료가 완료되기 전에는 결제되지 않아요.',
            '처방전, 제증명은 진료비 결제 후 발급돼요.',
          ].map(line => (
            <div key={line} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <span style={{ width: 3, height: 3, borderRadius: 2, background: 'var(--gray-60)', marginTop: 8, flexShrink: 0 }} />
              <T s="c1" c="gray-60" style={{ flex: 1 }}>
                {line}
              </T>
            </div>
          ))}
        </div>
        <div style={{ padding: '16px 20px' }}>
          {allAgreed ? (
            <button className="ula-btn filled-blue" style={{ width: '100%' }} onClick={() => go('done')}>
              진료 신청하기
            </button>
          ) : (
            <button className="ula-btn tonal-blue" style={{ width: '100%' }} onClick={() => setTerms(PAYMENT_TERMS.map(() => true))}>
              약관 전체 동의하기
            </button>
          )}
        </div>
      </div>
    </>
  );

  /* 신청 완료 (현행) — DoctorMatchingCompletedScreen.tsx:53-179 */
  const DoneScreen = (
    <>
      <NavBar right={{ icon: 'close', onPress: () => go('doctor') }} />
      <div className="ula-col" style={{ flex: 1, alignItems: 'center', padding: '0 20px', position: 'relative' }}>
        <T s="h3" w={7} style={{ marginTop: 8, padding: '8px 0', textAlign: 'center' }}>
          {'{의사명} 의사가\n신청서를 확인하고 있어요'}
        </T>
        <T s="b1" c="gray-80" style={{ marginBottom: 40, padding: '8px 16px', textAlign: 'center' }}>
          진료가 확정되면 카카오톡으로 알려드릴게요
        </T>
        <img src={doctorAvatar} alt="" width={120} height={120} style={{ borderRadius: 60 }} />
        <div className="ula-col" style={{ background: 'var(--gray-20)', borderRadius: 12, marginTop: 32, padding: '12px 20px', width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
            <T s="b1" w={5} c="gray-60">
              진료일시
            </T>
            <T s="b1" w={6} c="gray-70">
              의사 확인중
            </T>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
            <T s="b1" w={5} c="gray-60">
              진료항목
            </T>
            <T s="b1" w={6} c="gray-70">
              {dept.name}
            </T>
          </div>
        </div>
        <button className="ula-btn filled-blue" style={{ position: 'absolute', left: 20, right: 20, bottom: 12 }} onClick={() => go('detail')}>
          신청 내역 보기
        </button>
      </div>
    </>
  );

  /* ④ 진료내역 상세 · 병원 취소 (수정) — UntactTreatmentDetailScreen.tsx:105-137 */
  const symptomsText =
    presets.length > 0 ? `증상: ${presets.join(', ')}${symptom ? `\n${symptom}` : ''}` : symptom || '';
  const cancelText = CANCEL_REASONS.find(r => r.key === s.cancel)!.app;
  const InfoRow = ({ title, children, bold }: { title: string; children: React.ReactNode; bold?: boolean }) => (
    <div className="ula-info-row">
      <T s="b1" c="gray-60">
        {title}
      </T>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
        {typeof children === 'string' ? (
          <T s="b1" w={bold ? 7 : 4} c={bold ? 'gray-80' : 'gray-90'} style={{ flexShrink: 1 }}>
            {children}
          </T>
        ) : (
          children
        )}
        {bold && <IconArrowRight color="#434956" />}
      </div>
    </div>
  );
  const DetailScreen = (
    <>
      <NavBar left={{ icon: 'close', onPress: () => go('doctor') }} right={{ icon: '진료내역' }} />
      <div className="ula-scroll" ref={scrollRef}>
        {/* TreatmentStatus.tsx:90-116 · useTreatmentStatus.tsx:831-835 (Cancel 문구 현행 그대로) */}
        <div className="ula-col" style={{ gap: 20, padding: 20 }}>
          <div className="ula-col" style={{ gap: 8 }}>
            <T s="h3" w={7}>
              {'병원에서\n진료를 취소했어요'}
            </T>
            <T s="b1" c="gray-70">
              아래 취소 사유를 확인해 주세요
            </T>
          </div>
          {/* StatusProgress — Cancel 은 dotStatus default(접수·left·진행중) */}
          <div className="ula-progress">
            {['접수', '진료', '조제', '수령'].map((label, i) => (
              <div className="ula-progress-item" key={label}>
                <div className="ula-progress-line-wrap">
                  <div className="ula-progress-line" />
                  {i === 0 && <div className="ula-progress-dot" />}
                </div>
                <div style={{ paddingLeft: 4 }}>
                  <T s="c1" w={6} c={i === 0 ? 'gray-70' : 'gray-50'}>
                    {label}
                  </T>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* TreatmentHistoryTabBar.tsx:11-58 */}
        <div className="ula-tabbar">
          {(['hospital', 'pharmacy'] as const).map(k => (
            <button key={k} className={`ula-tab ${tab === k ? 'is-on' : ''}`} onClick={() => setTab(k)}>
              <T s="b1" w={7} c={tab === k ? 'gray-90' : 'gray-60'}>
                {k === 'hospital' ? '병원' : '약국'}
              </T>
            </button>
          ))}
        </div>
        {tab === 'hospital' ? (
          /* InformationView.tsx:9-35 · TreatmentInformation.tsx:47-113 */
          <div className="ula-col" style={{ margin: '0 20px', padding: '32px 0', gap: 20 }}>
            <T s="h5" w={7}>
              진료 정보
            </T>
            <div className="ula-col" style={{ gap: 12 }}>
              <div className="ula-changed">
                <InfoRow title="취소사유">{cancelText}</InfoRow>
              </div>
              <InfoRow title="요청일시">{'{YYYY. MM. DD (ddd) HH:mm}'}</InfoRow>
              <InfoRow title="진료대상">{s.who === 'child' ? '{자녀 이름}' : '{환자 이름}'}</InfoRow>
              <InfoRow title="병원명" bold>
                {'{병원명}'}
              </InfoRow>
              <InfoRow title="의사명" bold>
                {'{의사명} 의사'}
              </InfoRow>
              <InfoRow title="진료항목">{dept.name}</InfoRow>
              {symptomsText && <InfoRow title="상세증상">{symptomsText}</InfoRow>}
            </div>
          </div>
        ) : (
          <div className="ula-srv" style={{ margin: 20, height: 160, borderRadius: 8 }}>
            {'{약국 탭 — 현행, 이 프로토 범위 밖}'}
          </div>
        )}
      </div>
    </>
  );

  const screens: Record<Step, React.ReactNode> = {
    doctor: DoctorScreen,
    target: TargetScreen,
    form: FormScreen,
    consent: ConsentScreen,
    payment: PaymentScreen,
    done: DoneScreen,
    detail: DetailScreen,
  };

  /* 화면별 메모 (패널) */
  const notes: Record<Step, string[]> = useMemo(
    () => ({
      doctor: ['현행 의사 상세의 하단 버튼만 재현. 진료예약·바로진료 모두 ①로 이어진다(환자 선택 화면 생략).'],
      target: [
        '신청서 앞에 새로 들어가는 화면.',
        '초진을 고르면 바로 아래에 초진 안내 한 블록. 재진·예외 대상이면 안내 없음.',
        '재신청이면 초진 안내를 한 줄로 접는다(눌러서 펼침).',
        '거주지 서류는 초진일 때 ② 신청서에서 첨부한다(D8). 플랫폼은 주소를 입력받거나 비교하지 않는다.',
      ],
      form: [
        '바뀐 곳은 진료 방식과 거주지(초진만, 점선). 화상 진료 기본 선택.',
        '진료 방식 선택 칸은 재진 + 13세 이상 + 일반 과일 때만. 그 밖은 화상 진료 안내(바로 연결 안 됨 · 알림 · 진료실 입장하기).',
        '처방 불가 약 안내는 현행 그대로. 초진 제한은 ①에만.',
        '거주지(초진 필수): 세그먼트 등본상 주소지(등본·초본) / 실거주지(임대차계약서·재직·재학증명서·공공요금 납부자료). 가림 안내·부정 이용 방지 안내·서류별 가림 예시. 첨부 + 가림 확인 체크 전에는 다음 비활성.',
      ],
      consent: [
        '신청서 다음, 결제 앞에 새로 들어가는 화면.',
        '첫 신청: 법정 설명 4가지(시행규칙안 31조의9를 옮긴 가안) + 책임 문구 + 동의. 재신청: 책임 문구 한 줄 + 동의.',
        '자녀 진료면 법정대리인 동의 안내 한 줄 추가.',
        '체크 전에는 다음 버튼 비활성.',
      ],
      payment: ['현행 결제 화면을 간단히 재현. 약관 전체 동의 → 진료 신청하기.'],
      done: ['현행 신청 완료 화면. 신청 내역 보기 → ④(병원이 취소한 뒤 상태로 바로 보여 줌).'],
      detail: [
        '병원이 진료를 취소한 상태. 진료 정보 첫 줄에 취소사유(점선)를 추가.',
        '상단 제목·보조 문구를 사유 표시에 맞췄다(병원에서 진료를 취소했어요 / 아래 취소 사유를 확인해 주세요).',
        '하단 버튼은 현행대로 없음.',
      ],
    }),
    [],
  );

  const Seg = <K extends string>({
    label,
    value,
    options,
    onChange,
    col,
  }: {
    label: string;
    value: K | null;
    options: { k: K; t: string; disabled?: boolean }[];
    onChange: (k: K) => void;
    col?: boolean;
  }) => (
    <div className="ula-ctl-row">
      <span className="ula-ctl-label">{label}</span>
      <div className={`ula-seg ${col ? 'ula-seg-col' : ''}`}>
        {options.map(o => (
          <button key={o.k} className={value === o.k ? 'is-on' : ''} disabled={o.disabled} onClick={() => onChange(o.k)}>
            {o.t}
          </button>
        ))}
      </div>
    </div>
  );

  const stepMeta = STEPS.find(x => x.key === s.step)!;

  return (
    <div className={`ula-root${marksOn ? '' : ' is-marks-off'}`}>
      <aside className="ula-panel">
        <div className="ula-panel-card">
          <p className="ula-panel-title">비대면진료 신청 · 제도화 대응</p>
          <p className="ula-panel-sub">굿닥 앱(환자용) · 검토용 초안 v0.8 · 현행 화면은 앱 코드 기준 재현, 동적 값은 {'{중괄호}'}</p>
        </div>
        <div className="ula-panel-card ula-lawcard">
          <div>
            <p className="ula-panel-h" style={{ margin: 0 }}>
              바뀐 곳 점선 표시
            </p>
            <p className="ula-panel-sub">끄면 화면의 보라 점선을 숨겨요.</p>
          </div>
          <button type="button" role="switch" aria-checked={marksOn} className={`ula-switch ${marksOn ? 'is-on' : ''}`} onClick={() => setMarksOn(v => !v)}>
            <span />
          </button>
        </div>
        <div className="ula-panel-card ula-lawcard">
          <div>
            <p className="ula-panel-h" style={{ margin: 0 }}>
              근거 법령 보기
            </p>
            <p className="ula-panel-sub">켜면 정보 옆 '법령'을 눌러 근거 조문을 볼 수 있어요(입법예고안 기준).</p>
          </div>
          <button type="button" role="switch" aria-checked={lawOn} className={`ula-switch ${lawOn ? 'is-on' : ''}`} onClick={() => setLawOn(v => !v)}>
            <span />
          </button>
        </div>
        <div className="ula-panel-card">
          <p className="ula-panel-h">화면 바로 가기</p>
          <div className="ula-jumps">
            {STEPS.map(st => (
              <button key={st.key} className={`ula-jump ${s.step === st.key ? 'is-on' : ''}`} onClick={() => go(st.key)}>
                <span>{st.label}</span>
                <span className={`ula-badge is-${st.kind}`}>{KIND_LABEL[st.kind]}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="ula-panel-card ula-ctl">
          <p className="ula-panel-h" style={{ margin: 0 }}>
            상태
          </p>
          <Seg
            label="진료 대상"
            value={s.target}
            options={[
              { k: 'first', t: '초진' },
              { k: 'revisit', t: '재진' },
              { k: 'exception', t: '예외' },
            ]}
            onChange={k => setTarget(k)}
          />
          <Seg
            label="진료 받는 사람"
            value={s.who}
            options={[
              { k: 'self', t: '본인' },
              { k: 'child', t: '자녀' },
            ]}
            onChange={k => set({ who: k })}
          />
          <Seg
            label="신청 횟수"
            value={s.count}
            options={[
              { k: 'first', t: '첫 신청' },
              { k: 'again', t: '재신청' },
            ]}
            onChange={k => set({ count: k })}
          />
          <Seg
            label="진료과"
            value={s.dept}
            options={[
              { k: 'general', t: '일반' },
              { k: 'nophone', t: '전화 숨김 과' },
            ]}
            onChange={k => set({ dept: k })}
          />
          <Seg
            label="나이"
            value={s.age}
            options={[
              { k: 'over13', t: '13세 이상' },
              { k: 'under13', t: '13세 미만' },
            ]}
            onChange={k => set({ age: k })}
          />
          <Seg
            label="② 거주지 서류(초진)"
            value={s.proof}
            options={[
              { k: 'none', t: '첨부 없음' },
              { k: 'attached', t: '첨부함', disabled: s.target !== 'first' },
            ]}
            onChange={k => setProof(k === 'attached', k === 'attached')}
          />
          <Seg
            label="④ 취소 사유"
            value={s.cancel}
            col
            options={CANCEL_REASONS.map(r => ({ k: r.key, t: r.text }))}
            onChange={k => set({ cancel: k })}
          />
        </div>
        <div className="ula-panel-card">
          <p className="ula-panel-h">이 화면</p>
          <ul className="ula-note">
            {notes[s.step].map(n => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </div>
      </aside>
      <div className="ula-stage">
        <span className="ula-stage-cap">
          {stepMeta.label} · {KIND_LABEL[stepMeta.kind]}
        </span>
        <section className="ula-phone">
          <div className="ula-statusbar">9:41</div>
          <div className="ula-col" style={{ flex: 1, minHeight: 0 }}>
            {screens[s.step]}
          </div>
          <div className="ula-homebar" />
        </section>
      </div>
      {lawView && (
        <div className="ula-lawmodal" onClick={() => setLawView(null)}>
          <div className="ula-lawmodal-box" role="dialog" aria-label="근거 법령" onClick={e => e.stopPropagation()}>
            <div className="ula-lawmodal-head">
              <p>근거 법령</p>
              <button type="button" aria-label="닫기" onClick={() => setLawView(null)}>
                ×
              </button>
            </div>
            <div className="ula-lawmodal-body">
              {lawView.note && <p className="ula-lawnote">{lawView.note}</p>}
              {lawView.ids.map(id => {
                const l = LAW[id];
                return (
                  <div key={id} className="ula-lawitem">
                    <p className="ula-lawitem-doc">{l.doc}</p>
                    <p className="ula-lawitem-art">
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
    </div>
  );
}
