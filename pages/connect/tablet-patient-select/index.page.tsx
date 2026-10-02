/**
 * ─────────────────────────────────────────────────────────────
 * 이름      : tablet-patient-select — 태블릿 접수 '환자 조회 → 1. 환자 선택' · 새 환자 등록 오탭 UX 개선 체험판
 * 상태      : 검토용 초안 · v0.3 · 최종수정 2026-10-02
 * PRD       : 없음(VOC 기반). 병원 VOC: 조회된 본인 카드가 떠도 환자가 '새 환자 등록'을 눌러 정보를 처음부터 다시 입력(고령 재진 환자 중심, 하루 3명).
 *             사내 논의 링크는 공개 저장소라 미기재.
 * 배포URL   : https://connect-sq-sandbox.github.io/out/tablet-patient-select.html
 * 피그마    : 굿닥 태블릿 Design Library 2.0 · POC_대기화면_환자조회(8643:72136 입력 전 / 8643:72137 조회 중) · POC_대상선택(선택 전 8640:47875 / 선택완료 8642:71647)
 *             기준선: 2026-10-02 figma-reader 속성표
 * 관련 CSS  : styles/tabletPatientSelect.css (피그마 값 그대로 px, 1920×1200 프레임을 transform scale로 축소)
 * 에셋      : assets/tablet-patient-select/banner.png (피그마 하단 배너 래스터 원본 977×228). BI 심볼·워터마크는 goodoc-design 정본 logo_symbol.svg path.
 * 기술제약  : 샌드박스 빌드는 emotion/styled 금지 → plain CSS. 외부 요청 0. 가상 데이터·메모리 상태만.
 * 화면구성  : 상단 시안 선택(As-is/A/B/C) + 좌측 패널(바뀐 것 · 조회 시나리오 · 행동 기록 · 접힌 직접 조합) + 1920×1200 태블릿 프레임
 *             (대기화면 키패드 → 조회 중 → 환자 선택 | 새 환자 등록 직행 → 다음/등록 자리표시 · 확인 시트)
 *
 * 핵심 결정(why)
 *  - [확정·세화] As-is 화면은 피그마 POC_대기화면_환자조회·POC_대상선택을 값 그대로 재현한다(탑바 140, 카드 760×748, radius 36, CTA 144 등).
 *  - [확정·세화] 초기 환자 조회 시퀀스(대기화면 → 조회 중 → 결과)부터 체험한다.
 *  - [확정·세화] 키패드는 실제 번호 입력을 구현하지 않는다. 아무 키나 누르면 시나리오의 번호가 자동으로 채워지고 조회 중 모션 뒤 결과로 넘어간다.
 *  - [확정·세화] 조회 결과가 없으면 환자 선택 화면 없이 새 환자 등록으로 바로 이동한다. 환자 선택 화면의 '0명' 케이스는 없다.
 *    [유지·자체] 그 동선을 보여 주기 위해 조회 시나리오에 '없음 → 등록 직행'을 둔다(환자 선택 화면 옵션이 아니라 조회 결과 시나리오).
 *  - [확정·세화] 시안은 상단에서 As-is / A안 / B안 / C안 중 하나만 고른다. 이 선택이 화면을 정하는 유일한 진입점이고, 좌측은 "이 안에서 As-is 대비 바뀐 것"을 읽기 전용으로 보여 준다.
 *    개별 변수 토글은 접힌 '직접 조합(고급)'에 두고, 건드리면 상단이 '사용자 조합'으로 바뀐다. (이전 v0.2의 토글+프리셋 조합 구조가 어렵다는 피드백)
 *  - [확정·세화] A안 = 조회 결과 1명이면 선택된 상태로 진입(변수 ①만). B안 = ① + ② 하단 링크 + ③ 배제 조건형 카피. C안 = ⑤ 확인 시트만.
 *  - [유지·자체] 변수 ① 단일 결과 자동 선택: 2명 이상이면 적용하지 않는다(누구인지 골라야 함).
 *  - [유지·자체] 변수 ② 새 환자 등록 위치: 카드(현행) / 카드 영역 아래 텍스트 링크 / 다음 버튼 위 바.
 *  - [유지·자체] 변수 ③ 카피: 현행('새 환자 등록' + '본인 또는 가족 정보를 등록하면 진료 접수를 할 수 있어요') / 배제 조건형('다른 환자 등록' + '조회된 분이 아닐 때만 등록해 주세요').
 *    이전 태블릿의 '가족추가'는 상황을 단정해서 뺀 것이므로 되살리지 않는다.
 *  - [유지·자체] 변수 ④ 안내 문구: 카드 위에 '접수할 환자를 선택하고 다음을 눌러 주세요' 1줄. 어느 안에도 기본 포함하지 않고 직접 조합에서만 켠다.
 *  - [유지·자체] 변수 ⑤ 확인 시트: 조회 결과가 있는데 새 환자 등록을 누르면 '{이름}님이 아니신가요?' 시트로 가로챈다. 딤을 누르면 닫히고 환자 선택 화면에 남는다.
 *  - [유지·자체] 2명+카드 조합은 카드 3장이라 피그마대로 가로 스크롤(overflow x-auto). 데스크톱 검토용으로 세로 휠을 가로 스크롤로 돌린다.
 *  - [유지·자체] 다음 · 새 환자 등록 이후 화면은 자리표시만 둔다(진료실 선택·등록 폼은 범위 밖). 행동 기록은 자르지 않고 전부 쌓아 탭 수를 센다. 시안·시나리오가 바뀌면 기록을 비운다.
 *  - [유지·자체] 병원별 '새 환자 등록 숨김' 옵션은 넣지 않았다. 해당 병원도 초진을 태블릿으로 받으므로 신환 동선을 막는 안은 후순위.
 *  - [유지·자체] 환자 카드 보더는 CSS border 대신 inset box-shadow로 그려 피그마(stroke 안쪽, 내용 위치 불변)와 좌표를 맞춘다.
 *
 * 보류·TODO (PO 확인 대기)
 *  - [보류] 태블릿에서 '새 환자 등록'으로 등록되는 건 중 기존 환자 중복 비중(데이터 요청 중).
 *  - [보류] 같은 주민번호로 새 환자 등록을 진행할 때 차트 측 중복 생성 여부(막히는지, 중복이 쌓이는지).
 *  - [보류] 자동 선택 시 전화번호 조회로 가족 여러 명이 나오는 병원의 비중(2명 이상이면 자동 선택이 안 걸림).
 *  - [보류] 주민등록번호 조회 경로는 미포함(대기화면 피그마가 휴대전화번호 입력만 있음).
 *  - [보류] 조회 결과 없이 등록 화면으로 직행했을 때 As-is 탑바 표기(현재는 '1. 환자 선택' 활성 그대로).
 *
 * 변경 이력
 *  - v0.3 (2026-10-02) proto-qa 3차 반영: 휠 끝에서 페이지 스크롤 허용, 심볼 viewBox 18.57 상단 정렬(워터마크 698), 스피너 외경 79·7/8 호, 시안 재클릭 무시, 상단 바 61px·줄바꿈 억제.
 *    시안 선택을 As-is/A/B/C 단일 진입점으로 재구성(좌측은 바뀐 것 읽기 전용, 토글은 접힌 고급 영역). 키패드는 아무 키 → 자동 채움 → 조회 중 → 결과.
 *    조회 시나리오에 '없음 → 등록 직행'. BI 심볼·워터마크를 정본 logo_symbol path로, 하단 배너는 피그마 래스터 원본으로 교체.
 *    proto-qa 2차 반영: 번호 표시 그룹 간격, 상단 바 좁은 폭 줄바꿈, 3장 스크롤 시 그림자, 조회 중 위치(숨김 1px 행)·스피너 3/4 호, 설정 뱃지 inset, 약관 명시 줄바꿈·keep-all,
 *    휠 non-passive 리스너, 같은 값 재클릭 무시, 패널 힌트 keep-all.
 *  - v0.2 (2026-10-02) 대기화면(키패드)·조회 중 시퀀스 추가, 결과 없음은 등록 직행·0명 옵션 삭제. proto-qa 1차 지적 반영.
 *  - v0.1 (2026-10-02) 최초 작성. As-is 재현 + 변수 5개 토글 + 프리셋 3개 + 조회 결과 0/1/2명.
 * ─────────────────────────────────────────────────────────────
 */
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import bannerImg from '../../../assets/tablet-patient-select/banner.png';

/* ---------- 가상 데이터 ---------- */
type Patient = {
  id: string;
  name: string;
  gender: '남' | '여';
  age: number;
  birth: string;
  phone: string;
  lastVisit: string;
};

const KNOWN_PHONE = '01099240288';
const UNKNOWN_PHONE = '01012345678';
const PATIENTS: Patient[] = [
  { id: 'p1', name: '김세화', gender: '여', age: 34, birth: '1991. 06. 29', phone: '010-9924-0288', lastVisit: '2025년 1월 28일' },
  { id: 'p2', name: '김도윤', gender: '남', age: 7, birth: '2019. 03. 12', phone: '010-9924-0288', lastVisit: '2025년 9월 3일' }
];
const HOSPITAL_NAME = '베스트굿닥병원';

/* ---------- 체험 조건 ---------- */
type Placement = 'card' | 'link' | 'bar';
type CopyMode = 'asis' | 'exclusive';
type Lookup = 'one' | 'two' | 'none';
type Start = 'home' | 'select';

type Variables = {
  autoSelect: boolean;
  placement: Placement;
  copy: CopyMode;
  instruction: boolean;
  intercept: boolean;
};
type Scenario = { start: Start; lookup: Lookup };

type PresetKey = 'asis' | 'A' | 'B' | 'C';

const PRESETS: Record<PresetKey, { label: string; title: string; changes: string[]; vars: Variables }> = {
  asis: {
    label: 'As-is',
    title: '현행 태블릿 4.2',
    changes: [],
    vars: { autoSelect: false, placement: 'card', copy: 'asis', instruction: false, intercept: false }
  },
  A: {
    label: 'A안',
    title: '자동 선택',
    changes: ['조회 결과가 1명이면 그 환자가 선택된 상태로 진입하고, 다음 버튼이 바로 활성됩니다.', '2명 이상이면 현행처럼 직접 고릅니다.'],
    vars: { autoSelect: true, placement: 'card', copy: 'asis', instruction: false, intercept: false }
  },
  B: {
    label: 'B안',
    title: '자동 선택 + 보조 동선 + 카피',
    changes: [
      'A안의 자동 선택을 포함합니다.',
      '‘새 환자 등록’ 카드를 없애고 카드 아래 텍스트 링크로 내립니다.',
      '카피를 배제 조건형으로 바꿉니다: ‘다른 환자 등록’ / ‘조회된 분이 아니신가요?’'
    ],
    vars: { autoSelect: true, placement: 'link', copy: 'exclusive', instruction: false, intercept: false }
  },
  C: {
    label: 'C안',
    title: '확인 시트만',
    changes: ['화면 구조는 현행 그대로입니다.', '조회 결과가 있는데 ‘새 환자 등록’을 누르면 ‘{이름}님이 아니신가요?’ 시트로 한 번 묻습니다.'],
    vars: { autoSelect: false, placement: 'card', copy: 'asis', instruction: false, intercept: true }
  }
};

const VARIABLE_LABELS = {
  autoSelect: '① 단일 결과 자동 선택',
  placement: { link: '② 새 환자 등록을 하단 링크로', bar: '② 새 환자 등록을 다음 위 바로' },
  copy: '③ 배제 조건형 카피',
  instruction: '④ 안내 문구',
  intercept: '⑤ 잘못 눌렀을 때 확인 시트'
};

function describeVars(v: Variables): string[] {
  const out: string[] = [];
  if (v.autoSelect) out.push(VARIABLE_LABELS.autoSelect);
  if (v.placement !== 'card') out.push(VARIABLE_LABELS.placement[v.placement]);
  if (v.copy === 'exclusive') out.push(VARIABLE_LABELS.copy);
  if (v.instruction) out.push(VARIABLE_LABELS.instruction);
  if (v.intercept) out.push(VARIABLE_LABELS.intercept);
  return out;
}

const COPY = {
  asis: {
    title: '새 환자 등록',
    desc: ['본인 또는 가족 정보를 등록하면', '진료 접수를 할 수 있어요.'],
    linkPrefix: '조회된 환자가 아니신가요?',
    linkLabel: '새 환자 등록',
    bar: '새 환자 등록'
  },
  exclusive: {
    title: '다른 환자 등록',
    desc: ['조회된 분이 아닐 때만', '새로 등록해 주세요.'],
    linkPrefix: '조회된 분이 아니신가요?',
    linkLabel: '다른 환자 등록',
    bar: '조회된 분이 아니라면 · 다른 환자 등록'
  }
} as const;

/* 받침 유무에 따른 조사 */
function ro(name: string) {
  const code = name.charCodeAt(name.length - 1);
  if (code < 0xac00 || code > 0xd7a3) return `${name}로`;
  const jong = (code - 0xac00) % 28;
  return jong === 0 || jong === 8 ? `${name}로` : `${name}으로`;
}

/* ---------- 아이콘 ---------- */
const IcHome = () => (
  <svg width="72" height="72" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M3.5 10.5 12 3.5l8.5 7V20a1 1 0 0 1-1 1h-5v-6h-5v6h-5a1 1 0 0 1-1-1v-9.5Z" stroke="#fff" strokeWidth="1.8" strokeLinejoin="round" />
  </svg>
);
const IcClock = () => (
  <svg width="52" height="52" viewBox="0 0 24 24" aria-hidden="true" style={{ opacity: 0.9 }}>
    <circle cx="12" cy="12" r="10" fill="#808799" />
    <path d="M12 6.5V12l3.8 2.3" stroke="#fff" strokeWidth="2" strokeLinecap="round" fill="none" />
  </svg>
);
const IcAdd = ({ size = 64, color = '#808799' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 5v14M5 12h14" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
  </svg>
);
const IcCheck = () => (
  <svg width="54" height="54" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M5 12.5 10 17.5 19 7" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);
const IcChevron = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" aria-hidden="true">
    <path d="m9 6 6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);
const IcBackspace = () => (
  <svg width="68" height="50" viewBox="0 0 24 17.5" aria-hidden="true">
    <path d="M8 .5h14.5A1.5 1.5 0 0 1 24 2v13.5a1.5 1.5 0 0 1-1.5 1.5H8L.5 8.75 8 .5Z" fill="#5d6474" />
    <path d="m11.5 5.75 6 6m0-6-6 6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

/* 굿닥 BI 심볼 — goodoc-design 정본 logo_symbol.svg path (viewBox 19×30) */
const SYMBOL_BOWL =
  'M9.28472 25.3874C8.19028 25.3872 7.13204 25.0018 6.30146 24.301C5.47089 23.6001 4.92282 22.6301 4.75643 21.5664H0.0419922C0.220396 23.8607 1.27316 26.0041 2.98966 27.5679C4.70616 29.1317 6.95978 30.0005 9.29972 30.0005C11.6396 30.0005 13.8933 29.1317 15.6098 27.5679C17.3263 26.0041 18.3791 23.8607 18.5575 21.5664H13.825C13.6583 22.6321 13.1085 23.6038 12.2754 24.3048C11.4423 25.0059 10.3812 25.39 9.28472 25.3874V25.3874Z';
const SYMBOL_SQUARE = 'M18.5569 0H13.7764V4.61824H18.5569V0Z';
const SYMBOL_RING =
  'M9.28478 3.46875C7.44843 3.46875 5.65332 4.00425 4.12645 5.00749C2.59957 6.01073 1.40951 7.43666 0.706764 9.10499C0.00402196 10.7733 -0.179846 12.6091 0.178409 14.3802C0.536663 16.1512 1.42096 17.7781 2.71945 19.055C4.01795 20.3318 5.67233 21.2014 7.4734 21.5537C9.27447 21.906 11.1413 21.7252 12.8379 21.0341C14.5345 20.3431 15.9845 19.1728 17.0048 17.6714C18.025 16.1699 18.5695 14.4047 18.5695 12.5989C18.5663 10.1784 17.5871 7.85794 15.8466 6.14638C14.106 4.43482 11.7463 3.47188 9.28478 3.46875V3.46875ZM9.28478 17.0991C8.37967 17.0991 7.49488 16.8351 6.7423 16.3407C5.98973 15.8462 5.40317 15.1434 5.0568 14.3211C4.71043 13.4988 4.61982 12.594 4.7964 11.721C4.97298 10.8481 5.40881 10.0462 6.04882 9.41689C6.68883 8.78753 7.50424 8.35893 8.39196 8.18529C9.27968 8.01165 10.1998 8.10075 11.036 8.44135C11.8723 8.78196 12.587 9.35875 13.0898 10.0988C13.5927 10.8388 13.8611 11.7089 13.8611 12.5989C13.8595 13.792 13.3768 14.9357 12.5189 15.7793C11.6611 16.6229 10.498 17.0975 9.28478 17.0991V17.0991Z';

const Symbol = ({ width, height, main, square, className }: { width: number; height: number; main: string; square: string; className?: string }) => (
  <svg className={className} width={width} height={height} viewBox="0 0 18.57 30" preserveAspectRatio="xMinYMin meet" aria-hidden="true">
    <path d={SYMBOL_BOWL} fill={main} />
    <path d={SYMBOL_SQUARE} fill={square} />
    <path d={SYMBOL_RING} fill={main} />
  </svg>
);
const Logo = () => (
  <span className="tps-logo">
    <Symbol width={47} height={79} main="#F5FAFF" square="#41D293" />
    <span>굿닥</span>
  </span>
);
const Watermark = () => <Symbol className="tps-home-watermark" width={432} height={698} main="#147EFA" square="#057BF2" />;
const Spinner = () => (
  <svg className="tps-spinner" width="112" height="112" viewBox="0 0 112 112" aria-hidden="true">
    <circle cx="56" cy="56" r="33.5" stroke="#479DFF" strokeOpacity="0.15" strokeWidth="12" fill="none" />
    <path d="M56 22.5A33.5 33.5 0 1 1 34.5 30.3" stroke="#479DFF" strokeWidth="12" strokeLinecap="round" fill="none" />
  </svg>
);
const Pin = () => (
  <span className="tps-pin" aria-hidden="true">
    <svg width="47" height="47" viewBox="0 0 47 47">
      <path d="M23.5 23.5L47 0V37C47 42.5228 42.5228 47 37 47H0L23.5 23.5Z" fill="#F9F9FB" />
    </svg>
  </span>
);

/* ---------- 태블릿 프레임 ---------- */
const STEPS = ['1. 환자 선택', '2. 진료실 선택', '3. 내원 목적', '4. 접수 결과'];

function Topbar({ active, onHome }: { active: number; onHome: () => void }) {
  return (
    <header className="tps-topbar">
      <button type="button" className="tps-home" onClick={onHome}>
        <IcHome />
        <span>처음으로</span>
      </button>
      <nav className="tps-tabs">
        {STEPS.map((label, i) => (
          <div key={label} className={`tps-tab${i === active ? ' is-active' : ''}`}>
            <span>{label}</span>
            {i === active && <Pin />}
          </div>
        ))}
      </nav>
    </header>
  );
}

function PatientCard({ p, selected, onTap }: { p: Patient; selected: boolean; onTap: () => void }) {
  return (
    <button type="button" className={`tps-card tps-card-patient${selected ? ' is-selected' : ''}`} onClick={onTap} aria-pressed={selected}>
      {selected && (
        <span className="tps-badge">
          <IcCheck />
          <span className="tps-badge-text">선택완료</span>
        </span>
      )}
      <div className="tps-card-info">
        <div className="tps-name">{p.name}</div>
        <div className="tps-detail">
          <div className="tps-line">
            <span>{p.gender}</span>
            <i className="tps-dot" />
            <span>
              만 {p.age}세 ({p.birth})
            </span>
          </div>
          <div>{p.phone}</div>
        </div>
      </div>
      <div className="tps-extra">
        <IcClock />
        <span>{p.lastVisit} 마지막 방문</span>
      </div>
    </button>
  );
}

function NewPatientCard({ copy, onTap }: { copy: CopyMode; onTap: () => void }) {
  const c = COPY[copy];
  return (
    <button type="button" className="tps-card tps-card-new" onClick={onTap}>
      <div className="tps-card-info">
        <div className="tps-name">{c.title}</div>
        <div className="tps-desc">
          {c.desc.map((line) => (
            <div key={line}>{line}</div>
          ))}
        </div>
      </div>
      <div className="tps-extra tps-extra-end">
        <span className="tps-plus">
          <IcAdd />
        </span>
      </div>
    </button>
  );
}

/* 대기화면 — 휴대전화번호 입력 */
const KEYS: string[] = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'clear', '0', 'back'];
const PHONE_TEMPLATE = '01000000000';

function PhoneDisplay({ digits }: { digits: string }) {
  const cell = (i: number) => {
    const entered = i < digits.length;
    return (
      <span key={i} className={entered ? '' : 'is-ph'}>
        {entered ? digits[i] : PHONE_TEMPLATE[i]}
      </span>
    );
  };
  const group = (a: number, b: number) => <span className="tps-phone-group">{Array.from({ length: b - a }, (_, k) => cell(a + k))}</span>;
  return (
    <div className={`tps-phone${digits.length === 0 ? ' is-empty' : ''}`}>
      {group(0, 3)}
      <span className="tps-phone-dash">-</span>
      {group(3, 7)}
      <span className="tps-phone-dash">-</span>
      {group(7, 11)}
    </div>
  );
}

function HomeScreen({ digits, loading, onKey }: { digits: string; loading: boolean; onKey: () => void }) {
  return (
    <div className="tps-screen tps-home-screen">
      <div className="tps-home-left">
        <div className="tps-home-left-body">
          <Watermark />
          <Logo />
          <div className="tps-home-hospital">{HOSPITAL_NAME}</div>
          <div className="tps-home-title">
            <span>접수</span>
            <span className="tps-home-title-gap">
              <i className="tps-home-title-dot" />
            </span>
            <span>도착 확인</span>
          </div>
          <div className="tps-home-meta">
            <span className="tps-home-ver">v4.2.0</span>
            <span className="tps-home-setting">설정</span>
            <span className="tps-home-fine">
              수집되는 성명, 주민등록번호, 연락처를 환자정보 전산처리, 질병관리본부 및 건강보험심사평가원 조회, 서비스 제공 알림톡
              <br />
              전송, 서비스 이용 기록 및 통계 분석을 통한 서비스 개선을 위해 병원과 굿닥의 계약 종료시까지 위탁하여 처리하고 있습니다.
            </span>
          </div>
        </div>
        <img className="tps-home-banner" src={bannerImg} alt="지금 여기서 가장 가까운 약국 굿닥에서 찾아보세요." />
      </div>
      <div className="tps-home-right">
        <div className={`tps-home-input${loading ? ' is-loading' : ''}`}>
          <div className="tps-home-input-label">휴대전화번호 입력</div>
          <PhoneDisplay digits={digits} />
        </div>
        {loading ? (
          <>
            <i className="tps-home-line" />
            <div className="tps-home-loading">
              <Spinner />
              <div>
                입력하신 번호로
                <br />
                진료 기록을 조회하고 있습니다.
              </div>
              <i className="tps-home-loading-spacer" />
            </div>
          </>
        ) : (
          <div className="tps-keypad">
            {KEYS.map((k) => (
              <button key={k} type="button" className={`tps-key${k === 'clear' ? ' is-clear' : ''}`} onClick={onKey}>
                {k === 'clear' ? '전체 삭제' : k === 'back' ? <IcBackspace /> : k}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

type Screen = 'home' | 'select' | 'next' | 'register';
type LogItem = { t: string; msg: string };

function nowLabel() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
}

function Tablet({ vars, scenario, onLog, resetKey }: { vars: Variables; scenario: Scenario; onLog: (msg: string) => void; resetKey: number }) {
  const results = useMemo(() => (scenario.lookup === 'none' ? [] : PATIENTS.slice(0, scenario.lookup === 'one' ? 1 : 2)), [scenario.lookup]);
  const phone = scenario.lookup === 'none' ? UNKNOWN_PHONE : KNOWN_PHONE;
  const initialSelected = vars.autoSelect && results.length === 1 ? results[0].id : null;
  const startScreen: Screen = scenario.start === 'select' ? (results.length === 0 ? 'register' : 'select') : 'home';

  const [screen, setScreen] = useState<Screen>(startScreen);
  const [digits, setDigits] = useState(scenario.start === 'select' ? phone : '');
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string | null>(initialSelected);
  const [sheet, setSheet] = useState(false);
  const timers = useRef<number[]>([]);
  const listRef = useRef<HTMLDivElement>(null);

  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };
  const resetAll = () => {
    clearTimers();
    setScreen(startScreen);
    setDigits(scenario.start === 'select' ? phone : '');
    setLoading(false);
    setSelected(initialSelected);
    setSheet(false);
  };

  // 시안·시나리오가 바뀌면 처음 진입 상태로 되돌린다
  useEffect(() => {
    resetAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenario.start, scenario.lookup, vars.autoSelect, vars.placement, vars.copy, vars.instruction, vars.intercept, resetKey]);
  useEffect(() => clearTimers, []);

  // 세로 휠 → 가로 스크롤 (passive 리스너라 React onWheel로는 preventDefault 불가)
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      if (el.scrollWidth <= el.clientWidth) return;
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      const max = el.scrollWidth - el.clientWidth;
      const canMove = (e.deltaY > 0 && el.scrollLeft < max - 1) || (e.deltaY < 0 && el.scrollLeft > 1);
      if (!canMove) return; // 끝에 닿으면 페이지 스크롤로 넘긴다
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  });

  const selectedPatient = results.find((p) => p.id === selected) ?? null;
  const copy = COPY[vars.copy];
  const cardCount = results.length + (vars.placement === 'card' ? 1 : 0);

  const home = (via = '처음으로') => {
    clearTimers();
    setScreen('home');
    setDigits('');
    setLoading(false);
    setSelected(initialSelected);
    setSheet(false);
    onLog(`${via} → 대기화면`);
  };

  // 키패드: 아무 키나 누르면 시나리오 번호가 자동으로 채워지고 조회로 넘어간다
  const onKey = () => {
    if (loading || timers.current.length > 0) return;
    onLog(`키패드 탭 → 번호 자동 입력 (${scenario.lookup === 'none' ? '미등록 번호' : '등록된 번호'})`);
    for (let i = 1; i <= 11; i += 1) {
      timers.current.push(window.setTimeout(() => setDigits(phone.slice(0, i)), 70 * i));
    }
    timers.current.push(
      window.setTimeout(() => {
        setLoading(true);
        onLog('조회 중');
      }, 70 * 11 + 200)
    );
    timers.current.push(
      window.setTimeout(() => {
        timers.current = [];
        setLoading(false);
        if (results.length > 0) {
          setSelected(initialSelected);
          setScreen('select');
          onLog(`조회 결과 ${results.length}명 → 환자 선택${initialSelected ? ' (자동 선택 상태)' : ''}`);
        } else {
          setScreen('register');
          onLog('조회 결과 없음 → 새 환자 등록으로 바로 이동');
        }
      }, 70 * 11 + 200 + 1400)
    );
  };

  const tapPatient = (p: Patient) => {
    if (selected === p.id) {
      setSelected(null);
      onLog(`${p.name} 카드 탭 → 선택 해제`);
    } else {
      setSelected(p.id);
      onLog(`${p.name} 카드 탭 → 선택완료`);
    }
  };

  const goRegister = (via: string) => {
    setSheet(false);
    setScreen('register');
    onLog(`${via} → 새 환자 등록 화면으로 이동`);
  };

  const tapNew = (via: string) => {
    if (vars.intercept && results.length > 0) {
      setSheet(true);
      onLog(`${via} 탭 → 확인 시트 노출`);
      return;
    }
    goRegister(`${via} 탭`);
  };

  const tapNext = () => {
    if (!selectedPatient) {
      onLog('다음 탭 → 비활성(선택 없음)');
      return;
    }
    setScreen('next');
    onLog(`다음 탭 → ${ro(selectedPatient.name)} 진료실 선택 진입`);
  };

  if (screen === 'home') {
    return <HomeScreen digits={digits} loading={loading} onKey={onKey} />;
  }

  if (screen === 'next') {
    return (
      <div className="tps-screen">
        <Topbar active={1} onHome={() => home()} />
        <div className="tps-placeholder">
          <div className="tps-ph-title">2. 진료실 선택</div>
          <div className="tps-ph-desc">{ro(selectedPatient?.name ?? '환자')} 접수를 진행합니다. 이 체험판에서는 진료실 선택 이후를 재현하지 않습니다.</div>
          <button type="button" className="tps-btn tps-btn-secondary" onClick={() => home("'처음으로 돌아가기'")}>
            처음으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  if (screen === 'register') {
    const viaMiss = results.length === 0;
    return (
      <div className="tps-screen">
        <Topbar active={0} onHome={() => home()} />
        <div className="tps-placeholder">
          <div className="tps-ph-title">{viaMiss ? '새 환자 등록' : copy.title}</div>
          <div className="tps-ph-desc">
            {viaMiss
              ? '입력하신 번호로 조회된 진료 기록이 없어 환자 선택 없이 바로 등록으로 왔습니다. 이름 · 주민등록번호 · 전화번호 입력 폼이 이어집니다(현행 폼은 재현하지 않음).'
              : '이름 · 주민등록번호 · 전화번호 입력 폼이 이어집니다(현행 폼은 재현하지 않음). 조회된 환자가 있는데 이 화면까지 왔다면 VOC와 같은 오탭입니다.'}
          </div>
          <button type="button" className="tps-btn tps-btn-secondary" onClick={() => home("'처음으로 돌아가기'")}>
            처음으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="tps-screen">
      <Topbar active={0} onHome={() => home()} />
      <div className="tps-content">
        {vars.instruction && <div className="tps-instruction">접수할 환자를 선택하고 ‘다음’을 눌러 주세요.</div>}
        <div className={`tps-list${cardCount > 2 ? ' is-scroll' : ''}`} ref={listRef}>
          {results.map((p) => (
            <PatientCard key={p.id} p={p} selected={selected === p.id} onTap={() => tapPatient(p)} />
          ))}
          {vars.placement === 'card' && <NewPatientCard copy={vars.copy} onTap={() => tapNew(`'${copy.title}' 카드`)} />}
        </div>
        {vars.placement === 'link' && (
          <div className="tps-linkrow">
            <span className="tps-linkrow-prefix">{copy.linkPrefix}</span>
            <button type="button" className="tps-linkrow-btn" onClick={() => tapNew(`'${copy.linkLabel}' 링크`)}>
              {copy.linkLabel}
              <IcChevron />
            </button>
          </div>
        )}
      </div>
      <div className={`tps-cta${vars.placement === 'bar' ? ' has-bar' : ''}`}>
        {vars.placement === 'bar' && (
          <button type="button" className="tps-btn tps-btn-bar" onClick={() => tapNew(`'${copy.bar}' 바`)}>
            <IcAdd size={48} color="#434956" />
            <span>{copy.bar}</span>
          </button>
        )}
        <button type="button" className={`tps-btn tps-btn-next${selectedPatient ? ' is-active' : ''}`} onClick={tapNext} aria-disabled={!selectedPatient}>
          다음
        </button>
      </div>

      {sheet && (
        <div
          className="tps-dim"
          role="dialog"
          aria-modal="true"
          onClick={() => {
            setSheet(false);
            onLog('시트 바깥 탭 → 닫힘, 환자 선택 유지');
          }}
        >
          <div className="tps-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="tps-sheet-title">{results.length === 1 ? `${results[0].name}님이 아니신가요?` : '조회된 환자가 아니신가요?'}</div>
            <div className="tps-sheet-desc">
              {results.length === 1 ? '본인이시라면 아래 버튼으로 바로 접수할 수 있어요. 처음부터 다시 입력하지 않아도 됩니다.' : '조회된 환자 중 본인을 고르면 바로 접수할 수 있어요.'}
            </div>
            <div className="tps-sheet-actions">
              {results.length === 1 ? (
                <button
                  type="button"
                  className="tps-btn tps-btn-next is-active"
                  onClick={() => {
                    setSelected(results[0].id);
                    setSheet(false);
                    setScreen('next');
                    onLog(`시트 '${results[0].name}입니다 · 바로 접수' → 진료실 선택 진입`);
                  }}
                >
                  네, {results[0].name}입니다 · 바로 접수
                </button>
              ) : (
                <button
                  type="button"
                  className="tps-btn tps-btn-next is-active"
                  onClick={() => {
                    setSheet(false);
                    onLog("시트 '조회된 환자 중에서 고르기' → 환자 선택으로 복귀");
                  }}
                >
                  조회된 환자 중에서 고르기
                </button>
              )}
              <button type="button" className="tps-btn tps-btn-secondary" onClick={() => goRegister("시트 '아니요, 다른 사람이에요'")}>
                아니요, 다른 사람이에요
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- 캔버스(스케일) ---------- */
function Stage({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const w = el.clientWidth - 48;
      const h = el.clientHeight - 48;
      setScale(Math.max(0.12, Math.min(w / 1920, h / 1200)));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="tps-stage" ref={ref}>
      <div className="tps-frame-wrap" style={{ width: 1920 * scale, height: 1200 * scale }}>
        <div className="tps-frame" style={{ transform: `scale(${scale})` }}>
          {children}
        </div>
      </div>
    </div>
  );
}

/* ---------- 패널 컨트롤 ---------- */
function Seg<T extends string | number | boolean>({ value, options, onChange }: { value: T; options: { v: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="tps-seg" role="radiogroup">
      {options.map((o) => (
        <button
          key={String(o.v)}
          type="button"
          role="radio"
          aria-checked={o.v === value}
          className={`tps-seg-btn${o.v === value ? ' is-on' : ''}`}
          onClick={() => {
            if (o.v !== value) onChange(o.v);
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="tps-field">
      <div className="tps-field-label">{label}</div>
      {children}
      {hint && <div className="tps-field-hint">{hint}</div>}
    </div>
  );
}

function sameVars(a: Variables, b: Variables) {
  return a.autoSelect === b.autoSelect && a.placement === b.placement && a.copy === b.copy && a.instruction === b.instruction && a.intercept === b.intercept;
}

function App() {
  const [vars, setVars] = useState<Variables>(PRESETS.asis.vars);
  const [scenario, setScenario] = useState<Scenario>({ start: 'home', lookup: 'one' });
  const [log, setLog] = useState<LogItem[]>([]);
  const [resetKey, setResetKey] = useState(0);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const activePreset = (Object.keys(PRESETS) as PresetKey[]).find((k) => sameVars(PRESETS[k].vars, vars));
  const bump = () => {
    setLog([]);
    setResetKey((k) => k + 1);
  };
  const applyPreset = (k: PresetKey) => {
    if (activePreset === k) return;
    setVars(PRESETS[k].vars);
    bump();
  };
  const setVar = <K extends keyof Variables>(key: K, v: Variables[K]) => {
    setVars((o) => ({ ...o, [key]: v }));
    bump();
  };
  const setScn = <K extends keyof Scenario>(key: K, v: Scenario[K]) => {
    setScenario((o) => ({ ...o, [key]: v }));
    bump();
  };
  const addLog = (msg: string) => setLog((l) => [{ t: nowLabel(), msg }, ...l]);

  const changes = activePreset ? PRESETS[activePreset].changes : describeVars(vars);
  const headTitle = activePreset ? `${PRESETS[activePreset].label} · ${PRESETS[activePreset].title}` : '사용자 조합';

  return (
    <div className="tps-root bb">
      <div className="tps-bar">
        <div className="tps-bar-title">
          <strong>태블릿 접수 · 환자 조회 → 환자 선택</strong>
          <span>‘새 환자 등록’ 오탭 UX 개선 체험판 · 검토용 초안 v0.3</span>
        </div>
        <div className="tps-presets" role="radiogroup" aria-label="시안">
          {(Object.keys(PRESETS) as PresetKey[]).map((k) => (
            <button key={k} type="button" role="radio" aria-checked={activePreset === k} className={`tps-preset${activePreset === k ? ' is-on' : ''}`} onClick={() => applyPreset(k)} title={PRESETS[k].title}>
              {PRESETS[k].label}
            </button>
          ))}
          {!activePreset && <span className="tps-preset-custom">사용자 조합</span>}
        </div>
      </div>

      <div className="tps-body">
        <aside className="tps-panel">
          <section className="tps-panel-card tps-panel-changes">
            <h3>{headTitle}</h3>
            <div className="tps-changes-label">As-is 대비 바뀐 것</div>
            {changes.length === 0 ? (
              <div className="tps-changes-none">{activePreset === 'asis' ? '변경 없음. 현행 태블릿 4.2 화면 그대로입니다.' : '변경 없음.'}</div>
            ) : (
              <ul className="tps-changes">
                {changes.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            )}
          </section>

          <section className="tps-panel-card">
            <h3>조회 시나리오</h3>
            <Field label="시작 화면" hint="대기화면에서는 키패드 아무 키나 누르면 번호가 자동으로 채워지고 조회 중 → 결과로 이어집니다(실제 입력은 재현하지 않음).">
              <Seg<Start>
                value={scenario.start}
                options={[
                  { v: 'home', label: '대기화면(조회부터)' },
                  { v: 'select', label: '조회 결과부터' }
                ]}
                onChange={(v) => setScn('start', v)}
              />
            </Field>
            <Field label="조회 결과" hint="전화번호 조회는 가족이 함께 나올 수 있어 2명 케이스를 둡니다. 결과가 없으면 환자 선택 화면 없이 새 환자 등록으로 바로 갑니다.">
              <Seg<Lookup>
                value={scenario.lookup}
                options={[
                  { v: 'one', label: '1명(본인)' },
                  { v: 'two', label: '2명(본인+가족)' },
                  { v: 'none', label: '없음 → 등록 직행' }
                ]}
                onChange={(v) => setScn('lookup', v)}
              />
            </Field>
          </section>

          <section className="tps-panel-card">
            <div className="tps-log-head">
              <h3>행동 기록{log.length > 0 && <span className="tps-log-count"> · {log.length}</span>}</h3>
              <button type="button" className="tps-mini" onClick={bump}>
                초기화
              </button>
            </div>
            {log.length === 0 ? (
              <div className="tps-log-empty">태블릿 화면을 눌러 보세요. 탭 순서가 여기에 쌓입니다. 시안이나 시나리오를 바꾸면 비워집니다.</div>
            ) : (
              <ol className="tps-log">
                {log.map((item, i) => (
                  <li key={`${item.t}-${i}`}>
                    <span className="tps-log-t">{item.t}</span>
                    <span>{item.msg}</span>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section className={`tps-panel-card tps-advanced${advancedOpen ? ' is-open' : ''}`}>
            <button type="button" className="tps-advanced-head" onClick={() => setAdvancedOpen((o) => !o)} aria-expanded={advancedOpen}>
              <h3>직접 조합(고급)</h3>
              <span className="tps-advanced-caret" aria-hidden="true">
                {advancedOpen ? '−' : '+'}
              </span>
            </button>
            {advancedOpen && (
              <div className="tps-advanced-body">
                <div className="tps-field-hint">변수를 하나라도 바꾸면 상단 시안 표시가 ‘사용자 조합’으로 바뀝니다. A/B/C는 이 변수들의 묶음입니다.</div>
                <Field label="① 단일 결과 자동 선택" hint="1명이면 선택완료 상태로 진입하고 다음이 바로 활성. 2명 이상이면 적용 안 함.">
                  <Seg<boolean>
                    value={vars.autoSelect}
                    options={[
                      { v: false, label: '끔(현행)' },
                      { v: true, label: '켬' }
                    ]}
                    onChange={(v) => setVar('autoSelect', v)}
                  />
                </Field>
                <Field label="② 새 환자 등록 위치" hint="카드는 환자 카드와 같은 무게. 링크·바는 보조 동선으로 내립니다.">
                  <Seg<Placement>
                    value={vars.placement}
                    options={[
                      { v: 'card', label: '카드(현행)' },
                      { v: 'link', label: '하단 링크' },
                      { v: 'bar', label: '다음 위 바' }
                    ]}
                    onChange={(v) => setVar('placement', v)}
                  />
                </Field>
                <Field label="③ 카피" hint="현행 설명문은 ‘본인’·‘진료 접수’가 들어 있어 본인 접수 경로로 읽힙니다. 배제 조건형은 ‘조회된 분이 아닐 때만’으로 바꿉니다.">
                  <Seg<CopyMode>
                    value={vars.copy}
                    options={[
                      { v: 'asis', label: '현행' },
                      { v: 'exclusive', label: '배제 조건형' }
                    ]}
                    onChange={(v) => setVar('copy', v)}
                  />
                </Field>
                <Field label="④ 안내 문구" hint="‘선택 후 다음’ 2단계 조작을 화면에 적습니다. ①을 켜면 필요가 줄어듭니다.">
                  <Seg<boolean>
                    value={vars.instruction}
                    options={[
                      { v: false, label: '없음(현행)' },
                      { v: true, label: '있음' }
                    ]}
                    onChange={(v) => setVar('instruction', v)}
                  />
                </Field>
                <Field label="⑤ 잘못 눌렀을 때 확인 시트" hint="조회 결과가 있는데 새 환자 등록을 누르면 ‘{이름}님이 아니신가요?’로 가로챕니다.">
                  <Seg<boolean>
                    value={vars.intercept}
                    options={[
                      { v: false, label: '끔(현행)' },
                      { v: true, label: '켬' }
                    ]}
                    onChange={(v) => setVar('intercept', v)}
                  />
                </Field>
              </div>
            )}
          </section>
        </aside>

        <Stage>
          <Tablet vars={vars} scenario={scenario} onLog={addLog} resetKey={resetKey} />
        </Stage>
      </div>
    </div>
  );
}

export default App;
