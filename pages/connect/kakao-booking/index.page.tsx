import React, { useMemo, useState } from 'react';
import {
  HiOutlineCalendarDays,
  HiOutlineCheckCircle,
  HiOutlineChevronLeft,
  HiOutlineChevronUp,
  HiOutlineClock,
  HiOutlineHeart,
  HiOutlineHome,
  HiOutlineInformationCircle,
  HiOutlineMapPin,
  HiOutlineMagnifyingGlass,
  HiOutlineLanguage,
  HiOutlineTruck,
  HiOutlineUserGroup,
  HiOutlineWifi,
  HiOutlineShare,
  HiOutlineXMark
} from 'react-icons/hi2';
import placeReference from '../../../assets/kakao-reference/ab-hospital-place.png';
import productReference from '../../../assets/kakao-reference/ab-hospital-products.png';

/**
 * ┌─ 프로토타입 컨텍스트 ───────────────────────────────────
 * 이름     : kakao-booking — 굿닥 제휴 병원의 카카오톡 예약하기 신청 흐름
 * 상태     : 현행(active)   버전: v1   최종수정: 2026-07-14
 * PRD      : documents/prd/2026-07-13-진료항목-카카오톡-예약하기-연동-구축.md
 * 배포URL  : https://connect-sq-sandbox.github.io/out/kakao-booking.html
 * 관련 CSS : kakaoBooking.css
 * 기술제약 : react-only · plain CSS · mock · 네트워크 0
 *
 * 화면구성 : ① 병원 장소/상품 ② 일정 선택 ③ 카카오 약관 ④ 굿닥 웹뷰 정보·병원약관 ⑤ 완료
 *
 * 핵심 결정 (why):
 *   [확정·PRD] 굿닥 제휴 병원은 카카오에서 Product·Schedule 선택 후 굿닥 웹뷰로 이동
 *   [확정·PRD] V1 사용자 화면에는 Item 단계를 노출하지 않음
 *   [확정·PRD] 예약자와 실제 방문자 정보는 카카오 예약 정보와 굿닥 웹뷰 입력을 구분
 *   [관찰·영상] 카카오 약관 동의 뒤 굿닥 웹뷰에서 주소와 병원 약관을 추가 수집
 *
 * 변경 이력:
 *   v1  2026-07-14 — 첨부 화면·영상 기반 모바일 E2E 프로토타입 최초 구축
 * └──────────────────────────────────────────────────────
 */

type Step = 'place' | 'schedule' | 'consent' | 'goodoc' | 'done';

const times = ['오전 10:30', '오전 11:00', '오후 12:00', '오후 1:30', '오후 3:00', '오후 4:30'];

function SourceCrop({ source, kind }: { source: string; kind: 'hero' | 'product1' | 'product2' }) {
  return <span className={`kb-source-crop ${kind}`}><img src={source} alt="" /></span>;
}

function KakaoHeader({ title, onBack, simple = false }: { title: string; onBack?: () => void; simple?: boolean }) {
  return (
    <header className="kb-header">
      <button className="kb-icon-btn" aria-label="뒤로" onClick={onBack}><HiOutlineChevronLeft /></button>
      {!simple && <button className="kb-icon-btn" aria-label="홈"><HiOutlineHome /></button>}
      <strong>{title}</strong>
      {!simple && <button className="kb-icon-btn" aria-label="검색"><HiOutlineMagnifyingGlass /></button>}
      <button className="kb-icon-btn" aria-label="닫기"><HiOutlineXMark /></button>
    </header>
  );
}

function BottomBar({ label, onClick, blue = false, disabled = false, share = true }: { label: string; onClick: () => void; blue?: boolean; disabled?: boolean; share?: boolean }) {
  return (
    <footer className="kb-bottom">
      {share && <button className="kb-side-action" aria-label="공유"><HiOutlineShare /><span>공유</span></button>}
      <button className={`kb-primary${blue ? ' blue' : ''}`} disabled={disabled} onClick={onClick}>{label}</button>
    </footer>
  );
}

function PlaceScreen({ next }: { next: () => void }) {
  return (
    <>
      <KakaoHeader title="에이비성형외과의원" />
      <main className="kb-scroll">
        <section className="kb-place-hero"><SourceCrop source={placeReference} kind="hero" /></section>
        <section className="kb-place-summary">
          <p>서울 서초구 · 피부과, 성형외과</p>
          <h1>에이비성형외과의원</h1>
          <span>후기 6개 ›</span>
        </section>
        <section className="kb-amenities">
          <div className="kb-amenities-head"><h2>편의 시설</h2><button>전체보기</button></div>
          <div className="kb-amenities-grid">
            <span><HiOutlineWifi /> WIFI</span>
            <span><HiOutlineMapPin /> 주차가능</span>
            <span><HiOutlineUserGroup /> 발렛파킹</span>
            <span><HiOutlineUserGroup /> 1:1 관리</span>
            <span><HiOutlineTruck /> 지하철역 주변</span>
            <span><HiOutlineLanguage /> 영어 가능</span>
          </div>
        </section>
        <div className="kb-benefit">Ch+ 채널 추가하고 <b>혜택 알림</b> 받기</div>
        <nav className="kb-tabs"><button className="on">예약</button><button>장소정보</button><button>후기</button></nav>
        <section className="kb-products">
          <article className="kb-product">
            <SourceCrop source={productReference} kind="product1" />
            <div><h2>성형외과 신규예약</h2><p>ABsolute beauty, 자연스럽게 더 나답게.</p><button onClick={next}>예약하기</button></div>
          </article>
          <article className="kb-product">
            <SourceCrop source={productReference} kind="product2" />
            <div><h2>피부클리닉 시술예약</h2><p>AB SKIN CLINIC 오늘보다 내일 더, 빛나게</p><button onClick={next}>예약하기</button></div>
          </article>
        </section>
        <section className="kb-intro"><h2>소개</h2><p>ABsolute beauty, 자연스럽게 더 나답게.<br />에이비성형외과</p><ul><li>눈·코·윤곽·가슴·안티에이징·피부과 진료</li><li>전원 성형외과전문의로 구성된 에이비성형외과 의료진</li><li>마취과전문의 상주 시스템</li><li>집도의, 마취과전문의 전담제 운영</li><li>자체 검진센터 운영, 임상병리사 상주</li><li>수술 중 응급상황 대비 프로토콜 구축</li></ul></section>
      </main>
      <footer className="kb-place-bottom"><button className="kb-side-action"><HiOutlineHeart /><span>찜</span></button><button className="kb-side-action"><HiOutlineShare /><span>공유</span></button><button className="kb-primary" onClick={next}>예약하기</button></footer>
    </>
  );
}

function ScheduleScreen({ back, next }: { back: () => void; next: () => void }) {
  const [selected, setSelected] = useState('오후 1:30');
  return (
    <>
      <KakaoHeader title="에이비성형외과의원" onBack={back} />
      <main className="kb-scroll kb-schedule">
        <section className="kb-selected-product"><SourceCrop source={productReference} kind="product1" /><div><b>성형외과 신규예약</b><span>상담 후 예약을 도와드려요.</span></div></section>
        <section className="kb-section"><h2><HiOutlineCalendarDays /> 날짜를 선택하세요</h2><div className="kb-calendar-head"><button>‹</button><b>2026년 7월</b><button>›</button></div><div className="kb-week"><span>일</span><span>월</span><span>화</span><span>수</span><span>목</span><span>금</span><span>토</span></div><div className="kb-days">{[12,13,14,15,16,17,18,19,20,21,22,23,24,25].map((d) => <button key={d} className={d === 22 ? 'on' : ''}>{d}</button>)}</div></section>
        <section className="kb-section"><h2><HiOutlineClock /> 시간을 선택하세요</h2><label className="kb-available"><input type="checkbox" /> 예약 가능한 시간만 보기</label><div className="kb-time-grid">{times.map((time) => <button key={time} className={selected === time ? 'on' : ''} onClick={() => setSelected(time)}>{time}</button>)}</div></section>
        <section className="kb-cancel"><h2>취소 안내</h2><p>예약 시간 1시간 전까지 취소할 수 있어요. 이후 취소가 필요한 경우 병원으로 문의해 주세요.</p></section>
      </main>
      <BottomBar label="예약하기" onClick={next} />
    </>
  );
}

function ConsentScreen({ back, next }: { back: () => void; next: () => void }) {
  const [agreed, setAgreed] = useState(false);
  return (
    <>
      <KakaoHeader title="예약하기" onBack={back} simple />
      <main className="kb-scroll kb-consent">
        <button className="kb-seller">판매자 정보 <HiOutlineChevronUp /></button>
        <div className="kb-auto-cancel">2026.07.22(수)까지 이용하지 않을 경우 자동 취소</div>
        <section><h2>취소 및 환불 규정</h2><p>취소 가능 기한 : 26.07.22(수) 14:15 전까지</p></section>
        <section className="kb-agreements">
          <label className="kb-agree-all"><input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} /> 전체 동의하기</label>
          <label><HiOutlineCheckCircle /> [필수] 취소 및 환불 규정 동의</label>
          <label><HiOutlineCheckCircle /> [필수] 개인정보 수집 및 이용 동의 <button>보기</button></label>
          <label><HiOutlineCheckCircle /> [필수] 개인정보 제3자 제공 동의 <button>보기</button></label>
          <label className="optional"><HiOutlineCheckCircle /> [선택] 에이비성형외과의원 채널의 광고와 마케팅 메시지를 카카오톡으로 받기</label>
        </section>
        <p className="kb-kakao-notice"><HiOutlineInformationCircle /> 카카오는 통신판매 당사자가 아니며 상품정보와 거래에 관한 책임은 판매자에게 있습니다.</p>
        <div className="kb-corp">© Kakao Corp.</div>
      </main>
      <BottomBar label="동의하고 다음" onClick={next} disabled={!agreed} share={false} />
    </>
  );
}

function GoodocScreen({ back, next }: { back: () => void; next: () => void }) {
  const [address, setAddress] = useState('');
  const [agree, setAgree] = useState(false);
  return (
    <>
      <KakaoHeader title="굿닥 병원 예약" onBack={back} simple />
      <main className="kb-scroll kb-goodoc">
        <div className="kb-goodoc-logo"><span>g</span> 굿닥 병원 예약</div>
        <p>입력하신 주민등록번호는 접수를 위해 병원에만 전달되며, 굿닥에서는 별도 수집하지 않습니다.<br />환자 정보와 일치하지 않으면 진료 시 불이익이 발생할 수 있습니다.</p>
        <section><h2>주소 <b>필수</b></h2><div className="kb-input-wrap"><HiOutlineMapPin /><input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="도로명 또는 지번 주소를 검색해 주세요." /></div></section>
        <section className="kb-hospital-terms"><h2>병원 약관 동의 <b>필수</b></h2><label><input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} /> 전체 동의</label><label><input type="checkbox" checked={agree} readOnly /> [필수] 개인정보 수집 및 이용 동의 <button>›</button></label></section>
        <div className="kb-term-links"><span>이용약관 동의</span><button>보기</button><span>개인정보 수집 및 이용 동의</span><button>보기</button><span>고유식별정보 이용 동의</span><button>보기</button></div>
      </main>
      <BottomBar label="예약 요청" onClick={next} blue disabled={!address || !agree} share={false} />
    </>
  );
}

function DoneScreen({ restart }: { restart: () => void }) {
  return (
    <>
      <KakaoHeader title="예약 신청 완료" simple />
      <main className="kb-done"><HiOutlineCheckCircle /><h1>예약을 요청했어요</h1><p>병원에서 예약을 확인하면 카카오톡으로 알려드릴게요.</p><div><span>에이비성형외과의원</span><b>7월 22일(수) 오후 1:30</b><span>성형외과 신규예약</span></div><button onClick={restart}>처음으로</button></main>
    </>
  );
}

export default function KakaoBookingPage() {
  const [step, setStep] = useState<Step>('place');
  const screen = useMemo(() => {
    if (step === 'place') return <PlaceScreen next={() => setStep('schedule')} />;
    if (step === 'schedule') return <ScheduleScreen back={() => setStep('place')} next={() => setStep('consent')} />;
    if (step === 'consent') return <ConsentScreen back={() => setStep('schedule')} next={() => setStep('goodoc')} />;
    if (step === 'goodoc') return <GoodocScreen back={() => setStep('consent')} next={() => setStep('done')} />;
    return <DoneScreen restart={() => setStep('place')} />;
  }, [step]);
  return <div className="kb-stage"><div className="mobile-prototype kb-phone">{screen}</div></div>;
}
