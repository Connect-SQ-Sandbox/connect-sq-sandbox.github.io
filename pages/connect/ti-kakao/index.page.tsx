import React, { useMemo, useState } from 'react';

/**
 * ┌─ 프로토타입 컨텍스트 ───────────────────────────────────
 * 이름     : ti-kakao — 진료항목 카카오 노출 + 예약 신청 내역
 * 상태     : 현행(active)   버전: v2   최종수정: 2026-07-13
 * PRD      : Notion "진료항목 카카오톡 예약하기 연동" PRD v0.4  (링크 붙이기)
 * 배포URL  : https://connect-sq-sandbox.github.io/out/ti-kakao.html
 * 관련 CSS : connectRegister.css + connectTiKakao.css
 * 기술제약 : react-only · plain CSS · mock · 네트워크 0
 *
 * 화면구성 (LNB 이동):
 *   ① 진료항목 목록  ② 진료항목 폼(등록/상세)  ③ 예약 신청 내역
 *
 * 핵심 결정 (why):
 *   [확정·PRD] 토글 워딩 = "카카오톡 예약하기에서도 보이기"
 *   [확정·PRD] 노출 캐스케이드 — 굿닥 노출 OFF → 카카오도 OFF
 *   [유지·자체] 채널 심볼 [굿닥][카카오] 아이콘만 표기(텍스트 없음)
 *   [유지·자체] 규격 검증 — 상품명50 / 가격명25 / 할인가 / 상담가 / 이미지
 *   [유지·자체] 미리보기는 굿닥 기준만(카카오 미리보기 없음)
 *   [유지·자체] 카카오 전용 목록 없음 → 진료항목 목록에 인입 채널 심볼만 병합
 *   [유지·자체] 카카오 전용 정보는 옵션 아코디언으로 추가 입력
 *   [유지·자체] 예약 신청 내역 = 실제 TreatmentItemApptListView 재현
 *              (카카오·굿닥 예약이 같은 테이블에 혼재 + "채널" 컬럼만 추가)
 *   [폐기]      구버전 kakao-link(별도 연동관리 페이지형) → ti-kakao로 대체
 *
 * 보류 · TODO (PO 확인 대기):
 *   - PRD 10·16·18장 "상품 관리 메뉴" 잔재 (18-1 Non-Scope 충돌)
 *   - 규격위반 자동보정 정책 명문화
 *
 * 변경 이력:
 *   v2  2026-07-13 — 예약 신청 내역 + 예약 상세 모달 추가
 *   v1  2026-07-09 — ti-kakao 방향 확정, kakao-link 대체
 * └──────────────────────────────────────────────────────
 */

/* ============================ 진료항목 타입 & mock ============================ */
type PriceType = 'fixed' | 'discount' | 'consult';
type Price = { id: number; title: string; content: string; type: PriceType; amount: string; original: string; sale: string };
type Question = { id: number; name: string; optional: boolean };
type Item = {
  id: number;
  cat1: string; cat2: string;
  name: string; alias: string; intro: string; detail: string;
  keywords: string[]; hasImage: boolean;
  prices: Price[];
  gdVisible: boolean;
  kakaoOn: boolean;
  kExtra: { open: boolean; questions: Question[]; howto: string; notice: string; cancelNotice: string };
};

let UID = 1000;
const emptyExtra = () => ({ open: false, questions: [] as Question[], howto: '', notice: '', cancelNotice: '' });
const won = (s: string) => (s ? Number(s).toLocaleString('ko-KR') + '원' : '0원');

const PRICE_TYPES: { value: PriceType; label: string }[] = [
  { value: 'fixed', label: '고정 가격' }, { value: 'discount', label: '할인 가격' }, { value: 'consult', label: '상담 후 결정' }
];

const CAT_ORDER = ['피부·미용', '성형·윤곽', '주사·수액', '직접 입력 항목'];
const CUSTOM_CAT = '직접 입력 항목';

const mk = (p: Partial<Item> & { id: number; name: string; cat1: string; cat2: string }): Item => ({
  alias: '', intro: '', detail: '', keywords: [], hasImage: false,
  prices: [{ id: UID++, title: '기본', content: '', type: 'fixed', amount: '', original: '', sale: '' }],
  gdVisible: true, kakaoOn: false, kExtra: emptyExtra(), ...p
});

const INITIAL: Item[] = [
  mk({ id: 1, cat1: '피부·미용', cat2: '스킨부스터', name: '리쥬란 힐러', alias: '', intro: '피부 재생 스킨부스터', keywords: ['리쥬란', '스킨부스터'], hasImage: true,
    prices: [{ id: UID++, title: '1회', content: '', type: 'fixed', amount: '250000', original: '', sale: '' }, { id: UID++, title: '3회 패키지 (사후관리 포함)', content: '재생관리 포함', type: 'discount', amount: '', original: '750000', sale: '600000' }], gdVisible: true, kakaoOn: false }),
  mk({ id: 2, cat1: '피부·미용', cat2: '스킨부스터', name: '물광주사', intro: '수분 광채 물광주사', keywords: ['물광주사'], hasImage: true,
    prices: [{ id: UID++, title: '1회', content: '', type: 'fixed', amount: '120000', original: '', sale: '' }], gdVisible: true, kakaoOn: true }),
  mk({ id: 3, cat1: '피부·미용', cat2: '리프팅', name: '실 리프팅', intro: '', keywords: [], hasImage: false,
    prices: [{ id: UID++, title: '상담 후 결정', content: '', type: 'consult', amount: '', original: '', sale: '' }], gdVisible: false, kakaoOn: false }),
  mk({ id: 4, cat1: '피부·미용', cat2: '리프팅', name: '슈링크 유니버스', intro: '집중 리프팅', keywords: ['슈링크'], hasImage: true,
    prices: [{ id: UID++, title: '300샷', content: '', type: 'fixed', amount: '300000', original: '', sale: '' }], gdVisible: true, kakaoOn: false }),
  mk({ id: 5, cat1: '피부·미용', cat2: '색소·톤', name: '레이저 토닝', intro: '색소·톤 개선 레이저', keywords: ['레이저토닝'], hasImage: true,
    prices: [{ id: UID++, title: '1회', content: '', type: 'fixed', amount: '80000', original: '', sale: '' }, { id: UID++, title: '5회', content: '', type: 'fixed', amount: '350000', original: '', sale: '' }], gdVisible: true, kakaoOn: true }),
  mk({ id: 6, cat1: '성형·윤곽', cat2: '지방흡입', name: '얼굴지방흡입', alias: '얼굴 지방흡입', intro: '갸름한 얼굴라인을 위한 지방흡입', keywords: ['지방흡입', '얼굴윤곽'], hasImage: true,
    prices: [{ id: UID++, title: '기본', content: '', type: 'fixed', amount: '3500000', original: '', sale: '' }], gdVisible: true, kakaoOn: true }),
  mk({ id: 7, cat1: '주사·수액', cat2: '보톡스', name: '보톡스 (이마)', intro: '이마 주름 개선', keywords: ['보톡스'], hasImage: false,
    prices: [{ id: UID++, title: '이마', content: '', type: 'discount', amount: '', original: '150000', sale: '99000' }], gdVisible: true, kakaoOn: true }),
  mk({ id: 8, cat1: CUSTOM_CAT, cat2: '', name: '우리병원 시그니처 관리', intro: '원장 직접 시술', keywords: [], hasImage: false,
    prices: [{ id: UID++, title: '1회', content: '', type: 'fixed', amount: '150000', original: '', sale: '' }], gdVisible: true, kakaoOn: false })
];

/* ============================ 카카오 규격 검증 ============================ */
const K_NAME_MAX = 50;
const K_PRICE_MAX = 25;
type Warn = { field: string; msg: string; level: 'warn' | 'info' };
function kakaoWarns(it: Item): Warn[] {
  const w: Warn[] = [];
  const pname = it.alias || it.name;
  if (pname.length > K_NAME_MAX) w.push({ field: '상품명', msg: `카카오 상품명은 50자까지예요. 현재 ${pname.length}자 → 잘려서 노출돼요.`, level: 'warn' });
  it.prices.forEach((p) => { if (p.title.length > K_PRICE_MAX) w.push({ field: '가격명', msg: `"${p.title.slice(0, 10)}…" 카카오 25자까지 (현재 ${p.title.length}자)`, level: 'warn' }); });
  if (it.prices.some((p) => p.type === 'discount')) w.push({ field: '할인가', msg: '카카오는 정상가·할인율 없이 판매가만 참고가로 노출돼요.', level: 'warn' });
  if (it.prices.some((p) => p.type !== 'consult')) w.push({ field: '가격', msg: '카카오는 결제 없이 참고가로만 노출돼요.', level: 'info' });
  if (!it.hasImage) w.push({ field: '대표 이미지', msg: '이미지가 없어 카카오에선 병원 대표 이미지로 대체돼요.', level: 'info' });
  return w;
}
const kWarnCount = (it: Item) => kakaoWarns(it).filter((w) => w.level === 'warn').length;

const priceDisplay = (it: Item) => {
  const p0 = it.prices[0];
  const base = p0.type === 'consult' ? '상담 후 결정' : p0.type === 'discount' ? won(p0.sale) : won(p0.amount);
  return it.prices.length > 1 ? `${base}~` : base;
};

/* ============================ 예약 신청 내역 타입 & mock ============================ */
type Channel = 'goodoc' | 'kakao';
const CHANNEL_LABEL: Record<Channel, string> = { goodoc: '굿닥', kakao: '카카오톡' };

// 예약 상태 (실제 서버 enum)
const AS = { REQUESTED: 'T01', CONFIRMED: 'T03', CANCELED_PATIENT: 'F02', CANCELED_HOSPITAL: 'F03', COMPLETED: 'F05', REJECTED: 'T02', CANCEL_REQ: 'F01' } as const;
const AS_LABEL: Record<string, string> = { T01: '확정대기', T03: '예약확정', F03: '병원취소', F02: '환자취소', F05: '진료완료', T02: '예약 실패', F01: '취소 요청' };
const AS_TAG: Record<string, string> = { T01: 'orange', T03: 'blue', F05: 'green', F03: 'red', F02: 'red', T02: 'gray', F01: 'gray' };

const APPT_TABS = [
  { v: 'request', label: '예약 신청', statuses: [AS.REQUESTED] },
  { v: 'upcoming', label: '내원 예정', statuses: [AS.CONFIRMED] },
  { v: 'closed', label: '지난 내역', statuses: [AS.REJECTED, AS.CANCEL_REQ, AS.CANCELED_PATIENT, AS.CANCELED_HOSPITAL, AS.COMPLETED] }
] as const;
type ApptTab = (typeof APPT_TABS)[number]['v'];
const DATETIME_HEADER: Record<ApptTab, string> = { request: '예약희망 / 신청일시', upcoming: '예약희망 / 확정일시', closed: '예약희망 / 종료일시' };
const DATE_PRESETS: [string, string][] = [['last30d', '최근 30일'], ['last7d', '최근 7일'], ['today', '오늘'], ['all', '전체'], ['custom', '직접 설정']];
const SEARCH_TYPES: [string, string][] = [['PATIENT_NAME', '환자명'], ['RESERVER_NAME', '예약자명'], ['PHONE', '연락처'], ['TREATMENT_ITEM_NAME', '진료항목명']];
const SEARCH_PH: Record<string, string> = { PATIENT_NAME: '환자명을 입력해 주세요', RESERVER_NAME: '예약자명을 입력해 주세요', PHONE: '연락처를 입력해 주세요', TREATMENT_ITEM_NAME: '진료항목 또는 가격명을 입력해 주세요' };
const STATUS_FILTER_OPTIONS: [string, string][] = [['all', '전체'], [AS.COMPLETED, '진료완료'], [AS.CANCELED_HOSPITAL, '병원취소'], [AS.CANCELED_PATIENT, '환자취소'], [AS.REJECTED, '예약 실패'], [AS.CANCEL_REQ, '취소 요청']];
const CANCEL_TEMPLATES = [
  { id: 'schedule', label: '일정 불가', body: '선택하신 시간에는 병원 사정으로 방문이 어렵습니다. 다른 시간으로 다시 예약해 주세요.' },
  { id: 'doctor', label: '담당 의료진 부재', body: '선택하신 시간에는 담당 의료진 진료가 어렵습니다. 다른 시간으로 다시 예약해 주세요.' },
  { id: 'item', label: '진료 항목 확인 필요', body: '신청하신 진료 항목 확인이 필요하여 예약이 취소되었습니다. 병원으로 문의 후 다시 예약해 주세요.' },
  { id: 'patient', label: '환자 정보 확인 필요', body: '예약 진행을 위해 환자 정보 확인이 필요합니다. 병원으로 문의해 주세요.' },
  { id: 'etc', label: '기타 병원 사정', body: '병원 사정으로 예약이 취소되었습니다. 자세한 내용은 병원으로 문의해 주세요.' }
];

type Person = { name: string; gender: string; birth: string; phone: string };
type Appt = {
  id: number; channel: Channel; status: string;
  visit: string; when: string; statusAt?: string; // 예약희망일시 / 신청일시 / 최근 상태변경 시각
  itemName: string; itemAlias?: string; option: string; priceText: string; // option=선택 가격옵션명, priceText=총액
  visitor: Person; reserver: Person;
  memo?: string; cancelReason?: string;
};
const INITIAL_APPTS: Appt[] = [
  { id: 201, channel: 'kakao', status: AS.REQUESTED, visit: '2026.07.11(토) 15:00', when: '2026.07.10(금) 09:12', itemName: '레이저 토닝', option: '1회', priceText: '80,000원', visitor: { name: '김민지', gender: '여', birth: '1996.05.20 (만 30세)', phone: '010-2345-6789' }, reserver: { name: '김민지', gender: '여', birth: '1996.05.20 (만 30세)', phone: '010-2345-6789' }, memo: '기미 위주로 봐주세요' },
  { id: 202, channel: 'goodoc', status: AS.REQUESTED, visit: '2026.07.11(토) 11:30', when: '2026.07.10(금) 08:40', itemName: '물광주사', option: '1회', priceText: '120,000원', visitor: { name: '이서연', gender: '여', birth: '1990.11.02 (만 35세)', phone: '010-3456-7890' }, reserver: { name: '이서연', gender: '여', birth: '1990.11.02 (만 35세)', phone: '010-3456-7890' } },
  { id: 203, channel: 'kakao', status: AS.CONFIRMED, visit: '2026.07.12(일) 14:00', when: '2026.07.10(금) 10:02', statusAt: '2026.07.10(금) 10:31', itemName: '보톡스 (이마)', option: '이마', priceText: '99,000원', visitor: { name: '박도윤', gender: '남', birth: '1988.07.15 (만 37세)', phone: '010-4567-8901' }, reserver: { name: '박도윤', gender: '남', birth: '1988.07.15 (만 37세)', phone: '010-4567-8901' }, memo: '주차 가능한가요?' },
  { id: 204, channel: 'goodoc', status: AS.CONFIRMED, visit: '2026.07.12(일) 16:30', when: '2026.07.09(목) 17:20', statusAt: '2026.07.09(목) 18:02', itemName: '얼굴 지방흡입', option: '기본', priceText: '3,500,000원', visitor: { name: '최지우', gender: '여', birth: '2001.02.28 (만 25세)', phone: '010-5678-9012' }, reserver: { name: '최지우 모', gender: '여', birth: '1975.09.10 (만 50세)', phone: '010-9999-0000' } },
  { id: 205, channel: 'kakao', status: AS.COMPLETED, visit: '2026.07.05(일) 13:00', when: '2026.07.05(일) 09:40', statusAt: '2026.07.05(일) 13:55', itemName: '실 리프팅', option: '상담', priceText: '상담 후 결정', visitor: { name: '정하윤', gender: '여', birth: '1993.01.05 (만 33세)', phone: '010-6789-0123' }, reserver: { name: '정하윤', gender: '여', birth: '1993.01.05 (만 33세)', phone: '010-6789-0123' } },
  { id: 206, channel: 'goodoc', status: AS.CANCELED_PATIENT, visit: '2026.07.06(월) 10:00', when: '2026.07.05(일) 20:10', statusAt: '2026.07.06(월) 08:12', itemName: '리쥬란 힐러', option: '3회 패키지 (사후관리 포함)', priceText: '600,000원', visitor: { name: '강서진', gender: '남', birth: '1997.12.24 (만 28세)', phone: '010-7890-1234' }, reserver: { name: '강서진', gender: '남', birth: '1997.12.24 (만 28세)', phone: '010-7890-1234' }, cancelReason: '개인 사정으로 방문이 어려워 취소했습니다.' },
  { id: 207, channel: 'kakao', status: AS.CANCELED_HOSPITAL, visit: '2026.07.06(월) 18:00', when: '2026.07.06(월) 09:30', statusAt: '2026.07.06(월) 12:30', itemName: '슈링크 유니버스', option: '300샷', priceText: '300,000원', visitor: { name: '윤예은', gender: '여', birth: '1992.08.19 (만 33세)', phone: '010-8901-2345' }, reserver: { name: '윤예은', gender: '여', birth: '1992.08.19 (만 33세)', phone: '010-8901-2345' }, cancelReason: '선택하신 시간에는 병원 사정으로 방문이 어렵습니다. 다른 시간으로 다시 예약해 주세요.' }
];
/** 상태 변경 이력 (mock 파생): 신청 → 현재 상태까지 타임라인. */
function buildHistory(a: Appt): { label: string; at: string }[] {
  const h = [{ label: '예약 신청', at: a.when }];
  if (a.status === AS.CONFIRMED) h.push({ label: '예약 확정', at: a.statusAt || '-' });
  else if (a.status === AS.COMPLETED) { h.push({ label: '예약 확정', at: '-' }); h.push({ label: '진료 완료', at: a.statusAt || '-' }); }
  else if (a.status === AS.CANCELED_PATIENT) h.push({ label: '환자 취소', at: a.statusAt || '-' });
  else if (a.status === AS.CANCELED_HOSPITAL) h.push({ label: '병원 취소', at: a.statusAt || '-' });
  else if (a.status === AS.REJECTED) h.push({ label: '예약 실패', at: a.statusAt || '-' });
  return h;
}

/* ============================ 아이콘 ============================ */
const ChevronR = () => (<svg viewBox="0 0 12 12" fill="none"><path d="M4.5 2.5L8 6l-3.5 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>);
const ChevronD = () => (<svg viewBox="0 0 12 12" fill="none"><path d="M2.5 4.5L6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>);
const SearchIcon = () => (<svg viewBox="0 0 18 18" fill="none"><circle cx="8" cy="8" r="5.25" stroke="currentColor" strokeWidth="1.5" /><path d="M12.5 12.5L16 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>);
const SelectArrow = () => (<svg viewBox="0 0 16 16" fill="none"><path fillRule="evenodd" clipRule="evenodd" d="M2.862 5.529c.26-.26.682-.26.943 0L8 9.724l4.195-4.195c.26-.26.683-.26.943 0 .26.26.26.682 0 .943l-4.667 4.666c-.26.26-.682.26-.943 0L2.862 6.472c-.26-.26-.26-.683 0-.943z" fill="currentColor" /></svg>);
const PlusIcon = () => (<svg viewBox="0 0 18 18" fill="none"><path d="M9 4v10M4 9h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>);
const PhotoIcon = () => (<svg viewBox="0 0 24 24" fill="none"><rect x="3.5" y="5.5" width="17" height="13" rx="2" stroke="currentColor" strokeWidth="1.5" /><circle cx="8.5" cy="10" r="1.5" fill="currentColor" /><path d="M5 17l4.5-4 3 2.5L16 12l3 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>);
const CloseIcon = () => (<svg viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>);
const Back = () => (<svg viewBox="0 0 20 20" fill="none"><path d="M12 5l-5 5 5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>);
const WarnIc = () => (<svg viewBox="0 0 16 16" fill="none"><path d="M8 2l6 11H2L8 2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" /><path d="M8 6.2v2.8M8 11v.1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>);
const InfoIc = () => (<svg viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.4" stroke="currentColor" strokeWidth="1.4" /><path d="M8 7.2v3.6M8 4.9v.1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>);
const HandleIcon = () => (<svg viewBox="0 0 16 16" fill="none"><circle cx="6" cy="4" r="1" fill="currentColor" /><circle cx="10" cy="4" r="1" fill="currentColor" /><circle cx="6" cy="8" r="1" fill="currentColor" /><circle cx="10" cy="8" r="1" fill="currentColor" /><circle cx="6" cy="12" r="1" fill="currentColor" /><circle cx="10" cy="12" r="1" fill="currentColor" /></svg>);
/** 실제 서비스 드래그 핸들(@/components/medias/Icon/Handler) — 6×10, 둥근 사각형 6개 */
const DragHandle = () => (<svg width="6" height="10" viewBox="0 0 6 10" fill="none"><rect width="2.25" height="2.30769" rx="1.125" fill="currentColor" /><rect x="3.75" width="2.25" height="2.30769" rx="1.125" fill="currentColor" /><rect y="3.84619" width="2.25" height="2.30769" rx="1.125" fill="currentColor" /><rect x="3.75" y="3.84619" width="2.25" height="2.30769" rx="1.125" fill="currentColor" /><rect y="7.69226" width="2.25" height="2.30769" rx="1.125" fill="currentColor" /><rect x="3.75" y="7.69226" width="2.25" height="2.30769" rx="1.125" fill="currentColor" /></svg>);
const ThumbIcon = () => (<svg viewBox="0 0 36 36" fill="none"><rect width="36" height="36" rx="6" fill="#F2F4F6" /><path d="M11 23l4.5-5 3 3.2L22 17l4 6" stroke="#B0B8C1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><circle cx="14" cy="14" r="1.6" fill="#B0B8C1" /></svg>);
const CalIcon = () => (<svg viewBox="0 0 18 18" fill="none"><rect x="2.5" y="3.5" width="13" height="12" rx="2" stroke="currentColor" strokeWidth="1.4" /><path d="M2.5 7h13M6 2.2v2.2M12 2.2v2.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>);
const KakaoMark = ({ cls }: { cls?: string }) => (<svg viewBox="0 0 20 20" fill="none" className={cls}><rect width="20" height="20" rx="5" fill="#FEE500" /><path d="M10 5.1c-2.9 0-5.2 1.8-5.2 4 0 1.4.95 2.62 2.38 3.32-.1.36-.37 1.34-.42 1.55 0 0-.02.09.04.12.06.03.13 0 .13 0 .17-.02 1.9-1.28 2.2-1.5.29.04.58.06.87.06 2.9 0 5.2-1.8 5.2-4S12.9 5.1 10 5.1z" fill="#3C1E1E" /></svg>);
const GoodocMark = () => (
  <svg viewBox="0 0 27 43" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M13.1516 36.3658C9.90902 36.3658 7.21826 33.9857 6.74251 30.8897H0.0390015C0.542057 37.65 6.2297 42.9981 13.1516 42.9981C20.0735 42.9981 25.7611 37.65 26.2642 30.8897H19.5587C19.0849 33.9857 16.3922 36.3658 13.1496 36.3658H13.1516Z" fill="#0073FA" />
    <path d="M26.2895 0H19.5197V6.61479H26.2895V0Z" fill="#41D293" />
    <path d="M13.1516 4.96207C5.90017 4.96207 0 10.832 0 18.0462C0 25.2603 5.90017 31.1302 13.1516 31.1302C20.403 31.1302 26.3032 25.2603 26.3032 18.0462C26.3032 10.832 20.403 4.96207 13.1516 4.96207ZM13.1516 24.498C9.5756 24.498 6.66646 21.6038 6.66646 18.0462C6.66646 14.4885 9.5756 11.5943 13.1516 11.5943C16.7276 11.5943 19.6367 14.4885 19.6367 18.0462C19.6367 21.6038 16.7276 24.498 13.1516 24.498V24.498Z" fill="#0073FA" />
  </svg>
);
/** 채널 심볼 (예약내역 채널 컬럼·진료항목 목록 공용) */
const ChannelIcon = ({ channel }: { channel: Channel }) => (channel === 'kakao' ? <KakaoMark /> : <GoodocMark />);

/* ============================ 타이틀바 / 사이드내비 ============================ */
function TitleBar() {
  return (
    <div className="cn-titlebar">
      <div className="cn-ci"><span className="cn-ci-mark"><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="7" fill="#0073FA" /><circle cx="10.2" cy="3.8" r="2.4" fill="#41D293" /></svg></span><span className="cn-ci-name">굿닥 커넥트 4.2.0</span></div>
      <div className="cn-winctrls"><button className="cn-winbtn">─</button><button className="cn-winbtn">▢</button><button className="cn-winbtn close">✕</button></div>
    </div>
  );
}
type Page = 'items' | 'appt';
function SideNav({ page, onNav }: { page: Page; onNav: (p: Page) => void }) {
  const N = ({ label, sub, active, beta, ex, onClick }: { label: string; sub?: boolean; active?: boolean; beta?: boolean; ex?: 'r' | 'd'; onClick?: () => void }) => (
    <button className={`cn-nav-item${sub ? ' sub' : ''}${active ? ' active' : ''}`} onClick={onClick}>
      <span className="cn-nav-label-wrap"><span className="cn-nav-label">{label}</span>{beta && <span className="cn-beta">beta</span>}</span>
      {ex && <span className="cn-chevron">{ex === 'r' ? <ChevronR /> : <ChevronD />}</span>}
    </button>
  );
  return (
    <nav className="cn-nav">
      <div className="cn-nav-scroll">
        <div className="cn-nav-group">
          <div className="cn-nav-header">서비스 운영</div>
          <N label="차트 접수·예약" ex="r" />
          <N label="비급여 예약" ex="d" />
          <N label="예약 신청 내역" sub active={page === 'appt'} onClick={() => onNav('appt')} />
          <N label="진료항목 관리" sub beta active={page === 'items'} onClick={() => onNav('items')} />
          <N label="병원 약관" ex="r" />
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

/* ============================ 진료항목 폼 공용 ============================ */
function FieldHead({ label, optional, helpers }: { label: string; optional?: boolean; helpers?: string[] }) {
  return (
    <div className="rg-field-head">
      <span className={`rg-label${optional ? ' optional' : ''}`}>{label}{optional && <span className="rg-optional"> (선택)</span>}</span>
      {(helpers || []).map((h, i) => <span key={i} className="rg-help">{h}</span>)}
    </div>
  );
}
function PriceRow({ p, kakaoOn, onChange, onDelete }: { p: Price; kakaoOn: boolean; onChange: (u: Partial<Price>) => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const cur = PRICE_TYPES.find((t) => t.value === p.type)!;
  const over = kakaoOn && p.title.length > K_PRICE_MAX;
  return (
    <div className="rg-price-row tk-price-row">
      <div className="rg-drag" aria-label="순서 변경 핸들"><DragHandle /></div>
      <div className="rg-price-fields">
        <input className="rg-input" placeholder="가격명을 입력해 주세요. (15자 권장, 최대 50자)" maxLength={50} value={p.title} onChange={(e) => onChange({ title: e.target.value })} />
        {over && <div className="tk-fwarn"><WarnIc /> 카카오 상품에선 25자까지 노출돼요 (현재 {p.title.length}자)</div>}
        <input className="rg-input" placeholder="가격 설명을 입력해 주세요. (선택사항, 최대 100자)" maxLength={100} value={p.content} onChange={(e) => onChange({ content: e.target.value })} />
        <div className="rg-price-entry">
          <div className="rg-select-wrap">
            <button type="button" className={`rg-select${open ? ' open' : ''}`} onClick={() => setOpen((v) => !v)}>{cur.label}<span className="rg-select-ic"><SelectArrow /></span></button>
            {open && <div className="rg-select-menu" onMouseLeave={() => setOpen(false)}>{PRICE_TYPES.map((t) => (<button key={t.value} type="button" className={`rg-select-opt${t.value === p.type ? ' active' : ''}`} onClick={() => { onChange({ type: t.value }); setOpen(false); }}>{t.label}</button>))}</div>}
          </div>
          {p.type === 'fixed' && (<><input className="rg-num" placeholder="0" value={p.amount} onChange={(e) => onChange({ amount: e.target.value.replace(/[^0-9]/g, '') })} /><span className="rg-unit">원</span></>)}
          {p.type === 'discount' && (<><input className="rg-num" placeholder="정상가" value={p.original} onChange={(e) => onChange({ original: e.target.value.replace(/[^0-9]/g, '') })} /><span className="rg-price-arrow">→</span><input className="rg-num" placeholder="판매가" value={p.sale} onChange={(e) => onChange({ sale: e.target.value.replace(/[^0-9]/g, '') })} /><span className="rg-unit">원</span></>)}
          {p.type === 'consult' && (<><input className="rg-num" value="0" disabled readOnly /><span className="rg-unit">원</span></>)}
        </div>
        {kakaoOn && p.type === 'discount' && <div className="tk-finfo"><InfoIc /> 카카오엔 판매가 {won(p.sale)}만 참고가로 노출돼요.</div>}
      </div>
      <button className="rg-price-del" onClick={onDelete} aria-label="삭제"><CloseIcon /></button>
    </div>
  );
}
function GoodocPreview({ d }: { d: Item }) {
  const title = d.alias || d.name;
  const priceLine = (p: Price) => (p.type === 'consult' ? '상담 후 결정' : p.type === 'discount' ? won(p.sale) : won(p.amount));
  return (
    <div className="rg-preview tk-preview">
      <div className="tk-pv-scroll">
        <div className={`tk-pv-hero${d.hasImage ? ' has' : ''}`}>{d.hasImage ? '대표 이미지' : ''}</div>
        <div className="tk-pv-body">
          <div className={`tk-pv-title${title ? '' : ' ph'}`}>{title || '진료항목을 입력해 주세요.'}</div>
          {d.intro && <div className="tk-pv-intro">{d.intro}</div>}
          {d.keywords.length > 0 && <div className="tk-pv-kw">{d.keywords.map((k) => <span key={k} className="tk-pv-kwchip">#{k}</span>)}</div>}
          <div className="tk-pv-divider" />
          <div className="tk-pv-price-head">가격 정보</div>
          {d.prices.map((p) => (
            <div key={p.id} className="tk-pv-price-row">
              <span className={`tk-pv-price-name${p.title ? '' : ' ph'}`}>{p.title || '가격명'}</span>
              <span className="tk-pv-price-val">{p.type === 'discount' && p.original && <span className="tk-pv-strike">{won(p.original)}</span>}{priceLine(p)}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="tk-pv-tag">굿닥 기준 미리보기</div>
    </div>
  );
}

/* ============================ 목록: 인입 채널 표기 + 항목 행 ============================ */
/** 굿닥/카카오 심볼 나란히. 보임=풀컬러, 안 보임=회색. 노출 캐스케이드(굿닥 OFF→카카오 OFF) 반영. */
function ChannelMarks({ it }: { it: Item }) {
  const w = kWarnCount(it);
  const kakaoShown = it.kakaoOn && it.gdVisible;
  const kakaoTitle = !it.kakaoOn
    ? '카카오톡 예약하기에서 안 보임'
    : !it.gdVisible
      ? '굿닥 노출이 꺼져 있어 카카오에도 안 보임'
      : w > 0 ? `카카오톡 예약하기에서 보임 · 규격 검토 ${w}건` : '카카오톡 예약하기에서 보임';
  return (
    <span className="tk-chans">
      <span className={`tk-chan${it.gdVisible ? '' : ' dim'}`} title={it.gdVisible ? '굿닥에서 보임' : '굿닥에서 안 보임'}><GoodocMark /></span>
      <span className={`tk-chan${kakaoShown ? '' : ' dim'}`} title={kakaoTitle}>
        <KakaoMark />{kakaoShown && w > 0 && <span className="tk-chan-dot" />}
      </span>
    </span>
  );
}
function ItemRow({ it, onOpen, onToggle }: { it: Item; onOpen: () => void; onToggle: () => void }) {
  return (
    <div className="tk-l3">
      <span className="tk-l3-handle"><DragHandle /></span>
      <button className="tk-l3-detail" onClick={onOpen}>
        <span className="tk-l3-name">{it.alias || it.name}</span>
        <span className="tk-l3-price"><span className="tk-l3-price-text">{priceDisplay(it)}</span><span className="tk-l3-optcount">{it.prices.length}</span></span>
        <span className="tk-l3-thumb">{it.hasImage ? <span className="tk-l3-thumb-img" /> : <ThumbIcon />}</span>
        <ChannelMarks it={it} />
      </button>
      <button className={`rg-toggle${it.gdVisible ? '' : ' off'}`} onClick={onToggle} aria-label="굿닥 노출 토글"><span className="rg-toggle-knob" /></button>
      <span className="tk-l3-del" aria-hidden><CloseIcon /></span>
    </div>
  );
}

/* ============================ 예약 신청 내역 화면 ============================ */
function ApptChannelCell({ channel }: { channel: Channel }) {
  return (
    <span className="ap-chan" title={`${CHANNEL_LABEL[channel]}에서 신청`}>
      <span className="ap-chan-ic"><ChannelIcon channel={channel} /></span>
      <span className="ap-chan-label">{CHANNEL_LABEL[channel]}</span>
    </span>
  );
}
function TwoLine({ primary, sub }: { primary: string; sub?: string }) {
  return (<span className="ap-2line"><span className="ap-2line-p">{primary}</span>{sub && <span className="ap-2line-s">{sub}</span>}</span>);
}
function Dropdown({ value, options, onChange, width }: { value: string; options: [string, string][]; onChange: (v: string) => void; width?: number }) {
  const [open, setOpen] = useState(false);
  const cur = options.find((o) => o[0] === value) || options[0];
  return (
    <div className="ap-dd" style={{ width }}>
      <button className={`ap-dd-btn${open ? ' open' : ''}`} onClick={() => setOpen((v) => !v)}>{cur[1]}<span className="ap-dd-ic"><SelectArrow /></span></button>
      {open && <div className="ap-dd-menu" onMouseLeave={() => setOpen(false)}>{options.map((o) => (<button key={o[0]} className={`ap-dd-opt${o[0] === value ? ' active' : ''}`} onClick={() => { onChange(o[0]); setOpen(false); }}>{o[1]}</button>))}</div>}
    </div>
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (<div className="ap-drow"><span className="ap-drow-label">{label}</span><span className="ap-drow-val">{children}</span></div>);
}

function ApptScreen({ showToast }: { showToast: (m: string) => void }) {
  const [appts, setAppts] = useState<Appt[]>(INITIAL_APPTS);
  const [tab, setTab] = useState<ApptTab>('request');
  const [preset, setPreset] = useState('last30d');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchType, setSearchType] = useState('PATIENT_NAME');
  const [searchText, setSearchText] = useState('');
  const [applied, setApplied] = useState(''); // 실제 조회에 반영된 검색어(검색 버튼/Enter 시점)
  const [statusFilter, setStatusFilter] = useState('all');
  const [cancelId, setCancelId] = useState<number | null>(null);
  const [cancelMemo, setCancelMemo] = useState('');
  const [detailId, setDetailId] = useState<number | null>(null);

  const tabDef = APPT_TABS.find((t) => t.v === tab)!;
  const counts = useMemo(() => Object.fromEntries(APPT_TABS.map((t) => [t.v, appts.filter((a) => t.statuses.includes(a.status as never)).length])), [appts]);

  const rows = useMemo(() => {
    let r = appts.filter((a) => tabDef.statuses.includes(a.status as never));
    if (tab === 'closed' && statusFilter !== 'all') r = r.filter((a) => a.status === statusFilter);
    const q = applied.trim();
    if (q) {
      r = r.filter((a) => {
        if (searchType === 'PATIENT_NAME') return a.visitor.name.includes(q);
        if (searchType === 'RESERVER_NAME') return a.reserver.name.includes(q);
        if (searchType === 'PHONE') return (a.visitor.phone + a.reserver.phone).replace(/[^0-9]/g, '').includes(q.replace(/[^0-9]/g, ''));
        return a.itemName.includes(q);
      });
    }
    return r;
  }, [appts, tab, tabDef, statusFilter, applied, searchType]);

  const detail = appts.find((a) => a.id === detailId) || null;

  const patchAppt = (id: number, u: Partial<Appt>) => setAppts((prev) => prev.map((a) => (a.id === id ? { ...a, ...u } : a)));
  const confirm = (id: number) => { patchAppt(id, { status: AS.CONFIRMED, statusAt: '방금 전' }); setDetailId(null); showToast('예약을 확정했어요.'); };
  const complete = (id: number) => { patchAppt(id, { status: AS.COMPLETED, statusAt: '방금 전' }); setDetailId(null); showToast('진료 완료로 변경했어요.'); };
  const del = (id: number) => { setAppts((prev) => prev.filter((a) => a.id !== id)); setDetailId(null); showToast('내역을 삭제했어요.'); };
  const openCancel = (id: number) => { setDetailId(null); setCancelId(id); setCancelMemo(''); };
  const doCancel = () => { if (cancelId == null) return; patchAppt(cancelId, { status: AS.CANCELED_HOSPITAL, cancelReason: cancelMemo, statusAt: '방금 전' }); setCancelId(null); showToast('예약을 취소했어요.'); };
  const handleSearch = () => setApplied(searchText);
  const handleReset = () => { setSearchText(''); setApplied(''); setPreset('last30d'); setStartDate(''); setEndDate(''); setStatusFilter('all'); };

  const statusActions = (a: Appt) => {
    if (a.status === AS.REQUESTED) return (<><button className="ap-btn primary" onClick={(e) => { e.stopPropagation(); confirm(a.id); }}>예약 확정</button><button className="ap-btn danger" onClick={(e) => { e.stopPropagation(); openCancel(a.id); }}>예약 취소</button></>);
    if (a.status === AS.CONFIRMED) return (<><button className="ap-btn primary" onClick={(e) => { e.stopPropagation(); complete(a.id); }}>진료완료</button><button className="ap-btn danger" onClick={(e) => { e.stopPropagation(); openCancel(a.id); }}>예약 취소</button></>);
    return (<button className="ap-btn danger" onClick={(e) => { e.stopPropagation(); del(a.id); }}>내역 삭제</button>);
  };

  return (
    <>
      <div className="cn-header ap-header">
        <div className="cn-header-title">예약 신청 내역</div>
        <div className="ap-sub">굿닥·카카오톡 예약하기 등 여러 채널에서 들어온 비급여 진료항목 예약을 함께 관리해요.</div>
      </div>

      <div className="ap-body">
        {/* 탭 */}
        <div className="ap-tabs">
          {APPT_TABS.map((t) => (
            <button key={t.v} className={`ap-tab${tab === t.v ? ' on' : ''}`} onClick={() => setTab(t.v)}>
              {t.label}<span className="ap-tab-count">{counts[t.v]}</span>
            </button>
          ))}
        </div>

        {/* 필터 (실제 DataDisplayDateFilter 재현: 라벨 2줄 + 우측 초기화/검색) */}
        <div className="ap-filterbox">
          <div className="ap-frow">
            <span className="ap-flabel">기간</span>
            <div className="ap-presets">
              {DATE_PRESETS.map(([v, label]) => (<button key={v} className={`ap-preset${preset === v ? ' on' : ''}`} onClick={() => setPreset(v)}>{v === 'custom' && <CalIcon />}{label}</button>))}
              {preset === 'custom' && (
                <span className="ap-daterange">
                  <input type="date" className="ap-date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                  <span className="ap-daterange-sep">-</span>
                  <input type="date" className="ap-date" value={endDate} min={startDate || undefined} onChange={(e) => setEndDate(e.target.value)} />
                </span>
              )}
            </div>
          </div>
          <div className="ap-frow">
            <span className="ap-flabel">검색</span>
            <div className="ap-search-group">
              <Dropdown value={searchType} options={SEARCH_TYPES} onChange={setSearchType} width={128} />
              <div className="ap-searchfield">
                <span className="ap-searchfield-ic"><SearchIcon /></span>
                <input className="ap-searchfield-input" placeholder={SEARCH_PH[searchType]} value={searchText} onChange={(e) => setSearchText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }} />
              </div>
            </div>
            {tab === 'closed' && (
              <div className="ap-status-group"><span className="ap-flabel sm">상태</span><Dropdown value={statusFilter} options={STATUS_FILTER_OPTIONS} onChange={setStatusFilter} width={140} /></div>
            )}
            <div className="ap-actions-btns">
              <button className="ap-reset" onClick={handleReset}>초기화</button>
              <button className="ap-submit" onClick={handleSearch}>검색</button>
            </div>
          </div>
        </div>

        {/* 테이블 */}
        <div className="ap-table">
          <div className="ap-tr ap-th">
            <span>채널</span><span>상태</span><span>{DATETIME_HEADER[tab]}</span><span>진료항목</span><span>방문자</span><span>예약자</span><span>요청사항</span>
          </div>
          {rows.length === 0 ? (
            <div className="ap-empty">{applied.trim() ? '조건에 맞는 예약이 없어요' : tab === 'request' ? '조회된 예약 신청이 없어요' : tab === 'upcoming' ? '조회된 내원 예정 일정이 없어요' : '조회된 지난 내역이 없어요'}</div>
          ) : rows.map((a) => (
            <div key={a.id} className="ap-tr ap-row" onClick={() => setDetailId(a.id)}>
              <span><span className="ap-chan-ic only" title={`${CHANNEL_LABEL[a.channel]}에서 신청`}><ChannelIcon channel={a.channel} /></span></span>
              <span><span className={`ap-tag ${AS_TAG[a.status] || 'gray'}`}>{AS_LABEL[a.status] || a.status}</span></span>
              <span><TwoLine primary={a.visit} sub={a.when} /></span>
              <span><TwoLine primary={a.itemName} sub={a.priceText} /></span>
              <span><TwoLine primary={a.visitor.name} sub={a.visitor.phone} /></span>
              <span><TwoLine primary={a.reserver.name} sub={a.reserver.phone} /></span>
              <span className="ap-memo-cell">
                <span className="ap-memo">{a.memo || ''}</span>
                <span className="ap-actions" onClick={(e) => e.stopPropagation()}>{statusActions(a)}</span>
              </span>
            </div>
          ))}
        </div>
        <div className="ap-total">전체 {rows.length}건</div>
      </div>

      {/* 상세 모달 (행 클릭) — 인입 채널 + 예약/방문자/예약자 정보 + 상태 변경 이력 (실제 상세 구성 참고) */}
      {detail && (
        <div className="ap-dim" onClick={() => setDetailId(null)}>
          <div className="ap-modal ap-detail" onClick={(e) => e.stopPropagation()}>
            <div className="ap-detail-head">
              <div className="ap-detail-eyebrow">예약 상세</div>
              <button className="ap-detail-close" onClick={() => setDetailId(null)} aria-label="닫기"><CloseIcon /></button>
            </div>
            <div className="ap-detail-title">
              <span className={`ap-tag ${AS_TAG[detail.status] || 'gray'}`}>{AS_LABEL[detail.status] || detail.status}</span>
              <span className="ap-detail-chan"><span className="ap-chan-ic"><ChannelIcon channel={detail.channel} /></span>{CHANNEL_LABEL[detail.channel]} 신청</span>
            </div>
            <div className="ap-detail-scroll">
              <div className="ap-dsec">
                <div className="ap-dsec-title">예약 정보</div>
                <DetailRow label="예약 희망일시">{detail.visit}</DetailRow>
                <DetailRow label="진료항목">{detail.itemName}{detail.itemAlias && detail.itemAlias !== detail.itemName ? ` (${detail.itemAlias})` : ''}</DetailRow>
                <DetailRow label="가격 옵션">{detail.option}</DetailRow>
                <DetailRow label="예상 결제 금액">{detail.priceText}</DetailRow>
                <DetailRow label="요청사항">{detail.memo || '-'}</DetailRow>
                <DetailRow label="신청일시">{detail.when}</DetailRow>
              </div>
              <div className="ap-dsec">
                <div className="ap-dsec-title">방문자 정보</div>
                <DetailRow label="이름">{detail.visitor.name}</DetailRow>
                <DetailRow label="성별">{detail.visitor.gender}</DetailRow>
                <DetailRow label="생년월일">{detail.visitor.birth}</DetailRow>
                <DetailRow label="연락처">{detail.visitor.phone}</DetailRow>
              </div>
              <div className="ap-dsec">
                <div className="ap-dsec-title">예약자 정보</div>
                <DetailRow label="이름">{detail.reserver.name}</DetailRow>
                <DetailRow label="성별">{detail.reserver.gender}</DetailRow>
                <DetailRow label="생년월일">{detail.reserver.birth}</DetailRow>
                <DetailRow label="연락처">{detail.reserver.phone}</DetailRow>
              </div>
              {detail.cancelReason && (
                <div className="ap-dsec">
                  <div className="ap-dsec-title">취소 사유</div>
                  <div className="ap-cancel-reason">{detail.cancelReason}</div>
                </div>
              )}
              <div className="ap-dsec">
                <div className="ap-dsec-title">상태 변경 이력</div>
                <div className="ap-timeline">
                  {buildHistory(detail).map((h, i, arr) => (
                    <div key={i} className={`ap-tl-item${i === arr.length - 1 ? ' last' : ''}`}>
                      <span className="ap-tl-dot" /><span className="ap-tl-label">{h.label}</span><span className="ap-tl-at">{h.at}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="ap-detail-actions">{statusActions(detail)}</div>
          </div>
        </div>
      )}

      {/* 취소 모달 */}
      {cancelId != null && (
        <div className="ap-dim" onClick={() => setCancelId(null)}>
          <div className="ap-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ap-modal-title">예약을 취소할까요?</div>
            <div className="ap-modal-sub">취소 사유를 선택하면 예약자에게 안내돼요. 사유는 수정할 수 있어요.</div>
            <div className="ap-reasons">{CANCEL_TEMPLATES.map((t) => (<button key={t.id} className="ap-reason" onClick={() => setCancelMemo(t.body)}>{t.label}</button>))}</div>
            <textarea className="ap-textarea" placeholder="취소 사유를 입력해 주세요." value={cancelMemo} onChange={(e) => setCancelMemo(e.target.value)} />
            <div className="ap-modal-btns"><button className="rg-btn-cancel" onClick={() => setCancelId(null)}>닫기</button><button className="ap-btn-cancel-confirm" disabled={!cancelMemo.trim()} onClick={doCancel}>예약 취소</button></div>
          </div>
        </div>
      )}
    </>
  );
}

/* ============================================================ */
function TiKakao() {
  const [page, setPage] = useState<Page>('items');
  const [items, setItems] = useState<Item[]>(INITIAL);
  const [screen, setScreen] = useState<'list' | 'form'>('list');
  const [selCat1, setSelCat1] = useState<string>('피부·미용');
  const [selId, setSelId] = useState<number | null>(null);
  const [d, setD] = useState<Item | null>(null);
  const [kw, setKw] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const hospitalLinked = true;

  const showToast = (m: string) => { setToast(m); window.setTimeout(() => setToast(null), 2200); };
  const patch = (u: Partial<Item>) => setD((prev) => (prev ? { ...prev, ...u } : prev));
  const patchExtra = (u: Partial<Item['kExtra']>) => setD((prev) => (prev ? { ...prev, kExtra: { ...prev.kExtra, ...u } } : prev));

  const warns = useMemo(() => (d && d.kakaoOn ? kakaoWarns(d) : []), [d]);
  const warnCount = warns.filter((w) => w.level === 'warn').length;

  const cat1List = useMemo(() => CAT_ORDER.map((name) => ({ name, count: items.filter((i) => i.cat1 === name).length, custom: name === CUSTOM_CAT })).filter((c) => c.count > 0), [items]);
  const groups = useMemo(() => {
    const inCat = items.filter((i) => i.cat1 === selCat1);
    const order: string[] = []; const map: Record<string, Item[]> = {};
    inCat.forEach((it) => { const k = it.cat2 || '기타'; if (!map[k]) { map[k] = []; order.push(k); } map[k].push(it); });
    return order.map((name) => ({ name, items: map[name] }));
  }, [items, selCat1]);
  const isCustom = selCat1 === CUSTOM_CAT;
  const customItems = useMemo(() => items.filter((i) => i.cat1 === selCat1), [items, selCat1]);

  const nav = (p: Page) => { setPage(p); if (p === 'items') setScreen('list'); };
  const open = (it: Item) => { setSelId(it.id); setD({ ...it, prices: it.prices.map((p) => ({ ...p })), keywords: [...it.keywords], kExtra: { ...it.kExtra, questions: it.kExtra.questions.map((q) => ({ ...q })) } }); setScreen('form'); };
  const create = () => { setSelId(null); setD(mk({ id: UID++, name: '', cat1: selCat1 === CUSTOM_CAT ? CUSTOM_CAT : selCat1, cat2: groups[0]?.name || '' })); setScreen('form'); };
  const save = () => { if (!d) return; setItems((prev) => (selId === null ? [...prev, d] : prev.map((it) => (it.id === d.id ? d : it)))); setScreen('list'); showToast(selId === null ? '진료항목을 등록했어요.' : '진료항목을 저장했어요.'); };

  const addKw = () => { if (!d) return; const t = kw.trim(); if (t && d.keywords.length < 20 && !d.keywords.includes(t)) patch({ keywords: [...d.keywords, t] }); setKw(''); };
  const setPrice = (id: number, u: Partial<Price>) => d && patch({ prices: d.prices.map((p) => (p.id === id ? { ...p, ...u } : p)) });
  const addPrice = () => d && patch({ prices: [...d.prices, { id: UID++, title: '', content: '', type: 'fixed', amount: '', original: '', sale: '' }] });
  const delPrice = (id: number) => d && patch({ prices: d.prices.length > 1 ? d.prices.filter((p) => p.id !== id) : d.prices });
  const addQ = () => d && patchExtra({ questions: [...d.kExtra.questions, { id: UID++, name: '', optional: true }] });
  const setQ = (id: number, u: Partial<Question>) => d && patchExtra({ questions: d.kExtra.questions.map((q) => (q.id === id ? { ...q, ...u } : q)) });
  const delQ = (id: number) => d && patchExtra({ questions: d.kExtra.questions.filter((q) => q.id !== id) });
  const toggleGdVisible = (id: number) => setItems((prev) => prev.map((it) => (it.id === id ? { ...it, gdVisible: !it.gdVisible } : it)));

  return (
    <div className="cn-artboard">
      <div className="cn-screen">
        <TitleBar />
        <div className="cn-body">
          <SideNav page={page} onNav={nav} />
          <main className="cn-main rg-main tk-main">

            {/* ========================= 예약 신청 내역 ========================= */}
            {page === 'appt' && <ApptScreen showToast={showToast} />}

            {/* ========================= 진료항목 목록 ========================= */}
            {page === 'items' && screen === 'list' && (
              <>
                <div className="cn-header tk-list-header">
                  <div>
                    <div className="cn-header-title">진료항목</div>
                    <div className="tk-list-sub">굿닥에 노출되는 우리 병원 진료항목과 가격 정보를 관리할 수 있어요. 카카오톡 예약하기에서도 보이는지 여기서 확인해요.</div>
                  </div>
                  <button className="tk-btn-primary" onClick={create}><PlusIcon /> 새 진료항목</button>
                </div>

                <div className="tk-list-body">
                  <div className="tk-grid">
                    <div className="tk-grid-chead"><span className="tk-grid-title">카테고리</span></div>
                    <div className="tk-grid-ihead"><span className="tk-grid-title">{selCat1}</span></div>
                    <nav className="tk-grid-clist" aria-label="진료항목 카테고리">
                      {cat1List.map((c) => (
                        <button key={c.name} className={`tk-cat${c.name === selCat1 ? ' sel' : ''}`} onClick={() => setSelCat1(c.name)}>
                          <span className="tk-cat-handle"><DragHandle /></span>
                          <span className="tk-cat-name">{c.name}</span>
                          <span className="tk-cat-count">{c.count}</span>
                        </button>
                      ))}
                    </nav>
                    <section className="tk-grid-ilist">
                      {isCustom ? (
                        <div className="tk-l2-body">{customItems.map((it) => (<ItemRow key={it.id} it={it} onOpen={() => open(it)} onToggle={() => toggleGdVisible(it.id)} />))}</div>
                      ) : (
                        groups.map((g) => (
                          <div key={g.name} className="tk-l2">
                            <div className="tk-l2-head"><span className="tk-cat-handle"><DragHandle /></span><span className="tk-l2-name">{g.name}</span></div>
                            <div className="tk-l2-body">{g.items.map((it) => (<ItemRow key={it.id} it={it} onOpen={() => open(it)} onToggle={() => toggleGdVisible(it.id)} />))}</div>
                            <div className="tk-l2-pad" />
                          </div>
                        ))
                      )}
                    </section>
                  </div>
                </div>
              </>
            )}

            {/* ========================= 진료항목 폼 ========================= */}
            {page === 'items' && screen === 'form' && d && (
              <>
                <div className="cn-header tk-form-header">
                  <button className="tk-back" onClick={() => setScreen('list')}><Back /> 목록</button>
                  <div className="rg-eyebrow">진료항목</div>
                  <div className="cn-header-title">{selId === null ? '진료항목 등록' : '진료항목 정보'}</div>
                </div>

                <div className="rg-container">
                  <div className="rg-form">
                    <section className="rg-card required">
                      <div className="rg-group-title">필수 정보</div>
                      <div className="rg-field">
                        <FieldHead label="진료항목" helpers={['등록할 비급여 진료항목명을 검색하거나 직접 입력해 주세요.']} />
                        <div className="rg-search"><input className="rg-input" placeholder="진료항목을 검색해 주세요." value={d.name} onChange={(e) => patch({ name: e.target.value })} /><span className="rg-search-ic"><SearchIcon /></span></div>
                      </div>
                      <div className="rg-field price">
                        <FieldHead label="가격 정보" helpers={['환자에게 보여줄 가격 정보를 설정해 주세요. (예: 횟수별, 시술명별 등)']} />
                        <div className="rg-price-list">{d.prices.map((p) => (<PriceRow key={p.id} p={p} kakaoOn={d.kakaoOn} onChange={(u) => setPrice(p.id, u)} onDelete={() => delPrice(p.id)} />))}</div>
                      </div>
                      <div className="rg-add-wrap"><button className="rg-add-btn" onClick={addPrice}><PlusIcon /> 가격 옵션 추가</button></div>
                    </section>

                    <section className="rg-card extra">
                      <div className="rg-group-title">추가 정보</div>
                      <div className="rg-field">
                        <FieldHead label="대표 사진" optional helpers={['진료항목을 대표하는 사진을 업로드해 주세요.']} />
                        {d.hasImage ? <div className="tk-thumb"><span>대표 이미지</span><button onClick={() => patch({ hasImage: false })} aria-label="삭제"><CloseIcon /></button></div> : <button className="rg-upload" onClick={() => patch({ hasImage: true })}><PhotoIcon /><span className="rg-upload-label">사진 추가</span></button>}
                      </div>
                      <div className="rg-field">
                        <FieldHead label="진료항목 노출명" optional helpers={['비워두면 진료항목명과 동일하게 노출됩니다.']} />
                        <input className="rg-input" placeholder="진료항목 노출명을 입력해 주세요." maxLength={50} value={d.alias} onChange={(e) => patch({ alias: e.target.value })} />
                        <div className="rg-counter"><span className="rg-counter-num">{d.alias.length}</span>/50자</div>
                      </div>
                      <div className="rg-field">
                        <FieldHead label="한 줄 소개" optional helpers={['진료항목을 한눈에 이해할 수 있는 짧은 소개 문구를 입력해 주세요.']} />
                        <input className="rg-input" placeholder="한 줄 소개를 입력해 주세요." maxLength={50} value={d.intro} onChange={(e) => patch({ intro: e.target.value })} />
                        <div className="rg-counter"><span className="rg-counter-num">{d.intro.length}</span>/50자</div>
                      </div>
                      <div className="rg-divider" />
                      <div className="rg-field">
                        <FieldHead label="진료항목 키워드" optional helpers={['포털에서 더 잘 검색되도록 관련 키워드를 입력해 주세요.']} />
                        <input className="rg-input" placeholder="키워드 입력 후 Enter 키를 눌러주세요." value={kw} onChange={(e) => setKw(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addKw(); } }} />
                        <div className="rg-tag-box">{d.keywords.length === 0 ? <span className="rg-tag-empty">등록된 키워드가 없습니다.</span> : d.keywords.map((t, i) => (<span className="rg-tag" key={i}>{t}<button className="rg-tag-del" onClick={() => patch({ keywords: d.keywords.filter((_, j) => j !== i) })}>×</button></span>))}</div>
                        <div className="rg-counter"><span className="rg-counter-num">{d.keywords.length}</span>/20개</div>
                      </div>
                    </section>

                    {/* 카카오톡 예약하기에서도 보이기 */}
                    <section className="rg-card tk-kcard">
                      <div className="tk-khead">
                        <div className="tk-khead-left"><KakaoMark cls="tk-khead-mark" /><div><div className="tk-khead-title">카카오톡 예약하기에서도 보이기</div><div className="rg-help">켜면 이 진료항목이 카카오톡 예약하기에도 상품으로 보여요. 끄면 카카오에서만 안 보이며 입력한 정보는 그대로 유지돼요.</div></div></div>
                        <button className={`rg-toggle${d.kakaoOn ? '' : ' off'}${hospitalLinked ? '' : ' disabled'}`} onClick={() => hospitalLinked && patch({ kakaoOn: !d.kakaoOn })}><span className="rg-toggle-knob" /></button>
                      </div>
                      {d.kakaoOn && (
                        <div className="tk-kbody">
                          {!d.gdVisible && <div className="tk-kcascade"><WarnIc /> 굿닥 노출이 꺼져 있어 지금은 카카오에도 노출되지 않아요. 굿닥 노출을 켜야 카카오에도 함께 보여요.</div>}
                          <div className="tk-kauto"><InfoIc /> 위에 입력한 굿닥 진료항목 정보가 카카오 상품으로 <b>자동 반영</b>돼요. 규격에 안 맞는 부분만 아래에서 확인하세요.</div>
                          {warns.length > 0 ? (
                            <div className="tk-warns">{warns.map((w, i) => (<div key={i} className={`tk-warn ${w.level}`}><span className="tk-warn-ic">{w.level === 'warn' ? <WarnIc /> : <InfoIc />}</span><div><span className="tk-warn-field">{w.field}</span><span className="tk-warn-msg">{w.msg}</span></div></div>))}</div>
                          ) : <div className="tk-ok">규격에 모두 맞아요. 그대로 노출돼요.</div>}
                          <button className="tk-kextra-toggle" onClick={() => patchExtra({ open: !d.kExtra.open })}><span>카카오 전용 정보 추가 입력 <span className="rg-optional">(선택)</span></span><span className={`tk-kextra-chev${d.kExtra.open ? ' open' : ''}`}><ChevronD /></span></button>
                          {d.kExtra.open && (
                            <div className="tk-kextra">
                              <div className="rg-help tk-kextra-desc">카카오톡 예약하기에만 노출되는 정보예요. (굿닥 화면엔 노출되지 않아요)</div>
                              <div className="tk-kfield">
                                <div className="tk-klabel">예약 시 받을 정보</div>
                                {d.kExtra.questions.map((q) => (<div key={q.id} className="tk-q-row"><input className="rg-input" placeholder="질문 (예: 증상, 방문 예상일시)" value={q.name} onChange={(e) => setQ(q.id, { name: e.target.value })} /><button className={`tk-q-opt${q.optional ? '' : ' req'}`} onClick={() => setQ(q.id, { optional: !q.optional })}>{q.optional ? '선택' : '필수'}</button><button className="rg-price-del" onClick={() => delQ(q.id)}><CloseIcon /></button></div>))}
                                <button className="tk-add-sm" onClick={addQ}><PlusIcon /> 질문 추가</button>
                              </div>
                              <div className="tk-kfield"><div className="tk-klabel">이용 방법</div><input className="rg-input" placeholder="예: 접수처에 예약 내역을 보여 주세요." value={d.kExtra.howto} onChange={(e) => patchExtra({ howto: e.target.value })} /></div>
                              <div className="tk-kfield"><div className="tk-klabel">유의사항</div><input className="rg-input" placeholder="예: 방문 시 신분증을 지참해 주세요." value={d.kExtra.notice} onChange={(e) => patchExtra({ notice: e.target.value })} /></div>
                              <div className="tk-kfield"><div className="tk-klabel">취소 유의사항</div><input className="rg-input" placeholder="예: 방문 불가 시 취소 바랍니다." maxLength={100} value={d.kExtra.cancelNotice} onChange={(e) => patchExtra({ cancelNotice: e.target.value })} /></div>
                            </div>
                          )}
                        </div>
                      )}
                    </section>
                  </div>

                  <GoodocPreview d={d} />
                </div>

                <div className="rg-footer">
                  <div className="rg-footer-left">
                    <button className="rg-btn-cancel" onClick={() => setScreen('list')}>취소</button>
                    <button className="rg-btn-save" onClick={save}>저장</button>
                    {d.kakaoOn && (warnCount > 0 ? <span className="tk-foot-warn"><WarnIc /> 카카오 검토 {warnCount}건 (자동 보정돼 노출)</span> : <span className="tk-foot-ok"><KakaoMark /> 카카오 규격 확인됨</span>)}
                  </div>
                  <div className="rg-footer-right">
                    <span className="rg-footer-label">{d.gdVisible ? '환자들에게 진료항목을 노출합니다.' : '진료항목을 노출하지 않습니다.'}</span>
                    <button className={`rg-toggle${d.gdVisible ? '' : ' off'}`} onClick={() => patch({ gdVisible: !d.gdVisible })}><span className="rg-toggle-knob" /></button>
                  </div>
                </div>
              </>
            )}

            {toast && <div className="rg-toast">{toast}</div>}
          </main>
        </div>
      </div>
    </div>
  );
}

export default TiKakao;
