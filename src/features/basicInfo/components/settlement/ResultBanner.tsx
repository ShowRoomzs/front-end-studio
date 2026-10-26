import { useEffect, useRef } from "react"

import StatusBadge from "@/common/components/StatusBadge/StatusBadge"
import { RequestBox } from "@/features/basicInfo/components/parts"
import type {
  BusinessTypeChangeBanner,
  SettlementInfoResponse,
} from "@/features/basicInfo/types"

/**
 * 사업자 구분 변경 승인 배너(T5 개인사업자 · T10 비사업자) — 탭 맨 위.
 *
 * 「이 안내는 한 번만 보입니다」(T5) — 보여 준 직후 [닫기](`…/acknowledge`)를 조용히 부른다.
 * 지금 화면에서는 배너가 남고 다음 진입부터 사라진다(50 설계서 5-2 · 언제 닫을지는 FE 결정).
 * T10도 시안에 닫기 버튼이 없어 같은 방식이다.
 */
export default function ResultBanner(props: {
  settlement: SettlementInfoResponse
  change: BusinessTypeChangeBanner
  onSeen: (requestId: number) => void
}) {
  const { settlement, change, onSeen } = props
  const acknowledgedRef = useRef<number | null>(null)

  useEffect(() => {
    // StrictMode 이중 실행 · 재조회에도 한 번만 — 서버도 멱등이지만 요청을 아낀다
    if (acknowledgedRef.current === change.requestId) return
    acknowledgedRef.current = change.requestId
    onSeen(change.requestId)
  }, [change.requestId, onSeen])

  if (change.type === "TO_BUSINESS") {
    return (
      <RequestBox
        tone="accent"
        className="mb-3.5"
        badge={<StatusBadge variant="success">승인</StatusBadge>}
        title="개인사업자로 변경되었어요 · 세금계산서는 SHOWROOMZ 앞으로 발행해요(리워드 + 부가세 10%)"
      >
        정산이 자동 확정되면 <b>정산 관리</b>에 발행 카드가 나타납니다 ·
        홈택스에서 발행한 뒤 <b>승인번호를 입력</b>하면 운영팀 확인 후
        지급됩니다 · 이 안내는 <b>한 번만</b> 보입니다.
      </RequestBox>
    )
  }

  // 상호 명의 계좌는 1차에 받지 않아(50 설계서 1-4) 서버가 「변경 필요」를 내릴 때만 계좌 문장을 붙인다
  const needsAccountChange =
    change.accountChangeRequiredOnApproval ||
    settlement.account.verification.status === "CHANGE_REQUIRED"

  return (
    <RequestBox
      tone="success"
      className="mb-3.5"
      badge={<StatusBadge variant="success">승인</StatusBadge>}
      title="비사업자로 변경되었어요"
    >
      <b>다음 정산부터</b> SHOWROOMZ가 3.3%를 원천징수한 뒤 입금합니다
      {needsAccountChange ? (
        <>
          {" "}
          · 지금 계좌는 상호 명의라 <b>본인 실명 계좌로 바꿔야 지급</b>됩니다.
        </>
      ) : (
        "."
      )}
    </RequestBox>
  )
}
