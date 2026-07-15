import type { PolicyChange, PolicySource } from '../../components/prototype/ChangeDrawer';
import gcp1Summary from '../../docs/policy-summaries/GCP-1.md';

export const POLICY_SOURCES: Record<string, PolicySource> = {
  'GCP-1': {
    prdId: 'GCP-1',
    title: '진료항목 카카오톡 예약하기 연동 구축',
    version: '2.3-review',
    sourceStatus: 'review',
    targetReleaseAt: null,
    sourcePath: '3-미션·기획/1-PRD/2026-07-13-진료항목-카카오톡-예약하기-연동-구축.md',
    summaryMarkdown: gcp1Summary
  }
};

export const TI_KAKAO_CHANGES: PolicyChange[] = [
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
    id: 'GCP-1-CHANGE-006',
    prdId: 'GCP-1',
    date: '2026-07-15',
    prototypeVersion: 'v5',
    view: 'items-list',
    targetId: 'gcp1-channel-overview',
    title: '병원 연동 여부에 따라 카카오 채널 정보 노출',
    before: '병원 연동 상태와 개별 진료항목의 카카오 노출 상태가 하나의 조건처럼 보일 수 있었습니다.',
    after: '병원 단위 카카오톡 예약하기 연동이 활성화된 병원에만 목록의 카카오 채널 심볼과 노출 정보를 표시합니다. 개별 진료항목의 카카오 연동 여부는 이 영역 자체의 노출 조건과 무관합니다.',
    publicationStatus: 'planned'
  },
  {
    id: 'GCP-1-CHANGE-007',
    prdId: 'GCP-1',
    date: '2026-07-15',
    prototypeVersion: 'v5',
    view: 'items-list',
    targetId: 'gcp1-channel-overview',
    title: '병원 연동과 상품별 노출 상태를 분리',
    before: '병원이 카카오에 연동되면 모든 진료항목이 카카오에도 노출 중인 것처럼 보일 수 있었습니다.',
    after: '병원 연동은 목록의 카카오 UI 노출 여부를 결정하고, 개별 진료항목의 굿닥·카카오 노출 값은 각 행의 활성·비활성 상태를 결정합니다. 카카오 최종 노출은 굿닥 노출과 항목별 카카오 노출이 모두 ON일 때만 성립합니다.',
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
    id: 'GCP-1-CHANGE-008',
    prdId: 'GCP-1',
    date: '2026-07-15',
    prototypeVersion: 'v5',
    view: 'items-form',
    targetId: 'gcp1-channel-visibility',
    title: '연동 병원에만 카카오 설정 영역 노출',
    before: '카카오 설정 영역이 어떤 병원에 표시되는지 노출 조건이 명확하지 않았습니다.',
    after: '병원 단위 카카오톡 예약하기 연동이 활성화된 경우에만 `카카오톡 예약하기에서도 보이기` 영역 전체를 표시합니다. 미연동 병원에는 영역을 표시하지 않으며, 개별 상품 연동 여부는 이 영역의 노출 조건과 무관합니다.',
    publicationStatus: 'planned'
  },
  {
    id: 'GCP-1-CHANGE-009',
    prdId: 'GCP-1',
    date: '2026-07-15',
    prototypeVersion: 'v5',
    view: 'items-form',
    targetId: 'gcp1-channel-visibility',
    title: '굿닥 노출을 카카오 상품 노출의 선행 조건으로 검증',
    before: '굿닥 노출과 카카오 상품 노출의 의존 관계를 화면에서 바로 확인하기 어려웠습니다.',
    after: '굿닥 노출이 OFF이면 카카오 토글을 비활성화하고 선행 조건 안내를 표시합니다. 카카오 ON 상태에서 굿닥을 OFF하면 카카오도 OFF 처리하며, 굿닥을 다시 ON해도 카카오는 자동으로 ON되지 않습니다.',
    publicationStatus: 'baseline'
  },
  {
    id: 'GCP-1-CHANGE-010',
    prdId: 'GCP-1',
    date: '2026-07-15',
    prototypeVersion: 'v5',
    view: 'items-form',
    targetId: 'gcp1-channel-visibility',
    title: '카카오 ON 시 전용 입력 필드를 즉시 노출',
    before: '카카오 전용 정보를 표시하기 위한 별도 단계가 필요한지 명확하지 않았습니다.',
    after: '카카오 노출을 ON하면 예약 추가 질문·이용 방법·유의사항·취소 유의사항 입력 필드를 별도 추가 토글 없이 즉시 표시합니다. OFF하면 입력 영역만 숨기고 저장된 카카오 전용 정보는 유지합니다.',
    publicationStatus: 'baseline'
  },
  {
    id: 'GCP-1-CHANGE-011',
    prdId: 'GCP-1',
    date: '2026-07-15',
    prototypeVersion: 'v5',
    view: 'items-form',
    targetId: 'gcp1-channel-visibility',
    title: '카카오 가격 표시 문구 생성 및 100자 검증',
    before: '굿닥 가격 옵션이 카카오 상품에 어떤 문자열로 전달되는지 확인하기 어려웠습니다.',
    after: '상담 후 결정은 금액을 생략하고, 할인가는 판매가만, 고정가는 고정 금액을 Price.description에 사용합니다. 가격과 설명이 모두 있으면 `가격 - 설명`으로 조합하며 최종 문구가 100자를 넘으면 저장과 동기화를 차단합니다.',
    publicationStatus: 'planned'
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
    after: '굿닥·카카오 예약을 동일한 목록에서 관리하며, `채널` 열은 `진료항목`과 `방문자` 사이에 표시합니다.',
    publicationStatus: 'baseline'
  },
  {
    id: 'GCP-1-CHANGE-012',
    prdId: 'GCP-1',
    date: '2026-07-15',
    prototypeVersion: 'v5',
    view: 'appt',
    targetId: 'gcp1-appointment-channel',
    title: '연동 병원의 예약 목록에만 채널 열 노출',
    before: '예약 목록의 채널 열이 어떤 조건에서 추가되는지 명확하지 않았습니다.',
    after: '병원 단위 카카오톡 예약하기 연동이 활성화된 경우에만 진료항목과 방문자 사이에 `채널` 열을 표시합니다. 개별 진료항목의 카카오 연동 여부는 이 채널 열의 노출 조건과 무관합니다.',
    publicationStatus: 'planned'
  },
  {
    id: 'GCP-1-CHANGE-013',
    prdId: 'GCP-1',
    date: '2026-07-15',
    prototypeVersion: 'v5',
    view: 'appt',
    targetId: 'gcp1-appointment-channel',
    title: '예약 유입 채널과 상품 연동 상태를 분리',
    before: '예약 채널을 현재 상품의 카카오 노출 상태로 판단하면 기존 예약의 유입 경로가 달라 보일 수 있었습니다.',
    after: '각 행의 채널은 예약이 실제 유입된 원천을 기준으로 표시합니다. 상품이 현재 카카오에 노출 중인지 여부로 기존 예약의 채널값이나 채널 표시를 변경하지 않습니다.',
    publicationStatus: 'baseline'
  },
  {
    id: 'GCP-1-CHANGE-005',
    prdId: 'GCP-1',
    date: '2026-07-14',
    prototypeVersion: 'v4',
    view: 'appt',
    targetId: 'gcp1-appointment-channel',
    title: '카카오 추가 질문·답변을 요청사항 하위에 표시',
    before: '요청사항과 카카오 추가 질문·답변이 서로 다른 영역에 표시됐습니다.',
    after: '카카오 예약이면서 추가 질문·답변 데이터가 있을 때만 예약 신청·내원 예정·지난 내역의 상세 요청사항 하위에 예약 당시 문구와 순서대로 읽기 전용으로 표시합니다. 데이터가 없으면 추가 영역 전체를 숨깁니다.',
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
  },
  {
    id: 'GCP-1-CHANGE-015',
    prdId: 'GCP-1',
    date: '2026-07-15',
    prototypeVersion: 'v5',
    view: 'settings',
    targetId: 'gcp1-operation-settings',
    title: '비급여 예약 중지 시 기존 데이터 유지',
    before: '예약을 중지하면 등록된 진료항목과 기존 예약에 미치는 영향을 확인하기 어려웠습니다.',
    after: '비급여 예약 받기를 OFF하면 확인 모달을 거쳐 채널과 무관하게 신규 예약 슬롯 제공을 중단합니다. 등록된 진료항목과 기존 예약은 삭제하지 않으며 이후 다시 예약을 시작할 수 있습니다.',
    publicationStatus: 'baseline'
  },
  {
    id: 'GCP-1-CHANGE-016',
    prdId: 'GCP-1',
    date: '2026-07-15',
    prototypeVersion: 'v5',
    view: 'settings',
    targetId: 'gcp1-operation-settings',
    title: '예약 세부 설정을 독립적으로 변경',
    before: '예약 운영 여부와 자동 확정·당일 예약·알림 설정의 관계가 명확하지 않았습니다.',
    after: '자동 확정, 당일 예약 허용, 새 예약 알림은 각각 독립적으로 변경합니다. 설정 변경이 실패하면 다른 설정에 영향을 주지 않고 해당 값을 변경 전 상태로 복구합니다.',
    publicationStatus: 'baseline'
  }
];
