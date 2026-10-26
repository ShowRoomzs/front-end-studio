import DetailCard from "@/common/components/DetailCard/DetailCard"
import Notice from "@/common/components/Notice/Notice"
import StatusBadge from "@/common/components/StatusBadge/StatusBadge"
import { TermRow, Terms } from "@/features/contracts/components/shared/Terms"
import { FSUB_CLASS } from "@/features/contracts/components/shared/styles"
import { FIXED_FEE_TRIGGER_DEFINITION } from "@/features/contracts/constants/labels"
import type {
  CreatorContractFixedFee,
  CreatorContractPayout,
  CreatorContractSettlement,
} from "@/features/contracts/types"
import { formatKRW, formatPercent } from "@/features/contracts/utils/format"

interface PayoutCardProps {
  payout: CreatorContractPayout
  fixedFee: CreatorContractFixedFee
  settlement: CreatorContractSettlement
  isConcluded: boolean
}

const B = "font-semibold text-sz-n-900"

/**
 * 시안 「내가 받는 금액」 — 스튜디오 전용 카드(§27-1 #4). 같은 값이 파트너센터에서는 내는 돈,
 * 여기서는 받는 돈이다. 고정 지급비는 브랜드가 직접 지급하고 SHOWROOMZ는 지급을 보증하거나
 * 회수를 대행하지 않는다는 사실을 서명 전부터 밝힌다(기-09).
 * 종결 4종에서는 서버가 `payout`을 null로 내려 이 카드가 아예 그려지지 않는다.
 */
export default function PayoutCard(props: PayoutCardProps) {
  const { payout, fixedFee, settlement, isConcluded } = props
  const triggerLabel = payout.fixedFeeTriggerLabel ?? "—"
  // 기-28 — 지급 시점의 정의. 시안이 정한 문구가 먼저, 없으면 서버 정의
  const triggerDefinition =
    (payout.fixedFeeTrigger &&
      FIXED_FEE_TRIGGER_DEFINITION[payout.fixedFeeTrigger]) ??
    fixedFee.triggerDescription ??
    null
  const rates = payout.rewardRates
    .filter(rate => rate.productName !== null)
    .map((rate, index) => (
      <span key={`${rate.productName}-${index}`}>
        {index > 0 && " · "}
        {rate.productName} <b className={B}>{formatPercent(rate.rate)}</b>
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
          {isConcluded ? (
            <>
              지급 시점 <b className={B}>{triggerLabel}</b>(계약서 기재) ·{" "}
              <b className={B}>브랜드가 직접 지급</b>합니다.
            </>
          ) : (
            <>
              <b className={B}>지급 시점</b> — 계약서에{" "}
              <b className={B}>{triggerLabel}</b>로 기재되어 있습니다
              {triggerDefinition && (
                <span className="text-sz-n-500"> (= {triggerDefinition})</span>
              )}
              . <b className={B}>브랜드가 내 계좌로 직접 지급</b>하며 플랫폼을
              거치지 않습니다.
            </>
          )}
        </div>
        {/* 시안 S6 rev.3 — 지급 여부가 아니라 브랜드가 남긴 자기 신고 기록만 보인다 */}
        {isConcluded && (
          <Terms className="mt-2">
            <TermRow label="브랜드 지급 기록">
              <span className="text-sz-n-500">
                {fixedFee.paymentState === "RECORDED_BY_BRAND"
                  ? "브랜드가 지급 완료로 기록했습니다"
                  : "아직 기록이 없습니다"}
              </span>
              <div className={FSUB_CLASS}>
                브랜드가 지급한 뒤 계약 관리에 남기는{" "}
                <b className="font-semibold text-sz-n-700">자기 신고</b>입니다 ·
                플랫폼이 확인한 사실이 아니며 이 화면에서 바꿀 수 없습니다
              </div>
            </TermRow>
          </Terms>
        )}
      </div>

      <Terms>
        <TermRow label="판매 리워드" className="tabular-nums">
          {rates.length > 0 ? rates : "—"} —{" "}
          <b className={B}>판매 리워드 = 확정 거래액 × 리워드율</b>(상품별 차등)
        </TermRow>
        {settlement.rewardPayer && (
          <TermRow label="리워드 지급자">
            <b className={B}>{settlement.rewardPayer}</b>{" "}
            <span className="text-sz-n-500">· 브랜드가 아닙니다</span>
          </TermRow>
        )}
        <TermRow label="정산 시점">
          주문이 모두 종결되면 <b className={B}>정산 관리</b>에서 3영업일 확인 →
          자동 확정 → <b className={B}>N영업일 후</b> 지급{" "}
          <span className="whitespace-nowrap rounded-[4px] bg-sz-n-100 px-1.5 py-px text-[10px] font-medium text-sz-n-500">
            [정책값 미정]
          </span>
        </TermRow>
      </Terms>

      <SettlementMethod settlement={settlement} />

      <Notice tone="consent" className="mt-3">
        표시된 금액은 <b className="font-semibold">세금 등 공제 전</b>{" "}
        기준입니다. 판매 리워드의 실제 입금액은{" "}
        <b className="font-semibold">정산 관리</b>에서 확인할 수 있습니다.
        {!payout.platformGuaranteed && (
          <>
            <br />
            <b className="font-semibold">
              고정 지급비는 브랜드가 직접 지급하며 SHOWROOMZ는 지급을 보증하거나
              회수를 대행하지 않습니다.
            </b>{" "}
            당사자 간 청구는 <b className="font-semibold">계약서</b>에 따릅니다.
          </>
        )}
      </Notice>
    </DetailCard>
  )
}

/**
 * 시안 `.setl` 「정산 방식」(rev.4) — 내 사업자 구분에 따라 문구가 갈린다. 미리보기 금액은 서버 `netPreview`
 * (리워드 100,000원 예시)이고, 구분 값이 없으면(옛 배포 · 미입력) 블록을 그리지 않는다.
 */
function SettlementMethod(props: { settlement: CreatorContractSettlement }) {
  const { withholdingType, netPreview } = props.settlement
  if (!withholdingType) {
    return null
  }
  const isBusiness = withholdingType === "TAX_INVOICE"
  const won = (value: number) => value.toLocaleString("ko-KR")

  return (
    <div className="mt-3 rounded-[6px] border border-sz-n-200 bg-sz-n-50 px-[13px] py-[11px]">
      <div className="flex items-center gap-[7px] text-[12px] font-semibold text-sz-n-900">
        정산 방식
        <StatusBadge variant="neutral">
          {isBusiness ? "사업자" : "비사업자"}
        </StatusBadge>
      </div>
      <div className="mt-1 text-[11px] leading-[1.7] text-sz-n-600">
        {isBusiness ? (
          <>
            리워드는 <b className={B}>SHOWROOMZ가 지급</b>해요. 정산이 확정되면
            SHOWROOMZ 앞으로 세금계산서(리워드 + 부가세 10%)를 발행하고
            승인번호를 입력해 주세요. 확인 후 지급돼요.
          </>
        ) : (
          <>
            리워드는 <b className={B}>SHOWROOMZ가 지급</b>하며{" "}
            <b className={B}>3.3%(소득세 · 지방소득세)를 원천징수</b>한 뒤
            입금돼요. 원천징수영수증은 정산 화면에서 받을 수 있어요.
          </>
        )}
      </div>
      {netPreview && (
        <div className="mt-1.5 border-t border-sz-n-200 pt-1.5 text-[11px] tabular-nums text-sz-n-600">
          {isBusiness ? (
            <>
              예상 실수령 · 리워드 <b className={B}>{won(netPreview.gross)}</b>{" "}
              + 부가세{" "}
              <b className={B}>{won(netPreview.net - netPreview.gross)}</b> ={" "}
              <b className={B}>{won(netPreview.net)}원</b>
            </>
          ) : (
            <>
              예상 실수령 · 리워드{" "}
              <b className={B}>{won(netPreview.gross)}원</b> →{" "}
              <b className={B}>{won(netPreview.net)}원</b>
            </>
          )}
        </div>
      )}
    </div>
  )
}
