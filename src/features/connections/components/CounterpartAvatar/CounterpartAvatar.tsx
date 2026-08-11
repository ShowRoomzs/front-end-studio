import { cn } from "@/lib/utils"

interface CounterpartAvatarProps {
  name: string
  imageUrl?: string | null
  /** 운영자 채널은 프로필 이미지가 없고 "SZ" 이니셜을 액센트색으로 채운다 */
  isOperator?: boolean
  className?: string
}

/** 시안 `.cs-avatar` — 기본 38px, 쓰이는 자리마다 className으로 크기만 덮어쓴다 */
export default function CounterpartAvatar(props: CounterpartAvatarProps) {
  const { name, imageUrl, isOperator = false, className } = props

  if (isOperator) {
    return (
      <div
        className={cn(
          "flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-sz-accent-500 text-[11px] font-bold text-white",
          className
        )}
      >
        SZ
      </div>
    )
  }

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name}
        className={cn(
          "h-[38px] w-[38px] shrink-0 rounded-full object-cover",
          className
        )}
      />
    )
  }

  return (
    <div
      className={cn(
        "flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-sz-n-200 text-[13px] font-semibold text-sz-n-500",
        className
      )}
    >
      {name.slice(0, 1)}
    </div>
  )
}
