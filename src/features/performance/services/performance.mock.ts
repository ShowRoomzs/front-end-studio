import { mockDelay } from "@/common/utils/devMock"
import { PERFORMANCE_MONTH_OPTIONS } from "@/features/performance/constants/params"
import type {
  AgeGroup,
  CreatorPerformanceDetail,
  CreatorPerformanceListItem,
  CreatorPerformanceListPage,
  CreatorPerformanceStatus,
  CreatorPerformanceSummary,
  PerformanceListParams,
} from "@/features/performance/types"
import { AxiosError, AxiosHeaders, type AxiosResponse } from "axios"
import dayjs from "dayjs"

/*
  성과 관리 개발 서버 목업 — `performanceService`가 개발 서버에서만 동적 import한다(배포 번들에 없다).
  값은 시안 ui-studio-10 rev.2의 L1 · D1 ~ D4 숫자, 모양은 서버 `CreatorPerformanceDto` · `*DocsExamples`.
  연령대 구간은 시안(10년 단위)이 아니라 서버 `Demographics` 구간이다(49 설계서 0-10).
  D4 실지급은 시안 1,538,992가 아니라 정산 규칙값 1,538,993(설계서 3-6 · 서버 값이 정본).
*/

const SALES_REWARD_NOTE = "확정 거래액 × 리워드율(상품별)"
const PAYOUT_NOTE_INDIVIDUAL = "비사업자 · 3.3% 원천징수는 SHOWROOMZ가 신고"

function mockError(status: number, code: string, message: string) {
  const response = {
    status,
    statusText: "",
    headers: {},
    config: { headers: new AxiosHeaders() },
    data: { code, message },
  } as AxiosResponse
  return new AxiosError(
    message,
    status >= 500 ? "ERR_BAD_RESPONSE" : "ERR_BAD_REQUEST",
    undefined,
    undefined,
    response
  )
}

const failLoading = () =>
  mockError(500, "INTERNAL_SERVER_ERROR", "서버 오류가 발생했습니다.")

// ------------------------------------------------------------------ 목록 · 요약

type Row = Omit<
  CreatorPerformanceListItem,
  "statusLabel" | "statusTone" | "rewardStage"
>

const LABEL: Record<
  CreatorPerformanceStatus,
  Pick<CreatorPerformanceListItem, "statusLabel" | "statusTone" | "rewardStage">
> = {
  COLLECTING: {
    statusLabel: "집계 중",
    statusTone: "NEUTRAL",
    rewardStage: "AFTER_SETTLEMENT",
  },
  ADJUSTING: {
    statusLabel: "조정 협의",
    statusTone: "WARNING",
    rewardStage: "AFTER_AGREEMENT",
  },
  SETTLED: {
    statusLabel: "정산 완료",
    statusTone: "SUCCESS",
    rewardStage: "CONFIRMED",
  },
}

const row = (value: Row): CreatorPerformanceListItem => ({
  ...value,
  ...LABEL[value.status],
})

/** 시안 L1 표 8행(종료일 최신순) */
const LIST_ROWS: Array<CreatorPerformanceListItem> = [
  row({
    groupBuyId: 31,
    groupBuyNumber: "GB-20260824-001",
    groupBuyTitle: "여름 수분 세럼 공구",
    brandName: "○○ 브랜드",
    marketId: 9,
    periodStartAt: "2026-08-24T10:00:00",
    periodEndAt: "2026-08-31T23:59:00",
    status: "ADJUSTING",
    confirmedSalesAmount: 11266000,
    confirmedQuantity: 439,
    conversionRate: 6.1,
    myRewardAmount: null,
  }),
  row({
    groupBuyId: 30,
    groupBuyNumber: "GB-20260820-002",
    groupBuyTitle: "하이드라 앰플 공구",
    brandName: "퓨어네이처",
    marketId: 8,
    periodStartAt: "2026-08-20T10:00:00",
    periodEndAt: "2026-08-26T23:59:00",
    status: "COLLECTING",
    confirmedSalesAmount: null,
    confirmedQuantity: null,
    conversionRate: null,
    myRewardAmount: null,
  }),
  row({
    groupBuyId: 29,
    groupBuyNumber: "GB-20260810-001",
    groupBuyTitle: "리프팅 크림 공구",
    brandName: "글로우코스",
    marketId: 5,
    periodStartAt: "2026-08-10T10:00:00",
    periodEndAt: "2026-08-16T23:59:00",
    status: "COLLECTING",
    confirmedSalesAmount: null,
    confirmedQuantity: null,
    conversionRate: null,
    myRewardAmount: null,
  }),
  row({
    groupBuyId: 28,
    groupBuyNumber: "GB-20260801-003",
    groupBuyTitle: "데일리 선크림 공구",
    brandName: "데일리랩",
    marketId: 4,
    periodStartAt: "2026-08-01T10:00:00",
    periodEndAt: "2026-08-07T23:59:00",
    status: "SETTLED",
    confirmedSalesAmount: 5480000,
    confirmedQuantity: 274,
    conversionRate: 5.8,
    myRewardAmount: 1003600,
  }),
  row({
    groupBuyId: 27,
    groupBuyNumber: "GB-20260710-001",
    groupBuyTitle: "퓨어랩 립밤 공구",
    brandName: "퓨어랩",
    marketId: 6,
    periodStartAt: "2026-07-10T10:00:00",
    periodEndAt: "2026-07-17T23:59:00",
    status: "ADJUSTING",
    confirmedSalesAmount: 415600,
    confirmedQuantity: 35,
    conversionRate: 4.4,
    myRewardAmount: null,
  }),
  row({
    groupBuyId: 26,
    groupBuyNumber: "GB-20260705-001",
    groupBuyTitle: "글로우 세럼 공구",
    brandName: "글로우코스",
    marketId: 5,
    periodStartAt: "2026-07-05T10:00:00",
    periodEndAt: "2026-07-11T23:59:00",
    status: "SETTLED",
    confirmedSalesAmount: 4120000,
    confirmedQuantity: 206,
    conversionRate: 5.6,
    myRewardAmount: 618000,
  }),
  row({
    groupBuyId: 25,
    groupBuyNumber: "GB-20260610-001",
    groupBuyTitle: "수분 앰플 공구",
    brandName: "데일리랩",
    marketId: 4,
    periodStartAt: "2026-06-10T10:00:00",
    periodEndAt: "2026-06-16T23:59:00",
    status: "SETTLED",
    confirmedSalesAmount: 3620000,
    confirmedQuantity: 181,
    conversionRate: 5.2,
    myRewardAmount: 543000,
  }),
  row({
    groupBuyId: 24,
    groupBuyNumber: "GB-20260514-001",
    groupBuyTitle: "클렌징 밤 공구",
    brandName: "글로우코스",
    marketId: 5,
    periodStartAt: "2026-05-14T10:00:00",
    periodEndAt: "2026-05-20T23:59:00",
    status: "SETTLED",
    confirmedSalesAmount: 2480000,
    confirmedQuantity: 155,
    conversionRate: 4.9,
    myRewardAmount: 372000,
  }),
]

/** 값이 없는 행은 맨 뒤 · 같은 값은 종료일 최신순(서버 `CreatorPerformanceSort`) */
function sortRows(
  rows: Array<CreatorPerformanceListItem>,
  sort: string
): Array<CreatorPerformanceListItem> {
  const byEnd = (
    a: CreatorPerformanceListItem,
    b: CreatorPerformanceListItem
  ) => b.periodEndAt.localeCompare(a.periodEndAt)
  const pick = (item: CreatorPerformanceListItem) =>
    sort === "REWARD_DESC"
      ? item.myRewardAmount
      : sort === "CONVERSION_DESC"
        ? item.conversionRate
        : null
  if (sort !== "REWARD_DESC" && sort !== "CONVERSION_DESC") {
    return [...rows].sort(byEnd)
  }
  return [...rows].sort((a, b) => {
    const va = pick(a)
    const vb = pick(b)
    if (va === null && vb === null) return byEnd(a, b)
    if (va === null) return 1
    if (vb === null) return -1
    return vb - va || byEnd(a, b)
  })
}

export function getListMock(
  params: PerformanceListParams,
  scenario: string | null
): Promise<CreatorPerformanceListPage> {
  if (scenario === "error") return Promise.reject(failLoading())
  const base =
    scenario === "empty"
      ? []
      : scenario === "pending"
        ? LIST_ROWS.filter(item => item.status !== "SETTLED")
        : LIST_ROWS
  const status = ([] as Array<string>).concat(params.status)
  const keyword = params.keyword.trim().toLowerCase()
  const filtered = base.filter(
    item =>
      (status.length === 0 || status.includes(item.status)) &&
      (!keyword ||
        item.groupBuyTitle.toLowerCase().includes(keyword) ||
        item.brandName.toLowerCase().includes(keyword))
  )
  const sorted = sortRows(filtered, params.sort)
  const size = Math.min(Number(params.size) || 20, 100)
  const totalPages = Math.max(1, Math.ceil(sorted.length / size))
  const page = Math.min(Math.max(Number(params.page) || 1, 1), totalPages)
  return mockDelay({
    content: sorted.slice((page - 1) * size, page * size),
    pageInfo: {
      currentPage: page,
      totalPages,
      totalResults: sorted.length,
      limit: size,
      hasNext: page < totalPages,
    },
  })
}

export function getSummaryMock(
  months: number,
  scenario: string | null
): Promise<CreatorPerformanceSummary> {
  if (scenario === "error") return Promise.reject(failLoading())
  const option =
    PERFORMANCE_MONTH_OPTIONS.find(item => item.value === Number(months)) ??
    PERFORMANCE_MONTH_OPTIONS[1]
  const today = dayjs()
  const period = {
    periodFrom: today.subtract(option.value, "month").format("YYYY-MM-DD"),
    periodTo: today.format("YYYY-MM-DD"),
    periodLabel: option.label,
  }
  const emptyKpi = {
    totalReward: null,
    averageReward: null,
    settledCount: 0,
    averageConversionRate: null,
    averageRepeatRate: null,
    averageFollowerBuyerRate: null,
    averagePostImpressions: null,
    genderRatio: null,
  }
  if (scenario === "empty") {
    return mockDelay({
      ...period,
      kpi: emptyKpi,
      statusCounts: { COLLECTING: 0, ADJUSTING: 0, SETTLED: 0 },
      hasAnyEnded: false,
    })
  }
  if (scenario === "pending") {
    return mockDelay({
      ...period,
      kpi: emptyKpi,
      statusCounts: { COLLECTING: 2, ADJUSTING: 2, SETTLED: 0 },
      hasAnyEnded: true,
    })
  }
  return mockDelay({
    ...period,
    kpi: {
      totalReward: 2536600,
      averageReward: 634150,
      settledCount: 4,
      averageConversionRate: 5.4,
      averageRepeatRate: 28.6,
      averageFollowerBuyerRate: 45.2,
      averagePostImpressions: 4180,
      genderRatio: { majorFirst: "FEMALE", female: 83, male: 17 },
    },
    statusCounts: { COLLECTING: 2, ADJUSTING: 2, SETTLED: 4 },
    hasAnyEnded: true,
  })
}

// ------------------------------------------------------------------ 상세

const ages = (
  rows: Array<[string, number, number, number, number]>
): Array<AgeGroup> =>
  rows.map(([label, count, total, female, male]) => ({
    label,
    count,
    total,
    female,
    male,
  }))

/** D1 정산 완료(확정 성과) — 데일리 선크림 공구 */
const SETTLED: CreatorPerformanceDetail = {
  groupBuy: {
    groupBuyId: 28,
    groupBuyNumber: "GB-20260801-003",
    groupBuyTitle: "데일리 선크림 공구",
    brandName: "데일리랩",
    marketId: 4,
    contractId: 70,
    periodStartAt: "2026-08-01T10:00:00",
    periodEndAt: "2026-08-07T23:59:00",
    status: "SETTLED",
    statusLabel: "정산 완료",
    statusTone: "SUCCESS",
  },
  notice: null,
  rewardBar: {
    salesReward: {
      stage: "CONFIRMED",
      amount: 603600,
      originalAmount: 603600,
      note: SALES_REWARD_NOTE,
    },
    fixedFee: {
      stage: "CONFIRMED",
      amount: 400000,
      originalAmount: null,
      note: "브랜드 직접 지급",
    },
    totalReward: {
      stage: "CONFIRMED",
      amount: 1003600,
      originalAmount: null,
      note: "판매 리워드 + 고정 지급비",
    },
  },
  kpi: {
    myReward: {
      stage: "CONFIRMED",
      amount: 1003600,
      originalAmount: null,
      note: "판매 리워드 + 고정 지급비",
    },
    confirmedSales: {
      value: 5480000,
      basis: "구매확정 291건 기준",
      estimated: false,
    },
    conversionRate: {
      value: 5.8,
      basis: "쇼룸 방문 5,010명 대비 구매확정",
      estimated: false,
    },
    repeatRate: {
      value: 30.5,
      basis: "구매 소비자 269명 중 82명",
      estimated: false,
    },
    followerDelta: { delta: 312, countAtEnd: 4350 },
    genderRatio: { majorFirst: "FEMALE", female: 84, male: 16 },
    genderEstimated: false,
  },
  traffic: {
    visitorCount: 5010,
    sources: [
      {
        source: "INTERNAL",
        label: "쇼룸 내부 탐색",
        visitors: 1480,
        ratio: 29.5,
      },
      {
        source: "PROFILE_LINK",
        label: "프로필 쇼룸 링크",
        visitors: 1260,
        ratio: 25.1,
      },
      {
        source: "POST_LINK",
        label: "공구 게시물 링크",
        visitors: 1840,
        ratio: 36.7,
      },
      {
        source: "PRODUCT_LINK",
        label: "상품 상세 직접 링크",
        visitors: 430,
        ratio: 8.6,
      },
    ],
    post: {
      postId: 301,
      impressions: 4580,
      uniqueViewers: 3860,
      productViews: 2560,
      productViewRate: 55.9,
      orders: 273,
      orderRate: 10.7,
      likes: 284,
      shares: null,
    },
  },
  funnel: {
    visitorCount: 5010,
    orderCount: 313,
    nonOrderVisitors: 4697,
    confirmedOrderCount: 291,
    cancelCount: 8,
    returnCount: 13,
    deliveryExceptionCount: 1,
    confirmedRate: 93.0,
    finalConversionRate: 5.8,
    estimated: false,
  },
  sales: {
    estimated: false,
    products: [
      {
        productId: 501,
        productName: "데일리 선크림 50ml",
        detailViews: 4280,
        orders: 251,
        confirmedQuantity: 220,
        confirmedAmount: 4400000,
        rewardRate: 12.0,
        rewardAmount: 528000,
      },
      {
        productId: 502,
        productName: "데일리 선크림 리필",
        detailViews: 1640,
        orders: 62,
        confirmedQuantity: 54,
        confirmedAmount: 1080000,
        rewardRate: 7.0,
        rewardAmount: 75600,
      },
    ],
    contractRewardAmount: 603600,
    adjustmentDelta: null,
    highlights: {
      mostViewed: {
        productId: 501,
        productName: "데일리 선크림 50ml",
        basis: "상세 조회 4,280회 · 전체의 72%",
      },
      bestConversion: {
        productId: 501,
        productName: "데일리 선크림 50ml",
        basis: "조회 4,280회 중 251건 · 5.9%",
      },
      topReward: {
        productId: 501,
        productName: "데일리 선크림 50ml",
        basis: "528,000원 · 판매 리워드의 87%",
      },
    },
  },
  consumers: {
    estimated: false,
    buyerCount: 269,
    newBuyerCount: 187,
    repeatBuyerCount: 82,
    followerBuyerCount: 128,
    followerBuyerRate: 47.6,
    distribution: {
      suppressed: false,
      sampleSize: 269,
      minimumSampleSize: 30,
      genders: {
        female: 84.0,
        male: 16.0,
        femaleCount: 226,
        maleCount: 43,
        unknownCount: 0,
      },
      ageGroups: ages([
        ["18–24세", 71, 26.4, 22.3, 4.1],
        ["25–34세", 119, 44.2, 37.2, 7.0],
        ["35–44세", 54, 20.1, 16.7, 3.4],
        ["45세 이상", 21, 7.8, 6.7, 1.1],
        ["기타", 4, 1.5, 1.1, 0.4],
      ]),
    },
  },
  followers: {
    follower: {
      visitors: 1540,
      postViewers: 1390,
      orders: 138,
      confirmedOrders: 128,
      conversionRate: 8.3,
    },
    nonFollower: {
      visitors: 3470,
      postViewers: 3190,
      orders: 175,
      confirmedOrders: 163,
      conversionRate: 4.7,
    },
    countAtEnd: 4350,
    delta: 312,
    followerVisitorRate: 30.7,
    conversionEstimated: false,
  },
  reward: {
    stage: "CONFIRMED",
    confirmedSalesAmount: 5480000,
    originalRewardAmount: 603600,
    myRequest: null,
    counterProposal: null,
    adjustment: null,
    finalRewardAmount: 603600,
    fixedFeeAmount: 400000,
    totalRewardAmount: 1003600,
    payout: {
      businessType: "INDIVIDUAL",
      amount: 583682,
      note: PAYOUT_NOTE_INDIVIDUAL,
    },
    settlementId: 26,
    settlementStatusLabel: "지급 완료",
    adjustmentThreadId: null,
    adjustmentDeadlineAt: null,
  },
  recollaboration: { marketId: 4, threadId: 88 },
}

/** D3 조정 협의 — 여름 수분 세럼 공구(판매 · 유입 · 소비자 지표는 확정값) */
const ADJUSTING: CreatorPerformanceDetail = {
  groupBuy: {
    groupBuyId: 31,
    groupBuyNumber: "GB-20260824-001",
    groupBuyTitle: "여름 수분 세럼 공구",
    brandName: "○○ 브랜드",
    marketId: 9,
    contractId: 74,
    periodStartAt: "2026-08-24T10:00:00",
    periodEndAt: "2026-08-31T23:59:00",
    status: "ADJUSTING",
    statusLabel: "조정 협의",
    statusTone: "WARNING",
  },
  notice: {
    tone: "WARNING",
    text: "정산 조정 협의 중이에요. 리워드는 브랜드와 합의한 금액으로 확정되고, 합의 기한(09.16)까지 합의가 없으면 원래 금액으로 확정돼요. 판매 · 유입 · 소비자 지표는 확정값입니다.",
    link: "ISSUE_THREAD",
    threadId: 140,
  },
  rewardBar: {
    salesReward: {
      stage: "AFTER_AGREEMENT",
      amount: null,
      originalAmount: 1577040,
      note: SALES_REWARD_NOTE,
    },
    fixedFee: {
      stage: "CONFIRMED",
      amount: 1200000,
      originalAmount: null,
      note: "브랜드 직접 지급",
    },
    totalReward: {
      stage: "AFTER_AGREEMENT",
      amount: null,
      originalAmount: null,
      note: "판매 리워드 + 고정 지급비",
    },
  },
  kpi: {
    myReward: {
      stage: "AFTER_AGREEMENT",
      amount: null,
      originalAmount: null,
      note: "판매 리워드 + 고정 지급비",
    },
    confirmedSales: {
      value: 11266000,
      basis: "구매확정 304건 기준",
      estimated: false,
    },
    conversionRate: {
      value: 6.1,
      basis: "쇼룸 방문 4,980명 대비 구매확정",
      estimated: false,
    },
    repeatRate: {
      value: 30.2,
      basis: "구매 소비자 281명 중 85명",
      estimated: false,
    },
    followerDelta: { delta: 270, countAtEnd: 4620 },
    genderRatio: { majorFirst: "FEMALE", female: 83, male: 17 },
    genderEstimated: false,
  },
  traffic: {
    visitorCount: 4980,
    sources: [
      {
        source: "INTERNAL",
        label: "쇼룸 내부 탐색",
        visitors: 1470,
        ratio: 29.5,
      },
      {
        source: "PROFILE_LINK",
        label: "프로필 쇼룸 링크",
        visitors: 1250,
        ratio: 25.1,
      },
      {
        source: "POST_LINK",
        label: "공구 게시물 링크",
        visitors: 1830,
        ratio: 36.7,
      },
      {
        source: "PRODUCT_LINK",
        label: "상품 상세 직접 링크",
        visitors: 430,
        ratio: 8.6,
      },
    ],
    post: {
      postId: 318,
      impressions: 4550,
      uniqueViewers: 3840,
      productViews: 2540,
      productViewRate: 55.8,
      orders: 270,
      orderRate: 10.6,
      likes: 284,
      shares: null,
    },
  },
  funnel: {
    visitorCount: 4980,
    orderCount: 312,
    nonOrderVisitors: 4668,
    confirmedOrderCount: 304,
    cancelCount: 3,
    returnCount: 5,
    deliveryExceptionCount: 0,
    confirmedRate: 97.4,
    finalConversionRate: 6.1,
    estimated: false,
  },
  sales: {
    estimated: false,
    products: [
      {
        productId: 611,
        productName: "수분진정 세럼 30ml",
        detailViews: 3620,
        orders: 186,
        confirmedQuantity: 268,
        confirmedAmount: 7504000,
        rewardRate: 15.0,
        rewardAmount: 1125600,
      },
      {
        productId: 612,
        productName: "수분진정 크림 50ml",
        detailViews: 1480,
        orders: 126,
        confirmedQuantity: 171,
        confirmedAmount: 3762000,
        rewardRate: 12.0,
        rewardAmount: 451440,
      },
    ],
    contractRewardAmount: 1577040,
    adjustmentDelta: null,
    highlights: {
      mostViewed: {
        productId: 611,
        productName: "수분진정 세럼 30ml",
        basis: "상세 조회 3,620회 · 전체의 71%",
      },
      bestConversion: {
        productId: 612,
        productName: "수분진정 크림 50ml",
        basis: "조회 1,480회 중 126건 · 8.5%",
      },
      topReward: {
        productId: 611,
        productName: "수분진정 세럼 30ml",
        basis: "1,125,600원 · 판매 리워드(원래 금액)의 71%",
      },
    },
  },
  consumers: {
    estimated: false,
    buyerCount: 281,
    newBuyerCount: 196,
    repeatBuyerCount: 85,
    followerBuyerCount: 132,
    followerBuyerRate: 47.0,
    distribution: {
      suppressed: false,
      sampleSize: 281,
      minimumSampleSize: 30,
      genders: {
        female: 83.0,
        male: 17.0,
        femaleCount: 233,
        maleCount: 48,
        unknownCount: 0,
      },
      ageGroups: ages([
        ["18–24세", 73, 26.0, 21.7, 4.3],
        ["25–34세", 124, 44.1, 36.3, 7.8],
        ["35–44세", 57, 20.3, 16.7, 3.6],
        ["45세 이상", 23, 8.2, 7.1, 1.1],
        ["기타", 4, 1.4, 1.2, 0.2],
      ]),
    },
  },
  followers: {
    follower: {
      visitors: 1560,
      postViewers: 1410,
      orders: 140,
      confirmedOrders: 132,
      conversionRate: 8.5,
    },
    nonFollower: {
      visitors: 3420,
      postViewers: 3140,
      orders: 172,
      confirmedOrders: 172,
      conversionRate: 5.0,
    },
    countAtEnd: 4620,
    delta: 270,
    followerVisitorRate: 31.3,
    conversionEstimated: false,
  },
  reward: {
    stage: "AFTER_AGREEMENT",
    confirmedSalesAmount: 11266000,
    originalRewardAmount: 1577040,
    // 제안 시각은 서버 now() — UTC 벽시계(09.02 11:20 · 09.07 15:02 KST)
    myRequest: { amount: 1606512, at: "2026-09-02T02:20:00" },
    counterProposal: { amount: 1591512, at: "2026-09-07T06:02:00" },
    adjustment: null,
    finalRewardAmount: null,
    fixedFeeAmount: 1200000,
    totalRewardAmount: null,
    payout: {
      businessType: "INDIVIDUAL",
      amount: null,
      note: PAYOUT_NOTE_INDIVIDUAL,
    },
    settlementId: 31,
    settlementStatusLabel: "조정 협의",
    adjustmentThreadId: 140,
    // 합의 기한은 KST 벽시계
    adjustmentDeadlineAt: "2026-09-16T23:59:59",
  },
  recollaboration: { marketId: 9, threadId: 92 },
}

/** D4 정산 완료(조정 합의 반영) — D3이 합의로 끝나 지급까지 완료된 뒤 */
const AGREED: CreatorPerformanceDetail = {
  ...ADJUSTING,
  groupBuy: {
    ...ADJUSTING.groupBuy,
    status: "SETTLED",
    statusLabel: "정산 완료",
    statusTone: "SUCCESS",
  },
  notice: {
    tone: "NEUTRAL",
    text: "정산 조정이 합의되어 반영됐어요. 브랜드 제안 금액에 2026.09.08 양측이 동의해 판매 리워드가 1,577,040원 → 1,591,512원(+14,472원)으로 확정됐습니다.",
    link: "ISSUE_THREAD_HISTORY",
    threadId: 140,
  },
  rewardBar: {
    salesReward: {
      stage: "CONFIRMED",
      amount: 1591512,
      originalAmount: 1577040,
      note: "원래 1,577,040원 + 조정 +14,472원",
    },
    fixedFee: ADJUSTING.rewardBar.fixedFee,
    totalReward: {
      stage: "CONFIRMED",
      amount: 2791512,
      originalAmount: null,
      note: "판매 리워드 + 고정 지급비 · 조정 합의 반영",
    },
  },
  kpi: {
    ...ADJUSTING.kpi,
    myReward: {
      stage: "CONFIRMED",
      amount: 2791512,
      originalAmount: null,
      note: "판매 리워드 + 고정 지급비 · 조정 합의 반영",
    },
  },
  sales: {
    ...ADJUSTING.sales,
    adjustmentDelta: 14472,
    highlights: {
      ...ADJUSTING.sales.highlights,
      topReward: {
        productId: 611,
        productName: "수분진정 세럼 30ml",
        basis: "1,125,600원 · 계약 기준 판매 리워드의 71%",
      },
    },
  },
  reward: {
    ...ADJUSTING.reward,
    stage: "CONFIRMED",
    myRequest: null,
    counterProposal: null,
    adjustment: {
      delta: 14472,
      agreedAt: "2026-09-08T07:40:00",
      agreedProposalLabel: "브랜드 제안",
    },
    finalRewardAmount: 1591512,
    totalRewardAmount: 2791512,
    payout: {
      businessType: "INDIVIDUAL",
      amount: 1538993,
      note: PAYOUT_NOTE_INDIVIDUAL,
    },
    settlementStatusLabel: "지급 완료",
    adjustmentDeadlineAt: null,
  },
}

/** D2 집계 중(정산 전 · 예정 표시) — 하이드라 앰플 공구 */
const COLLECTING: CreatorPerformanceDetail = {
  groupBuy: {
    groupBuyId: 30,
    groupBuyNumber: "GB-20260820-002",
    groupBuyTitle: "하이드라 앰플 공구",
    brandName: "퓨어네이처",
    marketId: 8,
    contractId: 73,
    periodStartAt: "2026-08-20T10:00:00",
    periodEndAt: "2026-08-26T23:59:00",
    status: "COLLECTING",
    statusLabel: "집계 중",
    statusTone: "NEUTRAL",
  },
  notice: {
    tone: "NEUTRAL",
    text: "미처리 반품 3건이 남아 있습니다. 아래 «예정» 표시 값은 처리 결과에 따라 줄어들 수 있습니다.",
    link: null,
    threadId: null,
  },
  rewardBar: {
    salesReward: {
      stage: "AFTER_SETTLEMENT",
      amount: null,
      originalAmount: 677400,
      note: `${SALES_REWARD_NOTE} · 예정`,
    },
    fixedFee: {
      stage: "CONFIRMED",
      amount: 300000,
      originalAmount: null,
      note: "브랜드 직접 지급",
    },
    totalReward: {
      stage: "AFTER_SETTLEMENT",
      amount: null,
      originalAmount: null,
      note: "판매 리워드 + 고정 지급비",
    },
  },
  kpi: {
    myReward: {
      stage: "AFTER_SETTLEMENT",
      amount: null,
      originalAmount: null,
      note: "판매 리워드 + 고정 지급비",
    },
    confirmedSales: {
      value: 6120000,
      basis: "구매확정 331건 기준",
      estimated: true,
    },
    conversionRate: {
      value: 5.3,
      basis: "쇼룸 방문 6,240명 대비 구매확정",
      estimated: true,
    },
    repeatRate: {
      value: 27.3,
      basis: "구매 소비자 308명 중 84명",
      estimated: true,
    },
    followerDelta: { delta: 286, countAtEnd: 4790 },
    genderRatio: { majorFirst: "FEMALE", female: 84, male: 16 },
    genderEstimated: true,
  },
  traffic: {
    visitorCount: 6240,
    sources: [
      {
        source: "INTERNAL",
        label: "쇼룸 내부 탐색",
        visitors: 1820,
        ratio: 29.2,
      },
      {
        source: "PROFILE_LINK",
        label: "프로필 쇼룸 링크",
        visitors: 1560,
        ratio: 25.0,
      },
      {
        source: "POST_LINK",
        label: "공구 게시물 링크",
        visitors: 2340,
        ratio: 37.5,
      },
      {
        source: "PRODUCT_LINK",
        label: "상품 상세 직접 링크",
        visitors: 520,
        ratio: 8.3,
      },
    ],
    post: {
      postId: 315,
      impressions: 5660,
      uniqueViewers: 4720,
      productViews: 3090,
      productViewRate: 54.6,
      orders: 319,
      orderRate: 10.3,
      likes: 341,
      shares: null,
    },
  },
  funnel: {
    visitorCount: 6240,
    orderCount: 358,
    nonOrderVisitors: 5882,
    confirmedOrderCount: 331,
    cancelCount: 7,
    returnCount: 19,
    deliveryExceptionCount: 1,
    confirmedRate: 92.5,
    finalConversionRate: 5.3,
    estimated: true,
  },
  sales: {
    estimated: true,
    products: [
      {
        productId: 591,
        productName: "하이드라 앰플 30ml",
        detailViews: 5010,
        orders: 288,
        confirmedQuantity: 249,
        confirmedAmount: 4980000,
        rewardRate: 12.0,
        rewardAmount: 597600,
      },
      {
        productId: 592,
        productName: "하이드라 앰플 미니 10ml",
        detailViews: 1880,
        orders: 70,
        confirmedQuantity: 57,
        confirmedAmount: 1140000,
        rewardRate: 7.0,
        rewardAmount: 79800,
      },
    ],
    contractRewardAmount: 677400,
    adjustmentDelta: null,
    highlights: {
      mostViewed: {
        productId: 591,
        productName: "하이드라 앰플 30ml",
        basis: "상세 조회 5,010회 · 전체의 73%",
      },
      bestConversion: {
        productId: 591,
        productName: "하이드라 앰플 30ml",
        basis: "조회 5,010회 중 288건 · 5.7%",
      },
      topReward: {
        productId: 591,
        productName: "하이드라 앰플 30ml",
        basis: "597,600원 · 판매 리워드의 88%",
      },
    },
  },
  consumers: {
    estimated: true,
    buyerCount: 308,
    newBuyerCount: 224,
    repeatBuyerCount: 84,
    followerBuyerCount: 138,
    followerBuyerRate: 44.8,
    distribution: {
      suppressed: false,
      sampleSize: 308,
      minimumSampleSize: 30,
      genders: {
        female: 84.0,
        male: 16.0,
        femaleCount: 259,
        maleCount: 49,
        unknownCount: 0,
      },
      ageGroups: ages([
        ["18–24세", 81, 26.3, 22.1, 4.2],
        ["25–34세", 136, 44.2, 37.3, 6.9],
        ["35–44세", 62, 20.1, 16.9, 3.2],
        ["45세 이상", 24, 7.8, 6.5, 1.3],
        ["기타", 5, 1.6, 1.2, 0.4],
      ]),
    },
  },
  followers: {
    follower: {
      visitors: 1810,
      postViewers: 1640,
      orders: 152,
      confirmedOrders: 138,
      conversionRate: 7.6,
    },
    nonFollower: {
      visitors: 4430,
      postViewers: 4020,
      orders: 206,
      confirmedOrders: 193,
      conversionRate: 4.4,
    },
    countAtEnd: 4790,
    delta: 286,
    followerVisitorRate: 29.0,
    conversionEstimated: true,
  },
  reward: {
    stage: "AFTER_SETTLEMENT",
    confirmedSalesAmount: 6120000,
    originalRewardAmount: 677400,
    myRequest: null,
    counterProposal: null,
    adjustment: null,
    finalRewardAmount: null,
    fixedFeeAmount: 300000,
    totalRewardAmount: null,
    payout: {
      businessType: "INDIVIDUAL",
      amount: null,
      note: PAYOUT_NOTE_INDIVIDUAL,
    },
    settlementId: null,
    settlementStatusLabel: null,
    adjustmentThreadId: null,
    adjustmentDeadlineAt: null,
  },
  recollaboration: { marketId: 8, threadId: null },
}

/** D2' 집계 중(정산 확인 중 · 지급 예정) — 주문은 다 끝나 「예정」은 없고 돈만 「정산 후 확정」 */
const REVIEWING: CreatorPerformanceDetail = {
  ...SETTLED,
  groupBuy: {
    ...SETTLED.groupBuy,
    groupBuyId: 29,
    groupBuyNumber: "GB-20260810-001",
    groupBuyTitle: "리프팅 크림 공구",
    brandName: "글로우코스",
    marketId: 5,
    contractId: 71,
    periodStartAt: "2026-08-10T10:00:00",
    periodEndAt: "2026-08-16T23:59:00",
    status: "COLLECTING",
    statusLabel: "집계 중",
    statusTone: "NEUTRAL",
  },
  rewardBar: {
    ...SETTLED.rewardBar,
    salesReward: {
      stage: "AFTER_SETTLEMENT",
      amount: null,
      originalAmount: 603600,
      note: SALES_REWARD_NOTE,
    },
    totalReward: {
      stage: "AFTER_SETTLEMENT",
      amount: null,
      originalAmount: null,
      note: "판매 리워드 + 고정 지급비",
    },
  },
  kpi: {
    ...SETTLED.kpi,
    myReward: {
      stage: "AFTER_SETTLEMENT",
      amount: null,
      originalAmount: null,
      note: "판매 리워드 + 고정 지급비",
    },
  },
  reward: {
    ...SETTLED.reward,
    stage: "AFTER_SETTLEMENT",
    finalRewardAmount: null,
    totalRewardAmount: null,
    payout: { ...SETTLED.reward.payout, amount: null },
    settlementStatusLabel: "정산 확인 중",
  },
  recollaboration: { marketId: 5, threadId: 90 },
}

/** D1 변형 — 게시물 없음 · 분포 비공개(표본 30명 미만) · 사업자 · 고정 지급비 없음 · 1:1 스레드 없음 */
const SPARSE: CreatorPerformanceDetail = {
  ...SETTLED,
  rewardBar: {
    ...SETTLED.rewardBar,
    fixedFee: { ...SETTLED.rewardBar.fixedFee, amount: 0 },
    totalReward: { ...SETTLED.rewardBar.totalReward, amount: 603600 },
  },
  kpi: {
    ...SETTLED.kpi,
    myReward: { ...SETTLED.kpi.myReward, amount: 603600 },
    genderRatio: null,
  },
  traffic: { ...SETTLED.traffic, post: null },
  consumers: {
    ...SETTLED.consumers,
    distribution: {
      suppressed: true,
      sampleSize: 24,
      minimumSampleSize: 30,
      genders: null,
      ageGroups: [],
    },
  },
  reward: {
    ...SETTLED.reward,
    fixedFeeAmount: 0,
    totalRewardAmount: 603600,
    payout: {
      businessType: "BUSINESS",
      amount: 663960,
      note: "사업자 · 부가세 포함 금액",
    },
  },
  recollaboration: { marketId: 4, threadId: null },
}

const SCENARIOS: Record<string, CreatorPerformanceDetail> = {
  settled: SETTLED,
  collecting: COLLECTING,
  reviewing: REVIEWING,
  adjusting: ADJUSTING,
  agreed: AGREED,
  sparse: SPARSE,
}

/** 시나리오가 없을 때 — 목업 목록 ID의 상태로 고른다(머리는 그 행 값) */
const BY_ID: Record<number, CreatorPerformanceDetail> = {
  31: ADJUSTING,
  30: COLLECTING,
  29: REVIEWING,
  28: SETTLED,
  27: ADJUSTING,
  26: SETTLED,
  25: SETTLED,
  24: SETTLED,
}

export function getDetailMock(
  groupBuyId: number,
  scenario: string | null
): Promise<CreatorPerformanceDetail> {
  if (scenario === "error") return Promise.reject(failLoading())
  if (scenario === "not-found") {
    return Promise.reject(
      mockError(404, "GROUP_BUY_NOT_FOUND", "존재하지 않는 공구입니다.")
    )
  }
  if (scenario === "not-ready") {
    return Promise.reject(
      mockError(
        409,
        "PERFORMANCE_NOT_READY",
        "공구가 종료되면 성과를 열람할 수 있습니다."
      )
    )
  }
  // 목록 시나리오(empty · pending)를 들고 들어오면 ID 상태로 그린다
  const fromScenario = scenario ? SCENARIOS[scenario] : undefined
  const picked = fromScenario ?? BY_ID[groupBuyId]
  if (!picked) {
    return Promise.reject(
      mockError(404, "GROUP_BUY_NOT_FOUND", "존재하지 않는 공구입니다.")
    )
  }
  const listRow = fromScenario
    ? undefined
    : LIST_ROWS.find(item => item.groupBuyId === groupBuyId)
  if (!listRow) return mockDelay(picked)
  return mockDelay({
    ...picked,
    groupBuy: {
      ...picked.groupBuy,
      groupBuyId: listRow.groupBuyId,
      groupBuyNumber: listRow.groupBuyNumber,
      groupBuyTitle: listRow.groupBuyTitle,
      brandName: listRow.brandName,
      marketId: listRow.marketId,
      periodStartAt: listRow.periodStartAt,
      periodEndAt: listRow.periodEndAt,
    },
  })
}
