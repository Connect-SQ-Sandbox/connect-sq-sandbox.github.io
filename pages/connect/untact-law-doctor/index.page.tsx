/**
 * ─────────────────────────────────────────────────────────────
 * 이름      : untact-law-doctor — 굿닥 온라인진료실(의사용) · 비대면진료 제도화(의료법 개정) 대응
 * 상태      : 검토용 초안 · v0.1 · 최종수정 2026-11-20 · 샌드박스 배포
 * PRD       : 없음(제도화 대응 기획 초안). 사내 문서 링크는 공개 저장소라 미기재.
 * 배포URL   : https://connect-sq-sandbox.github.io/out/untact-law-doctor.html
 * 피그마    : 없음. 기준은 대응 보드 커넥트 섹션(진료실-1~3) + 현행 온라인진료실 화면 캡처.
 * 관련 CSS  : styles/untactLawDoctor.css (css-manifest 'untact-law-doctor')
 * 에셋      : assets/curation-price/goodoc-logo.svg (레포 공용 로고)
 * 기술제약  : 샌드박스 빌드 = react 훅 + plain CSS, 외부 요청 0.
 * 화면구성  : 좌측 상태 패널(화면 점프 · 상태 토글 · 화면별 메모) + 1040px 온라인진료실
 *             접수대기 목록(현행) → 진료실-1 접수대기 상세·접수 전 확인(수정)
 *             → 진료실-2 진료 시작·전화 진료 사유 모달(신규) · 화상진료 끄기 확인창(수정)
 *             → 진료실-3 진료 취소 사유(수정)
 *
 * 핵심 결정(why)
 *  - [확정·요청] 프로토는 제품별로 나눈다. 이 파일은 의사 어드민, 앱은 untact-law-app, 둘을 잇는 건 untact-law-pair(D9).
 *  - [보드 기준] 진료실-1 환자정보: 시범사업 안내(빨간 문구) 대신 진료 대상 배지(재진 · 환자 응답 / 초진 / 예외 대상), 자녀면 '가족 대리 신청' 배지.
 *  - [보드 기준] 진료실-1 접수 전 확인 체크 2개를 모두 체크해야 접수완료 활성. 재진은 두 번째 체크가 '차트에서 대면 이력을 확인했어요'.
 *  - [보드 기준] 진료실-1 재진은 '환자 응답(확인 필요)' 상자로 환자가 고른 내용을 보여 준다.
 *  - [보드 기준] 진료실-1 '본인확인 의무가 없는 미성년자' 문구 삭제 → 법정대리인 동의 완료 · {동의자} · {동의일시}.
 *  - [보드 기준] 진료실-1 병원급이면 허용 대상(예외 대상) 외 접수완료 비활성 + 안내.
 *  - [보드 기준] 진료실-2 전화로 진행·전환할 때 사유 모달. 초진은 첫 번째 사유(대면진료 받은 환자) 선택 불가.
 *  - [보드 기준] 진료실-2 화상진료 끄기 확인창 문구: '화상진료를 끄면 초진 환자는 배정되지 않아요. 재진 환자만 전화로 진료할 수 있어요.' 버튼 '취소 / 끄기'.
 *  - [유지·자체] 병원급 + 예외 대상 아님은 진료실-2로 점프해도 접수대기에 머문다(진료실-1에서 접수 불가와 맞춤).
 *  - [보드 기준] 진료실-3 취소 사유: 환자 월 2회 삭제, 건수 사유는 '의사별 비대면진료 가능 건수(월평균 500건)'로 교체.
 *  - [유지·자체] 목록·상세·프로필 메뉴·취소 다이얼로그 모양은 현행 캡처 재현. 개인정보는 캡처의 가상 값.
 *  - [유지·자체] 앱에서 전화 진료는 재진만 고를 수 있으므로 패널 '신청 진료 방식'은 재진일 때만 전화 선택 가능.
 *
 * 보류·TODO (기획 확인 필요)
 *  - [보류] 보드 진료실-1의 '주소지 서울 · 병원 서울 ✓' 비교 배지는 넣지 않았다. D8(주소 수집·비교 없음)과 맞지 않음. 대신 체크 문구에 '같은 시·도'만 둠.
 *  - [보류] 병원급 + 재진 중 허용 대상(수술 후 경과관찰·항암 등)은 플랫폼이 구분할 수 없다. 지금은 예외 대상만 접수 가능으로 처리.
 *  - [보류] 진료실-2 진료 시작 띠(진료대기 상세의 '진료를 시작해 주세요')와 '전화로 진료하기' 버튼 배치는 임의(현행 진료대기 상세 캡처 없음).
 *  - [보류] 진료실-2 예외 대상의 첫 번째 사유 선택 가능 여부(보드는 초진만 막음).
 *  - [보류] 진료실-2 화상진료 끄기 확인창의 '의사목록 순서' 문구는 정렬 기준 표시와 맞춘다고만 되어 있어 뺐다.
 *  - [보류] 진료실-3 취소 뒤 상태 표시(행 '진료취소')는 임의. 현행 취소 후 화면 미확인.
 *  - [보류] 진료실-3 '현재 내원 환자가 많아 진료가 어렵습니다'가 '진료하지 않은 판단으로 노출 불이익 금지'와 충돌하는지 법무 확인.
 *  - [보류] 보드 그레이존(엄격/완화) 카드는 법무 검토 전이라 반영하지 않음.
 *
 * 변경 이력
 *  - v0.1 (2026-11-20) 최초 작성. 진료실-1~3, 상태 토글 패널.
 * ─────────────────────────────────────────────────────────────
 */
import React, { useEffect, useMemo, useState } from 'react';

const LOGO = require('../../../assets/curation-price/goodoc-logo.svg');

/* ---------- 타입 ---------- */
type Jump = 'r1' | 'r2a' | 'r2b' | 'r3';
type Target = 'revisit' | 'first' | 'exception';
type Who = 'self' | 'child';
type Org = 'clinic' | 'hospital';
type Method = 'video' | 'phone';
type Status = 'request' | 'waiting' | 'onTreatment' | 'cancel';

const JUMPS: { key: Jump; label: string; kind: 'new' | 'mod' }[] = [
  { key: 'r1', label: '진료실-1 접수 전 확인', kind: 'mod' },
  { key: 'r2a', label: '진료실-2 전화 진료 사유', kind: 'new' },
  { key: 'r2b', label: '진료실-2 화상진료 끄기', kind: 'mod' },
  { key: 'r3', label: '진료실-3 진료 취소 사유', kind: 'mod' },
];
const KIND_LABEL = { new: '신규', mod: '수정' } as const;

/* 진료실-3 — 현행 7개에서 '환자 월 2회' 삭제, 건수 사유 교체 */
const CANCEL_REASONS = [
  '비대면 진료 대상 환자가 아닙니다.',
  '환자와 연락이 되지 않습니다.',
  '대면 진료가 필요한 증상입니다.',
  '현재 내원 환자가 많아 진료가 어렵습니다.',
  '의사별 비대면진료 가능 건수(월평균 500건)를 초과했습니다.',
];
const CANCEL_DIRECT = CANCEL_REASONS.length;

/* 진료실-2 — 법이 정한 전화(음성) 진료 사유 */
const PHONE_REASONS = [
  '이 병원에서 대면진료를 받은 환자이고, 전화로 충분하다고 판단했어요',
  '화상 연결이 안 돼요 (정보통신장애 등)',
  '그 밖의 불가피한 사유',
];
const PHONE_DIRECT = 2;

const TARGET_BADGE: Record<Target, string> = {
  revisit: '재진 · 환자 응답',
  first: '초진',
  exception: '예외 대상',
};

/* 목록의 다른 행 (현행 캡처 값) */
const OTHER_WAITING = [
  { at: '2026.10.04 09:00', name: '가*******F', when: '10월 4일 14:00 시작' },
  { at: '2026.10.04 09:00', name: '가****G', when: '' },
  { at: '2026.10.04 09:00', name: '가****O', when: '' },
];
const OTHER_DONE = [
  { at: '2026.10.04 09:10', name: '가****B', method: '화상', when: '진료 4분 전', st: '진료대기', cls: 'is-blue' },
  { at: '2026.10.04 09:00', name: '가****C', method: '전화', when: '', st: '수납대기', cls: 'is-green' },
];

/* ---------- 아이콘 ---------- */
const IconChevron = ({ up }: { up: boolean }) => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" style={{ transform: up ? 'rotate(180deg)' : undefined }}>
    <path d="M6 9l6 6 6-6" stroke="#808799" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const IconPin = () => (
  <svg width={12} height={12} viewBox="0 0 24 24" fill="none">
    <path d="M12 2a7 7 0 00-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 00-7-7zm0 9.5A2.5 2.5 0 1112 6.5a2.5 2.5 0 010 5z" fill="#fa4655" />
  </svg>
);
const IconUserPlus = () => (
  <svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <circle cx={9} cy={8} r={4} stroke="#31353f" strokeWidth={1.8} />
    <path d="M2 20c0-3.3 3.1-6 7-6s7 2.7 7 6" stroke="#31353f" strokeWidth={1.8} strokeLinecap="round" />
    <path d="M19 8v6M16 11h6" stroke="#31353f" strokeWidth={1.8} strokeLinecap="round" />
  </svg>
);
const IconPlay = () => (
  <svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <circle cx={12} cy={12} r={9} stroke="#31353f" strokeWidth={1.8} />
    <path d="M10 8.5v7l6-3.5-6-3.5z" fill="#31353f" />
  </svg>
);
const IconCopy = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <rect x={8} y={8} width={12} height={12} rx={2} stroke="#a8aebd" strokeWidth={1.6} />
    <path d="M16 8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h2" stroke="#a8aebd" strokeWidth={1.6} />
  </svg>
);
const IconOut = () => (
  <svg width={12} height={12} viewBox="0 0 24 24" fill="none">
    <path d="M7 17L17 7M9 7h8v8" stroke="#434956" strokeWidth={2} strokeLinecap="round" />
  </svg>
);

const Check = ({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button type="button" className={`uld-check ${on ? 'is-on' : ''}`} onClick={onClick}>
    <span className="uld-check-box">
      {on && (
        <svg width={12} height={12} viewBox="0 0 24 24" fill="none">
          <path d="M5 12.5l4.5 4.5L19 7.5" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </span>
    <span>{children}</span>
  </button>
);
const Radio = ({
  on,
  disabled,
  onClick,
  children,
}: {
  on: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) => (
  <button type="button" className={`uld-radio ${on ? 'is-on' : ''}`} disabled={disabled} onClick={onClick}>
    <span className="uld-radio-dot" />
    <span>{children}</span>
  </button>
);
const Toggle = ({ on, onClick }: { on: boolean; onClick?: () => void }) => (
  <button type="button" className={`uld-toggle ${on ? 'is-on' : ''}`} onClick={onClick} aria-pressed={on}>
    <span />
  </button>
);

type State = {
  jump: Jump;
  target: Target;
  who: Who;
  org: Org;
  method: Method;
};

export default function UntactLawDoctor() {
  /* 검토용 URL 파라미터: ?jump=r1&target=first&who=child&org=hospital&method=phone */
  const [s, setS] = useState<State>(() => {
    const init: State = { jump: 'r1', target: 'first', who: 'self', org: 'clinic', method: 'video' };
    try {
      const q = new URLSearchParams(window.location.search);
      (Object.keys(init) as (keyof State)[]).forEach(k => {
        const v = q.get(k);
        if (v) (init as Record<string, unknown>)[k] = v;
      });
      /* 오타 값은 기본값으로 */
      if (!JUMPS.some(j => j.key === init.jump)) init.jump = 'r1';
      if (!(init.target in TARGET_BADGE)) init.target = 'first';
      if (init.who !== 'child') init.who = 'self';
      if (init.org !== 'hospital') init.org = 'clinic';
      if (init.method !== 'phone' || init.target !== 'revisit') init.method = 'video';
    } catch {
      /* 파라미터 없음 */
    }
    return init;
  });
  const set = (p: Partial<State>) => setS(prev => ({ ...prev, ...p }));

  /* 가상환자 A 진행 상태 */
  const [status, setStatus] = useState<Status>('request');
  const [open, setOpen] = useState(true);
  const [checks, setChecks] = useState([false, false]);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelPick, setCancelPick] = useState(0);
  const [cancelText, setCancelText] = useState('');
  const [cancelDone, setCancelDone] = useState('');
  const [phoneOpen, setPhoneOpen] = useState(false);
  const [phonePick, setPhonePick] = useState<number | null>(null);
  const [phoneText, setPhoneText] = useState('');
  const [treatMethod, setTreatMethod] = useState<Method>('video');
  const [phoneDone, setPhoneDone] = useState('');
  /* 프로필 메뉴 · 화상진료 */
  const [menuOpen, setMenuOpen] = useState(false);
  const [videoOn, setVideoOn] = useState(true);
  const [videoOffOpen, setVideoOffOpen] = useState(false);

  /* 전화 진료는 재진만 신청 가능(앱과 같음) */
  useEffect(() => {
    if (s.target !== 'revisit' && s.method === 'phone') set({ method: 'video' });
  }, [s.target, s.method]);

  /* 화면 점프 · 대상 변경 시 진행 상태 초기화 */
  const phoneDefault = s.target === 'first' ? null : 0;
  const hospitalBlocked = s.org === 'hospital' && s.target !== 'exception';
  const reset = (jump: Jump) => {
    const r2a = jump === 'r2a' && !hospitalBlocked;
    setChecks([false, false]);
    setCancelOpen(jump === 'r3');
    setCancelPick(0);
    setCancelText('');
    setCancelDone('');
    setPhoneOpen(r2a);
    setPhonePick(phoneDefault);
    setPhoneText('');
    setPhoneDone('');
    setTreatMethod(s.method);
    setMenuOpen(false);
    setVideoOn(true);
    setVideoOffOpen(jump === 'r2b');
    setOpen(true);
    setStatus(r2a ? 'waiting' : 'request');
  };
  useEffect(() => reset(s.jump), [s.jump, s.target, s.who, s.org, s.method]);

  const phoneFirstDisabled = s.target === 'first';
  /* 모달은 열 때마다 처음 상태로 */
  const openPhone = () => {
    setPhonePick(phoneDefault);
    setPhoneText('');
    setPhoneOpen(true);
  };
  const openCancel = () => {
    setCancelPick(0);
    setCancelText('');
    setCancelOpen(true);
  };
  const canAccept = checks[0] && checks[1] && !hospitalBlocked;
  const isChild = s.who === 'child';
  const methodLabel = (m: Method) => (m === 'video' ? '화상' : '전화');

  const secondCheck =
    s.target === 'revisit'
      ? '차트에서 대면 이력을 확인했어요'
      : s.target === 'first'
        ? '비대면진료 대상 요건을 확인했어요 (초진 · 같은 시·도)'
        : '비대면진료 대상 요건을 확인했어요 (예외 대상)';

  const startTreatment = () => {
    if (s.method === 'phone') {
      openPhone();
      return;
    }
    setTreatMethod('video');
    setStatus('onTreatment');
  };
  const confirmPhone = () => {
    setPhoneDone(phonePick === PHONE_DIRECT ? phoneText.trim() : PHONE_REASONS[phonePick ?? 0]);
    setPhoneOpen(false);
    setTreatMethod('phone');
    setStatus('onTreatment');
  };
  const confirmCancel = () => {
    setCancelDone(cancelPick === CANCEL_DIRECT ? cancelText.trim() : CANCEL_REASONS[cancelPick]);
    setCancelOpen(false);
    setStatus('cancel');
    setOpen(false);
  };

  /* ───────── 가상환자 A 행 ───────── */
  const statusText: Record<Status, { t: string; cls: string }> = {
    request: { t: '접수대기', cls: '' },
    waiting: { t: '진료대기', cls: 'is-blue' },
    onTreatment: { t: '진료중', cls: 'is-blue' },
    cancel: { t: '진료취소', cls: 'is-gray' },
  };
  const rowA = (
    <div className={`uld-row-card ${open ? 'is-open' : ''}`}>
      <button type="button" className="uld-row" onClick={() => status !== 'cancel' && setOpen(o => !o)}>
        <span>2026.10.04 09:00</span>
        <span className="uld-name">
          <IconPin />
          가****A
        </span>
        <span>010-****-0000</span>
        <span>내과</span>
        <span>{methodLabel(status === 'onTreatment' ? treatMethod : s.method)}</span>
        <span />
        <span className={`uld-st ${statusText[status].cls}`}>{statusText[status].t}</span>
        <IconChevron up={open} />
      </button>
      {open && status !== 'cancel' && (
        <div className="uld-detail">
          {status === 'request' && (
            <div className="uld-banner">
              <IconUserPlus />
              <span>환자를 접수해 주세요.</span>
              <button
                type="button"
                className="uld-btn-primary"
                disabled={!canAccept}
                onClick={() => setStatus('waiting')}
              >
                접수완료
              </button>
            </div>
          )}
          {status === 'request' && (
            <div className="uld-confirm is-changed">
              <p className="uld-confirm-h">접수 전 확인 (의료인)</p>
              <Check on={checks[0]} onClick={() => setChecks(c => [!c[0], c[1]])}>
                환자 본인 여부를 확인했어요 (건강보험증·신분증)
              </Check>
              <Check on={checks[1]} onClick={() => setChecks(c => [c[0], !c[1]])}>
                {secondCheck}
              </Check>
            </div>
          )}
          {status === 'waiting' && (
            <div className="uld-banner">
              <IconPlay />
              <span>진료를 시작해 주세요.</span>
              {s.method === 'video' && (
                <button type="button" className="uld-btn-line is-changed" onClick={openPhone}>
                  전화로 진료하기
                </button>
              )}
              <button type="button" className="uld-btn-primary" onClick={startTreatment}>
                {s.method === 'phone' ? '전화 진료 시작' : '화상 진료 시작'}
              </button>
            </div>
          )}
          {status === 'onTreatment' && (
            <div className="uld-banner is-quiet">
              <span>{treatMethod === 'phone' ? '전화 진료 중이에요.' : '화상 진료 중이에요.'}</span>
            </div>
          )}

          {hospitalBlocked && status === 'request' && (
            <p className="uld-alert is-changed">
              병원급 의료기관 — 허용 대상이 아닌 환자는 접수할 수 없어요 (희귀질환·수술 후 경과관찰·항암 등만)
            </p>
          )}

          <div className="uld-info-head">
            <span className="uld-info-title">환자정보</span>
            <span className="uld-chips is-changed">
              <span className={`uld-chip is-${s.target}`}>{TARGET_BADGE[s.target]}</span>
              {isChild && <span className="uld-chip is-family">가족 대리 신청</span>}
            </span>
          </div>

          {s.target === 'revisit' && (
            <div className="uld-answer is-changed">
              <p className="uld-answer-h">재진 · 환자 응답 (확인 필요)</p>
              <p>
                환자가 "6개월 안에 같은 증상으로 대면진료 받음"을 골랐어요.
                <br />
                차트에서 대면 이력을 직접 확인해 주세요.
              </p>
            </div>
          )}

          <div className="uld-info-grid">
            <div className="uld-fields">
              {[
                ['환자명', '가상환자 A'],
                ['주민등록번호', isChild ? '1201013000000' : '9001011000000'],
                ['전화번호', '010-0000-0000'],
                ['키/몸무게', '165cm / 55kg'],
              ].map(([k, v]) => (
                <div key={k} className="uld-field">
                  <span className="uld-field-k">{k}</span>
                  <span className="uld-field-v">
                    {v}
                    <IconCopy />
                  </span>
                </div>
              ))}
            </div>
            <div className="uld-side">
              <div className="uld-field is-top">
                <span className="uld-field-k">환자 증상</span>
                <span className="uld-symptom">샘플 증상 설명입니다. 실제 진료 요청이 아닙니다.</span>
              </div>
              <div className="uld-field is-top">
                <span className="uld-field-k">환자 첨부사진</span>
                <span className="uld-photo">
                  <span className="uld-thumb" />
                  <button type="button" className="uld-btn-line">
                    내려받기
                  </button>
                </span>
              </div>
              {isChild && (
                <div className="uld-consent is-changed">
                  미성년 환자 법정대리인 동의 완료 · {'{동의자}'} · {'{동의일시}'}
                </div>
              )}
            </div>
          </div>

          <div className="uld-cert">
            <p className="uld-cert-h">제증명 발급 요청</p>
            <p className="uld-cert-v">
              환자 요청 <b>✓ 진료비 세부내역서</b> <b>✓ 진료비 영수증</b> <b>✓ 진료확인서</b>
            </p>
          </div>
          {status === 'request' && (
            <button type="button" className="uld-btn-line" onClick={openCancel}>
              진료취소
            </button>
          )}
        </div>
      )}
    </div>
  );

  const head = (
    <div className="uld-thead">
      <span>요청일시</span>
      <span>성별/환자명</span>
      <span>전화번호</span>
      <span>증상</span>
      <span>진료방식</span>
      <span>진료일시</span>
      <span className="uld-r">진료상태</span>
      <span />
    </div>
  );
  const plainRow = (r: { at: string; name: string; method?: string; when: string; st?: string; cls?: string }) => (
    <div key={r.name} className="uld-row-card">
      <div className="uld-row">
        <span>{r.at}</span>
        <span className="uld-name">
          <IconPin />
          {r.name}
        </span>
        <span>010-****-0000</span>
        <span>내과</span>
        <span>{r.method ?? '화상'}</span>
        <span>{r.when}</span>
        <span className={`uld-st ${r.cls ?? ''}`}>{r.st ?? '접수대기'}</span>
        <IconChevron up={false} />
      </div>
    </div>
  );

  const aInWaiting = status === 'request' || status === 'cancel';

  /* ───────── 모달 ───────── */
  const cancelModal = cancelOpen && (
    <div className="uld-dim">
      <div className="uld-modal is-changed" role="dialog" aria-label="진료 취소하기">
        <p className="uld-modal-title">진료 취소하기</p>
        <div className="uld-radios">
          {CANCEL_REASONS.map((r, i) => (
            <Radio key={r} on={cancelPick === i} onClick={() => setCancelPick(i)}>
              {r}
            </Radio>
          ))}
          <Radio on={cancelPick === CANCEL_DIRECT} onClick={() => setCancelPick(CANCEL_DIRECT)}>
            직접 입력
          </Radio>
          {cancelPick === CANCEL_DIRECT && (
            <textarea
              className="uld-textarea"
              placeholder="취소 사유를 입력해 주세요"
              value={cancelText}
              onChange={e => setCancelText(e.target.value)}
            />
          )}
        </div>
        <div className="uld-modal-btns">
          <button type="button" className="uld-btn-line" onClick={() => setCancelOpen(false)}>
            취소
          </button>
          <button
            type="button"
            className="uld-btn-primary"
            disabled={cancelPick === CANCEL_DIRECT && !cancelText.trim()}
            onClick={confirmCancel}
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );

  const phoneModal = phoneOpen && (
    <div className="uld-dim">
      <div className="uld-modal is-changed" role="dialog" aria-label="전화로 진료하기">
        <p className="uld-modal-title">전화로 진료하기</p>
        <p className="uld-modal-desc">화상진료가 원칙이에요. 전화로 진료하는 이유를 골라 주세요.</p>
        <div className="uld-radios">
          {PHONE_REASONS.map((r, i) => (
            <Radio
              key={r}
              on={phonePick === i}
              disabled={i === 0 && phoneFirstDisabled}
              onClick={() => setPhonePick(i)}
            >
              {r}
              {i === 0 && phoneFirstDisabled && <em className="uld-radio-sub">초진 환자는 선택할 수 없어요</em>}
            </Radio>
          ))}
          {phonePick === PHONE_DIRECT && (
            <textarea
              className="uld-textarea"
              placeholder="사유를 입력해 주세요"
              value={phoneText}
              onChange={e => setPhoneText(e.target.value)}
            />
          )}
        </div>
        <div className="uld-modal-btns">
          <button type="button" className="uld-btn-line" onClick={() => setPhoneOpen(false)}>
            취소
          </button>
          <button
            type="button"
            className="uld-btn-primary"
            disabled={phonePick === null || (phonePick === PHONE_DIRECT && !phoneText.trim())}
            onClick={confirmPhone}
          >
            전화 진료
          </button>
        </div>
      </div>
    </div>
  );

  const videoOffModal = videoOffOpen && (
    <div className="uld-dim">
      <div className="uld-modal is-small is-changed" role="dialog" aria-label="화상진료 끄기">
        <p className="uld-modal-title">화상진료 끄기</p>
        <p className="uld-modal-desc">화상진료를 끄면 초진 환자는 배정되지 않아요. 재진 환자만 전화로 진료할 수 있어요.</p>
        <div className="uld-modal-btns">
          <button type="button" className="uld-btn-line" onClick={() => setVideoOffOpen(false)}>
            취소
          </button>
          <button
            type="button"
            className="uld-btn-primary"
            onClick={() => {
              setVideoOn(false);
              setVideoOffOpen(false);
            }}
          >
            끄기
          </button>
        </div>
      </div>
    </div>
  );

  const profileMenu = menuOpen && (
    <div className="uld-menu">
      <div className="uld-menu-me">
        <span className="uld-avatar" />
        <span>샘플 김의사</span>
        <span className="uld-menu-chip">진료종료</span>
      </div>
      <div className="uld-menu-row">
        브라우저 알림 <Toggle on={false} />
      </div>
      <div className="uld-menu-row">
        소리 알림 <Toggle on={false} />
      </div>
      <button type="button" className="uld-menu-btn">
        의사 프로필 선택
      </button>
      <div className="uld-menu-sep" />
      <div className="uld-menu-row">
        화상진료
        <Toggle
          on={videoOn}
          onClick={() => {
            if (!videoOn) return setVideoOn(true);
            setMenuOpen(false);
            setVideoOffOpen(true);
          }}
        />
      </div>
      {['굿닥 파트너스', '이용가이드', '원격지원 프로그램'].map(t => (
        <div key={t} className="uld-menu-row">
          {t} <IconOut />
        </div>
      ))}
      <div className="uld-menu-sep" />
      <div className="uld-menu-row">로그아웃</div>
    </div>
  );

  /* ───────── 패널 ───────── */
  const notes: Record<Jump, string[]> = useMemo(
    () => ({
      r1: [
        '접수대기 상세. 바뀐 곳은 점선.',
        '현행 빨간 시범사업 안내와 "본인확인 의무가 없는 미성년자" 문구를 지우고, 진료 대상 배지·가족 대리 신청 배지를 둔다.',
        '접수 전 확인 2개를 모두 체크해야 접수완료가 켜진다. 재진은 두 번째가 대면 이력 확인.',
        '재진이면 환자 응답 상자, 자녀면 법정대리인 동의 기록, 병원급이면 예외 대상 외 접수 불가 안내.',
        '주소지·병원 시·도 비교 배지는 D8(주소 수집 없음)과 맞지 않아 넣지 않았다.',
      ],
      r2a: [
        '접수완료 뒤 진료대기 상세. 진료 시작 띠·버튼 배치는 임의(현행 미확인).',
        '전화로 신청한 재진은 "전화 진료 시작"을 누르면 사유 모달.',
        '화상으로 신청했으면 "전화로 진료하기"로 전환할 때 같은 모달.',
        '초진이면 첫 번째 사유(대면진료 받은 환자)를 고를 수 없다. 직접 입력은 글자가 있어야 확인.',
        '병원급 + 예외 대상 아님은 접수할 수 없어 진료대기로 넘어가지 않는다(접수대기 상태로 보임).',
      ],
      r2b: [
        '프로필 메뉴의 화상진료 토글을 끌 때 확인창. 본문과 확인 버튼 이름(확인 → 끄기)을 바꿨다.',
        'OFF는 "초진 환자 배정 제외" 의미. 의사목록 순서 문구는 정렬 기준 표시가 정해지면 맞춘다(보류).',
        '켤 때는 확인창 없이 바로 켜짐.',
      ],
      r3: [
        '진료취소 다이얼로그. 현행 7개 → 5개 + 직접 입력.',
        '삭제: 이번 달 환자의 비대면진료 가능 횟수(2회). 교체: 병원 월 건수 → 의사별 월평균 500건.',
        '직접 입력은 글자가 있어야 확인. 확인하면 행이 진료취소로 바뀐다(표시 방식 임의).',
        '고른 사유는 앱 진료내역 ④에 그대로 보인다(D10, 페어 화면에서 연결).',
      ],
    }),
    [],
  );

  const Seg = <K extends string>({
    label,
    value,
    options,
    onChange,
  }: {
    label: string;
    value: K;
    options: { k: K; t: string; disabled?: boolean }[];
    onChange: (k: K) => void;
  }) => (
    <div className="uld-ctl-row">
      <span className="uld-ctl-label">{label}</span>
      <div className="uld-seg">
        {options.map(o => (
          <button
            key={o.k}
            className={value === o.k ? 'is-on' : ''}
            disabled={o.disabled}
            onClick={() => onChange(o.k)}
          >
            {o.t}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="uld-root">
      <aside className="uld-panel">
        <div className="uld-panel-card">
          <p className="uld-panel-title">온라인진료실 · 제도화 대응</p>
          <p className="uld-panel-sub">
            굿닥 온라인진료실(의사용) · 검토용 초안 v0.1 · 현행 화면은 캡처 기준 재현, 동적 값은 {'{중괄호}'}
          </p>
        </div>
        <div className="uld-panel-card">
          <p className="uld-panel-h">화면 바로 가기</p>
          <div className="uld-jumps">
            {JUMPS.map(j => (
              <button
                key={j.key}
                className={`uld-jump ${s.jump === j.key ? 'is-on' : ''}`}
                onClick={() => (s.jump === j.key ? reset(j.key) : set({ jump: j.key }))}
              >
                <span>{j.label}</span>
                <span className={`uld-badge is-${j.kind}`}>{KIND_LABEL[j.kind]}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="uld-panel-card uld-ctl">
          <p className="uld-panel-h" style={{ margin: 0 }}>
            상태 (가상환자 A)
          </p>
          <Seg
            label="진료 대상(환자 선택)"
            value={s.target}
            options={[
              { k: 'revisit', t: '재진' },
              { k: 'first', t: '초진' },
              { k: 'exception', t: '예외' },
            ]}
            onChange={k => set({ target: k })}
          />
          <Seg
            label="진료 받는 사람"
            value={s.who}
            options={[
              { k: 'self', t: '본인' },
              { k: 'child', t: '자녀(미성년)' },
            ]}
            onChange={k => set({ who: k })}
          />
          <Seg
            label="의료기관"
            value={s.org}
            options={[
              { k: 'clinic', t: '의원급' },
              { k: 'hospital', t: '병원급' },
            ]}
            onChange={k => set({ org: k })}
          />
          <Seg
            label="신청 진료 방식"
            value={s.method}
            options={[
              { k: 'video', t: '화상' },
              { k: 'phone', t: '전화(재진만)', disabled: s.target !== 'revisit' },
            ]}
            onChange={k => set({ method: k })}
          />
        </div>
        <div className="uld-panel-card">
          <p className="uld-panel-h">이 화면</p>
          <ul className="uld-note">
            {notes[s.jump].map(n => (
              <li key={n}>{n}</li>
            ))}
          </ul>
          {cancelDone && <p className="uld-panel-result">취소 사유: {cancelDone}</p>}
          {phoneDone && <p className="uld-panel-result">전화 진료 사유: {phoneDone}</p>}
        </div>
      </aside>

      <div className="uld-stage">
        <span className="uld-stage-cap">
          {JUMPS.find(j => j.key === s.jump)!.label} · 점선 = 바뀐 곳
        </span>
        <section className="uld-frame">
          <header className="uld-gnb">
            <div className="uld-brand">
              <img src={LOGO} alt="goodoc" />
              <span>온라인진료실</span>
            </div>
            <nav className="uld-tabs">
              <span className="is-on">접수대기</span>
              <span>진료완료</span>
              <span>운영관리</span>
              <span>공지사항</span>
            </nav>
            <button type="button" className="uld-me" onClick={() => setMenuOpen(o => !o)}>
              <span className="uld-avatar" />
              샘플 김의사
              <IconChevron up={menuOpen} />
            </button>
            {profileMenu}
          </header>
          <main className="uld-main" onClick={() => setMenuOpen(false)}>
            <div className="uld-sec-head">
              <h2>접수대기</h2>
              <span className="uld-sec-toggles">
                바로진료 <Toggle on /> 진료예약 <Toggle on />
              </span>
            </div>
            {head}
            <div className="uld-rows">
              {aInWaiting && rowA}
              {OTHER_WAITING.map(r => plainRow(r))}
            </div>
            <div className="uld-sec-head">
              <h2>접수완료</h2>
            </div>
            {head}
            <div className="uld-rows">
              {!aInWaiting && rowA}
              {OTHER_DONE.map(r => plainRow(r))}
            </div>
          </main>
          {cancelModal}
          {phoneModal}
          {videoOffModal}
        </section>
      </div>
    </div>
  );
}
