import DetailCard, { FieldRow } from "@/common/components/DetailCard/DetailCard"
import { formatDateTimeShort } from "@/common/utils/formatDate"
import type { CreatorContractDetailResponse } from "@/features/contracts/types"
import type { CreatorViewState } from "@/features/contracts/utils/contractView"

interface ClosureReasonCardProps {
  detail: CreatorContractDetailResponse
  view: CreatorViewState
}

/**
 * 종결 사유 카드 — 거절(S7)은 내가 입력한 사유, 취소(S9)는 브랜드 요청·운영자 기록 사유.
 * 만료는 사유가 없어 카드를 그리지 않는다.
 */
export default function ClosureReasonCard(props: ClosureReasonCardProps) {
  const { detail, view } = props
  const { closure, brand } = detail

  if (view !== "declined" && view !== "canceled") {
    return null
  }

  const isMine = view === "declined"

  return (
    <DetailCard
      title={isMine ? "거절 사유" : "취소 사유"}
      note={`${isMine ? "내가 입력한 사유" : closure.actorType === "SELLER" ? `${brand.name}가 입력한 사유` : "운영자가 기록한 사유"} · ${formatDateTimeShort(closure.closedAt)}`}
    >
      <FieldRow label="사유 구분">
        {closure.reasonLabel ?? closure.reasonCode ?? "—"}
      </FieldRow>
      <FieldRow label={isMine ? "브랜드에게 남긴 메모" : "메모"}>
        {closure.memo ? (
          <span className="whitespace-pre-line">{closure.memo}</span>
        ) : (
          <span className="text-sz-n-500">없음</span>
        )}
      </FieldRow>
    </DetailCard>
  )
}
