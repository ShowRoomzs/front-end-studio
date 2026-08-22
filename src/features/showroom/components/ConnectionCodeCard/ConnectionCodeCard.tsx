import ReissueConfirmModal from "@/features/showroom/components/ConnectionCodeCard/ReissueConfirmModal"
import {
  CardSection,
  NoteBox,
  ShowroomCard,
} from "@/features/showroom/components/ShowroomCard/ShowroomCard"
import { useReissueConnectionCode } from "@/features/showroom/hooks/useShowroomQueries"
import { useState } from "react"
import toast from "react-hot-toast"

const CODE_BUTTON_CLASS =
  "inline-flex h-7 items-center rounded-[6px] border border-sz-n-300 bg-white px-2.5 text-[11px] font-medium text-sz-n-900 hover:enabled:bg-sz-n-100 disabled:cursor-not-allowed disabled:border-sz-n-200 disabled:bg-sz-n-100 disabled:text-sz-n-400"

/**
 * 연결코드 카드 — 코드값 + 복사·재발급 + 안내 2줄.
 *
 * 코드는 프로필 응답에서 온다(`/connections/code`를 따로 부르지 않는다).
 * 재발급 성공 시 프로필 캐시를 무효화하면 이 카드가 새 코드로 다시 그려진다.
 */
export default function ConnectionCodeCard(props: { connectionCode: string }) {
  const { connectionCode } = props
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)

  const { mutateAsync: reissue, isPending } = useReissueConnectionCode()

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(connectionCode)
      toast.success("연결코드를 복사했습니다.")
    } catch {
      toast.error("복사하지 못했습니다. 코드를 직접 선택해 복사해 주세요.")
    }
  }

  const handleReissue = async () => {
    if (isPending) {
      return
    }

    try {
      await reissue()
      setIsConfirmOpen(false)
      toast.success("연결코드를 재발급했습니다. 이전 코드는 무효가 됩니다.")
    } catch {
      // 모달은 닫지 않는다 — 재시도가 가능해야 한다
    }
  }

  return (
    <>
      <ShowroomCard title="연결코드">
        <CardSection>
          <div className="rounded-[8px] border border-sz-accent-100 bg-sz-accent-50 p-[18px] text-center">
            <div className="text-[26px] font-semibold tracking-[3px] tabular-nums text-sz-accent-600">
              {connectionCode}
            </div>
            <div className="mb-3.5 mt-0.5 text-[11px] text-sz-n-500">
              내 쇼룸 연결코드
            </div>
            <div className="flex justify-center gap-2">
              <button
                type="button"
                onClick={() => void handleCopy()}
                className={CODE_BUTTON_CLASS}
              >
                복사
              </button>
              <button
                type="button"
                onClick={() => setIsConfirmOpen(true)}
                disabled={isPending}
                className={CODE_BUTTON_CLASS}
              >
                재발급
              </button>
            </div>
          </div>

          <NoteBox className="mt-3">
            브랜드가 연결 요청 시 이 코드를 입력하면{" "}
            <b className="text-sz-n-900">정확히 내 쇼룸으로</b> 요청이
            도착합니다.
          </NoteBox>
          <NoteBox className="mt-3">
            재발급하면 <b className="text-sz-n-900">이전 코드는 즉시 무효</b>가
            됩니다. 이미 연결된 브랜드와의 연결은 그대로 유지됩니다.
          </NoteBox>
        </CardSection>
      </ShowroomCard>

      {isConfirmOpen && (
        <ReissueConfirmModal
          connectionCode={connectionCode}
          isSubmitting={isPending}
          onCancel={() => setIsConfirmOpen(false)}
          onConfirm={() => void handleReissue()}
        />
      )}
    </>
  )
}
