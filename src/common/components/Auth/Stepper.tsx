import { cn } from "@/lib/utils"

type StepperProps = {
  steps: string[]
  /** 현재 진행 중 단계(0-based). 이보다 앞 단계는 done. */
  current: number
}

/**
 * 시안 `.stepper` — 원형 배지 **아래** 라벨, 각 단계가 `flex:1`로 균등 분할되고
 * 배지 중심(top:13px)을 잇는 연결선이 이전 단계에서 넘어온다.
 *
 * 연결선은 시안이 `.st::before`로 그리지만, 상태별 색을 다루기 쉽도록 실제 엘리먼트로 옮겼다
 * (기하학적 위치는 동일: left:-50%, width:100%).
 */
export function Stepper({ steps, current }: StepperProps) {
  return (
    <div className="mb-6 flex items-start">
      {steps.map((label, i) => {
        const state = i < current ? "done" : i === current ? "active" : "todo"
        return (
          <div key={label} className="relative flex-1 text-center">
            {i > 0 && (
              <div
                aria-hidden
                className={cn(
                  "absolute top-[13px] left-[-50%] z-0 h-px w-full",
                  state === "done" ? "bg-sz-success-text" : "bg-sz-n-300"
                )}
              />
            )}
            <div
              className={cn(
                "relative z-[1] mx-auto mb-1.5 flex h-[26px] w-[26px] items-center justify-center",
                "rounded-full border text-[12px] font-semibold",
                state === "done" &&
                  "border-sz-success-text bg-sz-success-text text-white",
                state === "active" && "border-sz-n-900 bg-sz-n-900 text-white",
                state === "todo" && "border-sz-n-300 bg-sz-n-100 text-sz-n-500"
              )}
            >
              {state === "done" ? "✓" : i + 1}
            </div>
            <div
              className={cn(
                "text-[11px] font-medium",
                state === "todo" ? "text-sz-n-500" : "text-sz-n-900"
              )}
            >
              {label}
            </div>
          </div>
        )
      })}
    </div>
  )
}
