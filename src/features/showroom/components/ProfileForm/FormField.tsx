import type { ReactNode } from "react"

/** 시안 `.field` — 라벨 + 입력 + (힌트 | 에러) 한 벌 */
export function Field(props: {
  label: string
  htmlFor?: string
  required?: boolean
  children: ReactNode
  /** 필드 아래 회색 설명. 에러가 있으면 에러가 이 자리를 대신한다 */
  hint?: ReactNode
  /**
   * 에러 문구 — 이 화면에서 문구를 쓰는 건 **중복 · 형식 · 파일** 세 가지뿐이다.
   * 필수 미입력에는 붙이지 말 것(저장 버튼 비활성으로 이미 말하고 있다).
   */
  error?: string | null
}) {
  const { label, htmlFor, required, children, hint, error } = props

  return (
    <div className="mb-3.5 last:mb-0">
      <label
        htmlFor={htmlFor}
        className="mb-[5px] block text-[12px] font-medium text-sz-n-600"
      >
        {label}
        {required && <span className="text-sz-danger-text"> *</span>}
      </label>
      {children}
      {error ? (
        <p className="mt-[5px] text-[11px] font-medium text-sz-danger-text">
          {error}
        </p>
      ) : (
        hint && (
          <p className="mt-[5px] text-[11px] leading-[1.7] text-sz-n-500">
            {hint}
          </p>
        )
      )}
    </div>
  )
}
