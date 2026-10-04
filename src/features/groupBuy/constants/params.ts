import type {
  CreatorGroupBuyListParams,
  CreatorGroupBuySortType,
  CreatorGroupBuyTab,
  CreatorSuspensionReason,
  ExtensionRejectReason,
} from "@/features/groupBuy/types"

export const GROUP_BUY_LIST_PATH = "/group-buy"

export const GROUP_BUY_QUERY_KEYS = {
  LIST: "creatorGroupBuyList",
  SUMMARY: "creatorGroupBuySummary",
  DETAIL: "creatorGroupBuyDetail",
} as const

/**
 * 시안 A1 상태 탭 5종 — 파트너와 달리 「중단」 탭이 없고 「종료·정산」에 함께 든다.
 * 서버도 같은 5탭이다 — ENDED가 정산완료·중단까지 묶는다.
 * 중단 예정은 탭이 아니라 진행중 탭 안의 배지로만 나타난다.
 */
export const GROUP_BUY_TABS: Array<{
  label: string
  value: CreatorGroupBuyTab
}> = [
  { label: "전체", value: "ALL" },
  { label: "준비중", value: "PREPARING" },
  { label: "준비완료", value: "READY" },
  { label: "진행중", value: "IN_PROGRESS" },
  { label: "종료·정산", value: "ENDED" },
]

export const GROUP_BUY_SORT_OPTIONS: Array<{
  label: string
  value: CreatorGroupBuySortType
}> = [
  { label: "시작일 빠른순", value: "START_AT_ASC" },
  { label: "내 조치 필요 먼저", value: "ACTION_REQUIRED_FIRST" },
]

export const GROUP_BUY_PAGE_SIZES = [20, 50]

export const GROUP_BUY_INITIAL_PARAMS: CreatorGroupBuyListParams = {
  tab: "ALL",
  keyword: "",
  sort: "START_AT_ASC",
  page: 1,
  size: 20,
}

/** GNB 배지·탭 카운트 폴링 간격 — 계약 관리와 같은 주기 */
export const GROUP_BUY_SUMMARY_POLL_INTERVAL = 30_000

/** 게시물 입력 한도 — 서버 검증과 같다 */
export const POST_TITLE_MAX = 40
export const POST_CONTENT_MAX = 2000

/** 시안 C2 연장 거절 사유 — 서버 ExtensionRejectReason */
export const EXTENSION_REJECT_OPTIONS: Array<{
  label: string
  value: ExtensionRejectReason
}> = [
  { label: "다음 일정이 잡혀 있음", value: "NEXT_SCHEDULE_BOOKED" },
  { label: "콘텐츠 계획과 맞지 않음", value: "CONTENT_PLAN_MISMATCH" },
  { label: "조건 재협의 필요", value: "TERMS_RENEGOTIATION" },
  { label: "기타(직접 입력)", value: "ETC" },
]

/** 시안 C7 중단 사유 — 서버 CreatorSuspensionReason */
export const SUSPENSION_REASON_OPTIONS: Array<{
  label: string
  value: CreatorSuspensionReason
}> = [
  {
    label: "상품에 문제가 있어 추천을 이어갈 수 없음",
    value: "PRODUCT_DEFECT",
  },
  { label: "배송 지연 · 미발송이 계속됨", value: "DELIVERY_FAILURE" },
  { label: "소비자 불만이 반복적으로 접수됨", value: "CONSUMER_COMPLAINTS" },
  { label: "브랜드와 연락이 되지 않음", value: "BRAND_UNREACHABLE" },
  { label: "개인 사정으로 진행이 어려움", value: "PERSONAL_REASON" },
  { label: "기타(직접 입력)", value: "ETC" },
]

/** 제17조① 호수 — 시안 B13 「중단 사유」 */
export const SUSPENSION_CLAUSE_TEXT: Record<string, string> = {
  ART17_1_LAW:
    "관련 법령 위반 또는 위반 우려가 명백한 경우(화장품법 · 표시광고법 · 전자상거래법)",
  ART17_2_IP_DEFECT: "지식재산권 침해 또는 상품의 중대한 하자·위해성",
  ART17_3_BREACH: "게시물 무단 변경 · 공급불능 · 중대 의무 불이행",
  ART17_4_DISPUTE: "분쟁 심화로 거래 이행 불가 · 플랫폼 신용·명예 훼손",
}

export const EMERGENCY_REASON_LABEL: Record<string, string> = {
  CONSUMER_HARM: "소비자 위해 방지",
  AUTHORITY_ORDER: "행정·사법기관의 명령",
  DAMAGE_SURGE: "피해 급증 우려",
}

/** 반려·숨김 사유 코드 — 운영자 설명이 없을 때만 쓴다 */
export const POST_REASON_LABEL: Record<string, string> = {
  AD_EFFECT_ASSERTION: "표시광고법 위반 문구 — 효과 단정",
  AD_MEDICAL_CLAIM: "표시광고법 위반 문구 — 의료적 효능 표현",
  AD_SUPERLATIVE: "표시광고법 위반 문구 — 최저가·최상급 표현",
  CONTRACT_PRODUCT_MISMATCH: "계약과 다른 상품 구성",
  CONTRACT_PRICE_MISMATCH: "계약과 다른 가격 표기",
  CONTRACT_MISMATCH: "계약과 다른 상품·가격 기재",
  DISCLOSURE_DAMAGED: "대가관계 표시 훼손",
  FALSE_INFORMATION: "사실과 다른 정보",
  ETC: "기타",
}
