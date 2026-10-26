/*
  쇼룸 스튜디오 홈(ui-studio-14-home rev.4) · 탑바 알림 · 계정 상태 — 백엔드 `origin/main` DTO 그대로다.
  - `api/creator/home/dto/CreatorHomeDto.java`(1017 설계서 5절)
  - `api/common/notification/dto/NotificationItem.java` · `NotificationSummary.java`(1017 설계서 1-7)
  - `api/common/account/dto/MemberAccountStatusResponse.java`(1017 설계서 8-10)
  - `api/common/calendar/dto/HolidayItem.java`(1017 설계서 4-5)
  - `api/common/sanction/SanctionHoldView.java`

  시각은 두 종류다(공통 규칙 5절).
  - now()로 찍는 이벤트(`live.asOf` · 알림 `createdAt` · 정지 `suspendedAt`) — UTC 벽시계 → `parseServerDateTime`
  - 입력값 · 거기서 나온 기한(공구 시작/종료 · 서명 기한 · 오픈일 · 이의 신청 기한 · 자동 해제) — KST 벽시계 그대로
  - `LocalDate`(yyyy-MM-dd)는 시간대와 무관한 날짜
*/

// ------------------------------------------------------------------ 계정 상태(H5 정지 배너)

/** 정지 기간 · 이의 신청 기한(1021 기-02 【잠정】) — 기간 없는 정지면 endsOn · autoReleaseAt · periodDays 가 null */
export interface MemberSanctionTerm {
  /** 정지 종료일(포함) · LocalDate */
  endsOn: string | null
  /** 자동 해제 시각 = 종료일 다음 날 00:00 · KST 벽시계 */
  autoReleaseAt: string | null
  periodDays: number | null
  /** 통지 + N영업일 23:59:59 · KST 벽시계 */
  appealDeadlineAt: string | null
  /** 소명 검토 N영업일 — [정책값 미정]이면 null */
  appealReviewBusinessDays: number | null
}

export interface MemberAccountSanction {
  reason: string
  /** 배너 「사유: …」 */
  reasonLabel: string
  /** 운영자가 입력한 경우만 — [자세히]로 펼친다 */
  reasonDetail: string | null
  /** 정지 시각 · UTC 벽시계(now()) */
  suspendedAt: string
  /** 지급 정지 사유 — 배너에 정산 줄을 붙인다 */
  payoutHeld: boolean
  /** [운영팀에 소명하기] 목적지 */
  operatorChannelThreadId: number | null
  suspendCardMessageId: number | null
  term: MemberSanctionTerm | null
}

export interface MemberAccountStatus {
  /** ACTIVE · SUSPENDED · WITHDRAWN */
  status: string
  /** 열린 정지 — 정지가 아니면 null */
  sanction: MemberAccountSanction | null
  /** 탈퇴 신청 심사 중 */
  withdrawalPending: boolean
}

/** 정지 보류 보조 배지 — MINE(경고) · COUNTERPARTY(중립 · 「상대 브랜드 사정」) */
export interface SanctionHoldView {
  kind: "MINE" | "COUNTERPARTY" | "ADMIN"
  label: string
  tone: "WARNING" | "NEUTRAL"
  party: string | null
}

// ------------------------------------------------------------------ GET /v1/creator/home

export type ChecklistKey =
  "SETTLEMENT_INFO" | "PROFILE" | "FIRST_POST" | "SHOWROOM_LINK"

export interface HomeChecklistItem {
  key: ChecklistKey
  /** SHOWROOM_LINK 는 판정할 수 없어 null — FE 가 복사 뒤 로컬로 센다 */
  done: boolean | null
  /** SHOWROOM_LINK 만 */
  showroomUrl: string | null
}

/** 시작 가이드(H3) — 첫 연결 요청이 오면 visible = false(숨기기 버튼 없음) */
export interface HomeGuide {
  visible: boolean
  checklist: Array<HomeChecklistItem>
  /** 판정 가능한 3개 중 완료 수 — 링크 복사는 FE 가 더한다 */
  completed: number
  total: number
}

export type HomeTargetType =
  "SETTLEMENT" | "CONTRACT" | "GROUP_BUY" | "CONNECTION_REQUESTS"

export interface HomeTarget {
  type: HomeTargetType
  id: number | null
}

export type HomeTodoKind =
  | "TAX_INVOICE_ISSUE"
  | "CONTRACT_SIGN"
  | "EXTENSION_RESPOND"
  | "GROUP_BUY_POST_WRITE"
  | "GROUP_BUY_POST_RESUBMIT"
  | "GROUP_BUY_POST_HIDDEN_FIX"
  | "CONNECTION_REQUESTS"

/** 할 일 카드 한 장 — 정렬 · 문구 · 정지 중 막힘은 서버가 정한다 */
export interface HomeTodo {
  kind: HomeTodoKind
  /** 기한 · KST 벽시계 — 게시물 작성 · 재등록은 오픈일. 없으면 null */
  dueAt: string | null
  /** 기한 칩 문구 「서명 기한 10.24」 · 「오픈 10.28」 · 「지급 대기」 · 「보류 중」 */
  dueLabel: string | null
  title: string
  description: string
  actionLabel: string
  target: HomeTarget
  /** 정지 중 막힌 카드 — 버튼 비활성 + 이유 */
  blocked: { message: string } | null
  /**
   * 종류별 보조 값 — TAX_INVOICE_ISSUE: settlementId · groupBuyName · confirmedAt · amount · rejected /
   * CONTRACT_SIGN: brandSigned · brandName / EXTENSION_RESPOND: extensionDays · brandName · acceptBlocked ·
   * acceptBlockedMessage / CONNECTION_REQUESTS: count
   */
  extra: Record<string, unknown> | null
}

/** 다가오는 일정(H2) — 오픈 카드 문구는 postStatus 로 고른다 */
export interface HomeUpcoming {
  /** LocalDate */
  date: string
  title: string
  description: string
  target: HomeTarget
  kind: "GROUP_BUY_OPEN" | "GROUP_BUY_END"
  groupBuyStatus: string | null
  postStatus: string | null
}

export interface HomeReward {
  payoutScheduledAmount: number | null
  /** LocalDate */
  payoutScheduledDate: string | null
  /** `TAX_INVOICE_UNVERIFIED` — 「지급 조건 세금계산서 확인 후」 */
  payoutCondition: string | null
  /** 누적 수령(세후) */
  totalPaidNet: number | null
}

export interface HomeShowroom7d {
  visitors: number
  newFollowers: number
  /** % — 방문자 0 이면 null */
  conversionRate: number | null
}

export interface CreatorHome {
  account: MemberAccountStatus
  guide: HomeGuide
  /** 진행 중 공구 — 없으면 null(H3) */
  live: HomeLive | null
  todos: Array<HomeTodo>
  upcoming: Array<HomeUpcoming>
  reward: HomeReward
  showroom7d: HomeShowroom7d
}

// ------------------------------------------------------------------ GET /v1/creator/home/live

/** 진행 중 공구 실시간 띠 — 공구 관리 잠정 실적과 같은 정의(취소 · 반품 제외) */
export interface HomeLive {
  /** 집계 시각 · UTC 벽시계(now()) */
  asOf: string
  groupBuyId: number
  name: string
  brandName: string
  /** KST 벽시계 */
  startAt: string
  /** KST 벽시계 */
  endAt: string
  salesAmount: number
  salesAmountToday: number
  orders: number
  ordersToday: number
  /** 쇼룸 방문(횟수) — 공구 기간 */
  visits: number
  visitsToday: number
}

// ------------------------------------------------------------------ GET /v1/creator/home/calendar?month=

export interface HolidayItem {
  /** LocalDate */
  date: string
  name: string
}

export interface CalendarGroupBuy {
  groupBuyId: number
  name: string
  brandName: string
  /** KST 벽시계 */
  startAt: string
  /** KST 벽시계 — 조기 마감 · 중단이면 실제 종료 시각 */
  endAt: string
  status: "IN_PROGRESS" | "UPCOMING" | "ENDED"
  hold: SanctionHoldView | null
}

export interface CalendarDeadline {
  /** LocalDate */
  date: string
  kind: "SIGN_DUE" | "EXTENSION_RESPOND_DUE"
  label: string
  targetType: "CONTRACT" | "GROUP_BUY"
  targetId: number
}

export interface HomeCalendar {
  /** yyyy-MM */
  month: string
  /** 요청 월 1일 − 7일 · LocalDate */
  from: string
  /** 요청 월 말일 + 7일(포함) · LocalDate */
  to: string
  holidays: Array<HolidayItem>
  groupBuys: Array<CalendarGroupBuy>
  deadlines: Array<CalendarDeadline>
}

// ------------------------------------------------------------------ 알림(H1a)

export type NotificationTargetType =
  | "ORDER_GROUP"
  | "CLAIM"
  | "INQUIRY"
  | "POST"
  | "SHOWROOM"
  | "GROUP_BUY"
  | "CONTRACT"
  | "SETTLEMENT"
  | "ADJUSTMENT"
  | "THREAD"
  | "PRODUCT"
  | "BASIC_INFO_TAB"
  | "CONNECTION_REQUESTS"
  | "TERMS"
  | "SETTINGS"
  | "ACCOUNT_STATUS"

export interface NotificationTarget {
  type: NotificationTargetType | null
  id: number | null
  /** 기본정보 탭 키(ACCOUNT · SETTLEMENT) · 스레드 메시지 id 등 */
  sub: string | null
}

export interface NotificationItem {
  notificationId: number
  type: string
  /** 분류 태그 — 계약 · 공구 · 연결 · 정산 … */
  category: string
  actorType:
    "OPERATOR" | "BRAND" | "CREATOR" | "SYSTEM" | "PLATFORM" | "SHOWROOM"
  /** 「운영팀」 · 상대 이름 · 「시스템」 · 「SHOWROOMZ」 */
  actorLabel: string
  title: string
  body: string | null
  /** 굵게 표시할 부분 문자열 */
  emphasis: string | null
  target: NotificationTarget | null
  imageKind: string | null
  imageUrl: string | null
  liveGroupBuy: boolean
  advertising: boolean
  /** KST 벽시계 */
  todoDueAt: string | null
  read: boolean
  /** UTC 벽시계(now()) */
  createdAt: string
}

export interface NotificationSummary {
  unreadCount: number
}
