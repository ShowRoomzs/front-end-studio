import DetailCard from "@/common/components/DetailCard/DetailCard"
import Notice from "@/common/components/Notice/Notice"
import SuspensionNotice from "@/common/components/Suspension/SuspensionNotice"
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
  terminated: "종결됨 · 체결 후 해지",
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
    <DetailCard
      title={view === "terminated" ? "계약 진행" : "서명 진행"}
      note={NOTE_BY_VIEW[view]}
    >
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
      {view === "terminated" && (
        <Notice tone="neutral" className="mb-4">
          {detail.groupBuy.groupBuyId === null ? (
            <>
              <b className="font-semibold">
                체결된 계약이 공구 오픈 전에 해지되었습니다.
              </b>{" "}
              공구는 생성되지 않으며 내가 할 조치는 없습니다.
            </>
          ) : (
            // 시안 S10은 공구 생성 전 해지만 그린다 — 생성 뒤 · 오픈 전 해지는 공구도 함께 종결된다(1021 설계서 1-4)
            <>
              <b className="font-semibold">
                체결된 계약이 공구 오픈 전에 해지되었습니다.
              </b>{" "}
              생성된 공구도 함께 종결되었으며 내가 할 조치는 없습니다.
            </>
          )}
          <br />
          운영자가 직권으로 해지 · 취소하는 경우에는{" "}
          <b className="font-semibold">
            상대방 동의를 운영팀 채널에서 확인한 뒤
          </b>{" "}
          처리됩니다.
          <br />
          고정 지급비 등 당사자 간 청구는{" "}
          <b className="font-semibold">계약서</b>에 따릅니다.
        </Notice>
      )}
      {/* 브랜드의 해지 요청이 처리 대기 중(1021 기-05) — 시안에 없는 안내라 문구를 최소로 둔다 */}
      {detail.terminationRequested && (
        <Notice tone="neutral" className="mb-4">
          <b className="font-semibold">
            브랜드가 이 계약의 해지를 요청했습니다.
          </b>{" "}
          사유 {detail.terminationRequested.reasonLabel}
          {detail.terminationRequested.memo &&
            ` · ${detail.terminationRequested.memo}`}{" "}
          · {formatDateTimeShort(detail.terminationRequested.requestedAt)}
          <br />
          의견은 <b className="font-semibold">운영팀 채널</b>에서 받습니다 —
          동의하시면 운영팀 채널에 답해 주세요. 운영자가 처리하기 전까지 계약은
          그대로 유지됩니다.
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

      {/* 시안 13 S3 — 내 정지로 체결 보류(서버 `sanctionHold.kind = MINE`). 상태는 서명 진행중 그대로다 */}
      {isSigning && detail.sanctionHold?.kind === "MINE" && (
        <SuspensionNotice tone="warning" className="mt-3">
          <b>계정 이용 정지 중이라 체결이 보류됩니다.</b> 서명은 해 둘 수 있지만
          정지가 풀리기 전에는 운영자가 체결 완료 처리를 하지 않고, 서명 기한도
          멈춥니다.
        </SuspensionNotice>
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
            양측이 모두 서명하면 계약이 성립합니다.
          </b>{" "}
          이후 운영자가 확인해 <b className="font-semibold">공구를 생성</b>
          하며, 그때 서명 PDF·감사추적인증서가 등록됩니다.
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
