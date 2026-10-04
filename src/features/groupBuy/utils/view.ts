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

/** 판매 수량 합계와 상품별 내역 — 「세럼 130 · 크림 88」 */
export function quantityText(detail: Detail) {
  const quantities = detail.sales?.itemQuantities ?? []
  const total = quantities.reduce((sum, item) => sum + item.quantity, 0)
  const breakdown = quantities
    .map(item => {
      const name =
        detail.items.find(product => product.productId === item.productId)
          ?.productName ?? "상품"
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

/** 상세 헤더 `.page-d` */
export function headerMeta(detail: Detail): string {
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
          : situation === "notice"
            ? `중단 예정 ${dt(detail.adminSuspension?.executeScheduledAt)}`
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
