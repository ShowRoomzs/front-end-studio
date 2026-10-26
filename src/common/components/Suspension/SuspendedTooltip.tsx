import { SUSPENDED_TOOLTIP } from "@/common/constants/suspension"
import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

/**
 * 시안 13 `.sztw` / `.sztip` — 정지로 막힌 버튼에 붙는 툴팁(파트너센터 15와 같은 마크업).
 *
 * 버튼은 숨기지 않고 비활성으로 둔다(숨기면 「요청이 사라졌다」로 읽힌다 · S2). 비활성 버튼은 마우스 이벤트를
 * 받지 않으므로 감싼 칸이 hover · focus 를 받아 툴팁을 띄운다. `active`가 false면 감싸지 않고 그대로 돌려준다.
 *
 * ```tsx
 * <SuspendedTooltip active={isSuspended}>
 *   <Button disabled={isSuspended}>수락</Button>
 * </SuspendedTooltip>
 * ```
 */
export default function SuspendedTooltip(props: {
  active: boolean
  children: ReactNode
  /** 레일의 전체 폭 버튼이면 `flex w-full` */
  className?: string
  message?: string
  /**
   * 툴팁 위치 — 기본은 버튼 아래 · 오른쪽 정렬(시안 `.sztip`). `top`은 아래가 잘리는 모달 하단 버튼,
   * `left`는 버튼 왼쪽(파트너 S2b 머리 버튼)
   */
  placement?: "bottom" | "top" | "left"
}) {
  const {
    active,
    children,
    className,
    message = SUSPENDED_TOOLTIP,
    placement = "bottom",
  } = props

  if (!active) {
    return <>{children}</>
  }

  return (
    <span
      tabIndex={0}
      aria-label={message}
      className={cn(
        "group/sztip relative inline-flex outline-none [&_:disabled]:pointer-events-none",
        className
      )}
    >
      {children}
      <span
        role="tooltip"
        className={cn(
          "pointer-events-none invisible absolute z-20 whitespace-nowrap rounded-[6px] bg-sz-n-900 px-2.5 py-1.5 text-[11px] font-normal leading-[1.4] text-white opacity-0 transition-opacity group-hover/sztip:visible group-hover/sztip:opacity-100 group-focus/sztip:visible group-focus/sztip:opacity-100",
          placement === "bottom" &&
            "right-0 top-[calc(100%+8px)] after:absolute after:bottom-full after:right-[18px] after:border-[5px] after:border-transparent after:border-b-sz-n-900 after:content-['']",
          placement === "top" &&
            "bottom-[calc(100%+8px)] right-0 after:absolute after:right-[18px] after:top-full after:border-[5px] after:border-transparent after:border-t-sz-n-900 after:content-['']",
          placement === "left" &&
            "right-[calc(100%+10px)] top-1/2 -translate-y-1/2"
        )}
      >
        {message}
      </span>
    </span>
  )
}
