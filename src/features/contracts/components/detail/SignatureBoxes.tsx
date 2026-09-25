import { formatDateTimeShort } from "@/common/utils/formatDate"
import type { CreatorContractSignature } from "@/features/contracts/types"
import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

interface SignatureBoxesProps {
  brandName: string
  myName: string
  signature: CreatorContractSignature
  /** 「N 기준」을 그릴지 — 체결완료·종결에서는 숨긴다 */
  showAsOf: boolean
  /** 만료 화면 — 대기 문구 대신 「미서명」 */
  isExpired?: boolean
}

/**
 * 시안 `.signs` — 브랜드 칸이 왼쪽, 내 칸(인플루언서)이 오른쪽에서 액센트로 강조된다.
 * 서명 버튼은 없다 — 링크는 모두싸인이 메일·문자로 직접 보낸다(§25-3 #1).
 * 값은 운영자가 확인한 시점 기준이라 그 시각을 아래에 밝힌다.
 */
export default function SignatureBoxes(props: SignatureBoxesProps) {
  const { brandName, myName, signature, showAsOf, isExpired = false } = props

  return (
    <>
      <div className="mt-4 flex gap-3">
        <SignBox who="브랜드" name={brandName}>
          {signature.brandSignedAt ? (
            <Done at={signature.brandSignedAt} />
          ) : (
            <div className="text-[11px] text-sz-n-500">
              {isExpired
                ? "미서명"
                : "서명 대기 · 브랜드도 요청 메일·문자를 받았습니다"}
            </div>
          )}
        </SignBox>
        <SignBox mine who="인플루언서(나)" name={myName}>
          {signature.creatorSignedAt ? (
            <Done at={signature.creatorSignedAt} />
          ) : isExpired ? (
            <div className="text-[11px] text-sz-n-500">미서명</div>
          ) : (
            <>
              <div className="text-[11px] font-semibold tabular-nums text-sz-accent-600">
                서명 대기 · 기한 {formatDateTimeShort(signature.deadlineAt)}
              </div>
              <div className="mt-[5px] text-[11px] text-sz-n-500">
                메일 · 문자로 받은{" "}
                <b className="font-semibold text-sz-n-700">전자서명 링크</b>
                에서 서명합니다
              </div>
            </>
          )}
        </SignBox>
      </div>
      {showAsOf && signature.asOf && (
        <div className="mt-2.5 border-t border-sz-n-100 pt-[9px] text-[11px] leading-[1.6] text-sz-n-500">
          서명 현황은{" "}
          <b className="font-semibold text-sz-n-700">
            운영자가 모두싸인에서 확인한 시점
          </b>{" "}
          기준입니다 ·{" "}
          <span className="tabular-nums">
            {formatDateTimeShort(signature.asOf)} 기준
          </span>
        </div>
      )}
    </>
  )
}

function SignBox(props: {
  mine?: boolean
  who: string
  name: string
  children: ReactNode
}) {
  const { mine = false, who, name, children } = props
  return (
    <div
      className={cn(
        "flex-1 rounded-[6px] border p-[14px]",
        mine
          ? "border-sz-accent-100 bg-sz-accent-50"
          : "border-sz-n-200 bg-sz-n-50"
      )}
    >
      <div className="text-[11px] text-sz-n-500">{who}</div>
      <div className="mb-2.5 mt-1 text-[12px] font-semibold text-sz-n-900">
        {name}
      </div>
      {children}
    </div>
  )
}

function Done(props: { at: string }) {
  return (
    <div className="text-[11px] font-medium text-sz-success-text">
      ✓ 서명 완료{" "}
      <span className="font-normal tabular-nums text-sz-n-500">
        — {formatDateTimeShort(props.at)}
      </span>
    </div>
  )
}
