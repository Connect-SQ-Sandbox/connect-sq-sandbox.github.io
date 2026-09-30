/**
 * application-unified — 접수·예약 결과 재현 (goodoc-mobile production @1ebac45ab)
 * - 420 미리접수: ReceiptCompleteScreen(전용 화면)
 * - 420 예약 / 진료항목 예약: RequestResultBottomSheetModal(닫을 수 없는 결과 시트)
 * 결과 아이콘은 앱에서 Lottie(ico_progress/ico_complete/ico_cancel 56x56)라 CSS 도형으로 대체했다.
 */
import React, { useState } from 'react';

export type PatientStatus = 'pending' | 'success' | 'failure' | 'requestFail';
export type FailReason = 'ExamClosed' | 'OverCapacity' | 'ServerError';
export type ReceiptPatientResult = { id: string; name: string; status: PatientStatus; reason?: FailReason };

export type ApptResult = 'loading' | 'success' | 'successRequest' | 'notExistedSlots' | 'closedToday' | 'failure';
export type TiResult = 'loading' | 'success' | 'successRequest' | 'notExistedSlots' | 'notExistedItem' | 'failure';

const PROFILE_COLORS = ['#94C9FF', '#76E3D0', '#CACED8', '#FFE99C', '#FFD1E2', '#E2D8FF'];
const hashColor = (name: string) => PROFILE_COLORS[Array.from(name).reduce((a, c) => a + c.charCodeAt(0), 0) % PROFILE_COLORS.length];

const IcClose = () => (<svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M1.70711 0.292893C1.31658 -0.0976311 0.683417 -0.0976311 0.292893 0.292893C-0.0976311 0.683417 -0.0976311 1.31658 0.292893 1.70711L6.58579 8L0.292893 14.2929C-0.0976311 14.6834 -0.0976311 15.3166 0.292893 15.7071C0.683417 16.0976 1.31658 16.0976 1.70711 15.7071L8 9.41421L14.2929 15.7071C14.6834 16.0976 15.3166 16.0976 15.7071 15.7071C16.0976 15.3166 16.0976 14.6834 15.7071 14.2929L9.41421 8L15.7071 1.70711C16.0976 1.31658 16.0976 0.683417 15.7071 0.292893C15.3166 -0.0976311 14.6834 -0.0976311 14.2929 0.292893L8 6.58579L1.70711 0.292893Z" fill="#303642" /></svg>);
const IcProfile = ({ color }: { color: string }) => (<svg width="28" height="28" viewBox="0 0 48 49" fill="none"><circle cx="24" cy="24.5" r="24" fill={color} /><path d="M20 19C20 20.3807 18.8807 21.5 17.5 21.5C16.1193 21.5 15 20.3807 15 19C15 17.6193 16.1193 16.5 17.5 16.5C18.8807 16.5 20 17.6193 20 19Z" fill="#111723" /><path d="M32 19C32 20.3807 30.8807 21.5 29.5 21.5C28.1193 21.5 27 20.3807 27 19C27 17.6193 28.1193 16.5 29.5 16.5C30.8807 16.5 32 17.6193 32 19Z" fill="#111723" /><path fillRule="evenodd" clipRule="evenodd" d="M31.9383 25.0153C32.6413 25.4536 32.856 26.3788 32.4177 27.0818C30.45 30.2382 27.7262 31.393 25.1305 31.4468C22.6376 31.4984 20.3503 30.5419 18.9769 29.6467C18.2829 29.1944 18.087 28.265 18.5394 27.571C18.9917 26.877 19.9211 26.6811 20.6151 27.1335C21.6211 27.7892 23.3239 28.4835 25.0684 28.4474C26.7101 28.4134 28.471 27.7418 29.8719 25.4947C30.3101 24.7917 31.2353 24.5771 31.9383 25.0153Z" fill="#111723" /></svg>);

/** Lottie 대체: progress(반복) / complete / cancel */
export function ResultIcon({ kind }: { kind: 'progress' | 'complete' | 'cancel' }) {
  return <span className={`rs-ic ${kind}`} aria-hidden="true" />;
}

function Header({ icon, title, sub, date }: { icon: 'progress' | 'complete' | 'cancel'; title: string; sub?: string; date?: string }) {
  return (
    <div className="rs-head">
      <ResultIcon kind={icon} />
      <div className="rs-head-text">
        <h2 className="t-h3">{title.split('\n').map((l, i) => <React.Fragment key={i}>{i > 0 && <br />}{l}</React.Fragment>)}</h2>
        {date && <p className="t-h3 rs-date">{date}</p>}
        {sub !== undefined && <p className="t-b1-400 g70">{sub}</p>}
      </div>
    </div>
  );
}

type Alert = { title: string; body: string; buttons: { label: string; style: 'filled' | 'tonal-gray'; onClick: () => void }[] };
function AlertView({ a }: { a: Alert }) {
  return (
    <div className="rs-alert-dim">
      <div className="rs-alert" role="alertdialog" aria-modal="true">
        <h3>{a.title.split('\n').map((l, i) => <React.Fragment key={i}>{i > 0 && <br />}{l}</React.Fragment>)}</h3>
        <p>{a.body.split('\n').map((l, i) => <React.Fragment key={i}>{i > 0 && <br />}{l}</React.Fragment>)}</p>
        <div className="rs-alert-btns">{a.buttons.map(b => <button key={b.label} type="button" className={`rs-mbtn ${b.style}`} onClick={b.onClick}>{b.label}</button>)}</div>
      </div>
    </div>
  );
}

/* ---------- 420 미리접수 완료 화면 ---------- */
export function ReceiptComplete(props: {
  patients: ReceiptPatientResult[]; receiptedAt: string; roomName: string; hospitalName: string;
  onHome: () => void; onHistory: (tab: '진행중' | '이전') => void; onRetry: () => void;
}) {
  const [alert, setAlert] = useState<Alert | null>(null);
  const { patients } = props;
  const loading = patients.some(p => p.status === 'pending');
  const allOk = !loading && patients.every(p => p.status === 'success');
  const head = loading ? { icon: 'progress' as const, title: '접수 결과를 확인하고 있어요', sub: '아래의 접수 결과를 반드시 확인해 주세요' }
    : allOk ? { icon: 'complete' as const, title: '접수가 완료되었어요', sub: '접수 내역에서 대기 번호를 확인해 주세요' }
      : { icon: 'cancel' as const, title: '실패한 접수가 있어요', sub: '접수 내역에서 실패 사유를 확인해 주세요' };

  function onClose() {
    if (!loading) { props.onHome(); return; }
    setAlert({ title: '결과 확인 없이 나가시겠어요?', body: '접수 요청 후 알림을 받기 전까지는 결과 확인이 어려울 수 있어요.', buttons: [
      { label: '취소하기', style: 'tonal-gray', onClick: () => setAlert(null) },
      { label: '나가기', style: 'filled', onClick: () => { setAlert(null); props.onHome(); } }
    ] });
  }
  function onFailTap(p: ReceiptPatientResult) {
    const retry = [{ label: '닫기', style: 'tonal-gray' as const, onClick: () => setAlert(null) }, { label: '다시 접수하기', style: 'filled' as const, onClick: () => { setAlert(null); props.onRetry(); } }];
    if (p.reason === 'ExamClosed') setAlert({ title: '선택한 진료실의\n접수가 마감되었어요', body: '운영시간 마감 및 병원 사정으로\n진료실 운영이 종료되었어요.', buttons: retry });
    else if (p.reason === 'OverCapacity') setAlert({ title: '최대 인원이 초과되어\n접수가 마감되었어요', body: '진료 가능한 최대 인원이 초과되어\n나중에 다시 시도해 주세요.', buttons: retry });
    else setAlert({ title: '접수에 실패했어요', body: '잠시 후 다시 시도해 주세요.', buttons: [{ label: '확인', style: 'filled', onClick: () => setAlert(null) }] });
  }

  return (
    <div className="hd-root">
      <div className="rs-nav"><span /><button type="button" aria-label="닫기" onClick={onClose}><IcClose /></button></div>
      <div className="hd-scroll">
        <Header icon={head.icon} title={head.title} sub={head.sub} />
        <div className="rs-band" />
        <div className="rs-body">
          <section>
            <h3 className="rs-sec-title">진료 대상</h3>
            <div className="rs-patients">
              {patients.map(p => (
                <div key={p.id} className="rs-patient">
                  <span className="rs-patient-l"><IcProfile color={hashColor(p.name)} /><span className="t-b1-600 g90 hd-ellipsis" style={{ maxWidth: 180 }}>{p.name}</span></span>
                  {p.status === 'pending' && <span className="rs-mini-spin" aria-label="확인 중" />}
                  {p.status === 'success' && <span className="rs-st ok">접수완료</span>}
                  {p.status === 'failure' && <span className="rs-st fail">접수실패</span>}
                  {p.status === 'requestFail' && <button type="button" className="rs-st req" onClick={() => onFailTap(p)}>요청실패</button>}
                </div>
              ))}
            </div>
          </section>
          <section>
            <h3 className="rs-sec-title">접수 정보</h3>
            <div className="rs-info">
              <div><span>접수일시</span><span>{props.receiptedAt}</span></div>
              <div><span>진료실</span><span>{props.roomName}</span></div>
              <div><span>병원명</span><span>{props.hospitalName}</span></div>
            </div>
          </section>
        </div>
      </div>
      {!loading && (
        <div className="rs-cta">
          {!allOk && <p className="rs-cta-note">요청이 실패한 경우 진료 내역에 남지 않아요</p>}
          <div className="rs-cta-btn"><button type="button" className="hd-btn filled" onClick={() => props.onHistory(patients.some(p => p.status === 'success') ? '진행중' : '이전')}>접수 결과 확인하기</button></div>
        </div>
      )}
      {alert && <AlertView a={alert} />}
    </div>
  );
}

/* ---------- [제안] 420 미리접수 결과 바텀시트 ----------
 * 예약·진료항목 결과 시트와 같은 컨테이너(닫을 수 없는 시트, 로딩 → 결과를 같은 자리에서 전환).
 * 신청서가 시트 뒤에 남아 있으므로 '접수 정보' 3행은 빼고 결과 헤더 + 진료 대상 + CTA만 둔다.
 * 요청실패 '다시 접수하기'는 시트를 닫고 신청서에 머문다(페이지형은 이전 화면으로 돌아감). */
export function ReceiptResultSheet(props: {
  patients: ReceiptPatientResult[];
  onHistory: (tab: '진행중' | '이전') => void; onRetry: () => void;
}) {
  const [alert, setAlert] = useState<Alert | null>(null);
  const { patients } = props;
  const loading = patients.some(p => p.status === 'pending');
  const allOk = !loading && patients.every(p => p.status === 'success');
  const head = loading ? { icon: 'progress' as const, title: '접수 결과를 확인하고 있어요', sub: '아래의 접수 결과를 반드시 확인해 주세요' }
    : allOk ? { icon: 'complete' as const, title: '접수가 완료되었어요', sub: '접수 내역에서 대기 번호를 확인해 주세요' }
      : { icon: 'cancel' as const, title: '실패한 접수가 있어요', sub: '접수 내역에서 실패 사유를 확인해 주세요' };
  function onFailTap(p: ReceiptPatientResult) {
    const retry = [{ label: '닫기', style: 'tonal-gray' as const, onClick: () => setAlert(null) }, { label: '다시 접수하기', style: 'filled' as const, onClick: () => { setAlert(null); props.onRetry(); } }];
    if (p.reason === 'ExamClosed') setAlert({ title: '선택한 진료실의\n접수가 마감되었어요', body: '운영시간 마감 및 병원 사정으로\n진료실 운영이 종료되었어요.', buttons: retry });
    else if (p.reason === 'OverCapacity') setAlert({ title: '최대 인원이 초과되어\n접수가 마감되었어요', body: '진료 가능한 최대 인원이 초과되어\n나중에 다시 시도해 주세요.', buttons: retry });
    else setAlert({ title: '접수에 실패했어요', body: '잠시 후 다시 시도해 주세요.', buttons: [{ label: '확인', style: 'filled', onClick: () => setAlert(null) }] });
  }
  return (
    <div className="rs-sheet-dim">
      <div className="rs-sheet rs-sheet-rc" role="dialog" aria-modal="true" aria-label="접수 결과">
        <div className="rs-sheet-scroll">
          <Header icon={head.icon} title={head.title} sub={head.sub} />
          <div className="rs-rc-list">
            {patients.map(p => (
              <div key={p.id} className="rs-patient">
                <span className="rs-patient-l"><IcProfile color={hashColor(p.name)} /><span className="t-b1-600 g90 hd-ellipsis" style={{ maxWidth: 180 }}>{p.name}</span></span>
                {p.status === 'pending' && <span className="rs-mini-spin" aria-label="확인 중" />}
                {p.status === 'success' && <span className="rs-st ok">접수완료</span>}
                {p.status === 'failure' && <span className="rs-st fail">접수실패</span>}
                {p.status === 'requestFail' && <button type="button" className="rs-st req" onClick={() => onFailTap(p)}>요청실패</button>}
              </div>
            ))}
          </div>
        </div>
        {/* 결과 전환 때 시트가 튀지 않도록 안내문 자리를 미리 확보 */}
        <p className="rs-cta-note" style={{ visibility: !loading && !allOk ? 'visible' : 'hidden' }} aria-hidden={loading || allOk}>요청이 실패한 경우 진료 내역에 남지 않아요</p>
        <div className="rs-sheet-btns"><button type="button" className="hd-btn filled" disabled={loading} onClick={() => props.onHistory(patients.some(p => p.status === 'success') ? '진행중' : '이전')}>접수 결과 확인하기</button></div>
      </div>
      {alert && <AlertView a={alert} />}
    </div>
  );
}

/* ---------- 420 예약 · 진료항목 예약 결과 시트 ---------- */
export function RequestResultSheet(props: {
  kind: 'appt' | 'treatment'; state: ApptResult | TiResult; dateText: string;
  onHistory: () => void; onStop: () => void; onOther: () => void; onConfirm: () => void; onItemGone: () => void;
}) {
  const { kind, state } = props;
  const loadingSub = kind === 'appt' ? '예약 확정을 기다려 주세요.' : '';
  let icon: 'progress' | 'complete' | 'cancel' = 'cancel', title = '', sub: string | undefined, date: string | undefined;
  let buttons: { label: string; style: 'filled' | 'tonal-gray'; onClick: () => void; disabled?: boolean }[] = [];
  switch (state) {
    case 'loading': icon = 'progress'; title = '예약 요청을 확인하고 있어요'; sub = loadingSub; buttons = [{ label: '내역보기', style: 'filled', onClick: () => undefined, disabled: true }]; break;
    case 'success': icon = 'complete'; title = '예약이 확정되었어요'; date = props.dateText; sub = '예약 내역에서 상세 정보를 확인해 주세요.'; buttons = [{ label: '내역보기', style: 'filled', onClick: props.onHistory }]; break;
    case 'successRequest': icon = 'complete'; title = '예약을 요청했어요'; sub = '병원에서 확인 후 확정 결과를 안내해 드릴게요.'; buttons = [{ label: '내역보기', style: 'filled', onClick: props.onHistory }]; break;
    case 'notExistedSlots':
      title = kind === 'appt' ? '이미 예약이 마감된 시간이에요' : '선택한 시간은\n더 이상 예약할 수 없어요'; sub = '다른 시간을 선택해 주세요.';
      buttons = [{ label: '예약 그만두기', style: 'tonal-gray', onClick: props.onStop }, { label: '다른 시간 보기', style: 'filled', onClick: props.onOther }]; break;
    case 'closedToday':
      title = '선택한 날짜의\n모든 예약 시간이 마감되었어요'; sub = '다른 날짜를 선택해 주세요.';
      buttons = [{ label: '예약 그만두기', style: 'tonal-gray', onClick: props.onStop }, { label: '다른 날짜 보기', style: 'filled', onClick: props.onOther }]; break;
    case 'notExistedItem':
      title = '더 이상 예약할 수 없는 정보예요'; sub = '더 이상 제공하지 않는 정보입니다.'; buttons = [{ label: '확인', style: 'filled', onClick: props.onItemGone }]; break;
    default:
      title = '예약에 실패했어요'; sub = kind === 'appt' ? '선택한 시간의 예약을 처리하지 못했어요. (서버 메시지 예시)' : '잠시 후 다시 시도해 주세요.';
      buttons = [{ label: '확인', style: 'filled', onClick: props.onConfirm }];
  }
  return (
    <div className="rs-sheet-dim">
      <div className="rs-sheet" role="dialog" aria-modal="true" aria-label="예약 결과">
        <Header icon={icon} title={title} sub={sub} date={date} />
        <div className="rs-sheet-btns">{buttons.map(b => <button key={b.label} type="button" className={`hd-btn ${b.style}`} disabled={b.disabled} onClick={b.onClick}>{b.label}</button>)}</div>
      </div>
    </div>
  );
}
