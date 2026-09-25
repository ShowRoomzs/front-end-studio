import type {
  StepChip,
  StepTone,
} from "@/features/contracts/utils/contractView"
import { cn } from "@/lib/utils"
import { Fragment } from "react"

const TONE_CLASS: Record<StepTone, string> = {
  todo: "border-sz-n-200 bg-white text-sz-n-400",
  done: "border-sz-n-200 bg-sz-n-100 text-sz-n-600",
  cur: "border-sz-accent-500 bg-sz-accent-50 font-semibold text-sz-accent-600",
  // 종결 칩은 상태 배지와 같은 색 축 — 거절만 위험, 만료·취소는 중립(rev.2)
  stop: "border-[#E9C9C9] bg-sz-danger-bg font-semibold text-sz-danger-text",
  halt: "border-sz-n-300 bg-sz-n-100 font-semibold text-sz-n-600",
}

const WHO_CLASS: Record<StepTone, string> = {
  todo: "text-sz-n-400",
  done: "text-sz-n-500",
  cur: "text-sz-accent-600",
  stop: "text-sz-danger-text",
  halt: "text-sz-n-500",
}

/** 시안 `.steps` — 진행 단계 칩. 상태값을 쪼개지 않는 대신 누가 어디까지 했는지를 여기서 보인다 */
export default function Stepper(props: { steps: Array<StepChip> }) {
  const { steps } = props

  return (
    <div className="flex flex-wrap items-center gap-[3px]">
      {steps.map((step, index) => (
        <Fragment key={`${step.label}-${index}`}>
          {index > 0 && <span className="text-[11px] text-sz-n-300">›</span>}
          <span
            className={cn(
              "rounded-[6px] border px-2.5 py-1.5 text-[11px] leading-[1.35]",
              TONE_CLASS[step.tone]
            )}
          >
            {step.label}
            <span
              className={cn(
                "mt-px block text-[10px] font-normal tabular-nums",
                WHO_CLASS[step.tone]
              )}
            >
              {step.who}
            </span>
          </span>
        </Fragment>
      ))}
    </div>
  )
}
