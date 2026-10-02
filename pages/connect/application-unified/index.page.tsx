/**
 * ─────────────────────────────────────────────────────────────
 * 이름      : application-unified — 병원 상세(As-is) → 진료실 선택(As-is) → 통합 신청서(420 예약 · 420 미리접수 · 진료항목 예약)
 * 상태      : 현행 · v0.20 · 최종수정 2026-10-02
 * PRD       : GAS-1 (Draft) 기반, PO 협의 2026-09-29 반영. PO 체험판 application-standard와 별개 페이지.
 *             내부 검토 메모는 사내 문서에 둔다(공개 저장소라 링크 미기재).
 * 배포URL   : https://connect-sq-sandbox.github.io/out/application-unified.html
 * 피그마    : 사내 파일(링크·노드 매핑은 같은 폴더 figma/link.md, 공개 저장소라 URL 미기재) · 기준선: figma/baseline.md (2026-10-02, 미리접수 신청서만)
 * 관련 CSS  : styles/applicationUnified.css (goodoc-design 토큰·컴포넌트 발췌, plain CSS)
 * 기술제약  : 샌드박스 빌드는 emotion/styled 금지 → plain CSS. 외부 요청 0. 가상 데이터·메모리 상태만.
 * 화면구성  : 좌측 체험 조건 패널 + 390px 폰 프레임(상단바 · 신청서 스크롤 · 하단 고정 CTA · 바텀시트)
 *
 * 핵심 결정(why)
 *  - [확정·PO협의] 신청서만 통합. 세 서비스 포맷을 최대한 같게.
 *  - [확정·세화] 병원 상세·420 예약 진료실 선택 화면은 현재 앱(production @1ebac45ab)과 동일하게 재현(detail.tsx).
 *    예약 → 진료실 선택(진료실/진료항목 토글, 예약 불가 진료실 카드 미노출) → 신청서. 미리접수 → 신청서. 진료항목 행 → 옵션 시트('예약') → 신청서.
 *    생략: 로그인·본인인증·신분증 게이트, 진료항목 상세 화면, 지도·리뷰 목록·공유 시트(자리표시).
 *  - [확정·세화] 결과는 현재 앱과 동일(result.tsx): 미리접수=ReceiptCompleteScreen(환자별 결과·접수 정보·'접수 결과 확인하기'),
 *    420 예약·진료항목=닫을 수 없는 결과 시트(확정/요청/마감/실패 분기, 버튼 동작 앱과 동일). 결과 아이콘 Lottie는 CSS 도형으로 대체.
 *  - [확정·세화] 병원 기록 조회 실패는 일반 병원에서 알리지 않는다(가족 목록으로 그대로 신청). 차트 확인 필수 병원은 없음.
 *  - [유지·자체] 재진만 접수 병원: 시트 상단 '재진 환자만 진료 가능한 병원이에요'(As-is 카피), 조회 완료 전·기록 없는 사람은 선택 불가,
 *    조회 실패 시에만 '다시 확인' 노출, 제출 시 재검증. 진료항목 예약은 조회가 없어 해당 없음.
 *  - [확정·세화] 미리접수 결과도 바텀시트로 통일(기본값). 근거: 세 서비스 모두 '로딩을 보여준 컨테이너가 결과까지' 보여주는 구조로 맞춤,
 *    실패 시 신청서 입력 유지. 시트에는 결과 헤더 + 진료 대상 + CTA만(접수 정보 3행 제외). 비교용으로 전체 페이지(현재 앱) 전환 유지.
 *  - [확정·PO협의] 섹션 순서: ①진료실/진료항목(+내원목적 1뎁스 | 가격옵션) ②예약 희망일 ③예약자 정보 ④주소 ⑤약관동의 ⑥고정 CTA.
 *  - [확정·PO협의] 내원목적은 진료실에 목적이 설정된 경우만 노출. 목적에 따라 예약 가능 날짜가 달라짐.
 *  - [확정·PO협의] 가격옵션은 앞단에서 골라 왔지만 신청서에서 변경 가능.
 *  - [확정·PO협의] 예약 희망일은 최초 비어 있음. 진료항목은 목적 없이 운영일 전부 활성.
 *  - [확정·PO협의] 미리접수는 무조건 당일 → 캘린더 없이 '오늘' 고정 표시.
 *  - [확정·PO협의] 예약자 정보: 진료실=본인+가족+차트 조회(420 환자조회 참고), 진료항목=본인 또는 타인 입력.
 *  - [확정·세화] 진료항목 예약자는 '본인'이 기본 선택(As-is sameAsBooker=true와 동일). 진료실은 최초 비어 있음.
 *  - [확정·PO협의] 주소: 병원 설정에 따라 필수/선택/미노출, 등록 주소 있으면 prefill.
 *  - [확정·PO협의] 약관: 병원 설정 약관만, 필수/선택 구분.
 *  - [확정·As-is] 선택한 전원이 이전에 동의한 약관은 다시 받지 않음(차트 조회 응답 viewedConsentIds 기준, useAppointmentSelectPatient.ts:405-448).
 *    [유지·자체] 이때 섹션을 숨기지 않고 '이미 동의했어요' + 동의 완료 목록으로 보여줌(As-is는 동의 시트 자체를 생략). 진료항목은 조회가 없어 해당 없음.
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
 *  - [확정·세화] 병원 접수 이력(차트 조회)으로 굿닥 가족 등록은 미성년(만 19세 미만)만 가능. 차트 조회된 성인은 가족 등록 없이
 *    이번 신청의 대상자로만 선택 가능(가족 목록에 저장되지 않음).
 *  - [보류] 차트에서만 조회된 사람(가족 미등록) 연결 시 본인확인·관계확인 절차.
 *
 * 변경 이력
 *  - v0.1 (2026-09-29) 최초 작성.
 *  - v0.17 (2026-09-30) 병원 기록 가족 연결은 미성년만, 성인은 이번 신청에만 선택(성인 후보 예시 추가).
 *  - v0.18 (2026-10-02) 토스트를 앱 라이브러리 mobile/SnackBar 디자인으로 교체(none/success/fail, 2줄 제한, 좌우 20). 위치는 앱 스낵바 가이드: 하단 20, 고정 CTA·시트 푸터 위 12.
 *  - v0.19 (2026-10-02) 색 토큰을 Foundations 값으로 동기화. 섹션 빨간 바 제거(필드 테두리·문구로만 에러 표시). 결과 '다른 시간/날짜 보기' 뒤 마감 슬롯·날짜 재조회 반영. 1명 재동의 문구 교정. 목적 없이 날짜를 누르면 에러 없이 목적 시트로 안내. 예약 일정 선택 후 진료실 변경은 확인 모달. 화면 배경 흰색 + 섹션 구분 mobile/divider(8, Gray/20), 동시접수 이름 칩 mobile/chip(Small·Selected_Primary_Outlined).
 *  - v0.20 (2026-10-02) 피그마 앱 라이브러리 기준: 필드 에러 문구 body2_500(14/22), 시트 하단 버튼 영역 위 선 제거·12/20/12+홈 인디케이터, 알럿 315폭·24/20/20·본문 14/22, 본문 하단 CTA도 같은 규격, 입력창 박스형 h56·Gray/30, 결과 페이지 로딩 중 X 알럿은 결과 도착 시 자동 닫힘.
 *  - v0.16 (2026-09-30) 체험 패널에서 신청과 무관한 조건(오늘 운영·리뷰) 제거, 정보 성격별 카드 5개로 분리.
 *  - v0.15 (2026-09-30) 체험 패널을 병원 운영 설정 / 환자 정보로 재그룹, 환자별 약관 동의 이력(As-is viewedConsentIds) 반영.
 *  - v0.14 (2026-09-30) 병원 기록 조회 실패 안내 제거(일반 병원은 조용히 1회 재시도 후 가족 목록 그대로), '병원 성격: 재진만 접수' 분기 추가.
 *  - v0.13 (2026-09-30) 미리접수 결과 바텀시트안(기본) 추가, 패널에서 페이지(현재 앱)와 전환.
 *  - v0.12 (2026-09-29) 접수·예약 결과를 현재 앱 기준으로 교체(체험 패널 '신청 결과'로 분기 선택).
 *  - v0.11 (2026-09-29) 병원 상세·진료실 선택 화면(As-is) 추가, 진료항목 5종, 체험 패널에 상세 조건.
 *  - v0.10 (2026-09-29) 진료항목 예약자 기본값 본인(등록 주소 있으면 주소도 prefill).
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
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { HospitalDetail, ServiceSelect, CtaScenario, OpState, ReviewState, ServiceMode } from './detail';
import { ReceiptComplete, ReceiptResultSheet, RequestResultSheet, ApptResult, TiResult, ReceiptPatientResult, AlertView } from './result';

type Service = 'appt' | 'receipt' | 'treatment';
type Mode3 = 'required' | 'optional' | 'none';
// 토스트 = 앱 라이브러리 mobile/SnackBar. information→state=none, success→success(파란 원 체크), error→fail(빨간 배경)
type ToastKind = 'information' | 'success' | 'error';
type Person = { id: string; name: string; relation: string; birth: string; address?: string; chart?: boolean; family: boolean; oneOff?: boolean };

const TODAY = new Date(2026, 8, 29); // 2026-09-29 (화)
const NOW_MIN = 14 * 60; // 체험 기준 현재 시각 14:00
const HOLIDAYS = ['2026-10-03', '2026-10-09'];
const DOW = ['일', '월', '화', '수', '목', '금', '토'];

const ROOMS = [
  { id: 'r1', name: '1진료실', doctor: '이다온 원장', dept: '가정의학과', desc: '성인 일반 진료·예방접종·검진', apptAvailable: true, purposes: ['일반 진료', '재진 (이전 진료 이어서)', '예방접종', '영유아검진', '만성질환 정기 처방 (고혈압·당뇨 약 처방 및 혈액검사 결과 상담)', '국가건강검진', '수액·주사', '진단서·소견서 발급', '비대면 진료 후 내원'] },
  { id: 'r2', name: '2진료실', doctor: '박지안 원장', dept: '소아청소년과', desc: '', apptAvailable: true, purposes: [] as string[] },
  { id: 'r3', name: '3진료실', doctor: '최서윤 원장', dept: '내과', desc: '', apptAvailable: false, purposes: [] as string[] } // 예약 불가 → 진료실 선택 화면에서 카드 미노출(As-is)
];
const ITEMS = [{
  id: 'ti1', name: '가다실 9가', desc: '자궁경부암 예방 백신', cat: '예방접종', sub: '자궁경부암', thumb: true,
  options: [
    { id: 'o1', label: '1회 접종', caption: '', type: 'fixed', origin: 220000, sale: null },
    { id: 'o2', label: '3회 패키지', caption: '6개월 안에 3회 접종', type: 'discount', origin: 660000, sale: 600000 },
    { id: 'o3', label: '2회차 접종 (타 병원에서 1회차 접종 완료한 경우)', caption: '', type: 'fixed', origin: 220000, sale: null },
    { id: 'o4', label: '접종 전 항체 검사', caption: '검사 결과에 따라 비용이 달라져요', type: 'consult', origin: null, sale: null }
  ] as PriceOpt[]
}, {
  id: 'ti2', name: '인플루엔자 4가 (독감)', desc: '생후 6개월 이상 접종 가능', cat: '예방접종', sub: '독감', thumb: false,
  options: [{ id: 'o1', label: '1회 접종', caption: '', type: 'fixed', origin: 40000, sale: null }] as PriceOpt[]
}, {
  id: 'ti3', name: '대상포진 백신 (싱그릭스)', desc: '50세 이상 권장, 2회 접종', cat: '예방접종', sub: '대상포진', thumb: true,
  options: [{ id: 'o1', label: '1회차', caption: '', type: 'discount', origin: 250000, sale: 230000 }] as PriceOpt[]
}, {
  id: 'ti4', name: '비타민 수액', desc: '피로 회복 영양 수액, 약 40분 소요', cat: '주사·수액', sub: '영양 수액', thumb: false,
  options: [{ id: 'o1', label: '기본', caption: '', type: 'fixed', origin: 50000, sale: null }, { id: 'o2', label: '고함량', caption: '비타민C 고함량', type: 'fixed', origin: 80000, sale: null }] as PriceOpt[]
}, {
  id: 'ti5', name: '기본 건강검진 패키지', desc: '혈액·소변·흉부 X-ray 포함', cat: '검진', sub: '건강검진', thumb: false,
  options: [{ id: 'o1', label: '기본 패키지', caption: '추가 항목에 따라 달라져요', type: 'consult', origin: null, sale: null }] as PriceOpt[]
}];
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
const CHART_ONLY: Person[] = [
  { id: 'c1', name: '김겨울', relation: '병원 기록', birth: '2024.12.30', chart: true, family: false },
  { id: 'c2', name: '김민준', relation: '병원 기록', birth: '1988.05.20', chart: true, family: false }
];
/** 만 19세 미만(미성년) 여부 — 병원 접수 이력으로 굿닥 가족 등록은 미성년만 가능. 성인은 등록 없이 이번 신청의 대상자로만 선택 가능 */
function isMinor(birth: string) {
  const [y, m, d] = birth.split('.').map(Number);
  let age = TODAY.getFullYear() - y;
  if (TODAY.getMonth() + 1 < m || (TODAY.getMonth() + 1 === m && TODAY.getDate() < d)) age--;
  return age < 19;
}

export default function Page() {
  // 체험 조건
  const [service, setService] = useState<Service>('appt');
  const [addrMode, setAddrMode] = useState<Mode3>('required');
  const [savedAddr, setSavedAddr] = useState<'yes' | 'no'>('yes');
  const [termsMode, setTermsMode] = useState<'both' | 'required' | 'none'>('both');
  const [lookupMode, setLookupMode] = useState<'ok' | 'fail'>('ok');
  const [consentHistory, setConsentHistory] = useState<'none' | 'agreed'>('none'); // 환자: 이 병원 약관 동의 이력
  const [revisitOnly, setRevisitOnly] = useState(false); // 병원 성격: 재진 환자만 접수(As-is '재진 환자만 진료 가능한 병원이에요')
  const [purposeSetting, setPurposeSetting] = useState<'on' | 'off'>('on');
  // 병원 상세 체험 조건
  const [stage, setStage] = useState<'detail' | 'service' | 'form'>('detail');
  const [formFrom, setFormFrom] = useState<'detail' | 'service' | 'direct'>('detail');
  const [ctaScenario, setCtaScenario] = useState<CtaScenario>('both');
  const [tiOn, setTiOn] = useState(true);
  const [opState, setOpState] = useState<OpState>('open');
  const [reviewState, setReviewState] = useState<ReviewState>('show');
  const [itemId, setItemId] = useState('ti1');
  const [liked, setLiked] = useState(false);
  const [serviceKey, setServiceKey] = useState(0);
  const [detailKey, setDetailKey] = useState(0);
  const [optionEntry, setOptionEntry] = useState(false); // true = 상세/진료실 선택에서 진입하는 옵션 시트(As-is 버튼 '예약')

  // 신청서 상태
  const [roomId, setRoomId] = useState('r1');
  const [purpose, setPurpose] = useState('');
  const [optionIds, setOptionIds] = useState<string[]>(['o1']);
  const [optionDraft, setOptionDraft] = useState<string[]>([]);
  const [date, setDate] = useState<Date | null>(null);
  // 결과 시트 '다른 시간/날짜 보기' 뒤 슬롯 재조회 결과(As-is 재조회 재현): 마감된 시간·날짜는 선택 불가로 빠진다. 키에 진료실 포함
  const [soldOut, setSoldOut] = useState<{ slots: string[]; dates: string[] }>({ slots: [], dates: [] });
  const [time, setTime] = useState('');
  const [dateDraft, setDateDraft] = useState<Date | null>(null);
  const [timeDraft, setTimeDraft] = useState('');
  const [purposeFromDate, setPurposeFromDate] = useState(false);
  const [roomConfirm, setRoomConfirm] = useState<string | null>(null); // 예약 일정이 있을 때 진료실 변경 확인
  const [people, setPeople] = useState<Person[]>(FAMILY);
  const [picked, setPicked] = useState<string[]>([]);
  const [draft, setDraft] = useState<string[]>([]);
  const [who, setWho] = useState<'' | 'self' | 'other'>('');
  const [other, setOther] = useState({ name: '', phone: '', birth: '', gender: '' });
  const [addr, setAddr] = useState({ base: '', detail: '' });
  const [addrPrefilled, setAddrPrefilled] = useState(false);
  const [agree, setAgree] = useState<Record<string, boolean>>({});
  const [sheet, setSheet] = useState<'' | 'room' | 'patient' | 'date' | 'purpose' | 'option' | 'result'>('');
  const [lookup, setLookup] = useState<'idle' | 'loading' | 'done' | 'fail'>('idle');
  const [errors, setErrors] = useState<string[]>([]);
  const [toast, setToast] = useState('');
  const [toastKind, setToastKind] = useState<ToastKind>('information');
  const [toastBottom, setToastBottom] = useState(20);
  const [done, setDone] = useState(false);
  // 신청 결과 체험 조건 · 진행 상태
  const [rcResult, setRcResult] = useState<'success' | 'partial' | 'fail'>('success');
  const [apptResult, setApptResult] = useState<ApptResult>('successRequest');
  const [tiResult, setTiResult] = useState<TiResult>('successRequest');
  const [resultLive, setResultLive] = useState<string>('loading');
  const [rcPending, setRcPending] = useState(false);
  const [rcForm, setRcForm] = useState<'sheet' | 'page'>('sheet'); // [제안] 미리접수 결과 형태
  const resultTimer = useRef<any>(null);

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
  const ITEM = ITEMS.find(i => i.id === itemId)!;
  const selectedOptions = ITEM.options.filter(o => optionIds.includes(o.id));
  const apptSlots = ['both', 'appt', 'bridgeOff'].includes(ctaScenario); // connect-info apptAvailable > 0
  const serviceMode: ServiceMode = !tiOn ? 'examRoomOnly' : apptSlots ? 'both' : 'treatmentItemOnly';
  const terms = termsMode === 'none' ? [] : [
    { id: 't1', label: '개인정보 수집·이용 동의', req: true },
    ...(termsMode === 'both' ? [{ id: 't2', label: '병원 소식 수신 동의', req: false }] : [])
  ];
  const ctaLabel = service === 'receipt' ? '접수하기' : '예약 신청하기';
  const personLabel = service === 'receipt' ? '접수자 정보' : '예약자 정보';

  function resetForm(s = service) {
    setRoomId('r1'); setPurpose(''); setOptionIds(['o1']); setDate(null); setTime(''); setDateDraft(null); setTimeDraft(''); setSoldOut({ slots: [], dates: [] });
    setPeople(FAMILY); setPicked([]); setDraft([]); setWho(s === 'treatment' ? 'self' : ''); setOther({ name: '', phone: '', birth: '', gender: '' });
    const selfAddr = s === 'treatment' && savedAddr === 'yes' && addrMode !== 'none';
    setAddr(selfAddr ? { base: SAVED_ADDR, detail: '101동 1001호' } : { base: '', detail: '' }); setAddrPrefilled(selfAddr); setAgree({}); setSheet(''); setLookup('idle'); clearTimeout(lookupTimer.current);
    setErrors([]); setDone(false); setToast(''); setRoomConfirm(null); setRcPending(false); clearTimeout(resultTimer.current);
    scrollRef.current?.scrollTo({ top: 0 });
    void s;
  }
  function startForm(s: Service, opts: { roomId?: string; itemId?: string; optionIds?: string[]; from?: 'detail' | 'service' | 'direct' } = {}) {
    setService(s); resetForm(s);
    if (opts.roomId) setRoomId(opts.roomId);
    if (opts.itemId) setItemId(opts.itemId);
    if (opts.optionIds) setOptionIds(opts.optionIds);
    setFormFrom(opts.from || 'direct'); setStage('form');
  }
  function restartAll() {
    setSheet(''); setOptionEntry(false); setLiked(false); setDetailKey(k => k + 1); setServiceKey(k => k + 1); resetForm(); setStage('detail');
  }
  function openItemFromEntry(id: string) {
    setItemId(id); setOptionDraft([]); setOptionEntry(true); setSheet('option');
  }

  // 스낵바 위치(앱 가이드): 하단 기준 20 · 하단 고정 버튼(CTA·시트 푸터)이 있으면 그 위 12
  useLayoutEffect(() => {
    if (!toast) return;
    const phone = document.querySelector<HTMLElement>('.au-phone'); if (!phone) return;
    const visible = (sel: string) => Array.from(phone.querySelectorAll<HTMLElement>(sel)).find(el => el.offsetParent !== null && el.getClientRects().length > 0);
    const anchor = sheet ? visible('.au-sheet-foot') : (visible('.au-cta') || visible('.hd-cta'));
    setToastBottom(anchor ? Math.round(phone.getBoundingClientRect().bottom - phone.clientTop - anchor.getBoundingClientRect().top) + 12 : 20);
  }, [toast, sheet, stage]);
  function showToast(msg: string, kind: ToastKind = 'information') {
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
  // [확정·세화 2026-10-02] 예약에서 날짜·시간을 고른 뒤 진료실을 바꾸면 확인 모달(잃는 게 일정이라). 그 외에는 바로 변경
  function pickRoom(id: string) {
    if (id !== roomId && service === 'appt' && date) { setSheet(''); setRoomConfirm(id); return; }
    applyRoom(id);
  }
  function applyRoom(id: string) {
    if (id !== roomId) { setRoomId(id); setPurpose(''); setDate(null); setTime(''); }
    setSheet(''); clearErr('service');
  }
  function pickPurpose(p: string) {
    setPurpose(p); clearErr('service');
    if (date && !isAvailable(date, service, roomId, p)) { setDate(null); setTime(''); showToast('선택한 날짜는 이 내원 목적으로 예약할 수 없어 다시 선택해 주세요'); }
  }
  // 예약 희망일 바텀시트: 시트 안에서 날짜·시간을 고르고 '선택 완료'로 반영
  function openCalendar() {
    // [확정·세화 2026-10-02] 내원 목적 먼저 — 제출 전이라 에러 표시 없이 목적 시트로 안내하고, 고르면 날짜 시트로 이어짐
    if (usesPurpose && !purpose) { setPurposeFromDate(true); setSheet('purpose'); return; }
    setDateDraft(date); setTimeDraft(time); setSheet('date');
  }
  function applyDate() {
    setDate(dateDraft); setTime(timeDraft); setSheet(''); clearErr('date');
  }

  // 환자 조회 (420 환자조회 참고: 목록 진입 시 조회). 타이머는 실행 시점의 조건값을 읽는다.
  // 실패해도 사용자에게 알리지 않고 한 번 자동 재시도. 일반 병원은 실패 시 가족 목록만 그대로 쓴다.
  function runLookup() {
    setLookup('loading');
    clearTimeout(lookupTimer.current);
    lookupTimer.current = setTimeout(() => {
      if (lookupModeRef.current === 'ok') { setLookup('done'); return; }
      lookupTimer.current = setTimeout(() => setLookup(lookupModeRef.current === 'ok' ? 'done' : 'fail'), 900);
    }, 900);
  }
  const isMatched = (p: Person) => lookup === 'done' && (p.id === 'me' || p.id === 'f2' || !!p.chart);
  const revisitGate = isRoom && revisitOnly;
  const termsAgreedBefore = consentHistory === 'agreed' && isRoom && picked.length > 0 && picked.every(id => { const p = people.find(x => x.id === id); return !!p && isMatched(p); });
  /* As-is(useAppointmentSelectPatient.ts:405-448, ReceiptConfirmScreen.tsx:88): 차트 조회 응답의 환자별 동의 이력(viewedConsentIds)으로
     선택한 전원이 공통으로 이미 동의한 약관은 다시 받지 않는다. 기록이 없거나 조회 실패·브릿지 미연결이면 전부 다시 받는다. */
  function openPatients() {
    setDraft(picked); setSheet('patient');
    if (lookup === 'idle') runLookup(); // 실패 후 다시 열 때는 조용히 가족 목록만(재진만 병원은 '다시 확인' 버튼으로 재조회)
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
  function pickChartAdult(p: Person) {
    const one = { ...p, family: false, chart: true, oneOff: true, relation: '성인' };
    if (!people.some(x => x.id === p.id)) setPeople(ps => [...ps, one]);
    if (multi) {
      setDraft(d => {
        if (d.includes(p.id)) return d.filter(x => x !== p.id);
        if (d.length >= 5) { showToast('최대 5명까지 선택할 수 있어요', 'error'); return d; }
        return [...d, p.id];
      });
    } else { setPicked([p.id]); setSheet(''); clearErr('patient'); prefillFrom(one); }
  }
  function linkChart(p: Person) {
    if (multi && draft.length >= 5) { showToast('최대 5명까지 선택할 수 있어요', 'error'); return; }
    // [보류] 실제로는 본인확인·관계확인 후 연결. 체험판은 확인 성공을 가정한다.
    const linked = { ...p, family: true, chart: true, relation: '가족' };
    setPeople(ps => [...ps, linked]);
    if (multi) { setDraft(d => [...d, p.id]); showToast(`${p.name}님을 가족으로 연결하고 선택했어요`, 'success'); }
    else { setPicked([p.id]); setSheet(''); clearErr('patient'); prefillFrom(linked); showToast(`${p.name}님을 가족으로 연결했어요`, 'success'); }
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
    if (!termsAgreedBefore && terms.some(t => t.req && !agree[t.id])) m.push('terms');
    return m;
  }, [termsAgreedBefore, isRoom, usesPurpose, purpose, optionIds, service, date, time, picked, who, other, addrMode, addr, terms, agree]);

  function jump(k: string) {
    const el = secRefs.current[k];
    const sc = scrollRef.current;
    if (el && sc) sc.scrollTo({ top: el.getBoundingClientRect().top - sc.getBoundingClientRect().top + sc.scrollTop, behavior: 'smooth' }); // 섹션 위 구분 띠(8)부터 보이게
  }
  function submit() {
    if (revisitGate && picked.length && !pickedPeople.every(isMatched)) {
      setPicked([]); setErrors(e => Array.from(new Set([...e, 'patient']))); jump('patient');
      showToast('재진 환자만 신청할 수 있어요. 진료받을 분을 다시 선택해 주세요', 'error');
      return;
    }
    if (missing.length) {
      setErrors(missing);
      jump(missing[0]);
      showToast('입력하지 않은 항목이 있어요', 'error');
      return;
    }
    clearTimeout(resultTimer.current);
    if (service === 'receipt') {
      // As-is: 확인 → ReceiptComplete 화면으로 이동 후 환자별 결과가 순차 도착
      setRcPending(true);
      if (rcForm === 'page') setDone(true); else setSheet('result');
      resultTimer.current = setTimeout(() => setRcPending(false), 1400);
    } else {
      // As-is: 요청과 동시에 결과 시트를 로딩으로 연다
      setResultLive('loading'); setSheet('result');
      resultTimer.current = setTimeout(() => setResultLive(service === 'appt' ? apptResult : tiResult), 1200);
    }
  }
  // As-is: 420 예약은 슬롯 재조회·선택 해제(closedToday·failure는 날짜도 해제, closedToday만 달력으로 스크롤) / 진료항목은 시트만 닫음
  function afterResultOther() {
    const st = resultLive;
    setSheet('');
    if (service !== 'appt') return;
    if (date && st === 'notExistedSlots' && time) setSoldOut(s => ({ ...s, slots: [...s.slots, `${roomId} ${key(date)} ${time}`] }));
    if (date && st === 'closedToday') setSoldOut(s => ({ ...s, dates: [...s.dates, `${roomId} ${key(date)}`] }));
    setTime('');
    if (st === 'closedToday' || st === 'failure') setDate(null);
    if (st === 'closedToday') setTimeout(() => jump('date'), 50);
  }
  function goHistory(msg: string) { restartAll(); setTimeout(() => showToast(msg), 30); }
  const err = (k: string) => errors.includes(k) && missing.includes(k);

  const pickedPeople = picked.map(id => people.find(p => p.id === id)).filter(Boolean) as Person[];
  const whoName = who === 'self' ? ME.name : other.name;
  const receiptResults: ReceiptPatientResult[] = pickedPeople.map((p, i) => ({
    id: p.id, name: p.name,
    ...(rcPending ? { status: 'pending' as const }
      : rcResult === 'success' ? { status: 'success' as const }
        : rcResult === 'partial' ? (i === 0 && pickedPeople.length > 1 ? { status: 'success' as const } : i % 2 === 1 || pickedPeople.length === 1 ? { status: 'requestFail' as const, reason: 'ExamClosed' as const } : { status: 'failure' as const })
          : (i === 0 ? { status: 'requestFail' as const, reason: 'OverCapacity' as const } : { status: 'failure' as const }))
  }));
  const pad = (n: number) => String(n).padStart(2, '0');
  const ampm = (t: string, zero: boolean) => { const [h, m] = t.split(':').map(Number); const h12 = h % 12 === 0 ? 12 : h % 12; return `${h < 12 ? '오전' : '오후'} ${zero ? pad(h12) : h12}:${pad(m)}`; };
  const resultDate = date && time ? `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())}(${DOW[date.getDay()]}) ${ampm(time, service === 'appt')}` : '';

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
            <button type="button" className={`au-pick au-pick-top ${sheet === 'option' ? 'open' : ''}`} onClick={() => { setOptionDraft(optionIds); setOptionEntry(false); setSheet('option'); }} aria-haspopup="dialog">
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
                {date ? <div className="au-pick-title">{time ? `${fmt(date)} · ${time}` : fmt(date)}</div> : <div className="au-pick-ph">날짜와 시간을 선택해 주세요</div>}
                {date && !time && <div className="au-pick-sub" style={{ color: 'var(--red-60)' }}>시간을 다시 선택해 주세요</div>}
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
            {revisitGate && <div className="au-help" style={{ color: 'var(--blue-60)' }}>재진 환자만 진료 가능한 병원이에요</div>}
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
          {termsAgreedBefore ? (
            <>
              <div className="gd-banner basic">진료받을 분 모두 이 병원 약관에 이미 동의했어요. 다시 동의하지 않아도 돼요.</div>
              {terms.map(t => (
                <div key={t.id} className="au-term">
                  <span className="chk" style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, fontSize: 14 }}><span className={`gd-tag ${t.req ? 'green' : 'gray'}`}>{t.req ? '동의 완료' : '이전에 확인'}</span><span>{t.label}</span></span>
                  <button type="button" className="view" onClick={() => showToast('병원이 등록한 약관 원문을 보여줘요 (체험)')}>보기</button>
                </div>
              ))}
            </>
          ) : (<>
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
          {consentHistory === 'agreed' && isRoom && picked.length > 0 && (lookup === 'fail'
            ? <div className="au-help">병원 기록을 확인하지 못해 약관 동의를 다시 받아요.</div>
            : pickedPeople.some(p => !isMatched(p)) && <div className="au-help">{picked.length > 1 ? '병원 기록이 없는 분이 포함되어 약관 동의를 다시 받아요.' : '이 병원 진료 기록이 없어 약관 동의를 다시 받아요.'}</div>)}
          {err('terms') && <div className="au-err">필수 약관에 동의해 주세요.</div>}
          </>)}
        </section>
      )}
    </>
  );

  const patientSheet = (
    <div className="au-dim" onClick={e => { if (e.target === e.currentTarget) setSheet(''); }}>
      <div className="au-sheet" role="dialog" aria-modal="true" aria-label="진료받을 분 선택">
        <div className="au-sheet-head"><h3>진료받을 분</h3><button type="button" aria-label="닫기" onClick={() => setSheet('')}>×</button></div>
        <div className="au-sheet-body">
          {revisitGate && <div className="gd-banner info" style={{ marginBottom: 8 }}>재진 환자만 진료 가능한 병원이에요</div>}
          {lookup === 'loading' && <div className="au-loading"><span className="au-spin" />{revisitGate ? '병원 기록을 확인하고 있어요. 확인이 끝나면 선택할 수 있어요.' : '병원 기록을 확인하고 있어요. 가족 목록은 먼저 선택할 수 있어요.'}</div>}
          {revisitGate && lookup === 'fail' && (
            <div className="gd-banner basic" style={{ justifyContent: 'space-between' }}>
              <span>병원 기록을 확인하지 못해 지금은 선택할 수 없어요.</span>
              <button type="button" className="gd-btn primaryLinkText" onClick={runLookup}>다시 확인</button>
            </div>
          )}
          <h4>내 가족 {multi && <span className="opt" style={{ fontWeight: 500, color: 'var(--gray-60)' }}>{draft.length}/5명 선택</span>}</h4>
          {people.filter(p => p.family).map(p => {
            const on = multi ? draft.includes(p.id) : picked.includes(p.id);
            const matched = isMatched(p);
            const blocked = revisitGate && !matched;
            return (
              <button type="button" key={p.id} className={`au-opt ${on ? 'on' : ''}`} disabled={blocked} onClick={() => toggleDraft(p.id)}>
                <span className="au-opt-body">
                  <span className="au-opt-name">{p.name}<span className="gd-tag gray">{p.relation}</span>{matched && <span className="gd-tag green">병원 기록 있음</span>}</span>
                  <span className="au-opt-sub">{blocked && lookup === 'done' ? '이 병원 진료 기록이 없어 신청할 수 없어요' : p.birth}</span>
                </span>
                <span className={multi ? `gd-check ${on ? 'on' : ''}` : `gd-radio ${on ? 'on' : ''}`} />
              </button>
            );
          })}
          <button type="button" className="gd-btn sm secondaryOutline" style={{ width: '100%', marginTop: 8 }} onClick={() => showToast('가족 추가 화면으로 이동해요 (체험)')}>+ 가족 추가</button>
          {lookup === 'done' && CHART_ONLY.filter(c => !people.some(p => p.id === c.id && p.family)).length > 0 && (
            <>
              <h4>이 병원에 기록이 있어요</h4>
              <div className="au-help" style={{ margin: '-4px 0 8px' }}>굿닥 가족으로 등록되지 않은 분이에요. 미성년은 가족으로 연결할 수 있고, 성인은 가족 등록 없이 이번 신청에만 선택할 수 있어요.</div>
              {CHART_ONLY.filter(c => !people.some(p => p.id === c.id && p.family)).map(p => {
                const minor = isMinor(p.birth);
                const on = minor ? false : multi ? draft.includes(p.id) : picked.includes(p.id);
                return (
                  <button type="button" key={p.id} className={`au-opt ${on ? 'on' : ''}`} onClick={() => (minor ? linkChart(p) : pickChartAdult(p))}>
                    <span className="au-opt-body">
                      <span className="au-opt-name">{p.name}<span className={`gd-tag ${minor ? 'blue' : 'gray'}`}>{minor ? '미성년 · 가족 미등록' : '성인 · 가족 등록 불가'}</span></span>
                      <span className="au-opt-sub">{minor ? p.birth : `${p.birth} · 이번 신청에만 선택돼요`}</span>
                    </span>
                    {minor ? <span className="gd-btn primaryLinkText">연결</span> : <span className={multi ? `gd-check ${on ? 'on' : ''}` : `gd-radio ${on ? 'on' : ''}`} />}
                  </button>
                );
              })}
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
      <div className="au-sheet" role="dialog" aria-modal="true" aria-label="옵션 선택">
        <div className="au-sheet-head"><h3>옵션 선택</h3><button type="button" aria-label="닫기" onClick={() => { setSheet(''); setOptionEntry(false); }}>×</button></div>
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
          {optionEntry ? (
            <button type="button" className="gd-btn lg primarySolid" onClick={() => {
              if (!optionDraft.length) { showToast('옵션을 선택해 주세요.', 'error'); return; }
              const ids = ITEM.options.filter(o => optionDraft.includes(o.id)).map(o => o.id);
              setOptionEntry(false); startForm('treatment', { itemId, optionIds: ids, from: stage === 'service' ? 'service' : 'detail' });
            }}>예약</button>
          ) : (
            <button type="button" className="gd-btn lg primarySolid" disabled={!optionDraft.length} onClick={() => {
              setOptionIds(ITEM.options.filter(o => optionDraft.includes(o.id)).map(o => o.id)); clearErr('service'); setSheet('');
            }}>{optionDraft.length ? `${optionDraft.length}개 선택 완료` : '옵션을 선택해 주세요'}</button>
          )}
        </div>
      </div>
    </div>
  );

  const purposeSheet = (
    <div className="au-dim" onClick={e => { if (e.target === e.currentTarget) setSheet(''); }}>
      <div className="au-sheet" role="dialog" aria-modal="true" aria-label="내원 목적 선택">
        <div className="au-sheet-head"><h3>내원 목적</h3><button type="button" aria-label="닫기" onClick={() => setSheet('')}>×</button></div>
        <div className="au-sheet-body" style={{ paddingBottom: 28 }}>
          {service !== 'receipt' && <div className="au-help" style={{ margin: '0 0 12px' }}>{purposeFromDate ? <><b>예약 희망일을 고르기 전에 내원 목적을 먼저 선택해 주세요.</b><br /></> : ''}내원 목적에 따라 예약할 수 있는 날짜가 달라요.</div>}
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
          <Calendar value={dateDraft} enabled={d => isAvailable(d, service, roomId, purpose) && !soldOut.dates.includes(`${roomId} ${key(d)}`)} onPick={d => { setDateDraft(d); setTimeDraft(''); setTimeout(() => { const el = timesRef.current; const box = el?.closest('.au-sheet-body') as HTMLElement | null; if (el && box) box.scrollTo({ top: el.getBoundingClientRect().top - box.getBoundingClientRect().top + box.scrollTop - 8 }); }, 60); }} />
          {dateDraft ? (
            <div className="au-times" ref={timesRef}>
              {(['오전', '오후'] as const).map(g => {
                const list = slotsFor(dateDraft).filter(s => (g === '오전') === s.am);
                return (
                  <div key={g}>
                    <h4>{g}</h4>
                    <div className="au-chips">
                      {list.map(s => (
                        <button type="button" key={s.t} disabled={s.disabled || soldOut.slots.includes(`${roomId} ${key(dateDraft)} ${s.t}`)} className={`au-chip ${timeDraft === s.t ? 'on' : ''}`} onClick={() => setTimeDraft(s.t)}>{s.t}</button>
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
          {rooms.filter(r => service !== 'appt' || r.apptAvailable).map(r => (
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
          <h1>진료 신청<br />병원 상세 → 통합 신청서</h1>
          <p className="lead">병원 상세·진료실 선택은 현재 앱(production)과 같게, 신청서는 통합안입니다. 가상 데이터이며 실제로 신청되지 않습니다. 기준일 2026-09-29(화) 14:00.</p>
          <div className="au-ctl">
            <div className="au-ctl-head"><strong>시작 화면</strong><span>어디서부터 체험할지</span></div>
            <div className="au-ctl-group"><span>병원 상세부터</span><button type="button" className="gd-btn sm secondaryOutline" style={{ width: '100%' }} onClick={restartAll}>처음부터 시작</button></div>
            <div className="au-ctl-group"><span>신청서 바로 열기</span><Seg value={stage === 'form' ? service : ('' as any)} onChange={v => startForm(v, { from: 'direct' })} items={[['appt', '420 예약'], ['receipt', '420 미리접수'], ['treatment', '진료항목']]} /></div>
          </div>
          <div className="au-ctl">
            <div className="au-ctl-head"><strong>병원 서비스 상태</strong><span>병원 상세 하단 버튼·진입 경로에 영향</span></div>
            <div className="au-ctl-group"><span>하단 버튼 상태</span>
              <select className="au-select" value={ctaScenario} onChange={e => setCtaScenario(e.target.value as CtaScenario)}>
                <option value="both">미리접수 + 예약</option><option value="receipt">미리접수만 (진료항목 사용 시 예약도 노출)</option><option value="appt">예약만</option>
                <option value="receiptLater">미리접수 · 다음 시간부터 가능</option><option value="receiptClosed">미리접수 · 오늘 마감</option>
                <option value="apptClosed">예약 · 슬롯 마감</option><option value="bridgeOff">브릿지 미연결</option><option value="none">미리접수·예약 모두 미운영 (진료항목 미사용 시 전화문의)</option><option value="tablet">태블릿 접수만 (전화문의)</option>
              </select></div>
            <div className="au-ctl-group"><span>진료항목 예약</span><Seg value={tiOn ? 'on' : 'off'} onChange={v => setTiOn(v === 'on')} items={[['on', '사용'], ['off', '미사용']]} /></div>
          </div>
          <div className="au-ctl">
            <div className="au-ctl-head"><strong>병원 운영 설정</strong><span>병원이 커넥트에서 켜고 끄는 값 · 신청서 구성에 영향</span></div>
            <div className="au-ctl-group"><span>주소 받기</span><Seg value={addrMode} onChange={v => { setAddrMode(v); clearErr('addr'); }} items={[['required', '필수'], ['optional', '선택'], ['none', '미사용']]} /></div>
            <div className="au-ctl-group"><span>약관</span><Seg value={termsMode} onChange={v => { setTermsMode(v); setAgree({}); clearErr('terms'); }} items={[['both', '필수+선택'], ['required', '필수만'], ['none', '없음']]} /></div>
            {isRoom && <div className="au-ctl-group"><span>1진료실 · 내원 목적</span><Seg value={purposeSetting} onChange={v => { setPurposeSetting(v); if (roomId === 'r1') { setPurpose(''); setDate(null); setTime(''); clearErr('service'); if (sheet === 'purpose' || sheet === 'date') setSheet(''); } }} items={[['on', '사용 (9개)'], ['off', '미사용']]} /></div>}
            {isRoom && <div className="au-ctl-group"><span>접수 대상</span><Seg value={revisitOnly ? 'revisit' : 'all'} onChange={v => { setRevisitOnly(v === 'revisit'); setPicked([]); setDraft([]); clearErr('patient'); }} items={[['all', '초진·재진 모두'], ['revisit', '재진만']]} /></div>}
          </div>
          <div className="au-ctl">
            <div className="au-ctl-head"><strong>환자 정보</strong><span>계정·병원 기록에 따라 달라지는 값</span></div>
            <div className="au-ctl-group"><span>등록된 주소</span><Seg value={savedAddr} onChange={setSavedAddr} items={[['yes', '있음'], ['no', '없음']]} /></div>
            {isRoom && <div className="au-ctl-group"><span>병원 기록 조회</span><Seg value={lookupMode} onChange={v => { setLookupMode(v); lookupModeRef.current = v; if (sheet === 'patient') runLookup(); else { clearTimeout(lookupTimer.current); setLookup('idle'); if (revisitGate) { setPicked([]); setDraft([]); } } }} items={[['ok', '성공'], ['fail', '실패']]} /></div>}
            {isRoom && <div className="au-ctl-group"><span>이 병원 약관 동의 이력</span><Seg value={consentHistory} onChange={setConsentHistory} items={[['none', '없음'], ['agreed', '이전에 동의함']]} />
              <div className="au-ctl-note" style={{ margin: '4px 0 0' }}>병원 기록이 확인된 분(김하늘·김봄·연결한 가족)에게만 적용돼요.</div></div>}
          </div>
          <div className="au-ctl">
            <div className="au-ctl-head"><strong>신청 결과</strong><span>서버 응답 가정 · 제출 후 결과 화면</span></div>
            <div className="au-ctl-group"><span>신청 결과 ({service === 'receipt' ? '미리접수' : service === 'appt' ? '420 예약' : '진료항목'})</span>
              {service === 'receipt' ? (
                <><Seg value={rcResult} onChange={setRcResult} items={[['success', '전원 성공'], ['partial', '일부 실패'], ['fail', '전원 실패']]} />
                <div className="au-ctl-note" style={{ margin: '4px 0 0' }}>일부 실패는 2명 이상 선택했을 때 섞여서 보여요.</div>
                <div style={{ marginTop: 6 }}><Seg value={rcForm} onChange={setRcForm} items={[['sheet', '바텀시트 (제안)'], ['page', '전체 페이지 (현재 앱)']]} /></div></>
              ) : service === 'appt' ? (
                <select className="au-select" value={apptResult} onChange={e => setApptResult(e.target.value as ApptResult)}>
                  <option value="success">예약 확정</option><option value="successRequest">예약 요청 (병원 확인 대기)</option>
                  <option value="notExistedSlots">이미 마감된 시간</option><option value="closedToday">선택 날짜 전체 마감</option><option value="failure">기타 실패</option>
                </select>
              ) : (
                <select className="au-select" value={tiResult} onChange={e => setTiResult(e.target.value as TiResult)}>
                  <option value="success">예약 확정</option><option value="successRequest">예약 요청 (병원 확인 대기)</option>
                  <option value="notExistedSlots">선택 시간 예약 불가</option><option value="notExistedItem">진료항목 제공 중단</option><option value="failure">기타 실패</option>
                </select>
              )}</div>
          </div>
          <p className="au-ctl-note">서비스를 바꾸면 신청서가 초기화됩니다. 1진료실은 내원 목적을 사용/미사용으로 바꿀 수 있습니다(영유아검진은 화·목만, 미사용이면 월~토). 2진료실은 항상 목적이 없습니다(평일만). 병원 운영 상태(진료중·휴진)와 리뷰는 신청에 영향이 없어 조건에서 뺐습니다.</p>
        </aside>

        <div className="au-phone">
          {/* 앱 스택처럼 이전 화면 상태(스크롤·탭·토글)를 유지하려고 언마운트하지 않고 숨긴다 */}
          <div className="au-stage" style={{ display: stage === 'detail' ? 'flex' : 'none' }}>
            <HospitalDetail key={detailKey} active={stage === 'detail'} cta={ctaScenario} tiOn={tiOn} op={opState} review={reviewState} liked={liked} onLike={setLiked} items={ITEMS as any} rooms={ROOMS as any}
              onAppt={() => { setServiceKey(k => k + 1); setStage('service'); }} onReceipt={() => startForm('receipt', { from: 'detail' })} onItem={openItemFromEntry} onToast={m => showToast(m)} />
          </div>
          <div className="au-stage" style={{ display: stage === 'service' ? 'flex' : 'none' }}>
            <ServiceSelect key={serviceKey} mode={serviceMode} rooms={ROOMS as any} items={ITEMS as any}
              onBack={() => setStage('detail')} onRoom={id => startForm('appt', { roomId: id, from: 'service' })} onItem={openItemFromEntry} />
          </div>
          {stage === 'form' && done && service === 'receipt' && (
            <div className="au-stage" style={{ display: 'flex' }}>
              <ReceiptComplete patients={receiptResults} receiptedAt="2026. 09. 29 (화) 14:05" roomName={room.name} hospitalName="굿닥가족의원"
                onHome={() => goHistory('홈으로 이동해요 (생략)')} onHistory={t => goHistory(`진료내역 · ${t} 탭으로 이동해요 (생략)`)} onRetry={() => { setDone(false); }} />
            </div>
          )}
          {stage === 'form' && !(done && service === 'receipt') && (<>
          <div className="au-topbar">
            <button type="button" aria-label="뒤로" onClick={() => (done ? setDone(false) : setStage(formFrom === 'service' ? 'service' : 'detail'))}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            <strong>{service === 'receipt' ? '미리접수' : '예약 신청'}</strong>
          </div>
          <div className="au-scroll" ref={scrollRef} style={done ? { paddingBottom: 0 } : undefined}>
            {sections}
          </div>
          {!done && (
            <div className="au-cta">
              <button type="button" className="gd-btn lg primarySolid" onClick={submit}>{ctaLabel}</button>
            </div>
          )}
          </>)}
          {sheet === 'patient' && patientSheet}
          {sheet === 'room' && roomSheet}
          {sheet === 'date' && dateSheet}
          {sheet === 'purpose' && purposeSheet}
          {sheet === 'option' && optionSheet}
          {sheet === 'result' && service === 'receipt' && (
            <ReceiptResultSheet patients={receiptResults} onHistory={t => goHistory(`진료내역 · ${t} 탭으로 이동해요 (생략)`)} onRetry={() => setSheet('')} />
          )}
          {sheet === 'result' && service !== 'receipt' && (
            <RequestResultSheet kind={service === 'treatment' ? 'treatment' : 'appt'} state={resultLive as any} dateText={resultDate}
              onHistory={() => goHistory(service === 'appt' ? '진료내역 · 진행중 탭 → 예약 상세로 이동해요 (생략)' : '진료내역 · 진행중 탭 → 진료항목 예약 상세로 이동해요 (생략)')}
              onStop={() => { setSheet(''); setStage(service === 'appt' ? 'detail' : formFrom === 'service' ? 'service' : 'detail'); }}
              onOther={afterResultOther} onConfirm={afterResultOther} onItemGone={() => { setSheet(''); setStage('detail'); }} />
          )}
          {roomConfirm && <div className="au-alert-scope"><AlertView a={{ title: '진료실을 바꿀까요?', body: `진료실을 바꾸면 선택한 ${purpose ? '내원 목적과 ' : ''}예약 일정이 초기화돼요.`, buttons: [{ label: '취소', style: 'tonal-gray', onClick: () => setRoomConfirm(null) }, { label: '바꾸기', style: 'filled', onClick: () => { applyRoom(roomConfirm); setRoomConfirm(null); } }] }} /></div>}
          {toast && <div className={`gd-toast ${toastKind}`} style={{ bottom: toastBottom }} role="status">{toastKind !== 'information' && <span className="gd-toast-ic" aria-hidden="true" />}<span className="gd-toast-msg">{toast}</span></div>}
        </div>
      </main>
    </div>
  );
}
