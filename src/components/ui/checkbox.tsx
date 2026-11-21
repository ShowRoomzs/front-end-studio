import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { CheckIcon } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * 디자인 시스템 `.fp-box` — 15×15, radius 4px, border 1.5px n-300, 체크 시 `--sz-auth-action`(= 시안 검정 n-900).
 * 세 웹 앱 공통 값(11-21). 시안 `.cbox`(18px · n-900)는 쓰지 않는다.
 */
function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer size-[15px] shrink-0 rounded-[4px] border-[1.5px] border-sz-n-300 bg-white",
        "data-[state=checked]:border-sz-auth-action data-[state=checked]:bg-sz-auth-action data-[state=checked]:text-white",
        "outline-none transition-all focus-visible:ring-[3px] focus-visible:ring-sz-accent-50",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center text-current transition-none"
      >
        <CheckIcon className="size-[9px]" strokeWidth={3} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
