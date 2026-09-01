import React, { useMemo, useState } from 'react';
import { FiSearch, FiX, FiChevronRight, FiChevronLeft, FiAlertCircle, FiCheck } from 'react-icons/fi';

/**
 * ┌─ 프로토타입 컨텍스트 ───────────────────────────────────
 * 이름     : ti-category-map — 진료항목 분류(대/중/소) 인지·매핑 UI 탐색
 * 상태     : 현행(active)   버전: v1   최종수정: 2026-09-01
 * PRD      : 없음(선행 탐색). 관련 실코드 = receipt-web
 *            pages/non-payment-reservations/treatment-items/.../TreatmentItemNameSearch
 * 배포URL  : (미배포) 예정 https://connect-sq-sandbox.github.io/out/ti-category-map.html
 * 관련 CSS : styles/tiCategoryMap.css (tcm-*)
 * 기술제약 : react-only · plain CSS · mock · 네트워크 0
 *
 * 화면구성 : 진료항목 등록 폼(진료항목 필드 중심) + 우측 "저장 데이터 / 환자 검색 노출" 패널
 *            상단 세그먼트로 4개 안을 즉시 비교
 *
 * 풀려는 문제 (why):
 *   현재 등록 UI는 "진료항목명" 필드 하나가 **이름과 분류를 동시에** 결정한다.
 *   자동완성을 고르면 소분류까지 확정되며 이름도 표준 이름이 되고,
 *   직접입력하면 이름만 남고 master1/2/3 이 모두 null 이 된다.
 *   → "분류는 보톡스, 이름은 이마보톡스" 를 표현할 자리가 물리적으로 없다.
 *   그리고 환자 병원검색 인덱스는 TREATMENT_ITEM 을 TREATMENT_ITEM_MASTER 에
 *   `on master_id in (master1_id, master2_id, master3_id)` 로 조인해 **마스터 명칭만**
 *   태그로 만들기 때문에, master id 가 전부 null 인 직접입력 항목은 조인 자체가 성립하지 않아
 *   검색 데이터에 0 을 기여한다. (goodoc-api searchv2-hospital.service.ts)
 *
 * 핵심 결정 (why):
 *   [유지·자체] 4개 안을 한 화면에서 세그먼트로 전환해 비교한다. 별도 페이지로 나누면
 *              "무엇이 달라지는지"가 안 보인다. 비교가 이 프로토타입의 존재 이유.
 *   [유지·자체] 우측에 저장 데이터(master1/2/3Id)와 환자 검색 태그를 항상 노출한다.
 *              분류 유무의 결과는 화면에서 안 보이는 값이라, 보이게 만들지 않으면
 *              어떤 안이 나은지 판단할 근거가 생기지 않는다.
 *   [유지·자체] 추천 경로는 "역매칭"으로 뽑는다 — 마스터 명칭이 입력값에 포함되는 방향.
 *              현재 서버 검색(keyword)은 마스터명이 검색어를 포함하는 정방향이라
 *              '이마보톡스'로는 0건이 나온다. 방향이 반대인 별도 로직이 필요하다.
 *   [실코드]   검색 자동완성의 정렬(소>중>대)·단일 하이라이트·2자/50자 제한·칩 복구 규칙은
 *              TreatmentItemNameSearch/spec.md 와 displayText.ts 를 그대로 재현.
 *
 * 보류·TODO:
 *   [보류] 안 확정 후: 칩에 경로를 어디까지 노출할지(대>중 만 vs 대>중>소 전체).
 *   [보류] 추천 0건일 때 "분류 직접 찾기"를 레이어 안에서 처리할지 별도 시트로 뺄지.
 *   [보류] 자동 매핑(고신뢰 케이스 무인 처리)의 신뢰도 규칙 — 접미사 완전일치 + 단일 후보만?
 *   [보류] 기존 직접입력 재고를 병원이 직접 정리하게 하는 파트너 웹 알림 화면(별도 프로토타입).
 *
 * 변경 이력:
 *   v1 2026-09-01 — 최초 구성. 4개 안(현행/A/B/C) + 저장데이터·검색노출 패널 + 시나리오 프리셋.
 * └──────────────────────────────────────────────────────
 */

/* =========================================================================
 * 타입
 * ======================================================================= */

/** 비교할 안 */
type Variant = 'now' | 'A' | 'B' | 'C';

/** 확정된 진료항목 선택 상태. master* 가 null 이면 그 레벨은 미매핑. */
interface Selection {
  name: string;
  m1Id: number | null;
  m1Name: string | null;
  m2Id: number | null;
  m2Name: string | null;
  m3Id: number | null;
  m3Name: string | null;
  /** standard=표준 소분류 선택 / mapped=분류 붙인 자유입력 / custom=분류 없는 자유입력 */
  origin: 'standard' | 'mapped' | 'custom';
}

/** 자동완성 후보 (서버 TreatmentItemMasterResponse 대응) */
interface Suggestion {
  m1Id: number;
  m1Name: string;
  m2Id: number | null;
  m2Name: string | null;
  m3Id: number;
  m3Name: string;
}

/** 역매칭으로 뽑은 분류 경로 후보 */
interface PathCandidate {
  m1Id: number;
  m1Name: string;
  m2Id: number | null;
  m2Name: string | null;
  /** 입력값 안에서 매칭된 마스터 명칭 (근거 표시용) */
  matched: string;
}

/* =========================================================================
 * Mock 마스터 (심평원 규격 참고 3뎁스 — 실제 데이터 아님)
 * ======================================================================= */

const TAXONOMY = [
  {
    id: 10,
    name: '피부',
    groups: [
      { id: 101, name: '보톡스', items: [{ id: 1001, name: '턱보톡스' }, { id: 1002, name: '미간보톡스' }, { id: 1003, name: '사각턱보톡스' }] },
      { id: 102, name: '필러', items: [{ id: 1011, name: '팔자필러' }, { id: 1012, name: '코필러' }, { id: 1013, name: '입술필러' }] },
      { id: 103, name: '레이저', items: [{ id: 1021, name: '레이저토닝' }, { id: 1022, name: '프락셀레이저' }] }
    ]
  },
  {
    id: 20,
    name: '예방접종',
    groups: [
      { id: 201, name: '독감', items: [{ id: 2001, name: '독감 예방접종' }] },
      { id: 202, name: '예방접종(간염)', items: [{ id: 2011, name: 'A형간염 예방접종' }, { id: 2012, name: 'B형간염 예방접종' }] },
      { id: 203, name: '예방접종(HPV)', items: [{ id: 2021, name: '가다실 9가' }, { id: 2022, name: '서바릭스' }] },
      { id: 204, name: '주사치료', items: [{ id: 2031, name: '알레르겐 면역요법' }] }
    ]
  },
  {
    id: 30,
    name: '건강검진',
    groups: [
      { id: 301, name: '종합검진', items: [{ id: 3001, name: '종합검진 A형' }, { id: 3002, name: '종합검진 B형' }] },
      { id: 302, name: '영유아검진', items: [{ id: 3011, name: '영유아검진' }] }
    ]
  },
  {
    id: 40,
    name: '여성',
    groups: [{ id: 401, name: '갱년기', items: [{ id: 4001, name: '갱년기 호르몬 치료' }] }]
  }
];

/** 평탄화된 소분류 후보 목록 */
const FLAT: Suggestion[] = TAXONOMY.flatMap((m1) =>
  m1.groups.flatMap((m2) =>
    m2.items.map((m3) => ({ m1Id: m1.id, m1Name: m1.name, m2Id: m2.id, m2Name: m2.name, m3Id: m3.id, m3Name: m3.name }))
  )
);

/* =========================================================================
 * 검색 / 매칭 로직
 * ======================================================================= */

const MIN_CUSTOM_LENGTH = 2;
const MAX_NAME_LENGTH = 50;

type MatchLevel = 'name' | 'group' | 'category';

/**
 * spec.md 단일 하이라이트 정책 — 가장 구체적인(rightmost) 일치 1곳만.
 * 소분류 > 중분류 > 대분류 순.
 */
function detectMatchLevel(s: Suggestion, q: string): MatchLevel | null {
  if (!q) return null;
  if (s.m3Name.includes(q)) return 'name';
  if (s.m2Name && s.m2Name.includes(q)) return 'group';
  if (s.m1Name.includes(q)) return 'category';
  return null;
}

const RANK: Record<MatchLevel, number> = { name: 0, group: 1, category: 2 };

/**
 * 서버 `GET /treatment-item-masters?keyword=` 재현.
 * "대/중/소 명칭 중 하나라도 검색어와 일치하면 조회" + FE 정렬(소>중>대).
 */
function searchMasters(q: string): Suggestion[] {
  const query = q.trim();
  if (!query) return [];
  return FLAT.filter((s) => detectMatchLevel(s, query) !== null).sort(
    (a, b) => RANK[detectMatchLevel(a, query)!] - RANK[detectMatchLevel(b, query)!]
  );
}

/**
 * 역매칭 — 입력값이 마스터 명칭을 **포함**하는 방향.
 * '이마보톡스' ⊃ '보톡스' → 피부 > 보톡스.
 * 현재 서버 API 에는 없는 로직(정방향만 있음). 긴 명칭 우선, 최대 3개.
 */
function suggestPaths(input: string): PathCandidate[] {
  const q = input.trim();
  if (q.length < MIN_CUSTOM_LENGTH) return [];

  const found: PathCandidate[] = [];

  TAXONOMY.forEach((m1) => {
    m1.groups.forEach((m2) => {
      if (q !== m2.name && q.includes(m2.name)) {
        found.push({ m1Id: m1.id, m1Name: m1.name, m2Id: m2.id, m2Name: m2.name, matched: m2.name });
      }
    });
    if (q !== m1.name && q.includes(m1.name) && !found.some((f) => f.m1Id === m1.id)) {
      found.push({ m1Id: m1.id, m1Name: m1.name, m2Id: null, m2Name: null, matched: m1.name });
    }
  });

  return found.sort((a, b) => b.matched.length - a.matched.length).slice(0, 3);
}

/**
 * 환자 병원검색 태그 시뮬레이션.
 * 실제 인덱스(searchv2-hospital.service.ts)는 마스터 명칭만 group_concat 하므로
 * 진료항목 자기 이름(name)은 절대 포함되지 않는다.
 */
function searchTags(sel: Selection | null): string[] {
  if (!sel) return [];
  return [sel.m1Name, sel.m2Name, sel.m3Name].filter(Boolean) as string[];
}

/* =========================================================================
 * 작은 UI 조각
 * ======================================================================= */

/** 검색어 일치 부분만 굵게 (단일 하이라이트 대상 세그먼트에만 적용) */
function Highlight({ text, query, on }: { text: string; query: string; on: boolean }) {
  if (!on || !query) return <>{text}</>;
  const i = text.indexOf(query);
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <b className="tcm-hl">{text.slice(i, i + query.length)}</b>
      {text.slice(i + query.length)}
    </>
  );
}

/** 자동완성 한 줄 — 대분류 > 중분류 > 소분류 전체 경로 */
function SuggestionRow({ s, query, onPick }: { s: Suggestion; query: string; onPick: () => void }) {
  const level = detectMatchLevel(s, query);
  return (
    <button className="tcm-sug" onClick={onPick} type="button">
      <span className="tcm-sug-path">
        <span className="tcm-sug-seg tcm-dim">
          <Highlight text={s.m1Name} query={query} on={level === 'category'} />
        </span>
        {s.m2Name && (
          <>
            <span className="tcm-sug-sep">›</span>
            <span className="tcm-sug-seg tcm-dim">
              <Highlight text={s.m2Name} query={query} on={level === 'group'} />
            </span>
          </>
        )}
        <span className="tcm-sug-sep">›</span>
        <span className="tcm-sug-seg tcm-strong">
          <Highlight text={s.m3Name} query={query} on={level === 'name'} />
        </span>
      </span>
    </button>
  );
}

/* =========================================================================
 * 메인
 * ======================================================================= */

const VARIANTS: { key: Variant; label: string; tag: string }[] = [
  { key: 'now', label: '현행', tag: '이름만 / 분류 없음' },
  { key: 'A', label: 'A. 경로 노출', tag: '인지 개선만' },
  { key: 'B', label: 'B. 경로 + 매핑', tag: '분류 붙이기' },
  { key: 'C', label: 'C. 필드 분리', tag: '이름 + 분류 2필드' }
];

const SCENARIOS = [
  { q: '보톡스', note: '표준 항목이 잡히는 정상 케이스' },
  { q: '이마보톡스', note: '규격 밖 — 중분류는 있는데 소분류가 없음' },
  { q: '갱년기 클리닉', note: '대분류/중분류만 걸리는 케이스' },
  { q: '더마톡신주사', note: '아무 분류도 안 잡히는 케이스' }
];

export default function TiCategoryMapPage() {
  const [variant, setVariant] = useState<Variant>('now');
  const [selection, setSelection] = useState<Selection | null>(null);

  // 검색 레이어 상태
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState(false); // 칩 임시 삭제 상태
  const [layerMode, setLayerMode] = useState<'search' | 'picker'>('search');
  const [pickerM1, setPickerM1] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // C안 전용 — 분류 선택 시트
  const [catSheet, setCatSheet] = useState(false);
  const [catM1, setCatM1] = useState<number | null>(null);

  const suggestions = useMemo(() => searchMasters(query), [query]);
  const paths = useMemo(() => suggestPaths(query), [query]);
  const tags = searchTags(selection);

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2200);
  };

  const resetLayer = () => {
    setOpen(false);
    setEditing(false);
    setQuery('');
    setLayerMode('search');
    setPickerM1(null);
  };

  const commit = (sel: Selection) => {
    setSelection(sel);
    resetLayer();
  };

  /** 표준 소분류 선택 — master 3개 모두 채워짐 */
  const pickStandard = (s: Suggestion) =>
    commit({
      name: s.m3Name,
      m1Id: s.m1Id,
      m1Name: s.m1Name,
      m2Id: s.m2Id,
      m2Name: s.m2Name,
      m3Id: s.m3Id,
      m3Name: s.m3Name,
      origin: 'standard'
    });

  /** 자유입력 — 분류 없음 (현행 동작) */
  const addCustom = () => {
    const t = query.trim();
    if (t.length === 0) return showToast('공백만 입력할 수 없어요.');
    if (t.length < MIN_CUSTOM_LENGTH) return showToast('최소 2글자 이상 입력해 주세요.');
    commit({ name: t, m1Id: null, m1Name: null, m2Id: null, m2Name: null, m3Id: null, m3Name: null, origin: 'custom' });
  };

  /** 자유입력 + 분류 매핑 — master1/2 만 채우고 master3 는 null */
  const addMapped = (p: PathCandidate) => {
    const t = query.trim();
    if (t.length < MIN_CUSTOM_LENGTH) return showToast('최소 2글자 이상 입력해 주세요.');
    commit({
      name: t,
      m1Id: p.m1Id,
      m1Name: p.m1Name,
      m2Id: p.m2Id,
      m2Name: p.m2Name,
      m3Id: null,
      m3Name: null,
      origin: 'mapped'
    });
  };

  // 경로를 칩 위에 보여주는 안 = A·B. C 는 분류 전용 필드가 따로 그 역할을 한다.
  const showPath = variant === 'A' || variant === 'B';
  // 이름 필드 하단에서 분류까지 고르는 안 = B 만. C 는 분류를 별도 필드에서 고른다.
  const canMap = variant === 'B';

  /* ---------------- 검색 레이어 ---------------- */

  const renderLayer = () => {
    if (!open) return null;

    // 분류 직접 찾기 (B안)
    if (layerMode === 'picker') {
      const m1 = TAXONOMY.find((t) => t.id === pickerM1);
      return (
        <div className="tcm-layer">
          <div className="tcm-layer-head">
            {m1 ? (
              <button className="tcm-back" onClick={() => setPickerM1(null)} type="button">
                <FiChevronLeft size={16} /> 대분류
              </button>
            ) : (
              <button className="tcm-back" onClick={() => setLayerMode('search')} type="button">
                <FiChevronLeft size={16} /> 검색으로
              </button>
            )}
            <span className="tcm-layer-title">
              {m1 ? `${m1.name} 안에서 고르기` : `'${query.trim()}' 을 넣을 분류 고르기`}
            </span>
          </div>
          <div className="tcm-layer-body">
            {!m1 &&
              TAXONOMY.map((t) => (
                <button key={t.id} className="tcm-pick-row" onClick={() => setPickerM1(t.id)} type="button">
                  <span>{t.name}</span>
                  <FiChevronRight size={16} />
                </button>
              ))}
            {m1 &&
              m1.groups.map((g) => (
                <button
                  key={g.id}
                  className="tcm-pick-row"
                  type="button"
                  onClick={() => addMapped({ m1Id: m1.id, m1Name: m1.name, m2Id: g.id, m2Name: g.name, matched: '' })}
                >
                  <span>
                    <span className="tcm-dim">{m1.name} › </span>
                    {g.name}
                  </span>
                  <span className="tcm-pick-cta">여기에 넣기</span>
                </button>
              ))}
          </div>
        </div>
      );
    }

    const trimmed = query.trim();

    // 검색 전 가이드
    if (!trimmed) {
      return (
        <div className="tcm-layer">
          <div className="tcm-guide">
            <div className="tcm-guide-title">이렇게 검색해 보세요</div>
            <ol className="tcm-guide-list">
              <li>
                공식적인 진료명이나 대표 시술명으로 검색해 보세요.
                <span className="tcm-guide-ex">예) 임플란트, 도수치료, 라식, 스케일링</span>
              </li>
              <li>
                백신, 약품, 장비 등의 구체적인 명칭으로 검색해 보세요.
                <span className="tcm-guide-ex">예) 가다실 9가, 보톡스, 마운자로</span>
              </li>
              <li>
                환자들이 자주 찾는 클리닉이나 목적성 시술로 검색해 보세요.
                <span className="tcm-guide-ex">예) 영유아검진, 신데렐라주사, 알레르기검사</span>
              </li>
            </ol>
          </div>
        </div>
      );
    }

    return (
      <div className="tcm-layer">
        {suggestions.length > 0 && (
          <div className="tcm-layer-body tcm-sug-list">
            {suggestions.map((s) => (
              <SuggestionRow key={s.m3Id} s={s} query={trimmed} onPick={() => pickStandard(s)} />
            ))}
          </div>
        )}

        <div className="tcm-layer-foot">
          {!canMap && (
            <button className="tcm-foot-btn" onClick={addCustom} type="button">
              ‘<b>{trimmed.slice(0, MAX_NAME_LENGTH)}</b>’ 진료항목 추가하기
            </button>
          )}

          {canMap && (
            <>
              <div className="tcm-foot-title">
                ‘<b>{trimmed.slice(0, MAX_NAME_LENGTH)}</b>’ 을 어디에 추가할까요?
              </div>

              {paths.map((p) => (
                <button key={`${p.m1Id}-${p.m2Id}`} className="tcm-foot-btn tcm-primary" onClick={() => addMapped(p)} type="button">
                  <span className="tcm-foot-path">
                    {p.m1Name}
                    {p.m2Name ? ` › ${p.m2Name}` : ''}
                  </span>
                  <span className="tcm-foot-sub">에 추가 · ‘{p.matched}’ 이(가) 이름에 있어 추천</span>
                </button>
              ))}

              <button className="tcm-foot-btn" onClick={() => setLayerMode('picker')} type="button">
                분류 직접 찾기
                <FiChevronRight size={15} />
              </button>

              <button className="tcm-foot-btn tcm-muted" onClick={addCustom} type="button">
                분류 없이 추가
                <span className="tcm-foot-warn">
                  <FiAlertCircle size={13} />{' '}
                  {paths.length > 0
                    ? `‘${paths[0].m2Name ?? paths[0].m1Name}’로 검색하는 환자에게 노출되지 않아요`
                    : '어떤 검색어로도 환자에게 노출되지 않아요'}
                </span>
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  /* ---------------- 진료항목 필드 ---------------- */

  const renderChip = () => {
    if (!selection) return null;
    const showFullPath = showPath && (selection.m1Name || selection.m2Name);

    return (
      <div className="tcm-chip-wrap">
        {showFullPath && (
          <div className="tcm-chip-path">
            {selection.m1Name}
            {selection.m2Name ? ` › ${selection.m2Name}` : ''}
            {selection.origin === 'mapped' && <span className="tcm-chip-badge">직접 입력한 이름</span>}
          </div>
        )}
        {showPath && !showFullPath && (
          <div className="tcm-chip-path tcm-nopath">
            분류 없음
            <span className="tcm-chip-badge tcm-badge-warn">검색 노출 안 됨</span>
          </div>
        )}
        <span className="tcm-chip">
          <span className="tcm-chip-label">{selection.name}</span>
          <button
            className="tcm-chip-x"
            aria-label="진료항목 변경"
            type="button"
            onClick={() => {
              setEditing(true);
              setOpen(true);
              setQuery('');
            }}
          >
            <FiX size={14} />
          </button>
        </span>
      </div>
    );
  };

  const chipVisible = selection && !editing;

  return (
    <div className="tcm-root">
      {/* ── 프로토타입 전용 툴바 ── */}
      <div className="tcm-toolbar">
        <div className="tcm-toolbar-inner">
          <div className="tcm-tb-left">
            <span className="tcm-tb-kicker">프로토타입</span>
            <span className="tcm-tb-title">진료항목 분류 인지·매핑</span>
          </div>

          <div className="tcm-seg">
            {VARIANTS.map((v) => (
              <button
                key={v.key}
                className={`tcm-seg-btn ${variant === v.key ? 'on' : ''}`}
                type="button"
                onClick={() => {
                  setVariant(v.key);
                  setSelection(null);
                  resetLayer();
                }}
              >
                {v.label}
                <span className="tcm-seg-tag">{v.tag}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="tcm-toolbar-inner tcm-tb-second">
          <span className="tcm-tb-kicker">시나리오</span>
          {SCENARIOS.map((s) => (
            <button
              key={s.q}
              className="tcm-scn"
              type="button"
              title={s.note}
              onClick={() => {
                setSelection(null);
                setEditing(false);
                setLayerMode('search');
                setPickerM1(null);
                setQuery(s.q);
                setOpen(true);
              }}
            >
              {s.q}
            </button>
          ))}
          <span className="tcm-tb-hint">클릭하면 그 검색어로 레이어가 열립니다</span>
        </div>
      </div>

      {/* ── 본문 ── */}
      <div className="tcm-body">
        {/* 좌 : 등록 폼 */}
        <div className="tcm-form-col">
          <div className="tcm-head">
            <div className="tcm-subtitle">진료항목</div>
            <h1 className="tcm-title">진료항목 정보</h1>
          </div>

          <section className="tcm-fieldset">
            <div className="tcm-fieldset-title">필수 정보</div>
            <div className="tcm-fieldset-body">
              {/* 진료항목명 */}
              <div className="tcm-fld">
                <div className="tcm-fld-label">
                  {variant === 'C' ? '진료항목명' : '진료항목'}
                </div>
                <div className="tcm-fld-desc">
                  {variant === 'C' ? (
                    <>병원에서 부르는 이름 그대로 입력해 주세요. 검색해서 표준 항목을 고르면 분류가 함께 채워집니다.</>
                  ) : (
                    <>
                      등록할 진료항목명을 검색하거나 직접 입력해 주세요.
                      <br />
                      자동완성으로 제안되는 항목을 선택하면, 환자가 더 쉽게 찾을 수 있고 검색·노출에도 유리합니다.
                    </>
                  )}
                </div>

                <div className="tcm-field-anchor">
                  <div className={`tcm-search-field ${open ? 'focus' : ''}`}>
                    {chipVisible ? (
                      renderChip()
                    ) : (
                      <input
                        className="tcm-search-input"
                        value={query}
                        placeholder="진료항목을 검색해 주세요."
                        maxLength={MAX_NAME_LENGTH}
                        onFocus={() => setOpen(true)}
                        onChange={(e) => setQuery(e.target.value)}
                      />
                    )}
                    <span className="tcm-search-icon">
                      <FiSearch size={18} />
                    </span>
                  </div>
                  {renderLayer()}
                </div>

                {!chipVisible && query.length >= MAX_NAME_LENGTH && (
                  <div className="tcm-count">{MAX_NAME_LENGTH}자까지 입력할 수 있어요.</div>
                )}
              </div>

              {/* C안 전용 : 분류 필드 */}
              {variant === 'C' && (
                <div className="tcm-fld">
                  <div className="tcm-fld-label">
                    분류 <span className="tcm-req">필수</span>
                  </div>
                  <div className="tcm-fld-desc">환자가 카테고리로 찾을 때 쓰입니다. 이름과 별개로 지정해 주세요.</div>

                  <div className="tcm-cat-field">
                    {selection && selection.m1Name ? (
                      <span className="tcm-cat-value">
                        {selection.m1Name}
                        {selection.m2Name ? ` › ${selection.m2Name}` : ''}
                      </span>
                    ) : (
                      <span className="tcm-cat-empty">분류를 선택해 주세요.</span>
                    )}
                    <button
                      className="tcm-cat-btn"
                      type="button"
                      onClick={() => {
                        setCatM1(null);
                        setCatSheet(true);
                      }}
                      disabled={!selection}
                    >
                      {selection && selection.m1Name ? '변경' : '선택'}
                    </button>
                  </div>
                  {!selection && <div className="tcm-cat-hint">진료항목명을 먼저 입력해 주세요.</div>}
                </div>
              )}

              {/* 이하 축약 더미 */}
              <div className="tcm-fld tcm-dummy">
                <div className="tcm-fld-label">가격 정보</div>
                <div className="tcm-fld-desc">환자에게 보여줄 가격 정보를 설정해 주세요.</div>
                <div className="tcm-dummy-box">이 프로토타입에서는 생략</div>
              </div>
            </div>
          </section>

          <div className="tcm-actions">
            <button className="tcm-btn-ghost" type="button">
              취소
            </button>
            <button className="tcm-btn-primary" type="button" onClick={() => showToast('프로토타입이라 저장되지 않아요.')}>
              등록하기
            </button>
          </div>
        </div>

        {/* 우 : 결과 패널 */}
        <div className="tcm-side-col">
          <div className="tcm-panel">
            <div className="tcm-panel-title">저장되는 데이터</div>
            <div className="tcm-kv">
              <div className="tcm-kv-row">
                <span>master1Id</span>
                <code className={selection?.m1Id == null ? 'tcm-null' : ''}>
                  {selection ? (selection.m1Id ?? 'null') : '—'}
                  {selection?.m1Name ? ` (${selection.m1Name})` : ''}
                </code>
              </div>
              <div className="tcm-kv-row">
                <span>master2Id</span>
                <code className={selection?.m2Id == null ? 'tcm-null' : ''}>
                  {selection ? (selection.m2Id ?? 'null') : '—'}
                  {selection?.m2Name ? ` (${selection.m2Name})` : ''}
                </code>
              </div>
              <div className="tcm-kv-row">
                <span>master3Id</span>
                <code className={selection?.m3Id == null ? 'tcm-null' : ''}>
                  {selection ? (selection.m3Id ?? 'null') : '—'}
                  {selection?.m3Name ? ` (${selection.m3Name})` : ''}
                </code>
              </div>
              <div className="tcm-kv-row">
                <span>name</span>
                <code>{selection ? selection.name : '—'}</code>
              </div>
            </div>
            {selection?.origin === 'mapped' && (
              <div className="tcm-note tcm-note-ok">
                중분류까지만 표준이고 소분류는 병원이 지은 이름입니다. 지금 규격은 master 3개가 전부 채워지거나 전부 null인
                구조라, 이 상태를 저장하려면 부분 매핑 허용이 필요합니다.
              </div>
            )}
          </div>

          <div className="tcm-panel">
            <div className="tcm-panel-title">환자 검색에 실리는 값</div>
            <div className="tcm-tags">
              {tags.length > 0 ? (
                tags.map((t) => (
                  <span key={t} className="tcm-tag">
                    {t}
                  </span>
                ))
              ) : (
                <span className="tcm-tag tcm-tag-empty">{selection ? '없음' : '—'}</span>
              )}
            </div>
            <div className="tcm-note">
              병원검색 인덱스는 <b>마스터 명칭만</b> 태그로 만듭니다. 진료항목 이름은 들어가지 않습니다.
            </div>

            {selection && (
              <div className="tcm-probe">
                {['보톡스', '피부', selection.name].map((q, i) => {
                  // 인덱스는 마스터 명칭 텍스트다. 태그가 검색어를 포함할 때만 잡힌다.
                  // '이마보톡스'로 검색하면 태그('피부','보톡스')에 그 문자열이 없어 잡히지 않는다.
                  const hit = tags.some((t) => t.includes(q));
                  return (
                    <div key={`${q}-${i}`} className={`tcm-probe-row ${hit ? 'hit' : 'miss'}`}>
                      <span className="tcm-probe-q">‘{q}’ 검색</span>
                      <span className="tcm-probe-r">
                        {hit ? <FiCheck size={14} /> : <FiX size={14} />}
                        {hit ? '노출됨' : '노출 안 됨'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="tcm-panel tcm-panel-quiet">
            <div className="tcm-panel-title">이 안은</div>
            {variant === 'now' && (
              <p className="tcm-desc">
                현재 화면 그대로입니다. 자동완성을 고르면 이름도 분류도 우리 것이 되고, 직접 입력하면 이름만 남고 분류는
                통째로 사라집니다. 그 사이를 표현할 자리가 없습니다.
              </p>
            )}
            {variant === 'A' && (
              <p className="tcm-desc">
                고른 항목의 대·중분류 경로를 칩 위에 노출합니다. 병원이 자기 항목이 어디에 속하는지 인지하게 되지만,
                <b> 규격 밖 이름은 여전히 분류를 못 가집니다.</b> 인지 개선만 하는 안입니다.
              </p>
            )}
            {variant === 'B' && (
              <p className="tcm-desc">
                하단 버튼을 선택지로 바꿔 자유 이름에도 분류를 붙입니다. 이름에 포함된 마스터 명칭으로 경로를 역매칭해
                추천하고, 안 잡히면 직접 찾거나 분류 없이 넘어갈 수 있습니다. 다수 케이스의 흐름은 그대로 두고
                직접입력 경로에서만 한 스텝이 늘어납니다.
              </p>
            )}
            {variant === 'C' && (
              <p className="tcm-desc">
                이름과 분류를 아예 다른 필드로 나눕니다. 커머스 정석이고 가장 정직하지만, 표준 항목을 고르는 다수
                케이스에서도 분류 필드를 매번 확인하게 됩니다. 마찰이 전체에 걸립니다.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* C안 분류 선택 시트 */}
      {catSheet && (
        <div className="tcm-sheet-dim" onClick={() => setCatSheet(false)}>
          <div className="tcm-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="tcm-sheet-head">
              {catM1 ? (
                <button className="tcm-back" type="button" onClick={() => setCatM1(null)}>
                  <FiChevronLeft size={16} /> 대분류
                </button>
              ) : (
                <span className="tcm-layer-title">분류 선택</span>
              )}
              <button className="tcm-sheet-x" type="button" onClick={() => setCatSheet(false)}>
                <FiX size={18} />
              </button>
            </div>
            <div className="tcm-sheet-body">
              {!catM1 &&
                TAXONOMY.map((t) => (
                  <button key={t.id} className="tcm-pick-row" type="button" onClick={() => setCatM1(t.id)}>
                    <span>{t.name}</span>
                    <FiChevronRight size={16} />
                  </button>
                ))}
              {catM1 &&
                TAXONOMY.find((t) => t.id === catM1)!.groups.map((g) => {
                  const m1 = TAXONOMY.find((t) => t.id === catM1)!;
                  return (
                    <button
                      key={g.id}
                      className="tcm-pick-row"
                      type="button"
                      onClick={() => {
                        setSelection((prev) =>
                          prev
                            ? { ...prev, m1Id: m1.id, m1Name: m1.name, m2Id: g.id, m2Name: g.name, origin: prev.m3Id ? prev.origin : 'mapped' }
                            : prev
                        );
                        setCatSheet(false);
                      }}
                    >
                      <span>
                        <span className="tcm-dim">{m1.name} › </span>
                        {g.name}
                      </span>
                      <span className="tcm-pick-cta">선택</span>
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="tcm-toast">
          <FiAlertCircle size={16} />
          {toast}
        </div>
      )}
    </div>
  );
}
