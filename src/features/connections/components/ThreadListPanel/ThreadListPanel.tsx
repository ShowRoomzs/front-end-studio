import { Input } from "@/components/ui/input"
import CounterpartAvatar from "@/features/connections/components/CounterpartAvatar/CounterpartAvatar"
import type { ConnectionRequestItem } from "@/features/connections/services/connectionService"
import type { ThreadListItem } from "@/features/connections/services/threadService"
import {
  formatElapsedDays,
  formatRelativeTime,
} from "@/features/connections/utils/format"
import { cn } from "@/lib/utils"

export type ConnectionTab = "connected" | "requests"

interface ThreadListPanelProps {
  activeTab: ConnectionTab
  onChangeTab: (tab: ConnectionTab) => void
  /** "요청함" 탭 배지 — 0이면 숨긴다(§14-3) */
  pendingRequestCount: number

  keyword: string
  onKeywordChange: (keyword: string) => void
  isLoading: boolean

  threads: Array<ThreadListItem>
  selectedThreadId: number | null
  onSelectThread: (threadId: number) => void

  /** 아직 처리하지 않은 요청 */
  pendingRequests: Array<ConnectionRequestItem>
  /** 이미 수락·거절한 요청 — 흐리게 이력으로만 보여준다 */
  resolvedRequests: Array<ConnectionRequestItem>
}

/**
 * 좌측 목록 (시안 `.cs-list`).
 *
 * 파트너센터와 달리 **연결 요청 발신 버튼이 없다** — 연결은 항상 브랜드가
 * 발신하고 인플루언서는 수락/거절만 한다(§14-2). 대신 연결됨/요청함 2탭이다.
 */
export default function ThreadListPanel(props: ThreadListPanelProps) {
  const {
    activeTab,
    onChangeTab,
    pendingRequestCount,
    keyword,
    onKeywordChange,
    isLoading,
    threads,
    selectedThreadId,
    onSelectThread,
    pendingRequests,
    resolvedRequests,
  } = props

  const isConnected = activeTab === "connected"
  const hasRequests = pendingRequests.length + resolvedRequests.length > 0

  return (
    <div className="flex w-[320px] shrink-0 flex-col border-r border-sz-n-200 bg-white">
      <div className="shrink-0 border-b border-sz-n-100 p-3.5">
        <Input
          value={keyword}
          onChange={event => onKeywordChange(event.target.value)}
          placeholder="브랜드명 검색"
        />

        {/* 시안 `.cs-tabs` */}
        <div className="mt-2.5 flex gap-1.5">
          {(
            [
              { value: "connected", label: "연결됨", badge: 0 },
              {
                value: "requests",
                label: "요청함",
                badge: pendingRequestCount,
              },
            ] as const
          ).map(tab => {
            const isOn = tab.value === activeTab

            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => onChangeTab(tab.value)}
                className={cn(
                  "flex flex-1 items-center justify-center gap-[5px] rounded-[6px] border px-1 py-[7px] text-[11px] font-medium",
                  isOn
                    ? "border-sz-accent-500 bg-sz-accent-500 text-white"
                    : "border-sz-n-300 bg-white text-sz-n-600 hover:bg-sz-n-50"
                )}
              >
                {tab.label}
                {tab.badge > 0 && (
                  <span
                    className={cn(
                      "flex h-[15px] min-w-[15px] items-center justify-center rounded-lg px-1 text-[10px] text-white",
                      isOn ? "bg-white/35" : "bg-sz-danger-text"
                    )}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading && (
          <div className="px-4 py-8 text-center text-[12px] text-sz-n-500">
            불러오는 중…
          </div>
        )}

        {isConnected
          ? threads.map(thread => (
              <button
                key={thread.threadId}
                type="button"
                onClick={() => onSelectThread(thread.threadId)}
                className={cn(
                  "flex w-full gap-2.5 border-b px-3.5 py-[13px] text-left",
                  thread.operatorChannel
                    ? "border-sz-n-200"
                    : "border-sz-n-100",
                  thread.threadId === selectedThreadId
                    ? "bg-sz-accent-50 shadow-[inset_3px_0_0_var(--color-sz-accent-500)]"
                    : "hover:bg-sz-n-50"
                )}
              >
                <CounterpartAvatar
                  name={thread.counterpartName}
                  imageUrl={thread.counterpartImageUrl}
                  isOperator={thread.operatorChannel}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="truncate text-[13px] font-semibold text-sz-n-900">
                      {thread.counterpartName}
                    </span>
                    <span className="shrink-0 text-[11px] text-sz-n-400">
                      {formatRelativeTime(thread.lastMessageAt)}
                    </span>
                  </div>
                  <div className="mt-[3px] flex items-center justify-between gap-2">
                    <span className="min-w-0 flex-1 truncate text-[12px] text-sz-n-500">
                      {thread.lastMessagePreview ?? ""}
                    </span>
                    {thread.unreadCount > 0 && (
                      <span className="inline-flex h-[18px] min-w-[18px] shrink-0 items-center justify-center rounded-[9px] bg-sz-accent-500 px-[5px] text-[11px] font-semibold text-white">
                        {thread.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))
          : /*
              요청함 탭은 대기중 항목과 처리 이력을 함께 보여준다. 이력은 흐리게
              깔아 두고 우측 카드 패널에는 띄우지 않는다 — 중복 표기 방지(§14-4).
            */
            [...pendingRequests, ...resolvedRequests].map(request => {
              const isPending = request.status === "REQUESTED"

              return (
                <div
                  key={request.connectionId}
                  className={cn(
                    "flex gap-2.5 border-b border-sz-n-100 px-3.5 py-[13px]",
                    !isPending && "opacity-70"
                  )}
                >
                  <CounterpartAvatar
                    name={request.marketName}
                    imageUrl={request.marketImageUrl}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="truncate text-[13px] font-semibold text-sz-n-900">
                        {request.marketName}
                      </span>
                      <span className="shrink-0 text-[11px] text-sz-n-400">
                        {formatElapsedDays(request.requestedAt)}
                      </span>
                    </div>
                    <div
                      className={cn(
                        "mt-[3px] truncate text-[12px]",
                        request.status === "CONNECTED" &&
                          "text-sz-success-text",
                        request.status === "REJECTED" && "text-sz-danger-text",
                        isPending && "text-sz-n-500"
                      )}
                    >
                      {request.status === "CONNECTED"
                        ? "수락함"
                        : request.status === "REJECTED"
                          ? "거절함"
                          : "요청 도착"}
                    </div>
                  </div>
                </div>
              )
            })}

        {!isLoading && !isConnected && !hasRequests && (
          <div className="px-5 py-10 text-center text-[12px] text-sz-n-400">
            받은 요청이 없습니다
          </div>
        )}
      </div>
    </div>
  )
}
