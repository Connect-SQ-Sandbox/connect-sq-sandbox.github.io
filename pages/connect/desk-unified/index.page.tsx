/**
 * 프로토타입 컨텍스트
 * 이름: desk-unified — 통합 데스크 / 프로그램 메뉴 / 차트 장애 중 신청
 * 상태: 미승인 기획 검토 시안 · v1 · 2026-10-01
 * PRD: 미정. 기존 시각화 시안과 PO 대화에 근거하며 승인 정책을 대체하지 않는다.
 * 관련 CSS: styles/deskUnified.css + 공통 connectShell.css
 * 기술제약: React · plain CSS · 외부 요청 0 · 메모리의 가상 데이터만 사용
 * 화면: 홈 / 접수·예약 / 참고용 관리 메뉴 / 별도 프로그램 설정 창
 * [요청·PO] 프로그램 메뉴는 최소화·최대화·닫기 바로 왼쪽에 배치.
 * [제안] 굿닥 저장 / 차트 전달 / 차트 처리 성공을 서로 구분.
 * [보류] 주민번호 처리 근거·보관·삭제, 실제 장애 수용 조건, 재전송 계약.
 * [제외] 실제 주민번호·환자정보 입력/저장, 인증, API, DLL, 설치, WinUI 런타임.
 * [폐기] 환자 DB를 모든 업무 PC에 복제하거나 서버 장애까지 접수 성공으로 표시.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  VscAdd, VscArrowLeft, VscCalendar, VscCheck, VscChevronRight,
  VscChromeClose, VscChromeMaximize, VscChromeMinimize, VscChromeRestore,
  VscCircleFilled, VscClose, VscDebugDisconnect, VscEllipsis, VscInfo,
  VscPlug, VscRefresh, VscSearch, VscSettingsGear, VscWarning, VscWindow,
} from 'react-icons/vsc';

type Environment = 'normal' | 'chart-down' | 'chart-unresponsive' | 'unlinked' | 'server-down';
type Page = '홈' | '접수·예약' | '진료항목' | '진료실' | '의사' | '고객' | '병원 운영 설정';
type Delivery = 'waiting' | 'sending' | 'success' | 'failed' | 'not-sent' | 'skipped';
type Business = 'requested' | 'confirmed' | 'arrived' | 'waiting' | 'completed' | 'cancelled';
type Kind = '현장 접수' | '모바일 접수' | '진료실 예약' | '진료항목 예약';
type Entry = { id: number; kind: Kind; name: string; phone: string; time: string; room: string; item?: string; business: Business; delivery: Delivery; date: string; eligible: boolean; expired?: boolean; reason?: string; };
const DATE = '2026-10-01';
// 기존 브랜드 원본을 data URL로 번들한다. 별도 로고를 그리지 않는다.
const GOODOC_LOGO = require('../../../assets/curation-price/goodoc-logo.svg');
const NAV: Page[] = ['홈', '접수·예약', '진료항목', '진료실', '의사', '고객'];
const ENV_LABELS: Record<Environment, string> = {
  normal: '정상 연결', 'chart-down': '차트 연결 끊김', 'chart-unresponsive': '차트 응답 없음',
  unlinked: '차트 미연동', 'server-down': '굿닥 서버 끊김',
};
const INITIAL: Entry[] = [
  { id: 1, kind: '진료항목 예약', name: '박*희', phone: '010-****-1234', time: '10:40', room: '미지정', item: '독감 백신 · 방문 후 결정', business: 'confirmed', delivery: 'not-sent', date: DATE, eligible: false },
  { id: 2, kind: '진료실 예약', name: '김*민', phone: '010-****-5678', time: '10:30', room: '내과 1진료실', business: 'arrived', delivery: 'failed', date: DATE, eligible: true },
  { id: 3, kind: '현장 접수', name: '이*수', phone: '010-****-9012', time: '10:20', room: '내과 2진료실', business: 'waiting', delivery: 'success', date: DATE, eligible: true },
  { id: 4, kind: '모바일 접수', name: '최*진', phone: '010-****-3456', time: '10:25', room: '내과 1진료실', business: 'waiting', delivery: 'success', date: DATE, eligible: true },
  { id: 5, kind: '진료항목 예약', name: '정*아', phone: '010-****-7890', time: '11:00', room: '미지정', item: 'HPV 백신 · 방문 후 결정', business: 'confirmed', delivery: 'not-sent', date: DATE, eligible: false },
  { id: 6, kind: '진료실 예약', name: '한*호', phone: '010-****-2468', time: '09:00', room: '내과 2진료실', business: 'completed', delivery: 'success', date: DATE, eligible: true },
  { id: 7, kind: '모바일 접수', name: '오*준', phone: '010-****-1357', time: '08:30', room: '내과 1진료실', business: 'requested', delivery: 'waiting', date: '2026-09-30', eligible: true, expired: true, reason: '신청 가능 시간이 지나 차트에 자동 전달하지 않습니다.' },
  { id: 8, kind: '진료실 예약', name: '임*연', phone: '010-****-9753', time: '11:20', room: '내과 2진료실', business: 'cancelled', delivery: 'skipped', date: DATE, eligible: true, reason: '차트 전달 전 취소된 신청입니다.' },
];
const BUSINESS_TEXT: Record<Business, string> = { requested: '신청 접수', confirmed: '예약 확정', arrived: '내원 확인됨', waiting: '대기 중', completed: '진료완료', cancelled: '취소됨' };
const DELIVERY_TEXT: Record<Delivery, string> = { waiting: '전달 대기', sending: '처리 확인 중', success: '처리 확인됨', failed: '전달 실패', 'not-sent': '미전달', skipped: '전달 제외' };
const FINISHED: Business[] = ['completed', 'cancelled'];
const fakePatients = ['송*우', '윤*서', '조*현', '백*원'];
const cloneInitial = () => INITIAL.map(row => ({ ...row }));
const isChartDown = (env: Environment) => env === 'chart-down' || env === 'chart-unresponsive';
const canReplay = (row: Entry) => row.eligible && !row.expired && !FINISHED.includes(row.business) && ['waiting', 'failed'].includes(row.delivery);

function Tag({ tone = 'gray', children }: { tone?: string; children: React.ReactNode }) { return <span className={`du-tag ${tone}`}>{children}</span>; }
function Hint({ warning = false, children }: { warning?: boolean; children: React.ReactNode }) { return <div className={`du-hint ${warning ? 'warning' : ''}`}>{warning ? <VscWarning /> : <VscInfo />}<div>{children}</div></div>; }

function Dialog({ title, children, onClose, large = false }: { title: string; children: React.ReactNode; onClose: () => void; large?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose); closeRef.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const panel = ref.current;
    panel?.querySelector<HTMLElement>('button, input, select, [tabindex="0"]')?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.stopPropagation(); closeRef.current(); }
      if (event.key === 'Tab' && panel) {
        const nodes = Array.from(panel.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), [tabindex="0"]'));
        const first = nodes[0], last = nodes[nodes.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener('keydown', key);
    return () => { document.removeEventListener('keydown', key); previous?.focus(); };
  }, []);
  return <div className="du-overlay" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}><div ref={ref} className={`du-dialog ${large ? 'large' : ''}`} role="dialog" aria-modal="true" aria-label={title}><div className="du-dialog-title"><h2>{title}</h2><button className="du-icon-button" aria-label="창 닫기" onClick={onClose}><VscClose /></button></div>{children}</div></div>;
}

export default function DeskUnified() {
  const [preview, setPreview] = useState(false);
  const [page, setPage] = useState<Page>('홈');
  const [environment, setEnvironment] = useState<Environment>('normal');
  const [entries, setEntries] = useState<Entry[]>(cloneInitial);
  const [menuOpen, setMenuOpen] = useState(false);
  const [settings, setSettings] = useState<'일반' | '차트 연동' | '연결 진단' | '프로그램 정보' | null>(null);
  const [chartEnabled, setChartEnabled] = useState(true);
  const [pcRole, setPcRole] = useState('차트 연결 PC');
  const [chartName, setChartName] = useState('K차트 (예시)');
  const [modulePrepared, setModulePrepared] = useState(true);
  const [testing, setTesting] = useState(false);
  const [windowState, setWindowState] = useState<'normal' | 'maximized' | 'minimized' | 'closed'>('normal');
  const [tab, setTab] = useState('전체');
  const [period, setPeriod] = useState('오늘');
  const [kind, setKind] = useState('전체');
  const [room, setRoom] = useState('전체');
  const [keyword, setKeyword] = useState('');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [register, setRegister] = useState(false);
  const [newKind, setNewKind] = useState<Kind>('모바일 접수');
  const [newPatient, setNewPatient] = useState(fakePatients[0]);
  const [newRoom, setNewRoom] = useState('내과 1진료실');
  const [newTime, setNewTime] = useState('11:30');
  const [requiresChartCheck, setRequiresChartCheck] = useState(false);
  const [recovery, setRecovery] = useState(false);
  const [busy, setBusy] = useState(false);
  const [autoConfirm, setAutoConfirm] = useState(true);
  const [toast, setToast] = useState('');
  const [guide, setGuide] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const timers = useRef<number[]>([]);
  const serverAvailable = environment !== 'server-down';
  const linked = chartEnabled && environment !== 'unlinked';
  const chartReady = linked && environment === 'normal' && serverAvailable;
  const pending = entries.filter(canReplay);
  const today = entries.filter(row => row.date === DATE);
  const selected = entries.find(row => row.id === selectedId);
  const notify = (text: string) => setToast(text);
  const later = (callback: () => void, delay: number) => { const timer = window.setTimeout(callback, delay); timers.current.push(timer); };
  useEffect(() => () => timers.current.forEach(window.clearTimeout), []);
  useEffect(() => { if (!toast) return; const timer = window.setTimeout(() => setToast(''), 3600); return () => window.clearTimeout(timer); }, [toast]);
  useEffect(() => {
    if (!menuOpen) return;
    menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
    const outside = (event: MouseEvent) => { if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false); };
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setMenuOpen(false); menuButton.current?.focus(); }
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault(); const items = Array.from(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') || []);
        const index = items.indexOf(document.activeElement as HTMLElement), direction = event.key === 'ArrowDown' ? 1 : -1;
        items[(index + direction + items.length) % items.length]?.focus();
      }
    };
    document.addEventListener('mousedown', outside); document.addEventListener('keydown', key);
    return () => { document.removeEventListener('mousedown', outside); document.removeEventListener('keydown', key); };
  }, [menuOpen]);
  const reset = () => {
    timers.current.forEach(window.clearTimeout); timers.current = [];
    setEntries(cloneInitial()); setEnvironment('normal'); setChartEnabled(true); setModulePrepared(true);
    setPage('홈'); setTab('전체'); setPeriod('오늘'); setKind('전체'); setRoom('전체'); setKeyword(''); setQuery('');
    setSelectedId(null); setRegister(false); setSettings(null); setRecovery(false); setBusy(false); setToast('체험 데이터를 초기화했습니다.');
  };
  const openSettings = (section: NonNullable<typeof settings>) => { setMenuOpen(false); setSettings(section); };
  const switchEnvironment = (value: Environment) => { setEnvironment(value); if (value === 'unlinked') setChartEnabled(false); else setChartEnabled(true); };
  const setChartConfiguration = (enabled: boolean) => {
    setChartEnabled(enabled);
    setEnvironment(previous => previous === 'server-down' ? previous : enabled ? 'chart-down' : 'unlinked');
  };
  const selectChart = (value: string) => {
    setChartName(value); setModulePrepared(false);
    setEnvironment(previous => previous === 'server-down' ? previous : 'chart-down');
  };
  const updateEntry = (id: number, patch: Partial<Entry>) => setEntries(list => list.map(row => row.id === id ? { ...row, ...patch } : row));
  const transmit = (ids: number[]) => {
    if (!serverAvailable || !linked) return;
    setBusy(true); setEnvironment('normal'); setRecovery(false);
    setEntries(list => list.map(row => ids.includes(row.id) && canReplay(row) ? { ...row, delivery: 'sending' } : row));
    later(() => {
      setEntries(list => list.map(row => ids.includes(row.id) && row.delivery === 'sending' && !FINISHED.includes(row.business) && !row.expired ? {
        ...row, delivery: 'success', business: row.business === 'requested' ? (row.kind.includes('예약') ? 'confirmed' : 'waiting') : row.business,
      } : row));
      setBusy(false); notify('차트의 처리 성공 응답을 확인했습니다. (체험)');
    }, 1500);
  };
  const saveRequest = (event: React.FormEvent) => {
    event.preventDefault();
    if (!serverAvailable) { notify('서버에 저장하지 못했습니다. 연결 복구 후 다시 신청해 주세요.'); return; }
    if (newKind !== '진료항목 예약' && requiresChartCheck && !chartReady) { notify('필수 환자 확인이 완료되지 않아 신청을 보류합니다.'); return; }
    const treatment = newKind === '진료항목 예약';
    const row: Entry = { id: Math.max(...entries.map(item => item.id)) + 1, kind: newKind, name: newPatient, phone: '010-****-0000', time: newTime, room: treatment ? '미지정' : newRoom, date: DATE,
      business: treatment ? (autoConfirm ? 'confirmed' : 'requested') : linked ? 'requested' : newKind.includes('예약') ? 'confirmed' : 'waiting',
      delivery: treatment ? 'not-sent' : linked ? 'waiting' : 'not-sent', eligible: !treatment,
      ...(treatment ? { item: '독감 백신 · 방문 후 결정' } : {}),
    };
    setEntries(list => [...list, row]); setRegister(false); setPage('접수·예약'); setTab('전체'); setKind('전체'); setRoom('전체'); setPeriod('오늘'); setQuery(''); setKeyword('');
    notify(linked && !treatment ? '신청을 저장했습니다. 차트 처리 결과는 아직 확인되지 않았습니다.' : '굿닥 신청을 저장했습니다. (체험)');
  };
  const filtered = useMemo(() => entries.filter(row => {
    if (period === '오늘' && row.date !== DATE) return false;
    if (kind !== '전체' && row.kind !== kind) return false;
    if (room !== '전체' && row.room !== room) return false;
    if (query && !`${row.name} ${row.phone} ${row.item || ''}`.includes(query)) return false;
    if (tab === '확인 필요') return !FINISHED.includes(row.business) && (row.business === 'requested' || row.business === 'confirmed' || ['failed', 'waiting'].includes(row.delivery));
    if (tab === '내원·대기') return ['arrived', 'waiting'].includes(row.business);
    if (tab === '지난 내역') return FINISHED.includes(row.business);
    return true;
  }), [entries, period, kind, room, query, tab]);
  const businessTag = (row: Entry) => <Tag tone={row.business === 'cancelled' ? 'red' : row.business === 'completed' ? 'gray' : row.business === 'waiting' ? 'amber' : 'blue'}>{BUSINESS_TEXT[row.business]}</Tag>;
  const deliveryTag = (row: Entry) => !linked ? <Tag>해당 없음</Tag> : <Tag tone={row.delivery === 'success' ? 'green' : row.delivery === 'failed' ? 'red' : row.delivery === 'waiting' || row.delivery === 'sending' ? 'amber' : 'gray'}>{row.expired ? '확인 필요' : DELIVERY_TEXT[row.delivery]}</Tag>;
  const table = (rows: Entry[], compact = false) => <div className="du-table-scroll"><table className={`du-table ${compact ? 'compact' : ''}`}><thead><tr>{(compact ? ['환자', '신청 유형', '접수·방문 시각', '굿닥 상태', '차트 전달', '상세'] : ['신청 유형', '굿닥 상태', '접수·방문 시각', '진료실·진료항목', '환자', '차트 전달', '상세']).map(label => <th key={label}>{label}</th>)}</tr></thead><tbody>{rows.map(row => <tr key={row.id}>{compact ? <><td><strong>{row.name}</strong></td><td>{row.kind}</td><td>{row.date === DATE ? '오늘' : '9/30'} {row.time}</td><td>{businessTag(row)}</td><td>{deliveryTag(row)}</td></> : <><td>{row.kind}</td><td>{businessTag(row)}</td><td>{row.date} {row.time}</td><td>{row.item || row.room}{row.item && <small>가격 미정</small>}</td><td><strong>{row.name}</strong><small>{row.phone}</small></td><td>{deliveryTag(row)}</td></>}<td><button className={compact ? 'du-btn small' : 'du-link'} onClick={() => setSelectedId(row.id)} aria-label={`${row.name} 상세 보기`}>{compact ? '내역 보기' : '상세 보기'}</button></td></tr>)}</tbody></table>{rows.length === 0 && <div className="du-empty">조건에 맞는 내역이 없습니다.<button className="du-link" onClick={() => { setPeriod('최근 7일'); setTab('전체'); setKind('전체'); setRoom('전체'); setQuery(''); setKeyword(''); }}>전체 내역 보기</button></div>}</div>;

  if (!preview) return <div className="du-entry"><div className="du-entry-card"><Tag tone="amber">미승인 · 기획 검토용</Tag><h1>굿닥 데스크 통합 시안</h1><p>접수와 예약은 한곳에서,<br />차트 연결 상태는 별도로 확인합니다.</p><div className="du-entry-points"><span><VscCheck /> 프로그램 메뉴·환경 설정</span><span><VscCheck /> 차트 장애 중 신청과 복구</span><span><VscCheck /> 접수·예약 통합 목록</span></div><Hint>가상 데이터로만 동작합니다. 실제 차트 연결·프로그램 설치·환자정보 저장은 하지 않습니다.</Hint><button className="du-btn primary" onClick={() => setPreview(true)}>통합 데스크 시안 열기 <VscChevronRight /></button><small>승인된 제품이나 실제 배포 화면이 아닙니다.</small></div></div>;

  return <div className={`du-artboard ${windowState === 'maximized' ? 'maximized' : ''}`}>
    {['minimized', 'closed'].includes(windowState) ? <div className="du-paused"><VscWindow /><h2>{windowState === 'minimized' ? '데스크 창을 최소화했습니다.' : '데스크 창을 닫았습니다.'}</h2><p>브라우저 안에서만 창 제어를 체험합니다. 신청 데이터는 그대로 유지됩니다.</p><button className="du-btn primary" onClick={() => setWindowState('normal')}>데스크 다시 열기</button></div> : <div className="cn-screen du-shell">
      <header className="cn-titlebar du-titlebar"><div className="cn-ci"><img className="du-brand-logo" src={GOODOC_LOGO} alt="goodoc" /><span className="cn-ci-name">굿닥 데스크</span></div><div className="du-caption-group"><div className="du-program-menu" ref={menuRef}><button ref={menuButton} className={`cn-winbtn du-menu-button ${menuOpen ? 'active' : ''}`} aria-label="프로그램 메뉴" aria-haspopup="menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(value => !value)}><VscEllipsis /></button>{menuOpen && <div className="du-menu" role="menu" aria-label="프로그램 메뉴"><div className="du-menu-caption">프로그램</div><button role="menuitem" onClick={() => openSettings('일반')}><VscSettingsGear /> 프로그램 환경 설정</button><button role="menuitem" onClick={() => openSettings('연결 진단')}><VscPlug /> 연결 진단</button><button role="menuitem" onClick={() => openSettings('프로그램 정보')}><VscInfo /> 프로그램 정보</button><div className="du-menu-separator" /><button role="menuitem" onClick={() => { setMenuOpen(false); setWindowState('closed'); }}><VscChromeClose /> 종료 <small>체험</small></button></div>}</div><div className="cn-winctrls"><button className="cn-winbtn" aria-label="최소화" onClick={() => { setMenuOpen(false); setWindowState('minimized'); }}><VscChromeMinimize /></button><button className="cn-winbtn" aria-label={windowState === 'maximized' ? '이전 크기로 복원' : '최대화'} onClick={() => setWindowState(value => value === 'maximized' ? 'normal' : 'maximized')}>{windowState === 'maximized' ? <VscChromeRestore /> : <VscChromeMaximize />}</button><button className="cn-winbtn close" aria-label="프로그램 닫기" onClick={() => { setMenuOpen(false); setWindowState('closed'); }}><VscChromeClose /></button></div></div></header>
      <div className="du-preview-bar"><div><Tag tone="amber">기획 검토용</Tag><span>가상 데이터 · WinUI 창 동작을 모사한 웹 시안</span></div><div><label>체험 조건<select aria-label="체험 조건" value={environment} disabled={busy} onChange={event => switchEnvironment(event.target.value as Environment)}>{Object.entries(ENV_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label><button onClick={reset} className="du-link" disabled={busy}>초기화</button><button onClick={() => { setPreview(false); setMenuOpen(false); }} className="du-link" disabled={busy}>시안 끄기</button></div></div>
      <div className="cn-body du-body"><aside className="cn-nav du-nav"><div className="cn-nav-header">서비스 운영</div><div className="du-hospital">굿닥의원 <Tag>예시</Tag></div><nav aria-label="병원 업무 메뉴">{NAV.map(item => <button key={item} onClick={() => setPage(item)} className={`cn-nav-item ${page === item ? 'active' : ''}`}><span className="cn-nav-label">{item}</span></button>)}</nav><div className="du-nav-bottom"><button className="cn-nav-item" onClick={() => setGuide('고객센터')}><span className="cn-nav-label">고객센터</span></button><button className={`cn-nav-item ${page === '병원 운영 설정' ? 'active' : ''}`} onClick={() => setPage('병원 운영 설정')}><span className="cn-nav-label">병원 운영 설정</span></button><div className={`du-server-state ${serverAvailable ? 'good' : 'bad'}`}><VscCircleFilled /> {serverAvailable ? '굿닥 서버 연결됨' : '굿닥 서버 연결 끊김'}</div></div></aside>
      <main className="cn-main du-main"><div className="du-page-head"><div><h1>{page === '접수·예약' ? '접수·예약 현황' : page}</h1><p>{page === '홈' ? '오늘의 접수와 예약을 확인하세요.' : page === '접수·예약' ? '접수와 예약의 진행 상태를 한곳에서 확인합니다.' : page === '병원 운영 설정' ? '병원의 신청·운영 정책을 설정합니다. 프로그램 설정과는 별개입니다.' : '같은 병원의 서버 정보를 함께 확인합니다. 가상 데이터입니다.'}</p></div><span className="du-updated"><VscCheck /> {serverAvailable ? '방금 업데이트됨 (체험)' : '연결 전 조회 내역'}</span></div>
      {!serverAvailable ? <div className="du-status-banner red"><VscWarning /><div><strong>굿닥 서버에 연결할 수 없습니다.</strong><p>보이는 내역은 마지막 조회 예시입니다. 새 신청·상태 변경은 저장할 수 없습니다.</p></div><button className="du-btn" onClick={() => switchEnvironment('normal')}>서버 복구 체험</button></div> : linked && isChartDown(environment) ? <div className="du-status-banner amber"><VscDebugDisconnect /><div><strong>{environment === 'chart-down' ? '차트 연결이 끊겼습니다.' : '프로그램은 연결됐지만 차트가 응답하지 않습니다.'}</strong><p>굿닥에는 신청을 받아둘 수 있습니다. 차트 접수 완료·실제 대기순서는 아직 확인되지 않습니다.</p></div><button className="du-btn" disabled={busy} onClick={() => setRecovery(true)}>복구·전달 체험</button></div> : !linked ? <div className="du-status-banner neutral"><VscInfo /><div><strong>차트 미연동으로 사용 중입니다.</strong><p>굿닥 신청을 관리합니다. 차트 전달 버튼은 제공하지 않습니다.</p></div></div> : null}
      {page === '홈' && <><div className="du-metrics">{[['오늘 신청', today.length], ['내원 확인 필요', today.filter(row => row.business === 'confirmed').length], ['대기 중', today.filter(row => row.business === 'waiting').length], ['차트 전달 확인', linked ? pending.length : 0]].map(([label, count], index) => <button key={label} onClick={() => { setPage('접수·예약'); setTab(index === 1 || index === 3 ? '확인 필요' : index === 2 ? '내원·대기' : '전체'); }}><span>{label}</span><strong>{count}</strong></button>)}<small>예시 데이터</small></div><section className="du-connection"><h2>연결 상태</h2><span className={serverAvailable ? 'good' : 'bad'}><VscCircleFilled /> 굿닥 서버 {serverAvailable ? '정상' : '연결 끊김'}</span><span className={chartReady ? 'good' : 'amber-text'}><VscCircleFilled /> {chartReady ? '차트 연동 정상' : !linked ? '차트 미연동' : '차트 연결 확인 필요'}</span><button className="du-link" onClick={() => openSettings('차트 연동')}>프로그램 연동 설정</button><p>업무용 PC는 같은 내부망이 아니어도 서버에 연결해 같은 병원 내역을 확인합니다. (검토안)</p></section><section className="du-section"><div className="du-section-head"><h2>확인이 필요한 접수·예약</h2><button className="du-btn primary" onClick={() => setPage('접수·예약')}>전체 접수·예약 보기</button></div>{table(today.filter(row => !FINISHED.includes(row.business) && ['confirmed', 'arrived', 'requested'].includes(row.business)).slice(0, 3), true)}</section><section className="du-section"><h2>공지·운영 안내</h2><div className="du-notices">{['차트 연결 확인 방법', '진료항목 예약 관리 안내', '데스크 이용 가이드'].map((item, index) => <button key={item} onClick={() => setGuide(item)}><strong>{item}</strong><span>{index === 0 ? '연결 상태와 미전달 신청을 확인하세요.' : index === 1 ? '방문 후 결정 예약도 같은 내역에서 확인합니다.' : '프로그램 설정과 병원 운영 설정을 구분합니다.'}</span><small>2026.10.01</small><VscChevronRight /></button>)}</div></section></>}
      {page === '접수·예약' && <><div className="du-tabs">{['전체', '확인 필요', '내원·대기', '지난 내역'].map(item => <button key={item} aria-pressed={tab === item} onClick={() => setTab(item)} className={tab === item ? 'active' : ''}>{item}</button>)}</div><form className="du-filters" onSubmit={event => { event.preventDefault(); setQuery(keyword.trim()); }}><div className="du-filter-line"><span>기간</span><div className="du-period">{['오늘', '최근 7일'].map(item => <button type="button" key={item} className={`du-btn ${period === item ? 'selected' : ''}`} onClick={() => setPeriod(item)}>{item}</button>)}</div><span className="du-date"><VscCalendar /> 2026.10.01 (목)</span><label>신청 유형<select value={kind} onChange={event => setKind(event.target.value)} aria-label="신청 유형 필터">{['전체', '현장 접수', '모바일 접수', '진료실 예약', '진료항목 예약'].map(item => <option key={item}>{item}</option>)}</select></label><label>진료실<select aria-label="진료실 필터" value={room} onChange={event => setRoom(event.target.value)}>{['전체', '내과 1진료실', '내과 2진료실', '미지정'].map(item => <option key={item}>{item}</option>)}</select></label></div><div className="du-filter-line"><label htmlFor="du-search">검색</label><div className="du-search"><VscSearch /><input id="du-search" placeholder="예시 환자명·전화번호·진료항목" value={keyword} onChange={event => setKeyword(event.target.value)} /></div><div className="du-filter-actions"><button type="button" className="du-btn" onClick={() => { setKeyword(''); setQuery(''); setKind('전체'); setRoom('전체'); setPeriod('오늘'); }}>초기화</button><button type="submit" className="du-btn primary">검색</button></div></div></form><div className="du-list-head"><span>총 {filtered.length}건 · 예시 데이터</span><button className="du-btn primary" disabled={!serverAvailable || busy} onClick={() => setRegister(true)}><VscAdd /> 새 신청 체험</button></div>{table(filtered)}<div className="du-list-foot"><span><VscInfo /> 굿닥 상태와 차트 처리 결과는 별도로 표시합니다.</span><span>1 / 1</span></div></>}
      {page === '진료항목' && <section className="du-section"><Hint>관리 화면 구성 참고용입니다. 항목 선택 예약과 ‘방문 후 결정’ 예약은 접수·예약 메뉴에서 확인합니다.</Hint><div className="du-table-scroll"><table className="du-table"><thead><tr><th>진료항목</th><th>표시 가격</th><th>예약 접수</th></tr></thead><tbody>{[['독감 백신', '방문 후 결정 · 미정'], ['가다실 9가', '예시 가격 · 220,000원'], ['대상포진 백신', '방문 후 결정 · 미정']].map(([item, price]) => <tr key={item}><td>{item}</td><td>{price}</td><td><Tag tone="blue">사용 중 (예시)</Tag></td></tr>)}</tbody></table></div></section>}
      {page === '진료실' && <section className="du-section"><Hint>진료실은 서버에서 관리하는 구조의 시안입니다. 연동 차트와의 실제 변경 동기화는 구현하지 않았습니다.</Hint><table className="du-table"><thead><tr><th>진료실</th><th>진료과</th><th>담당 의사</th><th>접수·예약</th></tr></thead><tbody>{['1', '2'].map((id, index) => <tr key={id}><td>내과 {id}진료실</td><td>내과</td><td>{index === 0 ? '김*진' : '이*연'} 원장 (예시)</td><td><Tag tone="blue">사용 중</Tag></td></tr>)}</tbody></table></section>}
      {page === '의사' && <section className="du-section"><table className="du-table"><thead><tr><th>의사</th><th>진료과</th><th>진료실</th></tr></thead><tbody>{['김*진', '이*연'].map((name, index) => <tr key={name}><td>{name} 원장 (예시)</td><td>내과</td><td>내과 {index + 1}진료실</td></tr>)}</tbody></table></section>}
      {page === '고객' && <section className="du-section"><Hint>실제 환자정보는 사용하지 않습니다. 주민번호 원문 입력·조회·로컬 저장 기능이 없습니다.</Hint><table className="du-table"><thead><tr><th>예시 환자</th><th>전화번호</th><th>신청 내역</th></tr></thead><tbody>{Array.from(new Set(entries.map(row => row.name))).map(name => <tr key={name}><td>{name}</td><td>{entries.find(row => row.name === name)?.phone}</td><td><button className="du-link" onClick={() => { setPage('접수·예약'); setKeyword(name); setQuery(name); setPeriod('최근 7일'); setTab('전체'); setKind('전체'); setRoom('전체'); }}>내역 보기</button></td></tr>)}</tbody></table></section>}
      {page === '병원 운영 설정' && <section className="du-section du-settings-page"><div className="du-setting-row"><div><h2>진료항목 예약 자동 확정</h2><p>새 진료항목 신청 체험의 굿닥 예약 상태에 적용됩니다.</p></div><button className={`du-toggle ${autoConfirm ? 'on' : ''}`} role="switch" aria-checked={autoConfirm} aria-label="진료항목 예약 자동 확정" disabled={!serverAvailable} onClick={() => setAutoConfirm(value => !value)}>{autoConfirm ? 'ON' : 'OFF'}</button></div><Hint>차트 연동·프로그램 설치·업데이트 설정은 우측 상단 프로그램 메뉴에서 관리합니다.</Hint></section>}
      <div className="du-page-bottom">기획 검토용 · 실제 제품 동작 및 정책 승인과 무관한 시안</div></main></div>
    </div>}
    {settings && <Dialog title="프로그램 환경 설정" large onClose={() => { if (!testing) setSettings(null); }}><div className="du-native-badge"><VscWindow /> 프로그램 영역 · 병원 웹뷰와 별도</div><div className="du-settings-layout"><nav aria-label="프로그램 설정 메뉴">{(['일반', '차트 연동', '연결 진단', '프로그램 정보'] as const).map(item => <button className={settings === item ? 'active' : ''} key={item} onClick={() => setSettings(item)} disabled={testing}>{item}</button>)}</nav><div className="du-settings-content">
      {settings === '일반' && <><h3>일반</h3><div className="du-setting-row"><div><strong>이 PC의 역할</strong><p>업무용 PC도 인터넷으로 같은 병원 내역을 봅니다.</p></div><select value={pcRole} onChange={event => setPcRole(event.target.value)} aria-label="이 PC의 역할"><option>차트 연결 PC</option><option>업무용 PC</option></select></div><Hint>차트 연결 PC에서만 연동 모듈을 준비합니다. 업무용 PC에 환자 DB를 복제하지 않는 방향입니다.</Hint><button className="du-btn" onClick={() => setSettings('차트 연동')}>차트 연동 설정 보기</button></>}
      {settings === '차트 연동' && <>
        <h3>차트 연동</h3>
        <div className="du-setting-row"><div><strong>차트 연동 사용</strong><p>연동 가능한 차트를 사용하는 병원만 설정합니다.</p></div><button className={`du-toggle ${chartEnabled ? 'on' : ''}`} role="switch" aria-checked={chartEnabled} aria-label="차트 연동 사용" disabled={busy} onClick={() => setChartConfiguration(!chartEnabled)}>{chartEnabled ? 'ON' : 'OFF'}</button></div>
        {chartEnabled ? <>
          <label className="du-field">사용 중인 차트<select aria-label="사용 중인 차트" value={chartName} onChange={event => selectChart(event.target.value)}><option>K차트 (예시)</option><option>지원 차트 선택 (예시)</option></select></label>
          <label className="du-field">이 PC의 역할<select value={pcRole} onChange={event => setPcRole(event.target.value)}><option>차트 연결 PC</option><option>업무용 PC</option></select></label>
          <div className="du-module"><VscPlug /><div><strong>{pcRole === '업무용 PC' ? '이 PC에는 연동 모듈이 필요하지 않습니다.' : modulePrepared ? '연동 모듈 준비됨 (체험)' : '연동 모듈 준비가 필요합니다.'}</strong><p>{pcRole === '업무용 PC' ? '차트 연결 PC에서 연결 상태를 확인하세요.' : '실제 DLL 설치나 프로그램 다운로드는 하지 않습니다.'}</p></div>{pcRole === '차트 연결 PC' && <button className="du-btn" disabled={testing || busy} onClick={() => { setModulePrepared(true); notify('연동 모듈 준비를 체험했습니다. 실제 설치는 하지 않았습니다.'); }}>모듈 준비 체험</button>}</div>
          <button className="du-btn primary" disabled={testing || busy || !serverAvailable || !modulePrepared} onClick={() => { setTesting(true); later(() => { setTesting(false); notify(isChartDown(environment) ? '차트 연결을 확인하지 못했습니다. 연결 진단을 확인하세요.' : '연결 테스트에 성공했습니다. (체험)'); }, 900); }}>{testing ? '연결 확인 중…' : '연결 테스트 (체험)'}</button>
        </> : <Hint>차트에 전달하지 않고 굿닥 신청 내역만 관리합니다.</Hint>}
      </>}
      {settings === '연결 진단' && <><h3>연결 진단</h3><dl className="du-diagnostics"><div><dt>굿닥 서버</dt><dd><Tag tone={serverAvailable ? 'green' : 'red'}>{serverAvailable ? '정상' : '연결 끊김'}</Tag></dd></div><div><dt>차트 연결</dt><dd><Tag tone={chartReady ? 'green' : 'amber'}>{chartReady ? '정상' : !linked ? '미사용' : '확인 필요'}</Tag></dd></div><div><dt>전달 가능한 대기 신청</dt><dd>{linked ? pending.length : 0}건</dd></div><div><dt>업무 데이터 기준</dt><dd>굿닥 서버 (검토안)</dd></div><div><dt>로컬 환자 DB</dt><dd>복제하지 않음 (검토안)</dd></div></dl><Hint>차트 연결과 굿닥 서버 연결은 서로 다른 상태입니다. 차트 처리 성공 응답 전에는 접수 완료로 판단하지 않습니다.</Hint><button className="du-btn" disabled={!serverAvailable || !linked || busy} onClick={() => { setSettings(null); setRecovery(true); }}>복구·대기 신청 확인</button></>}
      {settings === '프로그램 정보' && <><h3>굿닥 데스크 통합 시안</h3><p className="du-readable">버전 0.1 · 기획 검토용</p><p className="du-readable">WinUI 3 타이틀바·프로그램 메뉴의 배치를 브라우저에서 모사합니다. 실제 WinUI 앱이나 설치 프로그램이 아닙니다.</p><Hint>새로고침하면 가상 신청 데이터가 초기화됩니다. 외부 전송·로그인·주민번호 저장은 없습니다.</Hint></>}
    </div></div><div className="du-dialog-footer"><button className="du-btn primary" disabled={testing} onClick={() => setSettings(null)}>닫기</button></div></Dialog>}
    {register && <Dialog title="새 신청 체험" onClose={() => setRegister(false)}><form onSubmit={saveRequest}>
      <Hint>신청서 입력을 모사하는 병원용 검증 도구입니다. 실제 환자정보를 입력하지 마세요.</Hint>
      <div className="du-form-grid"><label className="du-field">신청 유형<select value={newKind} onChange={event => setNewKind(event.target.value as Kind)}>{['모바일 접수', '현장 접수', '진료실 예약', '진료항목 예약'].map(item => <option key={item}>{item}</option>)}</select></label><label className="du-field">예시 환자<select value={newPatient} onChange={event => setNewPatient(event.target.value)}>{fakePatients.map(item => <option key={item}>{item}</option>)}</select></label><label className="du-field">진료실<select disabled={newKind === '진료항목 예약'} value={newRoom} onChange={event => setNewRoom(event.target.value)}><option>내과 1진료실</option><option>내과 2진료실</option></select></label><label className="du-field">오늘 접수·방문 시각<select value={newTime} onChange={event => setNewTime(event.target.value)}>{['11:30', '12:00', '14:00', '15:00', '16:00'].map(item => <option key={item}>{item}</option>)}</select></label></div>
      {newKind === '진료항목 예약' && <div className="du-form-note">선택 항목: 독감 백신 · 방문 후 결정 / 가격: 미정<br />진료항목 예약은 이 단계에서 차트 접수를 만들지 않습니다.</div>}
      {newKind !== '진료항목 예약' && <label className="du-checkbox"><input type="checkbox" checked={requiresChartCheck} onChange={event => setRequiresChartCheck(event.target.checked)} /> 재진 전용 등 차트 환자 확인이 필수인 조건 체험</label>}
      {newKind !== '진료항목 예약' && requiresChartCheck && !chartReady ? <Hint warning>필수 차트 확인을 완료하지 못했습니다. 신청을 통과시키지 않고 보류합니다.</Hint> : linked && isChartDown(environment) && newKind !== '진료항목 예약' ? <Hint warning>굿닥에 신청만 저장합니다. 실제 차트 접수와 대기순서는 복구 후 확인합니다.</Hint> : <Hint>신청 저장과 차트 처리 결과를 별도로 확인합니다.</Hint>}
      <div className="du-dialog-footer"><button type="button" className="du-btn" onClick={() => setRegister(false)}>취소</button><button type="submit" className="du-btn primary" disabled={!serverAvailable || (requiresChartCheck && !chartReady && newKind !== '진료항목 예약')}>신청 저장 체험</button></div>
    </form></Dialog>}
    {selected && <Dialog title="접수·예약 상세" onClose={() => setSelectedId(null)}><div className="du-patient-title"><strong>{selected.name}</strong><span>{selected.phone}</span>{businessTag(selected)}</div><dl className="du-detail"><div><dt>신청 유형</dt><dd>{selected.kind}</dd></div><div><dt>접수·방문 시각</dt><dd>{selected.date} {selected.time}</dd></div><div><dt>진료실·진료항목</dt><dd>{selected.item || selected.room}</dd></div>{selected.item && <div><dt>가격</dt><dd>미정</dd></div>}<div><dt>차트 전달</dt><dd>{deliveryTag(selected)}</dd></div></dl>{selected.reason ? <Hint warning>{selected.reason}</Hint> : selected.delivery !== 'success' && linked ? <Hint warning>굿닥에 저장된 내역입니다. 차트 처리 완료를 의미하지 않으며 실제 대기순서는 확인되지 않았습니다.</Hint> : <Hint>{linked ? '차트 처리 성공 응답이 확인된 예시입니다. 실제 순번은 표시하지 않습니다.' : '차트 미연동 병원은 굿닥 신청 상태만 관리합니다.'}</Hint>}{linked && selected.kind === '진료항목 예약' && !selected.eligible && !FINISHED.includes(selected.business) && <p className="du-readable">내원 확인 후 필요한 환자 확인·진료실 배정 절차를 거쳐 차트 접수할 수 있습니다. 이 시안에서는 가상 데이터로 체험합니다.</p>}<div className="du-dialog-footer"><button className="du-btn" onClick={() => setSelectedId(null)}>닫기</button>{!FINISHED.includes(selected.business) && !selected.expired && <><button className="du-btn danger" disabled={!serverAvailable || selected.delivery === 'sending'} onClick={() => { if (selected.delivery === 'success') { notify('차트 처리된 건의 취소 연동은 이번 체험 범위가 아닙니다.'); return; } updateEntry(selected.id, { business: 'cancelled', delivery: 'skipped', reason: '차트 전달 전 취소된 신청입니다.' }); notify('신청을 취소했습니다. 복구 시 차트에 전달하지 않습니다. (체험)'); }}>신청 취소</button>{selected.business === 'confirmed' && <button className="du-btn primary" disabled={!serverAvailable} onClick={() => { updateEntry(selected.id, { business: 'arrived', eligible: true, delivery: linked ? 'waiting' : 'not-sent' }); notify('굿닥 내원 확인을 저장했습니다. 차트 처리는 별도입니다. (체험)'); }}>내원 확인 체험</button>}{linked && canReplay(selected) && <button className="du-btn primary" disabled={!chartReady || busy} onClick={() => transmit([selected.id])}>차트 전달 체험</button>}</>}</div></Dialog>}
    {recovery && <Dialog title="차트 복구·대기 신청 확인" large onClose={() => setRecovery(false)}><Hint>연결·환자·신청의 유효성을 다시 확인하고, 차트 성공 응답까지 받아야 처리 완료입니다. 아래 판정은 가상 예시입니다.</Hint><div className="du-recovery-summary"><strong>전달 가능 {pending.length}건</strong><span>취소·시간 만료·내원 전 진료항목 예약은 자동 전달하지 않습니다.</span></div><div className="du-table-scroll"><table className="du-table"><thead><tr><th>환자</th><th>신청 유형</th><th>판정</th></tr></thead><tbody>{entries.filter(row => ['waiting', 'failed', 'skipped'].includes(row.delivery) || row.expired).map(row => <tr key={row.id}><td>{row.name}</td><td>{row.kind}</td><td>{canReplay(row) ? <Tag tone="blue">전달 가능</Tag> : <Tag>{row.business === 'cancelled' ? '취소 · 제외' : row.expired ? '시간 만료 · 확인 필요' : '자동 전달 제외'}</Tag>}</td></tr>)}</tbody></table></div><p className="du-readable">실서비스에서는 병원이 차트에 수기로 등록한 신청과의 중복도 확인해야 합니다. 주민번호 임시 보관은 법무·보안 승인 전 확정하지 않습니다.</p><div className="du-dialog-footer"><button className="du-btn" onClick={() => setRecovery(false)}>닫기</button><button className="du-btn primary" disabled={!serverAvailable || !linked || busy} onClick={() => { if (pending.length) transmit(pending.map(row => row.id)); else { setEnvironment('normal'); setRecovery(false); notify('차트 연결을 복구했습니다. 전달 대상은 없습니다. (체험)'); } }}>연결 복구 후 전달 체험</button></div></Dialog>}
    {guide && <Dialog title={guide} onClose={() => setGuide(null)}><div className="du-guide"><p>1. 우측 상단 프로그램 메뉴에서 차트 연결을 확인합니다.</p><p>2. 접수·예약에서 굿닥 상태와 차트 전달 결과를 구분합니다.</p><p>3. 차트가 끊기면 신청은 전달 대기로 관리하고, 복구 후 유효한 신청만 처리합니다.</p><Hint>고객센터와 공지의 상세 콘텐츠는 이번 프로토타입 범위가 아닙니다.</Hint></div></Dialog>}
    {toast && <div className="du-toast" role="status"><VscCheck />{toast}</div>}
  </div>;
}
