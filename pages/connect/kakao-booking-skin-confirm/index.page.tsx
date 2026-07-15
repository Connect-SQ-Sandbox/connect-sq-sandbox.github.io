import React, { useEffect } from 'react';
import imgThumbSkin from '@/assets/kakao-reference/ab-thumb-skin.png';

/**
 * kakao-booking-skin-confirm — 카카오톡 예약하기 · 예약 확인·약관 동의
 * 원본/참고: booking.kakao.com (예약 확인 퍼널)
 * 배포: https://connect-sq-sandbox.github.io/out/kakao-booking-skin-confirm.html
 * 표준 클론(kakao-booking-skin-confirm.html)의 body+script를 dangerouslySetInnerHTML+useEffect로 주입(self-contained).
 */

const BODY = `<div class="app">
  <header class="hd">
    <button class="ic" aria-label="뒤로" onclick="history.length>1?history.back():location.href='kakao-booking-skin.html'">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"/></svg>
    </button>
    <div class="t">예약하기</div>
    <button class="ic" aria-label="닫기" onclick="location.href='kakao-booking.html'">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6 6 18"/></svg>
    </button>
  </header>

  <!-- hospital -->
  <div class="hosp">
    <div class="th" style="background-image:url('__IMG_IMG_THUMB_SKIN__')"></div>
    <div>
      <div class="hn">에이비성형외과의원</div>
      <div class="hs">피부클리닉 시술예약</div>
    </div>
  </div>
  <div class="hr"></div>

  <!-- schedule -->
  <div class="sched">
    <span class="l">일정</span>
    <span class="v" id="schedule">7.21(화) · 오후 12:30</span>
  </div>

  <div class="band"></div>

  <!-- 추가정보 입력 안내 -->
  <div class="pad">
    <div class="sec-title">추가정보 입력 안내</div>
    <div class="guide">
      <div class="li"><span class="dot">·</span><span>병원 방문 전, 진료에 꼭 필요한 정보를 예약 과정에 입력해 주시면 당일 진료가 더욱 원활하고 신속하게 진행됩니다.</span></div>
      <div class="li"><span class="dot">·</span><span>입력하신 정보는 병원의 수탁사인 굿닥이 수집하며, 관련 법령에 따라 안전하게 관리 및 처리됩니다.</span></div>
    </div>
  </div>

  <div class="band"></div>

  <!-- 예약자 정보 -->
  <div class="pad">
    <div class="sec-title">예약자 정보</div>
    <div class="kv"><span class="k">이름</span><span class="v">김세화</span></div>
    <div class="kv"><span class="k">전화번호</span><span class="v">010-9924-0289</span></div>
    <div class="rep">
      <span class="l">대표 이용자 정보</span>
      <span class="r"><span class="yc"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="m5 12 5 5 9-10"/></svg></span>예약자 정보와 동일</span>
    </div>
  </div>

  <div class="band"></div>

  <!-- 판매자 정보 -->
  <div class="seller" id="seller" onclick="this.classList.toggle('open');toast('판매자 정보')">
    <span class="l">판매자 정보</span>
    <svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>
  </div>

  <div class="band"></div>

  <!-- auto cancel -->
  <div class="notice" id="autocancel">2026.07.21(화)까지 이용하지 않을 경우 자동 취소</div>

  <!-- 취소 및 환불 규정 -->
  <div class="pad" style="padding-top:6px;">
    <div class="sec-title">취소 및 환불 규정</div>
    <div class="policy-desc" id="cancellimit">취소 가능 기한 : 26.07.21(화) 12:30 전까지</div>
  </div>

  <div class="band"></div>

  <!-- 약관 동의 -->
  <div class="agree">
    <div class="agree-all" id="agreeAll" onclick="toggleAll()">
      <span class="circ"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="m5 12 5 5 9-10" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
      <span class="lab">전체 동의하기</span>
    </div>

    <div class="ag-item" data-req onclick="toggleItem(this)">
      <span class="chk"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m5 12 5 5 9-10" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
      <span class="lab">[필수] 취소 및 환불 규정 동의</span>
    </div>
    <div class="ag-item" data-req onclick="toggleItem(this)">
      <span class="chk"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m5 12 5 5 9-10" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
      <span class="lab">[필수] 개인정보 수집 및 이용 동의</span>
      <span class="view" onclick="event.stopPropagation();toast('약관 상세 보기')">보기</span>
    </div>
    <div class="ag-item" data-req onclick="toggleItem(this)">
      <span class="chk"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m5 12 5 5 9-10" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
      <span class="lab">[필수] 개인정보 제3자 제공 동의</span>
      <span class="view" onclick="event.stopPropagation();toast('약관 상세 보기')">보기</span>
    </div>
    <div class="ag-item" onclick="toggleItem(this)">
      <span class="chk"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m5 12 5 5 9-10" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
      <span class="lab">[선택] 카카오톡 예약하기 채널의 광고와 마케팅 메시지를 카카오톡으로 받기</span>
    </div>
    <div class="ag-item" onclick="toggleItem(this)">
      <span class="chk"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m5 12 5 5 9-10" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
      <span class="lab">[선택] 에이비성형외과의원 채널의 광고와 마케팅 메시지를 카카오톡으로 받기</span>
    </div>

    <div class="safe">구매 안전 서비스 안내
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/></svg>
    </div>
  </div>

  <!-- cta -->
  <div class="cta"><button onclick="next()">동의하고 다음</button></div>
</div>

<div class="toast" id="toast"></div>`;

const SCRIPT = `// 선택 일시 이어받기 (티켓 → 퍼널 → 웹뷰)
  var A={d:21,wd:'화',period:'오후',t:'12:30'};
  try{var s=JSON.parse(sessionStorage.getItem('gd_appt'));if(s&&s.d)A=s;}catch(e){}
  var pad=function(n){return String(n).padStart(2,'0');};
  document.getElementById('schedule').textContent='7.'+A.d+'('+A.wd+') · '+A.period+' '+A.t;
  document.getElementById('autocancel').textContent='2026.07.'+pad(A.d)+'('+A.wd+')까지 이용하지 않을 경우 자동 취소';
  document.getElementById('cancellimit').textContent='취소 가능 기한 : 26.07.'+pad(A.d)+'('+A.wd+') '+A.t+' 전까지';

  function items(){return [].slice.call(document.querySelectorAll('.ag-item'));}
  function toggleItem(el){el.classList.toggle('on');syncAll();}
  function toggleAll(){
    var all=document.getElementById('agreeAll');
    var on=!all.classList.contains('on');
    all.classList.toggle('on',on);
    items().forEach(function(it){it.classList.toggle('on',on);});
  }
  function syncAll(){
    var allOn=items().every(function(it){return it.classList.contains('on');});
    document.getElementById('agreeAll').classList.toggle('on',allOn);
  }
  function next(){
    var reqOk=[].slice.call(document.querySelectorAll('.ag-item[data-req]')).every(function(it){return it.classList.contains('on');});
    if(!reqOk){ toast('필수 약관에 동의해 주세요.'); return; }
    location.href='goodoc-webview.html';
  }

  var tt;
  function toast(m){var t=document.getElementById('toast');t.textContent=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(function(){t.classList.remove('show');},1800);}`;

const IMAGES: Record<string, string> = {
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
