import type { ChecklistKey } from "@/features/home/types"

export const HOME_QUERY_KEYS = {
  HOME: "creatorHome",
  LIVE: "creatorHomeLive",
  CALENDAR: "creatorHomeCalendar",
  HOLIDAYS: "businessHolidays",
  ACCOUNT_STATUS: "creatorAccountStatus",
  NOTIFICATION_SUMMARY: "creatorNotificationSummary",
  NOTIFICATION_LIST: "creatorNotificationList",
} as const

/** 종 배지 — 1017 설계서 1-0 ⑥ 「파트너 · 스튜디오는 인앱 알림함만 · 폴링은 FE(60초)」 */
export const NOTIFICATION_SUMMARY_POLL_INTERVAL = 60_000
/** 드롭다운 한 번에 — 서버 최대 50 · 보관 30일이라 한 페이지면 충분하다 */
export const NOTIFICATION_PAGE_SIZE = 50
/** 실시간 띠 갱신 — 시안 「n분 기준」 · 공구 관리와 같은 잠정 실적 */
export const LIVE_POLL_INTERVAL = 60_000
/** 계정 상태 — 모든 페이지 배너 · 탑바 칩. 정지는 운영자가 걸고 풀어 자주 바뀌지 않는다 */
export const ACCOUNT_STATUS_STALE_TIME = 60_000

/**
 * DEV 시나리오(`?mock=`) — 개발 서버에서만 쓴다.
 * - h1 기본(할 일 있음) · h2 할 일 없음 · h3 가입 직후 · h4 사업자 세금계산서 · h5 계정 이용 정지
 * - notif-empty 알림 없음(종 드롭다운만)
 */
export const HOME_MOCK_SCENARIOS = ["h1", "h2", "h3", "h4", "h5"] as const
export const NOTIFICATION_MOCK_SCENARIOS = [
  ...HOME_MOCK_SCENARIOS,
  "notif-empty",
] as const

/** 라우트 — 기본정보 관리(`/basic-info`)는 다른 작업이 붙이는 중이다(menu.ts path 미정) */
export const HOME_PATHS = {
  CONNECTION_REQUESTS: "/connections?tab=requests",
  thread: (threadId: number) => `/connections?threadId=${threadId}`,
  contract: (id: number) => `/contracts/${id}`,
  groupBuy: (id: number) => `/group-buy/${id}`,
  settlement: (id: number) => `/settlement/${id}`,
  SETTLEMENT_LIST: "/settlement",
  post: (id: number) => `/posts/${id}`,
  POST_LIST: "/posts",
  POST_NEW: "/posts/new",
  SHOWROOM: "/showroom",
  SHOWROOM_STATS_7D: "/showroom?tab=stats&period=DAYS_7",
  basicInfo: (tab?: "settlement" | "account") =>
    tab ? `/basic-info?tab=${tab}` : "/basic-info",
}

/** 시작 가이드 5단계(H3) — 시안 문구 그대로. 5단계 지급 문구는 기-10 「N영업일」 [정책값 미정] */
export const GUIDE_STEPS: Array<{
  title: string
  description: string
  who: string
  policyPending?: boolean
}> = [
  {
    title: "연결 요청 받기",
    description: "브랜드가 먼저 요청해요 · 수락하면 소통이 열려요",
    who: "나 · 수락 / 거절",
  },
  {
    title: "계약 서명",
    description: "브랜드가 보낸 조건을 확인하고 메일 · 문자 링크로 서명해요",
    who: "나 · 서명",
  },
  {
    title: "공구 게시물 작성",
    description: "제목과 본문만 쓰면 돼요 · 운영팀 승인 후 오픈",
    who: "나 · 작성",
  },
  {
    title: "공구 진행",
    description: "판매 · 배송 · 교환 · 반품은 브랜드가 처리해요",
    who: "브랜드",
  },
  {
    title: "정산 · 지급",
    description:
      "주문이 끝나면 3영업일 확인 → 자동 확정 → N영업일 후 SHOWROOMZ가 지급해요",
    who: "SHOWROOMZ",
    policyPending: true,
  },
]

/** 체크리스트 4개(H3) — 서버 key 순서(SETTLEMENT_INFO · PROFILE · FIRST_POST · SHOWROOM_LINK) */
export const CHECKLIST_COPY: Record<
  ChecklistKey,
  { title: string; description: string }
> = {
  SETTLEMENT_INFO: {
    title: "정산 정보 확인",
    description: "가입할 때 입력한 계좌 · 사업자 구분",
  },
  PROFILE: {
    title: "쇼룸 프로필 채우기",
    description: "쇼룸명 · 소개 · 프로필 사진",
  },
  FIRST_POST: {
    title: "첫 게시물 올리기",
    description:
      "쇼룸에 내 일상 · 추천을 먼저 보여주세요 · 브랜드가 연결 전에 참고해요",
  },
  SHOWROOM_LINK: {
    title: "쇼룸 링크를 인스타그램 프로필에 걸기",
    description: "소비자가 들어오는 기본 경로예요",
  },
}

/** 링크 복사 완료 — 서버가 판정할 수 없어(기기 동작) 이 브라우저에만 남긴다 */
export const SHOWROOM_LINK_COPIED_STORAGE_KEY = "studio.home.showroomLinkCopied"
