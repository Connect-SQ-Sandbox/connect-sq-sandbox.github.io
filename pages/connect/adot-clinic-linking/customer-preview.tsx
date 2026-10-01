import React, { useEffect, useState } from 'react';
import { FiX, FiCheck, FiChevronLeft } from 'react-icons/fi';

export type CustomerView = 'kakao' | 'sms' | 'form' | 'notification';
export type BookingState = '처리 중' | '예약 확정' | '병원 취소' | '진료 완료' | '고객 취소';
export type CustomerSnapshot = { hospital: string; patient: string; room: string; purpose: string; schedule: string };

// Public-safe, in-memory demonstration only. No resident number is returned to the agent.
export function CustomerPreview({ view, snapshot, generation = 1, currentGeneration = 1, consumed = false, state = '예약 확정', standalone = false, onClose, onComplete, onCustomerCancel }: {
  view: CustomerView; snapshot: CustomerSnapshot; generation?: number; currentGeneration?: number;
  state?: BookingState; standalone?: boolean; consumed?: boolean; onClose: () => void;
  onComplete?: (generation: number) => void; onCustomerCancel?: () => void;
}) {
  const [screen, setScreen] = useState<CustomerView | 'app'>(view);
  const [digits, setDigits] = useState('');
  const [processingConsent, setProcessingConsent] = useState(false);
  const [provisionConsent, setProvisionConsent] = useState(false);
  const [completed, setCompleted] = useState(consumed);
  const [customerCanceled, setCustomerCanceled] = useState(false);
  const validLink = generation === currentGeneration;
  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopImmediatePropagation(); onClose(); }
    };
    window.addEventListener('keydown', keydown, true);
    return () => window.removeEventListener('keydown', keydown, true);
  }, [onClose]);
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!validLink || consumed || completed || digits.length !== 7 || !processingConsent || !provisionConsent) return;
    setDigits(''); // discard the mock input; never persist it or expose it to the agent
    setCompleted(true);
    onComplete?.(generation);
  };
  const summary = <dl className="kt-customer-readonly">
    <div><dt>병원</dt><dd>{snapshot.hospital}</dd></div><div><dt>진료실</dt><dd>{snapshot.room}</dd></div>
    <div><dt>내원 목적</dt><dd>{snapshot.purpose}</dd></div><div><dt>희망 방문 일시</dt><dd>{snapshot.schedule}</dd></div>
  </dl>;
  const notificationTitle = state === '병원 취소' ? '병원에서 예약을 취소했습니다.' : state === '진료 완료' ? '진료가 완료되었습니다.' : '예약이 확정되었습니다.';
  return <div className={`kt-customer-stage ${standalone ? 'standalone' : ''}`} role={standalone ? undefined : 'dialog'} aria-modal={standalone ? undefined : true} aria-label="고객 화면 시안">
    <header className="kt-preview-header"><div><b>고객 화면 시안</b><small>가상 정보 · 실제 메시지·예약·앱 연결 없음</small></div><button type="button" onClick={onClose} aria-label="고객 화면 닫기"><FiX /></button></header>
    <div className="kt-phone">
      <div className="kt-phone-status"><span>14:18</span><i /><span>5G ▰</span></div>
      <header className="kt-phone-header"><FiChevronLeft /><strong>{screen === 'kakao' || screen === 'notification' ? '굿닥 알림톡' : screen === 'sms' ? '메시지' : screen === 'app' ? '굿닥 앱 · 시안' : '굿닥 · 고객 확인'}</strong><span /></header>
      {(screen === 'kakao' || screen === 'sms' || screen === 'notification') && <div className={`kt-message-screen ${screen === 'sms' ? 'sms' : ''}`}>
        <p className="kt-chat-date">오늘 · 예시 메시지</p><div className="kt-message-row"><b className="kt-goodoc-avatar">굿닥</b><article className="kt-message-card">
          <header><strong>굿닥</strong><small>{screen === 'sms' ? '대체 문자' : '알림톡'}</small></header>
          <h2>{screen === 'notification' ? notificationTitle : '진료 예약을 위한 고객 확인 요청'}</h2>
          <p>{screen === 'notification' ? state === '진료 완료' ? '병원에서 진료 완료에 준하는 처리가 확인되었습니다.' : state === '병원 취소' ? '방문 전 변경된 예약 상태를 확인해 주세요.' : '예약 내역을 확인하고, 취소가 필요하면 굿닥 앱에서 진행해 주세요.' : 'KT114 상담 중 선택한 예약을 위해 아래 링크에서 필요한 정보를 직접 입력해 주세요. 아직 예약 신청 전입니다.'}</p>
          {screen !== 'sms' && summary}
          {screen === 'sms' && <p className="kt-short-sms">[굿닥] 예약 신청에 필요한 고객 확인을 완료해 주세요.<br />예시 링크: /demo/customer-link/{generation}</p>}
          <button type="button" disabled={screen !== 'notification' && !validLink} onClick={() => setScreen(screen === 'notification' ? 'app' : 'form')}>{screen === 'notification' ? '예약 내역 확인' : validLink ? '고객 정보 입력하기' : '폐기된 링크입니다'}</button>
          <small>{screen === 'notification' ? '앱 미설치 시 설치 후 해당 예약으로 연결하는 경로를 제공합니다. 실제 연동은 개발 검토 대상입니다.' : '오입력 시 상담사에게 재전송을 요청하세요. 링크 유효시간은 협의 후 확정합니다.'}</small>
        </article></div>
        {screen === 'sms' && <p className="kt-customer-disclaimer">알림톡 실패 시 문자 대체 발송 · 검토용 예시</p>}
      </div>}
      {screen === 'form' && <main className="kt-customer-form">
        {!validLink ? <section className="kt-customer-card"><h1>사용할 수 없는 링크입니다.</h1><p>재전송으로 기존 링크와 입력 내용이 폐기되었습니다. 가장 최근에 받은 메시지의 링크를 이용해 주세요.</p></section> : completed ? <section className="kt-customer-card kt-complete"><FiCheck /><h1>고객 입력이 완료되었습니다.</h1><p>아직 병원에 신청하지 않았습니다.<br />상담사가 내용을 확인하고 최종 신청합니다.</p><small>상담사에게는 입력 완료 상태만 표시됩니다.</small></section> : <>
          <span className="kt-customer-kicker">KT114 진료 연결 · 아직 예약 신청 전</span><h1>필요한 정보를 입력해 주세요.</h1>
          <p>가상 번호로만 체험해 주세요. 실제 주민등록번호는 입력하지 마세요.</p>
          <form className="kt-customer-card" onSubmit={submit}>
            <label className="kt-rrn-label" htmlFor="mock-rrn">주민등록번호 뒷자리 7자리 <small>고객 직접 입력</small></label>
            <input id="mock-rrn" type="password" inputMode="numeric" autoComplete="off" maxLength={7} value={digits} onChange={(event) => setDigits(event.target.value.replace(/\D/g, '').slice(0, 7))} placeholder="가상 숫자 7자리 입력" />
            <label className="kt-customer-consent"><input type="checkbox" checked={processingConsent} onChange={(event) => setProcessingConsent(event.target.checked)} /><span><b>[필수] 예약 신청을 위한 정보 처리 동의</b><small>고객 입력 정보를 예약 신청을 위해 임시 처리합니다.</small></span></label>
            <label className="kt-customer-consent"><input type="checkbox" checked={provisionConsent} onChange={(event) => setProvisionConsent(event.target.checked)} /><span><b>[필수] 선택한 병원으로의 제3자 정보 제공 동의</b><small>예약·환자 확인에 필요한 정보를 선택한 병원에 전달합니다.</small></span></label>
            <p className="kt-legal-note">법률 검토 전 시안 문구입니다. 처리·제공 주체, 항목, 목적, 보유기간, 거부권과 영향은 법무 검토 후 확정합니다. 이 동의만으로 주민번호 처리의 적법성을 보장하지 않습니다.</p>
            <button className="kt-customer-submit" type="submit" disabled={digits.length !== 7 || !processingConsent || !provisionConsent}>입력 완료하기</button>
            <small>완료 후 상담사가 최종 신청해야 병원에 전달됩니다.</small>
          </form>
          <section className="kt-customer-card"><h2>신청 내용 <small>확인만 가능</small></h2>{summary}</section>
          <section className="kt-customer-card"><h2>환자 정보 <small>일부 가림</small></h2><p>{snapshot.patient}</p></section>
          <p className="kt-customer-disclaimer">정보가 틀리거나 다시 입력하려면 상담사에게 요청하세요.<br />재전송 시 이전 링크·입력은 즉시 폐기됩니다.<br />재전송 기능은 1차 범위에서 제외될 수 있습니다.</p>
        </>}
      </main>}
      {screen === 'app' && <main className="kt-customer-form"><span className="kt-customer-kicker">설치·로그인·예약 연결 경로 체험용</span><h1>나의 예약 내역</h1><section className="kt-customer-card"><h2>{customerCanceled ? '고객 취소' : state}</h2>{summary}<p>본인 확인 후 해당 예약 내역을 확인하는 예시입니다.</p>{state === '예약 확정' && !customerCanceled && <button className="kt-customer-submit" type="button" onClick={() => { if (window.confirm('이 가상 예약을 취소할까요?')) { setCustomerCanceled(true); onCustomerCancel?.(); } }}>예약 취소</button>}</section><p className="kt-legal-note">실제 앱 설치·본인 확인·예약 연결과 취소 가능 조건은 구현 검토 후 확정합니다.</p></main>}
    </div>
  </div>;
}
