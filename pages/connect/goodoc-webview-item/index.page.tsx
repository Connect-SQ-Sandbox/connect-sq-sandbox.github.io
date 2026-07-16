import React, { useEffect } from 'react';
import imgThumb from '@/assets/kakao-reference/ab-thumb-surgery.png';

/**
 * goodoc-webview-item — 굿닥 병원 진료 예약하기 (진료항목 타입)
 * 원본/참고: Figma 예약하기/Case2 (node 8327-17127)
 * 배포: https://connect-sq-sandbox.github.io/out/goodoc-webview-item.html
 * 표준 클론(goodoc-webview-item.html)의 body+script를 dangerouslySetInnerHTML+useEffect로 주입(self-contained).
 */

const BODY = `<div class="app">
  <header class="hd">
    <div class="logo">
      <svg viewBox="0 0 17 28" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8.4987 23.348C7.51374 23.3478 6.56135 23.001 5.81386 22.3702C5.06637 21.7395 4.57312 20.8665 4.42338 19.9092H0.180542C0.341099 21.974 1.28855 23.903 2.83335 25.3104C4.37814 26.7177 6.40633 27.4996 8.51219 27.4996C10.6181 27.4996 12.6463 26.7177 14.1911 25.3104C15.7359 23.903 16.6833 21.974 16.8439 19.9092H12.5848C12.4348 20.8683 11.94 21.7427 11.1902 22.3737C10.4405 23.0047 9.48552 23.3503 8.4987 23.348Z" fill="#0073FA"/><path d="M16.8441 0.5H12.5417V4.65629H16.8441V0.5Z" fill="#41D293"/><path d="M8.50004 3.62256C6.84738 3.62256 5.23184 4.1045 3.85771 5.00738C2.48358 5.91027 1.41255 7.19358 0.780107 8.69502C0.147663 10.1965 -0.0178125 11.8486 0.304605 13.4425C0.627022 15.0365 1.42286 16.5006 2.59146 17.6497C3.76007 18.7989 5.24896 19.5815 6.86986 19.8985C8.49076 20.2156 10.1709 20.0529 11.6977 19.4309C13.2246 18.809 14.5296 17.7558 15.4478 16.4046C16.3659 15.0533 16.856 13.4646 16.856 11.8395C16.8531 9.66108 15.9719 7.57272 14.4055 6.03235C12.839 4.49199 10.7153 3.62537 8.50004 3.62256ZM8.50004 15.8895C7.68547 15.8895 6.88919 15.652 6.2119 15.2069C5.53461 14.7619 5.00672 14.1294 4.695 13.3894C4.38328 12.6493 4.30173 11.835 4.46065 11.0494C4.61956 10.2638 5.01179 9.54212 5.58778 8.97572C6.16377 8.40932 6.89761 8.02359 7.69653 7.86732C8.49545 7.71105 9.32356 7.79123 10.0761 8.09777C10.8287 8.4043 11.4719 8.9234 11.9245 9.58942C12.377 10.2554 12.6186 11.0385 12.6186 11.8395C12.6171 12.9132 12.1828 13.9425 11.4107 14.7017C10.6386 15.4609 9.59191 15.8881 8.50004 15.8895Z" fill="#0073FA"/></svg>
      <b>굿닥 병원 진료 예약하기</b>
    </div>
  </header>

  <form onsubmit="return false">
    <!-- 확인 안내 + 진료 정보(일정·상품·금액 통합 카드) -->
    <div class="summary">
      <h2 class="h">아래 내용을 확인해 주세요.</h2>
      <div class="txcard">
        <div class="csched"><span id="schedTop">일정 · 2026.07.21(화) 오후 12:30</span></div>
        <div class="top">
          <div class="tinfo">
            <div class="tname">성형외과 신규예약</div>
            <div class="tdesc">ABsolute beauty, 자연스럽게 더 나답게. 눈·코·윤곽 등 맞춤 상담을 제공합니다.</div>
          </div>
          <div class="tthumb" style="background-image:url('__IMG_IMG_THUMB__')"></div>
        </div>
        <div class="prices">
          <div class="price">신규 상담 / 상담 후 결정</div>
          <div class="price">정밀 진단 상담 / 30,000원 ~</div>
        </div>
      </div>
      <div class="cardnote">방문 후 상담을 통해 금액이 변경될 수 있어요</div>
    </div>

    <div class="content">
      <div class="inner">
        <!-- 환자 정보 -->
        <div class="ctitle">환자 정보</div>
        <div class="pname">김세화</div>
        <div class="pphone">010-****-0289</div>

        <!-- 생년월일ㆍ성별 -->
        <div class="field-group">
          <div class="ftitle">생년월일ㆍ성별<span class="ess">필수</span></div>
          <div class="bd-row">
            <input class="inp bd-birth" id="bdBirth" inputmode="numeric" maxlength="6" placeholder="000000" oninput="onBd()">
            <span class="bd-dash">-</span>
            <div class="bd-gender-wrap">
              <input class="inp bd-gender" id="bdGender" inputmode="numeric" maxlength="1" placeholder="0" oninput="onBd()">
              <span class="bd-dots">●●●●●●</span>
            </div>
          </div>
          <div class="helper">입력하신 정보는 예약을 위해 병원에만 전달되며, 굿닥에서는 별도 수집 하지 않습니다.<br>또한 입력하신 정보와 환자 정보가 일치하지 않으면 진료 시 불이익이 발생할 수 있습니다.</div>
        </div>

        <!-- 병원 약관 동의 -->
        <div class="field-group">
          <div class="ftitle">병원 약관 동의<span class="ess">필수</span></div>
          <div class="consent-list">
            <div class="consent-row all" id="consentAll" onclick="toggleAllConsent()">
              <div class="cwrap"><span class="ckb"></span><span class="lab">전체 동의</span></div>
            </div>
            <div class="consent-row" data-consent data-req onclick="toggleConsent(this)">
              <div class="cwrap"><span class="ckb"></span><span class="lab">[필수] 병원 동의서</span></div>
              <button type="button" class="arrow" onclick="event.stopPropagation();openSheet('[필수] 병원 동의서','환자의 원활한 진료 접수를 위해 성명·연락처·생년월일 등 예약 정보를 해당 병원에 제공하는 것에 동의합니다. 제공된 정보는 진료 목적 외로 사용되지 않습니다.')">
                <svg viewBox="0 0 18 18" fill="none"><path fill-rule="evenodd" clip-rule="evenodd" d="M6.21967 3.96967C6.51256 3.67678 6.98744 3.67678 7.28033 3.96967L11.7803 8.46967C12.0732 8.76256 12.0732 9.23744 11.7803 9.53033L7.28033 14.0303C6.98744 14.3232 6.51256 14.3232 6.21967 14.0303C5.92678 13.7374 5.92678 13.2626 6.21967 12.9697L10.1893 9L6.21967 5.03033C5.92678 4.73744 5.92678 4.26256 6.21967 3.96967Z" fill="currentColor"/></svg>
              </button>
            </div>
            <div class="consent-row" data-consent onclick="toggleConsent(this)">
              <div class="cwrap"><span class="ckb"></span><span class="lab">[선택] 병원 동의서</span></div>
              <button type="button" class="arrow" onclick="event.stopPropagation();openSheet('[선택] 병원 동의서','마케팅·재방문 안내 등 부가 목적의 정보 활용에 동의합니다. 선택 항목으로 동의하지 않아도 예약 신청이 가능합니다.')">
                <svg viewBox="0 0 18 18" fill="none"><path fill-rule="evenodd" clip-rule="evenodd" d="M6.21967 3.96967C6.51256 3.67678 6.98744 3.67678 7.28033 3.96967L11.7803 8.46967C12.0732 8.76256 12.0732 9.23744 11.7803 9.53033L7.28033 14.0303C6.98744 14.3232 6.51256 14.3232 6.21967 14.0303C5.92678 13.7374 5.92678 13.2626 6.21967 12.9697L10.1893 9L6.21967 5.03033C5.92678 4.73744 5.92678 4.26256 6.21967 3.96967Z" fill="currentColor"/></svg>
              </button>
            </div>
          </div>
        </div>

        <!-- 법정대리인 정보 (만 14세 이하 토글 ON 시에만 노출) -->
        <div class="field-group rep hidden" id="repSection">
          <div class="ftitle">법정대리인 정보<span class="ess">필수</span></div>
          <div class="field">
            <label class="flabel">이름</label>
            <input class="inp" id="repName" placeholder="법정대리인의 이름을 입력해 주세요." oninput="validate()">
          </div>
          <div class="field">
            <label class="flabel">연락처</label>
            <input class="inp" id="repPhone" inputmode="numeric" placeholder="법정대리인의 연락처를 입력해 주세요." oninput="validate()">
          </div>
          <div class="helper">관련 법(개인정보 보호법)에 따라 만 14세 미만 환자의 경우 개인정보 처리 동의는 법정대리인을 지정하여 받습니다. 병원 약관 동의 시 법정대리인의 성명·연락처 정보를 수집해 보호자 동의를 확인하고 환자의 개인정보를 안전하게 처리할 수 있도록 합니다.</div>
        </div>
      </div>
    </div>

    <!-- 이용자 약관 동의 -->
    <div class="terms">
      <div class="inner">
        <div class="term-row"><span class="tt">이용약관 동의</span><span class="view" onclick="openTerm(0)">보기</span></div>
        <div class="term-row"><span class="tt">개인정보 수집 및 이용 동의</span><span class="view" onclick="openTerm(1)">보기</span></div>
        <div class="term-row"><span class="tt">고유식별정보 이용동의</span><span class="view" onclick="openTerm(2)">보기</span></div>
        <div class="term-notes">
          <div class="term-note">'요청' 버튼을 클릭하면 굿닥 서비스 이용약관과 개인정보 수집·이용 동의에 대한 동의를 받습니다.</div>
          <div class="term-note">(주)굿닥은 병원으로부터 진료 접수·예약 업무를 위탁받아 개인정보를 처리하는 업무만을 수행하며, 접수·예약은 병원 시스템 또는 네트워크 사정으로 실패할 수 있으며, 이 경우 (주)굿닥은 책임을 지지 않습니다.</div>
          <div class="term-note">병원의 설정에 따라 추가 정보(예: 주소, 내원 목적, 병원 약관 동의 등)가 요구될 수 있습니다.</div>
        </div>
        <div class="legal-block">
          <div class="lt">주민등록번호 수집 및 이용 근거 법률 안내</div>
          <div class="lb">본 병원은 아래 근거 법령에 따라 주민등록번호를 수집 및 이용하고 있습니다.</div>
          <div class="lb bullet">의료법 제17조, 제22조 등에서 정한 의무 이행을 위하여 동법 시행령 제42조의2에 의거하여 환자의 주민등록번호를 수집 및 이용하고 있습니다.</div>
        </div>
        <div class="legal-block">
          <div class="lt">개인정보 처리 위탁(재위탁) 사실 안내</div>
          <div class="lb">본 병원은 (주)굿닥(대표전화 1661-8173)에 환자의 진료 예약 및 접수에 요구되는 전송 및 보관 업무와 관련한 개인정보 처리를 위탁하고, "카카오톡 예약하기" 서비스를 통한 진료 예약 및 접수 시 필요한 범위 내에서 (주)카카오에 개인정보 처리를 재위탁합니다. (주)굿닥은 상호간 계약 만료일까지 환자의 개인정보에 접근할 수 있습니다.</div>
        </div>
      </div>
    </div>
  </form>

  <div class="cta"><button id="cta" onclick="submitApply()">예약 요청</button></div>
</div>

<!-- completion -->
<div class="done hidden" id="done">
  <div class="check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="m5 12 5 5 9-10"/></svg></div>
  <div class="dt">예약 요청이 완료되었어요</div>
  <div class="ds">병원 확인 후 예약이 최종 확정됩니다.<br>확정 결과는 카카오톡으로 안내드려요.</div>
  <div class="dbox">
    <div class="dr"><span class="dk">병원</span><span class="dv">에이비성형외과의원</span></div>
    <div class="dr"><span class="dk">진료항목</span><span class="dv">성형외과 신규예약</span></div>
    <div class="dr"><span class="dk">진료/시술</span><span class="dv" id="doneTreat">신규상담</span></div>
    <div class="dr"><span class="dk">일시</span><span class="dv" id="doneWhen">7월 21일 (화) 오후 12:30</span></div>
    <div class="dr"><span class="dk">예약자</span><span class="dv">김세화</span></div>
  </div>
  <div style="width:100%;margin-top:auto;padding:20px 0 24px;">
    <button style="width:100%;height:52px;border:0;border-radius:8px;background:#31353F;color:#fff;font-size:16px;font-weight:600;cursor:pointer;" onclick="toast('웹뷰를 닫습니다 (앱으로 복귀)')">확인</button>
  </div>
</div>

<div class="ov hidden" id="ov"><div class="sheet" id="sheet"></div></div>
<div class="toast" id="toast"></div>`;

const SCRIPT = `var TERMS=[
    {title:'이용약관 동의',body:'• 본 서비스는 병원으로부터 위탁받아 ㈜굿닥에서 제공하는 병원 접수/예약 서비스와 연계되어 사용자가 진료 접수/예약을 할 수 있도록 합니다.\\n\\n• 병원 사정, 네트워크/시스템 장애 등으로 접수·예약이 실패할 수 있습니다.\\n\\n• 이용자는 정확한 정보를 제공해야 하며, 타인의 정보 사용 등 부정 이용을 금지합니다.'},
    {title:'개인정보 수집 및 이용 동의',body:'수집목적 : 병원 예약 접수 및 확인·변경·취소 처리\\n수집항목 : (필수)이름, 연락처, 생년월일·성별\\n보유 및 이용 기간 : 5년\\n\\n의료법 시행규칙 제15조에 따라 병원 진료 완료 후 해당 기간 보관하며 파기합니다.'},
    {title:'고유식별정보 이용동의',body:'이용목적 : 병원 예약 접수 및 확인·변경·취소 처리\\n이용항목 : (필수)주민등록번호\\n보유 및 이용 기간 : 5년\\n\\n개인정보보호법 제24조의2에 따라 고유식별정보는 수집하지 않지만, 병원으로 해당 주민등록번호는 제공하고 있습니다.'}
  ];

  var A={d:21,wd:'화',period:'오후',t:'12:30',treat:'신규상담'};
  try{var s=JSON.parse(sessionStorage.getItem('gd_appt'));if(s&&s.d)A=Object.assign(A,s);}catch(e){}
  (function(){
    var pad=function(n){return String(n).padStart(2,'0');};
    var whenFull='7월 '+A.d+'일 ('+A.wd+') '+A.period+' '+A.t;
    document.getElementById('schedTop').textContent='일정 · 2026.07.'+pad(A.d)+'('+A.wd+') '+A.period+' '+A.t;
    document.getElementById('doneWhen').textContent=whenFull;
    document.getElementById('doneTreat').textContent=A.treat||'신규상담';
  })();

  function onBd(){
    ['bdBirth','bdGender'].forEach(function(id){var e=document.getElementById(id);e.value=e.value.replace(/[^0-9]/g,'');});
    var birth=document.getElementById('bdBirth');
    if(birth.value.length===6 && document.activeElement===birth){ document.getElementById('bdGender').focus(); }
    refreshMinor();
  }

  function ckbOf(row){return row.querySelector('.ckb');}
  function toggleConsent(el){ckbOf(el).classList.toggle('on');syncAll();}
  function toggleAllConsent(){
    var all=document.getElementById('consentAll');
    var on=!ckbOf(all).classList.contains('on');
    ckbOf(all).classList.toggle('on',on);
    document.querySelectorAll('[data-consent]').forEach(function(c){ckbOf(c).classList.toggle('on',on);});
  }
  function syncAll(){
    var items=[].slice.call(document.querySelectorAll('[data-consent]'));
    var allOn=items.length>0&&items.every(function(c){return ckbOf(c).classList.contains('on');});
    ckbOf(document.getElementById('consentAll')).classList.toggle('on',allOn);
  }

  function openTerm(i){openSheet(TERMS[i].title,TERMS[i].body);}
  function openSheet(title,body){
    document.getElementById('sheet').innerHTML='<h4>'+title+'</h4><div class="body">'+body+'</div><button class="close" onclick="closeOv()">확인</button>';
    document.getElementById('ov').classList.remove('hidden');
  }
  function closeOv(){document.getElementById('ov').classList.add('hidden');}
  document.getElementById('ov').addEventListener('click',function(e){if(e.target.id==='ov')closeOv();});

  function validate(){}

  // 생년월일(YYMMDD)+성별자리로 만 나이 계산 → 만 14세 미만이면 법정대리인 정보 노출
  function ageFromBirth(yymmdd,code){
    if(yymmdd.length!==6||!/^[0-9]$/.test(code))return null;
    var yy=+yymmdd.slice(0,2),mm=+yymmdd.slice(2,4),dd=+yymmdd.slice(4,6);
    if(mm<1||mm>12||dd<1||dd>31)return null;
    var c=+code,year;
    if(c===1||c===2||c===5||c===6)year=1900+yy;
    else if(c===3||c===4||c===7||c===8)year=2000+yy;
    else if(c===9||c===0)year=1800+yy;
    else return null;
    var t=new Date(),age=t.getFullYear()-year,md=(t.getMonth()+1)-mm;
    if(md<0||(md===0&&t.getDate()<dd))age--;
    return age;
  }
  function isMinor(){
    var age=ageFromBirth(document.getElementById('bdBirth').value,document.getElementById('bdGender').value);
    return age!==null&&age<14;
  }
  function refreshMinor(){
    document.getElementById('repSection').classList.toggle('hidden',!isMinor());
  }

  function submitApply(){
    if(document.getElementById('bdBirth').value.length!==6){ toast('생년월일 6자리를 입력해 주세요.'); return; }
    if(!/^[1-4]$/.test(document.getElementById('bdGender').value)){ toast('성별 자리를 입력해 주세요.'); return; }
    var reqOk=[].slice.call(document.querySelectorAll('[data-consent][data-req]')).every(function(c){return ckbOf(c).classList.contains('on');});
    if(!reqOk){ toast('필수 병원 약관에 동의해 주세요.'); return; }
    if(isMinor()){
      if(!document.getElementById('repName').value.trim()){ toast('법정대리인 이름을 입력해 주세요.'); return; }
      if(!document.getElementById('repPhone').value.trim()){ toast('법정대리인 연락처를 입력해 주세요.'); return; }
    }
    var b=document.getElementById('cta'); b.textContent='요청 중'; b.disabled=true;
    setTimeout(function(){ document.getElementById('done').classList.remove('hidden'); },900);
  }

  var tt;
  function toast(m){var t=document.getElementById('toast');t.textContent=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(function(){t.classList.remove('show');},1800);}`;

const IMAGES: Record<string, string> = {
  '__IMG_IMG_THUMB__': imgThumb
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
