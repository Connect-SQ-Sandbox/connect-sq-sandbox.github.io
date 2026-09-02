import React, { useMemo, useState } from 'react';
import {
  FiPlus,
  FiX,
  FiList,
  FiFileText,
  FiCalendar,
  FiSettings,
  FiChevronRight,
  FiChevronLeft,
  FiSearch,
} from 'react-icons/fi';

/**
 * ┌─ 프로토타입 컨텍스트 ───────────────────────────────────
 * 이름     : ti-category-c — 진료항목 분류 필드 분리(C안) + 카카오 연동
 * 상태     : 현행(active)   버전: v1   최종수정: 2026-09-01
 * PRD      : 없음(선행 탐색). 근거 문서 = Notion "진료항목 분류 체계 현황과 개선 방향"
 * 배포URL  : (미배포) 예정 https://connect-sq-sandbox.github.io/out/ti-category-c.html
 * 관련 CSS : styles/kakaoRealcodeTest.css + styles/tiCategoryC.css (tc-*)
 * 기술제약 : react-only · plain CSS · mock · 네트워크 0
 *
 * 베이스   : kakao-realcode-test v2 를 그대로 복제해 **분류 필드만 추가**.
 *            카카오 노출 설정 카드 · 발문 빌더 · 예약 신청 내역 · 진료 예약 설정은 무수정.
 *
 * 화면구성 : ① 진료항목 목록(분류 열 추가) ② 진료항목 상세(분류 필드 신설)
 *            ③ 예약 신청 내역 ④ 진료 예약 설정
 *
 * ── C안(분류 필드 분리) 스펙 ────────────────────────────
 * 왜 : 현재는 "진료항목명" 필드 하나가 이름과 분류를 동시에 결정한다. 자동완성을 고르면
 *      이름까지 표준 이름이 되고, 직접 입력하면 분류가 통째로 사라진다(master1/2/3 전부 null).
 *      실측 결과 등록 1,509건 중 657건(43.5%)이 분류 없이 저장돼 환자 검색 인덱스에 0 기여.
 *      그중 194건(29.5%)은 마스터의 중분류·대분류명을 그대로 타이핑한 것 — 마스터에 있는데
 *      자동완성이 소분류(leaf)만 고르게 해서 도달하지 못한 물량이다.
 *
 * 1. 필드 분리
 *    - 진료항목명 : 병원이 부르는 이름. 자유 입력(2~50자). 자동완성으로 표준 항목 선택 가능.
 *    - 분류       : 굿닥 표준 진료항목의 대분류 › 중분류. 별도 필드에서 선택.
 *    - 자동완성으로 표준 소분류를 고르면 이름과 분류가 **함께** 채워진다.
 *    - 이름을 직접 입력하면 분류는 비어 있고, 분류 필드에서 따로 고른다.
 * 2. 분류 선택 = 2단 시트 (대분류 → 중분류). 소분류는 고르지 않는다(부분 매핑).
 *    → 저장 형태: master1Id + master2Id 는 값, master3Id 는 null, name 은 병원 입력값.
 * 3. 추천 : 이름에 마스터 명칭이 포함되면 역매칭으로 분류를 제안(원클릭). '이마보톡스' ⊃ '보톡스'.
 * 4. 필수 정책은 프로토타입에서 토글로 비교 — 상세 상단 [분류 필수] 스위치.
 *    OFF = 기존 항목 유예(저장 허용 + 경고), ON = 미선택 시 저장 차단.
 * 5. 목록에 분류를 노출하고, 분류 없는 항목은 '분류 없음 · 검색 노출 안 됨'으로 구별.
 *
 * 핵심 결정 (why):
 *   [유지·자체] 소분류는 선택 대상에서 제외. 병원이 파는 단위가 중분류인 경우가 많고
 *              (예: 예방접종 › 대상포진 백신 › 조스타박스 — 병원은 '대상포진 백신'을 판다),
 *              소분류까지 강제하면 지금과 같은 이탈이 재현된다.
 *   [유지·자체] '분류 없이 저장'을 막지 않는다. 고를 게 없을 때 강제하면 미분류가
 *              오분류로 대체될 뿐이고, 그건 되돌리기가 더 어렵다.
 *   [실데이터] TAXONOMY 는 2026-08-14 마스터 CSV 전량(대 15 / 중 69 / 소 187)을 그대로 이식.
 *   [실코드]   진료항목명 2~50자·칩 복구·자동완성 정렬(소>중>대)은 receipt-web
 *              TreatmentItemNameSearch/spec.md 기준.
 *
 * 보류·TODO:
 *   [보류] 분류 필수 여부 최종 정책(기존 항목 유예 기간 포함).
 *   [보류] 카카오 상품에 분류를 함께 전달할지 — 카카오 상품 API에 카테고리 필드 없음(현재 미전달).
 *   [보류] 기존 재고를 병원이 정리하도록 유도하는 목록 배너·알림(별도 프로토타입).
 *
 * 변경 이력:
 *   v1 2026-09-01 — kakao-realcode-test v2 복제 + C안(분류 필드 분리) 신설.
 * └──────────────────────────────────────────────────────
 */

/* =========================================================================
 * 타입
 * ======================================================================= */
type KakaoStatus = '연동완료' | '연동대기' | '연동불가' | '연동해제' | '미연동';
type PriceType = 'fixed' | 'discount' | 'consult';
type QType = 'text' | 'radio' | 'select';
type ApptTab = 'request' | 'upcoming' | 'closed';
type ApptStatus =
  | 'T01' /* 확정대기 */
  | 'T03' /* 예약확정 */
  | 'F05' /* 진료완료 */
  | 'F03' /* 병원취소 */
  | 'F02' /* 환자취소 */
  | 'AUTO'; /* 자동종료 */

interface PriceOption {
  id: string;
  title: string;
  type: PriceType;
  amount: number; // 고정가
  original: number; // 할인 정상가
  sale: number; // 할인 판매가
  content: string; // 가격 옵션 설명 (가격 설명)
  active: boolean; // 활성 Price
}
interface Question {
  id: string;
  type: QType; // text | radio | select
  name: string;
  optional: boolean; // 답변 필수 = !optional
  description: string;
  options: string[];
}
interface Item {
  id: string;
  name: string;
  price: number; // 대표가 표기용
  thumbnail: string;
  visible: boolean; // 굿닥 노출 (선행 조건)
  kakaoLinked: boolean; // 카카오 노출 의도
  prices: PriceOption[];
  questions: Question[];
  information: string; // 이용 방법
  notice: string;
  cancelNotice: string;
  /* 추가 정보 (진료항목 정보 폼) */
  alias: string; // 진료항목 노출명 (비우면 name)
  shortDescription: string; // 한 줄 소개
  detailDescription: string; // 상세 소개
  keywords: string[]; // 진료항목 키워드
  mainImage: string; // 대표 사진 placeholder 마커 (빈값=없음)
  detailImages: string[]; // 상세 소개 사진 placeholder 마커 목록
  /* 분류 (C안) — 대분류 › 중분류. null 이면 미분류 = 환자 검색 인덱스에 0 기여 */
  category: CategoryPick | null;
}
interface Reservation {
  id: string;
  visitor: string;
  reserver: string;
  sameAsVisitor: boolean;
  phone: string;
  birth: string; // yyyy.mm.dd
  age: number;
  gender: '남' | '여';
  itemName: string;
  priceTitle: string;
  totalPrice: number;
  deviceType: 1 | 2 | 3; // 1 모바일 / 2 카카오 / 3 네이버
  status: ApptStatus;
  tab: ApptTab;
  visitAt: string; // 예약희망
  repAt: string; // 신청/확정/종료 일시
  reserverMemo: string;
  closedReason?: string;
  additionalInfos?: { name: string; values: string[] }[];
}

/* =========================================================================
 * 상수 (KakaoSettingCard/constants.ts)
 * ======================================================================= */
const KAKAO_INFORMATION_MAX = 2000;
const KAKAO_NOTICE_MAX = 100;
const KAKAO_CANCEL_NOTICE_MAX = 100;
const KAKAO_MAX_QUESTIONS = 10;
const KAKAO_QUESTION_NAME_MAX = 120;
const KAKAO_QUESTION_DESCRIPTION_MAX = 200;
const KAKAO_MAX_OPTIONS = 10;
const KAKAO_MIN_OPTIONS = 2;
const KAKAO_OPTION_NAME_MAX = 50;
const PRICE_DESCRIPTION_MAX = 100; // 카카오 Price.description 최종 문구 상한 (명세)
const MAX_DATE_RANGE_MONTHS = 6;

/* 진료항목 정보 폼 상한 (실코드 각 입력 컴포넌트 MAX_LENGTH) */
const ALIAS_MAX = 50; // 진료항목 노출명
const SHORT_INTRO_MAX = 50; // 한 줄 소개
const DETAIL_DESC_MAX = 5000; // 상세 소개
const PRICE_NAME_MAX = 50; // 가격명
const PRICE_CONTENT_MAX = 100; // 가격 설명
const KEYWORD_MAX_ITEMS = 20; // 키워드 개수
const KEYWORD_MAX_LENGTH = 20; // 키워드 길이
const ITEM_NAME_MIN = 2; // 진료항목명 최소 (spec.md)
const ITEM_NAME_MAX = 50; // 진료항목명 최대 (spec.md)
const DETAIL_IMAGES_MAX = 5; // 상세 소개 사진 개수

/* =========================================================================
 * 유틸
 * ======================================================================= */
const won = (n: number) => `${(n || 0).toLocaleString('ko-KR')}원`;
const uid = () => Math.random().toString(36).slice(2, 9);

/* 답변 항목(선택지) 중복 검증
 * 카카오는 환자가 고른 답변을 문구(value) 그대로 저장·전달한다. 같은 문구가 두 개면
 * 환자 화면에서 두 항목을 구분할 수 없고(같은 문구를 함께 선택한 것처럼 보임),
 * 예약 상세의 답변으로도 어느 항목을 고른 것인지 알 수 없다. → 입력 단계에서 막는다.
 * 판정 기준: 앞뒤 공백 제거 + 연속 공백 1칸 축약 + 영문 대소문자 무시(= 눈에 같아 보이면 중복).
 * 범위: 같은 질문 안에서만 비교(질문이 달라도 항목 문구는 겹칠 수 있다). */
const DUP_OPTION_MSG = '이미 입력한 답변이에요. 다른 답변을 입력해 주세요.';
const DUP_OPTION_TOAST = '중복된 답변 항목이 있어요. 문구를 다르게 입력해 주세요.';
const optionKey = (value: string) => value.trim().replace(/\s+/g, ' ').toLowerCase();
/** 중복 항목의 index 목록 — 먼저 입력한 항목은 통과시키고 뒤에 입력한 같은 문구만 오류. 빈 항목은 별도 검증. */
const duplicateOptionIndexes = (options: string[]): number[] => {
  const firstSeen = new Map<string, number>();
  const dups: number[] = [];
  options.forEach((option, index) => {
    const key = optionKey(option);
    if (!key) return;
    if (firstSeen.has(key)) dups.push(index);
    else firstSeen.set(key, index);
  });
  return dups;
};

/* 가격 옵션 → 카카오 Price 최종 문구 (명세: 대괄호 + 가격 설명 결합, 할인은 판매가만) */
function priceToKakao(p: PriceOption): string {
  let core: string;
  if (p.type === 'consult') core = '상담 후 결정';
  else if (p.type === 'discount') core = won(p.sale);
  else core = won(p.amount);
  const bracket = `[${core}]`;
  return p.content.trim() ? `${bracket} - ${p.content.trim()}` : bracket;
}
/* 대표가 라벨(목록) */
function repPriceLabel(p?: PriceOption): string {
  if (!p) return '-';
  if (p.type === 'consult') return '상담 후 결정';
  if (p.type === 'discount') return won(p.sale);
  return won(p.amount);
}

/* 예약 상태 라벨/태그색 (APPT_STATUS_LABEL / STATUS_TAG_CASE) */
const STATUS_LABEL: Record<ApptStatus, string> = {
  T01: '확정대기',
  T03: '예약확정',
  F05: '진료완료',
  F03: '병원취소',
  F02: '환자취소',
  AUTO: '자동종료',
};
const STATUS_CASE: Record<ApptStatus, string> = {
  T01: 'orange',
  T03: 'blue',
  F05: 'green',
  F03: 'red',
  F02: 'red',
  AUTO: 'gray',
};

/* 발문 UI 유형 매핑 */
const uiTypeOf = (t: QType) => (t === 'text' ? 'text' : 'choice');

/* =========================================================================
 * 인라인 SVG (심볼 / 아이콘)
 * ======================================================================= */
function SymbolGoodoc() {
  // 파란 라운드 사각 위 흰 링 글리프 + 우상단 그린 포인트 (symbol_goodoc.svg 근사)
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <circle cx="8.4" cy="9.4" r="4.1" stroke="#fff" strokeWidth="2" fill="none" />
      <rect x="8.4" y="8.2" width="4.4" height="2" fill="#0073fa" />
      <rect x="10.7" y="8.2" width="2" height="2.4" fill="#fff" />
      <rect x="12" y="3.4" width="2.6" height="2.6" rx="0.6" fill="#41d293" />
    </svg>
  );
}
function SymbolKakao() {
  // 노란 라운드 사각 + 갈색 말풍선 (symbol_kakao.svg 근사)
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <rect width="18" height="18" rx="4.5" fill="#FEE500" />
      <path
        d="M9 4.2c-2.7 0-4.9 1.7-4.9 3.8 0 1.36.94 2.55 2.35 3.22l-.5 1.8c-.04.16.13.29.27.2l2.14-1.4c.2.02.42.03.64.03 2.7 0 4.9-1.7 4.9-3.85S11.7 4.2 9 4.2Z"
        fill="#3C1E1E"
      />
    </svg>
  );
}
function KakaoCardIcon() {
  // 카드 헤더 40x40 카카오 아이콘
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden>
      <rect width="40" height="40" rx="10" fill="#FEE500" />
      <path
        d="M20 11c-4.97 0-9 3.13-9 6.99 0 2.5 1.72 4.69 4.32 5.92l-.93 3.35c-.08.29.24.53.5.36l3.98-2.6c.37.03.75.05 1.13.05 4.97 0 9-3.13 9-7.02C29 14.13 24.97 11 20 11Z"
        fill="#3C1E1E"
      />
    </svg>
  );
}
function IconCaution({ className }: { className?: string }) {
  // ic_caution — 채워진 원 + 느낌표 (currentColor)
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <circle cx="10" cy="10" r="8" fill="currentColor" />
      <rect x="9" y="5.5" width="2" height="6" rx="1" fill="#fff" />
      <circle cx="10" cy="14" r="1.1" fill="#fff" />
    </svg>
  );
}
function IconHandler() {
  return (
    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" aria-hidden>
      <path d="M0 1h10M0 5h10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
function IconDateRange() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden>
      <rect x="2.5" y="3.5" width="13" height="12" rx="2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M2.5 7h13M6 2v3M12 2v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

/* =========================================================================
 * 공용 컴포넌트
 * ======================================================================= */
function Toggle({
  checked,
  onChange,
  disabled,
  ariaLabel,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      className={`kr-toggle ${checked ? 'on' : ''}`}
      onClick={() => !disabled && onChange(!checked)}
    >
      <span className="kr-toggle-track" />
      <span className="kr-toggle-knob" />
    </button>
  );
}

/* forms/ToggleWithLabel.Label — 라벨 텍스트 + 토글 */
function ToggleLabeled({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="kr-tw-label" onClick={() => onChange(!checked)}>
      <span className="lbl">{label}</span>
      <Toggle checked={checked} onChange={onChange} ariaLabel={label} />
    </label>
  );
}

function GuideBanner({
  tone,
  message,
  action,
}: {
  tone: 'normal' | 'info' | 'negative' | 'warning';
  message: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className={`kr-gb ${tone}`}>
      <div className="kr-gb-left">
        <IconCaution className="kr-gb-icon" />
        <span className="kr-gb-msg">{message}</span>
      </div>
      {action && (
        <button className="kr-gb-action" onClick={action.onClick}>
          {action.label}
          <FiChevronRight size={16} />
        </button>
      )}
    </div>
  );
}

function GuideBannerWithDescription({
  tone,
  title,
  items,
}: {
  tone: 'warning' | 'negative';
  title: string;
  items: string[];
}) {
  return (
    <div className={`kr-gbd ${tone}`}>
      <div className="kr-gbd-title-row">
        <IconCaution className="kr-gb-icon" />
        <span className="kr-gbd-title">{title}</span>
      </div>
      <div className="kr-gbd-list">
        {items.map((it, i) => (
          <div key={i} className="kr-gbd-bullet">
            <span>•</span>
            <span>{it}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ChannelCell / ChannelBadge — 채널 심볼 (18x18, dim=grayscale) */
function ChannelSymbol({ kind, dim }: { kind: 'goodoc' | 'kakao'; dim: boolean }) {
  const title =
    kind === 'goodoc'
      ? dim
        ? '굿닥에서 안 보임'
        : '굿닥에서 보임'
      : dim
      ? '카카오톡 예약하기에서 안 보임'
      : '카카오톡 예약하기에서 보임';
  return (
    <span className={`kr-sym ${kind}`} data-dim={dim ? 'true' : undefined} title={title}>
      {kind === 'goodoc' ? <SymbolGoodoc /> : <SymbolKakao />}
    </span>
  );
}
function ChannelCell({ goodocActive, kakaoActive }: { goodocActive: boolean; kakaoActive: boolean }) {
  return (
    <span className="kr-channel">
      <ChannelSymbol kind="goodoc" dim={!goodocActive} />
      <ChannelSymbol kind="kakao" dim={!kakaoActive} />
    </span>
  );
}
function ChannelBadge({ kakao, label }: { kakao: boolean; label?: boolean }) {
  return (
    <span className="kr-channel-badge-row">
      <span className={`kr-sym ${kakao ? 'kakao' : 'goodoc'}`} title={kakao ? '카카오톡 예약하기에서 신청' : '굿닥에서 신청'}>
        {kakao ? <SymbolKakao /> : <SymbolGoodoc />}
      </span>
      {label && <span className="kr-channel-badge-label">{kakao ? '카카오톡 예약하기' : '굿닥'} 신청</span>}
    </span>
  );
}

function StatusTag({ status }: { status: ApptStatus }) {
  return <span className={`kr-status-tag ${STATUS_CASE[status]}`}>{STATUS_LABEL[status]}</span>;
}

function Modal({
  title,
  children,
  footer,
  onClose,
  size,
}: {
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  onClose: () => void;
  size?: 'medium';
}) {
  return (
    <div className="kr-modal-backdrop" onClick={onClose}>
      <div className={`kr-modal ${size === 'medium' ? 'medium' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="kr-modal-head">
          <div className="kr-modal-title">{title}</div>
          <button className="kr-icon-btn" onClick={onClose} aria-label="닫기">
            <FiX size={22} />
          </button>
        </div>
        <div className="kr-modal-body">{children}</div>
        {footer && <div className={`kr-modal-foot ${React.Children.count(footer) > 2 ? 'between' : ''}`}>{footer}</div>}
      </div>
    </div>
  );
}

/* =========================================================================
 * 굿닥 표준 진료항목 (분류 트리) — C안 신설
 * ======================================================================= */

interface Cat3 {
  id: number;
  name: string;
}
interface Cat2 {
  id: number;
  name: string;
  items: Cat3[];
}
interface Cat1 {
  id: number;
  name: string;
  groups: Cat2[];
}

/** 굿닥 표준 진료항목 — 2026-08-14 실제 마스터 전량(대 15 / 중 69 / 소 187) */
const TAXONOMY: Cat1[] = [
  { id: 1, name: '건강관리', groups: [
    { id: 16, name: '건강검진', items: [{ id: 85, name: '종합건강검진' }, { id: 86, name: '수면내시경' }, { id: 87, name: '정밀검사' }] },
    { id: 17, name: '영유아 검진', items: [{ id: 88, name: '영유아 검진' }, { id: 89, name: '성장 클리닉' }] },
    { id: 18, name: '금연 클리닉', items: [{ id: 90, name: '금연 약 처방' }, { id: 91, name: '금연 상담' }] },
  ] },
  { id: 2, name: '관절·척추', groups: [
    { id: 19, name: '척추', items: [{ id: 92, name: '허리디스크 치료' }, { id: 93, name: '목디스크 치료' }, { id: 94, name: '척추관협착증 치료' }] },
    { id: 20, name: '주사 치료', items: [{ id: 95, name: '척추 주사' }, { id: 96, name: '관절 주사' }] },
    { id: 21, name: '무릎·하지', items: [{ id: 97, name: '무릎 관절염 치료' }, { id: 98, name: '연골 주사' }, { id: 99, name: '프롤로 주사' }] },
    { id: 22, name: '어깨·상지', items: [{ id: 100, name: '어깨 통증 치료' }, { id: 101, name: '오십견 치료' }] },
    { id: 23, name: '도수·재활', items: [{ id: 102, name: '도수치료' }, { id: 103, name: '체외충격파' }, { id: 104, name: '물리치료' }] },
  ] },
  { id: 3, name: '귀·코·목', groups: [
    { id: 24, name: '비염·알레르기', items: [{ id: 105, name: '비염 면역치료' }, { id: 106, name: '알레르기 검사' }, { id: 107, name: '알레르기 면역주사' }] },
    { id: 25, name: '귀·청력', items: [{ id: 108, name: '이명 치료' }, { id: 109, name: '청력검사' }] },
  ] },
  { id: 4, name: '남성건강', groups: [
    { id: 26, name: '전립선', items: [{ id: 110, name: '전립선비대증 치료' }, { id: 111, name: '유로리프트' }, { id: 112, name: '전립선암 검사' }] },
    { id: 27, name: '남성호르몬', items: [{ id: 113, name: '남성호르몬 치료' }, { id: 114, name: '남성호르몬 처방' }] },
    { id: 28, name: '남성 수술', items: [{ id: 115, name: '포경수술' }, { id: 116, name: '정관수술' }, { id: 117, name: '남성확대 시술' }] },
    { id: 29, name: '남성 검사', items: [{ id: 118, name: '정액 검사' }, { id: 119, name: '성병 검사' }] },
  ] },
  { id: 5, name: '눈·시력', groups: [
    { id: 30, name: '시력교정', items: [{ id: 120, name: '스마일라식' }, { id: 121, name: '라식' }, { id: 122, name: '라섹' }, { id: 123, name: '렌즈삽입술' }, { id: 124, name: '드림렌즈' }] },
    { id: 31, name: '노안·백내장', items: [{ id: 125, name: '백내장 수술' }, { id: 126, name: '노안교정' }] },
    { id: 32, name: '망막·녹내장', items: [{ id: 127, name: '녹내장 검사·치료' }] },
    { id: 33, name: '안구건조증', items: [{ id: 128, name: '안구건조증 검사' }, { id: 129, name: '안구건조증 IPL' }] },
    { id: 34, name: '안과 성형', items: [{ id: 130, name: '안검하수' }] },
  ] },
  { id: 6, name: '다이어트', groups: [
    { id: 35, name: '다이어트 주사', items: [{ id: 131, name: '위고비' }, { id: 132, name: '마운자로' }, { id: 133, name: '삭센다' }] },
    { id: 36, name: '지방분해', items: [{ id: 134, name: '지방분해 주사' }, { id: 135, name: '윤곽주사' }] },
    { id: 37, name: '다이어트 약', items: [{ id: 136, name: '다이어트 약 처방' }] },
  ] },
  { id: 7, name: '성형', groups: [
    { id: 38, name: '눈 성형', items: [{ id: 137, name: '쌍꺼풀 수술' }, { id: 138, name: '눈매교정' }, { id: 139, name: '트임 수술' }, { id: 140, name: '눈밑지방재배치' }, { id: 141, name: '눈 재수술' }] },
    { id: 39, name: '코 성형', items: [{ id: 142, name: '콧대 성형' }, { id: 143, name: '코끝 성형' }, { id: 144, name: '콧볼 축소' }, { id: 145, name: '코 재수술' }] },
    { id: 40, name: '가슴 성형', items: [{ id: 146, name: '가슴 성형' }, { id: 147, name: '가슴 재수술' }] },
    { id: 41, name: '안면윤곽', items: [{ id: 148, name: '사각턱 수술' }, { id: 149, name: '광대 수술' }] },
    { id: 42, name: '체형·지방', items: [{ id: 150, name: '지방흡입' }] },
  ] },
  { id: 8, name: '수면관리', groups: [
    { id: 43, name: '수면장애·코골이', items: [{ id: 151, name: '수면다원검사' }, { id: 152, name: '양압기 치료' }, { id: 153, name: '코콜이 치료' }] },
  ] },
  { id: 9, name: '수액', groups: [
    { id: 44, name: '영양수액', items: [{ id: 154, name: '마늘주사' }, { id: 155, name: '마이어스칵테일' }, { id: 156, name: '만성피로 수액' }, { id: 157, name: '몸살/감기 수액' }, { id: 158, name: '아르기닌 수액' }, { id: 159, name: '비타민D 수액' }, { id: 160, name: '총명수액' }, { id: 161, name: '면역강화 주사' }] },
    { id: 45, name: '미용수액', items: [{ id: 162, name: '백옥주사' }, { id: 163, name: '글루타치온 주사' }, { id: 164, name: '신데렐라 주사' }, { id: 165, name: '태반주사' }] },
  ] },
  { id: 10, name: '여성건강', groups: [
    { id: 46, name: '자궁·난소', items: [{ id: 166, name: '자궁근종 치료' }, { id: 167, name: '자궁선근증 치료' }, { id: 168, name: '난소낭종 치료' }] },
    { id: 47, name: '여성 검진', items: [{ id: 169, name: '자궁·난소 초음파' }, { id: 176, name: '유방 초음파' }, { id: 177, name: '자궁경부암 검사' }] },
    { id: 48, name: '요실금·골반', items: [{ id: 170, name: '요실금 치료' }] },
    { id: 49, name: '여성 성형·시술', items: [{ id: 171, name: '소음순성형' }, { id: 172, name: '질타이트닝' }, { id: 173, name: '질필러' }, { id: 174, name: '질레이저' }] },
    { id: 50, name: '갱년기·호르몬', items: [{ id: 175, name: '갱년기 치료' }] },
  ] },
  { id: 11, name: '예방접종', groups: [
    { id: 51, name: '독감 백신', items: [{ id: 178, name: '스카이셀플루 4가' }, { id: 179, name: '테라텍트' }, { id: 180, name: '비알플루텍I테트라' }, { id: 181, name: 'GC플루쿼드리밸런트' }, { id: 182, name: '코박스플루 4가' }, { id: 183, name: '플루아릭스테트라' }, { id: 184, name: '박씨그리프테트라' }, { id: 185, name: '보령플루Ⅴ테트라' }, { id: 186, name: '보령플루Ⅷ테트라' }] },
    { id: 52, name: 'HPV 백신', items: [{ id: 187, name: '가다실 9가' }] },
    { id: 53, name: '대상포진 백신', items: [{ id: 188, name: '스카이조스터' }, { id: 189, name: '조스타박스' }, { id: 271, name: '싱그릭스' }] },
    { id: 54, name: '폐렴구균 백신', items: [{ id: 190, name: '캡박시브' }, { id: 191, name: '프리베나 13' }, { id: 192, name: '프리베나 20' }, { id: 193, name: '신플로릭스' }, { id: 194, name: '프로디악스 23' }] },
    { id: 55, name: 'A형 간염 백신', items: [{ id: 195, name: '하브릭스' }, { id: 196, name: '박타' }, { id: 197, name: '아박심' }] },
    { id: 56, name: 'B형 간염 백신', items: [{ id: 198, name: '헤파뮨' }, { id: 199, name: '유박스비' }] },
    { id: 57, name: 'Hib 백신', items: [{ id: 200, name: '유히브' }] },
    { id: 58, name: '파상풍 백신', items: [{ id: 201, name: '에스케이티디백신' }, { id: 202, name: '녹십자티디백신' }, { id: 203, name: '티디퓨어' }, { id: 204, name: '디티부스터' }, { id: 205, name: '부스트릭스(백일해)' }, { id: 206, name: '아다셀(백일해)' }] },
    { id: 59, name: 'RSV 백신', items: [{ id: 207, name: '아렉스비' }] },
    { id: 60, name: '장티푸스', items: [{ id: 208, name: '지포티프' }] },
    { id: 61, name: '홍역·풍진·볼거리 백신', items: [{ id: 209, name: '엠엠알 II' }, { id: 210, name: '프리오릭스' }] },
    { id: 62, name: '일본뇌염 백신', items: [{ id: 211, name: '녹십자세포배양 백신' }, { id: 212, name: '보령세포배양 백신' }, { id: 213, name: '씨디제박스' }] },
  ] },
  { id: 12, name: '정신건강', groups: [
    { id: 63, name: '우울·불안', items: [{ id: 214, name: '우울증' }, { id: 215, name: '불안장애' }, { id: 216, name: '공황장애' }] },
    { id: 64, name: 'ADHD·발달', items: [{ id: 217, name: '언어치료' }, { id: 218, name: '발달치료' }] },
    { id: 65, name: '심리검사·상담', items: [{ id: 219, name: '종합심리검사' }, { id: 220, name: '감각통합평가' }, { id: 221, name: '언어발달평가' }] },
  ] },
  { id: 13, name: '치아·구강', groups: [
    { id: 66, name: '임플란트', items: [{ id: 222, name: '임플란트' }] },
    { id: 67, name: '치아교정', items: [{ id: 223, name: '투명교정' }, { id: 224, name: '메탈교정' }, { id: 225, name: '어린이 교정' }] },
    { id: 68, name: '충치·보철', items: [{ id: 226, name: '레진' }, { id: 227, name: '크라운' }, { id: 228, name: '인레이·온레이' }] },
    { id: 69, name: '치아미용', items: [{ id: 229, name: '치아미백' }, { id: 230, name: '라미네이트' }, { id: 231, name: '스케일링' }] },
    { id: 70, name: '구강외과', items: [{ id: 232, name: '사랑니 발치' }, { id: 233, name: '턱관절 검진·치료' }] },
    { id: 71, name: '어린이 치과', items: [{ id: 234, name: '소아 충치' }] },
  ] },
  { id: 14, name: '피부·미용', groups: [
    { id: 72, name: '탈모 치료', items: [{ id: 235, name: '모발이식' }, { id: 236, name: '탈모약 처방' }, { id: 237, name: '두피 치료·관리' }, { id: 238, name: '눈썹이식' }] },
    { id: 73, name: '여드름', items: [{ id: 239, name: '여드름' }] },
    { id: 74, name: '피부질환', items: [{ id: 240, name: '아토피' }] },
    { id: 75, name: '기미·색소·미백', items: [{ id: 241, name: '기미 레이저' }, { id: 244, name: '피부 미백' }] },
    { id: 76, name: '흉터·재생', items: [{ id: 242, name: '흉터치료' }, { id: 243, name: '켈로이드' }] },
    { id: 77, name: '보톡스', items: [{ id: 245, name: '사각턱 보톡스' }, { id: 246, name: '주름 보톡스' }, { id: 247, name: '스킨 보톡스' }, { id: 248, name: '침샘 보톡스' }, { id: 249, name: '다한증 보톡스' }] },
    { id: 78, name: '필러', items: [{ id: 250, name: '입술 필러' }, { id: 251, name: '팔자 필러' }, { id: 252, name: '코 필러' }, { id: 253, name: '볼륨 필러' }, { id: 254, name: '필러 제거' }] },
    { id: 79, name: '주름·모공·탄력', items: [{ id: 255, name: '실 리프팅' }, { id: 256, name: '초음파 리프팅' }, { id: 257, name: '레이저 리프팅' }] },
    { id: 80, name: '스킨부스터', items: [{ id: 258, name: '스킨부스터' }] },
    { id: 81, name: '제모', items: [{ id: 259, name: '얼굴 제모' }, { id: 260, name: '바디 제모' }, { id: 261, name: '남성 제모' }] },
  ] },
  { id: 15, name: '한방치료', groups: [
    { id: 82, name: '추나치료', items: [{ id: 262, name: '단순추나' }, { id: 263, name: '복잡추나' }, { id: 264, name: '특수(탈구)추나' }, { id: 265, name: '특수(내장기, 두개천골)추나' }, { id: 266, name: '추나요법' }] },
    { id: 83, name: '침치료', items: [{ id: 267, name: '경혈' }, { id: 268, name: '약침술' }] },
    { id: 84, name: '한방처방·관리', items: [{ id: 269, name: '한약치료' }, { id: 270, name: '한방 비만 치료' }] },
  ] },
];

/** 자동완성 후보 = 소분류 1건 + 그 상위 경로 */
interface Suggestion {
  m1Id: number;
  m1Name: string;
  m2Id: number;
  m2Name: string;
  m3Id: number;
  m3Name: string;
}

const FLAT: Suggestion[] = TAXONOMY.flatMap((c1) =>
  c1.groups.flatMap((c2) =>
    c2.items.map((c3) => ({
      m1Id: c1.id,
      m1Name: c1.name,
      m2Id: c2.id,
      m2Name: c2.name,
      m3Id: c3.id,
      m3Name: c3.name,
    }))
  )
);

/** 분류 선택 결과 (대분류 › 중분류). 소분류는 C안에서 고르지 않는다. */
interface CategoryPick {
  m1Id: number;
  m1Name: string;
  m2Id: number;
  m2Name: string;
}

const NORM = (v: string) => v.replace(/[\s·/()]/g, '').toLowerCase();

type MatchLevel = 'name' | 'group' | 'category';
const LEVEL_RANK: Record<MatchLevel, number> = { name: 0, group: 1, category: 2 };

/** spec.md 단일 하이라이트 정책 — 가장 구체적인 일치 1곳만 */
function matchLevel(s: Suggestion, q: string): MatchLevel | null {
  if (!q) return null;
  if (s.m3Name.includes(q)) return 'name';
  if (s.m2Name.includes(q)) return 'group';
  if (s.m1Name.includes(q)) return 'category';
  return null;
}

/** 서버 `GET /treatment-item-masters?keyword=` 재현 (정방향: 마스터명 ⊇ 검색어) */
function searchMasters(raw: string): Suggestion[] {
  const q = raw.trim();
  if (!q) return [];
  return FLAT.filter((s) => matchLevel(s, q) !== null)
    .sort((a, b) => LEVEL_RANK[matchLevel(a, q)!] - LEVEL_RANK[matchLevel(b, q)!])
    .slice(0, 40);
}

/**
 * 역매칭 추천 — 입력값이 분류 명칭을 포함하는 방향. 현재 서버 API 에는 없다.
 * '이마보톡스' ⊃ '보톡스' → 피부·미용 › 보톡스. 긴 명칭 우선, 최대 3개.
 */
function suggestCategories(raw: string): CategoryPick[] {
  const q = NORM(raw);
  if (q.length < 2) return [];
  const found: (CategoryPick & { matched: string })[] = [];
  TAXONOMY.forEach((c1) => {
    c1.groups.forEach((c2) => {
      const k = NORM(c2.name);
      if (k.length >= 2 && q.includes(k)) {
        found.push({ m1Id: c1.id, m1Name: c1.name, m2Id: c2.id, m2Name: c2.name, matched: c2.name });
      }
    });
  });
  return found.sort((a, b) => NORM(b.matched).length - NORM(a.matched).length).slice(0, 3);
}

/**
 * 받침 여부로 '으로/로' 조사를 고른다. '건강검진'→으로, '보톡스'→로.
 * 따옴표로 감싼 문자열이 아니라 **낱말**을 넘겨야 한다(마지막 글자가 한글이어야 판정 가능).
 */
function roSuffix(word: string): string {
  const last = word.trim().slice(-1);
  const code = last.charCodeAt(0) - 0xac00;
  if (code < 0 || code > 11171) return '로';
  return code % 28 === 0 ? '로' : '으로';
}

/** 분류 경로 표기 */
function catLabel(it: { m1Name: string; m2Name: string } | null): string {
  return it ? `${it.m1Name} › ${it.m2Name}` : '';
}

/* =========================================================================
 * 시드 데이터
 * ======================================================================= */
function seedItems(): Item[] {
  return [
    {
      id: 'i1',
      name: '독감 예방접종 (4가)',
      price: 30000,
      thumbnail: '💉',
      visible: true,
      kakaoLinked: true,
      prices: [
        { id: uid(), title: '4가 일반', type: 'fixed', amount: 30000, original: 0, sale: 0, content: '', active: true },
        { id: uid(), title: '4가 프리미엄', type: 'discount', amount: 0, original: 60000, sale: 45000, content: '65세 이상 접종 대상', active: true },
      ],
      questions: [
        { id: uid(), type: 'text', name: '현재 복용 중인 약이 있나요?', optional: true, description: '', options: [] },
        { id: uid(), type: 'radio', name: '이전에 독감 백신 접종 경험이 있나요?', optional: false, description: '최근 1년 기준으로 알려주세요.', options: ['있음', '없음'] },
      ],
      information: '내원 후 문진표를 작성하고 접종 후 15분간 관찰한 뒤 귀가합니다.',
      notice: '발열이 있으면 접종이 어려울 수 있습니다.',
      cancelNotice: '방문 2시간 전까지 취소할 수 있습니다.',
      alias: '독감 예방접종 (4가/프리미엄)',
      shortDescription: '겨울철 독감을 예방하는 4가 백신 접종',
      detailDescription:
        '- 접종 전 문진표 작성이 필요합니다.\n- 접종 후 15분간 병원에서 안정을 취해 주세요.\n- 표기된 금액은 VAT 포함 가격입니다.',
      keywords: ['독감', '독감예방접종', '4가백신', '인플루엔자'],
      mainImage: '💉',
      detailImages: ['1', '2', '3'],
      // 자동완성으로 표준 소분류를 골라 분류가 함께 채워진 항목
      category: { m1Id: 11, m1Name: '예방접종', m2Id: 51, m2Name: '독감 백신' },
    },
    {
      id: 'i2',
      name: '종합 건강검진 패키지',
      price: 120000,
      thumbnail: '🩺',
      visible: true,
      kakaoLinked: false,
      prices: [{ id: uid(), title: '기본 패키지', type: 'fixed', amount: 120000, original: 0, sale: 0, content: '검사 전 8시간 공복 필요', active: true }],
      questions: [],
      information: '',
      notice: '',
      cancelNotice: '',
      alias: '',
      shortDescription: '',
      detailDescription: '',
      keywords: [],
      mainImage: '🩺',
      detailImages: [],
      // 미분류 재고 — 이름에 '건강검진'이 있어 역매칭 추천이 잡힌다
      category: null,
    },
    {
      id: 'i3',
      name: '피부 전문의 1:1 상담',
      price: 0,
      thumbnail: '🧴',
      visible: false,
      kakaoLinked: true,
      prices: [{ id: uid(), title: '초진 상담', type: 'consult', amount: 0, original: 0, sale: 0, content: '', active: true }],
      questions: [
        { id: uid(), type: 'select', name: '상담받고 싶은 부위를 선택해주세요.', optional: false, description: '복수 선택할 수 있어요.', options: ['얼굴', '목', '등', '팔'] },
      ],
      information: '',
      notice: '',
      cancelNotice: '',
      alias: '',
      shortDescription: '피부 고민을 전문의와 1:1로 상담해요',
      detailDescription: '',
      keywords: ['피부상담', '피부과'],
      mainImage: '🧴',
      detailImages: [],
      // 미분류 재고 — 마스터 명칭이 이름에 없어 추천 0건, 직접 찾기가 필요하다
      category: null,
    },
    {
      id: 'i4',
      name: '맞춤 영양 수액',
      price: 50000,
      thumbnail: '💧',
      visible: true,
      kakaoLinked: false,
      prices: [
        { id: uid(), title: '피로회복', type: 'fixed', amount: 50000, original: 0, sale: 0, content: '', active: true },
        { id: uid(), title: '면역강화', type: 'discount', amount: 0, original: 80000, sale: 70000, content: '', active: true },
        { id: uid(), title: '숙취해소 (준비중)', type: 'fixed', amount: 40000, original: 0, sale: 0, content: '', active: false },
      ],
      questions: [],
      information: '',
      notice: '',
      cancelNotice: '',
      alias: '',
      shortDescription: '',
      detailDescription: '',
      keywords: [],
      mainImage: '💧',
      detailImages: [],
      category: { m1Id: 9, m1Name: '수액', m2Id: 44, m2Name: '영양수액' },
    },
  ];
}

function seedReservations(): Reservation[] {
  return [
    {
      id: 'r1', visitor: '김민수', reserver: '김민수', sameAsVisitor: true, phone: '010-1234-5678', birth: '1988.03.12', age: 38, gender: '남',
      itemName: '독감 예방접종 (4가)', priceTitle: '4가 일반', totalPrice: 30000,
      deviceType: 2, status: 'T01', tab: 'request', visitAt: '2026.08.22 (토) 10:30', repAt: '2026.08.19 09:14',
      reserverMemo: '오전 중으로 부탁드립니다.',
      additionalInfos: [
        { name: '현재 복용 중인 약이 있나요?', values: ['혈압약을 복용 중입니다.'] },
        { name: '이전에 독감 백신 접종 경험이 있나요?', values: ['있음'] },
      ],
    },
    {
      id: 'r2', visitor: '이서연', reserver: '이서연', sameAsVisitor: true, phone: '010-2222-3333', birth: '1995.07.02', age: 31, gender: '여',
      itemName: '종합 건강검진 패키지', priceTitle: '기본 패키지', totalPrice: 120000,
      deviceType: 1, status: 'T01', tab: 'request', visitAt: '2026.08.23 (일) 09:00', repAt: '2026.08.19 08:40',
      reserverMemo: '',
    },
    {
      id: 'r3', visitor: '박지훈', reserver: '박서준', sameAsVisitor: false, phone: '010-4444-5555', birth: '2019.05.20', age: 7, gender: '남',
      itemName: '피부 전문의 1:1 상담', priceTitle: '초진 상담', totalPrice: 0,
      deviceType: 2, status: 'T03', tab: 'upcoming', visitAt: '2026.08.25 (월) 14:00', repAt: '2026.08.19 11:02',
      reserverMemo: '아이가 있어 대기 시간이 짧았으면 합니다.',
      additionalInfos: [
        { name: '상담받고 싶은 부위를 선택해주세요.', values: ['얼굴', '목'] },
        { name: '증상이 시작된 시기를 알려주세요.', values: [] },
      ],
    },
    {
      id: 'r4', visitor: '최유진', reserver: '최유진', sameAsVisitor: true, phone: '010-6666-7777', birth: '1990.11.30', age: 35, gender: '여',
      itemName: '맞춤 영양 수액', priceTitle: '면역강화', totalPrice: 70000,
      deviceType: 3, status: 'T03', tab: 'upcoming', visitAt: '2026.08.24 (일) 16:30', repAt: '2026.08.18 15:20',
      reserverMemo: '',
    },
    {
      id: 'r5', visitor: '정하늘', reserver: '정하늘', sameAsVisitor: true, phone: '010-8888-9999', birth: '1982.01.09', age: 44, gender: '여',
      itemName: '독감 예방접종 (4가)', priceTitle: '4가 프리미엄', totalPrice: 45000,
      deviceType: 2, status: 'F05', tab: 'closed', visitAt: '2026.08.10 (월) 11:00', repAt: '2026.08.10 11:35',
      reserverMemo: '', closedReason: '진료 완료',
      additionalInfos: [{ name: '현재 복용 중인 약이 있나요?', values: ['없음'] }],
    },
    {
      id: 'r6', visitor: '한지원', reserver: '한지원', sameAsVisitor: true, phone: '010-1010-2020', birth: '2000.09.15', age: 25, gender: '남',
      itemName: '종합 건강검진 패키지', priceTitle: '기본 패키지', totalPrice: 120000,
      deviceType: 1, status: 'F02', tab: 'closed', visitAt: '2026.08.08 (금) 08:30', repAt: '2026.08.07 20:11',
      reserverMemo: '', closedReason: '환자 취소',
    },
    {
      id: 'r7', visitor: '오세훈', reserver: '오세훈', sameAsVisitor: true, phone: '010-3030-4040', birth: '1975.04.22', age: 51, gender: '남',
      itemName: '피부 전문의 1:1 상담', priceTitle: '초진 상담', totalPrice: 0,
      deviceType: 2, status: 'AUTO', tab: 'closed', visitAt: '2026.08.05 (수) 13:00', repAt: '2026.08.06 00:00',
      reserverMemo: '', closedReason: '자동 종료',
      additionalInfos: [{ name: '상담받고 싶은 부위를 선택해주세요.', values: ['등'] }],
    },
  ];
}

/* =========================================================================
 * 루트
 * ======================================================================= */
type Screen = 'list' | 'detail' | 'appt' | 'settings';

export default function KakaoRealcodeTestPage() {
  // 공통 전제 (프로토타입 설정)
  const [kakaoStatus, setKakaoStatus] = useState<KakaoStatus>('연동완료');
  const [autoConfirm, setAutoConfirm] = useState(false); // 예약 자동 확정
  const [reservationOn, setReservationOn] = useState(true); // 진료 예약 받기

  const [items, setItems] = useState<Item[]>(seedItems);
  const [reservations, setReservations] = useState<Reservation[]>(seedReservations);

  const [screen, setScreen] = useState<Screen>('list');
  const [detailId, setDetailId] = useState<string>('i1');

  const [toast, setToast] = useState<{ msg: string; error?: boolean } | null>(null);
  const showToast = (msg: string, error?: boolean) => {
    setToast({ msg, error });
    window.setTimeout(() => setToast(null), 2800);
  };

  const isLinked = kakaoStatus === '연동완료';

  const openDetail = (id: string) => {
    setDetailId(id);
    setScreen('detail');
  };
  const updateItem = (id: string, patch: Partial<Item>) =>
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));

  const nav: { key: Screen; label: string; icon: React.ReactNode }[] = [
    { key: 'list', label: '진료항목', icon: <FiList /> },
    { key: 'detail', label: '진료항목 상세', icon: <FiFileText /> },
    { key: 'appt', label: '예약 신청 내역', icon: <FiCalendar /> },
    { key: 'settings', label: '진료 예약 설정', icon: <FiSettings /> },
  ];

  return (
    <div className="kr-root">
      <aside className="kr-lnb">
        <div className="kr-lnb-title">진료 예약</div>
        {nav.map((n) => (
          <button
            key={n.key}
            className={`kr-lnb-item ${screen === n.key ? 'active' : ''}`}
            onClick={() => setScreen(n.key)}
          >
            <span className="kr-lnb-ico">{n.icon}</span>
            {n.label}
          </button>
        ))}

        <div className="kr-devbox">
          <div className="kr-devbox-title">프로토타입 설정</div>
          <label className="kr-dev-row">
            <span>카카오 연동 상태</span>
            <select value={kakaoStatus} onChange={(e) => setKakaoStatus(e.target.value as KakaoStatus)}>
              {['연동완료', '연동대기', '연동불가', '연동해제', '미연동'].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <div className="kr-dev-row">
            <span>예약 자동 확정</span>
            <Toggle checked={autoConfirm} onChange={setAutoConfirm} ariaLabel="예약 자동 확정" />
          </div>
          <div className="kr-dev-row">
            <span>진료 예약 받기</span>
            <Toggle checked={reservationOn} onChange={setReservationOn} ariaLabel="진료 예약 받기" />
          </div>
          <div className="kr-dev-note">
            {isLinked ? '연동완료 → 카카오 영역 표시' : `${kakaoStatus} → 카카오 영역 숨김 (기존 화면 그대로)`}
          </div>
        </div>
      </aside>

      <main className="kr-main">
        {screen === 'list' && (
          <ListScreen
            items={items}
            isLinked={isLinked}
            onToggleVisible={(id, v) => updateItem(id, { visible: v })}
            onOpen={openDetail}
            onDelete={() => showToast('활성 또는 미래 예약이 있는 진료항목은 삭제 대신 운영 중지됩니다.')}
          />
        )}
        {screen === 'detail' && (
          <DetailScreen
            item={items.find((it) => it.id === detailId) || items[0]}
            isLinked={isLinked}
            onSave={(patch) => {
              updateItem(detailId, patch);
              showToast('저장되었습니다.');
            }}
            showToast={showToast}
          />
        )}
        {screen === 'appt' && (
          <ApptScreen
            reservations={reservations}
            setReservations={setReservations}
            isLinked={isLinked}
            showToast={showToast}
          />
        )}
        {screen === 'settings' && (
          <SettingsScreen
            isLinked={isLinked}
            autoConfirm={autoConfirm}
            setAutoConfirm={setAutoConfirm}
            reservationOn={reservationOn}
            setReservationOn={setReservationOn}
            itemCount={items.length}
            visibleCount={items.filter((it) => it.visible).length}
            showToast={showToast}
          />
        )}
      </main>

      {toast && <div className={`kr-toast ${toast.error ? 'error' : ''}`}>{toast.msg}</div>}
    </div>
  );
}

/* =========================================================================
 * ① 진료항목 목록
 * ======================================================================= */
function ListScreen({
  items,
  isLinked,
  onToggleVisible,
  onOpen,
  onDelete,
}: {
  items: Item[];
  isLinked: boolean;
  onToggleVisible: (id: string, v: boolean) => void;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="kr-page">
      <div className="kr-page-head kr-head-row">
        <div>
          <div className="kr-page-title">진료항목</div>
          <div className="kr-page-sub">굿닥에 노출되는 우리 병원 진료항목과 가격 정보를 관리할 수 있어요.</div>
        </div>
        <button className="kr-btn kr-btn-secondary-solid kr-btn-sm">
          <FiPlus size={18} /> 새 진료항목
        </button>
      </div>

      <div className="kr-list">
        {items.map((it) => {
          const goodocActive = it.visible ?? true;
          const kakaoActive = (it.kakaoLinked ?? false) && goodocActive; // 선행 조건 AND
          const active = it.prices.filter((p) => p.active);
          return (
            <div key={it.id} className="kr-item-row">
              <span className="kr-drag-handle" title="순서 변경">
                <IconHandler />
              </span>
              <button className="kr-detail-btn" onClick={() => onOpen(it.id)}>
                <span className="kr-item-name">
                  {it.name}
                  {/* C안 — 분류를 목록에서도 보여주고, 없으면 검색 노출 손실을 표시 */}
                  {it.category ? (
                    <span className="tc-row-cat">{catLabel(it.category)}</span>
                  ) : (
                    <span className="tc-row-cat tc-row-cat-none">분류 없음 · 검색 노출 안 됨</span>
                  )}
                </span>
                <span className="kr-item-price-area">
                  <span className="kr-item-price">{repPriceLabel(active[0])}</span>
                  {active.length > 1 && <span className="kr-tag-gray">+{active.length - 1}</span>}
                </span>
                <span className="kr-item-thumb">{it.thumbnail}</span>
                {isLinked && (
                  <span className="kr-channel-slot">
                    <ChannelCell goodocActive={goodocActive} kakaoActive={kakaoActive} />
                  </span>
                )}
                <span className={`kr-item-exposure ${goodocActive ? 'on' : 'off'}`}>
                  {goodocActive ? '노출중' : '미노출'}
                </span>
              </button>
              <span className="kr-item-toggle" onClick={(e) => e.stopPropagation()}>
                <Toggle checked={it.visible} onChange={(v) => onToggleVisible(it.id, v)} ariaLabel="굿닥 노출" />
              </span>
              <button
                className="kr-item-delete"
                aria-label="삭제"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(it.id);
                }}
              >
                <FiX size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* =========================================================================
 * ② 진료항목 상세 (폼)
 * ======================================================================= */
function DetailScreen({
  item,
  isLinked,
  onSave,
  showToast,
}: {
  item: Item;
  isLinked: boolean;
  onSave: (patch: Partial<Item>) => void;
  showToast: (m: string, e?: boolean) => void;
}) {
  const [name, setName] = useState(item.name);
  const [visible, setVisible] = useState(item.visible);
  const [linked, setLinked] = useState(item.kakaoLinked);
  const [prices, setPrices] = useState<PriceOption[]>(item.prices);
  const [questions, setQuestions] = useState<Question[]>(item.questions);
  const [information, setInformation] = useState(item.information);
  const [notice, setNotice] = useState(item.notice);
  const [cancelNotice, setCancelNotice] = useState(item.cancelNotice);
  const [errors, setErrors] = useState<Record<string, string>>({});

  /* 추가 정보 폼 상태 */
  const [alias, setAlias] = useState(item.alias);
  const [shortDescription, setShortDescription] = useState(item.shortDescription);
  const [detailDescription, setDetailDescription] = useState(item.detailDescription);
  const [keywords, setKeywords] = useState<string[]>(item.keywords);
  const [keywordDraft, setKeywordDraft] = useState('');
  const [mainImage, setMainImage] = useState(item.mainImage);
  const [detailImages, setDetailImages] = useState<string[]>(item.detailImages);

  /* 진료항목 검색 필드 (chip / 검색 입력 전환) */
  const [searching, setSearching] = useState(false);
  const [nameQuery, setNameQuery] = useState('');

  /* 분류 필드 (C안) — 이름과 분리된 별도 필드 */
  const [category, setCategory] = useState<CategoryPick | null>(item.category);
  const [catSheet, setCatSheet] = useState(false);
  const [sheetM1, setSheetM1] = useState<number | null>(null);
  /** 프로토타입 전용 — 분류 필수 정책을 켜고 끄며 비교한다. 기본 OFF(기존 항목 유예). */
  const [requireCategory, setRequireCategory] = useState(false);

  React.useEffect(() => {
    setName(item.name);
    setVisible(item.visible);
    setLinked(item.kakaoLinked);
    setPrices(item.prices);
    setQuestions(item.questions);
    setInformation(item.information);
    setNotice(item.notice);
    setCancelNotice(item.cancelNotice);
    setAlias(item.alias);
    setShortDescription(item.shortDescription);
    setDetailDescription(item.detailDescription);
    setKeywords(item.keywords);
    setKeywordDraft('');
    setMainImage(item.mainImage);
    setDetailImages(item.detailImages);
    setSearching(false);
    setNameQuery('');
    setCategory(item.category);
    setCatSheet(false);
    setSheetM1(null);
    setErrors({});
  }, [item.id]);

  const activeCount = prices.filter((p) => p.active).length;

  // 상태 안내 배너 3분기 (guide.ts / deriveKakaoGuide)
  const guide: { tone: 'normal' | 'negative'; message: string } = !visible
    ? { tone: 'negative', message: '굿닥에 노출 중인 진료항목만 카카오톡 예약하기에도 노출할 수 있어요.' }
    : !linked
    ? { tone: 'negative', message: "카카오톡 예약하기에 노출하려면 '우측 상단 스위치'를 켜주세요." }
    : { tone: 'normal', message: '위에 입력한 진료항목 정보가 카카오톡 예약하기에도 함께 표시돼요.' };

  const clearErr = (key: string) =>
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const n = { ...prev };
      delete n[key];
      return n;
    });

  /* 발문 빌더 */
  const isMaxQ = questions.length >= KAKAO_MAX_QUESTIONS;
  const patchQ = (id: string, patch: Partial<Question>) =>
    setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  const addQuestion = () => {
    if (isMaxQ) {
      showToast('질문은 최대 10개까지 추가할 수 있어요.');
      return;
    }
    setQuestions((prev) => [...prev, { id: uid(), type: 'radio', name: '', optional: true, description: '', options: ['', ''] }]);
  };
  const removeQ = (id: string) => setQuestions((prev) => prev.filter((q) => q.id !== id));
  const changeUiType = (q: Question, next: string) => {
    if (next === 'text') patchQ(q.id, { type: 'text' });
    else patchQ(q.id, { type: q.type === 'text' ? 'radio' : q.type, options: q.options.length ? q.options : ['', ''] });
  };

  /* 답변 항목 중복 오류 — 입력 중에는 지우고(타이핑 방해 금지), 포커스 아웃·항목 삭제·저장 시에 드러낸다. */
  const dupKey = (qid: string, index: number) => `q-${qid}-opt-dup-${index}`;
  const stripDupErrors = (qid: string, base: Record<string, string>) => {
    const next = { ...base };
    Object.keys(next).forEach((key) => {
      if (key.startsWith(`q-${qid}-opt-dup-`)) delete next[key];
    });
    return next;
  };
  const clearDupErrors = (qid: string) => setErrors((prev) => stripDupErrors(qid, prev));
  const revealDupErrors = (qid: string, options: string[]) =>
    setErrors((prev) => {
      const next = stripDupErrors(qid, prev);
      duplicateOptionIndexes(options).forEach((index) => {
        next[dupKey(qid, index)] = DUP_OPTION_MSG;
      });
      return next;
    });

  /* 저장 검증 */
  const handleSave = () => {
    const errs: Record<string, string> = {};
    let hasDupOption = false;
    /* 발문 검증은 카카오 노출 토글(linked)과 무관하게, 카드가 보이는 병원(연동완료)에서 항상 적용.
     * 입력값이 토글 OFF에서도 보존·왕복되고 실코드 zod도 linked와 무관하게 검증한다.
     * 미연동 병원은 카드 자체가 없어 고칠 수단이 없으므로 검증 대상에서 제외한다. */
    if (isLinked) {
      questions.forEach((q) => {
        if (!q.name.trim()) errs[`q-${q.id}-name`] = '질문을 입력해 주세요.';
        if (q.type === 'text') return;
        if (q.options.some((o) => !o.trim())) errs[`q-${q.id}-opt`] = '답변 항목을 모두 입력해 주세요.';
        duplicateOptionIndexes(q.options).forEach((index) => {
          errs[dupKey(q.id, index)] = DUP_OPTION_MSG;
          hasDupOption = true;
        });
      });
    }
    if (linked) {
      prices.forEach((p) => {
        if (priceToKakao(p).length > PRICE_DESCRIPTION_MAX) errs[`price-${p.id}`] = `카카오 반영 문구가 ${PRICE_DESCRIPTION_MAX}자를 초과했어요.`;
      });
      if (activeCount === 0) errs['price-active'] = '활성 가격 옵션이 없어 카카오 노출을 켤 수 없어요.';
    }
    if (!name.trim()) errs['name'] = '진료항목명을 입력해 주세요.';
    /* C안 — 분류 필수 정책이 켜진 경우에만 저장을 막는다.
     * OFF 에서는 경고만 노출하고 저장을 허용한다(기존 미분류 재고 유예). */
    if (requireCategory && !category) errs['category'] = '분류를 선택해 주세요.';
    if (Object.keys(errs).length) {
      setErrors(errs);
      showToast(hasDupOption ? DUP_OPTION_TOAST : '입력값을 확인해 주세요.', true);
      window.setTimeout(() => {
        const first = document.querySelector('.kr-input.err, .kr-price.err, .kr-err-msg, .kr-search-field.err');
        if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 0);
      return;
    }
    onSave({
      name,
      visible,
      kakaoLinked: linked,
      prices,
      questions,
      information,
      notice,
      cancelNotice,
      alias,
      shortDescription,
      detailDescription,
      keywords,
      mainImage,
      detailImages,
      category,
    });
  };

  /* 진료항목명 — 자유 입력 확정. 분류는 건드리지 않는다(이름과 분리). */
  const commitName = () => {
    const v = nameQuery.trim();
    if (v.length < 2) {
      showToast('최소 2글자 이상 입력해 주세요.', true);
      return;
    }
    setName(v.slice(0, ITEM_NAME_MAX));
    clearErr('name');
    setSearching(false);
    setNameQuery('');
  };
  /** 표준 진료항목 선택 — 이름과 분류가 **함께** 채워진다. C안의 핵심 동작. */
  const pickStandard = (sg: Suggestion) => {
    setName(sg.m3Name);
    setCategory({ m1Id: sg.m1Id, m1Name: sg.m1Name, m2Id: sg.m2Id, m2Name: sg.m2Name });
    clearErr('name');
    clearErr('category');
    setSearching(false);
    setNameQuery('');
  };
  const clearName = () => {
    setName('');
    setSearching(true);
    setNameQuery('');
  };
  const pickCategory = (c: CategoryPick) => {
    setCategory(c);
    clearErr('category');
    setCatSheet(false);
    setSheetM1(null);
  };

  const suggestions = searchMasters(nameQuery);
  /* 분류 미선택일 때만 역매칭 추천을 계산한다. 기준은 확정된 이름. */
  const catRecos = category ? [] : suggestCategories(name);

  /* 키워드 태그 입력 */
  const addKeyword = () => {
    const v = keywordDraft.trim();
    if (!v) return;
    if (keywords.length >= KEYWORD_MAX_ITEMS) {
      showToast('최대 20개까지 등록할 수 있어요.', true);
      return;
    }
    if (keywords.includes(v)) {
      showToast('이미 등록된 키워드에요.', true);
      return;
    }
    setKeywords((prev) => [...prev, v.slice(0, KEYWORD_MAX_LENGTH)]);
    setKeywordDraft('');
  };

  /* 상세 소개 사진 (placeholder 추가/삭제) */
  const addDetailImage = () => {
    if (detailImages.length >= DETAIL_IMAGES_MAX) return;
    setDetailImages((prev) => [...prev, uid()]);
  };

  const previewTitle = alias || name;

  return (
    <div className="kr-page kr-detail-page">
      <div className="kr-detail-layout">
        {/* ── 왼쪽: 입력 폼 ── */}
        <div className="kr-detail-form-col">
          <div className="kr-detail-head">
            <div className="kr-detail-subtitle">진료항목</div>
            <h1 className="kr-detail-title">진료항목 정보</h1>
          </div>

          {/* 프로토타입 전용 — 분류 필수 정책을 켜고 끄며 비교한다. 실제 화면에는 없는 컨트롤. */}
          <div className="tc-policy">
            <span className="tc-policy-kicker">프로토타입</span>
            <ToggleLabeled label="분류 필수 검증" checked={requireCategory} onChange={setRequireCategory} />
            <span className="tc-policy-note">
              {requireCategory
                ? '분류를 고르지 않으면 저장이 막혀요. (신규 등록 기준)'
                : '분류 없이도 저장돼요. 경고만 노출합니다. (기존 항목 유예 기준)'}
            </span>
          </div>

          {/* 필수 정보 */}
          <section className="kr-fieldset">
            <div className="kr-fieldset-title">필수 정보</div>
            <div className="kr-fieldset-body">
              {/* 진료항목명 — 병원이 부르는 이름. 자유 입력. (C안) */}
              <div className="kr-fld">
                <div className="kr-fld-label">진료항목명</div>
                <div className="kr-fld-desc">
                  병원에서 부르는 이름 그대로 입력해 주세요.
                  <br />
                  검색해서 굿닥 표준 진료항목을 고르면 아래 분류가 함께 채워집니다.
                </div>

                <div className="tc-anchor">
                  <div className={`kr-search-field ${errors['name'] ? 'err' : ''}`}>
                    {name && !searching ? (
                      <span className="kr-search-chip">
                        <span className="kr-search-chip-label">{name}</span>
                        <button className="kr-search-chip-x" aria-label="진료항목명 변경" onClick={clearName}>
                          <FiX size={14} />
                        </button>
                      </span>
                    ) : (
                      <input
                        className="kr-search-input"
                        value={nameQuery}
                        maxLength={ITEM_NAME_MAX}
                        placeholder="진료항목명을 입력하거나 검색해 주세요."
                        autoFocus
                        onChange={(e) => setNameQuery(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            commitName();
                          }
                        }}
                      />
                    )}
                    <span className="kr-search-icon">
                      <FiSearch size={18} />
                    </span>
                  </div>

                  {/* 자동완성 레이어 — 표준 항목을 고르면 이름+분류 동시 확정 */}
                  {searching && (
                    <div className="tc-layer">
                      {nameQuery.trim().length === 0 ? (
                        <div className="tc-layer-guide">
                          공식 진료명·시술명으로 검색해 보세요. 예) 임플란트, 도수치료, 가다실 9가
                        </div>
                      ) : suggestions.length > 0 ? (
                        <div className="tc-layer-list">
                          {suggestions.map((sg) => (
                            <button key={sg.m3Id} className="tc-sug" onClick={() => pickStandard(sg)}>
                              <span className="tc-sug-path">
                                <span className="tc-dim">{sg.m1Name}</span>
                                <span className="tc-sep">›</span>
                                <span className="tc-dim">{sg.m2Name}</span>
                                <span className="tc-sep">›</span>
                                <span className="tc-strong">{sg.m3Name}</span>
                              </span>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="tc-layer-guide">일치하는 표준 진료항목이 없어요. 입력한 이름을 그대로 쓸 수 있어요.</div>
                      )}
                      <div className="tc-layer-foot">
                        <button className="tc-layer-btn" onClick={commitName} disabled={nameQuery.trim().length < ITEM_NAME_MIN}>
                          {nameQuery.trim().length >= ITEM_NAME_MIN ? (
                            <>
                              ‘<b>{nameQuery.trim()}</b>’ 이름으로 쓰기
                            </>
                          ) : (
                            <>최소 {ITEM_NAME_MIN}글자 이상 입력해 주세요</>
                          )}
                        </button>
                        <span className="tc-layer-note">이름만 정해집니다. 분류는 아래에서 따로 골라요.</span>
                      </div>
                    </div>
                  )}
                </div>
                {errors['name'] && <div className="kr-err-msg">{errors['name']}</div>}
              </div>

              {/* 분류 — 굿닥 표준 진료항목의 대분류 › 중분류. 이름과 분리된 별도 필드. (C안) */}
              <div className="kr-fld">
                <div className="kr-fld-label">
                  분류
                  {requireCategory && <span className="tc-req">필수</span>}
                </div>
                <div className="kr-fld-desc">환자가 카테고리로 찾을 때 쓰입니다. 진료항목명과 별개로 지정해 주세요.</div>

                <div className={`tc-cat-field ${errors['category'] ? 'err' : ''} ${category ? 'filled' : ''}`}>
                  {category ? (
                    <span className="tc-cat-value">{catLabel(category)}</span>
                  ) : (
                    <span className="tc-cat-empty">분류를 선택해 주세요.</span>
                  )}
                  <button
                    className="tc-cat-btn"
                    onClick={() => {
                      setSheetM1(null);
                      setCatSheet(true);
                    }}
                  >
                    {category ? '변경' : '선택'}
                  </button>
                </div>

                {/* 역매칭 추천 — 이름에 분류 명칭이 들어 있으면 원클릭 제안 */}
                {catRecos.length > 0 && (
                  <div className="tc-reco">
                    <div className="tc-reco-lead">이름을 보니 이 분류일 것 같아요</div>
                    {catRecos.map((r) => (
                      <button key={`${r.m1Id}-${r.m2Id}`} className="tc-reco-btn" onClick={() => pickCategory(r)}>
                        <span className="tc-reco-path">{catLabel(r)}</span>
                        <span className="tc-reco-cta">여기에 넣기</span>
                      </button>
                    ))}
                  </div>
                )}

                {!category && (
                  <div className="tc-warn">
                    <IconCaution />
                    <span>
                      분류가 없으면{' '}
                      <b>
                        {catRecos.length > 0
                          ? `‘${catRecos[0].m2Name}’${roSuffix(catRecos[0].m2Name)}`
                          : '카테고리로'}
                      </b>{' '}
                      검색하는 환자에게 노출되지 않아요.
                    </span>
                  </div>
                )}
                {errors['category'] && <div className="kr-err-msg">{errors['category']}</div>}
              </div>

              {/* 가격 정보 */}
              <div className="kr-fld">
                <div className="kr-fld-label">가격 정보</div>
                <div className="kr-fld-desc">환자에게 보여줄 가격 정보를 설정해 주세요. (예: 횟수별, 시술명별, 용량별 등)</div>
                {errors['price-active'] && <div className="kr-err-msg" style={{ marginBottom: 8 }}>{errors['price-active']}</div>}
                <div className="kr-price-list">
                  {prices.map((p) => (
                    <div key={p.id} className={`kr-price ${errors[`price-${p.id}`] ? 'err' : ''}`}>
                      <button
                        className="kr-icon-btn kr-price-delete"
                        aria-label="가격 옵션 삭제"
                        onClick={() => setPrices((prev) => (prev.length > 1 ? prev.filter((x) => x.id !== p.id) : prev))}
                      >
                        <FiX size={18} />
                      </button>
                      <input
                        className="kr-input"
                        value={p.title}
                        maxLength={PRICE_NAME_MAX}
                        placeholder="가격 옵션명을 입력해 주세요. (15자 권장, 최대 50자)"
                        onChange={(e) => setPrices((prev) => prev.map((x) => (x.id === p.id ? { ...x, title: e.target.value } : x)))}
                      />
                      <input
                        className="kr-input"
                        value={p.content}
                        placeholder="가격 옵션 설명을 입력해 주세요. (선택사항, 최대 100자)"
                        maxLength={PRICE_CONTENT_MAX}
                        onChange={(e) => {
                          clearErr(`price-${p.id}`);
                          setPrices((prev) => prev.map((x) => (x.id === p.id ? { ...x, content: e.target.value } : x)));
                        }}
                      />
                      <div className="kr-price-row">
                        <select
                          className="kr-select kr-price-type"
                          value={p.type}
                          onChange={(e) => {
                            clearErr(`price-${p.id}`);
                            setPrices((prev) => prev.map((x) => (x.id === p.id ? { ...x, type: e.target.value as PriceType } : x)));
                          }}
                        >
                          <option value="fixed">고정 가격</option>
                          <option value="discount">할인 가격</option>
                          <option value="consult">상담 후 결정</option>
                        </select>
                        {p.type === 'fixed' && (
                          <input className="kr-input kr-amount" type="number" value={p.amount || ''} placeholder="0" onChange={(e) => setPrices((prev) => prev.map((x) => (x.id === p.id ? { ...x, amount: Number(e.target.value) } : x)))} />
                        )}
                        {p.type === 'discount' && (
                          <>
                            <input className="kr-input kr-amount kr-amount-original" type="number" value={p.original || ''} placeholder="정상가" aria-label="정상가" onChange={(e) => setPrices((prev) => prev.map((x) => (x.id === p.id ? { ...x, original: Number(e.target.value) } : x)))} />
                            <span className="kr-price-arrow">→</span>
                            <input className="kr-input kr-amount" type="number" value={p.sale || ''} placeholder="판매가" aria-label="판매가" onChange={(e) => setPrices((prev) => prev.map((x) => (x.id === p.id ? { ...x, sale: Number(e.target.value) } : x)))} />
                          </>
                        )}
                        {p.type === 'consult' && <input className="kr-input kr-amount" value="0" disabled aria-label="상담 후 결정" />}
                        <span className="kr-price-unit">원</span>
                      </div>
                      {errors[`price-${p.id}`] && <div className="kr-err-msg">{errors[`price-${p.id}`]}</div>}
                    </div>
                  ))}
                </div>
                <button
                  className="kr-price-add"
                  onClick={() => setPrices((prev) => [...prev, { id: uid(), title: '', type: 'fixed', amount: 0, original: 0, sale: 0, content: '', active: true }])}
                >
                  <FiPlus size={16} /> 가격 옵션 추가
                </button>
              </div>
            </div>
          </section>

          {/* 추가 정보 */}
          <section className="kr-fieldset">
            <div className="kr-fieldset-title">추가 정보</div>
            <div className="kr-fieldset-body">
              {/* 대표 사진 */}
              <div className="kr-fld">
                <div className="kr-fld-label">대표 사진 (선택)</div>
                <div className="kr-fld-desc">진료항목을 대표하는 사진을 업로드해 주세요.</div>
                <div className="kr-uploader">
                  {mainImage ? (
                    <div className="kr-thumb">
                      <div className="kr-thumb-ph">{mainImage}</div>
                      <button className="kr-thumb-x" aria-label="대표 사진 삭제" onClick={() => setMainImage('')}>
                        <FiX size={12} />
                      </button>
                    </div>
                  ) : (
                    <button className="kr-add-photo" aria-label="대표 사진 추가" onClick={() => setMainImage('🖼️')}>
                      <FiPlus size={22} />
                    </button>
                  )}
                  <ul className="kr-guidebox">
                    <li>권장 사이즈 가로 1,200px, 세로 1,200px 이하, 파일당 최대 20MB, jpeg, jpg, png, gif</li>
                    <li>등록된 이미지에 대한 모든 책임은 병원에 있으며, 굿닥은 법적 책임을 지지 않습니다.</li>
                    <li>의료법 제56조(의료광고 금지 등)에 위배되는 이미지는 사전 고지 없이 삭제될 수 있습니다.</li>
                  </ul>
                </div>
              </div>

              {/* 진료항목 노출명 */}
              <div className="kr-fld">
                <div className="kr-fld-label">진료항목 노출명 (선택)</div>
                <div className="kr-fld-desc">굿닥에 보여질 이름을 별도로 설정하고 싶을 때 입력해 주세요. 비워두면 진료항목명과 동일하게 노출됩니다.</div>
                <input className="kr-input" value={alias} maxLength={ALIAS_MAX} placeholder="진료항목 노출명을 입력해 주세요." onChange={(e) => setAlias(e.target.value)} />
                <div className="kr-charcount">{alias.length}/{ALIAS_MAX}자</div>
              </div>

              {/* 한 줄 소개 */}
              <div className="kr-fld">
                <div className="kr-fld-label">한 줄 소개 (선택)</div>
                <div className="kr-fld-desc">진료항목을 한눈에 이해할 수 있는 짧은 소개 문구를 입력해 주세요.</div>
                <input className="kr-input" value={shortDescription} maxLength={SHORT_INTRO_MAX} placeholder="한 줄 소개를 입력해 주세요." onChange={(e) => setShortDescription(e.target.value)} />
                <div className="kr-charcount">{shortDescription.length}/{SHORT_INTRO_MAX}자</div>
              </div>

              <hr className="kr-hr" />

              {/* 상세 소개 */}
              <div className="kr-fld">
                <div className="kr-fld-label">상세 소개 (선택)</div>
                <div className="kr-fld-desc">진료항목 상세 페이지에서 보여질 자세한 소개 내용을 입력해 주세요.</div>
                <textarea className="kr-textarea kr-textarea-lg" value={detailDescription} maxLength={DETAIL_DESC_MAX} placeholder="상세 소개를 입력해 주세요." onChange={(e) => setDetailDescription(e.target.value)} />
                <div className="kr-charcount">{detailDescription.length.toLocaleString('ko-KR')}/{DETAIL_DESC_MAX.toLocaleString('ko-KR')}자</div>
              </div>

              {/* 상세 소개 사진 */}
              <div className="kr-fld">
                <div className="kr-fld-label">상세 소개 사진 (선택)</div>
                <div className="kr-fld-desc">진료항목 상세 페이지에 노출할 사진을 업로드해 주세요.</div>
                <div className="kr-uploader">
                  <div className="kr-thumb-row">
                    {detailImages.map((im, i) => (
                      <div className="kr-thumb" key={im}>
                        <div className="kr-thumb-ph">🖼️</div>
                        <button className="kr-thumb-x" aria-label={`${i + 1}번 상세 소개 사진 삭제`} onClick={() => setDetailImages((prev) => prev.filter((x) => x !== im))}>
                          <FiX size={12} />
                        </button>
                      </div>
                    ))}
                    {detailImages.length < DETAIL_IMAGES_MAX && (
                      <button className="kr-add-photo" aria-label="상세 소개 사진 추가" onClick={addDetailImage}>
                        <FiPlus size={22} />
                      </button>
                    )}
                  </div>
                  <ul className="kr-guidebox">
                    <li>최대 5개, 권장 사이즈 가로 800px, 세로 4,000px 이하, 파일당 최대 20MB, jpeg, jpg, png, gif</li>
                    <li>이미지를 드래그해서 순서를 변경할 수 있습니다.</li>
                    <li>등록된 이미지에 대한 모든 책임은 병원에 있으며, 굿닥은 법적 책임을 지지 않습니다.</li>
                    <li>의료법 제56조(의료광고 금지 등)에 위배되는 이미지는 사전 고지 없이 삭제될 수 있습니다.</li>
                  </ul>
                </div>
              </div>

              {/* 진료항목 키워드 */}
              <div className="kr-fld">
                <div className="kr-fld-label">진료항목 키워드 (선택)</div>
                <div className="kr-fld-desc">구글, 네이버 등 포털에서 진료항목이 더 잘 검색될 수 있도록 관련 키워드를 입력해 주세요.</div>
                <input
                  className="kr-input"
                  value={keywordDraft}
                  maxLength={KEYWORD_MAX_LENGTH}
                  placeholder="키워드 입력 후 Enter 키를 눌러주세요."
                  onChange={(e) => setKeywordDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addKeyword();
                    }
                  }}
                />
                {keywords.length > 0 && (
                  <div className="kr-kw-chips">
                    {keywords.map((kw) => (
                      <span key={kw} className="kr-kw-chip">
                        {kw}
                        <button className="kr-kw-chip-x" aria-label={`${kw} 삭제`} onClick={() => setKeywords((prev) => prev.filter((x) => x !== kw))}>
                          <FiX size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="kr-charcount">{keywords.length}/{KEYWORD_MAX_ITEMS}개</div>
              </div>
            </div>
          </section>

          {/* 외부 플랫폼 정보 — 카카오 노출 설정 카드 (연동완료에서만 렌더) */}
          {isLinked && (
          <section className="kr-section">
            <div className="kr-section-title">외부 플랫폼 정보</div>
            <div className="kr-stack-24">
              {/* 카드 헤더 */}
              <div className="kr-kakao-card-head">
                <div className="kr-kakao-head-left">
                  <span className="kr-kakao-icon">
                    <KakaoCardIcon />
                  </span>
                  <div className="kr-kakao-head-text">
                    <span className="kr-kakao-title">카카오톡 예약하기에서도 보이기</span>
                    <span className="kr-kakao-sub">카카오톡 예약하기에도 상품을 노출하고 예약을 받아요.</span>
                    {/* REALCODE: 실제 코드는 이 안내를 항상 노출 (수동확정 조건 없음) */}
                    <span className="kr-kakao-autoconfirm">카카오톡 예약하기로 받는 예약은 자동으로 확정됩니다.</span>
                  </div>
                </div>
                <Toggle checked={linked} onChange={setLinked} ariaLabel="카카오톡 예약하기에서도 보이기" />
              </div>

              {/* 상태 안내 배너 (children 슬롯) */}
              <GuideBanner tone={guide.tone} message={guide.message} />

              {/* 예약 시 받을 정보 (발문 빌더) */}
              <div className="kr-stack-16">
                <span className="kr-field-label">예약 시 받을 정보 (선택)</span>
                <div className="kr-qb">
                  {questions.length > 0 && (
                    <div className="kr-qb-list">
                      {questions.map((q) => {
                        const isChoice = q.type !== 'text';
                        return (
                          <div key={q.id} className="kr-question">
                            <div className="kr-q-handle" title="순서 변경">
                              <IconHandler />
                            </div>
                            <select className="kr-select kr-q-type-select" value={uiTypeOf(q.type)} onChange={(e) => changeUiType(q, e.target.value)}>
                              <option value="text">주관식</option>
                              <option value="choice">객관식</option>
                            </select>
                            <input
                              className={`kr-input ${errors[`q-${q.id}-name`] ? 'err' : ''}`}
                              value={q.name}
                              maxLength={KAKAO_QUESTION_NAME_MAX}
                              placeholder={`질문 입력 (최대 ${KAKAO_QUESTION_NAME_MAX}자)`}
                              onChange={(e) => {
                                clearErr(`q-${q.id}-name`);
                                patchQ(q.id, { name: e.target.value });
                              }}
                            />
                            {errors[`q-${q.id}-name`] && <div className="kr-err-msg">{errors[`q-${q.id}-name`]}</div>}

                            {isChoice && (
                              <>
                                <input
                                  className="kr-input"
                                  value={q.description}
                                  maxLength={KAKAO_QUESTION_DESCRIPTION_MAX}
                                  placeholder={`설명 입력 (선택사항, 최대 ${KAKAO_QUESTION_DESCRIPTION_MAX}자)`}
                                  onChange={(e) => patchQ(q.id, { description: e.target.value })}
                                />
                                <div className="kr-q-options">
                                  {q.options.map((o, oi) => (
                                    <div key={oi} className="kr-q-option">
                                      <span className="kr-opt-marker" data-variant={q.type} />
                                      <span className="kr-opt-input">
                                        <input
                                          className={`kr-input ${(errors[`q-${q.id}-opt`] && !o.trim()) || errors[dupKey(q.id, oi)] ? 'err' : ''}`}
                                          value={o}
                                          maxLength={KAKAO_OPTION_NAME_MAX}
                                          placeholder={`항목 ${oi + 1} (최대 ${KAKAO_OPTION_NAME_MAX}자)`}
                                          onChange={(e) => {
                                            clearErr(`q-${q.id}-opt`);
                                            clearDupErrors(q.id);
                                            patchQ(q.id, { options: q.options.map((x, xi) => (xi === oi ? e.target.value : x)) });
                                          }}
                                          onBlur={() => revealDupErrors(q.id, q.options)}
                                        />
                                        {errors[dupKey(q.id, oi)] && <span className="kr-err-msg">{errors[dupKey(q.id, oi)]}</span>}
                                      </span>
                                      <button
                                        className="kr-icon-btn"
                                        aria-label="항목 삭제"
                                        disabled={q.options.length <= KAKAO_MIN_OPTIONS}
                                        onClick={() => {
                                          const nextOptions = q.options.filter((_, xi) => xi !== oi);
                                          patchQ(q.id, { options: nextOptions });
                                          revealDupErrors(q.id, nextOptions);
                                        }}
                                      >
                                        <FiX size={16} />
                                      </button>
                                    </div>
                                  ))}
                                  {q.options.length >= KAKAO_MAX_OPTIONS ? (
                                    <div className="kr-q-maxnote">항목은 최대 {KAKAO_MAX_OPTIONS}개까지 추가할 수 있어요.</div>
                                  ) : (
                                    <button className="kr-btn kr-btn-secondary-ghost kr-btn-xs kr-q-addopt" onClick={() => patchQ(q.id, { options: [...q.options, ''] })}>
                                      <FiPlus size={16} /> 항목 추가
                                    </button>
                                  )}
                                  {errors[`q-${q.id}-opt`] && <div className="kr-err-msg">{errors[`q-${q.id}-opt`]}</div>}
                                </div>
                              </>
                            )}

                            <div className="kr-q-footer">
                              <div className="kr-q-footer-left">
                                <ToggleLabeled label="답변 필수" checked={!q.optional} onChange={(v) => patchQ(q.id, { optional: !v })} />
                                {isChoice && (
                                  <ToggleLabeled label="복수 선택" checked={q.type === 'select'} onChange={(v) => patchQ(q.id, { type: v ? 'select' : 'radio' })} />
                                )}
                              </div>
                              <button className="kr-icon-btn" aria-label="질문 삭제" onClick={() => removeQ(q.id)}>
                                <FiX size={16} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {isMaxQ ? (
                    <div className="kr-qb-maxnote">질문은 최대 10개까지 추가할 수 있어요.</div>
                  ) : (
                    <button className="kr-btn kr-btn-primary-smooth kr-btn-block" onClick={addQuestion}>
                      <FiPlus size={18} /> 질문 추가
                    </button>
                  )}
                </div>
              </div>
            </div>

            <hr className="kr-hr" />

            {/* 이용 방법 / 유의사항 / 취소 유의사항 (카카오 전용) */}
            <div className="kr-stack-24">
              <div className="kr-stack-8">
                <span className="kr-field-label">이용 방법 (선택)</span>
                <textarea className="kr-textarea" value={information} maxLength={KAKAO_INFORMATION_MAX} placeholder="이용 방법을 입력해 주세요." onChange={(e) => setInformation(e.target.value)} />
                <div className="kr-charcount">{information.length.toLocaleString('ko-KR')}/{KAKAO_INFORMATION_MAX.toLocaleString('ko-KR')}</div>
              </div>
              <div className="kr-stack-8">
                <span className="kr-field-label">유의사항 (선택)</span>
                <input className="kr-input" value={notice} maxLength={KAKAO_NOTICE_MAX} placeholder="유의사항을 입력해 주세요." onChange={(e) => setNotice(e.target.value)} />
                <div className="kr-charcount">{notice.length}/{KAKAO_NOTICE_MAX}</div>
              </div>
              <div className="kr-stack-8">
                <span className="kr-field-label">취소 유의사항 (선택)</span>
                <input className="kr-input" value={cancelNotice} maxLength={KAKAO_CANCEL_NOTICE_MAX} placeholder="취소 유의사항을 입력해 주세요." onChange={(e) => setCancelNotice(e.target.value)} />
                <div className="kr-charcount">{cancelNotice.length}/{KAKAO_CANCEL_NOTICE_MAX}</div>
              </div>
            </div>
          </section>
          )}
        </div>{/* /form-col */}

        {/* ── 오른쪽: 굿닥 미리보기 (sticky) ── */}
        <aside className="kr-detail-preview-col">
          <div className="kr-preview-label">굿닥 미리보기</div>
          <div className="kr-mobile">
            <div className="kr-mobile-scroll">
              <div className="kr-mp-thumb">{mainImage || '🖼️'}</div>
              <div className="kr-mp-title-sec">
                {name && <div className="kr-mp-sub">{name}</div>}
                <div className={`kr-mp-title ${name ? '' : 'ph'}`}>{name ? previewTitle : '진료항목을 입력해 주세요.'}</div>
                {shortDescription && <div className="kr-mp-short">{shortDescription}</div>}
              </div>
              <div className="kr-mp-divider" />
              <div className="kr-mp-price-sec">
                <div className="kr-mp-heading">가격 정보</div>
                <div className="kr-mp-price-list">
                  {prices.length === 0 ? (
                    <div className="kr-mp-price-row">
                      <span className="kr-mp-price-name ph">가격 옵션명을 입력해 주세요.</span>
                      <span className="kr-mp-price-amt"><b className="muted">0원</b></span>
                    </div>
                  ) : (
                    prices.map((p) => (
                      <div className="kr-mp-price-item" key={p.id}>
                        <div className="kr-mp-price-row">
                          <span className={`kr-mp-price-name ${p.title ? '' : 'ph'}`}>{p.title || '가격 옵션명을 입력해 주세요.'}</span>
                          <span className="kr-mp-price-amt">
                            {p.type === 'consult' ? (
                              <b>상담 후 결정</b>
                            ) : p.type === 'fixed' ? (
                              <b className={p.amount ? '' : 'muted'}>{won(p.amount)}</b>
                            ) : (
                              <>
                                <s className="kr-mp-orig">{won(p.original)}</s>
                                <b className={p.sale ? '' : 'muted'}>{won(p.sale)}</b>
                              </>
                            )}
                          </span>
                        </div>
                        {p.content && <div className="kr-mp-price-content">{p.content}</div>}
                      </div>
                    ))
                  )}
                </div>
              </div>
              {detailDescription && (
                <>
                  <div className="kr-mp-divider" />
                  <div className="kr-mp-desc-sec">
                    <div className="kr-mp-heading">상세 소개</div>
                    <div className="kr-mp-desc">{detailDescription}</div>
                  </div>
                </>
              )}
            </div>
          </div>
        </aside>
      </div>{/* /layout */}

      {/* ── 하단 푸터 바 ── */}
      <div className="kr-detail-footer">
        <div className="kr-footer-left">
          <button className="kr-btn kr-btn-secondary-ghost" onClick={() => showToast('변경 사항을 취소했어요.')}>
            취소
          </button>
          <button className="kr-btn kr-btn-primary-solid" onClick={handleSave}>
            저장
          </button>
        </div>
        <button className="kr-footer-delete" onClick={() => showToast('활성 또는 미래 예약이 있는 진료항목은 삭제 대신 운영 중지됩니다.')}>
          삭제
        </button>
      </div>

      {/* 분류 선택 시트 — 대분류 → 중분류. 소분류는 고르지 않는다(부분 매핑). */}
      {catSheet && (
        <Modal
          title={sheetM1 ? `${TAXONOMY.find((c) => c.id === sheetM1)!.name} 안에서 고르기` : '분류 선택'}
          onClose={() => {
            setCatSheet(false);
            setSheetM1(null);
          }}
          footer={
            sheetM1 ? (
              <button className="kr-btn kr-btn-secondary-ghost" onClick={() => setSheetM1(null)}>
                <FiChevronLeft size={18} /> 대분류로
              </button>
            ) : undefined
          }
        >
          <div className="tc-sheet">
            {!sheetM1 && (
              <>
                <div className="tc-sheet-note">대분류 {TAXONOMY.length}개 · 중분류 69개 — 굿닥 표준 진료항목</div>
                {TAXONOMY.map((c1) => (
                  <button key={c1.id} className="tc-pick" onClick={() => setSheetM1(c1.id)}>
                    <span>{c1.name}</span>
                    <span className="tc-pick-meta">
                      {c1.groups.length}개 <FiChevronRight size={16} />
                    </span>
                  </button>
                ))}
              </>
            )}
            {sheetM1 &&
              TAXONOMY.find((c) => c.id === sheetM1)!.groups.map((c2) => {
                const c1 = TAXONOMY.find((c) => c.id === sheetM1)!;
                const on = category?.m2Id === c2.id;
                return (
                  <button
                    key={c2.id}
                    className={`tc-pick ${on ? 'on' : ''}`}
                    onClick={() => pickCategory({ m1Id: c1.id, m1Name: c1.name, m2Id: c2.id, m2Name: c2.name })}
                  >
                    <span>
                      <span className="tc-dim">{c1.name} › </span>
                      {c2.name}
                    </span>
                    <span className="tc-pick-cta">{on ? '선택됨' : '선택'}</span>
                  </button>
                );
              })}
          </div>
        </Modal>
      )}
    </div>
  );
}

/* =========================================================================
 * ③ 예약 신청 내역
 * ======================================================================= */
const TABS: { key: ApptTab; label: string }[] = [
  { key: 'request', label: '예약 신청' },
  { key: 'upcoming', label: '내원 예정' },
  { key: 'closed', label: '지난 내역' },
];
const PRESETS = ['최근 30일', '최근 7일', '오늘', '직접 설정'] as const;
const DT_HEADER: Record<ApptTab, string> = {
  request: '예약희망 / 신청일시',
  upcoming: '예약희망 / 확정일시',
  closed: '예약희망 / 종료일시',
};
const CLOSED_STATUSES = ['전체', '진료완료', '병원취소', '환자취소', '자동종료'];
const EMPTY_MSG: Record<ApptTab, string> = {
  request: '조회된 예약 신청이 없어요',
  upcoming: '조회된 내원 예정 일정이 없어요',
  closed: '조회된 지난 내역이 없어요',
};
const SEARCH_META = {
  name: { label: '환자명', placeholder: '환자명을 입력해 주세요.', min: 2, err: '2자 이상 입력해 주세요.' },
  phone: { label: '연락처', placeholder: '연락처를 입력해 주세요.', min: 4, err: '4자리 이상 입력해 주세요.' },
  item: { label: '진료항목명', placeholder: '진료항목 또는 가격명을 입력해 주세요.', min: 2, err: '2자 이상 입력해 주세요.' },
} as const;

function ApptScreen({
  reservations,
  setReservations,
  isLinked,
  showToast,
}: {
  reservations: Reservation[];
  setReservations: React.Dispatch<React.SetStateAction<Reservation[]>>;
  isLinked: boolean;
  showToast: (m: string, e?: boolean) => void;
}) {
  const [tab, setTab] = useState<ApptTab>('request');
  const [preset, setPreset] = useState<(typeof PRESETS)[number]>('최근 30일');
  const [status, setStatus] = useState('전체');
  const [searchType, setSearchType] = useState<'name' | 'phone' | 'item'>('name');
  const [searchValue, setSearchValue] = useState('');
  const [detail, setDetail] = useState<Reservation | null>(null);

  const meta = SEARCH_META[searchType];
  const filtered = useMemo(() => {
    let rows = reservations.filter((r) => r.tab === tab);
    if (tab === 'closed' && status !== '전체') rows = rows.filter((r) => STATUS_LABEL[r.status] === status);
    const v = searchValue.trim();
    if (v) {
      if (searchType === 'name' && v.length >= 2) rows = rows.filter((r) => r.visitor.includes(v) || r.reserver.includes(v));
      else if (searchType === 'phone' && v.replace(/\D/g, '').length >= 4) rows = rows.filter((r) => r.phone.replace(/\D/g, '').includes(v.replace(/\D/g, '')));
      else if (searchType === 'item' && v.length >= 2) rows = rows.filter((r) => r.itemName.includes(v) || r.priceTitle.includes(v));
    }
    return rows;
  }, [reservations, tab, status, searchType, searchValue]);

  const searched = searchValue.trim().length > 0;
  const noResult = searched || (tab === 'closed' && status !== '전체');
  const colCount = (isLinked ? 1 : 0) + 6;

  const setStatusOf = (id: string, next: ApptStatus, newTab: ApptTab, closedReason?: string) => {
    setReservations((prev) => prev.map((r) => (r.id === id ? { ...r, status: next, tab: newTab, closedReason } : r)));
    setDetail(null);
  };

  return (
    <div className="kr-page">
      <div className="kr-page-head">
        <div className="kr-page-title">예약 신청 내역</div>
        <div className="kr-page-sub">등록한 진료항목으로 예약 받은 내역을 관리합니다.</div>
      </div>

      <div className="kr-tabs">
        {TABS.map((t) => (
          <button key={t.key} className={`kr-tab ${tab === t.key ? 'active' : ''}`} aria-pressed={tab === t.key} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* 필터 */}
      <div className="kr-filter">
        <div className="kr-filter-row">
          <span className="kr-filter-label">기간</span>
          <div className="kr-presets">
            {PRESETS.map((p) => (
              <button
                key={p}
                className={`kr-chip ${preset === p ? 'active' : ''}`}
                onClick={() => {
                  setPreset(p);
                  if (p === '직접 설정') showToast('조회 기간은 최대 6개월까지 설정할 수 있어요.');
                }}
              >
                {p === '직접 설정' && <IconDateRange />}
                {p}
              </button>
            ))}
          </div>
        </div>
        <div className="kr-filter-row">
          <span className="kr-filter-label">검색</span>
          <select className="kr-select kr-select-type" value={searchType} onChange={(e) => setSearchType(e.target.value as any)}>
            <option value="name">환자명</option>
            <option value="phone">연락처</option>
            <option value="item">진료항목명</option>
          </select>
          <input className="kr-input kr-filter-search" value={searchValue} placeholder={meta.placeholder} onChange={(e) => setSearchValue(e.target.value)} />
          {tab === 'closed' && (
            <>
              <span className="kr-filter-label" style={{ width: 'auto' }}>상태</span>
              <select className="kr-select kr-select-status" value={status} onChange={(e) => setStatus(e.target.value)}>
                {CLOSED_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </>
          )}
        </div>
      </div>

      <div className="kr-count">총 {filtered.length}건</div>

      <div className="kr-table-wrap">
        <table className="kr-table">
          <thead>
            <tr>
              {isLinked && <th className="kr-col-channel">채널</th>}
              <th className="kr-col-status">상태</th>
              <th className="kr-col-dt">{DT_HEADER[tab]}</th>
              <th className="kr-col-item">진료항목</th>
              <th className="kr-col-visitor">방문자</th>
              <th className="kr-col-reserver">예약자</th>
              <th>요청사항</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={colCount} className="kr-empty">
                  {noResult ? '조건에 맞는 예약이 없어요' : EMPTY_MSG[tab]}
                </td>
              </tr>
            ) : (
              filtered.map((r) => {
                const isKakao = r.deviceType === 2;
                return (
                  <tr key={r.id} onClick={() => setDetail(r)}>
                    {isLinked && (
                      <td className="kr-col-channel">
                        <ChannelBadge kakao={isKakao} />
                      </td>
                    )}
                    <td className="kr-td-center">
                      <StatusTag status={r.status} />
                    </td>
                    <td>
                      <div className="kr-cell-2line">
                        <div className="l1">{r.visitAt}</div>
                        <div className="l2">{r.repAt}</div>
                      </div>
                    </td>
                    <td>
                      <div className="kr-cell-ellip">{r.itemName}</div>
                    </td>
                    <td>
                      <div className="kr-cell-ellip">{r.visitor}</div>
                    </td>
                    <td>
                      <div className="kr-cell-ellip">{r.reserver}</div>
                    </td>
                    <td>
                      <div className="kr-cell-memo">{r.reserverMemo || '-'}</div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {detail && (
        <ApptDetailModal
          detail={detail}
          isLinked={isLinked}
          onClose={() => setDetail(null)}
          onConfirm={() => setStatusOf(detail.id, 'T03', 'upcoming')}
          onComplete={() => setStatusOf(detail.id, 'F05', 'closed', '진료 완료')}
          onCancel={() => setStatusOf(detail.id, 'F03', 'closed', '병원 취소')}
        />
      )}
    </div>
  );
}

function ApptDetailModal({
  detail,
  isLinked,
  onClose,
  onConfirm,
  onComplete,
  onCancel,
}: {
  detail: Reservation;
  isLinked: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onComplete: () => void;
  onCancel: () => void;
}) {
  const isKakao = detail.deviceType === 2;
  const repLabel = detail.tab === 'request' ? '신청일시' : detail.tab === 'upcoming' ? '확정일시' : '종료일시';
  const kakaoAnswers = (detail.additionalInfos || []).map((a) => ({ name: a.name, values: a.values }));
  const showKakaoAnswers = isLinked && isKakao && kakaoAnswers.length > 0;
  const isCanceled = detail.status === 'F02' || detail.status === 'F03';

  const footer = (
    <>
      {(detail.tab === 'request' || detail.tab === 'upcoming') && (
        <button className="kr-btn kr-btn-danger-smooth" onClick={onCancel}>
          예약 취소
        </button>
      )}
      <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
        <button className="kr-btn kr-btn-secondary-smooth" onClick={onClose}>
          닫기
        </button>
        {detail.tab === 'request' && (
          <button className="kr-btn kr-btn-primary-solid" onClick={onConfirm}>
            예약 확정
          </button>
        )}
        {detail.tab === 'upcoming' && (
          <button className="kr-btn kr-btn-primary-solid" onClick={onComplete}>
            진료 완료
          </button>
        )}
      </div>
    </>
  );

  return (
    <Modal title="예약 상세" size="medium" onClose={onClose} footer={footer}>
      <div className="kr-detail-body">
        {/* 예약희망 · {일시} */}
        <div>
          <div className="kr-dsection-title">예약희망 · {repLabel}</div>
          <div className="kr-dsection">
            <div className="kr-dsection-pad">
              <div className="kr-dsection-header">
                <StatusTag status={detail.status} />
                {isLinked && <ChannelBadge kakao={isKakao} label />}
              </div>
              <div>
                <span className="t-b1-600 c-gray-90">{detail.visitAt}</span>{' '}
                <span className="t-c2-400 c-gray-60">· {detail.repAt}</span>
              </div>
              {isCanceled && (
                <div className="kr-dfield">
                  <span className="kr-dfield-label">취소사유</span>
                  <span className="kr-dfield-value">{detail.closedReason || '-'}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 방문자 정보 */}
        <div>
          <div className="kr-dsection-title">방문자 정보</div>
          <div className="kr-dsection">
            <div className="kr-dsection-pad">
              <div className="kr-dfield"><span className="kr-dfield-label">이름</span><span className="kr-dfield-value">{detail.visitor}</span></div>
              <div className="kr-dfield"><span className="kr-dfield-label">생년월일</span><span className="kr-dfield-value">{detail.birth} (만 {detail.age}세, {detail.gender})</span></div>
              <div className="kr-dfield"><span className="kr-dfield-label">연락처</span><span className="kr-dfield-value">{detail.phone}</span></div>
            </div>
          </div>
        </div>

        {/* 예약자 정보 */}
        <div>
          <div className="kr-dsection-header" style={{ justifyContent: 'space-between' }}>
            <div className="kr-dsection-title" style={{ marginBottom: 0 }}>예약자 정보</div>
            {detail.sameAsVisitor && <span className="kr-tag-gray">방문자와 동일</span>}
          </div>
          <div className="kr-dsection" style={{ marginTop: 8 }}>
            <div className="kr-dsection-pad">
              <div className="kr-dfield"><span className="kr-dfield-label">이름</span><span className="kr-dfield-value">{detail.reserver}</span></div>
              <div className="kr-dfield"><span className="kr-dfield-label">연락처</span><span className="kr-dfield-value">{detail.phone}</span></div>
            </div>
          </div>
        </div>

        {/* 요청사항 (reserverMemo 있을 때만) */}
        {detail.reserverMemo && (
          <div>
            <div className="kr-dsection-title">요청사항</div>
            <div className="kr-dsection">
              <div className="kr-dsection-pad">
                <span className="t-b2-500 c-gray-90" style={{ whiteSpace: 'pre-wrap' }}>{detail.reserverMemo}</span>
              </div>
            </div>
          </div>
        )}

        {/* 카카오톡 예약하기 추가 질문·답변 (카카오 && 데이터 존재) */}
        {showKakaoAnswers && (
          <div>
            <div className="kr-dsection-title">카카오톡 예약하기 추가 질문·답변</div>
            <div className="kr-kakao-answers">
              {kakaoAnswers.map((qa, i) => (
                <div key={i} className="kr-ka-card">
                  <div className="kr-ka-line">
                    <span className="kr-ka-marker q">Q</span>
                    <span className="kr-ka-q">{qa.name}</span>
                  </div>
                  {qa.values.length > 0 ? (
                    qa.values.map((v, vi) => (
                      <div key={vi} className="kr-ka-line">
                        <span className="kr-ka-marker a">A</span>
                        <span className="kr-ka-a">{v}</span>
                      </div>
                    ))
                  ) : (
                    <div className="kr-ka-line">
                      <span className="kr-ka-marker a">A</span>
                      <span className="kr-ka-a empty">답변 없음</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 진료 정보 */}
        <div>
          <div className="kr-dsection-title">진료 정보</div>
          <div className="kr-dsection">
            <div className="kr-dsection-pad">
              <div className="t-b2-600 c-gray-90">{detail.itemName}</div>
              <div className="kr-dfield"><span className="kr-dfield-label">{detail.priceTitle}</span><span className="kr-dfield-value" style={{ textAlign: 'right' }}>{detail.totalPrice ? won(detail.totalPrice) : '상담 후 결정'}</span></div>
              <hr className="kr-hr" style={{ margin: '8px 0' }} />
              <div className="kr-dfield"><span className="t-b1-500 c-gray-90">예상 결제 금액</span><span className="t-h5-600 c-gray-100" style={{ textAlign: 'right' }}>{detail.totalPrice ? won(detail.totalPrice) : '상담 후 결정'}</span></div>
              <div className="t-c1-400 c-gray-60">방문 후 상담을 통해 변경될 수 있어요</div>
            </div>
          </div>
        </div>

        {/* 상태 변경 이력 */}
        <div>
          <div className="kr-dsection-title">상태 변경 이력</div>
          <div className="kr-dsection">
            <div className="kr-dsection-pad">
              <div className="kr-dfield"><span className="kr-dfield-label">신청일시</span><span className="kr-dfield-value">{detail.tab === 'request' ? detail.repAt : '2026.08.19 09:14'}</span></div>
              <div className="kr-dfield"><span className="kr-dfield-label">확정일시</span><span className="kr-dfield-value">{detail.tab === 'request' ? '-' : detail.repAt}</span></div>
              <div className="kr-dfield"><span className="kr-dfield-label">종료일시</span><span className="kr-dfield-value">{detail.tab === 'closed' ? `${detail.repAt} / ${detail.closedReason}` : '-'}</span></div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

/* =========================================================================
 * ④ 진료 예약 설정
 * ======================================================================= */
function SettingsScreen({
  isLinked,
  autoConfirm,
  setAutoConfirm,
  reservationOn,
  setReservationOn,
  itemCount,
  visibleCount,
  showToast,
}: {
  isLinked: boolean;
  autoConfirm: boolean;
  setAutoConfirm: (v: boolean) => void;
  reservationOn: boolean;
  setReservationOn: (v: boolean) => void;
  itemCount: number;
  visibleCount: number;
  showToast: (m: string, e?: boolean) => void;
}) {
  const [offModal, setOffModal] = useState(false);
  const [stopModal, setStopModal] = useState(false);
  const [sameDay, setSameDay] = useState(true);
  const [newAlarm, setNewAlarm] = useState(true);

  const handleAuto = (next: boolean) => {
    if (next) {
      setAutoConfirm(true); // OFF→ON 즉시
    } else {
      if (isLinked) setOffModal(true); // ON→OFF 연동완료면 모달
      else setAutoConfirm(false);
    }
  };
  const handleReservation = (next: boolean) => {
    if (next) {
      if (visibleCount === 0) {
        showToast('노출 중인 진료항목이 없어, 진료 예약을 받을 수 없습니다.', true);
        return;
      }
      setReservationOn(true);
    } else {
      setStopModal(true);
    }
  };

  return (
    <div className="kr-page">
      <div className="kr-page-head">
        <div className="kr-page-title">진료 예약 설정</div>
        <div className="kr-page-sub">굿닥에 등록한 진료항목으로 예약을 받을 수 있습니다.</div>
      </div>

      <div className="kr-settings">
        {/* 진료 예약 받기 */}
        <div className="kr-box">
          <div className="kr-box-top">
            <div className="kr-box-left">
              <span className="kr-box-title">진료 예약 받기</span>
              <span className="kr-box-sub">
                <span className="num">{itemCount}개의 진료항목이</span> 등록되어 있어요.
              </span>
            </div>
            <div className="kr-box-right">
              <span className={`kr-run-label ${reservationOn ? 'on' : 'off'}`}>{reservationOn ? '운영중' : '미운영'}</span>
              <Toggle checked={reservationOn} onChange={handleReservation} ariaLabel="진료 예약 받기" />
            </div>
          </div>
        </div>

        {/* 설정 섹션 */}
        <div className="kr-settings-section">
          <div className="kr-settings-section-title">설정</div>
          <GuideBanner
            tone="normal"
            message="병원 운영 시간에 맞춰 30분 단위로 예약을 받습니다."
            action={{ label: '병원 운영시간 관리', onClick: () => showToast('병원 운영시간 관리로 이동합니다.') }}
          />

          {/* 예약 자동 확정 */}
          <div className="kr-box">
            <div className="kr-box-top">
              <div className="kr-box-left">
                <span className="kr-box-title">예약 자동 확정</span>
                <span className="kr-box-sub">자동 확정 사용 시, 별도 승인 없이 예약 신청과 동시에 자동으로 확정됩니다.</span>
                {/* 적용 범위 한 줄 안내: 연동완료 && ON (OFF일 땐 아래 블록이 대체) */}
                {isLinked && autoConfirm && (
                  <span className="kr-box-oneliner">카카오톡 예약하기로 받는 예약은 이 설정과 관계없이 자동으로 확정됩니다.</span>
                )}
              </div>
              <div className="kr-box-right">
                <Toggle checked={autoConfirm} onChange={handleAuto} ariaLabel="예약 자동 확정" />
              </div>
            </div>
            {/* 수동 확정 상태 안내 블록: 연동완료 && OFF (warning 톤) */}
            {isLinked && !autoConfirm && (
              <GuideBannerWithDescription
                tone="warning"
                title="카카오톡 예약하기로 받는 예약은 자동으로 확정됩니다"
                items={[
                  '카카오톡 예약하기가 수동 확정을 지원하지 않아 적용된 임시 정책입니다.',
                  '굿닥으로 받는 예약은 수동으로 확정됩니다.',
                  '진료하기 어려운 예약은 예약 신청 내역에서 취소할 수 있습니다.',
                ]}
              />
            )}
          </div>

          {/* 당일 예약 허용 */}
          <div className="kr-box">
            <div className="kr-box-top">
              <div className="kr-box-left">
                <span className="kr-box-title">당일 예약 허용</span>
                <span className="kr-box-sub">당일 예약 허용 시, 현재 시간 기준 1시간 이후부터 당일 예약을 받습니다.</span>
              </div>
              <div className="kr-box-right">
                <Toggle checked={sameDay} onChange={setSameDay} ariaLabel="당일 예약 허용" />
              </div>
            </div>
          </div>

          {/* 새 예약 알림 받기 */}
          <div className="kr-box">
            <div className="kr-box-top">
              <div className="kr-box-left">
                <span className="kr-box-title">새 예약 알림 받기</span>
                <span className="kr-box-sub">새 예약 신청이 발생하면, 이 PC에서 윈도우 알림을 받습니다.</span>
              </div>
              <div className="kr-box-right">
                <Toggle checked={newAlarm} onChange={setNewAlarm} ariaLabel="새 예약 알림 받기" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 자동 확정 끄기 확인 모달 */}
      {offModal && (
        <Modal
          title="카카오톡 예약하기로 받는 예약은 계속 자동으로 확정됩니다"
          onClose={() => setOffModal(false)}
          footer={
            <>
              <button className="kr-btn kr-btn-secondary-smooth" onClick={() => setOffModal(false)}>
                취소
              </button>
              <button
                className="kr-btn kr-btn-primary-solid"
                onClick={() => {
                  setAutoConfirm(false);
                  setOffModal(false);
                }}
              >
                자동 확정 끄기
              </button>
            </>
          }
        >
          카카오톡 예약하기가 수동 확정을 지원하지 않아 적용된 임시 정책입니다.
          <br />
          굿닥으로 받는 예약은 수동으로 확정됩니다.
        </Modal>
      )}

      {/* 진료 예약 받기 중지 확인 모달 */}
      {stopModal && (
        <Modal
          title="진료 예약을 그만 받으시겠어요?"
          onClose={() => setStopModal(false)}
          footer={
            <>
              <button className="kr-btn kr-btn-secondary-smooth" onClick={() => setStopModal(false)}>
                취소
              </button>
              <button
                className="kr-btn kr-btn-primary-solid"
                onClick={() => {
                  setReservationOn(false);
                  setStopModal(false);
                }}
              >
                그만 받기
              </button>
            </>
          }
        >
          그만 받기를 누르면 굿닥에서 진료항목 노출과 예약 신청이 모두 중단돼요. 등록된 진료항목은 그대로 유지되며, 다시 시작하면 바로 예약을 받을 수 있어요.
        </Modal>
      )}
    </div>
  );
}
