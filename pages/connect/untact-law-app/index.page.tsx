/**
 * ─────────────────────────────────────────────────────────────
 * 이름      : untact-law-app — 굿닥 앱(환자용) 비대면진료 신청 흐름 · 비대면진료 제도화(의료법 개정) 대응
 * 상태      : 검토용 초안 · v0.3 · 최종수정 2026-11-20 · 샌드박스 배포
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
 *  - [확정·요청] 거주지·대면 이력은 플랫폼이 검증하지 않는다. 주소 입력·비교·차단 화면 없음.
 *  - [확정·요청] ② 진료 방식은 화상 진료 기본 선택. 전화 진료는 재진만 선택 가능(초진·예외는 비활성 + '재진만 선택 가능').
 *    13세 미만이거나 전화 숨김 과(피부·안과·이비인후·외상·정신)면 전화 진료 항목 자체를 숨긴다.
 *  - [확정·요청] ② 처방 불가 약 안내(PrescriptionGuide)는 현행 문구 그대로.
 *  - [확정·요청] ③ 첫 신청 = 제목 + 법정 설명 4가지(자리표시) + 책임 문구 1곳 + 동의 체크(체크 전 CTA 비활성).
 *    재신청 = 한 줄 재확인(책임 문구) + 체크. 자녀 진료 = 법정대리인 동의 안내 한 줄 추가.
 *  - [확정·요청] ④ 병원 취소 상태에서 취소 사유를 환자에게 보여 준다. 현행 진료 정보(DetailInfoRow) 목록에 '취소사유' 줄을 추가한다.
 *  - [유지·자체] ① 라디오는 현행 앱의 라디오 행(CancelReasonOptionRow) 모양을 쓰고, 좌우 여백만 화면 기준 20으로 맞췄다(원본 24).
 *  - [유지·자체] ① 초진 안내 상자는 ② 처방 안내(PrescriptionGuide) 상자 모양(GRAY_10 · r8 · p16 · 불릿)을 그대로 쓴다.
 *  - [유지·자체] ② 전화 진료 비활성은 outlined 버튼 비활성 색(GRAY_40) + 버튼 안 두 번째 줄 '재진만 선택 가능'(caption2_500).
 *    전화 진료를 숨기면 화상 진료 버튼 하나가 한 줄을 채운다.
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
 *  - [보류] ② '재진만 선택 가능'을 버튼 안 두 번째 줄로 둔 배치는 임의. 버튼 아래 캡션(현행 '※ 현재 의사 선생님 사정으로…' 자리)도 가능.
 *  - [보류] ② 의사의 videoTreatmentEnabled=false(화상 진료 불가 의사)와 '초진은 화상만'이 겹치면 초진 환자는 신청 경로가 없다. 의사 목록 단계 처리 필요(범위 밖).
 *  - [보류] 나이 13세 미만 + 진료 받는 사람 본인 조합은 막지 않았다(토글 독립).
 *  - [보류] ③ 법정 설명 4가지 문구 미확정(자리표시).
 *
 * 변경 이력
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

const TARGETS: { key: Target; title: string; desc: string }[] = [
  { key: 'revisit', title: '재진', desc: '이 병원에서 6개월 안에 같은 증상으로 대면진료를 받았어요' },
  { key: 'first', title: '초진', desc: '처음이거나, 6개월이 지났거나, 증상이 달라요' },
  { key: 'exception', title: '예외 대상', desc: '희귀질환·제1형 당뇨·등록장애인·장기요양수급자 등' },
];

const CANCEL_REASONS: { key: CancelReason; text: string }[] = [
  { key: 'notTarget', text: '비대면 진료 대상 환자가 아닙니다' },
  { key: 'needVisit', text: '대면 진료가 필요한 증상입니다' },
  { key: 'noContact', text: '환자와 연락이 되지 않습니다' },
];

/* 진료과: 일반은 실제 캡처(UNT-FRM-01) 값, 전화 숨김 과는 이름만 임의 */
const DEPTS: Record<Dept, { name: string; presets: string[] }> = {
  general: { name: '감기·비염', presets: ['콧물', '코막힘', '인후통', '삼킴곤란', '기침'] },
  nophone: { name: '피부과', presets: ['{증상 프리셋 1}', '{증상 프리셋 2}', '{증상 프리셋 3}'] },
};

/* 법이 정한 설명 4가지 — 문구 미확정 자리표시 */
const LAW_EXPLAINS = ['설명 1', '설명 2', '설명 3', '설명 4'];
const RESPONSIBILITY =
  '주소지·대면 이력은 진료 전에 의료기관이 확인하며, 조건에 맞지 않으면 진료가 취소될 수 있어요';

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

/* ---------- 상태 ---------- */
type State = {
  step: Step;
  target: Target | null;
  who: Who;
  count: Count;
  dept: Dept;
  age: Age;
  cancel: CancelReason;
};

export default function UntactLawApp() {
  /* 검토용 URL 파라미터: ?step=form&target=first&who=child&count=again&dept=nophone&age=under13&cancel=needVisit */
  const [s, setS] = useState<State>(() => {
    const init: State = {
      step: 'doctor',
      target: null,
      who: 'self',
      count: 'first',
      dept: 'general',
      age: 'over13',
      cancel: 'notTarget',
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
    } catch {
      /* 파라미터 없음 */
    }
    return init;
  });
  const set = (p: Partial<State>) => setS(prev => ({ ...prev, ...p }));

  /* 신청서 입력값 (④까지 이어짐) */
  const [method, setMethod] = useState<Method>('video');
  const [presets, setPresets] = useState<string[]>([]);
  const [symptom, setSymptom] = useState('');
  const [consent, setConsent] = useState(false);
  const [terms, setTerms] = useState<boolean[]>(PAYMENT_TERMS.map(() => false));
  const [firstOpen, setFirstOpen] = useState(false);
  const [tab, setTab] = useState<'hospital' | 'pharmacy'>('hospital');

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
    '화상 진료만 가능해요',
    '내 주소지와 같은 시·도의 의원에서만 진료받을 수 있어요',
    '처방은 7일까지예요. 먹는 여드름약(이소트레티노인)·트라마돌은 처방 안 돼요',
  ];
  const FirstGuide =
    s.count === 'again' && !firstOpen ? (
      <button
        className="ula-guide"
        style={{ flexDirection: 'row', alignItems: 'center', gap: 6, border: 0, width: '100%', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit' }}
        onClick={() => setFirstOpen(true)}>
        <IconInformation color="#808799" size={18} />
        <T s="c1" c="gray-70" style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          화상 진료 · 같은 시·도 의원 · 처방 7일까지
        </T>
        <IconArrowForward rotate={90} />
      </button>
    ) : (
      <div className="ula-guide">
        {firstGuideLines.map(line => (
          <div className="ula-bullet" key={line}>
            <T s="b2" c="gray-70">
              {'  •'}
            </T>
            <T s="b2" c="gray-70" style={{ flex: 1 }}>
              {line}
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
            어떤 진료를 받으시나요?
          </T>
          <T s="b1" c="gray-70">
            진료 대상에 따라 연결할 수 있는 의원이 달라요
          </T>
        </div>
        <div className="ula-col">
          {TARGETS.map(t => {
            const on = s.target === t.key;
            return (
              <React.Fragment key={t.key}>
                <button className="ula-radio-row" onClick={() => set({ target: t.key })}>
                  <span className={`ula-radio ${on ? 'is-on' : ''}`} />
                  <span className="ula-col" style={{ gap: 2, flex: 1 }}>
                    <T s="b1" w={on ? 7 : 5} c="gray-90">
                      {t.title}
                    </T>
                    <T s="b2" c="gray-60">
                      {t.desc}
                    </T>
                  </span>
                </button>
                {t.key === 'first' && on && <div style={{ padding: '0 20px 8px 54px' }}>{FirstGuide}</div>}
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
          <div className="ula-col ula-changed" style={{ gap: 20, paddingBottom: 20 }}>
            <div className="ula-col" style={{ gap: 4 }}>
              <T s="h5" w={7} c="gray-90">
                진료 방식(필수)
              </T>
              <T s="b2" c="gray-80">
                선호하는 방식을 선택해 주세요.
              </T>
            </div>
            <div style={{ display: 'flex', gap: 16 }}>
              {!phoneHidden && (
                <button
                  className={`ula-btn is-flex ${methodBtnClass('phone')}`}
                  disabled={!phoneEnabled}
                  onClick={() => setMethod('phone')}>
                  전화 진료
                  {!phoneEnabled && <span className="ula-btn-sub">재진만 선택 가능</span>}
                </button>
              )}
              <button className={`ula-btn is-flex ${methodBtnClass('video')}`} onClick={() => setMethod('video')}>
                화상 진료
              </button>
            </div>
          </div>
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
      <button className="ula-btn filled-blue ula-cta" onClick={() => go('consent')}>
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
                {RESPONSIBILITY}
              </T>
            </div>
            {s.who === 'child' && (
              <div className="ula-guide-title">
                <IconInformation color="#808799" />
                <T s="b2" c="gray-70" style={{ flex: 1 }}>
                  가족 등록 때 받은 법정대리인 동의로 진행돼요
                </T>
              </div>
            )}
          </div>
          {!isAgain &&
            LAW_EXPLAINS.map((label, i) => (
              <div className="ula-ph" key={label}>
                <span className="ula-ph-tag">자리표시 · 법정 설명 {i + 1} · 문구 미확정</span>
                <T s="b1" w={6} c="gray-90">
                  {label}
                </T>
                <T s="b2" c="gray-60">
                  {'{법이 정한 설명 문구}'}
                </T>
              </div>
            ))}
        </div>
        <div style={{ flex: 1, minHeight: 24 }} />
      </div>
      <div style={{ padding: '16px 20px 0', borderTop: '1px solid var(--gray-30)' }}>
        <button className="ula-check" onClick={() => setConsent(v => !v)}>
          <IconCheckRound on={consent} />
          <T s="b1" w={consent ? 6 : 5} c={consent ? 'gray-90' : 'gray-70'}>
            위 내용을 확인했고 동의해요
          </T>
        </button>
      </div>
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
  const cancelText = CANCEL_REASONS.find(r => r.key === s.cancel)!.text;
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
        '거주지·대면 이력은 플랫폼이 확인하지 않는다(주소 입력 없음).',
      ],
      form: [
        '바뀐 곳은 진료 방식(점선) 한 곳. 화상 진료 기본 선택.',
        '전화 진료: 재진만 선택 가능. 초진·예외는 비활성.',
        '13세 미만 또는 전화 숨김 과면 전화 진료 버튼 자체가 없다.',
        '처방 불가 약 안내는 현행 그대로. 초진 제한은 ①에만.',
      ],
      consent: [
        '신청서 다음, 결제 앞에 새로 들어가는 화면.',
        '첫 신청: 법정 설명 4가지(자리표시) + 책임 문구 + 동의. 재신청: 책임 문구 한 줄 + 동의.',
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
    options: { k: K; t: string }[];
    onChange: (k: K) => void;
    col?: boolean;
  }) => (
    <div className="ula-ctl-row">
      <span className="ula-ctl-label">{label}</span>
      <div className={`ula-seg ${col ? 'ula-seg-col' : ''}`}>
        {options.map(o => (
          <button key={o.k} className={value === o.k ? 'is-on' : ''} onClick={() => onChange(o.k)}>
            {o.t}
          </button>
        ))}
      </div>
    </div>
  );

  const stepMeta = STEPS.find(x => x.key === s.step)!;

  return (
    <div className="ula-root">
      <aside className="ula-panel">
        <div className="ula-panel-card">
          <p className="ula-panel-title">비대면진료 신청 · 제도화 대응</p>
          <p className="ula-panel-sub">굿닥 앱(환자용) · 검토용 초안 v0.3 · 현행 화면은 앱 코드 기준 재현, 동적 값은 {'{중괄호}'}</p>
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
              { k: 'revisit', t: '재진' },
              { k: 'first', t: '초진' },
              { k: 'exception', t: '예외' },
            ]}
            onChange={k => set({ target: k })}
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
    </div>
  );
}
