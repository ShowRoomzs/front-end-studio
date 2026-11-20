import { DS_SELECT_CHEVRON_STYLE } from "@/common/styles/formControls"
import type {
  ContractDeclineReason,
  CreatorContractListParams,
  CreatorContractSortType,
  CreatorContractTab,
} from "@/features/contracts/types"

/**
 * 상태 탭 5종(§27-1 #1) — 작성중 탭이 없다. 파트너의 「서명」 탭이 서명 진행중 + 공구 생성 대기
 * 묶음인 것과 달리 스튜디오는 둘이 쪼개져 각각 선다(시안 S1). 해지(TERMINATED)는 「종료」 탭에
 * 들어간다 — 서버 `CreatorContractTab.CLOSED`가 거절 · 만료 · 취소 · 해지를 묶는다.
 */
export const CREATOR_CONTRACT_TABS: Array<{
  label: string
  value: CreatorContractTab
}> = [
  { label: "전체", value: "ALL" },
  { label: "서명 진행중", value: "SIGNING" },
  { label: "공구 생성 대기", value: "CONCLUSION_PENDING" },
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

/** 디자인 시스템 셀렉트 갈매기표 — 목록 툴바 · 모달 셀렉트가 같은 모양이다 */
export const SELECT_CHEVRON_STYLE = DS_SELECT_CHEVRON_STYLE
export const FORM_SELECT_CHEVRON_STYLE = DS_SELECT_CHEVRON_STYLE
