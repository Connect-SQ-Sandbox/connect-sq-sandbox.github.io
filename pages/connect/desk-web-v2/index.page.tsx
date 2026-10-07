/**
 * ┌─ 프로토타입 컨텍스트 ───────────────────────────────────
 * 이름     : desk-web-v2 — 굿닥 데스크 기능 웹 이관 시안 v2(진료실 단위 차트 연동 구조)
 * 상태     : 현행(active) · 검토용 시안(미승인)   버전: v2.2  최종수정: 2026-10-07
 * 분기     : desk-web v0.20에서 분기(원본 pages/connect/desk-web 은 수정하지 않음)
 * PRD      : 내부 기획 문서(티켓 번호·링크·원문 미기재) · 구현 브리프 2026-10-07 PD 확정분
 * 배포URL  : https://connect-sq-sandbox.github.io/out/desk-web-v2.html
 * 피그마   : 사내 파일(파일명·URL·노드 ID 미기재)
 *            · 접수 현황 = 데스크 '4.1 접수 정보 테이블' → figma/desk-receipt-table.md(+png)
 *            · 진료실 목록·상세·운영 설정 = v0.20 기준선 → ../desk-web/figma/baseline.md
 * 관련 CSS : styles/connectUnified.css(재사용, cu-*) + styles/deskWebV2.css(v0.20 dw-* 복사 + v2 전용 dw2-*)
 * 관련 소스: ./examRooms.tsx (진료실 목록·순서·미사용·상세·스케줄·운영 설정 + 차트 연동/해제)
 *            ./deskTables.tsx (접수 현황 · 예약 현황 · 오른쪽 패널 · Info Bar)
 * 기술제약 : react 훅만 · plain CSS · react-icons(vsc) · 가상 데이터 · 브라우저 메모리 상태 · 네트워크 0
 *
 * 화면구성 :
 *   ① 상단 프로토 바(메타): 판단 메모 보기 토글 · 판단 메모 n건 드로어 · 체험 설정 띠(병원 차트 · 진료실 구성 · 운영 유형 · 조건 더보기) · 초기화
 *   ② 커넥트 창(타이틀바 톱니·종 배지·창 버튼) — 좌측 메뉴 + 웹뷰 본문 + 상태바
 *   ③ 하단 슬림 작업표시줄의 커넥트 트레이 아이콘
 *   ④ 웹 메뉴: 대시보드 / 접수 > 접수 현황 / 예약 > 예약 현황 / 지난 내역 / 진료실 / 진료항목 /
 *              운영 설정 > 진료실 운영 설정 · 진료항목 운영 설정 / 알림 메시지함
 *   ⑤ 접수 현황: 진료실별 테이블 블록(진료 차례 행 + 대기 순번), 기준 날짜·진료실 드롭다운, 신환 접수, 열 편집,
 *               비연동 진료실만 우클릭·내원 체크·드래그·상세 처리, 연동 진료실은 조회만
 *   ⑥ 예약 현황: 통합 테이블(진료실 + 진료항목), 진료실·진료항목 필터, 신환/구환 예약, 비연동 진료실만 처리
 *   ⑦ 지난 내역: 접수 | 예약 탭(기본 접수, 탭마다 필터 따로 유지). 접수 탭 = 종료된 접수(접수일 기준·진료실·검색·읽기 전용 상세),
 *               예약 탭 = 종료된 진료실 예약·진료항목 예약(v2.1 지난 내역 그대로)
 *   ⑧ 판단 메모 핀(보라 원형 번호, 프로토 메타)
 *
 * 핵심 결정 (why):
 *   [확정·PRD 2026-10-07] 차트 연동은 병원이 아니라 진료실 단위. 굿닥 진료실마다 차트 연동 여부 + 연결된 차트 진료실(1:1).
 *   [확정·PRD] 병원 차트 = 연동 차트 / 비연동 차트. 연동 차트 병원만 '차트 진료실 불러오기'(불러오면 바로 연동), 직접 만들기는 둘 다.
 *   [확정·PRD] 이미 연동된 차트 진료실은 불러오기에서 고를 수 없음. 연동 해제 가능(상세 버튼 + 확인) → 비연동 진료실로 남음.
 *   [확정·PRD] 비연동 진료실을 나중에 연동하는 기능은 만들지 않음.
 *   [확정·PRD] 좌측 메뉴 접수/예약 그룹. 접수 현황 = 진료실별 테이블(피그마), 예약 현황 = 통합 테이블. v0.20 진료 현황은 이 둘로 대체.
 *   [확정·PRD] 비연동 진료실 접수·예약은 웹에서 처리(데스크 기능), 연동 진료실은 조회만('차트 연동' 표시), 진료항목 예약은 조회만(범위 밖).
 *   [확정·PRD] 신환 접수·예약 폼의 진료실 선택지는 비연동 진료실만. 예약 중복(같은 진료실·환자·날짜)은 "이미 동일한 환자의 예약이 있습니다."
 *   [확정·PRD] 스마트접수 등 v0.20 'EMR 연동' 전용 요소는 '병원 차트 = 연동 차트'일 때만(기준만 이동, 규칙 신규 없음).
 *   [확정·PO] 서버 기준 알림 메시지함. 좌측 메뉴·타이틀바 종에 미읽음 배지, 99 초과는 '99+'.
 *   [확정·PO] 환자 메뉴는 웹에 노출하지 않는다(법률 검토).
 *   [확정·PD] 비연동 차트 병원은 진료실 필수 아님 — 0개는 정상 상태.
 *   [확정·PD] 운영 설정(진료실 운영 설정 · 진료항목 운영 설정)은 v0.20 그대로, 진료실 공통 값.
 *   [확정·PD v2.2] 지난 내역은 접수 | 예약 탭으로 나눈다(기본 접수). 접수 탭은 종료된 접수(진료완료·접수취소)를 접수일 기준으로,
 *                 연동/비연동 진료실 모두 보여 주고 연동 진료실 건은 '차트 연동' 칩. 대시보드 타일·알림의 종료 건 이동은 예약 탭으로 연다.
 *   [유지·자체] 데스크 실제 코드의 no-op 버그(취소·진료 완료 미저장, 실패해도 성공 표시)는 재현하지 않음.
 *   [유지·자체] 체험 기본값은 v0.20과 같이 '비연동 차트'(하반기 범위 = 기존 데스크 사용 병원).
 *   [폐기 v2.0] 차트 모드 2종(비연동 · 굿닥에서 관리 / EMR 연동) — 병원 차트 + 진료실 단위 연동으로 교체.
 *   [폐기 v2.0] 진료 현황(진행 중 · 지난 내역 탭) 구조와 그에 딸린 판단 메모(유형 필터·상태 칩·확정 필요 하위 필터·정렬·같은 시간 중복·운영시간 확인 칩·진료항목 진료정보 수정).
 *   [폐기 v2.0] 진료실 예약 내원 체크 확인 모달·취소 사유 선택(v0.20 메모 17·6) — 데스크·피그마 동작으로 교체(질문으로 올림).
 *   화면의 판단 메모 핀 1~28번에 제안·근거·대안을 적어 둠.
 *
 * 보류 · TODO (확인 대기):
 *   [반영 v2.2] 종료된 접수(진료 완료·접수 취소)를 지난 내역에 넣을지 — v2.2 PD 요청으로 반영(지난 내역 접수 탭).
 *   [보류] 지난 내역 접수 탭 — 진료실 열은 열 편집 설정과 관계없이 항상 표시(평면 목록에서 진료실·'차트 연동' 칩을 보이려고, 폭 210).
 *          정렬은 접수 생성일 늦은 순 고정(정렬 선택 없음), 상태 필터 없음, 탭 이름 옆 건수 없음. 본인취소(F02)·자동취소(F04)는 가상 데이터에 없어 미표시.
 *   [보류] 진료 차례 행 자체의 드래그, 차례 환자 진료 완료 후 다음 대기 자동 승격 — 정해지지 않아 구현 안 함.
 *   [보류] 연동 해제 시 해당 진료실의 오늘 접수·예약 처리 방식.
 *   [보류] 과거 기준 날짜에서의 접수 처리 허용 여부(시안은 오늘과 같게 동작).
 *   [보류] 환경설정 '주민등록번호 7자리 사용'·'차팅 기능 사용' 분기(피그마 노트 A) 반영 여부.
 *   [보류] 환자 정보 표시 범위(주민번호·주소), 알림 메시지함 규격, 웹 예약 등록 제공 여부(v0.20에서 이어짐).
 *
 * 변경 이력:
 *   v2.0  2026-10-07 — desk-web v0.20에서 분기. 진료실 단위 차트 연동(불러오기·직접 만들기·연동 해제, 카드·상세 '차트 연동' 표시),
 *                      접수/예약 메뉴 그룹, 접수 현황(피그마 4.1: 진료실별 테이블·우클릭·내원 체크·드래그·복사·상세·신환 접수·열 편집),
 *                      예약 현황(통합 테이블·필터·정렬·신환/구환 예약·상세 수정), 지난 내역 독립 메뉴, 체험 띠 병원 차트·진료실 구성 프리셋,
 *                      판단 메모 v2 번호로 재작성(1~28).
 *   v2.1  2026-10-07 — 검수 반영: 차트 진료실 불러오기에 직접 만들기와 같은 진료실 이름 중복 검사·문구 적용, 스케줄 화면에 남은
 *                      v0.20 번호 핀(4) 2곳 제거, 판단 메모 4 이동 시 연동 차트·새 진료실 선택 창으로 이동.
 *   v2.2  2026-10-07 — PD 요청: 지난 내역을 접수 | 예약 탭으로 구분(기본 접수, 탭별 필터 유지). 접수 탭 신설(종료 접수 목록·읽기 전용 상세·
 *                      가상 종료 접수 9건), 접수 현황의 진료 완료·접수 취소 건이 접수 탭에 들어감. 대시보드 타일·알림 종료 건은 예약 탭으로 열림.
 *                      판단 메모 1·27 문구 갱신.
 * └──────────────────────────────────────────────────────
 */
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  VscAdd, VscBell, VscCalendar, VscCheck, VscCheckAll, VscChevronRight, VscChromeClose, VscChromeMaximize,
  VscChromeMinimize, VscChromeRestore, VscDashboard, VscError, VscInbox, VscInfo,
  VscOrganization, VscRefresh, VscSearch, VscSettingsGear, VscWarning, VscBeaker, VscKey, VscComment, VscTrash, VscHistory, VscListOrdered, VscTag
} from 'react-icons/vsc';
import { ExamRooms, OperationPage, seedRooms, seedInvalid, newRoom, Room, Invalid, View, Kit, ChartMode, supFor, CHART_NAME, OP0, VISIT_PATHS_DEFAULT, CHART_ROOMS, RoomPreset, ROOM_PRESETS } from './examRooms';
import { ReceiptPage, ApptPage, RCP_COLS0, Rec, Rcp, Kind, State, ACTIVE, TKit, PastRcpTable, PastRcpDetail } from './deskTables';

const LOGO = require('../../../assets/curation-price/goodoc-logo.svg');

/* ───────── 타입 · 상수 ───────── */
type Noti = { id: string; type: '새 예약' | '환자 도착' | '진료항목 예약'; text: string; at: string; read: boolean; rec: string };
type Dialog =
  | { type: 'detail'; id: string } | { type: 'rcpDetail'; id: string }
  | { type: 'roomForm'; id?: string }
  | { type: 'roomCreate' } | { type: 'roomImport' }
  | { type: 'roomDelete'; id: string }
  | { type: 'settings' }
  | { type: 'notice'; title: string }
  | { type: 'kakao' } | { type: 'tStop' } | { type: 'tStart' } | { type: 'tAutoOff' } | { type: 'tLastHide'; index: number };

const TODAY = '2026-10-06';
const NOW = '09:41';
const CLOSED: State[] = ['진료완료', '병원취소', '환자취소', '자동 종료'];
type PastPeriod = '오늘' | '7일' | '30일' | '직접 설정';
type PastTab = '접수' | '예약';
type PastState = '전체' | '진료완료' | '병원취소' | '환자취소' | '자동 종료';
const PAST_STATES: PastState[] = ['전체', '진료완료', '병원취소', '환자취소', '자동 종료'];
const TAG: Record<State, string> = { '확정 필요': 'orange', '예약확정': 'blue', '내원확정': 'teal', '진료완료': 'green', '병원취소': 'red', '환자취소': 'red', '자동 종료': 'gray' };
const PAGE_SIZE = 8;
const HOLIDAYS: Record<string, string> = { '2026-10-03': '개천절', '2026-10-09': '한글날' };
const AUTO_REASON = '방문 예정 시각이 지나고 결과가 확인되지 않은 건이라 자동 종료됐어요.';

/** 가상 예약 건. 성별·만 나이·주민번호(뒷자리 마스킹)는 생년·id로 만든 가상값 */
const r = (o: Partial<Rec> & Pick<Rec, 'id' | 'name' | 'phone' | 'date' | 'time' | 'state'>): Rec => {
  const year = Number((o.birth || '').slice(0, 4)) || 1980; const odd = Number(o.id.replace(/\D/g, '')) % 2 === 1;
  const g = year >= 2000 ? (odd ? '3' : '4') : (odd ? '1' : '2');
  return {
    kind: '진료실 예약', birth: '19**.**.**', created: o.date, room: '1진료실', item: '—', price: '—', purpose: '재진', etc: '', memo: '', channel: '굿닥 앱',
    gender: odd ? '남' : '여', age: 2026 - year - 1, rrn: `${String(year).slice(2)}0${(Number(o.id.replace(/\D/g, '')) % 9) + 1}15-${g}******`, addr: '', addr2: '', pmemo: '', path: '', cInfo: true, cAd: false, ...o
  };
};
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
  r({ id: 'D036', name: '송○○', phone: '010-****-2131', birth: '1992.**.**', date: TODAY, time: '16:30', created: '2026-10-05', room: '예방접종실', purpose: '예방접종 상담', etc: '독감 접종 같이 문의', state: '내원확정' }),
  r({ id: 'D009', name: '장○○', phone: '010-****-2109', birth: '1988.**.**', date: TODAY, time: '15:00', created: '2026-10-05', room: '2진료실', state: '예약확정' }),
  t({ id: 'D025', name: '김○○', phone: '010-****-2101', birth: '1979.**.**', date: TODAY, time: '15:30', created: '2026-10-05', item: '독감 백신 · 1회', price: '35,000원', etc: '진료 후 접종 희망', state: '예약확정' }),
  t({ id: 'D026', name: '서○○', phone: '010-****-2122', birth: '1995.**.**', date: TODAY, time: '', created: TODAY, item: '피부 레이저 상담 · 방문 후 결정', price: '미정', state: '확정 필요' }),
  r({ id: 'D010', name: '임○○', phone: '010-****-2110', birth: '1995.**.**', date: '2026-10-07', time: '09:30', created: TODAY, purpose: '초진', state: '예약확정' }),
  t({ id: 'D011', name: '오○○', phone: '010-****-2111', birth: '1962.**.**', date: '2026-10-07', time: '10:00', created: TODAY, item: '싱그릭스 · 1차', price: '230,000원', state: '확정 필요' }),
  r({ id: 'D037', name: '변○○', phone: '010-****-2132', birth: '1985.**.**', date: '2026-10-07', time: '11:00', created: TODAY, room: '예방접종실', purpose: '예방접종 상담', state: '예약확정' }),
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
  r({ id: 'D023', name: '박○○', phone: '010-****-2102', birth: '1956.**.**', date: '2026-08-28', time: '10:00', purpose: '재진', state: '진료완료', closed: '2026-08-28' }),
  // 지난 내역 기간 필터 체험용(7일·30일·6개월·6개월 밖·앞으로 예정됐다 취소)
  r({ id: 'D028', name: '고○○', phone: '010-****-2124', birth: '1972.**.**', date: '2026-10-03', time: '10:30', room: '2진료실', purpose: '재진 · 당뇨', state: '진료완료', closed: '2026-10-03' }),
  t({ id: 'D029', name: '남○○', phone: '010-****-2125', birth: '1994.**.**', date: '2026-10-01', time: '16:00', item: '독감 백신 · 1회', price: '35,000원', state: '환자취소', reason: '환자가 앱에서 취소', closed: '2026-09-30' }),
  r({ id: 'D030', name: '류○○', phone: '010-****-2126', birth: '1981.**.**', date: '2026-09-25', time: '11:30', purpose: '초진 · 두통', state: '진료완료', closed: '2026-09-25' }),
  r({ id: 'D031', name: '전○○', phone: '010-****-2127', birth: '1968.**.**', date: '2026-09-10', time: '09:00', room: '예방접종실', purpose: '예방접종 상담', state: '병원취소', reason: '담당 의료진 부재', closed: '2026-09-09' }),
  t({ id: 'D032', name: '하○○', phone: '010-****-2128', birth: '1990.**.**', date: '2026-08-15', time: '14:30', item: '가다실 9가 · 1차', price: '210,000원', state: '진료완료', closed: '2026-08-15' }),
  r({ id: 'D033', name: '진○○', phone: '010-****-2129', birth: '1955.**.**', date: '2026-07-20', time: '10:00', room: '2진료실', state: '자동 종료', reason: AUTO_REASON, closed: '2026-07-21' }),
  r({ id: 'D034', name: '양○○', phone: '010-****-2130', birth: '1987.**.**', date: '2026-10-12', time: '15:00', created: '2026-10-02', purpose: '초진', state: '환자취소', reason: '환자가 앱에서 취소', closed: '2026-10-05' }),
  r({ id: 'D035', name: '김○○', phone: '010-****-2101', birth: '1979.**.**', date: '2026-03-12', time: '10:00', purpose: '초진 · 비염', state: '진료완료', closed: '2026-03-12' })
];
/** 가상 접수 건(피그마 4.1 샘플 구성: 진료 차례 1 + 대기, 내원 체크 앞쪽만). 이름·연락처·주민번호 뒷자리는 마스킹 */
const rc = (o: Partial<Rcp> & Pick<Rcp, 'id' | 'roomId' | 'name' | 'gender' | 'age' | 'rrn' | 'phone' | 'created'>): Rcp => ({
  date: TODAY, addr: '', addr2: '', zip: '', ptype: '재진', channel: '현장', visit: false, purpose: '', etc: '', memo: '', turn: false, order: 0, pmemo: '', path: '', cInfo: true, cAd: false, ...o
});
const RCP0: Rcp[] = [
  rc({ id: 'C101', roomId: 'R1', turn: true, visit: true, name: '장○○', gender: '남', age: 11, rrn: '131011-3******', phone: '010-****-3101', purpose: '감기 > 콧물, 감기 > 기침', created: `${TODAY} 09:31:25`, ptype: '초진' }),
  rc({ id: 'C102', roomId: 'R1', order: 0, visit: true, name: '남궁○○○○○○', gender: '여', age: 24, rrn: '001027-4******', phone: '010-****-3102', purpose: '감기 > 고열', etc: '왼쪽 귀가 얼얼합니다.', created: `${TODAY} 09:36:02` }),
  rc({ id: 'C103', roomId: 'R1', order: 1, visit: true, name: '이○○', gender: '남', age: 38, rrn: '870110-1******', phone: '010-****-3103', channel: '원격', purpose: '감기 > 기침, 감기 > 가래', created: `${TODAY} 09:38:30` }),
  rc({ id: 'C104', roomId: 'R1', order: 2, visit: true, name: '류○○', gender: '여', age: 22, rrn: '020201-4******', phone: '010-****-3104', purpose: '두통', etc: '뒷목이 지끈거립니다.', memo: '혈압 먼저 측정', created: `${TODAY} 09:40:07` }),
  rc({ id: 'C105', roomId: 'R1', order: 3, visit: true, name: '김○○', gender: '여', age: 19, rrn: '060324-4******', phone: '010-****-3105', purpose: '감기 > 고열', created: `${TODAY} 09:42:33` }),
  rc({ id: 'C106', roomId: 'R1', order: 4, name: '강○○', gender: '남', age: 29, rrn: '950627-1******', phone: '010-****-3106', channel: '원격', purpose: '복통 > 소화불량, 복통 > 설사', created: `${TODAY} 09:46:58` }),
  rc({ id: 'C107', roomId: 'R1', order: 5, name: '정○○', gender: '남', age: 26, rrn: '990416-1******', phone: '010-****-3107', channel: '원격', purpose: '감기 > 고열', etc: '근육통이 심합니다.', created: `${TODAY} 09:50:37` }),
  rc({ id: 'C108', roomId: 'R1', order: 6, name: '한○○', gender: '여', age: 29, rrn: '960702-2******', phone: '010-****-3108', channel: '원격', purpose: '피부질환 > 두드러기, 피부질환 > 발진', etc: '연고 처방 받고싶습니다.', created: `${TODAY} 09:52:30` }),
  rc({ id: 'C201', roomId: 'R2', turn: true, visit: true, name: '박○○', gender: '여', age: 41, rrn: '850411-2******', phone: '010-****-3201', purpose: '건강검진 상담', created: `${TODAY} 09:20:11` }),
  rc({ id: 'C202', roomId: 'R2', order: 0, visit: true, name: '조○○', gender: '남', age: 3, rrn: '230105-3******', phone: '010-****-3202', purpose: '영유아검진', memo: '보호자 동반', created: `${TODAY} 09:28:40`, ptype: '초진' }),
  rc({ id: 'C203', roomId: 'R2', order: 1, name: '윤○○', gender: '여', age: 5, rrn: '210314-4******', phone: '010-****-3203', channel: '원격', purpose: '영유아검진', created: `${TODAY} 09:33:05` }),
  rc({ id: 'C204', roomId: 'R2', order: 2, name: '서○○', gender: '남', age: 2, rrn: '240520-3******', phone: '010-****-3204', channel: '원격', purpose: '영유아검진', created: `${TODAY} 09:39:51` }),
  rc({ id: 'C301', roomId: 'R3', order: 0, visit: true, name: '문○○', gender: '여', age: 67, rrn: '590103-2******', phone: '010-****-3301', purpose: '예방접종 > 독감', created: `${TODAY} 09:12:44` }),
  rc({ id: 'C302', roomId: 'R3', order: 1, name: '배○○', gender: '남', age: 34, rrn: '920808-1******', phone: '010-****-3302', channel: '원격', purpose: '예방접종 > 독감', created: `${TODAY} 09:25:19` }),
  rc({ id: 'C303', roomId: 'R3', order: 2, name: '신○○', gender: '여', age: 8, rrn: '180212-4******', phone: '010-****-3303', purpose: '예방접종 > 독감', etc: '접종 후 30분 대기 안내 필요', created: `${TODAY} 09:37:02` }),
  // 기준 날짜(과거) 체험용
  rc({ id: 'C401', roomId: 'R1', date: '2026-10-05', turn: true, visit: true, name: '오○○', gender: '남', age: 52, rrn: '730919-1******', phone: '010-****-3401', purpose: '재진 · 약 처방', created: '2026-10-05 10:02:15' }),
  rc({ id: 'C402', roomId: 'R1', date: '2026-10-05', order: 0, name: '하○○', gender: '여', age: 31, rrn: '941201-2******', phone: '010-****-3402', channel: '원격', purpose: '감기 > 기침', created: '2026-10-05 10:15:48' }),
  rc({ id: 'C403', roomId: 'R3', date: '2026-10-05', order: 0, visit: true, name: '구○○', gender: '남', age: 70, rrn: '551030-1******', phone: '010-****-3403', purpose: '예방접종 > 폐렴구균', created: '2026-10-05 11:40:09' }),
  // 지난 내역 접수 탭 체험용(종료된 접수 · 오늘·7일·30일·30일 밖)
  rc({ id: 'C501', roomId: 'R1', date: '2026-10-05', done: '진료완료', visit: true, name: '차○○', gender: '여', age: 45, rrn: '810214-2******', phone: '010-****-3501', purpose: '감기 > 기침', created: '2026-10-05 09:12:40' }),
  rc({ id: 'C502', roomId: 'R1', date: '2026-10-02', done: '접수취소', name: '표○○', gender: '남', age: 33, rrn: '930505-1******', phone: '010-****-3502', channel: '원격', purpose: '복통 > 소화불량', created: '2026-10-02 14:27:03' }),
  rc({ id: 'C503', roomId: 'R1', date: '2026-09-18', done: '진료완료', visit: true, name: '김○○', gender: '여', age: 19, rrn: '060324-4******', phone: '010-****-3105', purpose: '감기 > 고열', created: '2026-09-18 10:05:51' }),
  rc({ id: 'C511', roomId: 'R2', date: TODAY, done: '진료완료', visit: true, name: '탁○○', gender: '남', age: 6, rrn: '200711-3******', phone: '010-****-3511', purpose: '영유아검진', memo: '보호자 동반', created: `${TODAY} 08:55:12`, ptype: '초진' }),
  rc({ id: 'C512', roomId: 'R2', date: '2026-10-03', done: '진료완료', visit: true, name: '방○○', gender: '여', age: 58, rrn: '680922-2******', phone: '010-****-3512', purpose: '건강검진 상담', created: '2026-10-03 11:31:08' }),
  rc({ id: 'C513', roomId: 'R2', date: '2026-09-12', done: '접수취소', name: '석○○', gender: '여', age: 4, rrn: '220304-4******', phone: '010-****-3513', channel: '원격', purpose: '영유아검진', created: '2026-09-12 09:48:26' }),
  rc({ id: 'C521', roomId: 'R3', date: '2026-10-01', done: '진료완료', visit: true, name: '엄○○', gender: '남', age: 71, rrn: '550418-1******', phone: '010-****-3521', purpose: '예방접종 > 독감', created: '2026-10-01 10:20:33' }),
  rc({ id: 'C522', roomId: 'R3', date: '2026-09-24', done: '진료완료', visit: true, name: '육○○', gender: '여', age: 36, rrn: '900116-2******', phone: '010-****-3522', purpose: '예방접종 > 독감', created: '2026-09-24 15:02:47' }),
  rc({ id: 'C523', roomId: 'R3', date: '2026-08-20', done: '접수취소', name: '편○○', gender: '남', age: 27, rrn: '990830-1******', phone: '010-****-3523', channel: '원격', purpose: '예방접종 > 파상풍', created: '2026-08-20 13:44:19' })
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
  ['안내', '웹에서 접수·예약을 처리하는 방법', '2026.10.06'], ['안내', '알림 메시지함이 새로 생겼어요', '2026.10.05'], ['점검', '10월 정기 점검 안내 (가상)', '2026.10.02'],
  ['안내', '진료실 담당 의사 입력 방법', '2026.09.30'], ['안내', '추석 연휴 진료 일정 설정 안내', '2026.09.24'], ['업데이트', '진료항목 예약 화면 개선', '2026.09.18'], ['안내', '제품키 재발급 절차', '2026.09.10']
];
/** 좌측 메뉴. parent가 있는 항목은 그룹 아래 들여쓰기로 보이고, 그룹명을 누르면 첫 하위 메뉴로 간다 */
const NAV: { key: string; icon?: React.ReactNode; parent?: string }[] = [
  { key: '대시보드', icon: <VscDashboard /> },
  { key: '접수 현황', parent: '접수' }, { key: '예약 현황', parent: '예약' },
  { key: '지난 내역', icon: <VscHistory /> },
  { key: '진료실', icon: <VscOrganization /> }, { key: '진료항목', icon: <VscTag /> },
  { key: '진료실 운영 설정', parent: '운영 설정' }, { key: '진료항목 운영 설정', parent: '운영 설정' },
  { key: '알림 메시지함', icon: <VscInbox /> }
];
const GROUP_ICON: Record<string, React.ReactNode> = { '접수': <VscListOrdered />, '예약': <VscCalendar />, '운영 설정': <VscSettingsGear /> };
const DESC: Record<string, string> = {
  '대시보드': '오늘 우리 병원의 예약·진료 현황과 공지사항을 확인할 수 있어요.',
  '지난 내역': '진료가 끝났거나 취소된 접수와 진료실 예약·진료항목 예약을 기간으로 찾아볼 수 있어요.',
  '진료항목': '굿닥에 노출되는 우리 병원 진료항목을 관리할 수 있어요.',
  '진료항목 운영 설정': '굿닥에 등록한 진료항목으로 예약을 받을 수 있습니다.',
  '알림 메시지함': '새 예약·환자 도착·진료항목 예약 알림을 서버 기준으로 모아 볼 수 있어요.'
};

/* ───────── 판단 메모(프로토 메타) ───────── */
type Preset = '둘 다' | '진료실 예약만' | '진료항목 예약만' | '진료실 예약 운영 중지';
const CUSTOM = '사용자 정의(판정 기준)';
const PRESETS: Preset[] = ['둘 다', '진료실 예약만', '진료항목 예약만', '진료실 예약 운영 중지'];
/** 판단 메모 이동 조건. 기본은 비연동 차트 · 비연동만 · 운영 유형 '둘 다'. chart/rp/op/room/open/dialog/partial/kakao */
const MEMO_COND: Record<number, string> = {
  3: 'chart:unlinked;rp:진료실 없음', 4: 'chart:linked;rp:연동 2 + 비연동 1', 5: 'chart:linked;rp:연동 2 + 비연동 1;dialog:import', 6: 'chart:linked;rp:연동 2 + 비연동 1;room:R1',
  16: 'partial', 17: 'chart:unlinked;rp:진료실 없음', 22: 'room:R1', 23: 'kakao', 24: 'chart:linked;rp:연동 2 + 비연동 1;room:R1', 25: 'room:R1',
  26: 'room:R1;open:appt', 28: 'chart:linked;rp:연동 2 + 비연동 1'
};
type Note = { n: number; menu: string; where: string; title: string; proposal: string; basis: string; alt: string; status?: 'PD 확정' };
const NOTES: Note[] = [
  { n: 1, menu: '지난 내역', where: '좌측 메뉴 · 지난 내역', title: '지난 내역 메뉴 위치', proposal: '지난 내역은 독립 메뉴로 두고, 접수·예약 그룹 바로 아래에 놓았어요. 안에서 접수 | 예약 탭으로 나눠 접수 탭은 종료된 접수를, 예약 탭은 종료된 진료실 예약·진료항목 예약을 조회해요.', basis: '오늘 처리하는 접수·예약 현황 다음에 끝난 건을 찾는 이력 조회가 오면 업무 흐름 순서와 맞아요.', alt: '접수·예약 그룹 안에 각각 지난 내역 하위 메뉴를 둠' },
  { n: 2, menu: '예약 현황', where: '예약 현황 · 구분 열 / 진료항목 예약 행', title: '진료항목 예약은 조회 전용', proposal: '진료항목 예약은 통합 테이블과 진료항목별 조회에 보이기만 하고, 우클릭 메뉴·상세 버튼이 없어요. v0.20의 진료항목 예약 확정(확정 필요 → 예약확정)·진료완료·진료정보 수정 UI는 이 화면에서 뺐어요.', basis: '이번 범위 밖이에요(브리프). 처리 UI를 다시 넣을지는 진료항목 예약 범위가 정해진 뒤 정해요.', alt: 'v0.20처럼 예약 현황에서 확정·진료완료까지 처리' },
  { n: 3, menu: '접수 현황', where: '접수 현황 · 진료실 0개', title: '진료실 0개일 때 접수 현황', proposal: '연동 차트 병원은 피그마의 진료실 생성 유도 화면(문구 + [진료실 생성])을 그대로 써요. 비연동 차트 병원은 진료실 0개가 정상 상태라 안내 문구 없이 ‘진료실 만들기’ 링크만 둬요.', basis: '비연동 병원은 진료항목 예약만 운영할 수 있어 차단처럼 보이면 안 돼요.', alt: '두 병원 모두 피그마 화면 그대로' },
  { n: 4, menu: '진료실', where: '진료실 설정 · 새 진료실', title: '새 진료실 진입 방식', proposal: '연동 차트 병원은 [새 진료실]을 누르면 ‘차트 진료실 불러오기 / 직접 만들기’ 중에서 고르는 창을 띄워요. 비연동 차트 병원은 고를 게 하나뿐이라 바로 직접 만들기 폼을 열어요.', basis: '불러오기는 연동 차트 병원에만 있고, 직접 만들기는 두 병원에서 같게 동작해요.', alt: '목록 머리에 [차트 진료실 불러오기]·[새 진료실] 버튼을 따로 둠' },
  { n: 5, menu: '진료실', where: '차트 진료실 불러오기 · 목록', title: '이미 연동된 차트 진료실 표시', proposal: '다른 굿닥 진료실과 연동된 차트 진료실은 고를 수 없게 막고 ‘연동됨’과 연결된 굿닥 진료실 이름을 보여요. 연동을 해제하면 그 차트 진료실은 다시 고를 수 있어요.', basis: '굿닥 진료실과 차트 진료실은 1:1이에요. 해제 후 다시 고를 수 있는 건 1:1에서 따라 나오는 동작이에요.', alt: '연동된 차트 진료실은 목록에서 숨김' },
  { n: 6, menu: '진료실', where: '진료실 상세 · 연동 해제', title: '연동 해제 버튼과 확인 문구', proposal: '연동 진료실 상세 머리에 [연동 해제]를 두고, 확인 창에는 “해제하면 이 진료실은 비연동 굿닥 진료실로 남아요.”만 적어요. 연동 진료실에는 정보 수정·삭제가 없고(차트 원천), 해제한 뒤부터 비연동 진료실처럼 정보 수정·삭제가 보여요.', basis: '해제 후에는 비연동 굿닥 진료실이므로 비연동 진료실의 관리 기능을 그대로 따라요. 해제 때 오늘 접수·예약에 미치는 영향은 정해지지 않아 안내하지 않았어요.', alt: '해제를 진료실 카드 메뉴에 둠' },
  { n: 7, menu: '접수 현황', where: '접수 현황 · 오른쪽 패널(톱니 · 행 클릭 · 신환접수)', title: '상세·등록·열 편집을 같은 오른쪽 패널로', proposal: '피그마의 380px 편집 패널 자리를 접수 정보(상세)·신환 접수 폼·테이블 열 편집이 함께 써요. 한 번에 하나만 열리고, 테이블은 패널 왼쪽에서 그대로 조작할 수 있어요. 예약 현황도 같은 방식이에요.', basis: '피그마에는 열 편집 패널만 있어요. 데스크 현행도 상세·등록을 오른쪽 패널로 열어요.', alt: '상세·등록은 모달로' },
  { n: 8, menu: '접수 현황', where: '접수 현황 · Info Bar(접수 취소·진료 완료·접수 완료 후)', title: 'Info Bar 위치', proposal: '성공 Info Bar는 본문 오른쪽 위에 띄우고 3.5초 뒤 닫혀요(닫기 버튼도 있음). 내원 확정과 드래그 이동은 피그마대로 따로 알리지 않아요. 저장 실패 체험일 때만 실패 토스트가 떠요.', basis: '피그마에 Info Bar 모양만 있고 위치 규칙이 없어요.', alt: '화면 아래 가운데' },
  { n: 9, menu: '예약 현황', where: '예약 현황 · 진료실·진료항목 필터', title: '예약 현황 조회 방식과 출처 열', proposal: '기본은 전체(진료실 + 진료항목) 통합 테이블이고, 드롭다운에서 진료실별·진료항목 전체·진료항목별로 좁혀요. 행 출처는 ‘구분(진료실/진료항목)’ 열, 이름은 ‘진료실 · 진료항목’ 열로 보여요. 드롭다운 건수는 고른 날짜(또는 전체 기간)의 진행 중 예약 기준이에요.', basis: '데스크 예약 화면의 진료실 드롭다운(건수 포함) 모양을 유지하면서 진료항목만 그룹으로 더했어요.', alt: '진료실 / 진료항목 탭' },
  { n: 10, menu: '예약 현황', where: '예약 현황 · 예약할 환자 검색', title: '구환 예약 검색 결과', proposal: '검색어와 이름 또는 연락처가 맞는 기존 환자(접수·예약 기록 기준)를 최대 4명 보여 주고, 고르면 환자 정보가 채워진 ‘구환 예약’ 폼이 열려요(수정 가능). 맨 아래 ‘검색어 신환예약’은 이름만 채운 빈 폼이에요.', basis: '데스크 예약 등록의 신환/구환 진입을 옮겼어요. 환자 메뉴는 웹에 없어 검색 결과에서 바로 폼으로 가요.', alt: '구환 예약 폼의 환자 정보는 읽기 전용' },
  { n: 11, menu: '예약 현황', where: '예약 현황 · 전체 기간', title: '‘전체 기간’ 체크 위치', proposal: '데스크는 달력 팝업 안에 ‘전체 기간’ 체크가 있지만, 시안은 브라우저 기본 날짜 입력을 써서 날짜 옆에 체크박스로 뒀어요. 켜면 날짜 입력이 비활성돼요.', basis: '기본 날짜 입력은 팝업 안에 요소를 넣을 수 없어요.', alt: '커스텀 달력 팝업 구현' },
  { n: 12, menu: '대시보드', where: '대시보드 · 오늘 현황', title: '대시보드 집계', proposal: '타일은 두 예약 유형 합산, 둘 다 운영할 때만 유형별 내역(진료실 n · 진료항목 n)을 작게 보여요(v0.20과 같음, 접수는 집계하지 않음). 누르면 예약 신청은 예약 현황(오늘 신청 조건), 진료 완료·취소는 지난 내역으로 열려요.', basis: '기존 데스크 대시보드 구성(3타일)을 유지하고, v0.20 진료 현황이 둘로 나뉜 만큼 이동 대상만 바꿨어요.', alt: '유형별 타일 분리 · 접수 집계 타일 추가' },
  { n: 13, menu: '진료항목 운영 설정', where: '진료항목 운영 설정 · 진료 예약 받기 / 진료실 상세 · 예약 사용중지', title: '운영을 끈 유형의 진행 중 건', proposal: '끈 뒤에도 진행 중 건은 목록에 남겨요. 끌 때 "새 예약만 받지 않아요. 이미 받은 진행 중 예약 N건은 그대로 처리해 주세요." 확인을 띄워요.', basis: '신청 유실 0건이 성공 기준이고, 이미 잡힌 환자 약속은 지켜야 해요.', alt: '끄면 진행 중 건 일괄 취소' },
  { n: 14, menu: '진료항목 운영 설정', where: '진료항목 운영 설정 · 진료 예약 받기 스위치 / 진료항목 · 카카오 노출 안내', title: '카카오 공존', proposal: '진료실 상세의 카카오 연동과 진료항목 메뉴의 카카오 노출은 각자 위치에 둬요. 진료항목 예약 받기를 끌 때 "카카오톡 예약하기의 진료항목 상품 판매도 함께 중지돼요"를 알려요.', basis: '연동 단위가 진료실 단위 / 항목 단위로 달라 합치면 오해가 생겨요. 끌 때 영향만 확실히 알려요.', alt: '연동 화면 한곳으로 통합' },
  { n: 15, menu: '진료항목 운영 설정', where: '좌측 메뉴 · 운영 설정 그룹 / 진료항목 운영 설정', title: '운영 설정 메뉴 구성', proposal: '[확정·PD] 운영 설정 > 진료실 운영 설정 / 진료항목 운영 설정', basis: '설정 성격의 화면을 한 그룹으로 모아 찾기 쉽게 함. 진료항목 메뉴는 항목 관리에 집중.', alt: '각 업무 메뉴 안에 설정 섹션', status: 'PD 확정' },
  { n: 16, menu: '예약 현황', where: '예약 현황 · 대시보드 · 진료항목 조회 실패 배너', title: '부분 실패 처리', proposal: '진료항목 예약 조회가 실패하면 그 유형만 배너로 알리고, 진료실 예약은 그대로 보여요.', basis: '한 유형 장애로 전체 업무가 멈추지 않게 해요.', alt: '하나라도 실패하면 전체 오류 화면' },
  { n: 17, menu: '대시보드', where: '대시보드 · 진료실 없음 안내(비연동 차트 병원)', title: '비연동 차트 병원의 진료실 0개는 정상 상태', proposal: '차단·경고 대신 "진료실을 만들면 진료실 예약도 받을 수 있어요" 선택형 안내만 두고 닫을 수 있게 해요. 진료항목 예약만 운영해도 기본으로 보여요.', basis: '진료항목 예약만 운영하는 병원이 있고, 나중에 진료실 예약을 시작할 수 있다는 걸 알리는 게 운영 확장에 도움이 돼요.', alt: '진료실 생성 유도 카드(경고형) · 진료항목 예약만이면 숨김' },
  { n: 18, menu: '진료실 운영 설정', where: '진료실 운영 설정 · 환자 조회 방식 선택(태블릿 접수 항목)', title: '태블릿 접수 항목은 진료실 기준으로 동작', proposal: '환자 조회 방식·주소 정보·내원경로는 태블릿 신환 등록에 쓰이는 항목이에요. 진료실의 차트 연동 여부와 관계없이 활성이에요.', basis: '비연동 굿닥 진료실도 연동 진료실과 같게 동작해요. 차이는 환자 정보가 도착하는 곳(차트 진료실/굿닥 진료실)뿐이에요.', alt: '‘태블릿 접수’ 소제목으로 묶음' },
  { n: 19, menu: '진료실 운영 설정', where: '진료실 운영 설정 · 진료 차례 알림', title: '비연동 진료실의 접수·차례 알림', proposal: '비연동 굿닥 진료실이 연동 진료실처럼 동작하려면 서버가 차트 역할을 대신해야 해요. 현행은 브릿지가 없으면 서버가 접수를 거절하고, 차례 알림은 차트가 보내는 대기 순번으로만 발송돼요. 비연동 진료실은 접수 현황의 진료 차례·대기 순서로 순번을 만드는 방식이 필요해요.', basis: '운영 설정은 진료실 공통 값이에요. 시안은 비연동 진료실이 있어도 접수·차례 알림 설정을 활성으로 보여 줘요.', alt: '서버 대행 전까지 비연동 진료실은 접수·차례 알림 제외' },
  { n: 20, menu: '진료실 운영 설정', where: '진료실 운영 설정 · 진료과 중복 접수', title: '진료과 중복 접수 노출 범위', proposal: '모든 병원에 노출하고 기본값은 ‘허용 안 함’으로 둬요.', basis: '토글이 없는 병원도 이미 중복 차단 상태로 동작하므로, 노출하면 병원이 직접 정할 수 있어요.', alt: '현행처럼 특정 차트에서만 노출' },
  { n: 21, menu: '진료실 운영 설정', where: '진료실 운영 설정 · 재진 환자만 접수 받기', title: '비연동 진료실의 재진 판단', proposal: '비연동 진료실이 있어도 켜고 끌 수 있게 해요. 비연동 진료실은 차트 환자번호가 없으니 굿닥 방문 이력(진료완료 기록)으로 재진을 판단해야 해요(서버 신규 필요).', basis: '현행 서버는 차트 환자번호로 재진을 확인해요. 비연동 진료실에는 그 번호가 없어서, 판단 기준을 굿닥 이력으로 바꾸지 않으면 켜는 순간 그 진료실 신청이 모두 거절돼요.', alt: '서버 신규 전까지 비연동 진료실은 적용 제외' },
  { n: 22, menu: '진료실', where: '진료실 상세 · 현장 접수 섹션(비연동 진료실)', title: '비연동 진료실 상세의 접수 섹션', proposal: '현장 접수·원격 접수·예약 모두 일반 상태 규칙(사용하기·운영중·임시마감·스케줄 필요)대로 보여요. 사용불가는 연동 진료실이 차트 기능값으로 막힌 경우에만 나와요.', basis: '비연동 굿닥 진료실도 연동 진료실과 같게 동작해요. 접수 처리를 서버가 대신하는 부분은 판단 메모 19에 적었어요.', alt: '서버 대행 전까지 비연동 진료실 접수 섹션 사용불가' },
  { n: 23, menu: '대시보드', where: '카카오톡 예약하기 · 연동 설정', title: '카카오 연동 가능 범위', proposal: '진료실마다 원격 접수·예약 기능이 지원될 때만 연동할 수 있어요. 연동 진료실이 차트 기능 제한이면 그 칸은 ‘연동 불가’, 모든 진료실이 막히면 차트사 문의 안내를 보여요.', basis: '카카오 연동은 원격 접수·예약 기능 위에서만 동작하고, v2에서는 차트 기능 제한이 연동 진료실 단위로 적용돼요.', alt: '연동 메뉴를 숨김' },
  { n: 24, menu: '진료실', where: '진료실 상세 · 차트 정보(연동 진료실)', title: '연동 진료실 필드 원천', proposal: '연동 진료실의 진료실명·진료과·의사는 차트 원천이라 잠그고 이름은 별칭으로만 바꿔요. 차트 정보에 연결된 차트 진료실 이름을 보여요. 굿닥이 관리하는 항목(별칭·안내 문구·접수 허용·스케줄·내원 목적·임시 마감)과 나눠 보여요.', basis: '차트와 굿닥에 같은 정보를 두 번 고치면 어긋나요. 차트 목록에서 빠진 진료실은 미사용 설정으로 이동해요.', alt: '굿닥에서 차트 정보 덮어쓰기 허용' },
  { n: 25, menu: '진료실', where: '진료실 관리 · 새 진료실 / 정보 수정(비연동 진료실)', title: '비연동 진료실 웹 생성·수정·삭제', proposal: '현행 웹에는 없는 신규 기능이에요. 서버에 진료실 생성 API가 필요해요. 연동 차트 병원도 ‘직접 만들기’로 비연동 진료실을 만들 수 있어요.', basis: '차트 진료실과 연결되지 않은 진료실은 웹에서 직접 관리해야 해요.', alt: '굿닥 운영팀이 대신 생성' },
  { n: 26, menu: '진료실', where: '진료실 상세 · 카카오톡 예약하기 연동 행', title: '카카오 연동을 상세 토글에서 연동 설정 화면으로', proposal: '피그마대로 진료실 상세에는 토글 대신 ‘페이지로 이동’ 버튼을 두고, 연동 켜기·끄기는 카카오톡 예약하기 연동 설정 화면에서 해요.', basis: '연동은 병원·진료실 단위 설정을 한곳에서 보는 게 실수를 줄이고, 피그마 정본과 맞춰요.', alt: '상세에 토글을 남기고 연동 설정 화면과 이중 제공' },
  { n: 27, menu: '지난 내역', where: '지난 내역 · 접수/예약 탭 · 기간 필터', title: '지난 내역 조회 방식', proposal: '두 탭 모두 기간(오늘·7일·30일 기본·직접 설정 최대 6개월)·진료실·검색으로 찾고, 행은 읽기 전용이에요. 접수 탭은 종료된 접수(진료완료·접수취소)를 접수일 기준으로, 예약 탭은 종료 건(진료완료·병원취소·환자취소·자동 종료)을 방문 예정일 기준으로 보고 상태 필터를 더 써요. 필터는 탭마다 따로 유지돼요.', basis: '카카오톡 예약하기 파트너의 예약/취소 관리처럼 목록형 화면은 한 메뉴에서 상태·기간 필터로 처리해요.', alt: '이력 전용 메뉴(장기 조회·내보내기·통계)를 따로 둠' },
  { n: 28, menu: '진료실 운영 설정', where: '진료실 운영 설정 · 예약 · 예약 시간 맞춤 자동 접수(스마트접수)', title: '자동 접수를 병원 단위로 정리(피그마 기준)', proposal: '자동 접수는 병원 단위 입력 2개(진료당 평균 소요 시간·진료간 인터벌 시간, 1~60분)와 ‘환자 취소 알림 받기’예요. v2에서는 병원 차트가 연동 차트이고 스마트접수 가능일 때만 보여요.', basis: '피그마가 병원 단위 입력으로 바뀌어 진료실별 설정 진입점이 없어요. 노출 기준은 v0.20 ‘EMR 연동’에서 ‘연동 차트’로만 옮겼어요.', alt: '코드 현행대로 진료실·요일별 설정 유지' }
];

/* ───────── 유틸 ───────── */
const wait = (ms: number) => new Promise(res => setTimeout(res, ms));
const DOW = ['일', '월', '화', '수', '목', '금', '토'];
const fmt = (d: string) => `${d.slice(5).replace('-', '.')}(${DOW[new Date(`${d}T00:00:00`).getDay()]})`;
const fmtFull = (d: string) => `${d.replaceAll('-', '.')} (${DOW[new Date(`${d}T00:00:00`).getDay()]})`;
const badge = (n: number) => (n > 99 ? '99+' : String(n));
const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const addDays = (d: string, n: number) => { const x = new Date(`${d}T00:00:00`); x.setDate(x.getDate() + n); return ymd(x); };
const addMonths = (d: string, n: number) => { const x = new Date(`${d}T00:00:00`); x.setMonth(x.getMonth() + n); return ymd(x); };
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
      <b className="dw-pin-title">{n}. {note.title}</b><em className={'dw-pin-chip ' + (note.status ? 'done' : '')}>{note.status || 'PO 확인 필요'}</em>
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
  componentDidCatch(e: unknown) { console.warn('[desk-web-v2] 화면 오류', e); }
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
  const [rcps, setRcps] = useState<Rcp[]>(() => clone(RCP0));
  const [rooms, setRooms] = useState<Room[]>(() => seedRooms('비연동만'));
  const [invalid, setInvalid] = useState<Invalid[]>(() => seedInvalid());
  const [notis, setNotis] = useState<Noti[]>(() => clone(BASE_NOTI));
  const ITEMS0 = [{ name: '독감 백신', price: '35,000원', active: true }, { name: '가다실 9가', price: '210,000원', active: true }, { name: '싱그릭스', price: '230,000원', active: false }, { name: '피부 레이저 상담', price: '방문 후 결정', active: true }];
  const [items, setItems] = useState(ITEMS0);
  const TAPPT0 = { on: true, autoConfirm: false, sameDay: true, notify: true };
  const [tAppt, setTAppt] = useState(TAPPT0);
  const [rcpCols, setRcpCols] = useState(RCP_COLS0);
  // 체험 설정(메타): 병원 차트 · 진료실 구성 · 운영 유형 · 조건 더보기
  const [chartMode, setChartMode] = useState<ChartMode>('unlinked'), [roomPreset, setRoomPreset] = useState<RoomPreset>('비연동만');
  const [failSim, setFailSim] = useState(false), [serverDown, setServerDown] = useState(false), [manyNoti, setManyNoti] = useState(false), [panelOpen, setPanelOpen] = useState(true);
  const [chartMissing, setChartMissing] = useState(false), [chartLimited, setChartLimited] = useState(false), [smart, setSmart] = useState(false), [partialFail, setPartialFail] = useState(false);
  const linked = chartMode === 'linked';
  const [moreOpen, setMoreOpen] = useState(false);
  const [opPreset, setOpPreset] = useState<Preset>('둘 다'), [softDismissed, setSoftDismissed] = useState(false);
  // 판단 메모
  const [annot, setAnnot] = useState(true), [drawer, setDrawer] = useState(false), [hiPin, setHiPin] = useState<number | null>(null);
  type Snap = { rows: Rec[]; rcps: Rcp[]; rooms: Room[]; chart: ChartMode; rp: RoomPreset; preset: Preset; limited: boolean; missing: boolean; partial: boolean; tAppt: typeof TAPPT0; soft: boolean; smart: boolean };
  const [memoSnap, setMemoSnap] = useState<Snap | null>(null);
  const [pinReq, setPinReq] = useState<number | null>(null);
  pinCtx = { on: annot, hi: hiPin, openReq: pinReq };
  // 셸
  const [menu, setMenu] = useState('대시보드'), [loading, setLoading] = useState(false), [maximized, setMaximized] = useState(false), [closed, setClosed] = useState(false), [tray, setTray] = useState(false), [toast, setToast] = useState<{ text: string; tone: 'ok' | 'fail' } | null>(null);
  const [roomsKey, setRoomsKey] = useState(0), [roomsInit, setRoomsInit] = useState<View | undefined>(undefined);
  const [apptKey, setApptKey] = useState(0), [apptInit, setApptInit] = useState<{ id: string; date: string } | undefined>(undefined), [apptChip, setApptChip] = useState(false);
  // 지난 내역 필터
  const P_FROM0 = addDays(TODAY, -29);
  const [chip, setChip] = useState<'' | '진료완료' | '취소'>(''), [page, setPage] = useState(1);
  const [pSearch, setPSearch] = useState(''), [pPeriod, setPPeriod] = useState<PastPeriod>('30일'), [pFrom, setPFrom] = useState(P_FROM0), [pTo, setPTo] = useState(TODAY), [pRange, setPRange] = useState<[string, string]>([P_FROM0, TODAY]), [pErr, setPErr] = useState('');
  const [pTab, setPTab] = useState<PastTab>('접수');
  // 지난 내역 접수 탭 필터(예약 탭과 따로 유지)
  const [rSearch, setRSearch] = useState(''), [rPeriod, setRPeriod] = useState<PastPeriod>('30일'), [rFrom, setRFrom] = useState(P_FROM0), [rTo, setRTo] = useState(TODAY), [rRange, setRRange] = useState<[string, string]>([P_FROM0, TODAY]), [rErr, setRErr] = useState(''), [rRoom, setRRoom] = useState('all'), [rPage, setRPage] = useState(1);
  const [pState, setPState] = useState<PastState>('전체'), [pKind, setPKind] = useState<'전체' | Kind>('전체'), [pRoom, setPRoom] = useState('전체 진료실'), [pSort, setPSort] = useState('방문 예정 늦은 순');
  const [noticePage, setNoticePage] = useState(1), [notiFilter, setNotiFilter] = useState<'전체' | '읽지 않음'>('전체');
  // 모달
  const [dialog, setDialog] = useState<Dialog | null>(null), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const [roomForm, setRoomForm] = useState({ name: '', alias: '', dept: '', doctors: [''] }), [roomTried, setRoomTried] = useState(false), [importSel, setImportSel] = useState('');
  const [keyConfirm, setKeyConfirm] = useState(false), [keyBusy, setKeyBusy] = useState(false);
  const CFG0 = { autoStart: true, rrn7: false, newAppt: true, arrival: true };
  const [cfg, setCfg] = useState(CFG0), [cfgDraft, setCfgDraft] = useState(CFG0);
  // 진료실 운영 설정 저장값(메뉴 이동 후에도 유지)
  const [opSaved, setOpSaved] = useState(OP0), [opPaths, setOpPaths] = useState(VISIT_PATHS_DEFAULT);

  useEffect(() => { if (!toast) return; const tm = setTimeout(() => setToast(null), 3500); return () => clearTimeout(tm); }, [toast]);
  useEffect(() => { if (!loading) return; const tm = setTimeout(() => setLoading(false), 380); return () => clearTimeout(tm); }, [loading]);
  useEffect(() => setPage(1), [chip, pSearch, pPeriod, pRange, pState, pKind, pRoom, pSort]);
  useEffect(() => setRPage(1), [rSearch, rPeriod, rRange, rRoom]);
  useEffect(() => {
    if (!tray) return;
    const close = (e: MouseEvent) => { if (!(e.target as HTMLElement).closest('.dw-tray-area')) setTray(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setTray(false); };
    document.addEventListener('mousedown', close); document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', esc); };
  }, [tray]);
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

  const notify = (text: string, tone: 'ok' | 'fail' = 'ok') => setToast({ text, tone });
  const fail = (text: string) => notify(text, 'fail');
  const instant = (apply: () => void, ok: string, what = '저장') => {
    if (serverDown) { fail(`굿닥 서버에 연결할 수 없어 ${what}하지 못했어요. 상태는 바뀌지 않았어요.`); return false; }
    if (failSim) { fail(`${what}하지 못했어요(모의 실패). 상태는 바뀌지 않았어요.`); return false; }
    apply(); notify(ok); return true;
  };
  /** 접수·예약 테이블용: 실패 체험이면 실패 토스트, 성공이면 조용히 반영(성공 피드백은 각 화면의 Info Bar) */
  const silent = (apply: () => void, what: string) => {
    if (serverDown) { fail(`굿닥 서버에 연결할 수 없어 ${what}${eul(what)} 저장하지 못했어요. 상태는 바뀌지 않았어요.`); return false; }
    if (failSim) { fail(`${what}${eul(what)} 저장하지 못했어요(모의 실패). 상태는 바뀌지 않았어요.`); return false; }
    apply(); return true;
  };
  const go = (name: string, opt: { room?: View; appt?: { id: string; date: string } } = {}) => {
    setMenu(name); setLoading(true); setClosed(false);
    if (name === '진료실') { setRoomsInit(opt.room); setRoomsKey(k => k + 1); }
    if (name === '예약 현황') { setApptInit(opt.appt); setApptKey(k => k + 1); }
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
  const openDetail = (id: string) => { setError(''); setDialog({ type: 'detail', id }); };
  const close = () => { if (!busy) { setDialog(null); setError(''); } };
  const openSettings = () => { setError(''); setCfgDraft(cfg); setDialog({ type: 'settings' }); };

  /* 운영 판정 [제안·PO확인] — 운영 유형 프리셋 표시용 */
  const roomOp = rooms.length > 0 && rooms.some(x => x.appt.accepted);
  const itemOp = tAppt.on && items.some(x => x.active);
  const presetExpect: Record<Preset, [boolean, boolean]> = { '둘 다': [true, true], '진료실 예약만': [true, false], '진료항목 예약만': [false, true], '진료실 예약 운영 중지': [false, true] };
  const presetShown = presetExpect[opPreset][0] === roomOp && presetExpect[opPreset][1] === itemOp ? opPreset : CUSTOM;
  /* 진료실이 없어진 진료실 예약은 숨김, 진료항목 조회 실패 체험이면 진료항목 예약 숨김 */
  const viewRows = rows.filter(x => (x.kind === '진료항목 예약' ? !partialFail : rooms.some(rm => rm.name === x.room)));
  const chosen = dialog && dialog.type === 'detail' ? viewRows.find(x => x.id === dialog.id) : undefined;
  useEffect(() => { if (dialog?.type === 'detail' && !chosen) setDialog(null); });
  const chosenRcp = dialog && dialog.type === 'rcpDetail' ? rcps.find(x => x.id === dialog.id && x.done && rooms.some(rm => rm.id === x.roomId)) : undefined;
  useEffect(() => { if (dialog?.type === 'rcpDetail' && !chosenRcp) setDialog(null); });
  const showBoth = roomOp && itemOp;
  const roomSide = rooms.length > 0, itemSide = itemOp || viewRows.some(x => x.kind === '진료항목 예약');
  const allNotis = notis.filter(n => !n.rec || viewRows.some(x => x.id === n.rec));
  const unread = allNotis.filter(n => !n.read).length;

  /* 지난 내역 목록 */
  const chipOk = (x: Rec) => !chip || (chip === '진료완료' ? x.state === '진료완료' && x.closed === TODAY : ['병원취소', '환자취소'].includes(x.state) && x.closed === TODAY);
  const roomOk = (x: Rec, f: string) => f === '전체 진료실' || (f === '진료실 미지정' ? x.room === '—' : x.room === f);
  const textOk = (x: { name: string; phone: string }, q: string) => !q.trim() || `${x.name}${x.phone}`.replace(/[-\s]/g, '').includes(q.replace(/[-\s]/g, ''));
  /** 지난 내역 기간: 방문 예정일 기준. 7일·30일은 오늘 포함 최근 N일부터(앞으로 예정됐다가 취소된 건 포함), 직접 설정은 시작~종료일 */
  const inRange = (d: string, period: PastPeriod, range: [string, string]) => period === '오늘' ? d === TODAY : period === '직접 설정' ? d >= range[0] && d <= range[1] : d >= addDays(TODAY, period === '7일' ? -6 : -29);
  const inPeriod = (x: Rec) => inRange(x.date, pPeriod, pRange);
  const pastAll = viewRows.filter(x => CLOSED.includes(x.state) && (chip ? x.closed === TODAY : inPeriod(x)) && roomOk(x, pRoom) && (pKind === '전체' || x.kind === pKind) && textOk(x, pSearch) && chipOk(x));
  const sortKey = (x: Rec) => `${x.date}${x.time || '99:99'}${x.kind === '진료실 예약' ? 0 : 1}${x.created}`;
  const list = pastAll.filter(x => pState === '전체' || x.state === pState).sort((a, b) => (pSort === '방문 예정 빠른 순' ? 1 : -1) * sortKey(a).localeCompare(sortKey(b)));
  const pageCount = Math.max(1, Math.ceil(list.length / PAGE_SIZE)), curPage = Math.min(page, pageCount);
  /** 지난 내역 접수 탭: 종료된 접수(진료완료·접수취소), 접수일 기준, 연동/비연동 진료실 모두. 없어진 진료실의 접수는 숨김(예약 탭과 같음) */
  const pastRcps = rcps.filter(x => x.done && rooms.some(rm => rm.id === x.roomId) && inRange(x.date, rPeriod, rRange) && (rRoom === 'all' || x.roomId === rRoom) && textOk(x, rSearch)).sort((a, b) => b.created.localeCompare(a.created));
  const rPageCount = Math.max(1, Math.ceil(pastRcps.length / PAGE_SIZE)), rCurPage = Math.min(rPage, rPageCount);
  const clearRcpPast = () => { setRSearch(''); setRPeriod('30일'); setRFrom(P_FROM0); setRTo(TODAY); setRRange([P_FROM0, TODAY]); setRErr(''); setRRoom('all'); };
  const rangeErr = (from: string, to: string) => !from || !to ? '시작일과 종료일을 모두 골라 주세요.' : from > to ? '시작일이 종료일보다 늦어요.' : to > addMonths(from, 6) ? '최대 6개월까지 조회할 수 있어요' : '';
  const setRCustom = (from: string, to: string) => { setRFrom(from); setRTo(to); const e = rangeErr(from, to); setRErr(e); if (!e) setRRange([from, to]); };
  const clearPast = () => { setPSearch(''); setPPeriod('30일'); setPFrom(P_FROM0); setPTo(TODAY); setPRange([P_FROM0, TODAY]); setPErr(''); setPState('전체'); setPKind('전체'); setPRoom('전체 진료실'); setPSort('방문 예정 늦은 순'); setChip(''); };
  /** 직접 설정: 시작일 ≤ 종료일, 최대 6개월. 어기면 안내만 띄우고 마지막으로 맞았던 기간을 유지한다 */
  const setCustom = (from: string, to: string) => {
    setPFrom(from); setPTo(to);
    if (!from || !to) { setPErr('시작일과 종료일을 모두 골라 주세요.'); return; }
    if (from > to) { setPErr('시작일이 종료일보다 늦어요.'); return; }
    if (to > addMonths(from, 6)) { setPErr('최대 6개월까지 조회할 수 있어요'); return; }
    setPErr(''); setPRange([from, to]);
  };

  /* 체험 데이터 구성: 진료실 구성 프리셋 × 운영 유형 프리셋(체험 중 만든 데이터는 버림)
   *  진료항목 예약만 — 모든 진료실 예약 섹션 미사용·진료실 예약 0건 / 진료실 예약만 — 진료항목 예약 0건·진료 예약 받기 OFF
   *  진료실 예약 운영 중지 — 모든 진료실 예약 섹션 OFF, 기존 진료실 예약 건은 남음(판단 메모 13) */
  const modalOpen = !!dialog || keyConfirm;
  const applyAll = (chart: ChartMode, rp0: RoomPreset, op: Preset, msg?: string) => {
    const rp: RoomPreset = chart === 'unlinked' && rp0 === '연동 2 + 비연동 1' ? '비연동만' : rp0;
    let rms = seedRooms(rp), rws = clone(BASE);
    const apptOff = (x: Room): Room => ({ ...x, appt: { ...x.appt, accepted: false, kakao: false, paused: false, advanced: false } });
    if (op === '진료실 예약만') rws = rws.filter(x => x.kind === '진료실 예약');
    if (op === '진료항목 예약만') { rws = rws.filter(x => x.kind === '진료항목 예약'); rms = rms.map(x => ({ ...apptOff(x), aSlots: [], groups: [] })); }
    if (op === '진료실 예약 운영 중지') rms = rms.map(apptOff);
    setChartMode(chart); setRoomPreset(rp); setOpPreset(op); setRooms(rms); setRows(rws); setRcps(clone(RCP0)); setInvalid(seedInvalid());
    setTAppt(o => ({ ...o, on: op !== '진료실 예약만' })); setSoftDismissed(false); clearPast(); clearRcpPast(); setPTab('접수'); setApptChip(false);
    if (chart !== 'linked') { setChartLimited(false); setChartMissing(false); }
    if (msg) notify(msg);
  };
  /** 스마트접수(자동 접수)는 연동 차트 병원 전용: 비연동 차트로 바꾸면 끄고, 연동 차트로 바꾸면 현행 기본값(가능)으로 둔다 */
  const smartRestore = useRef<boolean | null>(null);
  useEffect(() => { if (smartRestore.current !== null) { setSmart(smartRestore.current); smartRestore.current = null; return; } setSmart(chartMode === 'linked'); }, [chartMode]);
  const chartMissingId = chartMissing && linked && rooms.find(x => x.id === 'R2')?.chartLink ? 'R2' : undefined;
  const toggleMany = (v: boolean) => {
    setManyNoti(v);
    setNotis(old => v ? [...old, ...Array.from({ length: 120 }, (_, i): Noti => ({ id: `X${i}`, type: i % 3 === 0 ? '환자 도착' : i % 3 === 1 ? '새 예약' : '진료항목 예약', text: `체험용 대량 알림 ${i + 1} · 가상 환자 ○○님`, at: `2026-10-0${5 - (i % 5)} 0${7 + (i % 3)}:${String(10 + (i % 50)).padStart(2, '0')}`, read: false, rec: '' }))] : old.filter(x => !x.id.startsWith('X')));
  };
  const resetAll = () => {
    applyAll('unlinked', '비연동만', '둘 다'); setNotis(clone(BASE_NOTI)); setFailSim(false); setServerDown(false); setManyNoti(false);
    setChartLimited(false); setChartMissing(false); setPartialFail(false); setMemoSnap(null); setRcpCols(RCP_COLS0);
    setItems(ITEMS0); setTAppt(TAPPT0); setCfg(CFG0); setCfgDraft(CFG0); setOpSaved(OP0); setOpPaths(VISIT_PATHS_DEFAULT); setNotiFilter('전체'); setNoticePage(1); setKeyConfirm(false);
    setDialog(null); setError(''); setClosed(false); setMaximized(false); go('대시보드'); notify('모든 가상 데이터를 처음 상태로 되돌렸어요.');
  };

  /* 판단 메모 드로어 → 해당 화면 이동 + 핀 하이라이트 */
  const jumpTo = (note: Note) => {
    setDrawer(false); setAnnot(true); setDialog(null);
    const su = MEMO_COND[note.n] || '';
    const get = (k: string) => (su.match(new RegExp(k + ':([^;]+)')) || [])[1];
    const chart = (get('chart') || 'unlinked') as ChartMode, rp = (get('rp') || '비연동만') as RoomPreset, op = (get('op') || '둘 다') as Preset;
    if (!memoSnap) setMemoSnap({ rows, rcps, rooms, chart: chartMode, rp: roomPreset, preset: opPreset, limited: chartLimited, missing: chartMissing, partial: partialFail, tAppt, soft: softDismissed, smart });
    applyAll(chart, rp, op); setChartLimited(false); setChartMissing(false); setPartialFail(su.includes('partial'));
    if (chart === 'linked' && chartMode === 'linked') setSmart(true);
    const room = get('room'), openK = get('open') as SvcKeyT | undefined;
    go(note.menu, { room: room ? { v: 'detail', id: room, open: openK } : undefined });
    setTimeout(() => {
      if (su.includes('kakao')) setDialog({ type: 'kakao' });
      if (get('dialog') === 'import') { setImportSel(''); setDialog({ type: 'roomImport' }); }
      if (get('dialog') === 'create') setDialog({ type: 'roomCreate' });
      setHiPin(note.n);
      setTimeout(() => { const el = document.querySelector<HTMLElement>(`[data-pin="${note.n}"]`); el?.scrollIntoView({ block: 'center', behavior: 'smooth' }); pinScrollGuardUntil = Date.now() + 1500; setTimeout(() => { const pinEl = el?.querySelector('.dw-pin') as HTMLElement | null; pinEl?.focus({ preventScroll: true }); pinScrollGuardUntil = Date.now() + 800; setPinReq(note.n); setTimeout(() => setPinReq(null), 50); }, 650); }, 450);
    }, 420);
  };
  const revertMemo = () => {
    if (!memoSnap || modalOpen) return;
    const m = memoSnap;
    setRows(m.rows); setRcps(m.rcps); setRooms(m.rooms); setRoomPreset(m.rp); setOpPreset(m.preset);
    setChartMode(m.chart); setChartLimited(m.limited); setChartMissing(m.missing); setPartialFail(m.partial); setTAppt(m.tAppt); setSoftDismissed(m.soft);
    if (m.chart !== chartMode) smartRestore.current = m.smart; else setSmart(m.smart);
    setMemoSnap(null); notify('판단 메모 이동 전 상태로 되돌렸어요.');
  };

  /* 진료실 CRUD · 불러오기 */
  const activeIn = (room: Room) => rows.filter(x => ACTIVE.includes(x.state) && x.room === room.name).length;
  /** 삭제 가드: 진행 중 예약 + 처리 중 접수(데스크 '진행중인 접수 또는 예약' 기준) */
  const busyIn = (room: Room) => activeIn(room) + rcps.filter(x => x.roomId === room.id && !x.done).length;
  const openRoomForm = (room?: Room) => { setError(''); setRoomTried(false); setRoomForm(room ? { name: room.name, alias: room.alias, dept: room.dept, doctors: room.doctors.length ? [...room.doctors] : [''] } : { name: '', alias: '', dept: '', doctors: [''] }); setDialog({ type: 'roomForm', id: room?.id }); };
  /** 새 진료실: 연동 차트 병원은 불러오기/직접 만들기 선택, 비연동 차트 병원은 바로 직접 만들기(판단 메모 4) */
  const onCreateRoom = () => { setError(''); if (linked) setDialog({ type: 'roomCreate' }); else openRoomForm(); };
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
        if (prev && prev.name !== entry.name) { setRows(old => old.map(x => x.room === prev.name ? { ...x, room: entry.name } : x)); if (pRoom === prev.name) setPRoom(entry.name); }
      } else setRooms(old => [...old, newRoom(entry, old.length)]);
    }, editId ? '진료실 정보를 저장했어요.' : `진료실 ‘${entry.name}’${eul(entry.name)} 만들었어요. 서비스 운영은 진료실 상세에서 켜 주세요.`, () => setDialog(null));
  };
  /** 불러오기도 직접 만들기와 같은 진료실 이름 중복 검사·문구를 쓴다 */
  const importNameDup = (id: string) => { const c = CHART_ROOMS.find(x => x.id === id); return !!c && rooms.some(x => x.name === c.name); };
  const submitImport = () => {
    const c = CHART_ROOMS.find(x => x.id === importSel); if (!c || rooms.some(x => x.chartLink === c.id) || importNameDup(c.id)) return;
    save(() => setRooms(old => [...old, { ...newRoom({ name: c.name, alias: '', dept: c.dept, doctors: c.doctors }, old.length), chartLink: c.id }]), `차트 진료실 ‘${c.name}’${eul(c.name)} 불러와 연동했어요. 서비스 운영은 진료실 상세에서 켜 주세요.`, () => setDialog(null));
  };
  const deleteRoom = (room: Room) => save(
    () => { setRooms(old => old.filter(x => x.id !== room.id)); if (pRoom === room.name) setPRoom('전체 진료실'); if (rRoom === room.id) setRRoom('all'); },
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

  /* 알림: 진행 중 예약은 예약 현황 상세로, 종료 건은 지난 내역 예약 탭 상세로 */
  const openRec = (id: string) => { const x = viewRows.find(y => y.id === id); if (!x) return; if (ACTIVE.includes(x.state)) go('예약 현황', { appt: { id, date: x.date } }); else { setPTab('예약'); go('지난 내역'); openDetail(id); } };
  const openNoti = (n: Noti) => {
    const hasRec = !!n.rec && viewRows.some(x => x.id === n.rec);
    if (n.rec && !hasRec) { fail('연결된 예약을 찾을 수 없어요. 현재 화면에서 볼 수 없는 건이에요.'); return; }
    if (n.read) { if (hasRec) openRec(n.rec); return; }
    if (serverDown) { fail('굿닥 서버에 연결할 수 없어 읽음 처리하지 못했어요.'); if (hasRec) openRec(n.rec); return; }
    setNotis(old => old.map(x => x.id === n.id ? { ...x, read: true } : x));
    if (hasRec) openRec(n.rec); else notify('알림을 읽음 처리했어요. (체험용 알림은 연결된 예약이 없어요)');
  };
  const readAll = () => instant(() => setNotis(old => old.map(x => allNotis.some(n => n.id === x.id) ? { ...x, read: true } : x)), '모든 알림을 읽음 처리했어요.', '읽음 처리');

  /* ───────── 렌더 조각 ───────── */
  const skeleton = (n = 5) => <div className="dw-skeleton" aria-label="불러오는 중" role="status">{Array.from({ length: n }, (_, i) => <div key={i}><i /><i /><i /><i /></div>)}</div>;
  const serverBanner = serverDown && <div className="cu-warning dw-banner" role="alert"><VscWarning />굿닥 서버에 연결할 수 없어요. 마지막으로 불러온 정보이며, 상태 변경을 저장할 수 없어요.<button className="cu-btn quiet" onClick={() => { setServerDown(false); notify('서버 연결을 모의 복구했어요.'); }}>다시 연결 (모의)</button></div>;
  const partialBanner = partialFail && <div className="cu-warning dw-banner dw-partial" role="alert"><VscWarning /><span>진료항목 예약을 불러오지 못했어요. 진료실 예약은 정상 표시 중이에요.<Pin n={16} /></span><button className="cu-btn quiet" onClick={() => { setMemoSnap(null); setPartialFail(false); notify('진료항목 예약을 다시 불러왔어요 (모의).'); }}>다시 시도</button></div>;
  const failHint = failSim && <p className="dw-fail-hint"><VscBeaker />체험 설정의 ‘저장 실패’가 켜져 있어요. 확인을 누르면 실패 결과를 보여 줍니다.</p>;
  const errorBox = error && <p className="cu-error" role="alert"><VscError /> {error}</p>;
  const pager = (cur: number, count: number, set: (n: number) => void, label: string) => (
    <div className="cu-pagination"><span>{label}</span><div>
      <button disabled={cur === 1} onClick={() => set(cur - 1)} aria-label="이전 페이지">‹</button>
      {Array.from({ length: count }, (_, i) => <button key={i} className={cur === i + 1 ? 'active' : ''} aria-current={cur === i + 1 ? 'page' : undefined} onClick={() => set(i + 1)}>{i + 1}</button>)}
      <button disabled={cur === count} onClick={() => set(cur + 1)} aria-label="다음 페이지">›</button>
    </div></div>
  );
  /** 진료실 없음: 비연동 차트 병원은 선택형 안내(닫기 가능 — 판단 메모 17) */
  const roomSoftNote = rooms.length === 0 && !softDismissed && !linked && <div className="dw-soft-note"><VscInfo /><span>진료실을 만들면 진료실 예약도 받을 수 있어요.<Pin n={17} /></span><button className="cu-btn" onClick={() => { go('진료실'); onCreateRoom(); }}><VscAdd />진료실 만들기</button><button className="cu-icon" aria-label="안내 닫기" onClick={() => setSoftDismissed(true)}><VscChromeClose /></button></div>;
  const roomsEmpty = <div className="cu-empty"><VscOrganization /><strong>진료실이 없어요</strong><p>진료실 예약을 받으려면 진료실을 만들어 주세요. 진료항목 예약은 진료실 없이도 받을 수 있어요.</p><button className="cu-btn" onClick={onCreateRoom}><VscAdd />진료실 만들기</button></div>;

  const recTable = (data: Rec[]) => (
    <div className="cu-table-wrap"><table className="cu-table dw-table"><thead><tr>
      <th>상태</th><th>방문 예정 / 신청일</th>{showBoth && <th>유형</th>}{roomSide && <th>진료실</th>}<th>내원목적 · 요청사항</th>{itemSide && <th>진료항목 / 가격</th>}<th>환자 / 연락처</th><th aria-label="상세" />
    </tr></thead><tbody>
      {data.map(x => { const isItem = x.kind === '진료항목 예약'; return (
        <tr key={x.id} tabIndex={0} onClick={e => { focusReturn = e.currentTarget; openDetail(x.id); }} onKeyDown={e => { if (e.key === 'Enter') { focusReturn = e.currentTarget; openDetail(x.id); } }}>
          <td><Tag state={x.state} />{x.state === '자동 종료' && <span className="dw-warn-chip dw-auto-chip" title={AUTO_REASON}>실제 완료·취소 아님</span>}</td>
          <td><strong>{fmt(x.date)} {timeLabel(x)}</strong><small>신청 {fmt(x.created)}</small></td>
          {showBoth && <td>{isItem ? '진료항목' : '진료실'}<small>{x.channel}</small></td>}
          {roomSide && <td>{isItem ? <span className="dw-muted">—</span> : x.room}</td>}
          <td className="dw-ellip-td"><span className="dw-ellip" title={isItem ? x.etc : x.purpose}><strong>{isItem ? (x.etc || '—') : x.purpose}</strong><small>{isItem ? '요청사항' : (x.etc || '—')}</small></span></td>
          {itemSide && <td>{isItem ? <><strong>{x.item}</strong><small>{x.price}</small></> : <span className="dw-muted">—</span>}</td>}
          <td><strong>{x.name}</strong><small>{x.phone}</small></td>
          <td><button className="cu-icon" aria-label={`${x.name} 상세 보기`} onClick={e => { e.stopPropagation(); openDetail(x.id); }}><VscChevronRight /></button></td>
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
    return <>
      {partialBanner}
      {roomSoftNote}
      <div className="cu-section-heading"><h2>오늘 현황<Pin n={12} /></h2><span>{fmtFull(TODAY)} · 서버 기준 예시 집계</span></div>
      <div className="cu-stat-grid">
        {tiles.map(([label, [all, rm, it], target, subt]) => (
          <button className="cu-stat" key={label} onClick={() => { if (target === '오늘 신청') { setApptChip(true); go('예약 현황'); } else { clearPast(); setChip(target); setPTab('예약'); go('지난 내역'); } }}>
            <span>{label}</span><strong>{all}<small>건</small></strong><em className="dw-stat-sub">{subt}</em>{showBoth && <em className="dw-stat-split">진료실 {rm} · 진료항목 {it}</em>}<VscChevronRight />
          </button>
        ))}
      </div>
      <p className="cu-subnote">타일은 운영 중인 예약 유형을 합산해요. 누르면 예약 현황 또는 지난 내역이 해당 조건으로 열려요.</p>
      <div className="cu-section-heading notice"><h2>공지사항</h2><span>{NOTICES.length}건</span></div>
      <div className="cu-notice-list">{NOTICES.slice((noticePage - 1) * 3, noticePage * 3).map(([type, title, d]) => (
        <button key={title} onClick={() => setDialog({ type: 'notice', title })}><span><span className="cu-notice-type">{type}</span>{title}</span><span>{d}<VscChevronRight /></span></button>
      ))}</div>
      {pager(noticePage, Math.ceil(NOTICES.length / 3), setNoticePage, '3개씩 보기')}
    </>;
  };

  /** 지난 내역: 접수 | 예약 탭(기본 접수 · 탭마다 필터 따로 유지) */
  const pastPage = () => <>
    <div className="cu-tabs dw-past-tabs" role="tablist" aria-label="지난 내역 구분">{(['접수', '예약'] as const).map(tb => <button key={tb} role="tab" aria-selected={pTab === tb} className={pTab === tb ? 'active' : ''} onClick={() => setPTab(tb)}>{tb}</button>)}</div>
    {pTab === '접수' ? pastRcpTab() : pastApptTab()}
  </>;
  const pastRcpTab = () => <>
    <div className="cu-filters dw-mt0">
      <label className="cu-search"><VscSearch /><input aria-label="지난 접수 검색" placeholder="이름·연락처 검색" value={rSearch} onChange={e => setRSearch(e.target.value)} /></label>
      <span className="dw-filter-pin"><select aria-label="조회 기간" value={rPeriod} onChange={e => { const v = e.target.value as PastPeriod; setRPeriod(v); if (v === '직접 설정') setRCustom(rFrom, rTo); else setRErr(''); }}><option value="오늘">오늘</option><option value="7일">최근 7일</option><option value="30일">최근 30일</option><option value="직접 설정">직접 설정</option></select><Pin n={27} /></span>
      {rPeriod === '직접 설정' && <span className="dw-range"><input type="date" className="dw-date" aria-label="조회 시작일" value={rFrom} max={TODAY} onChange={e => setRCustom(e.target.value, rTo)} />~<input type="date" className="dw-date" aria-label="조회 종료일" value={rTo} onChange={e => setRCustom(rFrom, e.target.value)} /></span>}
      {roomSide && <select aria-label="지난 접수 진료실 필터" value={rRoom} onChange={e => setRRoom(e.target.value)}><option value="all">전체 진료실</option>{rooms.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select>}
      <button className="cu-icon" aria-label="지난 접수 검색 조건 초기화" title="검색 조건 초기화" onClick={clearRcpPast}><VscRefresh /></button>
    </div>
    {rPeriod === '직접 설정' && (rErr ? <p className="cu-field-error dw-range-err" role="alert"><VscError />{rErr}<small> · 지금은 {fmtFull(rRange[0])} ~ {fmtFull(rRange[1])}로 조회 중이에요.</small></p> : <p className="dw-filter-hint"><VscInfo />접수일 기준 · 최대 6개월까지 조회할 수 있어요.</p>)}
    <div className="cu-table-toolbar dw-toolbar-compact">
      <span>총 <strong>{pastRcps.length}</strong>건<small className="dw-toolbar-hint">접수일 기준 · 상태는 바꿀 수 없어요</small></span>
    </div>
    {loading ? skeleton() : <>
      {pastRcps.length > 0 && <PastRcpTable kit={tkit} cols={rcpCols} list={pastRcps.slice((rCurPage - 1) * PAGE_SIZE, rCurPage * PAGE_SIZE)} onOpen={(id, el) => { focusReturn = el; setError(''); setDialog({ type: 'rcpDetail', id }); }} />}
      {!pastRcps.length && <div className="cu-empty"><VscSearch /><strong>{rSearch || rRoom !== 'all' ? '조건에 맞는 지난 내역이 없어요' : '이 기간의 지난 내역이 없어요'}</strong><p>기간을 늘리거나 ‘직접 설정’으로 최대 6개월까지 조회해 보세요.</p><button className="cu-btn" onClick={clearRcpPast}>조건 초기화</button></div>}
      {pastRcps.length > 0 && pager(rCurPage, rPageCount, setRPage, `${PAGE_SIZE}개씩 보기`)}
    </>}
  </>;
  const pastApptTab = () => <>
    {partialBanner}
    <div className="cu-filters dw-mt0">
      <label className="cu-search"><VscSearch /><input aria-label="지난 내역 검색" placeholder="이름·연락처 검색" value={pSearch} onChange={e => setPSearch(e.target.value)} /></label>
      <span className="dw-filter-pin"><select aria-label="조회 기간" value={pPeriod} disabled={!!chip} onChange={e => { const v = e.target.value as PastPeriod; setPPeriod(v); if (v === '직접 설정') setCustom(pFrom, pTo); else setPErr(''); }}><option value="오늘">오늘</option><option value="7일">최근 7일</option><option value="30일">최근 30일</option><option value="직접 설정">직접 설정</option></select><Pin n={27} /></span>
      {pPeriod === '직접 설정' && !chip && <span className="dw-range"><input type="date" className="dw-date" aria-label="조회 시작일" value={pFrom} max={TODAY} onChange={e => setCustom(e.target.value, pTo)} />~<input type="date" className="dw-date" aria-label="조회 종료일" value={pTo} onChange={e => setCustom(pFrom, e.target.value)} /></span>}
      {showBoth && <select aria-label="지난 내역 예약 유형" value={pKind} onChange={e => setPKind(e.target.value as any)}><option>전체</option><option>진료실 예약</option><option>진료항목 예약</option></select>}
      {roomSide && <select aria-label="지난 내역 진료실 필터" value={pRoom} onChange={e => setPRoom(e.target.value)}><option>전체 진료실</option>{rooms.map(x => <option key={x.id}>{x.name}</option>)}{itemSide && <option value="진료실 미지정">진료실 미지정(진료항목 예약)</option>}</select>}
      <button className="cu-icon" aria-label="지난 내역 검색 조건 초기화" title="검색 조건 초기화" onClick={clearPast}><VscRefresh /></button>
    </div>
    {pPeriod === '직접 설정' && !chip && (pErr ? <p className="cu-field-error dw-range-err" role="alert"><VscError />{pErr}{pRange && <small> · 지금은 {fmtFull(pRange[0])} ~ {fmtFull(pRange[1])}로 조회 중이에요.</small>}</p> : <p className="dw-filter-hint"><VscInfo />방문 예정일 기준 · 최대 6개월까지 조회할 수 있어요.</p>)}
    {itemSide && pRoom !== '전체 진료실' && pRoom !== '진료실 미지정' && pKind !== '진료실 예약' && <p className="dw-filter-hint"><VscInfo />진료항목 예약은 진료실이 없어 이 필터에서 빠져요.</p>}
    {chip && <div className="dw-chips"><span className="dw-chip">대시보드 · {chip === '진료완료' ? '오늘 진료완료' : '오늘 진료 취소'}<button aria-label="대시보드 조건 해제" onClick={() => setChip('')}><VscChromeClose /></button></span><small>대시보드 조건이 켜져 있는 동안 기간 필터는 쓰지 않아요.</small></div>}
    <div className="cu-table-toolbar dw-toolbar-compact">
      <div className="dw-subfilter" role="group" aria-label="상태 필터">{PAST_STATES.map(s => <button key={s} aria-pressed={pState === s} className={pState === s ? 'on' : ''} onClick={() => setPState(s)}>{s} <b>{s === '전체' ? pastAll.length : pastAll.filter(x => x.state === s).length}</b></button>)}</div>
      <span>총 <strong>{list.length}</strong>건<small className="dw-toolbar-hint">방문 예정일 기준 · 상태는 바꿀 수 없어요{list.some(x => x.state === '자동 종료') ? ' · 자동 종료는 실제 진료완료·취소가 아니에요' : ''}</small></span>
      <div><select aria-label="정렬" value={pSort} onChange={e => setPSort(e.target.value)}><option>방문 예정 빠른 순</option><option>방문 예정 늦은 순</option></select></div>
    </div>
    {loading ? skeleton() : <>
      {list.length > 0 && recTable(list.slice((curPage - 1) * PAGE_SIZE, curPage * PAGE_SIZE))}
      {!list.length && <div className="cu-empty"><VscSearch /><strong>{pSearch || chip || pRoom !== '전체 진료실' || pKind !== '전체' || pState !== '전체' ? '조건에 맞는 지난 내역이 없어요' : '이 기간의 지난 내역이 없어요'}</strong><p>기간을 늘리거나 ‘직접 설정’으로 최대 6개월까지 조회해 보세요.</p><button className="cu-btn" onClick={clearPast}>조건 초기화</button></div>}
      {list.length > 0 && pager(curPage, pageCount, setPage, `${PAGE_SIZE}개씩 보기`)}
    </>}
  </>;

  /** 진료항목 운영 설정 — 시각·고정 카피는 figma baseline 참조, 동작·분기는 기존 규칙 그대로 */
  const itemOpsPage = () => <div className="dw-io">
    <div className="dw-io-card">
      <div className="dw-io-text"><strong className="dw-io-title">진료 예약 받기</strong><p className="dw-io-desc"><span className="dw-io-n">{visibleItems}개의 진료항목이</span> 등록되어 있어요.</p></div>
      <div className="dw-io-ctl"><span className={'dw-io-status ' + (tAppt.on ? 'on' : '')}>{tAppt.on ? '운영중' : '미운영'}</span><button className={'cu-toggle ' + (tAppt.on ? 'on' : '')} aria-label="진료 예약 받기" aria-pressed={tAppt.on} onClick={toggleTAppt}><span /></button><Pin n={13} /><Pin n={14} /></div>
    </div>
    <div className="dw-io-group">
      <h2 className="dw-io-sec">설정<Pin n={15} /></h2>
      <div className="dw-io-banner"><span className="dw-io-banner-msg"><svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="8" fill="currentColor" /><rect x="9" y="5.5" width="2" height="6" rx="1" fill="#fff" /><circle cx="10" cy="14" r="1.1" fill="#fff" /></svg>병원 운영 시간에 맞춰 30분 단위로 예약을 받습니다.</span><button type="button" className="dw-io-banner-link" onClick={() => notify('병원 운영시간은 병원 정보 화면에서 관리해요.')}>병원 운영시간 관리<VscChevronRight /></button></div>
      <div className="dw-io-card">
        <div className="dw-io-text"><strong className="dw-io-title">예약 자동 확정</strong><p className="dw-io-desc">자동 확정 사용 시, 별도 승인 없이 예약 신청과 동시에 자동으로 확정됩니다.{kakaoHospital && tAppt.autoConfirm && <><br /><span className="dw-io-kakao">카카오톡 예약하기로 받는 예약은 이 설정과 관계없이 자동으로 확정됩니다.</span></>}</p>
          {kakaoHospital && !tAppt.autoConfirm && <div className="dw-guide-warn"><b>카카오톡 예약하기로 받는 예약은 자동으로 확정됩니다</b><ul><li>카카오톡 예약하기가 수동 확정을 지원하지 않아 적용된 임시 정책입니다.</li><li>굿닥으로 받는 예약은 수동으로 확정됩니다.</li><li>진료하기 어려운 예약은 예약 신청 내역에서 취소할 수 있습니다.</li></ul></div>}</div>
        <button className={'cu-toggle ' + (tAppt.autoConfirm ? 'on' : '')} aria-label="예약 자동 확정" aria-pressed={tAppt.autoConfirm} onClick={() => { if (tAppt.autoConfirm && kakaoHospital) { setError(''); setDialog({ type: 'tAutoOff' }); return; } instant(() => setTAppt(o => ({ ...o, autoConfirm: !o.autoConfirm })), tAppt.autoConfirm ? '예약 자동 확정을 껐어요.' : '예약 자동 확정을 켰어요.'); }}><span /></button>
      </div>
      <div className="dw-io-card"><div className="dw-io-text"><strong className="dw-io-title">당일 예약 허용</strong><p className="dw-io-desc">당일 예약 허용 시, 현재 시간 기준 1시간 이후부터 당일 예약을 받습니다.</p></div><button className={'cu-toggle ' + (tAppt.sameDay ? 'on' : '')} aria-label="당일 예약 허용" aria-pressed={tAppt.sameDay} onClick={() => instant(() => setTAppt(o => ({ ...o, sameDay: !o.sameDay })), '설정을 저장했어요.')}><span /></button></div>
      <div className="dw-io-card"><div className="dw-io-text"><strong className="dw-io-title">새 예약 알림 받기</strong><p className="dw-io-desc">새 예약 신청이 발생하면, 이 PC에서 윈도우 알림을 받습니다.</p></div><button className={'cu-toggle ' + (tAppt.notify ? 'on' : '')} aria-label="새 예약 알림 받기" aria-pressed={tAppt.notify} onClick={() => instant(() => setTAppt(o => ({ ...o, notify: !o.notify })), '설정을 저장했어요.')}><span /></button></div>
    </div>
  </div>;

  const itemsPage = () => <>
    <p className="cu-inline-note dw-note"><VscInfo /><span>진료 예약 받기·자동 확정·당일 예약·새 예약 알림은 운영 설정에서 바꿀 수 있어요. <button type="button" className="dw-link" onClick={() => go('진료항목 운영 설정')}>진료항목 운영 설정으로 이동</button></span></p>
    {!tAppt.on && <div className="dw-red-box dw-mb"><VscWarning />진료항목을 병원 정보에 노출하려면 진료항목 운영 설정에서 '진료 예약 받기'를 켜주세요.<button className="dw-link" onClick={() => go('진료항목 운영 설정')}>진료항목 운영 설정으로 이동</button></div>}
    <div className="cu-item-panel">
      <div className="cu-item-categories"><strong>카테고리</strong><button className="active">전체 <span>{items.length}</span></button></div>
      <div className="cu-item-list"><h3>진료항목<span className="dw-kakao-note">카카오톡 예약하기 노출은 항목별로 관리해요 · 진료실 카카오 연동과 별개<Pin n={14} /></span></h3>{items.map((it, i) => (
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

  /* ───────── 지난 내역 상세(읽기 전용) ───────── */
  const detailModal = (x: Rec) => {
    const isItem = x.kind === '진료항목 예약';
    const past = rows.filter(y => y.phone === x.phone && y.name === x.name && y.id !== x.id && CLOSED.includes(y.state)).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);
    return <Modal title="예약 상세" wide onClose={close} footer={<button className="cu-btn" onClick={close}>닫기</button>}>
      <div className="cu-detail-heading"><span>{x.kind} · {x.id} · 유입 {x.channel}</span><Tag state={x.state} /></div>
      {x.state === '자동 종료' && <p className="cu-inline-note dw-auto"><VscInfo /><span><strong>실제 진료완료·취소가 아니에요.</strong> 방문 예정 시각이 지나고 결과가 확인되지 않은 건이라 상태를 바꿀 수 없어요. <Hold text="보류 · 접수·진료실 예약 표시 범위 확인 중" /></span></p>}
      <h3 className="cu-detail-label">예약 정보</h3>
      <div className="cu-detail-card">
        <dl className="dw-dl">
          <dt>방문 예정</dt><dd><strong className="cu-detail-date">{fmtFull(x.date)} {timeLabel(x)}</strong></dd>
          {isItem ? <><dt>진료항목</dt><dd>{x.item}</dd><dt>가격</dt><dd>{x.price}</dd></> : <><dt>진료실</dt><dd>{x.room}</dd><dt>내원목적</dt><dd>{x.purpose || '—'}</dd></>}
          <dt>{isItem ? '요청사항' : '기타'}</dt><dd>{x.etc || '—'}</dd>
          <dt>진료메모</dt><dd>{x.memo || '—'}</dd>
          <dt>신청일</dt><dd>{fmtFull(x.created)}</dd>
          {x.reason && <><dt>처리 사유</dt><dd>{x.reason}</dd></>}
        </dl>
      </div>
      <h3 className="cu-detail-label">환자 기본정보</h3>
      <div className="cu-detail-card cu-person dw-person"><div><span>이름</span><strong>{x.name}</strong></div><div><span>연락처</span><strong>{x.phone}</strong></div><div><span>생년월일</span><strong>{x.birth}</strong></div></div>
      <h3 className="cu-detail-label">최근 진료 이력</h3>
      {past.length ? <ul className="dw-history">{past.map(p => <li key={p.id}><span>{fmtFull(p.date)} {timeLabel(p)}</span><span>{p.room === '—' ? p.item : `${p.room} · ${p.purpose}`}</span><Tag state={p.state} /></li>)}</ul> : <p className="dw-muted-line">이 병원에서의 이전 진료 이력이 없어요.</p>}
    </Modal>;
  };

  /* ───────── 셸 ───────── */
  const kit: Kit = { Modal, notify: (s: string) => notify(s), fail, instant, serverDown, failSim, linked, chartLimited, mode: chartMode, Pin, itemOnly: opPreset === '진료항목 예약만', chartMissingId, onOpenKakao: () => setDialog({ type: 'kakao' }) };
  const tkit: TKit = { Modal, Pin, silent, rooms, linked, paths: opPaths, onCreateRoom: () => { go('진료실'); onCreateRoom(); } };
  const expToggles: [string, boolean, (v: boolean) => void, React.ReactNode, boolean?][] = [
    ['차트 진료실 없음', chartMissing, setChartMissing, <span>차트 진료실 없음 <em className="dw-exp-note">연동 차트 · 2진료실이 연동일 때</em></span>, !linked || !rooms.find(x => x.id === 'R2')?.chartLink],
    ['차트 기능 제한', chartLimited, (v: boolean) => { setMemoSnap(null); setChartLimited(v); }, <span>차트 기능 제한 <em className="dw-exp-note">연동 진료실만 · 원격·예약 막힘</em></span>, !linked],
    ['스마트접수 가능', smart, setSmart, <span>스마트접수 가능 <em className="dw-exp-note">연동 차트만 · 특정 EMR 전용</em></span>, !linked],
    ['진료항목 조회 실패', partialFail, (v: boolean) => { setMemoSnap(null); setPartialFail(v); }, '진료항목 조회 실패'],
    ['저장 실패', failSim, setFailSim, '저장 실패'],
    ['서버 오류', serverDown, setServerDown, '서버 오류'],
    ['알림 99+', manyNoti, toggleMany, '알림 99+']
  ];
  const moreOn = [chartMissing, chartLimited, linked && !smart, partialFail, failSim, serverDown, manyNoti].filter(Boolean).length;
  const expOn = [linked, roomPreset !== '비연동만', opPreset !== '둘 다', chartLimited, linked && !smart, partialFail, failSim, serverDown, manyNoti].filter(Boolean).length;
  const connection = linked ? `병원 차트: 연동 차트(${CHART_NAME}) · 연결됨` : '병원 차트: 비연동 차트';
  const moduleMenu = ['진료실', '진료실 운영 설정', '접수 현황', '예약 현황'].includes(menu);
  const fillMenu = menu === '접수 현황' || menu === '예약 현황';
  const sup = (rm: Room, k: 'mobile' | 'appt') => supFor({ linked, chartLimited }, rm)(k);
  return <div className="cu-app dw-app">
    <div className="cu-prototype">
      <div><strong>데스크 기능 웹 이관 시안 v2</strong><span>v2.2 · 진료실 단위 차트 연동 · 가상 데이터</span></div>
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
      <label className={'dw-exp-item ' + (modalOpen ? 'locked' : '')}>병원 차트<select aria-label="병원 차트" disabled={modalOpen} value={chartMode} onChange={e => { const v = e.target.value as ChartMode; setMemoSnap(null); const rp = v === 'unlinked' && roomPreset === '연동 2 + 비연동 1' ? '비연동만' : roomPreset; applyAll(v, rp, opPreset, v === 'linked' ? '연동 차트 병원으로 바꿨어요(체험). 차트 진료실 불러오기를 쓸 수 있어요.' : `비연동 차트 병원으로 바꿨어요(체험).${rp !== roomPreset ? ' 연동 진료실이 없어지므로 진료실 구성을 ‘비연동만’으로 바꿨어요.' : ''}`); }}><option value="linked">연동 차트</option><option value="unlinked">비연동 차트</option></select></label>
      <label className={'dw-exp-item ' + (modalOpen ? 'locked' : '')}>진료실 구성<select aria-label="진료실 구성" disabled={modalOpen} value={roomPreset} onChange={e => { setMemoSnap(null); applyAll(chartMode, e.target.value as RoomPreset, opPreset, `진료실 구성을 ‘${e.target.value}’${ro(e.target.value)} 바꿨어요(체험). 체험 중 만든 데이터는 버리고 다시 구성했어요.`); }}>{ROOM_PRESETS.map(x => <option key={x} value={x} disabled={x === '연동 2 + 비연동 1' && !linked}>{x}{x === '연동 2 + 비연동 1' && !linked ? ' (연동 차트만)' : ''}</option>)}</select></label>
      <label className={'dw-exp-item ' + (modalOpen ? 'locked' : '')}>운영 유형<select aria-label="운영 유형" disabled={modalOpen} value={presetShown} onChange={e => { if (e.target.value === CUSTOM) return; setMemoSnap(null); applyAll(chartMode, roomPreset, e.target.value as Preset, `운영 유형을 ‘${e.target.value}’${ro(e.target.value)} 바꿨어요(체험). 체험 중 만든 데이터는 버리고 다시 구성했어요.`); }}>{PRESETS.map(x => <option key={x}>{x}</option>)}{presetShown === CUSTOM && <option value={CUSTOM} disabled>{CUSTOM}</option>}</select></label>
      <div className="dw-exp-more-wrap">
        <button type="button" className="dw-exp-more" disabled={modalOpen} aria-expanded={moreOpen} onClick={() => setMoreOpen(!moreOpen)}>조건 더보기{moreOn > 0 && <b>{moreOn}</b>} ▾</button>
        {moreOpen && <div className="dw-exp-pop" role="group" aria-label="체험 조건">{expToggles.map(([label, value, set, shown, dis]) => <label key={label} className={'dw-exp-item ' + (modalOpen || dis ? 'locked' : '')}><button type="button" className={'cu-toggle ' + (value ? 'on' : '')} aria-label={label} aria-pressed={value} disabled={modalOpen || !!dis} onClick={() => set(!value)}><span /></button>{shown}</label>)}</div>}
      </div>
      <span className="dw-exp-judge">진료실 {rooms.length}개(연동 {rooms.filter(x => linked && x.chartLink).length}) · 진료실 예약 {roomOp ? '운영' : '미운영'} · 진료항목 예약 {itemOp ? '운영' : '미운영'}</span>
      {memoSnap && <span className="dw-exp-memo">메모 이동으로 바뀜<button type="button" className="dw-link" disabled={modalOpen} onClick={revertMemo}>되돌리기</button></span>}
      <button className="cu-btn quiet dw-exp-reset" disabled={modalOpen} onClick={resetAll}><VscRefresh />처음 상태로</button>
    </div>}
    <div className="cu-planned"><VscInfo />미승인 시안 · 진료실 단위 차트 연동 구조 · 굿닥 서버 기준 데이터 · 실제 서버·차트·환자 알림과 통신하지 않아요.</div>
    {drawer && <aside className="dw-notes" id="dw-notes" aria-label="판단 메모 목록">
      <header><div><strong>판단 메모 {NOTES.length}건</strong><small>PO 확인이 필요한 제안·PD 판단이에요. 항목을 누르면 해당 화면으로 이동해요.</small></div><button className="cu-icon" aria-label="판단 메모 목록 닫기" onClick={() => setDrawer(false)}><VscChromeClose /></button></header>
      <ol>{NOTES.map(nt => <li key={nt.n}><button onClick={() => jumpTo(nt)}><span className="dw-pin static">{nt.n}</span><span><b>{nt.title}</b><small>{nt.where}</small></span><em className={'dw-pin-chip ' + (nt.status ? 'done' : '')}>{nt.status || 'PO 확인 필요'}</em></button></li>)}</ol>
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
            <div className="cu-hospital"><strong>굿닥 예시의원</strong><span>{linked ? '연동 차트 병원 (체험)' : '비연동 차트 병원 (체험)'}</span></div>
            <div className="cu-nav-section">서비스 운영</div>
            {NAV.map((n, i) => <React.Fragment key={n.key}>
              {n.parent && NAV[i - 1]?.parent !== n.parent && (() => { const kids = NAV.filter(x => x.parent === n.parent); const on = kids.some(x => x.key === menu); return <button className={'cu-nav-row dw-nav-group ' + (on ? 'on' : '')} aria-label={`${n.parent} · ${kids[0].key}${ro(kids[0].key)} 이동`} onClick={() => go(kids[0].key)}>{GROUP_ICON[n.parent]}<span>{n.parent}</span></button>; })()}
              <button className={'cu-nav-row ' + (n.parent ? 'indent dw-nav-sub ' : '') + (menu === n.key ? 'active' : '')} aria-current={menu === n.key ? 'page' : undefined} onClick={() => go(n.key)}>
                {n.icon}<span>{n.key}{n.key === '지난 내역' && <Pin n={1} />}</span>
                {n.key === '알림 메시지함' && unread > 0 && <b className="dw-badge nav">{badge(unread)}</b>}
              </button></React.Fragment>)}
            <div className="cu-nav-section">병원 홍보</div>
            <button className="cu-nav-row" onClick={() => setDialog({ type: 'notice', title: '병원 검색 정보' })}><span>병원 검색 정보</span><VscChevronRight /></button>
            <div className="cu-nav-section">외부 플랫폼 연동</div>
            <button className="cu-nav-row" onClick={() => setDialog({ type: 'kakao' })}><span>카카오톡 예약하기</span><VscChevronRight /></button>
            <div className="cu-nav-bottom"><span>환자 메뉴 미제공 (법률 검토)</span><button onClick={() => setDialog({ type: 'notice', title: '이용가이드' })}>이용가이드</button></div>
          </aside>
          <main className={'cn-main cu-main ' + (fillMenu ? 'dw2-fill' : '')}>
            {menu === '접수 현황' && <ReceiptPage kit={tkit} rcps={rcps} setRcps={setRcps} cols={rcpCols} setCols={setRcpCols} banner={serverBanner} />}
            {menu === '예약 현황' && <ApptPage key={apptKey} kit={tkit} recs={viewRows} setRows={setRows} rcps={rcps} items={items} banner={<>{serverBanner}{partialBanner}</>} chip={apptChip} onClearChip={() => setApptChip(false)} init={apptInit} />}
            {menu === '진료실' && <ExamRooms key={roomsKey} kit={kit} rooms={rooms} setRooms={setRooms} invalid={invalid} setInvalid={setInvalid} initialView={roomsInit} emptyNode={roomsEmpty} activeIn={activeIn} banner={serverBanner} Hold={Hold}
              onCreate={onCreateRoom} onEdit={rm => openRoomForm(rm)} onDelete={rm => { setError(''); setDialog({ type: 'roomDelete', id: rm.id }); }} />}
            {menu === '진료실 운영 설정' && <OperationPage key={roomsKey} kit={kit} rooms={rooms} smart={linked && smart} banner={serverBanner} store={{ saved: opSaved, setSaved: setOpSaved, paths: opPaths, setPaths: setOpPaths }} onOpenRoom={id => go('진료실', { room: { v: 'detail', id } })} />}
            {!moduleMenu && <>
              <header className={'cn-header cu-header ' + (menu === '진료항목 운영 설정' ? 'dw-io-head' : '')}>
                <div><h1 className="cn-title" tabIndex={-1}>{menu}</h1><p className="cn-desc">{DESC[menu]}</p></div>
                {['대시보드', '알림 메시지함'].includes(menu) && <button className="cu-btn quiet" onClick={() => { setLoading(true); notify('서버에서 다시 불러왔어요 (모의).'); }}><VscRefresh />새로고침</button>}
              </header>
              {serverBanner}
              <div className="cu-content">
                {menu === '대시보드' && dashboard()}
                {menu === '지난 내역' && pastPage()}
                {menu === '진료항목' && itemsPage()}
                {menu === '진료항목 운영 설정' && itemOpsPage()}
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
    {dialog?.type === 'detail' && chosen && detailModal(chosen)}
    {dialog?.type === 'rcpDetail' && chosenRcp && <Modal title="접수 정보" wide onClose={close} footer={<button className="cu-btn" onClick={close}>닫기</button>}><PastRcpDetail kit={tkit} x={chosenRcp} /></Modal>}

    {dialog?.type === 'roomCreate' && <Modal title={<>새 진료실<Pin n={4} /></>} onClose={close} footer={<button className="cu-btn" onClick={close}>취소</button>}>
      <div className="dw2-choice">
        <button onClick={() => { setImportSel(''); setDialog({ type: 'roomImport' }); }}><strong>차트 진료실 불러오기</strong><span>불러온 진료실은 바로 차트와 연동돼요.</span><VscChevronRight /></button>
        <button onClick={() => openRoomForm()}><strong>직접 만들기</strong><span>차트와 연동하지 않는 굿닥 진료실을 만들어요.</span><VscChevronRight /></button>
      </div>
    </Modal>}
    {dialog?.type === 'roomImport' && <Modal title="차트 진료실 불러오기" busy={busy} onClose={close} footer={<><button className="cu-btn" disabled={busy} onClick={close}>취소</button><button className="cu-btn primary" disabled={busy || !importSel || importNameDup(importSel)} onClick={submitImport}>{busy ? '처리 중…' : error ? '다시 시도' : '불러오기'}</button></>}>
      <p>연동한 차트({CHART_NAME})의 진료실이에요. 굿닥 진료실 하나에 차트 진료실 하나만 연동할 수 있어요.</p>
      <div className="cu-radio-list dw2-import" role="radiogroup" aria-label="차트 진료실">{CHART_ROOMS.map(c => { const used = rooms.find(x => x.chartLink === c.id); return <label key={c.id} className={used ? 'used' : ''}>
        <input type="radio" name="chartRoom" value={c.id} checked={importSel === c.id} disabled={!!used || busy} onChange={() => setImportSel(c.id)} />
        <span><strong>{c.name}</strong><small>{c.dept} ∙ {c.doctors.join(', ')}</small></span>
        {used && <em className="dw2-used">연동됨 · {used.alias || used.name}</em>}
      </label>; })}<Pin n={5} /></div>
      {importSel && importNameDup(importSel) && <em className="dw-field-err dw-block">같은 이름의 진료실이 이미 있어요.</em>}
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

    {dialog?.type === 'roomDelete' && chosenRoom && (busyIn(chosenRoom) > 0
      ? <Modal title="진료실을 삭제할 수 없어요" onClose={close} footer={<button className="cu-btn" onClick={close}>닫기</button>}>
          <p>{chosenRoom.name}에 진료가 진행 중인 건(접수·예약)이 <strong>{busyIn(chosenRoom)}건</strong> 있어요. 모두 진료완료하거나 취소한 뒤 삭제해 주세요.</p>
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
      {kakaoHospital && <p className="cu-inline-note dw-warn-note"><VscWarning /><span>카카오톡 예약하기의 진료항목 상품 판매도 함께 중지돼요.<Pin n={14} /></span></p>}
      {activeItemAppt > 0 && <p className="cu-inline-note"><VscInfo /><span>새 예약만 받지 않아요. 이미 받은 진행 중 예약 {activeItemAppt}건은 그대로 처리해 주세요.<Pin n={13} /></span></p>}
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
      const none = rooms.length > 0 && rooms.every(rm => !sup(rm, 'mobile') && !sup(rm, 'appt'));
      const label = (k: 'mobile' | 'appt') => k === 'mobile' ? '원격 접수' : '예약';
      return <Modal title={<>카카오톡 예약하기 연동 설정<Pin n={23} /></>} wide onClose={close} footer={<button className="cu-btn primary" onClick={close}>닫기</button>}>
        <p>진료실별로 카카오 예약하기·카카오 맵에서 원격 접수·예약을 받을지 정해요. 진료실 상세의 ‘페이지로 이동’에서도 열 수 있어요.</p>
        {none && <div className="dw-red-box"><VscWarning /><span><b>연동 불가</b> · 현재 사용 중인 차트({CHART_NAME})는 원격 접수·예약 기능이 지원되지 않으니, 사용을 원하실 경우 차트사에 문의해 주세요.</span></div>}
        {rooms.length === 0 ? <p className="cu-subnote">진료실이 없어요. 진료실 예약을 연동하려면 진료실을 만들어 주세요.</p> :
          <table className="dw-auto-table dw-kakao-table"><thead><tr><th>진료실</th><th>원격 접수</th><th>예약</th></tr></thead><tbody>{rooms.map(rm => <tr key={rm.id}><td className="dw-auto-name">{rm.alias || rm.name}</td>
            {(['mobile', 'appt'] as const).map(k => <td key={k}>{!sup(rm, k) ? <span className="dw-muted">연동 불가</span> : !rm[k].accepted ? <span className="dw-muted">{label(k)} 미사용</span>
              : <span className="dw-kakao-cell"><span className={'dw-kakao ' + (rm[k].kakao ? 'on' : '')}>{rm[k].kakao ? '연동중' : '미연동'}</span><button className={'cu-toggle ' + (rm[k].kakao ? 'on' : '')} aria-label={`${rm.name} ${label(k)} 카카오 연동`} aria-pressed={rm[k].kakao} onClick={() => {
                if (!rm[k].kakao && k === 'appt' && rm.appt.advanced) { fail('기본 설정으로 전환해야 연동할 수 있어요. 해당 진료실은 고급 설정으로 예약을 받고 있어요.'); return; }
                const hasSched = k === 'mobile' ? rm.rSlots.mobile.some(x => x.date > TODAY || (x.date === TODAY && x.end > NOW)) : rm.aSlots.some(x => x.date > TODAY || (x.date === TODAY && x.time > NOW));
                if (!rm[k].kakao && !hasSched) { fail(`카카오 예약하기로 ${label(k)}${k === 'mobile' ? '를' : '을'} 받으려면 운영 스케줄이 필요해요`); return; }
                instant(() => setRooms(old => old.map(x => x.id === rm.id ? { ...x, [k]: { ...x[k], kakao: !x[k].kakao } } : x)), rm[k].kakao ? `${label(k)} 연동을 해지했어요.` : `${label(k)} 연동을 완료했어요.`, rm[k].kakao ? '연동 해지' : '연동');
              }}><span /></button></span>}</td>)}
          </tr>)}</tbody></table>}
        <p className="cu-subnote">진료항목의 카카오톡 예약하기 노출은 진료항목 메뉴에서 항목별로 관리해요. 진료항목 예약 설정은 운영 설정 › 진료항목 운영 설정에 있어요.</p>
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
      <h3 className="cu-detail-label">병원 차트</h3>
      <div className="dw-key"><span className={'cu-dot ' + (serverDown ? 'warn' : '')} /><div><strong>{connection}</strong><p>{linked ? '진료실마다 차트 진료실과 연동할 수 있어요. 연동 여부는 진료실 설정에서 확인해요.' : '차트 진료실 불러오기 없이 굿닥 진료실을 직접 만들어 써요.'}</p></div></div>
    </Modal>}

    {keyConfirm && <Modal title="제품키를 해제할까요?" busy={keyBusy} onClose={() => setKeyConfirm(false)} footer={<><button className="cu-btn" disabled={keyBusy} onClick={() => setKeyConfirm(false)}>취소</button><button className="cu-btn danger" disabled={keyBusy} onClick={async () => { setKeyBusy(true); await wait(600); setKeyBusy(false); setKeyConfirm(false); if (serverDown || failSim) { fail(serverDown ? '굿닥 서버에 연결할 수 없어 제품키를 해제하지 못했어요. 상태는 그대로예요.' : '제품키를 해제하지 못했어요(모의 실패). 상태는 그대로예요.'); return; } notify('제품키 해제를 모의 처리했어요. 실제로는 인증 화면으로 돌아가요(시안에선 생략).'); }}>{keyBusy ? '처리 중…' : '해제'}</button></>}>
      <p>해제하면 이 PC에서 커넥트를 다시 쓰려면 제품키를 입력해야 해요. 다른 PC와 병원 데이터에는 영향이 없어요.</p>
    </Modal>}

    {dialog?.type === 'notice' && <Modal title={dialog.title} onClose={close} footer={<button className="cu-btn primary" onClick={close}>확인</button>}>
      {dialog.title === '이용가이드' ? <ol className="cu-guide">
        <li><strong>접수 현황</strong>에서 비연동 진료실 접수를 내원 확정·진료 완료·접수 취소하고, 드래그로 순서·진료실을 바꿔요.</li>
        <li><strong>예약 현황</strong>에서 비연동 진료실 예약을 처리하고, 연동 진료실·진료항목 예약은 조회해요.</li>
        <li><strong>진료실</strong>에서 차트 진료실을 불러오거나 직접 만들고, 진료실별 운영과 스케줄을 관리해요.</li>
        <li>상단 바의 <strong>판단 메모</strong>로 확인이 필요한 제안을, <strong>체험 설정</strong>으로 병원 조건을 바꿔 봐요.</li>
      </ol> : <p>시안에서는 내용을 생략했어요. 기존 커넥트 웹뷰의 메뉴 위치만 보여 줍니다.</p>}
      <p className="cu-subnote">가상 검토용 · 실제 환자정보를 입력하지 마세요.</p>
    </Modal>}
  </div>;
}
