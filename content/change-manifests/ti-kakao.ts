import type { PolicyChange, PolicySource } from '../../components/prototype/ChangeDrawer';
import gcp1Summary from '../../docs/policy-summaries/GCP-1.md';

export const POLICY_SOURCES: Record<string, PolicySource> = {
  'GCP-1': {
    prdId: 'GCP-1',
    title: '진료항목 카카오톡 예약하기 연동 구축',
    version: '2.2-review',
    sourceStatus: 'review',
    targetReleaseAt: null,
    sourcePath: '3-미션·기획/1-PRD/2026-07-13-진료항목-카카오톡-예약하기-연동-구축.md',
    summaryMarkdown: gcp1Summary
  }
};

export const TI_KAKAO_CHANGES: PolicyChange[] = [
  {
    id: 'GCP-1-PLAN-001',
    prdId: 'GCP-1',
    date: '2026-07-14',
    prototypeVersion: 'v14-planned',
    view: 'items-form',
    targetId: 'gcp1-price-mapping',
    title: '굿닥 가격 옵션을 카카오 Price 설명으로 연결',
    before: '가격 숫자 필드가 없는 카카오 병원 API에서 가격 안내 방식이 명확하지 않았습니다.',
    after: '사용자에게는 Item 단계를 숨기고 기본 Item 아래 Price 설명에 굿닥 가격 문구를 연결합니다.',
    publicationStatus: 'planned'
  },
  {
    id: 'GCP-1-CHANGE-001',
    prdId: 'GCP-1',
    date: '2026-07-13',
    prototypeVersion: 'v1',
    view: 'items-list',
    targetId: 'gcp1-channel-overview',
    title: '진료항목 목록에서 채널 노출 상태 확인',
    before: '굿닥 진료항목의 노출 상태만 확인할 수 있었습니다.',
    after: '굿닥과 카카오톡 예약하기의 노출 상태를 채널 심볼로 함께 확인합니다.',
    publicationStatus: 'baseline'
  },
  {
    id: 'GCP-1-CHANGE-002',
    prdId: 'GCP-1',
    date: '2026-07-13',
    prototypeVersion: 'v1',
    view: 'items-form',
    targetId: 'gcp1-channel-visibility',
    title: '진료항목 상세에서 카카오 노출 관리',
    before: '카카오 연동 상품을 별도 화면에서 다시 관리하는 방식이 검토됐습니다.',
    after: '진료항목 상세에서 카카오 노출 여부와 카카오 전용 정보를 함께 관리합니다.',
    publicationStatus: 'baseline'
  },
  {
    id: 'GCP-1-CHANGE-003',
    prdId: 'GCP-1',
    date: '2026-07-13',
    prototypeVersion: 'v2',
    view: 'appt',
    targetId: 'gcp1-appointment-channel',
    title: '여러 채널의 예약 신청을 한 목록에서 관리',
    before: '외부 채널 예약과 굿닥 예약의 운영 화면이 분리될 수 있었습니다.',
    after: '동일한 예약 신청 내역에서 채널을 구분해 함께 확인하고 처리합니다.',
    publicationStatus: 'baseline'
  },
  {
    id: 'GCP-1-CHANGE-004',
    prdId: 'GCP-1',
    date: '2026-07-13',
    prototypeVersion: 'v3',
    view: 'settings',
    targetId: 'gcp1-operation-settings',
    title: '비급여 예약 운영 설정을 Connect에서 관리',
    before: '비급여 예약 운영 여부와 세부 조건을 한 흐름에서 확인하기 어려웠습니다.',
    after: '예약 운영 여부, 자동 확정, 당일 예약과 알림 설정을 Connect에서 함께 확인합니다.',
    publicationStatus: 'baseline'
  }
];
