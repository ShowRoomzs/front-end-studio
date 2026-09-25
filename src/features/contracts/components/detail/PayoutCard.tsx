import DetailCard from "@/common/components/DetailCard/DetailCard"
import Notice from "@/common/components/Notice/Notice"
import { TermRow, Terms } from "@/features/contracts/components/shared/Terms"
import type {
  CreatorContractFixedFee,
  CreatorContractPayout,
} from "@/features/contracts/types"
import { formatKRW, formatPercent } from "@/features/contracts/utils/format"

interface PayoutCardProps {
  payout: CreatorContractPayout
  fixedFee: CreatorContractFixedFee
  isConcluded: boolean
}

/**
 * 시안 「내가 받는 금액」 — 스튜디오 전용 카드(§27-1 #4). 같은 값이 파트너센터에서는 내는 돈,
 * 여기서는 받는 돈이다. 플랫폼이 지급을 보증하지 않는다는 사실과 미지급 시 경로를 서명 전부터 밝힌다.
 * 종결 3종에서는 서버가 `payout`을 null로 내려 이 카드가 아예 그려지지 않는다.
 */
export default function PayoutCard(props: PayoutCardProps) {
  const { payout, fixedFee, isConcluded } = props
  const rates = payout.rewardRates
    .filter(rate => rate.productName !== null)
    .map((rate, index) => (
      <span key={`${rate.productName}-${index}`}>
        {index > 0 && " · "}
        {rate.productName}{" "}
        <b className="font-semibold text-sz-n-900">
          {formatPercent(rate.rate)}
        </b>
      </span>
    ))

  return (
    <DetailCard title="내가 받는 금액" note="공제 전 금액">
      <div className="mb-3 rounded-[6px] border border-sz-accent-100 bg-sz-accent-50 px-4 py-3.5">
        <div className="text-[11px] text-sz-n-600">고정 지급비</div>
        <div className="mt-0.5 text-[22px] font-semibold leading-[1.3] tabular-nums text-sz-accent-600">
          {formatKRW(payout.fixedFeeAmount ?? 0)}
        </div>
        <div className="mt-1 text-[11px] leading-[1.6] text-sz-n-600">
          {isConcluded && fixedFee.paymentState === "NOT_YET" ? (
            <>
              <b className="font-semibold text-sz-n-900">
                아직 지급되지 않았습니다.
              </b>{" "}
              계약서 기재 시점은{" "}
              <b className="font-semibold text-sz-n-900">
                {payout.fixedFeeTriggerLabel ?? "—"}
              </b>
              이며{" "}
              <b className="font-semibold text-sz-n-900">브랜드가 직접 지급</b>
              합니다.
            </>
          ) : isConcluded && fixedFee.paymentState === "RECORDED_BY_BRAND" ? (
            <>
              브랜드가{" "}
              <b className="font-semibold text-sz-n-900">지급 완료로 기록</b>
              했습니다. 플랫폼은 입금 여부를 확인하지 않으므로 받지 못했다면
              이슈 스레드에서 운영자 중재를 요청하세요.
            </>
          ) : (
            <>
              <b className="font-semibold text-sz-n-900">지급 시점</b> —
              계약서에{" "}
              <b className="font-semibold text-sz-n-900">
                {payout.fixedFeeTriggerLabel ?? "—"}
              </b>
              로 기재되어 있습니다.{" "}
              <b className="font-semibold text-sz-n-900">
                브랜드가 내 계좌로 직접 지급
              </b>
              하며 플랫폼을 거치지 않습니다.
            </>
          )}
        </div>
      </div>

      <Terms>
        <TermRow label="판매 리워드" className="tabular-nums">
          {rates.length > 0 ? rates : "—"} — 판매액에 리워드율을 곱해
          정산됩니다(상품별 차등)
        </TermRow>
        <TermRow label="정산 시점">
          공구 종료 후 <b className="font-semibold text-sz-n-900">정산 관리</b>
          에서 확인 · 지급됩니다
        </TermRow>
      </Terms>

      <Notice tone="consent" className="mt-3">
        표시된 금액은 <b className="font-semibold">세금 등 공제 전</b>{" "}
        기준입니다. 판매 리워드의 실제 입금액은{" "}
        <b className="font-semibold">정산 관리</b>에서 확인할 수 있습니다.
        <br />
        {!payout.platformGuaranteed && (
          <>
            <b className="font-semibold">
              고정 지급비는 브랜드가 직접 지급하며 플랫폼이 지급을 보증하거나
              대신 집행하지 않습니다.
            </b>{" "}
            지급되지 않으면 <b className="font-semibold">연결·소통</b>에서 이슈
            스레드를 열어 운영자 중재를 받을 수 있고, 이 계약서가 근거가 됩니다.
          </>
        )}
      </Notice>
    </DetailCard>
  )
}
