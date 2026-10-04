import {
  formatDateOnly,
  formatDateTimeShort,
  parseServerDateTime,
} from "@/common/utils/formatDate"
import type {
  CreatorGroupBuyDetailResponse,
  FulfillmentTarget,
} from "@/features/groupBuy/types"
import dayjs from "dayjs"

export type Detail = CreatorGroupBuyDetailResponse

/*
  상세 화면 분기 — 서버가 상태·요청·통지·권한을 판정해 내려주고, FE는 그 값으로
  시안 B1~B13 중 어느 화면인지를 고른다. 조건을 새로 만들지 않고 응답 값만 읽는다.
*/

export function num(value: number | null | undefined): string {
  return value === null || value === undefined
    ? "—"
    : value.toLocaleString("ko-KR")
}

export function won(value: number | null | undefined): string {
  return value === null || value === undefined
    ? "—"
    : `${value.toLocaleString("ko-KR")}원`
}

/** "08.14 10:00" — 스텝퍼 `.who` */
export function md(value: string | null | undefined): string {
  return value ? parseServerDateTime(value).format("MM.DD HH:mm") : "—"
}

/** "08.14" */
export function mdDate(value: string | null | undefined): string {
  return value ? parseServerDateTime(value).format("MM.DD") : "—"
}

export const dt = (value: string | null | undefined) =>
  formatDateTimeShort(value ?? null)
export const d = (value: string | null | undefined) =>
  formatDateOnly(value ?? null)

/** 서버 LocalDate(yyyy-MM-dd) — 시간대와 무관한 날짜 */
export function localDate(value: string | null | undefined): string {
  return value ? dayjs(value).format("YYYY.MM.DD") : "—"
}

export function localMonthDay(value: string | null | undefined): string {
  return value ? dayjs(value).format("MM.DD") : "—"
}

export function isSelling(detail: Detail) {
  return (
    detail.groupBuy.status === "IN_PROGRESS" ||
    detail.groupBuy.status === "SUSPENSION_SCHEDULED"
  )
}

/** 서버 의무 코드 → 시안 문구 「주문 배송 완료 · 고정 지급비 지급」 · 「쇼룸 공구 게시물 · 인스타그램 피드 1 · …」 */
export function dutyText(target: FulfillmentTarget | null | undefined): string {
  if (!target) {
    return "—"
  }
  const counts = target.counts
  const insta: Array<string> = []
  const parts: Array<string> = []
  for (const duty of target.duties) {
    switch (duty) {
      case "ORDER_DELIVERY":
        parts.push("주문 배송 완료")
        break
      case "FIXED_FEE_PAYMENT":
        parts.push("고정 지급비 지급")
        break
      case "SHOWROOM_POST":
        parts.push("쇼룸 공구 게시물")
        break
      case "FEED":
        insta.push(`피드 ${counts?.feed ?? ""}`.trim())
        break
      case "REELS":
        insta.push(`릴스 ${counts?.reels ?? ""}`.trim())
        break
      case "STORY":
        insta.push(`스토리 ${counts?.story ?? ""}`.trim())
        break
    }
  }
  if (insta.length > 0) {
    parts.push(`인스타그램 ${insta.join(" · ")}`)
  }
  return parts.join(" · ") || "—"
}

/** 「공구 종료 후 · 브랜드 직접」 — 상태 카드 한 줄용 */
export function fixedFeeShort(detail: Detail): string {
  const { amount, triggerLabel } = detail.fixedFee
  if (amount === null) {
    return "없음"
  }
  return triggerLabel ? `${triggerLabel} · 브랜드 직접` : "브랜드 직접"
}

/** 상품명 끝의 용량·구성 표기 — 「50ml」 「120매」 「2개입」 「SPF50+」 「기획」 「리필」 */
const NAME_TAIL_TOKEN =
  /^(\d+(\.\d+)?\s*(ml|l|g|kg|mg|매|개입|개|입|ea|p)|spf\d+\+*|pa\+*|기획|세트|리필|단품|본품|대용량|미니)$/i

/** 두 단어가 한 품목인 이름 — 「클렌징 폼」을 「폼」으로 줄이면 무슨 상품인지 알 수 없다 */
const COMPOUND_ITEM_NAMES = new Set([
  "클렌징 폼",
  "클렌징 오일",
  "클렌징 워터",
  "클렌징 밤",
  "토너 패드",
  "선 크림",
  "선 스틱",
  "선 쿠션",
  "아이 크림",
  "핸드 크림",
  "립 밤",
  "립 틴트",
  "시트 마스크",
  "슬리핑 마스크",
  "바디 로션",
  "바디 워시",
])

/**
 * KPI 한 줄용 짧은 상품명 — 시안 「세럼 130 · 크림 88」(수분진정 세럼 30ml → 세럼).
 * 서버는 전체 상품명만 내리므로 끝의 용량·구성 표기를 떼고 품목 단어만 남긴다.
 */
export function shortProductName(name: string): string {
  const words = name
    .replace(/\[[^\]]*\]|\([^)]*\)/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  while (words.length > 1 && NAME_TAIL_TOKEN.test(words[words.length - 1])) {
    words.pop()
  }
  if (words.length === 0) {
    return name
  }
  const lastTwo = words.slice(-2).join(" ")
  if (words.length >= 2 && COMPOUND_ITEM_NAMES.has(lastTwo)) {
    return lastTwo
  }
  return words[words.length - 1]
}

/** 판매 수량 합계와 상품별 내역 — 「세럼 130 · 크림 88」 */
export function quantityText(detail: Detail) {
  const quantities = detail.sales?.itemQuantities ?? []
  const total = quantities.reduce((sum, item) => sum + item.quantity, 0)
  const names = quantities.map(
    item =>
      detail.items.find(product => product.productId === item.productId)
        ?.productName ?? "상품"
  )
  const shortNames = names.map(shortProductName)
  const breakdown = quantities
    .map((item, index) => {
      // 줄인 이름이 겹치면(수분 크림 · 영양 크림) 어느 상품인지 모르니 전체 이름을 쓴다
      const short = shortNames[index]
      const name =
        shortNames.indexOf(short) === shortNames.lastIndexOf(short)
          ? short
          : names[index]
      return `${name} ${item.quantity.toLocaleString("ko-KR")}`
    })
    .join(" · ")
  return { total, breakdown }
}

/**
 * 진행중에 무엇이 걸려 있는지 — 시안 B5 변종을 하나만 고른다.
 * 숨김 > 직권 중단 예고 > 검토 중 요청 > 연장 요청 응답 대기 순이다.
 */
export type SellingSituation =
  | "hidden"
  | "notice"
  | "brandRequest"
  | "myRequest"
  | "extensionPending"
  | "none"

export function sellingSituation(detail: Detail): SellingSituation {
  if (detail.post.status === "HIDDEN") {
    return "hidden"
  }
  if (
    detail.groupBuy.status === "SUSPENSION_SCHEDULED" &&
    detail.adminSuspension
  ) {
    return "notice"
  }
  if (detail.activeRequest) {
    return detail.activeRequest.mine ? "myRequest" : "brandRequest"
  }
  if (detail.extension?.status === "PENDING") {
    return "extensionPending"
  }
  return "none"
}

/**
 * 상세 헤더 `.page-d` — 시안 B13은 「중단 예정 …」 꼬리만 경고색 굵게 쓴다.
 * 그 꼬리를 `warn`으로 따로 돌려주고 나머지는 `text`로 이어 붙인다.
 */
export function headerMeta(detail: Detail): {
  text: string
  warn: string | null
} {
  const situation = isSelling(detail) ? sellingSituation(detail) : null
  if (situation === "notice") {
    const { groupBuy, brand, timeline } = detail
    return {
      text: [
        groupBuy.groupBuyNumber,
        brand.name,
        `진행 ${timeline.elapsedDays}일차`,
      ].join(" · "),
      warn: `중단 예정 ${dt(detail.adminSuspension?.executeScheduledAt)}`,
    }
  }
  return { text: headerMetaText(detail), warn: null }
}

function headerMetaText(detail: Detail): string {
  const { groupBuy, timeline, brand, post, afterEnd } = detail
  const head = [groupBuy.groupBuyNumber, brand.name]
  const startText =
    timeline.daysUntilStart !== null
      ? `시작까지 ${timeline.daysUntilStart}일`
      : "시작 시각 경과"

  switch (groupBuy.status) {
    case "PREPARING":
      if (post.status === "PENDING_APPROVAL") {
        return [...head, "게시물 검토 중", startText].join(" · ")
      }
      if (post.status === "REJECTED") {
        return [...head, "승인 반려", startText].join(" · ")
      }
      return [...head, `${d(groupBuy.createdAt)} 생성`, startText].join(" · ")
    case "READY":
      return [...head, "준비완료", startText].join(" · ")
    case "IN_PROGRESS":
    case "SUSPENSION_SCHEDULED": {
      const situation = sellingSituation(detail)
      const tail =
        situation === "hidden"
          ? `게시물 숨김 ${post.hidden?.hiddenDays ?? "—"}일차`
          : situation === "brandRequest" || situation === "myRequest"
            ? "중단 요청 검토 중"
            : situation === "extensionPending"
              ? "연장 요청 도착"
              : timeline.daysUntilEnd !== null
                ? `종료까지 ${timeline.daysUntilEnd}일`
                : null
      return [...head, `진행 ${timeline.elapsedDays}일차`, tail]
        .filter(Boolean)
        .join(" · ")
    }
    case "ENDED": {
      const fulfillment = afterEnd?.fulfillment
      const disputed =
        fulfillment?.mine?.result === "UNFULFILLED" ||
        fulfillment?.theirs?.result === "UNFULFILLED"
      const tail =
        disputed && fulfillment?.onHold
          ? "이행 이슈 진행 중"
          : fulfillment?.mine && fulfillment.theirs
            ? "이행 확인 완료"
            : "정산 대기"
      return [...head, `${d(groupBuy.endedAt)} 종료`, tail].join(" · ")
    }
    case "SETTLED":
      return [
        ...head,
        `${d(groupBuy.settledAt ?? detail.settlement?.settledAt)} 정산 완료`,
      ].join(" · ")
    case "SUSPENDED":
      return [...head, `${d(groupBuy.endedAt)} 중단`].join(" · ")
    default:
      return head.join(" · ")
  }
}

/** 이력에서 특정 사건의 가장 최근 시각 */
export function lastEventAt(
  detail: Detail,
  eventType: Detail["history"][number]["eventType"]
): string | null {
  return (
    detail.history.find(entry => entry.eventType === eventType)?.occurredAt ??
    null
  )
}
