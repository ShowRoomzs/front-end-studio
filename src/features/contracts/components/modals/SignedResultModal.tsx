import { ModalShell } from "@/common/components/ModalShell/ModalShell"
import { formatDateTimeShort } from "@/common/utils/formatDate"
import Btn from "@/features/contracts/components/shared/Btn"
import type { CreatorContractSignature } from "@/features/contracts/types"
import { formatMonthDay } from "@/features/contracts/utils/format"
import { cn } from "@/lib/utils"

interface SignedResultModalProps {
  signature: CreatorContractSignature
  onClose: () => void
}

/**
 * 시안 S11 — 내 서명 완료(체결 아님). 서명은 이 화면 밖(전자서명 링크)에서 일어나므로
 * 서버가 띄우는 것이 아니라 상세를 다시 조회하다 내 서명이 반영된 순간 FE가 한 번 띄운다.
 * 제목이 「체결되었습니다」가 아니라 「서명이 완료되었습니다」이고, 체크리스트에 발급·체결 항목을 담지 않는다.
 */
export default function SignedResultModal(props: SignedResultModalProps) {
  const { signature, onClose } = props
  const brandDone = signature.brandSignedAt !== null

  const steps: Array<{
    label: string
    status: string
    done: boolean
    n: number
  }> = [
    {
      n: 1,
      label: "내 서명 완료",
      status: formatDateTimeShort(signature.creatorSignedAt),
      done: true,
    },
    {
      n: 2,
      label: "브랜드 서명",
      status: brandDone
        ? formatDateTimeShort(signature.brandSignedAt)
        : `대기 · 기한 ${formatMonthDay(signature.deadlineAt)}`,
      done: brandDone,
    },
    {
      n: 3,
      label: "운영자 체결 완료 처리",
      status: "서명 완료 후",
      done: false,
    },
    {
      n: 4,
      label: "PDF · 감사추적인증서 발급 · 공구 생성",
      status: "체결 시",
      done: false,
    },
  ]

  return (
    <ModalShell
      isOpen
      title="서명 완료"
      width={480}
      onClose={onClose}
      bodyClassName="p-5 text-[12px] leading-[1.7] text-sz-n-700"
      footer={
        <Btn variant="primary" onClick={onClose}>
          확인
        </Btn>
      }
    >
      <div className="pb-4 pt-1 text-center">
        <div className="mx-auto mb-2.5 flex h-[38px] w-[38px] items-center justify-center rounded-full bg-sz-success-bg text-[18px] font-bold text-sz-success-text">
          ✓
        </div>
        <div className="mb-1.5 text-[13px] font-semibold text-sz-n-900">
          서명이 완료되었습니다
        </div>
        <div className="text-[12px] leading-[1.75] text-sz-n-600">
          <b className="font-semibold text-sz-n-900">
            아직 계약이 체결된 것은 아닙니다.
          </b>
          <br />
          브랜드 서명과 운영자 체결 처리가 끝나야 계약이 성립합니다.
        </div>
      </div>

      <div className="overflow-hidden rounded-[6px] border border-sz-n-200">
        {steps.map(step => (
          <div
            key={step.n}
            className="flex items-center gap-[9px] border-b border-sz-n-100 px-[13px] py-[11px] text-[12px] last:border-b-0"
          >
            <span
              className={cn(
                "flex h-[17px] w-[17px] shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                step.done
                  ? "bg-sz-success-bg text-sz-success-text"
                  : "bg-sz-n-200 text-sz-n-500"
              )}
            >
              {step.done ? "✓" : step.n}
            </span>
            <span className={step.done ? "text-sz-n-900" : "text-sz-n-700"}>
              {step.label}
            </span>
            <span className="ml-auto text-[11px] tabular-nums text-sz-n-500">
              {step.status}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-2.5 text-[11px] leading-[1.6] text-sz-n-500">
        서명한 뒤에는{" "}
        <b className="font-semibold text-sz-n-700">
          거절하거나 되돌릴 수 없습니다
        </b>
        . 위 3~4단계가 끝나면 알림을 받고, 그때부터 공구 게시물을 작성할 수
        있습니다 —{" "}
        <b className="font-semibold text-sz-n-700">
          지금 준비 일정을 확정하지 마세요
        </b>
        .
      </div>
    </ModalShell>
  )
}
