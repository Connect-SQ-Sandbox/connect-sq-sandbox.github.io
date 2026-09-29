/**
 * ┌─ 프로토타입 컨텍스트 ───────────────────────────────────
 * 이름     : A.Dot 상담사용 병원 탐색·진료 연결
 * 상태     : 개발 협의용 시안   버전: v1   최종수정: 2026-09-30
 * PRD      : Draft · 2026-09-29 개정 · 3-문제·해결/1-PRD/0-Draft/2026-09-16-에이닷-병원탐색-진료실예약-연동-PRD.md
 * 배포URL  : https://connect-sq-sandbox.github.io/out/adot-clinic-linking.html
 * 관련 CSS : styles/adotClinicLinking.css
 * 기술제약 : react-only · plain CSS · mock data · 네트워크 0
 *
 * 화면구성 : ① 로그인 ② 병원 탐색(목록·지도) ③ 병원 상세
 *            ④ 진료 신청서 ⑤ 연결 이력·상세 ⑥ 상담사 정보
 *
 * 핵심 결정:
 *   [협의안] 예약 가능한 병원에만 `굿닥 예약` 배지를 표시한다.
 *   [현행참고] 운영 상태 다음 문구는 다음 예약이 아닌 병원 운영시간을 뜻한다.
 *   [협의안] managedTags와 진료항목 태그를 하나의 검색 경험으로 제공한다.
 *   [협의안] 목록 행 선택 시 지도 포커스·정보 카드가 열리고, 그 안에서 신청을 시작한다.
 *   [제외] 실제 환자·병원 고객 데이터, 실제 신청/저장, 외부 네트워크 호출
 * └──────────────────────────────────────────────────────
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  FiArrowLeft,
  FiCalendar,
  FiCheck,
  FiChevronDown,
  FiChevronRight,
  FiChevronUp,
  FiClock,
  FiCrosshair,
  FiInfo,
  FiLogOut,
  FiMapPin,
  FiNavigation,
  FiPhone,
  FiSearch,
  FiStar,
  FiUser,
  FiX
} from 'react-icons/fi';
import hospital1 from '../../../assets/adot-clinic-linking/hospital-1.jpg';
import hospital2 from '../../../assets/adot-clinic-linking/hospital-2.jpg';
import hospital3 from '../../../assets/adot-clinic-linking/hospital-3.jpg';
import hospital4 from '../../../assets/adot-clinic-linking/hospital-4.jpg';
import mapR1C1 from '../../../assets/adot-clinic-linking/map-r1-c1.png';
import mapR1C2 from '../../../assets/adot-clinic-linking/map-r1-c2.png';
import mapR1C3 from '../../../assets/adot-clinic-linking/map-r1-c3.png';
import mapR1C4 from '../../../assets/adot-clinic-linking/map-r1-c4.png';
import mapR2C1 from '../../../assets/adot-clinic-linking/map-r2-c1.png';
import mapR2C2 from '../../../assets/adot-clinic-linking/map-r2-c2.png';
import mapR2C3 from '../../../assets/adot-clinic-linking/map-r2-c3.png';
import mapR2C4 from '../../../assets/adot-clinic-linking/map-r2-c4.png';

type Screen = 'login' | 'link' | 'hospital' | 'application' | 'success' | 'history' | 'history-detail' | 'profile';
type OperationState = 'open' | 'ready' | 'closed' | 'dayOff' | 'unknown';
type TreatmentSelection = { level: 'middle' | 'item'; major: string; middle: string; item?: string } | null;
type BookingSummary = { patient: string; purpose: string; schedule: string };

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

const MAP_TILES = [mapR1C1, mapR1C2, mapR1C3, mapR1C4, mapR2C1, mapR2C2, mapR2C3, mapR2C4];

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
    marker: { left: 43, top: 43 }
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
    treatmentItems: ['가다실 9가', '싱그릭스', '직장인 건강검진'],
    availableSlots: ['10:00', '11:30', '14:00', '16:00'],
    phone: '02-0000-1002',
    description: '가족 단위의 일반 진료와 예방접종을 제공하는 샘플 의료기관입니다.',
    marker: { left: 62, top: 31 }
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
    marker: { left: 31, top: 67 }
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
    marker: { left: 73, top: 59 }
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
    marker: { left: 52, top: 73 }
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
    marker: { left: 82, top: 42 }
  }
];

const HISTORY: HistoryRecord[] = [
  { id: 'LINK-260930-0142', createdAt: '2026.09.30 11:42', patient: '김○○', hospitalId: 'sample-01', purpose: '일반 진료', schedule: '2026.10.01 10:30', state: '신청 완료' },
  { id: 'LINK-260929-0087', createdAt: '2026.09.29 16:08', patient: '이○○', hospitalId: 'sample-02', purpose: '가다실 9가', schedule: '2026.10.02 14:00', state: '진료 완료' },
  { id: 'LINK-260928-0031', createdAt: '2026.09.28 09:21', patient: '박○○', hospitalId: 'sample-04', purpose: '비염 진료', schedule: '2026.09.29 09:30', state: '예약 취소' }
];

const ALL_ITEMS = TREATMENT_TREE.flatMap((major) =>
  major.groups.flatMap((group) => group.items.map((item) => ({ major: major.major, middle: group.middle, item })))
);

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
  onSelect: (selection: TreatmentSelection, label: string) => void;
}) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return null;

  const middleMatches = TREATMENT_TREE.flatMap((major) =>
    major.groups
      .filter((group) => group.middle.toLowerCase().includes(normalized) || group.items.some((item) => item.toLowerCase().includes(normalized)))
      .map((group) => ({ major: major.major, middle: group.middle }))
  ).slice(0, 2);
  const matchedMiddleNames = new Set(middleMatches.map((entry) => entry.middle));
  const itemMatches = ALL_ITEMS
    .filter((entry) => entry.item.toLowerCase().includes(normalized) || matchedMiddleNames.has(entry.middle))
    .slice(0, 4);

  if (middleMatches.length === 0 && itemMatches.length === 0) return null;

  return (
    <div className="adot-search-suggest" role="listbox" aria-label="검색어 추천">
      <strong className="adot-suggest-title">진료항목</strong>
      {middleMatches.map((entry) => (
        <button
          key={`middle-${entry.middle}`}
          type="button"
          onClick={() => onSelect({ level: 'middle', major: entry.major, middle: entry.middle }, entry.middle)}
        >
          <span className="adot-suggest-icon"><FiSearch /></span>
          <span className="adot-suggest-main">{entry.middle}</span>
          <span className="adot-level-badge">중분류</span>
          <small>하위 진료항목을 1개 이상 제공하는 병원</small>
        </button>
      ))}
      {itemMatches.map((entry) => (
        <button
          key={`item-${entry.item}`}
          type="button"
          onClick={() => onSelect({ level: 'item', major: entry.major, middle: entry.middle, item: entry.item }, entry.item)}
        >
          <span className="adot-suggest-icon"><FiSearch /></span>
          <span className="adot-suggest-main">{entry.item}</span>
          <span className="adot-level-badge subtle">소분류</span>
          <small>{entry.major} <FiChevronRight /> {entry.middle}</small>
        </button>
      ))}
      <p>중분류를 선택하면 하위 진료항목을 하나라도 제공하는 병원을 찾습니다.</p>
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
        {MAP_TILES.map((tile, index) => <img src={tile} alt="" key={tile} aria-hidden="true" className={`tile-${index + 1}`} />)}
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
        <button type="button" aria-label="현재 위치" onClick={() => setZoom(1)}><FiCrosshair /></button>
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
        && departmentMatched
        && treatmentMatched
        && (!openOnly || isOpen)
        && (!bookableOnly || isBookable(hospital))
        && (!nightOnly || hospital.night)
        && (!holidayOnly || hospital.holiday)
        && (!femaleOnly || hospital.femaleDoctor);
    });
  }, [query, department, treatment, openOnly, bookableOnly, nightOnly, holidayOnly, femaleOnly]);
  const displayedSelectedHospital = selectedHospital && result.some((hospital) => hospital.id === selectedHospital.id)
    ? selectedHospital
    : null;

  const selectTreatment = (next: TreatmentSelection, label?: string) => {
    setTreatment(next);
    if (label) setQuery(label);
    setSearchFocused(false);
    setSelectedHospital(null);
  };

  const clearAll = () => {
    setQuery('');
    setDepartment('진료과 전체');
    setTreatment(null);
    setOpenOnly(false);
    setBookableOnly(false);
    setNightOnly(false);
    setHolidayOnly(false);
    setFemaleOnly(false);
    setSelectedHospital(null);
  };

  const hasFilter = Boolean(query || treatment || department !== '진료과 전체' || openOnly || bookableOnly || nightOnly || holidayOnly || femaleOnly);

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
            {searchFocused && <SearchSuggestion query={query} onSelect={selectTreatment} />}
          </div>
          <div className="adot-location-wrap">
            <button className="adot-location-button" aria-expanded={locationOpen} type="button" onClick={() => setLocationOpen((value) => !value)}>
              <FiMapPin />서울 마포구 망원동<FiChevronDown />
            </button>
            {locationOpen && (
              <div className="adot-location-menu">
                <strong>탐색 기준 위치</strong>
                <p>주소를 기준으로 가까운 병원을 찾습니다.</p>
                <button type="button" onClick={() => setLocationOpen(false)}><FiNavigation /> 현재 위치로 다시 찾기</button>
              </div>
            )}
          </div>
        </div>
        <div className="adot-filter-line">
          <div className="adot-filter-wrap">
            <button aria-expanded={departmentOpen} className={department !== '진료과 전체' ? 'adot-filter active' : 'adot-filter'} type="button" onClick={() => setDepartmentOpen((value) => !value)}>
              {department}<FiChevronDown />
            </button>
            {departmentOpen && (
              <div className="adot-department-menu">
                {['진료과 전체', '내과', '가정의학과', '피부과', '이비인후과', '치과'].map((item) => (
                  <button key={item} className={department === item ? 'selected' : ''} type="button" onClick={() => { setDepartment(item); setDepartmentOpen(false); setSelectedHospital(null); }}>
                    {item}{department === item && <FiCheck />}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="adot-filter-wrap">
            <button aria-expanded={treatmentOpen} className={treatment ? 'adot-filter active' : 'adot-filter'} type="button" onClick={() => setTreatmentOpen((value) => !value)}>
              {selectionLabel(treatment)}{treatmentOpen ? <FiChevronUp /> : <FiChevronDown />}
            </button>
            {treatmentOpen && <TreatmentPicker selection={treatment} onSelect={selectTreatment} onClose={() => setTreatmentOpen(false)} />}
          </div>
          <button aria-pressed={openOnly} className={openOnly ? 'adot-filter active' : 'adot-filter'} type="button" onClick={() => setOpenOnly((value) => !value)}><span className="adot-filter-dot" />진료중</button>
          <button aria-pressed={bookableOnly} className={bookableOnly ? 'adot-filter active' : 'adot-filter'} type="button" onClick={() => setBookableOnly((value) => !value)}><span className="adot-filter-dot" />굿닥 예약 가능</button>
          <button aria-pressed={nightOnly} className={nightOnly ? 'adot-filter active' : 'adot-filter'} type="button" onClick={() => setNightOnly((value) => !value)}><span className="adot-filter-dot" />야간</button>
          <button aria-pressed={holidayOnly} className={holidayOnly ? 'adot-filter active' : 'adot-filter'} type="button" onClick={() => setHolidayOnly((value) => !value)}><span className="adot-filter-dot" />휴일</button>
          <button aria-pressed={femaleOnly} className={femaleOnly ? 'adot-filter active' : 'adot-filter'} type="button" onClick={() => setFemaleOnly((value) => !value)}><span className="adot-filter-dot" />여의사</button>
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

function BreadcrumbBack({ label, onBack }: { label: string; onBack: () => void }) {
  return <button className="adot-back" type="button" onClick={onBack}><FiArrowLeft />{label}</button>;
}

function HospitalDetail({ hospital, onBack, onApply }: { hospital: Hospital; onBack: () => void; onApply: () => void }) {
  return (
    <main className="adot-subpage">
      <BreadcrumbBack label="병원 탐색으로 돌아가기" onBack={onBack} />
      <div className="adot-detail-grid">
        <section className="adot-hospital-hero">
          <img src={hospital.image} alt="샘플 병원 내부" />
          <div>
            <div className="adot-title-with-badge">
              <h1>{hospital.name}</h1>
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
    </main>
  );
}

function ApplicationScreen({ hospital, onBack, onComplete }: { hospital: Hospital; onBack: () => void; onComplete: (summary: BookingSummary) => void }) {
  const [patientType, setPatientType] = useState<'self' | 'child'>('self');
  const [purpose, setPurpose] = useState(hospital.treatmentItems[0] || '일반 진료');
  const [schedule, setSchedule] = useState(hospital.availableSlots[0] || '');
  const [agreed, setAgreed] = useState(false);

  return (
    <main className="adot-subpage narrow">
      <BreadcrumbBack label="병원 정보로 돌아가기" onBack={onBack} />
      <div className="adot-application-head">
        <span>진료 신청</span>
        <h1>{hospital.name}</h1>
        <p>상담 중 확인한 내용을 순서대로 입력해 주세요.</p>
      </div>
      <ol className="adot-stepper" aria-label="신청 단계">
        <li className="active"><b>1</b><span>환자</span></li>
        <li className="active"><b>2</b><span>진료 목적</span></li>
        <li className="active"><b>3</b><span>예약 일시</span></li>
        <li><b>4</b><span>확인</span></li>
      </ol>
      <form className="adot-application" onSubmit={(event) => {
        event.preventDefault();
        if (agreed && schedule) {
          onComplete({ patient: patientType === 'self' ? '본인 · 김○○' : '자녀 · 김○○', purpose, schedule: `2026.10.01 ${schedule}` });
        }
      }}>
        <section>
          <div className="adot-form-title"><b>1</b><div><h2>환자 선택</h2><p>예약할 환자를 확인합니다.</p></div></div>
          <div className="adot-choice-grid two">
            <button className={patientType === 'self' ? 'selected' : ''} type="button" onClick={() => setPatientType('self')}><FiUser /><strong>본인</strong><span>김○○ · 010-****-1234</span></button>
            <button className={patientType === 'child' ? 'selected' : ''} type="button" onClick={() => setPatientType('child')}><FiUser /><strong>자녀</strong><span>김○○ · 만 10세</span></button>
          </div>
        </section>
        <section>
          <div className="adot-form-title"><b>2</b><div><h2>진료 목적</h2><p>병원에서 제공하는 항목 중 하나를 선택합니다.</p></div></div>
          <div className="adot-chip-grid">
            {hospital.treatmentItems.map((item) => (
              <button className={purpose === item ? 'selected' : ''} type="button" key={item} onClick={() => setPurpose(item)}>{item}</button>
            ))}
          </div>
        </section>
        <section>
          <div className="adot-form-title"><b>3</b><div><h2>예약 일시</h2><p>조회 시점의 예약 가능 일시입니다.</p></div></div>
          {hospital.availableSlots.length > 0 ? <>
            <div className="adot-date-line"><FiCalendar /><strong>10월 1일 (목)</strong><span>예약 가능</span></div>
            <div className="adot-time-grid">
              {hospital.availableSlots.map((time) => (
                <button className={schedule === time ? 'selected' : ''} type="button" key={time} onClick={() => setSchedule(time)}>{time}</button>
              ))}
            </div>
          </> : (
            <div className="adot-no-slot"><FiCalendar /><div><strong>현재 선택 가능한 예약 시간이 없습니다.</strong><p>예약 설정과 실제 잔여 시간은 다를 수 있습니다. 다른 병원을 선택해 주세요.</p></div></div>
          )}
        </section>
        <section>
          <div className="adot-form-title"><b>4</b><div><h2>신청 내용 확인</h2><p>신청 직전 최신 예약 가능 여부를 다시 확인합니다.</p></div></div>
          <dl className="adot-summary-list">
            <div><dt>환자</dt><dd>{patientType === 'self' ? '본인 · 김○○' : '자녀 · 김○○'}</dd></div>
            <div><dt>진료 목적</dt><dd>{purpose}</dd></div>
            <div><dt>예약 일시</dt><dd>{schedule ? `2026.10.01 ${schedule}` : '선택 가능한 시간 없음'}</dd></div>
          </dl>
          <label className="adot-consent">
            <input type="checkbox" checked={agreed} onChange={(event) => setAgreed(event.target.checked)} />
            <span><b>필수 안내를 확인했습니다.</b> 이 화면은 검토용이며 실제 환자 정보나 예약은 전송되지 않습니다.</span>
          </label>
        </section>
        <button className="adot-submit" type="submit" disabled={!agreed || !schedule}>진료 신청 완료</button>
      </form>
    </main>
  );
}

function SuccessScreen({ hospital, summary, onHistory, onHome }: { hospital: Hospital; summary: BookingSummary; onHistory: () => void; onHome: () => void }) {
  return (
    <main className="adot-success">
      <div className="adot-success-icon"><FiCheck /></div>
      <h1>진료 신청이 완료되었습니다.</h1>
      <p>검토용 프로토타입으로 실제 예약은 생성되지 않았습니다.</p>
      <dl>
        <div><dt>병원</dt><dd>{hospital.name}</dd></div>
        <div><dt>신청 번호</dt><dd>LINK-260930-0153</dd></div>
        <div><dt>환자</dt><dd>{summary.patient}</dd></div>
        <div><dt>진료 목적</dt><dd>{summary.purpose}</dd></div>
        <div><dt>예약 일시</dt><dd>{summary.schedule}</dd></div>
      </dl>
      <div><button className="secondary" type="button" onClick={onHome}>새 진료 연결</button><button className="adot-primary" type="button" onClick={onHistory}>연결 이력 확인</button></div>
    </main>
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
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(HOSPITALS[0]);
  const [selectedRecord, setSelectedRecord] = useState<HistoryRecord>(HISTORY[0]);
  const [bookingSummary, setBookingSummary] = useState<BookingSummary>({ patient: '본인 · 김○○', purpose: '일반 진료', schedule: '2026.10.01 10:30' });

  const navigate = (next: Screen) => {
    setScreen(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (screen === 'login') return <div className="adot-app"><LoginScreen onLogin={() => navigate('link')} /></div>;

  return (
    <div className="adot-app">
      <TopNavigation screen={screen} onNavigate={navigate} onLogout={() => navigate('login')} />
      {screen === 'link' && (
        <LinkScreen
          selectedHospital={selectedHospital}
          setSelectedHospital={setSelectedHospital}
          onApply={(hospital) => { setSelectedHospital(hospital); navigate('application'); }}
          onDetail={(hospital) => { setSelectedHospital(hospital); navigate('hospital'); }}
        />
      )}
      {screen === 'hospital' && selectedHospital && <HospitalDetail hospital={selectedHospital} onBack={() => navigate('link')} onApply={() => navigate('application')} />}
      {screen === 'application' && selectedHospital && <ApplicationScreen hospital={selectedHospital} onBack={() => navigate('hospital')} onComplete={(summary) => { setBookingSummary(summary); navigate('success'); }} />}
      {screen === 'success' && selectedHospital && <SuccessScreen hospital={selectedHospital} summary={bookingSummary} onHistory={() => navigate('history')} onHome={() => navigate('link')} />}
      {screen === 'history' && <HistoryScreen onDetail={(record) => { setSelectedRecord(record); navigate('history-detail'); }} />}
      {screen === 'history-detail' && <HistoryDetail record={selectedRecord} onBack={() => navigate('history')} />}
      {screen === 'profile' && <ProfileScreen />}
    </div>
  );
}
