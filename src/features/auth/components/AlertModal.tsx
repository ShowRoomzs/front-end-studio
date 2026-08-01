import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

/**
 * 시안 `.overlay` + `.modal-alert` — 360px, radius 8px, shadow-popover, padding 24/20/20.
 *
 * 로그인 상태 B·C·D와 신청 Step1의 연령 미충족은 전부 별도 페이지가 아니라
 * 기본 화면 위에 얹히는 오버레이다(기능요구사항 §7-1). 라우팅을 만들지 말 것.
 *
 * 모달 버튼 높이는 40px이다 — 신청 폼의 `.btn`(44px)과 다르므로 authButtonClass를 쓰지 않는다.
 */

type AlertModalProps = {
  tone: "info" | "danger" | "neutral"
  icon: ReactNode
  title: string
  children: ReactNode
  actions: ReactNode
}

const TONE_CLASS = {
  info: "bg-sz-info-bg text-sz-info-text",
  danger: "bg-sz-danger-bg text-sz-danger-text",
  neutral: "bg-sz-n-100 text-sz-n-600",
} as const

export function AlertModal({
  tone,
  icon,
  title,
  children,
  actions,
}: AlertModalProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(26,27,31,0.4)] px-4"
    >
      <div
        className="w-[360px] max-w-full rounded-[8px] bg-white px-5 pt-6 pb-5 text-center"
        style={{ boxShadow: "var(--sz-shadow-popover)" }}
      >
        <div
          className={cn(
            "mx-auto mb-3.5 flex h-11 w-11 items-center justify-center rounded-full text-[20px]",
            TONE_CLASS[tone]
          )}
        >
          {icon}
        </div>
        <div className="mb-2 text-[16px] font-semibold text-sz-n-900">
          {title}
        </div>
        <div className="mb-5 text-[12px] leading-[1.7] text-sz-n-600">
          {children}
        </div>
        <div className="flex justify-center gap-2">{actions}</div>
      </div>
    </div>
  )
}

/** 시안 모달 전용 `.btn` — 40px */
export function ModalButton({
  variant,
  onClick,
  wide,
  children,
}: {
  variant: "primary" | "line"
  onClick: () => void
  /** 버튼이 1개일 때 시안은 flex:none + padding 0 32px */
  wide?: boolean
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-10 cursor-pointer items-center justify-center rounded-[6px] border text-[13px] font-medium transition-colors",
        wide ? "flex-none px-8" : "flex-1",
        variant === "primary"
          ? "border-sz-auth-action bg-sz-auth-action text-white hover:border-sz-auth-action-hover hover:bg-sz-auth-action-hover"
          : "border-sz-n-300 bg-white text-sz-n-700 hover:bg-sz-n-100"
      )}
    >
      {children}
    </button>
  )
}

/* ── 시안에서 그대로 가져온 라인 아이콘 (§7: 이모지 금지) ── */

export const ClockIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden>
    <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.6" />
    <path
      d="M12 8v4.3l3 1.9"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export const EmptyInboxIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden>
    <path
      d="M4 13h4.2l1.5 2.2h4.6L15.8 13H20"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M5.8 5.6A1 1 0 0 1 6.77 5h10.46a1 1 0 0 1 .97.6L20 12.6V18a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-5.4l1.8-7Z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
  </svg>
)
