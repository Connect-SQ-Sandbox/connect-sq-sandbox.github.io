import React, { useEffect } from 'react';
import imgCarousel1 from '@/assets/kakao-reference/ab-carousel-1.png';
import imgCarousel2 from '@/assets/kakao-reference/ab-carousel-2.png';
import imgThumbSurgery from '@/assets/kakao-reference/ab-thumb-surgery.png';
import imgThumbSkin from '@/assets/kakao-reference/ab-thumb-skin.png';

/**
 * kakao-booking — 카카오톡 예약하기 · 병원 상세
 * 원본/참고: booking.kakao.com/detail/ticketStore/212597
 * 배포: https://connect-sq-sandbox.github.io/out/kakao-booking.html
 * 표준 클론(kakao-hospital-clone.html)의 body+script를 dangerouslySetInnerHTML+useEffect로 주입(self-contained).
 */

const BODY = `<div class="app">

  <!-- top bar -->
  <header class="topbar">
    <button class="tb-btn" aria-label="홈" onclick="toast('홈으로 이동')">
      <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 11.5 12 4l9 7.5"/><path d="M5 10v9h5v-6h4v6h5v-9"/></svg>
    </button>
    <div class="tb-title">에이비성형외과의원</div>
    <button class="tb-btn" aria-label="검색">
      <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
    </button>
  </header>

  <!-- carousel -->
  <div class="carousel" id="carousel" onclick="nextSlide()">
    <div class="badge"><span id="idx">1</span>/3 <span class="plus">＋</span></div>
  </div>

  <!-- head -->
  <div class="head">
    <div class="cat">서울 서초구 · 피부과, 성형외과</div>
    <div class="hname">에이비성형외과의원</div>
    <span class="review-link" onclick="go('reviews')">후기 6개
      <svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 6 6 6-6 6"/></svg>
    </span>
  </div>
  <div class="hr"></div>

  <!-- facilities -->
  <div class="facil">
    <div class="facil-head">
      <span class="t">편의 시설</span>
      <span class="all" onclick="toast('편의시설 전체보기')">전체보기</span>
    </div>
    <div class="facil-grid">
      <div class="facil-item"><span class="fic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M2 8.5a15 15 0 0 1 20 0"/><path d="M5 12a10 10 0 0 1 14 0"/><path d="M8.5 15.5a5 5 0 0 1 7 0"/><circle cx="12" cy="19" r="1" fill="currentColor"/></svg></span>WIFI</div>
      <div class="facil-item"><span class="fic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4" y="4" width="16" height="16" rx="4"/><path d="M9 17V8h4a3 3 0 0 1 0 6H9"/></svg></span>주차가능</div>
      <div class="facil-item"><span class="fic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 10a6 6 0 0 1 12 0"/><rect x="5" y="9.5" width="14" height="3" rx="1.5"/><circle cx="12" cy="6.5" r="2.2"/><path d="M4 21v-1.5a6 6 0 0 1 12 0V21M15 21v-1a4 4 0 0 1 5-3.7"/></svg></span>발렛파킹</div>
      <div class="facil-item"><span class="fic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.2"/><path d="M3 20v-1.5a5 5 0 0 1 10 0V20M14.5 20v-1a4 4 0 0 1 6-3.4"/></svg></span>1:1 관리</div>
      <div class="facil-item"><span class="fic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="6" y="3" width="12" height="14" rx="3"/><circle cx="9.5" cy="9" r="1" fill="currentColor" stroke="none"/><circle cx="14.5" cy="9" r="1" fill="currentColor" stroke="none"/><path d="M7 17l-1.5 4M17 17l1.5 4M9 13h6"/></svg></span>지하철역 주변</div>
      <div class="facil-item"><span class="fic"><span class="eng-badge">ENG</span></span>영어 가능</div>
    </div>
  </div>

  <!-- channel banner -->
  <div class="chbanner" onclick="toast('채널이 추가되었습니다')">
    <span class="ch-ic">Ch+</span>
    <span>채널 추가하고 <b class="point">혜택 알림</b> 받기</span>
  </div>

  <!-- sub tabs -->
  <nav class="subtabs" id="subtabs">
    <div class="subtab active" data-target="products" onclick="go('products',this)">예약</div>
    <div class="subtab" data-target="place" onclick="go('place',this)">장소정보</div>
    <div class="subtab" data-target="reviews" onclick="go('reviews',this)">후기</div>
  </nav>

  <div class="band"></div>

  <!-- ticket products (gray band, white shadow cards; heading hidden like real page) -->
  <div class="prodwrap" id="products">
    <h4 class="sr-only" style="position:absolute;width:0;height:0;overflow:hidden;">티켓상품</h4>

    <div class="prodcard" onclick="location.href='kakao-booking-ticket.html'">
      <div class="p-thumb" style="background-image:url('__IMG_IMG_THUMB_SURGERY__')"></div>
      <div class="p-body">
        <div class="p-tit">성형외과 신규예약 (진료항목예약 Flow)</div>
        <div class="p-desc">ABsolute beauty, 자연스럽게 더 나답게.</div>
        <button class="p-btn" onclick="event.stopPropagation();location.href='kakao-booking-ticket.html'">예약하기</button>
      </div>
    </div>

    <div class="prodcard" onclick="location.href='kakao-booking-skin.html'">
      <div class="p-thumb" style="background-image:url('__IMG_IMG_THUMB_SKIN__')"></div>
      <div class="p-body">
        <div class="p-tit">피부클리닉 시술예약 (연동진료실예약 Flow)</div>
        <div class="p-desc">AB SKIN CLINIC 오늘보다 내일 더, 빛나게</div>
        <button class="p-btn" onclick="event.stopPropagation();location.href='kakao-booking-skin.html'">예약하기</button>
      </div>
    </div>
  </div>

  <!-- intro -->
  <section class="section">
    <div class="sec-title">소개</div>
    <div class="intro collapsed" id="intro">ABsolute beauty, 자연스럽게 더 나답게.
에이비성형외과

· 눈/코/윤곽/가슴/안티에이징/줄기세포/피부과 진료
· 전원 성형외과전문의로 구성된 에이비성형외과 의료진
· 마취과전문의 상주 시스템
· 집도의, 마취과전문의 전담제 운영
· 자체 검진센터 운영, 임상병리사 상주
· 수술 중 응급상황 대비 프로토콜 구축
 (희귀 약물 보유, 혈액 크로스매칭 가능 병원)
· 수술실 CCTV 보유
· 수술 전~마취 회복까지 마취과전문의 모니터링
· KIMA 등 시설/경력/안전 보건복지부, 법무부 인증 병원</div>
    <button class="more" id="introMore" onclick="toggleIntro()"><span id="introMoreT">더보기</span>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg></button>
  </section>

  <div class="band"></div>

  <!-- place -->
  <section class="section" id="place">
    <div class="sec-title">장소 안내</div>
    <div class="mapbox">
      <div class="map">
        <svg class="pin" viewBox="0 0 24 24" fill="#3B82F6"><path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7z"/><circle cx="12" cy="9" r="2.5" fill="#fff"/></svg>
        <div class="scale"><span class="bar"></span>50m</div>
      </div>
      <div class="travel">
        <div class="tv on" onclick="selectTravel(this)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M5 16v-3l1.8-4.2A2 2 0 0 1 8.6 7.5h6.8a2 2 0 0 1 1.8 1.3L19 13v3"/><rect x="4" y="13" width="16" height="4" rx="1.2"/><circle cx="7.5" cy="18.5" r="1.3"/><circle cx="16.5" cy="18.5" r="1.3"/></svg>자동차</div>
        <div class="tv" onclick="selectTravel(this)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="6" y="4" width="12" height="13" rx="2"/><path d="M6 13h12"/><circle cx="9" cy="15.5" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="15.5" r="1" fill="currentColor" stroke="none"/><path d="M8 17l-1.5 3M16 17l1.5 3"/></svg>대중교통</div>
        <div class="tv" onclick="selectTravel(this)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="13" cy="4.5" r="1.6"/><path d="M12 8l-3 3 1 4M12 8l3 2 2 3M10 15l-2 5M13 14l2 6"/></svg>도보</div>
      </div>
    </div>
    <div class="addr-row">
      <span class="a-ic"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7z"/><circle cx="12" cy="9" r="2.4"/></svg></span>
      <div class="a-mid">
        <div class="place-name">에이비성형외과의원</div>
        <div class="place-addr">서울 서초구 서초대로77길 17 BLOCK77 2-4층</div>
      </div>
      <button class="a-copy" onclick="toast('주소가 복사되었습니다')">주소복사</button>
    </div>

    <div class="info-row">
      <span class="ir-ic"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 5c0 8 7 15 15 15l0-3-4-2-2 2a13 13 0 0 1-6-6l2-2-2-4H4z"/></svg></span>
      <div class="ir-body">시설문의 02-512-1288
        <span class="muted">평일 10:00~19:00, 금요일(야간진료) 10:00~21:00, 토요일 10:00~17:00</span>
      </div>
    </div>
    <div class="info-row">
      <span class="ir-ic"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/></svg></span>
      <div class="ir-body"><a class="link" onclick="toast('홈페이지로 이동')" href="javascript:void(0)">https://www.abps.co.kr</a></div>
    </div>
    <div class="info-row">
      <span class="ir-ic"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg></span>
      <div class="ir-body">영업시간 월, 화, 수, 목 10:00~19:00
        <span class="muted"><a class="link" href="javascript:void(0)" onclick="toast('영업시간 자세히 보기')">영업 시간 자세히 보기</a></span>
      </div>
    </div>
    <div class="info-row">
      <span class="ir-ic"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4" y="4" width="16" height="16" rx="3"/><path d="M9 17V8h4a3 3 0 0 1 0 6H9"/></svg></span>
      <div class="ir-body">유료 주차가능
        <span class="muted">※ 본원 건물 주차는 지원되지 않습니다. 유료 발렛 주차: 서초대로 73길 12, 세계빌딩(1층 커피빈) · 주차문의 02-512-1288</span>
      </div>
    </div>

    <!-- official channel -->
    <div class="offch">
      <div class="oc-thumb"></div>
      <div class="oc-name">에이비성형외과의원<br><span style="font-size:12px;color:#999;font-weight:400;">공식채널</span></div>
      <button class="oc-btn" onclick="toast('1:1 문의')">1:1문의</button>
      <button class="oc-btn add" onclick="toast('채널 추가됨')">채널추가</button>
    </div>
  </section>

  <div class="band"></div>

  <!-- hospital info -->
  <section class="section">
    <div class="sec-title">병원정보</div>
    <div class="kv"><span class="k">구분</span><span class="v">의원</span></div>
    <div class="kv"><span class="k">의사 수</span><span class="v">총 28명, 전문의 25명, 일반의 및 전공의 3명</span></div>
    <div class="kv"><span class="k">개업일</span><span class="v">2020-09-21</span></div>
    <button class="more" onclick="toast('병원정보 더보기')">더보기</button>
  </section>

  <div class="band"></div>

  <!-- seller -->
  <section class="section">
    <div class="sec-title">판매자 정보</div>
    <div class="kv"><span class="k">상호명</span><span class="v">에이비성형외과의원</span></div>
  </section>

  <div class="band"></div>

  <!-- reviews -->
  <section class="section" id="reviews">
    <div class="sec-title">후기 6</div>
    <div class="rec-points">
      <span class="rec">가격 추천 <b>2</b></span>
      <span class="rec">전문성 추천 <b>4</b></span>
      <span class="rec">친절 추천 <b>3</b></span>
    </div>
    <button class="kmap-btn" onclick="toast('카카오맵 열기')">카카오맵 열기</button>
    <div class="kmap-note">이 장소의 더 많은 후기를<br>카카오맵에서 확인해 보세요.</div>

    <div class="review">
      <div class="rv-top"><span class="rv-ava"></span><span class="rv-nick">실망한 스카피</span><span class="rv-date">2026.04.29</span></div>
      <span class="rv-menu">메뉴 · 성형외과 신규예약</span>
      <div class="rv-body">서제원 원장님이 재수술을 꼼꼼하게 잘 하신다는 추천으로 방문하였으나, 체계가 없고 원장님 상담사항이 실장에게 전부 전달되지 않고 실장이 업무파악이 제대로 안되고 <span class="rv-more">…더보기</span></div>
    </div>
    <div class="review">
      <div class="rv-top"><span class="rv-ava"></span><span class="rv-nick">신나는 죠르디</span><span class="rv-date">2026.03.14</span></div>
      <span class="rv-menu">메뉴 · 성형외과 신규예약</span>
      <div class="rv-body">깔끔한 병원 시설과 친절하고 전문적이며 진심인 상담</div>
    </div>
    <div class="review">
      <div class="rv-top"><span class="rv-ava"></span><span class="rv-nick">뿌듯한 어피치</span><span class="rv-date">2026.03.04</span></div>
      <span class="rv-menu">메뉴 · 피부클리닉 시술예약</span>
      <div class="rv-body">지인 추천으로 왔는데 너무 좋았습니다!</div>
    </div>
    <div class="review">
      <div class="rv-top"><span class="rv-ava"></span><span class="rv-nick">김경*</span><span class="rv-date">2026.02.15</span></div>
      <span class="rv-menu">메뉴 · 성형외과 신규예약</span>
      <div class="rv-body">생각보다 오래 안 기다렸고 너무 친절하십니다!!!</div>
    </div>
    <div class="review">
      <div class="rv-top"><span class="rv-ava"></span><span class="rv-nick">서운한 무지</span><span class="rv-date">2026.02.10</span></div>
      <span class="rv-menu">메뉴 · 피부클리닉 시술예약</span>
      <div class="rv-body">첫 방문과 달리 비교적 간단한 시술 하러 방문했는데 시술 사이에 껴놓은 느낌이었습니다. 마취 크림 바르고 1시간이나 대기하다 제가 몇번이나 말해서 겨우 시술 <span class="rv-more">…더보기</span></div>
    </div>
    <div class="review">
      <div class="rv-top"><span class="rv-ava"></span><span class="rv-nick">뿌듯한 어피치</span><span class="rv-date">2026.01.30</span></div>
      <span class="rv-menu">메뉴 · 피부클리닉 시술예약</span>
      <div class="rv-body">이벤트라서 살짝 걱정하고 갔는데 상담부터 시술까지 너무 친절하고 잘해주셔서 만족합니다. 결과도 기대돼요</div>
    </div>
  </section>

  <div class="band"></div>

  <!-- nearby -->
  <section class="section">
    <div class="sec-title">주변 정보</div>
    <div class="near"><span class="n-dist">13m</span><span class="n-name">비티성형외과의원</span></div>
    <div class="near"><span class="n-dist">15m</span><span class="n-name">한국의료통역 코디네이터협회</span></div>
    <div class="near"><span class="n-dist">15m</span><span class="n-name">이앤피유학</span></div>
    <div class="near"><span class="n-dist">40m</span><span class="n-name">원진성형외과의원</span></div>
    <div class="near"><span class="n-dist">49m</span><span class="n-name">별다방</span></div>

    <div class="sec-title" style="margin-top:24px;">주변 맛집 BEST</div>
    <div class="food"><span class="rank">1</span><span class="f-cat">회</span><span class="f-name">회주라수산 교대본점</span><span class="f-dist">1.5km</span></div>
    <div class="food"><span class="rank">2</span><span class="f-cat">일식</span><span class="f-name">아카사카일식 강남역본점</span><span class="f-dist">450m</span></div>
    <div class="food"><span class="rank">3</span><span class="f-cat">냉면</span><span class="f-name">서관면옥 교대본점</span><span class="f-dist">984m</span></div>
    <div class="food"><span class="rank">4</span><span class="f-cat">국수</span><span class="f-name">명동곰돌이</span><span class="f-dist">1.0km</span></div>
    <div class="food"><span class="rank">5</span><span class="f-cat">국수</span><span class="f-name">청류벽</span><span class="f-dist">531m</span></div>
  </section>

  <div class="report">
    <a href="javascript:void(0)" onclick="toast('신고 화면으로 이동')">상품정보에 문제가 있다면 알려주세요. 신고하기</a>
  </div>

  <!-- bottom bar -->
  <div class="bottombar">
    <button class="bb-ic" id="likeBtn" onclick="toggleLike()">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 20s-7-4.5-9.5-9A5 5 0 0 1 12 6a5 5 0 0 1 9.5 5c-2.5 4.5-9.5 9-9.5 9z"/></svg>
      <span>찜</span>
    </button>
    <button class="bb-ic" onclick="toast('공유하기')">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 15V4M8 8l4-4 4 4"/><path d="M5 13v6a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-6"/></svg>
      <span>공유</span>
    </button>
    <button class="reserve" onclick="go('products')">예약하기</button>
  </div>

</div>

<div class="toast" id="toast"></div>`;

const SCRIPT = `// carousel
  const SLIDES=[
    "url('__IMG_IMG_CAROUSEL1__')",
    "url('__IMG_IMG_CAROUSEL2__')",
    "linear-gradient(135deg,#c7ccd3,#e4e6ea)"
  ];
  let ci=0;
  const cEl=document.getElementById('carousel');
  function paint(){cEl.style.backgroundImage=SLIDES[ci];document.getElementById('idx').textContent=ci+1;}
  function nextSlide(){ci=(ci+1)%SLIDES.length;paint();}
  paint();

  // sub-tab scroll + active state
  function go(id, tab){
    const el=document.getElementById(id);
    if(el){const y=el.getBoundingClientRect().top+window.scrollY-100;window.scrollTo({top:y,behavior:'smooth'});}
    setActive(id, tab);
  }
  function setActive(id, tab){
    document.querySelectorAll('.subtab').forEach(t=>t.classList.remove('active'));
    const target = tab || [...document.querySelectorAll('.subtab')].find(t=>t.dataset.target===id);
    if(target) target.classList.add('active');
  }

  // intro more
  function toggleIntro(){
    const el=document.getElementById('intro'), btn=document.getElementById('introMore');
    const open=el.classList.toggle('collapsed')===false;
    btn.classList.toggle('open',open);
    document.getElementById('introMoreT').textContent=open?'접기':'더보기';
  }

  // travel mode
  function selectTravel(el){
    document.querySelectorAll('.travel .tv').forEach(t=>t.classList.remove('on'));
    el.classList.add('on');
  }

  // like
  function toggleLike(){
    const b=document.getElementById('likeBtn');
    const on=b.classList.toggle('on');
    b.querySelector('svg').setAttribute('fill', on?'currentColor':'none');
    toast(on?'찜 목록에 추가했습니다':'찜을 해제했습니다');
  }

  // toast
  let tt;
  function toast(m){const t=document.getElementById('toast');t.textContent=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),1700);}`;

const IMAGES: Record<string, string> = {
  '__IMG_IMG_CAROUSEL1__': imgCarousel1,
  '__IMG_IMG_CAROUSEL2__': imgCarousel2,
  '__IMG_IMG_THUMB_SURGERY__': imgThumbSurgery,
  '__IMG_IMG_THUMB_SKIN__': imgThumbSkin
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
