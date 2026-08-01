import { authInputClass } from "@/common/components/Auth/authStyles"

type NumberFieldProps = {
  id?: string
  value: string
  onChange: (v: string) => void
  onBlur?: () => void
  hasError?: boolean
  placeholder?: string
  disabled?: boolean
  /** 우측 단위 표기 (예: "명") */
  suffix?: string
}

/**
 * 팔로워 수 등 숫자 전용 필드.
 *
 * §7-2: `type="number"` + `min="0"`만으로는 음수를 못 막는다("-3000"은 제약을 어겨도
 * 문자열 자체는 입력됨). 부호·지수 키 입력과 비숫자 붙여넣기를 직접 차단하고,
 * 브라우저 기본 스피너도 숨긴다.
 */
export function NumberField({
  id,
  value,
  onChange,
  onBlur,
  hasError,
  placeholder,
  disabled,
  suffix,
}: NumberFieldProps) {
  return (
    <div className="relative flex w-full items-center">
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min={0}
        value={value}
        onChange={e => onChange(e.target.value)}
        onBlur={onBlur}
        onKeyDown={e => {
          if (["-", "+", "e", "E"].includes(e.key)) {
            e.preventDefault()
          }
        }}
        onPaste={e => {
          const text = e.clipboardData.getData("text")
          if (/[^0-9]/.test(text)) {
            e.preventDefault()
          }
        }}
        onWheel={e => {
          // 스크롤로 값이 바뀌는 사고 방지
          e.currentTarget.blur()
        }}
        placeholder={placeholder}
        disabled={disabled}
        className={authInputClass(
          hasError,
          `[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${
            suffix ? "pr-9" : ""
          }`
        )}
      />
      {suffix && (
        <span className="pointer-events-none absolute right-3 text-[12px] text-sz-n-500">
          {suffix}
        </span>
      )}
    </div>
  )
}
