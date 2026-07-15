import React, { useEffect } from 'react';
import imgHero from '@/assets/kakao-reference/ab-ticket-hero.png';

/**
 * kakao-booking-ticket — 카카오톡 예약하기 · 진료항목 상세
 * 원본/참고: booking.kakao.com/detail/ticket/509667
 * 배포: https://connect-sq-sandbox.github.io/out/kakao-booking-ticket.html
 * 표준 클론(kakao-booking-clone.html)의 body+script를 dangerouslySetInnerHTML+useEffect로 주입(self-contained).
 */

const BODY = `<div class="app">

  <!-- top bar -->
  <header class="topbar">
    <button class="tb-btn" aria-label="홈" onclick="location.href='kakao-booking.html'">
      <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 11.5 12 4l9 7.5"/><path d="M5 10v9h5v-6h4v6h5v-9"/></svg>
    </button>
    <div class="tb-title">에이비성형외과의원</div>
    <button class="tb-btn" aria-label="검색">
      <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
    </button>
  </header>

  <div class="card">
    <div class="hero" style="background-image:linear-gradient(rgba(0,0,0,.04),rgba(0,0,0,.04)),url('__IMG_HERO__')"></div>
    <div class="product">
      <h1 class="tit">성형외과 신규예약</h1>
      <p class="desc">ABsolute beauty, 자연스럽게 더 나답게.</p>
    </div>
    <div class="chbanner" onclick="toast('채널이 추가되었습니다')">
      <span class="ch-ic">Ch+</span>
      <span>채널 추가하고 <b class="point">혜택 알림</b> 받기</span>
    </div>
    <div class="hospital" onclick="location.href='kakao-booking.html'">
      <div class="thumb"></div>
      <div style="flex:1">
        <div class="h-name">에이비성형외과의원
          <svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 6 6 6-6 6"/></svg>
        </div>
        <div class="h-sub">서울 서초구 · 피부과, 성형외과</div>
      </div>
    </div>
  </div>

  <div class="band"></div>

  <!-- ===== 예약 ===== -->
  <section class="section">

    <!-- DATE accordion -->
    <div class="acc-h" id="dateHead" onclick="toggleAcc('date')">
      <div class="h-left">
        <svg class="h-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <rect x="3" y="4.5" width="18" height="16" rx="2.5"/><path d="M3 9h18M8 2.5v4M16 2.5v4"/><path d="m8.5 14 2.2 2.2 4.3-4.3"/></svg>
        <span class="h-title" id="dateTitle">날짜를 선택하세요</span>
      </div>
      <svg class="h-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 15 6-6 6 6"/></svg>
    </div>
    <div class="acc-body" id="dateBody">
      <div class="cal-head">
        <button class="cal-nav" disabled aria-label="이전달">‹</button>
        <span class="m">2026년 7월</span>
        <button class="cal-nav" onclick="event.stopPropagation();toast('다음 달 일정이 없습니다')" aria-label="다음달">›</button>
      </div>
      <div class="weekdays">
        <span class="sun">일</span><span>월</span><span>화</span><span>수</span><span>목</span><span>금</span><span>토</span>
      </div>
      <div class="days" id="days"></div>
    </div>

    <!-- TIME accordion -->
    <div class="acc-h disabled" id="timeHead" onclick="toggleAcc('time')">
      <div class="h-left">
        <svg class="h-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></svg>
        <span class="h-title" id="timeTitle">시간을 선택하세요</span>
      </div>
      <svg class="h-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 15 6-6 6 6"/></svg>
    </div>
    <div class="acc-body hidden" id="timeBody">
      <div class="time-filter" id="timeFilter" onclick="toggleFilter()">
        <span class="radio-c"></span><span>예약 가능한 시간만 보기</span>
      </div>
      <div class="tg-label">오전</div>
      <div class="slots" id="amSlots"></div>
      <div class="tg-label">오후</div>
      <div class="slots" id="pmSlots"></div>
    </div>

    <!-- TREATMENT -->
    <div class="treat-head disabled" id="treatHead">
      <svg class="h-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>
      <span class="h-title">진료/시술을 선택하세요</span>
    </div>
    <div id="treatList" style="padding-bottom:8px;">
      <div class="opt locked" data-name="신규상담"><span class="radio-c"></span><span class="o-name">신규상담</span></div>
      <div class="opt locked" data-name="재진 (대표번호로 전화부탁드립니다)"><span class="radio-c"></span><span class="o-name">재진 (대표번호로 전화부탁드립니다)</span></div>
    </div>

  </section>

  <div class="band"></div>

  <!-- 이용 안내 -->
  <section class="info-sec">
    <div class="sec-title">이용 안내</div>
    <div class="info-body">기존고객님은 대표번호로 전화주시거나 카카오톡으로 문의부탁드립니다. 감사합니다.</div>
  </section>

  <div class="band"></div>

  <!-- 유의 사항 -->
  <section class="info-sec">
    <div class="sec-title" style="margin-bottom:8px;">유의 사항</div>
    <div class="acc-item" onclick="this.classList.toggle('open')">
      <div class="a-head"><div class="a-t">[필독] 예약확정안내</div>
        <svg class="a-chev" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg></div>
      <div class="a-body">고객님께서 선택하신 시간은 '상담 희망 시간' 접수이며, 정확한 스케줄 조율을 위해 병원에서 직접 전화를 드립니다.
대표번호(02-512-1288)로 걸려오는 안내 전화를 받으셔야 예약이 최종 확정되니 꼭 확인 부탁드립니다. 전화를 받지 않으실 경우 예약이 자동 취소될 수 있는 점 양해 부탁드립니다. 정성스러운 진료와 상담으로 보답하겠습니다. 감사합니다.^^</div>
    </div>
  </section>

  <div class="band"></div>

  <!-- 방문 안내 -->
  <section class="info-sec">
    <div class="sec-title" style="margin-bottom:8px;">방문 안내</div>
    <div class="acc-item" onclick="this.classList.toggle('open')">
      <div class="a-head"><div class="a-t">예약은 병원과 고객님이 함께 지켜야 할 "소중한 약속"입니다.</div>
        <svg class="a-chev" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg></div>
      <div class="a-body">최근 당일 취소 및 노쇼 사례로 인해 다른 고객님들의 일정에 영향을 주는 일이 발생하고 있어 부득이하게 안내 드리는 점 양해 부탁드립니다.
예약 변경 또는 취소 시는 대표번호로 최소 1일 연락 부탁드립니다.</div>
    </div>
  </section>

  <div class="band"></div>

  <!-- 취소 안내 -->
  <section class="info-sec">
    <div class="sec-title" style="margin-bottom:8px;">취소 안내</div>
    <div class="acc-item" onclick="this.classList.toggle('open')">
      <div class="a-head"><div class="a-t">쿠폰이 적용되거나 구매 제한 수량이 있는 예약은 부분 취소 불가</div>
        <svg class="a-chev" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg></div>
      <div class="a-body">쿠폰이 적용되거나 구매 제한 수량이 있는 예약은 이용 여부와 관계없이 부분 취소 불가하며, 전체 취소만 가능합니다.</div>
    </div>
  </section>

  <div class="band"></div>

  <!-- 판매자 정보 -->
  <section class="info-sec">
    <div class="sec-title" style="margin-bottom:6px;">판매자 정보</div>
    <div class="seller-row"><span class="k">상호명</span><span class="v">에이비성형외과의원</span></div>
    <div class="seller-row"><span class="k">취소 관련정보</span><span class="v">이용일시까지 취소 가능, 이후 취소 불가</span></div>
  </section>

  <div class="report">
    <a href="javascript:void(0)" onclick="toast('신고 화면으로 이동')">상품정보에 문제가 있다면 알려주세요. 신고하기</a>
  </div>

  <!-- bottom bar -->
  <div class="bottombar">
    <button class="share" onclick="toast('공유하기')">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 15V4M8 8l4-4 4 4"/><path d="M5 13v6a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-6"/></svg>
      <span>공유</span>
    </button>
    <button class="reserve" id="reserveBtn" disabled onclick="onReserve()">예약하기</button>
  </div>

</div>

<div class="toast" id="toast"></div>`;

const SCRIPT = `const WD = ['일','월','화','수','목','금','토'];
  const state = { date:null, time:null, treat:null };

  // ---- calendar: 2026-07, 1일=수(index3), 오늘=14=예약마감, 17=제헌절(빨강) ----
  const TODAY=14, CLOSED=[14], HOLIDAYS=[17], firstWeekday=3, daysInMonth=31;
  const daysEl=document.getElementById('days');
  for(let i=0;i<firstWeekday;i++){const e=document.createElement('div');e.className='day empty';daysEl.appendChild(e);}
  for(let d=1;d<=daysInMonth;d++){
    const col=(firstWeekday+d-1)%7;
    const btn=document.createElement('button');
    btn.className='day';
    if(col===0) btn.classList.add('sun');
    if(HOLIDAYS.includes(d)) btn.classList.add('holiday');
    const isPast=d<TODAY, isClosed=CLOSED.includes(d);
    if(isPast){ btn.classList.add('past'); btn.innerHTML='<span class="num">'+d+'</span>'; }
    else if(isClosed){ btn.classList.add('closed'); btn.innerHTML='<span class="num">'+d+'</span><span class="tag">예약마감</span>'; }
    else{ btn.classList.add('selectable'); btn.innerHTML='<span class="num">'+d+'</span>'; btn.dataset.d=d; btn.dataset.wd=col;
      btn.addEventListener('click',()=>selectDate(d,col,btn)); }
    daysEl.appendChild(btn);
  }

  // ---- time slots ----
  const AM=['11:00','11:30'];
  const PM=['12:00','12:30','1:00','1:30','2:00','2:30','3:00','3:30','4:00','4:30','5:00','5:30','6:00'];
  buildSlots('amSlots',AM,'오전'); buildSlots('pmSlots',PM,'오후');
  function buildSlots(id,list,period){
    const box=document.getElementById(id); box.innerHTML='';
    list.forEach(t=>{
      const s=document.createElement('button'); s.className='slot'; s.textContent=t;
      s.addEventListener('click',()=>selectTime(period,t,s));
      box.appendChild(s);
    });
  }

  function selectDate(d, col, btn){
    state.date={d,col}; state.time=null; state.treat=null;
    document.querySelectorAll('.day.selected').forEach(e=>e.classList.remove('selected'));
    btn.classList.add('selected');
    document.getElementById('dateTitle').textContent='26.07.'+String(d).padStart(2,'0')+'('+WD[col]+')';

    // enable time
    const th=document.getElementById('timeHead'); th.classList.remove('disabled');
    document.getElementById('timeTitle').textContent='시간을 선택하세요';
    setAcc('time',true);
    document.querySelectorAll('.slot.selected').forEach(e=>e.classList.remove('selected'));

    // reset treatment
    document.getElementById('treatHead').classList.add('disabled');
    document.querySelectorAll('.opt').forEach(o=>{o.classList.remove('selected');o.classList.add('locked');});
    updateReserve();
  }

  function selectTime(period, t, el){
    state.time={period,t}; state.treat=null;
    document.querySelectorAll('.slot.selected').forEach(e=>e.classList.remove('selected'));
    el.classList.add('selected');
    document.getElementById('timeTitle').textContent=period+' '+t;

    // enable treatment
    document.getElementById('treatHead').classList.remove('disabled');
    document.querySelectorAll('.opt').forEach(o=>{
      o.classList.remove('locked','selected');
      o.onclick=()=>selectTreat(o.dataset.name,o);
    });
    updateReserve();
  }

  function selectTreat(name, el){
    state.treat=name;
    document.querySelectorAll('.opt.selected').forEach(e=>e.classList.remove('selected'));
    el.classList.add('selected');
    updateReserve();
  }

  function updateReserve(){
    document.getElementById('reserveBtn').disabled = !(state.date&&state.time&&state.treat);
  }

  function onReserve(){
    // 진료항목 타입: EMR 조회 없이 굿닥 진료항목 예약 신청폼으로 이동(선택 일시·진료/시술 전달)
    try{ sessionStorage.setItem('gd_appt', JSON.stringify({d:state.date.d, wd:WD[state.date.col], period:state.time.period, t:state.time.t, treat:state.treat})); }catch(e){}
    location.href='goodoc-webview-item.html';
  }

  // ---- accordions (date/time) ----
  function toggleAcc(which){
    const head=document.getElementById(which+'Head');
    if(head.classList.contains('disabled')) return;
    const body=document.getElementById(which+'Body');
    const collapsed=head.classList.toggle('collapsed');
    body.classList.toggle('hidden',collapsed);
  }
  function setAcc(which, open){
    const head=document.getElementById(which+'Head'), body=document.getElementById(which+'Body');
    head.classList.toggle('collapsed',!open); body.classList.toggle('hidden',!open);
  }

  // ---- available-only filter (visual toggle) ----
  function toggleFilter(){
    const f=document.getElementById('timeFilter');
    f.classList.toggle('on');
    toast(f.classList.contains('on')?'예약 가능한 시간만 표시':'전체 시간 표시');
  }

  // ---- toast ----
  let tt;
  function toast(m){const t=document.getElementById('toast');t.textContent=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),1700);}`;

const IMAGES: Record<string, string> = {
  '__IMG_HERO__': imgHero
};

function applyImages(text) { let out = text; for (const key of Object.keys(IMAGES)) out = out.split(key).join(IMAGES[key]); return out; }

export default function Page() {
  useEffect(() => {
    const el = document.createElement('script');
    el.textContent = applyImages(SCRIPT);
    document.body.appendChild(el);
    return () => { el.remove(); };
  }, []);
  return <div dangerouslySetInnerHTML={{ __html: applyImages(BODY) }} />;
}
