import { useRef } from "react"

import { authInputClass } from "@/common/components/Auth/authStyles"
import { cn } from "@/lib/utils"

export const SHOWROOM_NAME_MAX_LENGTH = 20
export const SHOWROOM_NAME_MIN_LENGTH = 2

/** 허용하지 않는 문자(이모지·특수문자). 백엔드 @Pattern ^[가-힣a-zA-Z0-9 ]+$ 의 여집합. */
const DISALLOWED = /[^가-힣a-zA-Z0-9 ]/g

type ShowroomNameFieldProps = {
  id?: string
  value: string
  onChange: (v: string) => void
  onBlur?: () => void
  hasError?: boolean
  placeholder?: string
  disabled?: boolean
}

/**
 * 쇼룸명 입력 — 실시간 문자 필터 + 우측 글자 수 카운터(시안 §3).
 *
 * ⚠️ 한글 IME 조합 중에는 필터를 걸지 않는다. 조합 중에는 "ㅅ"·"소" 같은 미완성 음절이
 * 잠시 value에 실리는데, 이때 필터를 적용하면 자모가 즉시 지워져 **한글 입력 자체가
 * 불가능해진다**(파트너센터 온보딩 수취인 이름에서 실제로 났던 버그).
 * compositionend와 change의 발생 순서는 브라우저마다 달라 양쪽에서 정제한다.
 */
export function ShowroomNameField({
  id,
  value,
  onChange,
  onBlur,
  hasError,
  placeholder,
  disabled,
}: ShowroomNameFieldProps) {
  const isComposingRef = useRef(false)

  const sanitize = (raw: string) =>
    raw.replace(DISALLOWED, "").slice(0, SHOWROOM_NAME_MAX_LENGTH)

  const atLimit = value.length >= SHOWROOM_NAME_MAX_LENGTH

  return (
    <div className="relative flex w-full items-center">
      <input
        id={id}
        type="text"
        maxLength={SHOWROOM_NAME_MAX_LENGTH}
        value={value}
        onBlur={onBlur}
        onCompositionStart={() => {
          isComposingRef.current = true
        }}
        onCompositionEnd={e => {
          isComposingRef.current = false
          onChange(sanitize(e.currentTarget.value))
        }}
        onChange={e =>
          onChange(
            isComposingRef.current ? e.target.value : sanitize(e.target.value)
          )
        }
        placeholder={placeholder}
        disabled={disabled}
        className={authInputClass(hasError, "pr-14", "sm")}
      />
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute right-3 text-[11px]",
          atLimit ? "text-sz-danger-text" : "text-sz-n-400"
        )}
      >
        {value.length}/{SHOWROOM_NAME_MAX_LENGTH}
      </span>
    </div>
  )
}
