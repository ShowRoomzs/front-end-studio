import { inputClass } from "@/features/showroom/components/ProfileForm/formStyles"
import { SHOWROOM_NAME_MAX_LENGTH } from "@/features/showroom/constants/params"
import { cn } from "@/lib/utils"
import { useRef } from "react"

/** 허용하지 않는 문자. 백엔드 `@Pattern ^[가-힣a-zA-Z0-9 ]+$`의 여집합 */
const DISALLOWED = /[^가-힣a-zA-Z0-9 ]/g

interface ShowroomNameInputProps {
  value: string
  onChange: (value: string) => void
  onBlur: () => void
  hasError: boolean
}

/**
 * 쇼룸명 입력 — 실시간 문자 필터 + 우측 글자수 카운터(시안 `.cnt-in`).
 *
 * ⚠️ 한글 IME 조합 중에는 필터를 걸지 않는다. 조합 중에는 "ㅅ"·"소" 같은 미완성
 * 음절이 잠시 value에 실리는데, 이때 필터를 적용하면 자모가 즉시 지워져 **한글 입력
 * 자체가 불가능해진다**. 신청 화면의 `ShowroomNameField`가 같은 이유로 같은 처리를
 * 하고 있다 — 한쪽만 고치지 말 것.
 */
export default function ShowroomNameInput(props: ShowroomNameInputProps) {
  const { value, onChange, onBlur, hasError } = props
  const isComposingRef = useRef(false)

  const sanitize = (raw: string) =>
    raw.replace(DISALLOWED, "").slice(0, SHOWROOM_NAME_MAX_LENGTH)

  return (
    <div className="relative flex w-full items-center">
      <input
        id="showroom-name"
        type="text"
        value={value}
        maxLength={SHOWROOM_NAME_MAX_LENGTH}
        placeholder="한글·영문·숫자·공백 2~20자"
        onCompositionStart={() => {
          isComposingRef.current = true
        }}
        onCompositionEnd={event => {
          isComposingRef.current = false
          onChange(sanitize(event.currentTarget.value))
        }}
        onChange={event =>
          onChange(
            isComposingRef.current
              ? event.target.value
              : sanitize(event.target.value)
          )
        }
        onBlur={onBlur}
        className={inputClass(hasError, "pr-16")}
      />
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute right-3 text-[11px] tabular-nums",
          value.length >= SHOWROOM_NAME_MAX_LENGTH
            ? "text-sz-n-700"
            : "text-sz-n-400"
        )}
      >
        {value.length} / {SHOWROOM_NAME_MAX_LENGTH}
      </span>
    </div>
  )
}
