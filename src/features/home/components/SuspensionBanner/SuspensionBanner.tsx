import { Button } from "@/components/ui/button"
import { HOME_PATHS } from "@/features/home/constants/params"
import { useAccountStatus } from "@/features/home/hooks/useAccountStatus"
import type { MemberAccountSanction } from "@/features/home/types"
import { formatEventDateTime, formatMonthDay } from "@/features/home/utils/date"
import { cn } from "@/lib/utils"
import { Ban } from "lucide-react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"

/**
 * 「사유: 공구 게시물 허위·과장 표시 · 2026.10.08 14:20 ~ 10.22 · 10.22 자동 해제」(시안 13 · 14 H5 · 기-01 · 02 【잠정】).
 * 기간 없는 정지면 시작 시각까지만. 정지 시각은 now() 이벤트(UTC 벽시계), 종료일은 LocalDate.
 */
function periodText(sanction: MemberAccountSanction) {
  const start = formatEventDateTime(sanction.suspendedAt)
  const endsOn = sanction.term?.endsOn
  if (!endsOn) {
    return `사유: ${sanction.reasonLabel} · ${start}`
  }
  const end = formatMonthDay(endsOn)
  return `사유: ${sanction.reasonLabel} · ${start} ~ ${end} · ${end} 자동 해제`
}

/**
 * 계정 이용 정지 배너 — 시안 `.susp`(ui-studio-13 · 14 H5 공통 · 파트너 15와 같은 마크업).
 * 모든 페이지 탑바 아래 · 닫기 없음 · 위험 톤. 지급 정지 사유면 정산 줄, 상세 사유가 있을 때만 [자세히].
 *
 * 계정 상태를 직접 읽어 정지가 아니면 아무것도 그리지 않는다 — 셸(MainLayout)에 그대로 꽂을 수 있다.
 * `sanction`을 넘기면 그 값을 쓴다(홈은 홈 응답의 `account`).
 */
export default function SuspensionBanner(props: {
  sanction?: MemberAccountSanction | null
  className?: string
}) {
  const { className } = props
  const { sanction: fetched } = useAccountStatus()
  const sanction = props.sanction === undefined ? fetched : props.sanction
  const navigate = useNavigate()
  const [expanded, setExpanded] = useState(false)

  if (!sanction) {
    return null
  }

  const appeal = () =>
    navigate(
      sanction.operatorChannelThreadId != null
        ? HOME_PATHS.thread(sanction.operatorChannelThreadId)
        : "/connections"
    )

  return (
    <div
      role="alert"
      className={cn(
        "mb-4 rounded-[8px] border border-[#F0C9C9] bg-sz-danger-bg px-4 py-3 text-left text-[12px] leading-[1.6] text-sz-danger-text",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <Ban className="mt-px size-[18px] shrink-0" aria-hidden />
        <div className="min-w-0 flex-1">
          <div className="font-semibold">
            계정 이용이 정지되었습니다 ·{" "}
            <span className="font-normal opacity-85">
              {periodText(sanction)}
            </span>
          </div>
          <div className="mt-0.5 text-sz-n-700">
            진행 중인 공구는 계속 판매되고 정산도 그대로 진행됩니다. 새 연결
            수락 · 게시물 작성 · 공구 오픈은 정지 해제 후 가능합니다.
          </div>
          {sanction.payoutHeld && (
            <div className="mt-1.5 flex items-center gap-2.5 text-sz-n-700">
              정산 · 확정까지 진행되며, 내 리워드는 정지가 풀리면 다음 영업일에
              지급됩니다
              <button
                type="button"
                onClick={() => navigate(HOME_PATHS.basicInfo("settlement"))}
                className="cursor-pointer font-medium text-sz-danger-text"
              >
                정산 계좌 확인
              </button>
            </div>
          )}
          {expanded && sanction.reasonDetail && (
            <div className="mt-2 border-t border-[#F0C9C9] pt-2 text-sz-n-700">
              {sanction.reasonDetail}
            </div>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {sanction.reasonDetail && (
            <button
              type="button"
              onClick={() => setExpanded(value => !value)}
              aria-expanded={expanded}
              className="cursor-pointer whitespace-nowrap text-[11px] text-sz-danger-text underline"
            >
              {expanded ? "접기" : "자세히"}
            </button>
          )}
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={appeal}
            className="rounded-[6px] px-3.5 text-[12px] font-medium shadow-none"
          >
            운영팀에 소명하기
          </Button>
        </div>
      </div>
    </div>
  )
}
