/**
 * ─────────────────────────────────────────────────────────────
 * 이름      : tablet-patient-select — 태블릿 접수 '환자 조회 → 1. 환자 선택' · 새 환자 등록 오탭 UX 개선 체험판
 * 상태      : B안 최종 · v0.9 · 최종수정 2026-11-26
 * PRD       : 없음(VOC 기반). 병원 VOC: 조회된 본인 카드가 떠도 환자가 '새 환자 등록'을 눌러 정보를 처음부터 다시 입력(고령 재진 환자 중심, 하루 3명).
 *             사내 논의 링크는 공개 저장소라 미기재.
 * 배포URL   : https://connect-sq-sandbox.github.io/out/tablet-patient-select.html
 * 피그마    : DEV 파일 POC_대상선택 V2(도착확인/접수 × 1건/복수 4케이스) · 대기화면은 POC_대기화면_환자조회(입력 전/조회 중)
 *             기준선: 2026-11-23 figma-reader 속성표(공개 저장소라 파일키·노드ID 미기재)
 * 관련 CSS  : styles/tabletPatientSelect.css (피그마 값 그대로 px, 1920×1200 프레임을 transform scale로 축소)
 * 에셋      : assets/tablet-patient-select/banner.png (피그마 하단 배너 래스터 원본 977×228). BI 심볼·워터마크는 goodoc-design 정본 logo_symbol.svg path.
 * 기술제약  : 샌드박스 빌드는 emotion/styled 금지 → plain CSS. 외부 요청 0. 가상 데이터·메모리 상태만.
 * 화면구성  : 상단 제목 바 + 좌측 패널(조회 시나리오 · 행동 기록) + 1920×1200 태블릿 프레임
 *             (대기화면 키패드 → 조회 중 → 환자 선택/도착 환자 선택 → 다음·도착 확인·등록 자리표시)
 *
 * 핵심 결정(why)
 *  - [확정·세화] B안 하나만 둔다. 화면 값(탑바, 카드, 선택/미선택, 뱃지, 진입점 줄, CTA)은 DEV 피그마 POC_대상선택 V2 그대로.
 *  - [확정·세화] 조회 결과 1건이면 카드가 선택된 채 진입하고 CTA가 활성. 복수면 선택 없이 진입하고 CTA 비활성. 카드를 다시 누르면 선택 해제.
 *  - [확정·세화] 진입점은 카드 목록 아래 한 줄. 도착확인 '원하는 사람이 목록에 없으신가요?' + '새 진료 접수 >', 현장접수 '조회된 분이 아니신가요?' + '다른 환자 등록 >'.
 *  - [확정·세화] 텍스트 버튼 터치 영역은 버튼에만 둔다(안내 문구·줄 전체는 누르지 않음). 보이는 위치·크기는 그대로, 터치 영역만 왼쪽 16·오른쪽 24 확장, 높이 80
 *    (도착확인 288×80, 현장접수 322×80, 글자 렌더 폭 차이로 피그마 323보다 1px 작음). 투명 padding + 같은 크기 음수 margin.
 *  - [확정·세화] 도착확인(앱에서 미리 접수·예약한 환자가 병원에서 도착을 알리는 흐름)도 같은 체험판에 둔다. 좌측 '접수 유형'으로 현장접수/도착확인 전환.
 *    '새 진료 접수'를 누르면 같은 번호의 차트 환자를 다시 조회해 현장접수 환자 선택으로 이어진다. 도착 환자 선택은 복수 선택 가능(현행).
 *  - [확정·세화] 조회 결과 수: 도착확인 1건/복수 3건, 현장접수 1명/복수 2명(피그마 케이스 그대로).
 *  - [확정·세화] 초기 환자 조회 시퀀스(대기화면 → 조회 중 → 결과)부터 체험한다. 키패드는 실제 번호 입력을 구현하지 않고, 아무 키나 누르면 번호 자동 채움 → 조회 중 → 결과.
 *  - [확정·세화] 조회 결과 없음은 체험판 범위 밖. 실제 동작은 환자 선택 없이 새 환자 등록으로 바로 간다.
 *  - [유지·자체] 도착확인 복수는 카드 3장이 화면보다 넓어(피그마는 잘림) 가로 스크롤로 둔다. 데스크톱 검토용으로 세로 휠을 가로 스크롤로 돌린다.
 *  - [유지·자체] 다음 · 도착 확인 · 다른 환자 등록 이후 화면은 자리표시만 둔다. 행동 기록은 자르지 않고 전부 쌓아 탭 수를 센다. 시나리오가 바뀌면 기록을 비운다.
 *  - [유지·자체] 병원별 '새 환자 등록 숨김' 옵션은 넣지 않았다. 해당 병원도 초진을 태블릿으로 받으므로 신환 동선을 막는 안은 후순위.
 *  - [유지·자체] 환자 카드 보더는 CSS border 대신 inset box-shadow로 그려 피그마(stroke 안쪽, 내용 위치 불변)와 좌표를 맞춘다.
 *  - [유지·자체] 태블릿 프레임 표시 배율 상한 0.6(1152×720). 큰 모니터에서 과하게 커지지 않게.
 *
 * 보류·TODO (PO 확인 대기)
 *  - [보류] 태블릿에서 '새 환자 등록'으로 등록되는 건 중 기존 환자 중복 비중(데이터 요청 중).
 *  - [보류] 같은 주민번호로 새 환자 등록을 진행할 때 차트 측 중복 생성 여부(막히는지, 중복이 쌓이는지).
 *  - [보류] 전화번호 조회로 가족 여러 명이 나오는 병원의 비중(복수면 자동 선택이 안 걸림).
 *  - [보류] 주민등록번호 조회 경로는 미포함(대기화면 피그마가 휴대전화번호 입력만 있음).
 *
 * 변경 이력
 *  - v0.9 (2026-11-26) 도착확인 좌측 패널에 '진료실 정보 줄 테스트' 추가. 첫 카드의 노출명, 진료실명(차트), 의사명, 진료과명을 입력하면 1줄 규칙
 *    (합 15자 초과 시 가장 긴 항목부터 한 글자씩 줄이고 '…', 같은 길이는 진료과명→의사명→진료실명 순) 결과와 실제 폭을 바로 보여 준다.
 *  - v0.8 (2026-11-23) B안 최종: 시안 As-is/A/C·직접 조합·확인 시트·카드/바 진입점 제거, 좌측 시안 카드 제거. DEV 피그마 POC_대상선택 V2 값으로 맞춤
 *    (도착확인 카드 칩·진료실 정보, 복수 3장/2장, 진입점 줄 80, CTA). 텍스트 버튼 터치 영역 확장.
 *  - v0.7 (2026-11-23) 도착확인 화면 추가(접수 유형 전환, 도착 환자 선택·도착 확인 결과 자리표시, 새 진료 접수 → 현장접수 환자 선택 연결). 시안 A/B/C를 두 화면에 같이 적용.
 *  - v0.6 (2026-11-19) 태블릿 프레임 표시 크기 상한(배율 0.6, 1152×720). 큰 모니터에서 과하게 커지던 것 방지.
 *  - v0.5 (2026-10-02) 조회 시나리오에서 '없음 → 등록 직행' 제거(세화님 요청). 결과 없음 분기 코드 정리.
 *  - v0.4 (2026-10-02) 시안 선택을 상단 바에서 좌측 패널 첫 카드로 합침(바뀐 것 목록과 한 카드). 상단 바는 제목 + 현재 시안 이름.
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

/* ---------- 가상 데이터 (피그마 POC_대상선택 V2 원문) ---------- */
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
const HOSPITAL_NAME = '베스트굿닥병원';

/* 현장접수 조회 결과: 1명 = [0], 복수 = 2명 */
const PATIENTS: Patient[] = [
  { id: 'p1', name: '김첫째', gender: '남', age: 1, birth: '2024. 08. 02', phone: '010-9924-0288', lastVisit: '2025년 3월 4일' },
  { id: 'p2', name: '김엄마', gender: '여', age: 34, birth: '1991. 06. 29', phone: '010-9924-0288', lastVisit: '2025년 1월 28일' }
];

/* 도착확인 대상(앱에서 미리 접수·예약한 건): 1건 = [0], 복수 = 3건 */
type Arrival = {
  id: string;
  name: string;
  gender: '남' | '여';
  age: number;
  birth: string;
  phone: string;
  chip: string;
  alias: string;
  room: string;
  doctor: string;
  dept: string;
};
const ARRIVALS: Arrival[] = [
  { id: 'a1', name: '김첫째', gender: '남', age: 3, birth: '2022. 08. 26', phone: '010-9924-0288', chip: '오전 9:57 굿닥 접수', alias: '토끼방', room: '1진료실', doctor: '류현아', dept: '소아청소년과' },
  { id: 'a2', name: '김둘째', gender: '여', age: 2, birth: '2023. 06. 20', phone: '010-9924-0288', chip: '오전 10:30 굿닥 예약', alias: '공룡방', room: '2진료실', doctor: '이굿닥', dept: '소아청소년과' },
  { id: 'a3', name: '김셋째', gender: '여', age: 0, birth: '2025. 01. 20', phone: '010-9924-0288', chip: '오전 11:30 카카오 예약', alias: '공룡방', room: '2진료실', doctor: '이굿닥', dept: '소아청소년과' }
];

const STEPS = ['1. 환자 선택', '2. 진료실 선택', '3. 내원 목적', '4. 접수 결과'];
const ARRIVAL_STEPS = ['1. 도착 환자 선택', '2. 도착 확인 결과'];

/* 목록 아래 진입점 한 줄 */
const ENTRY = {
  walkin: { prefix: '조회된 분이 아니신가요?', label: '다른 환자 등록' },
  arrival: { prefix: '원하는 사람이 목록에 없으신가요?', label: '새 진료 접수' }
} as const;

type Flow = 'walkin' | 'arrival';
type Lookup = 'one' | 'many';
type Start = 'home' | 'select';
type Scenario = { flow: Flow; start: Start; lookup: Lookup };

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
const IcCheck = () => (
  <svg width="54" height="54" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M5 12.5 10 17.5 19 7" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);
/* ic_arrow Right — 48×48 박스, 벡터 18×32 (x16 y8) */
const IcArrow = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" aria-hidden="true">
    <path d="M18 10l13 14-13 14" stroke="#115fd4" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
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
function Topbar({ active, onHome, steps = STEPS }: { active: number; onHome: () => void; steps?: string[] }) {
  return (
    <header className="tps-topbar">
      <button type="button" className="tps-home" onClick={onHome}>
        <IcHome />
        <span>처음으로</span>
      </button>
      <nav className="tps-tabs">
        {steps.map((label, i) => (
          <div key={label} className={`tps-tab${i === active ? ' is-active' : ''}`}>
            <span>{label}</span>
            {i === active && <Pin />}
          </div>
        ))}
      </nav>
    </header>
  );
}

function SelectedBadge() {
  return (
    <span className="tps-badge">
      <IcCheck />
      <span className="tps-badge-text">선택완료</span>
    </span>
  );
}

function PatientInfo({ name, gender, age, birth, phone }: { name: string; gender: string; age: number; birth: string; phone: string }) {
  return (
    <div className="tps-card-info">
      <div className="tps-name">{name}</div>
      <div className="tps-detail">
        <div className="tps-line">
          <span>{gender}</span>
          <i className="tps-dot" />
          <span>
            만 {age}세 ({birth})
          </span>
        </div>
        <div>{phone}</div>
      </div>
    </div>
  );
}

function PatientCard({ p, selected, onTap }: { p: Patient; selected: boolean; onTap: () => void }) {
  return (
    <button type="button" className={`tps-card tps-card-patient${selected ? ' is-selected' : ''}`} onClick={onTap} aria-pressed={selected}>
      <PatientInfo {...p} />
      <div className="tps-extra">
        <IcClock />
        <span>{p.lastVisit} 마지막 방문</span>
      </div>
      {selected && <SelectedBadge />}
    </button>
  );
}

/* 진료실 정보 줄 1줄 규칙(테스트):
   진료실명(차트), 의사명, 진료과명 글자 수 합(말줄임 '…' 1자 포함)이 15자를 넘으면 가장 긴 항목부터 한 글자씩 줄이고 '…'를 붙인다.
   15자 이하가 되면 멈춘다. 길이가 같으면 진료과명, 의사명, 진료실명 순으로 먼저 줄인다. */
const ROOM_LINE_BUDGET = 15;
type RoomLine = { room: string; doctor: string; dept: string };
function fitRoomLine(src: RoomLine, budget = ROOM_LINE_BUDGET): { line: RoomLine; total: number; before: number; trimmed: boolean } {
  // 줄이는 순서(길이가 같을 때): 진료과명 → 의사명 → 진료실명
  const keys: (keyof RoomLine)[] = ['dept', 'doctor', 'room'];
  const chars = { room: Array.from(src.room), doctor: Array.from(src.doctor), dept: Array.from(src.dept) };
  const n = { room: chars.room.length, doctor: chars.doctor.length, dept: chars.dept.length };
  const cut = { room: false, doctor: false, dept: false };
  const shown = (k: keyof RoomLine) => n[k] + (cut[k] ? 1 : 0);
  const sum = () => keys.reduce((s, k) => s + shown(k), 0);
  const before = sum();
  let guard = 0;
  while (sum() > budget && guard++ < 200) {
    let pick: keyof RoomLine | null = null;
    for (const k of keys) {
      if (n[k] <= 1) continue;
      if (pick === null || shown(k) > shown(pick)) pick = k;
    }
    if (!pick) break;
    n[pick] -= 1;
    cut[pick] = true;
  }
  const out = (k: keyof RoomLine) => (cut[k] ? `${chars[k].slice(0, n[k]).join('')}…` : src[k]);
  return { line: { room: out('room'), doctor: out('doctor'), dept: out('dept') }, total: sum(), before, trimmed: keys.some((k) => cut[k]) };
}

type RoomTest = { alias: string } & RoomLine;
type LineMeasure = { used: number; avail: number };

function ArrivalCard({
  a,
  selected,
  onTap,
  test,
  onMeasure
}: {
  a: Arrival;
  selected: boolean;
  onTap: () => void;
  test?: RoomTest | null;
  onMeasure?: (m: LineMeasure) => void;
}) {
  const subRef = useRef<HTMLDivElement>(null);
  const alias = test ? test.alias : a.alias;
  const line = test ? fitRoomLine(test).line : { room: a.room, doctor: a.doctor, dept: a.dept };
  const parts = [line.room, line.doctor, line.dept].filter((s) => s !== '');
  const [overflow, setOverflow] = useState(false);

  useLayoutEffect(() => {
    const el = subRef.current;
    if (!el) return;
    // transform scale은 레이아웃 폭에 영향을 주지 않으므로 scrollWidth/clientWidth가 1920 기준 px
    const kids = Array.from(el.children) as HTMLElement[];
    const gap = parseFloat(getComputedStyle(el).columnGap) || 0;
    const used = kids.reduce((s, c) => s + c.offsetWidth, 0) + gap * Math.max(0, kids.length - 1);
    const avail = el.clientWidth;
    setOverflow(used > avail + 0.5);
    onMeasure?.({ used, avail });
  });

  return (
    <button type="button" className={`tps-card tps-card-patient tps-card-arrival${selected ? ' is-selected' : ''}`} onClick={onTap} aria-pressed={selected}>
      <div className="tps-arr-chip-row">
        <span className="tps-arr-chip">{a.chip}</span>
      </div>
      <PatientInfo {...a} />
      <div className="tps-arr-room">
        <div className="tps-arr-room-name">{alias}</div>
        <div className={`tps-arr-room-sub${test ? ' is-test' : ''}${test && overflow ? ' is-overflow' : ''}`} ref={subRef}>
          {parts.map((s, i) => (
            <React.Fragment key={i}>
              {i > 0 && <i className="tps-dot" />}
              <span>{s}</span>
            </React.Fragment>
          ))}
        </div>
      </div>
      {selected && <SelectedBadge />}
    </button>
  );
}

/* 목록 아래 진입점: 안내 문구는 누르지 않고, 텍스트 버튼만 누른다 */
function EntryRow({ prefix, label, onTap }: { prefix: string; label: string; onTap: () => void }) {
  return (
    <div className="tps-entry">
      <span className="tps-entry-label">{prefix}</span>
      <button type="button" className="tps-entry-btn" onClick={onTap}>
        <span>{label}</span>
        <IcArrow />
      </button>
    </div>
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

type Screen = 'home' | 'select' | 'next' | 'register' | 'arrival' | 'arrivalDone';
type LogItem = { t: string; msg: string };

function nowLabel() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
}

function Tablet({
  scenario,
  onLog,
  resetKey,
  roomTest,
  onMeasure
}: {
  scenario: Scenario;
  onLog: (msg: string) => void;
  resetKey: number;
  roomTest: RoomTest | null;
  onMeasure: (m: LineMeasure) => void;
}) {
  const many = scenario.lookup === 'many';
  const results = useMemo(() => (many ? PATIENTS : PATIENTS.slice(0, 1)), [many]);
  const arrivals = useMemo(() => (many ? ARRIVALS : ARRIVALS.slice(0, 1)), [many]);
  const phone = KNOWN_PHONE;
  // 1건이면 선택된 채 진입, 복수면 선택 없이 진입
  const initialSelected = results.length === 1 ? results[0].id : null;
  const initialArr = arrivals.length === 1 ? [arrivals[0].id] : [];
  const isArrival = scenario.flow === 'arrival';
  const startScreen: Screen = scenario.start === 'select' ? (isArrival ? 'arrival' : 'select') : 'home';

  const [screen, setScreen] = useState<Screen>(startScreen);
  const [digits, setDigits] = useState(scenario.start === 'select' ? phone : '');
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string | null>(initialSelected);
  const [arrSel, setArrSel] = useState<string[]>(initialArr);
  const [overlay, setOverlay] = useState(false);
  const timers = useRef<number[]>([]);
  const listRef = useRef<HTMLDivElement>(null);

  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };
  const resetAll = (to: Screen, digitsValue: string) => {
    clearTimers();
    setScreen(to);
    setDigits(digitsValue);
    setLoading(false);
    setSelected(initialSelected);
    setArrSel(initialArr);
    setOverlay(false);
  };

  // 시나리오가 바뀌면 처음 진입 상태로 되돌린다
  useEffect(() => {
    resetAll(startScreen, scenario.start === 'select' ? phone : '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenario.flow, scenario.start, scenario.lookup, resetKey]);
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

  const home = (via = '처음으로') => {
    resetAll('home', '');
    onLog(`${via} → 대기화면`);
  };

  // 키패드: 아무 키나 누르면 번호가 자동으로 채워지고 조회로 넘어간다
  const onKey = () => {
    if (loading || timers.current.length > 0) return;
    onLog('키패드 탭 → 번호 자동 입력');
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
        if (isArrival) {
          setArrSel(initialArr);
          setScreen('arrival');
          onLog(`도착확인 대상 ${arrivals.length}건 → 도착 환자 선택${initialArr.length ? ' (선택된 채 진입)' : ''}`);
          return;
        }
        setSelected(initialSelected);
        setScreen('select');
        onLog(`조회 결과 ${results.length}명 → 환자 선택${initialSelected ? ' (선택된 채 진입)' : ''}`);
      }, 70 * 11 + 200 + 1400)
    );
  };

  if (screen === 'home') {
    return <HomeScreen digits={digits} loading={loading} onKey={onKey} />;
  }

  /* ---------- 현장접수 ---------- */
  const tapPatient = (p: Patient) => {
    if (selected === p.id) {
      setSelected(null);
      onLog(`${p.name} 카드 탭 → 선택 해제`);
    } else {
      setSelected(p.id);
      onLog(`${p.name} 카드 탭 → 선택완료`);
    }
  };
  const tapRegister = () => {
    setScreen('register');
    onLog(`'${ENTRY.walkin.label}' 탭 → 새 환자 등록 화면으로 이동`);
  };
  const tapNext = () => {
    if (!selectedPatient) {
      onLog('다음 탭 → 비활성(선택 없음)');
      return;
    }
    setScreen('next');
    onLog(`다음 탭 → ${ro(selectedPatient.name)} 진료실 선택 진입`);
  };

  /* ---------- 도착확인 ---------- */
  const tapArrival = (a: Arrival) => {
    const wasOn = arrSel.includes(a.id);
    setArrSel((prev) => (prev.includes(a.id) ? prev.filter((id) => id !== a.id) : [...prev, a.id]));
    onLog(`${a.name} 카드 탭 → ${wasOn ? '선택 해제' : '선택완료'}`);
  };
  // 새 진료 접수: 같은 번호로 차트 환자를 다시 조회해 현장접수의 환자 선택으로 넘어간다(현행 동작)
  const tapNewReceipt = () => {
    if (timers.current.length > 0) return;
    setOverlay(true);
    onLog(`'${ENTRY.arrival.label}' 탭 → 진료 기록 조회 중`);
    timers.current.push(
      window.setTimeout(() => {
        timers.current = [];
        setOverlay(false);
        setSelected(initialSelected);
        setScreen('select');
        onLog(`조회 결과 ${results.length}명 → 현장접수 환자 선택${initialSelected ? ' (선택된 채 진입)' : ''}`);
      }, 900)
    );
  };
  const tapArrive = () => {
    if (arrSel.length === 0) {
      onLog('도착 확인 탭 → 비활성(선택 없음)');
      return;
    }
    setScreen('arrivalDone');
    onLog(`도착 확인 탭 → ${arrSel.length}건 도착 확인 진행`);
  };
  const arrNames = arrivals.filter((a) => arrSel.includes(a.id)).map((a) => a.name);

  const placeholder = (active: number, steps: string[] | undefined, title: string, desc: string) => (
    <div className="tps-screen">
      <Topbar active={active} steps={steps} onHome={() => home()} />
      <div className="tps-placeholder">
        <div className="tps-ph-title">{title}</div>
        <div className="tps-ph-desc">{desc}</div>
        <button type="button" className="tps-btn tps-btn-secondary" onClick={() => home("'처음으로 돌아가기'")}>
          처음으로 돌아가기
        </button>
      </div>
    </div>
  );

  if (screen === 'arrivalDone') {
    return placeholder(1, ARRIVAL_STEPS, '2. 도착 확인 결과', `${arrNames.join(', ')}님 도착 확인을 진행합니다. 이 체험판에서는 결과 화면을 재현하지 않습니다.`);
  }
  if (screen === 'next') {
    return placeholder(1, undefined, '2. 진료실 선택', `${ro(selectedPatient?.name ?? '환자')} 접수를 진행합니다. 이 체험판에서는 진료실 선택 이후를 재현하지 않습니다.`);
  }
  if (screen === 'register') {
    return placeholder(
      0,
      undefined,
      ENTRY.walkin.label,
      '이름, 주민등록번호, 전화번호 입력 폼이 이어집니다(현행 폼은 재현하지 않음). 조회된 환자가 있는데 이 화면까지 왔다면 VOC와 같은 오탭입니다.'
    );
  }

  if (screen === 'arrival') {
    const active = arrSel.length > 0;
    return (
      <div className="tps-screen">
        <Topbar active={0} steps={ARRIVAL_STEPS} onHome={() => home()} />
        <div className="tps-content">
          <div className={`tps-list${arrivals.length > 2 ? ' is-scroll' : ''}`} ref={listRef}>
            {arrivals.map((a, i) => (
              <ArrivalCard
                key={a.id}
                a={a}
                selected={arrSel.includes(a.id)}
                onTap={() => tapArrival(a)}
                test={i === 0 ? roomTest : null}
                onMeasure={i === 0 ? onMeasure : undefined}
              />
            ))}
          </div>
          <EntryRow prefix={ENTRY.arrival.prefix} label={ENTRY.arrival.label} onTap={tapNewReceipt} />
        </div>
        <div className="tps-cta">
          <button type="button" className={`tps-btn tps-btn-next${active ? ' is-active' : ''}`} onClick={tapArrive} aria-disabled={!active}>
            도착 확인
          </button>
        </div>

        {overlay && (
          <div className="tps-dim" role="status">
            <div className="tps-overlay-box">
              <Spinner />
              <div>진료 기록을 조회하고 있습니다.</div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="tps-screen">
      <Topbar active={0} onHome={() => home()} />
      <div className="tps-content">
        <div className={`tps-list${results.length > 2 ? ' is-scroll' : ''}`} ref={listRef}>
          {results.map((p) => (
            <PatientCard key={p.id} p={p} selected={selected === p.id} onTap={() => tapPatient(p)} />
          ))}
        </div>
        <EntryRow prefix={ENTRY.walkin.prefix} label={ENTRY.walkin.label} onTap={tapRegister} />
      </div>
      <div className="tps-cta">
        <button type="button" className={`tps-btn tps-btn-next${selectedPatient ? ' is-active' : ''}`} onClick={tapNext} aria-disabled={!selectedPatient}>
          다음
        </button>
      </div>
    </div>
  );
}

/* ---------- 캔버스(스케일) ---------- */
// 큰 모니터에서 프레임이 과하게 커지지 않게 하는 상한. 0.6 = 1152×720.
const MAX_SCALE = 0.6;
function Stage({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const w = el.clientWidth - 48;
      const h = el.clientHeight - 48;
      setScale(Math.max(0.12, Math.min(MAX_SCALE, w / 1920, h / 1200)));
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

function App() {
  const [scenario, setScenario] = useState<Scenario>({ flow: 'walkin', start: 'home', lookup: 'one' });
  const [log, setLog] = useState<LogItem[]>([]);
  const [resetKey, setResetKey] = useState(0);

  const bump = () => {
    setLog([]);
    setResetKey((k) => k + 1);
  };
  const setScn = <K extends keyof Scenario>(key: K, v: Scenario[K]) => {
    setScenario((o) => ({ ...o, [key]: v }));
    bump();
  };
  const addLog = (msg: string) => setLog((l) => [{ t: nowLabel(), msg }, ...l]);

  const isArrivalFlow = scenario.flow === 'arrival';

  // 진료실 정보 줄 테스트(도착확인 첫 카드에 바로 반영)
  const ROOM_DEFAULT: RoomTest = { alias: ARRIVALS[0].alias, room: ARRIVALS[0].room, doctor: ARRIVALS[0].doctor, dept: ARRIVALS[0].dept };
  const ROOM_PRESETS: { label: string; v: RoomTest }[] = [
    { label: '기본', v: ROOM_DEFAULT },
    { label: '진료과명만 김', v: { alias: '원장님 진료실', room: '원장님진료실', doctor: '김철수', dept: '한방안·이비인후·피부과' } },
    { label: '진료실·진료과 김', v: { alias: '원장님 진료실', room: '진료실명열글자말줄임', doctor: '류현아', dept: '진료과명말줄임없음' } },
    { label: '셋 다 김', v: { alias: '진료실명한줄말줄임처리가나다라마바사', room: '진료실명열글자말줄임', doctor: '의사명여덟글자말', dept: '진료과명말줄임없음안됨' } }
  ];
  const [roomTestOn, setRoomTestOn] = useState(false);
  const [roomTest, setRoomTest] = useState<RoomTest>(ROOM_DEFAULT);
  const [measure, setMeasure] = useState<LineMeasure | null>(null);
  const onMeasure = (m: LineMeasure) =>
    setMeasure((o) => (o && Math.abs(o.used - m.used) < 0.5 && Math.abs(o.avail - m.avail) < 0.5 ? o : m));
  const fit = fitRoomLine(roomTest);
  const setRoomField = (k: keyof RoomTest, v: string) => setRoomTest((o) => ({ ...o, [k]: v }));
  const lenOf = (s: string) => Array.from(s).length;

  return (
    <div className="tps-root bb">
      <div className="tps-bar">
        <div className="tps-bar-title">
          <strong>태블릿 접수 · 도착확인 · 환자 조회 → 환자 선택</strong>
          <span>‘새 환자 등록’ 오탭 UX 개선 체험판 · B안 최종 v0.9</span>
        </div>
      </div>

      <div className="tps-body">
        <aside className="tps-panel">
          <section className="tps-panel-card">
            <h3>조회 시나리오</h3>
            <Field label="접수 유형" hint="현장접수는 병원에서 바로 접수하는 흐름, 도착확인은 앱에서 미리 접수·예약한 환자가 병원에 와서 도착을 알리는 흐름입니다.">
              <Seg<Flow>
                value={scenario.flow}
                options={[
                  { v: 'walkin', label: '현장접수' },
                  { v: 'arrival', label: '도착확인' }
                ]}
                onChange={(v) => setScn('flow', v)}
              />
            </Field>
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
            <Field
              label={isArrivalFlow ? '도착확인 대상' : '조회 결과'}
              hint={
                isArrivalFlow
                  ? '1건이면 선택된 채 진입해 도착 확인이 바로 활성, 복수면 직접 고릅니다. ‘새 진료 접수’를 누르면 현장접수의 환자 선택으로 이어집니다.'
                  : '1명이면 선택된 채 진입해 다음이 바로 활성, 복수(가족)면 직접 고릅니다.'
              }
            >
              <Seg<Lookup>
                value={scenario.lookup}
                options={
                  isArrivalFlow
                    ? [
                        { v: 'one', label: '1건' },
                        { v: 'many', label: '복수(3건)' }
                      ]
                    : [
                        { v: 'one', label: '1명' },
                        { v: 'many', label: '복수(2명)' }
                      ]
                }
                onChange={(v) => setScn('lookup', v)}
              />
            </Field>
          </section>

          {isArrivalFlow && (
            <section className="tps-panel-card">
              <div className="tps-log-head">
                <h3>진료실 정보 줄 테스트</h3>
                <button type="button" className="tps-mini" onClick={() => setRoomTestOn((v) => !v)}>
                  {roomTestOn ? '끄기' : '켜기'}
                </button>
              </div>
              <div className="tps-rt-rule">
                <strong>1줄 규칙</strong>
                진료실명(차트), 의사명, 진료과명 글자 수 합(말줄임 ‘…’ 1자 포함)이 15자를 넘으면, 가장 긴 항목부터 한 글자씩 줄이고 ‘…’를 붙인다. 15자 이하가 되면
                멈춘다. 길이가 같으면 진료과명, 의사명, 진료실명 순으로 먼저 줄인다.
              </div>
              {!roomTestOn ? (
                <div className="tps-log-empty">켜면 도착확인 첫 번째 카드의 진료실명, 의사명, 진료과명을 직접 입력해 1줄 규칙 결과를 바로 볼 수 있습니다.</div>
              ) : (
                <>
                  {scenario.start === 'home' && (
                    <button type="button" className="tps-mini tps-rt-go" onClick={() => setScn('start', 'select')}>
                      도착 환자 선택 화면으로 바로 보기
                    </button>
                  )}
                  <div className="tps-rt-presets">
                    {ROOM_PRESETS.map((p) => (
                      <button key={p.label} type="button" className="tps-mini" onClick={() => setRoomTest(p.v)}>
                        {p.label}
                      </button>
                    ))}
                  </div>
                  {(
                    [
                      ['alias', '진료실 노출명(제목 줄, 1줄 말줄임)'],
                      ['room', '진료실명(차트)'],
                      ['doctor', '의사명'],
                      ['dept', '진료과명']
                    ] as [keyof RoomTest, string][]
                  ).map(([k, label]) => (
                    <label key={k} className="tps-rt-field">
                      <span className="tps-rt-label">
                        {label}
                        <em>{lenOf(roomTest[k])}자</em>
                      </span>
                      <input className="tps-rt-input" value={roomTest[k]} onChange={(e) => setRoomField(k, e.target.value)} />
                    </label>
                  ))}
                  <div className="tps-rt-result">
                    <div>
                      합계 {fit.before}자 → {fit.trimmed ? <strong>{fit.total}자로 줄임</strong> : '줄이지 않음'} (기준 {ROOM_LINE_BUDGET}자)
                    </div>
                    <div className="tps-rt-line">{[fit.line.room, fit.line.doctor, fit.line.dept].filter(Boolean).join(' · ')}</div>
                    {measure && (
                      <div className={measure.used > measure.avail + 0.5 ? 'tps-rt-bad' : 'tps-rt-ok'}>
                        실제 폭 {Math.round(measure.used)} / {Math.round(measure.avail)}px {measure.used > measure.avail + 0.5 ? '· 넘침(빨간 점선)' : '· 1줄 안에 들어감'}
                      </div>
                    )}
                  </div>
                  <div className="tps-field-hint">첫 번째 카드에만 반영됩니다. 글자 수는 공백, 가운뎃점, 영문, 숫자도 한 글자로 셉니다.</div>
                </>
              )}
            </section>
          )}

          <section className="tps-panel-card">
            <div className="tps-log-head">
              <h3>행동 기록{log.length > 0 && <span className="tps-log-count"> · {log.length}</span>}</h3>
              <button type="button" className="tps-mini" onClick={bump}>
                초기화
              </button>
            </div>
            {log.length === 0 ? (
              <div className="tps-log-empty">태블릿 화면을 눌러 보세요. 탭 순서가 여기에 쌓입니다. 시나리오를 바꾸면 비워집니다.</div>
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
          <Tablet scenario={scenario} onLog={addLog} resetKey={resetKey} roomTest={isArrivalFlow && roomTestOn ? roomTest : null} onMeasure={onMeasure} />
        </Stage>
      </div>
    </div>
  );
}

export default App;
