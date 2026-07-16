import React, { useEffect } from 'react';

import lottie from 'lottie-web';
import Loading from '@/assets/lotties/loading.json';

/**
 * goodoc-webview — 굿닥 병원 예약 (진료실 연동 웹뷰)
 * 원본/참고: github.com/goodoc/goodoc-partnership
 * 배포: https://connect-sq-sandbox.github.io/out/goodoc-webview.html
 * 표준 클론(goodoc-webview-clone.html)의 body+script를 dangerouslySetInnerHTML+useEffect로 주입(self-contained).
 */

const BODY = `<div class="app">
  <!-- header -->
  <header class="hd">
    <div class="logo">
      <svg viewBox="0 0 17 28" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8.4987 23.348C7.51374 23.3478 6.56135 23.001 5.81386 22.3702C5.06637 21.7395 4.57312 20.8665 4.42338 19.9092H0.180542C0.341099 21.974 1.28855 23.903 2.83335 25.3104C4.37814 26.7177 6.40633 27.4996 8.51219 27.4996C10.6181 27.4996 12.6463 26.7177 14.1911 25.3104C15.7359 23.903 16.6833 21.974 16.8439 19.9092H12.5848C12.4348 20.8683 11.94 21.7427 11.1902 22.3737C10.4405 23.0047 9.48552 23.3503 8.4987 23.348Z" fill="#0073FA"/><path d="M16.8441 0.5H12.5417V4.65629H16.8441V0.5Z" fill="#41D293"/><path d="M8.50004 3.62256C6.84738 3.62256 5.23184 4.1045 3.85771 5.00738C2.48358 5.91027 1.41255 7.19358 0.780107 8.69502C0.147663 10.1965 -0.0178125 11.8486 0.304605 13.4425C0.627022 15.0365 1.42286 16.5006 2.59146 17.6497C3.76007 18.7989 5.24896 19.5815 6.86986 19.8985C8.49076 20.2156 10.1709 20.0529 11.6977 19.4309C13.2246 18.809 14.5296 17.7558 15.4478 16.4046C16.3659 15.0533 16.856 13.4646 16.856 11.8395C16.8531 9.66108 15.9719 7.57272 14.4055 6.03235C12.839 4.49199 10.7153 3.62537 8.50004 3.62256ZM8.50004 15.8895C7.68547 15.8895 6.88919 15.652 6.2119 15.2069C5.53461 14.7619 5.00672 14.1294 4.695 13.3894C4.38328 12.6493 4.30173 11.835 4.46065 11.0494C4.61956 10.2638 5.01179 9.54212 5.58778 8.97572C6.16377 8.40932 6.89761 8.02359 7.69653 7.86732C8.49545 7.71105 9.32356 7.79123 10.0761 8.09777C10.8287 8.4043 11.4719 8.9234 11.9245 9.58942C12.377 10.2554 12.6186 11.0385 12.6186 11.8395C12.6171 12.9132 12.1828 13.9425 11.4107 14.7017C10.6386 15.4609 9.59191 15.8881 8.50004 15.8895Z" fill="#0073FA"/></svg>
      <b>굿닥 병원 예약</b>
    </div>
  </header>

  <form onsubmit="return false">
    <!-- summary -->
    <div class="summary">
      <h2 class="h">아래 내용을 확인해주세요.</h2>
      <div class="infobox">
        <div class="room">피부 레이저 진료실</div>
        <div class="meta">피부과 3진료실<span class="dot">∙</span>피부과<span class="dot">∙</span>이지은 원장</div>
        <div class="when" id="wvWhen">2026년 7월 21일 (화) 오후 12:30</div>
      </div>
    </div>

    <!-- 환자 정보 -->
    <div class="content">
      <div class="inner">
        <div class="ctitle">환자 정보</div>

        <div class="section">
          <div class="pname">김세화</div>
          <div class="pphone">010-****-0289</div>
        </div>

        <!-- 주민등록번호 -->
        <div class="section">
          <div class="stitle">
            <span class="t">주민등록번호</span><span class="ess">필수</span>
            <div class="right on" id="rrnMask" onclick="toggleMask()">
              <span class="lchk"><svg viewBox="0 0 24 24" fill="none"><path d="M6.5 11.5L11 16L18 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
              <span>뒷자리 가리기</span>
            </div>
          </div>
          <div class="row2">
            <input class="inp" id="rrn1" inputmode="numeric" maxlength="6" placeholder="000000" oninput="onRrn()">
            <span class="rrn-sep">-</span>
            <input class="inp rrn-back" id="rrn2" inputmode="numeric" maxlength="7" placeholder="0000000" oninput="onRrn()">
          </div>
          <div class="helper">입력하신 주민등록번호는 접수를 위해 병원에만 전달되며, 굿닥에서는 별도 수집하지 않습니다. 또한 입력하신 주민등록번호와 환자 정보가 일치하지 않으면 진료 시 불이익이 발생할 수 있습니다.</div>
        </div>

        <!-- 주소 -->
        <div class="section">
          <div class="stitle"><span class="t">주소</span><span class="ess">필수</span></div>
          <div class="addr-wrap">
            <div class="addr-field">
              <input class="inp" id="addr" placeholder="도로명 또는 지번 주소를 검색해 주세요." readonly onclick="searchAddr()">
              <button type="button" class="clr hidden" id="addrClr" onclick="clearAddr(event)">✕</button>
            </div>
            <input class="inp hidden" id="addr2" placeholder="상세 주소를 입력해 주세요." oninput="validate()">
          </div>
        </div>

        <!-- 병원 약관 동의 -->
        <div class="section">
          <div class="stitle"><span class="t">병원 약관 동의</span><span class="ess">필수</span></div>
          <div class="consent-list">
            <div class="consent-row all" id="consentAll" onclick="toggleAllConsent()">
              <div class="cwrap"><span class="ckb"></span><span class="lab">전체 동의</span></div>
            </div>
            <div class="consent-row" data-consent onclick="toggleConsent(this)">
              <div class="cwrap"><span class="ckb"></span><span class="lab">[필수] 진료정보 제3자 제공 동의</span></div>
              <button type="button" class="arrow" onclick="event.stopPropagation();openConsent('진료정보 제3자 제공 동의','환자의 원활한 진료 접수를 위해 성명·연락처·주민등록번호·주소 등 예약 정보를 해당 병원에 제공하는 것에 동의합니다. 제공된 정보는 진료 목적 외로 사용되지 않습니다.')">
                <svg viewBox="0 0 18 18" fill="none"><path fill-rule="evenodd" clip-rule="evenodd" d="M6.21967 3.96967C6.51256 3.67678 6.98744 3.67678 7.28033 3.96967L11.7803 8.46967C12.0732 8.76256 12.0732 9.23744 11.7803 9.53033L7.28033 14.0303C6.98744 14.3232 6.51256 14.3232 6.21967 14.0303C5.92678 13.7374 5.92678 13.2626 6.21967 12.9697L10.1893 9L6.21967 5.03033C5.92678 4.73744 5.92678 4.26256 6.21967 3.96967Z" fill="currentColor"/></svg>
              </button>
            </div>
            <div class="consent-row" data-consent onclick="toggleConsent(this)">
              <div class="cwrap"><span class="ckb"></span><span class="lab">[필수] 진료 예약 및 취소 규정 확인</span></div>
              <button type="button" class="arrow" onclick="event.stopPropagation();openConsent('진료 예약 및 취소 규정','예약 시간 10분 전까지 내원 부탁드립니다. 예약 변경·취소는 예약 시간 최소 1일 전 대표번호로 연락 주시기 바랍니다. 무단 노쇼가 반복될 경우 예약이 제한될 수 있습니다.')">
                <svg viewBox="0 0 18 18" fill="none"><path fill-rule="evenodd" clip-rule="evenodd" d="M6.21967 3.96967C6.51256 3.67678 6.98744 3.67678 7.28033 3.96967L11.7803 8.46967C12.0732 8.76256 12.0732 9.23744 11.7803 9.53033L7.28033 14.0303C6.98744 14.3232 6.51256 14.3232 6.21967 14.0303C5.92678 13.7374 5.92678 13.2626 6.21967 12.9697L10.1893 9L6.21967 5.03033C5.92678 4.73744 5.92678 4.26256 6.21967 3.96967Z" fill="currentColor"/></svg>
              </button>
            </div>
          </div>
        </div>

        <!-- 내원 목적 -->
        <div class="section">
          <div class="stitle"><span class="t">내원 목적</span><span class="ess">필수</span></div>
          <div class="vp-desc">내원하는 이유를 선택해 주세요.</div>
          <div id="vpEmpty"><button type="button" class="vp-select" onclick="openVp()">내원 목적 선택</button></div>
          <div id="vpChips" class="vp-chips hidden">
            <span class="vp-chip add" onclick="openVp()">+ 선택</span>
          </div>
        </div>
      </div>
    </div>

    <!-- terms -->
    <div class="terms">
      <div class="inner">
        <div class="term-row"><span class="tt">이용약관 동의</span><span class="view" onclick="openTerm(0)">보기</span></div>
        <div class="term-row"><span class="tt">개인정보 수집 및 이용 동의</span><span class="view" onclick="openTerm(1)">보기</span></div>
        <div class="term-row"><span class="tt">고유식별정보 이용 동의</span><span class="view" onclick="openTerm(2)">보기</span></div>
        <div class="term-notes">
          <div class="term-note">하단의 "요청" 버튼을 클릭하면 굿닥 서비스 이용약관, 개인정보 수집 및 이용, 고유식별정보 이용에 대한 동의를 받습니다.</div>
          <div class="term-note">(주)굿닥은 병원으로부터 진료 접수·예약 업무를 위탁받아 개인정보를 처리하는 업무만을 수행하며, 접수·예약은 병원 시스템 또는 네트워크 사정으로 실패할 수 있으며, 이 경우 (주)굿닥은 책임을 지지 않습니다.</div>
          <div class="term-note">병원의 설정에 따라 추가 정보(예: 주소, 내원 목적, 병원 약관 동의 등)가 요구될 수 있습니다.</div>
        </div>
      </div>
    </div>
  </form>

  <!-- cta -->
  <div class="cta">
    <button id="cta" disabled onclick="submitBooking()">예약 요청</button>
  </div>
</div>

<!-- loading -->
<div class="loading" id="loading">
  <div class="load-inner">
    <div class="load-logo">
      <svg class="gd-mark" viewBox="0 0 17 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8.4987 23.348C7.51374 23.3478 6.56135 23.001 5.81386 22.3702C5.06637 21.7395 4.57312 20.8665 4.42338 19.9092H0.180542C0.341099 21.974 1.28855 23.903 2.83335 25.3104C4.37814 26.7177 6.40633 27.4996 8.51219 27.4996C10.6181 27.4996 12.6463 26.7177 14.1911 25.3104C15.7359 23.903 16.6833 21.974 16.8439 19.9092H12.5848C12.4348 20.8683 11.94 21.7427 11.1902 22.3737C10.4405 23.0047 9.48552 23.3503 8.4987 23.348Z" fill="#0073FA"/>
        <path d="M16.8441 0.5H12.5417V4.65629H16.8441V0.5Z" fill="#41D293"/>
        <path d="M8.50004 3.62256C6.84738 3.62256 5.23184 4.1045 3.85771 5.00738C2.48358 5.91027 1.41255 7.19358 0.780107 8.69502C0.147663 10.1965 -0.0178125 11.8486 0.304605 13.4425C0.627022 15.0365 1.42286 16.5006 2.59146 17.6497C3.76007 18.7989 5.24896 19.5815 6.86986 19.8985C8.49076 20.2156 10.1709 20.0529 11.6977 19.4309C13.2246 18.809 14.5296 17.7558 15.4478 16.4046C16.3659 15.0533 16.856 13.4646 16.856 11.8395C16.8531 9.66108 15.9719 7.57272 14.4055 6.03235C12.839 4.49199 10.7153 3.62537 8.50004 3.62256ZM8.50004 15.8895C7.68547 15.8895 6.88919 15.652 6.2119 15.2069C5.53461 14.7619 5.00672 14.1294 4.695 13.3894C4.38328 12.6493 4.30173 11.835 4.46065 11.0494C4.61956 10.2638 5.01179 9.54212 5.58778 8.97572C6.16377 8.40932 6.89761 8.02359 7.69653 7.86732C8.49545 7.71105 9.32356 7.79123 10.0761 8.09777C10.8287 8.4043 11.4719 8.9234 11.9245 9.58942C12.377 10.2554 12.6186 11.0385 12.6186 11.8395C12.6171 12.9132 12.1828 13.9425 11.4107 14.7017C10.6386 15.4609 9.59191 15.8881 8.50004 15.8895Z" fill="#0073FA"/>
      </svg>
      <span class="load-go">굿닥으로 이동합니다.</span>
    </div>
    <div class="load-title">병원 방문 기록을<br>조회 중입니다.</div>
    <div id="lottie" class="gd-lottie" role="progressbar" aria-label="병원 방문 기록 조회 중"></div>
  </div>
</div>

<!-- completion -->
<div class="done hidden" id="done">
  <div class="check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="m5 12 5 5 9-10"/></svg></div>
  <div class="dt">예약 요청이 완료되었어요</div>
  <div class="ds">병원 확인 후 예약이 최종 확정됩니다.<br>확정 결과는 카카오톡으로 안내드려요.</div>
  <div class="dbox">
    <div class="dr"><span class="dk">병원</span><span class="dv">에이비성형외과의원</span></div>
    <div class="dr"><span class="dk">진료실</span><span class="dv">피부과 3진료실 · 이지은 원장</span></div>
    <div class="dr"><span class="dk">일시</span><span class="dv" id="wvWhen2">7월 21일 (화) 오후 12:30</span></div>
    <div class="dr"><span class="dk">예약자</span><span class="dv">김세화</span></div>
  </div>
  <div style="width:100%;margin-top:auto;padding:20px 0 24px;">
    <button style="width:100%;height:54px;border:0;border-radius:12px;background:#31353F;color:#fff;font-size:16px;font-weight:700;cursor:pointer;" onclick="toast('웹뷰를 닫습니다 (앱으로 복귀)')">확인</button>
  </div>
</div>

<!-- modal -->
<div class="ov hidden" id="ov"><div class="sheet" id="sheet"></div></div>
<div class="toast" id="toast"></div>`;

const SCRIPT = `var TERMS=[
    {title:'이용약관 동의',body:'• 본 서비스는 병원으로부터 위탁받아 ㈜굿닥에서 제공하는 병원 접수/예약 서비스와 연계되어 본 페이지를 통해 사용자가 진료 접수/예약을 할 수 있도록 합니다.\\n\\n• 병원 사정, 네트워크/시스템 장애 등으로 접수·예약이 실패할 수 있습니다. 실패 시 안내에 따르며, 굿닥은 병원·EMR·카카오 시스템 장애에 대해 직접 책임을 지지 않습니다.\\n\\n• 이용자는 정확한 정보(이름, 연락처 등)를 제공해야 하며, 타인의 정보 사용 등 부정 이용을 금지합니다.'},
    {title:'개인정보 수집 및 이용 동의',body:'수집목적 : 병원 예약 접수 및 확인 변경 취소 처리를 위함\\n수집항목 : (필수)이름, 연락처, 거주지주소, 법정대리인명, 법정대리인 연락처\\n보유 및 이용 기간 : 5년\\n\\n의료법 시행규칙 제15조에 따라서 병원 진료 완료 후 해당 기간 보관하며 해당 내용 파기합니다.\\n이용자는 개인정보 수집동의를 거부할 수 있으나 거부할 경우 서비스 이용이 제한될 수 있습니다.'},
    {title:'고유식별정보 이용 동의',body:'이용목적 : 병원 예약 접수 및 확인 변경 취소 처리를 위함\\n이용항목 : (필수)주민등록번호\\n보유 및 이용 기간 : 5년\\n\\n개인정보보호법 제24조의2에 따라서 고유식별정보는 수집하지 않지만, 병원으로 해당 주민등록번호는 제공하고 있습니다.'}
  ];
  var VP=['진료/상담','피부 시술','재진/경과 확인','시술 후 관리','기타 문의'];

  // loading 2s
  setTimeout(function(){document.getElementById('loading').classList.add('hidden');},2000);

  // 선택 일시 이어받기 (티켓·퍼널 → 웹뷰)
  (function(){
    var A={d:21,wd:'화',period:'오후',t:'12:30'};
    try{var s=JSON.parse(sessionStorage.getItem('gd_appt'));if(s&&s.d)A=s;}catch(e){}
    var w=document.getElementById('wvWhen'); if(w) w.textContent='2026년 7월 '+A.d+'일 ('+A.wd+') '+A.period+' '+A.t;
    var w2=document.getElementById('wvWhen2'); if(w2) w2.textContent='7월 '+A.d+'일 ('+A.wd+') '+A.period+' '+A.t;
  })();

  // rrn masking
  var masking=true;
  function toggleMask(){
    masking=!masking;
    document.getElementById('rrnMask').classList.toggle('on',masking);
    var r2=document.getElementById('rrn2');
    r2.type = masking ? 'password' : 'text';
  }
  document.getElementById('rrn2').type='password';
  function onRrn(){
    ['rrn1','rrn2'].forEach(function(id){var e=document.getElementById(id);e.value=e.value.replace(/[^0-9]/g,'');});
    validate();
  }

  // address (mock 검색)
  function searchAddr(){
    document.getElementById('addr').value='서울 서초구 서초대로77길 17';
    document.getElementById('addrClr').classList.remove('hidden');
    document.getElementById('addr2').classList.remove('hidden');
    toast('주소가 입력되었습니다 (목)');
    validate();
  }
  function clearAddr(e){
    e.stopPropagation();
    document.getElementById('addr').value='';
    document.getElementById('addr2').value='';
    document.getElementById('addr2').classList.add('hidden');
    document.getElementById('addrClr').classList.add('hidden');
    validate();
  }

  // consents (체크박스 .ckb 기준)
  function ckbOf(row){return row.querySelector('.ckb');}
  function toggleConsent(el){ckbOf(el).classList.toggle('on');syncAll();validate();}
  function toggleAllConsent(){
    var all=document.getElementById('consentAll');
    var on=!ckbOf(all).classList.contains('on');
    ckbOf(all).classList.toggle('on',on);
    document.querySelectorAll('[data-consent]').forEach(function(c){ckbOf(c).classList.toggle('on',on);});
    validate();
  }
  function syncAll(){
    var items=[].slice.call(document.querySelectorAll('[data-consent]'));
    var allOn=items.length>0&&items.every(function(c){return ckbOf(c).classList.contains('on');});
    ckbOf(document.getElementById('consentAll')).classList.toggle('on',allOn);
  }

  // visit purpose
  function openVp(){
    var s=document.getElementById('sheet');
    s.innerHTML='<h4>내원 목적 선택</h4>'+VP.map(function(v){return '<div class="opt" onclick="pickVp(\\''+v+'\\')">'+v+'<span style="color:#808799">›</span></div>';}).join('')+'<button class="close" onclick="closeOv()">닫기</button>';
    document.getElementById('ov').classList.remove('hidden');
  }
  function pickVp(v){
    document.getElementById('vpEmpty').classList.add('hidden');
    var chips=document.getElementById('vpChips');
    chips.classList.remove('hidden');
    // remove existing (single-select for proto)
    [].slice.call(chips.querySelectorAll('.vp-chip:not(.add)')).forEach(function(c){c.remove();});
    var chip=document.createElement('span');chip.className='vp-chip';chip.textContent=v;
    chips.appendChild(chip);
    closeOv();validate();
  }

  // modals
  function openConsent(title,body){openSheet(title,body);}
  function openTerm(i){openSheet(TERMS[i].title,TERMS[i].body);}
  function openSheet(title,body){
    document.getElementById('sheet').innerHTML='<h4>'+title+'</h4><div class="body">'+body+'</div><button class="close" onclick="closeOv()">확인</button>';
    document.getElementById('ov').classList.remove('hidden');
  }
  function closeOv(){document.getElementById('ov').classList.add('hidden');}
  document.getElementById('ov').addEventListener('click',function(e){if(e.target.id==='ov')closeOv();});

  // validate → enable CTA
  function validate(){
    var rrn1=document.getElementById('rrn1').value.length===6;
    var rrn2=document.getElementById('rrn2').value.length===7;
    var addr=!!document.getElementById('addr').value;
    var consents=[].slice.call(document.querySelectorAll('[data-consent]')).every(function(c){return ckbOf(c).classList.contains('on');});
    var vp=!!document.querySelector('#vpChips .vp-chip:not(.add)');
    document.getElementById('cta').disabled=!(rrn1&&rrn2&&addr&&consents&&vp);
  }

  // submit
  function submitBooking(){
    var b=document.getElementById('cta');
    b.textContent='요청 중';b.disabled=true;
    setTimeout(function(){
      b.textContent='요청 완료';
      setTimeout(function(){document.getElementById('done').classList.remove('hidden');},400);
    },1100);
  }

  // toast
  var tt;
  function toast(m){var t=document.getElementById('toast');t.textContent=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(function(){t.classList.remove('show');},1800);}`;

const IMAGES: Record<string, string> = {

};

function applyImages(text) { return text; }

export default function Page() {
  useEffect(() => {
    const el = document.createElement('script');
    el.textContent = applyImages(SCRIPT);
    document.body.appendChild(el);
    const c = document.getElementById('lottie');
    let anim;
    if (c) anim = lottie.loadAnimation({ container: c, renderer: 'svg', loop: true, autoplay: true, animationData: Loading });
    return () => { el.remove(); anim && anim.destroy(); };
  }, []);
  return <div dangerouslySetInnerHTML={{ __html: applyImages(BODY) }} />;
}
