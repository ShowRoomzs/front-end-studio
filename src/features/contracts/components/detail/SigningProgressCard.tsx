import DetailCard from "@/common/components/DetailCard/DetailCard"
import Notice from "@/common/components/Notice/Notice"
import { formatDateTimeShort } from "@/common/utils/formatDate"
import SignatureBoxes from "@/features/contracts/components/detail/SignatureBoxes"
import Stepper from "@/features/contracts/components/detail/Stepper"
import type { CreatorContractDetailResponse } from "@/features/contracts/types"
import {
  buildStepper,
  type CreatorViewState,
} from "@/features/contracts/utils/contractView"

interface SigningProgressCardProps {
  detail: CreatorContractDetailResponse
  view: CreatorViewState
  myName: string
}

const NOTE_BY_VIEW: Record<CreatorViewState, string> = {
  signingNone: "운영자 검토 → 양측 동시 서명 요청",
  signingTheirs: "운영자 검토 → 양측 동시 서명 요청",
  signingMine: "운영자 검토 → 양측 동시 서명 요청",
  conclusionPending: "운영자 검토 → 양측 동시 서명 요청",
  concluded: "운영자 검토 → 양측 서명 → 운영자 체결 처리",
  declined: "종결됨",
  expired: "종결됨",
  canceled: "종결됨",
}

/**
 * 좌측 첫 카드 「서명 진행」 — 종결 배너 → 스텝퍼 → 서명 카드 2장 → 기준 시각 → 안내.
 * 내 몫이 남은 상태(S3a)는 경고 배너로 먼저 말하되, 배지는 정보색 그대로다(원칙 ③).
 */
export default function SigningProgressCard(props: SigningProgressCardProps) {
  const { detail, view, myName } = props
  const { signature, brand, closure } = detail
  const isSigning =
    view === "signingNone" || view === "signingTheirs" || view === "signingMine"
  const showBoxes =
    isSigning || view === "conclusionPending" || view === "concluded"

  return (
    <DetailCard title="서명 진행" note={NOTE_BY_VIEW[view]}>
      {view === "declined" && (
        <Notice tone="danger" className="mb-4">
          <b className="font-semibold">내가 이 계약을 거절했습니다.</b> 이
          계약은 종결되었고 되돌릴 수 없습니다. 연결은 그대로 유지되며, 브랜드가
          조건을 고쳐{" "}
          <b className="font-semibold">새 계약을 다시 보낼 수 있습니다</b>.
        </Notice>
      )}
      {view === "expired" && (
        <Notice tone="neutral" className="mb-4">
          <b className="font-semibold">서명 기한이 지나 종결되었습니다.</b> 누가
          거절한 것은 아니며, 브랜드가 같은 조건으로{" "}
          <b className="font-semibold">다시 보낼 수 있습니다</b>.
        </Notice>
      )}
      {view === "canceled" && (
        <Notice tone="neutral" className="mb-4">
          <b className="font-semibold">
            {closure.actorType === "SELLER"
              ? "브랜드가 이 계약을 철회했습니다."
              : "운영자가 이 계약을 취소 처리했습니다."}
          </b>{" "}
          내 서명 전에 종결되었으며 되돌릴 수 없습니다. 연결은 유지되므로 조건을
          다시 협의할 수 있습니다.
        </Notice>
      )}

      <Stepper steps={buildStepper(view, detail, myName)} />

      {showBoxes && (
        <SignatureBoxes
          brandName={brand.name}
          myName={myName}
          signature={signature}
          showAsOf={isSigning || view === "conclusionPending"}
        />
      )}

      {view === "signingTheirs" && (
        <Notice tone="warn" className="mt-3">
          <b className="font-semibold">
            브랜드가 서명을 완료했습니다. 내 서명만 남았습니다.
          </b>{" "}
          기한({formatDateTimeShort(signature.deadlineAt)})까지 서명하지 않으면
          계약이 <b className="font-semibold">만료</b>되고 공구가 생성되지
          않습니다 — 메일 · 문자로 받은{" "}
          <b className="font-semibold">전자서명 링크</b>에서 서명해 주세요 —
          링크를 찾을 수 없으면{" "}
          <b className="font-semibold">[서명 안내 다시 받기]</b>로 재발송을
          요청하세요.
        </Notice>
      )}

      {isSigning && (
        <Notice tone="info" className="mt-3">
          <b className="font-semibold">
            양측이 모두 서명해야 체결로 넘어갑니다.
          </b>{" "}
          서명이 끝나면 운영자가 확인해{" "}
          <b className="font-semibold">체결 완료 처리</b>를 하고, 그때 서명
          PDF·감사추적인증서가 발급되며 공구가 생성됩니다.
          <br />
          <b className="font-semibold">서명 현황은 운영자가 확인한 시점 기준</b>
          으로 표시됩니다 — 방금 서명했다면 아직 반영 전일 수 있습니다.
        </Notice>
      )}

      {view === "conclusionPending" && (
        <Notice tone="info" className="mt-3">
          <b className="font-semibold">
            양측 서명이 완료되어 운영자 확인을 기다립니다.
          </b>{" "}
          확인이 끝나면 체결완료로 바뀌고{" "}
          <b className="font-semibold">그때 공구가 생성</b>됩니다 —{" "}
          <b className="font-semibold">아직 공구는 만들어지지 않았습니다</b>.
          서명 PDF·감사추적인증서도 체결 처리 시 발급됩니다.
        </Notice>
      )}
    </DetailCard>
  )
}
