import DetailCard from "@/common/components/DetailCard/DetailCard"
import Notice from "@/common/components/Notice/Notice"
import { formatDateTimeShort } from "@/common/utils/formatDate"
import { TermRow, Terms } from "@/features/contracts/components/shared/Terms"
import { FSUB_CLASS } from "@/features/contracts/components/shared/styles"
import type {
  CreatorContractContent,
  CreatorContractDraftApproval,
} from "@/features/contracts/types"

interface DraftApprovalsCardProps {
  approvals: Array<CreatorContractDraftApproval>
  content: CreatorContractContent
}

/**
 * 시안 S6 「초안 승인 기록」(기-30) — 사전 검수 계약에서 브랜드가 콘텐츠 초안을 승인한 일시와 대상.
 * 브랜드가 남기는 기록이라 읽기 전용이다. 기록이 없으면 시안처럼 게시 포맷마다 「승인 전」을 보인다.
 */
export default function DraftApprovalsCard(props: DraftApprovalsCardProps) {
  const { approvals, content } = props
  const pendingFormats = [
    content.feedCount ? `피드 ${content.feedCount}` : null,
    content.reelsCount ? `릴스 ${content.reelsCount}` : null,
    content.storyCount ? `스토리 ${content.storyCount}` : null,
  ].filter((item): item is string => item !== null)
  const hasRows = approvals.length > 0 || pendingFormats.length > 0

  return (
    <DetailCard
      title="초안 승인 기록"
      note="사전 검수 · 브랜드가 콘텐츠 초안을 승인한 일시와 대상"
    >
      {hasRows && (
        <Terms>
          {approvals.length > 0
            ? approvals.map(approval => {
                const sub = [approval.sourceLabel, approval.note]
                  .filter(Boolean)
                  .join(" · ")
                return (
                  <TermRow key={approval.approvalId} label={approval.title}>
                    <span className="tabular-nums">
                      {formatDateTimeShort(approval.approvedAt)}
                    </span>{" "}
                    승인 · {approval.approvedByName}
                    {sub && <div className={FSUB_CLASS}>{sub}</div>}
                  </TermRow>
                )
              })
            : pendingFormats.map(format => (
                <TermRow key={format} label={format}>
                  <span className="text-sz-n-500">승인 전</span>
                </TermRow>
              ))}
        </Terms>
      )}
      <Notice tone="neutral" className={hasRows ? "mt-3" : undefined}>
        브랜드가 스레드에서 초안을 승인하면{" "}
        <b className="font-semibold">승인 일시와 대상</b>이 여기에 남습니다 · 이
        기록은 읽기 전용이며 바꿀 수 없습니다.
      </Notice>
    </DetailCard>
  )
}
