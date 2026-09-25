import DetailCard, { FieldRow } from "@/common/components/DetailCard/DetailCard"
import {
  FLINK_CLASS,
  FSUB_CLASS,
} from "@/features/contracts/components/shared/styles"
import type { CreatorContractDetailResponse } from "@/features/contracts/types"
import {
  CLOSED_VIEWS,
  type CreatorViewState,
} from "@/features/contracts/utils/contractView"
import { formatKRW, periodText } from "@/features/contracts/utils/format"

interface ContractTermsCardProps {
  detail: CreatorContractDetailResponse
  view: CreatorViewState
  onOpenThread: () => void
}

/** 「계약 조건」 — 브랜드가 작성한 조건. 이 화면에서 수정할 수 없다(§27-4) */
export default function ContractTermsCard(props: ContractTermsCardProps) {
  const { detail, view, onOpenThread } = props
  const { brand, period, fixedFee, permissions } = detail
  const isClosed = CLOSED_VIEWS.includes(view)
  const text = periodText(period.startAt, period.endAt)

  return (
    <DetailCard
      title="계약 조건"
      note={
        isClosed
          ? "종결된 계약 · 읽기 전용"
          : "브랜드가 작성한 조건 · 이 화면에서 수정할 수 없습니다"
      }
    >
      <FieldRow label="브랜드">
        {brand.name}{" "}
        {permissions.canOpenThread && (
          <button type="button" className={FLINK_CLASS} onClick={onOpenThread}>
            스레드 열기
          </button>
        )}
      </FieldRow>
      <FieldRow label="공구명">
        {detail.title}
        {!isClosed && (
          <div className={FSUB_CLASS}>
            브랜드 내부 관리용 이름 · 소비자에게 보이는 게시물 제목은 내가 따로
            씁니다
          </div>
        )}
      </FieldRow>
      <FieldRow label="공구 기간">
        <span className="tabular-nums">
          {text ?? "—"}
          {period.days !== null && (
            <span className="text-sz-n-500"> ({period.days}일)</span>
          )}
        </span>
      </FieldRow>
      <FieldRow label="고정 지급비">
        <span className="tabular-nums">{formatKRW(fixedFee.amount ?? 0)}</span>
        <div className={FSUB_CLASS}>
          {isClosed ? (
            <>
              계약이 성립하지 않아{" "}
              <b className="font-semibold text-sz-n-700">지급되지 않았습니다</b>
            </>
          ) : fixedFee.amount ? (
            <>
              브랜드가 <b className="font-semibold text-sz-n-700">직접 지급</b>
              하는 금액입니다 · 지급 시점{" "}
              <b className="font-semibold text-sz-n-700">
                {fixedFee.triggerLabel ?? "—"}
              </b>
              (브랜드가 계약서에 기재) · 플랫폼을 거치지 않습니다
            </>
          ) : (
            "고정 지급비가 없는 계약입니다"
          )}
        </div>
      </FieldRow>
    </DetailCard>
  )
}
