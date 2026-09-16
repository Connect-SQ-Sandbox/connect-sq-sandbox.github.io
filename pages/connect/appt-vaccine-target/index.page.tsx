import React, { useEffect, useMemo, useState } from 'react';

/**
 * ┌─ 프로토타입 컨텍스트 ───────────────────────────────────
 * 이름     : appt-vaccine-target — 독감 무료접종 대상자 선택 UX (유저향 모바일 신청 웹)
 *            `무료 백신 대상자`를 고른 뒤 하위 뎁스(주성분 · 독감백신 종류)를 어떻게 처리할지 5안 비교 + 실제 동작.
 * 상태     : 현행(active)   버전: v2.4   최종수정: 2026-09-16
 * PRD      : 미발행 — Claude Design 핸드오프 `무료접종 대상자 선택 UX-handoff.zip`(2026-09-16) 이식.
 *            원본 캔버스 = `무료접종 대상자 선택 UX.dc.html` + 컴포넌트 `VaccineScreen.dc.html` / `VaccineLive.dc.html`.
 * 짝 화면  : 병원(어드민)향 = 예약 신청 내역 · 독감 무료접종형 진료정보 → out/treatment-create-tree.html?spec=1 의 [T45]
 *            (React 원본은 pages/connect/appt-free-vaccine). 이 페이지는 그 예약이 **만들어지는 유저 쪽 화면**이다.
 * 배포URL  : https://connect-sq-sandbox.github.io/out/appt-vaccine-target.html
 * 관련 CSS : apptVaccineTarget.css (캔버스 크롬만. 모바일 프레임 내부는 원본대로 인라인 스타일)
 * 기술제약 : react-only · plain CSS · mock · 네트워크 0
 *
 * 화면구성 : 최상단 `이슈` 축으로 결정 2건을 갈라 놓는다 — 한 화면에 변수 1개만 둔다.
 *            이슈 ① 하위 뎁스 처리 — 안 A~C. 실제 동작은 `안` 세그먼트 / 비교 보드는 1a~1c + 1d 비교표.
 *            이슈 ② 진료 대상자 — F-1~F-3. 실제 동작은 `처리` 세그먼트(안은 A 고정) /
 *                     비교 보드는 안별 행(2a F-1 · 2b F-2 · 2c F-3) + 2d 비교표.
 *                     ②의 모든 행은 **같은 조건**(안 A + 어린이 + 대리 접종)에서 ① 선택 화면 → ② 신청서 진입 → ③ 동작 후 순.
 *            각 이슈 안에서 `비교 보드 / 실제 동작`(기본 진입) 2모드는 그대로.
 *
 * 핵심 결정 (why):
 *   [확정·디자인] 대상자 선택은 제품 선택 위 별도 아코디언 행(`무료 백신 대상자`)이고 선택지는
 *                해당 없음 / 임신부 / 어린이 / 어르신 4개. 기준 문구(출생 범위)는 칩 보조 텍스트로 붙는다.
 *   [확정·디자인] 대상자를 고르면 제품·금액은 정해지지 않는다 — 항목명 자리에 `병원 상담 후 결정`,
 *                예상 결제 금액은 `미정`. 판정·서류·인증 UI는 두지 않고 유저 자기 선언 + 고지 문구로만 처리.
 *   [확정·디자인] 고지 문구 1종을 대상자 선택 지점·요약 카드·예약 정보 확인 카드에 반복 노출한다 —
 *                "대상 여부는 병원에서 확인하며, 대상이 아닌 경우 유료 접종으로 안내될 수 있어요".
 *   [확정·세화님] A~E는 **추천 순위**로 매긴 이름이다(2026-09-16) — A 하위 뎁스 접기 > B 읽기 전용 행 >
 *                C 하위 뎁스 비활성 > D 사전 분기 > E 현행 유지. 원본 캔버스의 이름(A 현행 / B 접기 / C 비활성 /
 *                D 사전 분기 / E 읽기 전용)과 **다르다** — 핸드오프 캔버스와 대조할 때 주의.
 *                코드의 variant id는 letter가 아니라 동작 이름(collapse/readonly/disabled/presplit/asis)이고,
 *                화면에 보이는 letter는 `LETTER` 맵에서만 나온다. 순위가 또 바뀌면 그 맵과 라벨 문자열만 고치면 된다.
 *   [보류]       채택안은 아직 미정(추천 순위 ≠ 확정). 다만 진입 기본값은 추천 1순위인 **안 A(하위 뎁스 접기)**로 둔다
 *                (2026-09-16 세화님 지시). 열자마자 A가 선택돼 있을 뿐, 확정 채택안이라는 뜻은 아니다.
 *   [확정·세화님] 결정 2건을 **이슈 축으로 분리**(2026-09-16) — 하위 뎁스 처리와 진료 대상자 처리는 서로 독립인데
 *                두 세그먼트가 한 줄에 같이 있어 25조합이 되고, 라벨 체계(A~E / F-1~F-4)도 한 축처럼 읽혔다.
 *                최상단 `이슈` 세그먼트로 갈라 화면당 변수를 1개로 줄이고, ②도 부록에서 동등한 이슈로 승격(비교표 신설).
 *                이슈 ②에서는 안을 추천 1순위 A로 고정한다 — ②의 결정은 안과 무관하다.
 *   [확정·세화님] 진료 대상자 처리의 **프레이밍 전환**(2026-09-16) — 어린이·영유아는 부모가 자녀를 대신 예약하는 것이
 *                기본 케이스다. 생년월일 불일치를 오류로 다루는 F-1·F-2 방식은 정상 케이스를 막힌 동작으로 만든다.
 *                F-3·F-4는 대조·경고 배너를 전부 버리고 **본인/대리 여부를 중립적으로 먼저 묻는다**. 고른 값은 그대로 신뢰.
 *   [확정·세화님] 안을 **이슈당 3개, 총 6개로 추림**(2026-09-16) — 타입이 많아 비교가 안 된다는 판단.
 *                ① D 사전 분기·E 현행 유지(추천 4·5순위)를 내림. 구현(presplit/asis)은 남겨 두고 VARIANTS·OPTIONS·CMP_ROWS에서만 뺐다.
 *                ② 구 F-2 체크 후 즉시 해제를 내림(대조 방식 중 F-1만 비교 기준으로 남김). 남은 셋을 **F-1 → F-3으로 재번호**:
 *                   F-1 체크 비활성(=구 F-1) · F-2 선택 화면 통합형(=구 F-3, G-1) · F-3 신청서 섹션 재설계형(=구 F-4, G-2).
 *                   코드 내부 id는 'F1'/'F3'/'F4' 그대로이고 화면 표기는 MISMATCH_LABEL과 문자열에서만 나온다. 구 F-2 로직(tried)은 삭제했다.
 *                   아래 변경 이력 v2.3 이전의 F-번호는 구 번호다.
 *   [보류]       처리 3안 미정 — F-1 체크 비활성(대조 방식) / F-2 선택 화면 통합형 / F-3 신청서 섹션 재설계형.
 *   [유지·자체] F-2의 `누구를 위한 접종인가요?`는 **필수 질문**으로 두어 답하기 전에는 `다음`을 막았다.
 *                프리셋이 없는 안이라 미답 상태를 허용하면 분기가 정해지지 않는다 — 다른 판단이면 이 게이팅만 풀면 된다.
 *   [유지·자체] F-3 프리셋은 `어린이`만 `다른 분`이고 어르신·임신부는 `예약자 본인`이다(영유아 카테고리는 아직 없음).
 *   [유지·자체] F-1용 예약자는 만 34세 고정이고 불일치는 `어린이`·`어르신`에서만 발동한다(임신부는 나이 기준 없음).
 *   [유지·자체] 원본 캔버스는 안 A의 유료 제품 가격을 250,000원 단일값 mock으로 뒀다. 실제 접종료가 아니라
 *                가격 행이 있는지 없는지를 보기 위한 자리표시값이라 그대로 옮겼다.
 *   [유지·자체] 안 D(내림)의 시트를 스와이프로 닫는 경로는 원본에도 정의가 없어 구현하지 않았다(딤 탭 = 무동작).
 *
 * 보류 · TODO (PO 확인 대기):
 *   · 채택안 1개 확정 → 확정 후 이 파일에서 나머지 안을 내리고 단일 안 프로토타입으로 좁힌다.
 *   · 대상자 기준 문구(22.1.1~26.8.31 / 1961.12.31 이전)의 운영값 관리 위치 — appt-free-vaccine 헤더의 보류 항목과 동일 건.
 *
 * 변경 이력:
 *   v2.4  2026-09-16 — 이슈당 3안, 총 6개로 추림(세화님 지시). ① D·E 내림, ② 구 F-2 내림 + F-3·F-4를 F-2·F-3으로 재번호.
 *                      비교 보드 id도 1a~1d / 2a~2d로 당겼다. 구 F-2(체크 후 즉시 해제)의 tried 상태·클릭 로직 삭제.
 *   v1    2026-09-16 — Claude Design 핸드오프 이식(비교 보드 + 실제 동작 2모드). 신규.
 *   v1.1  2026-09-16 — 진입 기본 모드를 비교 보드 → 실제 동작으로 변경(세화님 지시). 5안 비교는 세그먼트로 이동.
 *   v2.3  2026-09-16 — 이슈 ② 비교 보드를 안별 행으로 재배치(세화님 피드백: F-1~F-4가 섞여 헷갈림).
 *                      모든 행을 안 A + 어린이 같은 조건으로 고정하고 단계(①선택 화면 →②신청서 →③동작 후)를 열로 맞췄다.
 *                      대조/질문 방식은 행 설명의 머리말로만 구분(2a 참고 묶음 해체).
 *   v2.2  2026-09-16 — 세그먼트에 번호만 있어 무슨 안인지 모르겠다는 피드백 → letter 옆에 짧은 이름을 붙이고,
 *                      `처리`는 대조 방식(F-1·F-2)과 질문 방식(F-3·F-4) 사이에 구분선을 넣었다. 상단 바는 줄바꿈 허용.
 *   v2.1  2026-09-16 — 최상단 `이슈` 축 신설(① 하위 뎁스 / ② 진료 대상자). 섞여 있던 두 결정을 갈라 화면당 변수 1개로.
 *                      ②를 부록 1g → 2a~2d로 승격하고 비교표를 새로 만듦.
 *   v2.0  2026-09-16 — F-3·F-4를 **본인/대리를 묻는 방식**으로 다시 그림(세화님 지시). 생년월일 대조·경고 배너 폐기.
 *                      F-3 = 대상자 선택 화면 통합형(G-1, 2장) · F-4 = 신청서 섹션 재설계형(G-2, 2장). 실제 동작도 같이 교체.
 *                      세그먼트 이름 `예약자 불일치` → `진료 대상자`. RowData.warn 슬롯 제거.
 *   v1.6  2026-09-16 — `예약자 불일치`를 바꿔도 진행 상태(대상자 선택·현재 화면)를 유지하도록 수정(세화님 피드백).
 *                      초기화되면 같은 지점에서 F안을 갈아 끼우는 비교가 안 된다. 안(A~E) 변경 시에만 리셋.
 *   v1.5  2026-09-16 — F-1~F-4의 **실제 동작 버전** 추가(세화님 지시). 상단 `예약자 불일치` 세그먼트로 안 A~E와 조합해
 *                      눌러본다. 확인 화면에 진료 대상자 섹션 신설(ScreenModel.extra), F-2는 체크 시도 → 배너까지 동작.
 *   v1.4  2026-09-16 — 부록에 F-3(사전 경고형 2장)·F-4(자동 전환형) 추가. 행 아래 인라인 경고 슬롯(warn) 신설.
 *                      정적 D-① 시트의 `해당 없음`을 실제 동작과 같은 `아니요, 유료로 접종할게요`로 통일.
 *   v1.3  2026-09-16 — 진입 시 선택된 안을 C → A(추천 1순위)로 변경(세화님 지시).
 *   v1.2  2026-09-16 — A~E를 추천 순위대로 재명명(세화님 지시: 접기 > 읽기 전용 > 비활성 > 사전 분기 > 현행).
 *                      variant id를 letter → 동작 이름으로 바꾸고 표시 letter는 LETTER 맵으로 분리.
 * └──────────────────────────────────────────────────────
 */

/* ============================ 공통 상수 ============================ */

/** 내부 id는 동작 이름, 화면에 보이는 A~E는 추천 순위(LETTER)로 따로 매긴다. */
type Variant = 'collapse' | 'readonly' | 'disabled' | 'presplit' | 'asis';

/**
 * 진료 대상자 처리 4안 + 끔. 실제 동작 모드에서 안 A~E와 조합해 눌러본다.
 * F1 = 생년월일 대조 방식(예약자 나이와 어긋나면 오류로 다룸). 비교 기준으로 남긴 유일한 대조 방식.
 * F3·F4 = 본인/대리를 그냥 물어보는 방식 — 어린이는 부모가 대신 예약하는 게 기본 케이스라
 *         "불일치 = 오류" 프레이밍 자체가 틀렸다는 판단(2026-09-16). 대조·경고 로직 없음.
 */
type MismatchMode = 'off' | 'F1' | 'F3' | 'F4';

/** 누구를 위한 접종인가 — F3·F4가 묻는 값 */
type Whom = 'self' | 'other';

/** F1·F2(생년월일 대조 방식)에서만 쓰는 가상의 예약자 나이 */
const BOOKER_AGE = 34;

/** 세그먼트에 letter와 함께 붙이는 짧은 이름 */
const VARIANT_SHORT: Record<Variant, string> = {
  collapse: '접기',
  readonly: '읽기 전용',
  disabled: '비활성',
  presplit: '사전 분기',
  asis: '현행'
};

/** 추천 순위 = 표시 이름. A 접기 > B 읽기 전용 > C 비활성 > D 사전 분기 > E 현행 유지 */
const LETTER: Record<Variant, string> = {
  collapse: 'A',
  readonly: 'B',
  disabled: 'C',
  presplit: 'D',
  asis: 'E'
};
type TargetKey = 'none' | 'pregnant' | 'child' | 'senior';

type Target = { key: TargetKey; label: string; sub?: string };

const TARGETS: Target[] = [
  { key: 'none', label: '해당 없음' },
  { key: 'pregnant', label: '임신부' },
  { key: 'child', label: '어린이', sub: '22.1.1~26.8.31 출생자' },
  { key: 'senior', label: '어르신', sub: '1961.12.31 이전 출생자' }
];
const T: Record<string, Target> = {};
TARGETS.forEach((t) => (T[t.key] = t));

const PRODUCTS: Record<string, { name: string; price: string }[]> = {
  '3가 백신': [
    { name: '코박스인플루3가PF주', price: '250,000원' },
    { name: '지씨플루프리필드시린지', price: '250,000원' }
  ],
  '4가 백신': [
    { name: '스카이셀플루4가프리필드시린지', price: '250,000원' },
    { name: '테라텍트프리필드시린지', price: '250,000원' }
  ]
};

const DECIDED = '병원 상담 후 결정';
const NOTICE = '대상 여부는 병원에서 확인하며, 대상이 아닌 경우 유료 접종으로 안내될 수 있어요';
const SUMMARY_BODY = '접종 백신은 병원에서 상담 후 결정돼요';

/* ============================ 프레임 부속 ============================ */

function StatusBar() {
  return (
    <div className="avt-sbar">
      <span>9:41</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <svg width="17" height="11" viewBox="0 0 17 11">
          <rect x="0" y="7" width="3" height="4" rx="1" fill="#111" />
          <rect x="4.7" y="5" width="3" height="6" rx="1" fill="#111" />
          <rect x="9.4" y="2.5" width="3" height="8.5" rx="1" fill="#111" />
          <rect x="14.1" y="0" width="3" height="11" rx="1" fill="#111" />
        </svg>
        <svg width="16" height="11" viewBox="0 0 16 11">
          <path d="M8 10.4 1 3.6a9.8 9.8 0 0 1 14 0Z" fill="none" stroke="#111" strokeWidth="1.6" />
          <circle cx="8" cy="8.6" r="1.5" fill="#111" />
        </svg>
        <svg width="25" height="12" viewBox="0 0 25 12">
          <rect x="0.5" y="0.5" width="21" height="11" rx="3" fill="none" stroke="#111" strokeOpacity="0.35" />
          <rect x="2" y="2" width="16" height="8" rx="2" fill="#111" />
          <path d="M23 4v4a2.2 2.2 0 0 0 0-4Z" fill="#111" fillOpacity="0.4" />
        </svg>
      </span>
    </div>
  );
}

function BackIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" style={{ flex: 'none' }}>
      <path d="M17 7 10 14l7 7" fill="none" stroke="#111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function NavBar({ title, onBack }: { title: string; onBack?: () => void }) {
  return (
    <div className="avt-nav" onClick={onBack} style={onBack ? { cursor: 'pointer' } : undefined}>
      <BackIcon />
      <span>{title}</span>
    </div>
  );
}

function HomeIndicator() {
  return (
    <div style={{ flex: 'none', height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 134, height: 5, borderRadius: 3, background: '#111' }} />
    </div>
  );
}

type Chev = 'down' | 'up' | 'dim' | null;

function Chevron({ kind }: { kind: Chev }) {
  if (!kind) return null;
  if (kind === 'up') {
    return (
      <svg width="20" height="20" viewBox="0 0 20 20" style={{ flex: 'none' }}>
        <path d="M6 12l4-4 4 4" fill="none" stroke="#111" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  const stroke = kind === 'dim' ? '#E5E8EB' : '#8B95A1';
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" style={{ flex: 'none' }}>
      <path d="M6 8l4 4 4-4" fill="none" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ============================ 행 · 칩 ============================ */

type ChipData = { label: string; sub?: string | null; selected: boolean; span: 1 | 2; onClick?: () => void };

type RowData = {
  label: string;
  dim?: boolean;
  value?: string | null;
  valueDim?: boolean;
  chev: Chev;
  helper?: string | null;
  chips?: ChipData[] | null;
  onToggle?: (() => void) | null;
};

function ChipBox({ chip }: { chip: ChipData }) {
  return (
    <div
      onClick={chip.onClick}
      style={{
        gridColumn: chip.span === 2 ? 'span 2' : 'span 1',
        minHeight: 52,
        padding: '8px 12px',
        boxSizing: 'border-box',
        borderRadius: 8,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1,
        border: chip.selected ? '1.5px solid #111' : '1px solid #E5E8EB',
        background: '#fff',
        cursor: chip.onClick ? 'pointer' : 'default',
        transition: 'border-color .15s'
      }}
    >
      <span
        style={{
          fontSize: 15,
          fontWeight: chip.selected ? 600 : 400,
          lineHeight: 1.3,
          color: '#111',
          textAlign: 'center'
        }}
      >
        {chip.label}
      </span>
      {chip.sub ? <span style={{ font: '400 13px/1.3 Pretendard, sans-serif', color: '#8B95A1' }}>{chip.sub}</span> : null}
    </div>
  );
}

function AccordionRow({ row }: { row: RowData }) {
  return (
    <div style={{ borderTop: '1px solid #EEF0F3' }}>
      <div
        onClick={row.onToggle || undefined}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '18px 20px',
          cursor: row.onToggle ? 'pointer' : 'default'
        }}
      >
        <span style={{ flex: 1, fontSize: 17, fontWeight: 600, lineHeight: 1.4, color: row.dim ? '#C4C9D0' : '#111' }}>
          {row.label}
        </span>
        {row.value ? (
          <span style={{ font: '400 15px/1.4 Pretendard, sans-serif', color: row.valueDim ? '#8B95A1' : '#111' }}>
            {row.value}
          </span>
        ) : null}
        <Chevron kind={row.chev} />
      </div>

      {row.helper ? (
        <div style={{ padding: '0 20px 16px', font: '400 13px/1.5 Pretendard, sans-serif', color: '#8B95A1', wordBreak: 'keep-all' }}>
          {row.helper}
        </div>
      ) : null}

      {row.chips && row.chips.length ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: '0 20px 20px' }}>
          {row.chips.map((chip, i) => (
            <ChipBox key={i} chip={chip} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function NoticeBox({ style }: { style?: React.CSSProperties }) {
  return (
    <div
      style={{
        background: '#F6F7F9',
        borderRadius: 8,
        padding: 12,
        font: '400 13px/1.55 Pretendard, sans-serif',
        color: '#8B95A1',
        wordBreak: 'keep-all',
        ...style
      }}
    >
      {NOTICE}
    </div>
  );
}

type SummaryData = { title: string; body: string; link?: string | null; onLink?: () => void };

function SummaryCard({ summary }: { summary: SummaryData }) {
  return (
    <div style={{ borderTop: '1px solid #EEF0F3', padding: 20 }}>
      <div style={{ border: '1px solid #EEF0F3', borderRadius: 12, padding: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ font: '600 17px/1.4 Pretendard, sans-serif', color: '#111' }}>{summary.title}</span>
        <span style={{ font: '400 15px/1.5 Pretendard, sans-serif', color: '#4E5968', wordBreak: 'keep-all' }}>{summary.body}</span>
        {summary.link ? (
          <span
            onClick={summary.onLink}
            style={{
              font: '600 15px/1.4 Pretendard, sans-serif',
              color: '#0073FA',
              textDecoration: 'underline',
              alignSelf: 'flex-start',
              marginTop: 2,
              cursor: summary.onLink ? 'pointer' : 'default'
            }}
          >
            {summary.link}
          </span>
        ) : null}
        <NoticeBox style={{ marginTop: 8 }} />
      </div>
    </div>
  );
}

type CardData = { title: string; sub: string; price: string; notice: boolean };

function ConfirmCard({ card }: { card: CardData }) {
  return (
    <>
      <div style={{ padding: '8px 20px 20px' }}>
        <div style={{ font: '700 22px/1.35 Pretendard, sans-serif', color: '#111' }}>예약 정보를 확인해주세요</div>
      </div>
      <div style={{ padding: '0 20px 20px' }}>
        <div style={{ border: '1px solid #EEF0F3', borderRadius: 12, padding: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <span
            style={{
              alignSelf: 'flex-start',
              background: '#EEF5FF',
              color: '#0073FA',
              font: '600 13px/1 Pretendard, sans-serif',
              padding: '6px 8px',
              borderRadius: 4
            }}
          >
            독감백신
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ font: '700 19px/1.4 Pretendard, sans-serif', color: '#111' }}>{card.title}</span>
            <span style={{ font: '400 15px/1.5 Pretendard, sans-serif', color: '#8B95A1' }}>{card.sub}</span>
          </div>
          <div style={{ height: 1, background: '#EEF0F3', margin: '4px 0' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ font: '400 15px/1.4 Pretendard, sans-serif', color: '#8B95A1' }}>예상 결제 금액</span>
            <span style={{ font: '600 17px/1.4 Pretendard, sans-serif', color: '#111' }}>{card.price}</span>
          </div>
          {card.notice ? <NoticeBox /> : null}
        </div>
      </div>
    </>
  );
}

function Cta({ on, label, onClick }: { on: boolean; label: string; onClick?: () => void }) {
  return (
    <div style={{ flex: 'none', padding: '12px 20px 8px', background: '#fff' }}>
      <div
        onClick={on ? onClick : undefined}
        style={{
          height: 52,
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 17,
          fontWeight: 600,
          background: on ? '#0073FA' : '#F2F4F7',
          color: on ? '#fff' : '#C4C9D0',
          cursor: on && onClick ? 'pointer' : 'default'
        }}
      >
        {label}
      </div>
    </div>
  );
}

type SheetOption = { key: TargetKey; label: string; sub?: string | null; selected: boolean; onClick?: () => void };

function TargetSheet({ options }: { options: SheetOption[] }) {
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div style={{ background: '#fff', borderRadius: '16px 16px 0 0', padding: '8px 20px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 14px' }}>
          <div style={{ width: 55, height: 4, borderRadius: 2, background: '#E3E6ED' }} />
        </div>
        <div style={{ font: '700 20px/1.4 Pretendard, sans-serif', color: '#111', paddingBottom: 16 }}>국가 무료접종 대상자인가요?</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {options.map((opt) => (
            <div
              key={opt.key}
              onClick={opt.onClick}
              style={{
                minHeight: 56,
                border: opt.selected ? '1.5px solid #111' : '1px solid #E5E8EB',
                borderRadius: 8,
                padding: '10px 16px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                gap: 2,
                cursor: opt.onClick ? 'pointer' : 'default'
              }}
            >
              <span style={{ font: '400 15px/1.4 Pretendard, sans-serif', color: '#111' }}>{opt.label}</span>
              {opt.sub ? <span style={{ font: '400 13px/1.3 Pretendard, sans-serif', color: '#8B95A1' }}>{opt.sub}</span> : null}
            </div>
          ))}
        </div>
        <div style={{ marginTop: 14, font: '400 13px/1.55 Pretendard, sans-serif', color: '#8B95A1', wordBreak: 'keep-all' }}>{NOTICE}</div>
        <div style={{ height: 26 }} />
      </div>
    </div>
  );
}

/* ============================ 화면 본체 ============================ */

type ScreenModel = {
  navTitle: string;
  isConfirm: boolean;
  rows: RowData[];
  summary: SummaryData | null;
  card: CardData | null;
  sheet: SheetOption[] | null;
  ctaOn: boolean;
  ctaLabel: string;
  onCta?: () => void;
  onBack?: () => void;
  scroll?: boolean;
  /** 진료항목 선택 화면에서 행 아래·요약 카드 위에 끼워 넣을 질문(F-2 본인/대리) */
  question?: React.ReactNode;
  /** 예약 정보 확인 화면에서 카드 아래에 이어 붙일 영역(진료 대상자 섹션) */
  extra?: React.ReactNode;
};

function Screen({ model }: { model: ScreenModel }) {
  return (
    <div className="avt-frame">
      <StatusBar />
      <NavBar title={model.navTitle} onBack={model.onBack} />

      <div style={{ flex: 1, minHeight: 0, overflowY: model.scroll ? 'auto' : 'hidden' }}>
        {model.isConfirm && model.card ? (
          <>
            <ConfirmCard card={model.card} />
            {model.extra}
          </>
        ) : (
          <>
            <div style={{ padding: '8px 20px 20px' }}>
              <div style={{ font: '700 22px/1.35 Pretendard, sans-serif', color: '#111', wordBreak: 'keep-all' }}>진료항목을 선택해주세요</div>
            </div>
            {model.rows.map((row, i) => (
              <AccordionRow key={i} row={row} />
            ))}
            {model.question}
            {model.summary ? <SummaryCard summary={model.summary} /> : null}
          </>
        )}
      </div>

      <Cta on={model.ctaOn} label={model.ctaLabel} onClick={model.onCta} />
      <HomeIndicator />

      {model.sheet ? <TargetSheet options={model.sheet} /> : null}
    </div>
  );
}

/* ============================ 비교 보드용 정적 화면 ============================ */

function chip(label: string, sub: string | null | undefined, selected: boolean, span: 1 | 2): ChipData {
  return { label, sub: sub || null, selected, span };
}

function buildStatic(variant: Variant, step: string): ScreenModel & { caption: string } {
  if (step === '4') {
    return {
      navTitle: '예약 정보 확인',
      isConfirm: true,
      rows: [],
      summary: null,
      card: { title: DECIDED, sub: '어린이 (22.1.1~26.8.31 출생자)', price: '미정', notice: true },
      sheet: null,
      ctaOn: true,
      ctaLabel: '예약 신청하기',
      caption: '예약 정보 확인 · 상단 카드'
    };
  }

  const rows: RowData[] = [];
  let summary: SummaryData | null = null;
  let sheet: SheetOption[] | null = null;
  let cta = false;
  let caption = '';

  const targetRowOpen = (chips: ChipData[]): RowData => ({ label: '무료 백신 대상자', chev: 'up', chips });
  const targetRowValue = (value: string, helper?: string): RowData => ({
    label: '무료 백신 대상자',
    value,
    chev: 'down',
    helper: helper || null
  });
  const baseRow = (): RowData => ({ label: '주성분', chev: 'down' });
  const kindRow = (): RowData => ({ label: '독감백신 종류', chev: 'down' });
  const paidBaseOpen = (): RowData => ({
    label: '주성분',
    chev: 'up',
    chips: [chip('3가 백신', null, false, 1), chip('4가 백신', null, false, 1)]
  });

  if (variant === 'presplit') {
    if (step === '1') {
      rows.push(baseRow(), kindRow());
      // 시트의 `해당 없음`은 유료 선택지라 실제 동작 화면과 같은 카피를 쓴다
      sheet = TARGETS.map((t) => ({
        key: t.key,
        label: t.key === 'none' ? '아니요, 유료로 접종할게요' : t.label,
        sub: t.sub,
        selected: false
      }));
      caption = '진입 직후 · 사전 분기 바텀시트';
    } else if (step === '2') {
      rows.push(paidBaseOpen(), kindRow());
      caption = '`아니요, 유료로 접종할게요` → 대상자 섹션 없는 2단';
    } else {
      summary = { title: '무료접종 희망 · 어린이', body: SUMMARY_BODY, link: '변경' };
      cta = true;
      caption = '`어린이` → 결과 카드만';
    }
  } else if (step === '1') {
    rows.push(
      targetRowOpen(TARGETS.map((t) => chip(t.label, t.sub, false, 1))),
      baseRow(),
      kindRow()
    );
    caption = '대상자 선택 전';
  } else if (step === '2') {
    rows.push(targetRowValue('해당 없음'), paidBaseOpen(), kindRow());
    caption = '`해당 없음` 선택 후';
  } else {
    caption = '`어린이` 선택 후';
    cta = true;
    if (variant === 'asis') {
      rows.push(
        targetRowValue('어린이'),
        { label: '주성분', chev: 'up', chips: [chip('3가 백신', null, true, 2)] },
        { label: '독감백신 종류', value: DECIDED, chev: 'down' }
      );
    } else if (variant === 'collapse') {
      rows.push(targetRowValue('어린이'));
      summary = { title: '무료접종 희망 · 어린이', body: SUMMARY_BODY };
    } else if (variant === 'disabled') {
      rows.push(
        targetRowValue('어린이', '무료접종 대상자는 병원에서 접종 백신을 정해요'),
        { label: '주성분', dim: true, chev: 'dim' },
        { label: '독감백신 종류', dim: true, chev: 'dim' }
      );
    } else {
      rows.push(
        targetRowValue('어린이'),
        { label: '주성분', value: DECIDED, valueDim: true, chev: null },
        { label: '독감백신 종류', value: DECIDED, valueDim: true, chev: null }
      );
    }
  }

  return {
    navTitle: '굿닥의원',
    isConfirm: false,
    rows,
    summary,
    card: null,
    sheet,
    ctaOn: cta,
    ctaLabel: '다음',
    caption
  };
}

function StaticScreen({
  variant,
  step,
  label,
  note,
  caption
}: {
  variant: Variant;
  step: string;
  label: string;
  note?: string;
  caption?: string;
}) {
  const model = buildStatic(variant, step);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: 375 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span className="avt-badge">{label}</span>
        <span style={{ font: '600 13px/1.3 Pretendard, sans-serif', color: '#31353F' }}>{caption ?? model.caption}</span>
      </div>
      <Screen model={model} />
      {note ? <div className="avt-note">{note}</div> : null}
    </div>
  );
}

/* ============================ 실제 동작(인터랙티브) ============================ */

type LiveState = {
  target: TargetKey | null;
  base: string | null;
  kind: string | null;
  open: 'target' | 'base' | 'kind' | null;
  screen: 'select' | 'confirm';
  sheetOpen: boolean;
};

function initialState(variant: Variant): LiveState {
  return {
    target: null,
    base: null,
    kind: null,
    open: variant === 'presplit' ? null : 'target',
    screen: 'select',
    sheetOpen: variant === 'presplit'
  };
}

function LiveScreen({ variant, mismatch }: { variant: Variant; mismatch: MismatchMode }) {
  const [s, setS] = useState<LiveState>(() => initialState(variant));
  /** F-2 — 대상자 선택 화면에서 고른 본인/대리(고르기 전 null) */
  const [whom, setWhom] = useState<Whom | null>(null);
  /** F-3 — 신청서 섹션에서 고른 본인/대리(카테고리에 따라 프리셋) */
  const [sectionWhom, setSectionWhom] = useState<Whom | null>(null);

  // 안(A~C)을 바꿀 때만 흐름을 처음부터 다시 태운다.
  useEffect(() => {
    setS(initialState(variant));
    setWhom(null);
    setSectionWhom(null);
  }, [variant]);

  // 불일치 처리(F-1~F-3)는 같은 화면·같은 선택 상태에서 갈아 끼워야 비교가 되므로 진행 상태를 건드리지 않는다.
  // 신청서 섹션의 본인/대리 프리셋만 초기화한다.
  useEffect(() => {
    setSectionWhom(null);
  }, [mismatch]);

  const free = !!s.target && s.target !== 'none';
  const isConfirm = s.screen === 'confirm';
  /** 생년월일 대조 방식(F-1)에서만 쓰는 판정 — 임신부는 나이 기준이 없어 제외 */
  const mismatched = mismatch === 'F1' && (s.target === 'child' || s.target === 'senior');
  /** 본인/대리를 묻는 방식(F-2·F-3)이 켜져 있고 무료접종 대상자를 고른 상태인가 */
  const asking = (mismatch === 'F3' || mismatch === 'F4') && free;
  /** F-3 기본값 — 어린이는 부모가 대신 예약하는 게 기본 케이스라 `다른 분`으로 프리셋(수정 가능) */
  const sectionValue: Whom = sectionWhom ?? (s.target === 'child' ? 'other' : 'self');

  const pickTarget = (key: TargetKey) => {
    setS((prev) => {
      const next: LiveState = { ...prev, target: key, sheetOpen: false, screen: 'select' };
      if (key === 'none' || variant === 'asis') {
        next.base = null;
        next.kind = null;
        next.open = 'base';
      } else {
        next.base = DECIDED;
        next.kind = DECIDED;
        next.open = null;
      }
      return next;
    });
  };
  const pickBase = (b: string) => setS((prev) => ({ ...prev, base: b, kind: null, open: 'kind' }));
  const pickKind = (k: string) => setS((prev) => ({ ...prev, kind: k, open: null }));
  const toggle = (name: 'target' | 'base' | 'kind') => setS((prev) => ({ ...prev, open: prev.open === name ? null : name }));

  const ready = (() => {
    // F-2은 대상자 선택 화면에서 본인/대리를 고르기 전에는 넘어갈 수 없다(필수 질문).
    if (mismatch === 'F3' && free && whom === null) return false;
    if (!s.target) return false;
    if (s.target === 'none') return !!(s.base && s.kind);
    if (variant === 'asis') return !!(s.base && s.kind);
    return true;
  })();

  const rows: RowData[] = (() => {
    const list: RowData[] = [];

    if (variant !== 'presplit') {
      const open = s.open === 'target';
      list.push({
        label: '무료 백신 대상자',
        onToggle: () => toggle('target'),
        value: !open && s.target ? T[s.target].label : null,
        chev: open ? 'up' : 'down',
        helper: variant === 'disabled' && free && !open ? '무료접종 대상자는 병원에서 접종 백신을 정해요' : null,
        chips: open
          ? TARGETS.map((t) => ({
              label: t.label,
              sub: t.sub || null,
              selected: s.target === t.key,
              span: 1 as const,
              onClick: () => pickTarget(t.key)
            }))
          : null
      });
    }

    if (free && (variant === 'collapse' || variant === 'presplit')) return list;

    if (free && variant === 'disabled') {
      list.push({ label: '주성분', dim: true, chev: 'dim' }, { label: '독감백신 종류', dim: true, chev: 'dim' });
      return list;
    }
    if (free && variant === 'readonly') {
      list.push(
        { label: '주성분', value: DECIDED, valueDim: true, chev: null },
        { label: '독감백신 종류', value: DECIDED, valueDim: true, chev: null }
      );
      return list;
    }

    if (!s.target) {
      list.push({ label: '주성분', chev: 'down', onToggle: () => {} }, { label: '독감백신 종류', chev: 'down', onToggle: () => {} });
      return list;
    }

    const baseOpen = s.open === 'base';
    const baseOptions = free && variant === 'asis' ? ['3가 백신'] : ['3가 백신', '4가 백신'];
    list.push({
      label: '주성분',
      onToggle: () => toggle('base'),
      value: !baseOpen && s.base ? s.base : null,
      chev: baseOpen ? 'up' : 'down',
      chips: baseOpen
        ? baseOptions.map((b) => ({
            label: b,
            sub: null,
            selected: s.base === b,
            span: (baseOptions.length === 1 ? 2 : 1) as 1 | 2,
            onClick: () => pickBase(b)
          }))
        : null
    });

    const kindOpen = s.open === 'kind';
    const kindOptions = free && variant === 'asis' ? [{ name: DECIDED, price: null as string | null }] : PRODUCTS[s.base || ''] || [];
    list.push({
      label: '독감백신 종류',
      onToggle: s.base ? () => toggle('kind') : () => {},
      value: !kindOpen && s.kind ? s.kind : null,
      chev: kindOpen ? 'up' : 'down',
      chips:
        kindOpen && s.base
          ? kindOptions.map((p) => ({
              label: p.name,
              sub: p.price,
              selected: s.kind === p.name,
              span: 2 as const,
              onClick: () => pickKind(p.name)
            }))
          : null
    });
    return list;
  })();

  const tgt = s.target ? T[s.target] : null;
  const card: CardData | null = isConfirm
    ? free && tgt
      ? { title: DECIDED, sub: tgt.sub ? tgt.label + ' (' + tgt.sub + ')' : tgt.label, price: '미정', notice: true }
      : { title: s.kind || '', sub: s.base || '', price: '250,000원', notice: false }
    : null;

  const steps: string[] = [];
  if (variant === 'presplit') steps.push(s.target ? '사전 분기 완료' : '사전 분기 대기');
  steps.push(s.target ? T[s.target].label : '대상자 미선택');
  if (s.base) steps.push(s.base);
  if (s.kind) steps.push(s.kind);
  if (mismatch === 'F1') steps.push(MISMATCH_LABEL[mismatch] + (mismatched ? ' · 예약자 불일치' : ' · 예약자 일치'));
  else if (mismatch === 'F3')
    steps.push('F-2 · ' + (!free ? '질문 없음' : whom === null ? '본인/대리 미선택' : whom === 'self' ? WHOM_SELF : WHOM_OTHER_SHORT));
  else if (mismatch === 'F4') steps.push('F-3 · ' + (!free ? '질문 없음' : sectionValue === 'self' ? WHOM_SELF : WHOM_OTHER_SHORT));
  steps.push(ready ? 'CTA 활성' : 'CTA 비활성');

  let tapNote: string;
  if (!s.target && variant !== 'presplit') tapNote = '칩을 눌러 대상자를 고르면 안 ' + LETTER[variant] + '의 처리 방식이 그대로 동작합니다.';
  else if (variant === 'presplit' && s.sheetOpen) tapNote = '시트에서 선택하면 유료/무료 흐름이 갈립니다.';
  else if (free && variant === 'asis') tapNote = '선택지가 1개뿐인 두 단계를 탭으로 통과해야 CTA가 열립니다.';
  else if (free) tapNote = '대상자를 골랐으므로 하위 뎁스 선택 없이 CTA가 열립니다. 대상자 행을 다시 눌러 `해당 없음`으로 바꿔보세요.';
  else tapNote = '유료 흐름: 주성분 → 독감백신 종류 순으로 고릅니다.';
  if (isConfirm) tapNote = '좌측 상단 ←를 누르면 선택 화면으로 돌아갑니다.';
  if (mismatch === 'F1' && !mismatched)
    tapNote = '예약자(만 ' + BOOKER_AGE + '세)와 어긋나는 대상은 `어린이`·`어르신`입니다. 둘 중 하나를 고르면 ' + MISMATCH_LABEL[mismatch] + ' 처리가 켜집니다.';
  else if (mismatch === 'F3' && asking && !isConfirm)
    tapNote = whom === null ? '`누구를 위한 접종인가요?`에 답해야 `다음`이 열립니다. 생년월일 대조는 하지 않습니다.' : '`다음`을 눌러 신청서가 어떻게 달라지는지 보세요.';
  else if (mismatch === 'F4' && asking && !isConfirm) tapNote = '`다음`을 눌러 신청서의 진료 대상자 섹션을 보세요. 어린이는 `다른 분`이 기본값입니다.';
  else if (mismatch === 'F4' && asking && isConfirm) tapNote = '세그먼트를 눌러 본인/대리를 바꿔보세요. 프리셋은 어디까지나 기본값이고 수정할 수 있습니다.';
  else if ((mismatch === 'F3' || mismatch === 'F4') && !free)
    tapNote = '이 질문은 무료접종 대상자를 고른 흐름에서만 나옵니다. `임신부`·`어린이`·`어르신` 중 하나를 골라보세요.';

  const model: ScreenModel = {
    navTitle: isConfirm ? '예약 정보 확인' : '굿닥의원',
    isConfirm,
    rows: isConfirm ? [] : rows,
    summary:
      !isConfirm && free && (variant === 'collapse' || variant === 'presplit') && tgt
        ? {
            title: '무료접종 희망 · ' + tgt.label,
            body: SUMMARY_BODY,
            link: variant === 'presplit' ? '변경' : null,
            onLink: variant === 'presplit' ? () => setS((prev) => ({ ...prev, sheetOpen: true })) : undefined
          }
        : null,
    card,
    sheet: s.sheetOpen
      ? TARGETS.map((t) => ({
          key: t.key,
          label: t.key === 'none' ? '아니요, 유료로 접종할게요' : t.label,
          sub: t.sub || null,
          selected: s.target === t.key,
          onClick: () => pickTarget(t.key)
        }))
      : null,
    question: !isConfirm && mismatch === 'F3' && asking ? <WhomQuestion value={whom} onPick={setWhom} /> : null,
    extra: !isConfirm ? null : mismatch === 'F4' && asking ? (
      <WhomSection value={sectionValue} onPick={setSectionWhom} />
    ) : mismatch === 'F3' && asking ? (
      whom === 'other' ? <PlainTargetSection /> : null
    ) : (
      <LiveTargetSection mode={mismatch} mismatched={mismatched} />
    ),
    ctaOn: ready || isConfirm,
    ctaLabel: isConfirm ? '예약 신청하기' : '다음',
    onCta: () => {
      if (isConfirm) return;
      if (ready) setS((prev) => ({ ...prev, screen: 'confirm' }));
    },
    onBack: () => {
      if (isConfirm) setS((prev) => ({ ...prev, screen: 'select' }));
      else setS(initialState(variant));
    },
    scroll: true
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 375 }}>
      <Screen model={model} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: 375 }}>
        <div className="avt-status">{'안 ' + LETTER[variant] + ' · ' + steps.join(' · ')}</div>
        <button type="button" className="avt-reset" onClick={() => setS(initialState(variant))}>
          초기화
        </button>
      </div>
      <div className="avt-tapnote">{tapNote}</div>
    </div>
  );
}

/* ============================ 비교 보드 ============================ */

type Frame = { step: string; label: string; note?: string };

const OPTIONS: { id: string; variant: Variant; title: string; desc: string; frames: Frame[] }[] = [
  {
    id: '1a',
    variant: 'collapse',
    title: '안 A · 하위 뎁스 접기',
    desc: '`어린이` 선택 즉시 주성분·종류 아코디언이 사라지고 그 자리에 요약 카드 1장이 뜬다. `해당 없음`으로 바꾸면 아코디언이 다시 나타난다.',
    frames: [
      { step: '1', label: 'A-①' },
      { step: '2', label: 'A-②' },
      {
        step: '3',
        label: 'A-③',
        note: '전환 힌트 · `해당 없음`으로 되돌리면 주성분·종류 2행이 다시 삽입되고 요약 카드는 제거된다. 행 삽입/삭제와 함께 CTA 활성 상태도 바뀐다.'
      },
      { step: '4', label: 'A-④' }
    ]
  },
  {
    id: '1b',
    variant: 'readonly',
    title: '안 B · 읽기 전용 행으로 치환',
    desc:
      '주성분·종류가 비활성이 아니라 값이 채워진 읽기 전용 행으로 바뀐다. chevron 없음. "선택할 것이 없다"가 아니라 "이미 정해졌다"로 읽힌다. 안 A와 안 C의 중간안.',
    frames: [
      { step: '1', label: 'B-①' },
      { step: '2', label: 'B-②' },
      { step: '3', label: 'B-③', note: '라벨은 검정, 값은 회색으로 두어 유저가 고른 값(현행 원안의 `3가 백신`)과 시스템 확정값을 색으로 구분한다.' },
      { step: '4', label: 'B-④' }
    ]
  },
  {
    id: '1c',
    variant: 'disabled',
    title: '안 C · 하위 뎁스 비활성',
    desc:
      '주성분·종류 아코디언이 남아 있되 비활성(회색 라벨, 흐린 chevron, 탭 불가). 대상자 행 바로 아래 한 줄 헬퍼. 레이아웃이 현행(피그마 원안)과 완전히 같아 위치 기억이 유지된다.',
    frames: [
      { step: '1', label: 'C-①' },
      { step: '2', label: 'C-②' },
      { step: '3', label: 'C-③', note: '행 개수·순서·높이가 ①②와 동일하다. 대상자 행만 값이 바뀌고 아래 두 행은 제자리에서 흐려진다.' },
      { step: '4', label: 'C-④' }
    ]
  }
];

type Tone = 'hi' | 'mid' | 'lo';
type Cell = { tone: Tone; v: string; tail?: string };

const CMP_HEADS = [
  '안',
  '대상자 선택 후 `다음`까지 탭 수',
  '허위 선택 인상 위험',
  '해당없음↔대상자 전환 시 레이아웃 흔들림',
  '설명 텍스트 필요량',
  '기존 컴포넌트 재사용도'
];

const CMP_ROWS: { name: string; cells: Cell[]; memo: string }[] = [
  {
    name: 'A · 하위 뎁스 접기',
    cells: [
      { tone: 'lo', v: '0' },
      { tone: 'lo', v: '하' },
      { tone: 'hi', v: '상', tail: ' · 2행 삽입/삭제' },
      { tone: 'mid', v: '중', tail: ' · 요약 카드 2줄 + 고지' },
      { tone: 'mid', v: '중', tail: ' · 요약 카드 신규' }
    ],
    memo: '장 — 고를 수 없는 것을 아예 보여주지 않아 가장 짧다. 단 — 전환 시 화면이 크게 재구성되고, 유료 흐름에 무엇이 있었는지 기억이 끊긴다.'
  },
  {
    name: 'B · 읽기 전용 행',
    cells: [
      { tone: 'lo', v: '0' },
      { tone: 'mid', v: '중' },
      { tone: 'lo', v: '하', tail: ' · 값만 교체' },
      { tone: 'lo', v: '하', tail: ' · 값 자체가 설명' },
      { tone: 'mid', v: '중', tail: ' · 읽기 전용 행 추가' }
    ],
    memo:
      '장 — "이미 정해졌다"로 읽혀 추가 설명이 거의 필요 없고 레이아웃도 안정적이다. 단 — 값이 채워져 있어 유저가 고른 값과 구분이 약하고, 행별 색 규칙을 새로 정해야 한다.'
  },
  {
    name: 'C · 하위 뎁스 비활성',
    cells: [
      { tone: 'lo', v: '0' },
      { tone: 'lo', v: '하' },
      { tone: 'lo', v: '하', tail: ' · 제자리에서 흐려짐' },
      { tone: 'mid', v: '중', tail: ' · 헬퍼 1줄' },
      { tone: 'lo', v: '상', tail: ' · disabled 상태만 추가' }
    ],
    memo:
      '장 — 레이아웃이 현행 원안과 동일해 위치 기억이 유지되고, 유료로 바꾸면 무엇이 열리는지 보인다. 단 — 탭이 안 되는 행이 남아 한 번은 눌러보게 된다.'
  }
];

function CompareBoard() {
  return (
    <div className="avt-cmp">
      {CMP_HEADS.map((h) => (
        <div key={h} className="avt-h">
          {h}
        </div>
      ))}
      {CMP_ROWS.map((row) => (
        <React.Fragment key={row.name}>
          <div className="avt-n">{row.name}</div>
          {row.cells.map((c, i) => (
            <div key={i}>
              <span className={'avt-' + c.tone}>{c.v}</span>
              {c.tail || ''}
            </div>
          ))}
          <div className="avt-memo">{row.memo}</div>
        </React.Fragment>
      ))}
    </div>
  );
}

/* ---- 부록 · 예약자 불일치 처리 ---- */

const MISMATCH_BANNER = '예약자는 선택한 무료접종 대상에 해당하지 않아요. 진료 대상자 정보를 직접 입력해 주세요.';

/* ---- F-2 · F-3 공통 · 본인/대리 2지선다 ---- */

const WHOM_Q = '누구를 위한 접종인가요?';
const WHOM_SELF = '예약자 본인';
const WHOM_OTHER_SHORT = '다른 분';
const WHOM_OTHER_LONG = '다른 분(자녀 등)';

/** 칩 2개짜리 2지선다. 대상자 칩과 같은 규격을 쓴다. */
function TwoChoice({
  options,
  value,
  onPick
}: {
  options: { key: Whom; label: string }[];
  value: Whom | null;
  onPick?: (w: Whom) => void;
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
      {options.map((o) => (
        <div
          key={o.key}
          onClick={onPick ? () => onPick(o.key) : undefined}
          style={{
            minHeight: 52,
            padding: '8px 12px',
            boxSizing: 'border-box',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: value === o.key ? '1.5px solid #111' : '1px solid #E5E8EB',
            background: '#fff',
            cursor: onPick ? 'pointer' : 'default',
            fontSize: 15,
            fontWeight: value === o.key ? 600 : 400,
            lineHeight: 1.3,
            color: '#111',
            textAlign: 'center'
          }}
        >
          {o.label}
        </div>
      ))}
    </div>
  );
}

/** F-2(G-1) — 대상자 선택 화면에 바로 이어 붙는 질문 */
function WhomQuestion({ value, onPick }: { value: Whom | null; onPick?: (w: Whom) => void }) {
  return (
    <div style={{ borderTop: '1px solid #EEF0F3', padding: '18px 20px 20px' }}>
      <div style={{ font: '600 17px/1.4 Pretendard, sans-serif', color: '#111', paddingBottom: 12 }}>{WHOM_Q}</div>
      <TwoChoice
        options={[
          { key: 'self', label: WHOM_SELF },
          { key: 'other', label: WHOM_OTHER_SHORT }
        ]}
        value={value}
        onPick={onPick}
      />
    </div>
  );
}

/** F-3(G-2) — 신청서의 `진료 대상자` 섹션 자체를 2지선다로 재설계한 버전 */
function WhomSection({ value, onPick }: { value: Whom; onPick?: (w: Whom) => void }) {
  return (
    <div style={{ padding: '0 20px 20px' }}>
      <div style={{ font: '600 17px/1.4 Pretendard, sans-serif', color: '#111', paddingBottom: 12 }}>진료 대상자</div>
      <TwoChoice
        options={[
          { key: 'self', label: WHOM_SELF },
          { key: 'other', label: WHOM_OTHER_LONG }
        ]}
        value={value}
        onPick={onPick}
      />
      {value === 'other' ? (
        <div style={{ paddingTop: 20 }}>
          <TargetFields />
        </div>
      ) : null}
    </div>
  );
}

/** F-2(G-1)에서 `다른 분`을 골랐을 때의 신청서 섹션 — 체크박스·배너 없이 폼으로 시작 */
function PlainTargetSection() {
  return (
    <div style={{ padding: '0 20px 20px' }}>
      <div style={{ font: '600 17px/1.4 Pretendard, sans-serif', color: '#111', paddingBottom: 14 }}>진료 대상자</div>
      <TargetFields />
    </div>
  );
}

/** 체크박스 3종 — 체크됨(일반) / 비활성 / 빈 상태 */
function CheckBox({ kind }: { kind: 'on' | 'dim' | 'empty' }) {
  if (kind === 'on') {
    return (
      <svg width="22" height="22" viewBox="0 0 22 22" style={{ flex: 'none' }}>
        <rect x="1" y="1" width="20" height="20" rx="5" fill="#0073FA" />
        <path d="M6.5 11.2l3 3 6-6.4" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (kind === 'dim') {
    return (
      <svg width="22" height="22" viewBox="0 0 22 22" style={{ flex: 'none' }}>
        <rect x="1" y="1" width="20" height="20" rx="5" fill="#F2F4F7" stroke="#E5E8EB" />
        <path d="M6.5 11.2l3 3 6-6.4" fill="none" stroke="#C4C9D0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" style={{ flex: 'none' }}>
      <rect x="1" y="1" width="20" height="20" rx="5" fill="#fff" stroke="#CACED8" />
    </svg>
  );
}

function InfoBanner({ text }: { text: string }) {
  return (
    <div
      style={{
        background: '#EEF5FF',
        borderRadius: 8,
        padding: 14,
        font: '400 13px/1.6 Pretendard, sans-serif',
        color: '#0073FA',
        wordBreak: 'keep-all',
        marginBottom: 20
      }}
    >
      {text}
    </div>
  );
}

/**
 * 실제 동작용 `진료 대상자` 섹션.
 * mismatched=false면 일반 케이스(체크된 상태 · 입력 폼 없음)를 그려 F-3의 구조 차이를 비교할 수 있게 한다.
 */
function LiveTargetSection({ mode, mismatched }: { mode: MismatchMode; mismatched: boolean }) {
  const showForm = mismatched && mode !== 'off';
  const noCheckbox = false;
  const dim = showForm && mode === 'F1';

  return (
    <div style={{ padding: '0 20px 20px' }}>
      <div style={{ font: '600 17px/1.4 Pretendard, sans-serif', color: '#111', paddingBottom: noCheckbox ? 6 : 14 }}>진료 대상자</div>

      {noCheckbox ? null : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 14 }}>
          <CheckBox kind={dim ? 'dim' : showForm ? 'empty' : 'on'} />
          <span style={{ font: '400 15px/1.4 Pretendard, sans-serif', color: dim ? '#C4C9D0' : '#111' }}>예약자와 동일해요</span>
        </div>
      )}

      {showForm && mode === 'F1' ? <InfoBanner text={MISMATCH_BANNER} /> : null}
      {showForm ? <TargetFields /> : null}
    </div>
  );
}

function TargetFields() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <span className="avt-flab">이름</span>
        <div className="avt-fld">이름을 입력해주세요</div>
      </div>
      <div>
        <span className="avt-flab">연락처</span>
        <div className="avt-fld">010-0000-0000</div>
      </div>
      <div>
        <span className="avt-flab">생년월일 · 성별</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <div className="avt-fld" style={{ flex: 1.4 }}>
            YYMMDD
          </div>
          <div className="avt-fld" style={{ flex: 1 }}>
            성별
          </div>
        </div>
      </div>
    </div>
  );
}

function FrameCaption({ badge, caption }: { badge: string; caption: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
      <span className="avt-badge">{badge}</span>
      <span className="avt-cap">{caption}</span>
    </div>
  );
}

/**
 * 신청서(예약 정보 확인)의 `진료 대상자` 섹션 대안 프레임.
 * checkbox — 'disabled' 체크 불가(F-1 · F-2②) / 'empty' 체크 전 빈 상태 / 'none' 체크 UI 자체가 없음(F-3)
 */
function MismatchFrame({
  badge,
  caption,
  checkbox,
  banner,
  lead,
  note
}: {
  badge: string;
  caption: string;
  checkbox: 'disabled' | 'empty' | 'none';
  banner?: string | null;
  lead?: string | null;
  note: string;
}) {
  const dim = checkbox === 'disabled';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 375 }}>
      <FrameCaption badge={badge} caption={caption} />
      <div className="avt-frame">
        <StatusBar />
        <NavBar title="예약 정보 확인" />
        <div style={{ flex: 1, minHeight: 0, padding: '8px 20px 0' }}>
          <div style={{ font: '700 22px/1.35 Pretendard, sans-serif', color: '#111', paddingBottom: 20 }}>예약 정보를 확인해주세요</div>
          <div style={{ font: '600 17px/1.4 Pretendard, sans-serif', color: '#111', paddingBottom: lead ? 6 : 14 }}>진료 대상자</div>

          {lead ? (
            <div style={{ font: '400 13px/1.5 Pretendard, sans-serif', color: '#8B95A1', wordBreak: 'keep-all', paddingBottom: 20 }}>{lead}</div>
          ) : null}

          {checkbox === 'none' ? null : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 14 }}>
              {dim ? (
                <svg width="22" height="22" viewBox="0 0 22 22" style={{ flex: 'none' }}>
                  <rect x="1" y="1" width="20" height="20" rx="5" fill="#F2F4F7" stroke="#E5E8EB" />
                  <path d="M6.5 11.2l3 3 6-6.4" fill="none" stroke="#C4C9D0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <svg width="22" height="22" viewBox="0 0 22 22" style={{ flex: 'none' }}>
                  <rect x="1" y="1" width="20" height="20" rx="5" fill="#fff" stroke="#CACED8" />
                </svg>
              )}
              <span style={{ font: '400 15px/1.4 Pretendard, sans-serif', color: dim ? '#C4C9D0' : '#111' }}>예약자와 동일해요</span>
            </div>
          )}

          {banner ? (
            <div
              style={{
                background: '#EEF5FF',
                borderRadius: 8,
                padding: 14,
                font: '400 13px/1.6 Pretendard, sans-serif',
                color: '#0073FA',
                wordBreak: 'keep-all',
                marginBottom: 20
              }}
            >
              {banner}
            </div>
          ) : null}

          <TargetFields />
        </div>
        <Cta on={false} label="예약 신청하기" />
        <HomeIndicator />
      </div>
      <div className="avt-note">{note}</div>
    </div>
  );
}

/** F-2(G-1) ① — 대상자 선택 화면에 본인/대리 질문을 바로 이어 붙인 화면 (안 A 접기 기준) */
function WhomQuestionFrame() {
  const model: ScreenModel = {
    navTitle: '굿닥의원',
    isConfirm: false,
    rows: [{ label: '무료 백신 대상자', value: '어린이', chev: 'down' }],
    question: <WhomQuestion value="other" />,
    summary: { title: '무료접종 희망 · 어린이', body: SUMMARY_BODY },
    card: null,
    sheet: null,
    ctaOn: true,
    ctaLabel: '다음'
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 375 }}>
      <FrameCaption badge="F-2-①" caption="대상자 선택 화면 통합 · 본인/대리를 바로 질문" />
      <Screen model={model} />
      <div className="avt-note">
        카테고리를 고른 직후 같은 화면에서 묻는다. 생년월일을 대조하지 않으므로 경고도 오류도 없고, 고른 값을 그대로 신뢰한다.
      </div>
    </div>
  );
}

/** F-2(G-1) ② — `다른 분`을 골랐을 때의 신청서 */
function PlainTargetFrame() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 375 }}>
      <FrameCaption badge="F-2-②" caption="`다른 분` 선택 결과 · 체크박스·배너 없이 폼으로 시작" />
      <div className="avt-frame">
        <StatusBar />
        <NavBar title="예약 정보 확인" />
        <div style={{ flex: 1, minHeight: 0, paddingTop: 8 }}>
          <div style={{ padding: '0 20px 20px' }}>
            <div style={{ font: '700 22px/1.35 Pretendard, sans-serif', color: '#111' }}>예약 정보를 확인해주세요</div>
          </div>
          <PlainTargetSection />
        </div>
        <Cta on={false} label="예약 신청하기" />
        <HomeIndicator />
      </div>
      <div className="avt-note">`예약자 본인`을 골랐다면 이 섹션 자체가 없다. 앞 화면의 답이 곧 분기라 신청서에서 다시 물을 것이 없다.</div>
    </div>
  );
}

/** 진료 대상자 섹션이 아예 없는 신청서 — F-2에서 `예약자 본인`을 골랐을 때 */
function ConfirmOnlyFrame({ badge, caption, note }: { badge: string; caption: string; note: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 375 }}>
      <FrameCaption badge={badge} caption={caption} />
      <div className="avt-frame">
        <StatusBar />
        <NavBar title="예약 정보 확인" />
        <div style={{ flex: 1, minHeight: 0 }}>
          <ConfirmCard card={{ title: DECIDED, sub: '어린이 (22.1.1~26.8.31 출생자)', price: '미정', notice: true }} />
        </div>
        <Cta on label="예약 신청하기" />
        <HomeIndicator />
      </div>
      <div className="avt-note">{note}</div>
    </div>
  );
}

/** F-3(G-2) — 신청서의 진료 대상자 섹션을 본인/대리 2지선다로 재설계 */
function WhomSectionFrame({ value, badge, caption, note }: { value: Whom; badge: string; caption: string; note: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 375 }}>
      <FrameCaption badge={badge} caption={caption} />
      <div className="avt-frame">
        <StatusBar />
        <NavBar title="예약 정보 확인" />
        <div style={{ flex: 1, minHeight: 0, paddingTop: 8 }}>
          <div style={{ padding: '0 20px 20px' }}>
            <div style={{ font: '700 22px/1.35 Pretendard, sans-serif', color: '#111' }}>예약 정보를 확인해주세요</div>
          </div>
          <WhomSection value={value} />
        </div>
        <Cta on={false} label="예약 신청하기" />
        <HomeIndicator />
      </div>
      <div className="avt-note">{note}</div>
    </div>
  );
}

/* ============================ 실제 동작 우측 주석 ============================ */

const LIVE_INFO: Record<Variant, { title: string; desc: string; checks: string[] }> = {
  asis: {
    title: '안 E · 현행 유지 (기준선)',
    desc:
      '`어린이`를 고르면 주성분 아코디언이 열리지만 선택지는 `3가 백신` 하나뿐이고, 그것을 고르면 종류 아코디언에 `병원 상담 후 결정` 하나가 남는다. 두 단계를 모두 탭해야 `다음`이 열린다.',
    checks: [
      '`어린이` 선택 → 주성분에 칩이 1개만 남는 것을 확인',
      '`3가 백신` 탭 → 종류에 `병원 상담 후 결정` 1개만 남음',
      '두 개를 다 누르기 전에는 `다음`이 비활성인지 확인',
      '`해당 없음`으로 바꾸면 3가/4가와 제품 목록·가격이 나타남'
    ]
  },
  collapse: {
    title: '안 A · 하위 뎁스 접기',
    desc: '`어린이`를 고르면 주성분·종류 아코디언 2행이 화면에서 사라지고 요약 카드가 그 자리를 대신한다. `다음`은 즉시 활성.',
    checks: [
      '`어린이` 선택 → 아래 2행이 사라지고 요약 카드로 교체됨',
      '대상자 행을 다시 눌러 `해당 없음`으로 바꾸면 2행이 복귀',
      '전환할 때 CTA 활성 상태가 함께 바뀌는 정도를 체감'
    ]
  },
  disabled: {
    title: '안 C · 하위 뎁스 비활성',
    desc: '주성분·종류 행이 제자리에 남은 채 회색으로 비활성화되고, 대상자 행 아래에 한 줄 헬퍼가 붙는다. 행 개수와 높이가 유료 흐름과 동일하다.',
    checks: [
      '`어린이` 선택 → 아래 2행이 제자리에서 흐려짐',
      '흐려진 행을 눌러도 아무 일도 일어나지 않는 것을 확인',
      '`해당 없음`과 번갈아 선택해 레이아웃이 흔들리지 않는지 확인'
    ]
  },
  presplit: {
    title: '안 D · 사전 분기',
    desc: '진입 즉시 바텀시트가 대상자 여부를 먼저 묻는다. 대상자를 고르면 아코디언 없는 결과 카드 화면, `아니요`를 고르면 대상자 섹션이 없는 유료 2단 화면으로 갈린다.',
    checks: ['시트에서 `어린이` → 결과 카드만 있는 화면', '`변경`을 눌러 시트를 다시 띄우고 `아니요`로 전환', '`아니요` 경로에는 대상자 행이 아예 없는 것을 확인']
  },
  readonly: {
    title: '안 B · 읽기 전용 행',
    desc: '주성분·종류 행이 값이 채워진 읽기 전용 행으로 바뀐다. chevron이 없어 열리지 않고, 값은 회색으로 두어 유저가 고른 값과 구분한다.',
    checks: [
      '`어린이` 선택 → 두 행에 `병원 상담 후 결정`이 채워짐',
      'chevron이 사라져 열 수 없는 행이라는 신호가 보이는지 확인',
      '`해당 없음`으로 바꿔 유저가 고른 값(검정)과 비교'
    ]
  }
};

/* ---- 실제 동작 · 예약자 불일치 주석 ---- */

const MISMATCH_MODES: MismatchMode[] = ['off', 'F1', 'F3', 'F4'];
const MISMATCH_LABEL: Record<MismatchMode, string> = { off: '끔', F1: 'F-1', F3: 'F-2', F4: 'F-3' };
const MISMATCH_SHORT: Record<MismatchMode, string> = {
  off: '일반 케이스',
  F1: '체크 비활성',
  F3: '앞 화면에서 질문',
  F4: '신청서에서 질문'
};

const MISMATCH_INFO: Record<Exclude<MismatchMode, 'off'>, { title: string; desc: string; checks: string[] }> = {
  F1: {
    title: 'F-1 · 체크박스 비활성',
    desc: '신청서에서 `예약자와 동일해요`를 아예 누를 수 없게 막고, 이유를 배너로 설명한다.',
    checks: ['체크박스를 눌러도 반응이 없는 것을 확인', '왜 못 누르는지가 배너를 읽어야만 이해되는지 확인']
  },
  F3: {
    title: 'F-2 · 대상자 선택 화면 통합형',
    desc: '대상자 카테고리를 고른 직후 같은 화면에서 `누구를 위한 접종인가요?`를 묻는다. 생년월일 대조·경고는 없고, 고른 값을 그대로 신뢰한다.',
    checks: [
      '`어린이` 선택 → 같은 화면에 본인/대리 질문이 이어 붙는지 확인',
      '답하기 전에는 `다음`이 열리지 않는 것(필수 질문)을 확인',
      '`다른 분` → 신청서가 체크박스·배너 없이 입력 폼으로 시작',
      '`예약자 본인` → 신청서에 진료 대상자 섹션이 아예 없음'
    ]
  },
  F4: {
    title: 'F-3 · 신청서 섹션 재설계형',
    desc: '신청서의 `진료 대상자` 섹션을 체크박스 대신 본인/대리 2지선다로 바꾼다. 어린이는 `다른 분`이 기본값이고 수정할 수 있다.',
    checks: [
      '`어린이`로 신청서에 가면 `다른 분`이 이미 선택돼 있는지 확인',
      '`예약자 본인`으로 바꾸면 입력 폼이 접히는지 확인',
      '`어르신`·`임신부`에서는 기본값이 `예약자 본인`인 것을 확인',
      '이 질문이 생년월일 검증을 대체한다는 게 읽히는지 확인'
    ]
  }
};

/** 화면에 내는 안 = 추천 1~3순위(A~C). D 사전 분기·E 현행 유지는 2026-09-16 내렸다 — 구현은 남아 있어 여기 다시 넣으면 복구된다. */
const VARIANTS: Variant[] = ['collapse', 'readonly', 'disabled'];

/* ---- ② 진료 대상자 · 비교표 ---- */

type BookerCell = { tone?: Tone; v: string; tail?: string };

const BOOKER_HEADS = ['안', '질문·판정 시점', '정상 대리 예약을 오류로 취급', '생년월일 대조 의존', '선택 화면 길이', '구현량'];

const BOOKER_ROWS: { name: string; cells: BookerCell[]; memo: string }[] = [
  {
    name: 'F-1 · 체크 비활성',
    cells: [
      { v: '신청서 · 시스템이 판정' },
      { tone: 'hi', v: '그렇다' },
      { tone: 'hi', v: '상' },
      { tone: 'lo', v: '영향 없음' },
      { tone: 'lo', v: '하', tail: ' · disabled 상태만' }
    ],
    memo: '[대조 방식] 잘못 고를 여지가 없다. 단 — 부모가 자녀를 예약하는 정상 케이스에서 체크가 막혀 있고, 왜 막혔는지는 배너를 읽어야 안다.'
  },
  {
    name: 'F-2 · 선택 화면 통합',
    cells: [
      { v: '대상자 선택 화면 · 유저가 답' },
      { tone: 'lo', v: '아니다' },
      { tone: 'lo', v: '없음' },
      { tone: 'mid', v: '질문 1블록 추가' },
      { tone: 'mid', v: '중', tail: ' · 앞 화면 질문 + 분기' }
    ],
    memo: '장 — 신청서에 닿기 전에 분기가 끝나 신청서가 가장 단순해진다. 단 — 모든 무료접종 대상자가 질문을 한 번 더 받고, 선택 화면이 길어진다.'
  },
  {
    name: 'F-3 · 신청서 섹션 재설계',
    cells: [
      { v: '신청서 · 유저가 답' },
      { tone: 'lo', v: '아니다' },
      { tone: 'lo', v: '없음' },
      { tone: 'lo', v: '영향 없음' },
      { tone: 'mid', v: '중', tail: ' · 섹션 재설계 + 프리셋' }
    ],
    memo: '장 — 물어보는 자리가 정보를 입력하는 자리와 같아 자연스럽고, 어린이 프리셋으로 탭도 줄어든다. 단 — 프리셋이 틀린 케이스에서는 유저가 되돌려야 한다.'
  }
];

function BookerCompareBoard() {
  return (
    <div className="avt-cmp">
      {BOOKER_HEADS.map((h) => (
        <div key={h} className="avt-h">
          {h}
        </div>
      ))}
      {BOOKER_ROWS.map((row) => (
        <React.Fragment key={row.name}>
          <div className="avt-n">{row.name}</div>
          {row.cells.map((c, i) => (
            <div key={i}>
              {c.tone ? <span className={'avt-' + c.tone}>{c.v}</span> : c.v}
              {c.tail || ''}
            </div>
          ))}
          <div className="avt-memo">{row.memo}</div>
        </React.Fragment>
      ))}
    </div>
  );
}

/* ============================ 페이지 ============================ */

/** 이 프로토타입이 담은 결정 2건. 서로 독립이라 화면당 하나만 보여 준다. */
type Issue = 'depth' | 'booker';

const ISSUES: { key: Issue; label: string; tid: string; title: string; boardNote: string; liveNote: string }[] = [
  {
    key: 'depth',
    label: '① 하위 뎁스 처리',
    tid: '1',
    title: '하위 뎁스(주성분·독감백신 종류) 처리 3안 · 상태별 비교 (A~C = 추천순)',
    boardNote: '안 A~C(추천순) × 상태 ①②③ + 예약 정보 확인 카드',
    liveNote: '화면 안을 직접 눌러 동작을 확인하세요'
  },
  {
    key: 'booker',
    label: '② 진료 대상자',
    tid: '2',
    title: '진료 대상자 처리 3안 · 본인/대리를 언제 · 어떻게 물을 것인가',
    boardNote: 'F-1(대조 방식) / F-2·F-3(질문 방식) + 비교표',
    liveNote: '안은 추천 1순위 A로 고정했습니다 — 이 결정은 안과 무관합니다'
  }
];

export default function ApptVaccineTargetPage() {
  const [issue, setIssue] = useState<Issue>('depth');
  const [mode, setMode] = useState<'board' | 'live'>('live');
  const [variant, setVariant] = useState<Variant>('collapse');
  const [mismatch, setMismatch] = useState<MismatchMode>('off');

  const live = mode === 'live';
  const depth = issue === 'depth';
  const meta = ISSUES.find((i) => i.key === issue)!;

  // 이슈 ②를 볼 때는 안을 추천 1순위로 고정하고, 이슈 ①에서는 진료 대상자 처리를 끈다.
  // 화면당 변수 1개 — 두 축을 동시에 돌리면 무엇을 결정하는 자리인지 흐려진다.
  const effVariant: Variant = depth ? variant : 'collapse';
  const effMismatch: MismatchMode = depth ? 'off' : mismatch;

  const info = LIVE_INFO[effVariant];
  const mismatchInfo = effMismatch === 'off' ? null : MISMATCH_INFO[effMismatch];

  return (
    <div className="avt-root bb">
      <div className="avt-bar">
        <span className="avt-bar-title">독감 무료접종 대상자 선택 UX</span>
        <div className="avt-seg">
          {ISSUES.map((i) => (
            <button key={i.key} type="button" className={'avt-seg-item' + (i.key === issue ? ' is-on' : '')} onClick={() => setIssue(i.key)}>
              {i.label}
            </button>
          ))}
        </div>
        <span style={{ width: 1, height: 22, background: '#EEF0F3' }} />
        <div className="avt-seg">
          <button type="button" className={'avt-seg-item' + (live ? '' : ' is-on')} onClick={() => setMode('board')}>
            비교 보드
          </button>
          <button type="button" className={'avt-seg-item' + (live ? ' is-on' : '')} onClick={() => setMode('live')}>
            실제 동작
          </button>
        </div>
        {live && depth ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="avt-seg-label">안</span>
            <div className="avt-seg">
              {VARIANTS.map((v) => (
                <button key={v} type="button" className={'avt-seg-item' + (v === variant ? ' is-on' : '')} onClick={() => setVariant(v)}>
                  {LETTER[v]} <span className="avt-seg-sub">{VARIANT_SHORT[v]}</span>
                </button>
              ))}
            </div>
          </div>
        ) : null}
        {live && !depth ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="avt-seg-label">처리</span>
            <div className="avt-seg">
              {MISMATCH_MODES.map((m) => (
                <React.Fragment key={m}>
                  {m === 'F3' ? <span className="avt-seg-div" title="왼쪽 = 생년월일 대조 방식 · 오른쪽 = 본인/대리 질문 방식" /> : null}
                  <button type="button" className={'avt-seg-item' + (m === mismatch ? ' is-on' : '')} onClick={() => setMismatch(m)}>
                    {m === 'off' ? '끔' : MISMATCH_LABEL[m]} <span className="avt-seg-sub">{MISMATCH_SHORT[m]}</span>
                  </button>
                </React.Fragment>
              ))}
            </div>
          </div>
        ) : null}
        <span className="avt-spacer" />
        <span className="avt-bar-note">
          {live && !depth ? '구분선 왼쪽 = 생년월일 대조 방식(비교 기준) · 오른쪽 = 본인/대리 질문 방식' : live ? meta.liveNote : meta.boardNote}
        </span>
      </div>

      {live ? (
        <section className="avt-turn">
          <div className="avt-thd">
            <span className="avt-tid">실제 동작</span>
            <span className="avt-tname">{depth ? info.title : mismatchInfo ? mismatchInfo.title : '끔 · 예약자 본인이 접종받는 일반 케이스'}</span>
          </div>
          <div className="avt-row" style={{ gap: 40 }}>
            <LiveScreen key={issue + effVariant} variant={effVariant} mismatch={effMismatch} />
            <div className="avt-side">
              {depth ? (
                <>
                  <div className="avt-card">
                    <div className="avt-card-title">이 안이 실제로 하는 일</div>
                    <div className="avt-card-body">{info.desc}</div>
                  </div>
                  <div className="avt-card">
                    <div className="avt-card-title">확인해볼 동작</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {info.checks.map((c) => (
                        <div key={c} className="avt-check">
                          <span>·</span>
                          <span>{c}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : mismatchInfo ? (
                <>
                  <div className="avt-card">
                    <div className="avt-card-title">이 안이 실제로 하는 일</div>
                    <div className="avt-card-body">{mismatchInfo.desc}</div>
                  </div>
                  <div className="avt-card">
                    <div className="avt-card-title">확인해볼 동작</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {mismatchInfo.checks.map((c) => (
                        <div key={c} className="avt-check">
                          <span>·</span>
                          <span>{c}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="avt-card">
                  <div className="avt-card-title">지금 보고 있는 것</div>
                  <div className="avt-card-body">
                    예약자 본인이 접종받는 일반 케이스입니다. 신청서의 `진료 대상자`는 `예약자와 동일해요`가 체크된 채이고 입력 폼이 없습니다. 상단 `처리` 세그먼트를
                    F-1~F-3로 바꿔 이 상태와 비교하세요.
                  </div>
                </div>
              )}
              <div className="avt-hint">
                대상 여부 판정·서류·인증 UI는 없습니다. 유저 자기 선언과 고지 문구로만 처리하고, 제품과 금액은 병원 상담 후 결정됩니다.
                {depth
                  ? ' 접종받는 사람이 예약자 본인이 아닌 경우는 상단 이슈를 ②로 바꿔 보세요.'
                  : effMismatch === 'F1'
                    ? ' F-1은 예약자(만 ' + BOOKER_AGE + '세) 생년월일과 대조해 불일치를 오류로 다루는 방식입니다.'
                    : effMismatch === 'off'
                      ? ''
                      : ' F-2·F-3는 대조를 하지 않습니다 — 어린이는 부모가 대신 예약하는 것이 기본 케이스라, 오류가 아니라 질문으로 다룹니다.'}
              </div>
            </div>
          </div>
          <p className="avt-next">
            {depth
              ? '안을 바꾸려면 상단 `안` 세그먼트를 누르세요. 상태를 되돌리려면 화면 아래 `초기화` 또는 좌측 상단 ←.'
              : '처리를 바꿔도 진행 상태는 유지됩니다 — 같은 지점에서 F-1~F-3를 갈아 끼우며 비교하세요. `어린이`를 고르고 `다음`까지 가보면 차이가 가장 잘 보입니다.'}
          </p>
        </section>
      ) : (
        <section className="avt-turn">
          <div className="avt-thd">
            <span className="avt-tid">{meta.tid}</span>
            <span className="avt-tname">{meta.title}</span>
          </div>

          {depth ? (
            <div className="avt-opts">
              {OPTIONS.map((opt) => (
                <div key={opt.id} className="avt-opt" id={opt.id}>
                  <div className="avt-olabel">
                    <span className="avt-oid">{opt.id}</span>
                    <b>{opt.title}</b>
                    <span>{opt.desc}</span>
                  </div>
                  <div className="avt-row">
                    {opt.frames.map((f) => (
                      <StaticScreen key={f.label} variant={opt.variant} step={f.step} label={f.label} note={f.note} />
                    ))}
                  </div>
                </div>
              ))}

              <div className="avt-opt" id="1d">
                <div className="avt-olabel">
                  <span className="avt-oid">1d</span>
                  <b>비교표</b>
                </div>
                <CompareBoard />
              </div>
            </div>
          ) : (
            <div className="avt-opts">
              <div className="avt-hint" style={{ maxWidth: 1180 }}>
                세 안 모두 <b>같은 조건</b>에서 나란히 놓았습니다 — 하위 뎁스 처리 <b>안 A(접기)</b> · 무료 백신 대상자 <b>어린이</b> · 접종받는 사람은 예약자 본인이
                아님. 각 행은 왼쪽부터 <b>① 진료항목 선택 화면 → ② 신청서 진입 직후 → ③ 유저가 한 번 더 움직인 뒤</b> 순서입니다. ①이 같은 안끼리는 그 화면에서
                아무것도 달라지지 않는다는 뜻입니다.
              </div>

              <div className="avt-opt" id="2a">
                <div className="avt-olabel">
                  <span className="avt-oid">2a</span>
                  <b>F-1 · 체크 비활성</b>
                  <span>[대조 방식 · 비교 기준] 예약자 생년월일과 대조해 신청서에서 체크 자체를 막는다. 선택 화면에서는 아무 일도 일어나지 않는다.</span>
                </div>
                <div className="avt-row">
                  <StaticScreen
                    variant="collapse"
                    step="3"
                    label="F-1-①"
                    caption="진료항목 선택 · 안 A + 어린이 (변화 없음)"
                    note="대조 방식은 선택 화면에 손대지 않는다. 유저는 여기서 아무 낌새도 채지 못한 채 신청서로 간다."
                  />
                  <MismatchFrame
                    badge="F-1-②"
                    caption="신청서 진입 직후 · 체크 비활성 + 배너"
                    checkbox="disabled"
                    banner={MISMATCH_BANNER}
                    note="정상적인 대리 예약인데 체크가 막혀 있고, 왜 막혔는지는 배너를 읽어야 안다."
                  />
                </div>
              </div>

              <div className="avt-opt" id="2b">
                <div className="avt-olabel">
                  <span className="avt-oid">2b</span>
                  <b>F-2 · 앞 화면에서 질문</b>
                  <span>[질문 방식] 대상자를 고른 직후 같은 화면에서 본인/대리를 묻는다. 대조·경고가 없고, 답에 따라 신청서가 갈린다.</span>
                </div>
                <div className="avt-row">
                  <WhomQuestionFrame />
                  <PlainTargetFrame />
                  <ConfirmOnlyFrame
                    badge="F-2-③"
                    caption="① 에서 `예약자 본인`을 골랐을 때의 신청서"
                    note="앞 화면의 답이 곧 분기라, 진료 대상자 섹션 자체가 없다. 대조 방식에서는 이 케이스도 늘 섹션을 그린다."
                  />
                </div>
              </div>

              <div className="avt-opt" id="2c">
                <div className="avt-olabel">
                  <span className="avt-oid">2c</span>
                  <b>F-3 · 신청서에서 질문</b>
                  <span>[질문 방식] 선택 화면은 그대로 두고, 신청서의 `진료 대상자` 섹션을 체크박스 대신 2지선다로 바꾼다.</span>
                </div>
                <div className="avt-row">
                  <StaticScreen
                    variant="collapse"
                    step="3"
                    label="F-3-①"
                    caption="진료항목 선택 · 안 A + 어린이 (변화 없음)"
                    note="F-1과 같은 화면이다. 질문을 신청서에 두었으므로 앞 화면은 건드리지 않는다."
                  />
                  <WhomSectionFrame
                    badge="F-3-②"
                    caption="신청서 진입 직후 · 어린이는 `다른 분`이 기본값"
                    value="other"
                    note="묻는 자리와 입력하는 자리가 같아 자연스럽고, 프리셋 덕에 어린이 케이스는 추가 탭이 없다."
                  />
                  <WhomSectionFrame
                    badge="F-3-③"
                    caption="`예약자 본인`으로 바꾼 뒤 · 폼이 접힘"
                    value="self"
                    note="프리셋이 틀렸을 때 한 번에 되돌릴 수 있다. 이 질문이 곧 검증을 대체하므로 대조·에러 배너는 없다."
                  />
                </div>
              </div>

              <div className="avt-opt" id="2d">
                <div className="avt-olabel">
                  <span className="avt-oid">2d</span>
                  <b>비교표</b>
                </div>
                <BookerCompareBoard />
              </div>
            </div>
          )}

          <p className="avt-next">
            {depth
              ? '다음 단계로 좋은 것 · "안 C와 안 B를 합쳐서 주성분만 읽기 전용, 종류는 비활성으로" · "안 A의 요약 카드 카피 대안 3개"'
              : '다음 단계로 좋은 것 · "F-2의 질문을 선택으로 바꾸면 어떻게 되는지" · "F-3 프리셋을 어린이 외 카테고리로 넓힐지" · "두 안을 합쳐 선택 화면에서 묻고 신청서에서 수정하게 하는 안"'}
          </p>
        </section>
      )}
    </div>
  );
}
