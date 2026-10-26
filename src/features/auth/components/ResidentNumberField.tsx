import { authInputClass } from "@/common/components/Auth/authStyles"
import {
  RESIDENT_NUMBER_BACK_LENGTH,
  RESIDENT_NUMBER_FRONT_LENGTH,
} from "@/features/auth/utils/studioValidation"

export type ResidentNumberValue = { front: string; back: string }

type ResidentNumberFieldProps = {
  id?: string
  value: ResidentNumberValue
  onChange: (v: ResidentNumberValue) => void
  onBlur?: () => void
  hasError?: boolean
  disabled?: boolean
}

const digitsOnly = (raw: string) => raw.replace(/[^0-9]/g, "")

/**
 * 주민등록번호 — 온보딩 rev.3 · 비사업자 필수.
 *
 * 시안 `.rrn-only` 그대로 앞 6자리(text) – 뒤 7자리(password · 마스킹) 두 칸이고 숫자만 받는다.
 * 앞 칸에 13자리를 통째로 붙여넣으면(하이픈 포함) 두 칸으로 나눠 채운다 — 차단이 아니라 정제.
 * 브라우저 자동완성 · 저장을 막는다(고유식별정보).
 */
export function ResidentNumberField({
  id,
  value,
  onChange,
  onBlur,
  hasError,
  disabled,
}: ResidentNumberFieldProps) {
  const inputClass = authInputClass(hasError, undefined, "sm")

  return (
    <div className="flex w-full items-center gap-2">
      <input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        maxLength={RESIDENT_NUMBER_FRONT_LENGTH}
        placeholder="앞 6자리"
        value={value.front}
        onChange={e =>
          onChange({
            ...value,
            front: digitsOnly(e.target.value).slice(
              0,
              RESIDENT_NUMBER_FRONT_LENGTH
            ),
          })
        }
        onPaste={e => {
          const digits = digitsOnly(e.clipboardData.getData("text"))
          if (digits.length <= RESIDENT_NUMBER_FRONT_LENGTH) return
          e.preventDefault()
          onChange({
            front: digits.slice(0, RESIDENT_NUMBER_FRONT_LENGTH),
            back: digits.slice(
              RESIDENT_NUMBER_FRONT_LENGTH,
              RESIDENT_NUMBER_FRONT_LENGTH + RESIDENT_NUMBER_BACK_LENGTH
            ),
          })
        }}
        onBlur={onBlur}
        disabled={disabled}
        className={inputClass}
      />
      <span className="shrink-0 text-sz-n-400" aria-hidden>
        –
      </span>
      <input
        type="password"
        inputMode="numeric"
        autoComplete="new-password"
        aria-label="주민등록번호 뒤 7자리"
        maxLength={RESIDENT_NUMBER_BACK_LENGTH}
        placeholder="뒤 7자리"
        value={value.back}
        onChange={e =>
          onChange({
            ...value,
            back: digitsOnly(e.target.value).slice(
              0,
              RESIDENT_NUMBER_BACK_LENGTH
            ),
          })
        }
        onBlur={onBlur}
        disabled={disabled}
        className={inputClass}
      />
    </div>
  )
}
