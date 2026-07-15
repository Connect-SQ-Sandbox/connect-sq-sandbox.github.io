import React, { useEffect } from 'react';

/**
 * goodoc-webview-item — 굿닥 병원 예약 신청 (진료항목 타입)
 * 배포: https://connect-sq-sandbox.github.io/out/goodoc-webview-item.html
 * 카카오에서 Product·Price·Schedule·예약자/방문자·동의를 받은 뒤,
 * 서명된 문맥을 검증하고 굿닥에 필요한 추가 정보만 수집하는 network-zero 프로토타입이다.
 */

const BODY = `<style>
  .summary-grid{display:grid;gap:10px;margin-top:12px}
  .summary-row{display:flex;justify-content:space-between;gap:14px;font-size:14px;line-height:1.5}
  .summary-row .k{color:#808799;flex:none}.summary-row .v{font-weight:600;text-align:right;color:#31353f}
  .received{padding:16px;border:1px solid #e3e6ed;border-radius:10px;background:#f9f9fb}
  .received-row{display:flex;justify-content:space-between;gap:16px;padding:7px 0;font-size:14px}
  .received-row .k{color:#808799}.received-row .v{text-align:right;font-weight:600}
  .address-stack{display:grid;gap:8px}.address-find{position:relative}.address-find .inp{padding-right:76px}
  .address-find button{position:absolute;right:8px;top:7px;height:34px;padding:0 12px;border:0;border-radius:6px;background:#e5f2ff;color:#0073fa;font-weight:700;cursor:pointer}
  .legal-all{padding:14px 0 16px;border-bottom:1px solid #e3e6ed;font-weight:700}
  .legal-view{margin-left:auto;border:0;background:none;color:#808799;text-decoration:underline;cursor:pointer;font-size:13px}
  .cta button:disabled{background:#caced8;cursor:not-allowed}
  .check-layer{position:fixed;inset:0;z-index:60;max-width:480px;margin:0 auto;background:rgba(255,255,255,.96);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:28px;text-align:center}
  .check-layer .spinner{width:42px;height:42px;border:4px solid #e5f2ff;border-top-color:#0073fa;border-radius:50%;animation:spin .8s linear infinite;margin-bottom:18px}
  .check-layer b{font-size:19px}.check-layer p{font-size:14px;line-height:1.6;color:#808799}
  @keyframes spin{to{transform:rotate(360deg)}}
  .flow-error{position:fixed;inset:0;z-index:70;max-width:480px;margin:0 auto;background:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px;text-align:center}
  .flow-error .mark{width:64px;height:64px;border-radius:50%;background:#fff1f1;color:#e5484d;display:flex;align-items:center;justify-content:center;font-size:30px;font-weight:800;margin-bottom:22px}
  .flow-error h2{font-size:22px;margin:0 0 10px}.flow-error p{font-size:14px;line-height:1.65;color:#808799;margin:0 0 30px}
  .error-actions{width:100%;display:grid;gap:10px}.error-actions button{width:100%;height:52px;border:0;border-radius:8px;font-size:16px;font-weight:700;cursor:pointer}
  .error-actions .primary{background:#0073fa;color:#fff}.error-actions .secondary{background:#f2f4f7;color:#434956}
  .ov{position:fixed;inset:0;z-index:90;background:rgba(0,0,0,.38);display:flex;align-items:flex-end;justify-content:center}
  .sheet{width:100%;max-width:480px;max-height:72vh;overflow:auto;background:#fff;border-radius:18px 18px 0 0;padding:24px 20px 28px}
  .sheet h3{font-size:18px;margin:0 0 14px}.sheet .body{font-size:14px;line-height:1.7;color:#5d6474;white-space:pre-line}
  .sheet button{width:100%;height:48px;border:0;border-radius:8px;background:#31353f;color:#fff;font-size:15px;font-weight:700;margin-top:20px;cursor:pointer}
</style>

<div class="app" id="bookingApp">
  <header class="hd">
    <div class="logo">
      <svg viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="7" fill="#0073FA"/><circle cx="10.2" cy="3.8" r="2.4" fill="#41D293"/></svg>
      <b>굿닥 병원 예약</b>
    </div>
  </header>

  <form onsubmit="return false">
    <div class="summary">
      <h2 class="h">카카오에서 선택한 내용이에요.</h2>
      <div class="infobox">
        <div class="it" id="productVal">성형외과 신규예약</div>
        <div class="summary-grid">
          <div class="summary-row"><span class="k">가격 옵션</span><span class="v"><span id="priceNameVal">신규 상담</span><br><span id="priceDescVal">상담 후 결정</span></span></div>
          <div class="summary-row"><span class="k">예약 일시</span><span class="v" id="whenVal">7월 21일 (화) 오후 12:30</span></div>
        </div>
      </div>
    </div>

    <div class="content">
      <div class="inner">
        <div class="section">
          <div class="stitle"><span class="t">카카오톡 예약 정보</span></div>
          <div class="received">
            <div class="received-row"><span class="k">예약자</span><span class="v" id="bookerVal">김세화 · 010-****-0289</span></div>
            <div class="received-row"><span class="k">방문자</span><span class="v" id="visitorVal">김세화 · 010-****-0289</span></div>
          </div>
          <div class="note">카카오톡 예약하기에서 이미 받은 정보는 다시 입력하지 않아요.</div>
        </div>

        <div class="section">
          <div class="stitle"><span class="t">병원 예약에 필요한 추가 정보</span></div>
          <div class="field">
            <label class="flabel" for="birth">방문자 생년월일</label>
            <input class="inp" id="birth" inputmode="numeric" maxlength="10" placeholder="YYYY-MM-DD" oninput="formatBirth(this);validate()">
          </div>
          <div class="field">
            <label class="flabel">방문자 성별</label>
            <div class="genders">
              <div class="gender" data-gender="남자" onclick="pickGender(this)"><span class="rd"></span>남자</div>
              <div class="gender" data-gender="여자" onclick="pickGender(this)"><span class="rd"></span>여자</div>
            </div>
          </div>
          <div class="field">
            <label class="flabel">방문자 주소</label>
            <div class="address-stack">
              <div class="address-find"><input class="inp" id="addr" readonly placeholder="도로명 또는 지번 주소를 검색해 주세요."><button type="button" onclick="searchAddr()">주소 검색</button></div>
              <input class="inp hidden" id="addr2" placeholder="상세 주소를 입력해 주세요." oninput="validate()">
            </div>
          </div>
          <div class="field">
            <label class="flabel" for="memo">요청사항 <span style="color:#a8aebd">선택</span></label>
            <textarea class="inp" id="memo" maxlength="200" placeholder="병원에 전달할 사항이 있다면 입력해 주세요."></textarea>
          </div>
        </div>

        <div class="section">
          <div class="stitle"><span class="t">병원 약관 동의</span><span class="ess">필수</span></div>
          <div class="opt-row legal-row legal-all" id="legalAll" onclick="toggleAllLegal()">
            <div class="cwrap"><span class="ckb"></span><span class="lab">필수 약관 전체 동의</span></div>
          </div>
          <div class="opt-row legal-row" data-legal onclick="toggleLegal(this)">
            <div class="cwrap"><span class="ckb"></span><span class="lab">[필수] 진료정보 제3자 제공 동의</span></div>
            <button type="button" class="legal-view" onclick="event.stopPropagation();openTerm(0)">보기</button>
          </div>
          <div class="opt-row legal-row" data-legal onclick="toggleLegal(this)">
            <div class="cwrap"><span class="ckb"></span><span class="lab">[필수] 병원 예약 및 취소 규정 확인</span></div>
            <button type="button" class="legal-view" onclick="event.stopPropagation();openTerm(1)">보기</button>
          </div>
        </div>
      </div>
    </div>
  </form>

  <div class="cta"><button id="cta" disabled onclick="submitBooking()">예약 신청하기</button></div>
</div>

<div class="check-layer hidden" id="checkLayer">
  <div class="spinner"></div>
  <b>예약 가능 여부를 확인하고 있어요</b>
  <p>상품·가격 옵션·예약 시간을 다시 확인한 뒤 안전하게 예약을 신청합니다.</p>
</div>

<div class="done hidden" id="done">
  <div class="check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="m5 12 5 5 9-10"/></svg></div>
  <div class="dt" id="doneTitle">예약 신청이 완료되었어요</div>
  <div class="ds" id="doneDesc">병원 확인 후 예약이 최종 확정됩니다.<br>확정 결과는 카카오톡으로 안내드려요.</div>
  <div class="dbox">
    <div class="dr"><span class="dk">병원</span><span class="dv">에이비성형외과의원</span></div>
    <div class="dr"><span class="dk">진료항목</span><span class="dv" id="doneProduct">성형외과 신규예약</span></div>
    <div class="dr"><span class="dk">가격 옵션</span><span class="dv" id="donePrice">신규 상담 · 상담 후 결정</span></div>
    <div class="dr"><span class="dk">일시</span><span class="dv" id="doneWhen">7월 21일 (화) 오후 12:30</span></div>
    <div class="dr"><span class="dk">방문자</span><span class="dv" id="doneVisitor">김세화</span></div>
  </div>
  <div style="width:100%;margin-top:auto;padding:20px 0 24px;"><button style="width:100%;height:52px;border:0;border-radius:8px;background:#31353F;color:#fff;font-size:16px;font-weight:700;cursor:pointer;" onclick="toast('예약 웹뷰를 닫고 카카오톡으로 돌아갑니다.')">확인</button></div>
</div>

<div class="flow-error hidden" id="flowError">
  <div class="mark">!</div>
  <h2 id="errorTitle">예약 정보를 확인해 주세요</h2>
  <p id="errorBody">상품 화면으로 돌아가 다시 시도해 주세요.</p>
  <div class="error-actions">
    <button class="primary" id="errorPrimary" onclick="handleErrorPrimary()">카카오 상품으로 돌아가기</button>
    <button class="secondary" id="errorSecondary" onclick="location.href='kakao-booking.html'">병원 화면으로 돌아가기</button>
  </div>
</div>

<div class="ov hidden" id="termOv" onclick="if(event.target.id==='termOv')closeTerm()"><div class="sheet"><h3 id="termTitle"></h3><div class="body" id="termBody"></div><button type="button" onclick="closeTerm()">확인</button></div></div>
<div class="toast" id="toast"></div>`;

const SCRIPT = `var TERMS=[
    {title:'진료정보 제3자 제공 동의',body:'예약 접수와 병원 방문을 위해 예약자·방문자 정보와 예약 내용을 해당 병원에 제공합니다. 동의하지 않으면 예약을 신청할 수 없습니다.'},
    {title:'병원 예약 및 취소 규정',body:'예약 변경·취소가 필요한 경우 이용 안내에 표시된 병원 연락처로 미리 연락해 주세요. 신청 시점의 예약 정보와 동의 내용이 병원에 전달됩니다.'}
  ];
  var params=new URLSearchParams(location.search);
  var scenario=params.get('scenario')||'';
  var context=null,submitted=false,attempts=0,errorMode='ticket';

  function readContext(){
    try{context=JSON.parse(sessionStorage.getItem('gd_kakao_context'));}catch(e){context=null;}
    var valid=context&&context.type==='MEDICAL_ITEM'&&context.productId&&context.priceId&&context.scheduleId&&context.signature==='sandbox-signed-context-v1'&&Number(context.expiresAt)>Date.now();
    if(scenario==='expired'||scenario==='invalid-signature')valid=false;
    if(!valid){
      showError('예약 정보를 다시 확인해 주세요','카카오에서 전달된 예약 정보가 없거나 유효하지 않아요. 상품·가격 옵션·일정을 다시 선택해 주세요.','ticket',false);
      return;
    }
    hydrate();
  }

  function masked(phone){
    var digits=String(phone||'').replace(/[^0-9]/g,'');
    return digits.length===11?digits.slice(0,3)+'-****-'+digits.slice(7):phone;
  }
  function whenText(){return '7월 '+context.d+'일 ('+context.wd+') '+context.period+' '+context.t;}
  function hydrate(){
    document.getElementById('productVal').textContent=context.productName;
    document.getElementById('priceNameVal').textContent=context.priceName;
    document.getElementById('priceDescVal').textContent=context.priceDescription||'가격 안내 없음';
    document.getElementById('whenVal').textContent=whenText();
    document.getElementById('bookerVal').textContent=context.booker.name+' · '+masked(context.booker.phone);
    document.getElementById('visitorVal').textContent=context.visitor.name+' · '+masked(context.visitor.phone);
    document.getElementById('doneProduct').textContent=context.productName;
    document.getElementById('donePrice').textContent=context.priceName+' · '+(context.priceDescription||'가격 안내 없음');
    document.getElementById('doneWhen').textContent=whenText();
    document.getElementById('doneVisitor').textContent=context.visitor.name;
  }

  function formatBirth(el){
    var v=el.value.replace(/[^0-9]/g,'').slice(0,8);
    el.value=v.length>6?v.slice(0,4)+'-'+v.slice(4,6)+'-'+v.slice(6):v.length>4?v.slice(0,4)+'-'+v.slice(4):v;
  }
  function validBirth(){
    var v=document.getElementById('birth').value;
    if(!/^\\d{4}-\\d{2}-\\d{2}$/.test(v))return false;
    var p=v.split('-').map(Number),d=new Date(p[0],p[1]-1,p[2]);
    return d.getFullYear()===p[0]&&d.getMonth()===p[1]-1&&d.getDate()===p[2]&&d<=new Date();
  }
  function pickGender(el){document.querySelectorAll('.gender').forEach(function(g){g.classList.remove('on');});el.classList.add('on');validate();}
  function searchAddr(){
    document.getElementById('addr').value='서울 서초구 서초대로77길 17';
    document.getElementById('addr2').classList.remove('hidden');
    document.getElementById('addr2').focus();validate();
  }
  function box(row){return row.querySelector('.ckb');}
  function toggleLegal(row){box(row).classList.toggle('on');row.classList.toggle('on');syncLegal();validate();}
  function toggleAllLegal(){
    var all=document.getElementById('legalAll'),on=!box(all).classList.contains('on');
    box(all).classList.toggle('on',on);all.classList.toggle('on',on);
    document.querySelectorAll('[data-legal]').forEach(function(row){box(row).classList.toggle('on',on);row.classList.toggle('on',on);});validate();
  }
  function syncLegal(){
    var rows=[].slice.call(document.querySelectorAll('[data-legal]'));
    var on=rows.every(function(row){return box(row).classList.contains('on');});
    box(document.getElementById('legalAll')).classList.toggle('on',on);document.getElementById('legalAll').classList.toggle('on',on);
  }
  function validate(){
    var legal=[].slice.call(document.querySelectorAll('[data-legal]')).every(function(row){return box(row).classList.contains('on');});
    var ready=context&&validBirth()&&document.querySelector('.gender.on')&&document.getElementById('addr').value&&legal;
    document.getElementById('cta').disabled=!ready;
  }

  function openTerm(i){document.getElementById('termTitle').textContent=TERMS[i].title;document.getElementById('termBody').textContent=TERMS[i].body;document.getElementById('termOv').classList.remove('hidden');}
  function closeTerm(){document.getElementById('termOv').classList.add('hidden');}

  function submitBooking(){
    if(submitted){document.getElementById('done').classList.remove('hidden');return;}
    if(!context||document.getElementById('cta').disabled)return;
    attempts+=1;document.getElementById('cta').disabled=true;document.getElementById('checkLayer').classList.remove('hidden');
    setTimeout(function(){
      document.getElementById('checkLayer').classList.add('hidden');
      if(scenario==='slot-full'){
        showError('선택한 시간의 예약이 마감되었어요','다른 예약이 먼저 접수되어 예약 가능 수량이 소진됐어요. 다른 일정을 선택해 주세요.','ticket',false);return;
      }
      if(scenario==='price-changed'){
        showError('가격 정보가 변경되었어요','예약 신청 전 가격 정보가 바뀌었어요. 상품 화면에서 최신 가격을 확인해 주세요.','ticket',false);return;
      }
      if(scenario==='not-sale'){
        showError('현재 예약할 수 없는 상품이에요','병원의 예약 운영 상태가 변경되어 신규 예약을 받지 않고 있어요.','home',false);return;
      }
      if(scenario==='timeout'&&attempts===1){
        showError('예약 확인이 지연되고 있어요','병원 예약 상태를 확인하는 데 시간이 걸리고 있어요. 다시 시도해도 예약은 중복으로 생성되지 않아요.','retry',true);return;
      }
      finish(scenario==='duplicate');
    },850);
  }

  function finish(existing){
    submitted=true;
    if(existing){document.getElementById('doneTitle').textContent='이미 접수된 예약을 확인했어요';}
    if(context.instantConfirm){
      document.getElementById('doneTitle').textContent='예약이 확정되었어요';
      document.getElementById('doneDesc').innerHTML='선택한 일정에 맞춰 병원을 방문해 주세요.<br>예약 내용은 카카오톡에서도 확인할 수 있어요.';
    }
    document.getElementById('done').classList.remove('hidden');
  }

  function showError(title,body,mode,retryable){
    errorMode=mode;document.getElementById('errorTitle').textContent=title;document.getElementById('errorBody').textContent=body;
    document.getElementById('errorPrimary').textContent=retryable?'다시 시도하기':mode==='home'?'병원 화면으로 돌아가기':'상품·일정 다시 선택';
    document.getElementById('errorSecondary').classList.toggle('hidden',mode==='home');
    document.getElementById('flowError').classList.remove('hidden');
  }
  function handleErrorPrimary(){
    if(errorMode==='retry'){document.getElementById('flowError').classList.add('hidden');validate();submitBooking();return;}
    location.href=errorMode==='home'?'kakao-booking.html':'kakao-booking-ticket.html';
  }

  var tt;function toast(m){var t=document.getElementById('toast');t.textContent=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(function(){t.classList.remove('show');},1800);}
  readContext();`;

function applyImages(text: string) { return text; }

export default function Page() {
  useEffect(() => {
    const el = document.createElement('script');
    el.textContent = applyImages(SCRIPT);
    document.body.appendChild(el);
    return () => { el.remove(); };
  }, []);
  return <div dangerouslySetInnerHTML={{ __html: applyImages(BODY) }} />;
}
