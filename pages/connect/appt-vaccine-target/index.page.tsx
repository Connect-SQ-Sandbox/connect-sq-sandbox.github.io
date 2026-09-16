import React, { useEffect, useMemo, useState } from 'react';

/**
 * ┌─ 프로토타입 컨텍스트 ───────────────────────────────────
 * 이름     : appt-vaccine-target — 독감 무료접종 대상자 선택 UX (유저향 모바일 신청 웹)
 *            `무료 백신 대상자`를 고른 뒤 하위 뎁스(주성분 · 독감백신 종류)를 어떻게 처리할지 5안 비교 + 실제 동작.
 * 상태     : 현행(active)   버전: v1.4   최종수정: 2026-09-16
 * PRD      : 미발행 — Claude Design 핸드오프 `무료접종 대상자 선택 UX-handoff.zip`(2026-09-16) 이식.
 *            원본 캔버스 = `무료접종 대상자 선택 UX.dc.html` + 컴포넌트 `VaccineScreen.dc.html` / `VaccineLive.dc.html`.
 * 짝 화면  : 병원(어드민)향 = 예약 신청 내역 · 독감 무료접종형 진료정보 → out/treatment-create-tree.html?spec=1 의 [T45]
 *            (React 원본은 pages/connect/appt-free-vaccine). 이 페이지는 그 예약이 **만들어지는 유저 쪽 화면**이다.
 * 배포URL  : https://connect-sq-sandbox.github.io/out/appt-vaccine-target.html
 * 관련 CSS : apptVaccineTarget.css (캔버스 크롬만. 모바일 프레임 내부는 원본대로 인라인 스타일)
 * 기술제약 : react-only · plain CSS · mock · 네트워크 0
 *
 * 화면구성 : ① 실제 동작(기본 진입) — 상단 `안` 세그먼트로 A~E를 바꿔 가며 직접 눌러보는 인터랙티브 화면 + 우측 확인 포인트
 *            ② 비교 보드 — 안 A~E × 상태 ①②③ + 예약 정보 확인 카드 ④, 비교표, 부록(예약자 불일치 F-1~F-4)
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
 *   [보류]       예약자 불일치(고른 대상자와 예약자 생년월일이 어긋남) 처리 4안 미정 —
 *                F-1 체크 비활성 / F-2 체크 후 즉시 해제 / F-3 사전 경고(대상자 선택 즉시 알리고 신청서에서 이어받음) /
 *                F-4 자동 전환(체크 UI를 없애고 입력 폼으로 시작).
 *                F-3·F-4는 "신청서에서 조건을 검증하는 게 어색하다"는 피드백에서 나온 방향(2026-09-16 세화님).
 *   [유지·자체] 원본 캔버스는 안 A의 유료 제품 가격을 250,000원 단일값 mock으로 뒀다. 실제 접종료가 아니라
 *                가격 행이 있는지 없는지를 보기 위한 자리표시값이라 그대로 옮겼다.
 *   [유지·자체] 안 D의 시트를 스와이프로 닫는 경로는 원본에도 정의가 없어 구현하지 않았다(딤 탭 = 무동작).
 *
 * 보류 · TODO (PO 확인 대기):
 *   · 채택안 1개 확정 → 확정 후 이 파일에서 나머지 안을 내리고 단일 안 프로토타입으로 좁힌다.
 *   · 대상자 기준 문구(22.1.1~26.8.31 / 1961.12.31 이전)의 운영값 관리 위치 — appt-free-vaccine 헤더의 보류 항목과 동일 건.
 *   · 안 D 채택 시 시트 닫기·되돌리기 상태 정의 필요.
 *
 * 변경 이력:
 *   v1    2026-09-16 — Claude Design 핸드오프 이식(비교 보드 + 실제 동작 2모드). 신규.
 *   v1.1  2026-09-16 — 진입 기본 모드를 비교 보드 → 실제 동작으로 변경(세화님 지시). 5안 비교는 세그먼트로 이동.
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
  /** 행 아래 파란 인라인 경고(F-3 사전 경고형에서 사용) */
  warn?: string | null;
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

      {row.warn ? (
        <div
          style={{
            margin: '0 20px 16px',
            background: '#EEF5FF',
            borderRadius: 8,
            padding: 14,
            font: '400 13px/1.6 Pretendard, sans-serif',
            color: '#0073FA',
            wordBreak: 'keep-all'
          }}
        >
          {row.warn}
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
};

function Screen({ model }: { model: ScreenModel }) {
  return (
    <div className="avt-frame">
      <StatusBar />
      <NavBar title={model.navTitle} onBack={model.onBack} />

      <div style={{ flex: 1, minHeight: 0, overflowY: model.scroll ? 'auto' : 'hidden' }}>
        {model.isConfirm && model.card ? (
          <ConfirmCard card={model.card} />
        ) : (
          <>
            <div style={{ padding: '8px 20px 20px' }}>
              <div style={{ font: '700 22px/1.35 Pretendard, sans-serif', color: '#111', wordBreak: 'keep-all' }}>진료항목을 선택해주세요</div>
            </div>
            {model.rows.map((row, i) => (
              <AccordionRow key={i} row={row} />
            ))}
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

function StaticScreen({ variant, step, label, note }: { variant: Variant; step: string; label: string; note?: string }) {
  const model = buildStatic(variant, step);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: 375 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span className="avt-badge">{label}</span>
        <span style={{ font: '600 13px/1.3 Pretendard, sans-serif', color: '#31353F' }}>{model.caption}</span>
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

function LiveScreen({ variant }: { variant: Variant }) {
  const [s, setS] = useState<LiveState>(() => initialState(variant));

  useEffect(() => {
    setS(initialState(variant));
  }, [variant]);

  const free = !!s.target && s.target !== 'none';
  const isConfirm = s.screen === 'confirm';

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
  steps.push(ready ? 'CTA 활성' : 'CTA 비활성');

  let tapNote: string;
  if (!s.target && variant !== 'presplit') tapNote = '칩을 눌러 대상자를 고르면 안 ' + LETTER[variant] + '의 처리 방식이 그대로 동작합니다.';
  else if (variant === 'presplit' && s.sheetOpen) tapNote = '시트에서 선택하면 유료/무료 흐름이 갈립니다.';
  else if (free && variant === 'asis') tapNote = '선택지가 1개뿐인 두 단계를 탭으로 통과해야 CTA가 열립니다.';
  else if (free) tapNote = '대상자를 골랐으므로 하위 뎁스 선택 없이 CTA가 열립니다. 대상자 행을 다시 눌러 `해당 없음`으로 바꿔보세요.';
  else tapNote = '유료 흐름: 주성분 → 독감백신 종류 순으로 고릅니다.';
  if (isConfirm) tapNote = '좌측 상단 ←를 누르면 선택 화면으로 돌아갑니다.';

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
      { step: '3', label: 'B-③', note: '라벨은 검정, 값은 회색으로 두어 유저가 고른 값(E-③의 `3가 백신`)과 시스템 확정값을 색으로 구분한다.' },
      { step: '4', label: 'B-④' }
    ]
  },
  {
    id: '1c',
    variant: 'disabled',
    title: '안 C · 하위 뎁스 비활성',
    desc:
      '주성분·종류 아코디언이 남아 있되 비활성(회색 라벨, 흐린 chevron, 탭 불가). 대상자 행 바로 아래 한 줄 헬퍼. 레이아웃이 안 E와 완전히 같아 위치 기억이 유지된다.',
    frames: [
      { step: '1', label: 'C-①' },
      { step: '2', label: 'C-②' },
      { step: '3', label: 'C-③', note: '행 개수·순서·높이가 ①②와 동일하다. 대상자 행만 값이 바뀌고 아래 두 행은 제자리에서 흐려진다.' },
      { step: '4', label: 'C-④' }
    ]
  },
  {
    id: '1d',
    variant: 'presplit',
    title: '안 D · 사전 분기 (질문을 앞으로)',
    desc: '화면 진입 시 바텀시트가 먼저 뜬다. 대상자를 고르면 아코디언 없는 결과 카드 화면, `아니요`를 고르면 대상자 섹션이 없는 기존 유료 2단 화면으로 갈린다.',
    frames: [
      {
        step: '1',
        label: 'D-①',
        note: '본문에는 이미 유료 2단 아코디언이 깔려 있고 그 위에 시트가 뜬다. 시트를 스와이프로 닫는 경로에서 어떤 상태로 떨어질지 정의가 필요하다.'
      },
      { step: '2', label: 'D-②' },
      { step: '3', label: 'D-③', note: '대상자 흐름에서는 고를 것이 없으므로 아코디언을 아예 그리지 않는다. 되돌리기는 `변경` 링크로만 가능하다.' },
      { step: '4', label: 'D-④' }
    ]
  },
  {
    id: '1e',
    variant: 'asis',
    title: '안 E · 현행 유지 (기준선)',
    desc:
      '`어린이` 선택 시 주성분 선택지가 `3가 백신` 1개만 남아 선택된 상태로 표시되고, 종류 행에는 `병원 상담 후 결정`이 들어간다. 유저는 두 단계를 탭으로 통과해 `다음`을 누른다. 원안 그대로.',
    frames: [
      { step: '1', label: 'E-①' },
      { step: '2', label: 'E-②' },
      {
        step: '3',
        label: 'E-③',
        note: '유저가 3가 백신을 직접 고른 것처럼 보인다. 선택지가 1개뿐이라 선택의 의미가 없는데도 탭을 요구한다.'
      },
      { step: '4', label: 'E-④' }
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
      '장 — 레이아웃이 안 E와 동일해 위치 기억이 유지되고, 유료로 바꾸면 무엇이 열리는지 보인다. 단 — 탭이 안 되는 행이 남아 한 번은 눌러보게 된다.'
  },
  {
    name: 'D · 사전 분기',
    cells: [
      { tone: 'lo', v: '0', tail: ' · 진입 시 1탭 선행' },
      { tone: 'lo', v: '하' },
      { tone: 'hi', v: '상', tail: ' · 화면 자체가 갈림' },
      { tone: 'hi', v: '상', tail: ' · 시트 타이틀·선택지·고지' },
      { tone: 'hi', v: '하', tail: ' · 바텀시트·분기 신규' }
    ],
    memo: '장 — 유료/무료 흐름이 섞이지 않아 각 화면이 가장 단순해진다. 단 — 모든 유저가 질문을 먼저 받고, 시트 닫기·되돌리기 정의가 늘어난다.'
  },
  {
    name: 'E · 현행 유지',
    cells: [
      { tone: 'hi', v: '4', tail: ' · 아코디언 2회 + 항목 2회' },
      { tone: 'hi', v: '상' },
      { tone: 'lo', v: '하', tail: ' · 행 구조 동일' },
      { tone: 'lo', v: '하', tail: ' · 추가 문구 없음' },
      { tone: 'lo', v: '상', tail: ' · 그대로 사용' }
    ],
    memo:
      '장 — 구현 비용 0, 기존 데이터 구조 그대로. 단 — 선택지가 1개뿐인 단계를 두 번 통과시키고, 3가 백신을 유저가 고른 값으로 기록한다.'
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
/** F-3 ① 대상자 선택 단계에서 곧바로 띄우는 사전 경고 */
const PREWARN_BANNER = '예약자님은 만 34세로, 선택하신 어린이 대상에 해당하지 않아요. 신청서에서 별도 대상자 정보를 입력하게 돼요.';
/** F-3 ② 앞 단계 경고를 이어받는 신청서 배너 */
const PREWARN_FOLLOWUP = '앞에서 안내드린 대로, 예약자는 선택한 무료접종 대상에 해당하지 않아요. 진료 대상자 정보를 직접 입력해 주세요.';
/** F-4 체크박스를 없앤 대신 남기는 안내 한 줄 */
const NO_CHECKBOX_LEAD = '예약자님과 다른 분의 정보를 입력해주세요';

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
 * checkbox — 'disabled' 체크 불가(F-1 · F-3②) / 'empty' 체크는 되지만 시도 시 해제(F-2) / 'none' 체크 UI 자체가 없음(F-4)
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

/** F-3 ① — 대상자 선택 화면에서 칩을 고르는 즉시 띄우는 사전 경고 (안 A 접기 기준) */
function PreWarnFrame() {
  const model: ScreenModel = {
    navTitle: '굿닥의원',
    isConfirm: false,
    rows: [{ label: '무료 백신 대상자', value: '어린이', chev: 'down', warn: PREWARN_BANNER }],
    summary: { title: '무료접종 희망 · 어린이', body: SUMMARY_BODY },
    card: null,
    sheet: null,
    ctaOn: true,
    ctaLabel: '다음'
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 375 }}>
      <FrameCaption badge="F-3-①" caption="대상자 선택 즉시 · 인라인 사전 경고" />
      <Screen model={model} />
      <div className="avt-note">칩을 고르는 순간 예약자 생년월일과 대조해 알려준다. 신청서까지 가서 막히지 않지만, 다음 화면에서 같은 사실을 다시 말하게 된다.</div>
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

/* ============================ 페이지 ============================ */

/** 추천 순위대로 나열한다(= 표시 이름 A~E 순). */
const VARIANTS: Variant[] = ['collapse', 'readonly', 'disabled', 'presplit', 'asis'];

export default function ApptVaccineTargetPage() {
  const [mode, setMode] = useState<'board' | 'live'>('live');
  const [variant, setVariant] = useState<Variant>('collapse');
  const live = mode === 'live';
  const info = useMemo(() => LIVE_INFO[variant], [variant]);

  return (
    <div className="avt-root bb">
      <div className="avt-bar">
        <span className="avt-bar-title">독감 무료접종 대상자 선택 UX</span>
        <div className="avt-seg">
          <button type="button" className={'avt-seg-item' + (live ? '' : ' is-on')} onClick={() => setMode('board')}>
            비교 보드
          </button>
          <button type="button" className={'avt-seg-item' + (live ? ' is-on' : '')} onClick={() => setMode('live')}>
            실제 동작
          </button>
        </div>
        {live ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="avt-seg-label">안</span>
            <div className="avt-seg">
              {VARIANTS.map((v) => (
                <button key={v} type="button" className={'avt-seg-item' + (v === variant ? ' is-on' : '')} onClick={() => setVariant(v)}>
                  {LETTER[v]}
                </button>
              ))}
            </div>
          </div>
        ) : null}
        <span className="avt-spacer" />
        <span className="avt-bar-note">
          {live ? '화면 안을 직접 눌러 동작을 확인하세요' : '안 A~E(추천순) × 상태 ①②③ + 예약 정보 확인 카드'}
        </span>
      </div>

      {live ? (
        <section className="avt-turn">
          <div className="avt-thd">
            <span className="avt-tid">실제 동작</span>
            <span className="avt-tname">{info.title}</span>
          </div>
          <div className="avt-row" style={{ gap: 40 }}>
            <LiveScreen key={variant} variant={variant} />
            <div className="avt-side">
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
              <div className="avt-hint">
                대상 여부 판정·서류·인증 UI는 없습니다. 유저 자기 선언과 고지 문구로만 처리하고, 제품과 금액은 병원 상담 후 결정됩니다.
              </div>
            </div>
          </div>
          <p className="avt-next">안을 바꾸려면 상단 `안` 세그먼트를 누르세요. 상태를 되돌리려면 화면 아래 `초기화` 또는 좌측 상단 ←.</p>
        </section>
      ) : (
        <section className="avt-turn">
          <div className="avt-thd">
            <span className="avt-tid">1</span>
            <span className="avt-tname">하위 뎁스(주성분·독감백신 종류) 처리 5안 · 상태별 비교 (A~E = 추천순)</span>
          </div>
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

            <div className="avt-opt" id="1f">
              <div className="avt-olabel">
                <span className="avt-oid">1f</span>
                <b>비교 보드</b>
              </div>
              <CompareBoard />
            </div>

            <div className="avt-opt" id="1g">
              <div className="avt-olabel">
                <span className="avt-oid">1g</span>
                <b>부록 · 예약자 불일치 처리</b>
                <span>
                  `어린이`를 골랐는데 예약자 본인 생년월일이 어린이 기준을 벗어난 경우. F-1·F-2는 신청서에서 조건을 검증하는 방식이고, "신청서에서 검증하는 게
                  어색하다"는 피드백에 따라 더 이른 시점에 알리는 F-3, 체크박스 자체를 없애는 F-4를 덧붙였다.
                </span>
              </div>
              <div className="avt-row">
                <MismatchFrame
                  badge="F-1"
                  caption="체크박스 비활성 + 배너 상시 노출"
                  checkbox="disabled"
                  banner={MISMATCH_BANNER}
                  note="체크 자체를 막아 잘못된 선택이 일어나지 않지만, 왜 못 누르는지 배너를 읽어야 안다."
                />
                <MismatchFrame
                  badge="F-2"
                  caption="체크는 유지 · 시도 시 배너 후 해제"
                  checkbox="empty"
                  banner={MISMATCH_BANNER}
                  note="체크는 눌리지만 즉시 해제되고 같은 배너가 뜬다. 누를 수 있어 답답함이 적은 대신, 왜 풀렸는지 한 번은 헷갈릴 수 있다."
                />
                <PreWarnFrame />
                <MismatchFrame
                  badge="F-3-②"
                  caption="사전 경고형 · 신청서는 F-1과 동일 + 연결 문구"
                  checkbox="disabled"
                  banner={PREWARN_FOLLOWUP}
                  note="앞 단계 경고를 `앞에서 안내드린 대로`로 이어받아 반복을 설명으로 바꾼다. 두 화면에서 같은 말을 두 번 하는 것이 과하지 않은지가 확인 포인트."
                />
                <MismatchFrame
                  badge="F-4"
                  caption="자동 전환형 · 체크박스 없이 입력 폼으로 시작"
                  checkbox="none"
                  lead={NO_CHECKBOX_LEAD}
                  note="체크 UI가 없어 `눌러도 되는지` 헷갈림이 원천 제거된다. 대신 예약자=대상자인 일반 케이스와 섹션 구조가 달라지는 것이 위화감을 주지 않는지가 확인 포인트."
                />
              </div>
            </div>
          </div>
          <p className="avt-next">
            다음 단계로 좋은 것 · "안 C와 안 B를 합쳐서 주성분만 읽기 전용, 종류는 비활성으로" · "안 A의 요약 카드 카피 대안 3개" · "안 D 시트를 닫았을 때의 상태 정의"
          </p>
        </section>
      )}
    </div>
  );
}
