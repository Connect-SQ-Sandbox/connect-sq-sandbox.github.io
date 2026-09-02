import React, { useEffect, useMemo, useState } from 'react';
import { ChangeDrawer, type PolicyChange, type PrototypeView } from '../../../components/prototype/ChangeDrawer';
import { POLICY_SOURCES, ADMIN_NONPAY_AUG_CHANGES } from '../../../content/change-manifests/admin-nonpay-aug';

/**
 * ┌─ 프로토타입 컨텍스트 ───────────────────────────────────
 * 이름     : ti-category-c — 진료항목 분류 필드 분리(C안) + 카카오 연동
 * 상태     : 현행(active)   버전: v6   최종수정: 2026-09-01
 * PRD      : 없음(선행 탐색). 근거 = Notion "진료항목 분류 체계 현황과 개선 방향"
 * 배포URL  : (미배포) 예정 https://connect-sq-sandbox.github.io/out/ti-category-c.html
 * 관련 CSS : connectRegister.css + connectAdminNonpayAug.css + tiCategoryC.css(tc-*)
 * 기술제약 : react-only · plain CSS · mock · 네트워크 0
 *
 * 베이스   : **admin-nonpay-aug**(샌드박스 배포본)을 복제해 분류 관련만 추가.
 *            카카오 노출 설정 카드 · 발문 빌더 · 예약 신청 내역 · 진료 예약 설정 · 진료시간 무수정.
 *
 * ── C안(분류 필드 분리) 스펙 ────────────────────────────
 * 왜 : 지금은 "진료항목명" 하나가 이름과 분류를 동시에 결정한다. 자동완성을 고르면 이름까지
 *      표준 이름이 되고, 직접 입력하면 분류가 통째로 사라진다(master1/2/3 전부 null).
 *      실측(2026-09-01) 등록 1,509건 중 657건(43.5%)이 분류 없이 저장돼 환자 검색 인덱스에
 *      0 기여. 그중 194건(29.5%)은 마스터의 중분류·대분류명을 그대로 타이핑한 것 —
 *      마스터에 있는데 자동완성이 소분류(leaf)만 고르게 해서 도달하지 못한 물량.
 *
 * 1. 진료항목명(자유 입력) / 분류(대분류 › 중분류)를 **별도 필드로 분리**.
 * 2. 자동완성에서 굿닥 표준 진료항목을 고르면 이름과 분류가 **함께** 채워진다.
 *    이름을 직접 입력하면 분류는 비어 있고, 분류 필드에서 따로 고른다.
 * 3. 분류 선택 = **좌우 2단**(기본) / 단계형. 모달 헤더 세그먼트로 전환 비교.
 *    좌우 2단은 진료항목 목록 화면의 좌 카테고리 / 우 항목 구조와 같은 결 — 병원이 이미 익숙하다.
 *    소분류는 어느 쪽에서도 고르지 않는다(부분 매핑).
 *    → 저장 형태: 대분류 + 중분류는 값, 소분류는 없음, 이름은 병원 입력값.
 *    트리에는 분류명 검색(대·중분류 동시 매칭 + 자동 펼침)과 소분류 예시 힌트를 붙였다 —
 *    "이 중분류에 뭐가 들어가는지"를 모르면 병원이 고를 수 없기 때문.
 * 4. 이름에 분류 명칭이 들어 있으면 **역매칭 추천**을 원클릭으로 제안('이마보톡스' ⊃ '보톡스').
 * 5. 분류가 없으면 검색 노출 손실을 구체적으로 경고. 좌측 '직접 입력 항목' 그룹에도 배너.
 * 6. 분류는 **필수 아님**(`REQUIRE_CATEGORY = false`). 미분류는 저장을 허용하고 경고만 노출한다.
 *    고를 분류가 없을 때 강제하면 미분류가 오분류로 대체될 뿐이다. 정책을 뒤집을 땐 상수 한 줄.
 *
 * 핵심 결정 (why):
 *   [유지·자체] 소분류는 선택 대상에서 제외. 병원이 파는 단위가 중분류인 경우가 많다
 *              (예: 예방접종 › 대상포진 백신 › 조스타박스 — 병원은 '대상포진 백신'을 판다).
 *              소분류까지 강제하면 지금과 같은 이탈이 재현된다.
 *   [유지·자체] '분류 없이 저장'을 막지 않는다(기본 OFF). 고를 게 없을 때 강제하면
 *              미분류가 오분류로 대체될 뿐이고, 그건 되돌리기가 더 어렵다.
 *   [실데이터] TAXONOMY = 2026-08-14 마스터 CSV 전량(대 15 / 중 69 / 소 187) 그대로 이식.
 *              시드의 cat1/cat2 도 실제 마스터 명칭으로 교체했다.
 *   [상속]     admin-nonpay-aug 의 결정(카카오 토글 워딩·노출 캐스케이드·규격 검증·발문
 *              중복 차단 등)은 그대로 유지. 이 프로토타입은 분류 축만 다룬다.
 *
 * 보류·TODO:
 *   [보류] 분류 필수 여부 최종 정책(기존 항목 유예 기간 포함).
 *   [보류] 카카오 상품에 분류를 함께 전달할지 — 카카오 상품 API에 카테고리 필드 없음(현재 미전달).
 *   [보류] 기존 미분류 재고를 병원이 정리하도록 유도하는 알림·일괄 정리 화면.
 *
 * 변경 이력:
 *   v6 2026-09-01 — 폼 상단 [분류 필수 검증] 프로토타입 스위치 제거(세화님). 정책은 모듈 상수
 *                   REQUIRE_CATEGORY(false) 로 고정 — 미분류 저장 허용 + 경고.
 *   v5 2026-09-01 — 세로 아코디언 트리 모드 제거(세화님). 좌우 2단 / 단계형 두 형태만 남김.
 *                   아코디언은 펼칠 때 아래 대분류가 밀려 화면이 흔들리는 문제가 있었고,
 *                   좌우 2단이 같은 정보를 더 안정적으로 보여준다.
 *   v4 2026-09-01 — ① 분류 선택 모달을 **고정 크기**(680×620, 뷰포트 초과 시 축소)로. 모드·목록
 *                      길이에 따라 모달이 늘었다 줄었다 하던 문제 해결. 남는 여백은 하단 바로 마감
 *                      (현재 선택 표시 + 닫기). ② **신규 등록 시 분류가 비어 있게** 수정 —
 *                      좌측에서 보던 카테고리를 그대로 물려줘서 고르지도 않은 분류가 박혀 있었다.
 *                      분류 없이 저장하면 목록의 '직접 입력 항목' 그룹으로 정규화.
 *   v3 2026-09-01 — 분류 선택 모달에 **좌우 2단** 모드 추가(기본). 좌측 대분류 15개 고정 목록 +
 *                   우측 해당 중분류 목록(소분류 예시 힌트 포함). 검색은 좌우 동시 필터.
 *                   모달 재진입 시 현재 분류의 대분류가 좌측 활성 + 우측 해당 항목 '선택됨'.
 *                   세그먼트는 [좌우 | 트리 | 단계] 3형태 비교.
 *   v2 2026-09-01 — 분류 선택 모달에 **2뎁스 트리** 모드 추가(기본). 헤더 세그먼트로 단계형과 전환.
 *                   트리 = 대분류 아코디언 + 중분류 들여쓰기 + 소분류 예시 힌트 + 분류명 검색
 *                   (검색 시 걸린 대분류 자동 펼침). 모달 진입 시 현재 분류의 대분류는 펼쳐 둔다.
 *   v1 2026-09-01 — admin-nonpay-aug 복제 + C안(분류 필드 분리) 신설.
 * └──────────────────────────────────────────────────────
 */

/* ============================ 진료항목 타입 & mock ============================ */
type PriceType = 'fixed' | 'discount' | 'consult';
type Price = { id: number; title: string; content: string; type: PriceType; amount: string; original: string; sale: string };
type SyncState = 'NOT_LINKED' | 'PENDING' | 'SYNCED' | 'FAILED' | 'ON_HOLD' | 'UPDATE_REQUIRED';
type SyncObject = 'product' | 'item' | 'price' | 'schedule';
type SyncInfo = Record<SyncObject, SyncState> & { lastAt: string; error?: string; attempts: number };
// 카카오 예약 부가정보 3종: 주관식(infos) / 단수 선택형(radioInfos) / 복수 선택형(selectInfos)
type QType = 'text' | 'radio' | 'select';
type Question = { id: number; type: QType; name: string; optional: boolean; description: string; options: string[] };
type KakaoImage = { id: number; url: string; description: string; fileName?: string };
type KakaoImageKey = 'productImages' | 'descriptionImages';
type KakaoExtra = {
  initialized: boolean;
  displayName: string;
  description: string;
  productImages: KakaoImage[];
  squareImageUrl: string;
  squareImageFileName: string;
  descriptionImages: KakaoImage[];
  questions: Question[];
  howto: string;
  notice: string;
  cancelNotice: string;
};
type Item = {
  id: number;
  cat1: string; cat2: string;
  name: string; alias: string; intro: string; detail: string;
  keywords: string[]; hasImage: boolean; detailImages: number; // detail=상세 소개, detailImages=상세 소개 사진 개수
  prices: Price[];
  gdVisible: boolean;
  kakaoOn: boolean;
  kExtra: KakaoExtra;
  sync: SyncInfo;
  updatedAt: string;
  activeReservations: number;
};

let UID = 1000;
const emptyExtra = (): KakaoExtra => ({ initialized: false, displayName: '', description: '', productImages: [], squareImageUrl: '', squareImageFileName: '', descriptionImages: [], questions: [], howto: '', notice: '', cancelNotice: '' });
const makeSync = (state: SyncState, error?: string): SyncInfo => ({ product: state, item: state, price: state, schedule: state, lastAt: state === 'NOT_LINKED' ? '-' : '2026.07.15 10:42', error, attempts: 0 });
const won = (s: string) => (s ? Number(s).toLocaleString('ko-KR') + '원' : '0원');

/* 답변 항목(선택지) 중복 검증
 * 카카오는 환자가 고른 답변을 문구(value) 그대로 저장·전달한다. 같은 문구가 두 개면
 * 환자 화면에서 두 항목을 구분할 수 없고(중복 선택처럼 보임), 예약 상세의 답변으로도
 * 어느 항목을 고른 것인지 알 수 없다 → 입력 단계에서 막는다.
 * 판정: 같은 질문 안에서 / 앞뒤 공백 제거 + 연속 공백 1칸 + 영문 대소문자 무시(= 눈에 같아 보이면 중복). */
const DUP_OPTION_MSG = '이미 입력한 답변이에요. 다른 답변을 입력해 주세요.';
const DUP_OPTION_TOAST = '중복된 답변 항목이 있어요. 문구를 다르게 입력해 주세요.';
const dupOptKey = (questionId: number, index: number) => `q-${questionId}-opt-dup-${index}`;
const optionKey = (value: string) => value.trim().replace(/\s+/g, ' ').toLowerCase();
/** 중복 항목의 index — 먼저 입력한 항목은 통과, 뒤에 입력한 같은 문구만 오류. 빈 항목은 별도 검증. */
const duplicateOptionIndexes = (options: string[]): number[] => {
  const firstSeen = new Set<string>();
  const dups: number[] = [];
  options.forEach((option, index) => {
    const key = optionKey(option);
    if (!key) return;
    if (firstSeen.has(key)) dups.push(index);
    else firstSeen.add(key);
  });
  return dups;
};
const kakaoPriceDescription = (p: Price) => {
  const amount = p.type === 'consult' ? '상담 후 결정' : p.type === 'discount' ? won(p.sale) : won(p.amount);
  const amountLabel = `[${amount}]`;
  return [amountLabel, p.content.trim()].filter(Boolean).join(' - ');
};
const syncSummary = (sync: SyncInfo): SyncState => {
  const states = [sync.product, sync.item, sync.price, sync.schedule];
  if (states.includes('FAILED')) return 'FAILED';
  if (states.includes('UPDATE_REQUIRED')) return 'UPDATE_REQUIRED';
  if (states.includes('PENDING')) return 'PENDING';
  if (states.includes('ON_HOLD')) return 'ON_HOLD';
  if (states.every((state) => state === 'SYNCED')) return 'SYNCED';
  return 'NOT_LINKED';
};
const PRICE_TYPES: { value: PriceType; label: string }[] = [
  { value: 'fixed', label: '고정 가격' }, { value: 'discount', label: '할인 가격' }, { value: 'consult', label: '상담 후 결정' }
];

/* =========================================================================
 * 굿닥 표준 진료항목 (분류 트리) — C안 신설. 2026-08-14 마스터 전량.
 * ======================================================================= */

interface Cat3 { id: number; name: string }
interface Cat2Node { id: number; name: string; items: Cat3[] }
interface Cat1Node { id: number; name: string; groups: Cat2Node[] }

/** 굿닥 표준 진료항목 — 2026-08-14 실제 마스터 전량(대 15 / 중 69 / 소 187) */
const TAXONOMY: Cat1Node[] = [
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

/** 자동완성 후보 = 소분류 1건 + 상위 경로 */
interface Suggestion { c1: string; c2: string; c3: string }

const FLAT: Suggestion[] = TAXONOMY.flatMap((a) =>
  a.groups.flatMap((b) => b.items.map((c) => ({ c1: a.name, c2: b.name, c3: c.name })))
);

const NORM = (v: string) => v.replace(/[\s·/()]/g, '').toLowerCase();

type MatchLevel = 'name' | 'group' | 'category';
const LEVEL_RANK: Record<MatchLevel, number> = { name: 0, group: 1, category: 2 };

function matchLevel(s: Suggestion, q: string): MatchLevel | null {
  if (!q) return null;
  if (s.c3.includes(q)) return 'name';
  if (s.c2.includes(q)) return 'group';
  if (s.c1.includes(q)) return 'category';
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
 * 역매칭 추천 — 입력값이 분류 명칭을 포함하는 방향. 현재 서버 API 에는 없는 로직.
 * '이마보톡스' ⊃ '보톡스' → 피부·미용 › 보톡스. 긴 명칭 우선, 최대 3개.
 */
function suggestCategories(raw: string): { c1: string; c2: string; matched: string }[] {
  const q = NORM(raw);
  if (q.length < 2) return [];
  const found: { c1: string; c2: string; matched: string }[] = [];
  TAXONOMY.forEach((a) =>
    a.groups.forEach((b) => {
      const k = NORM(b.name);
      if (k.length >= 2 && q.includes(k)) found.push({ c1: a.name, c2: b.name, matched: b.name });
    })
  );
  return found.sort((x, y) => NORM(y.matched).length - NORM(x.matched).length).slice(0, 3);
}

/**
 * 분류 필수 여부. 현재 정책 = **필수 아님**.
 * 고를 분류가 없을 때 저장을 막으면 미분류가 오분류로 대체되고, 그건 되돌리기가 더 어렵다.
 * 미분류는 저장을 허용하고 검색 노출 손실을 경고로만 알린다.
 * 신규 등록만 필수로 돌리려면 이 값을 true 로 바꾼다(기존 항목 유예는 별도 처리 필요).
 */
const REQUIRE_CATEGORY = false;

/** 받침에 따라 '으로/로'. 낱말을 넘겨야 한다(따옴표 포함 문자열 금지). */
function roSuffix(word: string): string {
  const last = word.trim().slice(-1);
  const code = last.charCodeAt(0) - 0xac00;
  if (code < 0 || code > 11171) return '로';
  return code % 28 === 0 ? '로' : '으로';
}

const CAT_ORDER = ['피부·미용', '성형', '수액', '직접 입력 항목'];
const CUSTOM_CAT = '직접 입력 항목';

const mk = (p: Partial<Item> & { id: number; name: string; cat1: string; cat2: string }): Item => {
  const item: Item = {
    alias: '', intro: '', detail: '', keywords: [], hasImage: false, detailImages: 0,
    prices: [{ id: UID++, title: '기본', content: '', type: 'fixed', amount: '', original: '', sale: '' }],
    gdVisible: true, kakaoOn: false, kExtra: emptyExtra(), sync: makeSync('NOT_LINKED'), updatedAt: '2026.07.14', activeReservations: 0,
    ...p
  };
  if (!p.sync) item.sync = makeSync(item.kakaoOn ? 'SYNCED' : 'NOT_LINKED');
  return item;
};

const INITIAL: Item[] = [
  mk({ id: 1, cat1: '피부·미용', cat2: '스킨부스터', name: '리쥬란 힐러', alias: '', intro: '피부 재생 스킨부스터', detail: '리쥬란 힐러는 연어에서 추출한 PDRN 성분으로 손상된 피부를 근본부터 재생시키는 스킨부스터예요.\n\n· 잔주름·모공·탄력 개선\n· 시술 후 즉시 일상생활 가능\n· 3~4주 간격 3회 권장', keywords: ['리쥬란', '스킨부스터'], hasImage: true, detailImages: 3,
    prices: [{ id: UID++, title: '1회', content: '', type: 'fixed', amount: '250000', original: '', sale: '' }, { id: UID++, title: '3회 패키지 (사후관리 포함)', content: '재생관리 포함', type: 'discount', amount: '', original: '750000', sale: '600000' }], gdVisible: true, kakaoOn: false, activeReservations: 1 }),
  mk({ id: 2, cat1: '피부·미용', cat2: '스킨부스터', name: '물광주사', intro: '수분 광채 물광주사', keywords: ['물광주사'], hasImage: true,
    prices: [{ id: UID++, title: '1회', content: '', type: 'fixed', amount: '120000', original: '', sale: '' }], gdVisible: true, kakaoOn: true, activeReservations: 1 }),
  mk({ id: 3, cat1: '피부·미용', cat2: '주름·모공·탄력', name: '실 리프팅', intro: '', keywords: [], hasImage: false,
    prices: [{ id: UID++, title: '상담 후 결정', content: '', type: 'consult', amount: '', original: '', sale: '' }], gdVisible: false, kakaoOn: false }),
  mk({ id: 4, cat1: '피부·미용', cat2: '주름·모공·탄력', name: '슈링크 유니버스', intro: '집중 리프팅', keywords: ['슈링크'], hasImage: true,
    prices: [{ id: UID++, title: '300샷', content: '', type: 'fixed', amount: '300000', original: '', sale: '' }], gdVisible: true, kakaoOn: false }),
  mk({ id: 5, cat1: '피부·미용', cat2: '기미·색소·미백', name: '레이저 토닝', intro: '색소·톤 개선 레이저', detail: '레이저 토닝은 미세한 저출력 레이저를 반복 조사해 기미·잡티·색소 침착을 단계적으로 옅게 만드는 시술이에요.\n\n· 다운타임 거의 없음\n· 2주 간격 꾸준한 관리 권장', keywords: ['레이저토닝'], hasImage: true, detailImages: 2,
    prices: [{ id: UID++, title: '1회', content: '', type: 'fixed', amount: '80000', original: '', sale: '' }, { id: UID++, title: '5회', content: '', type: 'fixed', amount: '350000', original: '', sale: '' }], kExtra: { initialized: true, displayName: '레이저 토닝', description: '색소·톤 개선 레이저', productImages: [{ id: 9001, url: '', description: '레이저 토닝 대표 이미지', fileName: 'laser-toning-main.jpg' }], squareImageUrl: '', squareImageFileName: 'laser-toning-square.jpg', descriptionImages: [{ id: 9002, url: '', description: '시술 전후 안내 이미지', fileName: 'laser-toning-detail.jpg' }], questions: [
      { id: 9101, type: 'text', name: '주로 신경 쓰이는 부위가 어디인가요?', optional: false, description: '', options: [] },
      { id: 9102, type: 'radio', name: '레이저 시술 경험이 있으신가요?', optional: true, description: '', options: ['처음이에요', '1~2회', '3회 이상'] },
      { id: 9103, type: 'select', name: '함께 상담받고 싶은 항목을 선택해 주세요.', optional: true, description: '복수 선택할 수 있어요.', options: ['색소·잡티', '모공', '홍조', '피부결'] }
    ], howto: '예약 시간 10분 전까지 방문해 주세요.', notice: '시술 전 복용 중인 약이 있다면 알려주세요.', cancelNotice: '예약 변경·취소는 하루 전까지 병원으로 연락해 주세요.' }, gdVisible: true, kakaoOn: true, activeReservations: 1 }),
  mk({ id: 6, cat1: '성형', cat2: '체형·지방', name: '얼굴지방흡입', alias: '얼굴 지방흡입', intro: '갸름한 얼굴라인을 위한 지방흡입', keywords: ['지방흡입', '얼굴윤곽'], hasImage: true,
    prices: [{ id: UID++, title: '기본', content: '', type: 'fixed', amount: '3500000', original: '', sale: '' }], gdVisible: true, kakaoOn: true }),
  mk({ id: 7, cat1: '피부·미용', cat2: '보톡스', name: '보톡스 (이마)', intro: '이마 주름 개선', keywords: ['보톡스'], hasImage: false,
    prices: [{ id: UID++, title: '이마', content: '', type: 'discount', amount: '', original: '150000', sale: '99000' }], gdVisible: true, kakaoOn: true, activeReservations: 1,
    sync: { product: 'SYNCED', item: 'SYNCED', price: 'FAILED', schedule: 'ON_HOLD', lastAt: '2026.07.15 10:31', error: '가격 안내 정보를 카카오에 반영하지 못했어요.', attempts: 2 } }),
  mk({ id: 8, cat1: CUSTOM_CAT, cat2: '', name: '우리병원 시그니처 관리', intro: '원장 직접 시술', keywords: [], hasImage: false,
    prices: [{ id: UID++, title: '1회', content: '', type: 'fixed', amount: '150000', original: '', sale: '' }], gdVisible: true, kakaoOn: false })
];

/* ============================ 입력 제한 값 (PO 최종 협의용) ============================
 * 태그 기준:
 *   [API]     카카오 상품 API v1.2.2 명시값 → 고정(변경 불가)
 *   [임의]     API 미명시 → 프로토타입 권장값 → PO 협의로 확정 필요
 *   [서비스]   굿닥 실서비스 값(추정) → 실코드 대조 후 확정 필요
 * ※ PO 협의 후에는 이 블록의 값만 바꾸면 화면 전체(입력 maxLength·카운터·안내문구)에 일괄 반영됩니다.
 * ------------------------------------------------------------------------------------ */

// --- [API] 카카오 상품 API 명시값 (고정) ---
const K_PRODUCT_NAME_MAX = 50; // [내부 규격] Product name
const K_PRODUCT_DESC_MAX = 1000; // [내부 규격] Product description
const K_Q_NAME_MAX = 120;     // [API] 질문(부가정보 name) — required, 최대 120자
const K_Q_MAX = 10;           // [확정·정책] 예약 시 받을 정보 질문 총 개수 — 최대 10개
const K_INFO_MAX = 2000;      // [API] 이용 방법(information) — 최대 2,000자
const K_NOTICE_MAX = 100;     // 기존 카카오 전용 유의사항(notice) 입력 제한
const K_CANCEL_MAX = 100;     // [API] 취소 유의사항(cancelNotice) — 최대 100자
const K_IMAGE_MAX = 50;       // [내부 규격] 대표 이미지·상세 이미지 각각 최대 50개
const PRICE_DESC_MAX = 100;   // [API] 가격 설명(Price description) — 최대 100자
const PRICE_OPTION_MAX = 50;  // [확정·PRD] 활성 가격 옵션 — 최대 50개

// --- [임의] API 미명시 → PO 협의 대상 ---
const K_Q_OPT_MIN = 2;        // [확정·정책] 선택형 선택지 최소 개수
const K_Q_OPT_MAX = 10;       // [확정·정책] 선택형 선택지 최대 개수
const K_Q_DESC_MAX = 200;     // [확정·정책] 선택형 질문 설명(description) 글자
const K_Q_OPT_LEN_MAX = 50;   // [확정·정책] 선택지 항목(value[]) 글자

// --- [서비스] 굿닥 실서비스 값 추정 → 실코드 대조 필요 ---
const PRICE_NAME_MAX = 50;    // [서비스/불일치] 가격명 — 현재 50자. 단, 카카오 API '가격 이름'은 25자 → 협의 필요
const ALIAS_MAX = 50;         // [서비스] 진료항목 노출명 — 현재 50자
const INTRO_MAX = 50;         // [서비스] 한 줄 소개 — 현재 50자
const KEYWORD_MAX = 20;       // [서비스] 진료항목 키워드 개수 — 현재 20개
const DETAIL_DESC_MAX = 2000; // [서비스/불일치] 상세 소개 — 현재 2,000자. 실제 코드 MAX_LENGTH는 5,000 → 협의 필요
const DETAIL_IMG_MAX = 5;     // [서비스] 상세 소개 사진 — 현재 5개 (실코드 동일)
const priceDisplay = (it: Item) => {
  const p0 = it.prices[0];
  const base = p0.type === 'consult' ? '상담 후 결정' : p0.type === 'discount' ? won(p0.sale) : won(p0.amount);
  return it.prices.length > 1 ? `${base}~` : base;
};

/* ============================ 예약 신청 내역 — staging 현행화 ============================
 * 출처: receipt-web@origin/staging(c9252443) pages/non-payment-reservations/treatment-item-appt
 *   constants.ts / components/channel/channel.ts / TreatmentItemApptTable/utils.ts
 * 상수·판정 로직은 실제 코드를 그대로 옮기고, 렌더만 프로토타입 제약(react-only·plain CSS)에 맞춰 재구현한다.
 * ※ 실제 코드가 바뀌면 이 블록을 먼저 맞춘다. 값을 임의로 바꾸지 않는다.
 * ------------------------------------------------------------------------------------ */

/** [실제] 예약이 실제로 유입된 채널. 과거 예약값이며 상품 현재 상태로 재계산하지 않는다. */
type Channel = 'goodoc' | 'kakao';
const CHANNEL_LABEL: Record<Channel, string> = { goodoc: '굿닥', kakao: '카카오톡 예약하기' };
/** [실제] deviceType(1:모바일, 2:카카오, 3:네이버) → 채널. 2만 카카오, 그 외 굿닥. */
const DEVICE_TYPE_KAKAO = 2;
const deviceTypeToChannel = (deviceType?: number): Channel =>
  deviceType === DEVICE_TYPE_KAKAO ? 'kakao' : 'goodoc';

/** [실제] 서버 정의 예약 상태 enum (TreatmentItemApptStatusEnum). */
const APPT_STATUS = {
  REQUESTED: 'T01',           // 예약 요청(확정대기)
  CONFIRMED: 'T03',           // 예약 완료(예약확정)
  CANCELED_BY_PATIENT: 'F02', // 본인취소(환자취소)
  CANCELED_BY_HOSPITAL: 'F03',// 병원취소
  COMPLETED: 'F05',           // 진료완료
  REJECTED: 'T02',            // 예약 실패(거절)
  CANCEL_REQUESTED: 'F01'     // 취소 요청
} as const;

type TagCase = 'blue' | 'gray' | 'orange' | 'green' | 'red';

/** [실제] 상태 코드 → 표기 라벨. T02·F01은 라벨이 없어 코드가 그대로 노출된다(실제 동작). */
const APPT_STATUS_LABEL: Record<string, string> = {
  [APPT_STATUS.REQUESTED]: '확정대기',
  [APPT_STATUS.CONFIRMED]: '예약확정',
  [APPT_STATUS.CANCELED_BY_HOSPITAL]: '병원취소',
  [APPT_STATUS.CANCELED_BY_PATIENT]: '환자취소',
  [APPT_STATUS.COMPLETED]: '진료완료'
};
const STATUS_TAG_CASE: Record<string, TagCase> = {
  [APPT_STATUS.REQUESTED]: 'orange',
  [APPT_STATUS.CONFIRMED]: 'blue',
  [APPT_STATUS.COMPLETED]: 'green',
  [APPT_STATUS.CANCELED_BY_HOSPITAL]: 'red',
  [APPT_STATUS.CANCELED_BY_PATIENT]: 'red'
};

const TAB = { REQUEST: 'request', UPCOMING: 'upcoming', CLOSED: 'closed' } as const;
type TabValue = (typeof TAB)[keyof typeof TAB];
const TAB_LABEL: Record<TabValue, string> = {
  [TAB.REQUEST]: '예약 신청', [TAB.UPCOMING]: '내원 예정', [TAB.CLOSED]: '지난 내역'
};
const EMPTY_MESSAGE: Record<TabValue, string> = {
  [TAB.REQUEST]: '조회된 예약 신청이 없어요',
  [TAB.UPCOMING]: '조회된 내원 예정 일정이 없어요',
  [TAB.CLOSED]: '조회된 지난 내역이 없어요'
};
const NO_RESULT_MESSAGE = '조건에 맞는 예약이 없어요';
/** [실제] 탭별 대표 일시 라벨. 목록 헤더·상세 타이틀이 공유(구분자만 목록 '/' · 상세 '·'). */
const DATETIME_LABEL: Record<TabValue, string> = {
  [TAB.REQUEST]: '신청일시', [TAB.UPCOMING]: '확정일시', [TAB.CLOSED]: '종료일시'
};
const DATETIME_HEADER: Record<TabValue, string> = {
  [TAB.REQUEST]: `예약희망 / ${DATETIME_LABEL[TAB.REQUEST]}`,
  [TAB.UPCOMING]: `예약희망 / ${DATETIME_LABEL[TAB.UPCOMING]}`,
  [TAB.CLOSED]: `예약희망 / ${DATETIME_LABEL[TAB.CLOSED]}`
};
const TAB_STATUSES: Record<TabValue, string[]> = {
  [TAB.REQUEST]: [APPT_STATUS.REQUESTED],
  [TAB.UPCOMING]: [APPT_STATUS.CONFIRMED],
  [TAB.CLOSED]: [APPT_STATUS.REJECTED, APPT_STATUS.CANCEL_REQUESTED, APPT_STATUS.CANCELED_BY_PATIENT, APPT_STATUS.CANCELED_BY_HOSPITAL, APPT_STATUS.COMPLETED]
};

/* ---- 일시 포매팅 (실제 utils.ts를 dayjs 없이 재현) ---- */
const WEEKDAY = ['일', '월', '화', '수', '목', '금', '토'];
const pad2 = (n: number) => String(n).padStart(2, '0');
/** "20260711" | "2026-07-11" | ISO → Date. 유효하지 않으면 null. */
const parseDate = (value?: string): Date | null => {
  if (!value) return null;
  const iso = /^\d{8}$/.test(value)
    ? `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`
    : value;
  const d = new Date(iso.length <= 10 ? `${iso}T00:00:00` : iso);
  return Number.isNaN(d.getTime()) ? null : d;
};
const fmtDay = (d: Date) => `${d.getFullYear()}.${pad2(d.getMonth() + 1)}.${pad2(d.getDate())}(${WEEKDAY[d.getDay()]})`;
/** [실제] 임의 일시 → "yyyy.mm.dd(요일) HH:mm". 값 없으면 "-". */
const formatDateTime = (value?: string) => {
  const d = parseDate(value);
  return d ? `${fmtDay(d)} ${pad2(d.getHours())}:${pad2(d.getMinutes())}` : value || '-';
};
/** [실제] 방문 희망일(+시간) → "yyyy.mm.dd(요일) HH:mm". 날짜 없으면 "미정". */
const formatVisit = (visitDate?: string, visitKoTime?: string) => {
  const d = parseDate(visitDate);
  if (!d) return '미정';
  return visitKoTime ? `${fmtDay(d)} ${visitKoTime}` : fmtDay(d);
};
/** [실제] 자동종료 종료일시 = 방문예정일 다음날 00:00. */
const formatAutoClosedDate = (visitDate?: string) => {
  const d = parseDate(visitDate);
  if (!d) return '-';
  const next = new Date(d.getTime());
  next.setDate(next.getDate() + 1);
  return `${fmtDay(next)} 00:00`;
};
/** [실제] 생년월일(YYYYMMDD)+성별코드(주민 7번째: 홀=남/짝=여) → 표시 구성요소. */
const formatBirth = (birth?: number, genderCode?: number) => {
  const gender = genderCode === undefined ? null : genderCode % 2 === 1 ? '남' : '여';
  if (!birth) return { yymmdd: '-', age: null as number | null, gender };
  const d = parseDate(String(birth));
  if (!d) return { yymmdd: String(birth), age: null as number | null, gender };
  const now = new Date(MOCK_TODAY + 'T00:00:00');
  let age = now.getFullYear() - d.getFullYear();
  const before = now.getMonth() < d.getMonth() || (now.getMonth() === d.getMonth() && now.getDate() < d.getDate());
  if (before) age -= 1;
  return { yymmdd: String(birth).slice(-6), age, gender };
};

/* ---- 가격 (실제 PRICE_TYPE / formatPriceOption / formatTotalPrice) ---- */
const PRICE_TYPE = { FIXED: 0, DISCOUNT: 1, CONSULT: 2 } as const;
type ApptPrice = { treatmentItemPriceId: number; title: string; priceType: number; originPrice?: number; salePrice?: number };
const priceAmount = (p: ApptPrice) => (p.priceType === PRICE_TYPE.DISCOUNT ? p.salePrice : p.originPrice) ?? 0;
const formatPriceOption = (p: ApptPrice) =>
  p.priceType === PRICE_TYPE.CONSULT ? '상담 후 결정' : `${priceAmount(p).toLocaleString()}원`;
/** [실제] 일반만 → {합산}원 / 일반+상담 → {합산}원~ / 상담만 → 상담 후 결정. */
const formatTotalPrice = (prices?: ApptPrice[]) => {
  const list = prices ?? [];
  if (list.length === 0) return '-';
  const hasConsult = list.some((p) => p.priceType === PRICE_TYPE.CONSULT);
  const fixed = list.filter((p) => p.priceType !== PRICE_TYPE.CONSULT);
  if (hasConsult && fixed.length === 0) return '상담 후 결정';
  const sum = fixed.reduce((acc, p) => acc + priceAmount(p), 0);
  return `${sum.toLocaleString()}원${hasConsult ? '~' : ''}`;
};

/* ---- 자동종료 판정 (실제 constants.ts) ---- */
interface ApptDateFields { status?: string; createdAt?: string; statusChangedAt?: string; visitDate?: string }
/** [실제] 종료일시. 자동종료면 방문 다음날 00:00, 그 외 종료성은 statusChangedAt. */
const getClosedDate = (appt?: ApptDateFields) =>
  appt?.status === APPT_STATUS.REQUESTED || appt?.status === APPT_STATUS.CONFIRMED
    ? formatAutoClosedDate(appt?.visitDate)
    : formatDateTime(appt?.statusChangedAt);
/** [실제] 자동종료 = 지난 내역 탭에 확정대기·예약확정 상태로 남은 건(방문일 경과). */
const isAutoClosed = (status?: string, tab?: TabValue) =>
  tab === TAB.CLOSED && (status === APPT_STATUS.REQUESTED || status === APPT_STATUS.CONFIRMED);
/** [실제] 종료 사유. 거절(T02)·취소요청(F01)은 사유 없이 일시만. */
const getClosedReason = (status?: string, tab?: TabValue): string | undefined => {
  if (isAutoClosed(status, tab)) return '자동 종료';
  if (status === APPT_STATUS.COMPLETED) return '진료 완료';
  if (status === APPT_STATUS.CANCELED_BY_HOSPITAL) return '병원 취소';
  if (status === APPT_STATUS.CANCELED_BY_PATIENT) return '환자 취소';
  return undefined;
};
const getStatusLabel = (status?: string, tab?: TabValue) =>
  isAutoClosed(status, tab) ? '자동종료' : APPT_STATUS_LABEL[status ?? ''] ?? status ?? '-';
const getStatusTagCase = (status?: string, tab?: TabValue): TagCase =>
  isAutoClosed(status, tab) ? 'gray' : STATUS_TAG_CASE[status ?? ''] ?? 'gray';
const CLOSED_STATUSES: string[] = [APPT_STATUS.REJECTED, APPT_STATUS.CANCEL_REQUESTED, APPT_STATUS.CANCELED_BY_PATIENT, APPT_STATUS.CANCELED_BY_HOSPITAL, APPT_STATUS.COMPLETED];
const isClosedStatus = (status: string) => CLOSED_STATUSES.includes(status);
const isCanceledStatus = (status: string) =>
  status === APPT_STATUS.CANCELED_BY_PATIENT || status === APPT_STATUS.CANCELED_BY_HOSPITAL;

/** [실제] 탭별 표시 전략. 내원 예정만 미래 지향 기간 프리셋. */
type DateDirection = 'past' | 'future';
const TAB_CONFIG: Record<TabValue, { hasStatusFilter: boolean; getDate: (a?: ApptDateFields) => string; dateDirection: DateDirection }> = {
  [TAB.REQUEST]: { hasStatusFilter: false, getDate: (a) => formatDateTime(a?.createdAt), dateDirection: 'past' },
  [TAB.UPCOMING]: { hasStatusFilter: false, getDate: (a) => formatDateTime(a?.statusChangedAt), dateDirection: 'future' },
  [TAB.CLOSED]: { hasStatusFilter: true, getDate: getClosedDate, dateDirection: 'past' }
};

/* ---- 기간·검색 필터 (실제 constants.ts) ---- */
const DATE_PRESET = { LAST_30D: 'last30d', LAST_7D: 'last7d', TODAY: 'today', ALL: 'all', CUSTOM: 'custom' } as const;
type DatePreset = (typeof DATE_PRESET)[keyof typeof DATE_PRESET];
const DATE_PRESET_LABEL: Record<DatePreset, string> = {
  [DATE_PRESET.LAST_30D]: '최근 30일', [DATE_PRESET.LAST_7D]: '최근 7일',
  [DATE_PRESET.TODAY]: '오늘', [DATE_PRESET.ALL]: '전체', [DATE_PRESET.CUSTOM]: '직접 설정'
};
/** [실제] 노출 순서 — '전체(ALL)' 버튼은 노출하지 않는다. */
const DATE_PRESET_ORDER: DatePreset[] = [DATE_PRESET.LAST_30D, DATE_PRESET.LAST_7D, DATE_PRESET.TODAY, DATE_PRESET.CUSTOM];
const MAX_DATE_RANGE_MONTHS = 6;
const DATE_RANGE_LIMIT_MESSAGE = '조회 기간은 최대 6개월까지 설정할 수 있어요.';

const SEARCH_TYPE = { PATIENT_NAME: 'PATIENT_NAME', PHONE: 'PHONE', TREATMENT_ITEM_NAME: 'TREATMENT_ITEM_NAME' } as const;
type SearchType = (typeof SEARCH_TYPE)[keyof typeof SEARCH_TYPE];
const SEARCH_TYPE_LABEL: Record<SearchType, string> = {
  [SEARCH_TYPE.PATIENT_NAME]: '환자명', [SEARCH_TYPE.PHONE]: '연락처', [SEARCH_TYPE.TREATMENT_ITEM_NAME]: '진료항목명'
};
const SEARCH_TYPE_OPTIONS: [string, string][] = (Object.keys(SEARCH_TYPE_LABEL) as SearchType[]).map((v) => [v, SEARCH_TYPE_LABEL[v]]);
const SEARCH_TYPE_PLACEHOLDER: Record<SearchType, string> = {
  [SEARCH_TYPE.PATIENT_NAME]: '환자명을 입력해 주세요.',
  [SEARCH_TYPE.PHONE]: '연락처를 입력해 주세요.',
  [SEARCH_TYPE.TREATMENT_ITEM_NAME]: '진료항목 또는 가격명을 입력해 주세요.'
};
/** [실제] 최소 길이. 연락처는 숫자만 추출한 뒤 자릿수 기준. */
const SEARCH_TYPE_MIN_LENGTH: Record<SearchType, number> = {
  [SEARCH_TYPE.PATIENT_NAME]: 2, [SEARCH_TYPE.PHONE]: 4, [SEARCH_TYPE.TREATMENT_ITEM_NAME]: 2
};
const SEARCH_TYPE_ERROR: Record<SearchType, string> = {
  [SEARCH_TYPE.PATIENT_NAME]: '2자 이상 입력해 주세요.',
  [SEARCH_TYPE.PHONE]: '4자리 이상 입력해 주세요.',
  [SEARCH_TYPE.TREATMENT_ITEM_NAME]: '2자 이상 입력해 주세요.'
};
const DEFAULT_PAGE_SIZE = 100;
const STATUS_FILTER_ALL = 'all';
/** [실제] 지난 내역 상태 필터. 자동종료는 'T01,T03' 합성값. */
const STATUS_FILTER_OPTIONS: [string, string][] = [
  [STATUS_FILTER_ALL, '전체'],
  [APPT_STATUS.COMPLETED, '진료완료'],
  [APPT_STATUS.CANCELED_BY_HOSPITAL, '병원취소'],
  [APPT_STATUS.CANCELED_BY_PATIENT, '환자취소'],
  [`${APPT_STATUS.REQUESTED},${APPT_STATUS.CONFIRMED}`, '자동종료']
];
/** [실제] 병원 취소 사유 템플릿 (PRD 4.6). 라벨만 있고 본문은 없다. */
const CANCEL_REASON_TEMPLATES: { id: string; label: string }[] = [
  { id: 'schedule_unavailable', label: '일정 불가' },
  { id: 'doctor_unavailable', label: '담당 의료진 부재' },
  { id: 'treatment_item_check', label: '진료항목 확인 필요' },
  { id: 'patient_info_check', label: '환자 정보 확인 필요' },
  { id: 'etc', label: '기타 병원 사정' }
];

/* ---- mock 데이터 (실제 응답 필드 형태를 따른다) ---- */
/** 프로토타입 기준 '오늘'. 기간 프리셋·만나이 계산의 기준점. */
const MOCK_TODAY = '2026-07-15';
type ApptAdditionalInfo = { name: string; value?: string; values?: string[] };
type Appt = {
  treatmentItemApptId: number;
  status: string;
  deviceType: number;
  visitDate: string;       // yyyyMMdd
  visitKoTime: string;     // HH:mm
  createdAt: string;       // ISO
  statusChangedAt?: string;
  treatmentItem: { name?: string; alias?: string; shortDescription?: string; mainImage?: string; master1Id?: number | null };
  prices: ApptPrice[];
  visitorName: string; visitorPhone: string; visitorBirth?: number; visitorRrn7?: number;
  reserverName: string; reserverPhone: string;
  reserverMemo?: string;
  cancelMemo?: string;
  additionalInfos?: ApptAdditionalInfo[];
};
let PID = 5000;
const INITIAL_APPTS: Appt[] = [
  { treatmentItemApptId: 201, status: APPT_STATUS.REQUESTED, deviceType: 2, visitDate: '20260718', visitKoTime: '15:00', createdAt: '2026-07-14T09:12:00',
    treatmentItem: { name: '레이저 토닝', alias: '', shortDescription: '색소·톤 개선 레이저', master1Id: 11 },
    prices: [{ treatmentItemPriceId: PID++, title: '1회', priceType: PRICE_TYPE.FIXED, originPrice: 80000 }],
    visitorName: '김민지', visitorPhone: '01023456789', visitorBirth: 19960520, visitorRrn7: 2,
    reserverName: '김민지', reserverPhone: '01023456789', reserverMemo: '기미 위주로 봐주세요',
    additionalInfos: [
      { name: '주로 신경 쓰이는 부위가 어디인가요?', value: '양 볼 기미와 잔잔한 잡티요.' },
      { name: '레이저 시술 경험이 있으신가요?', values: ['처음이에요'] },
      { name: '함께 상담받고 싶은 항목을 선택해 주세요.', values: ['색소·잡티', '모공'] }
    ] },
  { treatmentItemApptId: 202, status: APPT_STATUS.REQUESTED, deviceType: 1, visitDate: '20260718', visitKoTime: '11:30', createdAt: '2026-07-14T08:40:00',
    treatmentItem: { name: '물광주사', alias: '', shortDescription: '수분 광채 물광주사', master1Id: 11 },
    prices: [{ treatmentItemPriceId: PID++, title: '1회', priceType: PRICE_TYPE.FIXED, originPrice: 120000 }],
    visitorName: '이서연', visitorPhone: '01034567890', visitorBirth: 19901102, visitorRrn7: 2,
    reserverName: '이서연', reserverPhone: '01034567890' },
  { treatmentItemApptId: 203, status: APPT_STATUS.CONFIRMED, deviceType: 2, visitDate: '20260719', visitKoTime: '14:00', createdAt: '2026-07-14T10:02:00', statusChangedAt: '2026-07-14T10:31:00',
    treatmentItem: { name: '보톡스', alias: '보톡스 (이마)', shortDescription: '이마 주름 개선', master1Id: 31 },
    prices: [{ treatmentItemPriceId: PID++, title: '이마', priceType: PRICE_TYPE.DISCOUNT, originPrice: 150000, salePrice: 99000 }],
    visitorName: '박도윤', visitorPhone: '01045678901', visitorBirth: 19880715, visitorRrn7: 1,
    reserverName: '박도윤', reserverPhone: '01045678901', reserverMemo: '주차 가능한가요?',
    additionalInfos: [{ name: '시술 희망 부위를 알려주세요.', value: '이마 가로 주름이요.' }, { name: '알러지가 있으신가요?', values: [] }] },
  { treatmentItemApptId: 204, status: APPT_STATUS.CONFIRMED, deviceType: 1, visitDate: '20260720', visitKoTime: '16:30', createdAt: '2026-07-13T17:20:00', statusChangedAt: '2026-07-13T18:02:00',
    treatmentItem: { name: '얼굴지방흡입', alias: '얼굴 지방흡입', shortDescription: '갸름한 얼굴라인을 위한 지방흡입', master1Id: 21 },
    prices: [{ treatmentItemPriceId: PID++, title: '기본', priceType: PRICE_TYPE.FIXED, originPrice: 3500000 }],
    visitorName: '최지우', visitorPhone: '01056789012', visitorBirth: 20010228, visitorRrn7: 4,
    reserverName: '최지우 모', reserverPhone: '01099990000' },
  { treatmentItemApptId: 205, status: APPT_STATUS.COMPLETED, deviceType: 2, visitDate: '20260705', visitKoTime: '13:00', createdAt: '2026-07-05T09:40:00', statusChangedAt: '2026-07-05T13:55:00',
    treatmentItem: { name: '실 리프팅', alias: '', master1Id: 11 },
    prices: [{ treatmentItemPriceId: PID++, title: '상담', priceType: PRICE_TYPE.CONSULT }],
    visitorName: '정하윤', visitorPhone: '01067890123', visitorBirth: 19930105, visitorRrn7: 2,
    reserverName: '정하윤', reserverPhone: '01067890123',
    additionalInfos: [{ name: '상담 희망 내용을 적어주세요.', value: '처진 볼 라인 리프팅 상담 원해요.' }] },
  { treatmentItemApptId: 206, status: APPT_STATUS.CANCELED_BY_PATIENT, deviceType: 1, visitDate: '20260706', visitKoTime: '10:00', createdAt: '2026-07-05T20:10:00', statusChangedAt: '2026-07-06T08:12:00',
    treatmentItem: { name: '리쥬란 힐러', alias: '', shortDescription: '피부 재생 스킨부스터', master1Id: 11 },
    prices: [{ treatmentItemPriceId: PID++, title: '3회 패키지 (사후관리 포함)', priceType: PRICE_TYPE.DISCOUNT, originPrice: 750000, salePrice: 600000 }],
    visitorName: '강서진', visitorPhone: '01078901234', visitorBirth: 19971224, visitorRrn7: 1,
    reserverName: '강서진', reserverPhone: '01078901234', cancelMemo: '개인 사정' },
  { treatmentItemApptId: 207, status: APPT_STATUS.CANCELED_BY_HOSPITAL, deviceType: 2, visitDate: '20260706', visitKoTime: '18:00', createdAt: '2026-07-06T09:30:00', statusChangedAt: '2026-07-06T12:30:00',
    treatmentItem: { name: '슈링크 유니버스', alias: '', shortDescription: '집중 리프팅', master1Id: 11 },
    prices: [{ treatmentItemPriceId: PID++, title: '300샷', priceType: PRICE_TYPE.FIXED, originPrice: 300000 }],
    visitorName: '윤예은', visitorPhone: '01089012345', visitorBirth: 19920819, visitorRrn7: 2,
    reserverName: '윤예은', reserverPhone: '01089012345', cancelMemo: '일정 불가',
    additionalInfos: [{ name: '시술 희망 부위와 샷 수를 알려주세요.', value: '얼굴 전체 300샷 원해요.' }] },
  // 자동종료 케이스 — 확정대기·예약확정 상태로 방문예정일이 지난 건. 종료일시는 방문 다음날 00:00.
  { treatmentItemApptId: 208, status: APPT_STATUS.REQUESTED, deviceType: 2, visitDate: '20260618', visitKoTime: '04:30', createdAt: '2026-06-17T18:03:00',
    treatmentItem: { name: '레이저 토닝', alias: '', master1Id: 11 },
    prices: [{ treatmentItemPriceId: PID++, title: '1회', priceType: PRICE_TYPE.FIXED, originPrice: 80000 }],
    visitorName: '한지호', visitorPhone: '01011112222', visitorBirth: 19950310, visitorRrn7: 1,
    reserverName: '한지호', reserverPhone: '01011112222' },
  { treatmentItemApptId: 209, status: APPT_STATUS.CONFIRMED, deviceType: 1, visitDate: '20260620', visitKoTime: '11:00', createdAt: '2026-06-19T10:00:00', statusChangedAt: '2026-06-19T10:20:00',
    treatmentItem: { name: '물광주사', alias: '', master1Id: 11 },
    prices: [{ treatmentItemPriceId: PID++, title: '1회', priceType: PRICE_TYPE.FIXED, originPrice: 120000 }],
    visitorName: '오세라', visitorPhone: '01033334444', visitorBirth: 19990101, visitorRrn7: 2,
    reserverName: '오세라', reserverPhone: '01033334444' }
];

/** [실제] 연락처 포맷 (utils/phoneNumberFormatter). */
const formatPhoneNumber = (v?: string) => {
  const n = (v ?? '').replace(/[^0-9]/g, '');
  if (n.length === 11) return `${n.slice(0, 3)}-${n.slice(3, 7)}-${n.slice(7)}`;
  if (n.length === 10) return `${n.slice(0, 3)}-${n.slice(3, 6)}-${n.slice(6)}`;
  return v ?? '';
};
/** [실제] 예약자 = 방문자 동일 여부(이름+연락처 일치). */
const isSameAsVisitor = (a: Appt) => !!a.reserverName && a.reserverName === a.visitorName && a.reserverPhone === a.visitorPhone;
/** [실제] 표준 진료항목(마스터 매핑)인지 — 직접입력이면 항목명 뱃지 미노출. */
const isStandardTreatmentItem = (t: Appt['treatmentItem']) => t?.master1Id != null;
/** [실제] 상세 응답 additionalInfos → 표시용 질문·답변. 빈 답변은 제외해 '답변 없음' 판정에 쓴다. */
const toKakaoAnswers = (infos?: ApptAdditionalInfo[]) =>
  (infos ?? []).map((info) => {
    const raw = info.values?.length ? info.values : info.value ? [info.value] : [];
    return { question: info.name ?? '', answers: raw.filter((a) => a.trim().length > 0) };
  });

/* ============================ [KAK-001] 카카오 자동 확정 예외 안내 문구 ============================
 * 확정 전 정책. 병원의 `예약 자동 확정`이 OFF여도 카카오 유입 예약은 항상 자동 확정된다.
 * 관리자 UI에만 영향(신청 웹뷰 변경 없음). 문구는 세 지점에서 관점만 바꿔 같은 내용을 전달한다.
 *   ① 운영 설정 — 내 설정이 어디까지 적용되는가  ② 진료항목 상세 — 이 항목을 켜면 어떻게 되는가
 *   ③ 예약 신청 내역 — 예외가 실제로 적용된 결과
 * ※ 카카오가 수동 확정을 지원하면 이 블록과 관련 UI를 함께 제거한다.
 * ------------------------------------------------------------------------------------------ */
/* 세 지점이 아래 4개 문장을 조합만 달리해 쓴다. 문장 자체는 화면마다 바꾸지 않는다(용어 일관성).
 *   A 사실  카카오톡 예약하기로 받는 예약은 자동으로 확정됩니다.
 *   C 이유  카카오톡 예약하기가 수동 확정을 지원하지 않아 적용된 임시 정책입니다.
 *   B 대비  굿닥으로 받는 예약은 수동으로 확정됩니다.  ← C가 '수동 확정'을 먼저 세우므로 같은 용어로 받는다
 *   D 대응  진료하기 어려운 예약은 예약 신청 내역에서 취소할 수 있습니다.
 * 나열 순서는 A(통보) → C(왜) → B(그럼 굿닥은) → D(그래서 뭘 하나).
 *   ① 제목이 설정과 반대되는 사실을 통보하므로 독자의 첫 질문은 '왜'다 → C가 먼저.
 *   ② 주어가 카카오→카카오→굿닥으로 흘러 화제 전환이 한 번뿐이다(B 먼저면 두 번).
 *   ③ 예외를 먼저 닫고 정상 케이스로 넘어간다.
 *   ④ D를 끝에 두어 마지막 인상이 '취소로 대처할 수 있다'가 되게 한다.
 * 고정 어휘 — 대상=`카카오톡 예약하기로 받는 예약` / 대비=`굿닥으로 받는 예약`
 *            설정=`수동 확정 설정` / 결과=`자동으로 확정됩니다`(실제 Settings 문구와 동일) */
const KAK_B = '굿닥으로 받는 예약은 수동으로 확정됩니다.';
const KAK_C = '카카오톡 예약하기가 수동 확정을 지원하지 않아 적용된 임시 정책입니다.';
const KAK_D = '진료하기 어려운 예약은 예약 신청 내역에서 취소할 수 있습니다.';

/** ① 설정 항목의 적용 범위(자동 확정 ON일 때 한 줄). */
const KAK_SETTING_SCOPE = '카카오톡 예약하기로 받는 예약은 이 설정과 관계없이 자동으로 확정됩니다.';
/** ① 수동 확정일 때만 노출하는 안내 블록 = 제목 A + 불릿 B·C·D. 닫기 없음. */
const KAK_BANNER_TITLE = '카카오톡 예약하기로 받는 예약은 자동으로 확정됩니다';
const KAK_BANNER_BULLETS = [KAK_C, KAK_B, KAK_D];
/** ① 자동 확정을 ON → OFF로 끄는 순간의 확인 모달 = 제목 A(계속) + 본문 C·B 2줄.
 *  끄려는 시점이라 '왜 꺼도 소용없나'(C)가 더 급한 질문이다. */
const KAK_MODAL_TITLE = '카카오톡 예약하기로 받는 예약은 계속 자동으로 확정됩니다';
const KAK_MODAL_BODY = [KAK_C, KAK_B];
const KAK_MODAL_CONFIRM = '자동 확정 끄기';
/** ② 진료항목 상세 — 카카오 노출 토글 설명. 한 줄에 들어가도록 A만 쓴다(B는 설정 화면 몫). */
const KAK_TOGGLE_HELP = '카카오톡 예약하기로 받는 예약은 자동으로 확정됩니다.';

type OperationSettings = {
  apptUsed: boolean;
  autoConfirmed: boolean;
  todayApptUsed: boolean;
  newApptNotified: boolean;
  version: number;
  appliedVersion: number;
  syncState: SyncState;
  lastAt: string;
  error?: string;
};
const INITIAL_OPERATION: OperationSettings = {
  apptUsed: true,
  // [KAK-001] 검토 대상이 '수동 확정 병원'이므로 기본값을 OFF로 둔다. 진입하자마자 예외 안내가 보이고,
  // ON으로 켰다가 다시 끄면 전환 확인 모달까지 확인할 수 있다. (실서비스 기본값과 무관한 프로토타입 초기 상태)
  autoConfirmed: false,
  todayApptUsed: true,
  newApptNotified: true,
  version: 12,
  appliedVersion: 12,
  syncState: 'SYNCED',
  lastAt: '2026.07.15 10:42'
};

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
/** 목록 채널 뱃지용 흰색 굿닥 글리프 (파란 사각 배경 위에 올림, 초록 포인트 유지) */
const GoodocGlyphW = () => (
  <svg viewBox="0 0 27 43" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M13.1516 36.3658C9.90902 36.3658 7.21826 33.9857 6.74251 30.8897H0.0390015C0.542057 37.65 6.2297 42.9981 13.1516 42.9981C20.0735 42.9981 25.7611 37.65 26.2642 30.8897H19.5587C19.0849 33.9857 16.3922 36.3658 13.1496 36.3658H13.1516Z" fill="#fff" />
    <path d="M26.2895 0H19.5197V6.61479H26.2895V0Z" fill="#41D293" />
    <path d="M13.1516 4.96207C5.90017 4.96207 0 10.832 0 18.0462C0 25.2603 5.90017 31.1302 13.1516 31.1302C20.403 31.1302 26.3032 25.2603 26.3032 18.0462C26.3032 10.832 20.403 4.96207 13.1516 4.96207ZM13.1516 24.498C9.5756 24.498 6.66646 21.6038 6.66646 18.0462C6.66646 14.4885 9.5756 11.5943 13.1516 11.5943C16.7276 11.5943 19.6367 14.4885 19.6367 18.0462C19.6367 21.6038 16.7276 24.498 13.1516 24.498V24.498Z" fill="#fff" />
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
type Page = 'items' | 'appt' | 'settings' | 'hours';
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
          <N label="진료 예약" beta ex="d" />
          <N label="예약 신청 내역" sub active={page === 'appt'} onClick={() => onNav('appt')} />
          <N label="진료항목" sub active={page === 'items'} onClick={() => onNav('items')} />
          <N label="진료 예약 설정" sub active={page === 'settings'} onClick={() => onNav('settings')} />
          <N label="병원 약관" ex="r" />
        </div>
        <div className="cn-nav-divider"><span /></div>
        <div className="cn-nav-group">
          <div className="cn-nav-header">병원 홍보</div>
          <N label="병원 검색 정보" ex={page === 'hours' ? 'd' : 'r'} />
          {page === 'hours' && <>
            <N label="병원 정보" sub />
            <N label="운영 시간" sub active onClick={() => onNav('hours')} />
            <N label="의료진 소개" sub />
          </>}
          <N label="병원 소식 알림" ex="r" />
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
function PriceRow({ p, onChange, onDelete, onDragStart, onDrop, titleErr, amountErr }: { p: Price; onChange: (u: Partial<Price>) => void; onDelete: () => void; onDragStart: () => void; onDrop: () => void; titleErr?: string; amountErr?: string }) {
  const [open, setOpen] = useState(false);
  const cur = PRICE_TYPES.find((t) => t.value === p.type)!;
  const numCls = `rg-num${amountErr ? ' error' : ''}`;
  return (
    <div className="rg-price-row tk-price-row" draggable onDragStart={onDragStart} onDragOver={(e) => e.preventDefault()} onDrop={onDrop}>
      <div className="rg-drag" aria-label="순서 변경 핸들"><DragHandle /></div>
      <div className="rg-price-fields">
        <input className={`rg-input${titleErr ? ' error' : ''}`} placeholder={`가격명을 입력해 주세요. (15자 권장, 최대 ${PRICE_NAME_MAX}자)`} maxLength={PRICE_NAME_MAX} value={p.title} onChange={(e) => onChange({ title: e.target.value })} />
        {titleErr && <p className="rg-error">{titleErr}</p>}
        <input className="rg-input" placeholder={`가격 설명을 입력해 주세요. (선택사항, 최대 ${PRICE_DESC_MAX}자)`} maxLength={PRICE_DESC_MAX} value={p.content} onChange={(e) => onChange({ content: e.target.value })} />
        <div className="rg-price-entry">
          <div className="rg-select-wrap">
            <button type="button" className={`rg-select${open ? ' open' : ''}`} onClick={() => setOpen((v) => !v)}>{cur.label}<span className="rg-select-ic"><SelectArrow /></span></button>
            {open && <div className="rg-select-menu" onMouseLeave={() => setOpen(false)}>{PRICE_TYPES.map((t) => (<button key={t.value} type="button" className={`rg-select-opt${t.value === p.type ? ' active' : ''}`} onClick={() => { onChange({ type: t.value }); setOpen(false); }}>{t.label}</button>))}</div>}
          </div>
          {p.type === 'fixed' && (<><input className={numCls} placeholder="0" value={p.amount} onChange={(e) => onChange({ amount: e.target.value.replace(/[^0-9]/g, '') })} /><span className="rg-unit">원</span></>)}
          {p.type === 'discount' && (<><input className={numCls} placeholder="정상가" value={p.original} onChange={(e) => onChange({ original: e.target.value.replace(/[^0-9]/g, '') })} /><span className="rg-price-arrow">→</span><input className={numCls} placeholder="판매가" value={p.sale} onChange={(e) => onChange({ sale: e.target.value.replace(/[^0-9]/g, '') })} /><span className="rg-unit">원</span></>)}
          {p.type === 'consult' && (<><input className="rg-num" value="0" disabled readOnly /><span className="rg-unit">원</span></>)}
        </div>
        {amountErr && <p className="rg-error">{amountErr}</p>}
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
/**
 * [실제 deriveChannelDisplay] 굿닥=visible, 카카오=kakaoLinked && visible.
 * 목록 응답의 kakaoLinked는 '노출 의도'만 담고 서버 rollup이 아니라, 구현은 굿닥 노출만 선행 조건으로 AND 한다.
 * (예약 운영 여부·외부 동기화 상태는 이 배지에 반영하지 않는다 — 정책 문서와 구현의 차이)
 */
function ChannelMarks({ it, hospitalLinked }: { it: Item; hospitalLinked: boolean }) {
  const goodocActive = it.gdVisible;
  const kakaoActive = it.kakaoOn && goodocActive;
  return (
    <span className="tk-chans">
      <span className={`tk-chan tk-chan-gd${goodocActive ? '' : ' dim'}`} title={goodocActive ? '굿닥에서 보임' : '굿닥에서 안 보임'}><GoodocGlyphW /></span>
      {hospitalLinked && <span className={`tk-chan tk-chan-kko${kakaoActive ? '' : ' dim'}`} title={kakaoActive ? '카카오톡 예약하기에서 보임' : '카카오톡 예약하기에서 안 보임'}><KakaoMark /></span>}
    </span>
  );
}
function ItemRow({ it, hospitalLinked, onOpen, onToggle, onDelete, onDragStart, onDrop }: { it: Item; hospitalLinked: boolean; onOpen: () => void; onToggle: () => void; onDelete: () => void; onDragStart: () => void; onDrop: () => void }) {
  return (
    <div className="tk-l3" draggable onDragStart={onDragStart} onDragOver={(e) => e.preventDefault()} onDrop={onDrop}>
      <span className="tk-l3-handle"><DragHandle /></span>
      <button className="tk-l3-detail" onClick={onOpen}>
        <span className="tk-l3-name">{it.alias || it.name}</span>
        <span className="tk-l3-price"><span className="tk-l3-price-text">{priceDisplay(it)}</span><span className="tk-l3-optcount">{it.prices.length}</span></span>
        <span className="tk-l3-thumb">{it.hasImage ? <span className="tk-l3-thumb-img" /> : <ThumbIcon />}</span>
        <ChannelMarks it={it} hospitalLinked={hospitalLinked} />
      </button>
      <span className={`tk-l3-visible${it.gdVisible ? ' on' : ''}`}>{it.gdVisible ? '노출중' : '미노출'}</span>
      <button className={`rg-toggle${it.gdVisible ? '' : ' off'}`} onClick={onToggle} aria-label="굿닥 노출 토글"><span className="rg-toggle-knob" /></button>
      <button className="tk-l3-del" aria-label="삭제" onClick={onDelete}><CloseIcon /></button>
    </div>
  );
}

/* ============================ 예약 신청 내역 화면 (staging 현행화) ============================
 * 실제 화면 구성을 그대로 재현한다.
 *   목록: 탭(카운트 없음) → 기간·검색 필터 → 테이블(연동 병원은 채널이 첫 열) → 페이지네이션
 *   상세: 예약희망·일시 → 방문자 → 예약자 → 요청사항 → 카카오 Q&A → 진료 정보 → 상태 변경 이력
 * 실제와 다른 부분(프로토타입 한계)은 주석에 [proto]로 표시한다.
 * ------------------------------------------------------------------------------------ */

/** 열려 있는 동안 ESC로 닫는다. active=false면 리스너를 붙이지 않아 다른 모달과 간섭하지 않는다. */
function useEscClose(active: boolean, onClose: () => void) {
  useEffect(() => {
    if (!active) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [active, onClose]);
}

/** [실제 ChannelBadge] 18px 라운드 사각. 굿닥=파란 배경+흰 글리프, 카카오=노란 사각. */
function ChannelBadge({ channel, showLabel = false }: { channel: Channel; showLabel?: boolean }) {
  const label = CHANNEL_LABEL[channel];
  return (
    <span className="apx-chan">
      <span className={`apx-chan-badge ${channel}`} title={showLabel ? undefined : `${label}에서 신청`}>
        {channel === 'kakao' ? <KakaoMark /> : <GoodocGlyphW />}
      </span>
      {showLabel && <span className="apx-chan-label">{`${label} 신청`}</span>}
    </span>
  );
}

/** [실제 Tag] min-width 48 · padding 1/6 · radius 4. case별 색만 다름. */
function Tag({ tagCase, children }: { tagCase: TagCase; children: React.ReactNode }) {
  return <span className={`apx-tag ${tagCase}`}>{children}</span>;
}

/** [실제 Section] 제목(body2_600 gray-70) + 우측 action + 카드(border gray-30 · radius 8). */
function Section({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="apx-sec">
      <div className="apx-sec-head">
        <span className="apx-sec-title">{title}</span>
        {action}
      </div>
      <div className="apx-card">{children}</div>
    </div>
  );
}
/** [실제 Field] 라벨 64px 그리드 · 행 높이 32. */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="apx-field">
      <span className="apx-field-label">{label}</span>
      {typeof children === 'string' ? <span className="apx-field-val">{children}</span> : children}
    </div>
  );
}

/** [실제 KakaoAnswers] 질문 1건 = 카드 1개. 복수 선택은 A 행이 여러 개, 미입력은 '답변 없음'. */
function KakaoAnswers({ answers }: { answers: { question: string; answers: string[] }[] }) {
  if (answers.length === 0) return null;
  return (
    <div className="apx-qa-list">
      {answers.map((item, i) => (
        <div key={i} className="apx-qa-card">
          <div className="apx-qa-row">
            <span className="apx-qa-mark q">Q</span>
            <span className="apx-qa-q">{item.question}</span>
          </div>
          {(item.answers.length > 0 ? item.answers : ['답변 없음']).map((answer, j) => (
            <div key={j} className="apx-qa-row">
              <span className="apx-qa-mark a">A</span>
              <span className="apx-qa-a">{answer}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function TwoLineCell({ primary, sub }: { primary: string; sub?: string }) {
  return (
    <span className="apx-2line">
      <span className="apx-2line-p">{primary}</span>
      <span className="apx-2line-s">{sub ?? ''}</span>
    </span>
  );
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

/* ---- 기간 프리셋 → [시작, 종료] (yyyy-mm-dd). 방향은 탭별 dateDirection. ---- */
const shiftDays = (base: string, days: number) => {
  const d = parseDate(base)!;
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};
const presetRange = (preset: DatePreset, direction: DateDirection): [string, string] | null => {
  if (preset === DATE_PRESET.ALL || preset === DATE_PRESET.CUSTOM) return null;
  if (preset === DATE_PRESET.TODAY) return [MOCK_TODAY, MOCK_TODAY];
  const days = preset === DATE_PRESET.LAST_30D ? 30 : 7;
  return direction === 'future' ? [MOCK_TODAY, shiftDays(MOCK_TODAY, days)] : [shiftDays(MOCK_TODAY, -days), MOCK_TODAY];
};
/** 두 날짜 간격이 N개월을 넘는지 (직접 설정 상한 검증). */
const overMonths = (start: string, end: string, months: number) => {
  const s = parseDate(start), e = parseDate(end);
  if (!s || !e) return false;
  const limit = new Date(s.getTime());
  limit.setMonth(limit.getMonth() + months);
  return e.getTime() > limit.getTime();
};
/** 필터 대상 날짜(yyyy-mm-dd). 신청=createdAt, 예정=방문일, 지난=종료 기준일. */
const filterDateOf = (a: { visitDate?: string; createdAt?: string; statusChangedAt?: string }, tab: TabValue) => {
  const src = tab === TAB.UPCOMING ? a.visitDate : tab === TAB.REQUEST ? a.createdAt : (a.statusChangedAt ?? a.visitDate);
  const d = parseDate(src);
  return d ? `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}` : '';
};

function ApptScreen({ appts, setAppts, hospitalLinked, failNextSync, consumeFailure, focusAdditionalToken, showToast }: {
  appts: Appt[];
  setAppts: React.Dispatch<React.SetStateAction<Appt[]>>;
  hospitalLinked: boolean;
  failNextSync: boolean;
  consumeFailure: () => void;
  focusAdditionalToken: number;
  showToast: (m: string) => void;
}) {
  const [tab, setTab] = useState<TabValue>(TAB.REQUEST);
  const [preset, setPreset] = useState<DatePreset>(DATE_PRESET.LAST_30D);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchType, setSearchType] = useState<SearchType>(SEARCH_TYPE.PATIENT_NAME);
  const [keyword, setKeyword] = useState('');
  const [keywordError, setKeywordError] = useState('');
  const [status, setStatus] = useState(STATUS_FILTER_ALL);
  const [applied, setApplied] = useState<{ type: SearchType; text: string } | null>(null);
  const [page, setPage] = useState(1);
  const [cancelId, setCancelId] = useState<number | null>(null);
  const [cancelReasonId, setCancelReasonId] = useState(CANCEL_REASON_TEMPLATES[0].id);
  const [detailId, setDetailId] = useState<number | null>(null);

  // 상세 모달은 딤 클릭·닫기 버튼 외에 ESC로도 닫는다.
  useEscClose(detailId != null, () => setDetailId(null));

  useEffect(() => {
    if (!focusAdditionalToken) return;
    const withAnswers = appts.find((a) => deviceTypeToChannel(a.deviceType) === 'kakao' && a.additionalInfos?.length);
    if (withAnswers) setDetailId(withAnswers.treatmentItemApptId);
  }, [focusAdditionalToken]);

  const config = TAB_CONFIG[tab];

  const rows = useMemo(() => {
    // 탭 분류는 실제 3개 엔드포인트(T01/T03/closed)의 의미를 따른다.
    // 확정대기·예약확정이라도 방문예정일이 지났으면 자동종료로 '지난 내역'에 속한다.
    const isPastVisit = (a: Appt) => filterDateOf({ ...a, statusChangedAt: undefined }, TAB.UPCOMING) < MOCK_TODAY;
    let r = appts.filter((a) => {
      const open = a.status === APPT_STATUS.REQUESTED || a.status === APPT_STATUS.CONFIRMED;
      if (tab === TAB.CLOSED) return isClosedStatus(a.status) || (open && isPastVisit(a));
      return TAB_STATUSES[tab].includes(a.status) && !isPastVisit(a);
    });
    // 지난 내역 상태 필터 — 자동종료는 'T01,T03' 합성값이라 split 후 포함 여부로 본다.
    if (config.hasStatusFilter && status !== STATUS_FILTER_ALL) {
      const allow = status.split(',');
      r = r.filter((a) => allow.includes(a.status));
    }
    const range = preset === DATE_PRESET.CUSTOM ? (startDate && endDate ? [startDate, endDate] as [string, string] : null) : presetRange(preset, config.dateDirection);
    if (range) r = r.filter((a) => { const d = filterDateOf(a, tab); return d >= range[0] && d <= range[1]; });
    if (applied?.text) {
      const q = applied.text.trim();
      r = r.filter((a) => {
        if (applied.type === SEARCH_TYPE.PATIENT_NAME) return a.visitorName.includes(q);
        if (applied.type === SEARCH_TYPE.PHONE) return (a.visitorPhone + a.reserverPhone).replace(/[^0-9]/g, '').includes(q.replace(/[^0-9]/g, ''));
        return (a.treatmentItem.alias || a.treatmentItem.name || '').includes(q) || a.prices.some((p) => p.title.includes(q));
      });
    }
    return r;
  }, [appts, tab, config, status, preset, startDate, endDate, applied]);

  const totalPages = Math.max(1, Math.ceil(rows.length / DEFAULT_PAGE_SIZE));
  const pageRows = rows.slice((page - 1) * DEFAULT_PAGE_SIZE, page * DEFAULT_PAGE_SIZE);
  const isSearchApplied = !!applied?.text || status !== STATUS_FILTER_ALL;
  const detail = appts.find((a) => a.treatmentItemApptId === detailId) || null;

  const changeTab = (next: TabValue) => { setTab(next); setPage(1); setStatus(STATUS_FILTER_ALL); setPreset(DATE_PRESET.LAST_30D); };
  const changePreset = (next: DatePreset) => {
    setPreset(next); setPage(1);
    if (next !== DATE_PRESET.CUSTOM) { setStartDate(''); setEndDate(''); }
  };
  const handleSearch = () => {
    const text = keyword.trim();
    if (!text) { setKeywordError(''); setApplied(null); setPage(1); return; }
    const len = searchType === SEARCH_TYPE.PHONE ? text.replace(/[^0-9]/g, '').length : text.length;
    if (len < SEARCH_TYPE_MIN_LENGTH[searchType]) { setKeywordError(SEARCH_TYPE_ERROR[searchType]); return; }
    if (preset === DATE_PRESET.CUSTOM && startDate && endDate && overMonths(startDate, endDate, MAX_DATE_RANGE_MONTHS)) {
      showToast(DATE_RANGE_LIMIT_MESSAGE);
      return;
    }
    setKeywordError(''); setApplied({ type: searchType, text }); setPage(1);
  };
  const handleReset = () => {
    setPreset(DATE_PRESET.LAST_30D); setStartDate(''); setEndDate('');
    setSearchType(SEARCH_TYPE.PATIENT_NAME); setKeyword(''); setKeywordError('');
    setStatus(STATUS_FILTER_ALL); setApplied(null); setPage(1);
  };

  const patchAppt = (id: number, u: Partial<Appt>) => setAppts((prev) => prev.map((a) => (a.treatmentItemApptId === id ? { ...a, ...u } : a)));
  const nowIso = () => `${MOCK_TODAY}T09:00:00`;
  const applyStatus = (id: number, next: string, message: string, extra?: Partial<Appt>) => {
    const target = appts.find((a) => a.treatmentItemApptId === id);
    const isExternal = target ? deviceTypeToChannel(target.deviceType) === 'kakao' : false;
    patchAppt(id, { status: next, statusChangedAt: nowIso(), ...extra });
    setDetailId(null);
    showToast(message);
    if (isExternal && failNextSync) {
      consumeFailure();
      window.setTimeout(() => showToast('카카오 상태 반영에 실패했어요. 예약 처리는 굿닥에 저장됐습니다.'), 700);
    }
  };
  const confirm = (id: number) => applyStatus(id, APPT_STATUS.CONFIRMED, '예약을 확정했습니다.');
  const complete = (id: number) => applyStatus(id, APPT_STATUS.COMPLETED, '진료를 완료했습니다.');
  const openCancel = (id: number) => { setCancelId(id); setCancelReasonId(CANCEL_REASON_TEMPLATES[0].id); };
  const doCancel = () => {
    if (cancelId == null) return;
    const reason = CANCEL_REASON_TEMPLATES.find((t) => t.id === cancelReasonId) || CANCEL_REASON_TEMPLATES[0];
    const id = cancelId;
    setCancelId(null);
    applyStatus(id, APPT_STATUS.CANCELED_BY_HOSPITAL, '예약을 취소했습니다.', { cancelMemo: reason.label });
  };

  /** 행 hover 퀵 액션 — 신청 탭=확정/취소, 예정 탭=진료완료/취소. 지난 내역은 없음. */
  const rowActions = (a: Appt) => {
    if (tab === TAB.REQUEST) return (<><button className="apx-qa-btn primary" onClick={(e) => { e.stopPropagation(); confirm(a.treatmentItemApptId); }}>예약 확정</button><button className="apx-qa-btn danger" onClick={(e) => { e.stopPropagation(); openCancel(a.treatmentItemApptId); }}>예약 취소</button></>);
    if (tab === TAB.UPCOMING) return (<><button className="apx-qa-btn primary" onClick={(e) => { e.stopPropagation(); complete(a.treatmentItemApptId); }}>진료완료</button><button className="apx-qa-btn danger" onClick={(e) => { e.stopPropagation(); openCancel(a.treatmentItemApptId); }}>예약 취소</button></>);
    return null;
  };

  const detailAnswers = detail ? toKakaoAnswers(detail.additionalInfos) : [];
  const detailBirth = detail ? formatBirth(detail.visitorBirth, detail.visitorRrn7) : null;
  const detailClosed = detail ? (isClosedStatus(detail.status) || isAutoClosed(detail.status, tab)) : false;
  const detailClosedReason = detail ? getClosedReason(detail.status, tab) : undefined;
  const detailClosedText = !detail ? '-' : !detailClosed ? '-' : detailClosedReason ? `${getClosedDate(detail)} / ${detailClosedReason}` : getClosedDate(detail);

  return (
    <>
      <div className="cn-header ap-header">
        <div className="cn-header-title">예약 신청 내역</div>
        <div className="ap-sub">등록한 진료항목으로 예약 받은 내역을 관리합니다.</div>
      </div>

      <div className="ap-body" data-policy-id="gcp1-appointment-channel">
        {/* 탭 — 실제는 카운트 배지 없이 heading5 텍스트만 */}
        <div className="apx-tabs">
          {(Object.values(TAB) as TabValue[]).map((v) => (
            <button key={v} className={`apx-tab${tab === v ? ' on' : ''}`} onClick={() => changeTab(v)} aria-pressed={tab === v}>
              {TAB_LABEL[v]}
            </button>
          ))}
        </div>

        {/* 기간·검색 필터 */}
        <div className="ap-filterbox">
          <div className="ap-frow">
            <span className="ap-flabel">기간</span>
            <div className="ap-presets">
              {DATE_PRESET_ORDER.map((v) => (
                <button key={v} className={`ap-preset${preset === v ? ' on' : ''}`} onClick={() => changePreset(v)}>
                  {v === DATE_PRESET.CUSTOM && <CalIcon />}{DATE_PRESET_LABEL[v]}
                </button>
              ))}
              {preset === DATE_PRESET.CUSTOM && (
                <span className="ap-daterange">
                  <input type="date" className="ap-date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setEndDate(e.target.value); }} />
                  <span className="ap-daterange-sep">-</span>
                  <input type="date" className="ap-date" value={endDate} min={startDate || undefined} onChange={(e) => setEndDate(e.target.value)} />
                </span>
              )}
            </div>
          </div>
          <div className="ap-frow">
            <span className="ap-flabel">검색</span>
            <div className="ap-search-group">
              <Dropdown value={searchType} options={SEARCH_TYPE_OPTIONS} onChange={(v) => { setSearchType(v as SearchType); setKeywordError(''); }} width={120} />
              <div className="apx-search-field">
                <div className={`ap-searchfield${keywordError ? ' error' : ''}`}>
                  <span className="ap-searchfield-ic"><SearchIcon /></span>
                  <input className="ap-searchfield-input" placeholder={SEARCH_TYPE_PLACEHOLDER[searchType]} value={keyword}
                    onChange={(e) => { setKeyword(e.target.value); if (keywordError) setKeywordError(''); }}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }} />
                </div>
                {keywordError && <p className="apx-search-error">{keywordError}</p>}
              </div>
            </div>
            {config.hasStatusFilter && (
              <div className="ap-status-group"><span className="ap-flabel sm">상태</span><Dropdown value={status} options={STATUS_FILTER_OPTIONS} onChange={(v) => { setStatus(v); setPage(1); }} width={140} /></div>
            )}
            <div className="ap-actions-btns">
              <button className="ap-reset" onClick={handleReset}>초기화</button>
              <button className="ap-submit" onClick={handleSearch}>검색</button>
            </div>
          </div>
        </div>

        {/* 테이블 — 연동 병원은 채널이 첫 열(84px·중앙정렬) */}
        <div className="apx-table-scroll">
          <div className={`apx-table${hospitalLinked ? ' has-channel' : ''}`}>
            <div className="apx-tr apx-th">
              {hospitalLinked && <span data-key="channel">채널</span>}
              <span data-key="status">상태</span>
              <span>{DATETIME_HEADER[tab]}</span>
              <span>진료항목</span>
              <span>방문자</span>
              <span>예약자</span>
              <span>요청사항</span>
            </div>
            {pageRows.length === 0 ? (
              <div className="apx-empty">
                <span className="apx-empty-ic">{isSearchApplied ? <SearchIcon /> : <CalIcon />}</span>
                <span className="apx-empty-msg">{isSearchApplied ? NO_RESULT_MESSAGE : EMPTY_MESSAGE[tab]}</span>
              </div>
            ) : pageRows.map((a) => (
              <div key={a.treatmentItemApptId} className="apx-tr apx-row" onClick={() => setDetailId(a.treatmentItemApptId)}>
                {hospitalLinked && <span data-key="channel"><ChannelBadge channel={deviceTypeToChannel(a.deviceType)} /></span>}
                <span data-key="status"><Tag tagCase={getStatusTagCase(a.status, tab)}>{getStatusLabel(a.status, tab)}</Tag></span>
                <span><TwoLineCell primary={formatVisit(a.visitDate, a.visitKoTime)} sub={config.getDate(a)} /></span>
                <span><TwoLineCell primary={a.treatmentItem.alias || a.treatmentItem.name || '-'} sub={formatTotalPrice(a.prices)} /></span>
                <span><TwoLineCell primary={a.visitorName} sub={formatPhoneNumber(a.visitorPhone)} /></span>
                <span><TwoLineCell primary={a.reserverName} sub={formatPhoneNumber(a.reserverPhone)} /></span>
                <span className="apx-memo">{a.reserverMemo || ''}</span>
                {/* 퀵 액션: 행 우측에 hover 시 노출(좌측 40px 페이드) */}
                {rowActions(a) && <span className="apx-row-actions" onClick={(e) => e.stopPropagation()}>{rowActions(a)}</span>}
              </div>
            ))}
          </div>
        </div>
        <div className="ap-total">전체 {rows.length}건</div>
        {totalPages > 1 && (
          <div className="apx-pagination">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button key={i} className={`apx-page${page === i + 1 ? ' on' : ''}`} onClick={() => setPage(i + 1)}>{i + 1}</button>
            ))}
          </div>
        )}
      </div>

      {/* 상세 모달 */}
      {detail && (
        <div className="ap-dim" onClick={() => setDetailId(null)}>
          <div className="ap-modal ap-detail" onClick={(e) => e.stopPropagation()}>
            <div className="ap-detail-head">
              <div className="ap-detail-eyebrow">예약 상세</div>
            </div>
            <div className="ap-detail-scroll">
              <div className="apx-sections">
                {/* ① 예약희망 · {탭 대표 일시} */}
                <Section title={`예약희망 · ${DATETIME_LABEL[tab]}`}>
                  <div className="apx-pad">
                    <div className="apx-rsv-head">
                      <Tag tagCase={getStatusTagCase(detail.status, tab)}>{getStatusLabel(detail.status, tab)}</Tag>
                      {hospitalLinked && <ChannelBadge channel={deviceTypeToChannel(detail.deviceType)} />}
                    </div>
                    <div className="apx-rsv-daterow">
                      <span className="apx-rsv-main">{formatVisit(detail.visitDate, detail.visitKoTime)}</span>
                      <span className="apx-rsv-sub">· {config.getDate(detail)}</span>
                    </div>
                  </div>
                  {isCanceledStatus(detail.status) && (
                    <div className="apx-card-footer"><Field label="취소사유">{detail.cancelMemo || '-'}</Field></div>
                  )}
                </Section>

                {/* ② 방문자 정보 */}
                <Section title="방문자 정보">
                  <div className="apx-pad">
                    <Field label="이름">{detail.visitorName}</Field>
                    <Field label="생년월일">
                      <span className="apx-birth">
                        <span className="apx-field-val">{detailBirth!.yymmdd}</span>
                        {detailBirth!.age !== null && <span className="apx-birth-sub">{`(만 ${detailBirth!.age}세${detailBirth!.gender ? `, ${detailBirth!.gender}` : ''})`}</span>}
                      </span>
                    </Field>
                    <Field label="연락처">{formatPhoneNumber(detail.visitorPhone)}</Field>
                  </div>
                </Section>

                {/* ③ 예약자 정보 — 방문자와 동일하면 태그 */}
                <Section title="예약자 정보" action={isSameAsVisitor(detail) ? <Tag tagCase="gray">방문자와 동일</Tag> : undefined}>
                  <div className="apx-pad">
                    <Field label="이름">{detail.reserverName}</Field>
                    <Field label="연락처">{formatPhoneNumber(detail.reserverPhone)}</Field>
                  </div>
                </Section>

                {/* ④ 요청사항 — 값이 있을 때만 섹션 자체를 렌더 */}
                {detail.reserverMemo && (
                  <Section title="요청사항"><div className="apx-pad apx-memo-box">{detail.reserverMemo}</div></Section>
                )}

                {/* ⑤ 카카오 추가 질문·답변 — 카카오 유입 + 데이터 있을 때만 */}
                {detailAnswers.length > 0 && (
                  <div className="apx-sec">
                    <div className="apx-sec-head"><span className="apx-sec-title">카카오톡 예약하기 추가 질문·답변</span></div>
                    <KakaoAnswers answers={detailAnswers} />
                  </div>
                )}

                {/* ⑥ 진료 정보 */}
                <Section title="진료 정보">
                  <div className="apx-pad apx-treat">
                    <div className="apx-treat-top">
                      <div className="apx-treat-name">
                        {isStandardTreatmentItem(detail.treatmentItem) && detail.treatmentItem.name && (
                          <span className="apx-treat-tag">{detail.treatmentItem.name}</span>
                        )}
                        <span className="apx-treat-title">{detail.treatmentItem.alias || detail.treatmentItem.name}</span>
                        {detail.treatmentItem.shortDescription && <span className="apx-treat-desc">{detail.treatmentItem.shortDescription}</span>}
                      </div>
                      {detail.treatmentItem.mainImage && <img className="apx-treat-thumb" src={detail.treatmentItem.mainImage} alt="" />}
                    </div>
                    {detail.prices.length > 0 && (
                      <div className="apx-price-list">
                        {detail.prices.map((p) => (
                          <div key={p.treatmentItemPriceId} className="apx-price-row">
                            <span className="apx-price-name">{p.title || '-'}</span>
                            <span className="apx-price-val">{formatPriceOption(p)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="apx-divider" />
                    <div className="apx-total-row">
                      <span className="apx-total-label">예상 결제 금액</span>
                      <span className="apx-total-val">{formatTotalPrice(detail.prices)}</span>
                    </div>
                  </div>
                  <div className="apx-card-footer apx-treat-footer">방문 후 상담을 통해 변경될 수 있어요</div>
                </Section>

                {/* ⑦ 상태 변경 이력 — 신청·확정·종료일시 3행 고정 */}
                <Section title="상태 변경 이력">
                  <div className="apx-pad">
                    <Field label="신청일시">{formatDateTime(detail.createdAt)}</Field>
                    <Field label="확정일시">{formatDateTime(detail.statusChangedAt)}</Field>
                    <Field label="종료일시">{detailClosedText}</Field>
                  </div>
                </Section>
              </div>
            </div>
            <div className="apx-detail-actions">
              <div className="apx-detail-actions-left">
                {(tab === TAB.REQUEST || tab === TAB.UPCOMING) && (
                  <button className="apx-btn danger-smooth" onClick={() => openCancel(detail.treatmentItemApptId)}>예약 취소</button>
                )}
              </div>
              <div className="apx-detail-actions-right">
                <button className="apx-btn secondary" onClick={() => setDetailId(null)}>닫기</button>
                {tab === TAB.REQUEST && <button className="apx-btn primary" onClick={() => confirm(detail.treatmentItemApptId)}>예약 확정</button>}
                {tab === TAB.UPCOMING && <button className="apx-btn primary" onClick={() => complete(detail.treatmentItemApptId)}>진료 완료</button>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 취소 사유 모달 — 실제는 라벨만 있는 라디오 목록 */}
      {cancelId != null && (
        <div className="ap-dim" onClick={() => setCancelId(null)}>
          <div className="ap-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ap-modal-title">예약 취소 사유를 선택해 주세요</div>
            <div className="ap-reason-radios">{CANCEL_REASON_TEMPLATES.map((t) => (
              <label key={t.id} className={`ap-reason-radio${cancelReasonId === t.id ? ' selected' : ''}`}>
                <input type="radio" name="cancelReason" checked={cancelReasonId === t.id} onChange={() => setCancelReasonId(t.id)} />
                <span className="ap-radio-dot" /><span>{t.label}</span>
              </label>
            ))}</div>
            <div className="ap-modal-btns"><button className="rg-btn-cancel" onClick={() => setCancelId(null)}>취소</button><button className="ap-btn-cancel-confirm" onClick={doCancel}>확인</button></div>
          </div>
        </div>
      )}
    </>
  );
}
/* ============================ 운영 설정 화면 ============================ */
/** 실제 개발 화면(non-payment-reservations/operation) 재현.
 *  구성 = 진료 예약 받기(BoxContainer + 운영중/미운영 라벨 토글, OFF 시 중지 확인 모달)
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
/** notice = 설정 박스 '안'에 들어가는 안내 블록. 제목·설명·토글 행 아래에 전체 폭으로 붙는다. */
function SettingBox({ title, subNode, right, notice, policyId }: { title: string; subNode: React.ReactNode; right: React.ReactNode; notice?: React.ReactNode; policyId?: string }) {
  return (
    <div className="set-box" data-policy-id={policyId}>
      <div className="set-box-head">
        <div className="set-box-left">
          <div className="set-box-title">{title}</div>
          <div className="set-box-sub">{subNode}</div>
        </div>
        <div className="set-box-right">{right}</div>
      </div>
      {notice}
    </div>
  );
}
function SettingsScreen({ itemCount, visibleCount, operation, hospitalLinked, onGlobalChange, onSettingChange, showToast, onHours }: {
  itemCount: number;
  visibleCount: number;
  operation: OperationSettings;
  hospitalLinked: boolean;
  onGlobalChange: (enabled: boolean) => void;
  onSettingChange: (key: 'autoConfirmed' | 'todayApptUsed' | 'newApptNotified') => void;
  showToast: (m: string) => void;
  onHours: () => void;
}) {
  const [stopOpen, setStopOpen] = useState(false);
  // [KAK-001] 자동 확정을 끄는 '결정의 순간'에 예외를 알린다. 상시 배너보다 인지 효과가 크다.
  const [autoConfirmOffOpen, setAutoConfirmOffOpen] = useState(false);
  const handleAutoConfirm = () => {
    if (hospitalLinked && operation.autoConfirmed) { setAutoConfirmOffOpen(true); return; }
    onSettingChange('autoConfirmed');
  };
  const confirmAutoConfirmOff = () => { setAutoConfirmOffOpen(false); onSettingChange('autoConfirmed'); };

  const handleApptUsed = () => {
    if (!operation.apptUsed) {
      // [명세] OFF→ON: 노출 중(굿닥 노출 ON) 진료항목이 0개면 예약을 받을 수 없어 차단
      if (visibleCount === 0) { showToast('노출 중인 진료항목이 없어, 진료 예약을 받을 수 없습니다.'); return; }
      onGlobalChange(true);
      showToast('진료 예약 받기를 시작했어요.');
      return;
    }
    setStopOpen(true);
  };
  const confirmStop = () => {
    onGlobalChange(false);
    setStopOpen(false);
    showToast('진료 예약 받기를 중지했어요.');
  };

  return (
    <>
      <div className="cn-header set-header">
        <div className="cn-header-title">진료 예약 설정</div>
        <div className="ap-sub">굿닥에 등록한 진료항목으로 예약을 받을 수 있습니다.</div>
      </div>

      <div className="set-body" data-policy-id="gcp1-operation-settings">
        {/* 진료 예약 받기 */}
        <SettingBox
          title="진료 예약 받기"
          subNode={<><span className="set-count">{itemCount}개의 진료항목이</span><span className="set-count-rest"> 등록되어 있어요.</span></>}
          right={
            <div className="set-status-toggle">
              <span className={`set-status${operation.apptUsed ? '' : ' off'}`}>{operation.apptUsed ? '운영중' : '미운영'}</span>
              <SettingToggle checked={operation.apptUsed} onChange={handleApptUsed} />
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
            <button type="button" className="set-banner-action" onClick={onHours}>
              병원 운영시간 관리<span className="set-banner-arrow"><ChevronR /></span>
            </button>
          </div>

          {/* [KAK-001] 예외 안내를 설정 박스 '안'에 넣는다 — 어느 설정의 예외인지 분리된 배너보다 확실하게 읽힌다. */}
          <SettingBox
            policyId="kak001-setting-scope"
            title="예약 자동 확정"
            subNode={
              <>
                자동 확정 사용 시, 별도 승인 없이 예약 신청과 동시에 자동으로 확정됩니다.
                {/* 자동 확정 ON일 때만 한 줄 안내. OFF면 아래 notice가 같은 내용을 더 자세히 말하므로 중복을 피한다. */}
                {hospitalLinked && operation.autoConfirmed && <span className="set-box-scope">{KAK_SETTING_SCOPE}</span>}
              </>
            }
            right={<SettingToggle checked={operation.autoConfirmed} onChange={handleAutoConfirm} />}
            notice={hospitalLinked && !operation.autoConfirmed ? (
              <div className="set-notice" role="note">
                <span className="set-notice-ic"><CautionIc /></span>
                <div className="set-notice-body">
                  <p className="set-notice-title">{KAK_BANNER_TITLE}</p>
                  <ul className="set-notice-list">
                    {KAK_BANNER_BULLETS.map((line) => <li key={line}>{line}</li>)}
                  </ul>
                </div>
              </div>
            ) : null}
          />
          <SettingBox
            title="당일 예약 허용"
            subNode="당일 예약 허용 시, 현재 시간 기준 1시간 이후부터 당일 예약을 받습니다."
            right={<SettingToggle checked={operation.todayApptUsed} onChange={() => onSettingChange('todayApptUsed')} />}
          />
          <SettingBox
            title="새 예약 알림 받기"
            subNode="굿닥과 카카오톡 예약하기의 새 예약이 발생하면, 이 PC에서 윈도우 알림을 받습니다. 환자에게는 굿닥 알림을 추가로 보내지 않습니다."
            right={<SettingToggle checked={operation.newApptNotified} onChange={() => onSettingChange('newApptNotified')} />}
          />
        </section>
      </div>

      {/* 예약 그만 받기 확인 모달 (실제 StopConfirmModal) */}
      {stopOpen && (
        <div className="ap-dim" onClick={() => setStopOpen(false)}>
          <div className="ap-modal set-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ap-modal-title">진료 예약을 그만 받으시겠어요?</div>
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

      {/* [KAK-001] 자동 확정 ON → OFF 전환 확인 모달. 취소하면 토글은 ON 그대로 유지된다. */}
      {autoConfirmOffOpen && (
        <div className="ap-dim" onClick={() => setAutoConfirmOffOpen(false)}>
          <div className="ap-modal set-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ap-modal-title">{KAK_MODAL_TITLE}</div>
            <div className="set-modal-body">{KAK_MODAL_BODY.map((line) => <p key={line}>{line}</p>)}</div>
            <div className="ap-modal-btns">
              <button className="rg-btn-cancel" onClick={() => setAutoConfirmOffOpen(false)}>취소</button>
              <button className="set-modal-confirm" onClick={confirmAutoConfirmOff}>{KAK_MODAL_CONFIRM}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ============================ 병원 운영시간 관리 ============================ */
type HourKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'weekdayLunch' | 'sat' | 'sun' | 'weekendLunch' | 'holiday';
type HourValue = { from: string; to: string; off: boolean; allDay?: boolean };
type HourForm = Record<HourKey, HourValue>;
type TempDay = { id: number; name: string; date: string; from: string; to: string; off: boolean; allDay: boolean };
const HOUR_DAY_META: { key: HourKey; label: string; section: '평일' | '주말' | '공휴일'; lunch?: boolean }[] = [
  { key: 'mon', label: '월요일', section: '평일' }, { key: 'tue', label: '화요일', section: '평일' },
  { key: 'wed', label: '수요일', section: '평일' }, { key: 'thu', label: '목요일', section: '평일' },
  { key: 'fri', label: '금요일', section: '평일' }, { key: 'weekdayLunch', label: '평일 점심시간', section: '평일', lunch: true },
  { key: 'sat', label: '토요일', section: '주말' }, { key: 'sun', label: '일요일', section: '주말' },
  { key: 'weekendLunch', label: '주말 점심시간', section: '주말', lunch: true },
  { key: 'holiday', label: '공휴일', section: '공휴일' }
];
const INITIAL_HOURS: HourForm = {
  mon: { from: '09:00', to: '18:00', off: false }, tue: { from: '09:00', to: '09:10', off: false },
  wed: { from: '09:00', to: '19:00', off: false }, thu: { from: '09:00', to: '19:00', off: false },
  fri: { from: '09:00', to: '19:00', off: false }, weekdayLunch: { from: '12:00', to: '22:00', off: false },
  sat: { from: '09:00', to: '16:00', off: false }, sun: { from: '09:00', to: '18:00', off: true },
  weekendLunch: { from: '12:00', to: '13:00', off: false }, holiday: { from: '09:00', to: '18:00', off: true }
};
const cloneHours = (value: HourForm): HourForm => JSON.parse(JSON.stringify(value));
const timeMinutes = (value: string) => { const [h, m] = value.split(':').map(Number); return h * 60 + m; };
const validTimeRange = (value: HourValue) => value.off || timeMinutes(value.to) - timeMinutes(value.from) >= 30;

function HoursScreen({ hours, setHours, notice, setNotice, tempDays, setTempDays, onScheduleChanged, showToast, onBack }: {
  hours: HourForm;
  setHours: React.Dispatch<React.SetStateAction<HourForm>>;
  notice: string;
  setNotice: React.Dispatch<React.SetStateAction<string>>;
  tempDays: TempDay[];
  setTempDays: React.Dispatch<React.SetStateAction<TempDay[]>>;
  onScheduleChanged: () => void;
  showToast: (m: string) => void;
  onBack: () => void;
}) {
  const [draft, setDraft] = useState<HourForm | null>(null);
  const [errors, setErrors] = useState<Partial<Record<HourKey, string>>>({});
  const [copySource, setCopySource] = useState<HourKey | null>(null);
  const [copyTargets, setCopyTargets] = useState<HourKey[]>([]);
  const [noticeDraft, setNoticeDraft] = useState<string | null>(null);
  const [tempOpen, setTempOpen] = useState(false);
  const [tempDraft, setTempDraft] = useState<TempDay[]>([]);
  const [tempError, setTempError] = useState('');

  const openHours = () => { setDraft(cloneHours(hours)); setErrors({}); };
  const patchDay = (key: HourKey, update: Partial<HourValue>) => {
    setDraft((prev) => prev ? { ...prev, [key]: { ...prev[key], ...update } } : prev);
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };
  const toggleAllDay = (key: HourKey) => {
    if (!draft) return;
    const enabled = !draft[key].allDay;
    patchDay(key, enabled ? { from: '00:00', to: '23:59', allDay: true, off: false } : { from: '09:00', to: '18:00', allDay: false });
  };
  const toggleOff = (key: HourKey) => {
    if (!draft) return;
    const off = !draft[key].off;
    patchDay(key, off ? { off: true, allDay: false } : { from: '09:00', to: '18:00', off: false });
  };
  const saveHours = () => {
    if (!draft) return;
    const invalid = HOUR_DAY_META.filter(({ key }) => !validTimeRange(draft[key]));
    if (invalid.length) {
      setErrors(Object.fromEntries(invalid.map(({ key }) => [key, '최소 30분 이상 입력해 주세요.'])));
      return;
    }
    setHours(cloneHours(draft)); setDraft(null); onScheduleChanged(); showToast('운영 시간을 저장했어요.');
  };
  const applyCopy = () => {
    if (!draft || !copySource || copyTargets.length === 0) return;
    const source = { ...draft[copySource] };
    setDraft((prev) => {
      if (!prev) return prev;
      const next = { ...prev };
      copyTargets.forEach((key) => { next[key] = { ...source }; });
      return next;
    });
    setCopySource(null); setCopyTargets([]); showToast('운영 시간을 복사했어요.');
  };
  const openTemp = () => { setTempDraft(tempDays.map((day) => ({ ...day }))); setTempError(''); setTempOpen(true); };
  const addTemp = () => {
    if (tempDraft.length >= 20) return;
    setTempDraft((prev) => [...prev, { id: UID++, name: '', date: '', from: '09:00', to: '18:00', off: false, allDay: false }]);
  };
  const patchTemp = (id: number, update: Partial<TempDay>) => setTempDraft((prev) => prev.map((day) => day.id === id ? { ...day, ...update } : day));
  const saveTemp = () => {
    const invalid = tempDraft.some((day) => !day.name.trim() || !day.date || (!day.off && timeMinutes(day.to) - timeMinutes(day.from) < 30));
    if (invalid) { setTempError('명칭과 날짜를 입력하고 운영 시간을 30분 이상 설정해 주세요.'); return; }
    setTempDays(tempDraft.map((day) => ({ ...day }))); setTempOpen(false); onScheduleChanged(); showToast('임시 운영일을 저장했어요.');
  };
  const displayTime = (value: HourValue) => value.off ? '휴진' : `${value.from} - ${value.to}`;

  return (
    <>
      <div className="cn-header ht-header">
        <button className="tk-back" onClick={onBack}><Back /> 진료 예약 설정</button>
        <div className="cn-header-title">운영 시간</div>
        <div className="ap-sub">굿닥에 노출되는 우리 병원 운영 시간을 관리할 수 있어요.</div>
      </div>
      <div className="ht-body">
        <section className="ht-guide">
          <div className="ht-guide-logo">g</div><div className="ht-guide-copy"><strong>굿닥에서 우리 병원 소개 페이지 보기</strong><span>굿닥 웹 · 앱에서 보여지는 우리 병원 소개 페이지를 확인해 보세요.</span></div>
          <button onClick={() => showToast('굿닥 앱의 병원 소개 페이지를 열었어요.')}>앱에서 보기</button><button onClick={() => showToast('굿닥 웹의 병원 소개 페이지를 열었어요.')}>웹에서 보기</button>
        </section>
        <section className="ht-section">
          <h2>운영 시간</h2>
          <button className="ht-card" onClick={openHours}>
            {(['평일', '주말', '공휴일'] as const).map((section) => (
              <div className="ht-block" key={section}><strong>{section}</strong><div className="ht-days">
                {HOUR_DAY_META.filter((day) => day.section === section && !day.lunch).map((day) => <div className="ht-display-row" key={day.key}><span>{day.label}</span><b>{displayTime(hours[day.key])}</b></div>)}
              </div>{HOUR_DAY_META.filter((day) => day.section === section && day.lunch).map((day) => <div className="ht-lunch" key={day.key}><span>{day.label}</span><b>{hours[day.key].off ? '점심시간 없음' : displayTime(hours[day.key])}</b></div>)}</div>
            ))}
            <div className="ht-notice-preview"><span>운영 시간 안내</span><b>{notice || '등록된 안내가 없어요.'}</b></div>
          </button>
          <button className="ht-notice-card" onClick={() => setNoticeDraft(notice)}><span>운영 시간 안내</span><b>{notice || '등록된 안내가 없어요.'}</b><ChevronR /></button>
        </section>
        <section className="ht-section ht-temp-section"><h2>임시 운영일</h2><p>평상시와 다르게 운영하는 날짜가 있다면 입력해주세요.</p>
          {tempDays.length > 0 && <div className="ht-temp-list">{tempDays.map((day) => <div key={day.id}><b>{day.date} · {day.name}</b><span>{day.off ? '휴진' : `${day.from} - ${day.to}`}</span></div>)}</div>}
          <button className="ht-register" onClick={openTemp}>등록하기</button>
        </section>
      </div>

      {draft && <div className="ap-dim" onClick={() => setDraft(null)}><div className="ap-modal ht-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ap-modal-title">운영 시간</div><div className="ap-modal-sub">굿닥 앱에 표시될 병원의 운영 시간을 설정해 주세요.</div>
        <div className="ht-form-scroll">{(['평일', '주말', '공휴일'] as const).map((section) => <section className="ht-form-section" key={section}><h3>{section}</h3>
          {HOUR_DAY_META.filter((day) => day.section === section).map((day) => <div className={`ht-form-row${errors[day.key] ? ' error' : ''}`} key={day.key}>
            <span className="ht-form-label">{day.label}</span><input type="time" value={draft[day.key].from} disabled={draft[day.key].off} onChange={(e) => patchDay(day.key, { from: e.target.value, allDay: false })}/><em>-</em><input type="time" value={draft[day.key].to} disabled={draft[day.key].off} onChange={(e) => patchDay(day.key, { to: e.target.value, allDay: false })}/>
            {day.lunch ? <label className="ht-check"><input type="checkbox" checked={draft[day.key].off} onChange={() => toggleOff(day.key)}/>점심시간 없음</label> : <><label className="ht-check"><input type="checkbox" checked={!!draft[day.key].allDay} onChange={() => toggleAllDay(day.key)}/>24시간</label><label className="ht-check"><input type="checkbox" checked={draft[day.key].off} onChange={() => toggleOff(day.key)}/>진료안함</label><button className="ht-copy" aria-label={`${day.label} 운영시간 복사`} onClick={() => { setCopySource(day.key); setCopyTargets([]); }}>▣</button></>}
            {errors[day.key] && <span className="ht-error">{errors[day.key]}</span>}
          </div>)}</section>)}</div>
        <div className="ap-modal-btns"><button className="rg-btn-cancel" onClick={() => setDraft(null)}>취소</button><button className="rg-btn-save" onClick={saveHours}>저장</button></div>
      </div></div>}

      {copySource && draft && <div className="ap-dim ht-nested" onClick={() => setCopySource(null)}><div className="ap-modal ht-copy-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ap-modal-title">운영 시간 복사</div><div className="ap-modal-sub">운영 시간이 같은 요일을 선택해 주세요.</div>
        <div className="ht-copy-banner">복사할 시간 : {displayTime(draft[copySource])}</div><div className="ht-copy-days">{HOUR_DAY_META.filter((day) => !day.lunch).map((day) => <button key={day.key} disabled={day.key === copySource} className={copyTargets.includes(day.key) ? 'on' : ''} onClick={() => setCopyTargets((prev) => prev.includes(day.key) ? prev.filter((key) => key !== day.key) : [...prev, day.key])}>{day.label === '공휴일' ? '공휴일' : day.label.slice(0, 1)}</button>)}</div>
        <div className="ap-modal-btns"><button className="rg-btn-cancel" onClick={() => setCopySource(null)}>취소</button><button className="rg-btn-save" disabled={copyTargets.length === 0} onClick={applyCopy}>복사</button></div>
      </div></div>}

      {noticeDraft !== null && <div className="ap-dim" onClick={() => setNoticeDraft(null)}><div className="ap-modal ht-notice-modal" onClick={(e) => e.stopPropagation()}><div className="ap-modal-title">운영 시간 안내</div><div className="ap-modal-sub">운영 시간 관련 기타 정보를 안내할 수 있어요.</div>
        <textarea maxLength={500} value={noticeDraft} onChange={(e) => setNoticeDraft(e.target.value)} placeholder={'어떤 내용을 써야 할지 고민되신다면, 아래 내용을 참고해 보세요.\n• 접수 마감 시간\n• 특수 검사/치료실 운영 시간\n• 점심시간 운영 방식\n• 예약 및 대기 안내'} /><div className="rg-counter"><span className="rg-counter-num">{noticeDraft.length}</span>/500자</div>
        <div className="ap-modal-btns"><button className="rg-btn-cancel" onClick={() => setNoticeDraft(null)}>취소</button><button className="rg-btn-save" onClick={() => { setNotice(noticeDraft); setNoticeDraft(null); showToast('운영 시간 안내를 저장했어요.'); }}>저장</button></div></div></div>}

      {tempOpen && <div className="ap-dim" onClick={() => setTempOpen(false)}><div className="ap-modal ht-temp-modal" onClick={(e) => e.stopPropagation()}><div className="ht-temp-head"><div><div className="ap-modal-title">임시 운영일 ({tempDraft.length}/20)</div><div className="ap-modal-sub">평상시와 다르게 운영하는 날짜가 있다면 등록해 주세요.</div></div><button className="ht-register" disabled={tempDraft.length >= 20} onClick={addTemp}><PlusIcon/> 임시 운영일 추가</button></div>
        <div className="ht-temp-scroll">{tempDraft.length === 0 ? <div className="ap-empty">등록된 임시 운영일이 없어요.</div> : tempDraft.map((day) => <div className="ht-temp-row" key={day.id}><div><input maxLength={5} placeholder="예)휴가,세미나" value={day.name} onChange={(e) => patchTemp(day.id, { name: e.target.value })}/><small>{day.name.length}/5자</small></div><input type="date" value={day.date} onChange={(e) => patchTemp(day.id, { date: e.target.value })}/><input type="time" disabled={day.off} value={day.from} onChange={(e) => patchTemp(day.id, { from: e.target.value, allDay: false })}/><em>-</em><input type="time" disabled={day.off} value={day.to} onChange={(e) => patchTemp(day.id, { to: e.target.value, allDay: false })}/><label className="ht-check"><input type="checkbox" checked={day.allDay} onChange={() => patchTemp(day.id, day.allDay ? { allDay: false, from: '09:00', to: '18:00' } : { allDay: true, off: false, from: '00:00', to: '23:59' })}/>24시간</label><label className="ht-check"><input type="checkbox" checked={day.off} onChange={() => patchTemp(day.id, { off: !day.off, allDay: false })}/>진료안함</label><button className="rg-price-del" aria-label="삭제" onClick={() => setTempDraft((prev) => prev.filter((item) => item.id !== day.id))}><CloseIcon/></button></div>)}</div>
        {tempError && <div className="ht-temp-error">{tempError}</div>}<div className="ap-modal-btns"><button className="rg-btn-cancel" onClick={() => setTempOpen(false)}>취소</button><button className="rg-btn-save" onClick={saveTemp}>저장</button></div></div></div>}
    </>
  );
}

/* ============================================================ */
function TiKakao() {
  const [page, setPage] = useState<Page>('items');
  const [items, setItems] = useState<Item[]>(INITIAL);
  const [appts, setAppts] = useState<Appt[]>(INITIAL_APPTS);
  const [operation, setOperation] = useState<OperationSettings>(INITIAL_OPERATION);
  const [hours, setHours] = useState<HourForm>(() => cloneHours(INITIAL_HOURS));
  const [hoursNotice, setHoursNotice] = useState('고길동 원장님은 점심 안드십니다.');
  const [tempDays, setTempDays] = useState<TempDay[]>([]);
  const hospitalLinked = true;
  const [failNextSync, setFailNextSync] = useState(false);
  const [focusAdditionalToken, setFocusAdditionalToken] = useState(0);
  const [screen, setScreen] = useState<'list' | 'form'>('list');
  const [selCat1, setSelCat1] = useState<string>('피부·미용');
  const [selId, setSelId] = useState<number | null>(null);
  const [d, setD] = useState<Item | null>(null);
  const [kw, setKw] = useState('');
  const [dragQ, setDragQ] = useState<number | null>(null);
  const [qTypeOpen, setQTypeOpen] = useState<number | null>(null);
  const [catOrder, setCatOrder] = useState<string[]>(CAT_ORDER);
  const [dragCat, setDragCat] = useState<string | null>(null);
  const [dragGroup, setDragGroup] = useState<string | null>(null);
  const [dragItemId, setDragItemId] = useState<number | null>(null);
  const [dragPriceId, setDragPriceId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [formBaseline, setFormBaseline] = useState('');
  const [formError, setFormError] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({}); // 저장 유효성 실패 필드별 메시지
  /* 분류 필드 (C안) */
  const [catSheet, setCatSheet] = useState(false);
  const [sheetC1, setSheetC1] = useState<string | null>(null);
  /** 분류 선택 모달 형태 비교 — 'cols' 좌우 2단(기본) / 'step' 대분류→중분류 단계형 */
  const [sheetMode, setSheetMode] = useState<'cols' | 'step'>('cols');
  /** 좌우 2단에서 좌측에 선택된 대분류 */
  const [colC1, setColC1] = useState<string>(TAXONOMY[0].name);
  /** 분류 검색어 — 대·중분류 명칭을 모두 훑고, 걸린 대분류는 자동으로 펼친다 */
  const [catQuery, setCatQuery] = useState('');
  const [nameOpen, setNameOpen] = useState(false);
  const [nameQuery, setNameQuery] = useState('');
  const [showPlanned, setShowPlanned] = useState(false);
  const [devMode, setDevMode] = useState(false);

  const showToast = (m: string) => { setToast(m); window.setTimeout(() => setToast(null), 2200); };
  const patch = (u: Partial<Item>) => setD((prev) => (prev ? { ...prev, ...u } : prev));
  const patchExtra = (u: Partial<Item['kExtra']>) => setD((prev) => (prev ? { ...prev, kExtra: { ...prev.kExtra, ...u } } : prev));
  const toggleKakaoDraft = () => setD((prev) => {
    if (!prev || !hospitalLinked) return prev;
    const kakaoOn = !prev.kakaoOn;
    if (!kakaoOn || prev.kExtra.initialized) return { ...prev, kakaoOn };
    return {
      ...prev,
      kakaoOn,
      kExtra: {
        ...prev.kExtra,
        initialized: true,
        displayName: prev.alias || prev.name,
        description: prev.intro || prev.detail,
        productImages: prev.hasImage && prev.kExtra.productImages.length === 0
          ? [{ id: UID++, url: '', description: '굿닥 진료항목 대표 이미지', fileName: '진료항목_대표이미지.jpg' }]
          : prev.kExtra.productImages
      }
    };
  });
  const clearErr = (...keys: string[]) => setErrors((e) => { if (!keys.some((k) => k in e)) return e; const n = { ...e }; keys.forEach((k) => delete n[k]); return n; });

  const cat1List = useMemo(() => catOrder.map((name) => ({ name, count: items.filter((i) => i.cat1 === name).length, custom: name === CUSTOM_CAT })).filter((c) => c.count > 0), [items, catOrder]);
  const groups = useMemo(() => {
    const inCat = items.filter((i) => i.cat1 === selCat1);
    const order: string[] = []; const map: Record<string, Item[]> = {};
    inCat.forEach((it) => { const k = it.cat2 || '기타'; if (!map[k]) { map[k] = []; order.push(k); } map[k].push(it); });
    return order.map((name) => ({ name, items: map[name] }));
  }, [items, selCat1]);
  const isCustom = selCat1 === CUSTOM_CAT;
  const customItems = useMemo(() => items.filter((i) => i.cat1 === selCat1), [items, selCat1]);

  const nav = (p: Page) => { setPage(p); if (p === 'items') setScreen('list'); };
  const cloneItem = (it: Item): Item => ({ ...it, prices: it.prices.map((p) => ({ ...p })), keywords: [...it.keywords], sync: { ...it.sync }, kExtra: { ...it.kExtra, productImages: it.kExtra.productImages.map((image) => ({ ...image })), descriptionImages: it.kExtra.descriptionImages.map((image) => ({ ...image })), questions: it.kExtra.questions.map((q) => ({ ...q, options: [...q.options] })) } });
  const open = (it: Item) => { const next = cloneItem(it); setErrors({}); setSelId(it.id); setD(next); setFormBaseline(JSON.stringify(next)); setFormError(''); setScreen('form'); };
  /* C안 — 신규 등록은 **분류를 비운 상태**로 시작한다.
   * 원래는 좌측에서 보고 있던 카테고리(selCat1/첫 그룹)를 그대로 물려줬는데, 그러면
   * 병원이 고르지도 않은 분류가 이미 박혀 있어 분류 필드가 무의미해진다. */
  const create = () => { const next = mk({ id: UID++, name: '', cat1: '', cat2: '' }); setErrors({}); setSelId(null); setD(next); setFormBaseline(JSON.stringify(next)); setFormError(''); setScreen('form'); };
  const closeForm = () => { setScreen('list'); setD(null); setLeaveOpen(false); setFormError(''); setErrors({}); };
  const requestCloseForm = () => { if (d && JSON.stringify(d) !== formBaseline) setLeaveOpen(true); else closeForm(); };
  // 저장 유효성 검증 — 카카오 상품 API required 필드 기준. 위반 필드별 메시지 맵을 반환(빈 객체면 통과).
  const collectErrors = (v: Item): Record<string, string> => {
    const e: Record<string, string> = {};
    if (!v.name.trim()) e['name'] = '진료항목명을 입력해 주세요.';
    /* C안 — 분류 필수 정책이 켜진 경우에만 저장을 막는다.
     * OFF 에서는 경고만 노출하고 저장을 허용한다(기존 미분류 재고 유예). */
    if (REQUIRE_CATEGORY && (!v.cat1 || v.cat1 === CUSTOM_CAT)) e['category'] = '분류를 선택해 주세요.';
    v.prices.forEach((p) => {
      if (!p.title.trim()) e[`price-${p.id}-title`] = '가격명을 입력해 주세요.';
      if (p.type === 'fixed' && !p.amount) e[`price-${p.id}-amount`] = '가격을 입력해 주세요.';
      if (p.type === 'discount') {
        if (!p.original || !p.sale) e[`price-${p.id}-amount`] = '정상가와 판매가를 입력해 주세요.';
        else if (Number(p.sale) >= Number(p.original)) e[`price-${p.id}-amount`] = '정상가보다 낮은 가격을 입력해 주세요.';
        else if (Number(p.sale) < Number(p.original) * 0.51) e[`price-${p.id}-amount`] = '최대 49%까지 할인할 수 있어요.';
      }
    });
    if (v.kakaoOn) {
      v.prices.forEach((p) => {
        if (p.title.length > 25) e[`price-${p.id}-kakao`] = '카카오 가격명은 최대 25자예요.';
        if (kakaoPriceDescription(p).length > PRICE_DESC_MAX) e[`price-${p.id}-kakao`] = `카카오 가격 안내 문구는 최종 ${PRICE_DESC_MAX}자 이하여야 해요.`;
      });
    }
    /* 발문(예약 시 받을 정보) 검증은 카카오 노출 토글과 무관하게, 카드가 보이는 병원(연동완료)에서 항상 적용한다.
     * - 카카오 전용 입력값은 토글 OFF에서도 보존·왕복되고, 실코드 zod(KakaoSettingSchema)도 linked와 무관하게 검증한다.
     * - 반대로 미연동 병원은 카드 자체가 없어 고칠 수단이 없으므로 검증 대상에서 제외한다.
     * 중복 검증은 입력 중 조용 → 포커스 아웃에서 안내하지만, 붙여넣기·항목 삭제로 빠져나간 경우의 최종 방어선. */
    if (hospitalLinked) {
      v.kExtra.questions.forEach((q) => {
        if (!q.name.trim()) e[`q-${q.id}-name`] = '질문 제목을 입력해 주세요.';
        if (q.type === 'text') return;
        if (q.options.length < K_Q_OPT_MIN) e[`q-${q.id}-options`] = `답변 항목을 ${K_Q_OPT_MIN}개 이상 입력해 주세요.`;
        else if (q.options.some((option) => !option.trim())) e[`q-${q.id}-options`] = '답변 항목을 모두 입력해 주세요.';
        duplicateOptionIndexes(q.options).forEach((index) => { e[dupOptKey(q.id, index)] = DUP_OPTION_MSG; });
      });
    }
    return e;
  };
  const save = () => {
    if (!d) return;
    const e = collectErrors(d);
    if (Object.keys(e).length) {
      setErrors(e);
      if (Object.keys(e).some((key) => key.includes('-opt-dup-'))) showToast(DUP_OPTION_TOAST);
      // 첫 오류 필드로 스크롤 (렌더 후)
      requestAnimationFrame(() => document.querySelector('.rg-input.error, .rg-num.error')?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
      return;
    }
    setErrors({});
    const shouldFail = d.kakaoOn && failNextSync;
    if (shouldFail) setFailNextSync(false);
    const wasLinked = d.sync.item !== 'NOT_LINKED';
    const effectiveKakao = d.kakaoOn && d.gdVisible && operation.apptUsed;
    const pendingSync: SyncInfo = d.kakaoOn
      ? !d.gdVisible && !wasLinked
        ? makeSync('NOT_LINKED')
        : {
          product: effectiveKakao ? 'PENDING' : 'ON_HOLD',
          item: wasLinked || d.gdVisible ? 'PENDING' : 'NOT_LINKED',
          price: wasLinked || d.gdVisible ? 'PENDING' : 'NOT_LINKED',
          schedule: effectiveKakao ? 'PENDING' : 'ON_HOLD',
          lastAt: '방금 전', attempts: d.sync.attempts, error: undefined
        }
      : wasLinked
        ? { ...d.sync, product: 'ON_HOLD', schedule: 'ON_HOLD', lastAt: '방금 전', error: undefined }
        : makeSync('NOT_LINKED');
    /* 분류를 안 고른 채 저장하면(필수 OFF) 목록의 '직접 입력 항목' 그룹으로 넣는다.
     * cat1 을 빈 문자열로 두면 어느 대분류 그룹에도 안 걸려 목록에서 사라진다. */
    const normalized: Item = !d.cat1 || d.cat1 === CUSTOM_CAT ? { ...d, cat1: CUSTOM_CAT, cat2: '' } : d;
    const saved = { ...normalized, sync: pendingSync, updatedAt: '2026.07.15' };
    setItems((prev) => (selId === null ? [...prev, saved] : prev.map((it) => (it.id === saved.id ? saved : it))));
    closeForm();
    showToast(selId === null ? '진료항목을 등록했어요.' : '진료항목을 저장했어요.');
    if (d.kakaoOn) {
      window.setTimeout(() => setItems((prev) => prev.map((item) => {
        if (item.id !== saved.id) return item;
        if (!d.gdVisible) return item;
        if (shouldFail) return { ...item, sync: { ...item.sync, item: 'SYNCED', product: operation.apptUsed ? 'SYNCED' : 'ON_HOLD', price: 'FAILED', schedule: operation.apptUsed ? 'SYNCED' : 'ON_HOLD', error: '가격 안내 정보를 카카오에 반영하지 못했어요. 굿닥 저장 내용은 유지됩니다.', attempts: item.sync.attempts + 1, lastAt: '방금 전' } };
        return { ...item, sync: { ...item.sync, item: 'SYNCED', price: 'SYNCED', product: operation.apptUsed ? 'SYNCED' : 'ON_HOLD', schedule: operation.apptUsed ? 'SYNCED' : 'ON_HOLD', error: undefined, lastAt: '방금 전' } };
      })), 700);
    }
  };
  const confirmDelete = () => {
    if (deleteId == null) return;
    const target = items.find((item) => item.id === deleteId);
    if (target && target.activeReservations > 0) {
      setItems((prev) => prev.map((item) => item.id === deleteId ? { ...item, gdVisible: false, kakaoOn: false, sync: { ...item.sync, product: 'ON_HOLD', schedule: 'ON_HOLD', lastAt: '방금 전' } } : item));
      if (d?.id === deleteId) closeForm();
      setDeleteId(null);
      showToast('활성 예약이 있어 삭제하지 않고 운영을 중지했어요.');
      return;
    }
    setItems((prev) => prev.filter((it) => it.id !== deleteId)); if (d?.id === deleteId) closeForm(); setDeleteId(null); showToast('진료항목을 삭제했어요.');
  };
  const addDetailImg = () => d && d.detailImages < DETAIL_IMG_MAX && patch({ detailImages: d.detailImages + 1 });
  const delDetailImg = () => d && d.detailImages > 0 && patch({ detailImages: d.detailImages - 1 });

  const addKw = () => { if (!d) return; const t = kw.trim(); if (t && d.keywords.length < KEYWORD_MAX && !d.keywords.includes(t)) patch({ keywords: [...d.keywords, t] }); setKw(''); };
  const setPrice = (id: number, u: Partial<Price>) => { if (!d) return; clearErr(`price-${id}-title`, `price-${id}-amount`, `price-${id}-kakao`); patch({ prices: d.prices.map((p) => (p.id === id ? { ...p, ...u } : p)) }); };
  const addPrice = () => {
    setFormError('');
    if (!d) return;
    if (d.prices.length >= PRICE_OPTION_MAX) { showToast(`가격 옵션은 최대 ${PRICE_OPTION_MAX}개까지 추가할 수 있어요.`); return; }
    patch({ prices: [...d.prices, { id: UID++, title: '', content: '', type: 'fixed', amount: '', original: '', sale: '' }] });
  };
  const delPrice = (id: number) => { setFormError(''); if (d) patch({ prices: d.prices.length > 1 ? d.prices.filter((p) => p.id !== id) : d.prices }); };
  const movePrice = (toId: number) => {
    if (!d || dragPriceId == null || dragPriceId === toId) return;
    const list = [...d.prices]; const from = list.findIndex((price) => price.id === dragPriceId); const to = list.findIndex((price) => price.id === toId);
    if (from < 0 || to < 0) return; const [moved] = list.splice(from, 1); list.splice(to, 0, moved); patch({ prices: list }); setDragPriceId(null);
  };
  const newQ = (type: QType): Question => ({ id: UID++, type, name: '', optional: true, description: '', options: type === 'text' ? [] : ['', ''] });
  const addQ = (type: QType) => d && patchExtra({ questions: [...d.kExtra.questions, newQ(type)] });
  const addQuestion = () => {
    if (!d) return;
    if (d.kExtra.questions.length >= K_Q_MAX) { showToast(`질문은 최대 ${K_Q_MAX}개까지 추가할 수 있어요.`); return; }
    addQ('radio');
  };
  /* 답변 항목 중복 오류 — 입력 중에는 지우고(타이핑 방해 금지), 포커스 아웃·항목 삭제·저장 시에 드러낸다. */
  const stripDupOptErrors = (base: Record<string, string>, questionId: number) => {
    const next = { ...base };
    Object.keys(next).forEach((key) => { if (key.startsWith(`q-${questionId}-opt-dup-`)) delete next[key]; });
    return next;
  };
  const revealDupOptErrors = (questionId: number, options: string[]) => setErrors((prev) => {
    const next = stripDupOptErrors(prev, questionId);
    duplicateOptionIndexes(options).forEach((index) => { next[dupOptKey(questionId, index)] = DUP_OPTION_MSG; });
    return next;
  });
  const setQ = (id: number, update: Partial<Question>) => {
    if (!d) return;
    clearErr(`q-${id}-name`, `q-${id}-options`);
    setErrors((prev) => stripDupOptErrors(prev, id));
    patchExtra({ questions: d.kExtra.questions.map((q) => q.id === id ? { ...q, ...update } : q) });
  };
  const setQKind = (id: number, kind: 'choice' | 'text') => {
    const q = d?.kExtra.questions.find((question) => question.id === id);
    if (!q) return;
    if (kind === 'text') {
      if (q.type === 'text') return;
      setQ(id, { type: 'text' });
      return;
    }
    if (q.type !== 'text') return;
    setQ(id, { type: 'radio', options: q.options.length >= K_Q_OPT_MIN ? q.options : ['', ''] });
  };
  const setQMultiple = (id: number, multiple: boolean) => {
    const q = d?.kExtra.questions.find((question) => question.id === id);
    if (q && q.type !== 'text') setQ(id, { type: multiple ? 'select' : 'radio' });
  };
  const moveQ = (from: number, to: number) => {
    if (!d || from === to) return;
    const questions = [...d.kExtra.questions]; const [moved] = questions.splice(from, 1); questions.splice(to, 0, moved); patchExtra({ questions });
  };
  const delQ = (id: number) => d && patchExtra({ questions: d.kExtra.questions.filter((q) => q.id !== id) });
  const addOpt = (id: number) => {
    const q = d?.kExtra.questions.find((question) => question.id === id);
    if (q && q.options.length < K_Q_OPT_MAX) setQ(id, { options: [...q.options, ''] });
  };
  const setOpt = (id: number, index: number, value: string) => {
    const q = d?.kExtra.questions.find((question) => question.id === id);
    if (q) setQ(id, { options: q.options.map((option, i) => i === index ? value : option) });
  };
  const delOpt = (id: number, index: number) => {
    const q = d?.kExtra.questions.find((question) => question.id === id);
    if (!q || q.options.length <= K_Q_OPT_MIN) return;
    const nextOptions = q.options.filter((_, i) => i !== index);
    setQ(id, { options: nextOptions });
    revealDupOptErrors(id, nextOptions);
  };
  const addKakaoImage = (key: KakaoImageKey, fileName?: string) => {
    if (!d || d.kExtra[key].length >= K_IMAGE_MAX) return;
    patchExtra({ [key]: [...d.kExtra[key], { id: UID++, url: '', description: '', fileName }] } as Partial<KakaoExtra>);
  };
  const addKakaoFiles = (key: KakaoImageKey, files: FileList | null) => {
    if (!d || !files?.length) return;
    const available = K_IMAGE_MAX - d.kExtra[key].length;
    const added = Array.from(files).slice(0, available).map((file) => ({ id: UID++, url: '', description: '', fileName: file.name }));
    patchExtra({ [key]: [...d.kExtra[key], ...added] } as Partial<KakaoExtra>);
  };
  const updateKakaoImage = (key: KakaoImageKey, id: number, update: Partial<KakaoImage>) => {
    if (!d) return;
    patchExtra({ [key]: d.kExtra[key].map((image) => image.id === id ? { ...image, ...update } : image) } as Partial<KakaoExtra>);
  };
  const deleteKakaoImage = (key: KakaoImageKey, id: number) => {
    if (!d) return;
    patchExtra({ [key]: d.kExtra[key].filter((image) => image.id !== id) } as Partial<KakaoExtra>);
  };
  const moveKakaoImage = (key: KakaoImageKey, index: number, offset: -1 | 1) => {
    if (!d) return;
    const nextIndex = index + offset;
    if (nextIndex < 0 || nextIndex >= d.kExtra[key].length) return;
    const images = [...d.kExtra[key]];
    [images[index], images[nextIndex]] = [images[nextIndex], images[index]];
    patchExtra({ [key]: images } as Partial<KakaoExtra>);
  };
  const toggleGdVisible = (id: number) => setItems((prev) => prev.map((it) => {
    if (it.id !== id) return it;
    const gdVisible = !it.gdVisible;
    showToast(gdVisible ? '해당 진료항목을 서비스에 노출합니다.' : '해당 진료항목을 서비스에 미노출합니다.');
    return gdVisible
      ? { ...it, gdVisible, sync: it.kakaoOn ? { ...it.sync, product: operation.apptUsed ? 'PENDING' : 'ON_HOLD', item: 'PENDING', price: 'PENDING', schedule: operation.apptUsed ? 'PENDING' : 'ON_HOLD', lastAt: '방금 전' } : it.sync }
      : { ...it, gdVisible, sync: it.sync.item === 'NOT_LINKED' ? it.sync : { ...it.sync, product: 'ON_HOLD', schedule: 'ON_HOLD', lastAt: '방금 전' } };
  }));
  const changeGlobalOperation = (enabled: boolean) => {
    const nextVersion = operation.version + 1;
    setOperation((prev) => ({ ...prev, apptUsed: enabled, version: nextVersion, syncState: hospitalLinked ? 'PENDING' : 'SYNCED', error: undefined, lastAt: '방금 전' }));
    setItems((prev) => prev.map((item) => {
      if (!item.kakaoOn || !item.gdVisible) return item;
      if (!enabled) return { ...item, sync: { ...item.sync, product: 'ON_HOLD', schedule: 'ON_HOLD', lastAt: '방금 전' } };
      if (syncSummary(item.sync) === 'FAILED') return item;
      return { ...item, sync: { ...item.sync, product: 'PENDING', schedule: 'PENDING', lastAt: '방금 전' } };
    }));
    window.setTimeout(() => {
      setItems((prev) => prev.map((item) => {
        if (!enabled || !item.kakaoOn || !item.gdVisible || syncSummary(item.sync) === 'FAILED') return item;
        return { ...item, sync: { ...item.sync, product: 'SYNCED', schedule: 'SYNCED', lastAt: '방금 전' } };
      }));
      setOperation((prev) => ({ ...prev, appliedVersion: nextVersion, syncState: 'SYNCED', error: undefined, lastAt: '방금 전' }));
    }, 700);
  };
  const changeOperationSetting = (key: 'autoConfirmed' | 'todayApptUsed' | 'newApptNotified') => {
    const before = operation[key];
    const nextVersion = operation.version + 1;
    const requiresExternal = hospitalLinked && key !== 'newApptNotified';
    const shouldFail = requiresExternal && failNextSync;
    if (shouldFail) setFailNextSync(false);
    setOperation((prev) => ({ ...prev, [key]: !before, version: nextVersion, syncState: requiresExternal ? 'PENDING' : 'SYNCED', appliedVersion: requiresExternal ? prev.appliedVersion : nextVersion, error: undefined, lastAt: '방금 전' }));
    if (key === 'todayApptUsed') setItems((prev) => prev.map((item) => item.kakaoOn ? { ...item, sync: { ...item.sync, schedule: 'PENDING', lastAt: '방금 전' } } : item));
    showToast(key === 'newApptNotified' ? '새 예약 알림 설정을 저장했어요.' : '설정을 저장했어요.');
    if (!requiresExternal) return;
    window.setTimeout(() => {
      if (shouldFail) {
        setOperation((prev) => ({ ...prev, [key]: before, syncState: 'FAILED', error: '카카오 설정 반영에 실패해 이 설정만 이전 값으로 되돌렸어요.', lastAt: '방금 전' }));
        if (key === 'todayApptUsed') setItems((prev) => prev.map((item) => item.kakaoOn ? { ...item, sync: { ...item.sync, schedule: 'FAILED', error: 'Schedule 설정 반영에 실패했어요.', lastAt: '방금 전' } } : item));
        return;
      }
      setOperation((prev) => ({ ...prev, appliedVersion: nextVersion, syncState: 'SYNCED', error: undefined, lastAt: '방금 전' }));
      if (key === 'todayApptUsed') setItems((prev) => prev.map((item) => item.kakaoOn ? { ...item, sync: { ...item.sync, schedule: operation.apptUsed ? 'SYNCED' : 'ON_HOLD', error: undefined, lastAt: '방금 전' } } : item));
    }, 650);
  };
  const syncSchedulesAfterHoursChange = () => {
    const shouldFail = hospitalLinked && failNextSync;
    if (shouldFail) setFailNextSync(false);
    setItems((prev) => prev.map((item) => item.kakaoOn ? { ...item, sync: { ...item.sync, schedule: operation.apptUsed ? 'PENDING' : 'ON_HOLD', error: undefined, lastAt: '방금 전' } } : item));
    if (!hospitalLinked || !operation.apptUsed) return;
    window.setTimeout(() => setItems((prev) => prev.map((item) => {
      if (!item.kakaoOn || item.sync.schedule !== 'PENDING') return item;
      return shouldFail
        ? { ...item, sync: { ...item.sync, schedule: 'FAILED', error: '변경한 운영 시간의 Schedule 반영에 실패했어요.', attempts: item.sync.attempts + 1, lastAt: '방금 전' } }
        : { ...item, sync: { ...item.sync, schedule: 'SYNCED', error: undefined, lastAt: '방금 전' } };
    })), 650);
  };
  const moveCategory = (to: string) => {
    if (!dragCat || dragCat === to) return;
    setCatOrder((prev) => { const next = [...prev]; const fromIndex = next.indexOf(dragCat); const toIndex = next.indexOf(to); const [moved] = next.splice(fromIndex, 1); next.splice(toIndex, 0, moved); return next; }); setDragCat(null);
  };
  const moveItem = (toId: number) => {
    if (dragItemId == null || dragItemId === toId) return;
    setItems((prev) => { const next = [...prev]; const from = next.findIndex((item) => item.id === dragItemId); const to = next.findIndex((item) => item.id === toId); if (from < 0 || to < 0 || next[from].cat1 !== next[to].cat1 || next[from].cat2 !== next[to].cat2) return prev; const [moved] = next.splice(from, 1); next.splice(to, 0, moved); return next; }); setDragItemId(null);
  };
  const moveGroup = (toName: string) => {
    if (!dragGroup || dragGroup === toName) return;
    setItems((prev) => { const inCategory = prev.filter((item) => item.cat1 === selCat1); const names = Array.from(new Set(inCategory.map((item) => item.cat2 || '기타'))); const from = names.indexOf(dragGroup); const to = names.indexOf(toName); if (from < 0 || to < 0) return prev; const [moved] = names.splice(from, 1); names.splice(to, 0, moved); const sorted = names.flatMap((name) => inCategory.filter((item) => (item.cat2 || '기타') === name)); let index = 0; return prev.map((item) => item.cat1 === selCat1 ? sorted[index++] : item); }); setDragGroup(null);
  };

  const deleteTarget = deleteId == null ? null : items.find((item) => item.id === deleteId) || null;
  const currentView: PrototypeView = page === 'items' ? (screen === 'form' ? 'items-form' : 'items-list') : page === 'hours' ? 'settings' : page;
  const locatePolicyChange = (change: PolicyChange) => {
    if (change.view === 'items-list') { setPage('items'); setScreen('list'); }
    if (change.view === 'items-form') {
      setPage('items');
      const targetItem = items.find((item) => item.kakaoOn) || items[0];
      if (targetItem) open(targetItem);
    }
    if (change.view === 'appt') {
      setPage('appt');
      if (change.targetId === 'gcp1-appointment-additional-answers') setFocusAdditionalToken((value) => value + 1);
    }
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
            {/* ========================= 예약 신청 내역 ========================= */}
            {page === 'appt' && <ApptScreen appts={appts} setAppts={setAppts} hospitalLinked={hospitalLinked} failNextSync={failNextSync} consumeFailure={() => setFailNextSync(false)} focusAdditionalToken={focusAdditionalToken} showToast={showToast} />}

            {/* ========================= 운영 설정 ========================= */}
            {page === 'settings' && <SettingsScreen itemCount={items.length} visibleCount={items.filter((it) => it.gdVisible).length} operation={operation} hospitalLinked={hospitalLinked} onGlobalChange={changeGlobalOperation} onSettingChange={changeOperationSetting} showToast={showToast} onHours={() => setPage('hours')} />}

            {/* ========================= 병원 운영시간 관리 ========================= */}
            {page === 'hours' && <HoursScreen hours={hours} setHours={setHours} notice={hoursNotice} setNotice={setHoursNotice} tempDays={tempDays} setTempDays={setTempDays} onScheduleChanged={syncSchedulesAfterHoursChange} showToast={showToast} onBack={() => setPage('settings')} />}

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

                <div className="tk-list-body" data-policy-id="gcp1-channel-overview">
                  <div className="tk-grid">
                    <div className="tk-grid-chead"><span className="tk-grid-title">카테고리</span></div>
                    <div className="tk-grid-ihead"><span className="tk-grid-title">{selCat1}</span></div>
                    <nav className="tk-grid-clist" aria-label="진료항목 카테고리">
                      {cat1List.map((c) => (
                        <button key={c.name} draggable className={`tk-cat${c.name === selCat1 ? ' sel' : ''}`} onClick={() => setSelCat1(c.name)} onDragStart={() => setDragCat(c.name)} onDragOver={(e) => e.preventDefault()} onDrop={() => moveCategory(c.name)}>
                          <span className="tk-cat-handle"><DragHandle /></span>
                          <span className="tk-cat-name">{c.name}</span>
                          <span className="tk-cat-count">{c.count}</span>
                        </button>
                      ))}
                    </nav>
                    <section className="tk-grid-ilist">
                      {isCustom ? (
                        <>
                        {/* C안 — 미분류 재고는 환자 검색에 안 잡힌다는 사실을 목록에서 알린다 */}
                        <div className="tc-list-banner">
                          <WarnIc />
                          <span>
                            <b>분류가 없어 환자 검색에 노출되지 않는 항목 {customItems.length}개</b>예요. 항목을 열어 분류를 지정하면 카테고리 검색에 잡힙니다.
                          </span>
                        </div>
                        <div className="tk-l2-body">{customItems.map((it) => (<ItemRow key={it.id} it={it} hospitalLinked={hospitalLinked} onOpen={() => open(it)} onToggle={() => toggleGdVisible(it.id)} onDelete={() => setDeleteId(it.id)} onDragStart={() => setDragItemId(it.id)} onDrop={() => moveItem(it.id)} />))}</div>
                        </>
                      ) : (
                        groups.map((g) => (
                          <div key={g.name} className="tk-l2" draggable onDragStart={() => setDragGroup(g.name)} onDragOver={(e) => e.preventDefault()} onDrop={() => moveGroup(g.name)}>
                            <div className="tk-l2-head"><span className="tk-cat-handle"><DragHandle /></span><span className="tk-l2-name">{g.name}</span></div>
                            <div className="tk-l2-body">{g.items.map((it) => (<ItemRow key={it.id} it={it} hospitalLinked={hospitalLinked} onOpen={() => open(it)} onToggle={() => toggleGdVisible(it.id)} onDelete={() => setDeleteId(it.id)} onDragStart={() => setDragItemId(it.id)} onDrop={() => moveItem(it.id)} />))}</div>
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
                  <button className="tk-back" onClick={requestCloseForm}><Back /> 목록</button>
                  <div className="rg-eyebrow">진료항목</div>
                  <div className="cn-header-title">{selId === null ? '진료항목 등록' : '진료항목 정보'}</div>
                </div>

                <div className="rg-container">
                  <div className="rg-form">
                    {formError && <div className="tk-form-error"><WarnIc />{formError}</div>}
                    <section className="rg-card required">
                      <div className="rg-group-title">필수 정보</div>
                      {/* 진료항목명 — 병원이 부르는 이름. 자유 입력. (C안) */}
                      <div className="rg-field">
                        <FieldHead
                          label="진료항목명"
                          helpers={[
                            '병원에서 부르는 이름 그대로 입력해 주세요.',
                            '검색해서 굿닥 표준 진료항목을 고르면 아래 분류가 함께 채워집니다.',
                          ]}
                        />
                        <div className="tc-anchor">
                          <div className="rg-search">
                            <input
                              className={`rg-input${errors.name ? ' error' : ''}`}
                              placeholder="진료항목명을 입력하거나 검색해 주세요."
                              maxLength={50}
                              value={d.name}
                              onFocus={() => {
                                setNameOpen(true);
                                setNameQuery(d.name);
                              }}
                              onChange={(e) => {
                                patch({ name: e.target.value });
                                setNameQuery(e.target.value);
                                setNameOpen(true);
                                clearErr('name');
                              }}
                            />
                            <span className="rg-search-ic"><SearchIcon /></span>
                          </div>

                          {/* 자동완성 — 표준 항목을 고르면 이름 + 분류 동시 확정 */}
                          {nameOpen && (
                            <div className="tc-layer">
                              {nameQuery.trim().length === 0 ? (
                                <div className="tc-layer-guide">공식 진료명·시술명으로 검색해 보세요. 예) 임플란트, 도수치료, 가다실 9가</div>
                              ) : searchMasters(nameQuery).length > 0 ? (
                                <div className="tc-layer-list">
                                  {searchMasters(nameQuery).map((sg) => (
                                    <button
                                      key={`${sg.c1}-${sg.c2}-${sg.c3}`}
                                      className="tc-sug"
                                      onClick={() => {
                                        patch({ name: sg.c3, cat1: sg.c1, cat2: sg.c2 });
                                        clearErr('name', 'category');
                                        setNameOpen(false);
                                      }}
                                    >
                                      <span className="tc-dim">{sg.c1}</span>
                                      <span className="tc-sep">›</span>
                                      <span className="tc-dim">{sg.c2}</span>
                                      <span className="tc-sep">›</span>
                                      <span className="tc-strong">{sg.c3}</span>
                                    </button>
                                  ))}
                                </div>
                              ) : (
                                <div className="tc-layer-guide">일치하는 표준 진료항목이 없어요. 입력한 이름을 그대로 쓸 수 있어요.</div>
                              )}
                              <div className="tc-layer-foot">
                                <button className="tc-layer-btn" onClick={() => setNameOpen(false)}>
                                  {d.name.trim() ? (
                                    <>‘<b>{d.name.trim()}</b>’ 이름으로 쓰기</>
                                  ) : (
                                    <>닫기</>
                                  )}
                                </button>
                                <span className="tc-layer-note">이름만 정해집니다. 분류는 아래에서 따로 골라요.</span>
                              </div>
                            </div>
                          )}
                        </div>
                        {errors.name && <p className="rg-error">{errors.name}</p>}
                      </div>

                      {/* 분류 — 굿닥 표준 진료항목의 대분류 › 중분류. 이름과 분리된 별도 필드. (C안) */}
                      <div className="rg-field">
                        <FieldHead
                          label="분류"
                          helpers={['환자가 카테고리로 찾을 때 쓰입니다. 진료항목명과 별개로 지정해 주세요.']}
                        />
                        {(() => {
                          const hasCat = !!d.cat1 && d.cat1 !== CUSTOM_CAT;
                          const recos = hasCat ? [] : suggestCategories(d.name);
                          return (
                            <>
                              <div className={`tc-cat-field${errors.category ? ' err' : ''}${hasCat ? ' filled' : ''}`}>
                                {hasCat ? (
                                  <span className="tc-cat-value">{d.cat1} › {d.cat2}</span>
                                ) : (
                                  <span className="tc-cat-empty">분류를 선택해 주세요.</span>
                                )}
                                <button
                                  className="tc-cat-btn"
                                  onClick={() => {
                                    setSheetC1(null);
                                    setCatQuery('');
                                    const has = d.cat1 && d.cat1 !== CUSTOM_CAT;
                                    setColC1(has ? d.cat1 : TAXONOMY[0].name);
                                    setCatSheet(true);
                                  }}
                                >
                                  {hasCat ? '변경' : '선택'}
                                </button>
                              </div>

                              {recos.length > 0 && (
                                <div className="tc-reco">
                                  <div className="tc-reco-lead">이름을 보니 이 분류일 것 같아요</div>
                                  {recos.map((r) => (
                                    <button
                                      key={`${r.c1}-${r.c2}`}
                                      className="tc-reco-btn"
                                      onClick={() => {
                                        patch({ cat1: r.c1, cat2: r.c2 });
                                        clearErr('category');
                                      }}
                                    >
                                      <span className="tc-reco-path">{r.c1} › {r.c2}</span>
                                      <span className="tc-reco-cta">여기에 넣기</span>
                                    </button>
                                  ))}
                                </div>
                              )}

                              {!hasCat && (
                                <div className="tc-warn">
                                  <WarnIc />
                                  <span>
                                    분류가 없으면{' '}
                                    <b>{recos.length > 0 ? `‘${recos[0].c2}’${roSuffix(recos[0].c2)}` : '카테고리로'}</b>{' '}
                                    검색하는 환자에게 노출되지 않아요.
                                  </span>
                                </div>
                              )}
                              {errors.category && <p className="rg-error">{errors.category}</p>}
                            </>
                          );
                        })()}
                      </div>
                      <div className="rg-field price" data-policy-id="gcp1-kakao-price">
                        <FieldHead label="가격 정보" helpers={['환자에게 보여줄 가격 정보를 설정해 주세요. (예: 횟수별, 시술명별 등)']} />
                        <div className="rg-price-list">{d.prices.map((p) => (<PriceRow key={p.id} p={p} onChange={(u) => setPrice(p.id, u)} onDelete={() => delPrice(p.id)} onDragStart={() => setDragPriceId(p.id)} onDrop={() => movePrice(p.id)} titleErr={errors[`price-${p.id}-title`]} amountErr={errors[`price-${p.id}-amount`]} />))}</div>
                      </div>
                      <div className="rg-add-wrap">{d.prices.length < PRICE_OPTION_MAX
                        ? <button className="rg-add-btn" onClick={addPrice}><PlusIcon /> 가격 옵션 추가</button>
                        : <div className="rg-help">가격 옵션은 최대 {PRICE_OPTION_MAX}개까지 추가할 수 있어요.</div>}
                      </div>
                    </section>

                    <section className="rg-card extra" data-policy-id="gcp1-kakao-product-copy">
                      <div className="rg-group-title">추가 정보</div>
                      <div className="rg-field" data-policy-id="gcp1-kakao-product-images">
                        <FieldHead label="대표 사진" optional helpers={['진료항목을 대표하는 사진을 업로드해 주세요.']} />
                        {d.hasImage ? <div className="tk-thumb"><span>대표 이미지</span><button onClick={() => patch({ hasImage: false })} aria-label="삭제"><CloseIcon /></button></div> : <button className="rg-upload" onClick={() => patch({ hasImage: true })}><PhotoIcon /><span className="rg-upload-label">사진 추가</span></button>}
                      </div>
                      <div className="rg-field">
                        <FieldHead label="진료항목 노출명" optional helpers={['비워두면 진료항목명과 동일하게 노출됩니다.']} />
                        <input className="rg-input" placeholder="진료항목 노출명을 입력해 주세요." maxLength={ALIAS_MAX} value={d.alias} onChange={(e) => patch({ alias: e.target.value })} />
                        <div className="rg-counter"><span className="rg-counter-num">{d.alias.length}</span>/{ALIAS_MAX}자</div>
                      </div>
                      <div className="rg-field">
                        <FieldHead label="한 줄 소개" optional helpers={['진료항목을 한눈에 이해할 수 있는 짧은 소개 문구를 입력해 주세요.']} />
                        <input className="rg-input" placeholder="한 줄 소개를 입력해 주세요." maxLength={INTRO_MAX} value={d.intro} onChange={(e) => patch({ intro: e.target.value })} />
                        <div className="rg-counter"><span className="rg-counter-num">{d.intro.length}</span>/{INTRO_MAX}자</div>
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
                        <div className="rg-counter"><span className="rg-counter-num">{d.keywords.length}</span>/{KEYWORD_MAX}개</div>
                      </div>
                    </section>

                    {/* 카카오톡 예약하기에서도 보이기 */}
                    {hospitalLinked && <section className="tk-platform-section" data-policy-id="gcp1-channel-visibility">
                      <h2 className="tk-platform-title">외부 플랫폼 정보</h2>
                      <div className="rg-card tk-kcard">
                        <div className="tk-khead">
                          <div className="tk-khead-left"><span className="tk-khead-badge"><KakaoMark /></span><div className="tk-khead-text">
                            <div className="tk-khead-title">카카오톡 예약하기에서도 보이기</div>
                            <div className="tk-khead-desc">카카오톡 예약하기에도 상품을 노출하고 예약을 받아요.</div>
                            {/* [KAK-001] 병원이 수동 확정일 때만 — "이 토글을 켜면 어떻게 되는지"의 일부로 읽히도록 토글 설명 자리에 둔다. */}
                            {!operation.autoConfirmed && <div className="tk-khead-note" data-policy-id="kak001-item-toggle-help">{KAK_TOGGLE_HELP}</div>}
                          </div></div>
                          <div className="tk-khead-right">
                            <button className={`rg-toggle${d.kakaoOn ? '' : ' off'}`} aria-label="카카오톡 예약하기에서도 보이기" aria-pressed={d.kakaoOn} onClick={toggleKakaoDraft}><span className="rg-toggle-knob" /></button>
                          </div>
                        </div>
                        <div className="tk-kbody">
                          {!d.gdVisible ? (
                            <div className="tk-kpolicy-alert" role="note"><span className="tk-kpolicy-alert-ic"><CautionIc /></span><span>굿닥에 노출 중인 진료항목만 카카오톡 예약하기에도 노출할 수 있어요.</span></div>
                          ) : !d.kakaoOn ? (
                            <div className="tk-kpolicy-alert" role="note"><span className="tk-kpolicy-alert-ic"><CautionIc /></span><span>카카오톡 예약하기에 노출하려면 ‘우측 상단 스위치’를 켜주세요.</span></div>
                          ) : (
                            <div className="tk-kauto" role="note"><span className="tk-kauto-ic"><CautionIc /></span><span className="tk-kauto-txt">위에 입력한 진료항목 정보가 카카오톡 예약하기에도 함께 표시돼요.</span></div>
                          )}
                          <div className="tk-kextra">
                              <div className="tk-kfield">
                                <div className="tk-klabel">예약 시 받을 정보 <span className="rg-optional">(선택)</span></div>
                                {d.kExtra.questions.map((q, idx) => (
                                  <div key={q.id} className={`tk-q-item${dragQ === idx ? ' dragging' : ''}`}
                                    onDragOver={(e) => { if (dragQ !== null) e.preventDefault(); }}
                                    onDrop={() => { if (dragQ !== null) moveQ(dragQ, idx); setDragQ(null); }}>
                                    <div className="tk-q-drag" draggable onDragStart={() => setDragQ(idx)} onDragEnd={() => setDragQ(null)} aria-label="순서 변경 핸들"><DragHandle /></div>
                                    <div className="rg-select-wrap tk-q-typesel">
                                      <button type="button" className={`rg-select tk-q-typebtn${qTypeOpen === q.id ? ' open' : ''}`} onClick={() => setQTypeOpen((openId) => openId === q.id ? null : q.id)}>{q.type === 'text' ? '주관식' : '객관식'}<span className="rg-select-ic"><SelectArrow /></span></button>
                                      {qTypeOpen === q.id && (
                                        <div className="rg-select-menu" onMouseLeave={() => setQTypeOpen(null)}>
                                          <button type="button" className={`rg-select-opt${q.type !== 'text' ? ' active' : ''}`} onClick={() => { setQKind(q.id, 'choice'); setQTypeOpen(null); }}>객관식</button>
                                          <button type="button" className={`rg-select-opt${q.type === 'text' ? ' active' : ''}`} onClick={() => { setQKind(q.id, 'text'); setQTypeOpen(null); }}>주관식</button>
                                        </div>
                                      )}
                                    </div>
                                    <div className="tk-q-namefield">
                                      <div className="tk-q-qrow">
                                        <input className={`rg-input${errors[`q-${q.id}-name`] ? ' error' : ''}`} placeholder={`질문 입력 (최대 ${K_Q_NAME_MAX}자)`} maxLength={K_Q_NAME_MAX} value={q.name} onChange={(e) => setQ(q.id, { name: e.target.value })} />
                                      </div>
                                      {errors[`q-${q.id}-name`] && <p className="tk-q-err">{errors[`q-${q.id}-name`]}</p>}
                                    </div>
                                    {q.type !== 'text' && (
                                      <div className="tk-q-choice">
                                        <input className="rg-input" placeholder={`설명 입력 (선택사항, 최대 ${K_Q_DESC_MAX}자)`} maxLength={K_Q_DESC_MAX} value={q.description} onChange={(e) => setQ(q.id, { description: e.target.value })} />
                                        <div className="tk-q-opts">
                                          {q.options.map((option, optionIndex) => (
                                            <div key={optionIndex} className="tk-q-optrow">
                                              <span className={`tk-q-optmark ${q.type}`} />
                                              <div className="tk-q-optfield">
                                                <input className={`rg-input${(errors[`q-${q.id}-options`] && !option.trim()) || errors[dupOptKey(q.id, optionIndex)] ? ' error' : ''}`} placeholder={`항목 ${optionIndex + 1} (최대 ${K_Q_OPT_LEN_MAX}자)`} maxLength={K_Q_OPT_LEN_MAX} value={option} onChange={(e) => setOpt(q.id, optionIndex, e.target.value)} onBlur={() => revealDupOptErrors(q.id, q.options)} />
                                                {errors[dupOptKey(q.id, optionIndex)] && <p className="tk-q-err">{errors[dupOptKey(q.id, optionIndex)]}</p>}
                                              </div>
                                              <button className="rg-price-del" onClick={() => delOpt(q.id, optionIndex)} disabled={q.options.length <= K_Q_OPT_MIN} aria-label="항목 삭제"><CloseIcon /></button>
                                            </div>
                                          ))}
                                          {q.options.length < K_Q_OPT_MAX
                                            ? <button className="tk-add-xs" onClick={() => addOpt(q.id)}><PlusIcon /> 항목 추가</button>
                                            : <div className="rg-help">항목은 최대 {K_Q_OPT_MAX}개까지 추가할 수 있어요.</div>}
                                        </div>
                                        {errors[`q-${q.id}-options`] && <p className="tk-q-err">{errors[`q-${q.id}-options`]}</p>}
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
                                {d.kExtra.questions.length < K_Q_MAX
                                  ? <button className="tk-add-sm tk-q-addbtn" onClick={addQuestion}><PlusIcon /> 질문 추가</button>
                                  : <div className="tk-q-limit">질문은 최대 {K_Q_MAX}개까지 추가할 수 있어요.</div>}
                              </div>
                              <div className="tk-kdivider" />
                              <div className="tk-kfield"><div className="tk-klabel">이용 방법 <span className="rg-optional">(선택)</span></div><textarea className="rg-textarea tk-ktextarea" placeholder="이용 방법을 입력해 주세요." maxLength={K_INFO_MAX} value={d.kExtra.howto} onChange={(e) => patchExtra({ howto: e.target.value })} /><div className="rg-counter"><span className="rg-counter-num">{d.kExtra.howto.length.toLocaleString('ko-KR')}</span>/{K_INFO_MAX.toLocaleString('ko-KR')}자</div></div>
                              <div className="tk-kfield"><div className="tk-klabel">유의사항 <span className="rg-optional">(선택)</span></div><input className="rg-input" placeholder="유의사항을 입력해 주세요." maxLength={K_NOTICE_MAX} value={d.kExtra.notice} onChange={(e) => patchExtra({ notice: e.target.value })} /><div className="rg-counter"><span className="rg-counter-num">{d.kExtra.notice.length.toLocaleString('ko-KR')}</span>/{K_NOTICE_MAX}자</div></div>
                              <div className="tk-kfield"><div className="tk-klabel">취소 유의사항 <span className="rg-optional">(선택)</span></div><input className="rg-input" placeholder="취소 유의사항을 입력해 주세요." maxLength={K_CANCEL_MAX} value={d.kExtra.cancelNotice} onChange={(e) => patchExtra({ cancelNotice: e.target.value })} /><div className="rg-counter"><span className="rg-counter-num">{d.kExtra.cancelNotice.length.toLocaleString('ko-KR')}</span>/{K_CANCEL_MAX}자</div></div>
                          </div>
                        </div>
                      </div>
                    </section>}
                  </div>

                  <GoodocPreview d={d} />
                </div>

                <div className="rg-footer">
                  <div className="rg-footer-left">
                    <button className="rg-btn-cancel" onClick={requestCloseForm}>취소</button>
                    <button className="rg-btn-save" onClick={save}>저장</button>
                  </div>
                  {/* 우측 보조: 신규 생성=노출 토글 / 기존 수정=삭제 버튼 (실제 제품 TreatmentItemFormFooter 기준) */}
                  <div className="rg-footer-right">
                    {selId === null ? (
                      <>
                        <span className="rg-footer-label">환자들에게 진료항목을 노출하고 예약을 받습니다.</span>
                        <button className={`rg-toggle${d.gdVisible ? '' : ' off'}`} aria-label="굿닥 진료항목 노출" aria-pressed={d.gdVisible} onClick={() => patch({ gdVisible: !d.gdVisible })}><span className="rg-toggle-knob" /></button>
                      </>
                    ) : (
                      <button className="tk-detail-delete" onClick={() => setDeleteId(selId)}>삭제</button>
                    )}
                  </div>
                </div>
              </>
            )}

            {deleteId !== null && (
              <div className="ap-dim" onClick={() => setDeleteId(null)}><div className="ap-modal set-modal" onClick={(e) => e.stopPropagation()}>
                <div className="ap-modal-title">{deleteTarget?.activeReservations ? '예약이 있는 진료항목은 삭제할 수 없어요' : '해당 진료항목을 삭제하시겠어요?'}</div>
                <div className="set-modal-body">{deleteTarget?.activeReservations ? <>활성 또는 미래 예약 {deleteTarget.activeReservations}건이 있어요. 기존 예약은 유지하고 신규 예약만 중지할 수 있습니다.</> : <>삭제하면 굿닥 서비스에 더 이상 노출되지 않으며,<br/>해당 항목으로 예약할 수 없게 됩니다.</>}</div>
                <div className="tk-delete-warning">{deleteTarget?.activeReservations ? '운영 중지 후에도 기존 예약은 예약 신청 내역에서 처리할 수 있어요.' : '한 번 삭제한 정보는 되돌릴 수 없으니 유의해 주세요.'}</div>
                <div className="ap-modal-btns"><button className="rg-btn-cancel" onClick={() => setDeleteId(null)}>취소</button><button className="set-modal-danger" onClick={confirmDelete}>{deleteTarget?.activeReservations ? '운영 중지' : '삭제'}</button></div>
              </div></div>
            )}

            {leaveOpen && (
              <div className="ap-dim" onClick={() => setLeaveOpen(false)}><div className="ap-modal set-modal" onClick={(e) => e.stopPropagation()}>
                <div className="ap-modal-title">진료항목 정보 입력을 그만하시겠어요?</div>
                <div className="set-modal-body">그만하면 지금까지 입력한 정보는 저장되지 않아요.</div>
                <div className="ap-modal-btns"><button className="rg-btn-cancel" onClick={() => setLeaveOpen(false)}>취소</button><button className="rg-btn-save" onClick={closeForm}>확인</button></div>
              </div></div>
            )}

            {/* 분류 선택 모달 — 좌우 2단(기본) / 아코디언 트리 / 단계형. 헤더 세그먼트로 전환 비교.
             * 소분류는 어느 형태에서도 고르지 않는다(부분 매핑). (C안) */}
            {catSheet && (() => {
              const closeSheet = () => { setCatSheet(false); setSheetC1(null); setCatQuery(''); };
              const pick = (c1: string, c2: string) => {
                patch({ cat1: c1, cat2: c2 });
                clearErr('category');
                closeSheet();
              };
              const hint = (b: Cat2Node) =>
                b.items.slice(0, 3).map((c) => c.name).join(', ') + (b.items.length > 3 ? ` 외 ${b.items.length - 3}개` : '');

              const q = NORM(catQuery);
              /** 검색어가 있으면 대분류명 또는 중분류명이 걸리는 것만 남긴다 */
              const filtered = TAXONOMY.map((a) => {
                if (!q) return { a, groups: a.groups };
                if (NORM(a.name).includes(q)) return { a, groups: a.groups };
                return { a, groups: a.groups.filter((b) => NORM(b.name).includes(q)) };
              }).filter((x) => x.groups.length > 0);
              const total = filtered.reduce((n, x) => n + x.groups.length, 0);

              /* 좌우 2단 — 검색으로 좌측 목록이 줄면 활성 대분류도 남아있는 것으로 옮긴다 */
              const colList = filtered;
              const activeCol = colList.find((x) => x.a.name === colC1) ?? colList[0];

              const searchBox = (
                <div className="tc-modal-search">
                  <input
                    className="rg-input"
                    placeholder="분류명으로 찾기 (예: 보톡스, 예방접종)"
                    value={catQuery}
                    onChange={(e) => setCatQuery(e.target.value)}
                  />
                </div>
              );

              return (
                <div className="ap-dim" onClick={closeSheet}>
                  <div className="ap-modal tc-modal" onClick={(e) => e.stopPropagation()}>
                    <div className="tc-modal-head">
                      {sheetMode === 'step' && sheetC1 ? (
                        <button className="tc-back" onClick={() => setSheetC1(null)}>‹ 대분류</button>
                      ) : (
                        <span className="tc-modal-title">분류 선택</span>
                      )}
                      <div className="tc-modal-head-right">
                        {/* 프로토타입 전용 — 모달 형태 비교 */}
                        <div className="tc-seg">
                          {([['cols', '좌우'], ['step', '단계']] as const).map(([key, label]) => (
                            <button
                              key={key}
                              className={`tc-seg-btn${sheetMode === key ? ' on' : ''}`}
                              onClick={() => { setSheetMode(key); setSheetC1(null); if (key === 'step') setCatQuery(''); }}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                        <button className="tc-modal-x" aria-label="닫기" onClick={closeSheet}>
                          <CloseIcon />
                        </button>
                      </div>
                    </div>

                    {sheetMode !== 'step' && searchBox}

                    {/* ── 좌우 2단 ── */}
                    {sheetMode === 'cols' && (
                      <div className="tc-cols">
                        <nav className="tc-col-left" aria-label="대분류">
                          {colList.map(({ a, groups }) => (
                            <button
                              key={a.id}
                              className={`tc-col-c1${activeCol && a.name === activeCol.a.name ? ' sel' : ''}`}
                              onClick={() => setColC1(a.name)}
                            >
                              <span className="tc-col-c1-name">{a.name}</span>
                              <span className="tc-col-c1-count">{groups.length}</span>
                            </button>
                          ))}
                          {colList.length === 0 && <div className="tc-sheet-empty">결과 없음</div>}
                        </nav>
                        <section className="tc-col-right">
                          {activeCol ? (
                            <>
                              <div className="tc-col-right-head">{activeCol.a.name}</div>
                              {activeCol.groups.map((b) => {
                                const on = d.cat1 === activeCol.a.name && d.cat2 === b.name;
                                return (
                                  <button
                                    key={b.id}
                                    className={`tc-col-c2${on ? ' on' : ''}`}
                                    onClick={() => pick(activeCol.a.name, b.name)}
                                  >
                                    <span className="tc-col-c2-name">
                                      {b.name}
                                      {on && <span className="tc-tree-on">선택됨</span>}
                                    </span>
                                    {/* 이 중분류에 뭐가 들어가는지 — 소분류 예시 힌트(선택 대상 아님) */}
                                    <span className="tc-tree-hint">{hint(b)}</span>
                                  </button>
                                );
                              })}
                            </>
                          ) : (
                            <div className="tc-sheet-empty">일치하는 분류가 없어요.</div>
                          )}
                        </section>
                      </div>
                    )}

                    {/* ── 단계형 (대분류 → 중분류) ── */}
                    {sheetMode === 'step' && (
                      <div className="tc-modal-body">
                        {!sheetC1 ? (
                          <>
                            <div className="tc-sheet-note">대분류 {TAXONOMY.length}개 · 중분류 {total}개 — 굿닥 표준 진료항목</div>
                            {TAXONOMY.map((a) => (
                              <button key={a.id} className="tc-pick" onClick={() => setSheetC1(a.name)}>
                                <span>{a.name}</span>
                                <span className="tc-pick-meta">{a.groups.length}개 ›</span>
                              </button>
                            ))}
                          </>
                        ) : (
                          TAXONOMY.find((a) => a.name === sheetC1)!.groups.map((b) => {
                            const on = d.cat1 === sheetC1 && d.cat2 === b.name;
                            return (
                              <button
                                key={b.id}
                                className={`tc-pick tc-pick-2line${on ? ' on' : ''}`}
                                onClick={() => pick(sheetC1, b.name)}
                              >
                                <span className="tc-pick-main">
                                  <span className="tc-pick-name"><span className="tc-dim">{sheetC1} › </span>{b.name}</span>
                                  {/* 소분류 예시 힌트 — 좌우와 동일하게, 이 중분류에 뭐가 들어가는지 */}
                                  <span className="tc-tree-hint">{hint(b)}</span>
                                </span>
                                <span className="tc-pick-cta">{on ? '선택됨' : '선택'}</span>
                              </button>
                            );
                          })
                        )}
                      </div>
                    )}

                    {/* 하단 바 — 고정 높이에서 남는 여백을 마감하고 현재 선택을 확인시킨다 */}
                    <div className="tc-modal-foot">
                      <span className={`tc-modal-foot-cur${d.cat1 && d.cat1 !== CUSTOM_CAT ? '' : ' none'}`}>
                        {d.cat1 && d.cat1 !== CUSTOM_CAT ? (
                          <>현재 <b>{d.cat1} › {d.cat2}</b></>
                        ) : (
                          '아직 분류가 없어요'
                        )}
                      </span>
                      <button className="tc-modal-foot-btn" onClick={closeSheet}>닫기</button>
                    </div>
                  </div>
                </div>
              );
            })()}

            {toast && <div className="rg-toast">{toast}</div>}
          </main>
        </div>
        <ChangeDrawer
          currentView={currentView}
          changes={ADMIN_NONPAY_AUG_CHANGES}
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
