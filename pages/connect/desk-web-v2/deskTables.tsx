/**
 * desk-web-v2 — 접수 현황(진료실별 테이블) · 예약 현황(통합 테이블) · 우측 패널(상세·등록·열 편집) · Info Bar · 지난 내역 접수 탭(목록·상세).
 * 접수 현황의 시각·고정 카피는 figma/desk-receipt-table.md(데스크 4.1 접수 정보 테이블)를 따른다.
 * 폼·패널 라벨은 데스크 현행 문구를 옮겼다. 결정 태그·변경 이력은 index.page.tsx 헤더에 둔다.
 * 연동 진료실(Room.chartLink)·진료항목 예약은 조회만, 비연동 진료실만 웹에서 처리한다.
 */
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { VscChromeClose, VscChevronDown, VscCopy, VscGripper, VscPassFilled, VscSearch, VscSettingsGear, VscTriangleDown, VscTriangleUp } from 'react-icons/vsc';
import { Room, TODAY, NOW, chartRoomOf, LinkChip } from './examRooms';

/* ───────── 타입 ───────── */
export type Kind = '진료실 예약' | '진료항목 예약';
export type State = '확정 필요' | '예약확정' | '내원확정' | '진료완료' | '병원취소' | '환자취소' | '자동 종료';
export type Patient = { name: string; gender: string; age: number | null; rrn: string; phone: string; addr: string; addr2: string; pmemo: string; path: string; cInfo: boolean; cAd: boolean };
export type Rec = Patient & {
  id: string; kind: Kind; birth: string; date: string; time: string; created: string;
  room: string; item: string; price: string; purpose: string; etc: string; memo: string; state: State; reason?: string; closed?: string; channel: string;
};
/** 접수 건. turn = 진료 차례 행(C07), 나머지는 대기 순번(order). done이면 테이블에서 빠진다 */
export type Rcp = Patient & {
  id: string; date: string; roomId: string; zip: string; ptype: string; channel: '현장' | '원격'; visit: boolean;
  purpose: string; etc: string; memo: string; created: string; turn: boolean; order: number; done?: '진료완료' | '접수취소';
};
export const ACTIVE: State[] = ['확정 필요', '예약확정', '내원확정'];
export const TIMES = Array.from({ length: 18 }, (_, i) => `${String(9 + Math.floor(i / 2)).padStart(2, '0')}:${i % 2 ? '30' : '00'}`);

type ModalT = (p: { title: React.ReactNode; children: React.ReactNode; footer?: React.ReactNode; onClose: () => void; wide?: boolean; busy?: boolean; className?: string }) => JSX.Element;
export type TKit = {
  Modal: ModalT; Pin: (p: { n: number }) => JSX.Element | null;
  /** 저장 실패 체험이면 실패 토스트만 띄우고 false. 성공 시 별도 토스트 없이 반영(데스크·피그마: 성공 피드백은 Info Bar 또는 없음) */
  silent: (apply: () => void, what: string) => boolean;
  rooms: Room[]; linked: boolean; paths: string[];
  onCreateRoom: () => void;
};

/* ───────── 유틸 ───────── */
const ampm = (hm: string) => { const h = Number(hm.slice(0, 2)); return `${h < 12 ? '오전' : '오후'} ${h % 12 || 12}:${hm.slice(3, 5)}${hm.length > 5 ? hm.slice(5) : ''}`; };
/** 'YYYY-MM-DD HH:MM:SS' → 'YYYY-MM-DD 오전 9:31:25'(피그마 접수 생성일 형식) */
export const fmtDT = (s: string) => s.length > 10 ? `${s.slice(0, 10)} ${ampm(s.slice(11))}` : s;
const ell = (s: string, n = 10) => (s.length > n ? s.slice(0, n) + '...' : s);
const isLinkedRoom = (kit: TKit, r?: Room) => !!r && kit.linked && !!r.chartLink;
const digitsOnly = (v: string) => v.replace(/\D/g, '');
/** 주민번호로 성별·만 나이 계산(가상 데이터용) */
const fromRrn = (f: string, b: string) => {
  const g = b[0]; const gender = g === '1' || g === '3' ? '남' : g === '2' || g === '4' ? '여' : '—';
  if (f.length < 6) return { gender, age: null };
  const year = (g === '3' || g === '4' ? 2000 : 1900) + Number(f.slice(0, 2));
  const age = 2026 - year - (f.slice(2, 6) > TODAY.slice(5).replace('-', '') ? 1 : 0);
  return { gender, age };
};
const keyOf = (p: { name: string; phone: string }) => `${p.name}|${p.phone}`;

/** Info Bar(피그마 Single Line · Success): 본문 우상단, 3.5초 뒤 자동 닫힘 */
type Bar = { title: string; body: string } | null;
function InfoBar({ bar, onClose, Pin }: { bar: Bar; onClose: () => void; Pin: TKit['Pin'] }) {
  useEffect(() => { if (!bar) return; const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [bar]);
  if (!bar) return null;
  return <div className="dw2-infobar" role="status"><VscPassFilled className="dw2-infobar-ic" /><div><b>{bar.title}</b><span>{bar.body}</span></div><Pin n={8} /><button aria-label="닫기" onClick={onClose}><VscChromeClose /></button></div>;
}

/** 셀 hover 복사(피그마 클립보드 버튼): 행 hover 때만 보이고, 누르면 '복사했습니다' 1.5초 */
function Copy({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  useEffect(() => { if (!done) return; const t = setTimeout(() => setDone(false), 1500); return () => clearTimeout(t); }, [done]);
  return <span className={'dw2-copy-wrap ' + (done ? 'done' : '')} onClick={e => e.stopPropagation()}>
    <button type="button" className="dw2-copy" aria-label={`${text} 복사하기`} onClick={() => { try { void navigator.clipboard?.writeText(text); } catch { /* 체험 환경에서 막혀도 동작 표시 */ } setDone(true); }}><VscCopy /></button>
    <span className="dw2-tip" role={done ? 'status' : undefined}>{done ? '복사했습니다' : '복사하기'}</span>
  </span>;
}

/** 화면 경계 안에 고정 배치되는 컨텍스트 메뉴(우클릭 위치 기준) */
function CtxMenu({ x, y, items, onClose }: { x: number; y: number; items: [string, () => void][]; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ left: x, top: y });
  useLayoutEffect(() => { const el = ref.current; if (!el) return; const w = el.offsetWidth, h = el.offsetHeight; setPos({ left: Math.min(x, window.innerWidth - w - 8), top: y + h > window.innerHeight - 8 ? y - h : y }); el.querySelector<HTMLElement>('button')?.focus(); }, [x, y]);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) onClose(); };
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); onClose(); } };
    document.addEventListener('mousedown', h); document.addEventListener('keydown', k, true); window.addEventListener('scroll', onClose, true); window.addEventListener('resize', onClose);
    return () => { document.removeEventListener('mousedown', h); document.removeEventListener('keydown', k, true); window.removeEventListener('scroll', onClose, true); window.removeEventListener('resize', onClose); };
  }, []);
  return <div ref={ref} className="dw2-ctx" role="menu" style={{ left: pos.left, top: pos.top }}>{items.map(([l, fn]) => <button key={l} role="menuitem" onClick={() => { onClose(); fn(); }}>{l}</button>)}</div>;
}

/** 드롭다운(피그마 196×32, 항목 최대 10자 + 말줄임). header 항목은 그룹 제목 */
type DdItem = { value: string; label: string; n?: number; header?: boolean };
function Dropdown({ items, value, onChange, label, Pin, pin }: { items: DdItem[]; value: string; onChange: (v: string) => void; label: string; Pin?: TKit['Pin']; pin?: number }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); setOpen(false); ref.current?.querySelector<HTMLElement>('.dw2-dd-btn')?.focus(); } };
    document.addEventListener('mousedown', h); document.addEventListener('keydown', k, true);
    return () => { document.removeEventListener('mousedown', h); document.removeEventListener('keydown', k, true); };
  }, [open]);
  const cur = items.find(i => i.value === value && !i.header) || items[0];
  const text = (i: DdItem) => `${ell(i.label)}${i.n != null ? ` (${i.n})` : ''}`;
  return <div className="dw2-dd" ref={ref}>
    <button type="button" className={'dw2-dd-btn ' + (open ? 'open' : '')} aria-label={label} aria-haspopup="listbox" aria-expanded={open} title={cur.label} onClick={() => setOpen(!open)}><span>{text(cur)}</span><VscChevronDown /></button>
    {Pin && pin && <Pin n={pin} />}
    {open && <div className="dw2-dd-pop" role="listbox" aria-label={label}>{items.map((i, idx) => i.header
      ? <div key={'h' + idx} className="dw2-dd-head">{i.label}</div>
      : <button key={i.value} role="option" aria-selected={i.value === value} className={i.value === value ? 'sel' : ''} title={i.label} onClick={() => { onChange(i.value); setOpen(false); }}>{text(i)}</button>)}</div>}
  </div>;
}

/** 검색창(피그마 292×32) + 제안 플라이아웃. 신환 항목 + (예약만) 기존 환자 */
function SearchBox({ placeholder, newLabel, patients, onNew, onPick, Pin, pin }: { placeholder: string; newLabel: string; patients?: Patient[]; onNew: (q: string) => void; onPick?: (p: Patient) => void; Pin: TKit['Pin']; pin?: number }) {
  const [q, setQ] = useState(''), [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { const h = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); }; document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h); }, []);
  const qq = q.trim(), qd = digitsOnly(qq);
  const hits = qq && patients ? patients.filter(p => p.name.includes(qq) || (qd.length >= 2 && digitsOnly(p.phone).includes(qd))).slice(0, 4) : [];
  const pickNew = () => { onNew(qq); setQ(''); setOpen(false); };
  return <div className="dw2-search" ref={ref}>
    <VscSearch />
    <input aria-label={placeholder} placeholder={placeholder} value={q} onChange={e => { setQ(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} onKeyDown={e => { if (e.key === 'Enter' && qq) pickNew(); if (e.key === 'Escape') setOpen(false); }} />
    {Pin && pin && <Pin n={pin} />}
    {open && qq && <div className="dw2-search-pop" role="listbox">
      {hits.map(p => <button key={keyOf(p)} role="option" className="dw2-search-pt" onClick={() => { onPick?.(p); setQ(''); setOpen(false); }}><b>{p.name}</b><small>{p.gender} · {p.age ?? '—'}세 · {p.phone}</small></button>)}
      <button role="option" className="dw2-search-new" onClick={pickNew}>‘{qq}’ {newLabel}</button>
    </div>}
  </div>;
}

/* ───────── 환자·진료 정보 폼(신환/구환 접수·예약, 환자 정보 수정) ───────── */
type PForm = { name: string; rrn1: string; rrn2: string; phone: string; addr: string; addr2: string; pmemo: string; path: string; cInfo: boolean; cAd: boolean; visit: boolean; roomId: string; date: string; time: string; purpose: string; etc: string; memo: string };
const emptyForm = (name = ''): PForm => ({ name, rrn1: '', rrn2: '', phone: '', addr: '', addr2: '', pmemo: '', path: '', cInfo: false, cAd: false, visit: false, roomId: '', date: TODAY, time: '', purpose: '', etc: '', memo: '' });
const formOf = (p: Patient, extra: Partial<PForm> = {}): PForm => ({ ...emptyForm(p.name), rrn1: p.rrn.slice(0, 6), rrn2: p.rrn.slice(7), phone: p.phone, addr: p.addr, addr2: p.addr2, pmemo: p.pmemo, path: p.path, cInfo: p.cInfo, cAd: p.cAd, ...extra });
const patientOf = (f: PForm): Patient => ({ name: f.name.trim(), ...fromRrn(f.rrn1, f.rrn2), rrn: `${f.rrn1}-${f.rrn2}`, phone: f.phone.trim(), addr: f.addr.trim(), addr2: f.addr2.trim(), pmemo: f.pmemo.trim(), path: f.path, cInfo: f.cInfo, cAd: f.cAd });

function PatientFormPane({ mode, title, init, rooms, paths, onClose, onSubmit, submitLabel }: {
  mode: 'rcp' | 'appt' | 'patient'; title: string; init: PForm; rooms: Room[]; paths: string[]; onClose: () => void; onSubmit: (f: PForm) => string | void; submitLabel: string;
}) {
  const [f, setF] = useState<PForm>(init), [tried, setTried] = useState(false), [err, setErr] = useState('');
  const set = (p: Partial<PForm>) => { setF(o => ({ ...o, ...p })); setErr(''); };
  // rrn1·rrn2는 저장값에 마스킹(*)이 섞여 있을 수 있어 길이만 본다
  const e = {
    name: !f.name.trim() && '이름을 입력해 주세요.',
    rrn: (f.rrn1.length !== 6 || f.rrn2.length !== 7) && '주민번호 13자리를 입력해 주세요.',
    phone: digitsOnly(f.phone).length < 10 && !/\*{4}-\d{4}$/.test(f.phone) && '휴대전화번호를 10자리 이상 입력해 주세요.',
    room: mode !== 'patient' && !f.roomId && '진료실을 선택해 주세요.',
    date: mode === 'appt' && (!f.date ? '예약일자를 선택해 주세요.' : f.date < TODAY ? '오늘 이후 날짜를 선택해 주세요.' : ''),
    time: mode === 'appt' && (!f.time ? '예약시간을 선택해 주세요.' : f.date === TODAY && f.time <= NOW ? `이미 지난 시간이에요. 현재(${NOW}) 이후 시간을 선택해 주세요.` : '')
  };
  const ok = !Object.values(e).some(Boolean);
  const E = ({ k }: { k: keyof typeof e }) => tried && e[k] ? <em className="dw-field-err">{e[k]}</em> : null;
  const submit = () => { setTried(true); if (!ok) return; const m = onSubmit(f); if (m) setErr(m); };
  return <aside className="dw2-pane" aria-label={title}>
    <header><h2>{title}</h2><button className="cu-icon" aria-label="닫기" onClick={onClose}><VscChromeClose /></button></header>
    <div className="dw2-pane-body dw2-form">
      <h3>환자 정보</h3>
      <label><span>이름 <b className="dw-req">*</b></span><input aria-label="이름" placeholder="이름" maxLength={20} value={f.name} onChange={x => set({ name: x.target.value })} /><E k="name" /></label>
      <div className="dw2-f"><span>주민번호 <b className="dw-req">*</b></span><div className="dw2-rrn"><input aria-label="주민번호 앞 6자리" placeholder="앞 6자리" inputMode="numeric" maxLength={6} value={f.rrn1} onChange={x => set({ rrn1: x.target.value.replace(/[^\d*]/g, '') })} /><i>-</i><input aria-label="주민번호 뒤 7자리" placeholder="뒤 7자리" inputMode="numeric" maxLength={7} value={f.rrn2} onChange={x => set({ rrn2: x.target.value.replace(/[^\d*]/g, '') })} /></div><E k="rrn" /></div>
      <label><span>휴대전화 <b className="dw-req">*</b></span><input aria-label="휴대전화" placeholder="휴대전화번호" maxLength={13} value={f.phone} onChange={x => set({ phone: x.target.value })} /><E k="phone" /></label>
      <div className="dw2-f"><span>주소</span><input aria-label="주소" placeholder="주소" value={f.addr} onChange={x => set({ addr: x.target.value })} /><input aria-label="상세주소" placeholder="상세주소" value={f.addr2} onChange={x => set({ addr2: x.target.value })} /></div>
      <label><span>환자 메모</span><input aria-label="환자 메모" placeholder="메모" maxLength={100} value={f.pmemo} onChange={x => set({ pmemo: x.target.value })} /></label>
      <label><span>내원경로</span><select aria-label="내원경로" value={f.path} onChange={x => set({ path: x.target.value })}><option value="">내원경로</option>{paths.map(p => <option key={p}>{p}</option>)}</select></label>
      <div className="dw2-checks"><label><input type="checkbox" checked={f.cInfo} onChange={() => set({ cInfo: !f.cInfo })} />알림 발송 정보 제공 동의</label><label><input type="checkbox" checked={f.cAd} onChange={() => set({ cAd: !f.cAd })} />광고성 알림 수신 동의</label></div>
      {mode !== 'patient' && <>
        <h3>진료 정보</h3>
        <div className="dw2-f"><span>현황</span><label className="dw2-inline"><input type="checkbox" checked={f.visit} onChange={() => set({ visit: !f.visit })} />내원 확정</label></div>
        <label><span>진료실 <b className="dw-req">*</b></span><select aria-label="진료실" value={f.roomId} onChange={x => set({ roomId: x.target.value })}><option value="">진료실 선택</option>{rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select><E k="room" /></label>
        {mode === 'appt' && <>
          <label><span>예약일자 <b className="dw-req">*</b></span><input type="date" aria-label="예약일자" min={TODAY} value={f.date} onChange={x => set({ date: x.target.value })} /><E k="date" /></label>
          <label><span>예약시간 <b className="dw-req">*</b></span><select aria-label="예약시간" value={f.time} onChange={x => set({ time: x.target.value })}><option value="">예약시간</option>{TIMES.map(t => <option key={t} value={t} disabled={f.date === TODAY && t <= NOW}>{ampm(t)}{f.date === TODAY && t <= NOW ? ' (지난 시간)' : ''}</option>)}</select><E k="time" /></label>
        </>}
        <label><span>내원목적</span><input aria-label="내원목적" placeholder="내원목적 입력" maxLength={40} value={f.purpose} onChange={x => set({ purpose: x.target.value })} /></label>
        <label><span>내원목적 기타</span><input aria-label="내원목적 기타" placeholder="내원목적 기타 사항 입력" maxLength={100} value={f.etc} onChange={x => set({ etc: x.target.value })} /></label>
        <label><span>진료 메모</span><textarea aria-label="진료 메모" placeholder="진료 메모 입력" maxLength={200} value={f.memo} onChange={x => set({ memo: x.target.value })} /></label>
      </>}
      {err && <p className="cu-error" role="alert">{err}</p>}
    </div>
    <footer><button className="cu-btn" onClick={onClose}>취소</button><button className="cu-btn primary" onClick={submit}>{submitLabel}</button></footer>
  </aside>;
}

/** 패널 공통 틀 */
function Pane({ title, onClose, children, footer, Pin, pin }: { title: string; onClose: () => void; children: React.ReactNode; footer?: React.ReactNode; Pin?: TKit['Pin']; pin?: number }) {
  return <aside className="dw2-pane" aria-label={title}>
    <header><h2>{title}{Pin && pin && <Pin n={pin} />}</h2><button className="cu-icon" aria-label="닫기" onClick={onClose}><VscChromeClose /></button></header>
    <div className="dw2-pane-body">{children}</div>
    {footer && <footer>{footer}</footer>}
  </aside>;
}
const Dl = ({ rows }: { rows: [string, React.ReactNode][] }) => <dl className="dw2-dl">{rows.map(([k, v]) => <React.Fragment key={k}><dt>{k}</dt><dd>{v === '' || v == null ? '—' : v}</dd></React.Fragment>)}</dl>;
const patientRows = (p: Patient): [string, React.ReactNode][] => [['이름', p.name], ['성별 · 만 나이', `${p.gender} · ${p.age ?? '—'}세`], ['주민번호', p.rrn], ['휴대전화', p.phone], ['주소', [p.addr, p.addr2].filter(Boolean).join(' ')], ['환자 메모', p.pmemo], ['내원경로', p.path]];

/* ═════════════ 접수 현황 ═════════════ */
export type Col = { key: string; label: string; panel: string; w: number; on: boolean; fixed?: boolean };
/** 피그마 '접수 테이블 열 편집' 순서·기본 토글. 기본 노출은 피그마 화면 기준(진료 메모 표시) */
export const RCP_COLS0: Col[] = [
  { key: 'order', label: '순서', panel: '순서', w: 60, on: true, fixed: true }, { key: 'name', label: '이름', panel: '이름', w: 80, on: true, fixed: true },
  { key: 'gender', label: '성별', panel: '성별', w: 60, on: true }, { key: 'age', label: '만 나이', panel: '만 나이', w: 72, on: true },
  { key: 'rrn', label: '주민등록번호', panel: '주민등록번호', w: 152, on: true }, { key: 'phone', label: '휴대전화번호', panel: '휴대전화번호', w: 130, on: true },
  { key: 'addr', label: '주소', panel: '기본 주소', w: 210, on: false }, { key: 'addr2', label: '상세주소', panel: '상세 주소', w: 200, on: false }, { key: 'zip', label: '우편번호', panel: '우편번호', w: 80, on: false },
  { key: 'ptype', label: '구분', panel: '환자 구분', w: 64, on: false }, { key: 'channel', label: '인입', panel: '인입', w: 74, on: true }, { key: 'visit', label: '내원', panel: '내원 여부', w: 60, on: true },
  { key: 'chart', label: '차팅', panel: '차팅', w: 60, on: false }, { key: 'purpose', label: '내원목적', panel: '내원 목적', w: 240, on: true }, { key: 'etc', label: '내원목적 기타', panel: '내원 목적 기타', w: 240, on: true },
  { key: 'memo', label: '진료 메모', panel: '진료 메모', w: 240, on: true }, { key: 'created', label: '접수 생성일', panel: '접수 생성일', w: 190, on: true, fixed: true },
  { key: 'room', label: '진료실', panel: '진료실', w: 120, on: false }, { key: 'roomCode', label: '진료실 코드', panel: '진료실 코드', w: 120, on: false },
  { key: 'dept', label: '진료과', panel: '진료과', w: 120, on: false }, { key: 'deptCode', label: '진료과 코드', panel: '진료과 코드', w: 120, on: false },
  { key: 'doctor', label: '의사', panel: '의사', w: 120, on: false }, { key: 'doctorCode', label: '의사 코드', panel: '의사 코드', w: 120, on: false }
];
/** 접수 테이블 셀 중 처리 동작이 없는 항목(접수 현황·지난 내역 접수 탭 공용) */
const rcpField = (c: Col, x: Rcp, room: Room): React.ReactNode => {
  const cr = chartRoomOf(room);
  switch (c.key) {
    case 'name': return <span className="dw2-cell-copy"><span className="dw2-ell">{x.name}</span><Copy text={x.name} /></span>;
    case 'rrn': return <span className="dw2-cell-copy"><span className="dw2-ell">{x.rrn}</span><Copy text={x.rrn} /></span>;
    case 'phone': return <span className="dw2-cell-copy"><span className="dw2-ell">{x.phone}</span><Copy text={x.phone} /></span>;
    case 'gender': return x.gender; case 'age': return x.age ?? '';
    case 'addr': return x.addr; case 'addr2': return x.addr2; case 'zip': return x.zip; case 'ptype': return x.ptype; case 'channel': return x.channel;
    case 'chart': return '';
    case 'purpose': return x.purpose; case 'etc': return x.etc; case 'memo': return x.memo; case 'created': return fmtDT(x.created);
    case 'room': return room.name; case 'roomCode': return cr?.code || ''; case 'dept': return room.dept; case 'doctor': return room.doctors.join(', ');
    default: return '';
  }
};
type RPane = null | { t: 'detail'; id: string } | { t: 'register'; init: PForm } | { t: 'columns' };
type Over = { roomId: string; pos: 'turn' | number } | null;

export function ReceiptPage({ kit, rcps, setRcps, cols, setCols, banner }: { kit: TKit; rcps: Rcp[]; setRcps: React.Dispatch<React.SetStateAction<Rcp[]>>; cols: Col[]; setCols: (c: Col[]) => void; banner: React.ReactNode }) {
  const M = kit.Modal, Pin = kit.Pin;
  const rooms = [...kit.rooms].sort((a, b) => a.sortIndex - b.sortIndex);
  const [date, setDate] = useState(TODAY), [roomSel, setRoomSel] = useState('all');
  const [pane, setPane] = useState<RPane>(null), [gear, setGear] = useState(false);
  const [ctx, setCtx] = useState<{ id: string; x: number; y: number } | null>(null);
  const [dlg, setDlg] = useState<null | { t: 'cancel'; id: string } | { t: 'novisit'; id: string; roomId: string }>(null);
  const [bar, setBar] = useState<Bar>(null);
  const [drag, setDrag] = useState<{ id: string; roomId: string } | null>(null), [over, setOver] = useState<Over>(null);
  useEffect(() => { if (roomSel !== 'all' && !rooms.some(r => r.id === roomSel)) setRoomSel('all'); });
  useEffect(() => {
    if (!gear) return;
    const h = (e: MouseEvent) => { if (!(e.target as HTMLElement).closest('.dw2-gear-wrap')) setGear(false); };
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h);
  }, [gear]);

  const live = (roomId: string) => rcps.filter(x => x.roomId === roomId && x.date === date && !x.done);
  const turnOf = (roomId: string) => live(roomId).find(x => x.turn);
  const waitOf = (roomId: string) => live(roomId).filter(x => !x.turn).sort((a, b) => a.order - b.order);
  const shown = roomSel === 'all' ? rooms : rooms.filter(r => r.id === roomSel);
  const total = rooms.reduce((a, r) => a + live(r.id).length, 0);
  const sel = pane?.t === 'detail' ? rcps.find(x => x.id === pane.id && !x.done) : undefined;
  useEffect(() => { if (pane?.t === 'detail' && !sel) setPane(null); });
  const roomOf = (id: string) => rooms.find(r => r.id === id);
  const editable = (r?: Room) => !!r && !isLinkedRoom(kit, r);
  const vis = cols.filter(c => c.on);
  const tableW = vis.reduce((a, c) => a + c.w, 0);

  /* 상태 변경: 실패 체험이면 토스트만, 성공이면 반영 + (취소·완료만) Info Bar */
  const visit = (id: string) => kit.silent(() => setRcps(o => o.map(x => x.id === id ? { ...x, visit: true } : x)), '내원 확정');
  const finish = (id: string, done: '진료완료' | '접수취소') => {
    if (kit.silent(() => setRcps(o => o.map(x => x.id === id ? { ...x, done, turn: false } : x)), done === '진료완료' ? '진료 완료' : '접수 취소'))
      setBar(done === '진료완료' ? { title: '진료 완료', body: '진료가 완료되었습니다.' } : { title: '접수 취소', body: '접수가 취소되었습니다.' });
  };
  /** 대기 목록 pos 위치로 이동(다른 진료실이면 진료실 변경) */
  const moveTo = (id: string, roomId: string, pos: number) => kit.silent(() => setRcps(old => {
    const list = old.map(x => ({ ...x })); const me = list.find(x => x.id === id)!;
    const sameRoom = me.roomId === roomId && !me.turn;
    const before = list.filter(x => x.roomId === roomId && x.date === me.date && !x.done && !x.turn).sort((a, b) => a.order - b.order);
    const from = before.findIndex(x => x.id === id);
    let at = pos; if (sameRoom && from >= 0 && from < pos) at -= 1;
    const rest = before.filter(x => x.id !== id);
    me.roomId = roomId; me.turn = false; rest.splice(at, 0, me); rest.forEach((x, i) => { x.order = i; });
    return list;
  }), '순서 변경');
  /** 진료 차례로 승격: 기존 차례는 내원 확정 상태로 대기 1순위로 내려간다 */
  const promote = (id: string, roomId: string, withVisit: boolean) => kit.silent(() => setRcps(old => {
    const list = old.map(x => ({ ...x })); const me = list.find(x => x.id === id)!;
    const cur = list.find(x => x.roomId === roomId && x.date === me.date && !x.done && x.turn && x.id !== id);
    me.roomId = roomId; me.turn = true; if (withVisit) me.visit = true;
    let wait = list.filter(x => x.roomId === roomId && x.date === me.date && !x.done && !x.turn).sort((a, b) => a.order - b.order);
    if (cur) { cur.turn = false; cur.visit = true; wait = [cur, ...wait.filter(x => x.id !== cur.id)]; }
    wait.forEach((x, i) => { x.order = i; });
    return list;
  }), '진료 차례 이동');
  const drop = (roomId: string, pos: 'turn' | number) => {
    const d = drag; setDrag(null); setOver(null); if (!d) return;
    const x = rcps.find(r => r.id === d.id); if (!x || !editable(roomOf(roomId))) return;
    if (pos === 'turn') { if (!x.visit) { setDlg({ t: 'novisit', id: x.id, roomId }); return; } promote(x.id, roomId, false); return; }
    if (x.roomId === roomId) { const from = waitOf(roomId).findIndex(r => r.id === x.id); if (pos === from || pos === from + 1) return; } // 같은 자리 → 원상 복귀
    moveTo(x.id, roomId, pos);
  };
  const overOn = (e: React.DragEvent, room: Room, pos: 'turn' | number) => {
    if (!drag || !editable(room)) return; // 연동 진료실로는 넣을 수 없다
    e.preventDefault(); e.dataTransfer.dropEffect = 'move';
    if (!over || over.roomId !== room.id || over.pos !== pos) setOver({ roomId: room.id, pos });
  };

  const cell = (c: Col, x: Rcp | undefined, room: Room, isTurn: boolean, idx: number, canEdit: boolean): React.ReactNode => {
    if (c.key === 'order') return isTurn ? '진료' : idx + 1;
    if (!x) return '';
    if (c.key === 'visit') return <input type="checkbox" className="dw2-check" aria-label={`${x.name} 내원 확정`} checked={x.visit} disabled={!canEdit || x.visit} onClick={e => e.stopPropagation()} onChange={() => visit(x.id)} />;
    return rcpField(c, x, room);
  };
  const row = (x: Rcp | undefined, room: Room, isTurn: boolean, idx: number, last: boolean) => {
    const canEdit = editable(room);
    const ov = over && over.roomId === room.id;
    const dropCls = !ov ? '' : isTurn ? (over!.pos === 'turn' ? ' drop-turn' : '') : over!.pos === idx ? ' drop-before' : last && over!.pos === idx + 1 ? ' drop-after' : '';
    return <tr key={x?.id || `turn-${room.id}`} className={'dw2-row' + (isTurn ? ' turn' : '') + (x && drag?.id === x.id ? ' dragging' : '') + (x && sel?.id === x.id ? ' selected' : '') + dropCls + (x ? '' : ' blank')}
      draggable={canEdit && !!x && !isTurn}
      onDragStart={e => { if (!x) return; e.dataTransfer.setData('text/plain', x.id); e.dataTransfer.effectAllowed = 'move'; setDrag({ id: x.id, roomId: room.id }); setCtx(null); }}
      onDragEnd={() => { setDrag(null); setOver(null); }}
      onDragOver={e => { if (isTurn) { overOn(e, room, 'turn'); return; } const b = e.currentTarget.getBoundingClientRect(); overOn(e, room, e.clientY < b.top + b.height / 2 ? idx : idx + 1); }}
      onDrop={e => { e.preventDefault(); if (over && over.roomId === room.id) drop(room.id, over.pos); }}
      onClick={() => x && setPane({ t: 'detail', id: x.id })}
      onContextMenu={e => { if (!x || !canEdit) return; e.preventDefault(); setCtx({ id: x.id, x: e.clientX, y: e.clientY }); }}
      tabIndex={x ? 0 : -1} onKeyDown={e => { if (x && e.key === 'Enter') setPane({ t: 'detail', id: x.id }); }}>
      {vis.map(c => <td key={c.key} className={'c-' + c.key}>{cell(c, x, room, isTurn, idx, canEdit)}</td>)}
    </tr>;
  };
  const block = (room: Room) => {
    const list = live(room.id), turn = turnOf(room.id), wait = waitOf(room.id);
    const linked = isLinkedRoom(kit, room);
    const target = !!drag && drag.roomId !== room.id && over?.roomId === room.id;
    return <section key={room.id} className={'dw2-tbl' + (target ? ' drop-room' : '') + (linked ? ' linked' : '')} aria-label={room.name}>
      <div className="dw2-tbl-title"><strong>{room.name}・{room.doctors.join(', ')}・{room.dept} ({list.length}명)</strong>{linked && <><LinkChip r={room} short /><span className="dw2-tbl-note">차트에서 처리돼요</span></>}</div>
      <div className="dw2-tbl-scroll"><table className="dw2-grid" style={{ width: tableW }}>
        <colgroup>{vis.map(c => <col key={c.key} style={{ width: c.w }} />)}</colgroup>
        <thead><tr>{vis.map(c => <th key={c.key} className={'c-' + c.key}>{c.label}</th>)}</tr></thead>
        <tbody>
          {row(turn, room, true, -1, false)}
          {wait.map((x, i) => row(x, room, false, i, i === wait.length - 1))}
          {!wait.length && <tr className={'dw2-row empty' + (over?.roomId === room.id && over.pos === 0 ? ' drop-before' : '')} onDragOver={e => overOn(e, room, 0)} onDrop={e => { e.preventDefault(); drop(room.id, 0); }}><td colSpan={vis.length}>대기중인 환자가 없습니다.</td></tr>}
        </tbody>
      </table></div>
    </section>;
  };
  const unlinkedRooms = rooms.filter(r => editable(r));
  const ddItems: DdItem[] = [{ value: 'all', label: '전체 진료실', n: total }, ...rooms.map(r => ({ value: r.id, label: r.name, n: live(r.id).length }))];
  const ctxRec = ctx ? rcps.find(x => x.id === ctx.id) : undefined;
  const dlgRec = dlg ? rcps.find(x => x.id === dlg.id) : undefined;

  return <div className="dw2-page">
    <div className="dw2-main">
      <div className="dw2-head">
        <div className="dw2-head-row"><h1 className="dw2-title" tabIndex={-1}>접수<Pin n={8} /></h1>
          <div className="dw2-head-right">
            <SearchBox placeholder="접수할 환자 검색" newLabel="신환접수" Pin={Pin} onNew={q => setPane({ t: 'register', init: { ...emptyForm(q), visit: true, roomId: unlinkedRooms.length === 1 ? unlinkedRooms[0].id : '' } })} />
            <div className="dw2-gear-wrap"><button className={'dw2-icon-btn ' + (gear ? 'on' : '')} aria-label="테이블 설정" aria-expanded={gear} onClick={() => setGear(!gear)}><VscSettingsGear /></button><Pin n={7} />
              {gear && <div className="dw2-ctx dw2-gear-menu" role="menu"><button role="menuitem" onClick={() => { setGear(false); setPane({ t: 'columns' }); }}>테이블 열 편집</button></div>}</div>
          </div>
        </div>
        <div className="dw2-topnav">
          <input type="date" className="dw2-date" aria-label="기준 날짜" max={TODAY} value={date} onChange={e => { const v = e.target.value || TODAY; setDate(v > TODAY ? TODAY : v); }} />
          <Dropdown label="진료실 필터" items={ddItems} value={roomSel} onChange={setRoomSel} />
        </div>
      </div>
      {banner}
      <div className="dw2-scroll" onDragOver={e => { if (drag && !(e.target as HTMLElement).closest('.dw2-row')) setOver(null); }}>
        {rooms.length === 0
          ? (kit.linked
            ? <div className="dw2-noroom"><strong>진료실을 먼저 생성해주세요.</strong><p>접수 및 예약 관리는 진료실 생성 후에 가능합니다.</p><button className="dw2-btn primary" onClick={kit.onCreateRoom}>진료실 생성</button><Pin n={3} /></div>
            : <div className="dw2-noroom soft"><button className="dw-link" onClick={kit.onCreateRoom}>진료실 만들기</button><Pin n={3} /></div>)
          : shown.map(block)}
      </div>
      <InfoBar bar={bar} onClose={() => setBar(null)} Pin={Pin} />
    </div>

    {pane?.t === 'detail' && sel && (() => {
      const room = roomOf(sel.roomId); const canEdit = editable(room);
      return <Pane title="접수 정보" onClose={() => setPane(null)} Pin={Pin} pin={7}
        footer={canEdit ? <>{!sel.visit && <button className="cu-btn" onClick={() => visit(sel.id)}>내원 확정</button>}<button className="cu-btn dw-danger-line" onClick={() => setDlg({ t: 'cancel', id: sel.id })}>접수 취소</button><button className="cu-btn primary" onClick={() => finish(sel.id, '진료완료')}>진료 완료</button></> : undefined}>
        {!canEdit && room && <p className="dw2-pane-linked"><LinkChip r={room} />차트에서 처리돼요</p>}
        <h3>환자 정보</h3><Dl rows={patientRows(sel)} />
        <h3>진료 정보</h3><Dl rows={[['진료실', room?.name], ['순서', sel.turn ? '진료' : `${waitOf(sel.roomId).findIndex(x => x.id === sel.id) + 1}`], ['인입', sel.channel], ['현황', sel.visit ? '내원 확정' : ''], ['내원목적', sel.purpose], ['내원목적 기타', sel.etc], ['진료 메모', sel.memo], ['접수일시', fmtDT(sel.created)]]} />
      </Pane>;
    })()}
    {pane?.t === 'register' && <PatientFormPane key={JSON.stringify(pane.init)} mode="rcp" title="신환 접수" submitLabel="접수" init={pane.init} rooms={unlinkedRooms} paths={kit.paths} onClose={() => setPane(null)} onSubmit={f => {
      const p = patientOf(f); const order = Math.max(-1, ...rcps.filter(x => x.roomId === f.roomId && x.date === TODAY && !x.done && !x.turn).map(x => x.order)) + 1;
      const id = `RW${String(rcps.length + 1).padStart(3, '0')}`;
      if (!kit.silent(() => setRcps(o => [...o, { ...p, id, date: TODAY, roomId: f.roomId, zip: '', ptype: '', channel: '현장', visit: f.visit, purpose: f.purpose.trim(), etc: f.etc.trim(), memo: f.memo.trim(), created: `${TODAY} ${NOW}:00`, turn: false, order }]), '접수')) return;
      setPane(null); setDate(TODAY); if (roomSel !== 'all' && roomSel !== f.roomId) setRoomSel('all');
      setBar({ title: '접수 완료', body: '접수가 완료되었습니다.' });
    }} />}
    {pane?.t === 'columns' && <ColumnPane cols={cols} setCols={setCols} onClose={() => setPane(null)} />}

    {ctx && ctxRec && <CtxMenu x={ctx.x} y={ctx.y} onClose={() => setCtx(null)} items={[...(!ctxRec.visit ? [['내원 확정', () => visit(ctxRec.id)] as [string, () => void]] : []), ['접수 취소', () => setDlg({ t: 'cancel', id: ctxRec.id })], ['진료 완료', () => finish(ctxRec.id, '진료완료')]]} />}
    {dlg?.t === 'cancel' && dlgRec && <M title="접수를 취소할까요?" className="dw2-dialog" onClose={() => setDlg(null)} footer={<><button className="cu-btn danger" onClick={() => { setDlg(null); finish(dlgRec.id, '접수취소'); }}>접수 취소</button><button className="cu-btn" onClick={() => setDlg(null)}>취소</button></>}>
      <p className="dw-pre">{'취소한 접수는 복구할 수 없습니다.\n그래도 취소할까요?'}</p>
    </M>}
    {dlg?.t === 'novisit' && dlgRec && <M title="아직 내원하지 않은 환자입니다." className="dw2-dialog" onClose={() => setDlg(null)} footer={<><button className="cu-btn primary" onClick={() => { const d = dlg; setDlg(null); promote(d.id, d.roomId, true); }}>상태 변경 후 이동</button><button className="cu-btn" onClick={() => setDlg(null)}>취소</button></>}>
      <p className="dw-pre">{`${dlgRec.name} 환자를 내원 상태로 변경하고\n진료차례로 이동하시겠습니까?`}</p>
    </M>}
  </div>;
}

/** 접수 테이블 열 편집(피그마): 토글 즉시 반영, ≡ 드래그로 순서 변경, 순서·이름·접수 생성일은 토글 없음, 순서 열은 위치 고정 */
function ColumnPane({ cols, setCols, onClose }: { cols: Col[]; setCols: (c: Col[]) => void; onClose: () => void }) {
  const [dragKey, setDragKey] = useState<string | null>(null), [overKey, setOverKey] = useState<string | null>(null);
  const move = (from: string, to: string) => { if (from === to || to === 'order') return; const n = [...cols]; const i = n.findIndex(c => c.key === from); const [m] = n.splice(i, 1); n.splice(n.findIndex(c => c.key === to), 0, m); setCols(n); };
  return <Pane title="접수 테이블 열 편집" onClose={onClose}>
    <ul className="dw2-cols">{cols.map(c => {
      const locked = c.key === 'order';
      return <li key={c.key} className={(dragKey === c.key ? 'dragging ' : '') + (overKey === c.key && dragKey && dragKey !== c.key ? 'over' : '')} draggable={!locked}
        onDragStart={e => { e.dataTransfer.setData('text/plain', c.key); setDragKey(c.key); }} onDragEnd={() => { setDragKey(null); setOverKey(null); }}
        onDragOver={e => { if (dragKey && !locked) { e.preventDefault(); setOverKey(c.key); } }} onDrop={e => { e.preventDefault(); if (dragKey) move(dragKey, c.key); setDragKey(null); setOverKey(null); }}>
        <VscGripper className={'dw2-grip ' + (locked ? 'off' : '')} aria-hidden="true" /><span>{c.panel}</span>
        {!c.fixed && <button className={'cu-toggle ' + (c.on ? 'on' : '')} aria-label={`${c.panel} 열 표시`} aria-pressed={c.on} onClick={() => setCols(cols.map(x => x.key === c.key ? { ...x, on: !x.on } : x))}><span /></button>}
      </li>;
    })}</ul>
  </Pane>;
}

/* ═════════════ 지난 내역 · 접수 탭(v2.2) ═════════════ */
const RcpTag = ({ done }: { done: NonNullable<Rcp['done']> }) => <span className={'cu-tag ' + (done === '진료완료' ? 'green' : 'red')}>{done}</span>;
const roomWithChip = (kit: TKit, room: Room) => <span className="dw2-where"><span className="dw2-ell">{room.name}</span>{isLinkedRoom(kit, room) && <LinkChip r={room} short />}</span>;
/** 종료된 접수 목록(읽기 전용). 열 = 접수 현황 열 편집 설정 − 순서 + 상태(맨 앞).
 *  평면 목록이라 진료실 구분과 '차트 연동' 칩을 보이려고 진료실 열은 열 편집과 관계없이 표시(헤더 [보류]) */
export function PastRcpTable({ kit, list, cols, onOpen }: { kit: TKit; list: Rcp[]; cols: Col[]; onOpen: (id: string, el: HTMLElement) => void }) {
  const vis: Col[] = [{ key: 'state', label: '상태', panel: '상태', w: 90, on: true },
    ...cols.filter(c => c.key !== 'order' && (c.on || c.key === 'room')).map(c => c.key === 'room' ? { ...c, w: 210 } : c)];
  const width = vis.reduce((a, c) => a + c.w, 0);
  return <div className="dw2-past"><section className="dw2-tbl" aria-label="지난 접수 목록">
    <div className="dw2-tbl-scroll"><table className="dw2-grid" style={{ width }}>
      <colgroup>{vis.map(c => <col key={c.key} style={{ width: c.w }} />)}</colgroup>
      <thead><tr>{vis.map(c => <th key={c.key} className={'c-' + c.key}>{c.label}</th>)}</tr></thead>
      <tbody>{list.map(x => { const room = kit.rooms.find(r => r.id === x.roomId); if (!room) return null; return <tr key={x.id} className="dw2-row" tabIndex={0}
        onClick={e => onOpen(x.id, e.currentTarget)} onKeyDown={e => { if (e.key === 'Enter') onOpen(x.id, e.currentTarget); }}>
        {vis.map(c => <td key={c.key} className={'c-' + c.key}>{c.key === 'state' ? <RcpTag done={x.done!} />
          : c.key === 'visit' ? <input type="checkbox" className="dw2-check" aria-label={`${x.name} 내원 확정`} checked={x.visit} disabled readOnly />
          : c.key === 'room' ? roomWithChip(kit, room) : rcpField(c, x, room)}</td>)}
      </tr>; })}</tbody>
    </table></div>
  </section></div>;
}
/** 종료된 접수 상세(읽기 전용) — 접수 현황 '접수 정보' 패널과 같은 항목, 순서 대신 상태 */
export function PastRcpDetail({ kit, x }: { kit: TKit; x: Rcp }) {
  const room = kit.rooms.find(r => r.id === x.roomId);
  return <div className="dw2-past">
    <div className="cu-detail-heading"><span>접수 · {x.id} · 인입 {x.channel}</span>{x.done && <RcpTag done={x.done} />}</div>
    <h3 className="cu-detail-label">환자 정보</h3><Dl rows={patientRows(x)} />
    <h3 className="cu-detail-label">진료 정보</h3><Dl rows={[['진료실', room && roomWithChip(kit, room)], ['인입', x.channel], ['현황', x.visit ? '내원 확정' : ''], ['내원목적', x.purpose], ['내원목적 기타', x.etc], ['진료 메모', x.memo], ['접수일시', fmtDT(x.created)]]} />
  </div>;
}

/* ═════════════ 예약 현황 ═════════════ */
type APane = null | { t: 'detail'; id: string; edit?: boolean } | { t: 'register'; init: PForm; existing: boolean } | { t: 'patient'; id: string };
const A_COLS: [string, string, number][] = [
  ['date', '진료 예정일', 190], ['name', '이름', 80], ['gender', '성별', 60], ['age', '만 나이', 72], ['rrn', '주민등록번호', 152], ['phone', '휴대전화번호', 130],
  ['src', '구분', 76], ['where', '진료실 · 진료항목', 210], ['channel', '인입', 110], ['visit', '내원', 60], ['purpose', '내원목적', 240], ['etc', '내원목적 기타', 240], ['created', '예약 생성일', 120]
];
export const apptWhen = (x: { date: string; time: string }) => `${x.date} ${x.time ? ampm(x.time) : '시간 미정'}`;

export function ApptPage({ kit, recs, setRows, rcps, items, banner, chip, onClearChip, init }: {
  kit: TKit; recs: Rec[]; setRows: React.Dispatch<React.SetStateAction<Rec[]>>; rcps: Rcp[]; items: { name: string }[]; banner: React.ReactNode;
  chip: boolean; onClearChip: () => void; init?: { id: string; date: string };
}) {
  const M = kit.Modal, Pin = kit.Pin;
  const rooms = [...kit.rooms].sort((a, b) => a.sortIndex - b.sortIndex);
  const [date, setDate] = useState(init?.date || TODAY), [allDays, setAllDays] = useState(false), [filter, setFilter] = useState('all'), [asc, setAsc] = useState(true);
  const [pane, setPane] = useState<APane>(init ? { t: 'detail', id: init.id } : null);
  const [ctx, setCtx] = useState<{ id: string; x: number; y: number } | null>(null), [dlg, setDlg] = useState<string | null>(null), [bar, setBar] = useState<Bar>(null);
  const [edit, setEdit] = useState({ roomId: '', purpose: '', etc: '', memo: '' });
  useEffect(() => { if (filter.startsWith('room:') && !rooms.some(r => `room:${r.id}` === filter)) setFilter('all'); });
  const roomByName = (n: string) => rooms.find(r => r.name === n);
  const editable = (x: Rec) => x.kind === '진료실 예약' && !!roomByName(x.room) && !isLinkedRoom(kit, roomByName(x.room));
  const active = recs.filter(x => ACTIVE.includes(x.state));
  const dated = active.filter(x => chip ? x.created === TODAY : allDays || x.date === date);
  const fOk = (x: Rec, f: string) => f === 'all' || (f === 'items' ? x.kind === '진료항목 예약' : f.startsWith('item:') ? x.kind === '진료항목 예약' && x.item.startsWith(f.slice(5)) : x.kind === '진료실 예약' && `room:${roomByName(x.room)?.id}` === f);
  const key = (x: Rec) => `${x.date}${x.time || '99:99'}${x.created}`;
  const list = dated.filter(x => fOk(x, filter)).sort((a, b) => (asc ? 1 : -1) * key(a).localeCompare(key(b)));
  const sel = pane && pane.t !== 'register' ? recs.find(x => x.id === pane.id) : undefined;
  useEffect(() => { if (pane && pane.t !== 'register' && (!sel || !ACTIVE.includes(sel.state))) setPane(null); });
  const unlinkedRooms = rooms.filter(r => !isLinkedRoom(kit, r));
  const patients = (() => { const m = new Map<string, Patient>(); [...rcps, ...recs].forEach(p => { if (!m.has(keyOf(p))) m.set(keyOf(p), p); }); return [...m.values()]; })();

  const setState = (x: Rec, state: State, what: string, b?: Bar) => { if (kit.silent(() => setRows(o => o.map(y => y.id === x.id ? { ...y, state, closed: state === '내원확정' ? y.closed : TODAY } : y)), what) && b) setBar(b); };
  const visit = (x: Rec) => setState(x, '내원확정', '내원 확정');
  const complete = (x: Rec) => setState(x, '진료완료', '진료 완료', { title: '진료 완료', body: '진료가 완료되었습니다.' });
  const ddItems: DdItem[] = [{ value: 'all', label: '전체', n: dated.length },
    ...(rooms.length ? [{ value: 'h-room', label: '진료실', header: true }, ...rooms.map(r => ({ value: `room:${r.id}`, label: r.name, n: dated.filter(x => fOk(x, `room:${r.id}`)).length }))] : []),
    { value: 'h-item', label: '진료항목', header: true }, { value: 'items', label: '진료항목 전체', n: dated.filter(x => x.kind === '진료항목 예약').length },
    ...items.map(i => ({ value: `item:${i.name}`, label: i.name, n: dated.filter(x => fOk(x, `item:${i.name}`)).length }))];

  const cell = (k: string, x: Rec) => {
    const isItem = x.kind === '진료항목 예약'; const room = roomByName(x.room);
    switch (k) {
      case 'date': return apptWhen(x);
      case 'name': return <span className="dw2-cell-copy"><span className="dw2-ell">{x.name}</span><Copy text={x.name} /></span>;
      case 'rrn': return <span className="dw2-cell-copy"><span className="dw2-ell">{x.rrn}</span><Copy text={x.rrn} /></span>;
      case 'phone': return <span className="dw2-cell-copy"><span className="dw2-ell">{x.phone}</span><Copy text={x.phone} /></span>;
      case 'gender': return x.gender; case 'age': return x.age ?? '';
      case 'src': return isItem ? '진료항목' : '진료실';
      case 'where': return <span className="dw2-where"><span className="dw2-ell">{isItem ? x.item : x.room}</span>{!isItem && room && isLinkedRoom(kit, room) && <LinkChip r={room} short />}</span>;
      case 'channel': return x.channel;
      case 'visit': return isItem ? '' : <input type="checkbox" className="dw2-check" aria-label={`${x.name} 내원 확정`} checked={x.state === '내원확정'} disabled={!editable(x) || x.state === '내원확정'} onClick={e => e.stopPropagation()} onChange={() => visit(x)} />;
      case 'purpose': return isItem ? '' : x.purpose; case 'etc': return x.etc; case 'created': return x.created;
      default: return '';
    }
  };
  const width = A_COLS.reduce((a, c) => a + c[2], 0);
  const ctxRec = ctx ? recs.find(x => x.id === ctx.id) : undefined;
  const dlgRec = dlg ? recs.find(x => x.id === dlg) : undefined;

  return <div className="dw2-page">
    <div className="dw2-main">
      <div className="dw2-head">
        <div className="dw2-head-row"><h1 className="dw2-title" tabIndex={-1}>예약</h1>
          <div className="dw2-head-right">
            <SearchBox placeholder="예약할 환자 검색" newLabel="신환예약" patients={patients} Pin={Pin} pin={10}
              onNew={q => setPane({ t: 'register', existing: false, init: { ...emptyForm(q), roomId: unlinkedRooms.length === 1 ? unlinkedRooms[0].id : '' } })}
              onPick={p => setPane({ t: 'register', existing: true, init: formOf(p, { roomId: unlinkedRooms.length === 1 ? unlinkedRooms[0].id : '' }) })} />
          </div>
        </div>
        <div className="dw2-topnav">
          <input type="date" className="dw2-date" aria-label="기준 날짜" value={date} disabled={allDays || chip} onChange={e => setDate(e.target.value || TODAY)} />
          <label className="dw2-allday"><input type="checkbox" checked={allDays} disabled={chip} onChange={() => setAllDays(!allDays)} />전체 기간</label><Pin n={11} />
          <Dropdown label="진료실 · 진료항목 필터" items={ddItems} value={filter} onChange={setFilter} Pin={Pin} pin={9} />
        </div>
        {chip && <div className="dw-chips"><span className="dw-chip">대시보드 · 오늘 신청된 예약<button aria-label="대시보드 조건 해제" onClick={onClearChip}><VscChromeClose /></button></span><small>대시보드 조건이 켜져 있는 동안 날짜 필터는 쓰지 않아요.</small></div>}
      </div>
      {banner}
      <div className="dw2-scroll">
        <section className="dw2-tbl" aria-label="예약 목록">
          <div className="dw2-tbl-scroll"><table className="dw2-grid" style={{ width }}>
            <colgroup>{A_COLS.map(([k, , w]) => <col key={k} style={{ width: w }} />)}</colgroup>
            <thead><tr>{A_COLS.map(([k, l]) => <th key={k} className={'c-' + k}>{k === 'date' ? <button className="dw2-sort" aria-label={`진료 예정일 ${asc ? '오름차순' : '내림차순'} 정렬`} onClick={() => setAsc(!asc)}>{l}{asc ? <VscTriangleUp /> : <VscTriangleDown />}</button> : <>{l}{k === 'src' && <Pin n={2} />}</>}</th>)}</tr></thead>
            <tbody>
              {list.map(x => { const can = editable(x); return <tr key={x.id} className={'dw2-row' + (sel?.id === x.id ? ' selected' : '')} tabIndex={0}
                onClick={() => setPane({ t: 'detail', id: x.id })} onKeyDown={e => { if (e.key === 'Enter') setPane({ t: 'detail', id: x.id }); }}
                onContextMenu={e => { if (!can) return; e.preventDefault(); setCtx({ id: x.id, x: e.clientX, y: e.clientY }); }}>
                {A_COLS.map(([k]) => <td key={k} className={'c-' + k}>{cell(k, x)}</td>)}
              </tr>; })}
              {!list.length && <tr className="dw2-row empty"><td colSpan={A_COLS.length}>{dated.length && filter !== 'all' ? '검색된 내역이 없습니다.' : '대기중인 환자가 없습니다.'}</td></tr>}
            </tbody>
          </table></div>
        </section>
      </div>
      <InfoBar bar={bar} onClose={() => setBar(null)} Pin={Pin} />
    </div>

    {pane?.t === 'detail' && sel && (() => {
      const isItem = sel.kind === '진료항목 예약'; const room = roomByName(sel.room); const can = editable(sel);
      const editing = can && !!pane.edit;
      return <Pane title="예약 정보" onClose={() => setPane(null)}
        footer={editing ? <><button className="cu-btn" onClick={() => setPane({ t: 'detail', id: sel.id })}>취소</button><button className="cu-btn primary" onClick={() => {
          const nr = rooms.find(r => r.id === edit.roomId);
          if (kit.silent(() => setRows(o => o.map(y => y.id === sel.id ? { ...y, room: nr?.name || y.room, purpose: edit.purpose.trim(), etc: edit.etc.trim(), memo: edit.memo.trim() } : y)), '진료 정보 수정')) { setPane({ t: 'detail', id: sel.id }); setBar({ title: '수정 완료', body: '진료 정보가 수정되었습니다.' }); }
        }}>저장</button></>
          : can ? <><button className="cu-btn dw-danger-line" onClick={() => setDlg(sel.id)}>예약 취소</button>{sel.state !== '내원확정' && <button className="cu-btn" onClick={() => visit(sel)}>내원 확정</button>}<button className="cu-btn primary" onClick={() => complete(sel)}>진료 완료</button></> : undefined}>
        {!isItem && room && isLinkedRoom(kit, room) && <p className="dw2-pane-linked"><LinkChip r={room} />차트에서 처리돼요</p>}
        <div className="dw2-pane-sec"><h3>환자 정보</h3>{can && !editing && <button className="dw2-textbtn" onClick={() => setPane({ t: 'patient', id: sel.id })}>환자 정보 수정</button>}</div>
        <Dl rows={patientRows(sel)} />
        <div className="dw2-pane-sec"><h3>진료 정보</h3>{can && !editing && <button className="dw2-textbtn" onClick={() => { setEdit({ roomId: room?.id || '', purpose: sel.purpose, etc: sel.etc, memo: sel.memo }); setPane({ t: 'detail', id: sel.id, edit: true }); }}>정보 수정</button>}</div>
        {editing ? <div className="dw2-form">
          <div className="dw2-f"><span>예약일시</span><strong className="dw2-ro">{apptWhen(sel)}</strong></div>
          <label><span>진료실</span><select aria-label="진료실" value={edit.roomId} onChange={e => setEdit(o => ({ ...o, roomId: e.target.value }))}>{unlinkedRooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select></label>
          <label><span>내원목적</span><input aria-label="내원목적" placeholder="내원목적 입력" maxLength={40} value={edit.purpose} onChange={e => setEdit(o => ({ ...o, purpose: e.target.value }))} /></label>
          <label><span>내원목적 기타</span><input aria-label="내원목적 기타" placeholder="내원목적 기타 사항 입력" maxLength={100} value={edit.etc} onChange={e => setEdit(o => ({ ...o, etc: e.target.value }))} /></label>
          <label><span>진료 메모</span><textarea aria-label="진료 메모" placeholder="진료 메모 입력" maxLength={200} value={edit.memo} onChange={e => setEdit(o => ({ ...o, memo: e.target.value }))} /></label>
        </div> : <Dl rows={isItem
          ? [['구분', '진료항목'], ['진료항목', sel.item], ['가격', sel.price], ['예약일시', apptWhen(sel)], ['인입', sel.channel], ['요청사항', sel.etc], ['진료 메모', sel.memo], ['예약 생성일', sel.created]]
          : [['구분', '진료실'], ['진료실', sel.room], ['예약일시', apptWhen(sel)], ['인입', sel.channel], ['현황', sel.state === '내원확정' ? '내원 확정' : ''], ['내원목적', sel.purpose], ['내원목적 기타', sel.etc], ['진료 메모', sel.memo], ['예약 생성일', sel.created]]} />}
      </Pane>;
    })()}
    {pane?.t === 'patient' && sel && <PatientFormPane key={'p' + sel.id} mode="patient" title="환자 정보 수정" submitLabel="저장" init={formOf(sel)} rooms={[]} paths={kit.paths} onClose={() => setPane({ t: 'detail', id: sel.id })} onSubmit={f => {
      const p = patientOf(f);
      if (!kit.silent(() => setRows(o => o.map(y => y.id === sel.id ? { ...y, ...p } : y)), '환자 정보 수정')) return;
      setPane({ t: 'detail', id: sel.id }); setBar({ title: '수정 완료', body: '환자 정보가 수정되었습니다.' });
    }} />}
    {pane?.t === 'register' && <PatientFormPane key={JSON.stringify(pane.init) + pane.existing} mode="appt" title={pane.existing ? '구환 예약' : '신환 예약'} submitLabel="예약" init={pane.init} rooms={unlinkedRooms} paths={kit.paths} onClose={() => setPane(null)} onSubmit={f => {
      const p = patientOf(f); const room = rooms.find(r => r.id === f.roomId)!;
      if (recs.some(x => x.kind === '진료실 예약' && ACTIVE.includes(x.state) && x.room === room.name && x.name === p.name && x.phone === p.phone && x.date === f.date)) return '이미 동일한 환자의 예약이 있습니다.';
      const id = `W${String(recs.length + 1).padStart(3, '0')}`;
      const rec: Rec = { ...p, id, kind: '진료실 예약', birth: '', date: f.date, time: f.time, created: TODAY, room: room.name, item: '—', price: '—', purpose: f.purpose.trim(), etc: f.etc.trim(), memo: f.memo.trim(), state: f.visit ? '내원확정' : '예약확정', channel: '병원 등록(웹)' };
      if (!kit.silent(() => setRows(o => [...o, rec]), '예약')) return;
      setPane(null); setDate(f.date); setAllDays(false); if (filter !== 'all' && filter !== `room:${room.id}`) setFilter('all'); if (chip) onClearChip();
      setBar({ title: '예약 완료', body: '예약이 완료되었습니다.' });
    }} />}

    {ctx && ctxRec && <CtxMenu x={ctx.x} y={ctx.y} onClose={() => setCtx(null)} items={[['예약 취소', () => setDlg(ctxRec.id)], ['진료 완료', () => complete(ctxRec)], ...(ctxRec.state !== '내원확정' ? [['내원 확정', () => visit(ctxRec)] as [string, () => void]] : [])]} />}
    {dlg && dlgRec && <M title="예약을 취소할까요?" className="dw2-dialog" onClose={() => setDlg(null)} footer={<><button className="cu-btn danger" onClick={() => { setDlg(null); setState(dlgRec, '병원취소', '예약 취소', { title: '예약 취소', body: '예약이 취소되었습니다.' }); }}>예약 취소</button><button className="cu-btn" onClick={() => setDlg(null)}>취소</button></>}>
      <p className="dw-pre">{'취소한 예약은 복구할 수 없습니다.\n그래도 취소할까요?'}</p>
    </M>}
  </div>;
}
