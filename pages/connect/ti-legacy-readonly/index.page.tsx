import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';

/**
 * ┌─ 프로토타입 컨텍스트 ───────────────────────────────────
 * 이름     : ti-legacy-readonly — 구 버전 상품을 추천 규격으로 다시 입력받기 (병원 어드민 · 진료항목 목록 + 수정)
 *            예시 = 가다실 9가(규격 행 1회 접종 / 3회 접종). ti-legacy-spec(3안 비교)에서 세화님이 고른 방향 하나만 구현한다.
 * 상태     : 탐색(draft)   버전: v0.4   최종수정: 2026-10-14
 * PRD      : 미발행. 짝 화면 = 트리판 진료항목 목록·등록(out/treatment-create-tree.html)의 추천 항목 규격 행.
 * 배포URL  : 미배포 (로컬 out/ti-legacy-readonly.html 만 있음)
 * 관련 CSS : tiLegacySpecTree.css (트리판 out HTML 패치 <style> 사본 · ti-legacy-spec 과 공유 · 직접 수정 금지)
 *            tiLegacyReadonly.css (이 화면 전용 · lr- 접두사)
 * 기술제약 : react-only · plain CSS · mock · 네트워크 0 · 해시 라우팅(#/items, #/items/<id>)
 *
 * 화면구성 : 상단 프로토 툴바 + 커넥트 셸(LNB) 안에 두 화면.
 *            ① 목록(#/items) — 라이브 트리판 목록과 같은 카테고리 2열 그리드. 테이블 위 요약 한 줄
 *               요약 줄 없음. 추천 규격 불일치 상품은 이름 옆 회색 태그 `가격 재입력 필요`만 붙는다. 분류 미연결 상품은 태그 없음.
 *               처음에는 라이브처럼 첫 카테고리(피부·미용)로 연다.
 *               툴바는 `처음 상태로`만.
 *            ② 수정(#/items/<id>) — 본문은 필수 정보 카드만(분류 트리 · 진료항목명 · 가격 정보) + 하단 [취소/저장].
 *               가격 정보 = 기존 가격 옵션(read-only, 수정·삭제 불가) + 추천 규격 행(빈 상태). 저장 성공 시 기존 영역이 사라진다.
 *               툴바 칩 3개(새 규격 상품 / 가격 재입력 필요 / 분류 미연결)로 예시 상품을 오간다.
 *            목록 시드 = 새 규격 1 · 가격 재입력 필요 3 · 분류 미연결 1 · 일반(피부·미용) 3. 저장 결과는 목록 상태에 반영된다(세션 내).
 *
 * 핵심 결정 (why):
 *   [확정·세화님] 기존 옵션은 read-only 로 남겨 값을 보여 주고, 아래 추천 규격 행은 비워 둔다(자동 채움 없음). (2026-10-14)
 *   [확정·세화님] 추천 규격에 맞게 입력해야만 저장된다. 유효 = 가격을 넣은 행 1개 이상 + 넣은 행의 유형·금액이 올바름
 *                (상담 후 결정은 금액 없이 유효). 저장 성공 시 기존 옵션은 새 규격으로 대체된다. (2026-10-14)
 *   [확정·세화님] 옮겨 적기 보조(금액 복사 등)는 넣지 않는다.
 *   [확정·세화님] 예시는 3종으로 충분하다 — read-only 방식에서는 이름 회차·설명 회차·2회 등 기존 데이터 모양과 무관하게 동작이 같다. (2026-10-14)
 *   [확정·세화님] 목록 태그는 회색(트리판 옵션 수 배지와 같은 스타일). 분류 미연결은 표시하지 않는다. (2026-10-14)
 *   [확정·세화님] 태그는 상태가 아닌 할 일로 명명 — `이전 방식 가격` → `가격 재입력 필요`. 수정 화면 안내·툴바 칩에서도 `이전 방식` 표현을 뺀다. (2026-10-14)
 *   [확정·세화님] 모아 보기 제거 — 병원당 대상이 적고 예방접종 한 카테고리에 몰려 있어 오버스펙.
 *                (2026-10-14)
 *   [확정·세화님] 목록 상단 요약 줄 제거 — 기존 상품은 내부에서 일괄 정리할 예정이고 병원 화면은 남는 소수를 위한 안전망이라 행 태그로 충분하다. (2026-10-14)
 *   [확정·세화님] 규격 행 설명 칸 추가 불가(이미 개발됨) → 저장 직전 확인창 유무 비교. 툴바 세그먼트 [확인창 없음 | 확인창 있음](기본 없음),
 *                `?confirm=1` 로 있음 상태 공유. 있음 = 유효성 통과 후 설명 있는 기존 옵션이 1개 이상이면 모달
 *                (제목 `기존 옵션의 설명은 저장되지 않아요`, 옵션명 · 설명 목록 + 옮겨 적기 안내, [돌아가기]/[저장]). (2026-10-14)
 *   [유지·자체] 확인 모달은 트리판 가격 초기화 모달(.sep-dialog.sep-convert, 560 · radius 16 · 버튼 sep-mbtn)과 같은 마크업. [돌아가기] = 닫기만, 입력값 유지.
 *              ESC 도 [돌아가기]와 같다. 확인창 상태는 목록·수정 화면을 오가도 유지된다.
 *   [유지·자체] 행 단위 검증은 트리판 라이브 규칙을 그대로 쓴다 — 고정 가격 금액 없음/0 = `가격을 입력해 주세요.`,
 *              할인 정상가·판매가 각각 같은 문구, 판매가 ≥ 정상가 = `정상가보다 낮은 가격을 입력해 주세요.`,
 *              판매가 < 정상가×0.51 = `최대 49%까지 할인할 수 있어요.\n(N원 초과)`. 에러는 칸 아래(rg-num-wrap > rg-error), 칸은 빨간 테두리.
 *              저장 실패 시 첫 에러 칸으로 스크롤(라이브 동작 동일).
 *   [유지·자체] "가격을 넣은 행" = 상담 후 결정이거나 금액 칸에 값이 하나라도 있는 행. 유형만 할인으로 바꾸고 비워 둔 행은 안 넣은 행.
 *   [유지·자체] 넣은 행 0개 에러는 트리판에 문구가 없어 새로 썼다 — 규격 행 아래 `가격을 1개 이상 입력해 주세요.`
 *   [유지·자체] 에러는 해당 칸을 고치면 그 칸만 지운다. 묶음 에러는 아무 행이나 고치면 지운다.
 *   [유지·자체] read-only 영역 이름은 `기존 가격 옵션`, 안내 1줄. 드래그 핸들·삭제(X)는 렌더하지 않는다.
 *   [유지·자체] 분류 미연결 상품은 분류 트리에서 HPV 백신 → 가다실 9가를 직접 골라야 연결된다(제안 배너 없음). 범위 밖 분류는 토스트만.
 *   [폐기]      목록 기본 카테고리를 예방접종으로 열던 판단(v0.2) — 철회, 라이브처럼 첫 카테고리. (2026-10-14)
 *   [유지·자체] 중분류가 없는 상품(분류 미연결)은 목록에서 대분류명(예방접종) 그룹 아래에 둔다. 라이브의 미분류 표시는 확인하지 못했다.
 *   [유지·자체] 목록 가격 = 기존 옵션(또는 규격 행) 중 최저가, 2개 이상이면 `~`, 전부 상담이면 `상담 후 결정`. 옆 숫자는 옵션·행 수.
 *   [유지·자체] 일반 상품·새 진료항목 버튼·노출 토글·삭제는 표시만(누르면 범위 밖 토스트 또는 무동작).
 *   [유지·자체] 저장 후에도 수정 화면에 머문다(트리판 동작 미확인). 목록 복귀는 `목록`·`취소`. 취소는 저장 안 한 입력을 버린다.
 *   [유지·자체] 저장 전/후 표시는 툴바와 토스트로만 한다.
 *   [유지·자체] 선택 카테고리는 수정 화면을 다녀와도 유지한다(저장 후 돌아와 태그가 사라진 것을 바로 보도록).
 *   [유지·자체] 분류 미연결 상품의 read-only 안내는 규격 행이 없어 `기존에 등록한 가격이에요. 수정할 수 없어요.`로 둔다.
 *
 * 보류 · TODO:
 *   [보류] 분류 미연결 상품을 연결 전에 저장하면 어떻게 할지 미정 — 지금은 프로토 토스트로 "미정"만 알리고 아무것도 하지 않는다.
 *   [보류] 기존 옵션 설명이 저장 후 사라지는 것을 확인창으로 알릴지 — 있음/없음 비교 중(v0.4).
 *   [보류] 기존 가격 옵션 박스 톤 · 저장 결과 경고 문구 · 목록의 기한/노출 정책 문구 — 세화님 미결정, 넣지 않음.
 *
 * 변경 이력:
 *   v0.4  2026-10-14 — 저장 직전 확인창 있음/없음 비교(툴바 세그먼트 · ?confirm=1 · 설명 손실 확인 모달). 시드 2개 상품 옵션에 설명 추가.
 *   v0.3  2026-10-14 — 태그 `가격 재입력 필요`로 변경, 모아 보기·필터와 요약 줄 제거(목록은 행 태그만), 첫 카테고리로 열기,
 *                      기존 가격 옵션 안내·툴바 칩에서 `이전 방식` 표현 제거.
 *   v0.2  2026-10-14 — 진료항목 목록 화면 추가(LNB 셸, 요약 줄 · 모아 보기 · 회색 태그, 해시 라우팅, 저장 결과 목록 반영).
 *                      예시를 S0~S7 → 3종(새 규격 / 이전 방식 가격 / 분류 미연결)으로 줄이고 나머지 시나리오 데이터·칩 삭제.
 *   v0.1  2026-10-14 — 신규. read-only 기존 옵션 + 빈 규격 행 + 저장 검증 + 저장 후 상태(필수 정보 카드만).
 * └──────────────────────────────────────────────────────
 */

type PType = 'fixed' | 'discount' | 'consult';
type Legacy = { id: string; name: string; type: PType; amount?: number; original?: number; sale?: number; desc?: string };
type SlotKey = '1' | '3';
type Price = { type: PType; amount: string; original: string; sale: string };
type Cat = { l1: string; l2: string | null; l3: string | null };
/** 가다실 9가 예시 상품. chip 이 있는 3개만 툴바 칩으로 보이고, 나머지는 목록 행으로만 쓴다. */
type Example = { id: string; chip?: string; example: string; alias: string; cat: Cat; options: Legacy[]; spec?: Record<SlotKey, Price> };

const SLOTS: { key: SlotKey; label: string }[] = [{ key: '1', label: '1회 접종' }, { key: '3', label: '3회 접종' }];
const PRICE_TYPES: { value: PType; label: string }[] = [
  { value: 'fixed', label: '고정 가격' }, { value: 'discount', label: '할인 가격' }, { value: 'consult', label: '상담 후 결정' }
];
const TYPE_LABEL: Record<PType, string> = { fixed: '고정 가격', discount: '할인 가격', consult: '상담 후 결정' };
const GADASIL: Cat = { l1: '예방접종', l2: 'HPV 백신', l3: '가다실 9가' };
const emptyPrice = (): Price => ({ type: 'fixed', amount: '', original: '', sale: '' });
const emptySpec = (): Record<SlotKey, Price> => ({ '1': emptyPrice(), '3': emptyPrice() });

const EXAMPLES: Example[] = [
  {
    id: 'new', chip: '새 규격 상품', alias: '가다실 9가', cat: GADASIL, options: [],
    example: '이미 추천 규격으로 등록된 상품 — 기존 가격 옵션 영역 없이 평소처럼 보여요.',
    spec: { '1': { type: 'fixed', amount: '230000', original: '', sale: '' }, '3': { type: 'discount', amount: '', original: '690000', sale: '650000' } }
  },
  {
    id: 'legacy', chip: '가격 재입력 필요', alias: '가다실 9가 완납 패키지', cat: GADASIL,
    example: "기존 옵션 3개(설명 2개) — '1회' 고정 220,000 / '2회 완납 시' 할인 500,000→450,000(설명 '2회 접종 필수') / '3회 완납 시' 고정 550,000(설명 '3회 (0,2,6개월)')",
    options: [{ id: 'opt-5101', name: '1회', type: 'fixed', amount: 220000 }, { id: 'opt-5102', name: '2회 완납 시', type: 'discount', original: 500000, sale: 450000, desc: '2회 접종 필수' }, { id: 'opt-5103', name: '3회 완납 시', type: 'fixed', amount: 550000, desc: '3회 (0,2,6개월)' }]
  },
  {
    id: 'unlinked', chip: '분류 미연결', alias: '예방접종', cat: { l1: '예방접종', l2: null, l3: null },
    example: "소분류 미설정 — '자궁경부암(가다실9가) 1회' 200,000 / '…3회' 570,000. 분류를 가다실 9가로 연결해야 규격 행이 생겨요.",
    options: [{ id: 'opt-7101', name: '자궁경부암(가다실9가) 1회', type: 'fixed', amount: 200000 }, { id: 'opt-7102', name: '자궁경부암(가다실9가) 3회', type: 'fixed', amount: 570000 }]
  },
  {
    id: 'legacy2', alias: '가다실 9가 접종', cat: GADASIL,
    example: "기존 옵션 2개(설명 1개) — '1회' 고정 210,000(설명 '진료비 포함 금액입니다') / '3회 (완납)' 고정 610,000",
    options: [{ id: 'opt-1101', name: '1회', type: 'fixed', amount: 210000, desc: '진료비 포함 금액입니다' }, { id: 'opt-1102', name: '3회 (완납)', type: 'fixed', amount: 610000 }]
  },
  {
    id: 'legacy3', alias: '가다실 9가 상담', cat: GADASIL,
    example: "기존 옵션 1개(설명 없음) — '가다실 9가 접종' 상담 후 결정. 확인창 있음이어도 바로 저장되는 대조군",
    options: [{ id: 'opt-4101', name: '가다실 9가 접종', type: 'consult' }]
  }
];
const CHIPS = EXAMPLES.filter((e) => e.chip);

const nf = (v: string | number) => String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const digits = (s: string) => s.replace(/[^0-9]/g, '');

/* ============================ 저장 검증 (한 곳) ============================ */
type Errors = Record<string, string>;
/** 가격을 넣은 행 = 상담 후 결정이거나 금액 칸에 값이 하나라도 있는 행 */
const isEntered = (p: Price) => p.type === 'consult' || (p.type === 'fixed' ? !!p.amount : !!(p.original || p.sale));
function validateSpec(spec: Record<SlotKey, Price>): Errors {
  const e: Errors = {};
  const entered = SLOTS.filter(({ key }) => isEntered(spec[key]));
  if (!entered.length) { e.group = '가격을 1개 이상 입력해 주세요.'; return e; }
  entered.forEach(({ key }) => {
    const p = spec[key];
    if (p.type === 'fixed' && !(Number(p.amount) > 0)) e[`${key}-amount`] = '가격을 입력해 주세요.';
    if (p.type === 'discount') {
      const o = Number(p.original); const s = Number(p.sale);
      if (!(o > 0)) e[`${key}-original`] = '가격을 입력해 주세요.';
      if (!(s > 0)) e[`${key}-sale`] = '가격을 입력해 주세요.';
      if (o > 0 && s > 0) {
        if (s >= o) e[`${key}-sale`] = '정상가보다 낮은 가격을 입력해 주세요.';
        else if (s < o * 0.51) e[`${key}-sale`] = `최대 49%까지 할인할 수 있어요.\n(${nf(Math.ceil(o * 0.51) - s)}원 초과)`;
      }
    }
  });
  return e;
}

/* ============================ 아이콘 ============================ */
const SearchIcon = () => (<svg viewBox="0 0 18 18" fill="none"><circle cx="8" cy="8" r="5.25" stroke="currentColor" strokeWidth="1.5" /><path d="M12.5 12.5L16 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>);
const SelectArrow = () => (<svg viewBox="0 0 16 16" fill="none"><path fillRule="evenodd" clipRule="evenodd" d="M2.862 5.529c.26-.26.682-.26.943 0L8 9.724l4.195-4.195c.26-.26.683-.26.943 0 .26.26.26.682 0 .943l-4.667 4.666c-.26.26-.682.26-.943 0L2.862 6.472c-.26-.26-.26-.683 0-.943z" fill="currentColor" /></svg>);

/* ============================ 컨트롤 ============================ */
function TypeSelect({ value, onChange }: { value: PType; onChange: (v: PType) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (!open) return undefined;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);
  return (
    <div className="rg-select-wrap" ref={ref}>
      <button type="button" className={`rg-select${open ? ' open' : ''}`} onClick={() => setOpen((v) => !v)}>{TYPE_LABEL[value]}<span className="rg-select-ic"><SelectArrow /></span></button>
      {open && <div className="rg-select-menu">{PRICE_TYPES.map((t) => (
        <button key={t.value} type="button" className={`rg-select-opt${t.value === value ? ' active' : ''}`} onClick={() => { onChange(t.value); setOpen(false); }}>{t.label}</button>
      ))}</div>}
    </div>
  );
}

function Num({ value, ph, err, onChange }: { value: string; ph: string; err?: string; onChange: (v: string) => void }) {
  return (
    <div className="rg-num-wrap">
      <input className={`rg-num${err ? ' error' : ''}`} placeholder={ph} value={value} onChange={(e) => onChange(digits(e.target.value))} />
      {err && <p className="rg-error">{err}</p>}
    </div>
  );
}

/** 기존 가격 옵션 1행 — 트리판 자유 옵션 행 마크업을 쓰되 전부 read-only, 핸들·삭제 없음 */
function LegacyRow({ o }: { o: Legacy }) {
  return (
    <div className="rg-price-row tk-price-row lr-ro-row">
      <div className="lr-ro-gutter" />
      <div className="rg-price-fields">
        <input aria-label="가격 옵션명" className="rg-input" readOnly tabIndex={-1} value={o.name} />
        <input aria-label="가격 설명" className="rg-input" readOnly tabIndex={-1} value={o.desc || ''} placeholder="설명 없음" />
        <div className="rg-price-entry">
          <div className="rg-select-wrap"><button type="button" className="rg-select" disabled>{TYPE_LABEL[o.type]}<span className="rg-select-ic"><SelectArrow /></span></button></div>
          {o.type === 'fixed' && (<><input className="rg-num" disabled readOnly value={o.amount ?? ''} /><span className="rg-unit">원</span></>)}
          {o.type === 'discount' && (<><input className="rg-num" disabled readOnly value={o.original ?? ''} /><span className="rg-price-arrow">→</span><input className="rg-num" disabled readOnly value={o.sale ?? ''} /><span className="rg-unit">원</span></>)}
          {o.type === 'consult' && (<><input className="rg-num" disabled readOnly aria-label="상담 후 결정" value="0" /><span className="rg-unit">원</span></>)}
        </div>
      </div>
    </div>
  );
}

const TREE_L1 = ['추천 항목', '건강관리', '관절·척추', '귀·코·목', '남성건강', '눈·시력', '다이어트', '성형', '수면관리', '수액', '여성건강', '예방접종', '정신건강', '치아·구강', '피부·미용', '한방치료'];
const TREE_L2 = ['독감 백신', 'HPV 백신', '대상포진 백신', '폐렴구균 백신', 'A형 간염 백신', 'B형 간염 백신', 'Hib 백신', '파상풍 백신', 'RSV 백신', '장티푸스', '홍역·풍진·볼거리 백신', '일본뇌염 백신', '기타'];
const TREE_L3: Record<string, string[]> = { 'HPV 백신': ['가다실 9가', '기타'] };

function TreeCol({ head, rows, sel, empty, onPick }: { head: string; rows: string[]; sel: string | null; empty?: string; onPick: (r: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const body = ref.current; if (!body) return;
    const el = body.querySelector('.tt-row.sel') as HTMLElement | null;
    body.scrollTop = el ? Math.max(0, el.offsetTop - body.offsetTop - 96) : 0;
  }, [sel, rows.length]);
  return (
    <div className="tt-col">
      <div className="tt-col-head">{head}</div>
      <div className="tt-col-body" ref={ref}>
        {rows.length === 0 && empty ? <div className="tt-empty">{empty}</div> : rows.map((r) => (
          <button key={r} type="button" className={`tt-row${r === sel ? ' sel' : ''}`} aria-pressed={r === sel} onClick={() => onPick(r)}>
            <span className="tt-name">{r}</span>{r === '가다실 9가' && <span className="tt-reg">1</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ============================ 목록 상태 ============================ */
type Item = {
  id: string; ex: Example | null; alias: string; cat: Cat; options: Legacy[]; spec: Record<SlotKey, Price> | null;
  general?: { price: string; count: number; visible: boolean };
};
const seedItems = (): Item[] => [
  { id: 'g1', ex: null, alias: '리쥬란 힐러', cat: { l1: '피부·미용', l2: '스킨부스터', l3: null }, options: [], spec: null, general: { price: '250,000원~', count: 2, visible: true } },
  { id: 'g2', ex: null, alias: '물광주사', cat: { l1: '피부·미용', l2: '스킨부스터', l3: null }, options: [], spec: null, general: { price: '120,000원', count: 1, visible: true } },
  { id: 'g3', ex: null, alias: '레이저 토닝', cat: { l1: '피부·미용', l2: '기미·색소·미백', l3: null }, options: [], spec: null, general: { price: '80,000원~', count: 2, visible: true } },
  ...EXAMPLES.map((e) => ({
    id: e.id, ex: e, alias: e.alias, cat: { ...e.cat }, options: e.options.map((o) => ({ ...o })),
    spec: e.spec ? { '1': { ...e.spec['1'] }, '3': { ...e.spec['3'] } } : null
  }))
];
const CAT_ORDER = ['피부·미용', '예방접종'];
/** 추천 규격 불일치 = 소분류가 규격 상품(가다실 9가)인데 기존 자유 옵션이 남아 있는 상품. 분류 미연결은 제외. */
const isLegacy = (it: Item) => it.cat.l3 === '가다실 9가' && it.options.length > 0;
function listPrice(it: Item): { text: string; count: number } {
  if (it.general) return { text: it.general.price, count: it.general.count };
  const ps: Price[] = it.options.length
    ? it.options.map((o) => ({ type: o.type, amount: String(o.amount ?? ''), original: String(o.original ?? ''), sale: String(o.sale ?? '') }))
    : it.spec ? SLOTS.map(({ key }) => it.spec![key]).filter(isEntered) : [];
  if (!ps.length) return { text: '가격 입력 전', count: 0 };
  const nums = ps.filter((p) => p.type !== 'consult').map((p) => Number(p.type === 'discount' ? p.sale : p.amount)).filter((n) => n > 0);
  if (!nums.length) return { text: '상담 후 결정', count: ps.length };
  return { text: `${nf(Math.min(...nums))}원${ps.length > 1 ? '~' : ''}`, count: ps.length };
}

/* ============================ 아이콘(목록 · LNB) ============================ */
const ChevronR = () => (<svg viewBox="0 0 12 12" fill="none"><path d="M4.5 2.5L8 6l-3.5 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>);
const ChevronD = () => (<svg viewBox="0 0 12 12" fill="none"><path d="M2.5 4.5L6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>);
const Back = () => (<svg viewBox="0 0 20 20" fill="none"><path d="M12 5l-5 5 5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>);
const PlusIcon = () => (<svg viewBox="0 0 18 18" fill="none"><path d="M9 4v10M4 9h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>);
const Handle = () => (<svg width="6" height="10" viewBox="0 0 6 10" fill="none"><rect width="2.25" height="2.30769" rx="1.125" fill="currentColor" /><rect x="3.75" width="2.25" height="2.30769" rx="1.125" fill="currentColor" /><rect y="3.84619" width="2.25" height="2.30769" rx="1.125" fill="currentColor" /><rect x="3.75" y="3.84619" width="2.25" height="2.30769" rx="1.125" fill="currentColor" /><rect y="7.69226" width="2.25" height="2.30769" rx="1.125" fill="currentColor" /><rect x="3.75" y="7.69226" width="2.25" height="2.30769" rx="1.125" fill="currentColor" /></svg>);
const ThumbEmpty = () => (<svg viewBox="0 0 36 36" fill="none"><rect width="36" height="36" rx="6" fill="#F2F4F6" /><path d="M11 23l4.5-5 3 3.2L22 17l4 6" stroke="#B0B8C1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><circle cx="14" cy="14" r="1.6" fill="#B0B8C1" /></svg>);
const GdMark = () => (<svg viewBox="0 0 27 43" fill="none"><path d="M13.1516 36.3658C9.90902 36.3658 7.21826 33.9857 6.74251 30.8897H0.0390015C0.542057 37.65 6.2297 42.9981 13.1516 42.9981C20.0735 42.9981 25.7611 37.65 26.2642 30.8897H19.5587C19.0849 33.9857 16.3922 36.3658 13.1496 36.3658H13.1516Z" fill="#fff" /><path d="M26.2895 0H19.5197V6.61479H26.2895V0Z" fill="#41D293" /><path d="M13.1516 4.96207C5.90017 4.96207 0 10.832 0 18.0462C0 25.2603 5.90017 31.1302 13.1516 31.1302C20.403 31.1302 26.3032 25.2603 26.3032 18.0462C26.3032 10.832 20.403 4.96207 13.1516 4.96207ZM13.1516 24.498C9.5756 24.498 6.66646 21.6038 6.66646 18.0462C6.66646 14.4885 9.5756 11.5943 13.1516 11.5943C16.7276 11.5943 19.6367 14.4885 19.6367 18.0462C19.6367 21.6038 16.7276 24.498 13.1516 24.498V24.498Z" fill="#fff" /></svg>);
const KkoMark = () => (<svg viewBox="0 0 20 20" fill="none"><rect width="20" height="20" rx="5" fill="#FEE500" /><path d="M10 5.1c-2.9 0-5.2 1.8-5.2 4 0 1.4.95 2.62 2.38 3.32-.1.36-.37 1.34-.42 1.55 0 0-.02.09.04.12.06.03.13 0 .13 0 .17-.02 1.9-1.28 2.2-1.5.29.04.58.06.87.06 2.9 0 5.2-1.8 5.2-4S12.9 5.1 10 5.1z" fill="#3C1E1E" /></svg>);
const DelIcon = () => (<svg viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>);

function SideNav() {
  const N = ({ label, sub, active, beta, ex }: { label: string; sub?: boolean; active?: boolean; beta?: boolean; ex?: 'r' | 'd' }) => (
    <button className={`cn-nav-item${sub ? ' sub' : ''}${active ? ' active' : ''}`}>
      <span className="cn-nav-label-wrap"><span className="cn-nav-label">{label}</span>{beta && <span className="cn-beta">beta</span>}</span>
      {ex && <span className="cn-chevron">{ex === 'r' ? <ChevronR /> : <ChevronD />}</span>}
    </button>
  );
  return (
    <nav className="cn-nav">
      <div className="cn-nav-scroll">
        <div className="cn-nav-group">
          <div className="cn-nav-header">서비스 운영</div>
          <N label="차트 접수·예약" ex="r" /><N label="진료 예약" beta ex="d" />
          <N label="예약 신청 내역" sub /><N label="진료항목" sub active /><N label="진료 예약 설정" sub />
          <N label="병원 약관" ex="r" />
        </div>
        <div className="cn-nav-divider"><span /></div>
        <div className="cn-nav-group">
          <div className="cn-nav-header">병원 홍보</div>
          <N label="병원 검색 정보" ex="r" /><N label="병원 소식 알림" ex="r" />
        </div>
        <div className="cn-nav-divider"><span /></div>
        <div className="cn-nav-group">
          <div className="cn-nav-header">외부 플랫폼 연동</div>
          <N label="카카오톡 예약하기" ex="r" /><N label="연동 설정" />
        </div>
      </div>
      <div className="cn-nav-footer"><div className="cn-nav-divider"><span /></div><N label="고객센터" /><N label="환경 설정" /></div>
    </nav>
  );
}

/* ============================ 목록 ============================ */
function ListView({ items, open, toast, cat, setCat }: { items: Item[]; open: (id: string) => void; toast: (s: string) => void; cat: string; setCat: (c: string) => void }) {
  const cats = CAT_ORDER.map((c) => ({ name: c, count: items.filter((i) => i.cat.l1 === c).length })).filter((c) => c.count > 0);
  const curCat = cats.some((c) => c.name === cat) ? cat : cats[0]?.name;
  const rows = items.filter((i) => i.cat.l1 === curCat);
  const groups: { name: string; rows: Item[] }[] = [];
  rows.forEach((r) => {
    const g = r.cat.l2 || r.cat.l1; // 중분류 없는 상품(분류 미연결)은 대분류명 그룹
    const hit = groups.find((x) => x.name === g);
    if (hit) hit.rows.push(r); else groups.push({ name: g, rows: [r] });
  });

  return (
    <main className="cn-main rg-main tk-main">
      <div className="cn-header tk-list-header">
        <div>
          <div className="cn-header-title">진료항목</div>
          <div className="tk-list-sub">굿닥에 노출되는 우리 병원 진료항목과 가격 정보를 관리할 수 있어요. 카카오톡 예약하기에서도 보이는지 여기서 확인해요.</div>
        </div>
        <button className="tk-btn-primary" onClick={() => toast('프로토 범위 밖이에요.')}><PlusIcon /> 새 진료항목</button>
      </div>
      <div className="tk-list-body">
        <div className="tk-grid">
          <div className="tk-grid-chead"><span className="tk-grid-title">카테고리</span></div>
          <div className="tk-grid-ihead"><span className="tk-grid-title">{curCat}</span></div>
          <nav className="tk-grid-clist" aria-label="진료항목 카테고리">
            {cats.map((c) => (
              <button key={c.name} className={`tk-cat${c.name === curCat ? ' sel' : ''}`} onClick={() => setCat(c.name)}>
                <span className="tk-cat-handle"><Handle /></span><span className="tk-cat-name">{c.name}</span><span className="tk-cat-count">{c.count}</span>
              </button>
            ))}
          </nav>
          <section className="tk-grid-ilist">
            {groups.map((g) => (
              <div key={g.name} className="tk-l2">
                <div className="tk-l2-head"><span className="tk-cat-handle"><Handle /></span><span className="tk-l2-name">{g.name}</span></div>
                <div className="tk-l2-body">
                  {g.rows.map((it) => {
                    const lp = listPrice(it);
                    const vis = it.general ? it.general.visible : true;
                    return (
                      <div key={it.id} className="tk-l3" data-id={it.id}>
                        <span className="tk-l3-handle"><Handle /></span>
                        <button className="tk-l3-detail" onClick={() => (it.ex ? open(it.id) : toast('프로토 범위 밖 상품이에요.'))}>
                          <span className="tk-l3-name lr-name"><span className="lr-name-text">{it.alias}</span>{isLegacy(it) && <span className="lr-legacy-tag">가격 재입력 필요</span>}</span>
                          <span className="tk-l3-price"><span className="tk-l3-price-text">{lp.text}</span>{lp.count > 0 && <span className="tk-l3-optcount">{lp.count}</span>}</span>
                          <span className="tk-l3-thumb"><ThumbEmpty /></span>
                          <span className="tk-chans">
                            <span className={`tk-chan tk-chan-gd${vis ? '' : ' dim'}`} title="굿닥에서 보임"><GdMark /></span>
                            <span className="tk-chan tk-chan-kko dim" title="카카오톡 예약하기에서 안 보임"><KkoMark /></span>
                          </span>
                        </button>
                        <span className={`tk-l3-visible${vis ? ' on' : ''}`}>{vis ? '노출중' : '미노출'}</span>
                        <button className={`rg-toggle${vis ? '' : ' off'}`} aria-label="굿닥 노출 토글"><span className="rg-toggle-knob" /></button>
                        <button className="tk-l3-del" aria-label="삭제"><DelIcon /></button>
                      </div>
                    );
                  })}
                </div>
                <div className="tk-l2-pad" />
              </div>
            ))}
          </section>
        </div>
      </div>
    </main>
  );
}

/* ============================ 수정 화면(필수 정보 카드만) ============================ */
type Commit = { alias: string; cat: Cat; options: Legacy[]; spec: Record<SlotKey, Price> };
/** 저장 직전 확인 — 트리판 가격 초기화 모달과 같은 마크업 */
function LossDialog({ items, onClose, onConfirm }: { items: Legacy[]; onClose: () => void; onConfirm: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { ref.current?.showModal(); }, []);
  return (
    <dialog ref={ref} className="sep-dialog sep-convert" aria-labelledby="lr-loss-title" onCancel={(e) => { e.preventDefault(); onClose(); }}>
      <div className="sep-convert-text">
        <h2 id="lr-loss-title">기존 옵션의 설명은 저장되지 않아요</h2>
        <div className="sep-convert-body">
          <ul className="lr-loss-list">{items.map((o) => <li key={o.id}>{o.name} · {o.desc}</li>)}</ul>
          <p>필요한 내용은 상세 소개나 유의사항에 옮겨 적어 주세요.</p>
        </div>
      </div>
      <div className="sep-convert-foot">
        <button type="button" autoFocus className="sep-mbtn cancel" onClick={onClose}>돌아가기</button>
        <button type="button" className="sep-mbtn primary" onClick={onConfirm}>저장</button>
      </div>
    </dialog>
  );
}

function Editor({ item, toast, onCommit, onBack, onSaved, confirmMode }: { item: Item; toast: (s: string) => void; onCommit: (c: Commit) => void; onBack: () => void; onSaved: (v: boolean) => void; confirmMode: boolean }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cat, setCat] = useState<Cat>(item.cat);
  const [alias, setAlias] = useState(item.alias);
  const [spec, setSpec] = useState<Record<SlotKey, Price>>(() => (item.spec ? { '1': { ...item.spec['1'] }, '3': { ...item.spec['3'] } } : emptySpec()));
  const [legacy, setLegacy] = useState<Legacy[]>(item.options);
  const [errors, setErrors] = useState<Errors>({});
  const linked = cat.l3 === '가다실 9가';

  const outOfScope = () => toast('프로토 범위 밖 분류예요.');
  const pickL1 = (r: string) => { if (r !== cat.l1) outOfScope(); };
  const pickL2 = (r: string) => {
    if (linked) { if (r !== cat.l2) outOfScope(); return; }
    if (r === 'HPV 백신') setCat({ ...cat, l2: r, l3: null }); else outOfScope();
  };
  const pickL3 = (r: string) => {
    if (linked) { if (r !== cat.l3) outOfScope(); return; }
    if (r === '가다실 9가') { setCat({ ...cat, l3: r }); toast("분류를 '가다실 9가'로 연결했어요."); } else outOfScope();
  };

  const setSlot = (k: SlotKey, u: Partial<Price>, field?: string) => {
    setSpec((s) => ({ ...s, [k]: { ...s[k], ...u } }));
    setErrors((e) => {
      const n = { ...e }; delete n.group;
      if (field) delete n[`${k}-${field}`]; else { delete n[`${k}-amount`]; delete n[`${k}-original`]; delete n[`${k}-sale`]; }
      return n;
    });
  };

  const save = () => {
    if (!linked) { toast('프로토 · 분류 연결 전 저장 동작은 아직 정하지 않았어요.'); return; }
    const e = validateSpec(spec);
    setErrors(e);
    if (Object.keys(e).length) {
      requestAnimationFrame(() => (document.querySelector('.rg-num.error, .lr-group-error') as HTMLElement | null)?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
      return;
    }
    // 확인창 있음: 설명이 있는 기존 옵션이 하나라도 있으면 저장 전에 확인받는다(유효성 통과 뒤에만).
    if (confirmMode && legacy.some((o) => o.desc)) { setConfirmOpen(true); return; }
    commit();
  };

  const commit = () => {
    setConfirmOpen(false);
    // 저장 성공 — 기존 옵션은 새 규격으로 대체된다. 빈 행은 저장하지 않으므로 기본값으로 되돌린다.
    const clean = { '1': isEntered(spec['1']) ? spec['1'] : emptyPrice(), '3': isEntered(spec['3']) ? spec['3'] : emptyPrice() };
    setLegacy([]);
    setSpec(clean);
    onCommit({ alias, cat, options: [], spec: clean });
    onSaved(true);
    toast('저장했어요.');
  };

  return (
    <main className="cn-main rg-main tk-main lr-main">
      <div className="cn-header tk-form-header">
        <button className="tk-back" onClick={onBack}><Back /> 목록</button>
        <div className="rg-eyebrow">진료항목 <span className="sep-preview-label">검토용 시안 · 실제 서비스 아님</span></div>
        <div className="cn-header-title">진료항목 정보</div>
      </div>
      <div className="rg-container">
        <div className="rg-form">
          <section className="rg-card required">
            <div className="rg-group-title">필수 정보</div>
            <div className="rg-field sep-category">
              <div className="rg-field-head">
                <span className="rg-label">진료항목 분류</span>
                <span className="rg-help">예약받을 진료항목의 분류를 선택해 주세요. 이전 분류를 고르면 다음 분류가 나타나요.</span>
              </div>
              <div className="tt-search-wrap"><div className="tt-search">
                <input className="tt-search-input" aria-label="분류 검색" placeholder="진료명이나 제품명을 검색해 주세요. (예: 독감, 가다실)" readOnly />
                <span className="tt-search-ic"><SearchIcon /></span>
              </div></div>
              <div className="tt-tree">
                <TreeCol head="대분류" rows={TREE_L1} sel={cat.l1} onPick={pickL1} />
                <TreeCol head="중분류" rows={TREE_L2} sel={cat.l2} onPick={pickL2} />
                <TreeCol head="소분류" rows={cat.l2 ? TREE_L3[cat.l2] || [] : []} sel={cat.l3} empty="중분류를 고르면 소분류가 나타나요." onPick={pickL3} />
              </div>
            </div>

            <div className="rg-field alias">
              <div className="rg-field-head"><span className="rg-label">진료항목명</span><span className="rg-help">굿닥 이용자에게 보여질 이름을 입력해 주세요.</span></div>
              <input aria-label="진료항목명" className="rg-input" placeholder="예) 가다실 9가 접종, 영유아 검진" maxLength={50} value={alias} onChange={(e) => setAlias(e.target.value)} />
              <div className="rg-extra"><div className="rg-counter"><span className="rg-counter-num">{alias.length}</span>/50자</div></div>
            </div>

            <div className="rg-field price">
              <div className="tc-price-head">
                <div className="rg-field-head"><span className="rg-label">가격 정보</span>
                  <span className="rg-help">{linked ? '취급하는 항목에만 가격을 입력해 주세요. 가격을 넣은 항목만 이용자에게 보여져요.' : '이용자에게 보여줄 가격 정보를 설정해 주세요. (예: 횟수별, 시술명별 등)'}</span>
                </div>
              </div>

              {legacy.length > 0 && (
                <div className="lr-ro">
                  <div className="lr-ro-head">
                    <span className="lr-ro-title">기존 가격 옵션</span>
                    <span className="rg-help">{linked ? '가격 입력 형식이 바뀌었어요. 아래 항목에 가격을 다시 입력해야 저장할 수 있어요.' : '기존에 등록한 가격이에요. 수정할 수 없어요.'}</span>
                  </div>
                  <div className="rg-price-list">{legacy.map((o) => <LegacyRow key={o.id} o={o} />)}</div>
                </div>
              )}

              {linked && (
                <div className="lr-slots">
                  {SLOTS.map(({ key, label }) => {
                    const p = spec[key];
                    return (
                      <div key={key} className="lr-slot">
                        <div className="lr-slot-label">{label}</div>
                        <div className="rg-price-entry">
                          <TypeSelect value={p.type} onChange={(t) => setSlot(key, { type: t })} />
                          {p.type === 'fixed' && (<><Num value={p.amount} ph="0" err={errors[`${key}-amount`]} onChange={(v) => setSlot(key, { amount: v }, 'amount')} /><span className="rg-unit">원</span></>)}
                          {p.type === 'discount' && (<>
                            <Num value={p.original} ph="정상가" err={errors[`${key}-original`]} onChange={(v) => setSlot(key, { original: v }, 'original')} />
                            <span className="rg-price-arrow">→</span>
                            <Num value={p.sale} ph="판매가" err={errors[`${key}-sale`]} onChange={(v) => setSlot(key, { sale: v }, 'sale')} />
                            <span className="rg-unit">원</span>
                          </>)}
                          {p.type === 'consult' && (<><input className="rg-num" disabled readOnly aria-label="상담 후 결정" value="0" /><span className="rg-unit">원</span></>)}
                        </div>
                      </div>
                    );
                  })}
                  {errors.group && <p className="rg-error lr-group-error" role="alert">{errors.group}</p>}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
      {confirmOpen && <LossDialog items={legacy.filter((o) => o.desc)} onClose={() => setConfirmOpen(false)} onConfirm={commit} />}
      <div className="rg-footer">
        <div className="rg-footer-left">
          <button className="rg-btn-cancel" onClick={onBack}>취소</button>
          <button className="rg-btn-save" onClick={save}>저장</button>
        </div>
      </div>
    </main>
  );
}

/* ============================ 페이지 · 라우팅 ============================ */
const parseHash = (): { view: 'list' } | { view: 'edit'; id: string } => {
  const m = /^#\/items\/([a-z0-9-]+)$/.exec(window.location.hash);
  return m ? { view: 'edit', id: m[1] } : { view: 'list' };
};

export default function Page() {
  const [items, setItems] = useState<Item[]>(seedItems);
  const [route, setRoute] = useState(parseHash);
  const [resetKey, setResetKey] = useState(0);
  const [saved, setSaved] = useState(false);
  // 저장 직전 확인창 있음/없음 — URL 쿼리 ?confirm=1 과 동기화(해시 라우팅과 독립)
  const [confirmMode, setConfirmModeState] = useState(() => new URLSearchParams(window.location.search).get('confirm') === '1');
  const setConfirmMode = (v: boolean) => {
    setConfirmModeState(v);
    const q = new URLSearchParams(window.location.search);
    if (v) q.set('confirm', '1'); else q.delete('confirm');
    const qs = q.toString();
    window.history.replaceState(null, '', `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash}`);
  };
  // 목록의 선택 카테고리는 수정 화면을 다녀와도 유지한다. 처음은 라이브처럼 첫 카테고리.
  const [listCat, setListCat] = useState(CAT_ORDER[0]);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const tbRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!/^#\/items/.test(window.location.hash)) window.history.replaceState(null, '', '#/items');
    const h = () => { setRoute(parseHash()); setSaved(false); window.scrollTo(0, 0); };
    window.addEventListener('hashchange', h);
    return () => window.removeEventListener('hashchange', h);
  }, []);

  useLayoutEffect(() => {
    const tb = tbRef.current; const root = rootRef.current;
    if (!tb || !root) return undefined;
    const apply = () => root.style.setProperty('--lr-tb', `${tb.offsetHeight}px`);
    apply();
    const ro = new ResizeObserver(apply); ro.observe(tb);
    return () => ro.disconnect();
  }, []);

  const toast = (s: string) => {
    setToastMsg(s);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setToastMsg(null), 2400);
  };
  const go = (hash: string) => { window.location.hash = hash; };
  const reset = () => { setItems(seedItems()); setSaved(false); setListCat(CAT_ORDER[0]); setResetKey((k) => k + 1); };

  const editItem = route.view === 'edit' ? items.find((i) => i.id === route.id && i.ex) : undefined;
  const ex = editItem ? editItem.ex : null;

  return (
    <div className="lr-root" ref={rootRef}>
      <div className="lr-toolbar" ref={tbRef}>
        <div className="lr-tb-row">
          <span className="lr-tb-badge">PROTOTYPE</span>
          <span className="lr-tb-title">구 버전 상품 → 추천 규격 다시 입력 <em>ti-legacy-readonly v0.4</em></span>
          <span className="lr-tb-sp" />
          <div className="lr-seg" role="group" aria-label="저장 직전 확인창">
            <button type="button" className={confirmMode ? '' : 'on'} onClick={() => setConfirmMode(false)}>확인창 없음</button>
            <button type="button" className={confirmMode ? 'on' : ''} onClick={() => setConfirmMode(true)}>확인창 있음</button>
          </div>
          {editItem && <span className={`lr-tb-state${saved ? ' on' : ''}`}>{saved ? '저장 후' : '저장 전'}</span>}
          <button type="button" className="lr-tb-btn" onClick={reset}>처음 상태로</button>
        </div>
        {editItem && ex && (<>
          <div className="lr-tb-row">
            <span className="lr-tb-label">상품</span>
            <div className="lr-chips">
              {CHIPS.map((c) => (
                <button key={c.id} type="button" className={`lr-chip${c.id === ex.id ? ' on' : ''}`} onClick={() => go(`#/items/${c.id}`)} title={c.example}>{c.chip}</button>
              ))}
            </div>
          </div>
          <div className="lr-tb-row"><span className="lr-tb-label" /><span className="lr-tb-example">{ex.example}</span></div>
        </>)}
      </div>

      <div className="cn-artboard">
        <div className="cn-screen">
          <div className="cn-body">
            <SideNav />
            {editItem
              ? <Editor key={`${editItem.id}-${resetKey}`} item={editItem} confirmMode={confirmMode} toast={toast} onSaved={setSaved} onBack={() => go('#/items')}
                  onCommit={(c) => setItems((xs) => xs.map((x) => (x.id === editItem.id ? { ...x, ...c } : x)))} />
              : <ListView key={resetKey} items={items} open={(id) => go(`#/items/${id}`)} toast={toast} cat={listCat} setCat={setListCat} />}
          </div>
        </div>
      </div>
      {toastMsg && <div className="lr-toast" role="status">{toastMsg}</div>}
    </div>
  );
}
