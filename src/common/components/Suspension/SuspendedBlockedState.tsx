import { suspendedFeatureTitle } from "@/common/constants/suspension"
import { Button } from "@/components/ui/button"
import { useAccountStatus } from "@/features/home/hooks/useAccountStatus"
import { appealPath } from "@/features/home/utils/navigation"
import { Ban } from "lucide-react"
import type { ReactNode } from "react"
import { useNavigate } from "react-router-dom"

/**
 * 정지로 막힌 작성 화면에 URL로 직접 들어왔을 때의 빈 상태(시안 13 S5 · 파트너 15 S2b와 같은 규격).
 * 「계정 이용 정지 중에는 {기능}을 이용할 수 없습니다」 + [목록으로] + [운영팀에 소명하기].
 */
export default function SuspendedBlockedState(props: {
  /** 「게시물 작성」 */
  feature: string
  description: ReactNode
  backLabel: string
  onBack: () => void
}) {
  const { feature, description, backLabel, onBack } = props
  const { sanction } = useAccountStatus()
  const navigate = useNavigate()

  return (
    <div className="rounded-[8px] border border-sz-n-200 bg-white">
      <div className="flex flex-col items-center px-6 py-[72px] text-center">
        <Ban className="mb-2.5 size-7 text-sz-n-300" aria-hidden />
        <div className="mb-1 text-[13px] font-semibold text-sz-n-700">
          {suspendedFeatureTitle(feature)}
        </div>
        <div className="text-[12px] leading-[1.7] text-sz-n-500">
          {description}
        </div>
        <div className="mt-3.5 flex justify-center gap-2">
          <Button type="button" size="sm" variant="outline" onClick={onBack}>
            {backLabel}
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => navigate(appealPath(sanction))}
          >
            운영팀에 소명하기
          </Button>
        </div>
      </div>
    </div>
  )
}
