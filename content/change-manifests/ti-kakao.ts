import type { PolicyChange, PolicySource } from '../../components/prototype/ChangeDrawer';
import gcp1Summary from '../../docs/policy-summaries/GCP-1.md';

export const POLICY_SOURCES: Record<string, PolicySource> = {
  'GCP-1': {
    prdId: 'GCP-1',
    title: '진료항목 카카오톡 예약하기 연동 구축',
    version: '2.5-final-review',
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
    publicationStatus: 'baseline'
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
    after: '병원 연동은 목록의 카카오 UI 노출 여부를 결정합니다. 실제 카카오 예약 가능 상태는 병원 예약 운영, 굿닥·카카오 상품별 노출 의도, 가격 유효성, 외부 동기화 성공을 모두 충족할 때만 성립합니다.',
    publicationStatus: 'baseline'
  },
  {
    id: 'GCP-1-CHANGE-017',
    prdId: 'GCP-1',
    date: '2026-07-15',
    prototypeVersion: 'v24',
    view: 'items-list',
    targetId: 'gcp1-channel-overview',
    title: '상품별 외부 반영 상태와 재시도 정책',
    before: '병원이 설정한 노출 값과 외부 채널에 실제 반영된 상태를 구분하기 어려웠습니다.',
    after: '미연동·반영 중·노출 중·노출 보류·반영 실패·업데이트 필요를 내부 상태로 구분하고 실패 작업만 안전하게 재처리합니다. 병원 전체 예약을 중지해도 상품별 노출 의도와 전용정보는 유지합니다.',
    developerNotes: [
      '병원 단위 `hospitalLinked`는 카카오 UI 사용 자격만 결정합니다. 실제 예약 가능 여부는 `apptUsed && gdVisible && kakaoOn && sync=SYNCED`와 가격 유효성을 함께 평가합니다.',
      '개별 굿닥 노출 OFF는 `kakaoOn` 의도도 OFF로 바꾸지만, 병원 전체 `apptUsed=false`는 상품별 의도를 보존하고 Product·Schedule만 `ON_HOLD`로 전환합니다.',
      '목록 상태는 채널 노출 의도와 객체별 외부 상태를 합성합니다. 재시도는 `FAILED`·`UPDATE_REQUIRED` 객체만 `PENDING`으로 바꿔 중복 Product 생성을 방지합니다.',
      '상태 선택기·강제 실패 버튼·객체별 기술 상태표는 병원 제품 화면에 추가하지 않습니다.'
    ],
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
    publicationStatus: 'baseline'
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
    after: '카카오 노출을 최초 ON하면 공통정보로 전용 필드를 채우고 즉시 표시합니다. 이후 공통정보 변경으로 자동 덮어쓰지 않으며, OFF하면 입력 영역만 숨기고 저장된 값은 유지합니다. 실제 외부 반영은 상세 저장 시 시작합니다.',
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
    publicationStatus: 'baseline'
  },
  {
    id: 'GCP-1-CHANGE-021',
    prdId: 'GCP-1',
    date: '2026-07-15',
    prototypeVersion: 'v27',
    view: 'items-form',
    targetId: 'gcp1-channel-visibility',
    title: '카카오 가격 선택 방식을 SELECT로 단일화',
    before: '가격 옵션이 1개와 복수 사이에서 바뀌면 불변 필드인 priceDisplayType도 달라져 Product 교체가 필요했습니다.',
    after: '신규 GCP-1 Product는 가격 옵션 수와 관계없이 항상 SELECT로 생성합니다. 활성 Price 1~50개를 허용하며 1↔N 변경은 Product를 유지하고 Price만 증감합니다. 활성 Price가 0개면 카카오 노출을 차단합니다.',
    developerNotes: [
      '신규 GCP-1 Product 생성 payload의 `priceDisplayType`은 항상 `SELECT`로 고정합니다. 가격 옵션 개수로 `NOT_DISPLAY`를 선택하지 않습니다.',
      '1↔N 변경은 Product 재생성이 아니라 Price add/update/ON_HOLD diff로 처리하고 기존 Product ID와 `vendorProductId`를 유지합니다.',
      '단일 Price 예약에서도 `vendorItemPriceId`가 굿닥 가격 옵션으로 매핑돼야 합니다. `SELECT+Price 1개` E2E는 출시 게이트입니다.',
      '활성 Price가 0개면 카카오 ON 또는 `ON_SALE` 전환을 차단합니다. 기존 GCP-1 `NOT_DISPLAY` Product는 별도 이행 대상으로 식별합니다.'
    ],
    publicationStatus: 'baseline'
  },
  {
    id: 'GCP-1-CHANGE-018',
    prdId: 'GCP-1',
    date: '2026-07-15',
    prototypeVersion: 'v24',
    view: 'items-form',
    targetId: 'gcp1-channel-visibility',
    title: '카카오 전용정보와 객체별 동기화 정책',
    before: '카카오 전용 필드와 Product·Item·Price·Schedule의 반영 결과를 한 화면에서 확인할 수 없었습니다.',
    after: '검색 키워드·정사각 이미지·상세 이미지·이용 방법·유의사항·방문 안내·취소 유의사항은 병원 화면에서 관리합니다. 카카오 상품명·설명·대표 이미지는 공통 진료항목 정보를 사용하며 별도 입력하지 않습니다. Product·Item·Price·Schedule 동기화와 실패 재처리는 내부적으로 분리하며, 활성 예약이 있는 상품은 삭제 대신 운영 중지합니다.',
    developerNotes: [
      '병원 단위 `hospitalLinked`가 카카오 설정 영역 전체의 노출 여부를 결정합니다. 연동 병원 안에서 `gdVisible`은 토글 활성 조건, `kakaoOn`은 전용 입력 필드 노출 조건입니다.',
      '사용자 화면에는 Item 입력·선택 단계를 두지 않습니다. 연동 어댑터가 카카오 `Product > Item > Price` 경로를 위해 Product별 DEFAULT 기술 Item 한 개를 생성합니다.',
      '굿닥 가격 옵션 각각을 카카오 `Price`로 전송하고, 금액은 `Price.description` 문자열에 포함합니다. 상담 후 결정은 금액을 생략하고 할인가에는 판매가만, 고정가에는 고정 금액만 사용합니다.',
      '금액과 가격 설명이 모두 있으면 ` - `로 결합합니다. 카카오 노출 ON 즉시 V1 전용 필드를 렌더링하며 별도 추가 입력 토글은 두지 않습니다.',
      '카카오 상품명·설명·대표 이미지는 공통 진료항목 master와 이미지 fallback을 사용하고 병원 화면에 별도 input을 노출하지 않습니다. 가격 안내는 기존 굿닥 가격 옵션 입력 영역에서 관리합니다.',
      '예약 부가정보 질문 정의는 V1 병원 상품 입력에서 제외합니다. 외부 예약에서 수신한 질문·답변은 예약 시점 snapshot으로만 저장·조회합니다.'
    ],
    publicationStatus: 'baseline'
  },
  {
    id: 'GCP-1-CHANGE-022',
    prdId: 'GCP-1',
    date: '2026-07-16',
    prototypeVersion: 'v29',
    view: 'items-form',
    targetId: 'gcp1-kakao-product-copy',
    title: '카카오 상품명·설명은 공통 정보 사용',
    before: '카카오 상품명·설명을 굿닥 진료항목과 별도로 입력하면 동일 정보의 중복 관리가 필요했습니다.',
    after: '카카오 상품명·설명은 공통 진료항목 정보로 생성하므로 병원 화면에 별도 입력 필드를 제공하지 않습니다. 검색 키워드만 쉼표로 구분해 입력합니다. 판매기간·강제 품절·상품 노출순서·예약 부가정보 편집은 V1 병원 화면에 제공하지 않습니다.',
    developerNotes: [
      '`storeId`와 `vendorProductId`는 병원-장소·진료항목 매핑에서 서버가 채우는 식별자이며 병원 입력 필드로 노출하지 않습니다. `vendorProductId`는 등록 후 수정하지 않습니다.',
      '최종 payload의 `name`은 공통 진료항목 노출명을 사용해 50자 이하로 검증하고, `description`은 공통 상세 정보를 사용해 1,000자 이하로 변환합니다. 별도 카카오 전용 수정값은 저장하지 않습니다.',
      'V1 payload·DB·병원 화면에서 판매 시작/종료 일시, `forceSoldOut`, 상품 `sequence`를 편집 범위로 다루지 않습니다. 상품 상태는 카카오 노출 의도와 연동 결과를 조합해 `ON_SALE/ON_HOLD`로 계산합니다.',
      '내부 도구의 예약 부가정보 정의는 이번 병원 상품 편집 범위에서 제외합니다. 다만 카카오 예약 payload로 수신한 추가 질문·답변 snapshot의 예약 상세 표시는 별도 요구사항으로 유지합니다.'
    ],
    publicationStatus: 'baseline'
  },
  {
    id: 'GCP-1-CHANGE-023',
    prdId: 'GCP-1',
    date: '2026-07-16',
    prototypeVersion: 'v29',
    view: 'items-form',
    targetId: 'gcp1-kakao-product-images',
    title: '카카오 이미지 입력 범위',
    before: '카카오 대표 이미지를 굿닥 진료항목과 별도로 입력하면 동일 이미지의 중복 관리가 필요했습니다.',
    after: '카카오 대표 이미지는 공통 진료항목 이미지를 사용하므로 병원 화면에 별도 입력 필드를 제공하지 않습니다. 목록용 정사각 이미지와 상세 이미지만 카카오 전용 정보로 입력합니다.',
    developerNotes: [
      'Product `images[]`는 공통 진료항목 이미지에서 생성하고, `descriptionImages[]`는 병원 화면의 상세 이미지 입력값을 사용합니다. 상세 이미지는 최대 50개이며 배열 순서를 외부 이미지 `sequence`로 변환합니다. 이는 V1 제외인 상품 자체 노출순서와 다른 값입니다.',
      '업로드 파일은 굿닥 CDN의 만료되지 않는 HTTPS URL로 변환한 뒤 외부 payload에 사용합니다. 저장 전 파일 형식·크기·이미지 접근 가능 여부를 서버에서도 재검증합니다.',
      '`squareImage`는 목록 썸네일용 단일 이미지이며 800×800px을 권장합니다. 상세 이미지는 가로 800px, 세로 15,000px 이하 규격을 안내합니다.',
      '공통 진료항목 이미지가 비어 있으면 카카오 장소 이미지 fallback을 사용합니다. 이미지 삭제·순서 변경 실패는 공통 상품 저장을 롤백하지 않고 Product 동기화 실패로 분리합니다.'
    ],
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
    publicationStatus: 'baseline'
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
    id: 'GCP-1-CHANGE-019',
    prdId: 'GCP-1',
    date: '2026-07-15',
    prototypeVersion: 'v24',
    view: 'appt',
    targetId: 'gcp1-appointment-channel',
    title: '예약 당시 정보와 외부 상태 반영 결과 보존',
    before: '상품의 현재 정보와 예약 당시 정보, 외부 상태 반영 결과를 구분하기 어려웠습니다.',
    after: '예약 당시 상품명·채널 노출명·가격 옵션·자동 확정 설정을 snapshot으로 유지합니다. 확정·취소·진료 완료의 외부 반영과 실패 재처리는 예약 처리와 분리해 수행하며 내부 식별자와 진단 정보는 병원 화면에 노출하지 않습니다.',
    developerNotes: [
      '병원 단위 `hospitalLinked`가 채널 열의 노출 여부를 결정합니다. 개별 상품의 `kakaoOn`은 예약 목록 채널 UI의 노출 조건으로 사용하지 않습니다.',
      '각 예약은 목록 응답의 `channel`과 예약 생성 당시 상품명·가격 옵션·자동 확정 설정 snapshot을 사용합니다. 현재 상품 설정으로 과거 예약을 덮어쓰지 않습니다.',
      '굿닥 상태 변경은 즉시 저장하고 외부 상태 반영은 별도 비동기 작업으로 처리합니다. 병원 화면에는 간단한 실패 안내만 제공하고 외부 ID·요청 응답 등 상세 관제 정보는 운영 도구에서 관리합니다.'
    ],
    publicationStatus: 'baseline'
  },
  {
    id: 'GCP-1-CHANGE-005',
    prdId: 'GCP-1',
    date: '2026-07-14',
    prototypeVersion: 'v4',
    view: 'appt',
    targetId: 'gcp1-appointment-additional-answers',
    title: '카카오 추가 질문·답변을 요청사항 하위에 표시',
    before: '요청사항과 카카오 추가 질문·답변이 서로 다른 영역에 표시됐습니다.',
    after: '카카오 예약이면서 추가 질문·답변 데이터가 있을 때만 예약 신청·내원 예정·지난 내역의 상세 요청사항 하위에 예약 당시 문구와 순서대로 읽기 전용으로 표시합니다. 데이터가 없으면 추가 영역 전체를 숨깁니다.',
    developerNotes: [
      '예약자와 실제 방문자는 별도 객체로 유지합니다. 추가 질문의 문구·답변·순서는 예약 생성 당시 snapshot으로 보존하고 현재 질문 정의로 다시 계산하지 않습니다.'
    ],
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
    after: '비급여 예약 받기를 OFF하면 굿닥 신규 예약을 즉시 차단하고 카카오 Product·향후 Schedule을 노출 보류로 전환합니다. 상품별 노출 의도·외부 ID·전용정보·기존 예약은 보존하고, 다시 ON하면 유효한 상품만 외부 반영 성공 후 복원합니다.',
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
  },
  {
    id: 'GCP-1-CHANGE-020',
    prdId: 'GCP-1',
    date: '2026-07-15',
    prototypeVersion: 'v24',
    view: 'settings',
    targetId: 'gcp1-operation-settings',
    title: '운영 설정을 모든 예약 채널에 공통 적용',
    before: '자동 확정·당일 예약·신규 예약 알림이 외부 채널 예약에도 적용되는지 확인하기 어려웠습니다.',
    after: '자동 확정은 이후 생성 예약에 snapshot으로 적용하고, 당일 예약 설정은 미래 일정에 반영합니다. 굿닥·카카오 신규 예약은 같은 알림 설정을 사용하며 예약당 한 번만 알립니다. 설정 버전과 외부 적용 버전은 내부적으로 분리해 실패 시 해당 설정만 원복·재시도합니다.',
    developerNotes: [
      '`apptUsed=false`이면 채널과 무관하게 신규 비급여 예약을 차단하지만 상품별 노출 의도·외부 매핑·기존 예약은 유지합니다.',
      '자동 확정·당일 예약·새 예약 알림 설정은 각각 독립 mutation으로 저장합니다. 외부 반영 실패가 공통 설정 저장을 되돌리지 않도록 설정 저장 결과와 채널 적용 결과를 분리합니다.',
      '진료시간 저장 트랜잭션에서 카카오 API를 직접 호출하지 않습니다. 중앙 변경 이벤트와 버전을 기록하고 worker가 최초 30일·일일 하루 추가·영향 날짜 diff를 멱등 처리합니다.',
      '운영시간 축소가 기존 예약과 충돌해도 자동 취소하지 않습니다. 신규 슬롯만 차단하고 충돌 예약은 병원·Ops 확인 대상으로 남깁니다.',
      '카카오 신규 예약도 병원 `newApptNotified` 설정을 사용해 예약당 한 번만 Windows OS 푸시 알림을 발행합니다.'
    ],
    publicationStatus: 'baseline'
  }
];
