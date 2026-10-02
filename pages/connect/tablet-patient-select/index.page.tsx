/**
 * ─────────────────────────────────────────────────────────────
 * 이름      : tablet-patient-select — 태블릿 접수 '환자 조회 → 1. 환자 선택' · 새 환자 등록 오탭 UX 개선 체험판
 * 상태      : 검토용 초안 · v0.2 · 최종수정 2026-10-02
 * PRD       : 없음(VOC 기반). 병원 VOC: 조회된 본인 카드가 떠도 환자가 '새 환자 등록'을 눌러 정보를 처음부터 다시 입력(고령 재진 환자 중심, 하루 3명).
 *             사내 논의 링크는 공개 저장소라 미기재.
 * 배포URL   : https://connect-sq-sandbox.github.io/out/tablet-patient-select.html
 * 피그마    : 굿닥 태블릿 Design Library 2.0 · POC_대기화면_환자조회(8643:72136 입력 전 / 8643:72137 조회 중) · POC_대상선택(선택 전 8640:47875 / 선택완료 8642:71647)
 *             기준선: 2026-10-02 figma-reader 속성표
 * 관련 CSS  : styles/tabletPatientSelect.css (피그마 값 그대로 px, 1920×1200 프레임을 transform scale로 축소)
 * 기술제약  : 샌드박스 빌드는 emotion/styled 금지 → plain CSS. 외부 요청 0. 가상 데이터·메모리 상태만.
 * 화면구성  : 상단 프리셋 바 + 좌측 체험 조건 패널 + 1920×1200 태블릿 프레임
 *             (대기화면 휴대전화번호 키패드 → 조회 중 → 환자 선택 | 새 환자 등록 직행 → 다음/등록 자리표시 · 확인 시트)
 *
 * 핵심 결정(why)
 *  - [확정·세화] As-is 화면은 피그마 POC_대기화면_환자조회·POC_대상선택을 값 그대로 재현한다(탑바 140, 카드 760×748, radius 36, CTA 144 등).
 *  - [확정·세화] 초기 환자 조회 시퀀스(휴대전화번호 11자리 입력 → 조회 중 → 결과)부터 체험한다. 11자리가 차면 자동 조회(As-is 동작).
 *  - [확정·세화] 조회 결과가 없으면 환자 선택 화면 없이 새 환자 등록으로 바로 이동한다. 그래서 '조회 결과 0명' 옵션은 두지 않는다.
 *    등록된 번호(010-9924-0288)를 치면 결과가 있고, 다른 번호를 치면 결과 없음 → 등록 직행.
 *  - [유지·자체] 개선안은 "안 A/B/C" 묶음이 아니라 독립 변수 토글로 둔다. 원인 가설이 4개(눌릴 것이 없어 보임 · 카피가 본인 접수를 안내 · 2단계 조작 미안내 ·
 *    두 카드의 무게 동일)라 각 가설에 대응하는 변경을 따로 켜고 끌 수 있어야 비교가 된다. 프리셋(As-is / 추천 조합 / 최소 변경)은 토글 묶음일 뿐이다.
 *  - [유지·자체] 변수 ① 단일 결과 자동 선택: 조회 결과가 1명이면 선택완료 상태로 진입, 다음 활성. 2명 이상이면 적용하지 않는다(누구인지 골라야 함).
 *  - [유지·자체] 변수 ② 새 환자 등록 위치: 카드(현행) / 카드 영역 아래 텍스트 링크 / 다음 버튼 위 바.
 *  - [유지·자체] 변수 ③ 카피: 현행('새 환자 등록' + '본인 또는 가족 정보를 등록하면 진료 접수를 할 수 있어요') / 배제 조건형('다른 환자 등록' + '조회된 분이 아닐 때만 등록해 주세요').
 *    이전 태블릿의 '가족추가'는 상황을 단정해서 뺀 것이므로 되살리지 않는다.
 *  - [유지·자체] 변수 ④ 안내 문구: 카드 위에 '접수할 환자를 선택하고 다음을 눌러 주세요' 1줄.
 *  - [유지·자체] 변수 ⑤ 확인 시트: 조회 결과가 있는데 새 환자 등록을 누르면 '{이름}님이 아니신가요?' 시트로 가로챈다. 구조를 못 바꿀 때의 차선.
 *    딤을 누르면 닫히고 환자 선택 화면에 남는다.
 *  - [유지·자체] 2명+카드 조합은 카드 3장이라 피그마대로 가로 스크롤(overflow x-auto). 데스크톱 검토용으로 세로 휠을 가로 스크롤로 돌린다.
 *  - [유지·자체] 다음 · 새 환자 등록 이후 화면은 자리표시만 둔다(진료실 선택·등록 폼은 범위 밖). 행동 기록은 자르지 않고 전부 쌓아 탭 수를 센다. 조건이 바뀌면 기록을 비운다.
 *  - [유지·자체] 병원별 '새 환자 등록 숨김' 옵션은 넣지 않았다. 해당 병원도 초진을 태블릿으로 받으므로 신환 동선을 막는 안은 후순위.
 *  - [유지·자체] 환자 카드 보더는 CSS border 대신 inset box-shadow로 그려 피그마(stroke 안쪽, 내용 위치 불변)와 좌표를 맞춘다.
 *
 * 보류·TODO (PO 확인 대기)
 *  - [보류] 태블릿에서 '새 환자 등록'으로 등록되는 건 중 기존 환자 중복 비중(데이터 요청 중).
 *  - [보류] 같은 주민번호로 새 환자 등록을 진행할 때 차트 측 중복 생성 여부(막히는지, 중복이 쌓이는지).
 *  - [보류] 자동 선택 시 전화번호 조회로 가족 여러 명이 나오는 병원의 비중(2명 이상이면 자동 선택이 안 걸림).
 *  - [보류] 주민등록번호 조회 경로는 미포함(대기화면 피그마가 휴대전화번호 입력만 있음).
 *
 * 변경 이력
 *  - v0.2 (2026-10-02) 대기화면(키패드)·조회 중 시퀀스 추가, 결과 없음은 등록 직행·0명 옵션 삭제. proto-qa 1차 지적 반영: 삼각 포인터 박스 66.47·그림자,
 *    카드 그림자 클리핑 해제(2장 이하), 보더를 inset shadow로(3px 오프셋 제거), 뱃지 높이 98, 상단 바 고정 64, 모바일 폭 잘림, 기록 전량 보존·조건 변경 시 비움,
 *    프리셋 재클릭 시 화면 초기화, 시트 딤 닫기, keep-all, 로그 문구 교정.
 *  - v0.1 (2026-10-02) 최초 작성. As-is 재현 + 변수 5개 토글 + 프리셋 3개 + 조회 결과 0/1/2명.
 * ─────────────────────────────────────────────────────────────
 */
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

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
const PATIENTS: Patient[] = [
  { id: 'p1', name: '김세화', gender: '여', age: 34, birth: '1991. 06. 29', phone: '010-9924-0288', lastVisit: '2025년 1월 28일' },
  { id: 'p2', name: '김도윤', gender: '남', age: 7, birth: '2019. 03. 12', phone: '010-9924-0288', lastVisit: '2025년 9월 3일' }
];
const HOSPITAL_NAME = '베스트굿닥병원';

/* ---------- 체험 조건 ---------- */
type Placement = 'card' | 'link' | 'bar';
type CopyMode = 'asis' | 'exclusive';
type ResultCount = 1 | 2;
type Start = 'home' | 'select';

type Options = {
  start: Start;
  resultCount: ResultCount;
  autoSelect: boolean;
  placement: Placement;
  copy: CopyMode;
  instruction: boolean;
  intercept: boolean;
};

type PresetKey = 'asis' | 'recommended' | 'minimal';

const PRESETS: Record<PresetKey, { label: string; desc: string; options: Pick<Options, 'autoSelect' | 'placement' | 'copy' | 'instruction' | 'intercept'> }> = {
  asis: {
    label: 'As-is',
    desc: '현재 태블릿 4.2 화면 그대로.',
    options: { autoSelect: false, placement: 'card', copy: 'asis', instruction: false, intercept: false }
  },
  recommended: {
    label: '추천 조합',
    desc: '자동 선택 + 새 환자 등록을 하단 링크로 + 배제 조건형 카피.',
    options: { autoSelect: true, placement: 'link', copy: 'exclusive', instruction: false, intercept: false }
  },
  minimal: {
    label: '최소 변경',
    desc: '구조는 그대로, 잘못 눌렀을 때 확인 시트만.',
    options: { autoSelect: false, placement: 'card', copy: 'asis', instruction: false, intercept: true }
  }
};

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
const IcPinMap = () => (
  <svg width="112" height="112" viewBox="0 0 64 64" aria-hidden="true">
    <path d="M32 6C20.4 6 11 15.2 11 26.6 11 42 32 60 32 60s21-18 21-33.4C53 15.2 43.6 6 32 6Z" fill="#479dff" />
    <circle cx="32" cy="27" r="13" fill="#fff" />
    <rect x="23" y="22" width="18" height="10" rx="5" transform="rotate(-35 32 27)" fill="#24c38c" />
    <rect x="23" y="22" width="9" height="10" rx="5" transform="rotate(-35 32 27)" fill="#fff" />
  </svg>
);
const Logo = () => (
  <span className="tps-logo">
    <svg width="47" height="79" viewBox="0 0 47 79" aria-hidden="true">
      <circle cx="23.5" cy="52" r="20" stroke="#F5FAFF" strokeWidth="7" fill="none" />
      <path d="M43.5 60a20 20 0 0 1-20 19" stroke="#F5FAFF" strokeWidth="7" strokeLinecap="round" fill="none" />
      <rect x="35" y="0" width="12" height="11.6" fill="#41D293" />
    </svg>
    <span>굿닥</span>
  </span>
);
const Spinner = () => (
  <svg className="tps-spinner" width="112" height="112" viewBox="0 0 144 144" aria-hidden="true">
    <circle cx="72" cy="72" r="56" stroke="#479DFF" strokeOpacity="0.15" strokeWidth="16" fill="none" />
    <path d="M72 16a56 56 0 0 1 56 56" stroke="#479DFF" strokeWidth="16" strokeLinecap="round" fill="none" />
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
const KEYS: (string | 'clear' | 'back')[] = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'clear', '0', 'back'];

function formatPhone(digits: string) {
  const d = digits.padEnd(11, '_');
  const seg = (s: string) => s.split('').map((ch, i) => <span key={i} className={ch === '_' ? 'is-ph' : ''}>{ch === '_' ? '0' : ch}</span>);
  return (
    <>
      {seg(d.slice(0, 3))}
      <span className="tps-phone-dash">-</span>
      {seg(d.slice(3, 7))}
      <span className="tps-phone-dash">-</span>
      {seg(d.slice(7, 11))}
    </>
  );
}

function HomeScreen({ digits, loading, onKey }: { digits: string; loading: boolean; onKey: (k: string) => void }) {
  return (
    <div className="tps-screen tps-home-screen">
      <div className="tps-home-left">
        <div className="tps-home-left-body">
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
              수집되는 성명, 주민등록번호, 연락처를 환자정보 전산처리, 질병관리본부 및 건강보험심사평가원 조회, 서비스 제공 알림톡 전송, 서비스 이용 기록 및 통계 분석을 통한 서비스
              개선을 위해 병원과 굿닥의 계약 종료시까지 위탁하여 처리하고 있습니다.
            </span>
          </div>
          <div className="tps-home-watermark" aria-hidden="true" />
        </div>
        <div className="tps-home-banner">
          <div>
            지금 여기서 가장 가까운 약국
            <br />
            굿닥에서 찾아보세요.
          </div>
          <IcPinMap />
        </div>
      </div>
      <div className="tps-home-right">
        <div className={`tps-home-input${loading ? ' is-loading' : ''}`}>
          <div className="tps-home-input-label">휴대전화번호 입력</div>
          <div className={`tps-phone${digits.length === 0 ? ' is-empty' : ''}`}>{formatPhone(digits)}</div>
        </div>
        {loading ? (
          <div className="tps-home-loading">
            <i className="tps-home-line" />
            <Spinner />
            <div>
              입력하신 번호로
              <br />
              진료 기록을 조회하고 있습니다.
            </div>
          </div>
        ) : (
          <div className="tps-keypad">
            {KEYS.map((k) => (
              <button key={k} type="button" className={`tps-key${k === 'clear' ? ' is-clear' : ''}`} onClick={() => onKey(k)}>
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

function Tablet({ opt, onLog, resetKey }: { opt: Options; onLog: (msg: string) => void; resetKey: number }) {
  const results = useMemo(() => PATIENTS.slice(0, opt.resultCount), [opt.resultCount]);
  const initialSelected = opt.autoSelect && results.length === 1 ? results[0].id : null;
  const [screen, setScreen] = useState<Screen>(opt.start);
  const [digits, setDigits] = useState(opt.start === 'select' ? KNOWN_PHONE : '');
  const [loading, setLoading] = useState(false);
  const [found, setFound] = useState(opt.start === 'select');
  const [selected, setSelected] = useState<string | null>(initialSelected);
  const [sheet, setSheet] = useState(false);
  const timer = useRef<number | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const resetAll = () => {
    if (timer.current) window.clearTimeout(timer.current);
    setScreen(opt.start);
    setDigits(opt.start === 'select' ? KNOWN_PHONE : '');
    setLoading(false);
    setFound(opt.start === 'select');
    setSelected(initialSelected);
    setSheet(false);
  };

  // 조건이 바뀌면 처음 진입 상태로 되돌린다
  useEffect(() => {
    resetAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opt.start, opt.resultCount, opt.autoSelect, opt.placement, opt.copy, opt.instruction, opt.intercept, resetKey]);

  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);

  const shown = found ? results : [];
  const selectedPatient = shown.find((p) => p.id === selected) ?? null;
  const copy = COPY[opt.copy];
  const cardCount = shown.length + (opt.placement === 'card' ? 1 : 0);

  const home = (via = '처음으로') => {
    resetAll();
    setScreen('home');
    setDigits('');
    setFound(false);
    onLog(`${via} → 대기화면(번호 입력)`);
  };

  const onKey = (k: string) => {
    if (loading) return;
    if (k === 'clear') {
      setDigits('');
      onLog('키패드 전체 삭제');
      return;
    }
    if (k === 'back') {
      setDigits((d) => d.slice(0, -1));
      return;
    }
    const next = (digits + k).slice(0, 11);
    setDigits(next);
    if (next.length === 11) {
      setLoading(true);
      const isKnown = next === KNOWN_PHONE;
      onLog(`번호 11자리 입력 완료 → 조회 중 (${isKnown ? '등록된 번호' : '미등록 번호'})`);
      timer.current = window.setTimeout(() => {
        setLoading(false);
        if (isKnown) {
          setFound(true);
          setSelected(initialSelected);
          setScreen('select');
          onLog(`조회 결과 ${results.length}명 → 환자 선택${initialSelected ? ' (자동 선택 상태)' : ''}`);
        } else {
          setFound(false);
          setScreen('register');
          onLog('조회 결과 없음 → 새 환자 등록으로 바로 이동');
        }
      }, 1400);
    }
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
    if (opt.intercept && shown.length > 0) {
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

  const onWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const el = listRef.current;
    if (!el || el.scrollWidth <= el.clientWidth) return;
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) el.scrollLeft += e.deltaY;
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
    return (
      <div className="tps-screen">
        <Topbar active={0} onHome={() => home()} />
        <div className="tps-placeholder">
          <div className="tps-ph-title">{found ? copy.title : '새 환자 등록'}</div>
          <div className="tps-ph-desc">
            {found
              ? '이름 · 주민등록번호 · 전화번호 입력 폼이 이어집니다(현행 폼은 재현하지 않음). 조회된 환자가 있는데 이 화면까지 왔다면 VOC와 같은 오탭입니다.'
              : '입력하신 번호로 조회된 진료 기록이 없어 환자 선택 없이 바로 등록으로 왔습니다. 이름 · 주민등록번호 · 전화번호 입력 폼이 이어집니다(현행 폼은 재현하지 않음).'}
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
        {opt.instruction && <div className="tps-instruction">접수할 환자를 선택하고 ‘다음’을 눌러 주세요.</div>}
        <div className={`tps-list${cardCount > 2 ? ' is-scroll' : ''}`} ref={listRef} onWheel={onWheel}>
          {shown.map((p) => (
            <PatientCard key={p.id} p={p} selected={selected === p.id} onTap={() => tapPatient(p)} />
          ))}
          {opt.placement === 'card' && <NewPatientCard copy={opt.copy} onTap={() => tapNew(`'${copy.title}' 카드`)} />}
        </div>
        {opt.placement === 'link' && (
          <div className="tps-linkrow">
            <span className="tps-linkrow-prefix">{copy.linkPrefix}</span>
            <button type="button" className="tps-linkrow-btn" onClick={() => tapNew(`'${copy.linkLabel}' 링크`)}>
              {copy.linkLabel}
              <IcChevron />
            </button>
          </div>
        )}
      </div>
      <div className={`tps-cta${opt.placement === 'bar' ? ' has-bar' : ''}`}>
        {opt.placement === 'bar' && (
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
            <div className="tps-sheet-title">{shown.length === 1 ? `${shown[0].name}님이 아니신가요?` : '조회된 환자가 아니신가요?'}</div>
            <div className="tps-sheet-desc">
              {shown.length === 1 ? '본인이시라면 아래 버튼으로 바로 접수할 수 있어요. 처음부터 다시 입력하지 않아도 됩니다.' : '조회된 환자 중 본인을 고르면 바로 접수할 수 있어요.'}
            </div>
            <div className="tps-sheet-actions">
              {shown.length === 1 ? (
                <button
                  type="button"
                  className="tps-btn tps-btn-next is-active"
                  onClick={() => {
                    setSelected(shown[0].id);
                    setSheet(false);
                    setScreen('next');
                    onLog(`시트 '${shown[0].name}입니다 · 바로 접수' → 진료실 선택 진입`);
                  }}
                >
                  네, {shown[0].name}입니다 · 바로 접수
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
        <button key={String(o.v)} type="button" role="radio" aria-checked={o.v === value} className={`tps-seg-btn${o.v === value ? ' is-on' : ''}`} onClick={() => onChange(o.v)}>
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

function App() {
  const [opt, setOpt] = useState<Options>({ start: 'home', resultCount: 1, ...PRESETS.asis.options });
  const [log, setLog] = useState<LogItem[]>([]);
  const [resetKey, setResetKey] = useState(0);

  const activePreset = (Object.keys(PRESETS) as PresetKey[]).find((k) => {
    const p = PRESETS[k].options;
    return p.autoSelect === opt.autoSelect && p.placement === opt.placement && p.copy === opt.copy && p.instruction === opt.instruction && p.intercept === opt.intercept;
  });

  const set = <K extends keyof Options>(key: K, v: Options[K]) => {
    setOpt((o) => ({ ...o, [key]: v }));
    setLog([]);
    setResetKey((k) => k + 1);
  };
  const applyPreset = (k: PresetKey) => {
    setOpt((o) => ({ ...o, ...PRESETS[k].options }));
    setLog([]);
    setResetKey((n) => n + 1);
  };
  const addLog = (msg: string) => setLog((l) => [{ t: nowLabel(), msg }, ...l]);

  return (
    <div className="tps-root bb">
      <div className="tps-bar">
        <div className="tps-bar-title">
          <strong>태블릿 접수 · 환자 조회 → 환자 선택</strong>
          <span>‘새 환자 등록’ 오탭 UX 개선 체험판 · 검토용 초안 v0.2</span>
        </div>
        <div className="tps-presets">
          {(Object.keys(PRESETS) as PresetKey[]).map((k) => (
            <button key={k} type="button" className={`tps-preset${activePreset === k ? ' is-on' : ''}`} onClick={() => applyPreset(k)} title={PRESETS[k].desc}>
              {PRESETS[k].label}
            </button>
          ))}
          {!activePreset && <span className="tps-preset-custom">직접 조합</span>}
        </div>
      </div>

      <div className="tps-body">
        <aside className="tps-panel">
          <section className="tps-panel-card">
            <h3>조회 시나리오</h3>
            <Field label="시작 화면" hint="대기화면에서 번호를 치면 11자리에 자동 조회됩니다(As-is). 등록된 번호는 010-9924-0288, 다른 번호를 치면 조회 결과 없음 → 새 환자 등록으로 바로 이동합니다.">
              <Seg<Start>
                value={opt.start}
                options={[
                  { v: 'home', label: '대기화면(조회부터)' },
                  { v: 'select', label: '환자 선택부터' }
                ]}
                onChange={(v) => set('start', v)}
              />
            </Field>
            <Field label="등록된 번호의 조회 결과" hint="전화번호 조회는 가족이 함께 나올 수 있어 2명 케이스를 둡니다.">
              <Seg<ResultCount>
                value={opt.resultCount}
                options={[
                  { v: 1, label: '1명(본인)' },
                  { v: 2, label: '2명(본인+가족)' }
                ]}
                onChange={(v) => set('resultCount', v)}
              />
            </Field>
          </section>

          <section className="tps-panel-card">
            <h3>개선 변수</h3>
            <Field label="① 단일 결과 자동 선택" hint="1명이면 선택완료 상태로 진입하고 다음이 바로 활성. 2명 이상이면 적용 안 함.">
              <Seg<boolean>
                value={opt.autoSelect}
                options={[
                  { v: false, label: '끔(현행)' },
                  { v: true, label: '켬' }
                ]}
                onChange={(v) => set('autoSelect', v)}
              />
            </Field>
            <Field label="② 새 환자 등록 위치" hint="카드는 환자 카드와 같은 무게. 링크·바는 보조 동선으로 내립니다.">
              <Seg<Placement>
                value={opt.placement}
                options={[
                  { v: 'card', label: '카드(현행)' },
                  { v: 'link', label: '하단 링크' },
                  { v: 'bar', label: '다음 위 바' }
                ]}
                onChange={(v) => set('placement', v)}
              />
            </Field>
            <Field label="③ 카피" hint="현행 설명문은 ‘본인’·‘진료 접수’가 들어 있어 본인 접수 경로로 읽힙니다. 배제 조건형은 ‘조회된 분이 아닐 때만’으로 바꿉니다.">
              <Seg<CopyMode>
                value={opt.copy}
                options={[
                  { v: 'asis', label: '현행' },
                  { v: 'exclusive', label: '배제 조건형' }
                ]}
                onChange={(v) => set('copy', v)}
              />
            </Field>
            <Field label="④ 안내 문구" hint="‘선택 후 다음’ 2단계 조작을 화면에 적습니다. ①을 켜면 필요가 줄어듭니다.">
              <Seg<boolean>
                value={opt.instruction}
                options={[
                  { v: false, label: '없음(현행)' },
                  { v: true, label: '있음' }
                ]}
                onChange={(v) => set('instruction', v)}
              />
            </Field>
            <Field label="⑤ 잘못 눌렀을 때 확인 시트" hint="조회 결과가 있는데 새 환자 등록을 누르면 ‘{이름}님이 아니신가요?’로 가로챕니다. 구조를 못 바꿀 때의 차선.">
              <Seg<boolean>
                value={opt.intercept}
                options={[
                  { v: false, label: '끔(현행)' },
                  { v: true, label: '켬' }
                ]}
                onChange={(v) => set('intercept', v)}
              />
            </Field>
          </section>

          <section className="tps-panel-card">
            <div className="tps-log-head">
              <h3>행동 기록{log.length > 0 && <span className="tps-log-count"> · {log.length}</span>}</h3>
              <button
                type="button"
                className="tps-mini"
                onClick={() => {
                  setLog([]);
                  setResetKey((k) => k + 1);
                }}
              >
                초기화
              </button>
            </div>
            {log.length === 0 ? (
              <div className="tps-log-empty">태블릿 화면을 눌러 보세요. 탭 순서가 여기에 쌓입니다. 조건을 바꾸면 비워집니다.</div>
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
        </aside>

        <Stage>
          <Tablet opt={opt} onLog={addLog} resetKey={resetKey} />
        </Stage>
      </div>
    </div>
  );
}

export default App;
