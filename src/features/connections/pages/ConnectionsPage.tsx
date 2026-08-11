import useDebounce from "@/common/hooks/useDebounce"
import RequestInboxPanel from "@/features/connections/components/RequestInboxPanel/RequestInboxPanel"
import ThreadListPanel, {
  type ConnectionTab,
} from "@/features/connections/components/ThreadListPanel/ThreadListPanel"
import ThreadPanel from "@/features/connections/components/ThreadPanel/ThreadPanel"
import { useGetConnectionRequests } from "@/features/connections/hooks/useGetConnectionRequests"
import { useGetThreadList } from "@/features/connections/hooks/useGetThreadList"
import { useGetThreadSummary } from "@/features/connections/hooks/useGetThreadSummary"
import { useState } from "react"
import { useSearchParams } from "react-router-dom"

/**
 * 연결·소통 (§14) — 좌측 2탭 목록(연결됨/요청함) + 우측 스레드 또는 요청함 패널.
 *
 * 탭·선택 스레드를 경로가 아니라 쿼리파라미터로 들고 있는다 — 상대를 바꾸는 건
 * 화면 이동이 아니라 같은 화면 안의 선택이라, 라우트를 갈아끼우면 목록까지
 * 불필요하게 다시 마운트된다.
 */
export default function ConnectionsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [keyword, setKeyword] = useState("")
  const debouncedKeyword = useDebounce(keyword, 300)

  const activeTab: ConnectionTab =
    searchParams.get("tab") === "requests" ? "requests" : "connected"

  const { data: summary } = useGetThreadSummary()
  const { data: threadPage, isLoading: isThreadsLoading } =
    useGetThreadList(debouncedKeyword)
  const {
    pending,
    resolved,
    isLoading: isRequestsLoading,
  } = useGetConnectionRequests(debouncedKeyword)

  const threads = threadPage?.content ?? []
  const threadIdParam = Number(searchParams.get("threadId"))
  const selectedThread =
    threads.find(thread => thread.threadId === threadIdParam) ?? threads[0]

  return (
    <div className="flex min-h-0 flex-1 border-t border-sz-n-200">
      <ThreadListPanel
        activeTab={activeTab}
        onChangeTab={tab =>
          setSearchParams(tab === "requests" ? { tab } : {}, { replace: true })
        }
        pendingRequestCount={summary?.pendingRequestCount ?? 0}
        keyword={keyword}
        onKeywordChange={setKeyword}
        isLoading={
          activeTab === "connected" ? isThreadsLoading : isRequestsLoading
        }
        threads={threads}
        selectedThreadId={selectedThread?.threadId ?? null}
        onSelectThread={threadId =>
          setSearchParams({ threadId: String(threadId) })
        }
        pendingRequests={pending}
        resolvedRequests={resolved}
      />

      {activeTab === "requests" ? (
        <RequestInboxPanel requests={pending} />
      ) : selectedThread ? (
        <ThreadPanel key={selectedThread.threadId} thread={selectedThread} />
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 bg-sz-n-50 p-10 text-center">
          <div className="text-[13px] font-semibold text-sz-n-600">
            대화를 선택해 주세요
          </div>
          <div className="max-w-[280px] text-[12px] leading-relaxed text-sz-n-500">
            좌측 목록에서 상대를 선택하면 대화 내용이 표시됩니다.
          </div>
        </div>
      )}
    </div>
  )
}
