import React, { useMemo, useState } from 'react';

/**
 * 진료항목 → 카카오톡 예약하기 상품 자동 연동 (자동 매핑 + 검증) — 프로토타입 (kakao-link)
 * 이미 등록된 굿닥 진료항목을 카카오 예약하기 "상품" 규격으로 자동 변환하고,
 * 규격 위반(글자수·가격표현·슬롯단위·필수값)만 운영자에게 검증 결과로 보여준다.
 * 운영자는 값을 직접 재입력하지 않는다 = 자동 매핑 + 검증만.
 * react-only · plain CSS(connectKakaoLink.css) · mock 데이터 인라인 · 네트워크 0.
 */

/* ============================ mock: 굿닥 진료항목 ============================ */
type PriceType = 'fixed' | 'discount' | 'consult';
type GdPrice = { title: string; type: PriceType; origin?: number; sale?: number };
type Schedule = { days: string; interval: number; stock: number } | null; // null = 예약 스케줄 없음
type LinkState = 'none' | 'linked';

type GdItem = {
  id: number;
  name: string; // 진료항목명
  alias: string; // 노출명 (있으면 카카오 상품명 우선)
  intro: string; // 한 줄 소개 → 카카오 상품설명
  keywords: string[];
  images: number; // 대표+상세 이미지 개수 (mock)
  prices: GdPrice[];
  schedule: Schedule;
  visible: boolean;
  link: LinkState;
};

const won = (n?: number) => (n == null ? '' : n.toLocaleString('ko-KR') + '원');

const INITIAL: GdItem[] = [
  {
    id: 1, name: '얼굴지방흡입', alias: '얼굴 지방흡입', intro: '갸름한 얼굴라인을 위한 지방흡입',
    keywords: ['지방흡입', '얼굴윤곽', '브이라인'], images: 4,
    prices: [{ title: '기본', type: 'fixed', origin: 350000 }],
    schedule: { days: '월~금 09:00~18:00', interval: 30, stock: 1 }, visible: true, link: 'none'
  },
  {
    id: 2, name: '리쥬란 힐러', alias: '리쥬란 힐러 프리미엄 스킨부스터 3회 패키지 + 사후관리 포함', intro: '피부 재생 스킨부스터',
    keywords: ['리쥬란', '스킨부스터', '피부재생'], images: 2,
    prices: [
      { title: '1회', type: 'fixed', origin: 250000 },
      { title: '3회 패키지 (프리미엄 사후관리 + 재생관리 풀패키지 구성)', type: 'discount', origin: 750000, sale: 600000 }
    ],
    schedule: { days: '화·목 13:00~20:00', interval: 20, stock: 1 }, visible: true, link: 'none'
  },
  {
    id: 3, name: '보톡스 (이마)', alias: '', intro: '이마 주름 개선 보톡스',
    keywords: ['보톡스', '이마주름'], images: 1,
    prices: [{ title: '이마', type: 'discount', origin: 150000, sale: 99000 }],
    schedule: { days: '월~금 10:00~19:00', interval: 15, stock: 2 }, visible: true, link: 'none'
  },
  {
    id: 4, name: '실 리프팅', alias: '', intro: '',
    keywords: [], images: 0,
    prices: [{ title: '상담 후 결정', type: 'consult' }],
    schedule: null, visible: true, link: 'none'
  },
  {
    id: 5, name: '레이저 토닝', alias: '', intro: '색소·톤 개선 레이저',
    keywords: ['레이저토닝', '색소'], images: 3,
    prices: [{ title: '1회', type: 'fixed', origin: 80000 }, { title: '5회', type: 'fixed', origin: 350000 }],
    schedule: { days: '월~토 09:00~18:00', interval: 30, stock: 1 }, visible: false, link: 'linked'
  }
];

/* ============================ 매핑 + 검증 로직 ============================ */
const KAKAO_NAME_MAX = 50;
const KAKAO_PRICE_NAME_MAX = 25;

type IssueLevel = 'error' | 'warn' | 'info';
type Issue = { level: IssueLevel; field: string; msg: string; fixHint?: string };

type Mapped = {
  productName: string; // 카카오 상품명 (보정 후)
  productNameRaw: string;
  description: string;
  keywords: string[];
  priceDisplayType: 'SELECT' | 'NOT_DISPLAY';
  prices: { name: string; nameRaw: string; desc: string }[]; // 카카오 가격(아이템)
  scheduleLabel: string;
  slotMinutes: 30;
  issues: Issue[];
  canLink: boolean; // error 없으면 true
};

function mapToKakao(it: GdItem): Mapped {
  const issues: Issue[] = [];

  // 상품명: 노출명 우선 → 없으면 진료항목명. 50자 초과 시 자동 절삭.
  const rawName = it.alias || it.name;
  const productName = rawName.slice(0, KAKAO_NAME_MAX);
  if (rawName.length > KAKAO_NAME_MAX) {
    issues.push({ level: 'warn', field: '상품명', msg: `${rawName.length}자 → 카카오 규격 50자로 잘려서 노출돼요.`, fixHint: '노출명을 50자 이내로 줄이면 그대로 노출돼요.' });
  }

  // 가격 → 카카오 가격(아이템). 금액 필드가 없어 참고가 문구로 변환.
  const prices = it.prices.map((p) => {
    const nameRaw = p.title;
    const name = nameRaw.slice(0, KAKAO_PRICE_NAME_MAX);
    if (nameRaw.length > KAKAO_PRICE_NAME_MAX) {
      issues.push({ level: 'warn', field: '가격명', msg: `"${nameRaw.slice(0, 12)}…" ${nameRaw.length}자 → 카카오 25자로 잘려요.`, fixHint: '가격명을 25자 이내로 줄여주세요.' });
    }
    let desc = '';
    if (p.type === 'fixed') desc = `${won(p.origin)} (참고가)`;
    else if (p.type === 'discount') desc = `${won(p.sale)} (참고가)`;
    else desc = '상담 후 결정';
    return { name, nameRaw, desc };
  });

  // 금액 표현 규격
  const hasAmount = it.prices.some((p) => p.type !== 'consult');
  if (hasAmount) {
    issues.push({ level: 'info', field: '가격', msg: '카카오는 금액을 결제하지 않고 "참고가"로만 노출해요.' });
  }
  if (it.prices.some((p) => p.type === 'discount')) {
    issues.push({ level: 'warn', field: '할인가', msg: '카카오는 정상가·할인율을 지원하지 않아 판매가만 참고가로 노출돼요.' });
  }

  // 스케줄 (카카오 상품 필수)
  let scheduleLabel = '';
  if (!it.schedule) {
    issues.push({ level: 'error', field: '예약 스케줄', msg: '예약 스케줄이 없어 카카오 상품으로 등록할 수 없어요.', fixHint: '진료항목 예약 설정에서 스케줄을 먼저 등록하세요.' });
  } else {
    scheduleLabel = `${it.schedule.days} · 슬롯 30분`;
    if (it.schedule.interval !== 30) {
      issues.push({ level: 'warn', field: '슬롯 간격', msg: `굿닥 ${it.schedule.interval}분 간격 → 카카오는 슬롯이 30분 고정이라 30분 단위로 정렬돼요.`, fixHint: '30분 간격으로 맞추면 슬롯이 1:1로 매칭돼요.' });
    }
    if (it.schedule.stock > 1) {
      issues.push({ level: 'info', field: '재고', msg: `슬롯당 정원 ${it.schedule.stock} → 카카오 스케줄 재고로 그대로 전달돼요.` });
    }
  }

  // 이미지 / 설명
  if (it.images === 0) {
    issues.push({ level: 'info', field: '대표 이미지', msg: '이미지가 없어 카카오에서는 장소(병원) 대표 이미지로 대체돼요.' });
  }
  if (!it.intro) {
    issues.push({ level: 'info', field: '상품설명', msg: '한 줄 소개가 없어 카카오 상품설명이 비어 있어요.' });
  }

  return {
    productName, productNameRaw: rawName,
    description: it.intro,
    keywords: it.keywords,
    priceDisplayType: it.prices.length > 1 ? 'SELECT' : 'NOT_DISPLAY',
    prices, scheduleLabel, slotMinutes: 30,
    issues,
    canLink: !issues.some((i) => i.level === 'error')
  };
}

const countBy = (issues: Issue[], lv: IssueLevel) => issues.filter((i) => i.level === lv).length;

/* ============================ icons ============================ */
const Chevron = () => (<svg viewBox="0 0 12 12" fill="none"><path d="M4.5 2.5L8 6l-3.5 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>);
const Back = () => (<svg viewBox="0 0 20 20" fill="none"><path d="M12 5l-5 5 5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>);
const CheckSm = () => (<svg viewBox="0 0 16 16" fill="none"><path d="M3.5 8.5l3 3 6-6.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>);
const ArrowR = () => (<svg viewBox="0 0 20 20" fill="none"><path d="M4 10h11M11 6l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>);
const IcError = () => (<svg viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7.25" stroke="currentColor" strokeWidth="1.5" /><path d="M9 5v5M9 12.6v.1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>);
const IcWarn = () => (<svg viewBox="0 0 18 18" fill="none"><path d="M9 2.5l7 12H2l7-12z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /><path d="M9 7v3.2M9 12.7v.1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>);
const IcInfo = () => (<svg viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7.25" stroke="currentColor" strokeWidth="1.5" /><path d="M9 8v4.2M9 5.4v.1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>);
const KakaoMark = ({ sm }: { sm?: boolean }) => (<svg viewBox="0 0 20 20" fill="none" className={sm ? 'kl-kmark sm' : 'kl-kmark'}><rect width="20" height="20" rx="5" fill="#FEE500" /><path d="M10 5.1c-2.9 0-5.2 1.8-5.2 4 0 1.4.95 2.62 2.38 3.32-.1.36-.37 1.34-.42 1.55 0 0-.02.09.04.12.06.03.13 0 .13 0 .17-.02 1.9-1.28 2.2-1.5.29.04.58.06.87.06 2.9 0 5.2-1.8 5.2-4S12.9 5.1 10 5.1z" fill="#3C1E1E" /></svg>);

/* ============================ 공용 UI ============================ */
function Toggle({ on, onToggle, disabled }: { on: boolean; onToggle: () => void; disabled?: boolean }) {
  return (
    <button className={`kl-toggle${on ? ' on' : ''}${disabled ? ' disabled' : ''}`} onClick={() => !disabled && onToggle()} aria-pressed={on}>
      <span className="kl-toggle-knob" />
    </button>
  );
}

const LEVEL_META: Record<IssueLevel, { label: string; cls: string; Icon: () => JSX.Element }> = {
  error: { label: '오류', cls: 'err', Icon: IcError },
  warn: { label: '경고', cls: 'warn', Icon: IcWarn },
  info: { label: '안내', cls: 'info', Icon: IcInfo }
};

/* ============================ 사이드내비 ============================ */
function SideNav() {
  return (
    <nav className="cn-nav">
      <div className="cn-nav-scroll">
        <div className="cn-nav-group">
          <div className="cn-nav-header">서비스 운영</div>
          <button className="cn-nav-item"><span className="cn-nav-label-wrap"><span className="cn-nav-label">차트 접수·예약</span></span><span className="cn-chevron"><Chevron /></span></button>
          <button className="cn-nav-item"><span className="cn-nav-label-wrap"><span className="cn-nav-label">비급여 예약</span><span className="cn-beta">beta</span></span></button>
          <button className="cn-nav-item sub"><span className="cn-nav-label-wrap"><span className="cn-nav-label">진료항목 관리</span></span></button>
          <button className="cn-nav-item"><span className="cn-nav-label-wrap"><span className="cn-nav-label">병원 약관</span></span><span className="cn-chevron"><Chevron /></span></button>
        </div>
        <div className="cn-nav-divider"><span /></div>
        <div className="cn-nav-group">
          <div className="cn-nav-header">외부 플랫폼 연동</div>
          <button className="cn-nav-item"><span className="cn-nav-label-wrap"><span className="cn-nav-label">카카오톡 예약하기</span></span><span className="cn-chevron"><Chevron /></span></button>
          <button className="cn-nav-item sub active"><span className="cn-nav-label-wrap"><span className="cn-nav-label">진료항목 상품 연동</span></span></button>
          <button className="cn-nav-item sub"><span className="cn-nav-label-wrap"><span className="cn-nav-label">연동 설정</span></span></button>
        </div>
      </div>
      <div className="cn-nav-footer">
        <div className="cn-nav-divider"><span /></div>
        <button className="cn-nav-item"><span className="cn-nav-label">고객센터</span></button>
        <button className="cn-nav-item"><span className="cn-nav-label">환경 설정</span></button>
      </div>
    </nav>
  );
}

/* ============================ 상태 뱃지 ============================ */
function LinkBadge({ it }: { it: GdItem }) {
  if (it.link === 'linked') return <span className="kl-badge linked"><span className="kl-dot" />연동됨</span>;
  const m = mapToKakao(it);
  if (!m.canLink) return <span className="kl-badge err"><span className="kl-dot" />연동 불가</span>;
  if (countBy(m.issues, 'warn') > 0) return <span className="kl-badge warn"><span className="kl-dot" />검토 필요</span>;
  return <span className="kl-badge ready"><span className="kl-dot" />연동 준비됨</span>;
}

/* ============================ 카카오 상품 미리보기 ============================ */
function KakaoPreview({ it, m }: { it: GdItem; m: Mapped }) {
  return (
    <div className="kl-kphone">
      <div className="kl-kphone-bar"><KakaoMark /><span>카카오톡 예약하기</span></div>
      <div className="kl-kphone-body">
        <div className={`kl-kimg${it.images === 0 ? ' empty' : ''}`}>{it.images === 0 ? '병원 대표 이미지' : `상품 이미지 ${it.images}장`}</div>
        <div className="kl-kpad">
          <div className="kl-kname">{m.productName || '상품명'}</div>
          {m.description && <div className="kl-kdesc">{m.description}</div>}
          <div className="kl-kkeywords">{m.keywords.map((k) => <span key={k} className="kl-kkw">#{k}</span>)}</div>
          <div className="kl-kdivider" />
          <div className="kl-ksec-label">가격 {m.priceDisplayType === 'SELECT' ? '(선택)' : ''}</div>
          {m.prices.map((p, i) => (
            <div key={i} className="kl-kprice"><span className="kl-kprice-name">{p.name}</span><span className="kl-kprice-desc">{p.desc}</span></div>
          ))}
          <div className="kl-kdivider" />
          <div className="kl-ksec-label">예약 시간</div>
          <div className="kl-kslot">{m.scheduleLabel || '스케줄 없음'}</div>
        </div>
        <div className="kl-kcta">예약하기</div>
      </div>
    </div>
  );
}

/* ============================ 매핑 필드 행 ============================ */
function MapRow({ label, from, to, status }: { label: string; from: React.ReactNode; to: React.ReactNode; status: 'ok' | 'warn' | 'err' }) {
  return (
    <div className="kl-maprow">
      <div className="kl-map-label">{label}</div>
      <div className="kl-map-from">{from}</div>
      <div className={`kl-map-arrow ${status}`}><ArrowR /></div>
      <div className={`kl-map-to ${status}`}>{to}</div>
    </div>
  );
}

/* ============================================================ */
function KakaoLink() {
  const [items, setItems] = useState<GdItem[]>(INITIAL);
  const [screen, setScreen] = useState<'list' | 'detail'>('list');
  const [selId, setSelId] = useState<number | null>(null);
  const [checked, setChecked] = useState<number[]>([]);
  const [hospitalLinked] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (m: string) => { setToast(m); window.setTimeout(() => setToast(null), 2400); };

  const sel = items.find((i) => i.id === selId) || null;
  const mapped = useMemo(() => (sel ? mapToKakao(sel) : null), [sel]);

  // 목록에서 연동 가능(연동 안 됨 + error 없음)인 항목만 체크 대상
  const linkable = (it: GdItem) => it.link === 'none' && mapToKakao(it).canLink;
  const toggleCheck = (id: number) => setChecked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const checkableIds = items.filter(linkable).map((i) => i.id);
  const allChecked = checkableIds.length > 0 && checkableIds.every((id) => checked.includes(id));

  const doLink = (ids: number[]) => {
    setItems((prev) => prev.map((it) => (ids.includes(it.id) ? { ...it, link: 'linked' } : it)));
    setChecked((p) => p.filter((id) => !ids.includes(id)));
  };
  const bulkLink = () => {
    if (checked.length === 0) return;
    doLink(checked);
    showToast(`${checked.length}개 진료항목을 카카오 상품으로 연동했어요.`);
  };
  const unlink = (id: number) => { setItems((prev) => prev.map((it) => (it.id === id ? { ...it, link: 'none' } : it))); showToast('카카오 상품 연동을 해제했어요.'); };

  const linkedCount = items.filter((i) => i.link === 'linked').length;

  return (
    <div className="cn-artboard">
      <div className="cn-screen">
        <div className="cn-titlebar">
          <div className="cn-ci"><span className="cn-ci-mark"><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="7" fill="#0073FA" /><circle cx="10.2" cy="3.8" r="2.4" fill="#41D293" /></svg></span><span className="cn-ci-name">굿닥 커넥트 4.2.0</span></div>
          <div className="cn-winctrls"><button className="cn-winbtn">─</button><button className="cn-winbtn">▢</button><button className="cn-winbtn close">✕</button></div>
        </div>
        <div className="cn-body">
          <SideNav />
          <main className="cn-main kl-main">

            {/* ===================== 목록 ===================== */}
            {screen === 'list' && (
              <>
                <div className="kl-header">
                  <div className="kl-header-top">
                    <div>
                      <div className="cn-header-title">진료항목 상품 연동</div>
                      <div className="kl-sub">이미 등록한 진료항목을 카카오톡 예약하기 상품으로 자동 변환해 연동해요. 규격에 안 맞는 부분만 검토하면 됩니다.</div>
                    </div>
                  </div>
                  <div className={`kl-hbanner${hospitalLinked ? ' on' : ''}`}>
                    <KakaoMark />
                    <div className="kl-hbanner-txt">
                      <b>카카오톡 예약하기 연동 병원</b>
                      <span className="kl-sub">채널 연결 완료 · 연동된 상품 {linkedCount}개</span>
                    </div>
                    <span className="kl-hbanner-tag">연결됨</span>
                  </div>
                </div>

                <div className="kl-body">
                  <div className="kl-table">
                    <div className="kl-tr kl-th">
                      <span className="kl-c-check">
                        <span className={`kl-check${allChecked ? ' on' : ''}${checkableIds.length === 0 ? ' disabled' : ''}`}
                          onClick={() => checkableIds.length && setChecked(allChecked ? [] : checkableIds)}>{allChecked && <CheckSm />}</span>
                      </span>
                      <span>진료항목</span>
                      <span>대표가격</span>
                      <span>예약 스케줄</span>
                      <span>연동 상태</span>
                      <span />
                    </div>
                    {items.map((it) => {
                      const m = mapToKakao(it);
                      const canCheck = linkable(it);
                      const isChecked = checked.includes(it.id);
                      const p0 = it.prices[0];
                      const priceText = p0.type === 'consult' ? '상담 후 결정' : p0.type === 'discount' ? won(p0.sale) : won(p0.origin);
                      return (
                        <div key={it.id} className={`kl-tr kl-row${isChecked ? ' checked' : ''}`} onClick={() => { setSelId(it.id); setScreen('detail'); }}>
                          <span className="kl-c-check" onClick={(e) => { e.stopPropagation(); canCheck && toggleCheck(it.id); }}>
                            <span className={`kl-check${isChecked ? ' on' : ''}${!canCheck ? ' disabled' : ''}`}>{isChecked && <CheckSm />}</span>
                          </span>
                          <span className="kl-cell-name">{it.name}{!it.visible && <span className="kl-hide-tag">굿닥 미노출</span>}</span>
                          <span className="kl-sub">{priceText}{it.prices.length > 1 ? ` 외 ${it.prices.length - 1}` : ''}</span>
                          <span className="kl-sub">{it.schedule ? it.schedule.days : <span className="kl-none">없음</span>}</span>
                          <span><LinkBadge it={it} /></span>
                          <span className="kl-c-more">
                            {m.issues.length > 0 && <span className={`kl-issuecount ${m.canLink ? 'warn' : 'err'}`}>{m.canLink ? `검토 ${m.issues.filter((i) => i.level !== 'info').length}` : '해결 필요'}</span>}
                            <span className="kl-arrow-r"><Chevron /></span>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="kl-note">행을 클릭하면 카카오 규격 자동 매핑 결과와 검증 내용을 볼 수 있어요.</div>
                </div>

                {/* 하단 고정 액션 바 */}
                <div className={`kl-actionbar${checked.length ? ' show' : ''}`}>
                  <span className="kl-actionbar-txt">{checked.length}개 선택됨</span>
                  <div className="kl-actionbar-btns">
                    <button className="kl-btn-cancel" onClick={() => setChecked([])}>선택 해제</button>
                    <button className="kl-btn-kakao" onClick={bulkLink}><KakaoMark sm /> 카카오 상품으로 연동</button>
                  </div>
                </div>
              </>
            )}

            {/* ===================== 상세: 자동 매핑 + 검증 ===================== */}
            {screen === 'detail' && sel && mapped && (
              <>
                <div className="kl-header">
                  <button className="kl-back" onClick={() => setScreen('list')}><Back />목록</button>
                  <div className="cn-header-title">{sel.name}</div>
                  <div className="kl-sub">굿닥 진료항목을 카카오 상품 규격으로 자동 변환한 결과예요. 값은 굿닥에서 관리하고, 여기서는 규격만 확인해요.</div>
                </div>

                <div className="kl-detail">
                  {/* 좌: 매핑 테이블 + 검증 */}
                  <div className="kl-detail-left">
                    {/* 검증 요약 */}
                    <div className={`kl-verify ${mapped.canLink ? (countBy(mapped.issues, 'warn') ? 'warn' : 'ok') : 'err'}`}>
                      <div className="kl-verify-head">
                        {mapped.canLink
                          ? <><span className="kl-verify-ic ok"><CheckSm /></span><b>카카오 상품으로 연동할 수 있어요</b></>
                          : <><span className="kl-verify-ic err"><IcError /></span><b>규격 오류가 있어 연동할 수 없어요</b></>}
                      </div>
                      <div className="kl-verify-counts">
                        <span className="kl-vc err"><IcError /> 오류 {countBy(mapped.issues, 'error')}</span>
                        <span className="kl-vc warn"><IcWarn /> 경고 {countBy(mapped.issues, 'warn')}</span>
                        <span className="kl-vc info"><IcInfo /> 안내 {countBy(mapped.issues, 'info')}</span>
                      </div>
                    </div>

                    {/* 필드 매핑 */}
                    <div className="kl-card">
                      <div className="kl-card-title">필드 자동 매핑 <span className="kl-card-sub">굿닥 → 카카오 상품</span></div>
                      <div className="kl-maptable">
                        <div className="kl-maprow kl-maphead"><span className="kl-map-label" /><span className="kl-map-from">굿닥 진료항목</span><span className="kl-map-arrow" /><span className="kl-map-to">카카오 상품</span></div>
                        <MapRow label="상품명" status={mapped.productNameRaw.length > KAKAO_NAME_MAX ? 'warn' : 'ok'}
                          from={<>{sel.alias || sel.name}<span className="kl-len">{(sel.alias || sel.name).length}자</span></>}
                          to={<>{mapped.productName}<span className="kl-len">≤50</span></>} />
                        <MapRow label="상품설명" status={sel.intro ? 'ok' : 'warn'}
                          from={sel.intro || <span className="kl-none">비어 있음</span>} to={mapped.description || <span className="kl-none">없음</span>} />
                        <MapRow label="이미지" status={sel.images ? 'ok' : 'warn'}
                          from={sel.images ? `${sel.images}장` : <span className="kl-none">없음</span>} to={sel.images ? `${sel.images}장` : '병원 대표 이미지 대체'} />
                        <MapRow label="키워드" status="ok"
                          from={sel.keywords.length ? sel.keywords.join(', ') : <span className="kl-none">없음</span>} to={mapped.keywords.length ? `${mapped.keywords.length}개` : '없음'} />
                        <div className="kl-map-divider" />
                        {sel.prices.map((p, i) => (
                          <MapRow key={i} label={i === 0 ? '가격' : ''} status={p.title.length > KAKAO_PRICE_NAME_MAX ? 'warn' : (p.type === 'discount' ? 'warn' : 'ok')}
                            from={<><b>{p.title}</b><span className="kl-len">{p.type === 'consult' ? '상담' : p.type === 'discount' ? `${won(p.origin)}→${won(p.sale)}` : won(p.origin)}</span></>}
                            to={<><b>{mapped.prices[i].name}</b><span className="kl-len">{mapped.prices[i].desc}</span></>} />
                        ))}
                        <div className="kl-map-divider" />
                        <MapRow label="예약 스케줄" status={!sel.schedule ? 'err' : (sel.schedule.interval !== 30 ? 'warn' : 'ok')}
                          from={sel.schedule ? `${sel.schedule.days} · ${sel.schedule.interval}분 간격` : <span className="kl-none">없음</span>}
                          to={mapped.scheduleLabel || <span className="kl-none err">등록 불가</span>} />
                      </div>
                    </div>

                    {/* 검증 상세 리스트 */}
                    <div className="kl-card">
                      <div className="kl-card-title">검증 결과</div>
                      {mapped.issues.length === 0 && <div className="kl-issue-empty">규격에 모두 맞아요. 그대로 연동돼요.</div>}
                      {mapped.issues.map((iss, i) => {
                        const meta = LEVEL_META[iss.level];
                        return (
                          <div key={i} className={`kl-issue ${meta.cls}`}>
                            <span className="kl-issue-ic"><meta.Icon /></span>
                            <div className="kl-issue-body">
                              <div className="kl-issue-top"><span className={`kl-issue-lv ${meta.cls}`}>{meta.label}</span><span className="kl-issue-field">{iss.field}</span></div>
                              <div className="kl-issue-msg">{iss.msg}</div>
                              {iss.fixHint && <div className="kl-issue-fix">→ {iss.fixHint}</div>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 우: 카카오 미리보기 (sticky) */}
                  <div className="kl-detail-right">
                    <div className="kl-preview-label">카카오톡 예약하기 미리보기</div>
                    <KakaoPreview it={sel} m={mapped} />
                  </div>
                </div>

                {/* 하단 고정 바 */}
                <div className="kl-footer">
                  {sel.link === 'linked' ? (
                    <>
                      <span className="kl-footer-status linked"><span className="kl-dot" />카카오에 연동됨</span>
                      <button className="kl-btn-danger" onClick={() => { unlink(sel.id); setScreen('list'); }}>연동 해제</button>
                    </>
                  ) : (
                    <>
                      <span className="kl-footer-status">
                        {mapped.canLink
                          ? (countBy(mapped.issues, 'warn') ? `경고 ${countBy(mapped.issues, 'warn')}건이 자동 보정돼 연동돼요.` : '규격 확인 완료. 바로 연동할 수 있어요.')
                          : '규격 오류를 굿닥에서 먼저 해결해야 연동할 수 있어요.'}
                      </span>
                      <div className="kl-footer-btns">
                        {!mapped.canLink && <button className="kl-btn-outline" onClick={() => showToast('진료항목 예약 설정 화면으로 이동해요.')}>굿닥에서 수정</button>}
                        <button className="kl-btn-kakao" disabled={!mapped.canLink} onClick={() => { doLink([sel.id]); showToast('카카오 상품으로 연동했어요.'); setScreen('list'); }}>
                          <KakaoMark sm /> {countBy(mapped.issues, 'warn') ? '확인하고 연동' : '카카오 상품으로 연동'}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}

            {toast && <div className="kl-toast">{toast}</div>}
          </main>
        </div>
      </div>
    </div>
  );
}

export default KakaoLink;
