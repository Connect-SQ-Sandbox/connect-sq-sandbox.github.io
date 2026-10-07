/**
 * ┌─ 프로토타입 컨텍스트 ───────────────────────────────────
 * 이름     : desk-web — 굿닥 데스크(Windows 프로그램) 기능을 커넥트 웹뷰 UI로 옮긴 웹 이관 시안
 * 상태     : 현행(active) · 검토용 시안(미승인)   버전: v0.11  최종수정: 2026-10-06
 * PRD      : 내부 기획 문서(공개 저장소라 티켓 번호·링크·원문 미기재)
 * 배포URL  : https://connect-sq-sandbox.github.io/out/desk-web.html — v0.3 배포됨, 이후 버전 미배포
 * 피그마   : 사내 파일(공개 저장소라 파일명·URL·노드 ID 미기재) · 진료실 설정 목록·상세 · 반영 값과 노드는 figma/baseline.md 참조(기준선 2026-10-06)
 * 관련 CSS : styles/connectUnified.css(재사용, cu-*) + styles/deskWeb.css(이 화면 전용, dw-*)
 * 관련 소스: ./examRooms.tsx (진료실 목록·순서·미사용·상세·접수/예약 스케줄, 진료실 운영 설정)
 * 기술제약 : react 훅만 · plain CSS · react-icons(vsc) · 가상 데이터 · 브라우저 메모리 상태 · 네트워크 0
 *
 * 화면구성 :
 *   ① 상단 프로토 바(메타): 판단 메모 보기 토글 · 판단 메모 n건 드로어 · 체험 설정 띠 · 초기화
 *   ② 커넥트 창(타이틀바 톱니·종 배지·창 버튼) — 좌측 메뉴 + 웹뷰 본문 + 상태바
 *   ③ 하단 슬림 작업표시줄의 커넥트 트레이 아이콘(클릭·우클릭 → 커넥트 열기/알림 메시지함/환경설정/창 닫기)
 *   ④ 웹 메뉴: 대시보드 / 진료 현황 / 진료내역[보류] / 진료실 / 진료항목 / 진료실 운영 설정 / 알림 메시지함
 *   ⑤ 판단 메모 핀(보라 원형 번호, 프로토 메타): PO 확인이 필요한 제안·PD 판단 지점마다 표시, 팝오버로 제안·근거·대안
 *
 * 핵심 결정 (why):
 *   [확정·PO] 웹은 굿닥 서버 데이터를 바라보고, 데스크와 동일하게 진료 건 상태를 바꾼다.
 *   [확정·PO 2026-10-07] 데스크 = 비연동, EMR 연동은 선택. 차트 모드는 '비연동 · 굿닥에서 관리'(기본) / 'EMR 연동' 2가지.
 *   [확정·PO] 하반기 범위는 기존 데스크를 쓰던 병원(= 비연동). 기본 체험값도 '비연동 · 굿닥에서 관리'.
 *   [제외·PO] 환자 메뉴는 웹에 노출하지 않는다(법률 검토). 예약 등록도 환자 DB 검색 없이 이름·연락처 입력만.
 *   [확정·PO] 서버 기준 알림 메시지함. 좌측 메뉴·타이틀바 종에 미읽음 배지, 99 초과는 '99+'.
 *   [확정·PO] 진료실 운영 설정·스케줄은 연동/비연동 공통으로 웹에서 전부 가능. 차이는 둘뿐:
 *             비연동 = 진료실 생성·수정·삭제 + 진료과·의사 텍스트 입력, 연동 = 진료실 자체는 '차트에서 관리'(수정 불가).
 *   [확정·PD] 비연동 병원은 진료실 필수 아님 — 0개는 정상 상태(진료항목 예약만 운영 가능).
 *   [현행 유지] 차트 모드 분기 근거: 접수는 차트 연결(브릿지)이 없으면 서버가 거절, 예약은 차트 연결 없이도 진행(환자 조회는 굿닥 DB 대체).
 *             비연동 = 태블릿 접수 묶음·차례 알림 비활성, 재진만 받기 끔 고정, 현장·원격 접수 섹션 사용불가, 카카오는 예약만 연동.
 *             EMR 연동 = 차트 기능값 기준('차트 기능 제한'·'차트 진료실 없음' 체험은 EMR 연동에서만).
 *             서버가 차트 응답을 대신해 비연동도 접수를 제공할지는 미정(판단 메모 19).
 *   [현행 유지] 진료실 관리·순서·미사용·상세(현장/원격/예약 섹션, 안내 문구, 내원 목적, 카카오 연동, 임시 진료 마감)·
 *             접수 스케줄·예약 스케줄(일정 그룹·고급 설정)·진료실 운영 설정 문구와 노출 조건은 현행 커넥트 웹뷰를 옮김.
 *   [현행 유지] 진료항목 예약 설정(예약 받기·자동 확정·당일 예약·새 예약 알림)과 노출 0개 차단·카카오 자동 확정 끄기 확인.
 *   [유지·자체] 진료항목 예약은 '확정 필요 → 예약확정 → 진료완료/취소', 진료실 예약은 즉시 '예약확정'(데스크 현행). 내원확정은 진료실 예약만.
 *   [유지·자체] 내원 체크 확인 모달(데스크는 즉시 처리), 실패를 성공으로 표시하지 않음(데스크 무조건 성공 토스트 버그 수정).
 *   [유지·자체] 현행 웹에 없는 검증·힌트 문구(접수 인원 하한, 지난 시간 등록 불가, 건너뛴 날·남긴 블록 개수, 숫자만 입력, '해당 없음',
 *             '그룹 없음(기존 예약 보존)', 카카오 연동 중 고급 전환 차단, 진료실 없음 안내 등)는 시안 판단으로 추가. 오류는 현행처럼 첫 번째 하나만 표시.
 *   [제안·PO확인] 예약 취소 사유 모달: 현행과 달리 처음엔 사유를 고르지 않은 상태, 고르기 전 [예약 취소] 비활성, 버튼 문구 '예약 취소'(판단 메모 6).
 *   [제안·PO확인] 운영 중 판정(환자가 실제로 예약 가능한 조건 기준) · 끈 유형의 진행 중 건 계속 처리 · 진료항목 예약은 진료실
 *             배정 없이 진료완료 · 시간 기준 불일치는 안내·경고만 · 같은 날·같은 시간 중복은 표시만 · 취소 사유 유형별 필터·필수 ·
 *             카카오 연동/노출은 각 위치 유지 + 끌 때 영향 안내. 화면의 판단 메모 핀 1~29번에 제안·근거·대안을 적어 둠.
 *
 * 보류 · TODO (PO 확인 대기):
 *   [보류] 예약 등록(웹에서 병원이 직접 등록) 제공 여부·필수 항목.
 *   [보류] 진료내역(종료 건 조회) 메뉴 제공 여부.
 *   [보류] 환자 정보 표시 범위(주민번호·주소). 환경설정의 '주민번호 7자리 표시' 웹 반영 여부.
 *   [보류] 자동 종료 안내를 접수·진료실 예약에도 표시할지(내부 정책: 자동 종료) 범위 확인 중.
 *   [보류] 알림 메시지함 규격: 읽음 단위(병원/PC), 보관 기간(시안 30일), 알림 종류.
 *   TODO  진료완료 건의 차트 반영 규격, 진료실 삭제 시 연동 해지 대상 목록 확정 후 문구 갱신.
 *
 * 변경 이력:
 *   v0.1  2026-10-06 — 최초 작성. connect-unified 셸·테이블·모달 패턴 재사용, 데스크 기능 9종 웹 이관 시안.
 *   v0.2  2026-10-06 — QA 반영: 토스트 톤 분리, 즉시 저장 실패 처리, ⋮ fixed, 0개 일관화, 체험 띠, 환경설정 draft 등.
 *   v0.3  2026-10-06 — 2차 QA 반영: 모달 스택·포커스 복귀, 모달 중 체험 띠 비활성, 예약 등록 과거 일시 차단, ⋮ 실측, sticky 열.
 *   v0.4  2026-10-06 — 진료실 메뉴를 현행 커넥트 웹뷰 수준으로 재구성(목록·순서·미사용·상세·접수/예약 스케줄·운영 설정),
 *                      진료실/진료항목 예약 분리(유형별 상태·액션·필터·열, 진료항목 예약 설정), 비연동 진료실 없음 = 정상 상태.
 *   v0.5  2026-10-06 — PO 결정 대기 항목을 제안안으로 구현하고 판단 메모 핀·드로어(17건) 추가.
 *   v0.6  2026-10-06 — 운영 설정·진료실 상세·카카오 연동 설정을 차트 모드(데스크 차트 병원 기본 / 비연동 / 연동 차트)별로 분기, 판단 메모 18~25 추가.
 *   v0.12 2026-10-07 — 차트 모드 3→2 통합(데스크 차트 병원 + 비연동 → '비연동 · 굿닥에서 관리', 연동 차트 → 'EMR 연동'), 비연동 규칙으로 일원화, 환경설정 'EMR 연동하기' 안내, 판단 메모 19·21 교체(비연동 접수·차례 알림 / 재진만 받기), 화면 문구에서 '데스크 차트 병원' 제거.
 *   v0.11 2026-10-06 — 검수 반영: 피그마 버튼 타이포 우선순위 수정, 판단 메모 이동 조건 명시·이동 전 스냅샷 복원, 차트 진료실 없음 읽기 전용 완성, 프리셋 '사용자 정의' 표시, 소스·빌드에서 피그마 노드 ID 제거, 미사용 코드 정리.
 *   v0.10 2026-10-06 — 진료실 관리 목록·상세를 피그마에 맞춤(2열 카드·배지, 헤더·서비스 카드 운영상태 변형·설정 행·Bottom Bar 이전), 카카오 연동을 '페이지로 이동' 버튼으로 변경(판단 메모 29), 차트 진료실 없음 체험 추가.
 *   v0.9  2026-10-06 — 운영 유형 프리셋 4종(둘 다 / 진료실 예약만 / 진료항목 예약만 / 진료실 예약 운영 중지)으로 분리, 프리셋·차트 모드 기준으로 데이터 재구성, 판단 메모 26~28 추가.
 *   v0.8  2026-10-06 — 재검수 반영: 운영 설정 저장값을 상위로 올려 메뉴 이동 후 유지, 판단 메모 이동 시 스크롤 후 팝오버 유지, 직접 바꾼 체험 조건은 메모 되돌리기에서 제외, 진료 현황 첫 화면 밀도 개선.
 *   v0.7  2026-10-06 — 검수 반영: 순서 화면 크래시 수정·최상위 오류 화면, 스케줄 등록 날짜 기준 수정·부분 저장 안내·접수 있는 블록 보존, 판단 메모 팝오버 화면 경계 배치, 체험 띠 1줄화 등.
 * └──────────────────────────────────────────────────────
 */
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  VscAdd, VscBell, VscCalendar, VscCheck, VscCheckAll, VscChevronRight, VscChromeClose, VscChromeMaximize,
  VscChromeMinimize, VscChromeRestore, VscDashboard, VscEdit, VscError, VscHistory, VscInbox, VscInfo, VscKebabVertical,
  VscListFlat, VscOrganization, VscRefresh, VscSearch, VscSettingsGear, VscWarning, VscBeaker, VscKey, VscComment, VscTrash
} from 'react-icons/vsc';
import { ExamRooms, OperationPage, seedRooms, seedInvalid, newRoom, Room, Invalid, View, Kit, ChartMode, svcSupported, CHART_NAME, OP0, VISIT_PATHS_DEFAULT, AutoRow } from './examRooms';

const LOGO = require('../../../assets/curation-price/goodoc-logo.svg');

/* ───────── 타입 · 상수 ───────── */
type Kind = '진료실 예약' | '진료항목 예약';
type State = '확정 필요' | '예약확정' | '내원확정' | '진료완료' | '병원취소' | '환자취소' | '자동 종료';
type Rec = {
  id: string; kind: Kind; name: string; phone: string; birth: string; date: string; time: string; created: string;
  room: string; item: string; price: string; purpose: string; etc: string; memo: string; state: State; reason?: string; closed?: string; channel: string;
};
type Noti = { id: string; type: '새 예약' | '환자 도착' | '진료항목 예약'; text: string; at: string; read: boolean; rec: string };
type Act = 'visit' | 'complete' | 'confirm';
type Dialog =
  | { type: 'detail'; id: string; edit?: boolean }
  | { type: 'action'; id: string; act: Act; from: 'list' | 'detail' }
  | { type: 'cancel'; id: string; from: 'list' | 'detail' }
  | { type: 'register' }
  | { type: 'roomForm'; id?: string }
  | { type: 'roomDelete'; id: string }
  | { type: 'settings' }
  | { type: 'notice'; title: string }
  | { type: 'kakao' } | { type: 'tStop' } | { type: 'tStart' } | { type: 'tAutoOff' } | { type: 'tLastHide'; index: number };

const TODAY = '2026-10-06';
const NOW = '09:41';
const ACTIVE: State[] = ['확정 필요', '예약확정', '내원확정'];
const CLOSED: State[] = ['진료완료', '병원취소', '환자취소', '자동 종료'];
const REASONS_ALL = ['일정 불가', '담당 의료진 부재', '진료항목 확인 필요', '환자 정보 확인 필요', '기타 병원 사정'];
const reasonsFor = (k: Kind) => REASONS_ALL.filter(x => k === '진료항목 예약' || x !== '진료항목 확인 필요');
const TAG: Record<State, string> = { '확정 필요': 'orange', '예약확정': 'blue', '내원확정': 'teal', '진료완료': 'green', '병원취소': 'red', '환자취소': 'red', '자동 종료': 'gray' };
const PAGE_SIZE = 8;
const TIMES = Array.from({ length: 18 }, (_, i) => `${String(9 + Math.floor(i / 2)).padStart(2, '0')}:${i % 2 ? '30' : '00'}`);
const DUP_MSG = '이미 같은 환자의 예약이 있어요.';
const HOLIDAYS: Record<string, string> = { '2026-10-03': '개천절', '2026-10-09': '한글날' };
const AUTO_REASON = '방문 예정 시각이 지나고 결과가 확인되지 않은 건이라 자동 종료됐어요.';

const r = (o: Partial<Rec> & Pick<Rec, 'id' | 'name' | 'phone' | 'date' | 'time' | 'state'>): Rec => ({
  kind: '진료실 예약', birth: '19**.**.**', created: o.date, room: '1진료실', item: '—', price: '—', purpose: '재진', etc: '', memo: '', channel: '굿닥 앱', ...o
});
const t = (o: Partial<Rec> & Pick<Rec, 'id' | 'name' | 'phone' | 'date' | 'time' | 'state' | 'item' | 'price'>): Rec => r({ kind: '진료항목 예약', room: '—', purpose: '', ...o });
const BASE: Rec[] = [
  r({ id: 'D001', name: '김○○', phone: '010-****-2101', birth: '1979.**.**', date: TODAY, time: '09:30', created: '2026-10-03', purpose: '초진 · 감기 증상', state: '내원확정' }),
  r({ id: 'D002', name: '박○○', phone: '010-****-2102', birth: '1956.**.**', date: TODAY, time: '10:00', created: TODAY, purpose: '재진 · 고혈압 약 처방', memo: '지난 처방 동일 요청', state: '예약확정' }),
  t({ id: 'D003', name: '이○○', phone: '010-****-2103', birth: '1991.**.**', date: TODAY, time: '10:30', created: '2026-10-04', item: '독감 백신 · 1회', price: '35,000원', channel: '카카오톡', state: '확정 필요' }),
  t({ id: 'D024', name: '노○○', phone: '010-****-2121', birth: '1988.**.**', date: TODAY, time: '10:40', created: TODAY, item: '독감 백신 · 1회', price: '35,000원', etc: '아이 동반', state: '확정 필요' }),
  r({ id: 'D004', name: '최○○', phone: '010-****-2104', birth: '1984.**.**', date: TODAY, time: '11:00', created: TODAY, room: '2진료실', purpose: '건강검진 상담', state: '예약확정' }),
  r({ id: 'D005', name: '정○○', phone: '010-****-2105', birth: '1948.**.**', date: TODAY, time: '11:30', created: '2026-10-05', room: '2진료실', etc: '보호자 동반 예정', state: '예약확정' }),
  t({ id: 'D006', name: '한○○', phone: '010-****-2106', birth: '2001.**.**', date: TODAY, time: '13:30', created: TODAY, item: '가다실 9가 · 2차', price: '210,000원', state: '예약확정' }),
  r({ id: 'D007', name: '조○○', phone: '010-****-2107', birth: '1993.**.**', date: TODAY, time: '14:00', created: '2026-10-02', purpose: '초진 · 복통', state: '예약확정' }),
  r({ id: 'D008', name: '윤○○', phone: '010-****-2108', birth: '1970.**.**', date: TODAY, time: '14:30', created: TODAY, room: '예방접종실', purpose: '예방접종 상담', state: '예약확정' }),
  r({ id: 'D009', name: '장○○', phone: '010-****-2109', birth: '1988.**.**', date: TODAY, time: '15:00', created: '2026-10-05', room: '2진료실', state: '예약확정' }),
  t({ id: 'D025', name: '김○○', phone: '010-****-2101', birth: '1979.**.**', date: TODAY, time: '15:30', created: '2026-10-05', item: '독감 백신 · 1회', price: '35,000원', etc: '진료 후 접종 희망', state: '예약확정' }),
  t({ id: 'D026', name: '서○○', phone: '010-****-2122', birth: '1995.**.**', date: TODAY, time: '', created: TODAY, item: '피부 레이저 상담 · 방문 후 결정', price: '미정', state: '확정 필요' }),
  r({ id: 'D010', name: '임○○', phone: '010-****-2110', birth: '1995.**.**', date: '2026-10-07', time: '09:30', created: TODAY, purpose: '초진', state: '예약확정' }),
  t({ id: 'D011', name: '오○○', phone: '010-****-2111', birth: '1962.**.**', date: '2026-10-07', time: '10:00', created: TODAY, item: '싱그릭스 · 1차', price: '230,000원', state: '확정 필요' }),
  r({ id: 'D012', name: '송○○', phone: '010-****-2112', birth: '1977.**.**', date: '2026-10-08', time: '16:00', created: '2026-10-04', room: '2진료실', state: '예약확정' }),
  t({ id: 'D027', name: '구○○', phone: '010-****-2123', birth: '1983.**.**', date: '2026-10-09', time: '11:00', created: '2026-10-05', item: '가다실 9가 · 3차', price: '210,000원', state: '예약확정' }),
  r({ id: 'D013', name: '김○○', phone: '010-****-2101', birth: '1979.**.**', date: '2026-09-15', time: '10:30', purpose: '재진 · 비염', state: '진료완료', closed: '2026-09-15' }),
  r({ id: 'D014', name: '신○○', phone: '010-****-2113', birth: '1983.**.**', date: TODAY, time: '08:30', created: '2026-10-01', state: '진료완료', closed: TODAY }),
  t({ id: 'D015', name: '유○○', phone: '010-****-2114', birth: '1999.**.**', date: TODAY, time: '09:00', created: '2026-10-02', item: '독감 백신 · 1회', price: '35,000원', state: '진료완료', closed: TODAY }),
  r({ id: 'D016', name: '권○○', phone: '010-****-2115', birth: '1966.**.**', date: TODAY, time: '09:00', created: '2026-10-03', room: '2진료실', state: '병원취소', reason: '담당 의료진 부재', closed: TODAY }),
  r({ id: 'D017', name: '안○○', phone: '010-****-2116', birth: '1990.**.**', date: TODAY, time: '12:00', created: '2026-10-04', state: '환자취소', reason: '환자가 앱에서 취소', closed: TODAY }),
  t({ id: 'D018', name: '서○○', phone: '010-****-2117', birth: '2003.**.**', date: '2026-10-02', time: '15:00', created: '2026-09-28', item: '가다실 9가 · 1차', price: '210,000원', state: '자동 종료', reason: AUTO_REASON, closed: '2026-10-03' }),
  r({ id: 'D019', name: '황○○', phone: '010-****-2118', birth: '1959.**.**', date: '2026-10-05', time: '10:00', created: '2026-10-01', room: '2진료실', state: '자동 종료', reason: AUTO_REASON, closed: TODAY }),
  r({ id: 'D020', name: '박○○', phone: '010-****-2102', birth: '1956.**.**', date: '2026-09-20', time: '09:30', purpose: '재진 · 고혈압 약 처방', state: '진료완료', closed: '2026-09-20' }),
  r({ id: 'D021', name: '문○○', phone: '010-****-2119', birth: '1986.**.**', date: '2026-10-05', time: '11:00', state: '진료완료', closed: '2026-10-05' }),
  t({ id: 'D022', name: '배○○', phone: '010-****-2120', birth: '1997.**.**', date: '2026-10-04', time: '14:00', item: '독감 백신 · 1회', price: '35,000원', state: '병원취소', reason: '일정 불가', closed: '2026-10-03' }),
  r({ id: 'D023', name: '박○○', phone: '010-****-2102', birth: '1956.**.**', date: '2026-08-28', time: '10:00', purpose: '재진', state: '진료완료', closed: '2026-08-28' })
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
  ['안내', '웹에서 진료 현황을 처리하는 방법', '2026.10.06'], ['안내', '알림 메시지함이 새로 생겼어요', '2026.10.05'], ['점검', '10월 정기 점검 안내 (가상)', '2026.10.02'],
  ['안내', '진료실 담당 의사 입력 방법', '2026.09.30'], ['안내', '추석 연휴 진료 일정 설정 안내', '2026.09.24'], ['업데이트', '진료항목 예약 화면 개선', '2026.09.18'], ['안내', '제품키 재발급 절차', '2026.09.10']
];
const NAV: { key: string; icon: React.ReactNode; hold?: boolean }[] = [
  { key: '대시보드', icon: <VscDashboard /> }, { key: '진료 현황', icon: <VscListFlat /> }, { key: '진료내역', icon: <VscHistory />, hold: true },
  { key: '진료실', icon: <VscOrganization /> }, { key: '진료항목', icon: <VscCalendar /> }, { key: '진료실 운영 설정', icon: <VscSettingsGear /> }, { key: '알림 메시지함', icon: <VscInbox /> }
];
const DESC: Record<string, string> = {
  '대시보드': '오늘 우리 병원의 예약·진료 현황과 공지사항을 확인할 수 있어요.',
  '진료 현황': '굿닥 서버에 저장된 진료실 예약·진료항목 예약을 확인하고 처리할 수 있어요.',
  '진료내역': '진료가 끝나거나 취소·자동 종료된 건을 조회할 수 있어요. 상태는 바꿀 수 없어요.',
  '진료항목': '굿닥에 노출되는 우리 병원 진료항목과 진료 예약 설정을 관리할 수 있어요.',
  '알림 메시지함': '새 예약·환자 도착·진료항목 예약 알림을 서버 기준으로 모아 볼 수 있어요.'
};

/* ───────── 판단 메모(프로토 메타) ───────── */
type Preset = '둘 다' | '진료실 예약만' | '진료항목 예약만' | '진료실 예약 운영 중지';
const CUSTOM = '사용자 정의(판정 기준)';
const PRESETS: Preset[] = ['둘 다', '진료실 예약만', '진료항목 예약만', '진료실 예약 운영 중지'];
/** 판단 메모 이동 조건: 기본은 운영 유형 '둘 다' + 비연동. 메모마다 핀이 보이는 상태를 명시한다 */
const MEMO_COND: Record<number, string> = {
  1: 'preset:둘 다', 2: 'preset:진료실 예약 운영 중지', 3: 'detail:D006', 6: 'cancel:D002', 13: 'detail:D006', 15: 'partial', 16: 'norooms',
  18: 'mode:unlinked', 19: 'mode:unlinked', 21: 'mode:unlinked', 22: 'mode:unlinked;room:R1', 23: 'kakao', 24: 'mode:linked;room:R1', 25: 'mode:unlinked', 26: 'preset:진료항목 예약만;mode:unlinked',
  27: 'preset:진료항목 예약만;mode:unlinked', 28: 'preset:진료항목 예약만;mode:linked', 29: 'room:R1;open:appt'
};
type Note = { n: number; menu: string; where: string; title: string; proposal: string; basis: string; alt: string; setup?: string };
const NOTES: Note[] = [
  { n: 1, setup: 'preset:둘 다', menu: '진료 현황', where: '진료 현황 · 유형 필터', title: '운영 중 판정 기준', proposal: '진료실 예약은 진료실이 1개 이상이고 예약 섹션을 켠 진료실이 1개 이상일 때, 진료항목 예약은 예약 받기 ON이고 노출 진료항목이 1개 이상일 때 운영 중으로 봐요. 운영하지 않는 유형은 유형 필터·열·대시보드 내역에서 숨겨요.', basis: '환자가 앱에서 실제로 예약할 수 있는 조건(병원 상세 예약 버튼 기준)과 맞추면 병원 화면과 환자 화면이 어긋나지 않아요.', alt: '설정 토글만으로 판정' },
  { n: 2, setup: 'preset:진료실 예약 운영 중지', menu: '진료 현황', where: '진료 현황 · 운영 중지 안내 / 진료항목 · 진료 예약 받기', title: '운영을 끈 유형의 진행 중 건', proposal: '끈 뒤에도 진행 중 건은 목록에 남기고 처리도 허용해요. 끌 때 "새 예약만 받지 않아요. 이미 받은 진행 중 예약 N건은 그대로 처리해 주세요." 확인을 띄워요.', basis: '신청 유실 0건이 성공 기준이고, 이미 잡힌 환자 약속은 지켜야 해요.', alt: '끄면 진행 중 건 일괄 취소' },
  { n: 3, menu: '진료 현황', where: '진료항목 예약 상세 · 처리 안내', title: '진료항목 예약 환자의 내원 처리', proposal: '접수 전환·진료실 배정 없이 [진료완료]가 곧 기록이 돼요(현행 유지). 상세에 안내 문구를 둬요.', basis: '하반기는 서버·앱 변경을 최소화하고, 비연동 병원은 이 웹이 기록의 원천이에요.', alt: '내원 시 진료실 배정·접수 전환(서버 신규 필요)', setup: 'detail:D006' },
  { n: 4, menu: '진료항목', where: '진료항목 설정 · 병원 운영시간 기준 / 진료 현황 · 운영시간 확인 칩 / 진료실 스케줄 안내', title: '예약 시간 기준 불일치', proposal: '시간 기준은 연결하지 않고 안내·경고만 해요. 휴진일이거나 오늘 임시 마감한 진료실이 있는 날의 진료항목 예약에는 ‘운영시간 확인’ 칩을 붙이고 상세에 설명을 둬요.', basis: '시간 기준을 바꾸면 앱·카카오 슬롯 계산이 바뀌는 큰 작업이라 하반기 범위 밖이에요. 대신 운영자가 충돌을 놓치지 않게 해요.', alt: '진료항목 예약을 진료실 스케줄과 연결' },
  { n: 5, menu: '진료 현황', where: '진료 현황 · 같은 시간·같은 환자 안내', title: '같은 시간·같은 환자 중복', proposal: '차단하지 않고 표시만 해요. 같은 날 이름·연락처가 같은 두 유형 건에 ‘같은 날 다른 예약’ 칩과 상세 이동 링크를, 30분 안에 진료항목 예약이 몰리면 ‘같은 시간 n건’ 안내를 띄워요. 진료항목 예약은 환자 정보와 연결되지 않아 이름·연락처로 추정해요.', basis: '차단하려면 앱·카카오 변경이 필요하고, 진료 + 접종처럼 실제 동반 진료일 수 있어 매출 손실 우려가 있어요.', alt: '서버 중복 검증·진료항목 정원 도입' },
  { n: 6, menu: '진료 현황', where: '예약 취소 모달 · 사유', title: '취소 사유 유형별 필터·필수', proposal: '공통 5종을 유지하되 ‘진료항목 확인 필요’는 진료항목 예약에만 보여요. 진료실 예약도 사유 선택을 필수로 하고, 선택한 사유는 환자에게 안내된다는 힌트를 붙여요. 현행 웹과 다른 점: 처음엔 사유를 고르지 않은 상태로 열고(현행은 첫 사유가 미리 선택됨), 고르기 전에는 버튼이 비활성이며, 버튼 문구는 ‘예약 취소’예요.', basis: '환자 문의를 줄이고, 유형에 맞지 않는 사유가 나오지 않게 해요. 기존 데스크는 사유 없이 고정 문구였어요.', alt: '사유 비공개 또는 자유 입력 병행', setup: 'cancel:D002' },
  { n: 7, menu: '진료항목', where: '진료항목 · 카카오 노출 안내', title: '카카오 공존', proposal: '진료실 상세의 카카오 연동 토글과 진료항목 메뉴의 카카오 노출은 각자 위치에 둬요. 진료항목 예약 받기를 끌 때 "카카오톡 예약하기의 진료항목 상품 판매도 함께 중지돼요"를 알려요.', basis: '연동 단위가 진료실 단위 / 항목 단위로 달라 합치면 오해가 생겨요. 끌 때 영향만 확실히 알려요.', alt: '연동 화면 한곳으로 통합' },
  { n: 8, menu: '진료 현황', where: '진료 현황 · 상태 칩', title: '상태 칩 어휘', proposal: '진료항목 예약은 ‘확정 필요’ → ‘예약확정’, 진료실 예약은 ‘예약확정’ → ‘내원확정’. 같은 탭(진행 중)에 모아 보여요.', basis: '현행 웹·데스크에서 쓰던 말을 유지해 병원이 다시 배우지 않게 해요.', alt: '두 유형 공통 어휘 1세트로 통일' },
  { n: 9, menu: '진료 현황', where: '진료 현황 · 확정 필요 하위 필터', title: '신청 건 위치', proposal: '확정이 필요한 진료항목 신청은 진행 중 탭에 두고 ‘확정 필요’ 하위 필터로 모아 봐요.', basis: '탭을 늘리지 않고 놓치기 쉬운 미확정 건만 빠르게 걸러요.', alt: '별도 ‘처리 필요’ 탭' },
  { n: 10, menu: '대시보드', where: '대시보드 · 오늘 현황', title: '대시보드 집계', proposal: '타일은 두 유형 합산, 둘 다 운영할 때만 타일 아래에 유형별 내역(진료실 n · 진료항목 n)을 작게 보여요.', basis: '기존 데스크 대시보드 구성(3타일)을 유지하면서 유형 구분이 필요할 때만 보여요.', alt: '유형별 타일 분리' },
  { n: 11, menu: '진료항목', where: '진료항목 · 진료 예약 설정 섹션', title: '진료항목 예약 설정 위치', proposal: '진료항목 메뉴 안의 별도 섹션으로 두고, 진료실 예약 설정(진료실별 예약·스케줄)과 나눠요.', basis: '설정 대상이 다르고(병원 전체 vs 진료실), 현행 웹도 진료항목 쪽에 있어요.', alt: '진료실 운영 설정에 통합' },
  { n: 12, menu: '진료 현황', where: '진료 현황 · 정렬', title: '정렬 기준', proposal: '방문 예정 시각 오름차순. 시각이 없는 진료항목 예약은 그 날짜 맨 끝에 ‘시간 미정’으로 둬요.', basis: '오늘 처리할 순서와 같아요. 시각 미정 건이 맨 앞에 끼면 순서가 흐트러져요.', alt: '신청일시 순 정렬 추가' },
  { n: 13, menu: '진료 현황', where: '진료항목 예약 상세 · 진료정보 수정', title: '진료항목 예약 진료정보 수정', proposal: '진료항목 예약도 수정할 수 있게 하되, 내원목적 대신 ‘요청사항’(선택)과 진료메모만 받아요.', basis: '진료항목 예약은 내원목적 개념이 없고, 상담 메모는 병원이 남길 필요가 있어요.', alt: '진료항목 예약은 수정 불가', setup: 'detail:D006' },
  { n: 14, menu: '진료 현황', where: '진료 현황 · 진료실 필터', title: '진료실 필터의 진료항목 예약', proposal: '진료실 필터에 ‘진료실 미지정(진료항목 예약)’ 옵션을 두고, 특정 진료실을 고르면 진료항목 예약이 빠진다고 안내해요.', basis: '진료항목 예약은 진료실 개념이 없어 필터 결과가 줄어드는 이유를 보여 줘야 해요.', alt: '진료실 필터를 고르면 유형 필터를 자동으로 진료실 예약으로 바꿈' },
  { n: 15, menu: '진료 현황', where: '진료 현황 · 유형별 조회 실패 배너', title: '부분 실패 처리', proposal: '유형별로 조회가 실패하면 그 유형만 배너로 알리고, 성공한 유형은 그대로 보여요.', basis: '한 유형 장애로 전체 업무가 멈추지 않게 해요.', alt: '하나라도 실패하면 전체 오류 화면', setup: 'partial' },
  { n: 16, menu: '대시보드', where: '대시보드 · 진료실 없음 안내', title: '비연동 진료실 없음은 정상 상태', proposal: '비연동 병원에서 진료실 0개는 정상이에요. 차단·경고 대신 "진료실을 만들면 진료실 예약도 받을 수 있어요" 선택형 안내만 둬요.', basis: '진료항목 예약만 운영하는 병원이 있어요.', alt: '진료실 생성 유도 카드(경고형)', setup: 'norooms' },
  { n: 17, menu: '진료 현황', where: '진료 현황 · 내원 체크 열', title: '데스크 현행과 다르게 바꾼 것', proposal: '내원 체크에 확인 모달을 한 번 거치고, 저장에 실패하면 성공으로 표시하지 않아요.', basis: '데스크는 체크 즉시 처리돼 오탭이 많았고, 실패해도 성공 토스트가 떠서 상태가 어긋났어요.', alt: '데스크와 같이 즉시 처리' },
  { n: 18, menu: '진료실 운영 설정', where: '진료실 운영 설정 · 태블릿 접수 묶음', title: '비연동 병원의 태블릿 접수 항목', proposal: '환자 조회 방식·주소 정보·내원경로는 태블릿 신환 등록에 쓰여 ‘태블릿 접수’로 묶고, 비연동 병원에서는 묶음 전체를 비활성으로 두고 안내를 한 번만 보여요.', basis: 'EMR 연결이 없으면 서버가 접수를 거절해 비연동 병원은 태블릿 접수 자체를 할 수 없어요.', alt: '항목을 숨김', setup: 'mode:unlinked' },
  { n: 19, menu: '진료실 운영 설정', where: '진료실 운영 설정 · 태블릿 접수 묶음 안내', title: '비연동 병원의 접수·차례 알림', proposal: '데스크가 하던 차트 응답(접수 처리·대기 순번)은 통합 웹으로 옮길 때 서버가 대신할지 정해지지 않았어요. 그래서 비연동은 접수·차례 알림을 비활성으로 뒀어요.', basis: '지금은 EMR 연결이 없으면 서버가 접수를 거절하고, 대기 순번도 EMR에서만 와요. 웹만으로는 접수 처리와 차례 알림을 만들 수 없어요.', alt: '서버가 차트 응답을 대신해서 비연동도 접수 제공', setup: 'mode:unlinked' },
  { n: 20, menu: '진료실 운영 설정', where: '진료실 운영 설정 · 진료과 중복 접수', title: '진료과 중복 접수 노출 범위', proposal: '모든 병원에 노출하고 기본값은 ‘허용 안 함’으로 둬요. 체험 설정의 특정 차트 토글은 이 결정으로 필요 없어져 정리했어요.', basis: '토글이 없는 병원도 이미 중복 차단 상태로 동작하므로, 노출하면 병원이 직접 정할 수 있어요.', alt: '현행처럼 특정 차트에서만 노출' },
  { n: 21, menu: '진료실 운영 설정', where: '진료실 운영 설정 · 재진 환자만 접수 받기', title: '비연동 병원의 재진만 받기', proposal: '비연동 병원은 끈 상태로 고정하고 "차트 환자번호가 없어 켜면 모든 예약이 거절돼요"를 보여요. EMR 연동 병원은 차트 기능값대로 켜고 끌 수 있어요.', basis: '서버는 차트 환자번호가 없으면 재진 확인을 거절해요. 비연동 병원은 환자번호를 줄 곳이 없어요.', alt: '굿닥 방문 이력으로 재진을 판단(서버 신규)', setup: 'mode:unlinked' },
  { n: 22, menu: '진료실', where: '진료실 상세 · 현장·원격 접수 섹션(비연동)', title: '비연동 병원의 접수 섹션', proposal: '현장 접수·원격 접수는 ‘사용불가 · EMR 연동 시 사용 가능’으로, 예약 섹션은 그대로 활성으로 둬요.', basis: '접수는 EMR 연결이 없으면 서버가 거절하고, 예약은 EMR 연결 없이도 진행돼요.', alt: '접수 섹션을 숨김', setup: 'mode:unlinked;room:R1' },
  { n: 23, menu: '대시보드', where: '카카오톡 예약하기 · 연동 설정', title: '카카오 연동 가능 범위', proposal: '원격 접수·예약 기능이 둘 다 막힌 병원은 ‘연동 불가’와 차트사 문의 안내를 보여요. 비연동 병원은 예약만 연동할 수 있어요.', basis: '카카오 연동은 원격 접수·예약 기능 위에서만 동작해요.', alt: '연동 메뉴를 숨김', setup: 'kakao' },
  { n: 24, menu: '진료실', where: '진료실 상세 · 차트 정보 / 굿닥 운영 설정(EMR 연동)', title: 'EMR 연동 병원 진료실 필드 원천', proposal: '진료실명·진료과·의사는 차트 원천이라 잠그고 이름은 별칭으로만 바꿔요. 굿닥이 관리하는 항목(별칭·안내 문구·접수 허용·스케줄·내원 목적·임시 마감)과 나눠 보여요.', basis: '차트와 굿닥에 같은 정보를 두 번 고치면 어긋나요. 차트 목록에서 빠진 진료실은 미사용 설정으로 이동해요.', alt: '굿닥에서 차트 정보 덮어쓰기 허용', setup: 'mode:linked;room:R1' },
  { n: 26, setup: 'preset:진료항목 예약만', menu: '대시보드', where: '대시보드 · 진료실 예약 선택형 안내(진료항목 예약만)', title: '진료실 예약을 안 하는 병원의 안내', proposal: '진료항목 예약만 운영하는 비연동 병원에도 "진료실을 만들면 진료실 예약도 받을 수 있어요"를 기본으로 보여 주되, 닫을 수 있게 해요.', basis: '나중에 진료실 예약을 시작할 수 있다는 걸 알리는 게 운영 확장에 도움이 되고, 원하지 않으면 닫으면 돼요.', alt: '진료항목 예약만 운영하면 안내를 숨김' },
  { n: 27, setup: 'preset:진료항목 예약만', menu: '진료실', where: '진료실 · 빈 상태(진료항목 예약만)', title: '진료항목 예약만 운영할 때 진료실 메뉴', proposal: '진료실·진료실 운영 설정 메뉴는 유지해요. 비연동은 진료실이 빈 상태로 보이고, 운영 설정은 진료실 단위 항목을 비활성하고 이유를 안내해요.', basis: '나중에 진료실 예약을 시작할 때 같은 자리에서 바로 만들 수 있어요.', alt: '진료실 예약을 운영하지 않으면 두 메뉴를 숨김' },
  { n: 28, setup: 'preset:진료항목 예약만;mode:linked', menu: '진료실', where: '진료실 설정 · EMR 연동 병원 진료항목 예약만', title: 'EMR 연동 병원이 진료항목 예약만 운영할 때', proposal: '진료실은 차트 동기화로 그대로 보여요. 모든 진료실의 예약 섹션은 미사용이고 진료실 예약 데이터는 없어요. 현장·원격 접수는 차트 기능 기준으로 운영할 수 있어요. 여기서 예약 ‘사용하기’를 켜거나 진료실을 만들어 실제 판정이 바뀌면 체험 띠의 운영 유형은 ‘사용자 정의(판정 기준)’로 바뀌어요(의도된 동작).', basis: 'EMR 연동 병원의 진료실은 차트가 원천이라 지울 수 없고, 접수는 진료실 예약과 별개로 운영돼요.', alt: '진료실 목록도 숨김' },
  { n: 29, menu: '진료실', where: '진료실 상세 · 카카오톡 예약하기 연동 행', title: '카카오 연동을 상세 토글에서 연동 설정 화면으로', proposal: '피그마대로 진료실 상세에는 토글 대신 ‘페이지로 이동’ 버튼을 두고, 연동 켜기·끄기는 카카오톡 예약하기 연동 설정 화면에서 해요. 연동 중 사용중지 차단, 고급 설정이면 연동 불가, 운영 스케줄 필요 규칙은 그 화면에서 그대로 동작해요.', basis: '연동은 병원·진료실 단위 설정을 한곳에서 보는 게 실수를 줄이고, 피그마 정본과 맞춰요.', alt: '상세에 토글을 남기고 연동 설정 화면과 이중 제공', setup: 'room:R1' },
  { n: 25, menu: '진료실', where: '진료실 관리 · 새 진료실 / 정보 수정(비연동)', title: '비연동 병원 진료실 웹 생성·수정·삭제', proposal: '현행 웹에는 없는 신규 기능이에요. 서버에 진료실 생성 API가 필요해요.', basis: 'EMR을 연동하지 않은 병원은 진료실을 만들 곳이 없어 웹에서 직접 관리해야 해요.', alt: '굿닥 운영팀이 대신 생성', setup: 'mode:unlinked' }
].sort((a, b) => a.n - b.n);

/* ───────── 유틸 ───────── */
const wait = (ms: number) => new Promise(res => setTimeout(res, ms));
const DOW = ['일', '월', '화', '수', '목', '금', '토'];
const fmt = (d: string) => `${d.slice(5).replace('-', '.')}(${DOW[new Date(`${d}T00:00:00`).getDay()]})`;
const fmtFull = (d: string) => `${d.replaceAll('-', '.')} (${DOW[new Date(`${d}T00:00:00`).getDay()]})`;
const badge = (n: number) => (n > 99 ? '99+' : String(n));
const daysBetween = (a: string, b: string) => Math.round((new Date(`${a}T00:00:00`).getTime() - new Date(`${b}T00:00:00`).getTime()) / 86400000);
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
const eul = (w: string) => { const c = w.charCodeAt(w.length - 1); if (c >= 0xac00 && c <= 0xd7a3) return (c - 0xac00) % 28 ? '을' : '를'; return /[013678]$/.test(w) ? '을' : '를'; };
const timeLabel = (x: Rec) => x.time || '시간 미정';
/** 받침에 따라 '으로/로' (ㄹ 받침은 '로') */
const ro = (w: string) => { const c = w.charCodeAt(w.length - 1); if (c < 0xac00 || c > 0xd7a3) return '로'; const j = (c - 0xac00) % 28; return j === 0 || j === 8 ? '로' : '으로'; };
type SvcKeyT = 'tablet' | 'mobile' | 'appt';
let focusReturn: HTMLElement | null = null;
const modalStack: HTMLDivElement[] = [];
const focusFallback = () => {
  const cand = [focusReturn, document.querySelector<HTMLElement>('.cu-main .cu-header .cu-btn.primary:not(:disabled)'), document.querySelector<HTMLElement>('.cu-main .cu-header h1'), document.querySelector<HTMLElement>('.cu-nav-row.active')];
  cand.find(el => el && el.isConnected)?.focus?.();
};

function Tag({ state }: { state: State }) { return <span className={'cu-tag ' + TAG[state]}>{state}</span>; }
function Hold({ text = '보류' }: { text?: string }) { return <span className="dw-hold">[{text}]</span>; }
function ConnectIcon() { return <span className="cu-connect-icon dw-ci" aria-hidden="true"><img src={LOGO} alt="" /></span>; }

/** 모달: 스택 최상단만 ESC·Tab 반응(document 레벨), 닫힐 때 직전 요소 → 남은 모달 → 화면 대체 요소로 포커스 복귀 */
function Modal({ title, children, footer, onClose, wide = false, busy = false, className = '' }: { title: React.ReactNode; children: React.ReactNode; footer?: React.ReactNode; onClose: () => void; wide?: boolean; busy?: boolean; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const busyRef = useRef(busy), closeRef = useRef(onClose);
  busyRef.current = busy; closeRef.current = onClose;
  useEffect(() => {
    const node = ref.current!;
    const previous = document.activeElement as HTMLElement | null;
    modalStack.push(node); node.focus();
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
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const node = ref.current;
      if (!node || modalStack[modalStack.length - 1] !== node) return;
      if (e.key === 'Escape') { if ((document.activeElement as HTMLElement)?.closest?.('.dw-pin-pop')) return; e.stopPropagation(); if (!busyRef.current) closeRef.current(); return; }
      if (e.key === 'Tab') {
        const list = node.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]');
        if (!list.length) { e.preventDefault(); node.focus(); return; }
        const first = list[0], last = list[list.length - 1];
        if (!node.contains(document.activeElement)) { e.preventDefault(); (e.shiftKey ? last : first).focus(); return; }
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

/** 판단 메모 핀: 레이아웃을 밀지 않는 0폭 앵커 + 절대 배치 원형 번호. 클릭·포커스로 팝오버, ESC로 닫기 */
let pinCtx: { on: boolean; hi: number | null; openReq: number | null } = { on: true, hi: null, openReq: null };
/** 메모 이동 직후에는 부드러운 스크롤 때문에 팝오버가 닫히지 않게 한다 */
let pinScrollGuardUntil = 0;
function Pin({ n }: { n: number }) {
  const [open, setOpen] = useState(false);
  const note = NOTES.find(x => x.n === n);
  const wrap = useRef<HTMLSpanElement>(null), pop = useRef<HTMLSpanElement>(null);
  const [pos, setPos] = useState<{ left: number; top?: number; bottom?: number }>({ left: -9999, top: -9999 });
  /** 팝오버는 fixed로 띄우고, 화면 오른쪽·아래가 부족하면 오른쪽 정렬·위로 뒤집는다 */
  const place = () => {
    if (!wrap.current || !pop.current) return;
    const a = (wrap.current.querySelector('.dw-pin') as HTMLElement).getBoundingClientRect();
    const w = pop.current.offsetWidth, h = pop.current.offsetHeight, M = 12;
    let left = a.left - 8; if (left + w > window.innerWidth - M) left = Math.max(M, a.right + 8 - w); if (left < M) left = M;
    const below = a.bottom + 6;
    setPos(below + h > window.innerHeight - M && a.top - 6 - h > M ? { left, bottom: window.innerHeight - a.top + 6 } : { left, top: Math.min(below, Math.max(M, window.innerHeight - M - h)) });
  };
  useLayoutEffect(() => { if (open) place(); }, [open]);
  useEffect(() => {
    if (!open) return;
    // 메모 이동 직후 스크롤 중에는 닫지 않고 위치만 다시 계산
    const close = () => { if (Date.now() < pinScrollGuardUntil) { place(); return; } setOpen(false); };
    window.addEventListener('resize', close); window.addEventListener('scroll', close, true);
    const t = setTimeout(place, 400);
    return () => { clearTimeout(t); window.removeEventListener('resize', close); window.removeEventListener('scroll', close, true); };
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (!wrap.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h);
  }, [open]);
  // 메모 이동이 끝나면(스크롤 후) 해당 핀의 팝오버를 직접 연다 — 포커스 이벤트에만 의존하지 않음
  const req = pinCtx.openReq;
  useEffect(() => { if (req === n) setOpen(true); else if (req !== null) setOpen(false); }, [req]); // 다른 메모로 이동하면 열려 있던 팝오버는 닫는다
  if (!pinCtx.on || !note) return null;
  return <span className={'dw-pin-anchor ' + (pinCtx.hi === n ? 'hi' : '')} ref={wrap} data-pin={n} onClick={e => e.stopPropagation()}>
    <button type="button" className="dw-pin" aria-label={`판단 메모 ${n}: ${note.title}`} aria-expanded={open} onClick={() => setOpen(!open)} onFocus={() => setOpen(true)}
      onBlur={e => { if (!wrap.current?.contains(e.relatedTarget as Node)) setOpen(false); }}
      onKeyDown={e => { if (e.key === 'Escape' && open) { e.stopPropagation(); e.preventDefault(); setOpen(false); } }}>{n}</button>
    {open && <span className="dw-pin-pop" ref={pop} style={{ position: 'fixed', left: pos.left, top: pos.top ?? 'auto', bottom: pos.bottom ?? 'auto' }} role="dialog" aria-label={`판단 메모 ${n}`} tabIndex={-1} onKeyDown={e => { if (e.key === 'Escape') { e.stopPropagation(); setOpen(false); (wrap.current?.querySelector('.dw-pin') as HTMLElement)?.focus(); } }}
      onBlur={e => { if (!wrap.current?.contains(e.relatedTarget as Node)) setOpen(false); }}>
      <b className="dw-pin-title">{n}. {note.title}</b><em className="dw-pin-chip">PO 확인 필요</em>
      <span className="dw-pin-sec"><i>제안</i>{note.proposal}</span>
      <span className="dw-pin-sec"><i>근거</i>{note.basis}</span>
      <span className="dw-pin-sec"><i>대안</i>{note.alt}</span>
    </span>}
  </span>;
}

/* ───────── 최상위 오류 화면 ───────── */
class Boundary extends React.Component<{ onReset: () => void; children: React.ReactNode }, { err: boolean }> {
  state = { err: false };
  static getDerivedStateFromError() { return { err: true }; }
  componentDidCatch(e: unknown) { console.warn('[desk-web] 화면 오류', e); }
  render() {
    if (!this.state.err) return this.props.children;
    return <div className="dw-crash" role="alert"><VscWarning /><strong>화면을 다시 불러와 주세요</strong><p>시안 화면에서 예상하지 못한 오류가 났어요. 가상 데이터를 처음 상태로 되돌리면 다시 볼 수 있어요.</p><button className="cu-btn primary" onClick={this.props.onReset}><VscRefresh />처음 상태로</button></div>;
  }
}
export default function App() {
  const [k, setK] = useState(0);
  return <Boundary key={k} onReset={() => setK(k + 1)}><Page /></Boundary>;
}

/* ───────── 페이지 ───────── */
function Page() {
  // 데이터
  const [rows, setRows] = useState<Rec[]>(() => clone(BASE));
  const [rooms, setRooms] = useState<Room[]>(() => seedRooms());
  const [invalid, setInvalid] = useState<Invalid[]>(() => seedInvalid());
  const [savedRooms, setSavedRooms] = useState<Room[] | null>(null), [savedRows, setSavedRows] = useState<Rec[] | null>(null);
  const [notis, setNotis] = useState<Noti[]>(() => clone(BASE_NOTI));
  const ITEMS0 = [{ name: '독감 백신', price: '35,000원', active: true }, { name: '가다실 9가', price: '210,000원', active: true }, { name: '싱그릭스', price: '230,000원', active: false }, { name: '피부 레이저 상담', price: '방문 후 결정', active: true }];
  const [items, setItems] = useState(ITEMS0);
  const TAPPT0 = { on: true, autoConfirm: false, sameDay: true, notify: true };
  const [tAppt, setTAppt] = useState(TAPPT0);
  // 체험 설정(메타)
  const [chartMode, setChartMode] = useState<ChartMode>('unlinked'), [noRooms, setNoRooms] = useState(false), [failSim, setFailSim] = useState(false), [serverDown, setServerDown] = useState(false), [manyNoti, setManyNoti] = useState(false), [panelOpen, setPanelOpen] = useState(false);
  const [chartMissing, setChartMissing] = useState(false), [chartLimited, setChartLimited] = useState(false), [smart, setSmart] = useState(true), [partialFail, setPartialFail] = useState(false);
  const linked = chartMode === 'linked';
  const [moreOpen, setMoreOpen] = useState(false);
  const [opPreset, setOpPreset] = useState<Preset>('둘 다'), [softDismissed, setSoftDismissed] = useState(false);
  // 판단 메모
  const [annot, setAnnot] = useState(true), [drawer, setDrawer] = useState(false), [hiPin, setHiPin] = useState<number | null>(null);
  type Snap = { rows: Rec[]; rooms: Room[]; savedRooms: Room[] | null; savedRows: Rec[] | null; noRooms: boolean; preset: Preset; mode: ChartMode; limited: boolean; missing: boolean; partial: boolean; tAppt: typeof TAPPT0; soft: boolean };
  const [memoSnap, setMemoSnap] = useState<Snap | null>(null);
  const suppressRebuild = useRef(false);
  const [pinReq, setPinReq] = useState<number | null>(null);
  pinCtx = { on: annot, hi: hiPin, openReq: pinReq };
  // 셸
  const [menu, setMenu] = useState('대시보드'), [loading, setLoading] = useState(false), [maximized, setMaximized] = useState(false), [closed, setClosed] = useState(false), [tray, setTray] = useState(false), [toast, setToast] = useState<{ text: string; tone: 'ok' | 'fail' } | null>(null);
  const [roomsKey, setRoomsKey] = useState(0), [roomsInit, setRoomsInit] = useState<View | undefined>(undefined);
  // 진료 현황 필터
  const [tab, setTab] = useState<'진행 중' | '지난 내역'>('진행 중'), [dateMode, setDateMode] = useState('오늘'), [pickDate, setPickDate] = useState(TODAY), [roomFilter, setRoomFilter] = useState('전체 진료실'), [kindFilter, setKindFilter] = useState<'전체' | Kind>('전체'), [sub, setSub] = useState<'전체' | '확정 필요'>('전체');
  const [search, setSearch] = useState(''), [sort, setSort] = useState('방문 예정 빠른 순'), [chip, setChip] = useState<'' | '오늘 신청' | '진료완료' | '취소'>(''), [page, setPage] = useState(1), [kebab, setKebab] = useState<string | null>(null), [kebabPos, setKebabPos] = useState<{ top?: number; bottom?: number; left: number }>({ left: 0 });
  const [hSearch, setHSearch] = useState(''), [hPeriod, setHPeriod] = useState('최근 30일'), [hPage, setHPage] = useState(1);
  const [noticePage, setNoticePage] = useState(1), [notiFilter, setNotiFilter] = useState<'전체' | '읽지 않음'>('전체');
  // 모달
  const [dialog, setDialog] = useState<Dialog | null>(null), [busy, setBusy] = useState(false), [error, setError] = useState(''), [reason, setReason] = useState('');
  const [edit, setEdit] = useState({ purpose: '', etc: '', memo: '' }), [editTried, setEditTried] = useState(false);
  const [reg, setReg] = useState({ room: '', date: TODAY, time: '', name: '', phone: '' }), [regTried, setRegTried] = useState(false);
  const [roomForm, setRoomForm] = useState({ name: '', alias: '', dept: '', doctors: [''] }), [roomTried, setRoomTried] = useState(false);
  const [keyConfirm, setKeyConfirm] = useState(false), [keyBusy, setKeyBusy] = useState(false);
  const CFG0 = { autoStart: true, rrn7: false, newAppt: true, arrival: true };
  const [cfg, setCfg] = useState(CFG0), [cfgDraft, setCfgDraft] = useState(CFG0), [emrGuide, setEmrGuide] = useState(false);
  // 진료실 운영 설정 저장값(메뉴 이동 후에도 유지)
  const [opSaved, setOpSaved] = useState(OP0), [opPaths, setOpPaths] = useState(VISIT_PATHS_DEFAULT), [opAuto, setOpAuto] = useState<Record<string, AutoRow>>({});

  useEffect(() => { if (!toast) return; const tm = setTimeout(() => setToast(null), 3500); return () => clearTimeout(tm); }, [toast]);
  useEffect(() => { if (!loading) return; const tm = setTimeout(() => setLoading(false), 380); return () => clearTimeout(tm); }, [loading]);
  useEffect(() => setPage(1), [tab, dateMode, pickDate, roomFilter, kindFilter, sub, search, sort, chip]);
  useEffect(() => setHPage(1), [hSearch, hPeriod]);
  useEffect(() => {
    if (!kebab && !tray) return;
    const close = (e: MouseEvent) => { const el = e.target as HTMLElement; if (!el.closest('.dw-kebab-wrap')) setKebab(null); if (!el.closest('.dw-tray-area')) setTray(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') { setKebab(null); setTray(false); } };
    const scroll = () => setKebab(null);
    document.addEventListener('mousedown', close); document.addEventListener('keydown', esc);
    if (kebab) { window.addEventListener('scroll', scroll, true); window.addEventListener('resize', scroll); }
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', esc); window.removeEventListener('scroll', scroll, true); window.removeEventListener('resize', scroll); };
  }, [kebab, tray]);
  useEffect(() => {
    if (!moreOpen) return;
    const h = (e: MouseEvent) => { if (!(e.target as HTMLElement).closest('.dw-exp-more-wrap')) setMoreOpen(false); };
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape' && !modalStack.length) { setMoreOpen(false); document.querySelector<HTMLElement>('.dw-exp-more')?.focus(); } };
    document.addEventListener('mousedown', h); document.addEventListener('keydown', k);
    return () => { document.removeEventListener('mousedown', h); document.removeEventListener('keydown', k); };
  }, [moreOpen]);
  useEffect(() => { if (hiPin == null) return; const tm = setTimeout(() => setHiPin(null), 3000); return () => clearTimeout(tm); }, [hiPin]);
  useEffect(() => {
    if (!drawer) return;
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape' && !modalStack.length) setDrawer(false); };
    document.addEventListener('keydown', esc); return () => document.removeEventListener('keydown', esc);
  }, [drawer]);

  const kebabBtn = useRef<HTMLElement | null>(null), kebabMenu = useRef<HTMLDivElement>(null);
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
  const instant = (apply: () => void, ok: string, what = '저장') => {
    if (serverDown) { fail(`굿닥 서버에 연결할 수 없어 ${what}하지 못했어요. 상태는 바뀌지 않았어요.`); return false; }
    if (failSim) { fail(`${what}하지 못했어요(모의 실패). 상태는 바뀌지 않았어요.`); return false; }
    apply(); notify(ok); return true;
  };
  const go = (name: string, init?: View) => {
    setMenu(name); setLoading(true); setKebab(null); setClosed(false);
    if (name === '진료실') { setRoomsInit(init); setRoomsKey(k => k + 1); }
    if ((document.activeElement as HTMLElement | null)?.classList?.contains('cu-nav-row')) setTimeout(() => document.querySelector<HTMLElement>('.cu-nav-row.active')?.focus(), 0);
  };
  const chosenRoom = dialog && (dialog.type === 'roomDelete' || dialog.type === 'roomForm') && dialog.id ? rooms.find(x => x.id === dialog.id) : undefined;

  const save = async (apply: () => void, ok: string, after?: () => void) => {
    if (busy) return;
    setError(''); setBusy(true); await wait(650);
    if (serverDown) { setBusy(false); setError('굿닥 서버에 연결할 수 없어 저장하지 못했어요. 상태는 바뀌지 않았어요. 연결을 확인한 뒤 다시 시도해 주세요.'); return; }
    if (failSim) { setBusy(false); setError('저장하지 못했어요(모의 실패). 상태는 바뀌지 않았어요. 다시 시도해 주세요.'); return; }
    apply(); setBusy(false); after?.(); notify(ok);
  };
  const openDetail = (id: string) => { setError(''); setKebab(null); setDialog({ type: 'detail', id }); };
  const openAction = (id: string, act: Act, from: 'list' | 'detail' = 'detail') => { setError(''); setKebab(null); setDialog({ type: 'action', id, act, from }); };
  const openCancel = (id: string, from: 'list' | 'detail' = 'detail') => { setError(''); setKebab(null); setReason(''); setDialog({ type: 'cancel', id, from }); };
  const backFrom = (id: string, from: 'list' | 'detail') => { setError(''); setDialog(from === 'detail' ? { type: 'detail', id } : null); };
  const close = () => { if (!busy) { setDialog(null); setError(''); } };
  const openSettings = () => { setError(''); setCfgDraft(cfg); setEmrGuide(false); setDialog({ type: 'settings' }); };

  /* 운영 판정 [제안·PO확인] */
  const roomOp = rooms.length > 0 && rooms.some(x => x.appt.accepted);
  const itemOp = tAppt.on && items.some(x => x.active);
  /** 프리셋 기대 판정과 실제 판정이 다르면(예: 연동 + 진료항목만에서 예약 사용하기) 띠에 '사용자 정의(판정 기준)' 표시 */
  const presetExpect: Record<Preset, [boolean, boolean]> = { '둘 다': [true, true], '진료실 예약만': [true, false], '진료항목 예약만': [false, true], '진료실 예약 운영 중지': [false, true] };
  const presetShown = presetExpect[opPreset][0] === roomOp && presetExpect[opPreset][1] === itemOp ? opPreset : CUSTOM;
  /* 진료실 없음 체험: 진료실 예약만 숨김(0개 상태에서 새로 만든 진료실에 등록한 건은 표시). 진료항목 조회 실패 체험: 진료항목 예약 숨김 */
  const viewRows = rows.filter(x => (x.kind === '진료항목 예약' ? !partialFail : !noRooms || (x.id.startsWith('W') && rooms.some(rm => rm.name === x.room))));
  // 숨겨진 건(진료실 없음·조회 실패)의 상세는 열지 않는다
  const chosen = dialog && 'id' in dialog && dialog.id ? viewRows.find(x => x.id === dialog.id) : undefined;
  useEffect(() => { if (dialog && 'id' in dialog && dialog.id && (dialog.type === 'detail' || dialog.type === 'action' || dialog.type === 'cancel') && !viewRows.some(x => x.id === dialog.id)) { setDialog(null); fail('지금 체험 조건에서는 볼 수 없는 예약이에요. 체험 설정을 확인해 주세요.'); } });
  const hasActive = (k: Kind) => viewRows.some(x => x.kind === k && ACTIVE.includes(x.state));
  // 운영하지 않는 유형은 필터·열에서 숨기되, 그 유형의 진행 중 건은 목록에 남겨 처리할 수 있게 한다 [제안·PO확인]
  const roomSide = roomOp, itemSide = itemOp;
  const showBoth = roomSide && itemSide;
  const visitColOn = rooms.length > 0 && (roomOp || hasActive('진료실 예약'));
  const roomFilterOn = rooms.length > 0 && (roomOp || hasActive('진료실 예약'));
  const allNotis = notis.filter(n => !n.rec || viewRows.some(x => x.id === n.rec));
  const unread = allNotis.filter(n => !n.read).length;
  const roomPaused = (d: string) => d === TODAY && rooms.some(x => x.tablet.paused || x.mobile.paused || x.appt.paused);
  const hoursWarn = (x: Rec) => x.kind === '진료항목 예약' && ACTIVE.includes(x.state) && (!!HOLIDAYS[x.date] || new Date(`${x.date}T00:00:00`).getDay() === 0 || roomPaused(x.date));
  const sameDayOther = (x: Rec) => rows.filter(y => y.id !== x.id && y.kind !== x.kind && y.date === x.date && y.name === x.name && y.phone === x.phone && ACTIVE.includes(y.state));

  /* 진료 현황 목록 */
  const inDate = (x: Rec) => dateMode === '전체 기간' || x.date === (dateMode === '오늘' ? TODAY : pickDate);
  const chipOk = (x: Rec) => !chip || (chip === '오늘 신청' ? x.created === TODAY : chip === '진료완료' ? x.state === '진료완료' && x.closed === TODAY : ['병원취소', '환자취소'].includes(x.state) && x.closed === TODAY);
  const roomOk = (x: Rec) => roomFilter === '전체 진료실' || (roomFilter === '진료실 미지정' ? x.room === '—' : x.room === roomFilter);
  const baseFilter = (x: Rec) => roomOk(x) && (kindFilter === '전체' || x.kind === kindFilter) && (!search.trim() || `${x.name}${x.phone}${x.item}`.replace(/[-\s]/g, '').includes(search.replace(/[-\s]/g, ''))) && chipOk(x);
  const tabRows = (tb: string) => viewRows.filter(x => (tb === '진행 중' ? ACTIVE : CLOSED).includes(x.state) && (chip ? (chip === '오늘 신청' || x.closed === TODAY) : inDate(x)) && baseFilter(x));
  const sortKey = (x: Rec) => `${x.date}${x.time || '99:99'}${x.kind === '진료실 예약' ? 0 : 1}${x.created}`;
  const tabList = tabRows(tab);
  const list = tabList.filter(x => tab !== '진행 중' || sub === '전체' || x.state === '확정 필요').sort((a, b) => (sort === '방문 예정 빠른 순' ? 1 : -1) * sortKey(a).localeCompare(sortKey(b)));
  const pageCount = Math.max(1, Math.ceil(list.length / PAGE_SIZE)), curPage = Math.min(page, pageCount);
  const clearFilters = () => { setDateMode('오늘'); setPickDate(TODAY); setRoomFilter('전체 진료실'); setKindFilter('전체'); setSub('전체'); setSearch(''); setChip(''); setSort('방문 예정 빠른 순'); };
  const crowd = (() => { // 30분 단위로 진료항목 예약이 2건 이상 몰린 구간
    const m: Record<string, number> = {};
    viewRows.filter(x => x.kind === '진료항목 예약' && ACTIVE.includes(x.state) && x.time && inDate(x)).forEach(x => { const mm = Number(x.time.slice(3)); const k = `${x.date} ${x.time.slice(0, 2)}:${mm < 30 ? '00' : '30'}`; m[k] = (m[k] || 0) + 1; });
    return Object.entries(m).filter(([, c]) => c >= 2);
  })();

  /* 진료내역 */
  const histRows = viewRows.filter(x => CLOSED.includes(x.state) && (hPeriod === '전체 기간' || daysBetween(TODAY, x.date) <= (hPeriod === '최근 7일' ? 7 : 30)) && (!hSearch.trim() || `${x.name}${x.phone}`.replace(/[-\s]/g, '').includes(hSearch.replace(/[-\s]/g, '')))).sort((a, b) => sortKey(b).localeCompare(sortKey(a)));
  const hCount = Math.max(1, Math.ceil(histRows.length / PAGE_SIZE)), hCur = Math.min(hPage, hCount);

  /* 체험 토글 */
  const modalOpen = !!dialog || keyConfirm;
  const toggleNoRooms = (v: boolean) => {
    if (modalOpen || v === noRooms || opPreset === '진료항목 예약만') return;
    setNoRooms(v); setRoomFilter('전체 진료실');
    if (v) { setSavedRooms(rooms); setSavedRows(rows.filter(x => x.kind === '진료실 예약')); setRooms([]); notify((chartMode === 'unlinked' ? '진료실 없음(정상 상태)' : '진료실 없음') + '으로 바꿨어요. 진료실 예약만 숨기고 진료항목 예약은 그대로예요.'); }
    else {
      const made = rooms.length > 0 || rows.some(x => x.id.startsWith('W') && !(savedRows || []).some(y => y.id === x.id));
      const restored = savedRooms || seedRooms();
      setRooms(restored);
      setRows(cur => [...cur.filter(x => x.kind === '진료항목 예약'), ...(savedRows || BASE.filter(x => x.kind === '진료실 예약'))]); setSavedRooms(null); setSavedRows(null);
      notify(made ? '진료실 없음 체험을 끝냈어요. 체험 중 만든 진료실·진료실 예약은 버리고 원래 진료실 3개로 되돌렸어요.' : '진료실 없음 체험을 끝내고 원래 진료실 3개로 되돌렸어요.');
    }
  };
  /** 운영 유형 프리셋: 체험 데이터를 프리셋·차트 모드 기준으로 다시 구성한다(체험 중 만든 데이터는 버림)
   *  진료항목 예약만 — 비연동: 진료실 0개·진료실 예약 0건 / 연동: 진료실은 차트 동기화로 유지, 예약 섹션 미사용·진료실 예약 0건
   *  진료실 예약만 — 진료항목 예약 0건, 진료항목 '진료 예약 받기' OFF
   *  진료실 예약 운영 중지 — 모든 진료실 예약 섹션 OFF, 기존 진료실 예약 건은 남음(판단 메모 2) */
  const applyPreset = (p: Preset, mode: ChartMode = chartMode, silent = false, withNoRooms = false) => {
    if (modalOpen && !silent) return;
    let rms = seedRooms(), rws = clone(BASE), nr = false;
    const apptOff = (x: Room): Room => ({ ...x, appt: { ...x.appt, accepted: false, kakao: false, paused: false, advanced: false } });
    if (p === '진료실 예약만') rws = rws.filter(x => x.kind === '진료실 예약');
    if (p === '진료항목 예약만') { rws = rws.filter(x => x.kind === '진료항목 예약'); if (mode === 'linked') rms = rms.map(x => ({ ...apptOff(x), aSlots: [], groups: [] })); else { rms = []; nr = true; } }
    if (p === '진료실 예약 운영 중지') rms = rms.map(apptOff);
    let svR: Room[] | null = null, svW: Rec[] | null = null;
    if (withNoRooms && !nr) { svR = rms; svW = rws.filter(x => x.kind === '진료실 예약'); rws = rws.filter(x => x.kind === '진료항목 예약'); rms = []; nr = true; }
    setOpPreset(p); setRooms(rms); setRows(rws); setNoRooms(nr); setSavedRooms(svR); setSavedRows(svW); setRoomFilter('전체 진료실'); setKindFilter('전체'); setSub('전체'); setSoftDismissed(false);
    setTAppt(o => ({ ...o, on: p !== '진료실 예약만' }));
    if (!silent) notify(`운영 유형을 ‘${p}’${ro(p)} 바꿨어요(체험). 체험 중 만든 데이터는 버리고 이 유형 기준으로 다시 구성했어요.`);
  };
  // 진료항목 예약만은 차트 모드에 따라 진료실 구성이 달라 모드를 바꾸면 다시 구성
  useEffect(() => { if (suppressRebuild.current) { suppressRebuild.current = false; return; } if (opPreset === '진료항목 예약만') applyPreset(opPreset, chartMode, true); }, [chartMode]);
  // 차트 진료실 없음은 연동 모드에서만 의미가 있어 다른 모드로 바꾸면 자동으로 끈다
  useEffect(() => { if (chartMode !== 'linked' && chartMissing) setChartMissing(false); }, [chartMode]);
  const toggleMany = (v: boolean) => {
    setManyNoti(v);
    setNotis(old => v ? [...old, ...Array.from({ length: 120 }, (_, i): Noti => ({ id: `X${i}`, type: i % 3 === 0 ? '환자 도착' : i % 3 === 1 ? '새 예약' : '진료항목 예약', text: `체험용 대량 알림 ${i + 1} · 가상 환자 ○○님`, at: `2026-10-0${5 - (i % 5)} 0${7 + (i % 3)}:${String(10 + (i % 50)).padStart(2, '0')}`, read: false, rec: '' }))] : old.filter(x => !x.id.startsWith('X')));
  };
  const resetAll = () => {
    setRows(clone(BASE)); setRooms(seedRooms()); setInvalid(seedInvalid()); setSavedRooms(null); setSavedRows(null); setNotis(clone(BASE_NOTI)); setChartMode('unlinked'); setNoRooms(false); setFailSim(false); setServerDown(false); setManyNoti(false);
    setChartLimited(false); setChartMissing(false); setSmart(true); setPartialFail(false); setOpPreset('둘 다'); setSoftDismissed(false); setMemoSnap(null);
    setItems(ITEMS0); setTAppt(TAPPT0); setCfg(CFG0); setCfgDraft(CFG0); setOpSaved(OP0); setOpPaths(VISIT_PATHS_DEFAULT); setOpAuto({}); setNotiFilter('전체'); setHSearch(''); setHPeriod('최근 30일'); setNoticePage(1); setKeyConfirm(false); setKebab(null);
    setDialog(null); setError(''); clearFilters(); setTab('진행 중'); setClosed(false); setMaximized(false); go('대시보드'); notify('모든 가상 데이터를 처음 상태로 되돌렸어요.');
  };

  /* 판단 메모 드로어 → 해당 화면 이동 + 핀 하이라이트 */
  const jumpTo = (note: Note) => {
    setDrawer(false); setAnnot(true); setDialog(null);
    const su = MEMO_COND[note.n] || '';
    const get = (k: string) => (su.match(new RegExp(k + ':([^;]+)')) || [])[1];
    const preset = (get('preset') || '둘 다') as Preset, mode = (get('mode') || 'unlinked') as ChartMode;
    // 첫 메모 이동 직전 상태를 통째로 저장해 두었다가 '되돌리기'에서 그대로 복원
    if (!memoSnap) setMemoSnap({ rows, rooms, savedRooms, savedRows, noRooms, preset: opPreset, mode: chartMode, limited: chartLimited, missing: chartMissing, partial: partialFail, tAppt, soft: softDismissed });
    if (mode !== chartMode) suppressRebuild.current = true;
    setChartMode(mode); setChartLimited(false); setChartMissing(false); setPartialFail(su.includes('partial'));
    applyPreset(preset, mode, true, su.includes('norooms')); // 운영 유형·진료실 없음을 함께 강제 적용
    const room = get('room'), openK = get('open') as SvcKeyT | undefined, detail = get('detail'), cancel = get('cancel');
    go(note.menu, room ? { v: 'detail', id: room, open: openK } : undefined);
    if (note.menu === '진료 현황') { clearFilters(); setTab('진행 중'); }
    setTimeout(() => {
      if (detail) setDialog({ type: 'detail', id: detail });
      if (cancel) { setReason(''); setDialog({ type: 'cancel', id: cancel, from: 'list' }); }
      if (su.includes('kakao')) setDialog({ type: 'kakao' });
      setHiPin(note.n);
      setTimeout(() => { const el = document.querySelector<HTMLElement>(`[data-pin="${note.n}"]`); el?.scrollIntoView({ block: 'center', behavior: 'smooth' }); pinScrollGuardUntil = Date.now() + 1500; setTimeout(() => { const pinEl = el?.querySelector('.dw-pin') as HTMLElement | null; const pr = pinEl?.getBoundingClientRect(); const mr = document.querySelector('.cu-main')?.getBoundingClientRect(); if (pr && mr && (pr.top < mr.top || pr.bottom > mr.bottom)) el?.scrollIntoView({ block: 'center' }); pinEl?.focus({ preventScroll: true }); pinScrollGuardUntil = Date.now() + 800; setPinReq(note.n); setTimeout(() => setPinReq(null), 50); }, 650); }, 450);
    }, 420);
  };

  const revertMemo = () => {
    if (!memoSnap || modalOpen) return;
    const m = memoSnap;
    if (m.mode !== chartMode) suppressRebuild.current = true;
    setRows(m.rows); setRooms(m.rooms); setSavedRooms(m.savedRooms); setSavedRows(m.savedRows); setNoRooms(m.noRooms); setOpPreset(m.preset);
    setChartMode(m.mode); setChartLimited(m.limited); setChartMissing(m.missing); setPartialFail(m.partial); setTAppt(m.tAppt); setSoftDismissed(m.soft);
    setMemoSnap(null); notify('판단 메모 이동 전 상태로 되돌렸어요.');
  };

  /* 진료 건 처리 */
  const ACT_STATE: Record<Act, State> = { visit: '내원확정', complete: '진료완료', confirm: '예약확정' };
  const ACT_LABEL: Record<Act, string> = { visit: '내원확정', complete: '진료완료', confirm: '예약 확정' };
  const doAction = (x: Rec, act: Act, from: 'list' | 'detail') => save(
    () => setRows(old => old.map(y => y.id === x.id ? { ...y, state: ACT_STATE[act], closed: act === 'complete' ? TODAY : y.closed } : y)),
    act === 'confirm' ? `${x.name}님 예약을 확정했어요.` : `${x.name}님을 ${ACT_LABEL[act]} 처리했어요.`,
    () => backFrom(x.id, from)
  );
  const doCancel = (x: Rec, from: 'list' | 'detail') => { if (!reason) return; return save(
    () => setRows(old => old.map(y => y.id === x.id ? { ...y, state: '병원취소', reason, closed: TODAY } : y)),
    `${x.name}님 예약을 취소했어요. 사유: ${reason}`,
    () => backFrom(x.id, from)
  ); };
  const doEdit = (x: Rec) => { setEditTried(true); if (x.kind === '진료실 예약' && !edit.purpose.trim()) return; return save(
    () => setRows(old => old.map(y => y.id === x.id ? { ...y, purpose: x.kind === '진료실 예약' ? edit.purpose.trim() : y.purpose, etc: edit.etc.trim(), memo: edit.memo.trim() } : y)),
    '진료정보를 저장했어요.',
    () => setDialog({ type: 'detail', id: x.id })
  ); };

  /* 예약 등록 [보류] — 진료실 예약만, 중복 검사는 같은 유형 안에서만 */
  const regPhoneOk = reg.phone.replace(/\D/g, '').length >= 10 || /\*{4}-\d{4}$/.test(reg.phone);
  const dupSample = rows.find(x => x.kind === '진료실 예약' && ACTIVE.includes(x.state) && x.date === TODAY);
  const regPast = !!reg.date && reg.date < TODAY, regPastTime = reg.date === TODAY && !!reg.time && reg.time <= NOW;
  const regValid = !!reg.room && !!reg.date && !!reg.time && !!reg.name.trim() && regPhoneOk && !regPast && !regPastTime;
  const submitRegister = () => {
    setRegTried(true); setError('');
    if (!regValid) return;
    const last4 = reg.phone.replace(/\D/g, '').slice(-4);
    const phone = /\*{4}/.test(reg.phone) ? reg.phone : `010-****-${last4}`;
    if (rows.some(x => x.kind === '진료실 예약' && ACTIVE.includes(x.state) && x.name === reg.name.trim() && x.phone === phone && x.date === reg.date)) { setError(DUP_MSG); return; }
    const id = `W${String(rows.length + 1).padStart(3, '0')}`;
    save(
      () => setRows(old => [...old, r({ id, name: reg.name.trim(), phone, date: reg.date, time: reg.time, created: TODAY, room: reg.room, purpose: '병원 등록', channel: '병원 등록(웹)', state: '예약확정' })]),
      `${reg.name.trim()}님 예약을 등록했어요.`,
      () => { setDialog(null); setTab('진행 중'); setDateMode(reg.date === TODAY ? '오늘' : '날짜 선택'); setPickDate(reg.date); setChip(''); }
    );
  };

  /* 진료실 CRUD (비연동) */
  const activeIn = (room: Room) => rows.filter(x => ACTIVE.includes(x.state) && x.room === room.name).length;
  const openRoomForm = (room?: Room) => { setError(''); setRoomTried(false); setRoomForm(room ? { name: room.name, alias: room.alias, dept: room.dept, doctors: room.doctors.length ? [...room.doctors] : [''] } : { name: '', alias: '', dept: '', doctors: [''] }); setDialog({ type: 'roomForm', id: room?.id }); };
  const roomNameDup = rooms.some(x => x.name === roomForm.name.trim() && x.id !== (dialog?.type === 'roomForm' ? dialog.id : undefined));
  const roomValid = !!roomForm.name.trim() && !!roomForm.dept.trim() && roomForm.doctors.some(d => d.trim()) && !roomNameDup;
  const submitRoom = () => {
    setRoomTried(true); setError('');
    if (!roomValid || dialog?.type !== 'roomForm') return;
    const editId = dialog.id;
    const entry = { name: roomForm.name.trim(), alias: roomForm.alias.trim(), dept: roomForm.dept.trim(), doctors: roomForm.doctors.map(d => d.trim()).filter(Boolean) };
    save(() => {
      if (editId) {
        const prev = rooms.find(x => x.id === editId);
        setRooms(old => old.map(x => x.id === editId ? { ...x, ...entry } : x));
        if (prev && prev.name !== entry.name) { setRows(old => old.map(x => x.room === prev.name ? { ...x, room: entry.name } : x)); if (roomFilter === prev.name) setRoomFilter(entry.name); }
      } else setRooms(old => [...old, newRoom(entry, old.length)]);
    }, editId ? '진료실 정보를 저장했어요.' : `진료실 ‘${entry.name}’${eul(entry.name)} 만들었어요. 서비스 운영은 진료실 상세에서 켜 주세요.`, () => setDialog(null));
  };
  const deleteRoom = (room: Room) => save(
    () => { setRooms(old => old.filter(x => x.id !== room.id)); if (roomFilter === room.name) setRoomFilter('전체 진료실'); },
    `진료실 ‘${room.name}’${eul(room.name)} 삭제했어요. 굿닥 서비스·외부 플랫폼 연동이 해지됐어요.`,
    () => setDialog(null)
  );

  /* 진료항목 예약 설정 (현행 규칙) */
  const visibleItems = items.filter(x => x.active).length;
  const activeItemAppt = rows.filter(x => x.kind === '진료항목 예약' && ACTIVE.includes(x.state)).length;
  const kakaoHospital = true;
  const toggleTAppt = () => {
    if (!tAppt.on) { if (visibleItems === 0) { fail('노출 중인 진료항목이 없어, 진료 예약을 받을 수 없습니다.'); return; } setError(''); setDialog({ type: 'tStart' }); return; }
    setError(''); setDialog({ type: 'tStop' });
  };
  const toggleItem = (i: number) => {
    const it = items[i];
    if (it.active && tAppt.on && visibleItems === 1) { setError(''); setDialog({ type: 'tLastHide', index: i }); return; }
    instant(() => setItems(old => old.map((y, j) => j === i ? { ...y, active: !y.active } : y)), `${it.name} 노출을 ${it.active ? '껐어요' : '켰어요'}.`);
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
  const readAll = () => instant(() => setNotis(old => old.map(x => allNotis.some(n => n.id === x.id) ? { ...x, read: true } : x)), '모든 알림을 읽음 처리했어요.', '읽음 처리');

  /* ───────── 렌더 조각 ───────── */
  const skeleton = (n = 5) => <div className="dw-skeleton" aria-label="불러오는 중" role="status">{Array.from({ length: n }, (_, i) => <div key={i}><i /><i /><i /><i /></div>)}</div>;
  const serverBanner = serverDown && <div className="cu-warning dw-banner" role="alert"><VscWarning />굿닥 서버에 연결할 수 없어요. 마지막으로 불러온 정보이며, 상태 변경을 저장할 수 없어요.<button className="cu-btn quiet" onClick={() => { setServerDown(false); notify('서버 연결을 모의 복구했어요.'); }}>다시 연결 (모의)</button></div>;
  const partialBanner = partialFail && <div className="cu-warning dw-banner dw-partial" role="alert"><VscWarning /><span>진료항목 예약을 불러오지 못했어요. 진료실 예약은 정상 표시 중이에요.<Pin n={15} /></span><button className="cu-btn quiet" onClick={() => { setMemoSnap(null); setPartialFail(false); notify('진료항목 예약을 다시 불러왔어요 (모의).'); }}>다시 시도</button></div>;
  const failHint = failSim && <p className="dw-fail-hint"><VscBeaker />체험 설정의 ‘저장 실패’가 켜져 있어요. 확인을 누르면 실패 결과를 보여 줍니다.</p>;
  const errorBox = error && <p className="cu-error" role="alert"><VscError /> {error}</p>;
  const pager = (cur: number, count: number, set: (n: number) => void, label: string) => (
    <div className="cu-pagination"><span>{label}</span><div>
      <button disabled={cur === 1} onClick={() => set(cur - 1)} aria-label="이전 페이지">‹</button>
      {Array.from({ length: count }, (_, i) => <button key={i} className={cur === i + 1 ? 'active' : ''} aria-current={cur === i + 1 ? 'page' : undefined} onClick={() => set(i + 1)}>{i + 1}</button>)}
      <button disabled={cur === count} onClick={() => set(cur + 1)} aria-label="다음 페이지">›</button>
    </div></div>
  );
  /** 진료실 없음: 비연동은 선택형 안내(진료항목 예약만이어도 기본 노출, 닫기 가능 — 판단 메모 26), 연동은 차트 안내 */
  const roomSoftNote = rooms.length === 0 && !softDismissed && (linked
    ? <div className="dw-soft-note"><VscInfo /><span>차트에서 진료실을 등록하면 여기에 표시돼요.</span></div>
    : <div className="dw-soft-note"><VscInfo /><span>진료실을 만들면 진료실 예약도 받을 수 있어요.{opPreset === '진료항목 예약만' ? <Pin n={26} /> : <Pin n={16} />}</span><button className="cu-btn" onClick={() => { go('진료실'); openRoomForm(); }}><VscAdd />진료실 만들기</button><button className="cu-icon" aria-label="안내 닫기" onClick={() => setSoftDismissed(true)}><VscChromeClose /></button></div>);
  const roomsEmpty = linked
    ? <div className="cu-empty"><VscOrganization /><strong>차트에서 진료실을 등록하면 여기에 표시돼요</strong><p>연동한 EMR의 진료실이 자동으로 반영돼요.</p></div>
    : <div className="cu-empty"><VscOrganization /><strong>진료실이 없어요{opPreset === '진료항목 예약만' && <Pin n={27} />}</strong><p>진료실 예약을 받으려면 진료실을 만들어 주세요. 진료항목 예약은 진료실 없이도 받을 수 있어요.</p><button className="cu-btn" onClick={() => openRoomForm()}><VscAdd />진료실 만들기</button></div>;

  const actionsFor = (x: Rec): Act[] => x.kind === '진료항목 예약'
    ? (x.state === '확정 필요' ? ['confirm'] : x.state === '예약확정' ? ['complete'] : [])
    : (x.state === '예약확정' ? ['visit', 'complete'] : x.state === '내원확정' ? ['complete'] : []);
  const rowMenu = (x: Rec) => (
    <div className="dw-kebab-wrap" onClick={e => e.stopPropagation()}>
      <button className="cu-icon" aria-label={`${x.name} 처리 메뉴`} aria-haspopup="menu" aria-expanded={kebab === x.id} onClick={e => {
        if (kebab === x.id) { setKebab(null); return; }
        const btnEl = e.currentTarget as HTMLElement, b = btnEl.getBoundingClientRect();
        focusReturn = btnEl; kebabBtn.current = btnEl;
        setKebabPos({ top: b.bottom + 4, left: Math.max(8, b.right - 140) });
        setKebab(x.id);
      }}><VscKebabVertical /></button>
      {kebab === x.id && <div className="dw-kebab" role="menu" ref={kebabMenu} style={{ position: 'fixed', top: kebabPos.top ?? 'auto', bottom: kebabPos.bottom ?? 'auto', left: kebabPos.left, right: 'auto' }}>
        {actionsFor(x).map(a => <button key={a} role="menuitem" onClick={() => openAction(x.id, a, 'list')}>{ACT_LABEL[a]}</button>)}
        {ACTIVE.includes(x.state) && <button role="menuitem" className="danger-text" onClick={() => openCancel(x.id, 'list')}>예약취소</button>}
        <button role="menuitem" onClick={() => openDetail(x.id)}>상세 보기</button>
      </div>}
    </div>
  );

  const recTable = (data: Rec[], opts: { visitCol: boolean; menuCol: boolean }) => (
    <div className="cu-table-wrap"><table className="cu-table dw-table"><thead><tr>
      {opts.visitCol && <th className="dw-visit-th">내원<Pin n={17} /></th>}
      <th>상태</th><th>방문 예정 / 신청일</th>{showBoth && <th>유형</th>}{roomSide && <th>진료실</th>}<th>내원목적 · 요청사항</th>{itemSide && <th>진료항목 / 가격</th>}<th>환자 / 연락처</th>{opts.menuCol && <th aria-label="처리" />}
    </tr></thead><tbody>
      {data.map(x => { const other = sameDayOther(x); const isItem = x.kind === '진료항목 예약'; return (
        <tr key={x.id} tabIndex={0} onClick={e => { focusReturn = e.currentTarget; openDetail(x.id); }} onKeyDown={e => { if (e.key === 'Enter') { focusReturn = e.currentTarget; openDetail(x.id); } }}>
          {opts.visitCol && <td className="dw-visit-td" onClick={e => e.stopPropagation()}>
            {isItem ? <small className="dw-na">해당 없음</small> : <input type="checkbox" aria-label={`${x.name} 내원 체크`} checked={x.state === '내원확정'} disabled={x.state === '내원확정'} title={x.state === '내원확정' ? '내원확정된 건이에요' : '내원확정 처리'} onChange={e => { focusReturn = e.currentTarget; openAction(x.id, 'visit', 'list'); }} />}
          </td>}
          <td><Tag state={x.state} />{ACTIVE.includes(x.state) && (isItem ? !itemOp : !roomOp) && <span className="dw-warn-chip">운영 중지 · 처리 가능</span>}{hoursWarn(x) && <span className="dw-warn-chip">운영시간 확인</span>}</td>
          <td><strong>{fmt(x.date)} {timeLabel(x)}</strong><small>신청 {fmt(x.created)}{x.created === TODAY && <em className="dw-new">오늘</em>}</small></td>
          {showBoth && <td>{isItem ? '진료항목' : '진료실'}<small>{x.channel}</small></td>}
          {roomSide && <td>{isItem ? <span className="dw-muted">—</span> : x.room}</td>}
          <td className="dw-ellip-td">{(() => { const main = isItem && !itemSide ? x.item : !isItem && !roomSide ? x.purpose : isItem ? (x.etc || '—') : x.purpose; const subt = isItem && !itemSide ? `진료항목 예약 · ${x.price}` : !isItem && !roomSide ? `진료실 예약 · ${x.room}` : isItem ? '요청사항' : (x.etc || '—'); return <span className="dw-ellip" title={`${main}${subt && subt !== '—' ? ' · ' + subt : ''}`}><strong>{main}</strong><small>{subt}</small></span>; })()}</td>
          {itemSide && <td>{isItem ? <><strong>{x.item}</strong><small>{x.price}</small></> : <span className="dw-muted">—</span>}</td>}
          <td><strong>{x.name}{other.length > 0 && <span className="dw-same-ic" role="img" aria-label={`같은 날 다른 예약 ${other.length}건`} title={`같은 날 다른 예약 ${other.length}건 · ${other.map(o => `${o.kind} ${timeLabel(o)}`).join(', ')}`}>+{other.length}</span>}</strong><small>{x.phone}</small></td>
          {opts.menuCol && <td>{ACTIVE.includes(x.state) ? rowMenu(x) : <button className="cu-icon" aria-label={`${x.name} 상세 보기`} onClick={e => { e.stopPropagation(); openDetail(x.id); }}><VscChevronRight /></button>}</td>}
        </tr>); })}
    </tbody></table></div>
  );

  /* ───────── 메뉴 화면 ───────── */
  const dashboard = () => {
    const cnt = (f: (x: Rec) => boolean) => { const a = viewRows.filter(f); return [a.length, a.filter(x => x.kind === '진료실 예약').length, a.filter(x => x.kind === '진료항목 예약').length]; };
    const tiles: [string, number[], '오늘 신청' | '진료완료' | '취소', string][] = [
      ['예약 신청', cnt(x => x.created === TODAY), '오늘 신청', '오늘 새로 들어온 예약'],
      ['진료 완료', cnt(x => x.state === '진료완료' && x.closed === TODAY), '진료완료', '오늘 진료완료 처리'],
      ['진료 취소', cnt(x => ['병원취소', '환자취소'].includes(x.state) && x.closed === TODAY), '취소', '오늘 병원·환자 취소']
    ];
    const bothOp = roomOp && itemOp;
    return <>
      {partialBanner}
      {roomSoftNote}
      <div className="cu-section-heading"><h2>오늘 현황<Pin n={10} /></h2><span>{fmtFull(TODAY)} · 서버 기준 예시 집계</span></div>
      <div className="cu-stat-grid">
        {tiles.map(([label, [all, rm, it], target, subt]) => (
          <button className="cu-stat" key={label} onClick={() => { go('진료 현황'); setChip(target); setTab(target === '오늘 신청' ? '진행 중' : '지난 내역'); setRoomFilter('전체 진료실'); setKindFilter('전체'); setSub('전체'); setSearch(''); }}>
            <span>{label}</span><strong>{all}<small>건</small></strong><em className="dw-stat-sub">{subt}</em>{bothOp && <em className="dw-stat-split">진료실 {rm} · 진료항목 {it}</em>}<VscChevronRight />
          </button>
        ))}
      </div>
      <p className="cu-subnote">타일은 운영 중인 예약 유형을 합산해요. 누르면 진료 현황이 해당 조건으로 열려요.</p>
      <div className="cu-section-heading notice"><h2>공지사항</h2><span>{NOTICES.length}건</span></div>
      <div className="cu-notice-list">{NOTICES.slice((noticePage - 1) * 3, noticePage * 3).map(([type, title, d]) => (
        <button key={title} onClick={() => setDialog({ type: 'notice', title })}><span><span className="cu-notice-type">{type}</span>{title}</span><span>{d}<VscChevronRight /></span></button>
      ))}</div>
      {pager(noticePage, Math.ceil(NOTICES.length / 3), setNoticePage, '3개씩 보기')}
    </>;
  };

  const status = () => {
    const needConfirm = tabList.filter(x => x.state === '확정 필요').length;
    return <>
      {partialBanner}
      {!roomOp && hasActive('진료실 예약') && <p className="cu-inline-note dw-note dw-note-compact"><VscInfo /><span>진료실 예약 운영을 멈췄어요. 새 예약만 받지 않고, 이미 받은 진행 중 예약 {viewRows.filter(x => x.kind === '진료실 예약' && ACTIVE.includes(x.state)).length}건은 그대로 처리할 수 있어요.<Pin n={2} /></span></p>}
      {rooms.length === 0 && opPreset !== '진료항목 예약만' && <p className="cu-inline-note dw-note dw-note-compact"><VscInfo />{linked ? '차트에서 진료실을 등록하면 진료실 예약을 받을 수 있어요. 진료항목 예약은 그대로 처리할 수 있어요.' : '진료실이 없어 진료실 예약을 받을 수 없어요. 진료항목 예약은 그대로 처리할 수 있어요.'}</p>}
      <div className="cu-tabs" role="tablist" aria-label="진료 상태">
        {(['진행 중', '지난 내역'] as const).map(tb => <button key={tb} role="tab" aria-selected={tab === tb} className={tab === tb ? 'active' : ''} onClick={() => { setTab(tb); if (chip && chip !== '오늘 신청' && tb === '진행 중') setChip(''); }}>{tb}<span>{tabRows(tb).length}</span></button>)}
        <Pin n={8} />
      </div>
      <div className="cu-filters">
        <label className="cu-search"><VscSearch /><input aria-label="환자·진료항목 검색" placeholder="환자 이름, 연락처, 진료항목 검색" value={search} onChange={e => setSearch(e.target.value)} /></label>
        <select aria-label="조회 날짜" value={dateMode} disabled={!!chip} onChange={e => setDateMode(e.target.value)}><option>오늘</option><option>날짜 선택</option><option>전체 기간</option></select>
        {dateMode === '날짜 선택' && !chip && <input type="date" className="dw-date" aria-label="날짜 선택" value={pickDate} onChange={e => setPickDate(e.target.value || TODAY)} />}
        {showBoth && <span className="dw-filter-pin"><select aria-label="예약 유형" value={kindFilter} onChange={e => setKindFilter(e.target.value as any)}><option>전체</option><option>진료실 예약</option><option>진료항목 예약</option></select><Pin n={1} /></span>}
        {roomFilterOn && <span className="dw-filter-pin"><select aria-label="진료실 필터" value={roomFilter} onChange={e => setRoomFilter(e.target.value)}><option>전체 진료실</option>{rooms.map(x => <option key={x.id}>{x.name}</option>)}{itemSide && <option value="진료실 미지정">진료실 미지정(진료항목 예약)</option>}</select><Pin n={14} /></span>}
        <button className="cu-icon" aria-label="검색 조건 초기화" title="검색 조건 초기화" onClick={clearFilters}><VscRefresh /></button>
        {crowd.length > 0 && <span className="dw-crowd-chip" role="status" title={`${crowd.map(([k, c]) => `${fmt(k.slice(0, 10))} ${k.slice(11)}~ 같은 시간 진료항목 예약 ${c}건`).join(' · ')} · 진료항목 예약은 환자 정보와 연결되지 않아 같은 환자 여부는 이름·연락처로 추정해요.`}><VscInfo />같은 시간 {crowd.reduce((a, [, c]) => a + c, 0)}건<Pin n={5} /></span>}
      </div>
      {itemSide && roomFilter !== '전체 진료실' && roomFilter !== '진료실 미지정' && kindFilter !== '진료실 예약' && <p className="dw-filter-hint"><VscInfo />진료항목 예약은 진료실이 없어 이 필터에서 빠져요.</p>}
      {chip && <div className="dw-chips"><span className="dw-chip">대시보드 · {chip === '오늘 신청' ? '오늘 신청된 예약' : chip === '진료완료' ? '오늘 진료완료' : '오늘 진료 취소'}<button aria-label="대시보드 조건 해제" onClick={() => setChip('')}><VscChromeClose /></button></span><small>대시보드 조건이 켜져 있는 동안 날짜 필터는 쓰지 않아요.</small></div>}
      <div className="cu-table-toolbar dw-toolbar-compact">
        {tab === '진행 중' && itemSide && <div className="dw-subfilter" role="group" aria-label="하위 필터">{(['전체', '확정 필요'] as const).map(s => <button key={s} aria-pressed={sub === s} className={sub === s ? 'on' : ''} onClick={() => setSub(s)}>{s} <b>{s === '전체' ? tabList.length : needConfirm}</b></button>)}<Pin n={9} /></div>}
        <span>총 <strong>{list.length}</strong>건<small className="dw-toolbar-hint">{chip === '오늘 신청' ? `오늘 신청된 예약 ${tabRows('진행 중').length + tabRows('지난 내역').length}건 중 진행 중 ${tabRows('진행 중').length}건 · 지난 내역 ${tabRows('지난 내역').length}건` : tab === '진행 중' ? [tabList.some(x => x.kind === '진료실 예약') ? '진료실 예약 내원 체크' : '', tabList.some(x => x.kind === '진료항목 예약') ? '진료항목 예약 확정' : ''].filter(Boolean).join('와 ') + (tabList.length ? '은 확인 후 처리돼요.' : '') : ''}</small></span>
        <div><span className="dw-filter-pin"><select aria-label="정렬" value={sort} onChange={e => setSort(e.target.value)}><option>방문 예정 빠른 순</option><option>방문 예정 늦은 순</option></select><Pin n={12} /></span></div>
      </div>
      {loading ? skeleton() : <>
        {list.length > 0 && recTable(list.slice((curPage - 1) * PAGE_SIZE, curPage * PAGE_SIZE), { visitCol: tab === '진행 중' && visitColOn, menuCol: true })}
        {!list.length && <div className="cu-empty"><VscSearch /><strong>{search || chip || roomFilter !== '전체 진료실' || kindFilter !== '전체' || sub !== '전체' ? '조건에 맞는 예약이 없어요' : tab === '진행 중' ? '진행 중인 예약이 없어요' : '지난 내역이 없어요'}</strong><button className="cu-btn" onClick={() => { clearFilters(); setDateMode('전체 기간'); }}>전체 기간으로 보기</button></div>}
        {list.length > 0 && pager(curPage, pageCount, setPage, `${PAGE_SIZE}개씩 보기`)}
      </>}
    </>;
  };

  const history = () => <>
    {partialBanner}
    <div className="dw-hold-bar"><Hold />진료내역 메뉴 제공 여부는 PO 확인 중이에요. 읽기 전용 조회만 시안으로 둡니다.</div>
    <div className="cu-filters">
      <label className="cu-search"><VscSearch /><input aria-label="진료내역 검색" placeholder="환자 이름 또는 연락처 검색" value={hSearch} onChange={e => setHSearch(e.target.value)} /></label>
      <select aria-label="조회 기간" value={hPeriod} onChange={e => setHPeriod(e.target.value)}><option>최근 7일</option><option>최근 30일</option><option>전체 기간</option></select>
    </div>
    <div className="cu-table-toolbar"><span>총 <strong>{histRows.length}</strong>건<small>진료완료·병원취소·환자취소·자동 종료 건 · 최근 순</small></span></div>
    {loading ? skeleton() : histRows.length ? <>{recTable(histRows.slice((hCur - 1) * PAGE_SIZE, hCur * PAGE_SIZE), { visitCol: false, menuCol: true })}{pager(hCur, hCount, setHPage, `${PAGE_SIZE}개씩 보기`)}</> : <div className="cu-empty"><VscHistory /><strong>조회된 진료내역이 없어요</strong></div>}
  </>;

  const itemsPage = () => <>
    <section className="dw-tsec" aria-label="진료 예약 설정">
      <div className="dw-tsec-head"><h2>진료 예약 설정<Pin n={11} /></h2><p>굿닥에 등록한 진료항목으로 예약을 받을 수 있습니다. 진료실 예약 설정(진료실별 예약·스케줄)과는 별개예요.</p></div>
      <div className="cu-setting-row"><div><strong>진료 예약 받기</strong><p><b>{items.length}개의 진료항목이</b> 등록되어 있어요. 노출 중 {visibleItems}개.</p></div>
        <div className="dw-row-ctl"><span className={tAppt.on ? 'cu-blue' : 'cu-muted'}>{tAppt.on ? '운영중' : '미운영'}</span><button className={'cu-toggle ' + (tAppt.on ? 'on' : '')} aria-label="진료 예약 받기" aria-pressed={tAppt.on} onClick={toggleTAppt}><span /></button><Pin n={2} /></div></div>
      <h3 className="dw-tsub">설정</h3>
      <p className="cu-inline-note"><VscInfo /><span><b>병원 운영시간 기준</b> · 병원 운영 시간에 맞춰 30분 단위로 예약을 받습니다. 진료실 스케줄과는 연결되지 않아요.<Pin n={4} /></span></p>
      <div className="cu-setting-row"><div><strong>예약 자동 확정</strong><p>자동 확정 사용 시, 별도 승인 없이 예약 신청과 동시에 자동으로 확정됩니다.</p>{kakaoHospital && tAppt.autoConfirm && <p className="cu-blue">카카오톡 예약하기로 받는 예약은 이 설정과 관계없이 자동으로 확정됩니다.</p>}
        {kakaoHospital && !tAppt.autoConfirm && <div className="dw-guide-warn"><b>카카오톡 예약하기로 받는 예약은 자동으로 확정됩니다</b><ul><li>카카오톡 예약하기가 수동 확정을 지원하지 않아 적용된 임시 정책입니다.</li><li>굿닥으로 받는 예약은 수동으로 확정됩니다.</li><li>진료하기 어려운 예약은 예약 신청 내역에서 취소할 수 있습니다.</li></ul></div>}</div>
        <button className={'cu-toggle ' + (tAppt.autoConfirm ? 'on' : '')} aria-label="예약 자동 확정" aria-pressed={tAppt.autoConfirm} onClick={() => { if (tAppt.autoConfirm && kakaoHospital) { setError(''); setDialog({ type: 'tAutoOff' }); return; } instant(() => setTAppt(o => ({ ...o, autoConfirm: !o.autoConfirm })), tAppt.autoConfirm ? '예약 자동 확정을 껐어요.' : '예약 자동 확정을 켰어요.'); }}><span /></button></div>
      <div className="cu-setting-row"><div><strong>당일 예약 허용</strong><p>당일 예약 허용 시, 현재 시간 기준 1시간 이후부터 당일 예약을 받습니다.</p></div><button className={'cu-toggle ' + (tAppt.sameDay ? 'on' : '')} aria-label="당일 예약 허용" aria-pressed={tAppt.sameDay} onClick={() => instant(() => setTAppt(o => ({ ...o, sameDay: !o.sameDay })), '설정을 저장했어요.')}><span /></button></div>
      <div className="cu-setting-row"><div><strong>새 예약 알림 받기</strong><p>새 예약 신청이 발생하면, 이 PC에서 윈도우 알림을 받습니다.</p></div><button className={'cu-toggle ' + (tAppt.notify ? 'on' : '')} aria-label="새 예약 알림 받기" aria-pressed={tAppt.notify} onClick={() => instant(() => setTAppt(o => ({ ...o, notify: !o.notify })), '설정을 저장했어요.')}><span /></button></div>
    </section>
    {!tAppt.on && <div className="dw-red-box dw-mb"><VscWarning />진료항목을 병원 정보에 노출하려면 '진료 예약 받기'를 켜주세요.<button className="dw-link" onClick={toggleTAppt}>진료 예약 받기</button></div>}
    <div className="cu-item-panel">
      <div className="cu-item-categories"><strong>카테고리</strong><button className="active">전체 <span>{items.length}</span></button></div>
      <div className="cu-item-list"><h3>진료항목<span className="dw-kakao-note">카카오톡 예약하기 노출은 항목별로 관리해요 · 진료실 카카오 연동과 별개<Pin n={7} /></span></h3>{items.map((it, i) => (
        <div className="cu-item-row" key={it.name}>
          <button onClick={() => setDialog({ type: 'notice', title: `${it.name} 진료항목 정보` })}><strong>{it.name}</strong><small>{it.price}</small></button>
          <span className={it.active ? 'cu-blue' : 'cu-muted'}>{it.active ? '노출중' : '미노출'}</span>
          <button className={'cu-toggle ' + (it.active ? 'on' : '')} aria-label={`${it.name} 굿닥 노출`} aria-pressed={it.active} onClick={() => toggleItem(i)}><span /></button>
        </div>
      ))}</div>
    </div>
  </>;

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
          {!n.read && <i className="dw-dot" aria-label="읽지 않음" />}<VscChevronRight />
        </button></li>
      ))}</ul> : <div className="cu-empty"><VscBell /><strong>{notiFilter === '읽지 않음' ? '읽지 않은 알림이 없어요' : '받은 알림이 없어요'}</strong></div>}
      {shown.length > 40 && <p className="cu-subnote">최근 40건만 보여 주고 있어요(시안). 전체 {shown.length}건.</p>}
    </>;
  };

  /* ───────── 상세 모달 ───────── */
  const detailModal = (x: Rec, editing: boolean) => {
    const isItem = x.kind === '진료항목 예약';
    const past = rows.filter(y => y.phone === x.phone && y.name === x.name && y.id !== x.id && CLOSED.includes(y.state)).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);
    const other = sameDayOther(x);
    const canAct = ACTIVE.includes(x.state);
    const footer = editing
      ? <><button className="cu-btn" disabled={busy} onClick={() => { setError(''); setDialog({ type: 'detail', id: x.id }); }}>취소</button><button className="cu-btn primary" disabled={busy} onClick={() => doEdit(x)}>{busy ? '처리 중…' : error ? '다시 시도' : '저장'}</button></>
      : <><button className="cu-btn" onClick={close}>닫기</button>{canAct && <div className="dw-detail-actions">
          <button className="cu-btn dw-danger-line" onClick={() => openCancel(x.id, 'detail')}>예약취소</button>
          {actionsFor(x).map((a, i, arr) => <button key={a} className={'cu-btn ' + (i === arr.length - 1 ? 'primary' : '')} onClick={() => openAction(x.id, a, 'detail')}>{ACT_LABEL[a]}</button>)}
        </div>}</>;
    return <Modal title="예약 상세" wide busy={busy} onClose={close} footer={footer}>
      <div className="cu-detail-heading"><span>{x.kind} · {x.id} · 유입 {x.channel}</span><Tag state={x.state} /></div>
      {x.state === '자동 종료' && <p className="cu-inline-note dw-auto"><VscInfo /><span><strong>실제 진료완료·취소가 아니에요.</strong> 방문 예정 시각이 지나고 결과가 확인되지 않은 건이라 상태를 바꿀 수 없어요. <Hold text="보류 · 접수·진료실 예약 표시 범위 확인 중" /></span></p>}
      {isItem && canAct && <p className="cu-inline-note"><VscInfo /><span>진료항목 예약은 진료실 배정 없이 진료완료로 처리해요. 내원확정 단계는 없어요.<Pin n={3} /></span></p>}
      {hoursWarn(x) && <p className="cu-inline-note dw-warn-note"><VscWarning /><span><b>운영시간 확인</b> · {HOLIDAYS[x.date] ? `${HOLIDAYS[x.date]}(휴진일)` : new Date(`${x.date}T00:00:00`).getDay() === 0 ? '일요일(휴진일)' : '오늘 임시 마감한 진료실이 있는 날'}이에요. 진료항목 예약은 병원 운영시간 기준이라 진료실 휴진·임시 마감과 상관없이 들어와요. 진료 가능 여부를 확인해 주세요.<Pin n={4} /></span></p>}
      {other.length > 0 && <p className="cu-inline-note"><VscInfo /><span>같은 날 다른 예약: {other.map(o => <button key={o.id} className="dw-link" onClick={() => openDetail(o.id)}>{o.kind} {timeLabel(o)} 보기</button>)} · 진료항목 예약은 환자 정보와 연결되지 않아 이름·연락처로 추정해요.<Pin n={5} /></span></p>}
      <div className="dw-detail-label-row"><h3 className="cu-detail-label">예약 정보</h3>{canAct && !editing && <span className="dw-filter-pin"><button className="cu-btn quiet" onClick={() => { setError(''); setEditTried(false); setEdit({ purpose: x.purpose, etc: x.etc, memo: x.memo }); setDialog({ type: 'detail', id: x.id, edit: true }); }}><VscEdit />진료정보 수정</button>{isItem && <Pin n={13} />}</span>}</div>
      <div className="cu-detail-card">
        <dl className="dw-dl">
          <dt>방문 예정</dt><dd><strong className="cu-detail-date">{fmtFull(x.date)} {timeLabel(x)}</strong></dd>
          {isItem ? <><dt>진료항목</dt><dd>{x.item}</dd><dt>가격</dt><dd>{x.price}</dd></> : <><dt>진료실</dt><dd>{x.room}</dd>
            <dt>내원목적</dt><dd>{editing ? <input aria-label="내원목적" value={edit.purpose} maxLength={40} onChange={e => setEdit(o => ({ ...o, purpose: e.target.value }))} /> : x.purpose || '—'}{editing && editTried && !edit.purpose.trim() && <em className="dw-field-err dw-block">내원목적을 입력해 주세요.</em>}</dd></>}
          <dt>{isItem ? '요청사항' : '기타'}</dt><dd>{editing ? <input aria-label={isItem ? '요청사항' : '기타'} value={edit.etc} maxLength={100} placeholder={isItem ? '선택 입력 · 환자 요청 등' : '환자가 남긴 요청 등'} onChange={e => setEdit(o => ({ ...o, etc: e.target.value }))} /> : x.etc || '—'}</dd>
          <dt>진료메모</dt><dd>{editing ? <textarea aria-label="진료메모" value={edit.memo} maxLength={200} placeholder="병원 내부 메모 · 환자에게 보이지 않아요" onChange={e => setEdit(o => ({ ...o, memo: e.target.value }))} /> : x.memo || '—'}</dd>
          <dt>신청일</dt><dd>{fmtFull(x.created)}</dd>
          {x.reason && <><dt>처리 사유</dt><dd>{x.reason}</dd></>}
        </dl>
        {editing && <p className="cu-subnote">방문 예정 일시는 기존 데스크에서도 바꾸지 않아 웹에서 제외했어요. 바꾸려면 취소 후 다시 예약해 주세요.</p>}
      </div>
      <h3 className="cu-detail-label">환자 기본정보</h3>
      <div className="cu-detail-card cu-person dw-person"><div><span>이름</span><strong>{x.name}</strong></div><div><span>연락처</span><strong>{x.phone}</strong></div><div><span>생년월일</span><strong>{x.birth}</strong></div></div>
      <p className="cu-inline-note"><VscInfo /><span><Hold text="보류" /> 주민번호·주소 표시 범위는 PO 확인 중이라 웹에는 보여 주지 않아요.{cfg.rrn7 && ' (이 PC의 환경설정에서 주민번호 7자리 표시가 켜져 있어요 — 웹 반영 여부 확인 중)'} 환자 메뉴는 웹에서 제공하지 않아요.</span></p>
      <h3 className="cu-detail-label">최근 진료 이력</h3>
      {past.length ? <ul className="dw-history">{past.map(p => <li key={p.id}><span>{fmtFull(p.date)} {timeLabel(p)}</span><span>{p.room === '—' ? p.item : `${p.room} · ${p.purpose}`}</span><Tag state={p.state} /></li>)}</ul> : <p className="dw-muted-line">이 병원에서의 이전 진료 이력이 없어요.</p>}
      {failHint}{errorBox}
    </Modal>;
  };

  /* ───────── 셸 ───────── */
  const kit: Kit = { Modal, notify: (s: string) => notify(s), fail, instant, serverDown, failSim, linked, chartLimited, mode: chartMode, Pin, itemOnly: opPreset === '진료항목 예약만', chartMissingId: chartMissing ? 'R2' : undefined, onOpenKakao: () => setDialog({ type: 'kakao' }) };
  const noRoomLabel = chartMode === 'unlinked' ? '진료실 없음(정상 상태)' : '진료실 없음';
  const expToggles: [string, boolean, (v: boolean) => void, React.ReactNode, boolean?][] = [
    ['차트 진료실 없음', chartMissing, setChartMissing, <span>차트 진료실 없음 <em className="dw-exp-note">EMR 연동만 · 2진료실</em></span>, !linked],
    ['차트 기능 제한', chartLimited, (v: boolean) => { setMemoSnap(null); setChartLimited(v); }, <span>차트 기능 제한 <em className="dw-exp-note">EMR 연동만 · 원격·예약 막힘</em></span>, !linked],
    ['스마트접수 가능', smart, setSmart, '스마트접수 가능'],
    ['진료항목 조회 실패', partialFail, (v: boolean) => { setMemoSnap(null); setPartialFail(v); }, '진료항목 조회 실패'],
    ['저장 실패', failSim, setFailSim, '저장 실패'],
    ['서버 오류', serverDown, setServerDown, '서버 오류'],
    ['알림 99+', manyNoti, toggleMany, '알림 99+']
  ];
  const moreOn = [chartMissing, chartLimited, !smart, partialFail, failSim, serverDown, manyNoti].filter(Boolean).length;
  const expOn = [chartMode !== 'unlinked', chartLimited, noRooms, !smart, partialFail, failSim, serverDown, manyNoti, opPreset !== '둘 다'].filter(Boolean).length;
  const connection = chartMode === 'linked' ? `${CHART_NAME} · 연결됨` : '비연동 · EMR 연동 안 함';
  const moduleMenu = menu === '진료실' || menu === '진료실 운영 설정';
  return <div className="cu-app dw-app">
    <div className="cu-prototype">
      <div><strong>데스크 기능 웹 이관 시안</strong><span>v0.12 · 커넥트 웹뷰 UI · 가상 데이터</span></div>
      <div className="cu-proto-actions">
        <span className="dw-legend"><Hold /> = PO 확인 중</span>
        <label className="dw-annot-toggle"><button type="button" className={'cu-toggle ' + (annot ? 'on' : '')} aria-pressed={annot} aria-label="판단 메모 보기" onClick={() => setAnnot(!annot)}><span /></button>판단 메모 보기</label>
        <button className={'dw-exp-btn dw-notes-btn ' + (drawer ? 'open' : '')} aria-expanded={drawer} aria-controls="dw-notes" onClick={() => setDrawer(!drawer)}><VscComment />판단 메모 {NOTES.length}건</button>
        <button className={'dw-exp-btn ' + (panelOpen ? 'open' : '')} aria-expanded={panelOpen} aria-controls="dw-exp-strip" onClick={() => setPanelOpen(!panelOpen)}><VscBeaker />체험 설정{expOn > 0 && <b>{expOn}</b>}<em>프로토 전용</em></button>
        <button className="cu-icon" disabled={modalOpen} onClick={resetAll} aria-label="시안 초기화" title="시안 초기화"><VscRefresh /></button>
      </div>
    </div>
    {panelOpen && <div className="dw-exp-strip" id="dw-exp-strip" role="region" aria-label="체험 설정 (프로토타입 전용 · 실제 기능 아님)">
      <span className="dw-exp-tag">프로토 전용</span>
      {modalOpen && <span className="dw-exp-lock">모달이 열려 있는 동안은 바꿀 수 없어요</span>}
      <label className={'dw-exp-item ' + (modalOpen ? 'locked' : '')}>차트 모드<select aria-label="차트 모드" disabled={modalOpen} value={chartMode} onChange={e => { const v = e.target.value as ChartMode; setMemoSnap(null); setChartMode(v); if (v !== 'linked') setChartLimited(false); notify(v === 'unlinked' ? '비연동 병원(기본)으로 전환했어요. 접수·차례 알림은 비활성이고 예약을 운영해요.' : 'EMR 연동 병원으로 전환했어요. 진료실 자체는 EMR에서 관리해요.'); }}><option value="unlinked">비연동 · 굿닥에서 관리</option><option value="linked">EMR 연동</option></select></label>
      <label className={'dw-exp-item ' + (modalOpen ? 'locked' : '')}>운영 유형<select aria-label="운영 유형" disabled={modalOpen} value={presetShown} onChange={e => { if (e.target.value === CUSTOM) return; setMemoSnap(null); applyPreset(e.target.value as Preset); }}>{PRESETS.map(x => <option key={x}>{x}</option>)}{presetShown === CUSTOM && <option value={CUSTOM} disabled>{CUSTOM}</option>}</select></label>
      <label className={'dw-exp-item ' + (modalOpen ? 'locked' : '')}><button type="button" className={'cu-toggle ' + (noRooms ? 'on' : '')} aria-label={noRoomLabel} aria-pressed={noRooms} disabled={modalOpen || opPreset === '진료항목 예약만'} title={opPreset === '진료항목 예약만' ? '진료항목 예약만 프리셋에서는 프리셋이 정해요' : undefined} onClick={() => { setMemoSnap(null); toggleNoRooms(!noRooms); }}><span /></button>{noRoomLabel}{opPreset === '진료항목 예약만' && <em className="dw-exp-note">프리셋 고정</em>}{noRooms && rooms.length > 0 && <em className="dw-exp-note">체험 중 · {rooms.length}개 만듦</em>}</label>
      <div className="dw-exp-more-wrap">
        <button type="button" className="dw-exp-more" disabled={modalOpen} aria-expanded={moreOpen} onClick={() => setMoreOpen(!moreOpen)}>조건 더보기{moreOn > 0 && <b>{moreOn}</b>} ▾</button>
        {moreOpen && <div className="dw-exp-pop" role="group" aria-label="체험 조건">{expToggles.map(([label, value, set, shown, dis]) => <label key={label} className={'dw-exp-item ' + (modalOpen || dis ? 'locked' : '')}><button type="button" className={'cu-toggle ' + (value ? 'on' : '')} aria-label={label} aria-pressed={value} disabled={modalOpen || !!dis} onClick={() => set(!value)}><span /></button>{shown}</label>)}</div>}
      </div>
      <span className="dw-exp-judge">판정: 진료실 예약 {roomOp ? '운영' : '미운영'} · 진료항목 예약 {itemOp ? '운영' : '미운영'}</span>
      {memoSnap && <span className="dw-exp-memo">메모 이동으로 바뀜<button type="button" className="dw-link" disabled={modalOpen} onClick={revertMemo}>되돌리기</button></span>}
      <button className="cu-btn quiet dw-exp-reset" disabled={modalOpen} onClick={resetAll}><VscRefresh />처음 상태로</button>
    </div>}
    <div className="cu-planned"><VscInfo />미승인 시안 · 하반기 범위: 비연동 병원(기존 데스크 사용 병원) · EMR 연동은 선택 · 굿닥 서버 기준 데이터 · 실제 서버·차트·환자 알림과 통신하지 않아요.</div>
    {drawer && <aside className="dw-notes" id="dw-notes" aria-label="판단 메모 목록">
      <header><div><strong>판단 메모 {NOTES.length}건</strong><small>PO 확인이 필요한 제안·PD 판단이에요. 항목을 누르면 해당 화면으로 이동해요.</small></div><button className="cu-icon" aria-label="판단 메모 목록 닫기" onClick={() => setDrawer(false)}><VscChromeClose /></button></header>
      <ol>{NOTES.map(nt => <li key={nt.n}><button onClick={() => jumpTo(nt)}><span className="dw-pin static">{nt.n}</span><span><b>{nt.title}</b><small>{nt.where}</small></span><em className="dw-pin-chip">PO 확인 필요</em></button></li>)}</ol>
    </aside>}
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
            <div className="cu-hospital"><strong>굿닥 예시의원</strong><span>{chartMode === 'linked' ? 'EMR 연동 병원 (체험)' : '비연동 병원 · 화면 검토용'}</span></div>
            <div className="cu-nav-section">서비스 운영</div>
            {NAV.map(n => <button key={n.key} className={'cu-nav-row ' + (menu === n.key ? 'active' : '')} aria-current={menu === n.key ? 'page' : undefined} onClick={() => go(n.key)}>
              {n.icon}<span>{n.key}{n.hold && <Hold />}</span>
              {n.key === '알림 메시지함' && unread > 0 && <b className="dw-badge nav">{badge(unread)}</b>}
            </button>)}
            <div className="cu-nav-section">병원 홍보</div>
            <button className="cu-nav-row" onClick={() => setDialog({ type: 'notice', title: '병원 검색 정보' })}><span>병원 검색 정보</span><VscChevronRight /></button>
            <div className="cu-nav-section">외부 플랫폼 연동</div>
            <button className="cu-nav-row" onClick={() => setDialog({ type: 'kakao' })}><span>카카오톡 예약하기</span><VscChevronRight /></button>
            <div className="cu-nav-bottom"><span>환자 메뉴 미제공 (법률 검토)</span><button onClick={() => setDialog({ type: 'notice', title: '이용가이드' })}>이용가이드</button></div>
          </aside>
          <main className="cn-main cu-main">
            {menu === '진료실' && <ExamRooms key={roomsKey} kit={kit} rooms={rooms} setRooms={setRooms} invalid={invalid} setInvalid={setInvalid} initialView={roomsInit} emptyNode={roomsEmpty} activeIn={activeIn} banner={serverBanner} Hold={Hold}
              onCreate={() => openRoomForm()} onEdit={rm => openRoomForm(rm)} onDelete={rm => { setError(''); setDialog({ type: 'roomDelete', id: rm.id }); }} />}
            {menu === '진료실 운영 설정' && <OperationPage key={roomsKey} kit={kit} rooms={rooms} smart={smart} banner={serverBanner} store={{ saved: opSaved, setSaved: setOpSaved, paths: opPaths, setPaths: setOpPaths, autoSaved: opAuto, setAutoSaved: setOpAuto }} onOpenRoom={id => go('진료실', { v: 'detail', id })} />}
            {!moduleMenu && <>
              <header className={'cn-header cu-header ' + (menu === '진료 현황' ? 'dw-status-head' : '')}>
                <div><h1 className="cn-title" tabIndex={-1} title={menu === '진료 현황' ? DESC[menu] : undefined}>{menu}{menu === '진료내역' && <Hold />}</h1><p className="cn-desc">{DESC[menu]}</p></div>
                {menu === '진료 현황' && roomOp && <div className="dw-head-actions"><span className="dw-hold-inline"><Hold /></span><button className="cu-btn primary" disabled={!rooms.length} title={!rooms.length ? '진료실 예약은 진료실이 있어야 등록할 수 있어요' : undefined} onClick={() => { setError(''); setRegTried(false); setReg({ room: rooms[0]?.name || '', date: TODAY, time: '', name: '', phone: '' }); setDialog({ type: 'register' }); }}><VscAdd />진료실 예약 등록</button></div>}
                {['대시보드', '진료내역', '알림 메시지함'].includes(menu) && <button className="cu-btn quiet" onClick={() => { setLoading(true); notify('서버에서 다시 불러왔어요 (모의).'); }}><VscRefresh />새로고침</button>}
              </header>
              {serverBanner}
              <div className="cu-content">
                {menu === '대시보드' && dashboard()}
                {menu === '진료 현황' && status()}
                {menu === '진료내역' && history()}
                {menu === '진료항목' && itemsPage()}
                {menu === '알림 메시지함' && notiPage()}
              </div>
            </>}
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

    {dialog?.type === 'action' && chosen && <Modal title={dialog.act === 'visit' ? '내원확정 처리할까요?' : dialog.act === 'confirm' ? '예약을 확정할까요?' : '진료완료 처리할까요?'} busy={busy} onClose={() => { if (!busy) backFrom(chosen.id, dialog.from); }} footer={<><button className="cu-btn" disabled={busy} onClick={() => backFrom(chosen.id, dialog.from)}>취소</button><button className="cu-btn primary" disabled={busy || !ACTIVE.includes(chosen.state)} onClick={() => doAction(chosen, dialog.act, dialog.from)}>{busy ? '처리 중…' : error ? '다시 시도' : '확인'}</button></>}>
      <div className="cu-detail-card"><strong>{chosen.name} · {chosen.kind}</strong><p>{fmtFull(chosen.date)} {timeLabel(chosen)} · {chosen.kind === '진료항목 예약' ? chosen.item : chosen.room}</p></div>
      <p>{dialog.act === 'visit' ? '환자가 병원에 도착했음을 확인하고 내원확정으로 바꿔요. 웹에서는 내원확정을 되돌릴 수 없어요.' : dialog.act === 'confirm' ? '신청된 진료항목 예약을 예약확정으로 바꾸고 환자에게 확정 안내가 발송돼요.' : chosen.kind === '진료항목 예약' ? '진료항목 예약은 진료실 배정 없이 진료완료로 처리해요. 진료완료 후에는 상태를 바꿀 수 없어요.' : '실제 진료가 끝났는지 확인한 뒤 처리해 주세요. 진료완료 후에는 상태를 바꿀 수 없어요.'}</p>
      {dialog.act === 'visit' && <p className="cu-subnote">기존 데스크는 체크박스를 누르면 바로 처리되지만, 웹에서는 오탭을 막기 위해 한 번 더 확인해요.</p>}
      {failHint}{errorBox}
    </Modal>}

    {dialog?.type === 'cancel' && chosen && <Modal title={<>예약 취소 사유를 선택해 주세요<Pin n={6} /></>} busy={busy} onClose={() => { if (!busy) backFrom(chosen.id, dialog.from); }} footer={<><button className="cu-btn" disabled={busy} onClick={() => backFrom(chosen.id, dialog.from)}>닫기</button><button className="cu-btn danger" disabled={busy || !reason || !ACTIVE.includes(chosen.state)} onClick={() => doCancel(chosen, dialog.from)}>{busy ? '처리 중…' : error ? '다시 시도' : '예약 취소'}</button></>}>
      <p className="cu-cancel-context">{chosen.name} · {chosen.kind === '진료항목 예약' ? chosen.item : chosen.purpose}<br />{fmtFull(chosen.date)} {timeLabel(chosen)}</p>
      <div className="cu-radio-list" role="radiogroup" aria-label="취소 사유">{reasonsFor(chosen.kind).map(s => <label key={s}><input name="reason" type="radio" value={s} checked={reason === s} disabled={busy} onChange={() => setReason(s)} />{s}{reason === s && <small className="dw-reason-hint">환자에게 안내돼요</small>}</label>)}</div>
      {!reason && <p className="dw-field-err dw-block">취소 사유를 선택해 주세요.</p>}
      <p className="cu-inline-note"><VscInfo />선택한 사유는 병원취소 사유로 저장되고 환자에게 취소 안내가 발송돼요. 기존 데스크는 사유 없이 ‘병원취소’로만 저장했어요.</p>
      {failHint}{errorBox}
    </Modal>}

    {dialog?.type === 'register' && <Modal title={<>진료실 예약 등록 <Hold /></>} busy={busy} onClose={close} footer={<><button className="cu-btn" disabled={busy} onClick={close}>취소</button><button className="cu-btn primary" disabled={busy} onClick={submitRegister}>{busy ? '처리 중…' : error && error !== DUP_MSG ? '다시 시도' : '등록'}</button></>}>
      <div className="dw-hold-bar"><Hold />웹 예약 등록 제공 여부는 PO 확인 중이에요. 환자 메뉴가 없어 환자 검색 없이 이름·연락처만 입력해요.</div>
      <div className="dw-form-grid">
        <label className="cu-form-label"><span>진료실 <b className="dw-req">*</b></span><select aria-label="진료실" value={reg.room} onChange={e => setReg(o => ({ ...o, room: e.target.value }))}><option value="">선택해 주세요</option>{rooms.map(x => <option key={x.id}>{x.name}</option>)}</select>{regTried && !reg.room && <em className="dw-field-err">진료실을 선택해 주세요.</em>}</label>
        <label className="cu-form-label"><span>예약일 <b className="dw-req">*</b></span><input type="date" aria-label="예약일" min={TODAY} value={reg.date} onChange={e => setReg(o => ({ ...o, date: e.target.value }))} />{regTried && !reg.date && <em className="dw-field-err">예약일을 선택해 주세요.</em>}{regTried && regPast && <em className="dw-field-err">오늘 이후 날짜를 선택해 주세요.</em>}</label>
        <label className="cu-form-label"><span>예약 시간 <b className="dw-req">*</b></span><select aria-label="예약 시간" value={reg.time} onChange={e => setReg(o => ({ ...o, time: e.target.value }))}><option value="">선택해 주세요</option>{TIMES.map(tm => <option key={tm} value={tm} disabled={reg.date === TODAY && tm <= NOW}>{tm}{reg.date === TODAY && tm <= NOW ? ' (지난 시간)' : ''}</option>)}</select>{regTried && !reg.time && <em className="dw-field-err">예약 시간을 선택해 주세요.</em>}{regTried && regPastTime && <em className="dw-field-err">이미 지난 시간이에요. 현재({NOW}) 이후 시간을 선택해 주세요.</em>}</label>
        <label className="cu-form-label"><span>환자 이름 <b className="dw-req">*</b></span><input aria-label="환자 이름" maxLength={20} placeholder="예) 김○○" value={reg.name} onChange={e => setReg(o => ({ ...o, name: e.target.value }))} />{regTried && !reg.name.trim() && <em className="dw-field-err">환자 이름을 입력해 주세요.</em>}</label>
        <label className="cu-form-label dw-span2"><span>연락처 <b className="dw-req">*</b></span><input aria-label="연락처" maxLength={13} placeholder="010-0000-0000 · 실제 번호는 입력하지 마세요" value={reg.phone} onChange={e => setReg(o => ({ ...o, phone: e.target.value }))} />{regTried && !regPhoneOk && <em className="dw-field-err">연락처를 10자리 이상 입력해 주세요.</em>}</label>
      </div>
      {dupSample && <button className="cu-btn quiet dw-fill" type="button" onClick={() => { setError(''); setReg({ room: dupSample.room, date: dupSample.date, time: '16:30', name: dupSample.name, phone: dupSample.phone }); }}><VscBeaker />중복 체험 값 채우기 (오늘 진료실 예약이 있는 {dupSample.name})</button>}
      <p className="cu-subnote">같은 날 같은 환자(이름·연락처)의 진행 중 진료실 예약이 있으면 등록할 수 없어요. 진료항목 예약은 중복 검사 대상이 아니에요. 지난 날짜·시간(현재 {NOW})은 고를 수 없어요.</p>
      {failHint}{errorBox}
    </Modal>}

    {dialog?.type === 'roomForm' && <Modal title={dialog.id ? '진료실 정보 수정' : '새 진료실'} busy={busy} onClose={close} footer={<><button className="cu-btn" disabled={busy} onClick={close}>취소</button><button className="cu-btn primary" disabled={busy} onClick={submitRoom}>{busy ? '처리 중…' : error ? '다시 시도' : '저장'}</button></>}>
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
      <p className="cu-subnote">진료과·담당 의사는 기존 데스크와 같은 텍스트 규격이에요. 진료실 수정 정책은 기존 데스크와 동일하게 적용돼요. 새 진료실은 모든 서비스가 꺼진 상태로 만들어져요.</p>
      {failHint}{errorBox}
    </Modal>}

    {dialog?.type === 'roomDelete' && chosenRoom && (activeIn(chosenRoom) > 0
      ? <Modal title="진료실을 삭제할 수 없어요" onClose={close} footer={<><button className="cu-btn" onClick={close}>닫기</button><button className="cu-btn primary" onClick={() => { setDialog(null); go('진료 현황'); setTab('진행 중'); setDateMode('전체 기간'); setChip(''); setSearch(''); setKindFilter('전체'); setRoomFilter(chosenRoom.name); }}>진행 중인 건 보기</button></>}>
          <p>{chosenRoom.name}에 진료가 진행 중인 건이 <strong>{activeIn(chosenRoom)}건</strong> 있어요. 모두 진료완료하거나 취소한 뒤 삭제해 주세요.</p>
        </Modal>
      : <Modal title="진료실을 삭제할까요?" busy={busy} onClose={close} footer={<><button className="cu-btn" disabled={busy} onClick={close}>취소</button><button className="cu-btn danger" disabled={busy} onClick={() => deleteRoom(chosenRoom)}>{busy ? '처리 중…' : error ? '다시 시도' : '삭제'}</button></>}>
          <div className="cu-detail-card"><strong>{chosenRoom.name}</strong><p>{chosenRoom.dept} ∙ {chosenRoom.doctors.join(', ')}</p></div>
          <p className="cu-inline-note dw-warn-note"><VscWarning />삭제하면 굿닥 서비스·외부 플랫폼 연동이 자동 해지됩니다. 삭제된 정보는 되돌릴 수 없으니 유의해 주세요.</p>
          {failHint}{errorBox}
        </Modal>)}

    {dialog?.type === 'tStart' && <Modal title="진료 예약 받기를 시작할까요?" busy={busy} onClose={close} footer={<><button className="cu-btn" disabled={busy} onClick={close}>취소</button><button className="cu-btn primary" disabled={busy} onClick={() => save(() => setTAppt(o => ({ ...o, on: true })), '진료 예약 받기를 시작했어요.', () => setDialog(null))}>{busy ? '처리 중…' : error ? '다시 시도' : '시작하기'}</button></>}>
      <p className="dw-pre">{'시작하기를 누르면 굿닥에서 진료항목을 노출하고\n예약을 받을 수 있어요.'}</p>{failHint}{errorBox}
    </Modal>}
    {dialog?.type === 'tStop' && <Modal title="진료 예약을 그만 받으시겠어요?" busy={busy} onClose={close} footer={<><button className="cu-btn" disabled={busy} onClick={close}>취소</button><button className="cu-btn danger" disabled={busy} onClick={() => save(() => setTAppt(o => ({ ...o, on: false })), '진료 예약 받기를 중지했어요.', () => setDialog(null))}>{busy ? '처리 중…' : error ? '다시 시도' : '그만 받기'}</button></>}>
      <p>그만 받기를 누르면 굿닥에서 진료항목 노출과 예약 신청이 모두 중단돼요. 등록된 진료항목은 그대로 유지되며, 다시 시작하면 바로 예약을 받을 수 있어요.</p>
      {kakaoHospital && <p className="cu-inline-note dw-warn-note"><VscWarning /><span>카카오톡 예약하기의 진료항목 상품 판매도 함께 중지돼요.<Pin n={7} /></span></p>}
      {activeItemAppt > 0 && <p className="cu-inline-note"><VscInfo /><span>새 예약만 받지 않아요. 이미 받은 진행 중 예약 {activeItemAppt}건은 그대로 처리해 주세요.<Pin n={2} /></span></p>}
      {failHint}{errorBox}
    </Modal>}
    {dialog?.type === 'tAutoOff' && <Modal title="카카오톡 예약하기로 받는 예약은 계속 자동으로 확정됩니다" busy={busy} onClose={close} footer={<><button className="cu-btn" disabled={busy} onClick={close}>취소</button><button className="cu-btn primary" disabled={busy} onClick={() => save(() => setTAppt(o => ({ ...o, autoConfirm: false })), '예약 자동 확정을 껐어요.', () => setDialog(null))}>{busy ? '처리 중…' : error ? '다시 시도' : '자동 확정 끄기'}</button></>}>
      <p className="dw-pre">{'카카오톡 예약하기가 수동 확정을 지원하지 않아 적용된 임시 정책입니다.\n굿닥으로 받는 예약은 수동으로 확정됩니다.'}</p>{failHint}{errorBox}
    </Modal>}
    {dialog?.type === 'tLastHide' && <Modal title="진료 예약 받기가 중지돼요" busy={busy} onClose={close} footer={<><button className="cu-btn" disabled={busy} onClick={close}>취소</button><button className="cu-btn danger" disabled={busy} onClick={() => { const i = dialog.index; save(() => { setItems(old => old.map((y, j) => j === i ? { ...y, active: false } : y)); setTAppt(o => ({ ...o, on: false })); }, '진료 예약 받기를 중지했어요.', () => setDialog(null)); }}>{busy ? '처리 중…' : error ? '다시 시도' : '노출 중지'}</button></>}>
      <p className="dw-pre">{'노출 중인 마지막 항목을 미노출하면 진료 예약 받기도 함께 중지돼요.\n등록된 진료항목은 그대로 유지되며, 다시 시작하면 바로 예약을 받을 수 있어요.'}</p>
      {activeItemAppt > 0 && <p className="cu-inline-note"><VscInfo /><span>새 예약만 받지 않아요. 이미 받은 진행 중 예약 {activeItemAppt}건은 그대로 처리해 주세요.</span></p>}
      {failHint}{errorBox}
    </Modal>}

    {dialog?.type === 'kakao' && (() => {
      const sup = (k: 'mobile' | 'appt') => svcSupported(chartMode, chartLimited, k);
      const none = !sup('mobile') && !sup('appt');
      const label = (k: 'mobile' | 'appt') => k === 'mobile' ? '원격 접수' : '예약';
      return <Modal title={<>카카오톡 예약하기 연동 설정<Pin n={23} /></>} wide onClose={close} footer={<button className="cu-btn primary" onClick={close}>닫기</button>}>
        <p>진료실별로 카카오 예약하기·카카오 맵에서 원격 접수·예약을 받을지 정해요. 진료실 상세의 ‘페이지로 이동’에서도 열 수 있어요.</p>
        {none ? <div className="dw-red-box"><VscWarning /><span><b>연동 불가</b> · 현재 사용 중인 차트({CHART_NAME})는 원격 접수·예약 기능이 지원되지 않으니, 사용을 원하실 경우 차트사에 문의해 주세요.</span></div>
          : chartMode === 'unlinked' && <p className="cu-inline-note"><VscInfo />비연동 병원은 예약만 연동할 수 있어요. 원격 접수는 EMR 연동 시 사용 가능해요.</p>}
        {rooms.length === 0 ? <p className="cu-subnote">진료실이 없어요. 진료실 예약을 연동하려면 진료실을 만들어 주세요.</p> :
          <table className="dw-auto-table dw-kakao-table"><thead><tr><th>진료실</th><th>원격 접수</th><th>예약</th></tr></thead><tbody>{rooms.map(rm => <tr key={rm.id}><td className="dw-auto-name">{rm.alias || rm.name}</td>
            {(['mobile', 'appt'] as const).map(k => <td key={k}>{!sup(k) ? <span className="dw-muted">{chartMode === 'unlinked' ? 'EMR 연동 시 사용 가능' : '연동 불가'}</span> : !rm[k].accepted ? <span className="dw-muted">{label(k)} 미사용</span>
              : <span className="dw-kakao-cell"><span className={'dw-kakao ' + (rm[k].kakao ? 'on' : '')}>{rm[k].kakao ? '연동중' : '미연동'}</span><button className={'cu-toggle ' + (rm[k].kakao ? 'on' : '')} aria-label={`${rm.name} ${label(k)} 카카오 연동`} aria-pressed={rm[k].kakao} onClick={() => {
                if (!rm[k].kakao && k === 'appt' && rm.appt.advanced) { fail('기본 설정으로 전환해야 연동할 수 있어요. 해당 진료실은 고급 설정으로 예약을 받고 있어요.'); return; }
                const hasSched = k === 'mobile' ? rm.rSlots.mobile.some(x => x.date > TODAY || (x.date === TODAY && x.end > NOW)) : rm.aSlots.some(x => x.date > TODAY || (x.date === TODAY && x.time > NOW));
                if (!rm[k].kakao && !hasSched) { fail(`카카오 예약하기로 ${label(k)}${k === 'mobile' ? '를' : '을'} 받으려면 운영 스케줄이 필요해요`); return; }
                instant(() => setRooms(old => old.map(x => x.id === rm.id ? { ...x, [k]: { ...x[k], kakao: !x[k].kakao } } : x)), rm[k].kakao ? `${label(k)} 연동을 해지했어요.` : `${label(k)} 연동을 완료했어요.`, rm[k].kakao ? '연동 해지' : '연동');
              }}><span /></button></span>}</td>)}
          </tr>)}</tbody></table>}
        <p className="cu-subnote">진료항목의 카카오톡 예약하기 노출은 진료항목 메뉴에서 항목별로 관리해요.</p>
      </Modal>;
    })()}

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
      <h3 className="cu-detail-label">EMR 연동</h3>
      <div className="dw-key"><span className={'cu-dot ' + (serverDown ? 'warn' : '')} /><div><strong>{connection}</strong><p>{linked ? '연동한 EMR의 설정에서 관리해요 (체험).' : '진료실·예약을 굿닥에서 관리해요. 접수·차례 알림을 쓰려면 EMR을 연동해 주세요.'}</p></div>{!linked && <button className="cu-btn" aria-expanded={emrGuide} onClick={() => setEmrGuide(!emrGuide)}>EMR 연동하기</button>}</div>
      {!linked && emrGuide && <div className="cu-inline-note dw-note"><VscInfo /><span>EMR 연동은 병원에서 쓰는 EMR에 굿닥 연동을 설치한 뒤 적용돼요. 연동하면 현장·원격 접수와 차례 알림을 쓸 수 있고, 진료실은 EMR 기준으로 바뀌어요. 시안에서는 설치 과정을 생략했어요. <button type="button" className="dw-link" onClick={() => { setMemoSnap(null); setChartMode('linked'); setChartLimited(false); setEmrGuide(false); notify('EMR 연동 병원으로 전환했어요(체험). 진료실 자체는 EMR에서 관리해요.'); }}>EMR 연동 병원으로 체험하기</button></span></div>}
    </Modal>}

    {keyConfirm && <Modal title="제품키를 해제할까요?" busy={keyBusy} onClose={() => setKeyConfirm(false)} footer={<><button className="cu-btn" disabled={keyBusy} onClick={() => setKeyConfirm(false)}>취소</button><button className="cu-btn danger" disabled={keyBusy} onClick={async () => { setKeyBusy(true); await wait(600); setKeyBusy(false); setKeyConfirm(false); if (serverDown || failSim) { fail(serverDown ? '굿닥 서버에 연결할 수 없어 제품키를 해제하지 못했어요. 상태는 그대로예요.' : '제품키를 해제하지 못했어요(모의 실패). 상태는 그대로예요.'); return; } notify('제품키 해제를 모의 처리했어요. 실제로는 인증 화면으로 돌아가요(시안에선 생략).'); }}>{keyBusy ? '처리 중…' : '해제'}</button></>}>
      <p>해제하면 이 PC에서 커넥트를 다시 쓰려면 제품키를 입력해야 해요. 다른 PC와 병원 데이터에는 영향이 없어요.</p>
    </Modal>}

    {dialog?.type === 'notice' && <Modal title={dialog.title} onClose={close} footer={<button className="cu-btn primary" onClick={close}>확인</button>}>
      {dialog.title === '이용가이드' ? <ol className="cu-guide">
        <li><strong>대시보드</strong> 타일을 눌러 오늘 신청·완료·취소 건으로 바로 이동해요.</li>
        <li><strong>진료 현황</strong>에서 진료실 예약은 내원 체크·진료완료, 진료항목 예약은 예약 확정·진료완료를 처리해요.</li>
        <li><strong>진료실</strong>에서 진료실별 현장 접수·원격 접수·예약 운영과 스케줄을 관리해요.</li>
        <li>상단 바의 <strong>판단 메모</strong>로 PO 확인이 필요한 제안을, <strong>체험 설정</strong>으로 병원 조건을 바꿔 봐요.</li>
      </ol> : <p>시안에서는 내용을 생략했어요. 기존 커넥트 웹뷰의 메뉴 위치만 보여 줍니다.</p>}
      <p className="cu-subnote">가상 검토용 · 실제 환자정보를 입력하지 마세요.</p>
    </Modal>}
  </div>;
}
