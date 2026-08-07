import { authInputClass } from "@/common/components/Auth/authStyles"

export const ACCOUNT_NUMBER_MAX_LENGTH = 16

type AcctNumberFieldProps = {
  id?: string
  value: string
  onChange: (v: string) => void
  onBlur?: () => void
  hasError?: boolean
  placeholder?: string
  disabled?: boolean
}

/**
 * 계좌번호 전용 필드 — 하이픈 없이 숫자만, 10~16자리.
 *
 * ⚠️ 파트너센터 가입은 **하이픈 포함**으로 받는다. 두 필드를 같은 유효성 함수로 묶지 말 것
 * (시안 §4-3). 정산 API가 숫자만 요구해서 이 화면은 파싱 단계가 없는 쪽으로 확정됐다.
 *
 * 붙여넣기는 **차단이 아니라 정제**다 — 통장에서 `110-123-456789`를 그대로 복사해 와도
 * 하이픈만 걷어내고 받아들인다(차단하면 사용자가 원인을 모른 채 막힌다).
 */
export function AcctNumberField({
  id,
  value,
  onChange,
  onBlur,
  hasError,
  placeholder,
  disabled,
}: AcctNumberFieldProps) {
  const sanitize = (raw: string) =>
    raw.replace(/[^0-9]/g, "").slice(0, ACCOUNT_NUMBER_MAX_LENGTH)

  return (
    <input
      id={id}
      // type="number"를 쓰지 않는다 — 앞자리 0이 사라지고 스피너·지수표기 문제가 붙는다.
      type="text"
      inputMode="numeric"
      maxLength={ACCOUNT_NUMBER_MAX_LENGTH}
      value={value}
      onChange={e => onChange(sanitize(e.target.value))}
      onBlur={onBlur}
      onPaste={e => {
        e.preventDefault()
        const text = e.clipboardData.getData("text")
        onChange(sanitize(text))
      }}
      placeholder={placeholder}
      disabled={disabled}
      className={authInputClass(hasError, undefined, "sm")}
    />
  )
}
