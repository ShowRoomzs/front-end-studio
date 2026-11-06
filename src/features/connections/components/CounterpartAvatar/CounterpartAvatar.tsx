import { cn } from "@/lib/utils"
import { useState } from "react"

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
  const [failedUrl, setFailedUrl] = useState<string | null>(null)

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

  // 주소가 있어도 못 불러오면(도메인 정지 · 삭제된 파일) 이니셜로 돌아간다
  if (imageUrl && failedUrl !== imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name}
        onError={() => setFailedUrl(imageUrl)}
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
