import { HOME_PATHS } from "@/features/home/constants/params"
import type { HomeTarget, NotificationTarget } from "@/features/home/types"

/** 홈 할 일 · 다가오는 일정의 목적지 — 목록이 아니라 그 건의 상세 */
export function homeTargetPath(target: HomeTarget): string | null {
  switch (target.type) {
    case "SETTLEMENT":
      return target.id == null
        ? HOME_PATHS.SETTLEMENT_LIST
        : HOME_PATHS.settlement(target.id)
    case "CONTRACT":
      return target.id == null ? null : HOME_PATHS.contract(target.id)
    case "GROUP_BUY":
      return target.id == null ? null : HOME_PATHS.groupBuy(target.id)
    case "CONNECTION_REQUESTS":
      return HOME_PATHS.CONNECTION_REQUESTS
    default:
      return null
  }
}

/**
 * 알림의 목적지 · 줄 끝 표시(시안 `.nt-to` 「계약 상세 ›」).
 * 상태를 재현하지 않고 지금 상태의 상세로 간다(1017 설계서 1-0 ④). 스튜디오에 화면이 없는 대상(주문 · 문의 · 상품 ·
 * 약관 · 앱 설정)은 이동하지 않는다 — 읽음 처리만 한다.
 */
export function notificationDestination(
  target: NotificationTarget | null
): { path: string; label: string } | null {
  if (!target?.type) {
    return null
  }
  const { type, id, sub } = target
  switch (type) {
    case "CONTRACT":
      return id == null
        ? null
        : { path: HOME_PATHS.contract(id), label: "계약 상세" }
    case "GROUP_BUY":
      return id == null
        ? null
        : { path: HOME_PATHS.groupBuy(id), label: "공구 상세" }
    case "SETTLEMENT":
    case "ADJUSTMENT":
      // ADJUSTMENT 의 id 는 settlement_id — 조정 협의는 정산 상세에서 이슈 스레드로 이어진다
      return id == null
        ? null
        : { path: HOME_PATHS.settlement(id), label: "정산 상세" }
    case "CONNECTION_REQUESTS":
      return { path: HOME_PATHS.CONNECTION_REQUESTS, label: "연결 요청" }
    case "THREAD":
      return id == null
        ? null
        : { path: HOME_PATHS.thread(id), label: "연결·소통" }
    case "POST":
      return id == null ? null : { path: HOME_PATHS.post(id), label: "게시물" }
    case "SHOWROOM":
      return { path: HOME_PATHS.SHOWROOM, label: "쇼룸 관리" }
    case "BASIC_INFO_TAB":
      return {
        path: HOME_PATHS.basicInfo(
          sub === "ACCOUNT"
            ? "account"
            : sub === "SETTLEMENT"
              ? "settlement"
              : undefined
        ),
        label: "기본정보 관리",
      }
    default:
      return null
  }
}

/**
 * [운영팀에 소명하기] 목적지 — 정지 카드가 붙은 내 운영팀 채널(시안 13 S8). 스레드 id가 없으면 연결·소통 첫 화면.
 */
export function appealPath(
  sanction: { operatorChannelThreadId: number | null } | null
): string {
  return sanction?.operatorChannelThreadId != null
    ? HOME_PATHS.thread(sanction.operatorChannelThreadId)
    : "/connections"
}
