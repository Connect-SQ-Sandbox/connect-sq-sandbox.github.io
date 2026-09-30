/**
 * ┌─ 프로토타입 컨텍스트 ───────────────────────────────────
 * 이름     : A.Dot 상담사용 병원 탐색·진료 연결
 * 상태     : 개발 협의용 시안   버전: v1   최종수정: 2026-09-30
 * PRD      : Draft · 2026-09-29 개정 · 3-문제·해결/1-PRD/0-Draft/2026-09-16-에이닷-병원탐색-진료실예약-연동-PRD.md
 * 배포URL  : https://connect-sq-sandbox.github.io/out/adot-clinic-linking.html
 * 관련 CSS : styles/adotClinicLinking.css
 * 기술제약 : react-only · plain CSS · mock data · 네트워크 0
 *
 * 화면구성 : ① 로그인 ② 병원 탐색(목록·지도) ③ 병원 정보 모달
 *            ④ 진료 신청·결과 우측 패널 ⑤ 연결 이력·상세 ⑥ 상담사 정보
 *
 * 핵심 결정:
 *   [협의안] 예약 가능한 병원에만 `굿닥 예약` 배지를 표시한다.
 *   [현행참고] 운영 상태 다음 문구는 다음 예약이 아닌 병원 운영시간을 뜻한다.
 *   [협의안] managedTags와 진료항목 태그를 하나의 검색 경험으로 제공한다.
 *   [협의안] 목록 행 선택 시 지도 포커스·정보 카드가 열리고, 그 안에서 신청을 시작한다.
 *   [확정] 병원 정보는 큰 모달로 열고 닫아도 지도·검색 맥락을 유지한다.
 *   [확정] 신청서와 결과는 지도 위 우측 패널로 열며, 진행 중 패널을 닫으면 해당 신청 세션을 취소한다.
 *   [제외] 실제 환자·병원 고객 데이터, 실제 신청/저장, 외부 네트워크 호출
 * └──────────────────────────────────────────────────────
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  FiActivity,
  FiArrowLeft,
  FiCalendar,
  FiCheck,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiChevronUp,
  FiClock,
  FiCrosshair,
  FiInfo,
  FiGrid,
  FiLogOut,
  FiMapPin,
  FiPhone,
  FiPlusSquare,
  FiRefreshCw,
  FiSearch,
  FiSend,
  FiStar,
  FiUser,
  FiX
} from 'react-icons/fi';
import hospital1 from '../../../assets/adot-clinic-linking/hospital-1.jpg';
import hospital2 from '../../../assets/adot-clinic-linking/hospital-2.jpg';
import hospital3 from '../../../assets/adot-clinic-linking/hospital-3.jpg';
import hospital4 from '../../../assets/adot-clinic-linking/hospital-4.jpg';
import mapComposite from '../../../assets/adot-clinic-linking/map-composite.png';

type Screen = 'login' | 'link' | 'history' | 'history-detail' | 'profile';
type ConnectionOverlay = 'hospital-detail' | 'application' | 'success' | null;
type OperationState = 'open' | 'ready' | 'closed' | 'dayOff' | 'unknown';
type TreatmentSelection = { level: 'middle' | 'item'; major: string; middle: string; item?: string } | null;
type BookingSummary = { patient: string; room: string; purpose: string; schedule: string };
type RegionSelection = { city: string; district: string; neighborhood: string };

type SearchSuggestionItem =
  | { kind: 'region'; label: string; description: string; searchText: string; selection: RegionSelection }
  | { kind: 'department'; label: string; description: string; searchText: string; department: string }
  | { kind: 'treatment'; label: string; description: string; searchText: string; treatment: Exclude<TreatmentSelection, null> | null }
  | { kind: 'hospital'; label: string; description: string; searchText: string; hospital: Hospital };

type Hospital = {
  id: string;
  name: string;
  department: string;
  address: string;
  distance: string;
  rating: number;
  reviews: number;
  image: string;
  operationState: OperationState;
  operationLabel: string;
  operationNext: string;
  enableAppointment: boolean;
  treatmentAppointment: boolean;
  night: boolean;
  holiday: boolean;
  femaleDoctor: boolean;
  managedTags: string[];
  treatmentItems: string[];
  availableSlots: string[];
  phone: string;
  description: string;
  marker: { left: number; top: number };
  region: RegionSelection;
};

type HistoryRecord = {
  id: string;
  createdAt: string;
  patient: string;
  hospitalId: string;
  purpose: string;
  schedule: string;
  state: '신청 완료' | '예약 취소' | '진료 완료';
};

const DEFAULT_REGION: RegionSelection = { city: '서울', district: '마포구', neighborhood: '전체' };

const REGION_TREE: Record<string, Record<string, string[]>> = {
  서울: {
    마포구: ['전체', '망원동', '합정동', '서교동', '연남동', '성산동'],
    강남구: ['전체', '역삼동', '논현동', '대치동', '삼성동'],
    서초구: ['전체', '서초동', '방배동', '반포동', '양재동'],
    송파구: ['전체', '잠실동', '문정동', '가락동', '송파동'],
    영등포구: ['전체', '여의도동', '영등포동', '당산동', '문래동']
  },
  경기: {
    성남시: ['전체', '분당동', '정자동', '서현동', '판교동'],
    수원시: ['전체', '인계동', '영통동', '매탄동'],
    고양시: ['전체', '백석동', '화정동', '주엽동']
  },
  인천: {
    남동구: ['전체', '구월동', '간석동', '논현동'],
    연수구: ['전체', '송도동', '연수동', '옥련동']
  },
  부산: {
    해운대구: ['전체', '우동', '중동', '좌동'],
    부산진구: ['전체', '부전동', '전포동', '양정동']
  }
};

const DEPARTMENTS = [
  '진료과 전체', '소아청소년과', '치과', '내과', '이비인후과', '피부과', '산부인과', '안과', '정신의학과',
  '성형외과', '정형외과', '한의과', '비뇨기과', '가정의학과', '신경외과', '외과', '흉부외과', '마취통증과',
  '영상의학과', '신경과', '재활의학과', '예방의학과', '직업환경의학과', '응급의학과', '핵의학과', '결핵과',
  '진단검사의학과', '병리과', '방사선종양학과'
];

const TREATMENT_TREE = [
  {
    major: '비만·영양',
    groups: [
      { middle: '영양주사', items: ['마늘주사', '비타민D 주사', '백옥주사'] },
      { middle: '비만 관리', items: ['비만 상담', '체성분 검사'] }
    ]
  },
  {
    major: '피부',
    groups: [
      { middle: '여드름', items: ['여드름 진료', '여드름 압출'] },
      { middle: '피부질환', items: ['알레르기 피부염', '아토피 진료'] }
    ]
  },
  {
    major: '예방접종',
    groups: [
      { middle: 'HPV 접종', items: ['가다실 9가', '서바릭스 2가'] },
      { middle: '대상포진 접종', items: ['싱그릭스', '스카이조스터'] },
      { middle: '폐렴구균 접종', items: ['프리베나 13', '프로디악스 23'] }
    ]
  },
  {
    major: '검사·검진',
    groups: [
      { middle: '건강검진', items: ['일반 건강검진', '직장인 건강검진'] },
      { middle: '내시경', items: ['위내시경', '대장내시경'] }
    ]
  },
  {
    major: '치과',
    groups: [
      { middle: '보철치료', items: ['임플란트', '크라운'] },
      { middle: '일반치료', items: ['스케일링', '레진'] }
    ]
  }
];

const HOSPITALS: Hospital[] = [
  {
    id: 'sample-01',
    name: '굿닥샘플내과의원',
    department: '내과',
    address: '서울 마포구 월드컵로 100, 2층',
    distance: '230m',
    rating: 4.9,
    reviews: 214,
    image: hospital1,
    operationState: 'open',
    operationLabel: '진료중',
    operationNext: '18:30 진료종료',
    enableAppointment: true,
    treatmentAppointment: true,
    night: true,
    holiday: false,
    femaleDoctor: false,
    managedTags: ['감기', '건강검진', '예방접종', '내시경'],
    treatmentItems: ['가다실 9가', '일반 건강검진', '위내시경'],
    availableSlots: ['09:30', '10:00', '10:30', '11:00', '14:00', '15:30'],
    phone: '02-0000-1001',
    description: '내과 진료와 건강검진, 예방접종을 운영하는 샘플 의료기관입니다.',
    marker: { left: 43, top: 43 },
    region: { city: '서울', district: '마포구', neighborhood: '성산동' }
  },
  {
    id: 'sample-02',
    name: '늘봄샘플가정의학과의원',
    department: '가정의학과',
    address: '서울 마포구 희우정로 124, 3층',
    distance: '420m',
    rating: 4.8,
    reviews: 97,
    image: hospital2,
    operationState: 'open',
    operationLabel: '진료중',
    operationNext: '19:00 진료종료',
    enableAppointment: true,
    treatmentAppointment: false,
    night: true,
    holiday: true,
    femaleDoctor: true,
    managedTags: ['예방접종', '만성질환', '건강검진'],
    treatmentItems: ['가다실 9가', '서바릭스 2가', '싱그릭스', '직장인 건강검진'],
    availableSlots: ['10:00', '11:30', '14:00', '16:00'],
    phone: '02-0000-1002',
    description: '가족 단위의 일반 진료와 예방접종을 제공하는 샘플 의료기관입니다.',
    marker: { left: 62, top: 31 },
    region: { city: '서울', district: '마포구', neighborhood: '망원동' }
  },
  {
    id: 'sample-03',
    name: '맑은샘플치과의원',
    department: '치과',
    address: '서울 마포구 망원로 27, 4층',
    distance: '680m',
    rating: 4.7,
    reviews: 62,
    image: hospital3,
    operationState: 'ready',
    operationLabel: '진료준비',
    operationNext: '13:30 진료시작',
    enableAppointment: false,
    treatmentAppointment: false,
    night: false,
    holiday: false,
    femaleDoctor: false,
    managedTags: ['일반치과', '소아치과', '스케일링'],
    treatmentItems: ['임플란트', '크라운', '레진'],
    availableSlots: [],
    phone: '02-0000-1003',
    description: '일반 치과 진료를 제공하는 샘플 의료기관입니다.',
    marker: { left: 31, top: 67 },
    region: { city: '서울', district: '마포구', neighborhood: '망원동' }
  },
  {
    id: 'sample-04',
    name: '온유샘플이비인후과의원',
    department: '이비인후과',
    address: '서울 마포구 동교로 200, 5층',
    distance: '1.1km',
    rating: 4.6,
    reviews: 41,
    image: hospital4,
    operationState: 'closed',
    operationLabel: '진료종료',
    operationNext: '내일 09:00 진료시작',
    enableAppointment: true,
    treatmentAppointment: false,
    night: false,
    holiday: true,
    femaleDoctor: true,
    managedTags: ['알레르기', '비염', '어지럼증'],
    treatmentItems: ['독감 예방접종'],
    availableSlots: [],
    phone: '02-0000-1004',
    description: '이비인후과 일반 진료를 운영하는 샘플 의료기관입니다.',
    marker: { left: 73, top: 59 },
    region: { city: '서울', district: '마포구', neighborhood: '연남동' }
  },
  {
    id: 'sample-05',
    name: '우리샘플피부과의원',
    department: '피부과',
    address: '서울 마포구 성미산로 82, 6층',
    distance: '1.4km',
    rating: 4.5,
    reviews: 28,
    image: hospital1,
    operationState: 'dayOff',
    operationLabel: '휴진',
    operationNext: '매주 수요일 휴진',
    enableAppointment: false,
    treatmentAppointment: true,
    night: false,
    holiday: false,
    femaleDoctor: true,
    managedTags: ['피부질환', '알레르기', '여드름'],
    treatmentItems: ['여드름 진료', '알레르기 피부염'],
    availableSlots: ['09:30', '10:30', '14:30'],
    phone: '02-0000-1005',
    description: '피부 질환 중심으로 진료하는 샘플 의료기관입니다.',
    marker: { left: 52, top: 73 },
    region: { city: '서울', district: '마포구', neighborhood: '연남동' }
  },
  {
    id: 'sample-06',
    name: '다온샘플의원',
    department: '가정의학과',
    address: '서울 마포구 포은로 52, 2층',
    distance: '1.7km',
    rating: 4.4,
    reviews: 19,
    image: hospital2,
    operationState: 'unknown',
    operationLabel: '진료시간 전화문의',
    operationNext: '',
    enableAppointment: false,
    treatmentAppointment: false,
    night: false,
    holiday: false,
    femaleDoctor: false,
    managedTags: ['감기', '만성질환'],
    treatmentItems: [],
    availableSlots: [],
    phone: '02-0000-1006',
    description: '운영시간 확인이 필요한 샘플 의료기관입니다.',
    marker: { left: 82, top: 42 },
    region: { city: '서울', district: '마포구', neighborhood: '망원동' }
  }
];

const HISTORY: HistoryRecord[] = [
  { id: 'LINK-260930-0142', createdAt: '2026.09.30 11:42', patient: '김○○', hospitalId: 'sample-01', purpose: '일반 진료', schedule: '2026.10.01 10:30', state: '신청 완료' },
  { id: 'LINK-260929-0087', createdAt: '2026.09.29 16:08', patient: '이○○', hospitalId: 'sample-02', purpose: '가다실 9가', schedule: '2026.10.02 14:00', state: '진료 완료' },
  { id: 'LINK-260928-0031', createdAt: '2026.09.28 09:21', patient: '박○○', hospitalId: 'sample-04', purpose: '비염 진료', schedule: '2026.09.29 09:30', state: '예약 취소' }
];

const REGION_ORIGIN_NAMES: Record<string, string> = {
  서울: '서울특별시',
  경기: '경기도',
  인천: '인천광역시',
  부산: '부산광역시'
};

const REGION_SUGGESTIONS: SearchSuggestionItem[] = Object.entries(REGION_TREE).flatMap(([city, districts]) => [
  {
    kind: 'region' as const,
    label: city,
    description: REGION_ORIGIN_NAMES[city] || city,
    searchText: `${city} ${REGION_ORIGIN_NAMES[city] || ''}`,
    selection: { city, district: '전체', neighborhood: '전체' }
  },
  ...Object.entries(districts).flatMap(([district, neighborhoods]) => [
    {
      kind: 'region' as const,
      label: district,
      description: `${city} ${district}`,
      searchText: `${city} ${district}`,
      selection: { city, district, neighborhood: '전체' }
    },
    ...neighborhoods.filter((neighborhood) => neighborhood !== '전체').map((neighborhood) => ({
      kind: 'region' as const,
      label: neighborhood,
      description: `${city} ${district}`,
      searchText: `${city} ${district} ${neighborhood}`,
      selection: { city, district, neighborhood }
    }))
  ])
]);

const DEPARTMENT_SUGGESTIONS: SearchSuggestionItem[] = DEPARTMENTS
  .filter((department) => department !== '진료과 전체')
  .map((department) => ({
    kind: 'department' as const,
    label: department,
    description: '진료과',
    searchText: department,
    department
  }));

const standardTreatmentSuggestions: SearchSuggestionItem[] = TREATMENT_TREE.flatMap((major) =>
  major.groups.flatMap((group) => [
    {
      kind: 'treatment' as const,
      label: group.middle,
      description: `${major.major} · 중분류`,
      searchText: `${major.major} ${group.middle} ${group.items.join(' ')}`,
      treatment: { level: 'middle' as const, major: major.major, middle: group.middle }
    },
    ...group.items.map((item) => ({
      kind: 'treatment' as const,
      label: item,
      description: `${major.major} · ${group.middle}`,
      searchText: `${major.major} ${group.middle} ${item}`,
      treatment: { level: 'item' as const, major: major.major, middle: group.middle, item }
    }))
  ])
);

const standardTreatmentLabels = new Set(standardTreatmentSuggestions.map((suggestion) => suggestion.label));
const managedTagSuggestions: SearchSuggestionItem[] = Array.from(new Set(HOSPITALS.flatMap((hospital) => hospital.managedTags)))
  .filter((label) => !standardTreatmentLabels.has(label))
  .map((label) => ({
    kind: 'treatment' as const,
    label,
    description: '진료 키워드',
    searchText: label,
    treatment: null
  }));

const TREATMENT_SUGGESTIONS = [...standardTreatmentSuggestions, ...managedTagSuggestions];
const HOSPITAL_SUGGESTIONS: SearchSuggestionItem[] = HOSPITALS.map((hospital) => ({
  kind: 'hospital' as const,
  label: hospital.name,
  description: hospital.address,
  searchText: hospital.name,
  hospital
}));

function normalizeSearchText(value: string) {
  return value.trim().toLocaleLowerCase('ko-KR').replace(/\s+/g, ' ');
}

function textMatchScore(suggestion: SearchSuggestionItem, rawQuery: string) {
  const query = normalizeSearchText(rawQuery);
  const label = normalizeSearchText(suggestion.label);
  const searchText = normalizeSearchText(suggestion.searchText);
  if (!query) return Number.POSITIVE_INFINITY;
  if (label === query) return 0;
  if (label.startsWith(query)) return 10 + (label.length - query.length) / 100;
  if (searchText.split(' ').some((token) => token.startsWith(query))) return 20 + label.length / 100;
  const containedAt = searchText.indexOf(query);
  if (containedAt >= 0) return 30 + containedAt / 100 + label.length / 1000;
  return Number.POSITIVE_INFINITY;
}

function rankedSuggestions(candidates: SearchSuggestionItem[], query: string, limit: number) {
  return candidates
    .map((candidate, originalIndex) => ({ candidate, originalIndex, score: textMatchScore(candidate, query) }))
    .filter(({ score }) => Number.isFinite(score))
    .sort((left, right) => left.score - right.score
      || left.candidate.label.length - right.candidate.label.length
      || left.originalIndex - right.originalIndex)
    .slice(0, limit)
    .map(({ candidate }) => candidate);
}

function isBookable(hospital: Hospital) {
  return hospital.enableAppointment || hospital.treatmentAppointment;
}

function operationClass(state: OperationState) {
  return state === 'open' ? 'is-open' : 'is-muted';
}

function selectionLabel(selection: TreatmentSelection) {
  if (!selection) return '진료항목';
  return selection.level === 'middle' ? selection.middle : selection.item || selection.middle;
}

function TopNavigation({
  screen,
  onNavigate,
  onLogout
}: {
  screen: Screen;
  onNavigate: (screen: Screen) => void;
  onLogout: () => void;
}) {
  const [profileOpen, setProfileOpen] = useState(false);
  const linkActive = ['link', 'hospital', 'application', 'success'].includes(screen);
  const historyActive = ['history', 'history-detail'].includes(screen);

  return (
    <header className="adot-topbar">
      <div className="adot-brand" aria-label="KT와 굿닥">
        <strong>KT</strong><span>×</span><b>굿닥</b>
      </div>
      <span className="adot-prototype-badge">개발 협의용 시안</span>
      <nav className="adot-main-nav" aria-label="주 메뉴">
        <button className={linkActive ? 'active' : ''} type="button" onClick={() => onNavigate('link')}>진료 연결</button>
        <button className={historyActive ? 'active' : ''} type="button" onClick={() => onNavigate('history')}>연결 이력</button>
      </nav>
      <div className="adot-account-wrap">
        <button
          className="adot-account"
          type="button"
          aria-expanded={profileOpen}
          onClick={() => setProfileOpen((value) => !value)}
        >
          상담사 김○○ {profileOpen ? <FiChevronUp /> : <FiChevronDown />}
        </button>
        {profileOpen && (
          <div className="adot-account-menu">
            <button type="button" onClick={() => { onNavigate('profile'); setProfileOpen(false); }}><FiUser /> 상담사 정보</button>
            <button type="button" onClick={onLogout}><FiLogOut /> 로그아웃</button>
          </div>
        )}
      </div>
    </header>
  );
}

function SearchSuggestion({
  query,
  onSelect
}: {
  query: string;
  onSelect: (suggestion: SearchSuggestionItem) => void;
}) {
  const normalized = normalizeSearchText(query);
  if (!normalized) return null;

  const groups = [
    { kind: 'region' as const, title: '지역', icon: <FiMapPin />, items: rankedSuggestions(REGION_SUGGESTIONS, query, 5) },
    { kind: 'department' as const, title: '진료과', icon: <FiGrid />, items: rankedSuggestions(DEPARTMENT_SUGGESTIONS, query, 4) },
    { kind: 'treatment' as const, title: '진료항목', icon: <FiActivity />, items: rankedSuggestions(TREATMENT_SUGGESTIONS, query, 6) },
    { kind: 'hospital' as const, title: '병원', icon: <FiPlusSquare />, items: rankedSuggestions(HOSPITAL_SUGGESTIONS, query, 6) }
  ].filter((group) => group.items.length > 0);

  const highlight = (text: string) => {
    const start = normalizeSearchText(text).indexOf(normalized);
    if (start < 0) return text;
    return <>{text.slice(0, start)}<mark>{text.slice(start, start + query.trim().length)}</mark>{text.slice(start + query.trim().length)}</>;
  };

  return (
    <div className="adot-search-suggest" role="listbox" aria-label="검색어 추천">
      {groups.length > 0 ? groups.map((group) => (
        <section className="adot-suggest-group" key={group.kind} aria-label={`${group.title} 검색 결과`}>
          <strong className="adot-suggest-title">{group.title}</strong>
          {group.items.map((suggestion) => (
            <button
              key={`${suggestion.kind}-${suggestion.label}-${suggestion.description}`}
              type="button"
              role="option"
              aria-selected="false"
              onClick={() => onSelect(suggestion)}
            >
              <span className={`adot-suggest-icon is-${group.kind}`}>{group.icon}</span>
              <span className="adot-suggest-copy">
                <span className="adot-suggest-main">{highlight(suggestion.label)}</span>
                <small>{suggestion.description}</small>
              </span>
            </button>
          ))}
        </section>
      )) : (
        <div className="adot-suggest-empty">
          <FiSearch />
          <strong>일치하는 검색어가 없습니다.</strong>
          <small>지역, 진료과, 진료항목 또는 병원명을 다시 확인해 주세요.</small>
        </div>
      )}
      <p className="adot-suggest-policy">지역 → 진료과 → 진료항목 → 병원 순으로 표시되며, 각 영역 안에서는 일치도가 높은 항목이 먼저 노출됩니다.</p>
    </div>
  );
}

function TreatmentPicker({
  selection,
  onSelect,
  onClose
}: {
  selection: TreatmentSelection;
  onSelect: (selection: TreatmentSelection) => void;
  onClose: () => void;
}) {
  const [major, setMajor] = useState(selection?.major || '예방접종');
  const current = TREATMENT_TREE.find((entry) => entry.major === major) || TREATMENT_TREE[0];
  const [expanded, setExpanded] = useState(selection?.middle || current.groups[0].middle);

  return (
    <div className="adot-treatment-picker" role="dialog" aria-label="진료항목 선택">
      <div className="adot-picker-head">
        <strong>진료항목</strong>
        <span>대분류 <FiChevronRight /> 중분류 <FiChevronRight /> 진료항목</span>
        <button type="button" aria-label="닫기" onClick={onClose}><FiX /></button>
      </div>
      <div className="adot-picker-body">
        <div className="adot-major-list">
          {TREATMENT_TREE.map((entry) => (
            <button
              key={entry.major}
              className={entry.major === major ? 'active' : ''}
              type="button"
              onClick={() => { setMajor(entry.major); setExpanded(entry.groups[0].middle); }}
            >
              {entry.major}<FiChevronRight />
            </button>
          ))}
        </div>
        <div className="adot-middle-list">
          {current.groups.map((group) => {
            const isExpanded = expanded === group.middle;
            const isMiddleSelected = selection?.level === 'middle' && selection.middle === group.middle;
            return (
              <section key={group.middle}>
                <button className="adot-middle-row" type="button" onClick={() => setExpanded(isExpanded ? '' : group.middle)}>
                  <strong>{group.middle}</strong>{isExpanded ? <FiChevronUp /> : <FiChevronDown />}
                </button>
                {isExpanded && (
                  <div className="adot-item-list">
                    <button
                      className={isMiddleSelected ? 'selected' : ''}
                      type="button"
                      onClick={() => { onSelect({ level: 'middle', major, middle: group.middle }); onClose(); }}
                    >
                      <span className="adot-checkbox">{isMiddleSelected && <FiCheck />}</span>
                      {group.middle} 전체
                    </button>
                    {group.items.map((item) => {
                      const selected = selection?.level === 'item' && selection.item === item;
                      return (
                        <button
                          className={selected ? 'selected' : ''}
                          key={item}
                          type="button"
                          onClick={() => { onSelect({ level: 'item', major, middle: group.middle, item }); onClose(); }}
                        >
                          <span className="adot-checkbox">{selected && <FiCheck />}</span>
                          {item}
                        </button>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </div>
      <div className="adot-picker-note">
        중분류 전체를 선택하면 해당 분류의 하위 진료항목을 하나라도 제공하는 병원을 모두 찾습니다.
      </div>
    </div>
  );
}

function HospitalRow({ hospital, selected, onSelect }: { hospital: Hospital; selected: boolean; onSelect: () => void }) {
  const tags = Array.from(new Set([...hospital.managedTags, ...hospital.treatmentItems])).slice(0, 3);
  return (
    <button aria-pressed={selected} className={`adot-hospital-row ${selected ? 'selected' : ''}`} type="button" onClick={onSelect}>
      <img src={hospital.image} alt="샘플 병원 내부" />
      <span className="adot-row-content">
        <span className="adot-row-title">
          <strong>{hospital.name}</strong>
          {isBookable(hospital) && <em className="adot-booking-badge">굿닥 예약</em>}
        </span>
        <span className="adot-row-meta">{hospital.department}<i />{hospital.address}</span>
        <span className="adot-row-operation">
          <b>{hospital.distance}</b><i />
          <em className={operationClass(hospital.operationState)}>{hospital.operationLabel}</em>
          {hospital.operationNext && <><i /><span>{hospital.operationNext}</span></>}
        </span>
        <span className="adot-row-tags">
          {tags.map((tag) => <em key={tag}>{tag}</em>)}
        </span>
      </span>
      <FiChevronRight className="adot-row-arrow" />
    </button>
  );
}

function MapPanel({
  hospitals,
  selectedHospital,
  onSelect,
  onApply,
  onDetail
}: {
  hospitals: Hospital[];
  selectedHospital: Hospital | null;
  onSelect: (hospital: Hospital) => void;
  onApply: (hospital: Hospital) => void;
  onDetail: (hospital: Hospital) => void;
}) {
  const [zoom, setZoom] = useState(1);
  return (
    <section className="adot-map" aria-label="병원 지도">
      <div className="adot-map-tiles" style={{ transform: `scale(${zoom})` }}>
        <img className="adot-map-image" src={mapComposite} alt="" aria-hidden="true" />
      </div>
      <div className="adot-map-shade" />
      {hospitals.map((hospital, index) => (
        <button
          key={hospital.id}
          type="button"
          className={`adot-marker ${selectedHospital?.id === hospital.id ? 'selected' : ''}`}
          style={{ left: `${hospital.marker.left}%`, top: `${hospital.marker.top}%` }}
          aria-label={`${hospital.name} 지도에서 선택`}
          onClick={() => onSelect(hospital)}
        >
          <span>{index + 1}</span>
        </button>
      ))}
      <div className="adot-map-tools">
        <button type="button" aria-label="확대" onClick={() => setZoom((value) => Math.min(1.24, value + 0.08))}>+</button>
        <button type="button" aria-label="축소" onClick={() => setZoom((value) => Math.max(0.92, value - 0.08))}>−</button>
        <button type="button" aria-label="지도 보기 초기화" onClick={() => setZoom(1)}><FiCrosshair /></button>
      </div>
      <div className="adot-map-note"><FiInfo /> 가상 병원 데이터로 구성된 검토용 화면입니다.</div>
      {selectedHospital && (
        <article
          className="adot-map-card"
          style={{
            left: `${Math.min(68, Math.max(24, selectedHospital.marker.left))}%`,
            top: `${Math.min(64, Math.max(18, selectedHospital.marker.top - 4))}%`
          }}
        >
          <button className="adot-map-card-close" type="button" aria-label="병원 카드 닫기" onClick={() => onSelect(selectedHospital)}><FiX /></button>
          <div className="adot-map-card-main">
            <img src={selectedHospital.image} alt="샘플 병원 내부" />
            <div>
              <div className="adot-map-card-title">
                <strong>{selectedHospital.name}</strong>
                {isBookable(selectedHospital) && <em className="adot-booking-badge">굿닥 예약</em>}
              </div>
              <p>{selectedHospital.department}</p>
              <p>{selectedHospital.address}</p>
              <div className="adot-card-operation">
                <b>{selectedHospital.distance}</b><i />
                <em className={operationClass(selectedHospital.operationState)}>{selectedHospital.operationLabel}</em>
                {selectedHospital.operationNext && <><i /><span>{selectedHospital.operationNext}</span></>}
              </div>
            </div>
          </div>
          <div className="adot-map-card-tags">
            {Array.from(new Set([...selectedHospital.managedTags, ...selectedHospital.treatmentItems])).slice(0, 3).map((tag) => <span key={tag}>{tag}</span>)}
          </div>
          <div className="adot-map-card-actions">
            <button className="secondary" type="button" onClick={() => onDetail(selectedHospital)}>병원 정보</button>
            {isBookable(selectedHospital) && <button className="primary" type="button" onClick={() => onApply(selectedHospital)}>진료 신청</button>}
          </div>
        </article>
      )}
    </section>
  );
}

function regionLabel(selection: RegionSelection) {
  return [
    selection.city,
    selection.district === '전체' ? '' : selection.district,
    selection.neighborhood === '전체' ? '' : selection.neighborhood
  ].filter(Boolean).join(' ');
}

function RegionPicker({
  selection,
  onSelect,
  onClose
}: {
  selection: RegionSelection;
  onSelect: (selection: RegionSelection) => void;
  onClose: () => void;
}) {
  const [city, setCity] = useState(selection.city);
  const [expandedDistrict, setExpandedDistrict] = useState(
    selection.district === '전체' ? Object.keys(REGION_TREE[selection.city])[0] : selection.district
  );
  const districts = REGION_TREE[city];

  const choose = (next: RegionSelection) => {
    onSelect(next);
    onClose();
  };

  return (
    <div className="adot-dialog-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="adot-dialog adot-region-dialog" role="dialog" aria-modal="true" aria-labelledby="region-dialog-title" onMouseDown={(event) => event.stopPropagation()}>
        <header className="adot-dialog-head">
          <div>
            <span>상담 대상 지역</span>
            <h2 id="region-dialog-title">지역을 선택해 주세요</h2>
          </div>
          <button type="button" aria-label="지역 선택 닫기" onClick={onClose}><FiX /></button>
        </header>
        <div className="adot-region-body">
          <nav className="adot-region-cities" aria-label="시·도 선택">
            {Object.keys(REGION_TREE).map((item) => (
              <button
                key={item}
                className={city === item ? 'selected' : ''}
                type="button"
                onClick={() => {
                  setCity(item);
                  setExpandedDistrict(Object.keys(REGION_TREE[item])[0]);
                }}
              >
                {item}
              </button>
            ))}
          </nav>
          <div className="adot-region-options">
            <button
              className={`adot-region-all ${selection.city === city && selection.district === '전체' ? 'selected' : ''}`}
              type="button"
              onClick={() => choose({ city, district: '전체', neighborhood: '전체' })}
            >
              <span>{city} 전체</span>
              {selection.city === city && selection.district === '전체' && <FiCheck />}
            </button>
            {Object.entries(districts).map(([district, neighborhoods]) => {
              const expanded = expandedDistrict === district;
              const districtSelected = selection.city === city && selection.district === district;
              return (
                <div className="adot-region-district" key={district}>
                  <button className={districtSelected ? 'selected' : ''} type="button" onClick={() => setExpandedDistrict(district)}>
                    <span>{district}</span>{expanded ? <FiChevronUp /> : <FiChevronDown />}
                  </button>
                  {expanded && (
                    <div className="adot-neighborhoods">
                      {neighborhoods.map((neighborhood) => {
                        const selected = districtSelected && selection.neighborhood === neighborhood;
                        return (
                          <button
                            key={neighborhood}
                            className={selected ? 'selected' : ''}
                            type="button"
                            onClick={() => choose({ city, district, neighborhood })}
                          >
                            <span>{neighborhood === '전체' ? `${district} 전체` : neighborhood}</span>
                            {selected && <FiCheck />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

function DepartmentPicker({
  selection,
  onSelect,
  onClose
}: {
  selection: string;
  onSelect: (selection: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="adot-dialog-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="adot-dialog adot-department-dialog" role="dialog" aria-modal="true" aria-labelledby="department-dialog-title" onMouseDown={(event) => event.stopPropagation()}>
        <header className="adot-dialog-head">
          <div>
            <span>진료과 선택</span>
            <h2 id="department-dialog-title">어떤 병원을 찾고 계신가요?</h2>
          </div>
          <button type="button" aria-label="진료과 선택 닫기" onClick={onClose}><FiX /></button>
        </header>
        <div className="adot-department-grid">
          {DEPARTMENTS.map((item) => (
            <button
              key={item}
              className={selection === item ? 'selected' : ''}
              type="button"
              onClick={() => { onSelect(item); onClose(); }}
            >
              {item}{selection === item && <FiCheck />}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function LinkScreen({
  selectedHospital,
  setSelectedHospital,
  onApply,
  onDetail
}: {
  selectedHospital: Hospital | null;
  setSelectedHospital: (hospital: Hospital | null) => void;
  onApply: (hospital: Hospital) => void;
  onDetail: (hospital: Hospital) => void;
}) {
  const [query, setQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [region, setRegion] = useState<RegionSelection>(DEFAULT_REGION);
  const [department, setDepartment] = useState('진료과 전체');
  const [departmentOpen, setDepartmentOpen] = useState(false);
  const [treatmentOpen, setTreatmentOpen] = useState(false);
  const [treatment, setTreatment] = useState<TreatmentSelection>(null);
  const [openOnly, setOpenOnly] = useState(false);
  const [bookableOnly, setBookableOnly] = useState(false);
  const [nightOnly, setNightOnly] = useState(false);
  const [holidayOnly, setHolidayOnly] = useState(false);
  const [femaleOnly, setFemaleOnly] = useState(false);

  useEffect(() => {
    const closePopovers = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setSearchFocused(false);
      setLocationOpen(false);
      setDepartmentOpen(false);
      setTreatmentOpen(false);
    };
    window.addEventListener('keydown', closePopovers);
    return () => window.removeEventListener('keydown', closePopovers);
  }, []);

  const result = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    let expandedQueryItems: string[] = [];
    TREATMENT_TREE.forEach((major) => major.groups.forEach((group) => {
      if (group.middle.toLowerCase().includes(normalized)) expandedQueryItems = [...expandedQueryItems, ...group.items];
    }));

    return HOSPITALS.filter((hospital) => {
      const unifiedTags = [...hospital.managedTags, ...hospital.treatmentItems];
      const directText = [hospital.name, hospital.department, hospital.address, ...unifiedTags].join(' ').toLowerCase();
      const queryMatched = !normalized || directText.includes(normalized) || expandedQueryItems.some((item) => unifiedTags.includes(item));
      const regionMatched = (region.city === '전체' || hospital.region.city === region.city)
        && (region.district === '전체' || hospital.region.district === region.district)
        && (region.neighborhood === '전체' || hospital.region.neighborhood === region.neighborhood);
      const departmentMatched = department === '진료과 전체' || hospital.department === department;
      let treatmentMatched = true;
      if (treatment?.level === 'item') {
        treatmentMatched = unifiedTags.includes(treatment.item || '');
      } else if (treatment?.level === 'middle') {
        const group = TREATMENT_TREE.find((entry) => entry.major === treatment.major)?.groups.find((entry) => entry.middle === treatment.middle);
        treatmentMatched = Boolean(group?.items.some((item) => unifiedTags.includes(item)) || unifiedTags.includes(treatment.middle));
      }
      const isOpen = hospital.operationState === 'open';
      return queryMatched
        && regionMatched
        && departmentMatched
        && treatmentMatched
        && (!openOnly || isOpen)
        && (!bookableOnly || isBookable(hospital))
        && (!nightOnly || hospital.night)
        && (!holidayOnly || hospital.holiday)
        && (!femaleOnly || hospital.femaleDoctor);
    });
  }, [query, region, department, treatment, openOnly, bookableOnly, nightOnly, holidayOnly, femaleOnly]);
  const displayedSelectedHospital = selectedHospital && result.some((hospital) => hospital.id === selectedHospital.id)
    ? selectedHospital
    : null;

  const selectTreatment = (next: TreatmentSelection, label?: string) => {
    setTreatment(next);
    if (label) setQuery(label);
    setSearchFocused(false);
    setSelectedHospital(null);
  };

  const selectSearchSuggestion = (suggestion: SearchSuggestionItem) => {
    setQuery(suggestion.label);
    setSearchFocused(false);
    if (suggestion.kind === 'region') {
      setRegion(suggestion.selection);
      setSelectedHospital(null);
      return;
    }
    if (suggestion.kind === 'department') {
      setDepartment(suggestion.department);
      setSelectedHospital(null);
      return;
    }
    if (suggestion.kind === 'treatment') {
      setTreatment(suggestion.treatment);
      setSelectedHospital(null);
      return;
    }
    setSelectedHospital(suggestion.hospital);
  };

  const clearAll = () => {
    setQuery('');
    setRegion(DEFAULT_REGION);
    setDepartment('진료과 전체');
    setTreatment(null);
    setOpenOnly(false);
    setBookableOnly(false);
    setNightOnly(false);
    setHolidayOnly(false);
    setFemaleOnly(false);
    setSelectedHospital(null);
  };

  const regionChanged = region.city !== DEFAULT_REGION.city
    || region.district !== DEFAULT_REGION.district
    || region.neighborhood !== DEFAULT_REGION.neighborhood;
  const hasFilter = Boolean(query || regionChanged || treatment || department !== '진료과 전체' || openOnly || bookableOnly || nightOnly || holidayOnly || femaleOnly);

  return (
    <main className="adot-link-screen">
      <section className="adot-search-panel">
        <div className="adot-search-line">
          <div className={`adot-search-box ${searchFocused ? 'focused' : ''}`}>
            <FiSearch />
            <input
              value={query}
              onChange={(event) => { setQuery(event.target.value); setSearchFocused(true); setSelectedHospital(null); }}
              onFocus={() => setSearchFocused(true)}
              placeholder="증상, 진료과, 병원명, 진료항목 검색"
              aria-label="병원 검색"
              aria-expanded={searchFocused && Boolean(query)}
            />
            {query && <button type="button" aria-label="검색어 지우기" onClick={() => { setQuery(''); setTreatment(null); }}><FiX /></button>}
            {searchFocused && <SearchSuggestion query={query} onSelect={selectSearchSuggestion} />}
          </div>
        </div>
        <div className="adot-preset-line">
          <button
            className="adot-preset-button"
            aria-expanded={locationOpen}
            type="button"
            onClick={() => {
              setLocationOpen(true);
              setDepartmentOpen(false);
              setTreatmentOpen(false);
              setSearchFocused(false);
            }}
          >
            <FiMapPin /><span>{regionLabel(region)}</span><FiChevronDown />
          </button>
          <button
            className={department !== '진료과 전체' ? 'adot-preset-button active' : 'adot-preset-button'}
            aria-expanded={departmentOpen}
            type="button"
            onClick={() => {
              setDepartmentOpen(true);
              setLocationOpen(false);
              setTreatmentOpen(false);
              setSearchFocused(false);
            }}
          >
            <span>{department}</span><FiChevronDown />
          </button>
          <div className="adot-filter-wrap">
            <button aria-expanded={treatmentOpen} className={treatment ? 'adot-filter adot-treatment-preset active' : 'adot-filter adot-treatment-preset'} type="button" onClick={() => { setTreatmentOpen((value) => !value); setLocationOpen(false); setDepartmentOpen(false); setSearchFocused(false); }}>
              {selectionLabel(treatment)}{treatmentOpen ? <FiChevronUp /> : <FiChevronDown />}
            </button>
            {treatmentOpen && <TreatmentPicker selection={treatment} onSelect={selectTreatment} onClose={() => setTreatmentOpen(false)} />}
          </div>
        </div>
        {locationOpen && <RegionPicker selection={region} onSelect={(next) => { setRegion(next); setSelectedHospital(null); }} onClose={() => setLocationOpen(false)} />}
        {departmentOpen && <DepartmentPicker selection={department} onSelect={(next) => { setDepartment(next); setSelectedHospital(null); }} onClose={() => setDepartmentOpen(false)} />}
        <div className="adot-filter-line">
          <button aria-pressed={openOnly} className={openOnly ? 'adot-filter active' : 'adot-filter'} type="button" onClick={() => setOpenOnly((value) => !value)}>{openOnly && <FiCheck />}진료중</button>
          <button aria-pressed={bookableOnly} className={bookableOnly ? 'adot-filter active' : 'adot-filter'} type="button" onClick={() => setBookableOnly((value) => !value)}>{bookableOnly && <FiCheck />}굿닥 예약 가능</button>
          <button aria-pressed={nightOnly} className={nightOnly ? 'adot-filter active' : 'adot-filter'} type="button" onClick={() => setNightOnly((value) => !value)}>{nightOnly && <FiCheck />}야간</button>
          <button aria-pressed={holidayOnly} className={holidayOnly ? 'adot-filter active' : 'adot-filter'} type="button" onClick={() => setHolidayOnly((value) => !value)}>{holidayOnly && <FiCheck />}휴일</button>
          <button aria-pressed={femaleOnly} className={femaleOnly ? 'adot-filter active' : 'adot-filter'} type="button" onClick={() => setFemaleOnly((value) => !value)}>{femaleOnly && <FiCheck />}여의사</button>
          {hasFilter && <button className="adot-reset" type="button" onClick={clearAll}>초기화</button>}
        </div>
      </section>

      <div className="adot-result-layout">
        <section className="adot-result-list" aria-label="병원 검색 결과">
          <div className="adot-result-head">
            <h1 aria-live="polite">검색 결과 <strong>{result.length}개</strong></h1>
            <span>거리순</span>
          </div>
          {result.length > 0 ? result.map((hospital) => (
            <HospitalRow
              key={hospital.id}
              hospital={hospital}
              selected={displayedSelectedHospital?.id === hospital.id}
              onSelect={() => setSelectedHospital(displayedSelectedHospital?.id === hospital.id ? null : hospital)}
            />
          )) : (
            <div className="adot-empty">
              <FiSearch />
              <strong>조건에 맞는 병원이 없습니다.</strong>
              <p>검색어나 필터를 변경해 다시 확인해 주세요.</p>
              <button type="button" onClick={clearAll}>검색 조건 초기화</button>
            </div>
          )}
        </section>
        <MapPanel
          hospitals={result}
          selectedHospital={displayedSelectedHospital}
          onSelect={(hospital) => setSelectedHospital(displayedSelectedHospital?.id === hospital.id ? null : hospital)}
          onApply={onApply}
          onDetail={onDetail}
        />
      </div>
    </main>
  );
}

function HospitalDetailModal({ hospital, onClose, onApply }: { hospital: Hospital; onClose: () => void; onApply: () => void }) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div className="adot-overlay-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="adot-hospital-modal" role="dialog" aria-modal="true" aria-labelledby="hospital-detail-title">
        <header className="adot-overlay-header">
          <div><span>병원 정보</span><strong>지도와 검색 조건은 그대로 유지됩니다.</strong></div>
          <button type="button" onClick={onClose} aria-label="병원 정보 닫기"><FiX /></button>
        </header>
        <div className="adot-detail-grid">
        <section className="adot-hospital-hero">
          <img src={hospital.image} alt="샘플 병원 내부" />
          <div>
            <div className="adot-title-with-badge">
              <h1 id="hospital-detail-title">{hospital.name}</h1>
              {isBookable(hospital) && <em className="adot-booking-badge">굿닥 예약</em>}
            </div>
            <p>{hospital.department} · {hospital.address}</p>
            <div className="adot-detail-score"><FiStar /> {hospital.rating} <span>방문자 의견 {hospital.reviews}</span></div>
          </div>
        </section>
        <aside className="adot-apply-card">
          <strong>운영 정보</strong>
          <div className="adot-detail-operation"><FiClock /><b className={operationClass(hospital.operationState)}>{hospital.operationLabel}</b><span>{hospital.operationNext}</span></div>
          <div><FiPhone /><span>{hospital.phone}</span></div>
          {isBookable(hospital) ? (
            <button className="adot-primary" type="button" onClick={onApply}>진료 신청</button>
          ) : (
            <p className="adot-unavailable-note">현재 굿닥을 통한 진료 신청을 지원하지 않습니다.</p>
          )}
        </aside>
        <section className="adot-detail-section">
          <h2>병원 정보</h2>
          <p>{hospital.description}</p>
          <dl>
            <div><dt>진료과</dt><dd>{hospital.department}</dd></div>
            <div><dt>주소</dt><dd>{hospital.address}</dd></div>
            <div><dt>운영 상태</dt><dd>{hospital.operationLabel} · {hospital.operationNext}</dd></div>
          </dl>
        </section>
        <section className="adot-detail-section">
          <h2>확인 가능한 진료 정보</h2>
          <p className="adot-section-desc">검색용 태그와 진료항목 정보를 함께 활용합니다.</p>
          <div className="adot-detail-tags">
            {Array.from(new Set([...hospital.managedTags, ...hospital.treatmentItems])).map((tag) => <span key={tag}>{tag}</span>)}
          </div>
        </section>
        </div>
      </section>
    </div>
  );
}

function ApplicationPanel({ hospital, onCancel, onComplete }: { hospital: Hospital; onCancel: () => void; onComplete: (summary: BookingSummary) => void }) {
  const patientPreview = new URLSearchParams(window.location.search).get('patient');
  const [patientName, setPatientName] = useState('김굿닥');
  const [birthDate, setBirthDate] = useState('1991-05-23');
  const [gender, setGender] = useState<'female' | 'male'>('female');
  const [phone, setPhone] = useState('010-1234-5678');
  const [lookupConsent, setLookupConsent] = useState(() => patientPreview === 'new' || patientPreview === 'waiting' || patientPreview === 'verified');
  const [patientStatus, setPatientStatus] = useState<'idle' | 'searching' | 'new' | 'waiting' | 'verified'>(() => {
    if (patientPreview === 'new' || patientPreview === 'waiting' || patientPreview === 'verified') return patientPreview;
    return 'idle';
  });
  const [pollCount, setPollCount] = useState(0);
  const examRooms = [
    { id: 'room-1', name: `${hospital.department} 1진료실`, doctor: `${hospital.department} · 김굿닥 원장`, description: '감기·소화기·건강검진 예약', available: true },
    { id: 'room-2', name: `${hospital.department} 2진료실`, doctor: `${hospital.department} · 이샘플 원장`, description: '일반 진료 및 만성질환 상담', available: true },
    { id: 'room-3', name: `${hospital.department} 3진료실`, doctor: `${hospital.department} · 박건강 원장`, description: '오늘 예약 마감', available: false }
  ];
  const visitPurposes = ['감기·몸살', '소화기 증상', '건강검진 상담', '기타 진료'];
  const availableDates = [1, 2, 5, 6, 7, 8, 12, 13, 14, 15, 19, 20, 21, 22, 26, 27, 28, 29];
  const [examRoomId, setExamRoomId] = useState(examRooms[0].id);
  const [purpose, setPurpose] = useState(visitPurposes[0]);
  const [selectedDay, setSelectedDay] = useState(1);
  const [appointmentMode, setAppointmentMode] = useState<'time' | 'arrival'>('time');
  const [schedule, setSchedule] = useState(hospital.availableSlots[0] || '');
  const [agreed, setAgreed] = useState(false);
  const patientVerified = patientStatus === 'verified';
  const selectedRoom = examRooms.find((room) => room.id === examRoomId) || examRooms[0];
  const formattedSchedule = appointmentMode === 'arrival'
    ? `2026.10.${String(selectedDay).padStart(2, '0')} 선착순 예약`
    : `2026.10.${String(selectedDay).padStart(2, '0')} ${schedule}`;
  const maskedPatientName = `${patientName.slice(0, 1) || '고'}○○`;
  const phoneDigits = phone.replace(/\D/g, '');
  const maskedPhone = phoneDigits.length >= 7 ? `${phoneDigits.slice(0, 3)}-****-${phoneDigits.slice(-4)}` : '010-****-****';
  const maskedBirthDate = birthDate ? `${birthDate.slice(0, 4)}-**-**` : '****-**-**';
  const maskedFourCode = `${maskedPatientName} · ${maskedBirthDate} · ${gender === 'female' ? '여성' : '남성'} · ${maskedPhone}`;

  const resetPatientLookup = () => {
    setPatientStatus('idle');
    setPollCount(0);
    setAgreed(false);
  };

  const lookupPatient = () => {
    if (!lookupConsent || !patientName.trim() || !birthDate || !phone.trim()) return;
    setPatientStatus('searching');
    window.setTimeout(() => setPatientStatus('new'), 850);
  };

  const sendVerificationLink = () => {
    setPollCount(0);
    setPatientStatus('waiting');
  };

  const pollVerification = () => setPollCount((current) => {
    const next = current + 1;
    if (next >= 3) setPatientStatus('verified');
    return next;
  });

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => event.key === 'Escape' && onCancel();
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onCancel]);

  useEffect(() => {
    if (patientStatus !== 'waiting') return undefined;
    const timer = window.setInterval(() => {
      setPollCount((current) => {
        const next = current + 1;
        if (next >= 3) setPatientStatus('verified');
        return next;
      });
    }, 1800);
    return () => window.clearInterval(timer);
  }, [patientStatus]);

  return (
    <div className="adot-panel-layer" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onCancel()}>
      <aside className="adot-side-panel" role="dialog" aria-modal="true" aria-labelledby="application-panel-title">
        <header className="adot-overlay-header sticky">
          <div><span>진료 신청</span><strong id="application-panel-title">{hospital.name}</strong></div>
          <button type="button" onClick={onCancel} aria-label="진료 신청 취소하고 닫기"><FiX /></button>
        </header>
        <div className="adot-panel-scroll">
          <div className="adot-application-head">
            <h1>진료 신청서</h1>
            <p>상담 중 확인한 내용을 순서대로 입력해 주세요.</p>
          </div>
          <ol className="adot-stepper" aria-label="신청 단계">
        <li className="active"><b>1</b><span>환자 확인</span></li>
        <li className={patientVerified ? 'active' : ''}><b>2</b><span>진료 목적</span></li>
        <li className={patientVerified ? 'active' : ''}><b>3</b><span>예약 일시</span></li>
        <li className={patientVerified && agreed ? 'active' : ''}><b>4</b><span>최종 확인</span></li>
          </ol>
          <form className="adot-application" onSubmit={(event) => {
        event.preventDefault();
        if (patientVerified && agreed && (appointmentMode === 'arrival' || schedule)) {
          onComplete({ patient: maskedFourCode, room: selectedRoom.name, purpose, schedule: formattedSchedule });
        }
      }}>
        <section>
          <div className="adot-form-title"><b>1</b><div><h2>환자 정보 확인</h2><p>먼저 기본정보로 병원의 기존 환자인지 조회합니다.</p></div></div>
          <label className="adot-lookup-consent">
            <input type="checkbox" checked={lookupConsent} onChange={(event) => {
              setLookupConsent(event.target.checked);
              if (!event.target.checked) resetPatientLookup();
            }} />
            <span><b>필수 · 고객의 정보 이용 동의를 확인했습니다.</b><small>이름·생년월일·성별·휴대전화번호를 병원 환자 조회에 사용하는 것에 대해 고객에게 안내하고 동의 여부를 확인합니다.</small></span>
          </label>
          <div className="adot-patient-fields">
            <label><span>이름</span><input value={patientName} onChange={(event) => { setPatientName(event.target.value); resetPatientLookup(); }} placeholder="이름 입력" /></label>
            <label><span>생년월일</span><input type="date" value={birthDate} onChange={(event) => { setBirthDate(event.target.value); resetPatientLookup(); }} /></label>
            <fieldset>
              <legend>성별</legend>
              <div className="adot-gender-options">
                <button className={gender === 'female' ? 'selected' : ''} type="button" onClick={() => { setGender('female'); resetPatientLookup(); }}>여성</button>
                <button className={gender === 'male' ? 'selected' : ''} type="button" onClick={() => { setGender('male'); resetPatientLookup(); }}>남성</button>
              </div>
            </fieldset>
            <label><span>휴대전화번호</span><input inputMode="tel" value={phone} onChange={(event) => { setPhone(event.target.value); resetPatientLookup(); }} placeholder="010-0000-0000" /></label>
          </div>
          <button className="adot-patient-lookup" type="button" disabled={!lookupConsent || patientStatus === 'searching' || !patientName.trim() || !birthDate || !phone.trim()} onClick={lookupPatient}>
            {patientStatus === 'searching' ? <><FiRefreshCw className="spinning" /> 환자 정보를 조회하고 있습니다</> : <><FiSearch /> 환자 조회하기</>}
          </button>

          {patientStatus === 'new' && (
            <div className="adot-patient-status new" role="status">
              <div className="adot-status-heading"><FiUser /><div><span>조회 결과</span><strong>환자 기록이 조회되지 않습니다.</strong></div></div>
              <div className="adot-four-code"><span>조회 4코드</span><strong>{maskedFourCode}</strong></div>
              <p>예약 신청을 위해 고객이 직접 주민등록번호 뒷자리 7자리와 필수 동의를 입력해야 합니다. 상담사 화면에는 번호가 표시되지 않습니다.</p>
              <button type="button" onClick={sendVerificationLink}><FiSend /> 고객 확인 링크 발송</button>
            </div>
          )}

          {patientStatus === 'waiting' && (
            <div className="adot-patient-status waiting" role="status" aria-live="polite">
              <div className="adot-status-heading"><FiRefreshCw className="spinning" /><div><span>고객 확인 요청 발송 완료</span><strong>고객 입력을 기다리고 있습니다.</strong></div></div>
              <div className="adot-four-code"><span>조회 4코드</span><strong>{maskedFourCode}</strong></div>
              <p>알림톡 발송에 실패하면 문자로 자동 대체 발송합니다. 고객은 링크에서 주민등록번호 뒷자리만 입력합니다.</p>
              <div className="adot-polling-line"><span><i /> 2초마다 자동으로 상태 확인 중</span><small>{pollCount + 1}회 확인</small></div>
              <button className="secondary" type="button" onClick={pollVerification}><FiRefreshCw /> 지금 다시 확인</button>
            </div>
          )}

          {patientStatus === 'verified' && (
            <div className="adot-patient-status verified" role="status">
              <div className="adot-status-heading"><FiCheck /><div><span>고객 확인 완료</span><strong>예약 신청을 계속할 수 있습니다.</strong></div></div>
              <div className="adot-four-code"><span>확인된 4코드</span><strong>{maskedFourCode}</strong></div>
              <p>주민등록번호 뒷자리와 필수 동의가 안전하게 저장되었습니다. 상담사에게 원문 정보는 노출되지 않습니다.</p>
            </div>
          )}
        </section>
        <section className={!patientVerified ? 'adot-form-section-locked' : ''} aria-disabled={!patientVerified}>
          <div className="adot-form-title"><b>2</b><div><h2>진료실·내원 목적</h2><p>병원이 예약용으로 운영하는 진료실과 내원 목적을 순서대로 선택합니다.</p></div></div>
          {!patientVerified && <p className="adot-lock-note">환자 확인을 완료하면 선택할 수 있습니다.</p>}
          <div className="adot-booking-subtitle"><strong>진료실을 선택해 주세요</strong><span>예약 가능 진료실 {examRooms.filter((room) => room.available).length}개</span></div>
          <div className="adot-room-list">
            {examRooms.map((room) => (
              <button
                className={examRoomId === room.id ? 'selected' : ''}
                disabled={!patientVerified || !room.available}
                type="button"
                key={room.id}
                onClick={() => setExamRoomId(room.id)}
              >
                <span className="adot-room-radio" aria-hidden="true" />
                <span><strong>{room.name}</strong><small>{room.doctor}</small><em>{room.description}</em></span>
                {!room.available && <b>마감</b>}
              </button>
            ))}
          </div>
          <div className="adot-booking-subtitle purpose"><strong>내원 목적을 선택해 주세요</strong><span>1개 선택</span></div>
          <div className="adot-chip-grid">
            {visitPurposes.map((item) => (
              <button className={purpose === item ? 'selected' : ''} disabled={!patientVerified} type="button" key={item} onClick={() => setPurpose(item)}>{item}</button>
            ))}
          </div>
          <p className="adot-booking-helper"><FiInfo /> 위 항목은 병원이 해당 진료실에 설정한 예약용 내원 목적입니다. 검색에 사용한 비급여 진료정보와는 별개입니다.</p>
        </section>
        <section className={!patientVerified ? 'adot-form-section-locked' : ''} aria-disabled={!patientVerified}>
          <div className="adot-form-title"><b>3</b><div><h2>예약 일시</h2><p>조회 시점의 예약 가능 일시입니다.</p></div></div>
          {!patientVerified && <p className="adot-lock-note">환자 확인을 완료하면 예약 시간을 선택할 수 있습니다.</p>}
          {hospital.availableSlots.length > 0 ? <>
            <div className="adot-calendar">
              <div className="adot-calendar-head"><button type="button" disabled aria-label="이전 달"><FiChevronLeft /></button><strong>2026년 10월</strong><button type="button" disabled aria-label="다음 달"><FiChevronRight /></button></div>
              <div className="adot-calendar-week"><span>일</span><span>월</span><span>화</span><span>수</span><span>목</span><span>금</span><span>토</span></div>
              <div className="adot-calendar-days">
                {Array.from({ length: 4 }).map((_, index) => <span key={`empty-${index}`} />)}
                {Array.from({ length: 31 }).map((_, index) => {
                  const day = index + 1;
                  const available = availableDates.includes(day);
                  return <button className={selectedDay === day ? 'selected' : ''} disabled={!patientVerified || !available} type="button" key={day} onClick={() => setSelectedDay(day)}>{day}</button>;
                })}
              </div>
              <div className="adot-calendar-legend"><span><i />예약 가능</span><span><i className="selected" />선택일</span></div>
            </div>
            <div className="adot-selected-date"><FiCalendar /><div><small>선택한 날짜</small><strong>10월 {selectedDay}일 ({['일', '월', '화', '수', '목', '금', '토'][new Date(2026, 9, selectedDay).getDay()]})</strong></div><span>예약 가능</span></div>
            <div className="adot-booking-mode" role="group" aria-label="예약 방식">
              <button className={appointmentMode === 'time' ? 'selected' : ''} disabled={!patientVerified} type="button" onClick={() => setAppointmentMode('time')}>시간 예약</button>
              <button className={appointmentMode === 'arrival' ? 'selected' : ''} disabled={!patientVerified} type="button" onClick={() => setAppointmentMode('arrival')}>선착순 예약</button>
            </div>
            {appointmentMode === 'time' ? <div className="adot-slot-groups">
              <div><strong>오전</strong><div className="adot-time-grid">
                {['09:30', '10:00', '10:30', '11:00', '11:30'].map((time) => (
                  <button className={schedule === time ? 'selected' : ''} disabled={!patientVerified || time === '11:30'} type="button" key={time} onClick={() => setSchedule(time)}>{time}{time === '11:30' && <small>마감</small>}</button>
                ))}
              </div></div>
              <div><strong>오후</strong><div className="adot-time-grid">
                {['14:00', '14:30', '15:00', '15:30', '16:30'].map((time) => (
                  <button className={schedule === time ? 'selected' : ''} disabled={!patientVerified || time === '16:30'} type="button" key={time} onClick={() => setSchedule(time)}>{time}{time === '16:30' && <small>마감</small>}</button>
                ))}
              </div></div>
            </div> : <div className="adot-arrival-note"><FiClock /><div><strong>도착 순서대로 진료합니다.</strong><p>선택한 날짜의 운영시간 안에 방문하도록 고객에게 안내해 주세요. 실제 대기시간은 병원 상황에 따라 달라질 수 있습니다.</p></div></div>}
          </> : (
            <div className="adot-no-slot"><FiCalendar /><div><strong>현재 선택 가능한 예약 시간이 없습니다.</strong><p>예약 설정과 실제 잔여 시간은 다를 수 있습니다. 다른 병원을 선택해 주세요.</p></div></div>
          )}
        </section>
        <section className={!patientVerified ? 'adot-form-section-locked' : ''} aria-disabled={!patientVerified}>
          <div className="adot-form-title"><b>4</b><div><h2>신청 내용 확인</h2><p>신청 직전 최신 예약 가능 여부를 다시 확인합니다.</p></div></div>
          <dl className="adot-summary-list">
            <div><dt>4코드</dt><dd>{patientVerified ? maskedFourCode : '환자 확인 필요'}</dd></div>
            <div><dt>진료실</dt><dd>{selectedRoom.name}</dd></div>
            <div><dt>진료 목적</dt><dd>{purpose}</dd></div>
            <div><dt>예약 일시</dt><dd>{appointmentMode === 'arrival' || schedule ? formattedSchedule : '선택 가능한 시간 없음'}</dd></div>
          </dl>
          <label className="adot-consent">
            <input type="checkbox" disabled={!patientVerified} checked={agreed} onChange={(event) => setAgreed(event.target.checked)} />
            <span><b>필수 안내를 확인했습니다.</b> 이 화면은 검토용이며 실제 환자 정보나 예약은 전송되지 않습니다.</span>
          </label>
        </section>
            <button className="adot-submit" type="submit" disabled={!patientVerified || !agreed || (appointmentMode === 'time' && !schedule)}>진료 신청 완료</button>
          </form>
        </div>
      </aside>
    </div>
  );
}

function SuccessPanel({ hospital, summary, onHistory, onClose }: { hospital: Hospital; summary: BookingSummary; onHistory: () => void; onClose: () => void }) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div className="adot-panel-layer result" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <aside className="adot-side-panel" role="dialog" aria-modal="true" aria-labelledby="success-panel-title">
        <header className="adot-overlay-header sticky">
          <div><span>신청 결과</span><strong>{hospital.name}</strong></div>
          <button type="button" onClick={onClose} aria-label="신청 결과 닫기"><FiX /></button>
        </header>
        <div className="adot-panel-scroll result-body">
          <main className="adot-success">
            <div className="adot-success-icon"><FiCheck /></div>
            <h1 id="success-panel-title">진료 신청이 완료되었습니다.</h1>
            <p>검토용 프로토타입으로 실제 예약은 생성되지 않았습니다.</p>
            <dl>
              <div><dt>병원</dt><dd>{hospital.name}</dd></div>
              <div><dt>신청 번호</dt><dd>LINK-260930-0153</dd></div>
              <div><dt>4코드</dt><dd>{summary.patient}</dd></div>
              <div><dt>진료실</dt><dd>{summary.room}</dd></div>
              <div><dt>진료 목적</dt><dd>{summary.purpose}</dd></div>
              <div><dt>예약 일시</dt><dd>{summary.schedule}</dd></div>
            </dl>
            <div><button className="secondary" type="button" onClick={onClose}>새 진료 연결</button><button className="adot-primary" type="button" onClick={onHistory}>연결 이력 확인</button></div>
          </main>
        </div>
      </aside>
    </div>
  );
}

function HistoryScreen({ onDetail }: { onDetail: (record: HistoryRecord) => void }) {
  const [query, setQuery] = useState('');
  const [state, setState] = useState('전체 상태');
  const [period, setPeriod] = useState('최근 30일');
  const filtered = HISTORY.filter((record) => {
    const hospital = HOSPITALS.find((item) => item.id === record.hospitalId);
    const matches = [record.id, record.patient, record.purpose, hospital?.name || ''].join(' ').toLowerCase().includes(query.toLowerCase());
    const periodMatched = period !== '오늘' || record.createdAt.startsWith('2026.09.30');
    return matches && periodMatched && (state === '전체 상태' || record.state === state);
  });
  return (
    <main className="adot-history-page">
      <header><span>상담사별 진료 연결 기록</span><h1>연결 이력</h1><p>신청 결과와 후속 상태를 확인할 수 있습니다.</p></header>
      <section className="adot-history-filters">
        <div><FiSearch /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="신청번호, 환자, 병원명 검색" /></div>
        <select aria-label="기간" value={period} onChange={(event) => setPeriod(event.target.value)}><option>최근 30일</option><option>최근 7일</option><option>오늘</option></select>
        <select aria-label="상태" value={state} onChange={(event) => setState(event.target.value)}>
          <option>전체 상태</option><option>신청 완료</option><option>진료 완료</option><option>예약 취소</option>
        </select>
      </section>
      <section className="adot-history-table">
        <div className="adot-table-head"><span>신청 일시</span><span>환자</span><span>병원</span><span>진료 목적</span><span>상태</span><span /></div>
        {filtered.map((record) => {
          const hospital = HOSPITALS.find((item) => item.id === record.hospitalId);
          return (
            <button type="button" key={record.id} onClick={() => onDetail(record)}>
              <span><b>{record.createdAt}</b><small>{record.id}</small></span>
              <span>{record.patient}</span>
              <span>{hospital?.name}</span>
              <span>{record.purpose}</span>
              <span><em className={`state-${record.state.replace(' ', '-')}`}>{record.state}</em></span>
              <span><FiChevronRight /></span>
            </button>
          );
        })}
      </section>
    </main>
  );
}

function HistoryDetail({ record, onBack }: { record: HistoryRecord; onBack: () => void }) {
  const hospital = HOSPITALS.find((item) => item.id === record.hospitalId) || HOSPITALS[0];
  return (
    <main className="adot-subpage narrow">
      <BreadcrumbBack label="연결 이력으로 돌아가기" onBack={onBack} />
      <div className="adot-record-head"><span>{record.id}</span><h1>연결 내역 상세</h1><em className={`state-${record.state.replace(' ', '-')}`}>{record.state}</em></div>
      <section className="adot-record-card">
        <h2>신청 정보</h2>
        <dl>
          <div><dt>신청 일시</dt><dd>{record.createdAt}</dd></div>
          <div><dt>환자</dt><dd>{record.patient}</dd></div>
          <div><dt>병원</dt><dd>{hospital.name}</dd></div>
          <div><dt>진료 목적</dt><dd>{record.purpose}</dd></div>
          <div><dt>예약 일시</dt><dd>{record.schedule}</dd></div>
        </dl>
      </section>
      <section className="adot-record-card">
        <h2>처리 흐름</h2>
        <ol className="adot-timeline">
          <li className="done"><b><FiCheck /></b><div><strong>상담사가 신청을 완료했습니다.</strong><span>{record.createdAt}</span></div></li>
          <li className={record.state === '신청 완료' ? '' : 'done'}><b>{record.state === '신청 완료' ? '2' : <FiCheck />}</b><div><strong>{record.state === '예약 취소' ? '병원에서 예약을 취소했습니다.' : record.state === '진료 완료' ? '병원에서 진료 완료로 처리했습니다.' : '병원 처리 결과를 기다리고 있습니다.'}</strong><span>상태는 병원 운영 과정에 따라 갱신됩니다.</span></div></li>
        </ol>
      </section>
    </main>
  );
}

function ProfileScreen() {
  return (
    <main className="adot-subpage narrow">
      <div className="adot-profile-head"><span className="adot-avatar">김</span><div><span>상담사 정보</span><h1>김○○</h1><p>에이닷 진료 연결 운영 계정</p></div></div>
      <section className="adot-record-card">
        <h2>계정 정보</h2>
        <dl>
          <div><dt>상담사 ID</dt><dd>agent-demo-021</dd></div>
          <div><dt>소속</dt><dd>SKT 에이닷 상담 운영</dd></div>
          <div><dt>권한</dt><dd>병원 탐색 · 진료 신청 · 연결 이력 조회</dd></div>
        </dl>
      </section>
      <p className="adot-data-note"><FiInfo /> 모든 화면은 샘플 데이터로 구성되어 있으며 실제 환자 정보와 연결되지 않습니다.</p>
    </main>
  );
}

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  return (
    <main className="adot-login">
      <section className="adot-login-intro">
        <em className="adot-login-preview">개발 협의용 시안</em>
        <div className="adot-login-brand"><strong>KT</strong><span>×</span><b>굿닥</b></div>
        <span>진료 연결 지원 도구</span>
        <h1>필요한 병원을 찾고<br />진료 신청까지 연결합니다.</h1>
        <p>상담사용 검토 프로토타입입니다. 화면의 병원·환자 정보는 모두 가상 데이터입니다.</p>
      </section>
      <section className="adot-login-card">
        <h2>상담사 로그인</h2>
        <p>발급받은 상담사 계정으로 로그인해 주세요.</p>
        <label>상담사 ID<input defaultValue="agent-demo-021" /></label>
        <label>비밀번호<input type="password" defaultValue="prototype" /></label>
        <button type="button" onClick={onLogin}>로그인</button>
        <small>검토용 화면으로 입력 정보는 저장되지 않습니다.</small>
      </section>
    </main>
  );
}

export default function AdotClinicLinkingPage() {
  const [screen, setScreen] = useState<Screen>('link');
  const [connectionOverlay, setConnectionOverlay] = useState<ConnectionOverlay>(() => {
    const preview = new URLSearchParams(window.location.search).get('view');
    if (preview === 'hospital') return 'hospital-detail';
    if (preview === 'application' || preview === 'success') return preview;
    return null;
  });
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(HOSPITALS[0]);
  const [selectedRecord, setSelectedRecord] = useState<HistoryRecord>(HISTORY[0]);
  const [bookingSummary, setBookingSummary] = useState<BookingSummary>({ patient: '김○○ · 1991-**-** · 여성 · 010-****-5678', room: '내과 1진료실', purpose: '감기·몸살', schedule: '2026.10.01 10:30' });

  const navigate = (next: Screen) => {
    setConnectionOverlay(null);
    setScreen(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelApplication = () => {
    const confirmed = window.confirm('진료 신청을 취소할까요?\n입력한 내용은 저장되지 않으며, 병원 탐색 화면은 그대로 유지됩니다.');
    if (confirmed) setConnectionOverlay(null);
  };

  if (screen === 'login') return <div className="adot-app"><LoginScreen onLogin={() => navigate('link')} /></div>;

  return (
    <div className="adot-app">
      <TopNavigation screen={screen} onNavigate={navigate} onLogout={() => navigate('login')} />
      {screen === 'link' && (
        <LinkScreen
          selectedHospital={selectedHospital}
          setSelectedHospital={setSelectedHospital}
          onApply={(hospital) => { setSelectedHospital(hospital); setConnectionOverlay('application'); }}
          onDetail={(hospital) => { setSelectedHospital(hospital); setConnectionOverlay('hospital-detail'); }}
        />
      )}
      {screen === 'link' && connectionOverlay === 'hospital-detail' && selectedHospital && (
        <HospitalDetailModal hospital={selectedHospital} onClose={() => setConnectionOverlay(null)} onApply={() => setConnectionOverlay('application')} />
      )}
      {screen === 'link' && connectionOverlay === 'application' && selectedHospital && (
        <ApplicationPanel hospital={selectedHospital} onCancel={cancelApplication} onComplete={(summary) => { setBookingSummary(summary); setConnectionOverlay('success'); }} />
      )}
      {screen === 'link' && connectionOverlay === 'success' && selectedHospital && (
        <SuccessPanel hospital={selectedHospital} summary={bookingSummary} onHistory={() => navigate('history')} onClose={() => setConnectionOverlay(null)} />
      )}
      {screen === 'history' && <HistoryScreen onDetail={(record) => { setSelectedRecord(record); navigate('history-detail'); }} />}
      {screen === 'history-detail' && <HistoryDetail record={selectedRecord} onBack={() => navigate('history')} />}
      {screen === 'profile' && <ProfileScreen />}
    </div>
  );
}
