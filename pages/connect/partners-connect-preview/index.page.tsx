import React, { useEffect, useMemo, useRef, useState } from 'react';
import captures from './captured-source.json';

type View = 'dashboard' | 'receipts' | 'history' | 'reservations' | 'itemReservations' | 'rooms' | 'roomDetail' | 'patients' | 'items' | 'itemCreate' | 'operation' | 'itemOperation' | 'settings';
const DATA = captures as Record<string, string>;
const SOURCES: Record<View, string> = {
  dashboard: 'desk-dashboard', receipts: 'desk-active-receipts', history: 'desk-receipts',
  reservations: 'desk-reservations', itemReservations: 'connect-item-reservations',
  rooms: 'desk-rooms', roomDetail: 'connect-room-detail', patients: 'desk-patients',
  items: 'connect-items', itemCreate: 'connect-item-create', operation: 'connect-operation',
  itemOperation: 'connect-item-operation', settings: 'desk-settings',
};
const LABELS: Record<View, string> = {
  dashboard: '대시보드', receipts: '접수 현황', history: '접수 내역', reservations: '진료실 예약',
  itemReservations: '진료 항목 예약', rooms: '진료실', roomDetail: '진료실 상세', patients: '환자',
  items: '진료 항목', itemCreate: '진료 항목 추가', operation: '진료실 운영 설정',
  itemOperation: '진료 항목 예약 설정', settings: '환경 설정',
};
const ROUTES: Record<string, View> = {
  '/home': 'dashboard', '/receipts': 'receipts', '/patients/history': 'history',
  '/appointment/list': 'reservations', '/examRooms': 'rooms', '/desk/operation/examRooms': 'rooms',
  '/examRooms/detail': 'roomDetail', '/patients/manage': 'patients',
  '/non-payment-reservations/treatment-item-appt': 'itemReservations',
  '/non-payment-reservations/treatment-items': 'items',
  '/non-payment-reservations/treatment-items/new': 'itemCreate',
  '/non-payment-reservations/operation': 'itemOperation', '/operation': 'operation',
  '/program/settings': 'settings',
};
const CHANGE_COPY: Record<View, string> = {
  dashboard: '데스크에서 확인하던 오늘 현황과 공지사항을 커넥트 웹뷰에서도 확인합니다.',
  receipts: '접수 현황을 웹뷰로 옮깁니다. 비연동 병원만 기존 접수 상태를 처리하고, 연동 병원은 차트에서 처리한 내용을 조회합니다.',
  history: '기존 진료 내역을 조회합니다. 접수·예약이나 환자 정보를 새로 만들거나 삭제하는 기능은 이번 범위에 없습니다.',
  reservations: '진료실 예약 목록·상세를 웹뷰로 옮깁니다. 비연동 병원만 기존 상태 처리를 할 수 있습니다.',
  itemReservations: '기존 진료 항목 예약을 별도로 유지합니다. 연동 병원의 상태 처리 권한은 진료실 예약과 구분해 검토 중입니다.',
  rooms: '비연동 병원은 진료실을 추가·수정·삭제할 수 있습니다. 연동 병원은 차트에서 가져온 진료실을 확인합니다. 생성만으로 서비스가 켜지지는 않습니다.',
  roomDetail: '진료실별 운영 설정을 유지합니다. 이번에는 새로운 진료 상품 레이어나 진료실별 연동 전환을 추가하지 않습니다.',
  patients: '환자 목록·검색·상세 조회를 옮깁니다. 환자 추가·수정·삭제는 제공하지 않으며 주민번호 뒷자리는 가립니다.',
  items: '기존 진료 항목·가격 옵션·노출 설정은 유지합니다. 이번 통합을 이유로 입력 체계를 새로 바꾸지는 않습니다.',
  itemCreate: '기존 진료 항목 입력 화면을 유지한 예시입니다. 입력은 이 화면 안에서만 체험할 수 있으며 실제 등록되지 않습니다.',
  operation: '병원과 굿닥 서비스 사이의 운영 설정은 웹뷰에서 관리합니다. 내 PC의 환경 설정과 구분합니다.',
  itemOperation: '기존 진료 항목 예약 설정을 유지합니다. 진료실 예약 설정과 다른 메뉴입니다.',
  settings: '이 화면은 웹 메뉴가 아니라 커넥트의 PC 환경 설정을 보여주는 참고 화면입니다. OS 알림 ON/OFF는 이 PC에만 적용됩니다.',
};
const SIDE_LINK = 'flex items-center gap-2 rounded-md px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-primary';
const CONTROL = 'inline-flex shrink-0 items-center justify-center rounded-md text-sm font-semibold whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50 border border-border bg-surface text-foreground hover:bg-muted min-h-9 px-3 py-1.5';
const escape = (value: string) => value.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));

function documentOf(key: string) { return new DOMParser().parseFromString(DATA[key], 'text/html'); }
function removeTestControls(doc: Document) {
  for (const label of Array.from(doc.querySelectorAll('label'))) {
    if (/다음 .*실패|지원 구성/.test(label.textContent || '')) label.remove();
  }
  for (const button of Array.from(doc.querySelectorAll('[aria-label="UI 상태 비교"], [aria-label="다음 예약 처리 결과 비교"]'))) {
    button.closest('.border-dashed')?.remove();
  }
  for (const p of Array.from(doc.querySelectorAll('main p'))) {
    if ((p.textContent || '').startsWith('UI/UX 확인 화면')) p.parentElement?.remove();
  }
  // Form resets/auth source handlers are not copied. No real account or key is required.
  doc.querySelectorAll('form').forEach(form => form.removeAttribute('action'));
  doc.querySelectorAll('[data-native-origin]').forEach(el => el.setAttribute('title', '기존 프로그램에서 제공하던 기능'));
}
function note(text: string) { return `<div class="preview-inline-note">${escape(text)}</div>`; }
function menuHtml(view: View, planned: boolean, linked: boolean) {
  if (!planned) {
    const doc = documentOf(linked ? 'connect-items' : 'desk-notifications');
    const nav = doc.querySelector('nav[aria-label="주 메뉴"]')!;
    nav.querySelector('.mt-auto')?.remove();
    // Open existing service groups so treatment items can be found without hunting.
    if (!linked) {
      const section = nav.querySelector('section[aria-label="굿닥 운영설정"]');
      if (section) section.innerHTML += `<div class="pl-4"><a class="${SIDE_LINK} text-foreground hover:bg-muted" href="#items" data-view="items">진료 항목</a><a class="${SIDE_LINK} text-foreground hover:bg-muted" href="#itemReservations" data-view="itemReservations">진료 항목 예약</a><a class="${SIDE_LINK} text-foreground hover:bg-muted" href="#operation" data-view="operation">진료실 운영 설정</a></div>`;
    }
    for (const a of Array.from(nav.querySelectorAll<HTMLAnchorElement>('a'))) {
      const route = a.getAttribute('data-source-route')?.split('?')[0];
      const destination = a.dataset.view || (route ? ROUTES[route] : undefined);
      a.removeAttribute('aria-current');
      if (destination) { a.dataset.view = destination; a.href = `#${destination}`; }
      a.classList.remove('bg-primary-subtle', 'font-semibold', 'text-primary');
      a.classList.add('text-foreground', 'hover:bg-muted');
      if (destination === view) { a.setAttribute('aria-current', 'page'); a.classList.add('bg-primary-subtle','font-semibold','text-primary'); }
    }
    return nav.outerHTML;
  }
  const native = '<span class="preview-menu-badge">PC</span>';
  const link = (target: View, text = LABELS[target], pc = false) => `<li><a class="${SIDE_LINK} ${target === view ? 'bg-primary-subtle font-semibold text-primary' : 'text-foreground hover:bg-muted'}" href="#${target}" data-view="${target}" ${target === view ? 'aria-current="page"' : ''}><span class="min-w-0">${escape(text)}</span>${pc ? native : ''}</a></li>`;
  const section = (title: string, content: string) => `<section aria-label="${title}"><h2 class="mb-2 flex items-center gap-2 px-3 text-xs font-semibold text-secondary"><span>${title}</span><span class="h-px flex-1 bg-border"></span></h2><ul class="space-y-1 pl-4">${content}</ul></section>`;
  const hospitalMenu = documentOf('connect-items').querySelector('nav section[aria-label="병원 관리"]')?.outerHTML || '';
  return `<nav aria-label="주 메뉴" class="flex h-full flex-col gap-4 px-3 py-4">${link('dashboard')}
    ${hospitalMenu}
    ${section('접수', link('receipts') + link('history') + link('operation','접수 설정'))}
    ${section('예약', link('reservations') + link('itemReservations') + link('operation','진료실 예약 설정'))}
    ${section('기본 정보', link('rooms') + link('patients') + link('items'))}
    ${section('서비스 운영', link('itemOperation') + '<li><button class="preview-side-other" data-help="기존 병원 약관·외부 플랫폼 설정은 유지합니다. 이번 미리보기에서는 핵심 업무 화면만 복제했습니다.">병원 약관·외부 플랫폼</button></li>')}
    ${section('이 PC 설정', link('settings','환경 설정',true))}
    <div class="mt-auto border-t border-border px-3 pt-4 text-xs leading-5 text-secondary">제품키로 확인한 병원 권한의 웹뷰 예시<br>메뉴 구성은 피드백용 초안입니다.</div></nav>`;
}

function mainHtml(view: View, planned: boolean, linked: boolean) {
  const key = view === 'rooms' && linked ? 'connect-rooms' : SOURCES[view];
  const doc = documentOf(key);
  removeTestControls(doc);
  const main = doc.querySelector('main')!;
  if (planned) {
    main.querySelectorAll('[data-native-origin]').forEach(el => el.remove());
    if (view === 'patients') {
      main.querySelectorAll('button').forEach(b => { if (b.textContent?.trim() === '새 환자') b.remove(); });
    }
    if (view === 'reservations') {
      const input = main.querySelector<HTMLInputElement>('[aria-label="예약할 환자 검색"]');
      if (input) { input.disabled = true; input.placeholder = '직접 예약 생성은 이번 범위에서 제외'; }
    }
    if (view === 'receipts' && linked) {
      main.querySelectorAll<HTMLButtonElement>('button').forEach(b => {
        if (/진료차례 지정/.test(b.textContent || '')) { b.disabled = true; b.title = '차트에서 상태를 처리합니다.'; }
      });
      main.querySelectorAll('[draggable]').forEach(el => el.setAttribute('draggable','false'));
    }
    if (view === 'items' || view === 'itemCreate' || view === 'itemReservations' || view === 'itemOperation') {
      main.querySelectorAll('h1,h2,h3,label').forEach(el => { if (el.innerHTML.includes('진료항목')) el.innerHTML = el.innerHTML.replaceAll('진료항목','진료 항목'); });
    }
    main.insertAdjacentHTML('afterbegin', note(CHANGE_COPY[view]));
  }
  if (view === 'settings') {
    main.insertAdjacentHTML('afterbegin', note('PC 전용 환경 설정 참고 화면 · 실제 PC 설정이나 알림 권한은 변경되지 않습니다.'));
    main.querySelectorAll('button').forEach(b => {
      if (/해제|로그아웃/.test(b.textContent || '')) { b.disabled = true; b.title = '공유용 시안에서는 제품키 연결을 변경하지 않습니다.'; }
    });
  }
  main.querySelectorAll('[role="separator"]').forEach(el => { el.removeAttribute('tabindex'); el.setAttribute('aria-hidden','true'); });
  return main.outerHTML;
}

export default function PartnersConnectPreview() {
  const [planned, setPlanned] = useState(false);
  const [linked, setLinked] = useState(false);
  const [view, setView] = useState<View>('dashboard');
  const [mobileMenu, setMobileMenu] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [modal, setModal] = useState<{kind: string; name?: string} | null>(null);
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');
  const contentRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const nav = useMemo(() => menuHtml(view, planned, linked), [view,planned,linked]);
  const html = useMemo(() => mainHtml(view, planned, linked), [view,planned,linked]);
  useEffect(() => { if (!message) return; const timer = window.setTimeout(() => setMessage(''),4500); return () => window.clearTimeout(timer); },[message]);
  useEffect(() => {
    if (!modal) { returnFocus.current?.focus(); return; }
    returnFocus.current = document.activeElement as HTMLElement;
    modalRef.current?.querySelector<HTMLElement>('button:not([disabled]), input:not([disabled])')?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setModal(null);
      if (event.key !== 'Tab' || !modalRef.current) return;
      const nodes = Array.from(modalRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), a[href], textarea:not([disabled]), [tabindex="0"]')).filter(n => n.offsetParent !== null);
      if (!nodes.length) return;
      const first = nodes[0], last = nodes[nodes.length-1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown',keydown);
    return () => document.removeEventListener('keydown',keydown);
  },[modal]);
  function navigate(next: View) { setView(next); setMobileMenu(false); setStatus(''); setModal(null); setMessage(''); window.scrollTo(0,0); }
  function open(kind: string, name?: string) { setStatus(''); setModal({kind,name}); }
  function switchHospital(next: boolean) {
    setLinked(next); setStatus(''); setModal(null);
    if (!planned) navigate(next ? 'operation' : 'dashboard');
  }
  function filterRows(input: HTMLInputElement) {
    const root = contentRef.current;
    if (!root || !/검색/.test(input.getAttribute('aria-label') || input.placeholder || '')) return;
    const term = input.value.trim();
    root.querySelectorAll<HTMLTableRowElement>('tbody tr').forEach(row => { row.hidden = !!term && !(row.textContent || '').includes(term); });
  }
  function interact(event: React.MouseEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement;
    const control = target.closest<HTMLElement>('a,button,tr[tabindex="0"]');
    if (!control) return;
    const name = control.getAttribute('aria-label') || control.textContent?.trim() || '';
    const text = control.textContent?.trim() || '';
    const destination = control.dataset.view as View | undefined;
    const route = control.getAttribute('data-source-route')?.split('?')[0];
    if (control.tagName === 'A') {
      event.preventDefault();
      const next = destination || (route && ROUTES[route]);
      if (next) { navigate(next); return; }
      setMessage('이번 미리보기에는 핵심 업무 화면만 포함했습니다. 기존 기능은 통합 후에도 유지하는 방향입니다.'); return;
    }
    if (control.dataset.help) { setMessage(control.dataset.help); return; }
    if (control instanceof HTMLButtonElement && control.disabled) return;
    if (control.closest('nav[aria-label="주 메뉴"]')) {
      const panel = control.nextElementSibling as HTMLElement | null;
      if (panel) { const expanded = control.getAttribute('aria-expanded') !== 'true'; control.setAttribute('aria-expanded',String(expanded)); panel.hidden = !expanded; }
      else setMessage('기존 병원 정보·외부 플랫폼 기능은 유지합니다. 이 시안에서는 업무 화면을 우선 비교해 주세요.');
      return;
    }
    if (name.includes('진료정보') && control.tagName === 'TR') { open('history',name.replace(' 진료정보','')); return; }
    if ((name.includes('예약 상세') || /가상예약환자/.test(text)) && view === 'reservations') { open('reservation',text); return; }
    if (view === 'itemReservations' && (/예약 상세/.test(name) || /가상 김환자/.test(text))) { open('item'); return; }
    if (view === 'patients' && /^가상환자\d+$/.test(text)) { open('patient',text); return; }
    if (view === 'receipts' && (/^가상 환자 [ABC]$/.test(text) || text === '상세')) { open('receipt',/^가상/.test(text) ? text : '가상 환자 C'); return; }
    if (/복사|^⧉$/.test(name) || text === '⧉') { setMessage('공유용 시안에서는 환자 정보를 클립보드로 복사하지 않습니다.'); return; }
    if (control.getAttribute('role') === 'switch') {
      const checked = control.getAttribute('aria-checked') === 'true';
      control.setAttribute('aria-checked',String(!checked)); control.toggleAttribute('data-checked',!checked);
      setMessage('화면에서만 변경했습니다. 실제 설정·알림은 바뀌지 않습니다.'); return;
    }
    if (['예약 확정','예약 취소','내원 확정','진료 완료','진료완료','접수 취소','진료차례 지정'].includes(text)) {
      if (planned && linked && view !== 'itemReservations') { setMessage('연동 병원은 차트에서 상태를 처리합니다.'); return; }
      open(view === 'itemReservations' ? 'item' : view === 'receipts' ? 'receipt' : 'reservation'); return;
    }
    if (/새 진료실|^수정$|^삭제$/.test(text) && view === 'rooms') {
      setMessage(text === '삭제' ? '서비스와 연결된 진료실의 삭제 조건은 검토 중입니다. 이 시안에서는 삭제하지 않습니다.' : '비연동 병원은 진료실 추가·수정이 가능합니다. 이 미리보기에서는 실제 저장 없이 메뉴와 권한만 비교합니다.'); return;
    }
    if (text.includes('새 환자')) { setMessage('기존 데스크의 환자 추가 기능입니다. 통합안에서는 환자 조회만 제공하는 범위입니다.'); return; }
    if (text === '초기화') { contentRef.current?.querySelectorAll<HTMLInputElement>('input[aria-label*="검색"]').forEach(i => { i.value = ''; filterRows(i); }); return; }
    if (/검색|⌕/.test(text)) { contentRef.current?.querySelectorAll<HTMLInputElement>('input[aria-label*="검색"]').forEach(filterRows); setMessage('가상 데이터에서 검색했습니다.'); return; }
    if (/취소$/.test(text) && view === 'itemCreate') { navigate('items'); return; }
    if (/등록|저장|사진 추가|순서|설정|정상|미리보기|정보 수정|수정/.test(text + name)) { setMessage('현재 화면은 피드백용 예시입니다. 실제 저장·업로드·차트 처리 없이 화면만 확인합니다.'); return; }
    setMessage('메뉴·조회·상세와 병원 유형별 권한을 비교하는 미리보기입니다. 실제 업무 처리는 실행하지 않습니다.');
  }
  const modalHtml = useMemo(() => {
    if (!modal) return '';
    const key = {reservation:'reservation-detail',history:'receipt-detail',receipt:'active-receipt-detail',patient:'patient-detail',item:'item-reservation-detail'}[modal.kind];
    if (!key) return '';
    const doc = documentOf(key); const dialog = doc.querySelector('[role="dialog"]')!;
    dialog.setAttribute('aria-modal','true');
    dialog.classList.add('preview-source-dialog');
    if (modal.name && modal.kind !== 'item') {
      const from = modal.kind === 'reservation' ? '가상예약환자1' : modal.kind === 'receipt' ? '가상 환자 C' : '가상환자1';
      dialog.innerHTML = dialog.innerHTML.replaceAll(from,escape(modal.name));
    }
    if (planned) {
      dialog.querySelectorAll<HTMLButtonElement>('button').forEach(b => {
        const text = b.textContent?.trim() || '';
        if (/정보 수정|^수정$|^삭제$/.test(text) || (modal.kind === 'patient' && text === '환자 정보 수정')) b.remove();
        if (linked && modal.kind !== 'item' && /취소|확정|완료/.test(text)) { b.disabled = true; b.title = '차트에서 처리합니다.'; }
      });
      dialog.insertAdjacentHTML('afterbegin',note(modal.kind === 'patient' ? '조회 전용 · 환자 정보 추가·수정·삭제 불가' : modal.kind === 'item' ? '진료 항목 예약의 연동 병원 처리 권한은 별도 검토 중입니다.' : linked ? '연동 병원 · 차트에서 상태 처리' : '비연동 병원 · 기존 상태 처리 가능'));
    }
    return dialog.outerHTML;
  },[modal,planned,linked]);
  function modalClick(event: React.MouseEvent<HTMLDivElement>) {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button');
    if (!button || button.disabled) return;
    const text = button.textContent?.trim() || '';
    if (/닫기/.test(text) || button.getAttribute('aria-label') === '닫기') { setModal(null); return; }
    if (/복사|⧉/.test(text + button.getAttribute('aria-label'))) { setMessage('가상 정보이며 실제 복사는 실행하지 않습니다.'); return; }
    if (/취소|확정|완료/.test(text)) { setStatus(`“${text}” 버튼을 눌렀습니다. 화면 확인용이며 실제 상태·알림은 변경하지 않습니다.`); return; }
    setMessage('실제 환자 정보는 변경하지 않습니다.');
  }
  return <div className="preview-app" data-preview-version="2026-10-08-v1.0">
    <section className="preview-tools" aria-label="공유용 미리보기 설정">
      <div className="preview-tools-title"><strong>4.2 커넥트 웹뷰 미리보기</strong><span>제품키 권한 · 가상 병원</span><span className="preview-draft">검토용 초안</span></div>
      <div className="preview-tool-row">
        <div className="preview-segment" role="group" aria-label="현재 화면과 통합안 비교">
          <button aria-pressed={!planned} onClick={() => {setPlanned(false);navigate(linked ? 'operation' : 'dashboard');}}>현재 화면</button>
          <button aria-pressed={planned} onClick={() => {setPlanned(true);setModal(null);}}>통합 커넥트</button>
        </div>
        <div className="preview-segment" role="group" aria-label="병원 차트 유형 비교">
          <button aria-pressed={!linked} onClick={() => switchHospital(false)}>비연동 차트 병원</button>
          <button aria-pressed={linked} onClick={() => switchHospital(true)}>연동 차트 병원</button>
        </div>
        <button className="preview-explain" aria-expanded={drawer} onClick={() => setDrawer(!drawer)}>무엇이 달라지나요?</button>
      </div>
      <p className="preview-caption">{planned ? '미승인 통합안 · 같은 웹뷰, 병원 유형에 따라 업무 권한만 다릅니다.' : linked ? '현재 커넥트의 메뉴·화면 참고본' : '현재 데스크의 메뉴·화면 참고본'} · 실제 환자정보·제품키를 입력하지 마세요.</p>
    </section>
    {drawer && <section className="preview-comparison" aria-label="통합 전후 비교">
      <table><thead><tr><th>기능</th><th>비연동 병원</th><th>연동 병원</th></tr></thead><tbody>
        <tr><th>접수·진료실 예약</th><td>조회 + 기존 상태 처리</td><td>조회만 · 상태는 차트에서</td></tr>
        <tr><th>진료실</th><td>추가·수정·삭제</td><td>차트 진료실 조회</td></tr>
        <tr><th>환자</th><td colSpan={2}>목록·검색·상세 조회 / 주민번호 뒷자리 마스킹</td></tr>
        <tr><th>진료 항목·예약</th><td colSpan={2}>기존 기능 유지 / 연동 병원 예약 처리 권한은 별도 검토</td></tr>
        <tr><th>환경 설정·OS 알림</th><td colSpan={2}>웹이 아닌 커넥트의 PC 환경 설정에 유지</td></tr>
      </tbody></table><p>이번에는 기존 기능의 안정적인 이관이 우선입니다. 로그인·계정 관리·새 상품 레이어는 이 미리보기 범위가 아닙니다. 병원 유형 토글은 비교 도구이며 실제 차트 연결을 켜고 끄는 설정이 아닙니다.</p>
    </section>}
    <div className="preview-mobile-bar"><button className={CONTROL} aria-expanded={mobileMenu} onClick={() => setMobileMenu(!mobileMenu)}>전체 메뉴</button><span>{LABELS[view]}</span></div>
    <div className="preview-workspace">
      <aside className={`preview-sidebar ${mobileMenu ? 'is-open' : ''}`} onClick={interact} dangerouslySetInnerHTML={{__html:nav}} />
      <div ref={contentRef} className="preview-content" onClick={interact} onInput={e => { if(e.target instanceof HTMLInputElement) filterRows(e.target); }} onSubmit={e => e.preventDefault()} onKeyDown={e => { if(e.key === 'Enter' && (e.target as HTMLElement).matches('tr[tabindex="0"]')) { const target=e.target as HTMLElement; open('history',target.getAttribute('aria-label')?.replace(' 진료정보','')); } }} dangerouslySetInnerHTML={{__html:html}} />
    </div>
    {message && <div className="preview-toast" role="status">{message}</div>}
    {modal && <div className="preview-modal-backdrop" onMouseDown={e => {if(e.target === e.currentTarget) setModal(null);}}><div ref={modalRef} className="preview-modal-host" onClick={modalClick} dangerouslySetInnerHTML={{__html:modalHtml}} />{status && <div className="preview-status" role="status">{status}</div>}</div>}
  </div>;
}
