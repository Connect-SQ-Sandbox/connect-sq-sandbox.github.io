/**
 * ┌─ 프로토타입 컨텍스트 ───────────────────────────────────
 * 이름     : desk-web — 굿닥 데스크(Windows 프로그램) 기능을 커넥트 웹뷰 UI로 옮긴 웹 이관 시안
 * 상태     : 현행(active) · 검토용 시안(미승인)   버전: v0.3   최종수정: 2026-10-06
 * PRD      : 내부 기획 문서(공개 저장소라 티켓 번호·링크·원문 미기재)
 * 배포URL  : 미배포 (로컬 빌드 out/desk-web.html 만 존재)
 * 피그마   : 없음
 * 관련 CSS : styles/connectUnified.css(재사용, cu-*) + styles/deskWeb.css(이 화면 전용, dw-*)
 * 기술제약 : react 훅만 · plain CSS · react-icons(vsc) · 가상 데이터 · 브라우저 메모리 상태 · 네트워크 0
 *
 * 화면구성 :
 *   ① 상단 프로토 바(메타) + 미승인 안내 띠
 *   ② 커넥트 창(타이틀바 톱니·종 배지·창 버튼) — 좌측 메뉴 + 웹뷰 본문 + 상태바
 *   ③ 하단 슬림 작업표시줄의 커넥트 트레이 아이콘(클릭·우클릭 → 커넥트 열기/알림 메시지함/환경설정/창 닫기)
 *   ④ 웹 메뉴: 대시보드 / 진료 현황 / 진료내역[보류] / 진료실 / 진료항목 / 진료실 운영 설정 / 알림 메시지함
 *   ⑤ 모달: 예약 상세(진료정보 수정 포함) · 상태 변경 확인 · 예약 취소 사유 · 예약 등록[보류] ·
 *           진료실 상세/생성·수정/삭제 · 프로그램 환경설정(별도 창 모사) · 제품키 해제 확인 · 공지
 *   ⑥ 우측 하단 '체험 설정' 패널(프로토 메타 UI): 연동/비연동, 진료실 0개, 저장 실패, 서버 오류, 알림 99+, 초기화
 *
 * 핵심 결정 (why):
 *   [확정·PO] 웹은 굿닥 서버 데이터를 바라보고, 데스크와 동일하게 진료 건 상태를 바꾼다(내원확정·예약취소·진료완료).
 *   [확정·PO] 하반기 범위는 차트가 '데스크'인 병원만. 기본 체험값도 '데스크(굿닥) 차트 · 비연동'.
 *   [제외·PO] 환자 메뉴는 웹에 노출하지 않는다(법률 검토). 예약 등록도 환자 DB 검색 없이 이름·연락처 입력만.
 *   [확정·PO] 서버 기준 알림 메시지함 추가(새 예약·환자 도착·진료항목 예약). 좌측 메뉴·타이틀바 종에 미읽음 배지, 99 초과는 '99+'.
 *   [확정·PO] 비연동 차트 병원은 진료실 생성·수정·삭제 가능. 진료실 수정 정책은 데스크와 동일. 연동 차트 병원은 '차트에서 관리' 안내 + 생성 버튼 숨김.
 *   [확정·PO] 진료실 폼의 진료과·담당 의사는 텍스트 입력(의사 복수), 데스크와 같은 규격.
 *   [확정·PO] 접속은 트레이 웹뷰 = 제품키 인증. 프로토에선 인증 화면 생략, 환경설정에 제품키 해제만 둔다.
 *   [유지·자체] 내원 체크: 데스크는 체크박스 즉시 처리 → 웹은 확인 모달을 한 번 거친다(오탭 방지). 체크된 건은 웹에서 해제 불가.
 *   [유지·자체] 예약 취소: 데스크는 사유 없이 '병원취소' 고정 → 웹은 사유 5종 라디오 선택(기존 웹 취소 모달과 동일).
 *   [유지·자체] 모든 처리는 확인 → '처리 중…' → 결과. 실패를 성공으로 표시하지 않는다(데스크 목록의 무조건 성공 토스트 버그를 고친 동작).
 *               실패 시 상태는 그대로, 모달 안에 오류 문구 + 다시 시도.
 *   [유지·자체] 진료 현황은 '진행 중'(예약확정·내원확정) 기본 + '지난 내역' 탭으로 통합. 예약일시 변경은 데스크도 미사용이라 제외.
 *   [유지·자체] 자동 종료 건은 처리 버튼 없이 '실제 완료·취소가 아님' 안내.
 *   [유지·자체] 환자 기본정보는 이름·연락처·생년월일 마스킹만 표시.
 *   [유지·자체] 앱 예약은 수신 즉시 '예약확정'으로 들어온다(데스크 현행 그대로).
 *
 * 보류 · TODO (PO 확인 대기):
 *   [보류] 병원 확정 단계 유무(현재는 앱 예약 수신 = 즉시 확정).
 *   [보류] 예약 등록(웹에서 병원이 직접 등록) 제공 여부·필수 항목.
 *   [보류] 진료내역(종료 건 조회) 메뉴 제공 여부.
 *   [보류] 환자 정보 표시 범위(주민번호·주소). 환경설정의 '주민번호 7자리 표시' 웹 반영 여부.
 *   [보류] 자동 종료 안내를 접수·진료실 예약에도 표시할지(내부 정책: 자동 종료) 범위 확인 중.
 *   [보류] 알림 메시지함 규격: 읽음 단위(병원/PC), 보관 기간(시안 30일), 알림 종류.
 *   TODO  진료완료 건의 차트 반영 규격, 진료실 삭제 시 연동 해지 대상 목록 확정 후 문구 갱신.
 *
 * 변경 이력:
 *   v0.1  2026-10-06 — 최초 작성. connect-unified 셸·테이블·모달 패턴 재사용, 데스크 기능 9종 웹 이관 시안.
 *   v0.3  2026-10-06 — 2차 QA 반영: 모달 스택(document 키 처리·최상단만 반응·닫힘 시 직전 요소/남은 모달/화면 주요 요소로 포커스 복귀), 모달 중 체험 띠 비활성, 0개 체험 중 알림·배지에서 숨긴 건 제외, 0개 체험 종료 안내, 예약 등록 과거 일시 차단·해요체, ⋮ 메뉴 본문 하단·실측 높이 기준, ⋮ 열 sticky.
 *   v0.2  2026-10-06 — QA 반영: 토스트 성공/실패 톤 분리·모든 즉시 저장 실패 처리, ⋮ 메뉴 fixed 배치, 진료실 0개 일관화·복원, 알림 99+ 실제 데이터화, 체험 설정을 상단 바 버튼 + 띠로 이동, 환경설정 draft/적용, 모달 포커스 복귀, 처리 모달 진입 위치로 복귀, 내원목적 필수, 초기화 범위 확대, 공개 문구 정리.
 * └──────────────────────────────────────────────────────
 */
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  VscAdd, VscArrowRight, VscBell, VscCalendar, VscCheck, VscCheckAll, VscChevronRight, VscChromeClose, VscChromeMaximize,
  VscChromeMinimize, VscChromeRestore, VscDashboard, VscEdit, VscError, VscHistory, VscInbox, VscInfo, VscKebabVertical,
  VscListFlat, VscOrganization, VscRefresh, VscSearch, VscSettingsGear, VscTrash, VscWarning, VscBeaker, VscKey
} from 'react-icons/vsc';

const LOGO = require('../../../assets/curation-price/goodoc-logo.svg');

/* ───────── 타입 · 상수 ───────── */
type Kind = '진료실 예약' | '진료항목 예약';
type State = '예약확정' | '내원확정' | '진료완료' | '병원취소' | '환자취소' | '자동 종료';
type Rec = {
  id: string; kind: Kind; name: string; phone: string; birth: string; date: string; time: string; created: string;
  room: string; item: string; purpose: string; etc: string; memo: string; state: State; reason?: string; closed?: string; channel: string;
};
type Room = { id: string; name: string; alias: string; dept: string; doctors: string[]; svc: { onsite: boolean; remote: boolean; appt: boolean } };
type Noti = { id: string; type: '새 예약' | '환자 도착' | '진료항목 예약'; text: string; at: string; read: boolean; rec: string };
type Act = 'visit' | 'complete';
type Dialog =
  | { type: 'detail'; id: string; edit?: boolean }
  | { type: 'action'; id: string; act: Act; from: 'list' | 'detail' }
  | { type: 'cancel'; id: string; from: 'list' | 'detail' }
  | { type: 'register' }
  | { type: 'roomDetail'; id: string }
  | { type: 'roomForm'; id?: string }
  | { type: 'roomDelete'; id: string }
  | { type: 'settings' }
  | { type: 'notice'; title: string };

const TODAY = '2026-10-06';
const ACTIVE: State[] = ['예약확정', '내원확정'];
const CLOSED: State[] = ['진료완료', '병원취소', '환자취소', '자동 종료'];
const REASONS = ['일정 불가', '담당 의료진 부재', '진료항목 확인 필요', '환자 정보 확인 필요', '기타 병원 사정'];
const TAG: Record<State, string> = { '예약확정': 'blue', '내원확정': 'teal', '진료완료': 'green', '병원취소': 'red', '환자취소': 'red', '자동 종료': 'gray' };
const PAGE_SIZE = 8;
const TIMES = Array.from({ length: 18 }, (_, i) => `${String(9 + Math.floor(i / 2)).padStart(2, '0')}:${i % 2 ? '30' : '00'}`);

const r = (o: Partial<Rec> & Pick<Rec, 'id' | 'name' | 'phone' | 'date' | 'time' | 'state'>): Rec => ({
  kind: '진료실 예약', birth: '19**.**.**', created: o.date, room: '1진료실', item: '—', purpose: '재진', etc: '', memo: '', channel: '굿닥 앱', ...o
});
const BASE: Rec[] = [
  r({ id: 'D001', name: '김○○', phone: '010-****-2101', birth: '1979.**.**', date: TODAY, time: '09:30', created: '2026-10-03', purpose: '초진 · 감기 증상', state: '내원확정' }),
  r({ id: 'D002', name: '박○○', phone: '010-****-2102', birth: '1956.**.**', date: TODAY, time: '10:00', created: TODAY, purpose: '재진 · 고혈압 약 처방', memo: '지난 처방 동일 요청', state: '예약확정' }),
  r({ id: 'D003', kind: '진료항목 예약', name: '이○○', phone: '010-****-2103', birth: '1991.**.**', date: TODAY, time: '10:30', created: '2026-10-04', room: '—', item: '독감 백신 · 1회', purpose: '예방접종', channel: '카카오톡', state: '예약확정' }),
  r({ id: 'D004', name: '최○○', phone: '010-****-2104', birth: '1984.**.**', date: TODAY, time: '11:00', created: TODAY, room: '2진료실', purpose: '건강검진 상담', state: '예약확정' }),
  r({ id: 'D005', name: '정○○', phone: '010-****-2105', birth: '1948.**.**', date: TODAY, time: '11:30', created: '2026-10-05', room: '2진료실', etc: '보호자 동반 예정', state: '예약확정' }),
  r({ id: 'D006', kind: '진료항목 예약', name: '한○○', phone: '010-****-2106', birth: '2001.**.**', date: TODAY, time: '13:30', created: TODAY, room: '—', item: '가다실 9가 · 2차', purpose: '예방접종', state: '예약확정' }),
  r({ id: 'D007', name: '조○○', phone: '010-****-2107', birth: '1993.**.**', date: TODAY, time: '14:00', created: '2026-10-02', purpose: '초진 · 복통', state: '예약확정' }),
  r({ id: 'D008', name: '윤○○', phone: '010-****-2108', birth: '1970.**.**', date: TODAY, time: '14:30', created: TODAY, room: '예방접종실', purpose: '예방접종 상담', state: '예약확정' }),
  r({ id: 'D009', name: '장○○', phone: '010-****-2109', birth: '1988.**.**', date: TODAY, time: '15:00', created: '2026-10-05', room: '2진료실', state: '예약확정' }),
  r({ id: 'D010', name: '임○○', phone: '010-****-2110', birth: '1995.**.**', date: '2026-10-07', time: '09:30', created: TODAY, purpose: '초진', state: '예약확정' }),
  r({ id: 'D011', kind: '진료항목 예약', name: '오○○', phone: '010-****-2111', birth: '1962.**.**', date: '2026-10-07', time: '10:00', created: TODAY, room: '—', item: '싱그릭스 · 1차', purpose: '예방접종', state: '예약확정' }),
  r({ id: 'D012', name: '송○○', phone: '010-****-2112', birth: '1977.**.**', date: '2026-10-08', time: '16:00', created: '2026-10-04', room: '2진료실', state: '예약확정' }),
  r({ id: 'D013', name: '김○○', phone: '010-****-2101', birth: '1979.**.**', date: '2026-09-15', time: '10:30', purpose: '재진 · 비염', state: '진료완료', closed: '2026-09-15' }),
  r({ id: 'D014', name: '신○○', phone: '010-****-2113', birth: '1983.**.**', date: TODAY, time: '08:30', created: '2026-10-01', state: '진료완료', closed: TODAY }),
  r({ id: 'D015', kind: '진료항목 예약', name: '유○○', phone: '010-****-2114', birth: '1999.**.**', date: TODAY, time: '09:00', created: '2026-10-02', room: '—', item: '독감 백신 · 1회', purpose: '예방접종', state: '진료완료', closed: TODAY }),
  r({ id: 'D016', name: '권○○', phone: '010-****-2115', birth: '1966.**.**', date: TODAY, time: '09:00', created: '2026-10-03', room: '2진료실', state: '병원취소', reason: '담당 의료진 부재', closed: TODAY }),
  r({ id: 'D017', name: '안○○', phone: '010-****-2116', birth: '1990.**.**', date: TODAY, time: '12:00', created: '2026-10-04', state: '환자취소', reason: '환자가 앱에서 취소', closed: TODAY }),
  r({ id: 'D018', kind: '진료항목 예약', name: '서○○', phone: '010-****-2117', birth: '2003.**.**', date: '2026-10-02', time: '15:00', created: '2026-09-28', room: '—', item: '가다실 9가 · 1차', purpose: '예방접종', state: '자동 종료', reason: '방문 예정일이 지나 자동 종료됐어요. 실제 결과는 확인되지 않았어요.', closed: '2026-10-03' }),
  r({ id: 'D019', name: '황○○', phone: '010-****-2118', birth: '1959.**.**', date: '2026-10-05', time: '10:00', created: '2026-10-01', room: '2진료실', state: '자동 종료', reason: '방문 예정일이 지나 자동 종료됐어요. 실제 결과는 확인되지 않았어요.', closed: TODAY }),
  r({ id: 'D020', name: '박○○', phone: '010-****-2102', birth: '1956.**.**', date: '2026-09-20', time: '09:30', purpose: '재진 · 고혈압 약 처방', state: '진료완료', closed: '2026-09-20' }),
  r({ id: 'D021', name: '문○○', phone: '010-****-2119', birth: '1986.**.**', date: '2026-10-05', time: '11:00', state: '진료완료', closed: '2026-10-05' }),
  r({ id: 'D022', kind: '진료항목 예약', name: '배○○', phone: '010-****-2120', birth: '1997.**.**', date: '2026-10-04', time: '14:00', room: '—', item: '독감 백신 · 1회', purpose: '예방접종', state: '병원취소', reason: '일정 불가', closed: '2026-10-03' }),
  r({ id: 'D023', name: '박○○', phone: '010-****-2102', birth: '1956.**.**', date: '2026-08-28', time: '10:00', purpose: '재진', state: '진료완료', closed: '2026-08-28' })
];
const BASE_ROOMS: Room[] = [
  { id: 'R1', name: '1진료실', alias: '내과 진료실', dept: '내과', doctors: ['김○○'], svc: { onsite: true, remote: true, appt: true } },
  { id: 'R2', name: '2진료실', alias: '', dept: '가정의학과', doctors: ['박○○', '이○○'], svc: { onsite: true, remote: false, appt: true } },
  { id: 'R3', name: '예방접종실', alias: '', dept: '내과', doctors: ['최○○'], svc: { onsite: false, remote: false, appt: true } }
];
const BASE_NOTI: Noti[] = [
  { id: 'N1', type: '환자 도착', text: '김○○님이 도착했어요 · 1진료실 09:30 예약', at: `${TODAY} 09:24`, read: false, rec: 'D001' },
  { id: 'N2', type: '새 예약', text: '박○○님 진료실 예약 · 10.06(화) 10:00 · 1진료실', at: `${TODAY} 09:12`, read: false, rec: 'D002' },
  { id: 'N3', type: '진료항목 예약', text: '한○○님 진료항목 예약 · 가다실 9가 2차 · 10.06(화) 13:30', at: `${TODAY} 08:55`, read: false, rec: 'D006' },
  { id: 'N4', type: '새 예약', text: '임○○님 진료실 예약 · 10.07(수) 09:30 · 1진료실', at: `${TODAY} 08:40`, read: true, rec: 'D010' },
  { id: 'N5', type: '진료항목 예약', text: '오○○님 진료항목 예약 · 싱그릭스 1차 · 10.07(수) 10:00', at: `${TODAY} 08:31`, read: false, rec: 'D011' },
  { id: 'N6', type: '환자 도착', text: '신○○님이 도착했어요 · 1진료실 08:30 예약', at: `${TODAY} 08:25`, read: true, rec: 'D014' },
  { id: 'N7', type: '새 예약', text: '최○○님 진료실 예약 · 10.06(화) 11:00 · 2진료실', at: `${TODAY} 07:58`, read: true, rec: 'D004' },
  { id: 'N8', type: '새 예약', text: '정○○님 진료실 예약 · 10.06(화) 11:30 · 2진료실', at: '2026-10-05 18:20', read: true, rec: 'D005' }
];
const NOTICES = [
  ['안내', '웹에서 진료 현황을 처리하는 방법', '2026.10.06'],
  ['안내', '알림 메시지함이 새로 생겼어요', '2026.10.05'],
  ['점검', '10월 정기 점검 안내 (가상)', '2026.10.02'],
  ['안내', '진료실 담당 의사 입력 방법', '2026.09.30'],
  ['안내', '추석 연휴 진료 일정 설정 안내', '2026.09.24'],
  ['업데이트', '진료항목 예약 화면 개선', '2026.09.18'],
  ['안내', '제품키 재발급 절차', '2026.09.10']
];
const NAV: { key: string; icon: React.ReactNode; hold?: boolean }[] = [
  { key: '대시보드', icon: <VscDashboard /> },
  { key: '진료 현황', icon: <VscListFlat /> },
  { key: '진료내역', icon: <VscHistory />, hold: true },
  { key: '진료실', icon: <VscOrganization /> },
  { key: '진료항목', icon: <VscCalendar /> },
  { key: '진료실 운영 설정', icon: <VscSettingsGear /> },
  { key: '알림 메시지함', icon: <VscInbox /> }
];
const DESC: Record<string, string> = {
  '대시보드': '오늘 우리 병원의 예약·진료 현황과 공지사항을 확인할 수 있어요.',
  '진료 현황': '굿닥 서버에 저장된 예약을 확인하고 데스크와 같이 내원확정·예약취소·진료완료를 처리할 수 있어요.',
  '진료내역': '진료가 끝나거나 취소·자동 종료된 건을 조회할 수 있어요. 상태는 바꿀 수 없어요.',
  '진료실': '진료실과 진료과·담당 의사, 서비스 운영 여부를 관리할 수 있어요.',
  '진료항목': '굿닥에 노출되는 우리 병원 진료항목과 가격 정보를 관리할 수 있어요.',
  '진료실 운영 설정': '우리 병원의 진료 예약 운영 방식을 설정할 수 있어요.',
  '알림 메시지함': '새 예약·환자 도착·진료항목 예약 알림을 서버 기준으로 모아 볼 수 있어요.'
};

/* ───────── 유틸 ───────── */
const wait = (ms: number) => new Promise(res => setTimeout(res, ms));
const DOW = ['일', '월', '화', '수', '목', '금', '토'];
const fmt = (d: string) => { const t = new Date(`${d}T00:00:00`); return `${d.slice(5).replace('-', '.')}(${DOW[t.getDay()]})`; };
const fmtFull = (d: string) => `${d.replaceAll('-', '.')} (${DOW[new Date(`${d}T00:00:00`).getDay()]})`;
const badge = (n: number) => (n > 99 ? '99+' : String(n));
const daysBetween = (a: string, b: string) => Math.round((new Date(`${a}T00:00:00`).getTime() - new Date(`${b}T00:00:00`).getTime()) / 86400000);
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
/** 받침 여부로 을/를 선택 */
const eul = (w: string) => { const c = w.charCodeAt(w.length - 1); if (c >= 0xac00 && c <= 0xd7a3) return (c - 0xac00) % 28 ? '을' : '를'; return /[013678]$/.test(w) ? '을' : '를'; };
/** 목록(⋮·행)에서 모달을 열었을 때 닫은 뒤 포커스를 돌려줄 요소 */
let focusReturn: HTMLElement | null = null;
/** 열린 모달 스택(최상단만 키 입력에 반응) */
const modalStack: HTMLDivElement[] = [];
const NOW = '09:41';
const DUP_MSG = '이미 같은 환자의 예약이 있어요.';
/** 모달이 모두 닫혔을 때 대체 포커스: 목록 트리거 → 현재 화면 주요 버튼·제목 → 활성 메뉴 행 */
const focusFallback = () => {
  const cand = [focusReturn, document.querySelector<HTMLElement>('.cu-main .cu-header .cu-btn.primary:not(:disabled)'), document.querySelector<HTMLElement>('.cu-main .cu-header h1'), document.querySelector<HTMLElement>('.cu-nav-row.active')];
  const t = cand.find(el => el && el.isConnected);
  t?.focus?.();
};

function Tag({ state }: { state: State }) { return <span className={'cu-tag ' + TAG[state]}>{state}</span>; }
function Hold({ text = '보류' }: { text?: string }) { return <span className="dw-hold">[{text}]</span>; }
function ConnectIcon() { return <span className="cu-connect-icon dw-ci" aria-hidden="true"><img src={LOGO} alt="" /></span>; }

/** connect-unified Modal 패턴 복사: ESC 닫기·포커스 트랩·처리 중 닫기 막기 */
function Modal({ title, children, footer, onClose, wide = false, busy = false, className = '' }: { title: React.ReactNode; children: React.ReactNode; footer?: React.ReactNode; onClose: () => void; wide?: boolean; busy?: boolean; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const busyRef = useRef(busy), closeRef = useRef(onClose);
  busyRef.current = busy; closeRef.current = onClose;
  // 마운트 시 1회만 포커스하고 스택에 올림. 닫힐 때 직전 요소 → 남은 최상단 모달 → 화면 대체 요소 순으로 복귀
  useEffect(() => {
    const node = ref.current!;
    const previous = document.activeElement as HTMLElement | null;
    modalStack.push(node);
    node.focus();
    return () => {
      const i = modalStack.indexOf(node); if (i >= 0) modalStack.splice(i, 1);
      setTimeout(() => {
        const top = modalStack[modalStack.length - 1];
        if (top && top.contains(document.activeElement)) return;
        if (previous && previous.isConnected && previous !== document.body && (!top || top.contains(previous))) { previous.focus(); return; }
        if (top) { top.focus(); return; }
        if (document.activeElement && document.activeElement !== document.body && document.activeElement.isConnected) return;
        focusFallback();
      }, 0);
    };
  }, []);
  // 키 처리는 document 레벨: 포커스가 빠져도 최상단 모달만 ESC·Tab에 반응
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const node = ref.current;
      if (!node || modalStack[modalStack.length - 1] !== node) return;
      if (e.key === 'Escape') { e.stopPropagation(); if (!busyRef.current) closeRef.current(); return; }
      if (e.key === 'Tab') {
        const list = node.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]');
        if (!list.length) { e.preventDefault(); node.focus(); return; }
        const first = list[0], last = list[list.length - 1];
        const inside = node.contains(document.activeElement);
        if (!inside) { e.preventDefault(); (e.shiftKey ? last : first).focus(); return; }
        if (e.shiftKey && (document.activeElement === first || document.activeElement === node)) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);
  return (
    <div className="cu-backdrop" onMouseDown={e => { if (e.target === e.currentTarget && !busy) onClose(); }}>
      <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label={typeof title === 'string' ? title : undefined} className={'cu-modal ' + (wide ? 'wide ' : '') + className}>
        <header><h2>{title}</h2><button className="cu-icon" aria-label="닫기" disabled={busy} onClick={onClose}><VscChromeClose /></button></header>
        <div className="cu-modal-body">{children}</div>
        {footer && <footer>{footer}</footer>}
      </div>
    </div>
  );
}

/* ───────── 페이지 ───────── */
export default function Page() {
  // 데이터
  const [rows, setRows] = useState<Rec[]>(() => clone(BASE));
  const [rooms, setRooms] = useState<Room[]>(() => clone(BASE_ROOMS));
  const [savedRooms, setSavedRooms] = useState<Room[] | null>(null);
  const [notis, setNotis] = useState<Noti[]>(() => clone(BASE_NOTI));
  const ITEMS0 = [
    { name: '독감 백신', price: '35,000원', active: true },
    { name: '가다실 9가', price: '210,000원', active: true },
    { name: '싱그릭스', price: '230,000원', active: false }
  ];
  const [items, setItems] = useState(ITEMS0);
  // 체험 설정(메타)
  const [linked, setLinked] = useState(false), [noRooms, setNoRooms] = useState(false), [failSim, setFailSim] = useState(false), [serverDown, setServerDown] = useState(false), [manyNoti, setManyNoti] = useState(false), [panelOpen, setPanelOpen] = useState(false);
  const [savedRows, setSavedRows] = useState<Rec[] | null>(null);
  // 셸
  const [menu, setMenu] = useState('대시보드'), [loading, setLoading] = useState(false), [maximized, setMaximized] = useState(false), [closed, setClosed] = useState(false), [tray, setTray] = useState(false), [toast, setToast] = useState<{ text: string; tone: 'ok' | 'fail' } | null>(null);
  // 진료 현황 필터
  const [tab, setTab] = useState<'진행 중' | '지난 내역'>('진행 중'), [dateMode, setDateMode] = useState('오늘'), [pickDate, setPickDate] = useState(TODAY), [roomFilter, setRoomFilter] = useState('전체 진료실'), [search, setSearch] = useState(''), [sort, setSort] = useState('예약일시 빠른 순'), [chip, setChip] = useState<'' | '오늘 신청' | '진료완료' | '취소'>(''), [page, setPage] = useState(1), [kebab, setKebab] = useState<string | null>(null), [kebabPos, setKebabPos] = useState<{ top?: number; bottom?: number; left: number }>({ left: 0 });
  // 진료내역
  const [hSearch, setHSearch] = useState(''), [hPeriod, setHPeriod] = useState('최근 30일'), [hPage, setHPage] = useState(1);
  // 대시보드·알림
  const [noticePage, setNoticePage] = useState(1), [notiFilter, setNotiFilter] = useState<'전체' | '읽지 않음'>('전체');
  // 모달
  const [dialog, setDialog] = useState<Dialog | null>(null), [busy, setBusy] = useState(false), [error, setError] = useState(''), [reason, setReason] = useState(REASONS[0]);
  const [edit, setEdit] = useState({ purpose: '', etc: '', memo: '' }), [editTried, setEditTried] = useState(false);
  const [reg, setReg] = useState({ room: '', date: TODAY, time: '', name: '', phone: '' }), [regTried, setRegTried] = useState(false);
  const [roomForm, setRoomForm] = useState({ name: '', alias: '', dept: '', doctors: [''] }), [roomTried, setRoomTried] = useState(false);
  const [keyConfirm, setKeyConfirm] = useState(false), [keyBusy, setKeyBusy] = useState(false);
  // 프로그램 환경설정(PC별)
  const CFG0 = { autoStart: true, rrn7: false, newAppt: true, arrival: true };
  const [cfg, setCfg] = useState(CFG0), [cfgDraft, setCfgDraft] = useState(CFG0);
  const OP0 = { apptOn: true, sameDay: true, interval: '30', autoNoShow: true };
  const [opSettings, setOpSettings] = useState(OP0);

  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 3500); return () => clearTimeout(t); }, [toast]);
  useEffect(() => { if (!loading) return; const t = setTimeout(() => setLoading(false), 380); return () => clearTimeout(t); }, [loading]);
  useEffect(() => setPage(1), [tab, dateMode, pickDate, roomFilter, search, sort, chip]);
  useEffect(() => setHPage(1), [hSearch, hPeriod]);
  useEffect(() => {
    if (!kebab && !tray) return;
    const close = (e: MouseEvent) => { const t = e.target as HTMLElement; if (!t.closest('.dw-kebab-wrap')) setKebab(null); if (!t.closest('.dw-tray-area')) setTray(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') { setKebab(null); setTray(false); } };
    const scroll = () => setKebab(null);
    document.addEventListener('mousedown', close); document.addEventListener('keydown', esc);
    if (kebab) { window.addEventListener('scroll', scroll, true); window.addEventListener('resize', scroll); }
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', esc); window.removeEventListener('scroll', scroll, true); window.removeEventListener('resize', scroll); };
  }, [kebab, tray]);

  const kebabBtn = useRef<HTMLElement | null>(null), kebabMenu = useRef<HTMLDivElement>(null);
  /** ⋮ 메뉴: 실제 높이를 재고, 본문(.cu-main) 하단을 넘으면 버튼 위로 연다 */
  useLayoutEffect(() => {
    if (!kebab || !kebabBtn.current || !kebabMenu.current) return;
    const b = kebabBtn.current.getBoundingClientRect(), h = kebabMenu.current.offsetHeight, w = kebabMenu.current.offsetWidth;
    const limit = (document.querySelector('.cu-main') as HTMLElement | null)?.getBoundingClientRect().bottom ?? window.innerHeight;
    const left = Math.max(8, b.right - w);
    const next = b.bottom + 4 + h > limit ? { bottom: window.innerHeight - b.top + 4, left } : { top: b.bottom + 4, left };
    if (next.left !== kebabPos.left || next.top !== kebabPos.top || (next as any).bottom !== kebabPos.bottom) setKebabPos(next);
  }, [kebab, kebabPos]);
  const notify = (text: string, tone: 'ok' | 'fail' = 'ok') => setToast({ text, tone });
  const fail = (text: string) => notify(text, 'fail');
  /** 즉시 저장(토글 등): 서버 오류·모의 실패면 상태 유지 + 실패 토스트 */
  const instant = (apply: () => void, ok: string, what = '저장') => {
    if (serverDown) { fail(`굿닥 서버에 연결할 수 없어 ${what}하지 못했어요. 상태는 바뀌지 않았어요.`); return false; }
    if (failSim) { fail(`${what}하지 못했어요(모의 실패). 상태는 바뀌지 않았어요.`); return false; }
    apply(); notify(ok); return true;
  };
  const go = (name: string) => {
    setMenu(name); setLoading(true); setKebab(null); setClosed(false);
    // 옛 메뉴 행에 포커스 링이 남지 않도록 새 활성 메뉴 행으로 옮김
    if ((document.activeElement as HTMLElement | null)?.classList?.contains('cu-nav-row')) setTimeout(() => document.querySelector<HTMLElement>('.cu-nav-row.active')?.focus(), 0);
  };
  const chosen = dialog && 'id' in dialog && dialog.id ? rows.find(x => x.id === dialog.id) : undefined;
  const chosenRoom = dialog && (dialog.type === 'roomDetail' || dialog.type === 'roomDelete' || dialog.type === 'roomForm') && dialog.id ? rooms.find(x => x.id === dialog.id) : undefined;

  /** 공통 저장 흐름: 처리 중 → 서버 오류/모의 실패면 상태 그대로 + 오류, 성공일 때만 반영·토스트 */
  const save = async (apply: () => void, ok: string, after?: () => void) => {
    if (busy) return;
    setError(''); setBusy(true);
    await wait(650);
    if (serverDown) { setBusy(false); setError('굿닥 서버에 연결할 수 없어 저장하지 못했어요. 상태는 바뀌지 않았어요. 연결을 확인한 뒤 다시 시도해 주세요.'); return; }
    if (failSim) { setBusy(false); setError('저장하지 못했어요(모의 실패). 상태는 바뀌지 않았어요. 다시 시도해 주세요.'); return; }
    apply(); setBusy(false); after?.(); notify(ok);
  };
  const openDetail = (id: string) => { setError(''); setKebab(null); setDialog({ type: 'detail', id }); };
  const openAction = (id: string, act: Act, from: 'list' | 'detail' = 'detail') => { setError(''); setKebab(null); setDialog({ type: 'action', id, act, from }); };
  const openCancel = (id: string, from: 'list' | 'detail' = 'detail') => { setError(''); setKebab(null); setReason(REASONS[0]); setDialog({ type: 'cancel', id, from }); };
  /** 처리·취소 모달을 닫거나 끝낸 뒤: 목록에서 열었으면 목록, 상세에서 열었으면 상세로 */
  const backFrom = (id: string, from: 'list' | 'detail') => { setError(''); setDialog(from === 'detail' ? { type: 'detail', id } : null); };
  const close = () => { if (!busy) { setDialog(null); setError(''); } };
  const openSettings = () => { setError(''); setCfgDraft(cfg); setDialog({ type: 'settings' }); };

  /* 진료실 0개 체험: 기존 예약은 숨기고, 0개 상태에서 새로 만든 진료실에 등록한 건만 보인다 */
  const viewRows = noRooms ? rows.filter(x => x.id.startsWith('W') && rooms.some(rm => rm.name === x.room)) : rows;
  // 0개 체험 중에는 숨긴 예약에 연결된 알림을 목록·배지에서 뺀다
  const allNotis = noRooms ? notis.filter(n => !n.rec || viewRows.some(x => x.id === n.rec)) : notis;
  const unread = allNotis.filter(n => !n.read).length;
  /* 진료 현황 목록 */
  const inDate = (x: Rec) => dateMode === '전체 기간' || x.date === (dateMode === '오늘' ? TODAY : pickDate);
  const chipOk = (x: Rec) => !chip || (chip === '오늘 신청' ? x.created === TODAY : chip === '진료완료' ? x.state === '진료완료' && x.closed === TODAY : ['병원취소', '환자취소'].includes(x.state) && x.closed === TODAY);
  const baseFilter = (x: Rec) => (roomFilter === '전체 진료실' || x.room === roomFilter) && (!search.trim() || `${x.name}${x.phone}`.replace(/[-\s]/g, '').includes(search.replace(/[-\s]/g, ''))) && chipOk(x);
  const tabRows = (t: string) => viewRows.filter(x => (t === '진행 중' ? ACTIVE : CLOSED).includes(x.state) && (chip ? (chip === '오늘 신청' || x.closed === TODAY) : inDate(x)) && baseFilter(x));
  const list = tabRows(tab).sort((a, b) => (sort === '예약일시 빠른 순' ? 1 : -1) * `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  const pageCount = Math.max(1, Math.ceil(list.length / PAGE_SIZE)), curPage = Math.min(page, pageCount);
  const clearFilters = () => { setDateMode('오늘'); setPickDate(TODAY); setRoomFilter('전체 진료실'); setSearch(''); setChip(''); setSort('예약일시 빠른 순'); };

  /* 진료내역 */
  const histRows = viewRows.filter(x => CLOSED.includes(x.state) && (hPeriod === '전체 기간' || daysBetween(TODAY, x.date) <= (hPeriod === '최근 7일' ? 7 : 30)) && (!hSearch.trim() || `${x.name}${x.phone}`.replace(/[-\s]/g, '').includes(hSearch.replace(/[-\s]/g, '')))).sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`));
  const hCount = Math.max(1, Math.ceil(histRows.length / PAGE_SIZE)), hCur = Math.min(hPage, hCount);

  /* 체험 토글 */
  const toggleNoRooms = (v: boolean) => {
    if (dialog || keyConfirm) return; // 모달이 열려 있으면 배경 조작 무시
    setNoRooms(v); setRoomFilter('전체 진료실');
    if (v) { setSavedRooms(rooms); setSavedRows(rows); setRooms([]); notify('진료실 0개 체험을 시작했어요. 기존 진료실·예약은 잠시 숨겨요.'); }
    else {
      const made = rooms.length > 0 || rows.some(x => x.id.startsWith('W') && !(savedRows || []).some(y => y.id === x.id));
      setRooms(savedRooms || clone(BASE_ROOMS)); setRows(savedRows || clone(BASE)); setSavedRooms(null); setSavedRows(null);
      notify(made ? '진료실 0개 체험을 끝냈어요. 체험 중 만든 진료실·예약은 버리고 원래 진료실 3개로 되돌렸어요.' : '진료실 0개 체험을 끝내고 원래 진료실 3개로 되돌렸어요.');
    }
  };
  const toggleMany = (v: boolean) => {
    setManyNoti(v);
    setNotis(old => v ? [...old, ...Array.from({ length: 120 }, (_, i): Noti => ({ id: `X${i}`, type: i % 3 === 0 ? '환자 도착' : i % 3 === 1 ? '새 예약' : '진료항목 예약', text: `체험용 대량 알림 ${i + 1} · 가상 환자 ○○님`, at: `2026-10-0${5 - (i % 5)} 0${7 + (i % 3)}:${String(10 + (i % 50)).padStart(2, '0')}`, read: false, rec: '' }))] : old.filter(x => !x.id.startsWith('X')));
  };
  const resetAll = () => {
    setRows(clone(BASE)); setRooms(clone(BASE_ROOMS)); setSavedRooms(null); setSavedRows(null); setNotis(clone(BASE_NOTI)); setLinked(false); setNoRooms(false); setFailSim(false); setServerDown(false); setManyNoti(false);
    setItems(ITEMS0); setOpSettings(OP0); setCfg(CFG0); setCfgDraft(CFG0); setNotiFilter('전체'); setHSearch(''); setHPeriod('최근 30일'); setNoticePage(1); setKeyConfirm(false); setKebab(null);
    setDialog(null); setError(''); clearFilters(); setTab('진행 중'); setClosed(false); setMaximized(false); go('대시보드'); notify('모든 가상 데이터를 처음 상태로 되돌렸어요.');
  };

  /* 진료 건 처리 */
  const doAction = (x: Rec, act: Act, from: 'list' | 'detail') => save(
    () => setRows(old => old.map(y => y.id === x.id ? { ...y, state: act === 'visit' ? '내원확정' : '진료완료', closed: act === 'complete' ? TODAY : y.closed } : y)),
    act === 'visit' ? `${x.name}님을 내원확정 처리했어요.` : `${x.name}님을 진료완료 처리했어요.`,
    () => backFrom(x.id, from)
  );
  const doCancel = (x: Rec, from: 'list' | 'detail') => save(
    () => setRows(old => old.map(y => y.id === x.id ? { ...y, state: '병원취소', reason, closed: TODAY } : y)),
    `${x.name}님 예약을 취소했어요. 사유: ${reason}`,
    () => backFrom(x.id, from)
  );
  const doEdit = (x: Rec) => { setEditTried(true); if (!edit.purpose.trim()) return; return save(
    () => setRows(old => old.map(y => y.id === x.id ? { ...y, purpose: edit.purpose.trim(), etc: edit.etc.trim(), memo: edit.memo.trim() } : y)),
    '진료정보를 저장했어요.',
    () => setDialog({ type: 'detail', id: x.id })
  ); };

  /* 예약 등록 [보류] */
  const regPhoneOk = reg.phone.replace(/\D/g, '').length >= 10 || /\*{4}-\d{4}$/.test(reg.phone);
  const dupSample = rows.find(x => ACTIVE.includes(x.state) && x.date === TODAY && x.room !== '—');
  const regPast = !!reg.date && reg.date < TODAY, regPastTime = reg.date === TODAY && !!reg.time && reg.time <= NOW;
  const regValid = !!reg.room && !!reg.date && !!reg.time && !!reg.name.trim() && regPhoneOk && !regPast && !regPastTime;
  const submitRegister = () => {
    setRegTried(true); setError('');
    if (!regValid) return;
    const last4 = reg.phone.replace(/\D/g, '').slice(-4);
    const phone = /\*{4}/.test(reg.phone) ? reg.phone : `010-****-${last4}`;
    const dup = rows.some(x => ACTIVE.includes(x.state) && x.name === reg.name.trim() && x.phone === phone && x.date === reg.date);
    if (dup) { setError(DUP_MSG); return; }
    const id = `W${String(rows.length + 1).padStart(3, '0')}`;
    save(
      () => setRows(old => [...old, r({ id, name: reg.name.trim(), phone, date: reg.date, time: reg.time, created: TODAY, room: reg.room, purpose: '병원 등록', channel: '병원 등록(웹)', state: '예약확정' })]),
      `${reg.name.trim()}님 예약을 등록했어요.`,
      () => { setDialog(null); setTab('진행 중'); setDateMode(reg.date === TODAY ? '오늘' : '날짜 선택'); setPickDate(reg.date); setChip(''); }
    );
  };

  /* 진료실 CRUD */
  const activeIn = (room: Room) => rows.filter(x => ACTIVE.includes(x.state) && x.room === room.name).length;
  const openRoomForm = (room?: Room) => { setError(''); setRoomTried(false); setRoomForm(room ? { name: room.name, alias: room.alias, dept: room.dept, doctors: room.doctors.length ? [...room.doctors] : [''] } : { name: '', alias: '', dept: '', doctors: [''] }); setDialog({ type: 'roomForm', id: room?.id }); };
  const roomNameDup = rooms.some(x => x.name === roomForm.name.trim() && x.id !== (dialog?.type === 'roomForm' ? dialog.id : undefined));
  const roomValid = !!roomForm.name.trim() && !!roomForm.dept.trim() && roomForm.doctors.some(d => d.trim()) && !roomNameDup;
  const submitRoom = () => {
    setRoomTried(true); setError('');
    if (!roomValid || dialog?.type !== 'roomForm') return;
    const editId = dialog.id;
    const entry = { name: roomForm.name.trim(), alias: roomForm.alias.trim(), dept: roomForm.dept.trim(), doctors: roomForm.doctors.map(d => d.trim()).filter(Boolean) };
    save(
      () => {
        if (editId) {
          const prev = rooms.find(x => x.id === editId);
          setRooms(old => old.map(x => x.id === editId ? { ...x, ...entry } : x));
          if (prev && prev.name !== entry.name) {
            setRows(old => old.map(x => x.room === prev.name ? { ...x, room: entry.name } : x));
            if (roomFilter === prev.name) setRoomFilter(entry.name);
          }
        } else {
          setRooms(old => [...old, { id: `R${Date.now()}`, ...entry, svc: { onsite: false, remote: false, appt: false } }]);
        }
      },
      editId ? '진료실 정보를 저장했어요.' : `진료실 ‘${entry.name}’${eul(entry.name)} 만들었어요. 서비스 운영은 진료실 상세에서 켜 주세요.`,
      () => setDialog(editId ? { type: 'roomDetail', id: editId } : null)
    );
  };
  const deleteRoom = (room: Room) => save(
    () => { setRooms(old => old.filter(x => x.id !== room.id)); if (roomFilter === room.name) setRoomFilter('전체 진료실'); },
    `진료실 ‘${room.name}’${eul(room.name)} 삭제했어요. 굿닥 서비스·외부 플랫폼 연동이 해지됐어요.`,
    () => setDialog(null)
  );
  const toggleSvc = (room: Room, key: keyof Room['svc']) => {
    instant(() => setRooms(old => old.map(x => x.id === room.id ? { ...x, svc: { ...x.svc, [key]: !x.svc[key] } } : x)),
      `${room.name} · ${key === 'onsite' ? '현장 접수' : key === 'remote' ? '원격 접수' : '예약'} ${room.svc[key] ? '사용을 중지했어요' : '사용을 시작했어요'}.`);
  };

  /* 알림 */
  const openNoti = (n: Noti) => {
    const hasRec = !!n.rec && viewRows.some(x => x.id === n.rec);
    if (n.rec && !hasRec) { fail('연결된 예약을 찾을 수 없어요. 현재 화면에서 볼 수 없는 건이에요.'); return; }
    if (n.read) { if (hasRec) openDetail(n.rec); return; }
    if (serverDown) { fail('굿닥 서버에 연결할 수 없어 읽음 처리하지 못했어요.'); if (hasRec) openDetail(n.rec); return; }
    setNotis(old => old.map(x => x.id === n.id ? { ...x, read: true } : x));
    if (hasRec) openDetail(n.rec); else notify('알림을 읽음 처리했어요. (체험용 알림은 연결된 예약이 없어요)');
  };
  const readAll = () => {
    instant(() => setNotis(old => old.map(x => allNotis.some(n => n.id === x.id) ? { ...x, read: true } : x)), '모든 알림을 읽음 처리했어요.', '읽음 처리');
  };

  /* ───────── 렌더 조각 ───────── */
  const skeleton = (n = 5) => <div className="dw-skeleton" aria-label="불러오는 중" role="status">{Array.from({ length: n }, (_, i) => <div key={i}><i /><i /><i /><i /></div>)}</div>;
  const serverBanner = serverDown && <div className="cu-warning dw-banner" role="alert"><VscWarning />굿닥 서버에 연결할 수 없어요. 마지막으로 불러온 정보이며, 상태 변경을 저장할 수 없어요.<button className="cu-btn quiet" onClick={() => { setServerDown(false); notify('서버 연결을 모의 복구했어요.'); }}>다시 연결 (모의)</button></div>;
  const failHint = failSim && <p className="dw-fail-hint"><VscBeaker />체험 설정의 ‘저장 실패’가 켜져 있어요. 확인을 누르면 실패 결과를 보여 줍니다.</p>;
  const errorBox = error && <p className="cu-error" role="alert"><VscError /> {error}</p>;
  const pager = (cur: number, count: number, set: (n: number) => void, label: string) => (
    <div className="cu-pagination"><span>{label}</span><div>
      <button disabled={cur === 1} onClick={() => set(cur - 1)} aria-label="이전 페이지">‹</button>
      {Array.from({ length: count }, (_, i) => <button key={i} className={cur === i + 1 ? 'active' : ''} aria-current={cur === i + 1 ? 'page' : undefined} onClick={() => set(i + 1)}>{i + 1}</button>)}
      <button disabled={cur === count} onClick={() => set(cur + 1)} aria-label="다음 페이지">›</button>
    </div></div>
  );
  const noRoomCard = (
    <div className="dw-empty-card">
      <VscOrganization />
      <div><strong>{linked ? '차트에서 진료실을 등록하면 여기에 표시돼요' : '진료실을 먼저 만들어 주세요'}</strong><p>{linked ? '연동 차트의 진료실이 자동으로 반영돼요. 진료실이 있어야 예약을 받을 수 있어요.' : '진료실이 있어야 굿닥 앱에서 예약을 받을 수 있어요. 진료과와 담당 의사를 입력해 만들어 주세요.'}</p></div>
      {!linked && <button className="cu-btn primary" onClick={() => { go('진료실'); openRoomForm(); }}><VscAdd />진료실 만들기</button>}
    </div>
  );

  const rowMenu = (x: Rec) => (
    <div className="dw-kebab-wrap" onClick={e => e.stopPropagation()}>
      <button className="cu-icon" aria-label={`${x.name} 처리 메뉴`} aria-haspopup="menu" aria-expanded={kebab === x.id} onClick={e => {
        if (kebab === x.id) { setKebab(null); return; }
        const btnEl = e.currentTarget as HTMLElement, b = btnEl.getBoundingClientRect();
        focusReturn = btnEl; kebabBtn.current = btnEl;
        setKebabPos({ top: b.bottom + 4, left: Math.max(8, b.right - 140) }); // 먼저 아래로 그리고, 실측 후 필요하면 위로 뒤집음
        setKebab(x.id);
      }}><VscKebabVertical /></button>
      {kebab === x.id && <div className="dw-kebab" role="menu" ref={kebabMenu} style={{ position: 'fixed', top: kebabPos.top ?? 'auto', bottom: kebabPos.bottom ?? 'auto', left: kebabPos.left, right: 'auto' }}>
        {x.state === '예약확정' && <button role="menuitem" onClick={() => openAction(x.id, 'visit', 'list')}>내원확정</button>}
        {ACTIVE.includes(x.state) && <button role="menuitem" onClick={() => openAction(x.id, 'complete', 'list')}>진료완료</button>}
        {ACTIVE.includes(x.state) && <button role="menuitem" className="danger-text" onClick={() => openCancel(x.id, 'list')}>예약취소</button>}
        <button role="menuitem" onClick={() => openDetail(x.id)}>상세 보기</button>
      </div>}
    </div>
  );

  const recTable = (data: Rec[], opts: { visitCol: boolean; menuCol: boolean }) => (
    <div className="cu-table-wrap"><table className="cu-table dw-table"><thead><tr>
      {opts.visitCol && <th className="dw-visit-th">내원</th>}
      <th>상태</th><th>예약일시 / 신청일</th><th>유형 / 진료실</th><th>진료항목 · 내원목적</th><th>환자 / 연락처</th>{opts.menuCol && <th aria-label="처리" />}
    </tr></thead><tbody>
      {data.map(x => (
        <tr key={x.id} tabIndex={0} onClick={e => { focusReturn = e.currentTarget; openDetail(x.id); }} onKeyDown={e => { if (e.key === 'Enter') { focusReturn = e.currentTarget; openDetail(x.id); } }}>
          {opts.visitCol && <td className="dw-visit-td" onClick={e => e.stopPropagation()}>
            <input type="checkbox" aria-label={`${x.name} 내원 체크`} checked={x.state === '내원확정'} disabled={x.state === '내원확정'} title={x.state === '내원확정' ? '내원확정된 건이에요' : '내원확정 처리'} onChange={e => { focusReturn = e.currentTarget; openAction(x.id, 'visit', 'list'); }} />
          </td>}
          <td><Tag state={x.state} /></td>
          <td><strong>{fmt(x.date)} {x.time}</strong><small>신청 {fmt(x.created)}{x.created === TODAY && <em className="dw-new">오늘</em>}</small></td>
          <td>{x.kind}<small>{x.room === '—' ? '진료실 미지정' : x.room}</small></td>
          <td><strong>{x.kind === '진료항목 예약' ? x.item : x.purpose}</strong><small>{x.kind === '진료항목 예약' ? x.purpose : x.etc || '—'}</small></td>
          <td><strong>{x.name}</strong><small>{x.phone}</small></td>
          {opts.menuCol && <td>{ACTIVE.includes(x.state) ? rowMenu(x) : <button className="cu-icon" aria-label={`${x.name} 상세 보기`} onClick={e => { e.stopPropagation(); openDetail(x.id); }}><VscChevronRight /></button>}</td>}
        </tr>
      ))}
    </tbody></table></div>
  );

  /* ───────── 메뉴 화면 ───────── */
  const dashboard = () => {
    const created = viewRows.filter(x => x.created === TODAY).length;
    const done = viewRows.filter(x => x.state === '진료완료' && x.closed === TODAY).length;
    const canceled = viewRows.filter(x => ['병원취소', '환자취소'].includes(x.state) && x.closed === TODAY).length;
    const nCount = Math.ceil(NOTICES.length / 3);
    return <>
      {rooms.length === 0 && noRoomCard}
      <div className="cu-section-heading"><h2>오늘 현황</h2><span>{fmtFull(TODAY)} · 서버 기준 예시 집계</span></div>
      <div className="cu-stat-grid">
        {([['예약 신청', created, '오늘 신청', '오늘 새로 들어온 예약'], ['진료 완료', done, '진료완료', '오늘 진료완료 처리'], ['진료 취소', canceled, '취소', '오늘 병원·환자 취소']] as const).map(([label, count, target, sub]) => (
          <button className="cu-stat" key={label} onClick={() => { go('진료 현황'); setChip(target); setTab(target === '오늘 신청' ? '진행 중' : '지난 내역'); setRoomFilter('전체 진료실'); setSearch(''); }}>
            <span>{label}</span><strong>{count}<small>건</small></strong><em className="dw-stat-sub">{sub}</em><VscChevronRight />
          </button>
        ))}
      </div>
      <p className="cu-subnote">타일을 누르면 진료 현황이 해당 조건으로 열려요. 지표 구성은 데스크 대시보드와 같아요.</p>
      <div className="cu-section-heading notice"><h2>공지사항</h2><span>{NOTICES.length}건</span></div>
      <div className="cu-notice-list">{NOTICES.slice((noticePage - 1) * 3, noticePage * 3).map(([type, title, d]) => (
        <button key={title} onClick={() => setDialog({ type: 'notice', title })}><span><span className="cu-notice-type">{type}</span>{title}</span><span>{d}<VscChevronRight /></span></button>
      ))}</div>
      {pager(noticePage, nCount, setNoticePage, '3개씩 보기')}
    </>;
  };

  const status = () => {
    const roomNames = rooms.map(x => x.name);
    return <>
      <div className="cu-tabs" role="tablist" aria-label="진료 상태">
        {(['진행 중', '지난 내역'] as const).map(t => <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? 'active' : ''} onClick={() => { setTab(t); if (chip && chip !== '오늘 신청' && t === '진행 중') setChip(''); }}>{t}<span>{tabRows(t).length}</span></button>)}
      </div>
      <div className="cu-filters">
        <label className="cu-search"><VscSearch /><input aria-label="환자 검색" placeholder="환자 이름 또는 연락처 검색" value={search} onChange={e => setSearch(e.target.value)} /></label>
        <select aria-label="조회 날짜" value={dateMode} disabled={!!chip} onChange={e => setDateMode(e.target.value)}><option>오늘</option><option>날짜 선택</option><option>전체 기간</option></select>
        {dateMode === '날짜 선택' && !chip && <input type="date" className="dw-date" aria-label="날짜 선택" value={pickDate} onChange={e => setPickDate(e.target.value || TODAY)} />}
        <select aria-label="진료실 필터" value={roomFilter} onChange={e => setRoomFilter(e.target.value)}><option>전체 진료실</option>{roomNames.map(n => <option key={n}>{n}</option>)}</select>
        <button className="cu-icon" aria-label="검색 조건 초기화" title="검색 조건 초기화" onClick={clearFilters}><VscRefresh /></button>
      </div>
      {chip && <div className="dw-chips"><span className="dw-chip">대시보드 · {chip === '오늘 신청' ? '오늘 신청된 예약' : chip === '진료완료' ? '오늘 진료완료' : '오늘 진료 취소'}<button aria-label="대시보드 조건 해제" onClick={() => setChip('')}><VscChromeClose /></button></span><small>대시보드 조건이 켜져 있는 동안 날짜 필터는 쓰지 않아요.</small></div>}
      <div className="cu-table-toolbar">
        <span>총 <strong>{list.length}</strong>건{chip === '오늘 신청' ? <small>오늘 신청된 예약 {tabRows('진행 중').length + tabRows('지난 내역').length}건 중 진행 중 {tabRows('진행 중').length}건 · 지난 내역 {tabRows('지난 내역').length}건</small> : tab === '진행 중' && <small>예약확정·내원확정 건이에요. 내원 체크는 확인 후 처리돼요.</small>}</span>
        <div><select aria-label="정렬" value={sort} onChange={e => setSort(e.target.value)}><option>예약일시 빠른 순</option><option>예약일시 늦은 순</option></select></div>
      </div>
      {loading ? skeleton() : <>
        {list.length > 0 && recTable(list.slice((curPage - 1) * PAGE_SIZE, curPage * PAGE_SIZE), { visitCol: tab === '진행 중', menuCol: true })}
        {!list.length && rooms.length === 0 && tab === '진행 중' && <div className="cu-empty"><VscOrganization /><strong>진료실이 없어 예약을 받을 수 없어요</strong><p>{linked ? '차트에서 진료실을 등록하면 예약을 받을 수 있어요.' : '진료실을 만들면 굿닥 앱에서 예약을 받을 수 있어요.'}</p>{!linked && <button className="cu-btn primary" onClick={() => { go('진료실'); openRoomForm(); }}><VscAdd />진료실 만들기</button>}</div>}
        {!list.length && !(rooms.length === 0 && tab === '진행 중') && <div className="cu-empty"><VscSearch /><strong>{search || chip || roomFilter !== '전체 진료실' ? '조건에 맞는 예약이 없어요' : tab === '진행 중' ? '진행 중인 예약이 없어요' : '지난 내역이 없어요'}</strong><button className="cu-btn" onClick={() => { clearFilters(); setDateMode('전체 기간'); }}>전체 기간으로 보기</button></div>}
        {list.length > 0 && pager(curPage, pageCount, setPage, `${PAGE_SIZE}개씩 보기`)}
      </>}
    </>;
  };

  const history = () => <>
    <div className="dw-hold-bar"><Hold />진료내역 메뉴 제공 여부는 PO 확인 중이에요. 읽기 전용 조회만 시안으로 둡니다.</div>
    <div className="cu-filters">
      <label className="cu-search"><VscSearch /><input aria-label="진료내역 검색" placeholder="환자 이름 또는 연락처 검색" value={hSearch} onChange={e => setHSearch(e.target.value)} /></label>
      <select aria-label="조회 기간" value={hPeriod} onChange={e => setHPeriod(e.target.value)}><option>최근 7일</option><option>최근 30일</option><option>전체 기간</option></select>
    </div>
    <div className="cu-table-toolbar"><span>총 <strong>{histRows.length}</strong>건<small>진료완료·병원취소·환자취소·자동 종료 건 · 예약일시 최근 순</small></span></div>
    {loading ? skeleton() : histRows.length ? <>{recTable(histRows.slice((hCur - 1) * PAGE_SIZE, hCur * PAGE_SIZE), { visitCol: false, menuCol: true })}{pager(hCur, hCount, setHPage, `${PAGE_SIZE}개씩 보기`)}</> : <div className="cu-empty"><VscHistory /><strong>조회된 진료내역이 없어요</strong></div>}
  </>;

  const roomsPage = () => <>
    {linked && <p className="cu-inline-note dw-note"><VscInfo />연동 차트 병원이에요. 진료실 추가·수정·삭제는 차트에서 관리하고, 차트의 진료실이 굿닥에 자동으로 반영돼요. 서비스 운영(현장 접수·원격 접수·예약)만 여기서 켜고 끌 수 있어요.</p>}
    {loading ? skeleton(3) : rooms.length === 0 ? noRoomCard : <div className="dw-room-grid">{rooms.map(room => (
      <button className="dw-room-card" key={room.id} onClick={() => { setError(''); setDialog({ type: 'roomDetail', id: room.id }); }}>
        <div><strong>{room.alias || room.name}</strong><small>{room.name} ∙ {room.dept} ∙ {room.doctors.join(', ')}</small></div>
        <div className="dw-svc-tags">
          {([['onsite', '현장 접수'], ['remote', '원격 접수'], ['appt', '예약']] as const).map(([k, l]) => <span key={k} className={'dw-svc ' + (room.svc[k] ? 'on' : '')}>{l} {room.svc[k] ? '운영중' : '사용중지'}</span>)}
        </div>
        {activeIn(room) > 0 && <em className="dw-room-count">진행 중 {activeIn(room)}건</em>}
        <VscChevronRight />
      </button>
    ))}</div>}
  </>;

  const itemsPage = () => <div className="cu-item-panel">
    <div className="cu-item-categories"><strong>카테고리</strong><button className="active">예방접종 <span>{items.length}</span></button></div>
    <div className="cu-item-list"><h3>예방접종</h3>{items.map((it, i) => (
      <div className="cu-item-row" key={it.name}>
        <button onClick={() => setDialog({ type: 'notice', title: `${it.name} 진료항목 정보` })}><strong>{it.name}</strong><small>{it.price}</small></button>
        <span className={it.active ? 'cu-blue' : 'cu-muted'}>{it.active ? '노출중' : '미노출'}</span>
        <button className={'cu-toggle ' + (it.active ? 'on' : '')} aria-label={`${it.name} 굿닥 노출`} aria-pressed={it.active} onClick={() => instant(() => setItems(old => old.map((y, j) => j === i ? { ...y, active: !y.active } : y)), `${it.name} 노출을 ${it.active ? '껐어요' : '켰어요'}.`)}><span /></button>
      </div>
    ))}</div>
  </div>;

  const opPage = () => <div className="cu-settings-page">
    {([['apptOn', '진료 예약 받기', '굿닥 앱·카카오톡에서 진료 예약을 받아요.'], ['sameDay', '당일 예약 허용', '현재 시간 기준 1시간 이후부터 당일 예약을 받아요.'], ['autoNoShow', '지난 예약 자동 종료', '예약일이 지나도 처리되지 않은 건은 자정에 자동 종료돼요. 자동 종료는 실제 완료·취소가 아니에요.']] as const).map(([k, label, d]) => (
      <div className="cu-setting-row" key={k}><div><strong>{label}</strong><p>{d}</p></div><button className={'cu-toggle ' + (opSettings[k] ? 'on' : '')} aria-label={label} aria-pressed={opSettings[k]} onClick={() => instant(() => setOpSettings(o => ({ ...o, [k]: !o[k] })), '설정을 가상 저장했어요.')}><span /></button></div>
    ))}
    <div className="cu-setting-row"><div><strong>예약 시간 간격</strong><p>병원 운영 시간 안에서 이 간격으로 예약 시간을 열어요.</p></div><select aria-label="예약 시간 간격" value={opSettings.interval} onChange={e => { const v = e.target.value; instant(() => setOpSettings(o => ({ ...o, interval: v })), '설정을 가상 저장했어요.'); }}><option value="10">10분</option><option value="15">15분</option><option value="30">30분</option><option value="60">60분</option></select></div>
    <p className="cu-subnote">기존 웹 운영 설정의 축약 재현이에요. 새 예약 알림처럼 PC마다 다른 설정은 프로그램 환경설정(톱니·트레이)으로 옮겼어요.</p>
  </div>;

  const notiPage = () => {
    const shown = allNotis.filter(n => notiFilter === '전체' || !n.read);
    return <>
      <div className="dw-noti-head">
        <div className="cu-tabs dw-mini-tabs" role="tablist" aria-label="알림 필터">{(['전체', '읽지 않음'] as const).map(f => <button key={f} role="tab" aria-selected={notiFilter === f} className={notiFilter === f ? 'active' : ''} onClick={() => setNotiFilter(f)}>{f}<span>{f === '전체' ? allNotis.length : badge(unread)}</span></button>)}</div>
        <button className="cu-btn" disabled={!unread} onClick={readAll}><VscCheckAll />모두 읽음</button>
      </div>
      <p className="cu-inline-note dw-note"><VscInfo /><span>알림은 30일 동안 보관돼요. 읽음 상태는 서버 기준이라 다른 PC에서도 같게 보여요. <Hold text="보류 · 읽음 단위(병원/PC)·보관 기간·알림 종류 확인 중" /></span></p>
      {loading ? skeleton() : shown.length ? <ul className="dw-noti-list">{shown.slice(0, 40).map(n => (
        <li key={n.id}><button className={n.read ? '' : 'unread'} onClick={() => openNoti(n)}>
          <span className={'dw-noti-type t' + (n.type === '새 예약' ? 1 : n.type === '환자 도착' ? 2 : 3)}>{n.type}</span>
          <span className="dw-noti-text">{n.text}</span>
          <span className="dw-noti-at">{n.at.startsWith(TODAY) ? `오늘 ${n.at.slice(11)}` : `${n.at.slice(5, 10).replace('-', '.')} ${n.at.slice(11)}`}</span>
          {!n.read && <i className="dw-dot" aria-label="읽지 않음" />}
          <VscChevronRight />
        </button></li>
      ))}</ul> : <div className="cu-empty"><VscBell /><strong>{notiFilter === '읽지 않음' ? '읽지 않은 알림이 없어요' : '받은 알림이 없어요'}</strong></div>}
      {shown.length > 40 && <p className="cu-subnote">최근 40건만 보여 주고 있어요(시안). 전체 {shown.length}건.</p>}
    </>;
  };

  /* ───────── 상세 모달 ───────── */
  const detailModal = (x: Rec, editing: boolean) => {
    const past = rows.filter(y => y.phone === x.phone && y.name === x.name && y.id !== x.id && CLOSED.includes(y.state)).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);
    const canAct = ACTIVE.includes(x.state);
    const footer = editing
      ? <><button className="cu-btn" disabled={busy} onClick={() => { setError(''); setDialog({ type: 'detail', id: x.id }); }}>취소</button><button className="cu-btn primary" disabled={busy} onClick={() => doEdit(x)}>{busy ? '처리 중…' : error ? '다시 시도' : '저장'}</button></>
      : <><button className="cu-btn" onClick={close}>닫기</button>{canAct && <div className="dw-detail-actions">
          <button className="cu-btn dw-danger-line" onClick={() => openCancel(x.id, 'detail')}>예약취소</button>
          {x.state === '예약확정' && <button className="cu-btn" onClick={() => openAction(x.id, 'visit', 'detail')}>내원확정</button>}
          <button className="cu-btn primary" onClick={() => openAction(x.id, 'complete', 'detail')}>진료완료</button>
        </div>}</>;
    return <Modal title="예약 상세" wide busy={busy} onClose={close} footer={footer}>
      <div className="cu-detail-heading"><span>{x.kind} · {x.id} · 유입 {x.channel}</span><Tag state={x.state} /></div>
      {x.state === '자동 종료' && <p className="cu-inline-note dw-auto"><VscInfo /><span><strong>실제 진료완료·취소가 아니에요.</strong> 예약일이 지나도 처리되지 않아 자동으로 종료된 건이라 상태를 바꿀 수 없어요. <Hold text="보류 · 접수·진료실 예약 표시 범위 확인 중" /></span></p>}
      <div className="dw-detail-label-row"><h3 className="cu-detail-label">예약 정보</h3>{canAct && !editing && <button className="cu-btn quiet" onClick={() => { setError(''); setEditTried(false); setEdit({ purpose: x.purpose, etc: x.etc, memo: x.memo }); setDialog({ type: 'detail', id: x.id, edit: true }); }}><VscEdit />진료정보 수정</button>}</div>
      <div className="cu-detail-card">
        <dl className="dw-dl">
          <dt>예약일시</dt><dd><strong className="cu-detail-date">{fmtFull(x.date)} {x.time}</strong></dd>
          <dt>진료실</dt><dd>{x.room === '—' ? '진료실 미지정' : x.room}</dd>
          {x.kind === '진료항목 예약' && <><dt>진료항목</dt><dd>{x.item}</dd></>}
          <dt>내원목적</dt><dd>{editing ? <input aria-label="내원목적" value={edit.purpose} maxLength={40} onChange={e => setEdit(o => ({ ...o, purpose: e.target.value }))} /> : x.purpose || '—'}{editing && editTried && !edit.purpose.trim() && <em className="dw-field-err dw-block">내원목적을 입력해 주세요.</em>}</dd>
          <dt>기타</dt><dd>{editing ? <input aria-label="기타" value={edit.etc} maxLength={100} placeholder="환자가 남긴 요청 등" onChange={e => setEdit(o => ({ ...o, etc: e.target.value }))} /> : x.etc || '—'}</dd>
          <dt>진료메모</dt><dd>{editing ? <textarea aria-label="진료메모" value={edit.memo} maxLength={200} placeholder="병원 내부 메모 · 환자에게 보이지 않아요" onChange={e => setEdit(o => ({ ...o, memo: e.target.value }))} /> : x.memo || '—'}</dd>
          <dt>신청일</dt><dd>{fmtFull(x.created)}</dd>
          {x.reason && <><dt>처리 사유</dt><dd>{x.reason}</dd></>}
        </dl>
        {editing && <p className="cu-subnote">예약일시는 데스크에서도 바꾸지 않아 웹에서 제외했어요. 바꾸려면 취소 후 다시 예약해 주세요.</p>}
      </div>
      <h3 className="cu-detail-label">환자 기본정보</h3>
      <div className="cu-detail-card cu-person dw-person">
        <div><span>이름</span><strong>{x.name}</strong></div><div><span>연락처</span><strong>{x.phone}</strong></div><div><span>생년월일</span><strong>{x.birth}</strong></div>
      </div>
      <p className="cu-inline-note"><VscInfo /><span><Hold text="보류" /> 주민번호·주소 표시 범위는 PO 확인 중이라 웹에는 보여 주지 않아요.{cfg.rrn7 && ' (이 PC의 환경설정에서 주민번호 7자리 표시가 켜져 있어요 — 웹 반영 여부 확인 중)'} 환자 메뉴는 웹에서 제공하지 않아요.</span></p>
      <h3 className="cu-detail-label">최근 진료 이력</h3>
      {past.length ? <ul className="dw-history">{past.map(p => <li key={p.id}><span>{fmtFull(p.date)} {p.time}</span><span>{p.room === '—' ? p.item : `${p.room} · ${p.purpose}`}</span><Tag state={p.state} /></li>)}</ul> : <p className="dw-muted-line">이 병원에서의 이전 진료 이력이 없어요.</p>}
      {failHint}{errorBox}
    </Modal>;
  };

  /* ───────── 셸 ───────── */
  const title = menu;
  const modalOpen = !!dialog || keyConfirm;
  const expToggles: [string, boolean, (v: boolean) => void, React.ReactNode][] = [
    ['연동 차트 병원', linked, (v: boolean) => { setLinked(v); notify(v ? '연동 차트 병원으로 전환했어요. 진료실은 차트에서 관리해요.' : '데스크 차트(비연동) 병원으로 전환했어요.'); }, '연동 차트 병원'],
    ['진료실 0개', noRooms, toggleNoRooms, noRooms && rooms.length > 0 ? <span>진료실 0개 <em className="dw-exp-note">체험 중 · {rooms.length}개 만듦</em></span> : '진료실 0개'],
    ['저장 실패', failSim, setFailSim, '저장 실패'],
    ['서버 오류', serverDown, setServerDown, '서버 오류'],
    ['알림 99+', manyNoti, toggleMany, '알림 99+']
  ];
  const expOn = expToggles.filter(t => t[1]).length;
  const connection = linked ? '연동 차트 예시 · 연결됨' : '데스크(굿닥) 차트';
  return <div className="cu-app dw-app">
    <div className="cu-prototype">
      <div><strong>데스크 기능 웹 이관 시안</strong><span>v0.3 · 커넥트 웹뷰 UI · 가상 데이터</span></div>
      <div className="cu-proto-actions"><span className="dw-legend"><Hold /> = PO 확인 중</span><button className={'dw-exp-btn ' + (panelOpen ? 'open' : '')} aria-expanded={panelOpen} aria-controls="dw-exp-strip" onClick={() => setPanelOpen(!panelOpen)}><VscBeaker />체험 설정{expOn > 0 && <b>{expOn}</b>}<em>프로토 전용</em></button><button className="cu-icon" disabled={modalOpen} onClick={resetAll} aria-label="시안 초기화" title="시안 초기화"><VscRefresh /></button></div>
    </div>
    {panelOpen && <div className="dw-exp-strip" id="dw-exp-strip" role="region" aria-label="체험 설정 (프로토타입 전용 · 실제 기능 아님)">
      <span className="dw-exp-tag">프로토 전용 · 실제 기능 아님</span>
      {modalOpen && <span className="dw-exp-lock">모달이 열려 있는 동안은 바꿀 수 없어요</span>}
      {expToggles.map(([label, value, set, shown]) => <label key={label} className={'dw-exp-item ' + (modalOpen ? 'locked' : '')}><button type="button" className={'cu-toggle ' + (value ? 'on' : '')} aria-label={label} aria-pressed={value} disabled={modalOpen} onClick={() => set(!value)}><span /></button>{shown}</label>)}
      <button className="cu-btn quiet dw-exp-reset" disabled={modalOpen} onClick={resetAll}><VscRefresh />처음 상태로</button>
    </div>}
    <div className="cu-planned"><VscInfo />미승인 시안 · 하반기 범위: 차트가 ‘데스크’인 병원 · 굿닥 서버 기준 데이터 · 실제 서버·차트·환자 알림과 통신하지 않아요.</div>
    <div className={'dw-stage ' + (maximized ? 'max' : '')}>
      {!closed ? <div className="cn-screen cu-client dw-window" aria-label="굿닥 커넥트 프로그램 창">
        <div className="cn-titlebar cu-titlebar"><div className="cu-brand"><img src={LOGO} alt="굿닥" /><span>커넥트</span></div>
          <div className="cu-window-actions">
            <button className="cu-icon dw-bell" onClick={() => go('알림 메시지함')} aria-label={`알림 메시지함, 읽지 않은 알림 ${unread}건`} title="알림 메시지함"><VscBell />{unread > 0 && <b className="dw-badge">{badge(unread)}</b>}</button>
            <button className="cu-icon" onClick={openSettings} aria-label="프로그램 환경설정" title="프로그램 환경설정"><VscSettingsGear /></button>
            <button className="cu-icon" onClick={() => { setClosed(true); notify('커넥트를 최소화했어요. 트레이 아이콘으로 다시 열 수 있어요.'); }} aria-label="최소화" title="최소화"><VscChromeMinimize /></button>
            <button className="cu-icon" onClick={() => setMaximized(!maximized)} aria-label={maximized ? '이전 크기로' : '최대화'} title={maximized ? '이전 크기로' : '최대화'}>{maximized ? <VscChromeRestore /> : <VscChromeMaximize />}</button>
            <button className="cu-icon close" onClick={() => setClosed(true)} aria-label="창 닫기" title="창 닫기"><VscChromeClose /></button>
          </div>
        </div>
        <div className="cu-body">
          <aside className="cn-nav cu-nav" aria-label="웹 업무 메뉴">
            <div className="cu-hospital"><strong>굿닥 예시의원</strong><span>{linked ? '연동 차트 병원 (체험)' : '데스크 차트 병원 · 화면 검토용'}</span></div>
            <div className="cu-nav-section">서비스 운영</div>
            {NAV.map(n => <button key={n.key} className={'cu-nav-row ' + (menu === n.key ? 'active' : '')} aria-current={menu === n.key ? 'page' : undefined} onClick={() => go(n.key)}>
              {n.icon}<span>{n.key}{n.hold && <Hold />}</span>
              {n.key === '알림 메시지함' && unread > 0 && <b className="dw-badge nav">{badge(unread)}</b>}
            </button>)}
            <div className="cu-nav-section">병원 홍보</div>
            <button className="cu-nav-row" onClick={() => setDialog({ type: 'notice', title: '병원 검색 정보' })}><span>병원 검색 정보</span><VscChevronRight /></button>
            <div className="cu-nav-section">외부 플랫폼 연동</div>
            <button className="cu-nav-row" onClick={() => setDialog({ type: 'notice', title: '카카오톡 예약하기' })}><span>카카오톡 예약하기</span><VscChevronRight /></button>
            <div className="cu-nav-bottom"><span>환자 메뉴 미제공 (법률 검토)</span><button onClick={() => setDialog({ type: 'notice', title: '이용가이드' })}>이용가이드</button></div>
          </aside>
          <main className="cn-main cu-main">
            <header className="cn-header cu-header">
              <div><h1 className="cn-title" tabIndex={-1}>{title}{menu === '진료내역' && <Hold />}</h1><p className="cn-desc">{DESC[menu]}</p></div>
              {menu === '진료 현황' && <div className="dw-head-actions"><span className="dw-hold-inline"><Hold /></span><button className="cu-btn primary" disabled={!rooms.length} title={!rooms.length ? '진료실이 있어야 등록할 수 있어요' : undefined} onClick={() => { setError(''); setRegTried(false); setReg({ room: rooms[0]?.name || '', date: TODAY, time: '', name: '', phone: '' }); setDialog({ type: 'register' }); }}><VscAdd />예약 등록</button></div>}
              {menu === '진료실' && !linked && <button className="cu-btn primary" onClick={() => openRoomForm()}><VscAdd />새 진료실</button>}
              {['대시보드', '진료내역', '알림 메시지함'].includes(menu) && <button className="cu-btn quiet" onClick={() => { setLoading(true); notify('서버에서 다시 불러왔어요 (모의).'); }}><VscRefresh />새로고침</button>}
            </header>
            {serverBanner}
            <div className="cu-content">
              {menu === '대시보드' && dashboard()}
              {menu === '진료 현황' && status()}
              {menu === '진료내역' && history()}
              {menu === '진료실' && roomsPage()}
              {menu === '진료항목' && itemsPage()}
              {menu === '진료실 운영 설정' && opPage()}
              {menu === '알림 메시지함' && notiPage()}
            </div>
          </main>
        </div>
        <div className="cu-statusbar"><span><span className={'cu-dot ' + (serverDown ? 'warn' : '')} />{serverDown ? '서버 연결 끊김' : '서버 연결됨'} · {connection}</span><span>트레이 웹뷰 · 제품키 인증됨 (시안)</span><span>{fmtFull(TODAY)}</span></div>
      </div> : <div className="dw-closed" role="status"><ConnectIcon /><strong>커넥트는 트레이에 남아 있어요</strong><span>아래 작업표시줄의 커넥트 트레이 아이콘을 눌러 다시 열 수 있어요.</span><button className="cu-btn primary" onClick={() => setClosed(false)}>커넥트 열기</button></div>}

      <div className="dw-taskbar" aria-label="작업표시줄 (시안)">
        <span className="dw-taskbar-label">병원 PC · 작업표시줄 시안</span>
        <div className="dw-tray-area">
          <button className={'dw-tray-btn ' + (tray ? 'selected' : '')} aria-label="커넥트 트레이 메뉴 (우클릭 메뉴)" title="굿닥 커넥트 · 클릭/우클릭" aria-expanded={tray} onClick={() => setTray(!tray)} onContextMenu={e => { e.preventDefault(); setTray(true); }}>
            <ConnectIcon />{unread > 0 && <b className="dw-badge tray">{badge(unread)}</b>}
          </button>
          <span className="dw-clock">오전 9:41<br />2026-10-06</span>
          {tray && <div className="cu-tray-menu dw-tray-menu" role="menu">
            <div className="cu-tray-menu-title"><ConnectIcon /><strong>굿닥 커넥트</strong></div>
            <button role="menuitem" onClick={() => { setClosed(false); setTray(false); }}>커넥트 열기</button>
            <button role="menuitem" onClick={() => { go('알림 메시지함'); setTray(false); }}><VscInbox />알림 메시지함{unread > 0 && <b className="dw-badge inline">{badge(unread)}</b>}</button>
            <button role="menuitem" onClick={() => { openSettings(); setTray(false); }}><VscSettingsGear />환경설정</button>
            <hr />
            <button role="menuitem" onClick={() => { setClosed(true); setTray(false); }}>창 닫기</button>
          </div>}
        </div>
      </div>
    </div>


    {toast && <div className={'cu-toast ' + (toast.tone === 'fail' ? 'dw-toast-fail' : '')} role={toast.tone === 'fail' ? 'alert' : 'status'}>{toast.tone === 'fail' ? <VscWarning /> : <VscCheck />}{toast.text}</div>}

    {/* ───── 모달 ───── */}
    {dialog?.type === 'detail' && chosen && detailModal(chosen, !!dialog.edit && ACTIVE.includes(chosen.state))}

    {dialog?.type === 'action' && chosen && <Modal title={dialog.act === 'visit' ? '내원확정 처리할까요?' : '진료완료 처리할까요?'} busy={busy} onClose={() => { if (!busy) backFrom(chosen.id, dialog.from); }} footer={<><button className="cu-btn" disabled={busy} onClick={() => backFrom(chosen.id, dialog.from)}>취소</button><button className="cu-btn primary" disabled={busy || !ACTIVE.includes(chosen.state)} onClick={() => doAction(chosen, dialog.act, dialog.from)}>{busy ? '처리 중…' : error ? '다시 시도' : '확인'}</button></>}>
      <div className="cu-detail-card"><strong>{chosen.name} · {chosen.kind}</strong><p>{fmtFull(chosen.date)} {chosen.time} · {chosen.room === '—' ? chosen.item : chosen.room}</p></div>
      <p>{dialog.act === 'visit' ? '환자가 병원에 도착했음을 확인하고 내원확정으로 바꿔요. 웹에서는 내원확정을 되돌릴 수 없어요.' : '실제 진료가 끝났는지 확인한 뒤 처리해 주세요. 진료완료 후에는 상태를 바꿀 수 없어요.'}</p>
      {dialog.act === 'visit' && <p className="cu-subnote">데스크는 체크박스를 누르면 바로 처리되지만, 웹에서는 오탭을 막기 위해 한 번 더 확인해요.</p>}
      {failHint}{errorBox}
    </Modal>}

    {dialog?.type === 'cancel' && chosen && <Modal title="예약 취소 사유를 선택해 주세요" busy={busy} onClose={() => { if (!busy) backFrom(chosen.id, dialog.from); }} footer={<><button className="cu-btn" disabled={busy} onClick={() => backFrom(chosen.id, dialog.from)}>닫기</button><button className="cu-btn danger" disabled={busy || !ACTIVE.includes(chosen.state)} onClick={() => doCancel(chosen, dialog.from)}>{busy ? '처리 중…' : error ? '다시 시도' : '예약 취소'}</button></>}>
      <p className="cu-cancel-context">{chosen.name} · {chosen.kind === '진료항목 예약' ? chosen.item : chosen.purpose}<br />{fmtFull(chosen.date)} {chosen.time}</p>
      <div className="cu-radio-list" role="radiogroup" aria-label="취소 사유">{REASONS.map(s => <label key={s}><input name="reason" type="radio" value={s} checked={reason === s} disabled={busy} onChange={() => setReason(s)} />{s}</label>)}</div>
      <p className="cu-inline-note"><VscInfo />선택한 사유는 병원취소 사유로 저장되고 환자에게 취소 안내가 발송돼요. 데스크는 사유 없이 ‘병원취소’로만 저장해요.</p>
      {failHint}{errorBox}
    </Modal>}

    {dialog?.type === 'register' && <Modal title={<>예약 등록 <Hold /></>} busy={busy} onClose={close} footer={<><button className="cu-btn" disabled={busy} onClick={close}>취소</button><button className="cu-btn primary" disabled={busy} onClick={submitRegister}>{busy ? '처리 중…' : error && error !== DUP_MSG ? '다시 시도' : '등록'}</button></>}>
      <div className="dw-hold-bar"><Hold />웹 예약 등록 제공 여부는 PO 확인 중이에요. 환자 메뉴가 없어 환자 검색 없이 이름·연락처만 입력해요.</div>
      <div className="dw-form-grid">
        <label className="cu-form-label"><span>진료실 <b className="dw-req">*</b></span><select aria-label="진료실" value={reg.room} onChange={e => setReg(o => ({ ...o, room: e.target.value }))}><option value="">선택해 주세요</option>{rooms.map(x => <option key={x.id}>{x.name}</option>)}</select>{regTried && !reg.room && <em className="dw-field-err">진료실을 선택해 주세요.</em>}</label>
        <label className="cu-form-label"><span>예약일 <b className="dw-req">*</b></span><input type="date" aria-label="예약일" min={TODAY} value={reg.date} onChange={e => setReg(o => ({ ...o, date: e.target.value }))} />{regTried && !reg.date && <em className="dw-field-err">예약일을 선택해 주세요.</em>}{regTried && regPast && <em className="dw-field-err">오늘 이후 날짜를 선택해 주세요.</em>}</label>
        <label className="cu-form-label"><span>예약 시간 <b className="dw-req">*</b></span><select aria-label="예약 시간" value={reg.time} onChange={e => setReg(o => ({ ...o, time: e.target.value }))}><option value="">선택해 주세요</option>{TIMES.map(t => <option key={t} value={t} disabled={reg.date === TODAY && t <= NOW}>{t}{reg.date === TODAY && t <= NOW ? ' (지난 시간)' : ''}</option>)}</select>{regTried && !reg.time && <em className="dw-field-err">예약 시간을 선택해 주세요.</em>}{regTried && regPastTime && <em className="dw-field-err">이미 지난 시간이에요. 현재({NOW}) 이후 시간을 선택해 주세요.</em>}</label>
        <label className="cu-form-label"><span>환자 이름 <b className="dw-req">*</b></span><input aria-label="환자 이름" maxLength={20} placeholder="예) 김○○" value={reg.name} onChange={e => setReg(o => ({ ...o, name: e.target.value }))} />{regTried && !reg.name.trim() && <em className="dw-field-err">환자 이름을 입력해 주세요.</em>}</label>
        <label className="cu-form-label dw-span2"><span>연락처 <b className="dw-req">*</b></span><input aria-label="연락처" maxLength={13} placeholder="010-0000-0000 · 실제 번호는 입력하지 마세요" value={reg.phone} onChange={e => setReg(o => ({ ...o, phone: e.target.value }))} />{regTried && !regPhoneOk && <em className="dw-field-err">연락처를 10자리 이상 입력해 주세요.</em>}</label>
      </div>
      {dupSample && <button className="cu-btn quiet dw-fill" type="button" onClick={() => { setError(''); setReg({ room: dupSample.room === '—' ? (rooms[0]?.name || '') : dupSample.room, date: dupSample.date, time: '16:30', name: dupSample.name, phone: dupSample.phone }); }}><VscBeaker />중복 체험 값 채우기 (오늘 예약이 있는 {dupSample.name})</button>}
      <p className="cu-subnote">같은 날 같은 환자(이름·연락처)의 진행 중 예약이 있으면 등록할 수 없어요. 지난 날짜·시간(현재 {NOW})은 고를 수 없어요. 등록 건은 바로 ‘예약확정’으로 저장돼요.</p>
      {failHint}{errorBox}
    </Modal>}

    {dialog?.type === 'roomDetail' && chosenRoom && <Modal title={chosenRoom.alias || chosenRoom.name} wide onClose={close} busy={busy} footer={<><button className="cu-btn" onClick={close}>닫기</button>{!linked && <div className="dw-detail-actions"><button className="cu-btn dw-danger-line" onClick={() => { setError(''); setDialog({ type: 'roomDelete', id: chosenRoom.id }); }}><VscTrash />삭제</button><button className="cu-btn primary" onClick={() => openRoomForm(chosenRoom)}><VscEdit />정보 수정</button></div>}</>}>
      <div className="cu-detail-heading"><span>{chosenRoom.name} ∙ {chosenRoom.dept} ∙ 담당 의사 {chosenRoom.doctors.join(', ')}</span>{activeIn(chosenRoom) > 0 && <span className="cu-tag blue">진행 중 {activeIn(chosenRoom)}건</span>}</div>
      {linked && <p className="cu-inline-note"><VscInfo />연동 차트 병원은 진료실 이름·진료과·담당 의사를 차트에서 관리해요.</p>}
      {([['onsite', '현장 접수', '병원 운영시간 동안 굿닥 태블릿으로 현장 접수를 받아요.'], ['remote', '원격 접수', '굿닥 앱에서 병원에 오기 전에 접수를 받아요.'], ['appt', '예약', '굿닥 앱·카카오톡에서 진료 예약을 받아요.']] as const).map(([k, l, d]) => (
        <div className="dw-svc-section" key={k}>
          <div><strong>{l}</strong><span className={'dw-svc ' + (chosenRoom.svc[k] ? 'on' : '')}>{chosenRoom.svc[k] ? '운영중' : '사용중지'}</span><p>{d}</p></div>
          <button className={'cu-toggle ' + (chosenRoom.svc[k] ? 'on' : '')} aria-label={`${chosenRoom.name} ${l}`} aria-pressed={chosenRoom.svc[k]} onClick={() => toggleSvc(chosenRoom, k)}><span /></button>
        </div>
      ))}
      <p className="cu-subnote">기존 웹 진료실 상세의 축약 재현이에요. 운영 스케줄·내원목적·안내문구 설정은 생략했어요.</p>
    </Modal>}

    {dialog?.type === 'roomForm' && <Modal title={dialog.id ? '진료실 정보 수정' : '새 진료실'} busy={busy} onClose={() => { if (!busy) { setError(''); setDialog(dialog.id ? { type: 'roomDetail', id: dialog.id } : null); } }} footer={<><button className="cu-btn" disabled={busy} onClick={() => { setError(''); setDialog(dialog.id ? { type: 'roomDetail', id: dialog.id } : null); }}>취소</button><button className="cu-btn primary" disabled={busy} onClick={submitRoom}>{busy ? '처리 중…' : error ? '다시 시도' : '저장'}</button></>}>
      <label className="cu-form-label"><span>진료실 이름 <b className="dw-req">*</b></span><input aria-label="진료실 이름" maxLength={20} value={roomForm.name} onChange={e => setRoomForm(o => ({ ...o, name: e.target.value }))} />{roomTried && !roomForm.name.trim() && <em className="dw-field-err">진료실 이름을 입력해 주세요.</em>}{roomNameDup && <em className="dw-field-err">같은 이름의 진료실이 이미 있어요.</em>}</label>
      <label className="cu-form-label">환자에게 보일 이름 (선택)<input aria-label="환자에게 보일 이름" maxLength={20} placeholder="비우면 진료실 이름으로 보여요" value={roomForm.alias} onChange={e => setRoomForm(o => ({ ...o, alias: e.target.value }))} /></label>
      <label className="cu-form-label"><span>진료과 <b className="dw-req">*</b></span><input aria-label="진료과" maxLength={20} placeholder="예) 내과" value={roomForm.dept} onChange={e => setRoomForm(o => ({ ...o, dept: e.target.value }))} />{roomTried && !roomForm.dept.trim() && <em className="dw-field-err">진료과를 입력해 주세요.</em>}</label>
      <div className="cu-form-label"><span>담당 의사 <b className="dw-req">*</b> <small className="dw-muted">텍스트 입력 · 여러 명 가능</small></span>
        {roomForm.doctors.map((d, i) => <div className="dw-doctor-row" key={i}>
          <input aria-label={`담당 의사 ${i + 1}`} maxLength={20} placeholder="의사 이름" value={d} onChange={e => setRoomForm(o => ({ ...o, doctors: o.doctors.map((y, j) => j === i ? e.target.value : y) }))} />
          <button className="cu-icon" aria-label={`담당 의사 ${i + 1} 삭제`} disabled={roomForm.doctors.length === 1} onClick={() => setRoomForm(o => ({ ...o, doctors: o.doctors.filter((_, j) => j !== i) }))}><VscTrash /></button>
        </div>)}
        <button className="cu-btn quiet dw-add-doctor" disabled={roomForm.doctors.length >= 5} onClick={() => setRoomForm(o => ({ ...o, doctors: [...o.doctors, ''] }))}><VscAdd />의사 추가 (최대 5명)</button>
        {roomTried && !roomForm.doctors.some(x => x.trim()) && <em className="dw-field-err">담당 의사를 한 명 이상 입력해 주세요.</em>}
      </div>
      <p className="cu-subnote">진료과·담당 의사는 데스크와 같은 텍스트 규격이에요. 진료실 수정 정책은 데스크와 동일하게 적용돼요.</p>
      {failHint}{errorBox}
    </Modal>}

    {dialog?.type === 'roomDelete' && chosenRoom && (activeIn(chosenRoom) > 0
      ? <Modal title="진료실을 삭제할 수 없어요" onClose={() => setDialog({ type: 'roomDetail', id: chosenRoom.id })} footer={<><button className="cu-btn" onClick={() => setDialog({ type: 'roomDetail', id: chosenRoom.id })}>닫기</button><button className="cu-btn primary" onClick={() => { setDialog(null); go('진료 현황'); setTab('진행 중'); setDateMode('전체 기간'); setChip(''); setSearch(''); setRoomFilter(chosenRoom.name); }}>진행 중인 건 보기</button></>}>
          <p>{chosenRoom.name}에 진료가 진행 중인 건이 <strong>{activeIn(chosenRoom)}건</strong> 있어요. 모두 진료완료하거나 취소한 뒤 삭제해 주세요.</p>
        </Modal>
      : <Modal title="진료실을 삭제할까요?" busy={busy} onClose={() => { if (!busy) { setError(''); setDialog({ type: 'roomDetail', id: chosenRoom.id }); } }} footer={<><button className="cu-btn" disabled={busy} onClick={() => { setError(''); setDialog({ type: 'roomDetail', id: chosenRoom.id }); }}>취소</button><button className="cu-btn danger" disabled={busy} onClick={() => deleteRoom(chosenRoom)}>{busy ? '처리 중…' : error ? '다시 시도' : '삭제'}</button></>}>
          <div className="cu-detail-card"><strong>{chosenRoom.name}</strong><p>{chosenRoom.dept} ∙ {chosenRoom.doctors.join(', ')}</p></div>
          <p className="cu-inline-note dw-warn-note"><VscWarning />삭제하면 굿닥 서비스·외부 플랫폼 연동이 자동 해지됩니다. 삭제된 정보는 되돌릴 수 없으니 유의해 주세요.</p>
          {failHint}{errorBox}
        </Modal>)}

    {dialog?.type === 'settings' && <Modal title="프로그램 환경설정" className="dw-settings" onClose={() => { if (!keyConfirm) setDialog(null); }} footer={<><span className="dw-draft-note">{JSON.stringify(cfgDraft) !== JSON.stringify(cfg) ? '적용하지 않은 변경이 있어요 · 닫으면 버려져요' : '변경 사항 없음'}</span><button className="cu-btn" onClick={() => setDialog(null)}>취소</button><button className="cu-btn primary" onClick={() => { setCfg(cfgDraft); setDialog(null); notify('이 PC의 환경설정을 적용했어요.'); }}>적용</button></>}>
      <p className="dw-window-note">별도 창 · 타이틀바 톱니 또는 트레이 우클릭 → 환경설정으로 열려요. 웹 좌측 메뉴에는 없어요.</p>
      <h3 className="cu-detail-label">제품키</h3>
      <div className="dw-key"><VscKey /><div><strong>GDK-****-****-7F2A</strong><p>이 PC는 제품키로 인증돼 트레이 웹뷰가 열려요.</p></div><button className="cu-btn dw-danger-line" onClick={() => setKeyConfirm(true)}>제품키 해제</button></div>
      <h3 className="cu-detail-label">실행</h3>
      <div className="cu-setting-row"><div><strong>윈도우 시작 시 자동 실행</strong><p>PC를 켜면 커넥트가 트레이에서 자동으로 실행돼요.</p></div><button className={'cu-toggle ' + (cfgDraft.autoStart ? 'on' : '')} aria-label="윈도우 시작 시 자동 실행" aria-pressed={cfgDraft.autoStart} onClick={() => setCfgDraft(o => ({ ...o, autoStart: !o.autoStart }))}><span /></button></div>
      <div className="cu-setting-row"><div><strong>주민번호 7자리 표시 <Hold /></strong><p>환자 주민번호를 뒷자리 첫 글자까지 보여 줘요. 웹 화면 반영 범위는 확인 중이에요.</p></div><button className={'cu-toggle ' + (cfgDraft.rrn7 ? 'on' : '')} aria-label="주민번호 7자리 표시" aria-pressed={cfgDraft.rrn7} onClick={() => setCfgDraft(o => ({ ...o, rrn7: !o.rrn7 }))}><span /></button></div>
      <h3 className="cu-detail-label">알림 <small className="dw-pc">PC별 설정</small></h3>
      <div className="cu-setting-row"><div><strong>새 예약 알림</strong><p>새 예약이 들어오면 이 PC에 윈도우 알림을 띄워요.</p></div><button className={'cu-toggle ' + (cfgDraft.newAppt ? 'on' : '')} aria-label="새 예약 알림" aria-pressed={cfgDraft.newAppt} onClick={() => setCfgDraft(o => ({ ...o, newAppt: !o.newAppt }))}><span /></button></div>
      <div className="cu-setting-row"><div><strong>환자 도착 알림</strong><p>예약 환자가 도착하면 이 PC에 윈도우 알림을 띄워요.</p></div><button className={'cu-toggle ' + (cfgDraft.arrival ? 'on' : '')} aria-label="환자 도착 알림" aria-pressed={cfgDraft.arrival} onClick={() => setCfgDraft(o => ({ ...o, arrival: !o.arrival }))}><span /></button></div>
      <p className="cu-subnote">알림 켜기·끄기는 PC마다 따로 저장돼요. 알림 메시지함의 기록은 서버 기준이라 설정과 상관없이 쌓여요.</p>
      <h3 className="cu-detail-label">차트 연결</h3>
      <div className="dw-key"><span className={'cu-dot ' + (serverDown ? 'warn' : '')} /><div><strong>{linked ? '연동 차트 예시 · 연결됨' : '데스크(굿닥)'}</strong><p>{linked ? '연동 차트는 차트 설정에서 관리해요 (체험).' : '데스크 차트 병원은 차트가 ‘데스크(굿닥)’로 고정돼 바꿀 수 없어요.'}</p></div></div>
    </Modal>}

    {keyConfirm && <Modal title="제품키를 해제할까요?" busy={keyBusy} onClose={() => setKeyConfirm(false)} footer={<><button className="cu-btn" disabled={keyBusy} onClick={() => setKeyConfirm(false)}>취소</button><button className="cu-btn danger" disabled={keyBusy} onClick={async () => { setKeyBusy(true); await wait(600); setKeyBusy(false); setKeyConfirm(false); if (serverDown || failSim) { fail(serverDown ? '굿닥 서버에 연결할 수 없어 제품키를 해제하지 못했어요. 상태는 그대로예요.' : '제품키를 해제하지 못했어요(모의 실패). 상태는 그대로예요.'); return; } notify('제품키 해제를 모의 처리했어요. 실제로는 인증 화면으로 돌아가요(시안에선 생략).'); }}>{keyBusy ? '처리 중…' : '해제'}</button></>}>
      <p>해제하면 이 PC에서 커넥트를 다시 쓰려면 제품키를 입력해야 해요. 다른 PC와 병원 데이터에는 영향이 없어요.</p>
    </Modal>}

    {dialog?.type === 'notice' && <Modal title={dialog.title} onClose={close} footer={<button className="cu-btn primary" onClick={close}>확인</button>}>
      {dialog.title === '이용가이드' ? <ol className="cu-guide">
        <li><strong>대시보드</strong> 타일을 눌러 오늘 신청·완료·취소 건으로 바로 이동해요.</li>
        <li><strong>진료 현황</strong>에서 내원 체크 → 확인 모달, 행 더보기(⋮)로 내원확정·진료완료·예약취소를 처리해요.</li>
        <li>행을 누르면 예약 상세에서 진료정보(내원목적·기타·진료메모)를 수정할 수 있어요.</li>
        <li><strong>타이틀바 톱니</strong> 또는 <strong>트레이 아이콘</strong>으로 프로그램 환경설정을 열어요.</li>
        <li>상단 바의 <strong>체험 설정</strong>으로 연동/비연동, 진료실 0개, 저장 실패, 서버 오류를 바꿔 봐요.</li>
      </ol> : <p>시안에서는 내용을 생략했어요. 기존 커넥트 웹뷰의 메뉴 위치만 보여 줍니다.</p>}
      <p className="cu-subnote">가상 검토용 · 실제 환자정보를 입력하지 마세요.</p>
    </Modal>}
  </div>;
}
