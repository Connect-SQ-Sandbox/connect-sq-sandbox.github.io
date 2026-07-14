import React, { useMemo, useState } from 'react';
import { ChangeDrawer, type PolicyChange, type PrototypeView } from '../../../components/prototype/ChangeDrawer';
import { POLICY_SOURCES, TI_KAKAO_CHANGES } from '../../../content/change-manifests/ti-kakao';

/**
 * ┌─ 프로토타입 컨텍스트 ───────────────────────────────────
 * 이름     : ti-kakao-devguide — [POC] 진료항목 목록 개발 핸드오프 가이드 (ti-kakao v14 복제본)
 * 상태     : POC(experimental)   최종수정: 2026-07-14   원본: pages/connect/ti-kakao
 * 목적     : 프론트 개발 전달용 명세를 프로토타입에 임베드하는 실험. devMode ON 시 영역별 '명세' 뱃지→패널→라이브 케이스 재현.
 *            원본 ti-kakao는 그대로 두고 이 복제본에서만 실험한다.
 * PRD      : GCP-1 · 2.2-review · documents/prd/2026-07-13-진료항목-카카오톡-예약하기-연동-구축.md
 * 배포URL  : https://connect-sq-sandbox.github.io/out/ti-kakao-devguide.html
 * 관련 CSS : connectRegister.css + connectTiKakao.css
 * 기술제약 : react-only · plain CSS · mock · 네트워크 0
 *
 * 화면구성 (LNB 이동):
 *   ① 진료항목 목록  ② 진료항목 폼(등록/상세)  ③ 예약 신청 내역  ④ 운영 설정
 *
 * 핵심 결정 (why):
 *   [확정·PRD] 토글 워딩 = "카카오톡 예약하기에서도 보이기"
 *   [확정·PRD] 노출 캐스케이드 — 굿닥 노출 OFF → 카카오도 OFF
 *   [확정·PRD] 카카오 연동 활성화는 오직 진료항목 상세의 "…에서도 보이기" 토글로만. 리스트 일괄 연동 없음(리스트 채널 심볼은 읽기 전용 현황)
 *   [확정·PRD] V1은 굿닥에 노출되는 진료항목만 카카오 노출 가능(카카오 단독 상품 불가)
 *   [확정·PRD] 사용자 모델은 Item 없음. API 어댑터에서 DEFAULT Item 1개를 기술적으로 생성
 *   [확정·PRD] Price=굿닥 가격 옵션, 금액은 Price.description 선두에 문자열로 합성
 *   [유지·자체] 채널 심볼 [굿닥][카카오] 아이콘만 표기(텍스트 없음)
 *   [유지·자체] 규격 검증 — 상품명50 / 가격명25 / 할인가 / 상담가 / 이미지
 *   [유지·자체] 미리보기는 굿닥 기준만(카카오 미리보기 없음)
 *   [유지·자체] 카카오 전용 목록 없음 → 진료항목 목록에 인입 채널 심볼만 병합
 *   [유지·자체] 카카오 전용 정보는 옵션 아코디언으로 추가 입력
 *   [유지·자체] 예약 신청 내역 = 실제 TreatmentItemApptListView 재현
 *              (카카오·굿닥 예약이 같은 테이블에 혼재 + "채널" 컬럼만 추가)
 *   [유지·자체] 운영 설정 = 실제 non-payment-reservations/operation 재현
 *              (비급여 예약 받기 토글[OFF 시 중지 모달] + 자동확정/당일예약/새 예약 알림)
 *   [폐기]      구버전 kakao-link(별도 연동관리 페이지형) → ti-kakao로 대체
 *
 * 보류 · TODO (PO 확인 대기):
 *   - PRD 10·16·18장 "상품 관리 메뉴" 잔재 (18-1 Non-Scope 충돌)
 *   - 규격위반 자동보정 정책 명문화
 *
 * 변경 이력:
 *   v14 2026-07-14 — 카카오 단독 상품 차단, 토글 캐스케이드 강화, Product/DEFAULT Item/Price API 미리보기,
 *                    Price.description 금액 합성 규칙(상담가 제외·할인 판매가·고정가·" - " 구분자) 반영.
 *   v13 2026-07-14 — 기본 OFF 예정 정책 필터 추가. ON 시 검토 중 PRD 카드와 예정 화면 표현, 예정 배포일 노출.
 *   v12 2026-07-14 — 공통 우측 정책 변경 패널 추가. 화면 위치 강조 + 공개 정책 요약 Markdown 열람 + PRD ID 추적.
 *   v11 2026-07-13 — 질문 입력 UI를 네이버 폼 참고로 개선: 유형=드롭다운(객관식/주관식), 답변 필수·복수 선택=토글, 질문 추가 단일 버튼.
 *                    '복수 선택'은 유형이 아닌 토글(객관식 내 radio↔select). 개수 상한 주관식 10 / 객관식(합산) 10.
 *   v10 2026-07-13 — 질문 생성 필드 디자인을 Figma 컴포넌트(18305:65068)에 맞춤: 필수/선택 버튼(w64·연한 테두리), 체크박스 18px,
 *                    선택지 추가 버튼(투명·아이콘16+텍스트13), 카드 여백 13px·테두리 #f2f4f6, 삭제 아이콘 18px.
 *   v9  2026-07-13 — 질문 목록 드래그 순서 변경 추가(핸들 드래그, HTML5 DnD). API sequence(3종 통합 오름차순 전역 순서) 대응.
 *   v8  2026-07-13 — 질문 개수 제한을 유형별로 분리: 주관식 10(API 명시)/단수 5/복수 5(권장), 선택지 2~10개.
 *                    유형별 추가 버튼에 n/최대 카운트 + 상한 도달 시 비활성. (기존 3종 합산 10개 총량 상한 폐기)
 *   v7  2026-07-13 — 예약 부가정보(질문)를 카카오 API 4.4.2대로 3종 지원: 주관식(infos)/단수 선택형(radioInfos)/복수 선택형(selectInfos).
 *                    선택형은 설명·선택지 목록(최소 2, 추가/삭제) 입력. 질문 120자, 총 10개 상한 유지.
 *   v6  2026-07-13 — 진료항목 폼 '추가 정보'에 상세 소개(텍스트)·상세 소개 사진(최대 5개) 섹션 추가(실제 TreatmentItemForm 반영).
 *                    상세 소개 글자수 제한 2,000자(요청; 실제 코드 5,000). 미리보기에도 상세 소개·이미지 반영.
 *   v5  2026-07-13 — 예약 신청 상세 모달을 실제 서비스 상세 디자인 언어로 재구성:
 *                    상단 상태 헤더(상태+안내문), 취소 사유 안내 배너, 추가 질문·답변, 방문자=예약자 동일 처리,
 *                    병원 메모(내부), 실제 데이터 계약(PartnerTreatmentItemApptDetailResponse) 필드 반영, CTA 버튼 강조.
 *   v4  2026-07-13 — 예약 상세 모달 뷰포트 기준(fixed) 교정(하단버튼·타이틀 고정+본문 스크롤).
 *                    카카오 상품 API v1.2.2 규격 입력 반영: 질문 120자·최대10개, 이용방법 2,000자, 취소유의 100자.
 *   v3  2026-07-13 — 운영 설정 화면 추가(실제 operation 코드 이식), LNB beta를 그룹 헤더로 이동
 *   v2  2026-07-13 — 예약 신청 내역 + 예약 상세 모달 추가
 *   v1  2026-07-09 — ti-kakao 방향 확정, kakao-link 대체
 * └──────────────────────────────────────────────────────
 */

/* ============================ 진료항목 타입 & mock ============================ */
type PriceType = 'fixed' | 'discount' | 'consult';
type Price = { id: number; title: string; content: string; type: PriceType; amount: string; original: string; sale: string };
// 카카오 예약 부가정보 3종: 주관식(infos) / 단수 선택형(radioInfos) / 복수 선택형(selectInfos)
type QType = 'text' | 'radio' | 'select';
type Question = { id: number; type: QType; name: string; optional: boolean; description: string; options: string[] };
const QTYPE_LABEL: Record<QType, string> = { text: '주관식', radio: '단수 선택형', select: '복수 선택형' };
type Item = {
  id: number;
  cat1: string; cat2: string;
  name: string; alias: string; intro: string; detail: string;
  keywords: string[]; hasImage: boolean; detailImages: number; // detail=상세 소개, detailImages=상세 소개 사진 개수
  prices: Price[];
  gdVisible: boolean;
  kakaoOn: boolean;
  kExtra: { open: boolean; questions: Question[]; howto: string; notice: string; cancelNotice: string };
};

let UID = 1000;
const emptyExtra = () => ({ open: false, questions: [] as Question[], howto: '', notice: '', cancelNotice: '' });
const won = (s: string) => (s ? Number(s).toLocaleString('ko-KR') + '원' : '0원');
/**
 * 카카오 병원 API는 Price에 숫자 금액 필드가 없어 description(최대 100자)에 안내 문자열을 싣는다.
 * - 상담 후 결정: 금액 문자열을 넣지 않음
 * - 할인 가격: 판매가만 사용
 * - 고정 가격: 고정가 사용
 * - 굿닥 가격 설명이 있으면 금액 뒤에 " - "로 연결
 */
const kakaoPriceDescription = (p: Price) => {
  const amount = p.type === 'consult' ? '' : p.type === 'discount' ? won(p.sale) : won(p.amount);
  const note = p.content.trim();
  return [amount, note].filter(Boolean).join(' - ');
};

const PRICE_TYPES: { value: PriceType; label: string }[] = [
  { value: 'fixed', label: '고정 가격' }, { value: 'discount', label: '할인 가격' }, { value: 'consult', label: '상담 후 결정' }
];

const CAT_ORDER = ['피부·미용', '성형·윤곽', '주사·수액', '직접 입력 항목'];
const CUSTOM_CAT = '직접 입력 항목';

const mk = (p: Partial<Item> & { id: number; name: string; cat1: string; cat2: string }): Item => ({
  alias: '', intro: '', detail: '', keywords: [], hasImage: false, detailImages: 0,
  prices: [{ id: UID++, title: '기본', content: '', type: 'fixed', amount: '', original: '', sale: '' }],
  gdVisible: true, kakaoOn: false, kExtra: emptyExtra(), ...p
});

const INITIAL: Item[] = [
  mk({ id: 1, cat1: '피부·미용', cat2: '스킨부스터', name: '리쥬란 힐러', alias: '', intro: '피부 재생 스킨부스터', detail: '리쥬란 힐러는 연어에서 추출한 PDRN 성분으로 손상된 피부를 근본부터 재생시키는 스킨부스터예요.\n\n· 잔주름·모공·탄력 개선\n· 시술 후 즉시 일상생활 가능\n· 3~4주 간격 3회 권장', keywords: ['리쥬란', '스킨부스터'], hasImage: true, detailImages: 3,
    prices: [{ id: UID++, title: '1회', content: '', type: 'fixed', amount: '250000', original: '', sale: '' }, { id: UID++, title: '3회 패키지 (사후관리 포함)', content: '재생관리 포함', type: 'discount', amount: '', original: '750000', sale: '600000' }], gdVisible: true, kakaoOn: false }),
  mk({ id: 2, cat1: '피부·미용', cat2: '스킨부스터', name: '물광주사', intro: '수분 광채 물광주사', keywords: ['물광주사'], hasImage: true,
    prices: [{ id: UID++, title: '1회', content: '', type: 'fixed', amount: '120000', original: '', sale: '' }], gdVisible: true, kakaoOn: true }),
  mk({ id: 3, cat1: '피부·미용', cat2: '리프팅', name: '실 리프팅', intro: '', keywords: [], hasImage: false,
    prices: [{ id: UID++, title: '상담 후 결정', content: '', type: 'consult', amount: '', original: '', sale: '' }], gdVisible: false, kakaoOn: false }),
  mk({ id: 4, cat1: '피부·미용', cat2: '리프팅', name: '슈링크 유니버스', intro: '집중 리프팅', keywords: ['슈링크'], hasImage: true,
    prices: [{ id: UID++, title: '300샷', content: '', type: 'fixed', amount: '300000', original: '', sale: '' }], gdVisible: true, kakaoOn: false }),
  mk({ id: 5, cat1: '피부·미용', cat2: '색소·톤', name: '레이저 토닝', intro: '색소·톤 개선 레이저', detail: '레이저 토닝은 미세한 저출력 레이저를 반복 조사해 기미·잡티·색소 침착을 단계적으로 옅게 만드는 시술이에요.\n\n· 다운타임 거의 없음\n· 2주 간격 꾸준한 관리 권장', keywords: ['레이저토닝'], hasImage: true, detailImages: 2,
    prices: [{ id: UID++, title: '1회', content: '', type: 'fixed', amount: '80000', original: '', sale: '' }, { id: UID++, title: '5회', content: '', type: 'fixed', amount: '350000', original: '', sale: '' }], kExtra: { open: true, questions: [
      { id: 9001, type: 'text', name: '주로 신경 쓰이는 부위가 어디인가요?', optional: false, description: '', options: [] },
      { id: 9002, type: 'radio', name: '레이저 시술 경험이 있으신가요?', optional: true, description: '', options: ['처음이에요', '1~2회', '3회 이상'] },
      { id: 9003, type: 'select', name: '함께 상담받고 싶은 항목을 선택해 주세요.', optional: true, description: '복수 선택할 수 있어요.', options: ['색소·잡티', '모공', '홍조', '피부결'] }
    ], howto: '', notice: '', cancelNotice: '' }, gdVisible: true, kakaoOn: true }),
  mk({ id: 6, cat1: '성형·윤곽', cat2: '지방흡입', name: '얼굴지방흡입', alias: '얼굴 지방흡입', intro: '갸름한 얼굴라인을 위한 지방흡입', keywords: ['지방흡입', '얼굴윤곽'], hasImage: true,
    prices: [{ id: UID++, title: '기본', content: '', type: 'fixed', amount: '3500000', original: '', sale: '' }], gdVisible: true, kakaoOn: true }),
  mk({ id: 7, cat1: '주사·수액', cat2: '보톡스', name: '보톡스 (이마)', intro: '이마 주름 개선', keywords: ['보톡스'], hasImage: false,
    prices: [{ id: UID++, title: '이마', content: '', type: 'discount', amount: '', original: '150000', sale: '99000' }], gdVisible: true, kakaoOn: true }),
  mk({ id: 8, cat1: CUSTOM_CAT, cat2: '', name: '우리병원 시그니처 관리', intro: '원장 직접 시술', keywords: [], hasImage: false,
    prices: [{ id: UID++, title: '1회', content: '', type: 'fixed', amount: '150000', original: '', sale: '' }], gdVisible: true, kakaoOn: false })
];

/* ============================ 카카오 규격 검증 ============================ */
const K_NAME_MAX = 50;        // 카카오 상품명 최대 50자
const K_PRICE_MAX = 25;       // 카카오 가격 이름 최대 25자
// 질문 유형별 개수 상한. API는 주관식 infos[]만 "최대 10개" 명시 → 그대로 사용. 단수/복수는 문서 제한 없음 → UX 기준 권장값.
const K_Q_TEXT_MAX = 10;      // 주관식(infos[]) — API 명시값
const K_Q_CHOICE_MAX = 10;    // 객관식(단수 radioInfos + 복수 selectInfos 합산) — 권장. '복수 선택'은 유형이 아니라 토글
const K_Q_OPT_MIN = 2;        // 선택형 선택지 최소 개수
const K_Q_OPT_MAX = 10;       // 선택형 선택지 최대 개수 (권장)
const K_Q_NAME_MAX = 120;     // 카카오 질문(부가정보 name) 최대 120자
const K_INFO_MAX = 2000;      // 카카오 이용 방법(information) 최대 2,000자
const K_CANCEL_MAX = 100;     // 카카오 취소 유의사항(cancelNotice) 최대 100자
const DETAIL_DESC_MAX = 2000; // 상세 소개(detailDescription) 최대 글자수 (요청 반영 — 실제 코드 MAX_LENGTH는 5,000)
const DETAIL_IMG_MAX = 5;     // 상세 소개 사진(detailImages) 최대 개수 (실제 코드 동일)
type Warn = { field: string; msg: string; level: 'warn' | 'info' };
function kakaoWarns(it: Item): Warn[] {
  const w: Warn[] = [];
  const pname = it.alias || it.name;
  if (pname.length > K_NAME_MAX) w.push({ field: '상품명', msg: `카카오 상품명은 50자까지예요. 현재 ${pname.length}자 → 잘려서 노출돼요.`, level: 'warn' });
  it.prices.forEach((p) => { if (p.title.length > K_PRICE_MAX) w.push({ field: '가격명', msg: `"${p.title.slice(0, 10)}…" 카카오 25자까지 (현재 ${p.title.length}자)`, level: 'warn' }); });
  if (it.prices.some((p) => p.type === 'discount')) w.push({ field: '할인가', msg: '카카오는 정상가·할인율 없이 판매가만 참고가로 노출돼요.', level: 'warn' });
  if (it.prices.some((p) => p.type !== 'consult')) w.push({ field: '가격', msg: '금액은 Price.description에 안내 문자열로 반영되며 카카오에서 결제되지는 않아요.', level: 'info' });
  it.prices.forEach((p) => { if (kakaoPriceDescription(p).length > 100) w.push({ field: '가격 설명', msg: `"${p.title}"의 카카오 가격 설명이 100자를 초과해요.`, level: 'warn' }); });
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
/** 상세 상단 상태 안내문 (실제 서비스 AppointmentStatus의 title+content 언어 반영) */
const AS_DESC: Record<string, string> = {
  T01: '아직 확정되지 않은 예약이에요. 내용을 확인하고 확정하거나 취소해 주세요.',
  T03: '방문 예정일에 내원하는 확정된 예약이에요.',
  F05: '방문·진료가 완료된 예약이에요.',
  F03: '병원 사정으로 취소된 예약이에요.',
  F02: '환자가 직접 취소한 예약이에요.',
  T02: '확정되지 못하고 종료된 예약이에요.',
  F01: '환자가 취소를 요청한 예약이에요.'
};

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
type QA = { q: string; a: string }; // 카카오 상품에 설정한 '예약 시 받을 정보' 질문 + 예약자 답변
type Appt = {
  id: number; channel: Channel; status: string;
  visit: string; when: string; statusAt?: string; // 예약희망일시 / 신청일시 / 최근 상태변경 시각
  itemName: string; itemAlias?: string; option: string; priceText: string; // option=선택 가격옵션명, priceText=총액
  visitor: Person; reserver: Person;
  memo?: string; cancelReason?: string;
  answers?: QA[]; // 추가 질문·답변 (예약 시점 스냅샷)
  hospitalMemo?: string; // 병원 내부 메모 (환자 비노출)
};
const INITIAL_APPTS: Appt[] = [
  { id: 201, channel: 'kakao', status: AS.REQUESTED, visit: '2026.07.11(토) 15:00', when: '2026.07.10(금) 09:12', itemName: '레이저 토닝', option: '1회', priceText: '80,000원', visitor: { name: '김민지', gender: '여', birth: '1996.05.20 (만 30세)', phone: '010-2345-6789' }, reserver: { name: '김민지', gender: '여', birth: '1996.05.20 (만 30세)', phone: '010-2345-6789' }, memo: '기미 위주로 봐주세요', answers: [{ q: '주로 신경 쓰이는 부위가 어디인가요?', a: '양 볼 기미와 잔잔한 잡티요.' }, { q: '레이저 시술 경험이 있으신가요?', a: '아니요, 처음이에요.' }] },
  { id: 202, channel: 'goodoc', status: AS.REQUESTED, visit: '2026.07.11(토) 11:30', when: '2026.07.10(금) 08:40', itemName: '물광주사', option: '1회', priceText: '120,000원', visitor: { name: '이서연', gender: '여', birth: '1990.11.02 (만 35세)', phone: '010-3456-7890' }, reserver: { name: '이서연', gender: '여', birth: '1990.11.02 (만 35세)', phone: '010-3456-7890' } },
  { id: 203, channel: 'kakao', status: AS.CONFIRMED, visit: '2026.07.12(일) 14:00', when: '2026.07.10(금) 10:02', statusAt: '2026.07.10(금) 10:31', itemName: '보톡스 (이마)', option: '이마', priceText: '99,000원', visitor: { name: '박도윤', gender: '남', birth: '1988.07.15 (만 37세)', phone: '010-4567-8901' }, reserver: { name: '박도윤', gender: '남', birth: '1988.07.15 (만 37세)', phone: '010-4567-8901' }, memo: '주차 가능한가요?', answers: [{ q: '시술 희망 부위를 알려주세요.', a: '이마 가로 주름이요.' }], hospitalMemo: '지난 상담 시 보톡스 부작용 이력 없음 확인. 이마만 진행 예정.' },
  { id: 204, channel: 'goodoc', status: AS.CONFIRMED, visit: '2026.07.12(일) 16:30', when: '2026.07.09(목) 17:20', statusAt: '2026.07.09(목) 18:02', itemName: '얼굴 지방흡입', option: '기본', priceText: '3,500,000원', visitor: { name: '최지우', gender: '여', birth: '2001.02.28 (만 25세)', phone: '010-5678-9012' }, reserver: { name: '최지우 모', gender: '여', birth: '1975.09.10 (만 50세)', phone: '010-9999-0000' }, hospitalMemo: '미성년 보호자(모) 동반 예약. 수술 전 대면 상담 일정 별도 안내 필요.' },
  { id: 205, channel: 'kakao', status: AS.COMPLETED, visit: '2026.07.05(일) 13:00', when: '2026.07.05(일) 09:40', statusAt: '2026.07.05(일) 13:55', itemName: '실 리프팅', option: '상담', priceText: '상담 후 결정', visitor: { name: '정하윤', gender: '여', birth: '1993.01.05 (만 33세)', phone: '010-6789-0123' }, reserver: { name: '정하윤', gender: '여', birth: '1993.01.05 (만 33세)', phone: '010-6789-0123' }, answers: [{ q: '상담 희망 내용을 적어주세요.', a: '처진 볼 라인 리프팅 상담 원해요.' }] },
  { id: 206, channel: 'goodoc', status: AS.CANCELED_PATIENT, visit: '2026.07.06(월) 10:00', when: '2026.07.05(일) 20:10', statusAt: '2026.07.06(월) 08:12', itemName: '리쥬란 힐러', option: '3회 패키지 (사후관리 포함)', priceText: '600,000원', visitor: { name: '강서진', gender: '남', birth: '1997.12.24 (만 28세)', phone: '010-7890-1234' }, reserver: { name: '강서진', gender: '남', birth: '1997.12.24 (만 28세)', phone: '010-7890-1234' }, cancelReason: '개인 사정으로 방문이 어려워 취소했습니다.' },
  { id: 207, channel: 'kakao', status: AS.CANCELED_HOSPITAL, visit: '2026.07.06(월) 18:00', when: '2026.07.06(월) 09:30', statusAt: '2026.07.06(월) 12:30', itemName: '슈링크 유니버스', option: '300샷', priceText: '300,000원', visitor: { name: '윤예은', gender: '여', birth: '1992.08.19 (만 33세)', phone: '010-8901-2345' }, reserver: { name: '윤예은', gender: '여', birth: '1992.08.19 (만 33세)', phone: '010-8901-2345' }, answers: [{ q: '시술 희망 부위와 샷 수를 알려주세요.', a: '얼굴 전체 300샷 원해요.' }], cancelReason: '선택하신 시간에는 병원 사정으로 방문이 어렵습니다. 다른 시간으로 다시 예약해 주세요.' }
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
/** 안내 배너 아이콘(실제 GuideBanner normal variant = ic_caution, gray-60) */
const CautionIc = () => (<svg viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="8" fill="currentColor" /><rect x="9" y="5.2" width="2" height="6" rx="1" fill="#fff" /><circle cx="10" cy="13.7" r="1.1" fill="#fff" /></svg>);
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
type Page = 'items' | 'appt' | 'settings';
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
          <N label="비급여 예약" beta ex="d" />
          <N label="예약 신청 내역" sub active={page === 'appt'} onClick={() => onNav('appt')} />
          <N label="진료항목 관리" sub active={page === 'items'} onClick={() => onNav('items')} />
          <N label="운영 설정" sub active={page === 'settings'} onClick={() => onNav('settings')} />
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

/** 화면에서는 Item 단계를 노출하지 않지만 카카오 Price API 경로상 itemId가 필수라 DEFAULT Item을 1개 생성한다. */
function KakaoApiPreview({ d }: { d: Item }) {
  const displayType = d.prices.length > 1 ? 'SELECT' : 'NOT_DISPLAY';
  return (
    <div className="tk-api-map" data-policy-id="gcp1-price-mapping">
      <div className="tk-api-map-head">
        <div><b>카카오 API 전송 구조</b><span>환자 화면에서는 Item 선택 단계를 숨겨요.</span></div>
        <span className="tk-api-badge">{displayType}</span>
      </div>
      <div className="tk-api-tree">
        <div className="tk-api-node"><span>Product</span><b>{d.alias || d.name || '진료항목명'}</b></div>
        <div className="tk-api-arrow">↓</div>
        <div className="tk-api-node muted"><span>DEFAULT Item · 기술용</span><b>{d.id}:DEFAULT</b></div>
        <div className="tk-api-arrow">↓</div>
        <div className="tk-api-prices">
          {d.prices.map((p) => (
            <div className="tk-api-price" key={p.id}>
              <span className="tk-api-price-name">Price · {p.title || '가격 옵션명'}</span>
              <span className="tk-api-price-desc">description: {kakaoPriceDescription(p) || '(미입력)'}</span>
            </div>
          ))}
        </div>
      </div>
      <p>가격 옵션이 1개면 일정만 선택하도록 <code>NOT_DISPLAY</code>, 2개 이상이면 <code>SELECT</code>를 사용해요. 이 값은 등록 후 수정할 수 없어 옵션 수 경계가 바뀌면 상품 재생성이 필요해요.</p>
    </div>
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
        {kakaoOn && <div className="tk-finfo"><InfoIc /> 카카오 Price.description: {kakaoPriceDescription(p) || '(금액 정보 없음)'}</div>}
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
          {(d.detail || d.detailImages > 0) && <div className="tk-pv-divider" />}
          {d.detail && <div className="tk-pv-detail">{d.detail}</div>}
          {d.detailImages > 0 && <div className="tk-pv-detail-imgs">{Array.from({ length: d.detailImages }).map((_, i) => <div key={i} className="tk-pv-detail-img">상세 이미지 {i + 1}</div>)}</div>}
        </div>
      </div>
      <div className="tk-pv-tag">굿닥 기준 미리보기</div>
    </div>
  );
}

/* ============================ 목록: 인입 채널 표기 + 항목 행 ============================ */
/** 굿닥/카카오 심볼 나란히. 보임=풀컬러, 안 보임=회색. 노출 캐스케이드(굿닥 OFF→카카오 OFF) 반영. */
/* 피그마(18290:66063) 채널 아이콘: 굿닥 = 파란 라운드 사각 뱃지 + 흰색 굿닥 심볼 */
const GoodocGlyph = () => (
  <svg viewBox="0 0 27 43" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <path d="M13.1516 36.3658C9.90902 36.3658 7.21826 33.9857 6.74251 30.8897H0.0390015C0.542057 37.65 6.2297 42.9981 13.1516 42.9981C20.0735 42.9981 25.7611 37.65 26.2642 30.8897H19.5587C19.0849 33.9857 16.3922 36.3658 13.1496 36.3658H13.1516Z" fill="#fff" />
    <path d="M13.1516 4.96207C5.90017 4.96207 0 10.832 0 18.0462C0 25.2603 5.90017 31.1302 13.1516 31.1302C20.403 31.1302 26.3032 25.2603 26.3032 18.0462C26.3032 10.832 20.403 4.96207 13.1516 4.96207ZM13.1516 24.498C9.5756 24.498 6.66646 21.6038 6.66646 18.0462C6.66646 14.4885 9.5756 11.5943 13.1516 11.5943C16.7276 11.5943 19.6367 14.4885 19.6367 18.0462C19.6367 21.6038 16.7276 24.498 13.1516 24.498V24.498Z" fill="#fff" />
  </svg>
);
function ChannelMarks({ it, plannedPreview = false }: { it: Item; plannedPreview?: boolean }) {
  const previewItem = plannedPreview ? { ...it, kakaoOn: true } : it;
  const w = kWarnCount(previewItem);
  const kakaoShown = previewItem.kakaoOn && (plannedPreview || previewItem.gdVisible);
  const kakaoTitle = plannedPreview
    ? '예정안: 굿닥 노출과 무관하게 카카오톡 예약하기에서 보임'
    : !previewItem.kakaoOn
    ? '카카오톡 예약하기에서 안 보임'
    : !previewItem.gdVisible
      ? '굿닥 노출이 꺼져 있어 카카오에도 안 보임'
      : w > 0 ? `카카오톡 예약하기에서 보임 · 규격 검토 ${w}건` : '카카오톡 예약하기에서 보임';
  return (
    <span className="tk-chans">
      <span className={`tk-chan tk-chan-gd${it.gdVisible ? '' : ' dim'}`} title={it.gdVisible ? '굿닥에서 보임' : '굿닥에서 안 보임'}><GoodocGlyph /></span>
      <span className={`tk-chan tk-chan-kko${kakaoShown ? '' : ' dim'}`} title={kakaoTitle}>
        <KakaoMark />{kakaoShown && w > 0 && <span className="tk-chan-dot" />}
      </span>
    </span>
  );
}
/* ── POC: 프론트 전달용 명세 데이터 (devMode ON 시 뱃지→팝오버로 열람) ── */
const DG_SPECS: Record<string, { title: string; lines: string[] }> = {
  'list-grid': {
    title: '진료항목 목록 · 공통 규칙',
    lines: [
      '좌측에서 대분류 카테고리를 선택하면, 우측에 해당 카테고리의 진료항목이 중분류(그룹)별로 표시됩니다.',
      '각 행 = 노출명(없으면 진료항목명) · 대표가격(옵션 2개↑면 "최저가~") · 옵션 수 뱃지 · 채널 심볼 · 굿닥 노출 토글.',
      '채널 심볼 컬럼(굿닥·카카오)은 병원이 카카오 연동된 경우에만 표시됩니다. 미연동 병원은 컬럼 전체가 미노출. → 아래 [카카오 미연동]으로 확인.',
      '항목이 없는 카테고리는 빈 상태 문구를 표시합니다. → 아래 [빈 상태 재현]으로 확인.',
      '행 hover 시 드래그 핸들·삭제 아이콘이 노출되고, 드래그로 순서를 바꿉니다.',
    ],
  },
  'item-row': {
    title: '진료항목 행 · 구성/상태',
    lines: [
      '채널 심볼(굿닥·카카오): 노출 중이면 컬러, 미노출이면 흐린 회색(dim).',
      '카카오 검토 필요 항목은 카카오 심볼 우상단에 주황 dot 표시.',
      '굿닥 노출 토글 OFF → 노출 캐스케이드로 카카오에서도 비노출(카카오 심볼도 dim).',
      '가격: 옵션 1개면 금액, 2개 이상이면 "최저가~" 형식.',
    ],
  },
};

function ItemRow({ it, onOpen, onToggle, plannedPreview = false, showChannels = true }: { it: Item; onOpen: () => void; onToggle: () => void; plannedPreview?: boolean; showChannels?: boolean }) {
  return (
    <div className="tk-l3">
      <span className="tk-l3-handle"><DragHandle /></span>
      <button className="tk-l3-detail" onClick={onOpen}>
        <span className="tk-l3-name">{it.alias || it.name}{plannedPreview && <span className="pc-planned-row-badge">예정</span>}</span>
        <span className="tk-l3-price"><span className="tk-l3-price-text">{priceDisplay(it)}</span><span className="tk-l3-optcount">{it.prices.length}</span></span>
        <span className="tk-l3-thumb">{it.hasImage ? <span className="tk-l3-thumb-img" /> : <ThumbIcon />}</span>
        {showChannels && <ChannelMarks it={it} plannedPreview={plannedPreview} />}
      </button>
      <span className={`tk-l3-visible${it.gdVisible ? ' on' : ''}`}>{it.gdVisible ? '노출중' : '노출 안 함'}</span>
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

      <div className="ap-body" data-policy-id="gcp1-appointment-channel">
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
            <div className={`ap-detail-status ${AS_TAG[detail.status] || 'gray'}`}>
              <div className="ap-detail-status-row">
                <span className={`ap-tag ${AS_TAG[detail.status] || 'gray'}`}>{AS_LABEL[detail.status] || detail.status}</span>
                <span className="ap-detail-chan"><span className="ap-chan-ic"><ChannelIcon channel={detail.channel} /></span>{CHANNEL_LABEL[detail.channel]} 신청</span>
              </div>
              {AS_DESC[detail.status] && <p className="ap-detail-status-desc">{AS_DESC[detail.status]}</p>}
            </div>
            <div className="ap-detail-scroll">
              {detail.cancelReason && (
                <div className="ap-guide">
                  <span className="ap-guide-ic"><CautionIc /></span>
                  <div className="ap-guide-body"><div className="ap-guide-title">취소 사유</div><div className="ap-guide-text">{detail.cancelReason}</div></div>
                </div>
              )}
              <div className="ap-dsec">
                <div className="ap-dsec-title">예약 정보</div>
                <DetailRow label="예약 희망일시">{detail.visit}</DetailRow>
                <DetailRow label="진료항목">{detail.itemName}{detail.itemAlias && detail.itemAlias !== detail.itemName ? ` (${detail.itemAlias})` : ''}</DetailRow>
                <DetailRow label="가격 옵션">{detail.option}</DetailRow>
                <DetailRow label="예상 결제 금액">{detail.priceText}</DetailRow>
                <DetailRow label="요청사항">{detail.memo || '-'}</DetailRow>
                <DetailRow label="신청일시">{detail.when}</DetailRow>
              </div>
              {detail.answers && detail.answers.length > 0 && (
                <div className="ap-dsec">
                  <div className="ap-dsec-title">추가 질문·답변</div>
                  <div className="ap-qa-list">
                    {detail.answers.map((qa, i) => (
                      <div key={i} className="ap-qa">
                        <div className="ap-qa-q"><span className="ap-qa-mark">Q</span>{qa.q}</div>
                        <div className="ap-qa-a"><span className="ap-qa-mark a">A</span>{qa.a}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="ap-dsec">
                <div className="ap-dsec-title">방문자 정보</div>
                <DetailRow label="이름">{detail.visitor.name}</DetailRow>
                <DetailRow label="성별">{detail.visitor.gender}</DetailRow>
                <DetailRow label="생년월일">{detail.visitor.birth}</DetailRow>
                <DetailRow label="연락처">{detail.visitor.phone}</DetailRow>
              </div>
              <div className="ap-dsec">
                <div className="ap-dsec-title">예약자 정보</div>
                {detail.reserver.name === detail.visitor.name && detail.reserver.phone === detail.visitor.phone
                  ? <div className="ap-same-note">방문자와 동일해요.</div>
                  : (<><DetailRow label="이름">{detail.reserver.name}</DetailRow><DetailRow label="연락처">{detail.reserver.phone}</DetailRow></>)}
              </div>
              <div className="ap-dsec">
                <div className="ap-dsec-title">병원 메모<span className="ap-dsec-badge">병원만 볼 수 있어요</span></div>
                {detail.hospitalMemo
                  ? <div className="ap-memo-box">{detail.hospitalMemo}</div>
                  : <div className="ap-memo-box empty">등록된 메모가 없어요.</div>}
              </div>
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

/* ============================ 운영 설정 화면 ============================ */
/** 실제 개발 화면(non-payment-reservations/operation) 재현.
 *  구성 = 비급여 예약 받기(BoxContainer + 운영중/미운영 라벨 토글, OFF 시 중지 확인 모달)
 *        + 설정 섹션(운영시간 GuideBanner + 예약 자동확정/당일예약/새 예약 알림 토글).
 *  API(usePatchApptUsed 등) → 로컬 state로 mock. 진료항목 개수는 목록 mock과 연동. */
function SettingToggle({ checked, onChange, disabled }: { checked: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className={`rg-toggle${checked ? '' : ' off'}${disabled ? ' disabled' : ''}`}
      onClick={() => !disabled && onChange()}
    >
      <span className="rg-toggle-knob" />
    </button>
  );
}
function SettingBox({ title, subNode, right }: { title: string; subNode: React.ReactNode; right: React.ReactNode }) {
  return (
    <div className="set-box">
      <div className="set-box-left">
        <div className="set-box-title">{title}</div>
        <div className="set-box-sub">{subNode}</div>
      </div>
      <div className="set-box-right">{right}</div>
    </div>
  );
}
function SettingsScreen({ itemCount, showToast }: { itemCount: number; showToast: (m: string) => void }) {
  const [apptUsed, setApptUsed] = useState(true);
  const [autoConfirmed, setAutoConfirmed] = useState(true);
  const [todayApptUsed, setTodayApptUsed] = useState(true);
  const [newApptNotified, setNewApptNotified] = useState(true);
  const [stopOpen, setStopOpen] = useState(false);

  const handleApptUsed = () => {
    if (!apptUsed) {
      setApptUsed(true);
      showToast('진료항목 비급여 예약을 시작했어요.');
      return;
    }
    setStopOpen(true);
  };
  const confirmStop = () => {
    setApptUsed(false);
    setStopOpen(false);
    showToast('진료항목 비급여 예약을 중지했어요.');
  };

  return (
    <>
      <div className="cn-header set-header">
        <div className="cn-header-title">비급여 예약 설정</div>
        <div className="ap-sub">굿닥에 등록한 비급여 진료항목으로 예약을 받을 수 있습니다.</div>
      </div>

      <div className="set-body" data-policy-id="gcp1-operation-settings">
        {/* 비급여 예약 받기 */}
        <SettingBox
          title="비급여 예약 받기"
          subNode={<><span className="set-count">{itemCount}개의 진료항목이</span><span className="set-count-rest"> 등록되어 있어요.</span></>}
          right={
            <div className="set-status-toggle">
              <span className={`set-status${apptUsed ? '' : ' off'}`}>{apptUsed ? '운영중' : '미운영'}</span>
              <SettingToggle checked={apptUsed} onChange={handleApptUsed} />
            </div>
          }
        />

        {/* 설정 */}
        <section className="set-section">
          <div className="set-section-title">설정</div>

          <div className="set-banner">
            <span className="set-banner-left">
              <span className="set-banner-ic"><CautionIc /></span>
              <span className="set-banner-msg">병원 운영 시간에 맞춰 30분 단위로 예약을 받습니다.</span>
            </span>
            <button type="button" className="set-banner-action" onClick={() => showToast('병원 운영시간 관리 화면으로 이동해요.')}>
              병원 운영시간 관리<span className="set-banner-arrow"><ChevronR /></span>
            </button>
          </div>

          <SettingBox
            title="예약 자동 확정"
            subNode="자동 확정 사용 시, 별도 승인 없이 예약 신청과 동시에 자동으로 확정됩니다."
            right={<SettingToggle checked={autoConfirmed} onChange={() => setAutoConfirmed((v) => !v)} />}
          />
          <SettingBox
            title="당일 예약 허용"
            subNode="당일 예약 허용 시, 현재 시간 기준 1시간 이후부터 당일 예약을 받습니다."
            right={<SettingToggle checked={todayApptUsed} onChange={() => setTodayApptUsed((v) => !v)} />}
          />
          <SettingBox
            title="새 예약 알림 받기"
            subNode="새 예약 신청이 발생하면, 이 PC에서 윈도우 알림을 받습니다."
            right={<SettingToggle checked={newApptNotified} onChange={() => setNewApptNotified((v) => !v)} />}
          />
        </section>
      </div>

      {/* 예약 그만 받기 확인 모달 (실제 StopConfirmModal) */}
      {stopOpen && (
        <div className="ap-dim" onClick={() => setStopOpen(false)}>
          <div className="ap-modal set-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ap-modal-title">비급여 예약을 그만 받으시겠어요?</div>
            <div className="set-modal-body">
              그만 받기를 누르면 굿닥에서 진료항목 노출과 예약 신청이 모두 중단돼요. 등록된 진료항목은 그대로 유지되며, 다시 시작하면 바로 예약을 받을 수 있어요.
            </div>
            <div className="ap-modal-btns">
              <button className="rg-btn-cancel" onClick={() => setStopOpen(false)}>취소</button>
              <button className="set-modal-danger" onClick={confirmStop}>그만 받기</button>
            </div>
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
  const [dragQ, setDragQ] = useState<number | null>(null);
  const [qTypeOpen, setQTypeOpen] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [showPlanned, setShowPlanned] = useState(false);
  const [devMode, setDevMode] = useState(false);
  const [devSpec, setDevSpec] = useState<string | null>(null); // 열린 명세 팝오버 id (POC)
  const [emptyPreview, setEmptyPreview] = useState(false); // 목록 빈 상태 케이스 재현 (POC)
  const [hospitalLinked, setHospitalLinked] = useState(true); // 병원 카카오 연동 여부 (POC 케이스: 미연동 시 채널 컬럼 비노출)

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
  const plannedPreviewItemId = null;

  const nav = (p: Page) => { setPage(p); if (p === 'items') setScreen('list'); };
  const open = (it: Item) => { setSelId(it.id); setD({ ...it, prices: it.prices.map((p) => ({ ...p })), keywords: [...it.keywords], kExtra: { ...it.kExtra, questions: it.kExtra.questions.map((q) => ({ ...q, options: [...(q.options || [])] })) } }); setScreen('form'); };
  const create = () => { setSelId(null); setD(mk({ id: UID++, name: '', cat1: selCat1 === CUSTOM_CAT ? CUSTOM_CAT : selCat1, cat2: groups[0]?.name || '' })); setScreen('form'); };
  const save = () => { if (!d) return; setItems((prev) => (selId === null ? [...prev, d] : prev.map((it) => (it.id === d.id ? d : it)))); setScreen('list'); showToast(selId === null ? '진료항목을 등록했어요.' : '진료항목을 저장했어요.'); };
  const addDetailImg = () => d && d.detailImages < DETAIL_IMG_MAX && patch({ detailImages: d.detailImages + 1 });
  const delDetailImg = () => d && d.detailImages > 0 && patch({ detailImages: d.detailImages - 1 });

  const addKw = () => { if (!d) return; const t = kw.trim(); if (t && d.keywords.length < 20 && !d.keywords.includes(t)) patch({ keywords: [...d.keywords, t] }); setKw(''); };
  const setPrice = (id: number, u: Partial<Price>) => d && patch({ prices: d.prices.map((p) => (p.id === id ? { ...p, ...u } : p)) });
  const addPrice = () => d && patch({ prices: [...d.prices, { id: UID++, title: '', content: '', type: 'fixed', amount: '', original: '', sale: '' }] });
  const delPrice = (id: number) => d && patch({ prices: d.prices.length > 1 ? d.prices.filter((p) => p.id !== id) : d.prices });
  const newQ = (type: QType): Question => ({ id: UID++, type, name: '', optional: true, description: '', options: type === 'text' ? [] : ['', ''] });
  const textCount = () => (d ? d.kExtra.questions.filter((q) => q.type === 'text').length : 0);
  const choiceCount = () => (d ? d.kExtra.questions.filter((q) => q.type !== 'text').length : 0);
  const addQ = (type: QType) => d && patchExtra({ questions: [...d.kExtra.questions, newQ(type)] });
  const addQuestion = () => { if (!d) return; if (choiceCount() < K_Q_CHOICE_MAX) addQ('radio'); else if (textCount() < K_Q_TEXT_MAX) addQ('text'); else showToast('질문은 더 추가할 수 없어요.'); };
  // 유형 드롭다운(객관식/주관식) — 카카오 매핑: 주관식=infos, 객관식=radio(단수)/select(복수)
  const setQKind = (id: number, kind: 'choice' | 'text') => {
    const q = d?.kExtra.questions.find((x) => x.id === id); if (!q) return;
    if (kind === 'text') { if (q.type === 'text') return; if (textCount() >= K_Q_TEXT_MAX) { showToast(`주관식은 최대 ${K_Q_TEXT_MAX}개까지예요.`); return; } setQ(id, { type: 'text' }); }
    else { if (q.type !== 'text') return; if (choiceCount() >= K_Q_CHOICE_MAX) { showToast(`객관식은 최대 ${K_Q_CHOICE_MAX}개까지예요.`); return; } setQ(id, { type: 'radio', options: q.options.length >= K_Q_OPT_MIN ? q.options : ['', ''] }); }
  };
  // '복수 선택' 토글 — 객관식 내에서 단수(radio)↔복수(select) 전환
  const setQMultiple = (id: number, multiple: boolean) => { const q = d?.kExtra.questions.find((x) => x.id === id); if (q && q.type !== 'text') setQ(id, { type: multiple ? 'select' : 'radio' }); };
  const moveQ = (from: number, to: number) => { if (!d || from === to) return; const arr = [...d.kExtra.questions]; const [m] = arr.splice(from, 1); arr.splice(to, 0, m); patchExtra({ questions: arr }); };
  const setQ = (id: number, u: Partial<Question>) => d && patchExtra({ questions: d.kExtra.questions.map((q) => (q.id === id ? { ...q, ...u } : q)) });
  const delQ = (id: number) => d && patchExtra({ questions: d.kExtra.questions.filter((q) => q.id !== id) });
  const addOpt = (id: number) => { const q = d?.kExtra.questions.find((x) => x.id === id); if (q && q.options.length < K_Q_OPT_MAX) setQ(id, { options: [...q.options, ''] }); };
  const setOpt = (id: number, idx: number, v: string) => { const q = d?.kExtra.questions.find((x) => x.id === id); if (q) setQ(id, { options: q.options.map((o, i) => (i === idx ? v : o)) }); };
  const delOpt = (id: number, idx: number) => { const q = d?.kExtra.questions.find((x) => x.id === id); if (q && q.options.length > K_Q_OPT_MIN) setQ(id, { options: q.options.filter((_, i) => i !== idx) }); };
  const toggleGdVisible = (id: number) => setItems((prev) => prev.map((it) => {
    if (it.id !== id) return it;
    const gdVisible = !it.gdVisible;
    return { ...it, gdVisible, kakaoOn: gdVisible ? it.kakaoOn : false };
  }));

  const currentView: PrototypeView = page === 'items' ? (screen === 'form' ? 'items-form' : 'items-list') : page;
  const locatePolicyChange = (change: PolicyChange) => {
    if (change.view === 'items-list') { setPage('items'); setScreen('list'); }
    if (change.view === 'items-form') {
      setPage('items');
      const targetItem = items.find((item) => item.kakaoOn) || items[0];
      if (targetItem) open(targetItem);
    }
    if (change.view === 'appt') setPage('appt');
    if (change.view === 'settings') setPage('settings');

    window.setTimeout(() => {
      const target = document.querySelector(`[data-policy-id="${change.targetId}"]`);
      if (!(target instanceof HTMLElement)) return;
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      target.classList.remove('pc-policy-highlight');
      window.requestAnimationFrame(() => target.classList.add('pc-policy-highlight'));
      window.setTimeout(() => target.classList.remove('pc-policy-highlight'), 2600);
    }, 80);
  };

  return (
    <div className="cn-artboard">
      <div className="cn-screen">
        <TitleBar />
        <div className="cn-body">
          <SideNav page={page} onNav={nav} />
          <main className="cn-main rg-main tk-main">
            {showPlanned && (
              <div className="pc-planned-preview-banner" role="status">
                <strong>예정 화면 미리보기</strong>
                <span>확정 전 PRD를 시각화한 화면이며 실제 배포 시 변경될 수 있어요.</span>
              </div>
            )}

            {/* ========================= 예약 신청 내역 ========================= */}
            {page === 'appt' && <ApptScreen showToast={showToast} />}

            {/* ========================= 운영 설정 ========================= */}
            {page === 'settings' && <SettingsScreen itemCount={items.length} showToast={showToast} />}

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

                {devMode && (emptyPreview || !hospitalLinked) && (
                  <div className="dg-case-banner">
                    <span className="dg-case-dot" />
                    <span>케이스 재현 중 · {[emptyPreview && '빈 상태', !hospitalLinked && '카카오 미연동'].filter(Boolean).join(' · ')}</span>
                    <button onClick={() => { setEmptyPreview(false); setHospitalLinked(true); }}>초기화</button>
                  </div>
                )}

                <div className="tk-list-body" data-policy-id="gcp1-channel-overview">
                  <div className="tk-grid">
                    {devMode && (
                      <div className="dg-badge-cluster">
                        <button className="dg-badge" onClick={() => setDevSpec('list-grid')}>목록 명세</button>
                        <button className="dg-badge" onClick={() => setDevSpec('item-row')}>행 명세</button>
                      </div>
                    )}
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
                      {devMode && emptyPreview ? (
                        <div className="tk-empty-state">
                          이 카테고리에 등록된 진료항목이 없어요.
                          <span>진료항목을 추가하면 여기에 표시됩니다.</span>
                          <button className="dg-reset" onClick={() => setEmptyPreview(false)}>← 기본 상태로 (케이스 재현 해제)</button>
                        </div>
                      ) : isCustom ? (
                        <div className="tk-l2-body">{customItems.map((it) => (<ItemRow key={it.id} it={it} plannedPreview={it.id === plannedPreviewItemId} showChannels={hospitalLinked} onOpen={() => open(it)} onToggle={() => toggleGdVisible(it.id)} />))}</div>
                      ) : (
                        groups.map((g) => (
                          <div key={g.name} className="tk-l2">
                            <div className="tk-l2-head"><span className="tk-cat-handle"><DragHandle /></span><span className="tk-l2-name">{g.name}</span></div>
                            <div className="tk-l2-body">{g.items.map((it) => (<ItemRow key={it.id} it={it} plannedPreview={it.id === plannedPreviewItemId} showChannels={hospitalLinked} onOpen={() => open(it)} onToggle={() => toggleGdVisible(it.id)} />))}</div>
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
                        <FieldHead label="상세 소개" optional helpers={['진료항목 상세 페이지에서 보여질 자세한 소개 내용을 입력해 주세요.']} />
                        <textarea className="rg-textarea" placeholder="상세 소개를 입력해 주세요." maxLength={DETAIL_DESC_MAX} value={d.detail} onChange={(e) => patch({ detail: e.target.value })} />
                        <div className="rg-counter"><span className="rg-counter-num">{d.detail.length}</span>/{DETAIL_DESC_MAX.toLocaleString('ko-KR')}자</div>
                      </div>
                      <div className="rg-field">
                        <FieldHead label="상세 소개 사진" optional helpers={[`진료항목 상세 페이지에 노출할 사진을 업로드해 주세요. (최대 ${DETAIL_IMG_MAX}개)`, '권장 사이즈 가로 800px, 세로 15,000px 이하 · 파일당 최대 20MB · jpeg, jpg, png, gif', '이미지를 드래그해 순서를 바꿀 수 있어요.']} />
                        <div className="rg-detail-imgs">
                          {Array.from({ length: d.detailImages }).map((_, i) => (
                            <div key={i} className="rg-detail-thumb"><span className="rg-detail-thumb-idx">{i + 1}</span><button className="rg-detail-thumb-del" onClick={delDetailImg} aria-label="사진 삭제"><CloseIcon /></button></div>
                          ))}
                          {d.detailImages < DETAIL_IMG_MAX && <button className="rg-detail-add" onClick={addDetailImg}><PhotoIcon /><span>사진 추가</span></button>}
                        </div>
                        <div className="rg-counter"><span className="rg-counter-num">{d.detailImages}</span>/{DETAIL_IMG_MAX}개</div>
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
                    <section className="rg-card tk-kcard" data-policy-id="gcp1-channel-visibility">
                      <div className="tk-khead">
                        <div className="tk-khead-left"><KakaoMark cls="tk-khead-mark" /><div className="tk-khead-text"><div className="tk-khead-title">카카오톡 예약하기에서도 보이기</div><div className="rg-help">켜면 이 진료항목이 카카오톡 예약하기에도 상품으로 보여요. 끄면 카카오에서만 안 보이며 입력한 정보는 그대로 유지돼요.</div></div></div>
                        <button className={`rg-toggle${d.kakaoOn ? '' : ' off'}${hospitalLinked && d.gdVisible ? '' : ' disabled'}`} aria-label="카카오톡 예약하기에서도 보이기" aria-disabled={!hospitalLinked || !d.gdVisible} onClick={() => hospitalLinked && d.gdVisible && patch({ kakaoOn: !d.kakaoOn })}><span className="rg-toggle-knob" /></button>
                      </div>
                      {!d.gdVisible && <div className="tk-kdependency"><WarnIc /> 굿닥에 노출 중인 진료항목만 카카오톡 예약하기에도 노출할 수 있어요. 먼저 하단의 굿닥 노출을 켜 주세요.</div>}
                      {d.kakaoOn && (
                        <div className="tk-kbody">
                          <div className="tk-kauto"><span className="tk-kauto-ic"><InfoIc /></span><span className="tk-kauto-txt">위에 입력한 굿닥 진료항목 정보가 카카오 상품으로 <b>자동 반영</b>돼요. 규격에 안 맞는 부분만 아래에서 확인하세요.</span></div>
                          {warns.length > 0 ? (
                            <div className="tk-warns">{warns.map((w, i) => (<div key={i} className={`tk-warn ${w.level}`}><span className="tk-warn-ic">{w.level === 'warn' ? <WarnIc /> : <InfoIc />}</span><div><span className="tk-warn-field">{w.field}</span><span className="tk-warn-msg">{w.msg}</span></div></div>))}</div>
                          ) : <div className="tk-ok">규격에 모두 맞아요. 그대로 노출돼요.</div>}
                          {devMode && <KakaoApiPreview d={d} />}
                          <button className="tk-kextra-toggle" onClick={() => patchExtra({ open: !d.kExtra.open })}><span>카카오 전용 정보 추가 입력 <span className="rg-optional">(선택)</span></span><span className={`tk-kextra-chev${d.kExtra.open ? ' open' : ''}`}><ChevronD /></span></button>
                          {d.kExtra.open && (
                            <div className="tk-kextra">
                              <div className="rg-help tk-kextra-desc">카카오톡 예약하기에만 노출되는 정보예요. (굿닥 화면엔 노출되지 않아요)</div>
                              <div className="tk-kfield">
                                <div className="tk-klabel">예약 시 받을 정보 <span className="tk-klabel-count">총 {d.kExtra.questions.length}개</span></div>
                                {d.kExtra.questions.map((q, idx) => (
                                  <div key={q.id} className={`tk-q-item${dragQ === idx ? ' dragging' : ''}`}
                                    onDragOver={(e) => { if (dragQ !== null) e.preventDefault(); }}
                                    onDrop={() => { if (dragQ !== null) moveQ(dragQ, idx); setDragQ(null); }}>
                                    <div className="tk-q-drag" draggable onDragStart={() => setDragQ(idx)} onDragEnd={() => setDragQ(null)} aria-label="순서 변경 핸들"><DragHandle /></div>
                                    <div className="rg-select-wrap tk-q-typesel">
                                      <button type="button" className={`rg-select tk-q-typebtn${qTypeOpen === q.id ? ' open' : ''}`} onClick={() => setQTypeOpen((v) => (v === q.id ? null : q.id))}>{q.type === 'text' ? '주관식' : '객관식'}<span className="rg-select-ic"><SelectArrow /></span></button>
                                      {qTypeOpen === q.id && (
                                        <div className="rg-select-menu" onMouseLeave={() => setQTypeOpen(null)}>
                                          <button type="button" className={`rg-select-opt${q.type !== 'text' ? ' active' : ''}`} onClick={() => { setQKind(q.id, 'choice'); setQTypeOpen(null); }}>객관식</button>
                                          <button type="button" className={`rg-select-opt${q.type === 'text' ? ' active' : ''}`} onClick={() => { setQKind(q.id, 'text'); setQTypeOpen(null); }}>주관식</button>
                                        </div>
                                      )}
                                    </div>
                                    <div className="tk-q-qrow">
                                      {!q.optional && <span className="tk-q-req">*</span>}
                                      <input className="rg-input" placeholder="질문 입력" maxLength={K_Q_NAME_MAX} value={q.name} onChange={(e) => setQ(q.id, { name: e.target.value })} />
                                    </div>
                                    {q.type !== 'text' && (
                                      <div className="tk-q-choice">
                                        <input className="rg-input" placeholder="설명 입력 (선택)" value={q.description} onChange={(e) => setQ(q.id, { description: e.target.value })} />
                                        <div className="tk-q-opts">
                                          {q.options.map((opt, i) => (
                                            <div key={i} className="tk-q-optrow">
                                              <span className={`tk-q-optmark ${q.type}`} />
                                              <input className="rg-input" placeholder={`항목 ${i + 1}`} value={opt} onChange={(e) => setOpt(q.id, i, e.target.value)} />
                                              <button className="rg-price-del" onClick={() => delOpt(q.id, i)} disabled={q.options.length <= K_Q_OPT_MIN} aria-label="항목 삭제"><CloseIcon /></button>
                                            </div>
                                          ))}
                                          {q.options.length < K_Q_OPT_MAX
                                            ? <button className="tk-add-xs" onClick={() => addOpt(q.id)}><PlusIcon /> 항목 추가</button>
                                            : <div className="rg-help">항목은 최대 {K_Q_OPT_MAX}개까지 추가할 수 있어요.</div>}
                                        </div>
                                      </div>
                                    )}
                                    <div className="tk-q-bar">
                                      <label className="tk-q-switch"><span>답변 필수</span><button type="button" className={`rg-toggle${q.optional ? ' off' : ''}`} onClick={() => setQ(q.id, { optional: !q.optional })}><span className="rg-toggle-knob" /></button></label>
                                      {q.type !== 'text' && <label className="tk-q-switch"><span>복수 선택</span><button type="button" className={`rg-toggle${q.type === 'select' ? '' : ' off'}`} onClick={() => setQMultiple(q.id, q.type !== 'select')}><span className="rg-toggle-knob" /></button></label>}
                                      <span className="tk-q-bar-spacer" />
                                      <button className="rg-price-del" onClick={() => delQ(q.id)} aria-label="질문 삭제"><CloseIcon /></button>
                                    </div>
                                  </div>
                                ))}
                                {textCount() < K_Q_TEXT_MAX || choiceCount() < K_Q_CHOICE_MAX
                                  ? <button className="tk-add-sm tk-q-addbtn" onClick={addQuestion}><PlusIcon /> 질문 추가</button>
                                  : <div className="rg-help">질문은 더 추가할 수 없어요.</div>}
                              </div>
                              <div className="tk-kfield"><div className="tk-klabel">이용 방법</div><input className="rg-input" placeholder="예: 접수처에 예약 내역을 보여 주세요." maxLength={K_INFO_MAX} value={d.kExtra.howto} onChange={(e) => patchExtra({ howto: e.target.value })} /><div className="rg-counter"><span className="rg-counter-num">{d.kExtra.howto.length}</span>/{K_INFO_MAX.toLocaleString('ko-KR')}자</div></div>
                              <div className="tk-kfield"><div className="tk-klabel">유의사항</div><input className="rg-input" placeholder="예: 방문 시 신분증을 지참해 주세요." value={d.kExtra.notice} onChange={(e) => patchExtra({ notice: e.target.value })} /></div>
                              <div className="tk-kfield"><div className="tk-klabel">취소 유의사항</div><input className="rg-input" placeholder="예: 방문 불가 시 취소 바랍니다." maxLength={K_CANCEL_MAX} value={d.kExtra.cancelNotice} onChange={(e) => patchExtra({ cancelNotice: e.target.value })} /><div className="rg-counter"><span className="rg-counter-num">{d.kExtra.cancelNotice.length}</span>/{K_CANCEL_MAX}자</div></div>
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
                    <button className={`rg-toggle${d.gdVisible ? '' : ' off'}`} aria-label="굿닥 진료항목 노출" aria-pressed={d.gdVisible} onClick={() => { const gdVisible = !d.gdVisible; patch({ gdVisible, kakaoOn: gdVisible ? d.kakaoOn : false }); }}><span className="rg-toggle-knob" /></button>
                  </div>
                </div>
              </>
            )}

            {toast && <div className="rg-toast">{toast}</div>}
          </main>
        </div>
        {devSpec && DG_SPECS[devSpec] && (
          <div className="dg-pop-catch" onClick={() => setDevSpec(null)}>
            <div className="dg-pop" onClick={(e) => e.stopPropagation()}>
              <div className="dg-pop-head">
                <span className="dg-pop-tag">명세</span>
                <b>{DG_SPECS[devSpec].title}</b>
                <button className="dg-pop-close" onClick={() => setDevSpec(null)} aria-label="닫기">×</button>
              </div>
              <ul className="dg-pop-list">{DG_SPECS[devSpec].lines.map((l, i) => <li key={i}>{l}</li>)}</ul>
              {devSpec === 'list-grid' && (
                <div className="dg-cases">
                  <span className="dg-cases-label">라이브 케이스 재현</span>
                  <div className="dg-cases-btns">
                    <button className={emptyPreview ? ' on' : ''} onClick={() => { setEmptyPreview(true); setDevSpec(null); }}>빈 상태 재현</button>
                    <button className={!hospitalLinked ? ' on' : ''} onClick={() => { setHospitalLinked(false); setDevSpec(null); }}>카카오 미연동</button>
                    <button onClick={() => { setEmptyPreview(false); setHospitalLinked(true); setDevSpec(null); }}>기본 상태</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        <ChangeDrawer
          currentView={currentView}
          changes={TI_KAKAO_CHANGES}
          sources={POLICY_SOURCES}
          showPlanned={showPlanned}
          onShowPlannedChange={setShowPlanned}
          devMode={devMode}
          onDevModeChange={setDevMode}
          onLocate={locatePolicyChange}
        />
      </div>
    </div>
  );
}

export default TiKakao;
