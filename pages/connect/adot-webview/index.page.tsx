import { useEffect, useId, useRef, useState, type ReactNode } from 'react';

const symbol: string = require('../../../assets/adot-webview/goodoc-symbol.svg');
const disclosureArrow: string = require('../../../assets/adot-webview/chevron.svg');
const downChevron: string = require('../../../assets/adot-webview/arrow.svg');
const maskOff: string = require('../../../assets/adot-webview/checkbox-off.svg');
const maskOn: string = require('../../../assets/adot-webview/checkbox-on.svg');

const HOSPITAL = '예시의원';
const APPOINTMENT = '12월 10일(목) 오후 2:30';

const scenarios = {
  newPatient: { title: '진료실 · 처음 방문', short: '주민등록번호 + 병원 약관', rrn: true, hospitalTerms: true, treatment: false },
  rrnOnly: { title: '진료실 · 정보 입력만', short: '주민등록번호', rrn: true, hospitalTerms: false, treatment: false },
  termsOnly: { title: '진료실 · 약관 확인만', short: '병원 약관', rrn: false, hospitalTerms: true, treatment: false },
  direct: { title: '진료실 · 바로 예약', short: '웹뷰 없음', rrn: false, hospitalTerms: false, treatment: false },
  treatment: { title: '진료항목 예약', short: '웹뷰 없음', rrn: false, hospitalTerms: false, treatment: true },
} as const;

type ScenarioKey = keyof typeof scenarios;
type Step = 'search' | 'schedule' | 'consent' | 'booking' | 'result';
const stepOrder: Step[] = ['search', 'schedule', 'consent', 'booking', 'result'];
const baseStepLabels: Record<Step, string> = {
  search: '병원 찾기', schedule: '일정 선택', consent: '사전 동의', booking: '예약 신청', result: '예약 결과',
};
const review: Record<Step, { title: string; description: string }> = {
  search: { title: '환자 확인 전 병원 탐색', description: '지역과 진료과를 바탕으로 병원을 찾는 단계입니다. 기존 회원 대조나 병원 차트 조회 전입니다.' },
  schedule: { title: '예약 후보 일시 확인', description: '병원을 선택한 뒤 가능한 일시를 안내합니다. 일정 선택 뒤 환자별 예약 조건을 확인합니다.' },
  consent: { title: '양사 제공 동의 검토', description: '신청과 결과 반환의 정보 제공 주체, 개별 병원 동의 시점과 반환되는 민감정보의 범위를 검토하는 단계입니다.' },
  booking: { title: '굿닥에서 남은 입력과 동의 처리', description: '주민등록번호 보완과 미응답 병원 약관을 각각 확인합니다. 굿닥 마케팅 선택 항목은 기존 웹뷰에서만 표시하는 안입니다.' },
  result: { title: '신청 접수와 예약 확정', description: '굿닥이 결과를 전달하면 에이닷이 해당 예약의 상태를 안내하는 예시입니다. 접수 상태에서는 병원 확인이 남아 있습니다.' },
};

function Bubble({ user = false, children }: { user?: boolean; children: ReactNode }) {
  return <div className={user ? 'ar-message ar-message-user' : 'ar-message'}>
    {!user && <span className="ar-avatar" aria-hidden="true">A.</span>}
    <div className="ar-bubble">{children}</div>
  </div>;
}

function ConsentRow({ label, checked, onChange, children }: {
  label: string; checked?: boolean; onChange?: (checked: boolean) => void; children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const detailId = useId();
  return <div className="ar-consent-item">
    <div className="ar-consent-row">
      {onChange ? <label className="ar-consent-label">
        <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
        <span className="ar-checkbox" aria-hidden="true" />
        <span>{label}</span>
      </label> : <span className="ar-consent-label">{label}</span>}
      <button type="button" className="ar-details-button" aria-label={label + ' 내용 보기'} aria-expanded={open}
        aria-controls={detailId} onClick={() => setOpen(!open)}>
        <span>{open ? '접기' : '내용 보기'}</span><img src={downChevron} alt="" />
      </button>
    </div>
    <div className="ar-disclosure" id={detailId} hidden={!open}>{children}</div>
  </div>;
}

function Notice({ label, children }: { label: string; children: ReactNode }) {
  return <details className="ar-notice">
    <summary>{label}<img src={disclosureArrow} alt="" /></summary>
    <div className="ar-disclosure">{children}</div>
  </details>;
}

function Preview() {
  const [scenarioKey, setScenarioKey] = useState<ScenarioKey>('newPatient');
  const [step, setStep] = useState<Step>('search');
  const [confirmed, setConfirmed] = useState(false);
  const [webviewResult, setWebviewResult] = useState(false);
  const [sampleFilled, setSampleFilled] = useState(false);
  const [masked, setMasked] = useState(true);
  const [hospitalRequired, setHospitalRequired] = useState(false);
  const [hospitalOptional, setHospitalOptional] = useState(false);
  const [mktPreview, setMktPreview] = useState(false);
  const [mktUse, setMktUse] = useState(false);
  const [mktAds, setMktAds] = useState(false);
  const [error, setError] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const scenario = scenarios[scenarioKey];
  const hasWebview = scenario.rrn || scenario.hospitalTerms;
  const formMessage = scenario.rrn && !sampleFilled
    ? '예시 번호를 채워 주세요.'
    : scenario.hospitalTerms && !hospitalRequired
      ? '필수 병원 약관에 동의해 주세요.'
      : '';
  const hasSheet = hasWebview && (step === 'booking' || webviewResult);
  const activeStep = stepOrder.indexOf(step);
  const chat = useRef<HTMLDivElement>(null);
  const sheetTitle = useRef<HTMLHeadingElement>(null);
  const closePrompt = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!webviewResult) return;
    const timer = window.setTimeout(() => setWebviewResult(false), 3500);
    return () => window.clearTimeout(timer);
  }, [webviewResult]);

  useEffect(() => {
    if (hasSheet) sheetTitle.current?.focus({ preventScroll: true });
    else chat.current?.scrollTo({ top: 0 });
  }, [step, hasSheet]);

  useEffect(() => {
    if (confirmClose) closePrompt.current?.focus();
  }, [confirmClose]);

  function resetForm() {
    setSampleFilled(false);
    setMasked(true);
    setHospitalRequired(false);
    setHospitalOptional(false);
    setMktUse(false);
    setMktAds(false);
    setError(false);
  }

  function goTo(next: Step) {
    setWebviewResult(false);
    setConfirmClose(false);
    if (next !== step) resetForm();
    setStep(next);
  }

  function chooseScenario(next: ScenarioKey) {
    goTo('search');
    resetForm();
    setScenarioKey(next);
  }

  function submitBooking() {
    if (formMessage) {
      setError(true);
      return;
    }
    resetForm();
    setStep('result');
    setWebviewResult(hasWebview);
  }

  const currentReview = step === 'booking' && !hasWebview
    ? { title: '에이닷에서 바로 신청', description: '굿닥 웹뷰 없이 에이닷 안에서 신청합니다. 이 경로의 병원 관련 동의 수령 방식은 사전 동의 화면의 검토 사항입니다.' }
    : review[step];

  return <main className="ar bb">
    <header className="ar-header">
      <div className="ar-header-inner">
        <a className="ar-home" href="../" aria-label="Connect Sandbox 홈">Connect Sandbox</a>
        <span className="ar-status">법률 검토용 시안</span>
      </div>
    </header>
    <div className="ar-shell">
      <div className="ar-intro">
        <h1>에이닷 병원 예약</h1>
        <p>병원 탐색부터 동의, 신청 결과까지 이어서 확인할 수 있습니다.</p>
      </div>
      <div className="ar-grid">
        <nav className="ar-panel ar-scenarios" aria-label="예약 사례">
          <h2>예약 사례</h2>
          {Object.entries(scenarios).map(([key, value]) => <button type="button" key={key}
            className="ar-case" aria-pressed={scenarioKey === key} onClick={() => chooseScenario(key as ScenarioKey)}>
            <span>{value.title}</span><small>{value.short}</small>
          </button>)}
        </nav>
        <section className="ar-preview" aria-label="예약 화면 예시">
          <div className="ar-phone" onKeyDown={e => {
            if (e.key !== 'Escape') return;
            if (confirmClose) setConfirmClose(false);
            else if (hasSheet && step === 'booking') setConfirmClose(true);
          }}>
            <div className="ar-statusbar" aria-hidden="true"><span>9:41</span><span className="ar-battery" /></div>
            <div className="ar-chat-header"><strong>A. 에이닷</strong><small>대화 화면 예시</small></div>
            <div className="ar-chat" key={step} ref={chat} aria-hidden={hasSheet || undefined}
              {...(hasSheet ? { inert: '' } : {})}>
              {step === 'search' && <>
                <Bubble user>가까운 곳에서 목요일 오후에 예약할 수 있는 병원 찾아줘.</Bubble>
                <Bubble>예약 가능한 병원을 찾았어요. 진료 받을 곳을 골라 주세요.</Bubble>
                <article className="ar-chat-card">
                  <h3>{HOSPITAL}</h3><p>가정의학과 · 서울 중구</p>
                  <button className="ar-primary" onClick={() => goTo('schedule')}>이 병원 일정 보기</button>
                </article>
              </>}
              {step === 'schedule' && <>
                <Bubble user>{HOSPITAL} 일정 보여줘.</Bubble>
                <Bubble>선택할 수 있는 시간이 있어요.</Bubble>
                <article className="ar-chat-card">
                  <h3>{scenario.treatment ? '예방접종 예시' : '일반 진료'}</h3>
                  <p>{HOSPITAL} · {APPOINTMENT}</p>
                  <button className="ar-primary" onClick={() => goTo('consent')}>이 시간으로 진행</button>
                </article>
              </>}
              {step === 'consent' && <>
                <Bubble user>그 시간으로 예약할게.</Bubble>
                <Bubble>예약을 진행하기 전에 개인정보가 어떻게 오가는지 확인해 주세요.</Bubble>
                <article className="ar-chat-card ar-partner-consents">
                  <h3>예약 서비스 동의 예시</h3>
                  <ConsentRow label="예약 정보 제공 · 에이닷 → 굿닥">예약자 연락처와 예약에 필요한 조건을 굿닥에 보내는 경우입니다.</ConsentRow>
                  <ConsentRow label="예약 결과 제공 · 굿닥 → 에이닷">접수·확정·취소 등 해당 예약의 상태를 에이닷에서 확인하기 위한 예시입니다. 제공 명의와 범위는 검토 중입니다.</ConsentRow>
                  <ConsentRow label="민감정보 제공 · 별도 동의">증상 등 건강정보가 실제 전달되는 경우의 예시입니다. 결과에 건강정보가 포함되는 경우도 검토 대상입니다.</ConsentRow>
                  <ConsentRow label="[선택] CI 회원 대조">기존 굿닥 회원과의 대조에 쓰는 별도 선택 동의 검토안입니다. 이 시안에서는 CI를 입력하거나 전달하지 않습니다.</ConsentRow>
                  <button className="ar-primary" onClick={() => goTo('booking')}>예시 화면 계속 보기</button>
                </article>
              </>}
              {step === 'booking' && <>
                <Bubble user>{HOSPITAL} 예약 신청해 줘.</Bubble>
                <Bubble>{hasWebview ? '예약에 필요한 정보를 확인해 주세요.' : '예약 내용을 확인해 주세요.'}</Bubble>
                {!hasWebview && <article className="ar-chat-card">
                  <h3>예약 신청</h3><p>{HOSPITAL} · {scenario.treatment ? '예방접종 예시' : '일반 진료'}</p><p>{APPOINTMENT}</p>
                  <button className="ar-primary" onClick={submitBooking}>이대로 예약 신청</button>
                </article>}
              </>}
              {step === 'result' && <>
                <Bubble>{confirmed ? '병원에서 예약을 확정했어요.' : '예약을 요청했어요. 병원에서 확인하면 예약이 확정돼요.'}</Bubble>
                <article className="ar-chat-card ar-chat-result">
                  <span className={confirmed ? 'ar-result-tag ar-result-tag-confirmed' : 'ar-result-tag'}>
                    {confirmed ? '예약 확정' : '신청 접수 · 병원 확인 중'}
                  </span>
                  <h3>{HOSPITAL}</h3><p>{APPOINTMENT}</p>
                  <p>{scenario.treatment ? '예방접종 예시' : '일반 진료'}</p>
                </article>
              </>}
            </div>
            {hasSheet && <>
              <div className="ar-dim" aria-hidden="true" />
              {step === 'booking' && <div className="ar-browser-bar">
                <span>에이닷 브라우저</span>
                <button type="button" onClick={() => setConfirmClose(true)} aria-label="웹뷰 닫기">×</button>
              </div>}
              <section className="ar-sheet" aria-labelledby="ar-sheet-title" role="dialog" aria-modal="true"
                aria-hidden={confirmClose || undefined} {...(confirmClose ? { inert: '' } : {})}>
                <div className="ar-sheet-header"><img src={symbol} alt="" /><strong>굿닥 병원 예약</strong></div>
                {webviewResult ? <div className="ar-completion">
                  <span className="ar-completion-icon" aria-hidden="true">✓</span>
                  <h2 id="ar-sheet-title" tabIndex={-1} ref={sheetTitle}>{confirmed ? '예약이 확정됐어요' : '예약을 요청했어요'}</h2>
                  {confirmed ? <p className="ar-confirmed-time">{APPOINTMENT}</p>
                    : <p>병원에서 확인하면 예약이 확정돼요.<br />확정 여부는 에이닷에서 알려드릴게요.</p>}
                </div> : <>
                  <div className="ar-sheet-body">
                    <h2 id="ar-sheet-title" tabIndex={-1} ref={sheetTitle}>예약에 필요한 정보를<br />확인해 주세요</h2>
                    <dl className="ar-summary"><dt>병원명</dt><dd>{HOSPITAL}</dd><dt>예약자</dt><dd>김예시</dd></dl>
                    {scenario.rrn && <section className="ar-fields">
                      <div className="ar-section-title">
                        <h3>주민등록번호</h3>
                        <button type="button" className="ar-mask" aria-pressed={masked} onClick={() => setMasked(!masked)}>
                          <img src={masked ? maskOn : maskOff} alt="" />뒷자리 가리기
                        </button>
                      </div>
                      <div className="ar-id">
                        <span aria-label="예시 주민등록번호 앞자리">000000</span>
                        <span aria-hidden="true">–</span>
                        <button type="button" onClick={() => setSampleFilled(true)} aria-label="예시 번호 채우기">
                          {sampleFilled ? (masked ? '0******' : '0000000') : '예시 번호 채우기'}
                        </button>
                      </div>
                      <p className="ar-helper">㈜굿닥은 {HOSPITAL}의 신규 환자등록 업무를 위탁받아 주민등록번호를 일시적으로 수령하여 병원에 전달합니다. 환자등록 완료 또는 처리 필요성이 없어지면 해당 정보와 임시자료를 파기합니다.</p>
                      <Notice label="주민등록번호 처리 안내 보기">
                        예시의원은 환자등록·진료기록 작성 등 관련 법령에서 허용하는 업무에 필요한 경우에만 주민등록번호를 처리합니다. 굿닥은 위탁 업무에 필요한 범위에서 처리합니다.
                      </Notice>
                    </section>}
                    {scenario.hospitalTerms && <section className="ar-fields">
                      <h3>병원 약관 동의</h3>
                      <label className="ar-consent-label ar-all">
                        <input type="checkbox" checked={hospitalRequired && hospitalOptional} onChange={e => {
                          setHospitalRequired(e.target.checked);
                          setHospitalOptional(e.target.checked);
                        }} />
                        <span className="ar-checkbox" aria-hidden="true" />
                        <span>전체 동의</span>
                      </label>
                      <ConsentRow label="[필수] 병원 개인정보 수집·이용 동의" checked={hospitalRequired} onChange={setHospitalRequired}>예시의원이 예약 확인과 내원 안내에 필요한 정보를 이용하는 경우의 병원 동의서 예시입니다.</ConsentRow>
                      <ConsentRow label="[선택] 병원 만족도 조사 동의 예시" checked={hospitalOptional} onChange={setHospitalOptional}>병원이 운영하는 선택 항목의 예시입니다. 선택하지 않아도 예약할 수 있습니다.</ConsentRow>
                      <p className="ar-helper">위 동의서는 {HOSPITAL}의 동의서이며, ㈜굿닥은 병원의 위탁을 받아 동의 응답을 수집·관리합니다.</p>
                      <Notice label="개인정보 처리 위탁 안내 보기">위탁하는 자는 {HOSPITAL}, 수탁자는 ㈜굿닥이며, 예시 위탁 업무는 병원 동의 응답의 수집·관리입니다.</Notice>
                    </section>}
                    {mktPreview && <section className="ar-fields ar-marketing">
                      <div className="ar-section-title"><h3>굿닥 마케팅 수신 동의</h3><small>검토안</small></div>
                      <ConsentRow label="[선택] 마케팅 목적 개인정보 이용 동의" checked={mktUse} onChange={setMktUse}>굿닥 서비스 홍보와 이벤트 안내를 위한 휴대전화번호 이용 예시입니다. 이용기간과 철회 방법은 검토 후 확정됩니다.</ConsentRow>
                      <ConsentRow label="[선택] 광고성 문자 수신 동의" checked={mktAds} onChange={setMktAds}>㈜굿닥의 서비스 홍보·이벤트 등 광고성 정보를 문자로 받는 동의 예시입니다. 실제 발송이나 수신 등록은 이루어지지 않습니다.</ConsentRow>
                      <p className="ar-helper">동의하지 않아도 예약을 신청할 수 있어요.</p>
                    </section>}
                  </div>
                  <div className="ar-sheet-footer">
                    <button type="button" className="ar-primary" onClick={submitBooking}>예약 신청</button>
                    {error && formMessage && <p className="ar-error" role="alert">{formMessage}</p>}
                  </div>
                </>}
                <div className="ar-homebar" aria-hidden="true" />
              </section>
              {confirmClose && <div className="ar-close-overlay">
                <section className="ar-close-dialog" role="alertdialog" aria-modal="true" aria-labelledby="ar-close-title">
                  <h2 id="ar-close-title">예약 신청을 그만할까요?</h2>
                  <p>지금 나가면 입력한 내용이 저장되지 않아요.</p>
                  <div>
                    <button type="button" className="ar-secondary" onClick={() => goTo('consent')}>종료하기</button>
                    <button type="button" className="ar-primary" ref={closePrompt} onClick={() => {
                      setConfirmClose(false);
                      requestAnimationFrame(() => sheetTitle.current?.focus({ preventScroll: true }));
                    }}>계속 예약하기</button>
                  </div>
                </section>
              </div>}
            </>}
          </div>
          <p className="ar-preview-caption">에이닷 화면은 이해를 돕기 위한 예시입니다. 입력·동의·신청에 가상 데이터만 사용합니다.</p>
        </section>
        <aside className="ar-panel ar-review">
          <h2>화면 순서</h2>
          <ol className="ar-steps" aria-label="화면 바로가기">
            {stepOrder.map((item, index) => <li key={item}>
              <button type="button" className="ar-step" onClick={() => goTo(item)}
                aria-current={activeStep === index ? 'step' : undefined}>
                <span>{index + 1}</span>{baseStepLabels[item]}
              </button>
            </li>)}
          </ol>
          <div className="ar-review-note">
            <h3>{currentReview.title}</h3>
            <p>{currentReview.description}</p>
          </div>
          <div className="ar-settings">
            <fieldset>
              <legend>처리 결과 예시</legend>
              <label><input type="radio" name="decision" checked={!confirmed} onChange={() => setConfirmed(false)} /> 신청 접수</label>
              <label><input type="radio" name="decision" checked={confirmed} onChange={() => setConfirmed(true)} /> 예약 확정</label>
            </fieldset>
            {hasWebview && <label className="ar-show-review">
              <input type="checkbox" checked={mktPreview} onChange={e => {
                setMktPreview(e.target.checked);
                if (!e.target.checked) {
                  setMktUse(false);
                  setMktAds(false);
                }
              }} /> 굿닥 마케팅 동의 검토안 보기
            </label>}
            {hasWebview && step === 'result' && <button type="button" className="ar-secondary ar-result-replay" onClick={() => setWebviewResult(true)}>
              굿닥 웹뷰 결과 다시 보기
            </button>}
          </div>
        </aside>
      </div>
    </div>
  </main>;
}
export default Preview;
