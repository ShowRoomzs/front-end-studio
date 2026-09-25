import type {
  ContractDeclineReason,
  CreatorContractListParams,
  CreatorContractSortType,
  CreatorContractTab,
} from "@/features/contracts/types"

/**
 * 상태 탭 5종(§27-1 #1) — 작성중 탭이 없다. 파트너의 「서명」 탭이 서명 진행중 + 체결 처리 대기
 * 묶음인 것과 달리 스튜디오는 둘이 쪼개져 각각 선다(시안 S1).
 */
export const CREATOR_CONTRACT_TABS: Array<{
  label: string
  value: CreatorContractTab
}> = [
  { label: "전체", value: "ALL" },
  { label: "서명 진행중", value: "SIGNING" },
  { label: "체결 처리 대기", value: "CONCLUSION_PENDING" },
  { label: "체결완료", value: "CONCLUDED" },
  { label: "종료", value: "CLOSED" },
]

export const CREATOR_CONTRACT_SORT_OPTIONS: Array<{
  label: string
  value: CreatorContractSortType
}> = [
  { label: "받은 순", value: "RECEIVED_DESC" },
  { label: "서명 기한순", value: "DEADLINE_ASC" },
  { label: "공구 시작일순", value: "START_AT_ASC" },
]

export const CREATOR_CONTRACT_PAGE_SIZES = [20, 50]

export const CREATOR_CONTRACT_INITIAL_PARAMS: CreatorContractListParams = {
  tab: "ALL",
  keyword: "",
  sort: "RECEIVED_DESC",
  page: 1,
  size: 20,
}

/** GNB 배지·탭 카운트 폴링(ms) — 배지가 가리키는 것이 기한 있는 내 조치라 놓치면 만료다 */
export const CREATOR_CONTRACT_SUMMARY_POLL_INTERVAL = 30_000
/** 서명 진행중 상세 폴링(ms) — 운영자가 손으로 옮겨 적는 값이라 실시간이 아니다 */
export const CREATOR_CONTRACT_DETAIL_POLL_INTERVAL = 30_000

export const CREATOR_CONTRACT_LIST_PATH = "/contracts"

/** 거절 사유 5종 — 서버 `ContractDeclineReason`과 1:1. 메모는 선택이다 */
export const DECLINE_REASONS: Array<{
  code: ContractDeclineReason
  label: string
}> = [
  { code: "CONDITION_RENEGOTIATION", label: "조건 재협의 필요" },
  { code: "SCHEDULE_MISMATCH", label: "일정이 맞지 않음" },
  { code: "NOT_FIT_SHOWROOM", label: "상품이 내 쇼룸과 맞지 않음" },
  { code: "CONTENT_BURDEN", label: "콘텐츠 의무가 과함" },
  { code: "ETC", label: "기타" },
]

/** 거절 메모 상한 — 서버 `@Size(max = 1000)` */
export const DECLINE_MEMO_MAX_LENGTH = 1000

/** 시안 `.sel-sm` — 목록 툴바 셀렉트는 채운 삼각형이다 */
export const SELECT_CHEVRON_STYLE = {
  backgroundImage:
    "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='9' height='5'><path d='M0 0L4.5 5L9 0Z' fill='%237B7F89'/></svg>\")",
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 8px center",
}

/** 시안 `.msel` — 모달 셀렉트는 선으로 그린 갈매기표다 */
export const FORM_SELECT_CHEVRON_STYLE = {
  backgroundImage:
    "url(\"data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6' fill='none'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%235B5F68' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")",
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 10px center",
}
