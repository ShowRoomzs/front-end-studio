import { Checkbox } from "@/components/ui/checkbox"

export type Term = {
  key: string
  label: string
  /** false면 `(선택)` 회색 표기. 기본 true. */
  required?: boolean
  /** "보기" 클릭 시 약관 원문 노출 */
  onView?: () => void
  /** 약관 원문(임시 문안) — onView 모달에 표시 */
  content?: string
}

/** 동의 항목이 아니라 고지(보기)만 하는 행 — 개인정보처리방침이 여기 해당한다. */
export type TermNotice = {
  key: string
  label: string
  onView?: () => void
  /** 약관 원문(임시 문안) — onView 모달에 표시 */
  content?: string
}

type TermsAgreementProps = {
  terms: Term[]
  /** 체크박스 없는 고지 행 (시안 `.terms-notice`) */
  notices?: TermNotice[]
  checked: Record<string, boolean>
  onChange: (next: Record<string, boolean>) => void
}

/**
 * 시안 `.terms-box` — 전체동의 + 약관 리스트(필수/선택) + 고지 행.
 *
 * 필수 약관 미동의 시 **에러 문구를 노출하지 않는다** — 버튼 비활성만으로 표현하는 것이
 * 확정 원칙이다(기능요구사항 §8-3, 파트너센터 §4-5와 동일).
 */
export function TermsAgreement({
  terms,
  notices,
  checked,
  onChange,
}: TermsAgreementProps) {
  const allChecked = terms.length > 0 && terms.every(t => checked[t.key])

  const toggleAll = () => {
    const next: Record<string, boolean> = {}
    terms.forEach(t => {
      next[t.key] = !allChecked
    })
    onChange(next)
  }
  const toggleOne = (key: string) =>
    onChange({ ...checked, [key]: !checked[key] })

  return (
    <div className="overflow-hidden rounded-[6px] border border-sz-n-200">
      {/* 시안 `.terms-all` — 보더 없이 n-50 배경만으로 구분한다 */}
      <div className="flex items-center gap-2.5 bg-sz-n-50 px-4 py-3.5">
        <Checkbox checked={allChecked} onCheckedChange={toggleAll} />
        <span
          className="cursor-pointer text-[13px] font-semibold text-sz-n-900"
          onClick={toggleAll}
        >
          이용 약관에 모두 동의합니다.
        </span>
      </div>

      {terms.map(t => {
        const required = t.required !== false
        return (
          <div
            key={t.key}
            className="flex items-center justify-between border-b border-sz-n-100 px-4 py-3 last:border-b-0"
          >
            <div className="flex items-center gap-2.5">
              <Checkbox
                checked={!!checked[t.key]}
                onCheckedChange={() => toggleOne(t.key)}
              />
              <span
                className="cursor-pointer text-[13px] text-sz-n-900"
                onClick={() => toggleOne(t.key)}
              >
                {t.label}
                <span
                  className={
                    required
                      ? "ml-1 text-[11px] text-sz-danger-text"
                      : "ml-1 text-[11px] text-sz-n-400"
                  }
                >
                  {required ? "(필수)" : "(선택)"}
                </span>
              </span>
            </div>
            {t.onView && <ViewButton onClick={t.onView} />}
          </div>
        )
      })}

      {notices?.map(n => (
        <div
          key={n.key}
          className="flex items-center justify-between bg-sz-n-50 px-4 py-3"
        >
          <span className="text-[13px] text-sz-n-900">
            {n.label}
            <span className="ml-1 text-[11px] text-sz-n-400">(고지)</span>
          </span>
          {n.onView && <ViewButton onClick={n.onView} />}
        </div>
      ))}
    </div>
  )
}

function ViewButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-[12px] whitespace-nowrap text-sz-n-500 hover:text-sz-n-700"
    >
      보기 ›
    </button>
  )
}
