/**
 * ─────────────────────────────────────────────────────────────
 * 이름      : untact-law-doctor — 굿닥 온라인진료실(의사용) · 비대면진료 제도화(의료법 개정) 대응
 * 상태      : 검토용 초안 · v0.3 · 최종수정 2026-11-20 · 샌드박스 배포
 * PRD       : 없음(제도화 대응 기획 초안). 사내 문서 링크는 공개 저장소라 미기재.
 * 배포URL   : https://connect-sq-sandbox.github.io/out/untact-law-doctor.html
 * 피그마    : 없음. 기준은 대응 보드 커넥트 섹션(진료실-1~3) + 현행 온라인진료실 개발 코드.
 * 현행 기준 : goodoc-web-platform origin/main(38379841, 2026-10-22) apps/partners/src/features/online-clinic
 *             workspace.tsx(GNB·화상진료 확인창) · treatment-table.tsx(목록) · treatment-details.tsx(상세·다이얼로그)
 *             patient-information.tsx · symptom-attachments.tsx · clinical-notices.tsx · profile-menu.tsx · packages/ui button·dialog
 *             소스는 복사하지 않고 치수·색·문구만 옮겨 다시 작성(공개 저장소).
 * 관련 CSS  : styles/untactLawDoctor.css (css-manifest 'untact-law-doctor')
 * 에셋      : assets/untact-law-doctor/ (partners public/images 원본 svg 6종: 로고·의사 아바타·성별·작업 아이콘)
 * 기술제약  : 샌드박스 빌드 = react 훅 + plain CSS, 외부 요청 0.
 * 화면구성  : 좌측 상태 패널(화면 점프 · 상태 토글 · 화면별 메모) + 온라인진료실(본문 1140px)
 *             접수대기 목록(현행) → 진료실-1 접수대기 상세·접수 전 확인(수정) → 예상 대기 시간 설정(현행)
 *             → 진료실-2 진료시작·전화 진료 사유(신규) · 화상진료 끄기 확인창(수정) → 진료실-3 진료 취소 사유(수정)
 *
 * 핵심 결정(why)
 *  - [확정·요청] 프로토는 제품별로 나눈다. 이 파일은 의사 어드민, 앱은 untact-law-app, 둘을 잇는 건 untact-law-pair(D9).
 *  - [확정·요청] 현행 화면은 실제 개발 코드(partners online-clinic) 치수·문구 그대로 재현한다.
 *  - [보드 기준] 진료실-1 환자정보: 시범사업 빨간 안내(EligibilityWarning) 대신 진료 대상 배지(재진 · 환자 응답 / 초진 / 예외 대상), 자녀면 '가족 대리 신청' 배지.
 *  - [보드 기준] 진료실-1 접수 전 확인 체크 2개를 모두 체크해야 접수완료 활성. 재진은 두 번째 체크가 '차트에서 대면 이력을 확인했어요'.
 *  - [보드 기준] 진료실-1 재진은 '환자 응답(확인 필요)' 상자로 환자가 고른 내용을 보여 준다.
 *  - [보드 기준] 진료실-1 '본인확인 의무가 없는 미성년자 환자입니다.' 문구 자리에 법정대리인 동의 완료 · {동의자} · {동의일시}.
 *  - [확정·요청] 진료실-1 초진이면 접수 전 확인 상자 아래에 실거주 증명 첨부 열람 영역(첨부 없음 / 있음). 환자가 앱 ② 신청서에서 가림 처리해 올린 서류(D8).
 *  - [보드 기준] 진료실-2 전화로 진행·전환할 때 사유 모달. 초진은 첫 번째 사유(대면진료 받은 환자) 선택 불가.
 *  - [보드 기준] 진료실-2 화상진료 끄기 확인창 본문: '화상진료를 끄면 초진 환자는 배정되지 않아요. 재진 환자만 전화로 진료할 수 있어요.' 버튼은 현행 '취소 / 확인'.
 *  - [보드 기준] 진료실-3 취소 사유: 환자 월 2회 삭제, 건수 사유는 '의사별 비대면진료 가능 건수(월평균 500건)'로 교체. 직접 입력 안내·검증은 현행 그대로.
 *  - [유지·자체] 전화로 신청한 재진은 '진료시작'을 누르면 현행 '진료 시작하기' 확인창 대신 전화 진료 사유 모달.
 *  - [유지·자체] 앱에서 전화 진료는 재진만 고를 수 있으므로 패널 '신청 진료 방식'은 재진일 때만 전화 선택 가능.
 *
 * 보류·TODO (기획 확인 필요)
 *  - [보류] 보드 진료실-1의 '주소지 서울 · 병원 서울 ✓' 비교 배지는 넣지 않았다. 플랫폼은 주소를 입력받거나 비교하지 않고, 의사가 첨부 서류로 확인한다(D8).
 *  - [보류] 실거주 증명을 '가림 필요'로 환자에게 다시 요청하는 반려 흐름은 미결이라 만들지 않았다.
 *  - [보류] 첨부된 실거주 증명 서류의 파기 시점은 미결.
 *  - [확정·요청] 굿닥 비대면진료에는 병원급 의료기관이 없으므로 의료기관 구분·병원급 접수 제한(보드 진료실-1)은 넣지 않는다.
 *  - [보류] 화상으로 신청한 환자를 전화로 바꾸는 '전화로 진료하기' 버튼(진료대기 띠 안) 배치는 임의.
 *  - [보류] 진료실-2 예외 대상의 첫 번째 사유 선택 가능 여부(보드는 초진만 막음).
 *  - [보류] 진료실-2 화상진료 끄기 확인창의 '의사목록 순서' 문구는 정렬 기준 표시와 맞춘다고만 되어 있어 뺐다.
 *  - [보류] 진료실-3 '현재 내원 환자가 많아 진료가 어렵습니다'가 '진료하지 않은 판단으로 노출 불이익 금지'와 충돌하는지 법무 확인.
 *  - [보류] 접수 전 확인 상자 모양은 임의(현행 대응 요소 없음).
 *  - [보류] 보드 그레이존(엄격/완화) 카드는 법무 검토 전이라 반영하지 않음.
 *
 * 변경 이력
 *  - v0.3 (2026-11-20) D8 변경 반영: 진료실-1 초진 실거주 증명 첨부 열람 영역, 패널 토글 '실거주 증명'.
 *  - v0.2 (2026-11-20) 현행 화면을 실제 개발 코드 기준으로 다시 그림(GNB·목록·작업 띠·대기 타이머·환자정보·첨부사진·다이얼로그·프로필 메뉴).
 *    의료기관 구분(의원급/병원급) 토글과 병원급 접수 제한 제거.
 *    진료취소한 행은 현행대로 접수대기·접수완료 표에서 빠진다(진료완료 탭은 그리지 않음, 패널에 사유 표시).
 *    현행 흐름 추가: 접수완료 → 예상 대기 시간 설정, 진료시작 → 진료 시작하기 → 완료대기. 화상진료 끄기 버튼은 현행 '확인'으로.
 *  - v0.1 (2026-11-20) 최초 작성. 진료실-1~3, 상태 토글 패널.
 * ─────────────────────────────────────────────────────────────
 */
import React, { useEffect, useMemo, useState } from 'react';

const IMG_LOGO = require('../../../assets/untact-law-doctor/img_logo_untact.svg');
const IMG_DOCTOR = require('../../../assets/untact-law-doctor/img_doctor_avatar.svg');
const IMG_FEMALE = require('../../../assets/untact-law-doctor/female.svg');
const IMG_MALE = require('../../../assets/untact-law-doctor/male.svg');
const IC_RECEPTION = require('../../../assets/untact-law-doctor/ic_task_reception.svg');
const IC_TREATMENT = require('../../../assets/untact-law-doctor/ic_task_treatment.svg');
const IC_DOWNLOAD = require('../../../assets/untact-law-doctor/ic_download.svg');

/* ---------- 타입 ---------- */
type Jump = 'r1' | 'r2a' | 'r2b' | 'r3';
type Target = 'revisit' | 'first' | 'exception';
type Who = 'self' | 'child';
type Method = 'video' | 'phone';
type Status = 'request' | 'waiting' | 'ontreatment' | 'cancel';
type Dialog = 'reception' | 'start' | 'phone' | 'cancel' | 'video' | null;

const JUMPS: { key: Jump; label: string; kind: 'new' | 'mod' }[] = [
  { key: 'r1', label: '진료실-1 접수 전 확인', kind: 'mod' },
  { key: 'r2a', label: '진료실-2 전화 진료 사유', kind: 'new' },
  { key: 'r2b', label: '진료실-2 화상진료 끄기', kind: 'mod' },
  { key: 'r3', label: '진료실-3 진료 취소 사유', kind: 'mod' },
];
const KIND_LABEL = { new: '신규', mod: '수정' } as const;

/* 진료실-3 — 현행 types.ts cancelReasons 에서 '환자 월 2회' 삭제, 건수 사유 교체 */
const CANCEL_REASONS = [
  '비대면 진료 대상 환자가 아닙니다.',
  '환자와 연락이 되지 않습니다.',
  '대면 진료가 필요한 증상입니다.',
  '현재 내원 환자가 많아 진료가 어렵습니다.',
  '의사별 비대면진료 가능 건수(월평균 500건)를 초과했습니다.',
  '직접 입력',
];
const CANCEL_DIRECT = '직접 입력';

/* 진료실-2 — 법이 정한 전화(음성) 진료 사유 */
const PHONE_REASONS = [
  '이 병원에서 대면진료를 받은 환자이고, 전화로 충분하다고 판단했어요',
  '화상 연결이 안 돼요 (정보통신장애 등)',
  '그 밖의 불가피한 사유',
];
const PHONE_DIRECT = 2;

/* 현행 types.ts waitingTimes */
const WAITING_TIMES = [
  { value: '5', label: '5분' },
  { value: '10', label: '10분' },
  { value: '15', label: '15분' },
  { value: '0', label: '접수 순으로 진료예정' },
];

const TARGET_BADGE: Record<Target, string> = {
  revisit: '재진 · 환자 응답',
  first: '초진',
  exception: '예외 대상',
};

/* 현행 treatment-table.tsx 상태 색 */
const STATUS: Record<Status, { t: string; c: string }> = {
  request: { t: '접수대기', c: '#31353F' },
  waiting: { t: '진료대기', c: 'rgba(0,115,250,.9)' },
  ontreatment: { t: '완료대기', c: 'rgba(0,115,250,.9)' },
  cancel: { t: '진료취소', c: '#A8AEBD' },
};

type Row = { at: string; name: string; female: boolean; method: string; when: string; st: Status | 'endcall' };
const OTHER_WAITING: Row[] = [
  { at: '2026.10.04 09:00', name: '가*******F', female: true, method: '화상', when: '10월 4일 14:00 시작', st: 'request' },
  { at: '2026.10.04 09:00', name: '가****G', female: true, method: '화상', when: '', st: 'request' },
  { at: '2026.10.04 09:00', name: '가****O', female: false, method: '화상', when: '', st: 'request' },
];
const OTHER_DONE: Row[] = [
  { at: '2026.10.04 09:10', name: '가****B', female: false, method: '화상', when: '진료 4분 전', st: 'waiting' },
  { at: '2026.10.04 09:00', name: '가****C', female: true, method: '전화', when: '', st: 'endcall' },
];

/* ---------- 현행 아이콘(legacy-icons.tsx path) ---------- */
const IconVerified = ({ size = 20 }: { size?: number }) => (
  <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M8.6 22.5L6.7 19.3L3.1 18.5L3.45 14.8L1 12L3.45 9.2L3.1 5.5L6.7 4.7L8.6 1.5L12 2.95L15.4 1.5L17.3 4.7L20.9 5.5L20.55 9.2L23 12L20.55 14.8L20.9 18.5L17.3 19.3L15.4 22.5L12 21.05L8.6 22.5ZM10.95 15.55L16.6 9.9L15.2 8.45L10.95 12.7L8.8 10.6L7.4 12L10.95 15.55Z"
      fill="currentColor"
    />
  </svg>
);
const IconCopy = () => (
  <svg aria-hidden="true" width={20} height={20} viewBox="0 0 20 20" fill="none">
    <path
      d="M4.37501 18.667C3.80567 18.667 3.32301 18.469 2.92701 18.073C2.53101 17.677 2.33301 17.1943 2.33301 16.625V5.27101H4.37501V16.625H13.729V18.667H4.37501ZM7.91701 15.125C7.34701 15.125 6.86434 14.927 6.46901 14.531C6.07301 14.1357 5.87501 13.653 5.87501 13.083V3.37501C5.87501 2.80567 6.07301 2.32301 6.46901 1.92701C6.86434 1.53101 7.34701 1.33301 7.91701 1.33301H15.625C16.1943 1.33301 16.677 1.53101 17.073 1.92701C17.469 2.32301 17.667 2.80567 17.667 3.37501V13.083C17.667 13.653 17.469 14.1357 17.073 14.531C16.677 14.927 16.1943 15.125 15.625 15.125H7.91701ZM7.91701 13.083H15.625V3.37501H7.91701V13.083Z"
      fill="currentColor"
    />
  </svg>
);

const Switch = ({ on, onClick }: { on: boolean; onClick?: () => void }) => (
  <button type="button" role="switch" aria-checked={on} className={`uld-switch ${on ? 'is-on' : ''}`} onClick={onClick}>
    <span />
  </button>
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
const Btn = ({
  v = 'primary',
  children,
  className = '',
  ...rest
}: { v?: 'primary' | 'secondary' } & React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button type="button" className={`uld-btn is-${v} ${className}`} {...rest}>
    {children}
  </button>
);
const Avatar = ({ on }: { on: boolean }) => (
  <span className="uld-avatar">
    <img src={IMG_DOCTOR} alt="" />
    <span className={`uld-avatar-dot ${on ? 'is-on' : ''}`} />
  </span>
);

/* 현행 table 열 비율(담당의 열 없음 — 의사 프로필 선택 상태) */
const COLS = [
  { label: '요청일시', w: 2 },
  { label: '성별/환자명', w: 2 },
  { label: '전화번호', w: 2.2 },
  { label: '증상', w: 2 },
  { label: '진료방식', w: 1 },
  { label: '진료일시', w: 2.2 },
  { label: '진료상태', w: 1, right: true },
];

type State = { jump: Jump; target: Target; who: Who; method: Method; proof: 'none' | 'attached' };

export default function UntactLawDoctor() {
  /* 검토용 URL 파라미터: ?jump=r1&target=first&who=child&method=phone&proof=none */
  const [s, setS] = useState<State>(() => {
    const init: State = { jump: 'r1', target: 'first', who: 'self', method: 'video', proof: 'attached' };
    try {
      const q = new URLSearchParams(window.location.search);
      (Object.keys(init) as (keyof State)[]).forEach(k => {
        const v = q.get(k);
        if (v) (init as Record<string, unknown>)[k] = v;
      });
      if (!JUMPS.some(j => j.key === init.jump)) init.jump = 'r1';
      if (!(init.target in TARGET_BADGE)) init.target = 'first';
      if (init.who !== 'child') init.who = 'self';
      if (init.method !== 'phone' || init.target !== 'revisit') init.method = 'video';
      if (init.proof !== 'none') init.proof = 'attached';
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
  const [dialog, setDialog] = useState<Dialog>(null);
  const [wait, setWait] = useState('5');
  const [waitAt, setWaitAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);
  const [cancelPick, setCancelPick] = useState(CANCEL_REASONS[0]);
  const [cancelText, setCancelText] = useState('');
  const [cancelError, setCancelError] = useState('');
  const [cancelDone, setCancelDone] = useState('');
  const [phonePick, setPhonePick] = useState<number | null>(null);
  const [phoneText, setPhoneText] = useState('');
  const [phoneDone, setPhoneDone] = useState('');
  const [treatMethod, setTreatMethod] = useState<Method>('video');
  const [menuOpen, setMenuOpen] = useState(false);
  const [videoOn, setVideoOn] = useState(true);

  /* 전화 진료는 재진만 신청 가능(앱과 같음) */
  useEffect(() => {
    if (s.target !== 'revisit' && s.method === 'phone') set({ method: 'video' });
  }, [s.target, s.method]);

  const phoneDefault = s.target === 'first' ? null : 0;
  const isChild = s.who === 'child';

  const reset = (jump: Jump) => {
    const r2a = jump === 'r2a';
    setChecks([false, false]);
    setCancelPick(CANCEL_REASONS[0]);
    setCancelText('');
    setCancelError('');
    setCancelDone('');
    setPhonePick(phoneDefault);
    setPhoneText('');
    setPhoneDone('');
    setTreatMethod(s.method);
    setMenuOpen(false);
    setVideoOn(true);
    setWait('5');
    setWaitAt(r2a ? Date.now() + 5 * 60_000 : null);
    setOpen(true);
    setStatus(r2a ? 'waiting' : 'request');
    setDialog(jump === 'r3' ? 'cancel' : jump === 'r2b' ? 'video' : r2a ? 'phone' : null);
  };
  useEffect(() => reset(s.jump), [s.jump, s.target, s.who, s.method]);

  const canAccept = checks[0] && checks[1];
  const methodLabel = (m: Method) => (m === 'video' ? '화상' : '전화');
  const secondCheck =
    s.target === 'revisit'
      ? '차트에서 대면 이력을 확인했어요'
      : s.target === 'first'
        ? '비대면진료 대상 요건을 확인했어요 (초진 · 같은 시·도)'
        : '비대면진료 대상 요건을 확인했어요 (예외 대상)';

  /* 다이얼로그 열기 — 열 때마다 처음 상태로 */
  const openPhone = () => {
    setPhonePick(phoneDefault);
    setPhoneText('');
    setDialog('phone');
  };
  const openCancel = () => {
    setCancelPick(CANCEL_REASONS[0]);
    setCancelText('');
    setCancelError('');
    setDialog('cancel');
  };
  const confirm = () => {
    if (dialog === 'reception') {
      setWaitAt(wait === '0' ? null : Date.now() + Number(wait) * 60_000);
      setStatus('waiting');
    }
    if (dialog === 'start') {
      setTreatMethod('video');
      setStatus('ontreatment');
    }
    if (dialog === 'phone') {
      setPhoneDone(phonePick === PHONE_DIRECT ? phoneText.trim() : PHONE_REASONS[phonePick ?? 0]);
      setTreatMethod('phone');
      setStatus('ontreatment');
    }
    if (dialog === 'cancel') {
      /* 현행 treatment-details.tsx confirm(): 직접 입력 빈칸이면 안내 */
      if (cancelPick === CANCEL_DIRECT && !cancelText.trim()) {
        setCancelError('취소 사유를 입력해 주세요.');
        return;
      }
      setCancelDone(cancelPick === CANCEL_DIRECT ? cancelText.trim() : cancelPick);
      setStatus('cancel');
    }
    if (dialog === 'video') setVideoOn(false);
    setDialog(null);
  };

  /* 현행 treatment-list-model.ts treatmentListWaitingTime · timing-model.ts waitingTimeLabel */
  const diff = waitAt === null ? null : waitAt - now;
  const waitLabel =
    diff === null || diff < 0 ? '' : diff < 60_000 ? `진료 ${Math.floor(diff / 1000)}초 전` : `진료 ${Math.floor(diff / 60_000)}분 전`;
  const barTimer = (() => {
    if (diff === null) return '';
    const sec = Math.floor(Math.abs(diff) / 1000);
    const m = Math.floor(sec / 60);
    return `${diff >= 0 ? '진료' : '대기'} ${m ? `${m}분 ` : ''}${sec % 60}초 ${diff >= 0 ? '전' : '경과'}`;
  })();

  /* ───────── 목록 행 ───────── */
  const cells = (r: Row) => [
    r.at,
    <span className="uld-name" key="n">
      <span className={`uld-gender ${r.female ? 'is-f' : 'is-m'}`}>
        <img src={r.female ? IMG_FEMALE : IMG_MALE} alt={r.female ? '여' : '남'} />
        {r.st === 'waiting' && <span className="uld-gender-dot" />}
      </span>
      <b>{r.name}</b>
    </span>,
    '010-****-0000',
    '내과',
    r.method,
    r.when,
    <span key="s" style={{ color: r.st === 'endcall' ? '#18AC6C' : STATUS[r.st].c }}>
      {r.st === 'endcall' ? '수납대기' : STATUS[r.st].t}
    </span>,
  ];
  const rowLine = (r: Row, expanded: boolean, onClick?: () => void) => (
    <button type="button" className="uld-row" aria-expanded={expanded} onClick={onClick}>
      {cells(r).map((c, i) => (
        <span key={COLS[i].label} className="uld-cell" style={{ flex: COLS[i].w, textAlign: COLS[i].right ? 'right' : undefined }}>
          {c}
        </span>
      ))}
      <span className={`uld-caret ${expanded ? 'is-up' : ''}`} style={{ flex: 0.5 }}>
        ⌄
      </span>
    </button>
  );

  const rowAData: Row = {
    at: '2026.10.04 09:00',
    name: '가****A',
    female: true,
    method: methodLabel(status === 'ontreatment' ? treatMethod : s.method),
    when: status === 'waiting' ? waitLabel : '',
    st: status,
  };

  /* 작업 띠 — 현행 actionBar */
  const barStyle: Record<'request' | 'waiting' | 'ontreatment', React.CSSProperties> = {
    request: { color: '#0073FA', background: 'rgba(0,115,250,.1)', borderColor: 'rgba(0,115,250,.15)' },
    waiting: { color: 'white', background: 'rgba(0,115,250,.9)', borderColor: '#0073FA' },
    ontreatment: { color: 'white', background: '#0961CE', borderColor: '#056BE1' },
  };
  const barMsg = { request: '환자를 접수해 주세요.', waiting: '진료를 시작해 주세요.', ontreatment: '진료를 완료해 주세요.' };
  const actionBar = status !== 'cancel' && (
    <div className="uld-bar" style={barStyle[status]}>
      <div className="uld-bar-msg">
        <img src={status === 'request' ? IC_RECEPTION : IC_TREATMENT} alt="" />
        <div>
          <strong>{barMsg[status]}</strong>
          {status === 'waiting' && barTimer && <p className="uld-bar-timer">{barTimer}</p>}
        </div>
      </div>
      <div className="uld-bar-btns">
        {status === 'request' && (
          <Btn disabled={!canAccept} onClick={() => setDialog('reception')}>
            접수완료
          </Btn>
        )}
        {status === 'waiting' && s.method === 'video' && (
          <Btn v="secondary" className="uld-on-blue is-changed" onClick={openPhone}>
            전화로 진료하기
          </Btn>
        )}
        {status === 'waiting' && (
          <Btn onClick={() => (s.method === 'phone' ? openPhone() : setDialog('start'))}>진료시작</Btn>
        )}
        {status === 'ontreatment' && (
          <Btn v="secondary" className="uld-on-blue" onClick={() => (treatMethod === 'phone' ? openPhone() : setDialog('start'))}>
            다시 진료시작
          </Btn>
        )}
        {(status === 'waiting' || status === 'ontreatment') && <Btn>진료완료</Btn>}
      </div>
    </div>
  );

  const detail = (
    <div className="uld-detail">
      {actionBar}
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
      {s.target === 'first' && (
        <div className="uld-proof is-changed">
          <span className="uld-proof-k">실거주 증명 첨부</span>
          {s.proof === 'attached' ? (
            <div className="uld-photos">
              <span className="uld-proof-thumb">
                <span className="uld-mini-doc">
                  <b>부동산 임대차 계약서</b>
                  <i className="is-keep" />
                  <i />
                  <i className="is-keep is-short" />
                  <i />
                  <i />
                </span>
                <img className="uld-photo-dl" src={IC_DOWNLOAD} alt="" />
              </span>
              <Btn v="secondary" className="uld-photo-btn">
                내려받기
              </Btn>
            </div>
          ) : (
            <span className="uld-proof-none">첨부 없음</span>
          )}
        </div>
      )}

      <section className="uld-section">
        <div className="uld-section-head">
          <h3>환자정보</h3>
          <span className="uld-chips is-changed">
            <span className={`uld-chip is-${s.target}`}>{TARGET_BADGE[s.target]}</span>
            {isChild && <span className="uld-chip is-family">가족 대리 신청</span>}
          </span>
          {isChild ? (
            <p className="uld-identity is-changed">
              <IconVerified />
              미성년 환자 법정대리인 동의 완료 · {'{동의자}'} · {'{동의일시}'}
            </p>
          ) : (
            <p className="uld-identity">
              <IconVerified />
              2026.10.04 통신사 본인확인을 완료한 환자입니다.
            </p>
          )}
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
        <div className="uld-info">
          <dl className="uld-dl">
            {[
              ['환자명', '가상환자 A'],
              ['주민등록번호', isChild ? '1201014000000' : '9001012000000'],
              ['전화번호', '010-0000-0000'],
              ['키/몸무게', '165cm / 55kg'],
            ].map(([k, v]) => (
              <React.Fragment key={k}>
                <dt>{k}</dt>
                <dd>
                  <span>{v}</span>
                  <span className="uld-copy">
                    <IconCopy />
                  </span>
                </dd>
              </React.Fragment>
            ))}
          </dl>
          <div className="uld-symptom-col">
            <div className="uld-symptom-row">
              <label>환자 증상</label>
              <div className="uld-symptom">
                샘플 증상 설명입니다. 실제 진료 요청이 아닙니다.
                <span className="uld-copy uld-copy-abs">
                  <IconCopy />
                </span>
              </div>
            </div>
            <div className="uld-symptom-row">
              <label>환자 첨부사진</label>
              <div className="uld-photos">
                <span className="uld-photo">
                  <img className="uld-photo-dl" src={IC_DOWNLOAD} alt="" />
                </span>
                <Btn v="secondary" className="uld-photo-btn">
                  내려받기
                </Btn>
              </div>
            </div>
          </div>
        </div>
      </section>

      {status === 'request' ? (
        <div className="uld-cert">
          <h4>제증명 발급 요청</h4>
          <div>
            <span className="uld-cert-k">환자 요청</span>
            <b>✓ 진료비 세부내역서</b>
            <b>✓ 진료비 영수증</b>
            <b>✓ 진료확인서</b>
          </div>
        </div>
      ) : (
        <section className="uld-section">
          <div className="uld-section-head">
            <h3>진료 메모</h3>
          </div>
          <div className="uld-memo">메모를 입력해 주세요</div>
        </section>
      )}
      <div className="uld-cancel-wrap">
        <Btn v="secondary" onClick={openCancel}>
          진료취소
        </Btn>
      </div>
    </div>
  );


  /* ───────── 다이얼로그(packages/ui Dialog) ───────── */
  const DIALOG_TITLE: Record<Exclude<Dialog, null>, string> = {
    reception: '예상 대기 시간 설정',
    start: '진료 시작하기',
    phone: '전화로 진료하기',
    cancel: '진료 취소하기',
    video: '화상진료 끄기',
  };
  const dialogEl = dialog && (
    <div className="uld-backdrop" onClick={() => setDialog(null)}>
      <div
        role="dialog"
        aria-label={DIALOG_TITLE[dialog]}
        className={`uld-dialog ${dialog === 'reception' ? 'is-small' : ''} ${['phone', 'cancel', 'video'].includes(dialog) ? 'is-changed' : ''}`}
        onClick={e => e.stopPropagation()}
      >
        <p className="uld-dialog-title">{DIALOG_TITLE[dialog]}</p>
        {dialog === 'start' && <p className="uld-dialog-desc">진료실에서 진료를 시작합니다.</p>}
        {dialog === 'phone' && <p className="uld-dialog-desc">화상진료가 원칙이에요. 전화로 진료하는 이유를 골라 주세요.</p>}
        {dialog === 'video' && (
          <p className="uld-dialog-desc">화상진료를 끄면 초진 환자는 배정되지 않아요. 재진 환자만 전화로 진료할 수 있어요.</p>
        )}
        {['reception', 'cancel', 'phone'].includes(dialog) && (
          <div className="uld-dialog-body">
            {dialog === 'reception' && (
              <label className="uld-wait">
                환자에게 안내할 예상 대기시간을 선택해 주세요.
                <select value={wait} onChange={e => setWait(e.target.value)}>
                  {WAITING_TIMES.map(o => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {dialog === 'cancel' && (
              <div className="uld-radios">
                {CANCEL_REASONS.map(r => (
                  <label key={r} className="uld-radio">
                    <input type="radio" name="cancel" checked={cancelPick === r} onChange={() => setCancelPick(r)} />
                    {r}
                  </label>
                ))}
                {cancelPick === CANCEL_DIRECT && (
                  <div className="uld-textarea-wrap">
                    <span className="uld-textarea-label">취소 사유</span>
                    <textarea
                      rows={5}
                      value={cancelText}
                      placeholder="[필수] 취소사유를 입력해주세요. (최소 10글자)"
                      onChange={e => setCancelText(e.target.value)}
                    />
                    <p className="uld-hint">* 입력한 취소 사유가 환자에게 전달되오니 작성 시 유의해 주세요.</p>
                  </div>
                )}
                {cancelError && <p className="uld-error">{cancelError}</p>}
              </div>
            )}
            {dialog === 'phone' && (
              <div className="uld-radios">
                {PHONE_REASONS.map((r, i) => {
                  const off = i === 0 && s.target === 'first';
                  return (
                    <label key={r} className={`uld-radio ${off ? 'is-off' : ''}`}>
                      <input type="radio" name="phone" disabled={off} checked={phonePick === i} onChange={() => setPhonePick(i)} />
                      <span>
                        {r}
                        {off && <em>초진 환자는 선택할 수 없어요</em>}
                      </span>
                    </label>
                  );
                })}
                {phonePick === PHONE_DIRECT && (
                  <div className="uld-textarea-wrap">
                    <textarea rows={3} value={phoneText} placeholder="사유를 입력해 주세요" onChange={e => setPhoneText(e.target.value)} />
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        <div className="uld-dialog-btns">
          <Btn v="secondary" onClick={() => setDialog(null)}>
            취소
          </Btn>
          <Btn
            disabled={dialog === 'phone' && (phonePick === null || (phonePick === PHONE_DIRECT && !phoneText.trim()))}
            onClick={confirm}
          >
            {dialog === 'phone' ? '전화 진료' : '확인'}
          </Btn>
        </div>
      </div>
    </div>
  );

  /* ───────── 프로필 메뉴(profile-menu.tsx) ───────── */
  const profileMenu = menuOpen && (
    <div className="uld-menu" onClick={e => e.stopPropagation()}>
      <div className="uld-menu-top">
        <div className="uld-menu-me">
          <Avatar on={status === 'ontreatment'} />
          샘플 김의사
          <span className={`uld-menu-chip ${status === 'ontreatment' ? 'is-on' : ''}`}>
            {status === 'ontreatment' ? '진료중' : '진료종료'}
          </span>
        </div>
        <div className="uld-menu-toggle">
          브라우저 알림 <Switch on={false} />
        </div>
        <div className="uld-menu-toggle">
          소리 알림 <Switch on={false} />
        </div>
        <button type="button" className="uld-menu-select">
          의사 프로필 선택
        </button>
      </div>
      <div className="uld-menu-links">
        <div className="uld-menu-toggle uld-menu-link">
          화상진료
          <Switch
            on={videoOn}
            onClick={() => {
              if (!videoOn) return setVideoOn(true);
              setMenuOpen(false);
              setDialog('video');
            }}
          />
        </div>
        {['굿닥 파트너스', '이용가이드', '원격지원 프로그램'].map(t => (
          <span key={t} className="uld-menu-link">
            {t}
            <span aria-hidden="true">↗</span>
          </span>
        ))}
      </div>
      <span className="uld-menu-logout">로그아웃</span>
    </div>
  );

  /* ───────── 패널 ───────── */
  const notes: Record<Jump, string[]> = useMemo(
    () => ({
      r1: [
        '접수대기 상세. 바뀐 곳은 보라 점선, 나머지는 현행 코드 재현.',
        '현행 빨간 시범사업 안내 대신 진료 대상 배지·가족 대리 신청 배지.',
        '접수 전 확인 2개를 모두 체크해야 접수완료가 켜진다. 재진은 두 번째가 대면 이력 확인.',
        '재진이면 환자 응답 상자, 자녀면 본인확인 문구 자리에 법정대리인 동의 기록',
        '초진이면 접수 전 확인 아래에 실거주 증명 첨부(앱에서 가림 처리해 올린 서류). 없으면 "첨부 없음". 다시 요청(반려)·파기 시점은 보류.',
        '접수완료를 누르면 현행 예상 대기 시간 설정 → 진료대기.',
      ],
      r2a: [
        '진료대기 상세(현행 파란 작업 띠).',
        '전화로 신청한 재진은 "진료시작"이 현행 진료 시작하기 확인창 대신 사유 모달을 연다.',
        '화상으로 신청했으면 "전화로 진료하기"(배치 임의)로 같은 모달.',
        '초진이면 첫 번째 사유를 고를 수 없다. 직접 입력은 글자가 있어야 확인.',
      ],
      r2b: [
        '프로필 메뉴 화상진료 스위치를 끌 때 확인창. 본문만 바꿨고 버튼은 현행 취소/확인.',
        'OFF는 "초진 환자 배정 제외" 의미. 의사목록 순서 문구는 보류.',
        '켤 때 확인창(현행 "화상진료 켜기")은 이 화면 범위 밖이라 바로 켜짐.',
      ],
      r3: [
        '진료 취소하기 다이얼로그. 현행 7개 → 5개 + 직접 입력.',
        '삭제: 이번 달 환자의 비대면진료 가능 횟수(2회). 교체: 병원 월 건수 → 의사별 월평균 500건.',
        '직접 입력 안내 문구·빈칸 검증은 현행 그대로. 확인하면 행이 현행대로 진료완료 탭으로 빠지고, 고른 사유는 아래에 표시.',
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
          <button key={o.k} className={value === o.k ? 'is-on' : ''} disabled={o.disabled} onClick={() => onChange(o.k)}>
            {o.t}
          </button>
        ))}
      </div>
    </div>
  );

  const aInWaiting = status === 'request';
  const rowA = (
    <div className={`uld-row-card ${open ? 'is-open' : ''}`}>
      {rowLine(rowAData, open, () => setOpen(o => !o))}
      {open && detail}
    </div>
  );
  const tableHead = (
    <div className="uld-thead">
      {COLS.map(c => (
        <span key={c.label} style={{ flex: c.w, textAlign: c.right ? 'right' : undefined }}>
          {c.label}
        </span>
      ))}
      <span style={{ flex: 0.5 }} />
    </div>
  );

  return (
    <div className="uld-root">
      <aside className="uld-panel">
        <div className="uld-panel-card">
          <p className="uld-panel-title">온라인진료실 · 제도화 대응</p>
          <p className="uld-panel-sub">
            굿닥 온라인진료실(의사용) · 검토용 초안 v0.3 · 현행 화면은 개발 코드 기준 재현, 동적 값은 {'{중괄호}'}
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
            label="실거주 증명(초진)"
            value={s.target === 'first' ? s.proof : 'none'}
            options={[
              { k: 'none', t: '첨부 없음' },
              { k: 'attached', t: '첨부함', disabled: s.target !== 'first' },
            ]}
            onChange={k => set({ proof: k })}
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
          {phoneDone && <p className="uld-panel-result">전화 진료 사유: {phoneDone}</p>}
          {cancelDone && (
            <p className="uld-panel-result">
              가상환자 A 진료취소 → 현행대로 진료완료 탭으로 이동(이 프로토는 접수대기 탭만 그림).
              <br />
              취소 사유: {cancelDone}
            </p>
          )}
        </div>
      </aside>

      <div className="uld-stage">
        <span className="uld-stage-cap">{JUMPS.find(j => j.key === s.jump)!.label} · 보라 점선 = 바뀐 곳</span>
        <section className="uld-frame" onClick={() => setMenuOpen(false)}>
          <header className="uld-gnb">
            <div className="uld-gnb-inner">
              <img className="uld-logo" src={IMG_LOGO} alt="굿닥 온라인 진료실" />
              <nav className="uld-tabs">
                <span className="is-on">접수대기</span>
                <span>진료완료</span>
                <span>운영관리</span>
                <span>공지사항</span>
              </nav>
              <div className="uld-me-wrap">
                <button
                  type="button"
                  className="uld-me"
                  onClick={e => {
                    e.stopPropagation();
                    setMenuOpen(o => !o);
                  }}
                >
                  <Avatar on={status === 'ontreatment'} />
                  샘플 김의사
                  <span aria-hidden="true" className="uld-me-caret">
                    ⌄
                  </span>
                </button>
                {profileMenu}
              </div>
            </div>
          </header>
          <main className="uld-main">
            <header className="uld-page-head">
              <h1>접수대기</h1>
              <div className="uld-page-toggles">
                <span>
                  바로진료 <Switch on />
                </span>
                <span>
                  진료예약 <Switch on />
                </span>
              </div>
            </header>
            {tableHead}
            <div className="uld-rows">
              {aInWaiting && rowA}
              {OTHER_WAITING.map(r => (
                <div key={r.name} className="uld-row-card">
                  {rowLine(r, false)}
                </div>
              ))}
            </div>
            <h2 className="uld-h2">접수완료</h2>
            {tableHead}
            <div className="uld-rows">
              {(status === 'waiting' || status === 'ontreatment') && rowA}
              {OTHER_DONE.map(r => (
                <div key={r.name} className="uld-row-card">
                  {rowLine(r, false)}
                </div>
              ))}
            </div>
          </main>
        </section>
      </div>
      {dialogEl}
    </div>
  );
}
