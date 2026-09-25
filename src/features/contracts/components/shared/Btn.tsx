import {
  BTN_DANGER,
  BTN_DANGER_SOLID,
  BTN_DELETE,
  BTN_GHOST,
  BTN_LG,
  BTN_PRIMARY,
  BTN_SECONDARY,
} from "@/features/contracts/components/shared/styles"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"
import type { ButtonHTMLAttributes } from "react"

export type BtnVariant =
  "primary" | "secondary" | "ghost" | "danger" | "delete" | "dangerSolid"

const VARIANT_CLASS: Record<BtnVariant, string> = {
  primary: BTN_PRIMARY,
  secondary: BTN_SECONDARY,
  ghost: BTN_GHOST,
  danger: BTN_DANGER,
  delete: BTN_DELETE,
  dangerSolid: BTN_DANGER_SOLID,
}

interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BtnVariant
  /** 시안 `.btn-lg` — 폼 하단 액션바 */
  large?: boolean
  isLoading?: boolean
}

/** 시안 `.btn` 계열 — 이 화면(계약 관리) 전용 버튼. 공용 Button과 크기 체계가 다르다(styles.ts 참고) */
export default function Btn(props: BtnProps) {
  const {
    variant = "secondary",
    large = false,
    isLoading = false,
    className,
    children,
    disabled,
    type = "button",
    ...rest
  } = props

  return (
    <button
      type={type}
      className={cn(VARIANT_CLASS[variant], large && BTN_LG, className)}
      disabled={disabled || isLoading}
      {...rest}
    >
      {isLoading && <Loader2 className="size-3.5 animate-spin" aria-hidden />}
      {children}
    </button>
  )
}
