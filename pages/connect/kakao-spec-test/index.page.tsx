import React, { useMemo, useState } from 'react';
import {
  FiPlus,
  FiTrash2,
  FiMenu,
  FiChevronUp,
  FiChevronDown,
  FiX,
  FiSettings,
  FiList,
  FiFileText,
  FiCalendar,
  FiAlertCircle,
} from 'react-icons/fi';

/* =========================================================================
 * 카카오톡 예약하기 연동 — FE 기능명세 프로토타입 (spec-only build)
 * 4 화면: ① 진료항목 목록 ② 진료항목 상세(폼) ③ 예약 신청 내역 ④ 진료 예약 설정
 * ======================================================================= */

/* ---------- 타입 ---------- */
type KakaoStatus = '연동완료' | '연동대기' | '연동불가' | '연동해제' | '미연동';
type PriceType = 'FIXED' | 'DISCOUNT' | 'CONSULT';
type QType = 'text' | 'radio' | 'select';

interface PriceOption {
  id: string;
  name: string;
  type: PriceType;
  amount: number; // 고정가 / 할인 정상가
  salePrice: number; // 할인 판매가
  description: string; // 가격 설명
  active: boolean;
}
interface Question {
  id: string;
  category: '주관식' | '객관식';
  multi: boolean; // 객관식 복수 선택
  name: string;
  description: string;
  options: string[];
  required: boolean; // 답변 필수 (required=true → optional=false)
}
interface Item {
  id: string;
  name: string;
  oneLine: string;
  thumbnail: string;
  visible: boolean; // 굿닥 노출 (노출 의도의 선행 조건)
  kakaoLinked: boolean; // 카카오 노출 의도
  prices: PriceOption[];
  questions: Question[];
  usageMethod: string;
  notice: string;
  cancelNotice: string;
  keywords: string[];
}
interface Reservation {
  id: string;
  patientName: string;
  phone: string;
  itemName: string;
  deviceType: 1 | 2 | 3; // 1 모바일 / 2 카카오 / 3 네이버
  status: string;
  tab: 'apply' | 'upcoming' | 'past';
  dateTime: string;
  kakaoQA?: { q: string; a: string | null }[];
}

/* ---------- 입력 상한 ---------- */
const LIMIT = {
  qName: 120,
  qCount: 10,
  optItem: 50,
  qDesc: 200,
  usage: 2000,
  notice: 100,
  cancelNotice: 100,
  priceDesc: 100,
  optMin: 2,
  optMax: 10,
};

/* ---------- 유틜 ---------- */
const won = (n: number) => n.toLocaleString('ko-KR') + '원';
const uid = () => Math.random().toString(36).slice(2, 9);

/* 가격 옵션 → 카카오 Price 최종 문구 변환 */
function priceToKakao(p: PriceOption): string {
  let core: string;
  if (p.type === 'CONSULT') core = '상담 후 결정';
  else if (p.type === 'DISCOUNT') core = won(p.salePrice);
  else core = won(p.amount);
  const bracket = `[${core}]`;
  return p.description.trim() ? `${bracket} - ${p.description.trim()}` : bracket;
}

/* ---------- 시드 데이터 ---------- */
function seedItems(): Item[] {
  return [
    {
      id: 'i1',
      name: '독감 예방접종',
      oneLine: '4가 독감 백신 접종',
      thumbnail: '💉',
      visible: true,
      kakaoLinked: true,
      prices: [
        { id: uid(), name: '4가 일반', type: 'FIXED', amount: 30000, salePrice: 0, description: '', active: true },
        { id: uid(), name: '4가 프리미엄', type: 'DISCOUNT', amount: 60000, salePrice: 45000, description: '65세 이상 할인가', active: true },
      ],
      questions: [
        { id: uid(), category: '주관식', multi: false, name: '현재 복용 중인 약이 있나요?', description: '', options: [], required: false },
        { id: uid(), category: '객관식', multi: false, name: '이전에 독감 백신 접종 경험이 있나요?', description: '최근 1년 기준', options: ['있음', '없음'], required: true },
      ],
      usageMethod: '내원 후 문진표 작성 → 접종 → 15분 경과 관찰 후 귀가합니다.',
      notice: '발열 시 접종이 어려울 수 있습니다.',
      cancelNotice: '방문 2시간 전까지 취소 가능합니다.',
      keywords: ['독감', '예방접종', '백신'],
    },
    {
      id: 'i2',
      name: '종합 건강검진',
      oneLine: '기본 혈액/소변 검사 패키지',
      thumbnail: '🩺',
      visible: true,
      kakaoLinked: false,
      prices: [
        { id: uid(), name: '기본 패키지', type: 'FIXED', amount: 120000, salePrice: 0, description: '공복 8시간 필요', active: true },
      ],
      questions: [],
      usageMethod: '',
      notice: '',
      cancelNotice: '',
      keywords: ['건강검진', '혈액검사'],
    },
    {
      id: 'i3',
      name: '피부 상담',
      oneLine: '전문의 1:1 피부 상담',
      thumbnail: '🧴',
      visible: false,
      kakaoLinked: true,
      prices: [
        { id: uid(), name: '초진 상담', type: 'CONSULT', amount: 0, salePrice: 0, description: '', active: true },
      ],
      questions: [
        { id: uid(), category: '객관식', multi: true, name: '고민 부위를 선택해주세요.', description: '복수 선택 가능', options: ['얼굴', '목', '등', '팔'], required: true },
      ],
      usageMethod: '',
      notice: '',
      cancelNotice: '',
      keywords: ['피부', '상담'],
    },
    {
      id: 'i4',
      name: '영양 수액',
      oneLine: '맞춤 영양 수액 처방',
      thumbnail: '💧',
      visible: true,
      kakaoLinked: false,
      prices: [
        { id: uid(), name: '피로회복', type: 'FIXED', amount: 50000, salePrice: 0, description: '', active: true },
        { id: uid(), name: '면역강화', type: 'DISCOUNT', amount: 80000, salePrice: 70000, description: '', active: true },
        { id: uid(), name: '숙취해소', type: 'FIXED', amount: 40000, salePrice: 0, description: '', active: false },
      ],
      questions: [],
      usageMethod: '',
      notice: '',
      cancelNotice: '',
      keywords: ['수액', '영양'],
    },
  ];
}

function seedReservations(): Reservation[] {
  return [
    {
      id: 'r1', patientName: '김민수', phone: '010-1234-5678', itemName: '독감 예방접종',
      deviceType: 2, status: '확정대기', tab: 'apply', dateTime: '2026-08-19 10:30',
      kakaoQA: [
        { q: '현재 복용 중인 약이 있나요?', a: '혈압약 복용 중' },
        { q: '이전에 독감 백신 접종 경험이 있나요?', a: '있음' },
      ],
    },
    {
      id: 'r2', patientName: '이서연', phone: '010-2222-3333', itemName: '종합 건강검진',
      deviceType: 1, status: '확정대기', tab: 'apply', dateTime: '2026-08-19 09:10',
    },
    {
      id: 'r3', patientName: '박지훈', phone: '010-4444-5555', itemName: '피부 상담',
      deviceType: 2, status: '예약확정', tab: 'upcoming', dateTime: '2026-08-25 14:00',
      kakaoQA: [
        { q: '고민 부위를 선택해주세요.', a: '얼굴, 목' },
        { q: '언제부터 증상이 있었나요?', a: null },
      ],
    },
    {
      id: 'r4', patientName: '최유진', phone: '010-6666-7777', itemName: '영양 수액',
      deviceType: 3, status: '예약확정', tab: 'upcoming', dateTime: '2026-08-22 16:30',
    },
    {
      id: 'r5', patientName: '정하늘', phone: '010-8888-9999', itemName: '독감 예방접종',
      deviceType: 2, status: '진료완료', tab: 'past', dateTime: '2026-08-10 11:00',
      kakaoQA: [{ q: '현재 복용 중인 약이 있나요?', a: '없음' }],
    },
    {
      id: 'r6', patientName: '한지원', phone: '010-1010-2020', itemName: '종합 건강검진',
      deviceType: 1, status: '예약취소', tab: 'past', dateTime: '2026-08-08 08:30',
    },
    {
      id: 'r7', patientName: '오세훈', phone: '010-3030-4040', itemName: '피부 상담',
      deviceType: 2, status: '자동 종료', tab: 'past', dateTime: '2026-08-05 13:00',
      kakaoQA: [{ q: '고민 부위를 선택해주세요.', a: '등' }],
    },
  ];
}

/* =========================================================================
 * 루트
 * ======================================================================= */
type Screen = 'list' | 'detail' | 'reservations' | 'settings';

export default function KakaoSpecTestPage() {
  // 공통 전제 (프로토타입 설정으로 토글)
  const [kakaoStatus, setKakaoStatus] = useState<KakaoStatus>('연동완료');
  const [autoConfirm, setAutoConfirm] = useState(false); // 병원 예약 자동 확정
  const [reservationOn, setReservationOn] = useState(true); // 진료 예약 받기

  const [items, setItems] = useState<Item[]>(seedItems);
  const [reservations] = useState<Reservation[]>(seedReservations);

  const [screen, setScreen] = useState<Screen>('list');
  const [detailId, setDetailId] = useState<string>('i1');

  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2600);
  };

  const isLinked = kakaoStatus === '연동완료';

  const openDetail = (id: string) => {
    setDetailId(id);
    setScreen('detail');
  };

  const updateItem = (id: string, patch: Partial<Item>) =>
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));

  const nav: { key: Screen; label: string; icon: React.ReactNode }[] = [
    { key: 'list', label: '진료항목 목록', icon: <FiList /> },
    { key: 'detail', label: '진료항목 상세', icon: <FiFileText /> },
    { key: 'reservations', label: '예약 신청 내역', icon: <FiCalendar /> },
    { key: 'settings', label: '진료 예약 설정', icon: <FiSettings /> },
  ];

  return (
    <div className="kx-root">
      {/* LNB */}
      <aside className="kx-lnb">
        <div className="kx-lnb-title">진료 예약</div>
        {nav.map((n) => (
          <button
            key={n.key}
            className={`kx-lnb-item ${screen === n.key ? 'active' : ''}`}
            onClick={() => setScreen(n.key)}
          >
            <span className="kx-lnb-ico">{n.icon}</span>
            {n.label}
          </button>
        ))}

        {/* 프로토타입 설정 (제품 UI와 분리) */}
        <div className="kx-devbox">
          <div className="kx-devbox-title">프로토타입 설정</div>
          <label className="kx-dev-row">
            <span>카카오 연동 상태</span>
            <select
              value={kakaoStatus}
              onChange={(e) => setKakaoStatus(e.target.value as KakaoStatus)}
            >
              {['연동완료', '연동대기', '연동불가', '연동해제', '미연동'].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>
          <label className="kx-dev-row">
            <span>예약 자동 확정</span>
            <input
              type="checkbox"
              checked={autoConfirm}
              onChange={(e) => setAutoConfirm(e.target.checked)}
            />
          </label>
          <label className="kx-dev-row">
            <span>진료 예약 받기</span>
            <input
              type="checkbox"
              checked={reservationOn}
              onChange={(e) => setReservationOn(e.target.checked)}
            />
          </label>
          <div className="kx-dev-note">
            {isLinked ? '카카오 영역 표시됨' : '연동완료 아님 → 카카오 영역 숨김'}
          </div>
        </div>
      </aside>

      {/* 본문 */}
      <main className="kx-main">
        {screen === 'list' && (
          <ListScreen
            items={items}
            isLinked={isLinked}
            onToggleVisible={(id, v) => updateItem(id, { visible: v })}
            onOpen={openDetail}
            onDelete={(id) => showToast('활성/미래 예약이 있는 항목은 삭제 대신 운영 중지됩니다.')}
          />
        )}
        {screen === 'detail' && (
          <DetailScreen
            item={items.find((it) => it.id === detailId) || items[0]}
            isLinked={isLinked}
            autoConfirm={autoConfirm}
            onSave={(patch) => {
              updateItem(detailId, patch);
              showToast('저장되었습니다.');
            }}
            showToast={showToast}
          />
        )}
        {screen === 'reservations' && (
          <ReservationsScreen reservations={reservations} isLinked={isLinked} showToast={showToast} />
        )}
        {screen === 'settings' && (
          <SettingsScreen
            isLinked={isLinked}
            autoConfirm={autoConfirm}
            setAutoConfirm={setAutoConfirm}
            reservationOn={reservationOn}
            setReservationOn={setReservationOn}
            visibleCount={items.filter((it) => it.visible).length}
            showToast={showToast}
          />
        )}
      </main>

      {toast && <div className="kx-toast">{toast}</div>}
    </div>
  );
}

/* =========================================================================
 * 채널 심볼 (공통 규격)
 * ======================================================================= */
function ChannelSymbols({ goodocActive, kakaoActive }: { goodocActive: boolean; kakaoActive: boolean }) {
  return (
    <span className="kx-chan">
      <span className={`kx-sym kx-sym-goodoc ${goodocActive ? '' : 'dim'}`} title="굿닥">굿</span>
      <span className={`kx-sym kx-sym-kakao ${kakaoActive ? '' : 'dim'}`} title="카카오">카</span>
    </span>
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
    <div className="kx-page">
      <h1 className="kx-h1">진료항목 목록</h1>
      {!isLinked && (
        <p className="kx-muted">카카오 연동 상태가 연동완료가 아니므로 채널 셀을 표시하지 않습니다.</p>
      )}
      <div className="kx-list">
        {items.map((it) => {
          const goodocActive = it.visible ?? true;
          const kakaoActive = it.kakaoLinked && goodocActive;
          const rep = it.prices[0];
          const repLabel = rep
            ? rep.type === 'CONSULT'
              ? '상담 후 결정'
              : rep.type === 'DISCOUNT'
              ? won(rep.salePrice)
              : won(rep.amount)
            : '-';
          return (
            <div key={it.id} className="kx-row" onClick={() => onOpen(it.id)}>
              <span className="kx-drag" onClick={(e) => e.stopPropagation()}><FiMenu /></span>
              <span className="kx-thumb">{it.thumbnail}</span>
              <div className="kx-row-main">
                <div className="kx-row-name">{it.name}</div>
                <div className="kx-row-sub">
                  {repLabel}
                  {it.prices.length > 1 && <span className="kx-optcount"> · 옵션 {it.prices.length}개</span>}
                </div>
              </div>

              {/* 채널 셀 (연동완료에서만 렌더) */}
              {isLinked && (
                <span className="kx-cell-chan" onClick={(e) => e.stopPropagation()}>
                  <ChannelSymbols goodocActive={goodocActive} kakaoActive={kakaoActive} />
                </span>
              )}

              {/* 굿닥 노출 토글 (상세 진입과 분리) */}
              <span className="kx-cell-toggle" onClick={(e) => e.stopPropagation()}>
                <Toggle
                  checked={it.visible}
                  onChange={(v) => onToggleVisible(it.id, v)}
                  ariaLabel="굿닥 노출"
                />
              </span>

              <button
                className="kx-icon-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(it.id);
                }}
                title="삭제"
              >
                <FiTrash2 />
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
  autoConfirm,
  onSave,
  showToast,
}: {
  item: Item;
  isLinked: boolean;
  autoConfirm: boolean;
  onSave: (patch: Partial<Item>) => void;
  showToast: (m: string) => void;
}) {
  const [name, setName] = useState(item.name);
  const [oneLine, setOneLine] = useState(item.oneLine);
  const [visible, setVisible] = useState(item.visible);
  const [kakaoLinked, setKakaoLinked] = useState(item.kakaoLinked);
  const [prices, setPrices] = useState<PriceOption[]>(item.prices);
  const [questions, setQuestions] = useState<Question[]>(item.questions);
  const [usageMethod, setUsageMethod] = useState(item.usageMethod);
  const [notice, setNotice] = useState(item.notice);
  const [cancelNotice, setCancelNotice] = useState(item.cancelNotice);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 항목 변경 시 폼 리로드
  React.useEffect(() => {
    setName(item.name);
    setOneLine(item.oneLine);
    setVisible(item.visible);
    setKakaoLinked(item.kakaoLinked);
    setPrices(item.prices);
    setQuestions(item.questions);
    setUsageMethod(item.usageMethod);
    setNotice(item.notice);
    setCancelNotice(item.cancelNotice);
    setErrors({});
  }, [item.id]);

  const activePriceCount = prices.filter((p) => p.active).length;

  // 상태 안내 배너 3분기
  const banner = !visible
    ? { tone: 'neg', text: '굿닥에 노출 중인 진료항목만 카카오톡 예약하기에도 노출할 수 있어요.' }
    : !kakaoLinked
    ? { tone: 'neg', text: "카카오톡 예약하기에 노출하려면 '우측 상단 스위치'를 켜주세요." }
    : { tone: 'normal', text: '위에 입력한 진료항목 정보가 카카오톡 예약하기에도 함께 표시돼요.' };

  const clearErr = (key: string) =>
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });

  /* ---- 발문 빌더 ---- */
  const addQuestion = () => {
    if (questions.length >= LIMIT.qCount) {
      showToast('질문은 최대 10개까지 추가할 수 있어요.');
      return;
    }
    setQuestions((prev) => [
      ...prev,
      { id: uid(), category: '객관식', multi: false, name: '', description: '', options: ['', ''], required: false },
    ]);
  };
  const patchQ = (id: string, patch: Partial<Question>) =>
    setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  const removeQ = (id: string) => setQuestions((prev) => prev.filter((q) => q.id !== id));
  const moveQ = (idx: number, dir: -1 | 1) => {
    setQuestions((prev) => {
      const next = [...prev];
      const t = idx + dir;
      if (t < 0 || t >= next.length) return prev;
      [next[idx], next[t]] = [next[t], next[idx]];
      return next;
    });
  };

  /* ---- 저장 검증 ---- */
  const handleSave = () => {
    const errs: Record<string, string> = {};
    // 질문 이름 미입력
    questions.forEach((q) => {
      if (!q.name.trim()) errs[`q-${q.id}-name`] = '질문 이름을 입력해주세요.';
      // 객관식 빈 선택지
      if (q.category === '객관식') {
        q.options.forEach((o, oi) => {
          if (!o.trim()) errs[`q-${q.id}-opt-${oi}`] = '선택지를 입력해주세요.';
        });
      }
    });
    // 가격 최종 문구 100자 초과
    prices.forEach((p) => {
      if (priceToKakao(p).length > LIMIT.priceDesc) {
        errs[`price-${p.id}`] = `가격 최종 문구가 ${LIMIT.priceDesc}자를 초과했습니다.`;
      }
    });
    // 활성 가격 0개 + 카카오 ON 불가
    if (kakaoLinked && activePriceCount === 0) {
      errs['price-active'] = '활성 가격 옵션이 없어 카카오 노출을 켤 수 없습니다.';
    }

    if (Object.keys(errs).length) {
      setErrors(errs);
      showToast('입력값을 확인해주세요.');
      const first = document.querySelector('.kx-field-error');
      if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    onSave({ name, oneLine, visible, kakaoLinked, prices, questions, usageMethod, notice, cancelNotice });
  };

  return (
    <div className="kx-page">
      <h1 className="kx-h1">진료항목 상세</h1>

      {/* 공통 진료항목 정보 (요약) */}
      <section className="kx-fieldset">
        <div className="kx-fs-title">기본 정보</div>
        <Field label={`노출명 (최대 50자)`}>
          <input
            value={name}
            maxLength={50}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>
        <Field label="한 줄 소개 (최대 50자)">
          <input value={oneLine} maxLength={50} onChange={(e) => setOneLine(e.target.value)} />
        </Field>
        <label className="kx-inline-toggle">
          <Toggle checked={visible} onChange={setVisible} ariaLabel="굿닥 노출" />
          <span>굿닥 노출</span>
        </label>
      </section>

      {/* 가격 옵션 */}
      <section className="kx-fieldset">
        <div className="kx-fs-title">가격 옵션 (활성 {activePriceCount}개)</div>
        {errors['price-active'] && <div className="kx-field-error kx-banner-inline neg">{errors['price-active']}</div>}
        {prices.map((p) => {
          const converted = priceToKakao(p);
          const over = converted.length > LIMIT.priceDesc;
          return (
            <div key={p.id} className={`kx-price ${errors[`price-${p.id}`] ? 'kx-field-error' : ''}`}>
              <div className="kx-price-head">
                <input
                  className="kx-price-name"
                  value={p.name}
                  maxLength={50}
                  placeholder="가격명 (최대 50자)"
                  onChange={(e) =>
                    setPrices((prev) => prev.map((x) => (x.id === p.id ? { ...x, name: e.target.value } : x)))
                  }
                />
                <select
                  value={p.type}
                  onChange={(e) => {
                    clearErr(`price-${p.id}`);
                    setPrices((prev) =>
                      prev.map((x) => (x.id === p.id ? { ...x, type: e.target.value as PriceType } : x))
                    );
                  }}
                >
                  <option value="FIXED">고정 가격</option>
                  <option value="DISCOUNT">할인 가격</option>
                  <option value="CONSULT">상담 후 결정</option>
                </select>
                <label className="kx-mini-toggle">
                  <input
                    type="checkbox"
                    checked={p.active}
                    onChange={(e) =>
                      setPrices((prev) => prev.map((x) => (x.id === p.id ? { ...x, active: e.target.checked } : x)))
                    }
                  />
                  활성
                </label>
              </div>
              {p.type === 'FIXED' && (
                <input
                  type="number"
                  value={p.amount}
                  placeholder="금액"
                  onChange={(e) =>
                    setPrices((prev) => prev.map((x) => (x.id === p.id ? { ...x, amount: Number(e.target.value) } : x)))
                  }
                />
              )}
              {p.type === 'DISCOUNT' && (
                <div className="kx-inline-2">
                  <input
                    type="number"
                    value={p.amount}
                    placeholder="정상가"
                    onChange={(e) =>
                      setPrices((prev) =>
                        prev.map((x) => (x.id === p.id ? { ...x, amount: Number(e.target.value) } : x))
                      )
                    }
                  />
                  <input
                    type="number"
                    value={p.salePrice}
                    placeholder="판매가"
                    onChange={(e) =>
                      setPrices((prev) =>
                        prev.map((x) => (x.id === p.id ? { ...x, salePrice: Number(e.target.value) } : x))
                      )
                    }
                  />
                </div>
              )}
              <input
                value={p.description}
                placeholder="가격 설명 (선택)"
                onChange={(e) => {
                  clearErr(`price-${p.id}`);
                  setPrices((prev) => prev.map((x) => (x.id === p.id ? { ...x, description: e.target.value } : x)));
                }}
              />
              <div className={`kx-price-preview ${over ? 'over' : ''}`}>
                카카오 표기: <code>{converted}</code>{' '}
                <span className="kx-charcount">
                  {converted.length}/{LIMIT.priceDesc}
                </span>
              </div>
              {errors[`price-${p.id}`] && <div className="kx-err-msg">{errors[`price-${p.id}`]}</div>}
            </div>
          );
        })}
        <button
          className="kx-btn kx-btn-ghost"
          onClick={() =>
            setPrices((prev) => [
              ...prev,
              { id: uid(), name: '', type: 'FIXED', amount: 0, salePrice: 0, description: '', active: true },
            ])
          }
        >
          <FiPlus /> 가격 옵션 추가
        </button>
      </section>

      {/* 외부 플랫폼 정보 — 카카오 노출 설정 카드 (연동완료에서만) */}
      {isLinked ? (
        <section className="kx-fieldset kx-card-kakao">
          <div className="kx-card-head">
            <div className="kx-fs-title">외부 플랫폼 정보 · 카카오톡 예약하기</div>
            <label className="kx-card-toggle">
              <span>카카오톡 예약하기에서도 보이기</span>
              <Toggle checked={kakaoLinked} onChange={setKakaoLinked} ariaLabel="카카오 노출" />
            </label>
          </div>

          {/* 상태 안내 배너 */}
          <div className={`kx-banner ${banner.tone === 'neg' ? 'neg' : 'normal'}`}>
            <FiAlertCircle /> {banner.text}
          </div>

          {/* 토글 설명 + (수동 확정 시) 한 줄 */}
          <div className="kx-toggle-desc">
            카카오톡 예약하기에 노출 여부를 정합니다. 저장 시 외부 반영이 시작됩니다.
            {!autoConfirm && (
              <div className="kx-toggle-desc-extra">카카오톡 예약하기로 받는 예약은 자동으로 확정됩니다.</div>
            )}
          </div>

          {/* 예약 시 받을 정보 (발문 빌더) */}
          <div className="kx-subsec">
            <div className="kx-subsec-title">예약 시 받을 정보</div>
            {questions.map((q, idx) => (
              <div key={q.id} className="kx-question">
                <div className="kx-q-head">
                  <span className="kx-drag"><FiMenu /></span>
                  <select
                    value={q.category}
                    onChange={(e) => {
                      const category = e.target.value as '주관식' | '객관식';
                      patchQ(q.id, {
                        category,
                        options: category === '객관식' && q.options.length < 2 ? ['', ''] : q.options,
                      });
                    }}
                  >
                    <option value="주관식">주관식</option>
                    <option value="객관식">객관식</option>
                  </select>
                  <input
                    className={errors[`q-${q.id}-name`] ? 'kx-field-error' : ''}
                    value={q.name}
                    maxLength={LIMIT.qName}
                    placeholder={`질문 입력 (최대 ${LIMIT.qName}자)`}
                    onChange={(e) => {
                      clearErr(`q-${q.id}-name`);
                      patchQ(q.id, { name: e.target.value });
                    }}
                  />
                  <span className="kx-q-move">
                    <button className="kx-icon-btn" onClick={() => moveQ(idx, -1)} disabled={idx === 0}><FiChevronUp /></button>
                    <button className="kx-icon-btn" onClick={() => moveQ(idx, 1)} disabled={idx === questions.length - 1}><FiChevronDown /></button>
                  </span>
                </div>
                {errors[`q-${q.id}-name`] && <div className="kx-err-msg">{errors[`q-${q.id}-name`]}</div>}

                {q.category === '객관식' && (
                  <>
                    <input
                      className="kx-q-desc"
                      value={q.description}
                      maxLength={LIMIT.qDesc}
                      placeholder={`질문 설명 (최대 ${LIMIT.qDesc}자)`}
                      onChange={(e) => patchQ(q.id, { description: e.target.value })}
                    />
                    <div className="kx-options">
                      {q.options.map((o, oi) => (
                        <div key={oi} className="kx-option">
                          <span className={`kx-opt-marker ${q.multi ? 'square' : 'circle'}`} />
                          <input
                            className={errors[`q-${q.id}-opt-${oi}`] ? 'kx-field-error' : ''}
                            value={o}
                            maxLength={LIMIT.optItem}
                            placeholder={`선택지 (최대 ${LIMIT.optItem}자)`}
                            onChange={(e) => {
                              clearErr(`q-${q.id}-opt-${oi}`);
                              patchQ(q.id, { options: q.options.map((x, xi) => (xi === oi ? e.target.value : x)) });
                            }}
                          />
                          <button
                            className="kx-icon-btn"
                            disabled={q.options.length <= LIMIT.optMin}
                            onClick={() => patchQ(q.id, { options: q.options.filter((_, xi) => xi !== oi) })}
                            title="선택지 삭제"
                          >
                            <FiX />
                          </button>
                        </div>
                      ))}
                      <button
                        className="kx-btn kx-btn-ghost kx-btn-sm"
                        disabled={q.options.length >= LIMIT.optMax}
                        onClick={() => patchQ(q.id, { options: [...q.options, ''] })}
                      >
                        <FiPlus /> 선택지 추가
                      </button>
                    </div>
                  </>
                )}

                <div className="kx-q-foot">
                  <label className="kx-mini-toggle">
                    <input
                      type="checkbox"
                      checked={q.required}
                      onChange={(e) => patchQ(q.id, { required: e.target.checked })}
                    />
                    답변 필수
                  </label>
                  {q.category === '객관식' && (
                    <label className="kx-mini-toggle">
                      <input
                        type="checkbox"
                        checked={q.multi}
                        onChange={(e) => patchQ(q.id, { multi: e.target.checked })}
                      />
                      복수 선택
                    </label>
                  )}
                  <span className="kx-q-type-tag">
                    유형: {q.category === '주관식' ? 'text' : q.multi ? 'select' : 'radio'}
                  </span>
                  <button className="kx-icon-btn kx-danger" onClick={() => removeQ(q.id)} title="질문 삭제">
                    <FiTrash2 />
                  </button>
                </div>
              </div>
            ))}
            {questions.length >= LIMIT.qCount ? (
              <div className="kx-muted kx-note">질문은 최대 10개까지 추가할 수 있어요.</div>
            ) : (
              <button className="kx-btn kx-btn-ghost" onClick={addQuestion}>
                <FiPlus /> 질문 추가
              </button>
            )}
          </div>

          {/* 이용 방법 · 유의사항 · 취소 유의사항 (카카오 전용) */}
          <div className="kx-subsec">
            <div className="kx-subsec-title">이용 안내 (카카오톡 예약하기에만 노출)</div>
            <Field label="이용 방법">
              <textarea
                rows={4}
                value={usageMethod}
                maxLength={LIMIT.usage}
                onChange={(e) => setUsageMethod(e.target.value)}
              />
              <div className="kx-charcount">
                {usageMethod.length.toLocaleString('ko-KR')}/{LIMIT.usage.toLocaleString('ko-KR')}
              </div>
            </Field>
            <Field label="유의사항">
              <input value={notice} maxLength={LIMIT.notice} onChange={(e) => setNotice(e.target.value)} />
              <div className="kx-charcount">{notice.length}/{LIMIT.notice}</div>
            </Field>
            <Field label="취소 유의사항">
              <input value={cancelNotice} maxLength={LIMIT.cancelNotice} onChange={(e) => setCancelNotice(e.target.value)} />
              <div className="kx-charcount">{cancelNotice.length}/{LIMIT.cancelNotice}</div>
            </Field>
          </div>
        </section>
      ) : (
        <p className="kx-muted">카카오 연동 상태가 연동완료가 아니므로 카카오 설정 카드를 표시하지 않습니다.</p>
      )}

      <div className="kx-save-bar">
        <button className="kx-btn kx-btn-primary" onClick={handleSave}>저장</button>
      </div>
    </div>
  );
}

/* =========================================================================
 * ③ 예약 신청 내역
 * ======================================================================= */
const PERIOD_PRESETS = ['최근 30일', '최근 7일', '오늘', '직접 설정'] as const;
const PAST_STATUSES = ['전체', '진료완료', '예약취소', '자동 종료'];

function ReservationsScreen({
  reservations,
  isLinked,
  showToast,
}: {
  reservations: Reservation[];
  isLinked: boolean;
  showToast: (m: string) => void;
}) {
  const [tab, setTab] = useState<'apply' | 'upcoming' | 'past'>('apply');
  const [period, setPeriod] = useState<(typeof PERIOD_PRESETS)[number]>('최근 30일');
  const [statusFilter, setStatusFilter] = useState('전체');
  const [searchType, setSearchType] = useState<'name' | 'phone' | 'item'>('name');
  const [searchValue, setSearchValue] = useState('');
  const [detail, setDetail] = useState<Reservation | null>(null);

  const filtered = useMemo(() => {
    let rows = reservations.filter((r) => r.tab === tab);
    if (tab === 'past' && statusFilter !== '전체') rows = rows.filter((r) => r.status === statusFilter);
    const v = searchValue.trim();
    if (v) {
      if (searchType === 'name' && v.length >= 2) rows = rows.filter((r) => r.patientName.includes(v));
      else if (searchType === 'phone' && v.replace(/\D/g, '').length >= 4)
        rows = rows.filter((r) => r.phone.replace(/\D/g, '').includes(v.replace(/\D/g, '')));
      else if (searchType === 'item' && v.length >= 2) rows = rows.filter((r) => r.itemName.includes(v));
    }
    return rows;
  }, [reservations, tab, statusFilter, searchType, searchValue]);

  const searchHint =
    searchType === 'name' ? '환자명 2자 이상' : searchType === 'phone' ? '연락처 숫자 4자리 이상' : '진료항목명 2자 이상';

  return (
    <div className="kx-page">
      <h1 className="kx-h1">예약 신청 내역</h1>

      {/* 탭 */}
      <div className="kx-tabs">
        {[
          { k: 'apply', l: '예약 신청' },
          { k: 'upcoming', l: '내원 예정' },
          { k: 'past', l: '지난 내역' },
        ].map((t) => (
          <button
            key={t.k}
            className={`kx-tab ${tab === t.k ? 'active' : ''}`}
            onClick={() => setTab(t.k as any)}
          >
            {t.l}
          </button>
        ))}
      </div>

      {/* 필터 바 */}
      <div className="kx-filterbar">
        <div className="kx-presets">
          {PERIOD_PRESETS.map((p) => (
            <button
              key={p}
              className={`kx-chip ${period === p ? 'active' : ''}`}
              onClick={() => {
                setPeriod(p);
                if (p === '직접 설정') showToast('조회 기간은 최대 6개월까지 설정할 수 있어요.');
              }}
            >
              {p}
            </button>
          ))}
        </div>
        {tab === 'past' && (
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            {PAST_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        )}
        <div className="kx-search">
          <select value={searchType} onChange={(e) => setSearchType(e.target.value as any)}>
            <option value="name">환자명</option>
            <option value="phone">연락처</option>
            <option value="item">진료항목명</option>
          </select>
          <input
            value={searchValue}
            placeholder={searchHint}
            onChange={(e) => setSearchValue(e.target.value)}
          />
        </div>
      </div>

      {/* 테이블 */}
      <table className="kx-table">
        <thead>
          <tr>
            {isLinked && <th className="kx-th-chan">채널</th>}
            <th>상태</th>
            <th>환자명</th>
            <th>연락처</th>
            <th>진료항목</th>
            <th>일시</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 && (
            <tr>
              <td colSpan={isLinked ? 7 : 6} className="kx-empty">조회 결과가 없습니다.</td>
            </tr>
          )}
          {filtered.map((r) => {
            const isKakao = r.deviceType === 2;
            return (
              <tr key={r.id}>
                {isLinked && (
                  <td className="kx-td-chan">
                    <ChannelSymbols goodocActive={!isKakao} kakaoActive={isKakao} />
                  </td>
                )}
                <td><span className="kx-status">{r.status}</span></td>
                <td>{r.patientName}</td>
                <td>{r.phone}</td>
                <td>{r.itemName}</td>
                <td>{r.dateTime}</td>
                <td>
                  <button className="kx-btn kx-btn-sm kx-btn-ghost" onClick={() => setDetail(r)}>상세</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* 상세 (요청사항 하위 카카오 Q&A) */}
      {detail && (
        <Modal onClose={() => setDetail(null)} title="예약 상세">
          <div className="kx-detail-grid">
            <div><span className="kx-dt-label">상태</span>{detail.status}</div>
            <div><span className="kx-dt-label">환자명</span>{detail.patientName}</div>
            <div><span className="kx-dt-label">연락처</span>{detail.phone}</div>
            <div><span className="kx-dt-label">진료항목</span>{detail.itemName}</div>
            <div><span className="kx-dt-label">일시</span>{detail.dateTime}</div>
            <div>
              <span className="kx-dt-label">채널</span>
              {detail.deviceType === 2 ? '카카오톡 예약하기' : '굿닥'}
            </div>
          </div>
          <div className="kx-req">
            <div className="kx-subsec-title">요청사항</div>
            {detail.deviceType === 2 && detail.kakaoQA && detail.kakaoQA.length > 0 ? (
              <div className="kx-qa">
                <div className="kx-qa-title">카카오 추가 질문·답변</div>
                {detail.kakaoQA.map((qa, i) => (
                  <div key={i} className="kx-qa-row">
                    <div className="kx-qa-q">{qa.q}</div>
                    <div className={`kx-qa-a ${qa.a ? '' : 'empty'}`}>{qa.a ?? '답변 없음'}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="kx-muted">추가 요청사항 없음</div>
            )}
          </div>
        </Modal>
      )}
    </div>
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
  visibleCount,
  showToast,
}: {
  isLinked: boolean;
  autoConfirm: boolean;
  setAutoConfirm: (v: boolean) => void;
  reservationOn: boolean;
  setReservationOn: (v: boolean) => void;
  visibleCount: number;
  showToast: (m: string) => void;
}) {
  const [confirmOffModal, setConfirmOffModal] = useState(false);
  const [stopReservationModal, setStopReservationModal] = useState(false);

  const handleAutoToggle = (next: boolean) => {
    if (next) {
      // OFF → ON: 즉시
      setAutoConfirm(true);
    } else {
      // ON → OFF: 연동완료면 모달, 아니면 즉시
      if (isLinked) setConfirmOffModal(true);
      else setAutoConfirm(false);
    }
  };

  const handleReservationToggle = (next: boolean) => {
    if (next) {
      if (visibleCount === 0) {
        showToast('노출 중인 진료항목이 없어, 진료 예약을 받을 수 없습니다.');
        return;
      }
      setReservationOn(true);
    } else {
      setStopReservationModal(true);
    }
  };

  return (
    <div className="kx-page">
      <h1 className="kx-h1">진료 예약 설정</h1>

      {/* 예약 자동 확정 */}
      <section className="kx-setting-box">
        <div className="kx-setting-row">
          <div>
            <div className="kx-setting-title">예약 자동 확정</div>
            <div className="kx-setting-desc">
              자동 확정 사용 시, 별도 승인 없이 예약 신청과 동시에 자동으로 확정됩니다.
            </div>
            {/* 적용 범위 한 줄 안내: 연동완료 && 자동확정 ON */}
            {isLinked && autoConfirm && (
              <div className="kx-oneliner">
                카카오톡 예약하기로 받는 예약은 이 설정과 관계없이 자동으로 확정됩니다.
              </div>
            )}
          </div>
          <Toggle checked={autoConfirm} onChange={handleAutoToggle} ariaLabel="예약 자동 확정" />
        </div>

        {/* 수동 확정 상태 안내 블록: 연동완료 && 자동확정 OFF */}
        {isLinked && !autoConfirm && (
          <div className="kx-warnblock">
            <div className="kx-warnblock-title">카카오톡 예약하기로 받는 예약은 자동으로 확정됩니다</div>
            <ul>
              <li>카카오톡 예약하기가 수동 확정을 지원하지 않아 적용된 임시 정책입니다.</li>
              <li>굿닥으로 받는 예약은 수동으로 확정됩니다.</li>
              <li>진료하기 어려운 예약은 예약 신청 내역에서 취소할 수 있습니다.</li>
            </ul>
          </div>
        )}
      </section>

      {/* 진료 예약 받기 */}
      <section className="kx-setting-box">
        <div className="kx-setting-row">
          <div>
            <div className="kx-setting-title">진료 예약 받기</div>
            <div className="kx-setting-desc">진료 예약 신청을 받을지 설정합니다.</div>
          </div>
          <div className="kx-toggle-with-label">
            <span className="kx-run-label">{reservationOn ? '운영중' : '미운영'}</span>
            <Toggle checked={reservationOn} onChange={handleReservationToggle} ariaLabel="진료 예약 받기" />
          </div>
        </div>
      </section>

      {/* 자동 확정 끄기 확인 모달 */}
      {confirmOffModal && (
        <Modal
          onClose={() => setConfirmOffModal(false)}
          title="카카오톡 예약하기로 받는 예약은 계속 자동으로 확정됩니다"
          footer={
            <>
              <button className="kx-btn kx-btn-ghost" onClick={() => setConfirmOffModal(false)}>취소</button>
              <button
                className="kx-btn kx-btn-primary"
                onClick={() => {
                  setAutoConfirm(false);
                  setConfirmOffModal(false);
                }}
              >
                자동 확정 끄기
              </button>
            </>
          }
        >
          <p>카카오톡 예약하기가 수동 확정을 지원하지 않아 적용된 임시 정책입니다.</p>
          <p>굿닥으로 받는 예약은 수동으로 확정됩니다.</p>
        </Modal>
      )}

      {/* 진료 예약 받기 중지 확인 모달 */}
      {stopReservationModal && (
        <Modal
          onClose={() => setStopReservationModal(false)}
          title="진료 예약 받기를 중지할까요?"
          footer={
            <>
              <button className="kx-btn kx-btn-ghost" onClick={() => setStopReservationModal(false)}>취소</button>
              <button
                className="kx-btn kx-btn-primary"
                onClick={() => {
                  setReservationOn(false);
                  setStopReservationModal(false);
                }}
              >
                중지하기
              </button>
            </>
          }
        >
          <p>중지하면 채널과 무관하게 신규 진료 예약이 차단됩니다.</p>
          <p>등록된 진료항목·노출 의도·기존 예약은 모두 보존되며, 다시 켜면 복원됩니다.</p>
        </Modal>
      )}
    </div>
  );
}

/* =========================================================================
 * 공용 컴포넌트
 * ======================================================================= */
function Toggle({
  checked,
  onChange,
  ariaLabel,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      className={`kx-toggle ${checked ? 'on' : ''}`}
      onClick={() => onChange(!checked)}
    >
      <span className="kx-toggle-knob" />
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="kx-field">
      <span className="kx-field-label">{label}</span>
      {children}
    </label>
  );
}

function Modal({
  title,
  children,
  footer,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="kx-modal-backdrop" onClick={onClose}>
      <div className="kx-modal" onClick={(e) => e.stopPropagation()}>
        <div className="kx-modal-head">
          <div className="kx-modal-title">{title}</div>
          <button className="kx-icon-btn" onClick={onClose}><FiX /></button>
        </div>
        <div className="kx-modal-body">{children}</div>
        {footer && <div className="kx-modal-foot">{footer}</div>}
      </div>
    </div>
  );
}
