/**
 * desk-web — 진료실 영역(목록·순서·미사용·상세·접수/예약 스케줄)과 진료실 운영 설정.
 * 현행 커넥트 웹뷰(진료실 설정·상세·스케줄·운영 설정) 구조·문구·노출 조건을 옮긴 축약 재현이다.
 * 결정 태그·변경 이력은 index.page.tsx 헤더에 둔다. 가상 데이터 · 메모리 상태 · 네트워크 0.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  VscAdd, VscArrowDown, VscArrowUp, VscChevronDown, VscChevronLeft, VscChevronRight, VscClose, VscDebugPause,
  VscDebugStart, VscEdit, VscGripper, VscInfo, VscExtensions, VscTrash, VscWarning, VscCopy, VscCheck, VscGear, VscVm, VscDeviceMobile, VscCalendar, VscArrowRight
} from 'react-icons/vsc';

/* ───────── 기준 시각 · 유틸 ───────── */
export const TODAY = '2026-10-06';
export const NOW = '09:41';
const DOWS = ['월', '화', '수', '목', '금', '토', '일'];
export const HOLIDAYS: Record<string, string> = { '2026-10-03': '개천절', '2026-10-09': '한글날', '2026-12-25': '성탄절' };
const d0 = (s: string) => new Date(`${s}T00:00:00`);
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const addDays = (s: string, n: number) => { const d = d0(s); d.setDate(d.getDate() + n); return iso(d); };
const dowIdx = (s: string) => (d0(s).getDay() + 6) % 7; // 0=월
const weekStartOf = (s: string) => addDays(s, -dowIdx(s));
const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
const fromMin = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
const koDate = (s: string) => `${s.slice(2, 4)}년 ${Number(s.slice(5, 7))}월 ${Number(s.slice(8, 10))}일`;
const dotDate = (s: string) => `${s.replaceAll('-', '.')} (${DOWS[dowIdx(s)]})`;
const eul = (w: string) => { const c = w.charCodeAt(w.length - 1); return c >= 0xac00 && c <= 0xd7a3 && (c - 0xac00) % 28 ? '을' : '를'; };
const isPast = (date: string, time: string) => date < TODAY || (date === TODAY && time < NOW);
const wait = (ms: number) => new Promise(r => setTimeout(r, ms));
let seq = 1000; const uid = (p: string) => `${p}${++seq}`;
/** 숫자 입력: 정수만(소수·음수·기호 제거), 최대 자릿수 제한 */
/** 소수점·음수·기호가 섞이면 입력을 받지 않고 이전 값을 유지 */
const digits = (v: string, max = 3, prev = '') => (/^\d*$/.test(v) ? v.slice(0, max) : prev);

/* ───────── 타입 ───────── */
export type SvcKey = 'tablet' | 'mobile' | 'appt';
export type RSlot = { id: string; date: string; start: string; end: string; limit: number | null; current: number; stopped?: boolean };
export type ASlot = { id: string; date: string; time: string; groupId: string; cap: number; booked: number };
export type AGroup = { id: string; name: string; color: string; cap: number; sameDay: boolean; rangeMode: 'always' | 'period'; rangeDays: number; startDate: string; endDate: string; openTime: string };
export type Svc = { accepted: boolean; paused: boolean; guide: string; purpose: string; directInput: boolean; kakao: boolean };
export type Room = {
  id: string; name: string; alias: string; dept: string; doctors: string[]; sortIndex: number;
  tablet: Svc & { slotUsed: boolean }; mobile: Svc; appt: Svc & { todayUsed: boolean; advanced: boolean };
  rSlots: { tablet: RSlot[]; mobile: RSlot[] }; aSlots: ASlot[]; groups: AGroup[];
};
export type Invalid = { id: string; name: string; dept: string; doctor: string };
const SVC_NAME: Record<SvcKey, string> = { tablet: '현장 접수', mobile: '원격 접수', appt: '예약' };
const SVC_SHORT: Record<SvcKey, string> = { tablet: '현장', mobile: '원격', appt: '예약' };
export const PURPOSE_GROUPS = [
  { id: 'P0', name: '일반 진료', template: true, updated: '', tree: ['초진 · 감기/몸살', '초진 · 복통/소화불량', '재진 · 약 처방', '건강검진 상담'] },
  { id: 'P1', name: '우리 병원 내원목적', template: false, updated: '2026.09.22', tree: ['초진', '재진 · 고혈압/당뇨', '예방접종 상담', '서류 발급'] }
];
const COLORS = ['#0073FA', '#1FA972', '#F79009', '#7A5AF8', '#EC3847', '#0BA5EC', '#E6A700', '#8B95A1'];

const svc = (accepted: boolean, extra: Partial<Svc> = {}): Svc => ({ accepted, paused: false, guide: '', purpose: '', directInput: false, kakao: false, ...extra });
export const newRoom = (e: { name: string; alias: string; dept: string; doctors: string[] }, sortIndex: number): Room => ({
  id: uid('R'), ...e, sortIndex,
  tablet: { ...svc(false), slotUsed: false }, mobile: svc(false), appt: { ...svc(false), todayUsed: true, advanced: false },
  rSlots: { tablet: [], mobile: [] }, aSlots: [], groups: []
});
/** 이번 주·다음 주 평일 접수 블록 */
const weekBlocks = (ranges: [string, string, number | null][], weeks = 2, days = [0, 1, 2, 3, 4, 5]): RSlot[] => {
  const out: RSlot[] = []; const ws = weekStartOf(TODAY);
  for (let w = 0; w < weeks; w++) days.forEach(d => { const date = addDays(ws, w * 7 + d); if (HOLIDAYS[date]) return; ranges.forEach(([s, e, l], i) => { if (d === 5 && i > 0) return; out.push({ id: uid('S'), date, start: s, end: d === 5 && i === 0 ? '13:00' : e, limit: l, current: date < TODAY || (date === TODAY && s < NOW) ? (l ? Math.min(l, 6) : 6) : date === TODAY ? 2 : 0 }); }); });
  return out;
};
const apptSlots = (groupId: string, times: string[], weeks = 2, cap = 1): ASlot[] => {
  const out: ASlot[] = []; const ws = weekStartOf(TODAY);
  for (let w = 0; w < weeks; w++) [0, 1, 2, 3, 4].forEach(d => { const date = addDays(ws, w * 7 + d); if (HOLIDAYS[date]) return; times.forEach((t, i) => out.push({ id: uid('A'), date, time: t, groupId, cap, booked: date < TODAY || (date === TODAY && t < NOW) ? cap : (date <= addDays(TODAY, 1) && i % 3 === 0 ? cap : 0) })); });
  return out;
};
export const seedRooms = (): Room[] => [
  {
    id: 'R1', name: '1진료실', alias: '내과 진료실', dept: '내과', doctors: ['김○○'], sortIndex: 0,
    tablet: { ...svc(true, { guide: '처음 내원하시는 경우 신분증 확인 후 접수 가능합니다.' }), slotUsed: false },
    mobile: svc(true, { purpose: 'P1', kakao: true }),
    appt: { ...svc(true, { purpose: 'P1', kakao: true }), todayUsed: true, advanced: false },
    rSlots: { tablet: [], mobile: weekBlocks([['09:00', '12:30', 30], ['14:00', '18:00', 40]]) },
    groups: [{ id: 'G1', name: '일반 진료', color: COLORS[0], cap: 1, sameDay: true, rangeMode: 'always', rangeDays: 14, startDate: TODAY, endDate: addDays(TODAY, 30), openTime: '00:00' }],
    aSlots: apptSlots('G1', ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30'])
  },
  {
    id: 'R2', name: '2진료실', alias: '', dept: '가정의학과', doctors: ['박○○', '이○○'], sortIndex: 1,
    tablet: { ...svc(true), slotUsed: true }, mobile: svc(false),
    appt: { ...svc(true, { paused: true }), todayUsed: true, advanced: true },
    rSlots: { tablet: weekBlocks([['09:00', '13:00', null], ['14:00', '18:30', null]]), mobile: [] },
    groups: [
      { id: 'G2', name: '건강검진 상담', color: COLORS[1], cap: 2, sameDay: false, rangeMode: 'always', rangeDays: 30, startDate: TODAY, endDate: addDays(TODAY, 30), openTime: '00:00' },
      { id: 'G3', name: '보호자 동반', color: COLORS[3], cap: 1, sameDay: true, rangeMode: 'period', rangeDays: 14, startDate: TODAY, endDate: '2026-10-31', openTime: '09:00' }
    ],
    aSlots: [...apptSlots('G2', ['10:00', '11:00', '15:00'], 2, 2), ...apptSlots('G3', ['16:00', '16:30'], 1)]
  },
  {
    id: 'R3', name: '예방접종실', alias: '', dept: '내과', doctors: ['최○○'], sortIndex: 2,
    tablet: { ...svc(false), slotUsed: false }, mobile: svc(false),
    appt: { ...svc(true), todayUsed: false, advanced: false },
    rSlots: { tablet: [], mobile: [] }, groups: [{ id: 'G4', name: '예방접종', color: COLORS[2], cap: 1, sameDay: false, rangeMode: 'always', rangeDays: 14, startDate: TODAY, endDate: addDays(TODAY, 30), openTime: '00:00' }],
    aSlots: [{ id: uid('A'), date: '2026-10-02', time: '10:00', groupId: 'G4', cap: 1, booked: 1 }]
  }
];
export const seedInvalid = (): Invalid[] => [
  { id: 'U1', name: '3진료실(구)', dept: '소아청소년과', doctor: '정○○' },
  { id: 'U2', name: '물리치료실', dept: '재활의학과', doctor: '강○○' }
];

/* ───────── 상태 판정 (현행 useRoomStatus 규칙) ───────── */
type St = 'none' | 'disabled' | 'error' | 'paused' | 'active' | 'nochart';
const futureR = (s: RSlot[]) => s.some(x => x.date > TODAY || (x.date === TODAY && x.end > NOW));
const futureA = (s: ASlot[]) => s.some(x => x.date > TODAY || (x.date === TODAY && x.time > NOW));
export const roomState = (r: Room, k: SvcKey, supported: (k: SvcKey) => boolean, chartMissing = false): St => {
  if (!supported(k)) return 'none';
  if (chartMissing && r[k].accepted) return 'nochart'; // 연동 병원인데 차트에 진료실 없음(figma baseline 참조)
  if (!r[k].accepted) return 'disabled';
  if (k === 'tablet' ? r.tablet.slotUsed && !futureR(r.rSlots.tablet) : k === 'mobile' ? !futureR(r.rSlots.mobile) : !futureA(r.aSlots)) return 'error';
  if (r[k].paused) return 'paused';
  return 'active';
};
const ST_LABEL: Record<string, string> = { active: '운영중', error: '운영불가', paused: '임시마감', nochart: '운영불가' };

/* ───────── 공통 props · 저장 흐름 ───────── */
type ModalT = (p: { title: React.ReactNode; children: React.ReactNode; footer?: React.ReactNode; onClose: () => void; wide?: boolean; busy?: boolean; className?: string }) => JSX.Element;
export type ChartMode = 'unlinked' | 'linked';
/** 서비스 지원 여부: 비연동(기본, 기존 데스크)=예약만(접수는 EMR 연결 없이 서버가 거절), EMR 연동=차트 기능값(체험: 기능 제한이면 현장 접수만) */
export const svcSupported = (mode: ChartMode, chartLimited: boolean, k: SvcKey) => mode === 'unlinked' ? k === 'appt' : chartLimited ? k === 'tablet' : true;
export type Kit = {
  Modal: ModalT; notify: (t: string) => void; fail: (t: string) => void; instant: (apply: () => void, ok: string, what?: string) => boolean;
  serverDown: boolean; failSim: boolean; linked: boolean; chartLimited: boolean; mode: ChartMode; Pin: (p: { n: number }) => JSX.Element | null; itemOnly?: boolean; chartMissingId?: string; onOpenKakao?: () => void;
};
const supportedOf = (kit: Kit) => (k: SvcKey) => svcSupported(kit.mode, kit.chartLimited, k);
export const CHART_NAME = '연동 EMR 예시';
/** 모달 저장: 처리 중 → 실패면 상태 유지 + 오류, 성공일 때만 반영 */
function useRun(kit: Kit) {
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const run = async (apply: () => void, ok: string, after?: () => void) => {
    if (busy) return; setError(''); setBusy(true); await wait(500);
    if (kit.serverDown) { setBusy(false); setError('굿닥 서버에 연결할 수 없어 저장하지 못했어요. 상태는 바뀌지 않았어요.'); return; }
    if (kit.failSim) { setBusy(false); setError('저장하지 못했어요(모의 실패). 상태는 바뀌지 않았어요. 다시 시도해 주세요.'); return; }
    apply(); setBusy(false); after?.(); kit.notify(ok);
  };
  return { busy, error, setError, run };
}
/** 스케줄 즉시 저장: 헤더에 '저장 중...' → '저장 완료'(2초) / 실패면 '저장 실패' + 실패 토스트 */
function useCommit(kit: Kit) {
  const [status, setStatus] = useState('');
  useEffect(() => { if (status !== '저장 완료') return; const t = setTimeout(() => setStatus(''), 2000); return () => clearTimeout(t); }, [status]);
  const commit = async (apply: () => void, ok: string) => {
    setStatus('저장 중...'); await wait(400);
    if (kit.serverDown || kit.failSim) { setStatus('저장 실패'); kit.fail(kit.serverDown ? '굿닥 서버에 연결할 수 없어 저장하지 못했어요. 스케줄은 바뀌지 않았어요.' : '저장하지 못했어요(모의 실패). 스케줄은 바뀌지 않았어요.'); return false; }
    apply(); setStatus('저장 완료'); kit.notify(ok); return true;
  };
  return { status, commit };
}
const Err = ({ text }: { text: string }) => text ? <p className="cu-error" role="alert"><VscWarning /> {text}</p> : null;
const retryLabel = (busy: boolean, error: string, label: string) => busy ? '처리 중…' : error ? '다시 시도' : label;

function SvcTag({ st, k }: { st: St; k?: SvcKey }) {
  if (st === 'none' || st === 'disabled') return k ? <span className="dw-stag off">{SVC_SHORT[k]}</span> : null;
  return <span className={'dw-stag ' + st}>{k ? SVC_SHORT[k] : ST_LABEL[st]}{!k && null}</span>;
}

/* ═════════════ 진료실 영역 ═════════════ */
export type View = { v: 'list' } | { v: 'order' } | { v: 'unused' } | { v: 'detail'; id: string; open?: SvcKey } | { v: 'rsched'; id: string; type: 'tablet' | 'mobile'; ro?: boolean } | { v: 'asched'; id: string; ro?: boolean };
export function ExamRooms(props: {
  kit: Kit; rooms: Room[]; setRooms: React.Dispatch<React.SetStateAction<Room[]>>; invalid: Invalid[]; setInvalid: React.Dispatch<React.SetStateAction<Invalid[]>>;
  initialView?: View; emptyNode: React.ReactNode; activeIn: (r: Room) => number; banner: React.ReactNode;
  onCreate: () => void; onEdit: (r: Room) => void; onDelete: (r: Room) => void; Hold: (p: { text?: string }) => JSX.Element;
}) {
  const { kit, rooms, setRooms } = props;
  const [view, setView] = useState<View>(props.initialView || { v: 'list' });
  const supported = supportedOf(kit);
  const sorted = [...rooms].sort((a, b) => a.sortIndex - b.sortIndex);
  const room = 'id' in view ? rooms.find(r => r.id === view.id) : undefined;
  useEffect(() => { if ('id' in view && !room) setView({ v: 'list' }); }, [room, view]);
  useEffect(() => { if (view.v === 'unused' && !kit.linked) setView({ v: 'list' }); }, [kit.linked, view.v]);
  // 진료실 집합(추가·삭제·체험 전환)이 바뀌면 순서·상세·미사용·스케줄 화면은 목록으로 돌아간다
  const idKey = rooms.map(r => r.id).sort().join(',');
  const prevKey = React.useRef(idKey);
  useEffect(() => { if (prevKey.current !== idKey) { prevKey.current = idKey; if (view.v !== 'list') setView({ v: 'list' }); } }, [idKey]);
  const update = (id: string, fn: (r: Room) => Room) => setRooms(old => old.map(r => r.id === id ? fn(r) : r));
  const go = (v: View) => { setView(v); document.querySelector('.cu-main')?.scrollTo?.(0, 0); };

  if (view.v === 'detail' && room) return <Detail key={room.id + (view.open || '')} initialOpen={view.open} kit={kit} room={room} allRooms={rooms} update={update} supported={supported} back={() => go({ v: 'list' })} open={go} Hold={props.Hold} banner={props.banner} onEdit={props.onEdit} onDelete={props.onDelete} activeIn={props.activeIn} />;
  if (view.v === 'rsched' && room) return <ReceiptSchedule kit={kit} room={room} type={view.type} ro={!!view.ro} update={update} back={() => go({ v: 'detail', id: room.id })} banner={props.banner} />;
  if (view.v === 'asched' && room) return <ApptSchedule kit={kit} room={room} ro={!!view.ro} update={update} back={() => go({ v: 'detail', id: room.id })} banner={props.banner} />;
  if (view.v === 'order') return <OrderSetting kit={kit} rooms={sorted} supported={supported} setRooms={setRooms} back={() => go({ v: 'list' })} banner={props.banner} />;
  if (view.v === 'unused') return <Unused kit={kit} invalid={props.invalid} setInvalid={props.setInvalid} back={() => go({ v: 'list' })} banner={props.banner} />;

  return <>
    {/* figma baseline 참조 */}
    <header className="cn-header cu-header dw-fig-head">
      <div><h1 className="cn-title" tabIndex={-1}>진료실 설정</h1></div>
      <div className="dw-head-actions">
        {kit.linked && <button className="dw-fig-textbtn" onClick={() => go({ v: 'unused' })}>미사용 설정</button>}
        <button className="dw-fig-textbtn" disabled={rooms.length < 2} onClick={() => go({ v: 'order' })}><VscExtensions />순서관리</button>
        {!kit.linked && <span className="dw-filter-pin"><button className="dw-fig-textbtn primary" onClick={props.onCreate}><VscAdd />새 진료실</button><kit.Pin n={25} /></span>}
      </div>
    </header>
    {props.banner}
    <div className="cu-content dw-fig-content">
      {kit.linked && kit.itemOnly && <p className="cu-inline-note dw-note"><VscInfo /><span>진료항목 예약만 운영하는 연동 병원이에요. 진료실은 차트 동기화로 표시되고 예약 섹션은 미사용이에요. 현장·원격 접수는 차트 기능 기준으로 운영할 수 있어요.<kit.Pin n={28} /></span></p>}
      {kit.linked && <p className="cu-inline-note dw-note"><VscInfo />EMR 연동 병원이에요. 진료실 이름·진료과·의사는 EMR에서 관리하고, 운영 설정과 스케줄은 여기서 바꿀 수 있어요.</p>}
      {rooms.length === 0 ? props.emptyNode : <div className="dw-fig-grid">{/* figma baseline 참조 */}{sorted.map(r => <RoomCard key={r.id} grid r={r} supported={supported} chartMissing={kit.linked && kit.chartMissingId === r.id} onClick={() => go({ v: 'detail', id: r.id })} extra={props.activeIn(r) > 0 ? `진행 중 예약 ${props.activeIn(r)}건` : ''} />)}</div>}
    </div>
  </>;
}

function RoomCard({ r, supported, onClick, extra, right, grid, chartMissing }: { r: Room; supported: (k: SvcKey) => boolean; onClick?: () => void; extra?: string; right?: React.ReactNode; grid?: boolean; chartMissing?: boolean }) {
  const keys: SvcKey[] = ['tablet', 'mobile', 'appt'];
  const sts = keys.map(k => [k, roomState(r, k, supported, chartMissing)] as const);
  const shown = sts.filter(([, s]) => s !== 'none' && s !== 'disabled');
  const noneAtAll = shown.length === 0; // 미사용·차트 미지원만 남으면 '운영중인 서비스가 없어요'
  if (grid) {
    // figma baseline 참조 — 카드 이름 / 상세 + 점 / 배지 현장·원격·예약
    const detail = [r.name, r.dept, r.doctors.join(', ')];
    return <button className="dw-fig-card" onClick={onClick}>
      <span className="dw-fig-card-data"><strong>{r.alias || r.name}</strong>
        <span className="dw-fig-detail">{detail.map((t, i) => <React.Fragment key={i}>{i > 0 && <i className="dw-fig-dot" aria-hidden="true" />}<span>{t}</span></React.Fragment>)}</span></span>
      <span className="dw-fig-status">{noneAtAll ? <span className="dw-fig-badge off">운영중인 서비스가 없어요</span> : shown.map(([k, st]) => <span key={k} className={'dw-fig-badge ' + (st === 'active' ? 'on' : st === 'paused' ? 'stop' : 'err')} title={ST_LABEL[st]}>{SVC_SHORT[k]}</span>)}
        {extra && <em className="dw-fig-extra">{extra}</em>}</span>
    </button>;
  }
  const body = <>
    <div className="dw-rc-main"><strong>{r.alias || r.name}</strong><small>{r.name} ∙ {r.dept} ∙ {r.doctors.join(', ')}</small>
      <div className="dw-svc-tags">{noneAtAll ? <span className="dw-stag off">운영중인 서비스가 없어요</span> : shown.map(([k, s]) => <span key={k} className={'dw-stag ' + s}><i />{SVC_SHORT[k]}</span>)}</div>
      {extra && <em className="dw-room-count">{extra}</em>}
    </div>
    {right ?? <VscChevronRight className="dw-rc-chev" />}
  </>;
  return onClick ? <button className="dw-room-row" onClick={onClick}>{body}</button> : <div className="dw-room-row static">{body}</div>;
}

/* ───── 순서 관리 ───── */
function OrderSetting({ kit, rooms, supported, setRooms, back, banner }: { kit: Kit; rooms: Room[]; supported: (k: SvcKey) => boolean; setRooms: React.Dispatch<React.SetStateAction<Room[]>>; back: () => void; banner: React.ReactNode }) {
  const [draft, setDraft] = useState(rooms.map(r => r.id));
  // 진료실 집합이 바뀌어도 깨지지 않게 현재 rooms 기준으로 다시 계산(없는 id 제거, 새 id 뒤에 추가)
  const ids = rooms.map(r => r.id);
  const order = [...draft.filter(id => ids.includes(id)), ...ids.filter(id => !draft.includes(id))];
  const { busy, error, run } = useRun(kit);
  const move = (i: number, d: number) => setDraft(() => { const n = [...order]; const j = i + d; if (j < 0 || j >= n.length) return n; [n[i], n[j]] = [n[j], n[i]]; return n; });
  return <>
    <header className="cn-header cu-header"><div><button className="dw-crumb" onClick={back}><VscChevronLeft />진료실 설정</button><h1 className="cn-title" tabIndex={-1}>진료실 순서 변경</h1><p className="cn-desc">환자에게 보여줄 진료실 순서를 설정할 수 있어요.</p></div></header>
    {banner}
    <div className="cu-content">
      <p className="cu-subnote dw-mt0">현행은 드래그로 순서를 바꿔요. 시안에서는 위·아래 버튼으로 대신해요.</p>
      <div className="dw-room-list">{order.map((id, i) => { const r = rooms.find(x => x.id === id); if (!r) return null; return <div className="dw-order-row" key={id}>
        <VscGripper className="dw-grip" />
        <RoomCard r={r} supported={supported} right={<span className="dw-order-btns"><button className="cu-icon" aria-label={`${r.name} 위로`} disabled={i === 0} onClick={() => move(i, -1)}><VscArrowUp /></button><button className="cu-icon" aria-label={`${r.name} 아래로`} disabled={i === order.length - 1} onClick={() => move(i, 1)}><VscArrowDown /></button></span>} />
      </div>; })}</div>
      <Err text={error} />
      <div className="dw-bottom-bar"><button className="cu-btn" disabled={busy} onClick={back}>취소</button><button className="cu-btn primary" disabled={busy} onClick={() => run(() => setRooms(old => old.map(r => ({ ...r, sortIndex: order.indexOf(r.id) }))), '진료실 순서를 변경했어요.', back)}>{retryLabel(busy, error, '저장')}</button></div>
    </div>
  </>;
}

/* ───── 미사용 설정 (연동 모드) ───── */
function Unused({ kit, invalid, setInvalid, back, banner }: { kit: Kit; invalid: Invalid[]; setInvalid: React.Dispatch<React.SetStateAction<Invalid[]>>; back: () => void; banner: React.ReactNode }) {
  const [target, setTarget] = useState<Invalid | null>(null);
  const { busy, error, setError, run } = useRun(kit);
  const M = kit.Modal;
  return <>
    <header className="cn-header cu-header"><div><button className="dw-crumb" onClick={back}><VscChevronLeft />진료실 설정</button><h1 className="cn-title" tabIndex={-1}>미사용 설정 관리</h1><p className="cn-desc">차트 진료실 정보가 변경되거나 삭제되어 사용할 수 없는 설정이에요.</p></div></header>
    {banner}
    <div className="cu-content">
      {invalid.length === 0 ? <div className="cu-empty"><VscCheck /><strong>미사용 설정이 없어요</strong></div> : <div className="dw-room-list">{invalid.map(u => <div className="dw-room-row static" key={u.id}>
        <div className="dw-rc-main"><strong className="dw-faded">{u.name}</strong><small>{u.dept} ∙ {u.doctor} · 차트에서 변경·삭제됨</small></div>
        <button className="cu-btn dw-danger-line" onClick={() => { setError(''); setTarget(u); }}>삭제</button>
      </div>)}</div>}
    </div>
    {target && <M title="정말 삭제하시겠어요?" busy={busy} onClose={() => { if (!busy) { setTarget(null); setError(''); } }} footer={<><button className="cu-btn" disabled={busy} onClick={() => { setTarget(null); setError(''); }}>취소</button><button className="cu-btn danger" disabled={busy} onClick={() => run(() => setInvalid(o => o.filter(x => x.id !== target.id)), `‘${target.name}’ 설정을 삭제했어요.`, () => setTarget(null))}>{retryLabel(busy, error, '삭제하기')}</button></>}>
      <p className="dw-pre">{'삭제하면 기존 정보가 모두 삭제되고\n다시 되돌릴 수 없어요.'}</p><Err text={error} />
    </M>}
  </>;
}

/* ═════════════ 진료실 상세 ═════════════ */
/** 설정 행(figma baseline 참조). 렌더마다 재마운트되지 않게 모듈 레벨 */
const SetRow = ({ title, desc, children, descStrong }: { title: string; desc: React.ReactNode; children?: React.ReactNode; descStrong?: boolean }) => <div className="dw-fig-setrow"><div><strong>{title}</strong><p className={descStrong ? 'strong' : ''}>{desc}</p></div>{children && <div className="dw-row-ctl">{children}</div>}</div>;
type DModal = null | { t: 'alias' } | { t: 'enable' | 'disable' | 'guide' | 'blockDisable'; k: SvcKey } | { t: 'purpose'; k: SvcKey; next: string } | { t: 'purposeView'; id: string } | { t: 'schedSwitch'; to: boolean } | { t: 'roomDelete' };
function Detail({ kit, room: r, allRooms, update, supported, back, open, Hold, banner, onEdit, onDelete, activeIn, initialOpen }: {
  initialOpen?: SvcKey; kit: Kit; room: Room; allRooms: Room[]; update: (id: string, fn: (r: Room) => Room) => void; supported: (k: SvcKey) => boolean; back: () => void; open: (v: View) => void;
  Hold: (p: { text?: string }) => JSX.Element; banner: React.ReactNode; onEdit: (r: Room) => void; onDelete: (r: Room) => void; activeIn: (r: Room) => number;
}) {
  const M = kit.Modal;
  const [openSec, setOpenSec] = useState<Record<SvcKey, boolean>>({ tablet: initialOpen === 'tablet', mobile: initialOpen === 'mobile', appt: initialOpen === 'appt' });
  const [modal, setModal] = useState<DModal>(null);
  const [pauseOpen, setPauseOpen] = useState(false);
  const [aliasDraft, setAliasDraft] = useState(''), [guideDraft, setGuideDraft] = useState('');
  const [purposeMenu, setPurposeMenu] = useState<SvcKey | null>(null);
  const { busy, error, setError, run } = useRun(kit);
  const closeM = () => { if (!busy) { setModal(null); setError(''); } };
  const setSvc = (k: SvcKey, patch: Partial<Svc & { slotUsed: boolean; advanced: boolean }>) => update(r.id, x => ({ ...x, [k]: { ...x[k], ...patch } }));
  useEffect(() => {
    if (!pauseOpen && !purposeMenu) return;
    const trigger = pauseOpen ? '[data-pop="pause"]' : `[data-pop="purpose-${purposeMenu}"]`;
    const h = (e: MouseEvent) => { const t = e.target as HTMLElement; if (!t.closest('.dw-pop-wrap')) { setPauseOpen(false); setPurposeMenu(null); } };
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); setPauseOpen(false); setPurposeMenu(null); document.querySelector<HTMLElement>(trigger)?.focus(); } };
    document.addEventListener('mousedown', h); document.addEventListener('keydown', k);
    return () => { document.removeEventListener('mousedown', h); document.removeEventListener('keydown', k); };
  }, [pauseOpen, purposeMenu]);

  const apptUntil = () => { const days = Math.max(0, ...r.groups.map(g => g.rangeMode === 'always' ? g.rangeDays : Math.max(0, Math.round((new Date(`${g.endDate}T00:00:00`).getTime() - new Date(`${TODAY}T00:00:00`).getTime()) / 86400000)))); return { none: r.groups.length === 0, date: koDate(addDays(TODAY, days)), sameDay: r.groups.some(g => g.sameDay) }; };
  const untilText = (pausedSame = false) => { const u = apptUntil(); return u.none ? '예약 일정을 등록해 주세요.' : <><b>{u.date} 까지</b> 예약을 받아요. ({pausedSame && u.sameDay ? '당일 예약 임시 마감' : u.sameDay ? '당일 예약 가능' : '당일 예약 불가'})</>; };
  const subtitle = (k: SvcKey, st: St) => {
    const n = SVC_NAME[k];
    if (st === 'nochart') return '차트 진료실을 찾을 수 없어요.';
    if (st === 'none') return kit.mode === 'unlinked' ? `사용불가 · EMR 연동 시 사용 가능해요. ${n}${eul(n)} 받으려면 EMR이 연결돼 있어야 해요.` : `현재 사용 중인 차트(${CHART_NAME})는 ${n} 기능이 지원되지 않으니, 사용을 원하실 경우 차트사에 문의해 주세요.`;
    if (st === 'disabled') return k === 'tablet' ? '굿닥 태블릿 무인 접수로 업무 효율 개선 효과를 경험해 보세요.' : k === 'mobile' ? '원격 접수로 대기실을 쾌적하게, 효율적으로 관리해 보세요.' : '전화 문의 없는 예약으로 바쁜 업무 환경을 개선해 보세요.';
    if (st === 'error') return `운영 스케줄을 등록하면 ${n}${eul(n)} 받을 수 있어요.`;
    if (k === 'appt') { // figma baseline 참조
      return untilText(st === 'paused');
    }
    if (st === 'paused') return `오늘 자정까지 ${n}${eul(n)} 받지 않아요.`;
    if (k === 'tablet' && !r.tablet.slotUsed) return '병원 운영시간 동안 현장 접수를 받아요.';
    const today = r.rSlots[k as 'tablet' | 'mobile'].filter(x => x.date === TODAY && !x.stopped).sort((a, b) => a.start.localeCompare(b.start));
    if (!today.length) return `오늘은 ${n}${eul(n)} 받지 않아요.`;
    return <><b>오늘 {today[0].start}부터 {today[today.length - 1].end}까지</b> {n}{eul(n)} 받아요.</>;
  };
  const schedSub = (k: SvcKey) => {
    if (k === 'tablet' && !r.tablet.slotUsed) return '병원 운영시간 동안 현장 접수를 받아요.';
    const dates = (k === 'appt' ? r.aSlots.map(x => x.date) : r.rSlots[k].map(x => x.date)).filter(d => d >= TODAY).sort();
    if (!dates.length) return '등록한 운영 스케줄이 없어요.';
    if (r[k].paused && k !== 'appt') return `오늘 자정까지 ${SVC_NAME[k]}${eul(SVC_NAME[k])} 받지 않아요.`;
    return dates[0] === dates[dates.length - 1] ? `${koDate(dates[0])}에 스케줄을 등록했어요.` : `${koDate(dates[0])}부터 ${koDate(dates[dates.length - 1])}까지 스케줄을 등록했어요.`;
  };
  const openSched = (k: SvcKey, ro = false) => open(k === 'appt' ? { v: 'asched', id: r.id, ro } : { v: 'rsched', id: r.id, type: k, ro });
  /** figma baseline 참조 — 프로토 상태 → 운영상태 변형 매핑
   *  disabled→운영중지 · none→미지원 · active→운영중 · paused→일시중지 · error→운영불가(현장은 운영불가_스케줄없음) · nochart→차트진료실없음
   *  최초(카드 opacity 0.2)는 대응하는 프로토 상태가 없어 쓰지 않음 */
  const SVC_ICON: Record<SvcKey, React.ReactNode> = { tablet: <VscVm />, mobile: <VscDeviceMobile />, appt: <VscCalendar /> };
  const section = (k: SvcKey) => {
    const st = roomState(r, k, supported, kit.linked && kit.chartMissingId === r.id); const s = r[k]; const n = SVC_NAME[k]; const isOpen = openSec[k] && s.accepted && st !== 'none';
    const badgeTone = st === 'active' ? 'on' : st === 'paused' ? 'stop' : 'err';
    const readOnly = st === 'nochart';
    return <section className={'dw-fig-svc ' + (st === 'none' ? 'none' : '')} key={k} aria-label={n}>
      <div className="dw-fig-svc-head">
        <span className="dw-fig-svc-ic" aria-hidden="true">{SVC_ICON[k]}</span>
        <div className="dw-fig-svc-label"><div><strong>{n}</strong><p>{subtitle(k, st)}</p></div>
          {s.accepted && st !== 'none' && st !== 'disabled' && <span className={'dw-fig-status-tag ' + badgeTone}><i aria-hidden="true" />{ST_LABEL[st]}</span>}</div>
        <div className="dw-fig-svc-btns">
          {st === 'none' ? <>{kit.mode === 'unlinked' && k === 'tablet' && <kit.Pin n={22} />}<button className="dw-fig-btn disabled" disabled>사용불가</button></>
            : !s.accepted ? <button className="dw-fig-btn primary" onClick={() => { setError(''); setModal({ t: 'enable', k }); }}>사용하기</button>
            : <button className="dw-fig-btn" aria-expanded={isOpen} onClick={() => setOpenSec(o => ({ ...o, [k]: !o[k] }))}>설정 {isOpen ? <VscClose /> : <VscChevronDown />}</button>}
        </div>
      </div>
      {isOpen && <div className="dw-fig-svc-body">
        {st === 'error' && <div className="dw-fig-guide neg"><span><VscWarning />운영 스케줄을 등록해 주세요.</span><button onClick={() => openSched(k)}>등록하기 <VscArrowRight /></button></div>}
        {k === 'tablet'
          ? <SetRow title="운영 스케줄" desc={schedSub(k)}>
              {r.tablet.slotUsed && <button className="dw-fig-btn" onClick={() => openSched(k, readOnly)}>{readOnly ? '보기' : '설정'}</button>}
              <div className="dw-fig-seg" role="group" aria-label="현장 접수 운영 방식"><button className={r.tablet.slotUsed ? 'sel' : ''} aria-pressed={r.tablet.slotUsed} disabled={readOnly} onClick={() => !r.tablet.slotUsed && (setError(''), setModal({ t: 'schedSwitch', to: true }))}>스케줄 운영</button><button className={!r.tablet.slotUsed ? 'sel' : ''} aria-pressed={!r.tablet.slotUsed} disabled={readOnly} onClick={() => r.tablet.slotUsed && (setError(''), setModal({ t: 'schedSwitch', to: false }))}>항시 운영</button></div>
            </SetRow>
          : <SetRow title="운영 스케줄" desc={schedSub(k)}><button className="dw-fig-btn" onClick={() => openSched(k, readOnly)}>{readOnly ? '보기' : '설정'}</button></SetRow>}
        {k === 'appt' && <SetRow title="예약 가능한 기간" desc={untilText()}><button className="dw-fig-btn" disabled={readOnly} onClick={() => openSched(k)}>설정</button></SetRow>}
        <SetRow title="진료실 안내 문구" desc={s.guide || '환자들이 진료실에 대해 쉽게 이해할 수 있도록 안내할 수 있어요.'} descStrong={!!s.guide}><button className="dw-fig-btn" disabled={readOnly} onClick={() => { setError(''); setGuideDraft(s.guide); setModal({ t: 'guide', k }); }}>설정</button></SetRow>
        <SetRow title="내원목적" desc="접수하는 환자의 내원목적을 미리 수집할 수 있어요.">
          {s.purpose && !readOnly && <label className="dw-check"><input type="checkbox" checked={s.directInput} onChange={() => kit.instant(() => setSvc(k, { directInput: !s.directInput }), `직접 입력 사용을 ${s.directInput ? '껐어요' : '켰어요'}.`)} />직접 입력 사용</label>}
          <div className="dw-pop-wrap">
            <button className={'dw-fig-select ' + (readOnly ? 'ro' : '')} disabled={readOnly} data-pop={`purpose-${k}`} aria-haspopup="listbox" aria-expanded={purposeMenu === k} onClick={() => setPurposeMenu(purposeMenu === k ? null : k)}><span>{PURPOSE_GROUPS.find(g => g.id === s.purpose)?.name || '사용안함'}</span><VscChevronDown /></button>
            {purposeMenu === k && <div className="dw-pop dw-purpose-pop" role="listbox">
              {[{ id: '', name: '사용 안함', template: false, updated: '' }, ...[...PURPOSE_GROUPS].sort((a, b) => a.name.localeCompare(b.name))].map(g => <div className="dw-pop-item" key={g.id || 'none'}>
                <label><input type="radio" name={`purpose-${k}`} checked={s.purpose === g.id} onChange={() => { setPurposeMenu(null); if (g.id === s.purpose) return; if (s.purpose) { setError(''); setModal({ t: 'purpose', k, next: g.id }); } else kit.instant(() => setSvc(k, { purpose: g.id }), '내원목적을 설정했어요.'); }} /><span>{g.name}</span>{g.id && <small>{g.template ? '기본양식' : `${g.updated} 수정함`}</small>}</label>
                {g.id && <button className="dw-link" onClick={() => { setPurposeMenu(null); setModal({ t: 'purposeView', id: g.id }); }}>보기</button>}
              </div>)}
              <button className="dw-pop-add" onClick={() => { setPurposeMenu(null); kit.notify('내원목적 양식 편집 화면은 시안에서 생략했어요.'); }}><VscAdd />내원목적 양식 추가</button>
            </div>}
          </div>
        </SetRow>
        {k !== 'tablet' && <SetRow title="카카오톡 예약하기 연동" desc={`카카오톡 예약하기, 카카오맵에서 ${k === 'mobile' ? '원격 접수를' : '예약을'} 받아요.${s.kakao ? ' · 연동중' : ''}`}><button className="dw-fig-btn" disabled={readOnly} onClick={() => kit.onOpenKakao?.()}>페이지로 이동</button><kit.Pin n={29} /></SetRow>}
        <div className="dw-fig-actions"><button className="dw-fig-danger" disabled={readOnly} onClick={() => { setError(''); setModal(k !== 'tablet' && s.kakao ? { t: 'blockDisable', k } : { t: 'disable', k }); }}>{n} 사용중지</button></div>
      </div>}
    </section>;
  };

  const pauseItems: [SvcKey, string][] = [['tablet', '현장접수'], ['mobile', '원격접수'], ['appt', '예약']];
  const pauseDesc = (k: SvcKey) => {
    if (!supported(k)) return kit.mode === 'unlinked' ? 'EMR 연동 시 사용 가능해요.' : '차트에서 지원하지 않는 서비스예요.';
    if (!r[k].accepted) return k === 'appt' ? '예약 미운영 진료실 이에요.' : `${SVC_NAME[k]} 미운영 진료실 이에요.`;
    if (k === 'appt' && !r.appt.todayUsed) return '당일 예약을 받지 않아요.';
    if (k === 'appt') return r.appt.paused ? '오늘 자정까지 당일 예약을 받지 않아요.' : '오늘 당일 예약을 받고 있어요.';
    return r[k].paused ? `오늘 자정까지 ${SVC_NAME[k]}${eul(SVC_NAME[k])} 받지 않아요.` : `오늘 ${SVC_NAME[k]}${eul(SVC_NAME[k])} 받고 있어요.`;
  };
  const enableTitle = (k: SvcKey) => `${SVC_NAME[k]}${eul(SVC_NAME[k])}`;

  return <>
    {/* figma baseline 참조 */}
    <header className="cn-header cu-header dw-fig-head">
      <div>
        <h1 className="cn-title" tabIndex={-1}>{r.alias || r.name}</h1>
        {kit.linked && kit.chartMissingId === r.id && <p className="dw-fig-missing" role="status"><VscWarning />연결한 차트 진료실을 찾을 수 없어요. 설정은 읽기 전용으로 보여요.</p>}
        <p className="dw-fig-desc"><b>{r.name}</b><i className="dw-fig-dot" aria-hidden="true" /><span>{r.dept}</span><i className="dw-fig-dot" aria-hidden="true" /><span>{r.doctors.join(', ')}</span>{kit.linked && <span className="dw-fig-chip">차트에서 관리</span>}</p>
      </div>
      <div className="dw-head-actions">
        {!kit.linked && <><kit.Pin n={25} /><button className="dw-fig-btn" onClick={() => onEdit(r)}><VscEdit />정보 수정</button><button className="dw-fig-btn danger" onClick={() => onDelete(r)}><VscTrash />삭제</button></>}
        <button className="dw-fig-btn" onClick={() => { setError(''); setAliasDraft(r.alias); setModal({ t: 'alias' }); }}>이름 변경</button>
        <div className="dw-pop-wrap">
          <button className="dw-fig-btn icon" data-pop="pause" aria-label="임시 진료 마감" aria-expanded={pauseOpen} onClick={() => setPauseOpen(!pauseOpen)}><VscDebugPause /></button>
          {pauseOpen && <div className="dw-pop dw-pause-pop" role="dialog" aria-label="임시 진료 마감">
            <strong>임시 진료 마감</strong><p className="dw-pre">{'새로운 진료 요청을 받지 않도록,\n오늘 자정까지 진료 마감 상태로 전환합니다.'}</p>
            {pauseItems.map(([k, l]) => { const off = !supported(k) || !r[k].accepted || (k === 'appt' && !r.appt.todayUsed); return <div className={'dw-pause-item ' + (off ? 'off' : '')} key={k}>
              <div><b>{l}</b><small>{pauseDesc(k)}</small></div>
              {!off && <div className="dw-pause-sw" role="group" aria-label={`${l} 임시 마감`}>
                <button className={!r[k].paused ? 'on' : ''} aria-pressed={!r[k].paused} aria-label={`${l} 받기`} onClick={() => r[k].paused && kit.instant(() => setSvc(k, { paused: false }), `${SVC_NAME[k]}${eul(SVC_NAME[k])} 다시 받아요.`)}><VscDebugStart /></button>
                <button className={r[k].paused ? 'on' : ''} aria-pressed={r[k].paused} aria-label={`${l} 임시 마감`} onClick={() => !r[k].paused && kit.instant(() => setSvc(k, { paused: true }), `${SVC_NAME[k]}${eul(SVC_NAME[k])} 임시 마감 했어요.`)}><VscDebugPause /></button>
              </div>}
            </div>; })}
          </div>}
        </div>
      </div>
    </header>
    {banner}
    <div className="cu-content dw-fig-content dw-fig-page">
      {kit.linked && <>
        {/* figma baseline 참조 */}
        <h2 className="dw-fig-sec">차트 정보 <small>수정 불가</small><kit.Pin n={24} /></h2>
        <div className="dw-fig-basic">
          <div><span>진료실 이름</span><strong>{r.alias || r.name}</strong></div>
          <div><span>연결한 차트 진료실</span><strong>{r.name}</strong></div>
          <div><span>진료과 · 의사</span><strong>{r.dept} · {r.doctors.join(', ')}</strong></div>
          <p>연동한 EMR에서 관리하는 정보예요. 환자에게 보일 이름은 ‘이름 변경’(별칭)으로 바꿀 수 있어요. 차트 목록에서 빠진 진료실은 <button className="dw-link" onClick={() => open({ v: 'unused' })}>미사용 설정</button>으로 이동해요.</p>
        </div>
        <h2 className="dw-fig-sec">굿닥 운영 설정 <small>별칭·안내 문구·접수 허용·스케줄·내원목적·임시 마감</small></h2></>}
      {kit.mode === 'unlinked' && <div className="dw-fig-guide pos"><span><VscInfo />EMR을 연동하지 않은 비연동 병원이에요. 현장 접수·원격 접수는 EMR 연동 시 사용할 수 있고, 예약은 지금 바로 운영할 수 있어요.</span></div>}
      {/* figma baseline 참조 */}
      {!r.alias && <div className="dw-fig-guide pos"><span><VscInfo />굿닥 서비스에서 환자들에게 안내할 진료실 이름을 설정해 보세요.</span><button onClick={() => { setError(''); setAliasDraft(''); setModal({ t: 'alias' }); }}>이름 설정하기 <VscArrowRight /></button></div>}
      <div className="dw-fig-svc-list">{(['tablet', 'mobile', 'appt'] as SvcKey[]).map(section)}</div>
    </div>
    {/* figma baseline 참조 */}
    <div className="dw-fig-bottom"><button className="dw-fig-btn bold" onClick={back}>이전</button></div>

    {modal?.t === 'alias' && <M title="진료실 이름" busy={busy} onClose={closeM} footer={<><button className="cu-btn" disabled={busy} onClick={closeM}>취소</button><button className="cu-btn primary" disabled={busy} onClick={() => run(() => update(r.id, x => ({ ...x, alias: aliasDraft.trim() })), '진료실 이름을 변경했어요.', () => setModal(null))}>{retryLabel(busy, error, '확인')}</button></>}>
      <p>굿닥 서비스에서 환자들에게 보여줄 진료실 이름이에요.</p>
      <input className="dw-full" aria-label="진료실 이름(환자 노출)" maxLength={20} placeholder="진료실 이름을 입력해주세요." value={aliasDraft} onChange={e => setAliasDraft(e.target.value)} />
      <p className="cu-subnote">{aliasDraft.length}/20 · 비우면 진료실 이름({r.name})으로 보여요.</p><Err text={error} />
    </M>}
    {modal?.t === 'guide' && <M title="진료실 안내 문구" busy={busy} onClose={closeM} footer={<><button className="cu-btn" disabled={busy} onClick={closeM}>취소</button><button className="cu-btn primary" disabled={busy} onClick={() => run(() => setSvc(modal.k, { guide: guideDraft.trim() }), `${SVC_NAME[modal.k]} 안내문구를 저장했어요.`, () => setModal(null))}>{retryLabel(busy, error, '저장')}</button></>}>
      <p>{modal.k === 'tablet' ? '굿닥 태블릿에서 환자에게 안내할 문구를 입력해 주세요.' : modal.k === 'mobile' ? '굿닥 앱에서 접수 할 때 환자에게 안내할 문구를 입력해 주세요.' : '굿닥 앱에서 예약 할 때 환자에게 안내할 문구를 입력해 주세요.'}</p>
      <textarea className="dw-full" aria-label="진료실 안내 문구" maxLength={100} placeholder="예) 처음 내원하시는 경우 신분증 확인 후 접수 가능합니다. " value={guideDraft} onChange={e => setGuideDraft(e.target.value)} />
      <p className="cu-subnote">{guideDraft.length}/100</p><Err text={error} />
    </M>}
    {modal?.t === 'enable' && <M title={`${enableTitle(modal.k)} 사용하시겠어요?`} busy={busy} onClose={closeM} footer={<><button className="cu-btn" disabled={busy} onClick={closeM}>취소</button><button className="cu-btn primary" disabled={busy} onClick={() => run(() => setSvc(modal.k, { accepted: true }), `${SVC_NAME[modal.k]} 사용을 시작했어요.`, () => { setOpenSec(o => ({ ...o, [modal.k]: true })); setModal(null); })}>{retryLabel(busy, error, '사용하기')}</button></>}>
      <p>사용하기를 누르면 이 진료실에 {enableTitle(modal.k)} 받을 수 있어요.</p><Err text={error} />
    </M>}
    {modal?.t === 'disable' && (() => { const k = modal.k; const keepN = k === 'appt' ? r.aSlots.filter(s => s.booked > 0 && s.date >= TODAY).length : r.rSlots[k].filter(s => s.current > 0 && s.date >= TODAY).length; return <M title={`${enableTitle(k)} 그만 사용하시겠어요?`} busy={busy} onClose={closeM} footer={<><button className="cu-btn" disabled={busy} onClick={closeM}>취소</button><button className="cu-btn danger" disabled={busy} onClick={() => run(() => update(r.id, x => {
      const reset = { ...x[k], accepted: false, paused: false, guide: '', purpose: '', directInput: false, kakao: false } as any;
      if (k === 'appt') reset.advanced = false;
      // 단건 삭제 규칙과 같이 접수·예약이 있는 시간은 남긴다
      return { ...x, [k]: reset, rSlots: k === 'appt' ? x.rSlots : { ...x.rSlots, [k]: x.rSlots[k].filter(s => s.current > 0) }, aSlots: k === 'appt' ? x.aSlots.filter(s => s.booked > 0).map(s => ({ ...s, groupId: '', cap: s.booked })) : x.aSlots, groups: k === 'appt' ? [] : x.groups };
    }), `${SVC_NAME[k]} 사용을 중지했어요.${keepN ? ` ${k === 'appt' ? '예약이' : '접수가'} 있는 시간 ${keepN}개는 유지했어요.` : ''}`, () => { setOpenSec(o => ({ ...o, [k]: false })); setModal(null); })}>{retryLabel(busy, error, '사용중지')}</button></>}>
      {keepN > 0 && <p className="cu-inline-note"><VscInfo />{k === 'appt' ? '예약이' : '접수가'} 있는 시간 {keepN}개는 유지돼요. 이미 받은 환자 약속은 그대로 처리해 주세요.</p>}
      <p className="dw-pre">{`사용 중지를 누르면 이 진료실은 ${enableTitle(k)} 받지 않고,\n모든 ${SVC_NAME[k]} 설정이 삭제돼요.`}</p>
      <p className="dw-red">삭제된 정보는 되돌릴 수 없으니 유의해 주세요.</p>
      {k === 'appt' && activeIn(r) > 0 && <p className="cu-inline-note"><VscInfo /><span>새 예약만 받지 않아요. 이미 받은 진행 중 예약 {activeIn(r)}건은 그대로 처리해 주세요.<kit.Pin n={2} /></span></p>}
      <Err text={error} />
    </M>; })()}
    {modal?.t === 'blockDisable' && <M title="진료실의 카카오톡 예약하기 연동을 해지해 주세요" onClose={closeM} footer={<button className="cu-btn primary" onClick={closeM}>확인</button>}>
      <p className="dw-pre">{`현재 해당 진료실의 ${modal.k === 'mobile' ? '원격접수가' : '예약이'} 카카오톡 예약하기에 연동되어 있어 사용중지할 수 없습니다.\n카카오톡 예약하기 연동을 먼저 해지한 후 진행해 주세요.`}</p>
    </M>}
    {modal?.t === 'purpose' && <M title={modal.next ? '내원목적을 변경하시겠어요?' : '내원목적을 그만 사용하시겠어요?'} busy={busy} onClose={closeM} footer={<><button className="cu-btn" disabled={busy} onClick={closeM}>취소</button><button className="cu-btn primary" disabled={busy} onClick={() => run(() => setSvc(modal.k, { purpose: modal.next, directInput: modal.next ? r[modal.k].directInput : false }), modal.next ? '내원목적을 변경했어요.' : '내원목적 사용을 중지했어요.', () => setModal(null))}>{retryLabel(busy, error, modal.next ? '변경' : '사용중지')}</button></>}>
      <p className="dw-pre">{`${modal.next ? '변경' : '사용 중지'} 시 특정 내원목적으로 만든 일정이 있을 경우,\n해당 일정은 환자에게 노출되지 않으니 유의해 주세요.`}</p><Err text={error} />
    </M>}
    {modal?.t === 'purposeView' && (() => { const g = PURPOSE_GROUPS.find(x => x.id === modal.id); if (!g) return null; const using = allRooms.filter(x => (['tablet', 'mobile', 'appt'] as SvcKey[]).some(k => x[k].purpose === g.id)).length; return <M title={g.name} onClose={closeM} footer={<><button className="cu-btn" onClick={closeM}>취소</button></>}>
      <p className="cu-subnote dw-mt0">사용중 진료실 {using}개 ∙ {g.template ? '기본 양식' : `${g.updated} 마지막 수정`}</p>
      {g.template && <div className="dw-info-box"><VscInfo />기본 제공 양식을 활용해 우리 병원용 내원 목적을 만들 수 있어요.</div>}
      <ul className="dw-tree">{g.tree.map(t => <li key={t}>{t}</li>)}</ul>
      <p className="cu-subnote">수정·복사본 만들기는 내원목적 양식 편집 화면에서 해요(시안 생략).</p>
    </M>; })()}
    {modal?.t === 'schedSwitch' && <M title={modal.to ? '스케줄 운영으로 변경하시겠어요?' : '항시 운영으로 변경하시겠어요?'} busy={busy} onClose={closeM} footer={<><button className="cu-btn" disabled={busy} onClick={closeM}>취소</button><button className="cu-btn primary" disabled={busy} onClick={() => run(() => setSvc('tablet', { slotUsed: modal.to }), modal.to ? '스케줄 운영으로 변경했어요.' : '항시 운영으로 변경했어요.', () => setModal(null))}>{retryLabel(busy, error, '변경')}</button></>}>
      <p className="dw-pre">{modal.to ? '변경된 운영일정을 적용하시겠습니까?' : '변경을 누르면 항시 현장 접수를 받아요.\n기존에 등록한 스케줄은 삭제되지 않고 유지되며\n언제든 다시 스케줄로 운영할 수 있으니 안심하세요.'}</p><Err text={error} />
    </M>}
  </>;
}

/* ═════════════ 공통 주간 그리드 · 유틸 모달 ═════════════ */
const ROW = 44;
function WeekHeader({ weekStart, setWeekStart, minWeek, maxWeek, status, onMaxBlocked }: { weekStart: string; setWeekStart: (s: string) => void; minWeek: string; maxWeek?: string; status: string; onMaxBlocked?: () => void }) {
  const end = addDays(weekStart, 6);
  const label = weekStart.slice(5, 7) === end.slice(5, 7) ? `${weekStart.slice(0, 4)}년 ${Number(weekStart.slice(5, 7))}월` : `${weekStart.slice(0, 4)}년 ${Number(weekStart.slice(5, 7))}월 - ${Number(end.slice(5, 7))}월`;
  return <div className="dw-week-nav">
    <button className="cu-btn" onClick={() => setWeekStart(weekStartOf(TODAY))}>오늘</button>
    <button className="cu-icon" aria-label="이전 주" disabled={weekStart <= minWeek} onClick={() => setWeekStart(addDays(weekStart, -7))}><VscChevronLeft /></button>
    <button className="cu-icon" aria-label="다음 주" onClick={() => { const n = addDays(weekStart, 7); if (maxWeek && n > maxWeek) { onMaxBlocked?.(); return; } setWeekStart(n); }}><VscChevronRight /></button>
    <strong>{label}</strong>
    <span className={'dw-save-status ' + (status === '저장 실패' ? 'fail' : '')} role="status">{status}</span>
  </div>;
}
function timeOptions(from: number, to: number, step: number) { const out: string[] = []; for (let m = from; m <= to; m += step) out.push(m === 1440 ? '24:00' : fromMin(m)); return out; }
const R_TIMES = timeOptions(0, 1440, 10), A_TIMES = timeOptions(360, 1435, 5);

function CopyModal({ kit, weekStart, onClose, onApply, maxWeeks }: { kit: Kit; weekStart: string; onClose: () => void; onApply: (weeks: number, holidays: boolean) => Promise<boolean>; maxWeeks: number }) {
  const M = kit.Modal;
  const [weeks, setWeeks] = useState(1), [hol, setHol] = useState(true), [confirm, setConfirm] = useState(false), [busy, setBusy] = useState(false);
  const from = addDays(weekStart, 7), to = addDays(weekStart, 7 * weeks + 6);
  const doApply = async () => { setBusy(true); const ok = await onApply(weeks, hol); setBusy(false); if (ok) onClose(); };
  if (confirm) return <M title="선택한 기간에 복사할 스케줄을 적용하시겠어요?" busy={busy} onClose={() => !busy && setConfirm(false)} footer={<><button className="cu-btn" disabled={busy} onClick={() => setConfirm(false)}>취소</button><button className="cu-btn primary" disabled={busy} onClick={doApply}>{busy ? '처리 중…' : '적용'}</button></>}>
    <p>선택한 기간에 기존 스케줄이 있을 경우, 복사할 새로운 스케줄로 교체되고 되돌릴 수 없어요.</p>
  </M>;
  return <M title="스케줄 복사" onClose={onClose} footer={<><button className="cu-btn" onClick={onClose}>취소</button><button className="cu-btn primary" disabled={weeks < 1 || weeks > maxWeeks} onClick={() => setConfirm(true)}>확인</button></>}>
    <p>복사할 스케줄을 적용할 기간을 선택해 주세요.</p>
    <div className="dw-copy-row"><b>{weekStart.slice(5).replace('-', '.')}~{addDays(weekStart, 6).slice(5).replace('-', '.')}</b> 스케줄을
      <select aria-label="복사 주 수" value={weeks} onChange={e => setWeeks(Number(e.target.value))}>{Array.from({ length: Math.max(1, Math.min(52, maxWeeks)) }, (_, i) => <option key={i} value={i + 1}>{i + 1}주</option>)}</select> 뒤 까지 붙여넣어요</div>
    <p className="cu-subnote">{dotDate(from)} ~ {dotDate(to)} 일정에 적용돼요.</p>
    <label className="dw-check"><input type="checkbox" checked={hol} onChange={() => setHol(!hol)} />공휴일에도 붙여넣기</label>
  </M>;
}
function HolidayDeleteModal({ kit, dates, onClose, onApply }: { kit: Kit; dates: string[]; onClose: () => void; onApply: (sel: string[]) => Promise<boolean> }) {
  const M = kit.Modal; const [sel, setSel] = useState<string[]>([]), [busy, setBusy] = useState(false);
  const all = dates.length > 0 && sel.length === dates.length;
  return <M title="공휴일 스케줄 삭제" busy={busy} onClose={() => !busy && onClose()} footer={<><button className="cu-btn" disabled={busy} onClick={onClose}>취소</button><button className="cu-btn danger" disabled={busy || !sel.length} onClick={async () => { setBusy(true); const ok = await onApply(sel); setBusy(false); if (ok) onClose(); }}>{busy ? '처리 중…' : '삭제'}</button></>}>
    <p>스케줄 삭제할 공휴일을 선택해 주세요.</p>
    {dates.length ? <div className="dw-hol-list">
      <label className="dw-check"><input type="checkbox" checked={all} onChange={() => setSel(all ? [] : dates)} />전체</label>
      {dates.map(d => <label className="dw-check" key={d}><input type="checkbox" checked={sel.includes(d)} onChange={() => setSel(s => s.includes(d) ? s.filter(x => x !== d) : [...s, d])} />{dotDate(d)} {HOLIDAYS[d]}</label>)}
    </div> : <p className="cu-subnote">스케줄이 등록된 공휴일이 없어요.</p>}
  </M>;
}
function ConfirmModal({ kit, title, body, okLabel, danger, onClose, onOk, extra }: { kit: Kit; title: string; body: string; okLabel: string; danger?: boolean; onClose: () => void; onOk: () => Promise<boolean>; extra?: React.ReactNode }) {
  const M = kit.Modal; const [busy, setBusy] = useState(false);
  return <M title={title} busy={busy} onClose={() => !busy && onClose()} footer={<><button className="cu-btn" disabled={busy} onClick={onClose}>취소</button><button className={'cu-btn ' + (danger ? 'danger' : 'primary')} disabled={busy} onClick={async () => { setBusy(true); const ok = await onOk(); setBusy(false); if (ok) onClose(); }}>{busy ? '처리 중…' : okLabel}</button></>}><p className="dw-pre">{body}</p>{extra}</M>;
}
function HolidayNoteModal({ kit, onClose }: { kit: Kit; onClose: () => void }) {
  const M = kit.Modal;
  return <M title="이날 진료 하시나요?" onClose={onClose} footer={<button className="cu-btn primary" onClick={onClose}>확인</button>}><p>병원 운영일 기준 휴진일로 설정돼 있어 빨간색으로 표시되지만 스케줄을 입력하면 접수·예약이 가능합니다. 실제 휴진일이 아니라면 병원 검색 정보 &gt; 운영 시간에서 일정을 수정해 주세요.</p></M>;
}

/* ═════════════ 접수 스케줄 (현장·원격) ═════════════ */
type RForm = { id?: string; date: string; start: string; end: string; hasLimit: boolean; limit: string; days: number[] };
function ReceiptSchedule({ kit, room: r, type, ro, update, back, banner }: { kit: Kit; room: Room; type: 'tablet' | 'mobile'; ro: boolean; update: (id: string, fn: (r: Room) => Room) => void; back: () => void; banner: React.ReactNode }) {
  const M = kit.Modal;
  const [weekStart, setWeekStart] = useState(weekStartOf(TODAY));
  const minWeek = weekStartOf(`${TODAY.slice(0, 5)}${String(Number(TODAY.slice(5, 7)) - 1).padStart(2, '0')}-01`);
  const { status, commit } = useCommit(kit);
  const [form, setForm] = useState<RForm | null>(null), [dup, setDup] = useState<string[] | null>(null), [prevent, setPrevent] = useState<RSlot | null>(null);
  const [util, setUtil] = useState<'' | 'copy' | 'weekDel' | 'holDel' | 'holNote'>('');
  const { busy, error, setError, run } = useRun(kit);
  const slots = r.rSlots[type];
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const setSlots = (fn: (s: RSlot[]) => RSlot[]) => update(r.id, x => ({ ...x, rSlots: { ...x.rSlots, [type]: fn(x.rSlots[type]) } }));
  const n = SVC_NAME[type];
  const G0 = 7, G1 = 22;

  const editing = form?.id ? slots.find(s => s.id === form.id) : undefined;
  const locked = !!editing && editing.current > 0;
  const readOnly = ro || !!editing && (editing.date < TODAY || (editing.date === TODAY && (editing.end === '24:00' ? '24:00' : editing.end) <= NOW));
  const fWeek = form ? weekStartOf(form.date) : weekStart;
  const errs = (() => {
    if (!form) return [] as string[];
    const out: string[] = []; const s = toMin(form.start), e = form.end === '24:00' ? 1440 : toMin(form.end);
    if (readOnly) return out;
    if (!locked && isPast(form.date, form.start)) out.push('과거 시간이 포함되지 않도록 입력해 주세요.');
    if (e <= s) out.push('종료 시간은 시작 시간 이후로 입력해 주세요.');
    else if (e - s < 30) out.push('최소 30분 이상 입력해 주세요.');
    if (slots.some(x => x.id !== form.id && x.date === form.date && toMin(x.start) < e && (x.end === '24:00' ? 1440 : toMin(x.end)) > s)) out.push('기존에 등록한 시간과 겹치지 않도록 입력해 주세요.');
    if (form.hasLimit) { const l = Number(form.limit); if (!form.limit || l < 1) out.push('최소 1명 이상 입력해 주세요.'); else if (l > 300) out.push('최대 300명 까지 입력할 수 있어요.'); else if (editing && l < editing.current) out.push(`이미 ${editing.current}명이 접수했어요. ${editing.current}명 이상으로 입력해 주세요.`); }
    return out;
  })();
  const openNew = (date: string, hour: number) => {
    if (ro) { kit.notify('읽기 전용 화면이라 스케줄을 등록할 수 없어요.'); return; }
    if (date < TODAY) { kit.fail('지난 날짜에는 스케줄을 등록할 수 없어요.'); return; }
    const st = hour * 60, en = Math.min(hour === 23 ? 1439 : st + 60, 1440);
    setError(''); setForm({ date, start: fromMin(st), end: en === 1440 ? '24:00' : fromMin(en), hasLimit: false, limit: '', days: [dowIdx(date)] });
  };
  const openEdit = (s: RSlot) => { setError(''); setForm({ id: s.id, date: s.date, start: s.start, end: s.end, hasLimit: s.limit != null, limit: s.limit != null ? String(s.limit) : '', days: [dowIdx(s.date)] }); };
  // 고른 날짜(form.date)가 속한 주 기준으로 저장 대상 계산 — 겹침 검사와 같은 기준
  const targets = (f: RForm) => f.id ? [f.date] : Array.from(new Set([f.date, ...f.days.map(d => addDays(weekStartOf(f.date), d))])).filter(d => d === f.date || (d >= TODAY && !(d === TODAY && f.start < NOW)));
  const overlaps = (date: string, f: RForm) => slots.filter(x => x.id !== f.id && x.date === date && toMin(x.start) < (f.end === '24:00' ? 1440 : toMin(f.end)) && (x.end === '24:00' ? 1440 : toMin(x.end)) > toMin(f.start));
  const submit = (force = false) => {
    if (!form || errs.length) return;
    const t = targets(form);
    const dupDays = form.id ? [] : t.filter(d => d !== form.date && overlaps(d, form).length);
    if (dupDays.length && !force) { setDup(dupDays.map(d => DOWS[dowIdx(d)])); return; }
    const limit = form.hasLimit ? Number(form.limit) : null; const f = form;
    const skipped = f.id ? [] : t.filter(d => overlaps(d, f).some(x => x.current > 0)); // 접수가 있는 중복 스케줄이 있는 날은 건너뜀
    if (!f.id && skipped.length === t.length) { kit.fail('모든 날에 접수가 있는 스케줄이 있어 등록하지 못했어요.'); return; }
    run(() => setSlots(old => {
      if (f.id) return old.map(x => x.id === f.id ? { ...x, date: f.date, start: f.start, end: f.end, limit } : x);
      let next = old;
      t.filter(d => !skipped.includes(d)).forEach(d => {
        const ov = next.filter(x => x.date === d && toMin(x.start) < (f.end === '24:00' ? 1440 : toMin(f.end)) && (x.end === '24:00' ? 1440 : toMin(x.end)) > toMin(f.start));
        next = [...next.filter(x => !ov.includes(x)), { id: uid('S'), date: d, start: f.start, end: f.end, limit, current: 0 }];
      });
      return next;
    }), f.id ? '스케줄을 수정했어요.' : `스케줄을 등록했어요.${skipped.length ? ` ${skipped.length}일은 이미 접수가 있는 스케줄이 있어 건너뛰었어요.` : ''}`, () => { setForm(null); setDup(null); setWeekStart(weekStartOf(f.date)); });
  };
  const del = (s: RSlot) => {
    if (s.current > 0) { setPrevent(s); return; }
    run(() => setSlots(old => old.filter(x => x.id !== s.id)), '스케줄을 삭제했어요.', () => setForm(null));
  };
  const weekSlots = slots.filter(s => s.date >= weekStart && s.date <= addDays(weekStart, 6));
  const holWithSlots = Object.keys(HOLIDAYS).filter(d => d.slice(0, 4) === weekStart.slice(0, 4) && slots.some(s => s.date === d));
  /** 범위 삭제: 접수가 있는 블록은 남기고 개수를 알린다. 지울 게 없으면 실패 안내 */
  const delWhere = (pred: (s: RSlot) => boolean, ok: string) => {
    const hit = slots.filter(s => pred(s) && s.date >= TODAY), kept = hit.filter(s => s.current > 0).length;
    if (hit.length && kept === hit.length) { kit.fail(`접수가 있는 스케줄 ${kept}개는 삭제할 수 없어요.`); return Promise.resolve(false); }
    return commit(() => setSlots(old => old.filter(s => !(pred(s) && s.date >= TODAY) || s.current > 0)), kept ? `${ok} 접수가 있는 ${kept}개는 남겼어요.` : ok);
  };

  return <>
    <header className="cn-header cu-header dw-sched-header">
      <div><button className="dw-crumb" onClick={back}><VscChevronLeft />{r.alias || r.name} / {n} 운영 스케줄</button>
        <WeekHeader weekStart={weekStart} setWeekStart={setWeekStart} minWeek={minWeek} status={status} />
      </div>
      {!ro && <div className="dw-head-actions">
        <button className="cu-btn quiet" onClick={() => setUtil('holDel')}>공휴일 스케줄 삭제</button>
        <button className="cu-btn quiet" disabled={!weekSlots.length} onClick={() => setUtil('weekDel')}>주간 스케줄 삭제</button>
        <button className="cu-btn" disabled={!weekSlots.length} onClick={() => setUtil('copy')}><VscCopy />주간 스케줄 복사</button>
      </div>}
    </header>
    {banner}
    <div className="cu-content">
      <p className="cu-inline-note dw-note"><VscInfo /><span>진료항목 예약은 병원 운영시간 기준으로 받아요. 이 진료실 스케줄과는 연결되지 않아요.<kit.Pin n={4} /></span></p>
      {type === 'tablet' && !r.tablet.slotUsed && <p className="cu-inline-note dw-note"><VscInfo />지금은 ‘항시 운영’이라 이 스케줄은 적용되지 않아요. 진료실 상세에서 ‘스케줄 운영’으로 바꾸면 적용돼요.</p>}
      {ro && <div className="dw-fig-guide neg"><span><VscWarning />연결한 차트 진료실을 찾을 수 없어 읽기 전용으로 보여요.</span></div>}
      <p className="cu-subnote dw-mt0">빈 칸을 누르면 1시간 스케줄 등록, 블록을 누르면 수정·삭제해요. 지난달 1일이 있는 주까지 돌아볼 수 있어요. 드래그 이동·리사이즈는 시안에서 생략했어요.</p>
      <div className="dw-grid" style={{ ['--rows' as any]: G1 - G0 }}>
        <div className="dw-grid-head"><span />{days.map(d => { const past = d < TODAY; const cnt = slots.filter(s => s.date === d).length; return <div key={d} className={'dw-dh ' + (d === TODAY ? 'today ' : '') + (HOLIDAYS[d] || dowIdx(d) === 6 ? 'hol ' : '') + (past ? 'past' : '')}>
          <b>{DOWS[dowIdx(d)]} {Number(d.slice(8))}</b>{HOLIDAYS[d] && <small>{HOLIDAYS[d]}</small>}
          {cnt > 0 && !past && !ro && <button className="dw-mini" onClick={() => delWhere(s => s.date === d, `${dotDate(d)} 스케줄을 삭제했어요.`)}>일 삭제</button>}
        </div>; })}</div>
        <div className="dw-grid-body">
          <div className="dw-hours">{Array.from({ length: G1 - G0 }, (_, i) => <span key={i}>{String(G0 + i).padStart(2, '0')}:00</span>)}</div>
          {days.map(d => <div key={d} className={'dw-col ' + (d < TODAY ? 'past ' : '') + (HOLIDAYS[d] || dowIdx(d) === 6 ? 'hol' : '')}>
            {Array.from({ length: G1 - G0 }, (_, i) => <button key={i} className="dw-cell" aria-label={`${dotDate(d)} ${G0 + i}시 스케줄 등록`} onClick={() => openNew(d, G0 + i)} />)}
            {d === TODAY && <i className="dw-now" style={{ top: (toMin(NOW) - G0 * 60) / 60 * ROW }} />}
            {slots.filter(s => s.date === d).map(s => { const st = Math.max(toMin(s.start), G0 * 60), en = Math.min(s.end === '24:00' ? 1440 : toMin(s.end), G1 * 60); if (en <= st) return null; return <button key={s.id} className={'dw-block ' + (s.stopped ? 'stopped ' : '') + (d < TODAY ? 'past' : '')} style={{ top: (st - G0 * 60) / 60 * ROW, height: Math.max(18, (en - st) / 60 * ROW - 2) }} onClick={() => openEdit(s)}>
              <b>{s.start} - {s.end === '00:00' ? '24:00' : s.end}</b><small>({s.current}{s.limit != null ? `/${s.limit}` : ''}){s.stopped ? ' · 접수 중지' : ''}</small>
            </button>; })}
          </div>)}
        </div>
      </div>
      <div className="dw-bottom-bar left"><button className="cu-btn" onClick={back}>이전</button></div>
    </div>

    {form && !dup && <M title={ro ? '스케줄 보기' : readOnly ? '지난 스케줄' : form.id ? '스케줄 수정' : '스케줄 등록'} busy={busy} onClose={() => { if (!busy) { setForm(null); setError(''); } }} footer={readOnly ? <button className="cu-btn primary" onClick={() => setForm(null)}>닫기</button> : <>{form.id && <button className="cu-btn dw-danger-line dw-mr-auto" disabled={busy} onClick={() => editing && del(editing)}>삭제</button>}<button className="cu-btn" disabled={busy} onClick={() => { setForm(null); setError(''); }}>취소</button><button className="cu-btn primary" disabled={busy || errs.length > 0} onClick={() => submit()}>{retryLabel(busy, error, form.id ? '수정' : '등록')}</button></>}>
      <p>{ro ? '읽기 전용 화면이에요.' : readOnly ? '지난 시간의 스케줄은 볼 수만 있어요.' : '입력한 시간 동안 설정한 인원만큼 접수를 받아요.'}</p>
      {(HOLIDAYS[form.date] || dowIdx(form.date) === 6) && <div className="dw-red-box">이날 진료 하시나요?<button className="dw-link" onClick={() => setUtil('holNote')}>자세히 보기</button></div>}
      {editing && <p className="dw-count-line">접수 환자 수 <b>{editing.current}{editing.limit != null ? `/${editing.limit}` : ''}</b></p>}
      <div className="dw-form-grid">
        <label className="cu-form-label">날짜<input type="date" aria-label="날짜" min={TODAY} disabled={locked || readOnly} value={form.date} onChange={e => setForm({ ...form, date: e.target.value || form.date, days: form.id ? form.days : [dowIdx(e.target.value || form.date)] })} /></label>
        <div className="cu-form-label">시간<div className="dw-time-row"><select aria-label="시작 시간" disabled={locked || readOnly} value={form.start} onChange={e => setForm({ ...form, start: e.target.value })}>{R_TIMES.slice(0, -1).map(t => <option key={t}>{t}</option>)}</select>~<select aria-label="종료 시간" disabled={readOnly} value={form.end} onChange={e => setForm({ ...form, end: e.target.value })}>{R_TIMES.slice(1).map(t => <option key={t}>{t}</option>)}</select></div></div>
      </div>
      <div className="dw-limit-row"><label className="dw-check"><input type="checkbox" disabled={readOnly} checked={form.hasLimit} onChange={() => setForm({ ...form, hasLimit: !form.hasLimit })} />접수 인원 제한</label>{form.hasLimit && <><input type="text" inputMode="numeric" aria-label="환자 수" disabled={readOnly} placeholder="정수만" value={form.limit} onChange={e => setForm({ ...form, limit: digits(e.target.value, 3, form.limit) })} />명</>}</div>
      {!form.id && <div className="cu-form-label">같은 설정을 사용할 요일<div className="dw-dow-toggles">{DOWS.map((w, i) => { const own = i === dowIdx(form.date); const date = addDays(fWeek, i); const pastDay = date < TODAY; return <button key={w} type="button" className={form.days.includes(i) ? 'on' : ''} disabled={own || pastDay} aria-pressed={form.days.includes(i)} onClick={() => setForm({ ...form, days: form.days.includes(i) ? form.days.filter(x => x !== i) : [...form.days, i] })}>{w}</button>; })}</div><small className="dw-muted">고른 날짜가 있는 주({dotDate(fWeek)} 주)의 요일에 같은 시간으로 등록해요. 지난 요일은 고를 수 없어요.</small></div>}
      {errs.slice(0, 1).map(e => <p key={e} className="dw-field-err dw-block">{e}</p>)}
      <Err text={error} />
    </M>}
    {dup && form && <M title="스케줄이 중복되는 요일이 있어요" busy={busy} onClose={() => { if (!busy) { setDup(null); setError(''); } }} footer={<><button className="cu-btn" disabled={busy} onClick={() => { setDup(null); setError(''); }}>취소</button><button className="cu-btn primary" disabled={busy} onClick={() => submit(true)}>{retryLabel(busy, error, '무시하고 등록')}</button></>}>
      <p>무시하고 등록을 누르면 접수가 없는 중복 스케줄을 삭제하고, 새 스케줄이 등록돼요.</p><p className="dw-red">{dup.join(', ')}요일 스케줄을 확인해 주세요.</p><Err text={error} />
    </M>}
    {prevent && <M title="접수가 발생한 스케줄은 삭제할 수 없어요" busy={busy} onClose={() => !busy && setPrevent(null)} footer={<><button className="cu-btn" disabled={busy} onClick={() => setPrevent(null)}>닫기</button><button className="cu-btn primary" disabled={busy || prevent.stopped} onClick={() => run(() => setSlots(old => old.map(x => x.id === prevent.id ? { ...x, stopped: true } : x)), '이 시간에 접수를 중지했어요.', () => { setPrevent(null); setForm(null); })}>{retryLabel(busy, error, '이 시간 접수 중지')}</button></>}>
      <p>대신 이 시간에 접수를 그만 받으려면 ‘이 시간 접수 중지’를 눌러주세요.</p><Err text={error} />
    </M>}
    {util === 'copy' && <CopyModal kit={kit} weekStart={weekStart} maxWeeks={52} onClose={() => setUtil('')} onApply={(w, hol) => commit(() => setSlots(old => {
      const src = old.filter(s => s.date >= weekStart && s.date <= addDays(weekStart, 6));
      const from = addDays(weekStart, 7), to = addDays(weekStart, 7 * w + 6);
      const keep = old.filter(s => s.date < from || s.date > to || s.current > 0 || (!hol && !!HOLIDAYS[s.date]));
      const add: RSlot[] = [];
      for (let i = 1; i <= w; i++) src.forEach(s => { const d = addDays(s.date, 7 * i); if (!hol && HOLIDAYS[d]) return; if (keep.some(k => k.date === d && k.current > 0)) return; add.push({ ...s, id: uid('S'), date: d, current: 0, stopped: false }); });
      return [...keep, ...add];
    }), '스케줄을 붙여넣었어요.')} />}
    {util === 'weekDel' && <ConfirmModal kit={kit} title="해당 주간 스케줄을 모두 삭제하시겠어요?" body="삭제하면 되돌릴 수 없으니 유의해 주세요." okLabel="삭제" danger onClose={() => setUtil('')} onOk={() => delWhere(s => s.date >= weekStart && s.date <= addDays(weekStart, 6), '주간 스케줄을 삭제했어요.')} />}
    {util === 'holDel' && <HolidayDeleteModal kit={kit} dates={holWithSlots} onClose={() => setUtil('')} onApply={sel => delWhere(s => sel.includes(s.date), '선택한 공휴일 스케줄을 삭제했어요.')} />}
    {util === 'holNote' && <HolidayNoteModal kit={kit} onClose={() => setUtil('')} />}
  </>;
}

/* ═════════════ 예약 스케줄 ═════════════ */
type AForm = { date: string; start: string; end: string; interval: number; days: number[] };
type GForm = { id?: string; name: string; color: string; cap: string; sameDay: boolean; rangeMode: 'always' | 'period'; rangeDays: string; startDate: string; endDate: string; openTime: string };
function ApptSchedule({ kit, room: r, ro, update, back, banner }: { kit: Kit; room: Room; ro: boolean; update: (id: string, fn: (r: Room) => Room) => void; back: () => void; banner: React.ReactNode }) {
  const M = kit.Modal;
  const [weekStart, setWeekStart] = useState(weekStartOf(TODAY));
  const minWeek = weekStartOf(`${TODAY.slice(0, 5)}${String(Number(TODAY.slice(5, 7)) - 1).padStart(2, '0')}-01`);
  const maxWeek = r.appt.advanced ? weekStartOf(addDays(TODAY, 97)) : undefined;
  const { status, commit } = useCommit(kit);
  const [sel, setSel] = useState<string>(r.groups[0]?.id || '');
  const [form, setForm] = useState<AForm | null>(null), [gform, setGform] = useState<GForm | null>(null), [gTried, setGTried] = useState(false);
  const [util, setUtil] = useState<'' | 'copy' | 'weekDel' | 'holDel' | 'needGroup' | 'toAdv' | 'toBasic' | 'gDel' | 'holNote'>('');
  const [ack, setAck] = useState(false), [kakaoBlock, setKakaoBlock] = useState(false);
  const { busy, error, setError, run } = useRun(kit);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const group = r.groups.find(g => g.id === sel);
  const setA = (fn: (x: Room) => Partial<Room>) => update(r.id, x => ({ ...x, ...fn(x) }));
  const G0 = 6, G1 = 21;
  useEffect(() => { if (sel && !r.groups.some(g => g.id === sel)) setSel(r.groups[0]?.id || ''); }, [r.groups, sel]);

  const aErr = (() => {
    if (!form) return '';
    if (form.date < TODAY || toMin(form.start) < 360) return '입력 가능한 시간이 아닙니다.';
    if (toMin(form.end) < toMin(form.start)) return '종료 시간은 시작 시간과 같거나 이후로 입력해 주세요.';
    return '';
  })();
  const openNew = (date: string, hour: number) => {
    if (ro) { kit.notify('읽기 전용 화면이라 스케줄을 등록할 수 없어요.'); return; }
    if (!r.groups.length) { setUtil('needGroup'); return; }
    if (!group) { kit.fail('일정 그룹을 먼저 선택해 주세요.'); return; }
    if (date < TODAY) { kit.fail('지난 날짜에는 스케줄을 등록할 수 없어요.'); return; }
    const st = Math.max(hour * 60, 360); setError(''); setForm({ date, start: fromMin(st), end: fromMin(st + 5), interval: 5, days: [dowIdx(date)] });
  };
  const submitA = () => {
    if (!form || aErr || !group) return;
    const f = form, g = group;
    // 고른 날짜(form.date)가 속한 주 기준으로 저장
    const dates = Array.from(new Set([f.date, ...f.days.map(d => addDays(weekStartOf(f.date), d))])).filter(d => d >= TODAY);
    const add: ASlot[] = []; let past = 0, dupN = 0;
    dates.forEach(d => { const s = toMin(f.start), e = toMin(f.end); for (let m = s; m < e || (m === s && s === e); m += f.interval) { const t = fromMin(m); if (isPast(d, t)) { past++; if (s === e) break; continue; } if (r.aSlots.some(x => x.date === d && x.time === t) || add.some(x => x.date === d && x.time === t)) { dupN++; if (s === e) break; continue; } add.push({ id: uid('A'), date: d, time: t, groupId: g.id, cap: g.cap, booked: 0 }); if (s === e) break; } });
    if (!add.length) { kit.fail(past && !dupN ? '지난 시간은 등록할 수 없어요.' : '이미 등록된 스케줄이 있어요.'); return; }
    const extra = [past ? `지난 시간 ${past}개` : '', dupN ? `이미 있는 시간 ${dupN}개` : ''].filter(Boolean).join(', ');
    run(() => setA(x => ({ aSlots: [...x.aSlots, ...add] })), `스케줄을 등록했어요.${extra ? ` ${extra}는 제외했어요.` : ''}`, () => { setForm(null); setWeekStart(weekStartOf(f.date)); });
  };
  const delSlot = (s: ASlot) => commit(() => setA(x => ({ aSlots: s.booked > 0 ? x.aSlots.map(y => y.id === s.id ? { ...y, cap: y.booked } : y) : x.aSlots.filter(y => y.id !== s.id) })), s.booked > 0 ? '완료된 예약을 제외한 스케줄을 삭제했어요.' : '스케줄을 삭제했어요.');
  /** 범위 삭제: 예약이 있는 시간은 남기고(정원만 예약 수로 줄임) 개수를 알린다 */
  const delWhereA = (pred: (s: ASlot) => boolean, ok: string) => {
    const hit = r.aSlots.filter(s => pred(s) && s.date >= TODAY), kept = hit.filter(s => s.booked > 0).length;
    if (hit.length && hit.every(s => s.booked >= s.cap)) { kit.fail(`예약이 찬 시간 ${kept}개는 삭제할 수 없어요.`); return Promise.resolve(false); }
    return commit(() => setA(x => ({ aSlots: x.aSlots.filter(y => !(pred(y) && y.date >= TODAY) || y.booked > 0).map(y => pred(y) && y.date >= TODAY ? { ...y, cap: y.booked } : y) })), kept ? `${ok} 예약이 있는 ${kept}개는 남겼어요.` : ok);
  };
  const dayDel = (d: string) => delWhereA(s => s.date === d, `${dotDate(d)} 스케줄을 삭제했어요.`);

  const gErrs = (() => {
    if (!gform) return {} as Record<string, string>;
    const e: Record<string, string> = {};
    if (!gform.name.trim()) e.name = '일정 그룹 이름을 입력해 주세요.';
    if (gform.rangeMode === 'always') { const n = Number(gform.rangeDays); if (!gform.rangeDays || n < 1) e.range = '최소 1일부터 입력할 수 있어요.'; else if (n > 90) e.range = '최대 90일까지 입력할 수 있어요.'; }
    else { if (gform.startDate > gform.endDate) e.range = '시작일은 종료일 이전으로 입력해 주세요.'; else if (gform.endDate < TODAY) e.range = '노출 기간이 지났어요. 종료일을 오늘 이후로 입력해 주세요.'; }
    if (r.appt.advanced) { const c = Number(gform.cap); if (!c || c < 1 || c > 5) e.cap = '1~5명 사이로 입력해 주세요.'; }
    return e;
  })();
  const openGroup = (g?: AGroup) => {
    if (!g && r.groups.length >= 16) { kit.fail('일정 그룹은 최대 16개까지 만들 수 있어요.'); return; }
    if (!g && !r.appt.advanced && r.groups.length >= 1) { if (r.appt.kakao) { setKakaoBlock(true); return; } setAck(false); setUtil('toAdv'); return; }
    setError(''); setGTried(false);
    setGform(g ? { id: g.id, name: g.name, color: g.color, cap: String(g.cap), sameDay: g.sameDay, rangeMode: g.rangeMode, rangeDays: String(g.rangeDays), startDate: g.startDate, endDate: g.endDate, openTime: g.openTime }
      : { name: '', color: COLORS[r.groups.length % COLORS.length], cap: '1', sameDay: true, rangeMode: 'always', rangeDays: '14', startDate: TODAY, endDate: addDays(TODAY, 30), openTime: '00:00' });
  };
  const submitG = () => {
    setGTried(true); if (!gform || Object.keys(gErrs).length) return;
    const f = gform; const entry: AGroup = { id: f.id || uid('G'), name: f.name.trim(), color: f.color, cap: r.appt.advanced ? Number(f.cap) : 1, sameDay: f.sameDay, rangeMode: f.rangeMode, rangeDays: Number(f.rangeDays), startDate: f.startDate, endDate: f.endDate, openTime: f.openTime };
    run(() => setA(x => ({ groups: f.id ? x.groups.map(g => g.id === f.id ? entry : g) : [...x.groups, entry], aSlots: f.id ? x.aSlots.map(s => s.groupId === f.id ? { ...s, cap: Math.max(s.booked, entry.cap) } : s) : x.aSlots })), f.id ? '일정 그룹을 수정했어요.' : '일정 그룹을 등록했어요.', () => { setGform(null); setSel(entry.id); });
  };
  const weekSlots = r.aSlots.filter(s => s.date >= weekStart && s.date <= addDays(weekStart, 6));
  const holWithSlots = Object.keys(HOLIDAYS).filter(d => d.slice(0, 4) === weekStart.slice(0, 4) && r.aSlots.some(s => s.date === d));
  const maxCopyWeeks = maxWeek ? Math.max(0, Math.round((d0(maxWeek).getTime() - d0(weekStart).getTime()) / (7 * 86400000))) : 52;
  const gName = (id: string) => r.groups.find(g => g.id === id);
  const orphanN = r.aSlots.filter(s => !gName(s.groupId)).length;

  return <>
    <header className="cn-header cu-header dw-sched-header">
      <div><button className="dw-crumb" onClick={back}><VscChevronLeft />{r.alias || r.name} / 예약 운영 스케줄</button>
        <WeekHeader weekStart={weekStart} setWeekStart={setWeekStart} minWeek={minWeek} maxWeek={maxWeek} status={status} onMaxBlocked={() => kit.fail('스케줄은 최대 3개월 까지만 미리 설정할 수 있어요.')} />
      </div>
      {!ro && <div className="dw-head-actions">
        <label className="dw-adv"><span>고급 설정</span><button className={'cu-toggle ' + (r.appt.advanced ? 'on' : '')} aria-label="고급 설정" aria-pressed={r.appt.advanced} onClick={() => { if (!r.appt.advanced && r.appt.kakao) { setKakaoBlock(true); return; } setAck(false); setUtil(r.appt.advanced ? 'toBasic' : 'toAdv'); }}><span /></button></label>
        <button className="cu-btn quiet" disabled={!weekSlots.length} onClick={() => setUtil('weekDel')}>주간 스케줄 전체 삭제</button>
        <button className="cu-btn quiet" onClick={() => setUtil('holDel')}>공휴일 스케줄 삭제</button>
        <button className="cu-btn" disabled={!weekSlots.length || maxCopyWeeks < 1} onClick={() => setUtil('copy')}><VscCopy />스케줄 복사</button>
      </div>}
    </header>
    {banner}
    <div className="cu-content dw-appt-wrap">
      {ro && <div className="dw-fig-guide neg dw-span-all"><span><VscWarning />연결한 차트 진료실을 찾을 수 없어 읽기 전용으로 보여요.</span></div>}
      <p className="cu-inline-note dw-note dw-span-all"><VscInfo /><span>진료항목 예약은 병원 운영시간 기준으로 받아요. 이 진료실 예약 스케줄과는 연결되지 않아요.<kit.Pin n={4} /></span></p>
      <aside className="dw-groups" aria-label="일정 그룹">
        <div className="dw-groups-head"><strong>일정 그룹</strong><small>{r.appt.advanced ? '고급 설정' : '기본 설정'}</small></div>
        {r.groups.length === 0 && <p className="cu-subnote">등록된 일정 그룹이 없어요.</p>}
        {r.groups.map(g => { const expired = g.rangeMode === 'period' && g.endDate < TODAY; return <div key={g.id} className={'dw-group ' + (sel === g.id ? 'sel' : '')}>
          <button className="dw-group-main" aria-pressed={sel === g.id} onClick={() => setSel(g.id)}><i style={{ background: g.color }} /><span><b>{g.name}</b><small>{g.sameDay ? '당일 예약 가능' : '당일 예약 불가'} · {g.rangeMode === 'always' ? `${g.rangeDays}일 노출` : `${g.startDate.slice(5)}~${g.endDate.slice(5)}`}{r.appt.advanced ? ` · 최대 ${g.cap}명` : ''}</small></span>{expired && <em className="dw-red">수정 필요</em>}</button>
          {!ro && <button className="cu-icon" aria-label={`${g.name} 수정`} onClick={() => openGroup(g)}><VscGear /></button>}
        </div>; })}
        {orphanN > 0 && <div className="dw-group orphan"><span className="dw-group-main"><i style={{ background: '#B0B8C1' }} /><span><b>그룹 없음(기존 예약 보존)</b><small>예약이 있어 남긴 시간 {orphanN}개 · 복사 대상 아님</small></span></span></div>}
        {!ro && <button className="cu-btn quiet dw-add-group" onClick={() => openGroup()}><VscAdd />새 일정 그룹</button>}
        <p className="cu-subnote">그룹을 고른 뒤 빈 칸을 누르면 그 그룹 색으로 예약 시간을 만들어요.</p>
      </aside>
      <div className="dw-appt-main">
        <div className="dw-grid appt" style={{ ['--rows' as any]: G1 - G0 }}>
          <div className="dw-grid-head"><span />{days.map(d => { const past = d < TODAY; const ds = r.aSlots.filter(s => s.date === d); const avail = ds.reduce((a, s) => a + (s.cap - s.booked), 0); return <div key={d} className={'dw-dh ' + (d === TODAY ? 'today ' : '') + (HOLIDAYS[d] || dowIdx(d) === 6 ? 'hol ' : '') + (past ? 'past' : '')}>
            <b>{DOWS[dowIdx(d)]} {Number(d.slice(8))}</b>{HOLIDAYS[d] && <small>{HOLIDAYS[d]}</small>}<small className="dw-avail">{avail}명 예약 가능</small>
            {ds.length > 0 && !past && !ro && <button className="dw-mini" onClick={() => dayDel(d)}>일 삭제</button>}
          </div>; })}</div>
          <div className="dw-grid-body">
            <div className="dw-hours">{Array.from({ length: G1 - G0 }, (_, i) => <span key={i}>{String(G0 + i).padStart(2, '0')}:00</span>)}</div>
            {days.map(d => <div key={d} className={'dw-col ' + (d < TODAY ? 'past ' : '') + (HOLIDAYS[d] || dowIdx(d) === 6 ? 'hol' : '')}>
              {Array.from({ length: G1 - G0 }, (_, i) => { const h = G0 + i; const chips = r.aSlots.filter(s => s.date === d && Number(s.time.slice(0, 2)) === h).sort((a, b) => a.time.localeCompare(b.time)); return <div key={i} className="dw-cell appt" onClick={e => { if ((e.target as HTMLElement).closest('.dw-chip-slot')) return; openNew(d, h); }} role="button" tabIndex={0} aria-label={`${dotDate(d)} ${h}시 예약 스케줄 등록`} onKeyDown={e => { if ((e.key === 'Enter' || e.key === ' ') && e.target === e.currentTarget) { e.preventDefault(); openNew(d, h); } }}>
                {chips.map(s => { const g = gName(s.groupId); const full = s.booked >= s.cap; return <span key={s.id} className={'dw-chip-slot ' + (full ? 'full ' : '') + (g ? '' : 'orphan')} title={g ? g.name : '그룹 없음(기존 예약 보존)'} style={{ borderColor: g?.color || '#B0B8C1', background: (g?.color || '#B0B8C1') + '33' }}>
                  {s.time}{s.cap > 1 ? ` (${s.booked}/${s.cap})` : ''}{full ? ' (완)' : ''}
                  {!full && d >= TODAY && !ro && <button aria-label={`${s.time} 스케줄 삭제`} onClick={() => delSlot(s)}><VscClose /></button>}
                </span>; })}
              </div>; })}
            </div>)}
          </div>
        </div>
        <p className="cu-subnote">✕를 누르면 확인 없이 바로 삭제돼요(현행과 같음). 예약이 있는 시간은 이동·삭제할 수 없어요. 드래그 이동·부분 삭제·월 달력은 시안에서 생략했어요.</p>
      </div>
      <div className="dw-bottom-bar left"><button className="cu-btn" onClick={back}>이전</button></div>
    </div>

    {form && group && <M title="스케줄 등록" busy={busy} onClose={() => { if (!busy) { setForm(null); setError(''); } }} footer={<><button className="cu-btn" disabled={busy} onClick={() => { setForm(null); setError(''); }}>취소</button><button className="cu-btn primary" disabled={busy || !!aErr} onClick={submitA}>{retryLabel(busy, error, '등록')}</button></>}>
      <p>입력한 시간 동안 설정한 시간마다 예약을 받아요.</p>
      <div className="dw-group-card"><i style={{ background: group.color }} /><b>{group.name}</b><small>{r.appt.advanced ? `스케줄 당 최대 ${group.cap}명` : '기본 설정'}</small></div>
      {(HOLIDAYS[form.date] || dowIdx(form.date) === 6) && <div className="dw-red-box">이날 진료 하시나요?<button className="dw-link" onClick={() => setUtil('holNote')}>자세히 보기</button></div>}
      <div className="dw-form-grid">
        <label className="cu-form-label">날짜<input type="date" aria-label="날짜" min={TODAY} value={form.date} onChange={e => setForm({ ...form, date: e.target.value || form.date, days: [dowIdx(e.target.value || form.date)] })} /></label>
        <div className="cu-form-label">시간<div className="dw-time-row"><select aria-label="시작 시간" value={form.start} onChange={e => setForm({ ...form, start: e.target.value })}>{A_TIMES.map(t => <option key={t}>{t}</option>)}</select>~<select aria-label="종료 시간" value={form.end} onChange={e => setForm({ ...form, end: e.target.value })}>{A_TIMES.map(t => <option key={t}>{t}</option>)}</select></div></div>
      </div>
      <div className="cu-form-label">간격<div className="dw-dow-toggles">{[5, 10, 15, 20, 30, 60].map(m => <button key={m} type="button" className={form.interval === m ? 'on' : ''} aria-pressed={form.interval === m} onClick={() => setForm({ ...form, interval: m })}>{m}분</button>)}</div><small className="dw-muted">간격으로 스케줄 생성 · 종료 시간은 포함하지 않아요.</small></div>
      <div className="cu-form-label">같은 설정을 사용할 요일<div className="dw-dow-toggles">{DOWS.map((w, i) => { const own = i === dowIdx(form.date); const pastDay = addDays(weekStartOf(form.date), i) < TODAY; return <button key={w} type="button" className={form.days.includes(i) ? 'on' : ''} disabled={own || pastDay} aria-pressed={form.days.includes(i)} onClick={() => setForm({ ...form, days: form.days.includes(i) ? form.days.filter(x => x !== i) : [...form.days, i] })}>{w}</button>; })}</div></div>
      {aErr && <p className="dw-field-err dw-block">{aErr}</p>}
      <Err text={error} />
    </M>}
    {gform && <M title={gform.id ? '일정 그룹 수정' : '일정 그룹 등록'} busy={busy} onClose={() => { if (!busy) { setGform(null); setError(''); } }} footer={<>{gform.id && <button className="cu-btn dw-danger-line dw-mr-auto" disabled={busy} onClick={() => setUtil('gDel')}>삭제</button>}<button className="cu-btn" disabled={busy} onClick={() => { setGform(null); setError(''); }}>취소</button><button className="cu-btn primary" disabled={busy} onClick={submitG}>{retryLabel(busy, error, gform.id ? '저장' : '등록')}</button></>}>
      <div className="cu-form-label">그룹 이름 / 색상<div className="dw-time-row"><input className="dw-full" aria-label="일정 그룹 이름" maxLength={20} placeholder="일정 그룹 이름을 입력해 주세요. (최대 20자)" value={gform.name} onChange={e => setGform({ ...gform, name: e.target.value })} /></div>
        <div className="dw-colors">{COLORS.map(c => <button key={c} type="button" aria-label={`색상 ${c}`} aria-pressed={gform.color === c} className={gform.color === c ? 'on' : ''} style={{ background: c }} onClick={() => setGform({ ...gform, color: c })} />)}</div>
        {gTried && gErrs.name && <em className="dw-field-err">{gErrs.name}</em>}</div>
      {r.appt.advanced && <div className="cu-form-label">예약 인원 설정<div className="dw-time-row">스케줄 당 최대 <input type="text" inputMode="numeric" aria-label="스케줄 당 최대 인원" value={gform.cap} onChange={e => setGform({ ...gform, cap: digits(e.target.value, 1, gform.cap) })} /> 명 까지 예약 가능</div>{gTried && gErrs.cap && <em className="dw-field-err">{gErrs.cap}</em>}</div>}
      <div className="cu-form-label">일정 노출 조건
        <div className="dw-radio-inline"><span>당일 예약</span><label><input type="radio" checked={gform.sameDay} onChange={() => setGform({ ...gform, sameDay: true })} />가능</label><label><input type="radio" checked={!gform.sameDay} onChange={() => setGform({ ...gform, sameDay: false })} />불가능</label></div>
        <div className="dw-radio-inline"><span>노출 기간</span><label><input type="radio" checked={gform.rangeMode === 'always'} onChange={() => setGform({ ...gform, rangeMode: 'always' })} />상시</label><label><input type="radio" checked={gform.rangeMode === 'period'} onChange={() => setGform({ ...gform, rangeMode: 'period' })} />특정 기간</label></div>
        {gform.rangeMode === 'always' ? <div className="dw-time-row">오늘부터 <input type="text" inputMode="numeric" aria-label="노출 일수" value={gform.rangeDays} onChange={e => setGform({ ...gform, rangeDays: digits(e.target.value, 2, gform.rangeDays) })} /> 일 동안의 일정을 노출</div>
          : <div className="dw-time-row"><input type="date" aria-label="노출 시작일" value={gform.startDate} onChange={e => setGform({ ...gform, startDate: e.target.value })} />~<input type="date" aria-label="노출 종료일" value={gform.endDate} onChange={e => setGform({ ...gform, endDate: e.target.value })} /></div>}
        <div className="dw-time-row">노출 시각 {gform.rangeMode === 'always' ? '매일' : '시작일'} <select aria-label="노출 시각" value={gform.openTime} onChange={e => setGform({ ...gform, openTime: e.target.value })}>{timeOptions(0, 1380, 60).map(t => <option key={t}>{t}</option>)}</select> 에 일정 공개</div>
        {gTried && gErrs.range && <em className="dw-field-err">{gErrs.range}</em>}
      </div>
      {r.appt.advanced && <div className="cu-form-label">내원목적<select aria-label="내원목적" disabled><option>내원목적 구분 없음</option></select><small className="dw-muted">내원목적별 일정은 시안에서 생략했어요.</small></div>}
      <Err text={error} />
    </M>}
    {util === 'gDel' && gform?.id && <ConfirmModal kit={kit} title="해당 일정 그룹을 삭제하시겠어요?" body={`삭제하면 현재 예약 스케줄에 등록된 ‘${gform.name}’ 스케줄이 삭제되요.`} okLabel="삭제" danger onClose={() => setUtil('')} onOk={async () => { const id = gform.id!; const ok = await commit(() => setA(x => ({ groups: x.groups.filter(g => g.id !== id), aSlots: x.aSlots.filter(s => s.groupId !== id || s.booked > 0).map(s => s.groupId === id ? { ...s, groupId: '', cap: s.booked } : s) })), '일정 그룹을 삭제했어요.'); if (ok) setGform(null); return ok; }} />}
    {util === 'needGroup' && <M title="예약을 받기 위해 일정 그룹 등록이 필요해요" onClose={() => setUtil('')} footer={<><button className="cu-btn" onClick={() => setUtil('')}>취소</button><button className="cu-btn primary" onClick={() => { setUtil(''); openGroup(); }}>등록하기</button></>}><p>등록된 일정 그룹이 없어 예약 스케줄을 등록할 수 없어요. 일정 그룹을 먼저 등록하고 다시 시도해 주세요.</p></M>}
    {(util === 'toAdv' || util === 'toBasic') && <ConfirmModal kit={kit} title={util === 'toAdv' ? '고급 설정으로 전환하시겠어요?' : '기본 설정으로 전환하시겠어요?'} body={util === 'toAdv' ? '고급 설정에서는 여러 개의 일정 그룹과 스케줄 당 예약 인원을 설정할 수 있어요.\n스케줄은 최대 3개월 까지만 미리 설정할 수 있어요.' : '기본 설정으로 전환하면 등록한 모든 스케줄과 일정 그룹이 삭제돼요.\n삭제된 정보는 되돌릴 수 없어요.'} okLabel="전환" danger={util === 'toBasic'} extra={<label className="dw-check dw-ack-in"><input type="checkbox" checked={ack} onChange={() => setAck(!ack)} />안내사항을 모두 확인했으며, 전환에 동의합니다.</label>} onClose={() => setUtil('')} onOk={async () => {
      if (!ack) { kit.fail('안내사항 확인에 체크해 주세요.'); return false; }
      return commit(() => setA(x => util === 'toAdv' ? { appt: { ...x.appt, advanced: true } } : { appt: { ...x.appt, advanced: false }, groups: [], aSlots: x.aSlots.filter(s => s.booked > 0).map(s => ({ ...s, groupId: '', cap: s.booked })) }), util === 'toAdv' ? '고급 설정으로 전환했어요.' : '기본 설정으로 전환했어요.');
    }} />}
    {util === 'copy' && <CopyModal kit={kit} weekStart={weekStart} maxWeeks={maxCopyWeeks} onClose={() => setUtil('')} onApply={(w, hol) => commit(() => setA(x => {
      const src = x.aSlots.filter(s => s.date >= weekStart && s.date <= addDays(weekStart, 6) && x.groups.some(g => g.id === s.groupId));
      const from = addDays(weekStart, 7), to = addDays(weekStart, 7 * w + 6);
      const keep = x.aSlots.filter(s => s.date < from || s.date > to || s.booked > 0 || (!hol && !!HOLIDAYS[s.date]));
      const add: ASlot[] = [];
      for (let i = 1; i <= w; i++) src.forEach(s => { const d = addDays(s.date, 7 * i); if (!hol && HOLIDAYS[d]) return; if (keep.some(k => k.date === d && k.time === s.time)) return; add.push({ ...s, id: uid('A'), date: d, booked: 0 }); });
      return { aSlots: [...keep, ...add] };
    }), '스케줄을 붙여넣었어요.')} />}
    {util === 'weekDel' && <ConfirmModal kit={kit} title="해당 주간 스케줄을 모두 삭제하시겠어요?" body="삭제하면 되돌릴 수 없으니 유의해 주세요." okLabel="삭제" danger onClose={() => setUtil('')} onOk={() => delWhereA(s => s.date >= weekStart && s.date <= addDays(weekStart, 6), '주간 스케줄을 삭제했어요.')} />}
    {util === 'holDel' && <HolidayDeleteModal kit={kit} dates={holWithSlots} onClose={() => setUtil('')} onApply={sel2 => delWhereA(s => sel2.includes(s.date), '선택한 공휴일 스케줄을 삭제했어요.')} />}
    {kakaoBlock && <M title="카카오톡 예약하기와 연동된 진료실이에요" onClose={() => setKakaoBlock(false)} footer={<button className="cu-btn primary" onClick={() => setKakaoBlock(false)}>확인</button>}>
      <p className="dw-pre">{'카카오톡 예약하기와 연동하려면 기본 설정이어야 해요.\n고급 설정으로 전환하려면 먼저 진료실 상세에서 카카오톡 예약하기 연동을 해지해 주세요.'}</p>
    </M>}
    {util === 'holNote' && <HolidayNoteModal kit={kit} onClose={() => setUtil('')} />}
  </>;
}

/* ═════════════ 진료실 운영 설정 (/operation) ═════════════ */
type Op = {
  priority: 1 | 0; addressUsed: boolean; addrInput: 1 | 2; addr2: boolean; addrSkip: boolean; visitPathUsed: boolean; onlyReturned: boolean;
  deptDup: boolean; viewDept: boolean; viewDoctor: boolean; turnAlarm: boolean; holdStatus: boolean;
};
export const OP0: Op = { priority: 1, addressUsed: false, addrInput: 1, addr2: true, addrSkip: true, visitPathUsed: true, onlyReturned: false, deptDup: false, viewDept: true, viewDoctor: true, turnAlarm: true, holdStatus: false };
export type AutoRow = { on: boolean; per: string[]; gap: string[]; kept?: { per: string[]; gap: string[] } };
/* 렌더마다 새로 만들면 행이 다시 마운트돼 포커스가 사라지므로 모듈 레벨에 둔다 */
const Row = ({ title, sub, children, hold, off }: { title: string; sub: string; children: React.ReactNode; hold?: React.ReactNode; off?: boolean }) => <div className={'cu-setting-row dw-op-row ' + (off ? 'dw-off' : '')}><div><strong>{title}{hold}</strong><p>{sub}</p></div><div className="dw-row-ctl">{children}</div></div>;
const Tg = ({ v, onChange, label, disabled }: { v: boolean; onChange: () => void; label: string; disabled?: boolean }) => <button className={'cu-toggle ' + (v ? 'on' : '')} aria-label={label} aria-pressed={v} disabled={disabled} onClick={onChange}><span /></button>;
/** 운영 설정 저장값은 상위(index)에서 보관해 메뉴를 오가도 유지되고 '처음 상태로'로 함께 초기화된다 */
export type OpStore = { saved: Op; setSaved: (o: Op) => void; paths: string[]; setPaths: (p: string[]) => void; autoSaved: Record<string, AutoRow>; setAutoSaved: (a: Record<string, AutoRow>) => void };
export const VISIT_PATHS_DEFAULT = ['지인 소개', '인터넷 검색', '굿닥 앱', '블로그/카페', '간판/지나가다', '기타'];
export function OperationPage({ kit, rooms, smart, onOpenRoom, banner, store }: { kit: Kit; rooms: Room[]; smart: boolean; onOpenRoom: (id: string) => void; banner: React.ReactNode; store: OpStore }) {
  const unl = kit.mode === 'unlinked', noQueue = unl;
  const noRoom = rooms.length === 0;
  const noRoomHint = <small className="dw-noroom-hint">진료실이 없어 설정할 수 없어요. 진료실을 만들면 설정할 수 있어요.</small>;
  const M = kit.Modal;
  const { saved, setSaved, paths, setPaths, autoSaved, setAutoSaved } = store;
  const [form, setForm] = useState<Op>(saved); // 저장 전 편집값(메뉴를 떠나면 버려짐 — 현행과 같음)
  const [modal, setModal] = useState<'' | 'leave' | 'path' | 'auto' | 'autoLeave'>('');
  const [pathDraft, setPathDraft] = useState<string[]>([]), [pathInput, setPathInput] = useState(''), [pathErr, setPathErr] = useState('');
  const [priOpen, setPriOpen] = useState(false);
  const sorted = useMemo(() => [...rooms].sort((a, b) => a.sortIndex - b.sortIndex), [rooms]);
  const mk = (): Record<string, AutoRow> => Object.fromEntries(sorted.map(r => [r.id, { on: false, per: Array(7).fill(''), gap: Array(7).fill('') }]));
  const [auto, setAuto] = useState<Record<string, AutoRow>>({}), [bulk, setBulk] = useState({ per: '5', gap: '5' });
  const { busy, error, setError, run } = useRun(kit);
  const dirty = JSON.stringify(form) !== JSON.stringify(saved);
  const set = (p: Partial<Op>) => setForm(f => ({ ...f, ...p }));
  /** 모드·스마트접수가 바뀌어 숨겨지거나 잠기는 항목은 저장하지 않은 편집분을 저장값으로 되돌린다(화면에 남은 항목의 편집분은 유지) */
  const hideKeys = (u: boolean, sm: boolean): (keyof Op)[] => [...(u ? ['priority', 'addressUsed', 'addrInput', 'addr2', 'addrSkip', 'visitPathUsed', 'onlyReturned', 'turnAlarm'] as (keyof Op)[] : []), ...(!sm ? ['holdStatus'] as (keyof Op)[] : [])];
  const prevGate = useRef({ u: unl, sm: smart });
  useEffect(() => {
    const p = prevGate.current; prevGate.current = { u: unl, sm: smart };
    if (p.u === unl && p.sm === smart) return;
    const before = new Set(hideKeys(p.u, p.sm)), keys = hideKeys(unl, smart).filter(k => !before.has(k) && form[k] !== saved[k]);
    if (!keys.length) return;
    setForm(f => { const n = { ...f }; keys.forEach(k => { (n as any)[k] = saved[k]; }); return n; });
    kit.notify('숨겨진 항목의 저장하지 않은 변경은 취소했어요.');
  }, [unl, smart]);
  useEffect(() => {
    if (!priOpen) return;
    const h = (e: MouseEvent) => { if (!(e.target as HTMLElement).closest('.dw-pop-wrap')) setPriOpen(false); };
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); setPriOpen(false); document.querySelector<HTMLElement>('[data-pop="pri"]')?.focus(); } };
    document.addEventListener('mousedown', h); document.addEventListener('keydown', k);
    return () => { document.removeEventListener('mousedown', h); document.removeEventListener('keydown', k); };
  }, [priOpen]);


  const pathValid = pathDraft.length >= 2 && pathDraft.every(p => p.trim());
  const apptRooms = sorted.filter(r => r.appt.accepted);
  const autoDirty = JSON.stringify(auto) !== JSON.stringify(autoSaved);
  const clampMin = (v: string, prev: string) => { const n = Number(v); if (!v || n === 0) return prev || '5'; return String(Math.min(60, n)); };

  return <>
    <header className="cn-header cu-header"><div><h1 className="cn-title" tabIndex={-1}>진료실 운영 설정</h1><p className="cn-desc">모든 진료실에 동일하게 적용되는 설정이에요.</p></div></header>
    {banner}
    <div className="cu-content">
      <div className="cu-settings-page dw-op">
        {noRoom && <p className="cu-inline-note dw-note"><VscInfo />진료실이 없어 진료실 단위 항목({smart ? '진료실 정보 표시·예약 시간 맞춤 자동 접수' : '진료실 정보 표시'})은 설정할 수 없어요. 나머지 항목은 병원 전체에 적용돼요.</p>}
        <h2 className="dw-op-sec">공통</h2>
        <h3 className="dw-op-sub">태블릿 접수<kit.Pin n={18} /></h3>
        {unl && <p className="cu-inline-note dw-note"><VscInfo /><span>EMR 연동 병원에서 태블릿 접수에 사용돼요. 비연동 병원은 태블릿 접수를 받을 수 없어 아래 3개 항목을 바꿀 수 없어요.<kit.Pin n={19} /></span></p>}
        <div className={unl ? 'dw-off-group' : ''}>
        <Row title="환자 조회 방식 선택" sub="환자 조회 시 차트에서 사용하는 정보를 선택해 주세요.">
          <div className="dw-pop-wrap"><button className="dw-select" data-pop="pri" disabled={unl} aria-haspopup="listbox" aria-expanded={priOpen} onClick={() => setPriOpen(!priOpen)}>{unl ? '해당 없음' : form.priority === 1 ? '휴대폰번호' : '주민등록번호'}<VscChevronDown /></button>
            {priOpen && <div className="dw-pop dw-pop-right" role="listbox">{([[1, '휴대폰번호'], [0, '주민등록번호']] as const).map(([v, l]) => <button key={v} role="option" aria-selected={form.priority === v} className={'dw-pop-opt ' + (form.priority === v ? 'sel' : '')} onClick={() => { set({ priority: v }); setPriOpen(false); }}>{l}{form.priority === v && <VscCheck />}</button>)}</div>}
          </div>
        </Row>
        <div className="cu-setting-row dw-op-row dw-col-row">
          <div className="dw-op-head"><div><strong>주소 정보 받기</strong><p>환자의 주소 정보를 받을 수 있어요.</p></div> {unl && <span className="dw-muted">해당 없음</span>}<Tg v={unl ? false : form.addressUsed} disabled={unl} label="주소 정보 받기" onChange={() => set({ addressUsed: !form.addressUsed })} /></div>
          {form.addressUsed && !unl && <div className="dw-addr">
            {([['입력방식', 'addrInput', [[1, '선택형'], [2, '검색형']], form.addrInput === 1 ? '우편번호가 필요 없는 차트에 적합해요.' : '우편번호가 필요한 차트에 적합해요.'],
              ['주소유형', 'addr2', [[true, '상세주소'], [false, '간략주소']], form.addr2 ? '동, 층, 호 등 상세 주소까지 받아요.' : '동, 층, 호 등 상세 주소를 받지 않아요.'],
              ['건너뛰기', 'addrSkip', [[true, '허용함'], [false, '허용안함']], form.addrSkip ? '주소 정보를 필수로 받지 않아요.' : '주소 정보를 필수로 받아요.']] as [string, keyof Op, [any, string][], string][]).map(([l, key, opts, hint]) => <label key={l} className="dw-addr-item"><span>{l}</span>
              <select aria-label={l} value={String(form[key])} onChange={e => { const raw = e.target.value; set({ [key]: raw === 'true' ? true : raw === 'false' ? false : Number(raw) } as any); }}>{opts.map(([v, t]) => <option key={String(v)} value={String(v)}>{t}</option>)}</select><small>{hint}</small></label>)}
          </div>}
        </div>
        <Row title="내원경로 받기" sub="처음 접수하는 환자에게 내원경로를 받을 수 있습니다.">{form.visitPathUsed && !unl && <button className="cu-btn" onClick={() => { setError(''); setPathDraft(paths); setPathInput(''); setPathErr(''); setModal('path'); }}>설정</button>}{unl && <span className="dw-muted">해당 없음</span>}<Tg v={unl ? false : form.visitPathUsed} disabled={unl} label="내원경로 받기" onChange={() => set({ visitPathUsed: !form.visitPathUsed })} /></Row>
        </div>
        <h3 className="dw-op-sub">접수·예약 공통</h3>
        <Row title="재진 환자만 접수 받기" sub={unl ? '차트 환자번호가 없어 켜면 모든 예약이 거절돼요. 비연동 병원은 끈 상태로 고정돼요.' : '신환 접수를 데스크에서 직접 받아야 할 때 선택해 주세요.'} off={unl} hold={unl ? <kit.Pin n={21} /> : undefined}>{unl && <span className="dw-warn-chip">비연동 · 끔 고정</span>}<Tg v={unl ? false : form.onlyReturned} disabled={unl} label="재진 환자만 접수 받기" onChange={() => set({ onlyReturned: !form.onlyReturned })} /></Row>
        {<Row title="진료과 중복 접수 · 예약 받기" sub="같은 날짜에 동일한 진료과로 이미 접수 또는 예약되어 있어도 추가로 신청할 수 있어요. 기본값은 허용 안 함이에요." hold={<kit.Pin n={20} />}><span className="dw-muted">{form.deptDup ? '허용' : '허용 안 함'}</span><Tg v={form.deptDup} label="진료과 중복 접수 · 예약 받기" onChange={() => set({ deptDup: !form.deptDup })} /></Row>}
        <h3 className="dw-op-sub">앱 노출</h3>
        <Row title="진료실 정보 표시" sub="굿닥 서비스에서 환자들에게 보여줄 정보를 선택해 주세요.">{noRoom && noRoomHint}<label className="dw-check"><input type="checkbox" disabled={noRoom} checked={form.viewDept} onChange={() => set({ viewDept: !form.viewDept })} />진료과명</label><label className="dw-check"><input type="checkbox" disabled={noRoom} checked={form.viewDoctor} onChange={() => set({ viewDoctor: !form.viewDoctor })} />의사명</label></Row>
        <Row title="진료 차례 알림 발송하기" sub={noQueue ? 'EMR 대기 순번이 있어야 보낼 수 있어요.' : '차트에서 진료 차례가 된 환자들에게 안내 알림을 발송할 수 있습니다.'} off={noQueue}><Tg v={noQueue ? false : form.turnAlarm} disabled={noQueue} label="진료 차례 알림 발송하기" onChange={() => set({ turnAlarm: !form.turnAlarm })} /></Row>
        {smart && <>
          <h2 className="dw-op-sec">예약</h2>
          <Row title="예약 시간 맞춤 자동 접수" sub="예약 환자가 예약 시간에 맞춰 진료받도록, 대기 현황에 따라 알맞은 순서에 자동으로 접수합니다.">{noRoom && noRoomHint}<button className="cu-btn" disabled={noRoom} onClick={() => { if (!sorted.length) { kit.fail('자동 접수를 설정할 진료실이 없어요.'); return; } setError(''); setAuto(JSON.parse(JSON.stringify({ ...mk(), ...autoSaved }))); setModal('auto'); }}>설정</button></Row>
          <Row title="보류 상태로 접수 받기" sub="자동 접수된 예약이 '예약' 대신 '보류' 상태로 접수됩니다."><Tg v={form.holdStatus} label="보류 상태로 접수 받기" onChange={() => set({ holdStatus: !form.holdStatus })} /></Row>
        </>}
        <Err text={modal === '' ? error : ''} />
        <div className="dw-bottom-bar sticky"><span className="cu-subnote">{dirty ? '저장하지 않은 변경이 있어요.' : '변경 사항 없음'}</span><button className="cu-btn" disabled={busy} onClick={() => dirty ? setModal('leave') : kit.notify('변경 사항이 없어요.')}>취소</button><button className="cu-btn primary" disabled={!dirty || busy} onClick={() => run(() => setSaved(form), '운영 설정을 저장했어요.')}>{retryLabel(busy, modal === '' ? error : '', '저장')}</button></div>
      </div>
    </div>

    {modal === 'leave' && <M title="운영 설정을 중단하시겠어요?" onClose={() => setModal('')} footer={<><button className="cu-btn" onClick={() => setModal('')}>취소</button><button className="cu-btn danger" onClick={() => { setForm(saved); setError(''); setModal(''); kit.notify('변경한 내용을 되돌렸어요.'); }}>무시하고 중단하기</button></>}><p>중단하면 지금까지 변경한 정보가 저장되지 않아요.</p></M>}
    {modal === 'path' && <M title="항목 설정" busy={busy} onClose={() => { if (!busy) { setModal(''); setError(''); } }} footer={<><button className="cu-btn" disabled={busy} onClick={() => { setModal(''); setError(''); }}>취소</button><button className="cu-btn primary" disabled={busy || !pathValid} onClick={() => run(() => setPaths(pathDraft.map(p => p.trim())), '내원경로 항목이 저장되었습니다.', () => setModal(''))}>{retryLabel(busy, error, '확인')}</button></>}>
      <p>환자가 선택할 내원경로 항목을 추가해주세요.</p>
      <div className="dw-time-row"><input className="dw-full" aria-label="내원경로 항목 입력" maxLength={12} placeholder="항목을 입력해주세요. (최대 12자)" value={pathInput} onChange={e => setPathInput(e.target.value)} /><button className="cu-btn" onClick={() => { if (!pathInput.trim()) { setPathErr('내원경로는 1자~12자 이내로 작성해주세요.'); return; } setPathDraft(d => [pathInput.trim(), ...d]); setPathInput(''); setPathErr(''); }}>추가</button></div>
      {pathErr && <em className="dw-field-err dw-block">{pathErr}</em>}
      <div className="dw-path-head"><b>내원경로 항목</b><span>{pathDraft.length}/12</span></div>
      {pathDraft.length < 2 && <p className="dw-red">최소 2개 이상의 내원경로를 입력해주세요.</p>}
      {pathDraft.length === 0 ? <p className="cu-subnote">항목을 추가해보세요.</p> : <ul className="dw-path-list">{pathDraft.map((p, i) => <li key={i}>
        <span className="dw-order-btns"><button className="cu-icon" aria-label={`${p} 위로`} disabled={i === 0} onClick={() => setPathDraft(d => { const n = [...d]; [n[i - 1], n[i]] = [n[i], n[i - 1]]; return n; })}><VscArrowUp /></button><button className="cu-icon" aria-label={`${p} 아래로`} disabled={i === pathDraft.length - 1} onClick={() => setPathDraft(d => { const n = [...d]; [n[i + 1], n[i]] = [n[i], n[i + 1]]; return n; })}><VscArrowDown /></button></span>
        <input aria-label={`내원경로 ${i + 1}`} maxLength={12} value={p} onChange={e => setPathDraft(d => d.map((x, j) => j === i ? e.target.value : x))} />
        <button className="cu-icon" aria-label={`${p} 삭제`} onClick={() => setPathDraft(d => d.filter((_, j) => j !== i))}><VscTrash /></button>
        {!p.trim() && <em className="dw-field-err dw-block">최소 1자 이상 입력해 주세요.</em>}
      </li>)}</ul>}
      <p className="cu-subnote">현행은 드래그로 순서를 바꿔요. 시안에서는 위·아래 버튼으로 대신해요.</p><Err text={error} />
    </M>}
    {modal === 'auto' && <M title="진료실별 자동 접수 설정" wide className="dw-auto-modal" busy={busy} onClose={() => { if (!busy) { setError(''); autoDirty ? setModal('autoLeave') : setModal(''); } }} footer={<><button className="cu-btn" disabled={busy} onClick={() => { setError(''); autoDirty ? setModal('autoLeave') : setModal(''); }}>취소</button><button className="cu-btn primary" disabled={busy} onClick={() => run(() => setAutoSaved(Object.fromEntries(Object.entries(auto).map(([k, v]) => [k, { ...v, per: v.per.map(x => x || '5'), gap: v.gap.map(x => x || '5') }]))), '진료실별 자동 접수 설정을 저장했어요.', () => setModal(''))}>{retryLabel(busy, error, '저장')}</button></>}>
      <p className="cu-subnote dw-mt0">여러 개의 일정 그룹 생성 등 보다 상세한 예약 스케줄 관리를 위해 고급 설정으로 전환할 수 있습니다.</p>
      <div className="dw-bulk"><b>일괄 입력</b><label>진료당(분)<input type="text" inputMode="numeric" value={bulk.per} onChange={e => setBulk({ ...bulk, per: digits(e.target.value, 2, bulk.per) })} onBlur={() => setBulk(b => ({ ...b, per: clampMin(b.per, '5') }))} /></label><label>인터벌(분)<input type="text" inputMode="numeric" value={bulk.gap} onChange={e => setBulk({ ...bulk, gap: digits(e.target.value, 2, bulk.gap) })} onBlur={() => setBulk(b => ({ ...b, gap: clampMin(b.gap, '5') }))} /></label>
        <button className="cu-btn" onClick={() => setAuto(a => Object.fromEntries(Object.entries(a).map(([id, v]) => [id, apptRooms.some(r => r.id === id) && v.on ? { ...v, per: Array(7).fill(bulk.per), gap: Array(7).fill(bulk.gap) } : v])))}>모든 진료실·요일에 적용</button></div>
      <div className="dw-auto-table-wrap"><table className="dw-auto-table"><thead><tr><th>진료실명</th><th>항목</th>{DOWS.map(d => <th key={d}>{d}</th>)}<th>사용</th></tr></thead><tbody>
        {sorted.map(r => { const v = auto[r.id] || { on: false, per: Array(7).fill(''), gap: Array(7).fill('') }; const name = r.alias || r.name;
          if (!r.appt.accepted) return <tr key={r.id} className="off"><td className="dw-auto-name">{name}</td><td colSpan={9}><b>예약이 비활성화된 진료실이에요.</b> 자동 접수를 설정하려면 먼저 진료실 설정에서 예약을 활성화해 주세요. <button className="dw-link" onClick={() => { if (autoDirty) { setModal('autoLeave'); return; } setModal(''); onOpenRoom(r.id); }}>진료실 설정으로 이동</button></td></tr>;
          const setV = (p: Partial<AutoRow>) => setAuto(a => ({ ...a, [r.id]: { ...v, ...p } }));
          return ['per', 'gap'].map((f, fi) => <tr key={r.id + f}>
            {fi === 0 && <td rowSpan={2} className="dw-auto-name">{name}</td>}
            <td>{f === 'per' ? '진료당(분)' : '인터벌(분)'}</td>
            {DOWS.map((_, di) => <td key={di}><input type="text" inputMode="numeric" aria-label={`${name} ${DOWS[di]} ${f === 'per' ? '진료당' : '인터벌'}`} disabled={!v.on} value={(v as any)[f][di]} onChange={e => { const arr = [...(v as any)[f]]; arr[di] = digits(e.target.value, 2, arr[di]); setV({ [f]: arr } as any); }} onBlur={e => { const arr = [...(v as any)[f]]; arr[di] = clampMin(e.target.value, (autoSaved[r.id] as any)?.[f]?.[di] || '5'); setV({ [f]: arr } as any); }} /></td>)}
            {fi === 0 && <td rowSpan={2}><Tg v={v.on} label={`${name} 자동 접수 사용`} onChange={() => setV(v.on ? { on: false, kept: { per: v.per, gap: v.gap } } : { on: true, per: v.kept?.per || v.per.map(x => x || '5'), gap: v.kept?.gap || v.gap.map(x => x || '5') })} /></td>}
          </tr>); })}
      </tbody></table></div>
      <p className="cu-subnote">분 입력은 1~60, 비우거나 0이면 직전 값(없으면 5), 60을 넘으면 60으로 바뀌어요.</p><Err text={error} />
    </M>}
    {modal === 'autoLeave' && <M title="자동 접수 설정을 중단하시겠어요?" onClose={() => setModal('auto')} footer={<><button className="cu-btn" onClick={() => setModal('auto')}>취소</button><button className="cu-btn danger" onClick={() => { setAuto({}); setModal(''); }}>무시하고 중단하기</button></>}><p>중단하면 지금까지 변경한 정보가 저장되지 않아요.</p></M>}
  </>;
}
