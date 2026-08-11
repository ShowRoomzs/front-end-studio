import { Button } from "@/components/ui/button"
import CounterpartAvatar from "@/features/connections/components/CounterpartAvatar/CounterpartAvatar"
import { useRespondToRequest } from "@/features/connections/hooks/useRespondToRequest"
import type { ConnectionRequestItem } from "@/features/connections/services/connectionService"
import { formatElapsedDays } from "@/features/connections/utils/format"

interface RequestInboxPanelProps {
  /** 아직 처리하지 않은 요청만 — 이력은 좌측 목록에만 보여준다(§14-4) */
  requests: Array<ConnectionRequestItem>
}

/**
 * 연결 요청함 (시안 S12·S13, `.req-panel`).
 *
 * 카드마다 개별로 수락/거절한다 — 일괄 처리는 없다. 수락 단계는 필수라
 * 자동 수락 옵션도 두지 않는다(거래플로우 §2: 인플루언서 모르게 연결되지 않도록).
 * 브랜드 업종·카테고리는 서버가 수집하지 않는 정보라 표기하지 않는다(v0.23 정정).
 */
export default function RequestInboxPanel(props: RequestInboxPanelProps) {
  const { requests } = props
  const { respond, respondingId } = useRespondToRequest()

  if (requests.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-sz-n-50 p-10 text-center">
        <div className="text-[40px]">📭</div>
        <div className="text-[16px] font-semibold text-sz-n-700">
          받은 연결 요청이 없습니다
        </div>
        <div className="max-w-[340px] text-[12px] leading-relaxed text-sz-n-500">
          브랜드가 연결을 요청하면 여기에 표시됩니다.
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-3.5 overflow-y-auto bg-sz-n-50 p-5">
      {requests.map(request => {
        const isResponding = respondingId === request.connectionId

        return (
          <div
            key={request.connectionId}
            className="rounded-lg border border-sz-n-200 bg-white p-4"
          >
            <div className="flex items-center gap-3.5">
              <CounterpartAvatar
                name={request.marketName}
                imageUrl={request.marketImageUrl}
                className="h-11 w-11"
              />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-semibold text-sz-n-900">
                  {request.marketName}
                </div>
                <div className="mt-[3px] text-[11px] text-sz-n-500">
                  {formatElapsedDays(request.requestedAt)} 요청
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={respondingId !== null}
                  isLoading={isResponding}
                  onClick={() => void respond(request.connectionId, "reject")}
                >
                  거절
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={respondingId !== null}
                  onClick={() => void respond(request.connectionId, "accept")}
                >
                  수락
                </Button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
