import React, { useLayoutEffect, useRef, useState } from 'react';

/**
 * ┌─ 프로토타입 컨텍스트 ───────────────────────────────────
 * 이름     : ti-legacy-readonly — 구 버전 상품을 추천 규격으로 다시 입력받기 (병원 어드민 · 진료항목 수정 · 필수 정보 카드만)
 *            예시 = 가다실 9가(규격 행 1회 접종 / 3회 접종). ti-legacy-spec(3안 비교)에서 세화님이 고른 방향 하나만 구현한다.
 * 상태     : 탐색(draft)   버전: v0.1   최종수정: 2026-10-14
 * PRD      : 미발행. 짝 화면 = 트리판 진료항목 등록(out/treatment-create-tree.html)의 추천 항목 규격 행.
 * 배포URL  : 미배포 (로컬 out/ti-legacy-readonly.html 만 있음)
 * 관련 CSS : tiLegacySpecTree.css (트리판 out HTML 패치 <style> 사본 · ti-legacy-spec 과 공유 · 직접 수정 금지)
 *            tiLegacyReadonly.css (이 화면 전용 · lr- 접두사)
 * 기술제약 : react-only · plain CSS · mock · 네트워크 0
 *
 * 화면구성 : 상단 프로토 툴바(시나리오 칩 S0 새 규격 상품 + S1~S7 · 처음 상태로 · 저장 전/후 표시)
 *            + 필수 정보 카드(분류 트리 · 진료항목명 · 가격 정보) + 하단 [취소/저장] 바. LNB·추가 정보·미리보기 폰은 넣지 않는다.
 *            가격 정보 = ① 기존 가격 옵션(read-only, 이름·설명·유형·금액 표시, 수정·삭제 불가) ② 추천 규격 행(빈 상태).
 *            저장 성공 시 ① 이 사라지고 ② 의 값만 남는다(저장 후 상태).
 *
 * 핵심 결정 (why):
 *   [확정·세화님] 기존 옵션은 read-only 로 남겨 값을 보여 주고, 아래 추천 규격 행은 비워 둔다(자동 채움 없음). (2026-10-14)
 *   [확정·세화님] 추천 규격에 맞게 입력해야만 저장된다. 유효 = 가격을 넣은 행 1개 이상 + 넣은 행의 유형·금액이 올바름
 *                (상담 후 결정은 금액 없이 유효). 저장 성공 시 기존 옵션은 새 규격으로 대체된다. (2026-10-14)
 *   [확정·세화님] 옮겨 적기 보조(금액 복사 등)는 넣지 않는다.
 *   [유지·자체] 행 단위 검증은 트리판 라이브 규칙을 그대로 쓴다 — 고정 가격 금액 없음/0 = `가격을 입력해 주세요.`,
 *              할인 정상가·판매가 각각 같은 문구, 판매가 ≥ 정상가 = `정상가보다 낮은 가격을 입력해 주세요.`,
 *              판매가 < 정상가×0.51 = `최대 49%까지 할인할 수 있어요.\n(N원 초과)`. 에러는 칸 아래(rg-num-wrap > rg-error), 칸은 빨간 테두리.
 *              저장 실패 시 첫 에러 칸으로 스크롤(라이브 동작 동일).
 *   [유지·자체] "가격을 넣은 행" 판정 = 상담 후 결정이거나 금액 칸에 값이 하나라도 있는 행. 유형만 할인으로 바꾸고 비워 둔 행은 안 넣은 행으로 본다.
 *   [유지·자체] 넣은 행이 0개일 때의 에러는 트리판에 해당 문구가 없어 새로 썼다 — 규격 행 아래 `가격을 1개 이상 입력해 주세요.`
 *              (위치는 트리판 분류 미선택 에러처럼 블록 아래 한 줄).
 *   [유지·자체] 에러는 해당 칸을 고치면 그 칸만 지운다. 묶음 에러는 아무 행이나 고치면 지운다.
 *   [유지·자체] read-only 기존 옵션 영역 이름은 `기존 가격 옵션`, 안내 1줄만 둔다. 드래그 핸들·삭제(X)는 렌더하지 않는다.
 *   [유지·자체] S7 은 분류 트리에서 HPV 백신 → 가다실 9가를 직접 골라야 연결된다(별도 제안 배너 없음). 프로토 범위 밖 분류는 토스트만.
 *   [유지·자체] 저장 후 상태 표시는 화면 안이 아니라 툴바(`저장 후`)와 토스트로만 한다.
 *
 * 보류 · TODO:
 *   [보류] S7 분류 연결 전 저장 동작 미정 — 지금은 저장을 누르면 프로토 토스트로 "미정"만 알리고 아무것도 하지 않는다.
 *   [보류] 기존 옵션의 설명(예: S6 `2회 접종 필수`)은 규격 행에 받을 칸이 없어 저장 후 사라진다. 처리 방식 미정.
 *
 * 변경 이력:
 *   v0.1  2026-10-14 — 신규. S0(새 규격) + S1~S7, read-only 기존 옵션 + 빈 규격 행 + 저장 검증 + 저장 후 상태.
 * └──────────────────────────────────────────────────────
 */

type PType = 'fixed' | 'discount' | 'consult';
type Legacy = { id: string; name: string; type: PType; amount?: number; original?: number; sale?: number; desc?: string };
type SlotKey = '1' | '3';
type Price = { type: PType; amount: string; original: string; sale: string };
type Cat = { l1: string; l2: string | null; l3: string | null };
type Scenario = { id: string; short: string; example: string; alias: string; cat: Cat; options: Legacy[]; spec?: Record<SlotKey, Price> };

const SLOTS: { key: SlotKey; label: string }[] = [{ key: '1', label: '1회 접종' }, { key: '3', label: '3회 접종' }];
const PRICE_TYPES: { value: PType; label: string }[] = [
  { value: 'fixed', label: '고정 가격' }, { value: 'discount', label: '할인 가격' }, { value: 'consult', label: '상담 후 결정' }
];
const TYPE_LABEL: Record<PType, string> = { fixed: '고정 가격', discount: '할인 가격', consult: '상담 후 결정' };
const GADASIL: Cat = { l1: '예방접종', l2: 'HPV 백신', l3: '가다실 9가' };
const emptyPrice = (): Price => ({ type: 'fixed', amount: '', original: '', sale: '' });
const emptySpec = (): Record<SlotKey, Price> => ({ '1': emptyPrice(), '3': emptyPrice() });

const SCENARIOS: Scenario[] = [
  {
    id: 'S0', short: '새 규격 상품', alias: '가다실 9가', cat: GADASIL, options: [],
    example: '이미 추천 규격으로 등록된 상품 — 기존 가격 옵션 영역 없이 평소처럼 보여요.',
    spec: { '1': { type: 'fixed', amount: '230000', original: '', sale: '' }, '3': { type: 'discount', amount: '', original: '690000', sale: '650000' } }
  },
  { id: 'S1', short: '이름에 회차', alias: '가다실 9가', cat: GADASIL, example: "'1회' 고정 210,000 / '3회 (완납)' 고정 610,000",
    options: [{ id: 'opt-1101', name: '1회', type: 'fixed', amount: 210000 }, { id: 'opt-1102', name: '3회 (완납)', type: 'fixed', amount: 610000 }] },
  { id: 'S2', short: '설명에만 회차', alias: '가다실 9가 접종', cat: GADASIL, example: "'가다실 9가' 170,000(설명 '1회') / '가다실 9가' 510,000(설명 '3회')",
    options: [{ id: 'opt-2101', name: '가다실 9가', type: 'fixed', amount: 170000, desc: '1회' }, { id: 'opt-2102', name: '가다실 9가', type: 'fixed', amount: 510000, desc: '3회' }] },
  { id: 'S3', short: '단일 · 회차 없음', alias: '가다실 9가', cat: GADASIL, example: "'가다실 9가' 고정 255,000",
    options: [{ id: 'opt-3101', name: '가다실 9가', type: 'fixed', amount: 255000 }] },
  { id: 'S4', short: '상담 1건', alias: '가다실 9가 접종', cat: GADASIL, example: "'가다실 9가 접종' 상담 후 결정",
    options: [{ id: 'opt-4101', name: '가다실 9가 접종', type: 'consult' }] },
  { id: 'S5', short: '규격 밖 회차(2회)', alias: '가다실 9가', cat: GADASIL, example: "'1회' 220,000 / '2회 완납 시' 할인 500,000→450,000 / '3회 완납 시' 550,000",
    options: [{ id: 'opt-5101', name: '1회', type: 'fixed', amount: 220000 }, { id: 'opt-5102', name: '2회 완납 시', type: 'discount', original: 500000, sale: 450000 }, { id: 'opt-5103', name: '3회 완납 시', type: 'fixed', amount: 550000 }] },
  { id: 'S6', short: '조건별 가격', alias: '가다실 9가', cat: GADASIL, example: "'15세 이하 1회 접종시' 220,000(설명 '2회 접종 필수') / '15세 이상 1회 접종시' 220,000(설명 '3회 접종 필수')",
    options: [{ id: 'opt-6101', name: '15세 이하 1회 접종시', type: 'fixed', amount: 220000, desc: '2회 접종 필수' }, { id: 'opt-6102', name: '15세 이상 1회 접종시', type: 'fixed', amount: 220000, desc: '3회 접종 필수' }] },
  { id: 'S7', short: '분류 미연결', alias: '예방접종', cat: { l1: '예방접종', l2: null, l3: null }, example: "상품명 '예방접종', 소분류 미설정 · '자궁경부암(가다실9가) 1회' 200,000 / '…3회' 570,000",
    options: [{ id: 'opt-7101', name: '자궁경부암(가다실9가) 1회', type: 'fixed', amount: 200000 }, { id: 'opt-7102', name: '자궁경부암(가다실9가) 3회', type: 'fixed', amount: 570000 }] }
];

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

/* ============================ 카드 ============================ */
function Editor({ sc, toast, onSaved }: { sc: Scenario; toast: (s: string) => void; onSaved: (v: boolean) => void }) {
  const [cat, setCat] = useState<Cat>(sc.cat);
  const [alias, setAlias] = useState(sc.alias);
  const [spec, setSpec] = useState<Record<SlotKey, Price>>(() => (sc.spec ? { '1': { ...sc.spec['1'] }, '3': { ...sc.spec['3'] } } : emptySpec()));
  const [legacy, setLegacy] = useState<Legacy[]>(sc.options);
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
    // 저장 성공 — 기존 옵션은 새 규격으로 대체된다. 빈 행은 저장하지 않으므로 기본값으로 되돌린다.
    setLegacy([]);
    setSpec((s) => ({ '1': isEntered(s['1']) ? s['1'] : emptyPrice(), '3': isEntered(s['3']) ? s['3'] : emptyPrice() }));
    onSaved(true);
    toast('저장했어요.');
  };

  return (
    <>
      <main className="cn-main rg-main tk-main lr-main">
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
                      <span className="rg-help">{linked ? '이전 방식으로 등록한 가격이에요. 수정할 수 없어요. 아래 항목에 가격을 다시 입력해 저장해 주세요.' : '이전 방식으로 등록한 가격이에요. 수정할 수 없어요.'}</span>
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
        <div className="rg-footer">
          <div className="rg-footer-left">
            <button className="rg-btn-cancel">취소</button>
            <button className="rg-btn-save" onClick={save}>저장</button>
          </div>
        </div>
      </main>
    </>
  );
}

/* ============================ 페이지 ============================ */
export default function Page() {
  const [sid, setSid] = useState('S1');
  const [resetKey, setResetKey] = useState(0);
  const [saved, setSaved] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const tbRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const sc = SCENARIOS.find((s) => s.id === sid)!;

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
  const pick = (id: string) => { setSid(id); setSaved(false); setResetKey((k) => k + 1); };

  return (
    <div className="lr-root" ref={rootRef}>
      <div className="lr-toolbar" ref={tbRef}>
        <div className="lr-tb-row">
          <span className="lr-tb-badge">PROTOTYPE</span>
          <span className="lr-tb-title">구 버전 상품 → 추천 규격 다시 입력 <em>ti-legacy-readonly v0.1</em></span>
          <span className="lr-tb-sp" />
          <span className={`lr-tb-state${saved ? ' on' : ''}`}>{saved ? '저장 후' : '저장 전'}</span>
          <button type="button" className="lr-tb-btn" onClick={() => pick(sid)}>처음 상태로</button>
        </div>
        <div className="lr-tb-row">
          <span className="lr-tb-label">상품</span>
          <div className="lr-chips">
            {SCENARIOS.map((s) => (
              <button key={s.id} type="button" className={`lr-chip${s.id === sid ? ' on' : ''}${s.id === 'S0' ? ' ok' : ''}`} onClick={() => pick(s.id)} title={s.example}>
                <b>{s.id}</b> {s.short}
              </button>
            ))}
          </div>
        </div>
        <div className="lr-tb-row"><span className="lr-tb-label" /><span className="lr-tb-example"><b>{sc.id}</b> {sc.example}</span></div>
      </div>
      <Editor key={`${sid}-${resetKey}`} sc={sc} toast={toast} onSaved={setSaved} />
      {toastMsg && <div className="lr-toast" role="status">{toastMsg}</div>}
    </div>
  );
}
