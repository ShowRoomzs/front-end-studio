import { useNow } from "@/features/home/hooks/useNow"
import {
  useGetNotifications,
  useGetNotificationSummary,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
} from "@/features/home/hooks/useNotifications"
import type { NotificationItem } from "@/features/home/types"
import { formatRelative } from "@/features/home/utils/date"
import { notificationDestination } from "@/features/home/utils/navigation"
import { cn } from "@/lib/utils"
import { Bell } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"

/** 제목 안의 `emphasis`(상대 이름 · 공구명 · 금액)만 굵게 — 시안 `.nt-x b` */
function Title(props: { item: NotificationItem }) {
  const { title, body, emphasis } = props.item
  const index = emphasis ? title.indexOf(emphasis) : -1
  const text =
    index < 0 || !emphasis ? (
      title
    ) : (
      <>
        {title.slice(0, index)}
        <b className="font-bold">{emphasis}</b>
        {title.slice(index + emphasis.length)}
      </>
    )
  return (
    <div className="text-[12px] leading-[1.5] text-sz-n-900">
      {text}
      {body && ` · ${body}`}
    </div>
  )
}

function Row(props: {
  item: NotificationItem
  now: number
  onSelect: (item: NotificationItem) => void
}) {
  const { item, now, onSelect } = props
  const destination = notificationDestination(item.target)

  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      className={cn(
        "flex w-full cursor-pointer gap-2.5 border-t border-sz-n-100 px-3.5 py-[11px] text-left first:border-t-0",
        item.read ? "hover:bg-sz-n-50" : "bg-sz-accent-50"
      )}
    >
      <span
        className={cn(
          "mt-[7px] size-1.5 shrink-0 rounded-full",
          item.read ? "bg-transparent" : "bg-sz-accent-500"
        )}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <Title item={item} />
        <div className="mt-[3px] flex items-center gap-1.5 text-[10px] text-sz-n-500">
          <span className="rounded-[3px] bg-sz-n-100 px-[5px] py-px font-semibold text-sz-n-600">
            {item.category}
          </span>
          {item.actorLabel} · {formatRelative(item.createdAt, now)}
        </div>
      </div>
      {destination && (
        <span className="shrink-0 self-center text-[10px] text-sz-n-400">
          {destination.label} ›
        </span>
      )}
    </button>
  )
}

/**
 * 탑바 알림 종 + 드롭다운 — 시안 ui-studio-14 H1a(모든 페이지 공통 · 인플루언서명 옆).
 *
 * - 배지 = 안 읽은 수(인디고 · 숫자만 · 60초 폴링) · 0이면 배지 없음
 * - 목록은 열 때 부른다 — 최근 30일(서버 보관 기간) · 전체 목록 화면 없음(MVP)
 * - 항목을 누르면 읽음 처리하고 그 건의 상세로 이동한다(알림 안에 버튼 없음)
 * - [모두 읽음]은 배지만 지운다(목록은 남는다)
 *
 * 혼자 동작한다(props 없음) — 셸 Header 의 계정 칩 왼쪽에 `<NotificationBell />`로 꽂는다.
 */
export default function NotificationBell(props: { className?: string }) {
  const { className } = props
  const [isOpen, setIsOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const now = useNow()

  const { data: summary, refetch: refetchSummary } = useGetNotificationSummary()
  const list = useGetNotifications(isOpen)
  const { mutate: markRead } = useMarkNotificationRead()
  const { mutate: markAllRead, isPending: isMarkingAll } =
    useMarkAllNotificationsRead()

  const unreadCount = summary?.unreadCount ?? 0
  const items = list.data?.content ?? []

  useEffect(() => {
    if (!isOpen) {
      return
    }
    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handlePointerDown)
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("mousedown", handlePointerDown)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen])

  const toggle = () => {
    if (!isOpen) {
      // 열 때 배지도 맞춘다 — 폴링 사이에 온 알림이 목록에만 보이지 않게
      void refetchSummary()
    }
    setIsOpen(open => !open)
  }

  const handleSelect = (item: NotificationItem) => {
    if (!item.read) {
      markRead(item.notificationId)
    }
    const destination = notificationDestination(item.target)
    if (destination) {
      setIsOpen(false)
      navigate(destination.path)
    }
  }

  const hasUnread = unreadCount > 0 || items.some(item => !item.read)

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={toggle}
        aria-label={unreadCount > 0 ? `알림 ${unreadCount}건` : "알림"}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        className="relative flex size-8 cursor-pointer items-center justify-center rounded-[6px] border border-sz-n-200 bg-white text-sz-n-600 hover:bg-sz-n-50"
      >
        <Bell className="size-4" aria-hidden />
        {unreadCount > 0 && (
          <span className="absolute -right-1.5 -top-[5px] flex h-4 min-w-4 items-center justify-center rounded-[8px] bg-sz-accent-500 px-1 text-[10px] font-semibold tabular-nums text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-label="알림"
          className="absolute right-0 top-[calc(100%+10px)] z-40 w-[380px] rounded-[8px] border border-sz-n-200 bg-white text-left shadow-[0_8px_24px_rgba(26,27,31,0.12),0_2px_6px_rgba(26,27,31,0.08)]"
        >
          <div className="flex items-center border-b border-sz-n-100 px-3.5 py-3 text-[13px] font-semibold text-sz-n-900">
            알림
            <button
              type="button"
              onClick={() => markAllRead()}
              disabled={!hasUnread || isMarkingAll}
              className="ml-auto cursor-pointer text-[11px] font-medium text-sz-accent-600 hover:underline disabled:cursor-default disabled:text-sz-n-400 disabled:no-underline"
            >
              모두 읽음
            </button>
          </div>

          <div className="max-h-[420px] overflow-y-auto">
            {list.isPending ? (
              <div className="px-3.5 py-6 text-center text-[12px] text-sz-n-500">
                불러오는 중…
              </div>
            ) : list.isError ? (
              <div className="px-3.5 py-6 text-center text-[12px] text-sz-n-500">
                알림을 불러오지 못했어요
              </div>
            ) : items.length === 0 ? (
              <div className="px-3.5 py-6 text-center text-[12px] text-sz-n-500">
                최근 30일 동안 받은 알림이 없어요
              </div>
            ) : (
              items.map(item => (
                <Row
                  key={item.notificationId}
                  item={item}
                  now={now}
                  onSelect={handleSelect}
                />
              ))
            )}
          </div>

          <div className="border-t border-sz-n-100 px-3.5 py-[9px] text-center text-[10px] text-sz-n-500">
            최근 30일 알림까지 보여요
          </div>
        </div>
      )}
    </div>
  )
}
