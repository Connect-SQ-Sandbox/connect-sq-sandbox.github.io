import React, { useEffect } from 'react';
import imgThumbSkin from '@/assets/kakao-reference/ab-thumb-skin.png';
import imgThumbSurgery from '@/assets/kakao-reference/ab-thumb-surgery.png';

/**
 * kakao-booking-skin-confirm — 카카오톡 예약하기 · 예약 확인·약관 동의
 * 원본/참고: booking.kakao.com (예약 확인 퍼널)
 * 배포: https://connect-sq-sandbox.github.io/out/kakao-booking-skin-confirm.html
 * 표준 클론(kakao-booking-skin-confirm.html)의 body+script를 dangerouslySetInnerHTML+useEffect로 주입(self-contained).
 */

const BODY = `<style>
  .item-only,.price-summary.item-only{display:none}
  .visitor-form{margin-top:16px;padding-top:16px;border-top:1px solid #eee}
  .visitor-field{margin-top:12px}
  .visitor-field label{display:block;margin-bottom:7px;font-size:13px;color:#767676}
  .visitor-field input{width:100%;height:46px;border:1px solid #ddd;border-radius:8px;padding:0 13px;font-size:15px;outline:none}
  .visitor-field input:focus{border-color:#191919}
  .rep{cursor:pointer}
  .rep.diff .yc{background:#fff!important;border:1px solid #cfcfcf;color:#cfcfcf}
  .price-summary{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;padding:0 16px 18px}
  .price-summary .l{font-size:15px;font-weight:600}
  .price-summary .v{font-size:14px;line-height:1.45;text-align:right;color:#191919}
</style>
<div class="app">
  <header class="hd">
    <button class="ic" aria-label="뒤로" onclick="goBack()">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"/></svg>
    </button>
    <div class="t">예약하기</div>
    <button class="ic" aria-label="닫기" onclick="location.href='kakao-booking.html'">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6 6 18"/></svg>
    </button>
  </header>

  <!-- hospital -->
  <div class="hosp">
    <div class="th" id="confirmThumb" style="background-image:url('__IMG_IMG_THUMB_SKIN__')"></div>
    <div>
      <div class="hn">에이비성형외과의원</div>
      <div class="hs" id="confirmProduct">피부클리닉 시술예약</div>
    </div>
  </div>
  <div class="hr"></div>

  <!-- schedule -->
  <div class="sched">
    <span class="l">일정</span>
    <span class="v" id="schedule">7.21(화) · 오후 12:30</span>
  </div>
  <div class="price-summary item-only" id="priceSummary">
    <span class="l">가격 옵션</span>
    <span class="v"><b id="priceName">신규 상담</b><br><span id="priceDescription">상담 후 결정</span></span>
  </div>

  <div class="band"></div>

  <!-- 예약 정보 안내 -->
  <div class="pad">
    <div class="sec-title" id="guideTitle">추가정보 입력 안내</div>
    <div class="guide">
      <div class="li"><span class="dot">·</span><span id="guidePrimary">병원 방문 전, 진료에 꼭 필요한 정보를 예약 과정에 입력해 주시면 당일 진료가 더욱 원활하게 진행됩니다.</span></div>
      <div class="li"><span class="dot">·</span><span id="guideSecondary">입력하신 정보는 병원의 수탁사인 굿닥이 수집하며, 관련 법령에 따라 안전하게 관리 및 처리됩니다.</span></div>
    </div>
  </div>

  <div class="band"></div>

  <!-- 예약자 정보 -->
  <div class="pad">
    <div class="sec-title">예약자 정보</div>
    <div class="kv"><span class="k">이름</span><span class="v">김세화</span></div>
    <div class="kv"><span class="k">전화번호</span><span class="v">010-9924-0289</span></div>
    <div class="rep" id="visitorSame" onclick="toggleVisitor()">
      <span class="l" id="visitorLabel">대표 이용자 정보</span>
      <span class="r"><span class="yc"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="m5 12 5 5 9-10"/></svg></span><span id="visitorSameText">예약자 정보와 동일</span></span>
    </div>
    <div class="visitor-form" id="visitorForm" hidden>
      <div class="visitor-field"><label for="visitorName">방문자 이름</label><input id="visitorName" maxlength="30" placeholder="방문자 이름을 입력해 주세요"></div>
      <div class="visitor-field"><label for="visitorPhone">방문자 전화번호</label><input id="visitorPhone" inputmode="numeric" maxlength="13" placeholder="010-0000-0000" oninput="formatPhone(this)"></div>
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

const SCRIPT = `// 선택한 Product·Price·Schedule 문맥 이어받기
  var params=new URLSearchParams(location.search);
  var bookingType=params.get('type')==='medical-item'||sessionStorage.getItem('gd_booking_type')==='MEDICAL_ITEM'?'MEDICAL_ITEM':'EXAM_ROOM';
  var isMedical=bookingType==='MEDICAL_ITEM';
  var A={d:21,wd:'화',period:'오후',t:'12:30',productId:'product-skin-room',productName:'피부클리닉 시술예약'};
  try{var s=JSON.parse(sessionStorage.getItem('gd_appt'));if(s&&s.d)A=s;}catch(e){}
  var pad=function(n){return String(n).padStart(2,'0');};
  document.getElementById('schedule').textContent='7.'+A.d+'('+A.wd+') · '+A.period+' '+A.t;
  document.getElementById('autocancel').textContent='2026.07.'+pad(A.d)+'('+A.wd+')까지 이용하지 않을 경우 자동 취소';
  document.getElementById('cancellimit').textContent='취소 가능 기한 : 26.07.'+pad(A.d)+'('+A.wd+') '+A.t+' 전까지';
  if(isMedical){
    document.getElementById('confirmThumb').style.backgroundImage="url('__IMG_IMG_THUMB_SURGERY__')";
    document.getElementById('confirmProduct').textContent=A.productName||'성형외과 신규예약';
    document.getElementById('priceName').textContent=A.priceName||'신규 상담';
    document.getElementById('priceDescription').textContent=A.priceDescription||'상담 후 결정';
    document.getElementById('guideTitle').textContent='예약 정보를 확인해 주세요';
    document.getElementById('guidePrimary').textContent='선택한 상품·가격 옵션·일정과 예약자 정보가 맞는지 확인해 주세요.';
    document.getElementById('guideSecondary').textContent='다음 단계에서 굿닥 예약 웹뷰로 이동해 병원 약관과 필요한 추가 정보를 입력합니다.';
    document.getElementById('visitorLabel').textContent='방문자 정보';
    document.querySelectorAll('.item-only').forEach(function(el){el.style.display='flex';});
  }else{
    document.getElementById('visitorSame').onclick=null;
    document.getElementById('visitorSame').style.cursor='default';
  }

  function goBack(){
    if(history.length>1){history.back();return;}
    location.href=isMedical?'kakao-booking-ticket.html':'kakao-booking-skin.html';
  }

  var sameVisitor=true;
  function toggleVisitor(){
    sameVisitor=!sameVisitor;
    document.getElementById('visitorSame').classList.toggle('diff',!sameVisitor);
    document.getElementById('visitorSameText').textContent=sameVisitor?'예약자 정보와 동일':'다른 방문자 정보 입력';
    document.getElementById('visitorForm').hidden=sameVisitor;
  }
  function formatPhone(el){
    var v=el.value.replace(/[^0-9]/g,'').slice(0,11);
    if(v.length>7)el.value=v.slice(0,3)+'-'+v.slice(3,7)+'-'+v.slice(7);
    else if(v.length>3)el.value=v.slice(0,3)+'-'+v.slice(3);
    else el.value=v;
  }

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
    var visitor={name:'김세화',phone:'010-9924-0289'};
    if(!sameVisitor){
      var name=document.getElementById('visitorName').value.trim();
      var phone=document.getElementById('visitorPhone').value.trim();
      if(!name){toast('방문자 이름을 입력해 주세요.');return;}
      if(!/^010-\\d{4}-\\d{4}$/.test(phone)){toast('방문자 전화번호를 확인해 주세요.');return;}
      visitor={name:name,phone:phone};
    }
    if(isMedical){
      var context={
        type:'MEDICAL_ITEM',externalReservationId:'kakao-medical-'+A.scheduleId+'-'+A.priceId,
        productId:A.productId,productName:A.productName,priceId:A.priceId,priceName:A.priceName,
        priceDescription:A.priceDescription,scheduleId:A.scheduleId,d:A.d,wd:A.wd,period:A.period,t:A.t,
        booker:{name:'김세화',phone:'010-9924-0289'},visitor:visitor,
        consentVersion:'kakao-booking-prototype-v1',consentedAt:new Date().toISOString(),
        instantConfirm:params.get('confirm')==='auto',expiresAt:Number.MAX_SAFE_INTEGER,
        signature:'sandbox-signed-context-v1'
      };
      try{sessionStorage.setItem('gd_kakao_context',JSON.stringify(context));}catch(e){}
      location.href='goodoc-webview-item.html';
      return;
    }
    try{sessionStorage.setItem('gd_booking_type','EXAM_ROOM');}catch(e){}
    location.href='goodoc-webview.html';
  }

  var tt;
  function toast(m){var t=document.getElementById('toast');t.textContent=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(function(){t.classList.remove('show');},1800);}`;

const IMAGES: Record<string, string> = {
  '__IMG_IMG_THUMB_SKIN__': imgThumbSkin,
  '__IMG_IMG_THUMB_SURGERY__': imgThumbSurgery
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
