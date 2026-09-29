/**
 * ─────────────────────────────────────────────────────────────
 * 이름      : application-unified — 통합 신청서 (420 예약 · 420 미리접수 · 진료항목 예약)
 * 상태      : 현행 · v0.9 · 최종수정 2026-09-29
 * PRD       : GAS-1 (Draft) 기반, PO 협의 2026-09-29 반영. PO 체험판 application-standard와 별개 페이지.
 *             내부 검토 메모는 사내 문서에 둔다(공개 저장소라 링크 미기재).
 * 배포URL   : https://connect-sq-sandbox.github.io/out/application-unified.html
 * 관련 CSS  : styles/applicationUnified.css (goodoc-design 토큰·컴포넌트 발췌, plain CSS)
 * 기술제약  : 샌드박스 빌드는 emotion/styled 금지 → plain CSS. 외부 요청 0. 가상 데이터·메모리 상태만.
 * 화면구성  : 좌측 체험 조건 패널 + 390px 폰 프레임(상단바 · 신청서 스크롤 · 하단 고정 CTA · 바텀시트)
 *
 * 핵심 결정(why)
 *  - [확정·PO협의] 병원 상세는 스킵하고 신청서만 통합. 세 서비스 포맷을 최대한 같게.
 *  - [확정·PO협의] 섹션 순서: ①진료실/진료항목(+내원목적 1뎁스 | 가격옵션) ②예약 희망일 ③예약자 정보 ④주소 ⑤약관동의 ⑥고정 CTA.
 *  - [확정·PO협의] 내원목적은 진료실에 목적이 설정된 경우만 노출. 목적에 따라 예약 가능 날짜가 달라짐.
 *  - [확정·PO협의] 가격옵션은 앞단에서 골라 왔지만 신청서에서 변경 가능.
 *  - [확정·PO협의] 예약 희망일은 최초 비어 있음. 진료항목은 목적 없이 운영일 전부 활성.
 *  - [확정·PO협의] 미리접수는 무조건 당일 → 캘린더 없이 '오늘' 고정 표시.
 *  - [확정·PO협의] 예약자 정보: 진료실=본인+가족+차트 조회(420 환자조회 참고), 진료항목=본인 또는 타인 입력.
 *  - [확정·PO협의] 주소: 병원 설정에 따라 필수/선택/미노출, 등록 주소 있으면 prefill.
 *  - [확정·PO협의] 약관: 병원 설정 약관만, 필수/선택 구분.
 *  - [확정·PO협의] CTA 항상 고정·활성. 누르면 첫 미입력 섹션으로 앵커 스크롤.
 *  - [확정·세화] 예약 희망일은 바텀시트에서 선택(캘린더 → 시간 칩 → '선택 완료'로 반영, 닫으면 미반영).
 *  - [확정·세화] 내원 목적은 칩이 아니라 선택 필드 → 바텀시트 라디오 목록(항목명이 길고 개수가 많을 수 있음). 고르면 바로 닫힘.
 *  - [유지·자체] 목적 없이 예약 희망일을 누르면 목적 시트를 바로 열고(시트 안 안내), 목적을 고르면 날짜 시트로 이어진다.
 *  - [확정·세화] 진료항목 가격옵션도 선택 필드 → 바텀시트로 통일(앞단 선택값이 채워진 상태로 진입, 변경 가능).
 *  - [확정·세화] 가격옵션은 복수 선택(As-is TreatmentItemOptionModal: 체크박스, 0개면 '옵션을 선택해 주세요' 스낵바).
 *    필드에 옵션별 금액 + 예상 결제 금액(As-is getTotalPaymentText: 할인가>정가, 상담형 섞이면 'N원~', 전부 상담이면 '상담 후 결정').
 *    시트는 초안 선택 후 'N개 선택 완료'로 반영, 닫으면 미반영.
 *  - [유지·자체] As-is 대비 차이: ①As-is는 체크 즉시 반영·버튼 '예약'(상세→신청 진입용), 체험판은 신청서 안 변경 시트라 초안+확정.
 *    ②금액을 행 오른쪽 칸에 둠(As-is는 제목 아래). ③0개일 때 스낵바 대신 버튼 비활성(토스트가 옵션을 가려서).
 *  - [유지·자체] 예약은 날짜 선택 후 시간 칩까지 선택(As-is 420 예약·진료항목과 동일).
 *  - [유지·자체] 대상자 변경 시 prefill 주소는 새 대상자 기준으로 다시 채우거나 비움. 직접 입력한 주소는 유지.
 *  - [유지·자체] 미리접수만 최대 5명 동시접수(체크박스, 6번째 선택 시 토스트). 예약·진료항목은 1명.
 *    근거: 사내 데이터상 동시접수 사용이 무시할 수 없는 규모(수치는 내부 문서).
 *  - [유지·자체] 내원 목적 미사용 진료실은 목적 필드를 숨기고, 예약 희망일을 바로 열 수 있다(체험 패널에서 1진료실 사용/미사용 전환).
 *  - [유지·자체] 진료실을 바꾸면 내원목적·일정 초기화, 목적을 바꿔 선택 날짜가 불가해지면 일정 초기화.
 *
 * 보류·TODO (PO 확인 대기)
 *  - [보류] 동시접수 시 내원목적을 사람별로 받을지(As-is는 사람별). 현재는 신청 단위 1개.
 *  - [보류] 동시접수 시 주소를 사람별로 받을지. 현재는 첫 번째 대상자 기준 1개.
 *  - [보류] 예약에서 대상자 선택 후 해당 시간이 불가해지는 경우(서버 환자 중복 필터) 처리 문구.
 *  - [보류] 차트에서만 조회된 사람(가족 미등록) 연결 시 본인확인·관계확인 절차.
 *
 * 변경 이력
 *  - v0.1 (2026-09-29) 최초 작성.
 *  - v0.9 (2026-09-29) 가격옵션 복수 선택(체크박스·합계), 할인·상담형 옵션 예시.
 *  - v0.8 (2026-09-29) 체험 패널에 '1진료실 · 내원 목적 사용/미사용' 추가. 전환은 1진료실 선택 중일 때만 초기화, 날짜 시트도 닫음. 결과 화면에 원장명.
 *  - v0.7 (2026-09-29) 날짜 필드 경유로 목적을 고르면 날짜 시트로 이어짐, '먼저 선택' 안내는 그 경로에서만.
 *  - v0.6 (2026-09-29) 가격옵션도 바텀시트로 통일, 긴 옵션명 예시 추가.
 *  - v0.5 (2026-09-29) 내원 목적을 바텀시트로 변경, 목적 9개 예시.
 *  - v0.4 (2026-09-29) 내원 목적 선택을 칩 → 라디오 목록으로 변경, 긴 목적명 예시 추가.
 *  - v0.3 (2026-09-29) 2차 QA: 날짜 선택 시 시간 영역 자동 스크롤, 시트 위 토스트 하단 배치, 오류 토스트 red,
 *    연락처 010·생년월일 실재 날짜 검사, 서비스 전환 시 토스트 제거, 등록주소 '있음' 복귀 시 재prefill.
 *  - v0.2 (2026-09-29) 예약 희망일 바텀시트화. proto-qa 지적 반영: 주소 prefill 누수, 토스트 위치·줄바꿈,
 *    차트 후보 연결 상한 선검사, 타인 입력 형식 검사, 하위 필수 라벨 색, 조회 경합, DS 값(입력 16px·체크 20px·토스트).
 * ─────────────────────────────────────────────────────────────
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';

type Service = 'appt' | 'receipt' | 'treatment';
type Mode3 = 'required' | 'optional' | 'none';
type Person = { id: string; name: string; relation: string; birth: string; address?: string; chart?: boolean; family: boolean };

const TODAY = new Date(2026, 8, 29); // 2026-09-29 (화)
const NOW_MIN = 14 * 60; // 체험 기준 현재 시각 14:00
const HOLIDAYS = ['2026-10-03', '2026-10-09'];
const DOW = ['일', '월', '화', '수', '목', '금', '토'];

const ROOMS = [
  { id: 'r1', name: '1진료실', doctor: '이다온 원장', purposes: ['일반 진료', '재진 (이전 진료 이어서)', '예방접종', '영유아검진', '만성질환 정기 처방 (고혈압·당뇨 약 처방 및 혈액검사 결과 상담)', '국가건강검진', '수액·주사', '진단서·소견서 발급', '비대면 진료 후 내원'] },
  { id: 'r2', name: '2진료실', doctor: '박지안 원장', purposes: [] as string[] }
];
const ITEM = {
  name: '가다실 9가',
  desc: '자궁경부암 예방 백신',
  options: [
    { id: 'o1', label: '1회 접종', caption: '', type: 'fixed', origin: 220000, sale: null },
    { id: 'o2', label: '3회 패키지', caption: '6개월 안에 3회 접종', type: 'discount', origin: 660000, sale: 600000 },
    { id: 'o3', label: '2회차 접종 (타 병원에서 1회차 접종 완료한 경우)', caption: '', type: 'fixed', origin: 220000, sale: null },
    { id: 'o4', label: '접종 전 항체 검사', caption: '검사 결과에 따라 비용이 달라져요', type: 'consult', origin: null, sale: null }
  ] as PriceOpt[]
};
type PriceOpt = { id: string; label: string; caption: string; type: 'fixed' | 'discount' | 'consult'; origin: number | null; sale: number | null };
const won = (n: number) => `${n.toLocaleString('ko-KR')}원`;
/** As-is utils/treatmentItemPrice.ts: 할인가 > 정가, 상담형·금액 없음은 null */
const amountOf = (o: PriceOpt) => (o.type === 'discount' && o.sale ? o.sale : o.type === 'fixed' && o.origin ? o.origin : null);
const priceText = (o: PriceOpt) => { const a = amountOf(o); return a == null ? '상담 후 결정' : won(a); };
/** As-is getTotalPaymentText: 전부 상담 → '상담 후 결정', 상담 섞임 → 'N원~' */
function totalText(list: PriceOpt[]) {
  const amounts = list.map(amountOf);
  if (amounts.every(a => a == null)) return '상담 후 결정';
  const sum = amounts.reduce<number>((t, a) => t + (a ?? 0), 0);
  return amounts.some(a => a == null) ? `${won(sum)}~` : won(sum);
}
const ME = { name: '김하늘', phone: '010-1234-5678', birth: '1991.04.12' };
const SAVED_ADDR = '서울시 강남구 테헤란로 123';

const key = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const same = (a?: Date | null, b?: Date | null) => !!a && !!b && key(a) === key(b);
function validBirth(v: string) {
  if (!/^(19|20)\d{6}$/.test(v)) return false;
  const y = +v.slice(0, 4), m = +v.slice(4, 6), d = +v.slice(6, 8);
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d && dt <= TODAY;
}
const fmt = (d: Date) => `${d.getMonth() + 1}월 ${d.getDate()}일 (${DOW[d.getDay()]})`;

/** 가상 운영 규칙: 목적/진료실별 예약 가능 요일 */
function isAvailable(d: Date, service: Service, roomId: string, purpose: string) {
  const dt = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  if (dt < TODAY) return false;
  const limit = new Date(2026, 10, 30);
  if (dt > limit) return false;
  if (HOLIDAYS.includes(key(dt))) return false;
  const w = dt.getDay();
  if (w === 0) return false;
  if (service === 'treatment') return true; // 운영일 전부
  if (roomId === 'r2') return w !== 6; // 목적 없는 진료실: 평일
  if (purpose === '영유아검진') return w === 2 || w === 4;
  if (purpose === '예방접종') return w !== 6;
  return true; // 일반 진료: 월~토
}

function slotsFor(d: Date) {
  const all: string[] = [];
  for (let m = 9 * 60; m <= 17 * 60 + 30; m += 30) if (m < 12 * 60 + 30 || m >= 14 * 60) all.push(`${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`);
  const seed = d.getDate() * 7 + d.getMonth();
  return all.map((t, i) => {
    const [h, mm] = t.split(':').map(Number);
    const past = same(d, TODAY) && h * 60 + mm <= NOW_MIN;
    const full = (seed + i * 3) % 5 === 0;
    return { t, disabled: past || full, am: h < 12 };
  });
}

function buildMonth(y: number, m: number) {
  const first = new Date(y, m, 1);
  const lead = first.getDay(); // 일요일 시작
  const cells: (Date | null)[] = [];
  for (let i = 0; i < lead; i++) cells.push(null);
  const last = new Date(y, m + 1, 0).getDate();
  for (let i = 1; i <= last; i++) cells.push(new Date(y, m, i));
  return cells;
}

const Chevron = () => (
  <svg viewBox="0 0 16 16" fill="none"><path fillRule="evenodd" clipRule="evenodd" d="M2.86 5.53a.67.67 0 0 1 .94 0L8 9.72l4.2-4.2a.67.67 0 1 1 .94.95L8.47 11.14a.67.67 0 0 1-.94 0L2.86 6.47a.67.67 0 0 1 0-.94Z" fill="currentColor" /></svg>
);
const Right = () => (
  <svg viewBox="0 0 16 16" fill="none" style={{ transform: 'rotate(-90deg)' }}><path fillRule="evenodd" clipRule="evenodd" d="M2.86 5.53a.67.67 0 0 1 .94 0L8 9.72l4.2-4.2a.67.67 0 1 1 .94.95L8.47 11.14a.67.67 0 0 1-.94 0L2.86 6.47a.67.67 0 0 1 0-.94Z" fill="currentColor" /></svg>
);

function Seg<T extends string>({ value, onChange, items }: { value: T; onChange: (v: T) => void; items: [T, string][] }) {
  return (
    <div className="gd-segment" role="group">
      {items.map(([v, l]) => (
        <button key={v} type="button" className={value === v ? 'active' : ''} aria-pressed={value === v} onClick={() => onChange(v)}>{l}</button>
      ))}
    </div>
  );
}

function Calendar({ value, onPick, enabled }: { value: Date | null; onPick: (d: Date) => void; enabled: (d: Date) => boolean }) {
  const init = value || TODAY;
  const [view, setView] = useState({ y: init.getFullYear(), m: init.getMonth() });
  const cells = buildMonth(view.y, view.m);
  const minView = view.y === TODAY.getFullYear() && view.m === TODAY.getMonth();
  const maxView = view.y === 2026 && view.m === 10;
  const go = (d: number) => setView(v => { let m = v.m + d, y = v.y; if (m < 0) { m = 11; y--; } if (m > 11) { m = 0; y++; } return { y, m }; });
  return (
    <div className="gd-datepicker" style={{ marginTop: 8 }}>
      <div className="gd-dp-header">
        <span className="gd-dp-title">{view.y}년 {view.m + 1}월</span>
        <div className="gd-dp-navs">
          <button type="button" className="gd-dp-nav prev" disabled={minView} onClick={() => go(-1)} aria-label="이전 달"><Chevron /></button>
          <button type="button" className="gd-dp-nav next" disabled={maxView} onClick={() => go(1)} aria-label="다음 달"><Chevron /></button>
        </div>
      </div>
      <div className="gd-dp-grid">
        {DOW.map((d, i) => <div key={d} className={`gd-dp-dayname ${i === 0 ? 'sun' : ''}`}>{d}</div>)}
        {cells.map((c, i) => (
          <div key={i} className="gd-dp-cell">
            {c && (
              <button type="button" disabled={!enabled(c)} onClick={() => onPick(c)}
                className={`gd-dp-day ${c.getDay() === 0 ? 'sun' : ''} ${same(c, TODAY) ? 'today' : ''} ${same(c, value) ? 'selected' : ''}`}>
                {c.getDate()}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const FAMILY: Person[] = [
  { id: 'me', name: '김하늘', relation: '본인', birth: '1991.04.12', address: SAVED_ADDR, family: true },
  { id: 'f1', name: '이수민', relation: '배우자', birth: '1990.11.02', family: true },
  { id: 'f2', name: '김봄', relation: '자녀', birth: '2020.03.15', address: SAVED_ADDR, family: true },
  { id: 'f3', name: '김여름', relation: '자녀', birth: '2021.07.08', family: true },
  { id: 'f4', name: '김가을', relation: '자녀', birth: '2023.10.21', family: true }
];
const CHART_ONLY: Person[] = [{ id: 'c1', name: '김겨울', relation: '병원 기록', birth: '2024.12.30', chart: true, family: false }];

export default function Page() {
  // 체험 조건
  const [service, setService] = useState<Service>('appt');
  const [addrMode, setAddrMode] = useState<Mode3>('required');
  const [savedAddr, setSavedAddr] = useState<'yes' | 'no'>('yes');
  const [termsMode, setTermsMode] = useState<'both' | 'required' | 'none'>('both');
  const [lookupMode, setLookupMode] = useState<'ok' | 'fail'>('ok');
  const [purposeSetting, setPurposeSetting] = useState<'on' | 'off'>('on');

  // 신청서 상태
  const [roomId, setRoomId] = useState('r1');
  const [purpose, setPurpose] = useState('');
  const [optionIds, setOptionIds] = useState<string[]>(['o1']);
  const [optionDraft, setOptionDraft] = useState<string[]>([]);
  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState('');
  const [dateDraft, setDateDraft] = useState<Date | null>(null);
  const [timeDraft, setTimeDraft] = useState('');
  const [purposeFromDate, setPurposeFromDate] = useState(false);
  const [people, setPeople] = useState<Person[]>(FAMILY);
  const [picked, setPicked] = useState<string[]>([]);
  const [draft, setDraft] = useState<string[]>([]);
  const [who, setWho] = useState<'' | 'self' | 'other'>('');
  const [other, setOther] = useState({ name: '', phone: '', birth: '', gender: '' });
  const [addr, setAddr] = useState({ base: '', detail: '' });
  const [addrPrefilled, setAddrPrefilled] = useState(false);
  const [agree, setAgree] = useState<Record<string, boolean>>({});
  const [sheet, setSheet] = useState<'' | 'room' | 'patient' | 'date' | 'purpose' | 'option'>('');
  const [lookup, setLookup] = useState<'idle' | 'loading' | 'done' | 'fail'>('idle');
  const [errors, setErrors] = useState<string[]>([]);
  const [toast, setToast] = useState('');
  const [toastKind, setToastKind] = useState<'information' | 'error'>('information');
  const [done, setDone] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const secRefs = useRef<Record<string, HTMLElement | null>>({});
  const toastTimer = useRef<any>(null);
  const lookupTimer = useRef<any>(null);
  const timesRef = useRef<HTMLDivElement>(null);
  const lookupModeRef = useRef(lookupMode);
  lookupModeRef.current = lookupMode;

  const rooms = ROOMS.map(r => (r.id === 'r1' && purposeSetting === 'off' ? { ...r, purposes: [] as string[] } : r));
  const room = rooms.find(r => r.id === roomId)!;
  const isRoom = service !== 'treatment';
  const multi = service === 'receipt';
  const usesPurpose = isRoom && room.purposes.length > 0;
  const selectedOptions = ITEM.options.filter(o => optionIds.includes(o.id));
  const terms = termsMode === 'none' ? [] : [
    { id: 't1', label: '개인정보 수집·이용 동의', req: true },
    ...(termsMode === 'both' ? [{ id: 't2', label: '병원 소식 수신 동의', req: false }] : [])
  ];
  const ctaLabel = service === 'receipt' ? '접수하기' : '예약 신청하기';
  const personLabel = service === 'receipt' ? '접수자 정보' : '예약자 정보';

  function resetForm(s = service) {
    setRoomId('r1'); setPurpose(''); setOptionIds(['o1']); setDate(null); setTime(''); setDateDraft(null); setTimeDraft('');
    setPeople(FAMILY); setPicked([]); setDraft([]); setWho(''); setOther({ name: '', phone: '', birth: '', gender: '' });
    setAddr({ base: '', detail: '' }); setAddrPrefilled(false); setAgree({}); setSheet(''); setLookup('idle'); clearTimeout(lookupTimer.current);
    setErrors([]); setDone(false); setToast('');
    scrollRef.current?.scrollTo({ top: 0 });
    void s;
  }
  useEffect(() => { resetForm(service); }, [service]);

  function showToast(msg: string, kind: 'information' | 'error' = 'information') {
    setToast(msg); setToastKind(kind);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 2200);
  }
  const clearErr = (k: string) => setErrors(e => e.filter(x => x !== k));

  // 주소 prefill: 사용자가 직접 입력한 주소는 유지, prefill한 주소는 대상자 기준으로 다시 채우거나 비움
  function prefillFrom(p?: Person | null, self?: boolean) {
    if (addrMode === 'none') return;
    if (addr.base && !addrPrefilled) return;
    const has = savedAddr === 'yes' && (self || !!p?.address);
    if (has) { setAddr({ base: p?.address || SAVED_ADDR, detail: '101동 1001호' }); setAddrPrefilled(true); clearErr('addr'); }
    else if (addrPrefilled) { setAddr({ base: '', detail: '' }); setAddrPrefilled(false); }
  }
  useEffect(() => {
    if (savedAddr === 'no' && addrPrefilled) { setAddr({ base: '', detail: '' }); setAddrPrefilled(false); }
    if (savedAddr === 'yes' && !addr.base) {
      if (isRoom && picked.length) prefillFrom(people.find(p => p.id === picked[0]) || null);
      if (!isRoom && who === 'self') prefillFrom(null, true);
    }
  }, [savedAddr]);

  // 진료실 변경
  function pickRoom(id: string) {
    if (id !== roomId) { setRoomId(id); setPurpose(''); setDate(null); setTime(''); }
    setSheet(''); clearErr('service');
  }
  function pickPurpose(p: string) {
    setPurpose(p); clearErr('service');
    if (date && !isAvailable(date, service, roomId, p)) { setDate(null); setTime(''); showToast('선택한 날짜는 이 내원 목적으로 예약할 수 없어 다시 선택해 주세요'); }
  }
  // 예약 희망일 바텀시트: 시트 안에서 날짜·시간을 고르고 '선택 완료'로 반영
  function openCalendar() {
    if (usesPurpose && !purpose) { setErrors(e => Array.from(new Set([...e, 'service']))); jump('service'); setPurposeFromDate(true); setSheet('purpose'); return; }
    setDateDraft(date); setTimeDraft(time); setSheet('date');
  }
  function applyDate() {
    setDate(dateDraft); setTime(timeDraft); setSheet(''); clearErr('date');
  }

  // 환자 조회 (420 환자조회 참고: 목록 진입 시 조회). 타이머는 실행 시점의 조건값을 읽는다.
  function runLookup() {
    setLookup('loading');
    clearTimeout(lookupTimer.current);
    lookupTimer.current = setTimeout(() => setLookup(lookupModeRef.current === 'ok' ? 'done' : 'fail'), 900);
  }
  function openPatients() {
    setDraft(picked); setSheet('patient');
    if (lookup === 'idle' || lookup === 'fail') runLookup();
  }
  function toggleDraft(id: string) {
    if (!multi) { applyPatients([id]); return; }
    setDraft(d => {
      if (d.includes(id)) return d.filter(x => x !== id);
      if (d.length >= 5) { showToast('최대 5명까지 선택할 수 있어요', 'error'); return d; }
      return [...d, id];
    });
  }
  function applyPatients(ids: string[]) {
    setPicked(ids); setSheet(''); if (ids.length) clearErr('patient');
    prefillFrom(people.find(p => p.id === ids[0]) || null);
  }
  function linkChart(p: Person) {
    if (multi && draft.length >= 5) { showToast('최대 5명까지 선택할 수 있어요', 'error'); return; }
    // [보류] 실제로는 본인확인·관계확인 후 연결. 체험판은 확인 성공을 가정한다.
    const linked = { ...p, family: true, chart: true, relation: '가족' };
    setPeople(ps => [...ps, linked]);
    if (multi) { setDraft(d => [...d, p.id]); showToast(`${p.name}님을 가족으로 연결하고 선택했어요`); }
    else { setPicked([p.id]); setSheet(''); clearErr('patient'); prefillFrom(linked); showToast(`${p.name}님을 가족으로 연결했어요`); }
  }

  // 진료항목 타인 입력 형식 검사
  const otherInvalid = {
    name: other.name.trim().length < 2,
    phone: !/^010\d{7,8}$/.test(other.phone.replace(/\D/g, '')),
    birth: !validBirth(other.birth),
    gender: !other.gender
  };

  // 검증
  const missing = useMemo(() => {
    const m: string[] = [];
    if (isRoom ? usesPurpose && !purpose : optionIds.length === 0) m.push('service');
    if (service !== 'receipt' && (!date || !time)) m.push('date');
    if (isRoom ? picked.length === 0 : !who || (who === 'other' && Object.values(otherInvalid).some(Boolean))) m.push('patient');
    if (addrMode === 'required' && !addr.base) m.push('addr');
    if (terms.some(t => t.req && !agree[t.id])) m.push('terms');
    return m;
  }, [isRoom, usesPurpose, purpose, optionIds, service, date, time, picked, who, other, addrMode, addr, terms, agree]);

  function jump(k: string) {
    const el = secRefs.current[k];
    const sc = scrollRef.current;
    if (el && sc) sc.scrollTo({ top: el.getBoundingClientRect().top - sc.getBoundingClientRect().top + sc.scrollTop - 8, behavior: 'smooth' });
  }
  function submit() {
    if (missing.length) {
      setErrors(missing);
      jump(missing[0]);
      showToast('입력하지 않은 항목이 있어요', 'error');
      return;
    }
    setDone(true);
    scrollRef.current?.scrollTo({ top: 0 });
  }
  const err = (k: string) => errors.includes(k) && missing.includes(k);

  const pickedPeople = picked.map(id => people.find(p => p.id === id)).filter(Boolean) as Person[];
  const whoName = who === 'self' ? ME.name : other.name;

  /* ---------------- 렌더 ---------------- */
  const sections = (
    <>
      {/* ① 진료 선택 */}
      <section ref={el => (secRefs.current.service = el)} className={`au-sec ${err('service') ? 'err' : ''}`}>
        <div className="au-sec-head"><h2>{isRoom ? '진료실' : '진료항목'}</h2></div>
        {isRoom ? (
          <button type="button" className="au-pick" onClick={() => setSheet('room')}>
            <div className="au-pick-body">
              <div className="au-pick-title">{room.name} · {room.doctor}</div>
              <div className="au-pick-sub">굿닥가족의원</div>
            </div>
            <span className="gd-btn primaryLinkText">변경</span>
          </button>
        ) : (
          <div className="au-pick static">
            <div className="au-pick-body">
              <div className="au-pick-title">{ITEM.name}</div>
              <div className="au-pick-sub">{ITEM.desc} · 굿닥가족의원</div>
            </div>
          </div>
        )}
        {usesPurpose && (
          <>
            <div className="au-sub">내원 목적 <span className="req">필수</span></div>
            <button type="button" className={`au-pick ${sheet === 'purpose' ? 'open' : ''} ${err('service') ? 'err' : ''}`} onClick={() => { setPurposeFromDate(false); setSheet('purpose'); }} aria-haspopup="dialog">
              <div className="au-pick-body">
                {purpose ? <div className="au-pick-title au-wrap">{purpose}</div> : <div className="au-pick-ph">내원 목적을 선택해 주세요</div>}
              </div>
              {purpose ? <span className="gd-btn primaryLinkText">변경</span> : <Right />}
            </button>
            {service !== 'receipt' && <div className="au-help">내원 목적에 따라 예약할 수 있는 날짜가 달라요.</div>}
            {err('service') && <div className="au-err">내원 목적을 선택해 주세요.</div>}
          </>
        )}
        {!isRoom && (
          <>
            <div className="au-sub">가격 옵션 <span className="req">필수</span></div>
            <button type="button" className={`au-pick au-pick-top ${sheet === 'option' ? 'open' : ''}`} onClick={() => { setOptionDraft(optionIds); setSheet('option'); }} aria-haspopup="dialog">
              <div className="au-pick-body">
                {selectedOptions.map(o => (
                  <div key={o.id} className="au-price-row"><span className="au-wrap">{o.label}</span><span className="au-price-val"><strong>{priceText(o)}</strong>{o.type === 'discount' && o.origin && amountOf(o) != null && <s>{won(o.origin)}</s>}</span></div>
                ))}
                <div className="au-price-total"><span>예상 결제 금액</span><strong>{totalText(selectedOptions)}</strong></div>
              </div>
              <span className="gd-btn primaryLinkText">변경</span>
            </button>
            <div className="au-help">여러 옵션을 함께 선택할 수 있어요. 실제 결제 금액은 병원에서 달라질 수 있어요.</div>
          </>
        )}
      </section>

      {/* ② 예약 희망일 / 접수일 */}
      <section ref={el => (secRefs.current.date = el)} className={`au-sec ${err('date') ? 'err' : ''}`}>
        <div className="au-sec-head"><h2>{service === 'receipt' ? '접수일' : '예약 희망일'}</h2></div>
        {service === 'receipt' ? (
          <div className="au-today">
            <div><strong>오늘 · {fmt(TODAY)}</strong><span>도착한 순서대로 진료해요. 미리접수는 당일만 가능해요.</span></div>
          </div>
        ) : (
          <>
            <button type="button" className={`au-pick ${sheet === 'date' ? 'open' : ''} ${err('date') ? 'err' : ''}`} onClick={openCalendar} aria-haspopup="dialog">
              <div className="au-pick-body">
                {date ? <div className="au-pick-title">{fmt(date)} · {time}</div> : <div className="au-pick-ph">날짜와 시간을 선택해 주세요</div>}
                {usesPurpose && !purpose && <div className="au-pick-sub">내원 목적을 먼저 선택해 주세요</div>}
                {date && usesPurpose && <div className="au-pick-sub">선택한 내원 목적 기준</div>}
              </div>
              {date ? <span className="gd-btn primaryLinkText">변경</span> : <Right />}
            </button>
            {err('date') && <div className="au-err">예약 희망일과 시간을 선택해 주세요.</div>}
          </>
        )}
      </section>

      {/* ③ 예약자 정보 */}
      <section ref={el => (secRefs.current.patient = el)} className={`au-sec ${err('patient') ? 'err' : ''}`}>
        <div className="au-sec-head"><h2>{personLabel}</h2>{multi && <span className="opt">최대 5명</span>}</div>
        {isRoom ? (
          <>
            <button type="button" className={`au-pick ${err('patient') ? 'err' : ''}`} onClick={openPatients}>
              <div className="au-pick-body">
                {pickedPeople.length ? (
                  <div className="au-pick-title">{pickedPeople[0].name} · {pickedPeople[0].relation}{pickedPeople.length > 1 && ` 외 ${pickedPeople.length - 1}명`}</div>
                ) : <div className="au-pick-ph">진료받을 분을 선택해 주세요</div>}
                {pickedPeople.length > 0 && <div className="au-pick-sub">{pickedPeople[0].birth}</div>}
              </div>
              {pickedPeople.length ? <span className="gd-btn primaryLinkText">변경</span> : <Right />}
            </button>
            {multi && pickedPeople.length > 1 && (
              <div className="au-chips" style={{ marginTop: 10 }}>{pickedPeople.map(p => <span key={p.id} className="au-person-tag">{p.name}</span>)}</div>
            )}
            {multi && <div className="au-help">가족과 함께 최대 5명까지 접수할 수 있어요. 접수는 사람마다 따로 진행돼요.</div>}
            {err('patient') && <div className="au-err">진료받을 분을 선택해 주세요.</div>}
          </>
        ) : (
          <>
            <div className="au-chips">
              <button type="button" className={`au-chip ${who === 'self' ? 'on' : ''}`} onClick={() => { setWho('self'); clearErr('patient'); prefillFrom(null, true); }}>본인</button>
              <button type="button" className={`au-chip ${who === 'other' ? 'on' : ''}`} onClick={() => { setWho('other'); prefillFrom(null, false); }}>다른 사람</button>
            </div>
            {who === 'self' && (
              <div style={{ marginTop: 14 }}>
                <div className="au-field"><label>이름</label><input className="gd-input" readOnly value={ME.name} /></div>
                <div className="au-field"><label>연락처</label><input className="gd-input" readOnly value={ME.phone} /></div>
                <div className="au-help">굿닥 계정 정보로 예약해요.</div>
              </div>
            )}
            {who === 'other' && (
              <div style={{ marginTop: 14 }}>
                <div className="au-field"><label>이름</label><input className={`gd-input ${err('patient') && otherInvalid.name ? 'error' : ''}`} maxLength={20} placeholder="진료받을 분의 이름" value={other.name} onChange={e => setOther({ ...other, name: e.target.value })} /></div>
                <div className="au-field"><label>연락처</label><input className={`gd-input ${err('patient') && otherInvalid.phone ? 'error' : ''}`} maxLength={13} inputMode="tel" placeholder="010-0000-0000" value={other.phone} onChange={e => setOther({ ...other, phone: e.target.value })} /></div>
                <div className="au-field au-row">
                  <div><label>생년월일</label><input className={`gd-input ${err('patient') && otherInvalid.birth ? 'error' : ''}`} maxLength={8} inputMode="numeric" placeholder="YYYYMMDD" value={other.birth} onChange={e => setOther({ ...other, birth: e.target.value.replace(/\D/g, '') })} /></div>
                  <div className={err('patient') && otherInvalid.gender ? 'au-seg-err' : ''}><label>성별</label><Seg value={other.gender as any} onChange={v => setOther({ ...other, gender: v })} items={[['M', '남'], ['F', '여']]} /></div>
                </div>
                <div className="au-help">예약 안내는 입력한 연락처로 보내요.</div>
              </div>
            )}
            {err('patient') && <div className="au-err">{who === 'other' ? '이름(2자 이상)·연락처(010으로 시작)·생년월일(YYYYMMDD)·성별을 확인해 주세요.' : '진료받을 분을 선택해 주세요.'}</div>}
          </>
        )}
      </section>

      {/* ④ 주소 */}
      {addrMode !== 'none' && (
        <section ref={el => (secRefs.current.addr = el)} className={`au-sec ${err('addr') ? 'err' : ''}`}>
          <div className="au-sec-head"><h2>주소</h2>{addrMode === 'required' ? <span className="req">필수</span> : <span className="opt">선택</span>}</div>
          <div className="au-addr-search">
            <input className={`gd-input ${err('addr') ? 'error' : ''}`} placeholder="도로명, 건물명 또는 지번" value={addr.base} readOnly onClick={() => { setAddr({ base: '서울시 서초구 서초대로 456', detail: '' }); setAddrPrefilled(false); clearErr('addr'); }} />
            <button type="button" className="gd-btn sm secondaryOutline" onClick={() => { setAddr({ base: '서울시 서초구 서초대로 456', detail: '' }); setAddrPrefilled(false); clearErr('addr'); }}>검색</button>
          </div>
          {addr.base && <input className="gd-input" style={{ marginTop: 8 }} placeholder="상세 주소" value={addr.detail} onChange={e => setAddr({ ...addr, detail: e.target.value })} />}
          {addrPrefilled && <div className="au-help">등록된 주소를 불러왔어요. 바뀌었다면 수정해 주세요.</div>}
          {multi && pickedPeople.length > 1 && <div className="au-help">첫 번째 접수자({pickedPeople[0].name}) 기준 주소예요.</div>}
          {err('addr') && <div className="au-err">주소를 입력해 주세요.</div>}
        </section>
      )}

      {/* ⑤ 약관동의 */}
      {terms.length > 0 && (
        <section ref={el => (secRefs.current.terms = el)} className={`au-sec ${err('terms') ? 'err' : ''}`}>
          <div className="au-sec-head"><h2>약관 동의</h2></div>
          <button type="button" className="au-terms-all" onClick={() => {
            const all = terms.every(t => agree[t.id]);
            setAgree(Object.fromEntries(terms.map(t => [t.id, !all]))); if (!all) clearErr('terms');
          }}>
            <span className={`gd-check ${terms.every(t => agree[t.id]) ? 'on' : ''}`} /><strong>전체 동의</strong>
          </button>
          {terms.map(t => (
            <div key={t.id} className="au-term">
              <button type="button" className="chk" onClick={() => { const n = { ...agree, [t.id]: !agree[t.id] }; setAgree(n); if (!terms.some(x => x.req && !n[x.id])) clearErr('terms'); }}>
                <span className={`gd-check ${agree[t.id] ? 'on' : ''}`} />
                <span className={`gd-tag ${t.req ? 'blue' : 'gray'}`}>{t.req ? '필수' : '선택'}</span>
                <span>{t.label}</span>
              </button>
              <button type="button" className="view" onClick={() => showToast('병원이 등록한 약관 원문을 보여줘요 (체험)')}>보기</button>
            </div>
          ))}
          {err('terms') && <div className="au-err">필수 약관에 동의해 주세요.</div>}
        </section>
      )}
    </>
  );

  const doneView = (
    <div className="au-done">
      <div className="au-done-ic"><svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg></div>
      <h2>{service === 'receipt' ? '접수했어요' : '예약을 신청했어요'}</h2>
      <p>{service === 'receipt' ? '도착한 순서대로 진료해요. 병원 대기 현황을 확인해 주세요.' : '아직 확정 전이에요. 병원이 확인하면 알려드릴게요.'}</p>
      <dl>
        <div><dt>병원</dt><dd>굿닥가족의원</dd></div>
        <div><dt>{isRoom ? '진료실' : '진료항목'}</dt><dd>{isRoom ? `${room.name} · ${room.doctor}${purpose ? ` · ${purpose}` : ''}` : `${ITEM.name} · ${selectedOptions.map(o => o.label).join(', ')}`}</dd></div>
        {!isRoom && <div><dt>예상 금액</dt><dd>{totalText(selectedOptions)}</dd></div>}
        <div><dt>일정</dt><dd>{service === 'receipt' ? `오늘 · ${fmt(TODAY)}` : `${date && fmt(date)} ${time}`}</dd></div>
        <div><dt>{service === 'receipt' ? '접수자' : '예약자'}</dt><dd>{isRoom ? pickedPeople.map(p => p.name).join(', ') : whoName}</dd></div>
      </dl>
      {multi && pickedPeople.length > 1 && <div className="gd-banner basic" style={{ textAlign: 'left', marginBottom: 24 }}>{pickedPeople.length}명의 접수가 사람마다 따로 생성돼요. 진료 내역에서 각각 확인할 수 있어요.</div>}
      <button type="button" className="gd-btn lg primarySmooth" style={{ width: '100%' }} onClick={() => resetForm()}>처음부터 다시 체험</button>
    </div>
  );

  const patientSheet = (
    <div className="au-dim" onClick={e => { if (e.target === e.currentTarget) setSheet(''); }}>
      <div className="au-sheet" role="dialog" aria-modal="true" aria-label="진료받을 분 선택">
        <div className="au-sheet-head"><h3>진료받을 분</h3><button type="button" aria-label="닫기" onClick={() => setSheet('')}>×</button></div>
        <div className="au-sheet-body">
          {lookup === 'loading' && <div className="au-loading"><span className="au-spin" />병원 기록을 확인하고 있어요. 가족 목록은 먼저 선택할 수 있어요.</div>}
          {lookup === 'fail' && (
            <div className="gd-banner negative" style={{ justifyContent: 'space-between' }}>
              <span>병원 기록을 불러오지 못했어요. 가족 목록으로 신청할 수 있어요.</span>
              <button type="button" className="gd-btn primaryLinkText" onClick={runLookup}>다시 시도</button>
            </div>
          )}
          <h4>내 가족 {multi && <span className="opt" style={{ fontWeight: 500, color: 'var(--gray-60)' }}>{draft.length}/5명 선택</span>}</h4>
          {people.filter(p => p.family).map(p => {
            const on = multi ? draft.includes(p.id) : picked.includes(p.id);
            const matched = lookup === 'done' && (p.id === 'me' || p.id === 'f2' || p.chart);
            return (
              <button type="button" key={p.id} className={`au-opt ${on ? 'on' : ''}`} onClick={() => toggleDraft(p.id)}>
                <span className="au-opt-body">
                  <span className="au-opt-name">{p.name}<span className="gd-tag gray">{p.relation}</span>{matched && <span className="gd-tag green">병원 기록 있음</span>}</span>
                  <span className="au-opt-sub">{p.birth}</span>
                </span>
                <span className={multi ? `gd-check ${on ? 'on' : ''}` : `gd-radio ${on ? 'on' : ''}`} />
              </button>
            );
          })}
          <button type="button" className="gd-btn sm secondaryOutline" style={{ width: '100%', marginTop: 8 }} onClick={() => showToast('가족 추가 화면으로 이동해요 (체험)')}>+ 가족 추가</button>
          {lookup === 'done' && CHART_ONLY.filter(c => !people.some(p => p.id === c.id)).length > 0 && (
            <>
              <h4>이 병원에 기록이 있어요</h4>
              <div className="au-help" style={{ margin: '-4px 0 8px' }}>굿닥 가족으로 등록되지 않은 분이에요. 가족으로 연결한 뒤 선택할 수 있어요.</div>
              {CHART_ONLY.filter(c => !people.some(p => p.id === c.id)).map(p => (
                <button type="button" key={p.id} className="au-opt" onClick={() => linkChart(p)}>
                  <span className="au-opt-body"><span className="au-opt-name">{p.name}<span className="gd-tag blue">가족 미등록</span></span><span className="au-opt-sub">{p.birth}</span></span>
                  <span className="gd-btn primaryLinkText">연결</span>
                </button>
              ))}
            </>
          )}
        </div>
        {multi && (
          <div className="au-sheet-foot">
            <button type="button" className="gd-btn lg primarySolid" disabled={!draft.length} onClick={() => applyPatients(draft)}>{draft.length ? `${draft.length}명 선택 완료` : '선택해 주세요'}</button>
          </div>
        )}
      </div>
    </div>
  );

  const optionSheet = (
    <div className="au-dim" onClick={e => { if (e.target === e.currentTarget) setSheet(''); }}>
      <div className="au-sheet" role="dialog" aria-modal="true" aria-label="가격 옵션 선택">
        <div className="au-sheet-head"><h3>옵션 선택</h3><button type="button" aria-label="닫기" onClick={() => setSheet('')}>×</button></div>
        <div className="au-sheet-body">
          <div role="group" aria-label="가격 옵션">
            {ITEM.options.map(o => {
              const on = optionDraft.includes(o.id);
              return (
                <button type="button" key={o.id} role="checkbox" aria-checked={on} className={`au-opt ${on ? 'on' : ''}`}
                  onClick={() => setOptionDraft(d => (on ? d.filter(x => x !== o.id) : [...d, o.id]))}>
                  <span className={`gd-check ${on ? 'on' : ''}`} />
                  <span className="au-opt-body">
                    <span className="au-opt-name">{o.label}</span>
                    {o.caption && <span className="au-opt-sub">{o.caption}</span>}
                  </span>
                  <span className="au-opt-price">
                    <strong>{priceText(o)}</strong>
                    {o.type === 'discount' && o.origin && amountOf(o) != null && <s>{won(o.origin)}</s>}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="au-sheet-foot">
          <button type="button" className="gd-btn lg primarySolid" disabled={!optionDraft.length} onClick={() => {
            setOptionIds(ITEM.options.filter(o => optionDraft.includes(o.id)).map(o => o.id)); clearErr('service'); setSheet('');
          }}>{optionDraft.length ? `${optionDraft.length}개 선택 완료` : '옵션을 선택해 주세요'}</button>
        </div>
      </div>
    </div>
  );

  const purposeSheet = (
    <div className="au-dim" onClick={e => { if (e.target === e.currentTarget) setSheet(''); }}>
      <div className="au-sheet" role="dialog" aria-modal="true" aria-label="내원 목적 선택">
        <div className="au-sheet-head"><h3>내원 목적</h3><button type="button" aria-label="닫기" onClick={() => setSheet('')}>×</button></div>
        <div className="au-sheet-body" style={{ paddingBottom: 28 }}>
          {service !== 'receipt' && <div className="au-help" style={{ margin: '0 0 12px' }}>{purposeFromDate ? '예약 희망일을 고르기 전에 내원 목적을 먼저 선택해 주세요. ' : ''}내원 목적에 따라 예약할 수 있는 날짜가 달라요.</div>}
          <div role="radiogroup" aria-label="내원 목적">
            {room.purposes.map(p => (
              <button type="button" key={p} role="radio" aria-checked={purpose === p} className={`au-opt ${purpose === p ? 'on' : ''}`} onClick={() => { pickPurpose(p); if (purposeFromDate && service !== 'receipt') { setPurposeFromDate(false); setDateDraft(null); setTimeDraft(''); setSheet('date'); } else setSheet(''); }}>
                <span className="au-opt-body"><span className="au-opt-name">{p}</span></span>
                <span className={`gd-radio ${purpose === p ? 'on' : ''}`} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const dateSheet = (
    <div className="au-dim" onClick={e => { if (e.target === e.currentTarget) setSheet(''); }}>
      <div className="au-sheet" role="dialog" aria-modal="true" aria-label="예약 희망일 선택">
        <div className="au-sheet-head"><h3>예약 희망일</h3><button type="button" aria-label="닫기" onClick={() => setSheet('')}>×</button></div>
        <div className="au-sheet-body">
          {usesPurpose && <div className="au-help" style={{ margin: '0 0 4px' }}>선택한 내원 목적으로 예약할 수 있는 날짜만 고를 수 있어요.</div>}
          <Calendar value={dateDraft} enabled={d => isAvailable(d, service, roomId, purpose)} onPick={d => { setDateDraft(d); setTimeDraft(''); setTimeout(() => { const el = timesRef.current; const box = el?.closest('.au-sheet-body') as HTMLElement | null; if (el && box) box.scrollTo({ top: el.getBoundingClientRect().top - box.getBoundingClientRect().top + box.scrollTop - 8 }); }, 60); }} />
          {dateDraft ? (
            <div className="au-times" ref={timesRef}>
              {(['오전', '오후'] as const).map(g => {
                const list = slotsFor(dateDraft).filter(s => (g === '오전') === s.am);
                return (
                  <div key={g}>
                    <h4>{g}</h4>
                    <div className="au-chips">
                      {list.map(s => (
                        <button type="button" key={s.t} disabled={s.disabled} className={`au-chip ${timeDraft === s.t ? 'on' : ''}`} onClick={() => setTimeDraft(s.t)}>{s.t}</button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : <div className="au-help">날짜를 고르면 예약 가능한 시간이 보여요.</div>}
        </div>
        <div className="au-sheet-foot">
          <button type="button" className="gd-btn lg primarySolid" disabled={!dateDraft || !timeDraft} onClick={applyDate}>
            {dateDraft && timeDraft ? `${fmt(dateDraft)} ${timeDraft} 선택` : dateDraft ? '시간을 선택해 주세요' : '날짜를 선택해 주세요'}
          </button>
        </div>
      </div>
    </div>
  );

  const roomSheet = (
    <div className="au-dim" onClick={e => { if (e.target === e.currentTarget) setSheet(''); }}>
      <div className="au-sheet" role="dialog" aria-modal="true" aria-label="진료실 선택">
        <div className="au-sheet-head"><h3>진료실 선택</h3><button type="button" aria-label="닫기" onClick={() => setSheet('')}>×</button></div>
        <div className="au-sheet-body" style={{ paddingBottom: 28 }}>
          {rooms.map(r => (
            <button type="button" key={r.id} className={`au-opt ${roomId === r.id ? 'on' : ''}`} onClick={() => pickRoom(r.id)}>
              <span className="au-opt-body">
                <span className="au-opt-name">{r.name} · {r.doctor}</span>
                <span className="au-opt-sub">{r.purposes.length ? `내원 목적 ${r.purposes.length}개` : '내원 목적 없음'}</span>
              </span>
              <span className={`gd-radio ${roomId === r.id ? 'on' : ''}`} />
            </button>
          ))}
          <div className="au-help">진료실을 바꾸면 내원 목적과 일정을 다시 선택해요.</div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="au-root">
      <main className="au-lab">
        <aside className="au-panel">
          <h1>통합 신청서<br />420 예약 · 미리접수 · 진료항목</h1>
          <p className="lead">병원 상세는 생략하고 신청서만 봅니다. 가상 데이터이며 실제로 신청되지 않습니다. 기준일 2026-09-29(화) 14:00.</p>
          <div className="au-ctl">
            <div className="au-ctl-group"><span>서비스</span><Seg value={service} onChange={setService} items={[['appt', '420 예약'], ['receipt', '420 미리접수'], ['treatment', '진료항목']]} /></div>
            <div className="au-ctl-group"><span>병원 설정 · 주소</span><Seg value={addrMode} onChange={v => { setAddrMode(v); clearErr('addr'); }} items={[['required', '필수'], ['optional', '선택'], ['none', '미사용']]} /></div>
            <div className="au-ctl-group"><span>등록된 주소</span><Seg value={savedAddr} onChange={setSavedAddr} items={[['yes', '있음'], ['no', '없음']]} /></div>
            <div className="au-ctl-group"><span>병원 설정 · 약관</span><Seg value={termsMode} onChange={v => { setTermsMode(v); setAgree({}); clearErr('terms'); }} items={[['both', '필수+선택'], ['required', '필수만'], ['none', '없음']]} /></div>
            {isRoom && <div className="au-ctl-group"><span>1진료실 · 내원 목적</span><Seg value={purposeSetting} onChange={v => { setPurposeSetting(v); if (roomId === 'r1') { setPurpose(''); setDate(null); setTime(''); clearErr('service'); if (sheet === 'purpose' || sheet === 'date') setSheet(''); } }} items={[['on', '사용 (9개)'], ['off', '미사용']]} /></div>}
            {isRoom && <div className="au-ctl-group"><span>병원 기록 조회</span><Seg value={lookupMode} onChange={v => { setLookupMode(v); lookupModeRef.current = v; if (sheet === 'patient') runLookup(); else { clearTimeout(lookupTimer.current); setLookup('idle'); } }} items={[['ok', '성공'], ['fail', '실패']]} /></div>}
          </div>
          <p className="au-ctl-note">서비스를 바꾸면 신청서가 초기화됩니다. 1진료실은 내원 목적을 사용/미사용으로 바꿀 수 있습니다(영유아검진은 화·목만, 미사용이면 월~토). 2진료실은 항상 목적이 없습니다(평일만).</p>
        </aside>

        <div className="au-phone">
          <div className="au-topbar">
            <button type="button" aria-label="뒤로" onClick={() => (done ? setDone(false) : showToast('병원 상세로 돌아가요 (생략)'))}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            <strong>{done ? '신청 결과' : service === 'receipt' ? '미리접수' : '예약 신청'}</strong>
          </div>
          <div className="au-scroll" ref={scrollRef} style={done ? { paddingBottom: 0 } : undefined}>
            {done ? doneView : sections}
          </div>
          {!done && (
            <div className="au-cta">
              <button type="button" className="gd-btn lg primarySolid" onClick={submit}>{ctaLabel}</button>
            </div>
          )}
          {sheet === 'patient' && patientSheet}
          {sheet === 'room' && roomSheet}
          {sheet === 'date' && dateSheet}
          {sheet === 'purpose' && purposeSheet}
          {sheet === 'option' && optionSheet}
          {toast && <div className={`gd-toast ${toastKind} ${sheet ? 'over-sheet' : ''}`} role="status">{toast}</div>}
        </div>
      </main>
    </div>
  );
}
