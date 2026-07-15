import React, { useEffect } from 'react';


/**
 * goodoc-webview-item — 굿닥 병원 예약 신청 (진료항목 타입)
 * 원본/참고: PO 와이어프레임 — 진료항목 타입 신청 웹
 * 배포: https://connect-sq-sandbox.github.io/out/goodoc-webview-item.html
 * 표준 클론(goodoc-webview-item.html)의 body+script를 dangerouslySetInnerHTML+useEffect로 주입(self-contained).
 */

const BODY = `<div class="app">
  <header class="hd">
    <div class="logo">
      <svg viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="7" fill="#0073FA"/><circle cx="10.2" cy="3.8" r="2.4" fill="#41D293"/></svg>
      <b>굿닥 병원 (카카오톡 예약하기)</b>
    </div>
  </header>

  <form onsubmit="return false">
    <!-- 확인 안내 + 진료항목 정보 -->
    <div class="summary">
      <h2 class="h">아래 내용을 확인해 주세요.</h2>
      <div class="infobox">
        <div class="it">성형외과 신규예약</div>
        <div class="id">진료항목 타입 상품입니다.<br>V1에서는 EMR 조회 없이 예약 신청을 생성합니다.</div>
      </div>
    </div>

    <div class="content">
      <div class="inner">
        <!-- 카카오톡 예약하기 상품 정보 -->
        <div class="section">
          <div class="stitle"><span class="t">카카오톡 예약하기 상품 정보</span></div>
          <div class="kv"><span class="k">병원</span><span class="v">에이비성형외과의원</span></div>
          <div class="kv"><span class="k">상품</span><span class="v">성형외과 신규예약</span></div>
          <div class="kv"><span class="k">진료/시술</span><span class="v" id="treatVal">신규상담</span></div>
          <div class="kv"><span class="k">예약 일시</span><span class="v" id="whenVal">7월 21일 (화) 오후 12:30</span></div>
        </div>

        <!-- 가격 옵션 -->
        <div class="section">
          <div class="stitle"><span class="t">가격 옵션</span></div>
          <div class="opt-row price-row on" data-price onclick="toggleBox(this)">
            <div class="cwrap"><span class="ckb on"></span><span class="lab"><span class="pn">신규 상담 (기본)</span><span class="pp">무료</span></span></div>
          </div>
          <div class="opt-row price-row on" data-price onclick="toggleBox(this)">
            <div class="cwrap"><span class="ckb on"></span><span class="lab"><span class="pn">정밀 진단 상담 (3D 분석)</span><span class="pp">30,000원</span></span></div>
          </div>
          <div class="note">카카오 API의 bookingItemPrices 배열을 고려해 복수 가격 옵션 가능성은 표현하되, 실제 복수 선택 정책은 개발 싱크에서 확정합니다.</div>
        </div>

        <!-- 예약자 정보 -->
        <div class="section">
          <div class="stitle"><span class="t">예약자 정보</span></div>
          <div class="field">
            <label class="flabel">이름</label>
            <input class="inp" value="김세화" readonly>
          </div>
          <div class="field">
            <label class="flabel">전화번호</label>
            <input class="inp" value="010-9924-0289" readonly>
          </div>
          <div class="note">카카오톡 예약하기 앞단에서 받은 정보로 고정 표시합니다. 수정 가능 여부는 정책 검토 대상입니다.</div>
        </div>

        <!-- 추가 입력 -->
        <div class="section">
          <div class="stitle"><span class="t">추가 입력</span></div>
          <div class="field">
            <label class="flabel">생년월일</label>
            <input class="inp" id="birth" inputmode="numeric" placeholder="YYYY-MM-DD" oninput="validate()">
          </div>
          <div class="field">
            <label class="flabel">성별</label>
            <div class="genders">
              <div class="gender" data-gender="남자" onclick="pickGender(this)"><span class="rd"></span>남자</div>
              <div class="gender" data-gender="여자" onclick="pickGender(this)"><span class="rd"></span>여자</div>
            </div>
          </div>
          <div class="field">
            <label class="flabel">추가 요청사항</label>
            <textarea class="inp" id="memo" maxlength="200" placeholder="병원에 전달할 사항이 있다면 입력해 주세요."></textarea>
          </div>
        </div>

        <!-- 법적 안내 및 동의 -->
        <div class="section">
          <div class="stitle"><span class="t">법적 안내 및 동의</span><span class="ess">필수</span></div>
          <div class="opt-row legal-row" data-legal onclick="toggleBox(this)">
            <div class="cwrap"><span class="ckb"></span><span class="lab">개인정보 수집 및 이용 동의</span></div>
          </div>
          <div class="opt-row legal-row" data-legal onclick="toggleBox(this)">
            <div class="cwrap"><span class="ckb"></span><span class="lab">예약 신청 관련 안내 확인</span></div>
          </div>
          <div class="opt-row legal-row" data-legal onclick="toggleBox(this)">
            <div class="cwrap"><span class="ckb"></span><span class="lab">진료 여부는 병원 판단에 따라 달라질 수 있음</span></div>
          </div>
          <div class="opt-row legal-row" data-legal onclick="toggleBox(this)">
            <div class="cwrap"><span class="ckb"></span><span class="lab">굿닥은 예약 중개 역할을 수행함</span></div>
          </div>
          <div class="note">주민등록번호 수집은 V1 진료항목 타입 신청 웹에서 제외합니다.</div>
        </div>
      </div>
    </div>
  </form>

  <div class="cta"><button id="cta" onclick="submitApply()">예약 신청하기</button></div>
</div>

<!-- completion -->
<div class="done hidden" id="done">
  <div class="check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="m5 12 5 5 9-10"/></svg></div>
  <div class="dt">예약 신청이 완료되었어요</div>
  <div class="ds">병원 확인 후 예약이 최종 확정됩니다.<br>확정 결과는 카카오톡으로 안내드려요.</div>
  <div class="dbox">
    <div class="dr"><span class="dk">병원</span><span class="dv">에이비성형외과의원</span></div>
    <div class="dr"><span class="dk">진료항목</span><span class="dv">성형외과 신규예약</span></div>
    <div class="dr"><span class="dk">진료/시술</span><span class="dv" id="doneTreat">신규상담</span></div>
    <div class="dr"><span class="dk">일시</span><span class="dv" id="doneWhen">7월 21일 (화) 오후 12:30</span></div>
    <div class="dr"><span class="dk">예약자</span><span class="dv">김세화</span></div>
  </div>
  <div style="width:100%;margin-top:auto;padding:20px 0 24px;">
    <button style="width:100%;height:52px;border:0;border-radius:6px;background:#31353F;color:#fff;font-size:16px;font-weight:600;cursor:pointer;" onclick="toast('웹뷰를 닫습니다 (앱으로 복귀)')">확인</button>
  </div>
</div>

<div class="toast" id="toast"></div>`;

const SCRIPT = `// 일시·진료/시술 이어받기 (진료항목 티켓 → 신청폼)
  (function(){
    var A={d:21,wd:'화',period:'오후',t:'12:30',treat:'신규상담'};
    try{var s=JSON.parse(sessionStorage.getItem('gd_appt'));if(s&&s.d)A=Object.assign(A,s);}catch(e){}
    var when=A.period+' '+A.t, whenFull='7월 '+A.d+'일 ('+A.wd+') '+when;
    var t=A.treat||'신규상담';
    document.getElementById('whenVal').textContent=whenFull;
    document.getElementById('treatVal').textContent=t;
    document.getElementById('doneWhen').textContent=whenFull;
    document.getElementById('doneTreat').textContent=t;
  })();

  function toggleBox(el){el.querySelector('.ckb').classList.toggle('on');el.classList.toggle('on');}
  function pickGender(el){
    document.querySelectorAll('.gender').forEach(function(g){g.classList.remove('on');});
    el.classList.add('on');
  }
  function checkedCount(sel){return [].slice.call(document.querySelectorAll(sel)).filter(function(r){return r.querySelector('.ckb').classList.contains('on');}).length;}

  function submitApply(){
    // 가격 옵션 1개 이상
    if(checkedCount('[data-price]')<1){ toast('가격 옵션을 선택해 주세요.'); return; }
    // 생년월일
    if(!/^\\d{4}-?\\d{2}-?\\d{2}$/.test(document.getElementById('birth').value.trim())){ toast('생년월일을 입력해 주세요.'); return; }
    // 성별
    if(!document.querySelector('.gender.on')){ toast('성별을 선택해 주세요.'); return; }
    // 법적 동의 4개 전부
    var legals=document.querySelectorAll('[data-legal]');
    if(checkedCount('[data-legal]')<legals.length){ toast('필수 동의 항목을 모두 확인해 주세요.'); return; }
    var b=document.getElementById('cta'); b.textContent='신청 중'; b.disabled=true;
    setTimeout(function(){ document.getElementById('done').classList.remove('hidden'); },900);
  }
  function validate(){/* placeholder — 실시간 검증 자리 */}

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
    return () => { el.remove(); };
  }, []);
  return <div dangerouslySetInnerHTML={{ __html: applyImages(BODY) }} />;
}
