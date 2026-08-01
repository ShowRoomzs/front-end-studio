import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { CheckIcon } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * 시안 `.cbox` — 18×18, radius 4px, border 1.5px n-300, 체크 시 n-900.
 * shadcn 기본값(16px / #5468CD)이 아니라 시안 값을 기본으로 둔다.
 */
function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer size-[18px] shrink-0 rounded-[4px] border-[1.5px] border-sz-n-300 bg-white",
        "data-[state=checked]:border-sz-n-900 data-[state=checked]:bg-sz-n-900 data-[state=checked]:text-white",
        "outline-none transition-all focus-visible:ring-[3px] focus-visible:ring-sz-n-200",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center text-current transition-none"
      >
        <CheckIcon className="size-3" strokeWidth={3} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
