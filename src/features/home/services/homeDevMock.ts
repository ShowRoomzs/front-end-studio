/*
  DEV 전용 — 개발 서버에 홈 · 알림 · 계정 상태 · 공휴일 API가 아직 배포되지 않아(404) 시안 상태를 확인하려고 쓴다.
  서비스 함수가 `import.meta.env.DEV` 가드 뒤에서 동적 import 로만 부르므로 배포 번들에 들어가지 않는다.

  값은 시안 ui-studio-14-home rev.4(08.20 장면)의 이름 · 숫자를 **오늘 기준 상대 날짜**로 옮겼다.
  모양은 `CreatorHomeDto`(origin/main) 그대로 — 서버 문구(title · description · actionLabel · blocked)도 서버가 만드는 문장을 흉내 냈다.

  `?mock=h1 | h2 | h3 | h4 | h5 | notif-empty`
*/
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import { mockDelay } from "@/common/utils/devMock"
import { kstDateKey } from "@/features/home/utils/date"
import type {
  CreatorHome,
  HolidayItem,
  HomeCalendar,
  HomeLive,
  HomeTodo,
  HomeUpcoming,
  MemberAccountStatus,
  NotificationItem,
  NotificationSummary,
} from "@/features/home/types"
import type { PageResponse } from "@/common/types/page"

dayjs.extend(utc)

type Scenario = string | null

const today = () => dayjs(kstDateKey(Date.now()))
/** 오늘 + n일 "YYYY-MM-DD" */
const day = (offset: number) => today().add(offset, "day").format("YYYY-MM-DD")
/** 오늘 + n일 KST 벽시계 */
const kst = (offset: number, time: string) => `${day(offset)}T${time}`
const md = (offset: number) => today().add(offset, "day").format("MM.DD")
/** n분 전 UTC 벽시계(now() 이벤트) */
const utcAgo = (minutes: number) =>
  dayjs.utc().subtract(minutes, "minute").format("YYYY-MM-DDTHH:mm:ss")

const scene = (scenario: Scenario) => scenario ?? "h1"

// ------------------------------------------------------------------ 계정 상태

const ACTIVE: MemberAccountStatus = {
  status: "ACTIVE",
  sanction: null,
  withdrawalPending: false,
}

function suspended(): MemberAccountStatus {
  return {
    status: "SUSPENDED",
    sanction: {
      reason: "AD_LAW_VIOLATION_REPEATED",
      reasonLabel: "공구 게시물 허위·과장 표시",
      reasonDetail:
        "공구 게시물에 근거 없는 효능 표현(「3일 만에 주름 개선」)이 반복해서 확인됐습니다.",
      suspendedAt: dayjs
        .utc(`${day(-12)}T05:20:00`)
        .format("YYYY-MM-DDTHH:mm:ss"),
      payoutHeld: false,
      operatorChannelThreadId: 44,
      suspendCardMessageId: 1203,
      term: {
        endsOn: day(2),
        autoReleaseAt: kst(3, "00:00:00"),
        periodDays: 15,
        appealDeadlineAt: kst(-9, "23:59:59"),
        appealReviewBusinessDays: null,
      },
    },
    withdrawalPending: false,
  }
}

export function mockAccountStatus(scenario: Scenario) {
  return mockDelay(scene(scenario) === "h5" ? suspended() : ACTIVE)
}

// ------------------------------------------------------------------ 실시간 띠

function live(scenario: string): HomeLive | null {
  if (scenario === "h3") {
    return null
  }
  if (scenario === "h4") {
    return {
      asOf: utcAgo(1),
      groupBuyId: 502,
      name: "여름 수분 세럼 공구",
      brandName: "○○ 브랜드",
      startAt: kst(-7, "10:00:00"),
      endAt: kst(0, "23:59:59"),
      salesAmount: 10_840_000,
      salesAmountToday: 1_212_000,
      orders: 301,
      ordersToday: 34,
      visits: 4860,
      visitsToday: 612,
    }
  }
  return {
    asOf: utcAgo(1),
    groupBuyId: 501,
    name: "글로우 크림 앵콜 공구",
    brandName: "△△ 코스메틱",
    startAt: kst(-6, "10:00:00"),
    endAt: kst(1, "23:59:59"),
    salesAmount: 2_184_000,
    salesAmountToday: 336_000,
    orders: 78,
    ordersToday: 12,
    visits: 3420,
    visitsToday: 418,
  }
}

export function mockLive(scenario: Scenario) {
  return mockDelay(live(scene(scenario)))
}

// ------------------------------------------------------------------ 할 일

function contractSign(): HomeTodo {
  return {
    kind: "CONTRACT_SIGN",
    dueAt: kst(1, "23:59:59"),
    dueLabel: `서명 기한 ${md(1)}`,
    title: "계약 서명 · 밤 리페어 크림 공구",
    description:
      "○○ 브랜드가 서명했어요 · 메일 · 문자로 받은 링크에서 서명해 주세요",
    actionLabel: "계약 보기",
    target: { type: "CONTRACT", id: 77 },
    blocked: null,
    extra: { brandSigned: true, brandName: "○○ 브랜드" },
  }
}

function extensionRespond(suspendedNow: boolean): HomeTodo {
  return {
    kind: "EXTENSION_RESPOND",
    dueAt: kst(1, "23:59:59"),
    dueLabel: `응답 기한 ${md(1)}`,
    title: "연장 요청 응답 · 글로우 크림 앵콜 공구",
    description:
      "△△ 코스메틱 브랜드가 7일 연장을 요청했어요 · 공구 종료 전에 응답해 주세요",
    actionLabel: "응답하기",
    target: { type: "GROUP_BUY", id: 501 },
    blocked: null,
    extra: {
      extensionDays: 7,
      brandName: "△△ 코스메틱",
      acceptBlocked: suspendedNow,
      ...(suspendedNow && {
        acceptBlockedMessage: "연장 수락은 정지 해제 후 할 수 있어요",
      }),
    },
  }
}

function postWrite(suspendedNow: boolean): HomeTodo {
  return {
    kind: "GROUP_BUY_POST_WRITE",
    dueAt: kst(4, "10:00:00"),
    dueLabel: `오픈 ${md(4)}`,
    title: "공구 게시물 작성 · 여름 수분 세럼 공구",
    description: "오픈 전에 게시물을 등록하면 운영팀 검토 후 공개돼요",
    actionLabel: "작성하기",
    target: { type: "GROUP_BUY", id: 502 },
    blocked: suspendedNow ? { message: "정지 해제 후 등록할 수 있어요" } : null,
    extra: null,
  }
}

function postResubmit(suspendedNow: boolean, offset: number): HomeTodo {
  return {
    kind: "GROUP_BUY_POST_RESUBMIT",
    dueAt: kst(offset, "10:00:00"),
    dueLabel: `오픈 ${md(offset)}`,
    title: "게시물 재등록 · 수분 토너 대용량 공구",
    description:
      "운영팀이 게시물을 반려했어요 · 사유를 확인하고 다시 등록해 주세요",
    actionLabel: "수정하기",
    target: { type: "GROUP_BUY", id: 503 },
    blocked: suspendedNow
      ? { message: "정지 해제 후 재등록할 수 있어요" }
      : null,
    extra: null,
  }
}

function connectionRequests(suspendedNow: boolean): HomeTodo {
  return {
    kind: "CONNECTION_REQUESTS",
    dueAt: null,
    dueLabel: null,
    title: "연결 요청 · 모이스처하우스 · 퓨어랩",
    description: "브랜드가 연결을 요청했어요 · 수락하면 계약을 받을 수 있어요",
    actionLabel: "요청 보기",
    target: { type: "CONNECTION_REQUESTS", id: null },
    blocked: suspendedNow
      ? { message: "연결 수락은 정지 해제 후 할 수 있어요" }
      : null,
    extra: { count: 2 },
  }
}

function taxInvoice(): HomeTodo {
  return {
    kind: "TAX_INVOICE_ISSUE",
    dueAt: null,
    dueLabel: "지급 대기",
    title: "세금계산서 발행 · 데일리 선크림 공구",
    description: `${md(-3)} 정산 자동 확정 · 세금계산서를 발행하고 승인번호를 입력하면 지급돼요`,
    actionLabel: "승인번호 입력",
    target: { type: "SETTLEMENT", id: 41 },
    blocked: null,
    extra: {
      settlementId: 41,
      groupBuyName: "데일리 선크림 공구",
      confirmedAt: kst(-3, "00:00:00"),
      amount: 602_800,
      rejected: false,
    },
  }
}

function todos(scenario: string): Array<HomeTodo> {
  switch (scenario) {
    case "h2":
    case "h3":
      return []
    case "h4":
      return [taxInvoice(), postResubmit(false, 1), connectionRequests(false)]
    case "h5":
      return [
        contractSign(),
        extensionRespond(true),
        postWrite(true),
        postResubmit(true, 12),
        connectionRequests(true),
      ]
    default:
      return [
        contractSign(),
        extensionRespond(false),
        postWrite(false),
        postResubmit(false, 12),
        connectionRequests(false),
      ]
  }
}

function upcoming(scenario: string): Array<HomeUpcoming> {
  if (scenario === "h3") {
    return []
  }
  return [
    {
      date: day(1),
      title: "공구 종료 · 글로우 크림 앵콜 공구",
      description: "종료 후 주문이 모두 끝나면 정산이 생성돼요",
      target: { type: "GROUP_BUY", id: 501 },
      kind: "GROUP_BUY_END",
      groupBuyStatus: "IN_PROGRESS",
      postStatus: "EXPOSED",
    },
    {
      date: day(4),
      title: "공구 오픈 · 여름 수분 세럼 공구",
      description: "오픈되면 게시물이 공개되고 판매가 시작돼요",
      target: { type: "GROUP_BUY", id: 502 },
      kind: "GROUP_BUY_OPEN",
      groupBuyStatus: "READY",
      postStatus: "SCHEDULED",
    },
    {
      date: day(12),
      title: "공구 오픈 · 수분 토너 대용량 공구",
      description: "오픈되면 게시물이 공개되고 판매가 시작돼요",
      target: { type: "GROUP_BUY", id: 503 },
      kind: "GROUP_BUY_OPEN",
      groupBuyStatus: "PREPARING",
      postStatus: "PENDING_APPROVAL",
    },
  ]
}

export function mockHome(scenario: Scenario) {
  const s = scene(scenario)
  const isNew = s === "h3"
  const home: CreatorHome = {
    account: s === "h5" ? suspended() : ACTIVE,
    guide: {
      visible: isNew,
      checklist: [
        { key: "SETTLEMENT_INFO", done: true, showroomUrl: null },
        { key: "PROFILE", done: true, showroomUrl: null },
        { key: "FIRST_POST", done: !isNew, showroomUrl: null },
        {
          key: "SHOWROOM_LINK",
          done: null,
          showroomUrl: "https://showroomz.shop/@beauty_soyeon",
        },
      ],
      completed: isNew ? 2 : 3,
      total: 4,
    },
    live: live(s),
    todos: todos(s),
    upcoming: upcoming(s),
    reward: isNew
      ? {
          payoutScheduledAmount: null,
          payoutScheduledDate: null,
          payoutCondition: null,
          totalPaidNet: null,
        }
      : s === "h4"
        ? {
            payoutScheduledAmount: 602_800,
            payoutScheduledDate: null,
            payoutCondition: "TAX_INVOICE_UNVERIFIED",
            totalPaidNet: 597_606,
          }
        : {
            payoutScheduledAmount: null,
            payoutScheduledDate: null,
            payoutCondition: null,
            totalPaidNet: 597_606,
          },
    showroom7d: isNew
      ? { visitors: 42, newFollowers: 3, conversionRate: 7.1 }
      : { visitors: 1284, newFollowers: 96, conversionRate: 7.5 },
  }
  return mockDelay(home)
}

// ------------------------------------------------------------------ 달력

/** 2026 · 2027 공휴일(대체공휴일 포함) — 실서버는 어드민 등록값(business_holiday) */
const HOLIDAYS: Array<HolidayItem> = [
  { date: "2026-01-01", name: "신정" },
  { date: "2026-02-16", name: "설날 연휴" },
  { date: "2026-02-17", name: "설날" },
  { date: "2026-02-18", name: "설날 연휴" },
  { date: "2026-03-01", name: "삼일절" },
  { date: "2026-03-02", name: "대체공휴일(삼일절)" },
  { date: "2026-05-05", name: "어린이날" },
  { date: "2026-05-24", name: "부처님오신날" },
  { date: "2026-05-25", name: "대체공휴일(부처님오신날)" },
  { date: "2026-06-03", name: "전국동시지방선거" },
  { date: "2026-06-06", name: "현충일" },
  { date: "2026-08-15", name: "광복절" },
  { date: "2026-08-17", name: "대체공휴일(광복절)" },
  { date: "2026-09-24", name: "추석 연휴" },
  { date: "2026-09-25", name: "추석" },
  { date: "2026-09-26", name: "추석 연휴" },
  { date: "2026-10-03", name: "개천절" },
  { date: "2026-10-05", name: "대체공휴일(개천절)" },
  { date: "2026-10-09", name: "한글날" },
  { date: "2026-12-25", name: "성탄절" },
  { date: "2027-01-01", name: "신정" },
]

export function mockHolidays(from: string, to: string) {
  return mockDelay(HOLIDAYS.filter(h => h.date >= from && h.date <= to))
}

export function mockCalendar(scenario: Scenario, month: string) {
  const s = scene(scenario)
  const first = dayjs(`${month}-01`)
  const from = first.subtract(7, "day").format("YYYY-MM-DD")
  const to = first.endOf("month").add(7, "day").format("YYYY-MM-DD")
  const all: HomeCalendar["groupBuys"] =
    s === "h3"
      ? []
      : [
          {
            groupBuyId: 500,
            name: "글로우 세럼 공구",
            brandName: "글로우랩",
            startAt: kst(-20, "10:00:00"),
            endAt: kst(-13, "23:59:59"),
            status: "ENDED",
            hold: null,
          },
          {
            groupBuyId: 501,
            name: "글로우 크림 앵콜 공구",
            brandName: "△△ 코스메틱",
            startAt: kst(-6, "10:00:00"),
            endAt: kst(1, "23:59:59"),
            status: "IN_PROGRESS",
            hold: null,
          },
          {
            groupBuyId: 502,
            name: "여름 수분 세럼 공구",
            brandName: "○○ 브랜드",
            startAt: kst(4, "10:00:00"),
            endAt: kst(11, "23:59:59"),
            status: "UPCOMING",
            hold:
              s === "h5"
                ? {
                    kind: "MINE",
                    label: "승인 보류 · 계정 이용 정지",
                    tone: "WARNING",
                    party: null,
                  }
                : null,
          },
          {
            groupBuyId: 503,
            name: "수분 토너 대용량 공구",
            brandName: "퓨어랩",
            startAt: kst(12, "10:00:00"),
            endAt: kst(19, "23:59:59"),
            status: "UPCOMING",
            hold: null,
          },
        ]
  const deadlines: HomeCalendar["deadlines"] =
    s === "h1" || s === "h5"
      ? [
          {
            date: day(1),
            kind: "SIGN_DUE",
            label: "서명 기한 · 밤 리페어 크림 공구",
            targetType: "CONTRACT",
            targetId: 77,
          },
          {
            date: day(1),
            kind: "EXTENSION_RESPOND_DUE",
            label: "연장 응답 · 글로우 크림 앵콜 공구",
            targetType: "GROUP_BUY",
            targetId: 501,
          },
        ]
      : []
  const calendar: HomeCalendar = {
    month,
    from,
    to,
    holidays: HOLIDAYS.filter(h => h.date >= from && h.date <= to),
    groupBuys: all.filter(
      g => g.endAt.slice(0, 10) >= from && g.startAt.slice(0, 10) <= to
    ),
    deadlines: deadlines.filter(d => d.date >= from && d.date <= to),
  }
  return mockDelay(calendar)
}

// ------------------------------------------------------------------ 알림(H1a)

function seedNotifications(): Array<NotificationItem> {
  const base = {
    imageKind: null,
    imageUrl: null,
    liveGroupBuy: false,
    advertising: false,
    todoDueAt: null,
  }
  return [
    {
      ...base,
      notificationId: 1005,
      type: "CONTRACT_COUNTERPARTY_SIGNED",
      category: "계약",
      actorType: "BRAND",
      actorLabel: "브랜드",
      title: "○○ 브랜드가 밤 리페어 크림 계약에 서명했어요",
      body: "이제 내 서명만 남았어요",
      emphasis: "○○ 브랜드",
      target: { type: "CONTRACT", id: 77, sub: null },
      read: false,
      createdAt: utcAgo(10),
    },
    {
      ...base,
      notificationId: 1004,
      type: "GROUP_BUY_EXTENSION_REQUESTED",
      category: "공구",
      actorType: "OPERATOR",
      actorLabel: "운영팀",
      title: "△△ 코스메틱이 글로우 크림 앵콜 공구 7일 연장을 요청했어요",
      body: null,
      emphasis: "△△ 코스메틱",
      target: { type: "GROUP_BUY", id: 501, sub: null },
      read: false,
      createdAt: utcAgo(120),
    },
    {
      ...base,
      notificationId: 1003,
      type: "CONNECTION_REQUESTED",
      category: "연결",
      actorType: "BRAND",
      actorLabel: "브랜드",
      title: "퓨어랩이 연결을 요청했어요",
      body: null,
      emphasis: "퓨어랩",
      target: { type: "CONNECTION_REQUESTS", id: null, sub: null },
      read: true,
      createdAt: utcAgo(60 * 26),
    },
    {
      ...base,
      notificationId: 1002,
      type: "GROUP_BUY_POST_REJECTED",
      category: "공구",
      actorType: "OPERATOR",
      actorLabel: "운영팀",
      title: "수분 토너 대용량 공구 게시물이 반려됐어요",
      body: "사유를 확인해 주세요",
      emphasis: "수분 토너 대용량 공구",
      target: { type: "GROUP_BUY", id: 503, sub: null },
      read: true,
      createdAt: utcAgo(60 * 28),
    },
    {
      ...base,
      notificationId: 1001,
      type: "REWARD_PAID",
      category: "정산",
      actorType: "PLATFORM",
      actorLabel: "SHOWROOMZ",
      title: "글로우 세럼 공구 리워드 597,606원이 지급됐어요",
      body: null,
      emphasis: "글로우 세럼 공구",
      target: { type: "SETTLEMENT", id: 40, sub: null },
      read: true,
      createdAt: utcAgo(60 * 24 * 3),
    },
  ]
}

/** 읽음 처리를 새로고침 전까지 기억한다 — 모듈 하나가 한 세션의 「서버」다 */
let notifications: Array<NotificationItem> | null = null
const store = () => (notifications ??= seedNotifications())

export function mockNotifications(scenario: Scenario) {
  const content = scenario === "notif-empty" ? [] : store()
  const page: PageResponse<NotificationItem> = {
    content,
    pageInfo: {
      currentPage: 1,
      totalPages: 1,
      totalResults: content.length,
      limit: 50,
      hasNext: false,
    },
  }
  return mockDelay(page)
}

export function mockNotificationSummary(scenario: Scenario) {
  const summary: NotificationSummary = {
    unreadCount:
      scenario === "notif-empty" ? 0 : store().filter(n => !n.read).length,
  }
  return mockDelay(summary, 100)
}

export function mockMarkRead(notificationId: number) {
  notifications = store().map(n =>
    n.notificationId === notificationId ? { ...n, read: true } : n
  )
  return mockDelay(undefined, 100)
}

export function mockMarkAllRead() {
  notifications = store().map(n => ({ ...n, read: true }))
  return mockDelay(undefined, 100)
}
