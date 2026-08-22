import { Button } from "@/components/ui/button"
import type {
  AppealResponse,
  SuspensionResponse,
} from "@/features/posts/services/postService"
import {
  formatDateTime,
  formatRemainingDays,
} from "@/features/posts/utils/format"

/**
 * 운영자 조치 고지 (§24-5).
 *
 * **알리지 않고 사라지는 경우는 없다** — 사유 · 근거 규정 · 조치 시각 · 처리자 · 기한을
 * 화면에 그대로 남긴다. 심사 중에는 같은 자리를 정보색 배너가 대신한다. 대기는 정보색이지만
 * 카드 배지는 여전히 노출 중지다 — 사실이 바뀐 게 아니다.
 */
export default function AlertBanner(props: {
  suspension: SuspensionResponse
  appeal: AppealResponse | null
  onAppeal: () => void
}) {
  const { suspension, appeal, onAppeal } = props
  const isUnderReview = appeal?.status === "PENDING"

  if (isUnderReview) {
    return (
      <div className="mb-4 flex items-start gap-[11px] rounded-[6px] border border-sz-accent-100 bg-sz-accent-50 px-3.5 py-[13px]">
        <span className="mt-px flex size-[18px] shrink-0 items-center justify-center rounded-full bg-sz-accent-500 text-[11px] font-bold text-white">
          i
        </span>
        <div className="flex-1 text-[12px] leading-[1.7] text-sz-n-700">
          <b className="text-sz-n-900">이의 신청이 접수되었습니다.</b> 운영자가
          다시 확인하는 동안 게시물은 계속 노출되지 않습니다.
          <div className="mt-[5px] text-[11px] text-sz-n-500">
            신청 {formatDateTime(appeal.submittedAt)} · 사유{" "}
            <em className="font-medium text-sz-danger-text not-italic">
              {suspension.reasonLabel}
            </em>
            에 대한 이의
          </div>
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-[10px] bg-sz-info-bg px-2.5 py-[3px] text-[11px] font-medium text-sz-info-text">
            심사 중
            {appeal.expectedReviewBusinessDays !== null && (
              <>
                {" "}
                · 보통 {appeal.expectedReviewBusinessDays}영업일 이내 결과 통지
              </>
            )}
          </div>
          <div className="mt-[5px] text-[11px] text-sz-n-500">
            받아들여지면 좋아요 · 인사이트를 유지한 채 다시 노출되고, 반려되면{" "}
            <b className="text-sz-n-900">영구 삭제</b>됩니다.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mb-4 flex items-start gap-[11px] rounded-[6px] border border-sz-danger-text bg-[#FFFAFA] px-3.5 py-[13px]">
      <span className="mt-px flex size-[18px] shrink-0 items-center justify-center rounded-full bg-sz-danger-text text-[11px] font-bold text-white">
        !
      </span>
      <div className="flex-1 text-[12px] leading-[1.7] text-sz-n-700">
        <b className="text-sz-n-900">이 게시물의 노출이 중지되었습니다.</b>{" "}
        소비자 쇼룸에서 보이지 않습니다.
        <div className="mt-[5px] text-[11px] text-sz-n-500">
          사유{" "}
          <em className="font-medium text-sz-danger-text not-italic">
            {suspension.reasonLabel}
            {suspension.policyRef && ` (${suspension.policyRef})`}
          </em>{" "}
          · 조치 {formatDateTime(suspension.suspendedAt)} · 알림 발송됨
        </div>
        {suspension.reasonDetail && (
          <div className="mt-[5px] text-[11px] text-sz-n-600">
            {suspension.reasonDetail}
          </div>
        )}
        <div className="mt-2 inline-flex items-center gap-1.5 rounded-[10px] bg-sz-danger-bg px-2.5 py-[3px] text-[11px] font-medium text-sz-danger-text">
          이의 신청 {formatDateTime(suspension.appealDeadline)}까지 ·{" "}
          {formatRemainingDays(suspension.appealDeadline)}
        </div>
        <div className="mt-[5px] text-[11px] text-sz-n-500">
          기한 안에 신청하지 않거나 신청이 반려되면{" "}
          <b className="text-sz-n-900">영구 삭제</b>됩니다. 신청이 받아들여지면
          좋아요 · 인사이트를 유지한 채 다시 노출됩니다.
        </div>
      </div>

      {/* 신청은 게시물당 1회다 — 서버가 `appealable`로 판정해 내려준다 */}
      {suspension.appealable && (
        <Button type="button" size="sm" className="shrink-0" onClick={onAppeal}>
          이의 신청
        </Button>
      )}
    </div>
  )
}
