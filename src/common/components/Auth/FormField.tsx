import type { ReactNode } from "react"

type FormFieldProps = {
  /** 문자열 외에 필수(*)·선택 표기를 섞은 노드도 받는다 */
  label: ReactNode
  htmlFor?: string
  /** RHF 등에서 온 에러 메시지 (시안 `.err-msg`) */
  error?: string
  /** blur/조작 전에는 에러를 감추기 위해 호출부가 제어 (기본 true) */
  showError?: boolean
  /** 컨트롤 아래 도움말 (시안 `.help`) */
  help?: string
  children: ReactNode
}

// 시안 `.field` — label + 컨트롤 + 도움말/인라인 에러 1세트.
export function FormField({
  label,
  htmlFor,
  error,
  showError = true,
  help,
  children,
}: FormFieldProps) {
  const visible = showError && !!error
  return (
    <div className="mb-4">
      <label
        htmlFor={htmlFor}
        className="mb-1.5 block text-[12px] font-medium text-sz-n-600"
      >
        {label}
      </label>
      <div className="relative flex items-center">{children}</div>
      {help && !visible && (
        <p className="mt-1.5 text-[11px] text-sz-n-500">{help}</p>
      )}
      {visible && (
        <p role="alert" className="mt-1.5 text-[12px] text-sz-danger-text">
          {error}
        </p>
      )}
    </div>
  )
}

/** 시안 `.lb .req` */
export const RequiredMark = () => (
  <span className="ml-0.5 text-sz-danger-text">*</span>
)
